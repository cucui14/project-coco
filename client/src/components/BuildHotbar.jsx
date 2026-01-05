import React from 'react';

// Building items available
const buildItems = [
    { id: 'stone_wall', name: 'Stone Wall', icon: '🧱', cost: { stone: 5 }, tileType: 7 },
    { id: 'wood_fence', name: 'Wood Fence', icon: '🪵', cost: { wood: 3 }, tileType: 8 },
    { id: 'wood_floor', name: 'Wood Floor', icon: '🟫', cost: { wood: 2 }, tileType: 9 }
];

const BuildHotbar = ({ inventory, selectedItem, onSelectItem, onToggleBuildMode, buildMode }) => {
    const getResource = (item) => {
        const invItem = inventory.find(i => i.item === item);
        return invItem ? invItem.amount : 0;
    };

    const canAfford = (cost) => {
        return Object.entries(cost).every(([item, amount]) => getResource(item) >= amount);
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto'
        }}>
            <button
                onClick={onToggleBuildMode}
                style={{
                    padding: '10px 20px',
                    background: buildMode
                        ? 'linear-gradient(135deg, #ef476f 0%, #f72585 100%)'
                        : 'linear-gradient(135deg, #7b2cbf 0%, #9d4edd 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 4px 15px rgba(123, 44, 191, 0.4)'
                }}
            >
                {buildMode ? '✕ Exit Build Mode' : '🔨 Build Mode'}
            </button>

            {buildMode && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #7b2cbf'
                }}>
                    {buildItems.map(item => {
                        const affordable = canAfford(item.cost);
                        const isSelected = selectedItem === item.id;
                        return (
                            <div
                                key={item.id}
                                onClick={() => affordable && onSelectItem(item.id)}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    background: isSelected
                                        ? 'rgba(123, 44, 191, 0.5)'
                                        : 'rgba(20, 22, 45, 0.9)',
                                    border: isSelected
                                        ? '3px solid #7b2cbf'
                                        : '2px solid #444',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: affordable ? 'pointer' : 'not-allowed',
                                    opacity: affordable ? 1 : 0.5
                                }}
                                title={`${item.name} - ${Object.entries(item.cost).map(([k, v]) => `${v} ${k}`).join(', ')}`}
                            >
                                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {buildMode && selectedItem && (
                <div style={{
                    background: 'rgba(0,0,0,0.8)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '12px'
                }}>
                    Cost: {Object.entries(buildItems.find(i => i.id === selectedItem)?.cost || {})
                        .map(([item, amount]) => `${amount} ${item}`)
                        .join(', ')}
                </div>
            )}
        </div>
    );
};

export { buildItems };
export default BuildHotbar;
