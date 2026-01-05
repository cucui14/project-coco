// Resource nodes that can be mined/harvested
// Each node has health (hits to break), yield (items given), and respawn time

const resourceNodes = [
    // Rocks for mining stone
    { 
        id: 'rock_1', 
        x: 600, 
        y: 400, 
        type: 'resource',
        resourceType: 'rock',
        name: 'Stone Deposit',
        text: 'A rocky outcrop. (Press E to mine)',
        health: 3, // Hits to break
        maxHealth: 3,
        yield: { item: 'stone', amount: 5 },
        respawnTime: 30000 // 30 seconds
    },
    { 
        id: 'rock_2', 
        x: 350, 
        y: 550, 
        type: 'resource',
        resourceType: 'rock',
        name: 'Stone Deposit',
        text: 'A rocky outcrop. (Press E to mine)',
        health: 3,
        maxHealth: 3,
        yield: { item: 'stone', amount: 5 },
        respawnTime: 30000
    },
    { 
        id: 'rock_3', 
        x: 700, 
        y: 600, 
        type: 'resource',
        resourceType: 'rock',
        name: 'Iron Vein',
        text: 'Ore glints in the rock. (Press E to mine)',
        health: 5,
        maxHealth: 5,
        yield: { item: 'iron', amount: 3 },
        respawnTime: 60000 // 1 minute
    },
    // Trees for chopping wood
    { 
        id: 'tree_1', 
        x: 250, 
        y: 380, 
        type: 'resource',
        resourceType: 'tree',
        name: 'Oak Tree',
        text: 'A sturdy oak. (Press E to chop)',
        health: 4,
        maxHealth: 4,
        yield: { item: 'wood', amount: 4 },
        respawnTime: 45000
    },
    { 
        id: 'tree_2', 
        x: 650, 
        y: 300, 
        type: 'resource',
        resourceType: 'tree',
        name: 'Pine Tree',
        text: 'A tall pine. (Press E to chop)',
        health: 3,
        maxHealth: 3,
        yield: { item: 'wood', amount: 3 },
        respawnTime: 40000
    },
    { 
        id: 'tree_3', 
        x: 400, 
        y: 650, 
        type: 'resource',
        resourceType: 'tree',
        name: 'Oak Tree',
        text: 'A sturdy oak. (Press E to chop)',
        health: 4,
        maxHealth: 4,
        yield: { item: 'wood', amount: 4 },
        respawnTime: 45000
    }
];

module.exports = resourceNodes;
