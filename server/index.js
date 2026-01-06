const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { generateMap, TILE_SIZE } = require('./map');
const interactables = require('./interactables');
const resourceNodesConfig = require('./resourceNodes');
const { getQuest, getStarterQuest } = require('./quests');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Game State
const players = {};
const gameMap = generateMap();

// Live resource node state (copy from config with mutable health)
const resourceNodes = resourceNodesConfig.map(node => ({ ...node }));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Initialize player with defaults (will be updated by playerJoin)
  players[socket.id] = {
    x: 480,
    y: 480,
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    playerId: socket.id,
    name: 'Adventurer', // Default name
    characterType: 'male', // Default character type
    quest: null, // Current active quest
    questProgress: {}, // Track objectives
    coins: 0, // Currency
    inventory: [
      { item: 'wood', amount: 100 },
      { item: 'stone', amount: 100 },
      { item: 'iron', amount: 20 }
    ] // Items
  };

  // Send current players and map to new player
  socket.emit('currentPlayers', players);
  socket.emit('mapData', gameMap);
  socket.emit('interactables', interactables);
  socket.emit('resourceNodes', resourceNodes);

  // Notify others of new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle player join data (name, character type)
  socket.on('playerJoin', (data) => {
    if (data && data.name) {
      players[socket.id].name = data.name.slice(0, 15); // Limit name length
    }
    if (data && data.characterType) {
      players[socket.id].characterType = data.characterType;
    }
    console.log(`Player ${socket.id} joined as ${players[socket.id].name} (${players[socket.id].characterType})`);
    // Broadcast updated player info
    io.emit('playerUpdated', players[socket.id]);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
        const p = players[socket.id];
        
        // Collision Detection - check center tile
        const gridX = Math.floor(movementData.x / TILE_SIZE);
        const gridY = Math.floor(movementData.y / TILE_SIZE);
        
        let validMove = true;
        // Check bounds
        if (gridY >= 0 && gridY < gameMap.length && gridX >= 0 && gridX < gameMap[0].length) {
            const tile = gameMap[gridY][gridX];
            // Walkable tiles: 0 (grass), 3 (dirt/path) - everything else blocks movement
            const walkableTiles = [0, 3];
            if (!walkableTiles.includes(tile)) {
                validMove = false;
            }
        } else {
            validMove = false;
        }

        if (validMove) {
             players[socket.id].x = movementData.x;
             players[socket.id].y = movementData.y;
             players[socket.id].direction = movementData.direction || 'down'; 
             players[socket.id].isMoving = movementData.isMoving || false;
             
             // Broadcast to all OTHER players
             socket.broadcast.emit('playerMoved', players[socket.id]);
        } else {
            // Rubberband: send correct pos back to client
            socket.emit('playerMoved', players[socket.id]); 
        }
    }
  });

  socket.on('chatMessage', (msg) => {
      if (players[socket.id]) {
          const messageData = {
              id: Date.now().toString(),
              playerId: socket.id,
              text: msg.text,
              timestamp: Date.now()
          };
          // Broadcast to all including sender
          io.emit('chatMessage', messageData);
      }
  });

  socket.on('updateColor', (color) => {
      if (players[socket.id]) {
          players[socket.id].color = color;
          io.emit('playerMoved', players[socket.id]); // Broadcast update using move event for now
      }
  });

  socket.on('playerInteract', () => {
      if (!players[socket.id]) return;
      const p = players[socket.id];
      
      // Find closest interactable
      let closest = null;
      let minDist = 60; // Interaction range

      interactables.forEach(obj => {
          const dx = obj.x - p.x;
          const dy = obj.y - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < minDist) {
              closest = obj;
              minDist = dist;
          }
      });

      if (closest) {
          console.log(`Player ${socket.id} interacted with ${closest.id}`);
          
          let responseText = closest.type === 'sign' ? closest.details : closest.text;
          let questUpdate = null;

          // Quest logic for NPC
          if (closest.type === 'npc' && closest.id === 'npc_guide') {
              // Check if player has no quest - assign starter quest
              if (!p.quest) {
                  p.quest = getStarterQuest();
                  p.questProgress = {};
                  responseText = "Welcome, adventurer! I have a task for you. Go read the village sign to learn about our home, then return to me.";
                  questUpdate = { quest: p.quest, progress: p.questProgress };
              } else if (p.quest.id === 'talk_to_elder') {
                  // Check if quest objective is complete
                  if (p.questProgress['obj_explore']) {
                      // Quest complete! Grant reward
                      const reward = 10;
                      p.coins += reward;
                      responseText = `Excellent! You have explored the village. Here are ${reward} coins as your reward. (Quest Complete!)`;
                      p.quest = null;
                      p.questProgress = {};
                      questUpdate = { quest: null, progress: {}, completed: 'talk_to_elder', coins: p.coins };
                  } else {
                      responseText = "Have you visited the village sign yet? Go read it and come back.";
                  }
              }
          }
          
          // Track sign interaction for quest
          if (closest.type === 'sign' && closest.id === 'sign_welcome' && p.quest && p.quest.id === 'talk_to_elder') {
              if (!p.questProgress['obj_explore']) {
                  p.questProgress['obj_explore'] = true;
                  questUpdate = { quest: p.quest, progress: p.questProgress };
              }
          }

          socket.emit('interactionResult', {
              id: closest.id,
              type: closest.type,
              text: responseText,
              name: closest.name,
              questUpdate: questUpdate
          });
      }
  });

  // Handle resource mining/harvesting
  socket.on('mineResource', (nodeId) => {
      if (!players[socket.id]) return;
      const player = players[socket.id];
      
      // Find the resource node
      const node = resourceNodes.find(n => n.id === nodeId);
      if (!node) return;
      
      // Check if player is close enough
      const dx = node.x - player.x;
      const dy = node.y - player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 50) {
          socket.emit('miningResult', { success: false, message: 'Too far away!' });
          return;
      }
      
      // Check if node is depleted
      if (node.health <= 0) {
          socket.emit('miningResult', { success: false, message: 'Already depleted!' });
          return;
      }
      
      // Reduce health
      node.health -= 1;
      
      // Check if depleted
      if (node.health <= 0) {
          // Give resources to player
          const existingItem = player.inventory.find(i => i.item === node.yield.item);
          if (existingItem) {
              existingItem.amount += node.yield.amount;
          } else {
              player.inventory.push({ item: node.yield.item, amount: node.yield.amount });
          }
          
          // Notify player of success
          socket.emit('miningResult', { 
              success: true, 
              depleted: true,
              item: node.yield.item, 
              amount: node.yield.amount,
              inventory: player.inventory
          });
          
          // Broadcast node depletion to all players
          io.emit('resourceDepleted', { id: node.id });
          
          // Schedule respawn
          setTimeout(() => {
              node.health = node.maxHealth;
              io.emit('resourceRespawned', { id: node.id, health: node.health });
          }, node.respawnTime);
      } else {
          // Just a hit, not depleted yet
          socket.emit('miningResult', { 
              success: true, 
              depleted: false,
              healthRemaining: node.health
          });
          io.emit('resourceHit', { id: node.id, health: node.health });
      }
  });

  // Handle tile mining (Minecraft-style - mine any tile except dirt/water)
  socket.on('mineTile', (data) => {
      if (!players[socket.id]) return;
      const player = players[socket.id];
      const { x, y } = data;
      
      // Check bounds
      if (y < 0 || y >= gameMap.length || x < 0 || x >= gameMap[0].length) {
          socket.emit('miningResult', { success: false, message: 'Out of bounds!' });
          return;
      }
      
      // Check distance (must be within 2 tiles)
      const tileCenterX = x * TILE_SIZE + TILE_SIZE / 2;
      const tileCenterY = y * TILE_SIZE + TILE_SIZE / 2;
      const dist = Math.sqrt(Math.pow(player.x - tileCenterX, 2) + Math.pow(player.y - tileCenterY, 2));
      if (dist > TILE_SIZE * 2.5) {
          socket.emit('miningResult', { success: false, message: 'Too far away!' });
          return;
      }
      
      const tile = gameMap[y][x];
      
      // Cannot mine dirt (3) or water (1) - these are base/unmovable
      if (tile === 3 || tile === 1) {
          socket.emit('miningResult', { success: false, message: 'Cannot mine this!' });
          return;
      }
      
      // Determine what resource to give based on tile type
      let yieldItem = null;
      let yieldAmount = 1;
      switch (tile) {
          case 0: // Grass
              yieldItem = null; // No drop from grass
              break;
          case 2: // Tree
              yieldItem = 'wood';
              yieldAmount = 3;
              break;
          case 4: // Flowers
              yieldItem = null;
              break;
          case 5: // Bush
              yieldItem = 'wood';
              yieldAmount = 1;
              break;
          case 6: // Rock
              yieldItem = 'stone';
              yieldAmount = 3;
              break;
          case 7: // Stone Wall
              yieldItem = 'stone';
              yieldAmount = 3;
              break;
          case 8: // Fence
              yieldItem = 'wood';
              yieldAmount = 2;
              break;
          case 9: // Wood Floor
              yieldItem = 'wood';
              yieldAmount = 1;
              break;
          case 10: // House Wall
              yieldItem = 'stone';
              yieldAmount = 2;
              break;
          case 11: // Bonfire
              yieldItem = 'wood';
              yieldAmount = 2;
              break;
          default:
              yieldItem = null;
      }
      
      // Give resources if any
      if (yieldItem) {
          const existingItem = player.inventory.find(i => i.item === yieldItem);
          if (existingItem) {
              existingItem.amount += yieldAmount;
          } else {
              player.inventory.push({ item: yieldItem, amount: yieldAmount });
          }
      }
      
      // Change tile to dirt
      gameMap[y][x] = 3;
      
      // Notify player
      socket.emit('miningResult', {
          success: true,
          depleted: true,
          item: yieldItem,
          amount: yieldAmount,
          inventory: player.inventory
      });
      
      // Broadcast tile change to all players
      io.emit('tileChanged', { x, y, tileType: 3 });
  });

  // Handle block placement
  socket.on('placeBlock', (data) => {
      if (!players[socket.id]) return;
      const player = players[socket.id];
      
      const { x, y, itemId } = data;
      
      // Build items config (must match client)
      const buildItems = {
          'stone_wall': { name: 'Stone Wall', cost: { stone: 5 }, tileType: 7 },
          'wood_fence': { name: 'Wood Fence', cost: { wood: 3 }, tileType: 8 },
          'wood_floor': { name: 'Wood Floor', cost: { wood: 2 }, tileType: 9 }
      };
      
      const item = buildItems[itemId];
      if (!item) {
          socket.emit('blockPlaceResult', { success: false, message: 'Invalid item!' });
          return;
      }
      
      // Check bounds
      if (y < 0 || y >= gameMap.length || x < 0 || x >= gameMap[0].length) {
          socket.emit('blockPlaceResult', { success: false, message: 'Out of bounds!' });
          return;
      }
      
      // Check if tile is empty (grass only)
      const currentTile = gameMap[y][x];
      if (currentTile !== 0 && currentTile !== 3 && currentTile !== 4 && currentTile !== 5) {
          socket.emit('blockPlaceResult', { success: false, message: 'Cannot build here!' });
          return;
      }
      
      // Check if player can afford
      const canAfford = Object.entries(item.cost).every(([resource, amount]) => {
          const invItem = player.inventory.find(i => i.item === resource);
          return invItem && invItem.amount >= amount;
      });
      
      if (!canAfford) {
          socket.emit('blockPlaceResult', { success: false, message: 'Not enough resources!' });
          return;
      }
      
      // Deduct resources
      Object.entries(item.cost).forEach(([resource, amount]) => {
          const invItem = player.inventory.find(i => i.item === resource);
          if (invItem) {
              invItem.amount -= amount;
              if (invItem.amount <= 0) {
                  player.inventory = player.inventory.filter(i => i.item !== resource);
              }
          }
      });
      
      // Update map
      gameMap[y][x] = item.tileType;
      
      // Notify all players
      io.emit('blockPlaced', { x, y, tileType: item.tileType });
      
      // Send success to placer
      socket.emit('blockPlaceResult', { 
          success: true, 
          itemName: item.name,
          inventory: player.inventory
      });
      
      console.log(`Player ${player.name} placed ${item.name} at (${x}, ${y})`);
  });

  // Handle player emote
  socket.on('playerEmote', (emoteId) => {
      if (players[socket.id]) {
          players[socket.id].activeEmote = emoteId;
          players[socket.id].emoteEndTime = Date.now() + 5000; // 5 seconds
          // Broadcast to all
          io.emit('playerEmote', { playerId: socket.id, emoteId, emoteEndTime: players[socket.id].emoteEndTime });
      }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
