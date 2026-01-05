// Quest definitions
const quests = {
    talk_to_elder: {
        id: 'talk_to_elder',
        name: 'Talk to the Elder',
        description: 'Speak with the Elder in the village.',
        objectives: [
            { id: 'obj_talk', description: 'Talk to the Elder', type: 'interact', target: 'npc_guide', count: 1 }
        ],
        rewards: { xp: 10 }
    },
    explore_area: {
        id: 'explore_area',
        name: 'Explore the Village',
        description: 'Walk around and explore the village surroundings.',
        objectives: [
            { id: 'obj_explore', description: 'Visit the sign', type: 'interact', target: 'sign_welcome', count: 1 }
        ],
        rewards: { xp: 5 }
    }
};

// Get quest by ID
function getQuest(id) {
    return quests[id] || null;
}

// Get starter quest
function getStarterQuest() {
    return quests.talk_to_elder;
}

module.exports = {
    quests,
    getQuest,
    getStarterQuest
};
