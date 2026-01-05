import React, { useState } from 'react';

const StartScreen = ({ onJoinGame }) => {
    const [playerName, setPlayerName] = useState('');
    const [characterType, setCharacterType] = useState('male'); // 'male' or 'female'
    const [error, setError] = useState('');

    const handleJoin = () => {
        const trimmedName = playerName.trim();
        if (trimmedName.length < 2) {
            setError('Name must be at least 2 characters.');
            return;
        }
        if (trimmedName.length > 15) {
            setError('Name must be 15 characters or less.');
            return;
        }
        setError('');
        onJoinGame({ name: trimmedName, characterType });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleJoin();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #0a0b1e 0%, #1b1e3f 50%, #0a0b1e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Segoe UI', sans-serif",
            color: '#e0e0e0',
            zIndex: 9999
        }}>
            {/* Title */}
            <h1 style={{
                fontSize: '3rem',
                color: '#ffcb74',
                textShadow: '0 0 20px rgba(255, 203, 116, 0.5)',
                marginBottom: '40px',
                letterSpacing: '4px'
            }}>
                Project Coco
            </h1>

            {/* Name Entry */}
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#aaa' }}>
                    Enter Your Name
                </label>
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Adventurer"
                    maxLength={15}
                    style={{
                        width: '250px',
                        padding: '12px 16px',
                        fontSize: '18px',
                        background: 'rgba(20, 22, 45, 0.9)',
                        border: '2px solid #7b2cbf',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none',
                        textAlign: 'center'
                    }}
                />
                {error && (
                    <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px' }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Character Selection */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '15px', fontSize: '14px', color: '#aaa' }}>
                    Choose Your Character
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {/* Male Option */}
                    <div
                        onClick={() => setCharacterType('male')}
                        style={{
                            width: '100px',
                            height: '120px',
                            background: characterType === 'male'
                                ? 'rgba(123, 44, 191, 0.3)'
                                : 'rgba(20, 22, 45, 0.9)',
                            border: characterType === 'male'
                                ? '3px solid #7b2cbf'
                                : '2px solid #444',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🧑</div>
                        <div style={{ fontSize: '14px' }}>Male</div>
                    </div>

                    {/* Female Option */}
                    <div
                        onClick={() => setCharacterType('female')}
                        style={{
                            width: '100px',
                            height: '120px',
                            background: characterType === 'female'
                                ? 'rgba(123, 44, 191, 0.3)'
                                : 'rgba(20, 22, 45, 0.9)',
                            border: characterType === 'female'
                                ? '3px solid #7b2cbf'
                                : '2px solid #444',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>👩</div>
                        <div style={{ fontSize: '14px' }}>Female</div>
                    </div>
                </div>
            </div>

            {/* Join Button */}
            <button
                onClick={handleJoin}
                style={{
                    padding: '15px 50px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #7b2cbf 0%, #9d4edd 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(123, 44, 191, 0.4)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 6px 20px rgba(123, 44, 191, 0.6)';
                }}
                onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(123, 44, 191, 0.4)';
                }}
            >
                Join World
            </button>

            {/* Footer */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                fontSize: '12px',
                color: '#666'
            }}>
                Version 2.0
            </div>
        </div>
    );
};

export default StartScreen;
