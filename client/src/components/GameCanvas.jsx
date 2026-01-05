import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import MobileControls from './MobileControls';
import BuildHotbar, { buildItems } from './BuildHotbar';
import EmoteMenu from './EmoteMenu';

const TILE_SIZE = 32;

const GameCanvas = ({ onSocketConnected, onPlayersUpdate, onMyIdSet, isMobile = false, playerData = null }) => {
    const canvasRef = useRef(null);
    const socketRef = useRef(null);
    const playersRef = useRef({});
    const mapRef = useRef([]);
    const myIdRef = useRef(null);
    const interactablesRef = useRef([]);
    const resourceNodesRef = useRef([]);

    // UI State
    const [interactionText, setInteractionText] = React.useState(null);
    const [currentQuest, setCurrentQuest] = React.useState(null);
    const [coins, setCoins] = React.useState(0);
    const [inventory, setInventory] = React.useState([]);
    const [buildMode, setBuildMode] = React.useState(false);
    const [selectedBuildItem, setSelectedBuildItem] = React.useState(null);
    const [zoomLevel, setZoomLevel] = React.useState(2.0);
    const [showEmoteMenu, setShowEmoteMenu] = React.useState(false);

    // Refs for Render Loop
    const zoomLevelRef = useRef(2.0);
    const imagesRef = useRef({});
    const buildModeRef = useRef(false);
    const selectedBuildItemRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const cameraRef = useRef({ x: 0, y: 0 });
    const mobileDirectionRef = useRef(null);
    const lastTapRef = useRef(0);
    const miningEndTimeRef = useRef(0); // Tracks when mining animation ends

    // Sync Refs
    useEffect(() => {
        zoomLevelRef.current = zoomLevel;
        buildModeRef.current = buildMode;
        selectedBuildItemRef.current = selectedBuildItem;
    }, [zoomLevel, buildMode, selectedBuildItem]);

    // Main Game Loop & Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // --- Asset Loading ---
        const processGreenScreen = (img) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0);
            const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Green key filter
                if (g > 150 && r < 100 && b < 100) {
                    data[i + 3] = 0;
                }
            }
            tCtx.putImageData(imageData, 0, 0);
            return tempCanvas;
        };

        const assetSources = {
            grass: '/assets/tile_grass.png',
            water: '/assets/tile_water.png',
            dirt: '/assets/tile_dirt.png',
            tree: '/assets/obj_tree.png',
            rock: '/assets/obj_rock.png',
            fence: '/assets/build_fence.png',
            wall: '/assets/build_wall.png',
            floor: '/assets/build_floor.png',

            // Pixel Crawler - Character Run Animations (6 frames, 64x64 each)
            male_run_down: '/assets/char_male_run_down.png',
            male_run_up: '/assets/char_male_run_up.png',
            male_run_side: '/assets/char_male_run_side.png',
            female_run: '/assets/char_female_run.png',

            // Pixel Crawler - Character Idle Animations (4 frames, 64x64 each)
            male_idle_down: '/assets/char_idle_down.png',
            male_idle_up: '/assets/char_idle_up.png',
            male_idle_side: '/assets/char_idle_side.png',

            // Pixel Crawler - Character Mining Animations (8 frames, 64x64 each)
            male_mine_down: '/assets/char_mine_down.png',
            male_mine_up: '/assets/char_mine_up.png',
            male_mine_side: '/assets/char_mine_side.png',

            // Pixel Crawler - Environment Sheets
            tree_sheet: '/assets/tree_sheet.png',
            rock_sheet: '/assets/rock_sheet.png',
            vegetation_sheet: '/assets/vegetation_sheet.png',
            floors_tileset: '/assets/floors_tileset.png',

            // Buildings and Structures
            building_walls: '/assets/building_walls.png',
            building_roofs: '/assets/building_roofs.png',
            bonfire: '/assets/bonfire.png',
            farm_props: '/assets/farm_props.png',
            furniture: '/assets/furniture.png',
        };

        imagesRef.current = {};
        Object.entries(assetSources).forEach(([key, src]) => {
            const image = new Image();
            image.onload = () => {
                // Apply Green Screen ONLY to generated nature assets logic
                // For chars, we assume transparency is correct in Pixel Crawler pack
                if (['tree', 'rock', 'fence', 'wall', 'floor'].includes(key)) {
                    imagesRef.current[key] = processGreenScreen(image);
                } else {
                    imagesRef.current[key] = image;
                }
            };
            image.src = src;
        });

        // --- Socket Setup ---
        const socket = io('http://localhost:3000');
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected:', socket.id);
            myIdRef.current = socket.id;
            if (onMyIdSet) onMyIdSet(socket.id);
            if (onSocketConnected) onSocketConnected(socket);
            if (playerData) socket.emit('playerJoin', playerData);

            // Sync if players already loaded
            if (playersRef.current[socket.id]) {
                setInventory(playersRef.current[socket.id].inventory || []);
                setCoins(playersRef.current[socket.id].coins || 0);
            }
        });

        socket.on('currentPlayers', (players) => {
            playersRef.current = players;
            if (onPlayersUpdate) onPlayersUpdate({ ...players });
            if (myIdRef.current && players[myIdRef.current]) {
                setInventory(players[myIdRef.current].inventory || []);
                setCoins(players[myIdRef.current].coins || 0);
            }
        });
        socket.on('newPlayer', (player) => {
            playersRef.current[player.playerId] = player;
            if (onPlayersUpdate) onPlayersUpdate({ ...playersRef.current });
        });
        socket.on('playerDisconnected', (id) => delete playersRef.current[id]);
        socket.on('playerMoved', (player) => {
            if (playersRef.current[player.playerId]) {
                Object.assign(playersRef.current[player.playerId], player);
            } else {
                playersRef.current[player.playerId] = player;
                if (onPlayersUpdate) onPlayersUpdate({ ...playersRef.current });
            }
        });
        socket.on('mapData', (map) => { mapRef.current = map; });
        socket.on('resourceNodes', (nodes) => { resourceNodesRef.current = nodes; });
        socket.on('interactables', (items) => { interactablesRef.current = items; });

        // Gameplay Events
        socket.on('miningResult', (result) => {
            if (result.success) {
                // Trigger mining animation for 800ms
                miningEndTimeRef.current = Date.now() + 800;
                setInteractionText(result.depleted ? `+${result.amount} ${result.item}!` : `Mining... ${result.healthRemaining}`);
                if (result.inventory) setInventory(result.inventory);
                setTimeout(() => setInteractionText(null), 1500);
            }
        });
        socket.on('resourceDepleted', (data) => {
            const node = resourceNodesRef.current.find(n => n.id === data.id);
            if (node) node.health = 0;
        });
        socket.on('resourceHit', (data) => {
            const node = resourceNodesRef.current.find(n => n.id === data.id);
            if (node) node.health = data.health;
        });
        socket.on('resourceRespawned', (data) => {
            const node = resourceNodesRef.current.find(n => n.id === data.id);
            if (node) node.health = data.health;
        });
        socket.on('blockPlaced', (data) => {
            if (mapRef.current[data.y]) mapRef.current[data.y][data.x] = data.tileType;
        });
        socket.on('blockPlaceResult', (result) => {
            if (result.success) {
                setInventory(result.inventory);
                setInteractionText(`Built ${result.itemName}!`);
                setTimeout(() => setInteractionText(null), 1500);
            }
        });
        socket.on('playerEmote', (data) => {
            if (playersRef.current[data.playerId]) {
                playersRef.current[data.playerId].activeEmote = data.emoteId;
                playersRef.current[data.playerId].emoteEndTime = data.emoteEndTime;
            }
        });

        // --- Input Handling ---
        const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

        const handleKeyDown = (e) => {
            if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
            if (e.key === 'v' || e.key === 'V') setShowEmoteMenu(prev => !prev);

            // Zoom Keys (100% = 2.0x base, range 50%-200%)
            if (e.key === '-' || e.key === '_') setZoomLevel(z => Math.max(z - 0.2, 1.0));
            if (e.key === '=' || e.key === '+') setZoomLevel(z => Math.min(z + 0.2, 4.0));

            // Interaction 'E'
            if (e.key === 'e' || e.key === 'E') {
                if (!myIdRef.current) return;
                const me = playersRef.current[myIdRef.current];
                if (!me) return;

                // Prioritize resources
                let closest = null, minDist = 50; // Close range mining
                resourceNodesRef.current.forEach(node => {
                    if (node.health <= 0) return;
                    const d = Math.hypot(node.x - me.x, node.y - me.y);
                    if (d < minDist) { closest = node; minDist = d; }
                });

                if (closest) {
                    socket.emit('mineResource', closest.id);
                } else {
                    socket.emit('playerInteract');
                }
            }
        };

        const handleKeyUp = (e) => {
            if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // --- Game Loop ---
        const MOVEMENT_SPEED = 5;

        const updateMovement = () => {
            if (!myIdRef.current || !playersRef.current[myIdRef.current]) return;
            const me = playersRef.current[myIdRef.current];
            let dx = 0, dy = 0;

            if (keys.w || keys.ArrowUp || mobileDirectionRef.current === 'up') dy -= 1;
            if (keys.s || keys.ArrowDown || mobileDirectionRef.current === 'down') dy += 1;
            if (keys.a || keys.ArrowLeft || mobileDirectionRef.current === 'left') dx -= 1;
            if (keys.d || keys.ArrowRight || mobileDirectionRef.current === 'right') dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                dx = (dx / len) * MOVEMENT_SPEED;
                dy = (dy / len) * MOVEMENT_SPEED;
                me.x += dx;
                me.y += dy;

                // 8-way Direction Calculation (0-7)
                // 0: Down, 1: DownRight, 2: Right, ...
                let dir = me.direction;
                if (dy > 0 && dx === 0) dir = 0; // Down
                else if (dy > 0 && dx > 0) dir = 1; // Down-Right
                else if (dy === 0 && dx > 0) dir = 2; // Right
                else if (dy < 0 && dx > 0) dir = 3; // Up-Right
                else if (dy < 0 && dx === 0) dir = 4; // Up
                else if (dy < 0 && dx < 0) dir = 5; // Up-Left
                else if (dy === 0 && dx < 0) dir = 6; // Left
                else if (dy > 0 && dx < 0) dir = 7; // Down-Left

                me.direction = dir;
                me.isMoving = true;
                socket.emit('playerMovement', { x: me.x, y: me.y, direction: dir, isMoving: true });
            } else if (me.isMoving) {
                me.isMoving = false;
                socket.emit('playerMovement', { x: me.x, y: me.y, direction: me.direction, isMoving: false });
            }
        };

        const render = () => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            updateMovement();

            // Clear
            ctx.fillStyle = '#0a0b1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Camera
            const zoom = zoomLevelRef.current;
            let camX = 0, camY = 0;
            if (myIdRef.current && playersRef.current[myIdRef.current]) {
                const me = playersRef.current[myIdRef.current];
                camX = me.x - (canvas.width / zoom) / 2;
                camY = me.y - (canvas.height / zoom) / 2;
            }
            cameraRef.current = { x: camX, y: camY };

            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(-camX, -camY);

            // Draw Map
            const map = mapRef.current;
            if (map && map.length > 0) {
                // Optimization: visible range
                const startCol = Math.floor(camX / TILE_SIZE);
                const endCol = startCol + (canvas.width / zoom) / TILE_SIZE + 1;
                const startRow = Math.floor(camY / TILE_SIZE);
                const endRow = startRow + (canvas.height / zoom) / TILE_SIZE + 1;

                map.forEach((row, y) => {
                    if (y < startRow || y > endRow) return;
                    row.forEach((tile, x) => {
                        if (x < startCol || x > endCol) return;
                        let img = null;
                        if (tile === 1 && imagesRef.current.water) img = imagesRef.current.water;
                        else if (tile === 2 && imagesRef.current.tree) { /* Special */ }
                        else if (tile === 3 && imagesRef.current.dirt) img = imagesRef.current.dirt;
                        else if ((tile === 7 || tile === 0) && imagesRef.current.grass) img = imagesRef.current.grass;
                        else if (tile === 9 && imagesRef.current.floor) img = imagesRef.current.floor;

                        const tx = x * TILE_SIZE;
                        const ty = y * TILE_SIZE;

                        // Draw base
                        if (imagesRef.current.grass) ctx.drawImage(imagesRef.current.grass, tx, ty, TILE_SIZE, TILE_SIZE);
                        if (img && img !== imagesRef.current.grass) ctx.drawImage(img, tx, ty, TILE_SIZE, TILE_SIZE);

                        // Overlay objects (drawn larger than tiles for depth/visual appeal)
                        if (tile === 2) {
                            // Tree tile - use tree sheet or fallback
                            if (imagesRef.current.tree_sheet) {
                                ctx.drawImage(imagesRef.current.tree_sheet, 0, 0, 48, 64, tx - 8, ty - 32, 48, 64);
                            } else if (imagesRef.current.tree) {
                                ctx.drawImage(imagesRef.current.tree, tx - 8, ty - 32, 48, 64);
                            }
                        }
                        if (tile === 6) {
                            // Rock tile - use rock sheet (skip header at y=80)
                            if (imagesRef.current.rock_sheet) {
                                ctx.drawImage(imagesRef.current.rock_sheet, 16, 80, 48, 48, tx - 8, ty - 16, 48, 48);
                            } else if (imagesRef.current.rock) {
                                ctx.drawImage(imagesRef.current.rock, tx - 8, ty - 16, 48, 48);
                            }
                        }
                        if (tile === 7 && imagesRef.current.wall) ctx.drawImage(imagesRef.current.wall, tx, ty, 32, 32);
                        if (tile === 8 && imagesRef.current.fence) ctx.drawImage(imagesRef.current.fence, tx, ty, 32, 32);
                        // Bonfire (animated would be nice, but static for now)
                        if (tile === 11 && imagesRef.current.bonfire) {
                            // Bonfire sheet is 64x384 (6 frames vertically, 64x64 each)
                            const frame = Math.floor(Date.now() / 150) % 6;
                            ctx.drawImage(imagesRef.current.bonfire, 0, frame * 64, 64, 64, tx - 16, ty - 32, 64, 64);
                        }
                    });
                });
            }

            // Draw Resources
            resourceNodesRef.current.forEach(node => {
                if (node.health <= 0) return;

                // Draw larger, more visible resources
                if (node.resourceType === 'rock' && imagesRef.current.rock_sheet) {
                    // Rock sheet has header/palette at top - skip first ~80px, use rock at row 2 (y=80)
                    // Each rock is about 48x48, first clean rock starts at x=16, y=80
                    ctx.drawImage(imagesRef.current.rock_sheet, 16, 80, 48, 48, node.x - 8, node.y - 16, 48, 48);
                } else if (node.resourceType === 'rock' && imagesRef.current.rock) {
                    ctx.drawImage(imagesRef.current.rock, node.x - 8, node.y - 16, 48, 48);
                } else if (node.resourceType === 'tree' && imagesRef.current.tree_sheet) {
                    // Tree sheet - first tree variant
                    ctx.drawImage(imagesRef.current.tree_sheet, 0, 0, 48, 64, node.x - 8, node.y - 32, 48, 64);
                } else if (node.resourceType === 'tree' && imagesRef.current.tree) {
                    ctx.drawImage(imagesRef.current.tree, node.x - 8, node.y - 32, 48, 64);
                } else {
                    ctx.fillStyle = 'gray';
                    ctx.fillRect(node.x, node.y, 32, 32);
                }

                // Health bar (positioned above sprite) - always show when damaged
                const barY = node.resourceType === 'tree' ? node.y - 38 : node.y - 22;
                const pct = node.health / node.maxHealth;
                // Always draw bar background, fill based on health
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(node.x - 8, barY, 48, 6);
                ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#ef4444';
                ctx.fillRect(node.x - 8, barY, 48 * pct, 6);

                // Interaction prompt
                if (myIdRef.current && playersRef.current[myIdRef.current]) {
                    const d = Math.hypot(playersRef.current[myIdRef.current].x - node.x, playersRef.current[myIdRef.current].y - node.y);
                    if (d < 50) {
                        ctx.fillStyle = 'white';
                        ctx.textAlign = 'center';
                        ctx.font = 'bold 14px sans-serif';
                        ctx.fillText('E', node.x + 16, barY - 4);
                    }
                }
            });

            // Draw Players
            Object.values(playersRef.current).sort((a, b) => a.y - b.y).forEach(p => {
                let img = null;
                let flip = false;
                let frameCount = 6; // Default for run

                // Select sprite based on movement state and direction
                const isMoving = p.isMoving;
                const dir = p.direction || 0;
                const isLocalPlayer = p.playerId === myIdRef.current;
                const isMining = isLocalPlayer && Date.now() < miningEndTimeRef.current;

                if (isMining) {
                    // Mining animation (8 frames)
                    frameCount = 8;
                    if (dir === 0 || dir === 1 || dir === 7) {
                        img = imagesRef.current.male_mine_down;
                        if (dir === 7) flip = true;
                    } else if (dir === 4 || dir === 3 || dir === 5) {
                        img = imagesRef.current.male_mine_up;
                        if (dir === 5) flip = true;
                    } else if (dir === 2) {
                        img = imagesRef.current.male_mine_side;
                    } else if (dir === 6) {
                        img = imagesRef.current.male_mine_side;
                        flip = true;
                    }
                } else if (isMoving) {
                    // Running animation (6 frames)
                    frameCount = 6;
                    if (dir === 0 || dir === 1 || dir === 7) {
                        img = imagesRef.current.male_run_down;
                        if (dir === 7) flip = true;
                    } else if (dir === 4 || dir === 3 || dir === 5) {
                        img = imagesRef.current.male_run_up;
                        if (dir === 5) flip = true;
                    } else if (dir === 2) {
                        img = imagesRef.current.male_run_side;
                    } else if (dir === 6) {
                        img = imagesRef.current.male_run_side;
                        flip = true;
                    }
                } else {
                    // Idle animation (4 frames)
                    frameCount = 4;
                    if (dir === 0 || dir === 1 || dir === 7) {
                        img = imagesRef.current.male_idle_down;
                        if (dir === 7) flip = true;
                    } else if (dir === 4 || dir === 3 || dir === 5) {
                        img = imagesRef.current.male_idle_up;
                        if (dir === 5) flip = true;
                    } else if (dir === 2) {
                        img = imagesRef.current.male_idle_side;
                    } else if (dir === 6) {
                        img = imagesRef.current.male_idle_side;
                        flip = true;
                    }
                }

                if (img) {
                    const frameW = img.width / frameCount;
                    const frameH = img.height;
                    const animSpeed = isMining ? 100 : (isMoving ? 100 : 200); // Fast for mining/run, slow for idle
                    const frame = Math.floor(Date.now() / animSpeed) % frameCount;

                    ctx.save();
                    if (flip) {
                        ctx.translate(p.x + 16, p.y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(img, frame * frameW, 0, frameW, frameH, -32, -32, 64, 64);
                    } else {
                        ctx.drawImage(img, frame * frameW, 0, frameW, frameH, p.x - 16, p.y - 32, 64, 64);
                    }
                    ctx.restore();
                } else {
                    // Fallback to colored square
                    ctx.fillStyle = p.color || 'blue';
                    ctx.fillRect(p.x, p.y, 32, 32);
                }

                // Emote
                if (p.activeEmote && (!p.emoteEndTime || p.emoteEndTime > Date.now())) {
                    ctx.font = '20px serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(p.activeEmote === 'heart' ? '❤️' : p.activeEmote === 'laugh' ? '😂' : '👋', p.x + 16, p.y - 10);
                }

                // Name
                ctx.fillStyle = 'white';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(p.name || 'Player', p.x + 16, p.y - 20);
            });

            // Build Ghost
            if (buildModeRef.current) {
                const mx = (mouseRef.current.x / zoom) + camX;
                const my = (mouseRef.current.y / zoom) + camY;
                const tx = Math.floor(mx / TILE_SIZE) * TILE_SIZE;
                const ty = Math.floor(my / TILE_SIZE) * TILE_SIZE;
                ctx.strokeStyle = selectedBuildItemRef.current ? 'rgba(0, 255, 0, 0.8)' : 'white';
                ctx.lineWidth = 2; // Make it thicker
                ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.lineWidth = 1; // Reset
            }

            ctx.restore();
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            socket.disconnect();
        };
    }, []);

    const handleCanvasClick = (e) => {
        if (buildMode) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const worldX = (x / zoomLevel) + cameraRef.current.x;
            const worldY = (y / zoomLevel) + cameraRef.current.y;
            const tx = Math.floor(worldX / TILE_SIZE);
            const ty = Math.floor(worldY / TILE_SIZE);
            if (selectedBuildItem) socketRef.current.emit('placeBlock', { x: tx, y: ty, itemId: selectedBuildItem });
        }
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                onMouseMove={(e) => {
                    const rect = canvasRef.current.getBoundingClientRect();
                    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                }}
                onClick={handleCanvasClick}
                style={{ display: 'block', touchAction: 'none' }}
            />

            {/* HUD Container */}
            <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>

                {currentQuest && (
                    <div style={{
                        background: 'rgba(0,0,0,0.7)',
                        padding: '12px',
                        borderRadius: '8px',
                        borderLeft: '4px solid #4ade80',
                        color: 'white',
                        maxWidth: '250px'
                    }}>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#aaa', marginBottom: '4px' }}>Current Quest</div>
                        <div style={{ fontWeight: 'bold' }}>{currentQuest.title}</div>
                        <div style={{ fontSize: '14px', marginTop: '2px' }}>{currentQuest.description}</div>
                    </div>
                )}
                {interactionText && <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                    textShadow: '0 2px 4px black'
                }}>{interactionText}</div>}
            </div>

            {/* Coins UI - Top Right */}
            <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(0,0,0,0.6)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '2px solid #ffd700',
                color: '#ffd700',
                fontWeight: 'bold',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                pointerEvents: 'none'
            }}>
                <span>🪙</span>
                <span>{coins}</span>
            </div>

            {/* Resource Inventory - Top Right (Next to Coins) */}
            <div style={{
                position: 'absolute',
                top: 70, // Below coins
                right: 20,
                background: 'rgba(0,0,0,0.5)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                gap: '12px',
                color: 'white',
                fontSize: '14px',
                border: '1px solid #555',
                pointerEvents: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🪵</span>
                    <span>{inventory.find(i => i.item === 'wood')?.amount || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🪨</span>
                    <span>{inventory.find(i => i.item === 'stone')?.amount || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⛓️</span>
                    <span>{inventory.find(i => i.item === 'iron')?.amount || 0}</span>
                </div>
            </div>

            {/* Zoom Controls with Percentage (100% = 2.0x base zoom) */}
            <div style={{ position: 'absolute', bottom: 20, right: 160, display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => setZoomLevel(z => Math.max(z - 0.2, 1.0))} style={zoomBtnStyle}>-</button>
                <span style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    minWidth: '50px',
                    textAlign: 'center'
                }}>{Math.round((zoomLevel / 2.0) * 100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(z + 0.2, 4.0))} style={zoomBtnStyle}>+</button>
            </div>
            <BuildHotbar
                buildMode={buildMode}
                onToggleBuildMode={() => setBuildMode(!buildMode)}
                selectedItem={selectedBuildItem}
                onSelectItem={setSelectedBuildItem}
                coins={coins}
                inventory={inventory}
            />
            <EmoteMenu
                isOpen={showEmoteMenu}
                onClose={() => setShowEmoteMenu(false)}
                onSelect={(emote) => socketRef.current.emit('playerEmote', emote)}
            />
            {isMobile && <MobileControls onDirectionChange={d => mobileDirectionRef.current = d} onInteract={() => socketRef.current.emit('playerInteract')} />}
        </div >
    );
};

const zoomBtnStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
};

export default GameCanvas;
