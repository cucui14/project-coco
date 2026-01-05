import React, { useState } from 'react';

const emotes = [
    { id: 'wave', icon: '👋' },
    { id: 'laugh', icon: '😂' },
    { id: 'love', icon: '❤️' },
    { id: 'angry', icon: '😡' },
    { id: 'cry', icon: '😭' },
    { id: 'party', icon: '🎉' },
    { id: 'think', icon: '🤔' },
    { id: 'thumbsup', icon: '👍' }
];

const EmoteMenu = ({ onSelect, onClose, isOpen }) => {
    const [hoveredEmote, setHoveredEmote] = useState(null);

    if (!isOpen) return null;

    // Calculate positions in a circle
    const radius = 80;
    const centerX = 150;
    const centerY = 150;

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            pointerEvents: 'none', // Allow clicking through empty space? No, menu usually blocks. 
            // Actually let's make it a modal overlay that closes on background click
            zIndex: 200
        }}>
            {/* Backdrop to close */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'transparent',
                    pointerEvents: 'auto'
                }}
                onClick={onClose}
            />

            {/* Menu Circle */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }}>
                {emotes.map((emote, index) => {
                    const angle = (index / emotes.length) * 2 * Math.PI - Math.PI / 2; // Start at top
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);

                    return (
                        <div
                            key={emote.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(emote.icon);
                            }}
                            onMouseEnter={() => setHoveredEmote(emote.id)}
                            onMouseLeave={() => setHoveredEmote(null)}
                            style={{
                                position: 'absolute',
                                left: x,
                                top: y,
                                transform: 'translate(-50%, -50%)',
                                width: hoveredEmote === emote.id ? '50px' : '40px',
                                height: hoveredEmote === emote.id ? '50px' : '40px',
                                background: 'rgba(20, 22, 45, 0.9)',
                                borderRadius: '50%',
                                border: `2px solid ${hoveredEmote === emote.id ? '#ffd700' : '#7b2cbf'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: hoveredEmote === emote.id ? '28px' : '20px',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                            }}
                        >
                            {emote.icon}
                        </div>
                    );
                })}

                {/* Center Indicator */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    pointerEvents: 'none',
                    textAlign: 'center'
                }}>
                    Select Emote
                </div>
            </div>
        </div>
    );
};

export default EmoteMenu;
