const TILE_SIZE = 32;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 80;

// Tile Types:
// 0 = Grass
// 1 = Water
// 2 = Tree/Wall (solid)
// 3 = Path/Dirt
// 4 = Flowers (decorative, walkable)
// 5 = Bush (decorative, walkable)
// 6 = Rock (solid)
// 7 = Stone Wall (buildable)
// 8 = Fence (buildable)
// 9 = Wood Floor (buildable)
// 10 = House Wall (solid)
// 11 = Bonfire (interactable decoration)

function generateMap() {
    const map = [];
    
    // Initialize with grass
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            row.push(0);
        }
        map.push(row);
    }

    // Add border walls (trees)
    for (let x = 0; x < MAP_WIDTH; x++) {
        map[0][x] = 2;
        map[MAP_HEIGHT - 1][x] = 2;
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y][0] = 2;
        map[y][MAP_WIDTH - 1] = 2;
    }

    // Generate 3-5 water lakes
    const numLakes = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numLakes; i++) {
        const lakeX = 8 + Math.floor(Math.random() * (MAP_WIDTH - 20));
        const lakeY = 8 + Math.floor(Math.random() * (MAP_HEIGHT - 20));
        const lakeSize = 4 + Math.floor(Math.random() * 5);
        
        // Create circular-ish lake
        for (let dy = -lakeSize; dy <= lakeSize; dy++) {
            for (let dx = -lakeSize; dx <= lakeSize; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < lakeSize && lakeX + dx > 1 && lakeX + dx < MAP_WIDTH - 2 &&
                    lakeY + dy > 1 && lakeY + dy < MAP_HEIGHT - 2) {
                    map[lakeY + dy][lakeX + dx] = 1;
                }
            }
        }
    }

    // Generate dirt paths (horizontal and vertical)
    // Main horizontal road
    const roadY = 20 + Math.floor(Math.random() * 20);
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (map[roadY][x] !== 1) map[roadY][x] = 3;
        if (map[roadY + 1][x] !== 1) map[roadY + 1][x] = 3;
    }
    // Main vertical road
    const roadX = 20 + Math.floor(Math.random() * 20);
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        if (map[y][roadX] !== 1) map[y][roadX] = 3;
        if (map[y][roadX + 1] !== 1) map[y][roadX + 1] = 3;
    }

    // === VILLAGE AREA (spawn zone) ===
    const villageX = 15;
    const villageY = 15;
    
    // Village plaza (dirt floor)
    for (let y = villageY; y < villageY + 10; y++) {
        for (let x = villageX; x < villageX + 12; x++) {
            if (map[y][x] !== 1) map[y][x] = 3;
        }
    }
    
    // Flower border around plaza
    for (let x = villageX - 1; x <= villageX + 12; x++) {
        if (map[villageY - 1][x] === 0) map[villageY - 1][x] = 4;
        if (map[villageY + 10][x] === 0) map[villageY + 10][x] = 4;
    }
    for (let y = villageY - 1; y <= villageY + 10; y++) {
        if (map[y][villageX - 1] === 0) map[y][villageX - 1] = 4;
        if (map[y][villageX + 12] === 0) map[y][villageX + 12] = 4;
    }
    
    // Bonfire in center of village
    map[villageY + 5][villageX + 6] = 11;

    // === FOREST AREA ===
    // Dense tree cluster in one corner
    for (let i = 0; i < 60; i++) {
        const x = 50 + Math.floor(Math.random() * 25);
        const y = 50 + Math.floor(Math.random() * 25);
        if (x < MAP_WIDTH - 2 && y < MAP_HEIGHT - 2 && map[y][x] === 0) {
            map[y][x] = 2;
        }
    }

    // Scatter trees throughout map
    for (let i = 0; i < 80; i++) {
        const x = 3 + Math.floor(Math.random() * (MAP_WIDTH - 6));
        const y = 3 + Math.floor(Math.random() * (MAP_HEIGHT - 6));
        if (map[y][x] === 0) {
            map[y][x] = 2;
        }
    }

    // Scatter rocks
    for (let i = 0; i < 40; i++) {
        const x = 3 + Math.floor(Math.random() * (MAP_WIDTH - 6));
        const y = 3 + Math.floor(Math.random() * (MAP_HEIGHT - 6));
        if (map[y][x] === 0) {
            map[y][x] = 6;
        }
    }

    // Add decorative flowers
    for (let i = 0; i < 60; i++) {
        const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
        const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));
        if (map[y][x] === 0) {
            map[y][x] = 4;
        }
    }

    // Add decorative bushes
    for (let i = 0; i < 50; i++) {
        const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
        const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));
        if (map[y][x] === 0) {
            map[y][x] = 5;
        }
    }

    return map;
}

module.exports = {
    generateMap,
    TILE_SIZE,
    MAP_WIDTH,
    MAP_HEIGHT
};

