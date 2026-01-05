import React, { useRef, useEffect } from 'react';

const MobileControls = ({ onDirectionChange, onInteract }) => {
    const [activeDirection, setActiveDirection] = React.useState(null);
    const intervalRef = useRef(null);

    const handleTouchStart = (direction) => {
        setActiveDirection(direction);
        onDirectionChange(direction);
        // Continuous movement
        intervalRef.current = setInterval(() => {
            onDirectionChange(direction);
        }, 50);
    };

    const handleTouchEnd = () => {
        setActiveDirection(null);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        onDirectionChange(null);
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const buttonStyle = (isActive) => ({
        width: '50px',
        height: '50px',
        background: isActive ? 'rgba(123, 44, 191, 0.9)' : 'rgba(20, 22, 45, 0.8)',
        border: '2px solid #7b2cbf',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '24px',
        userSelect: 'none',
        touchAction: 'none'
    });

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end',
            pointerEvents: 'auto',
            zIndex: 1000
        }}>
            {/* D-Pad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gap: '5px' }}>
                {/* Top row */}
                <div></div>
                <div
                    style={buttonStyle(activeDirection === 'up')}
                    onTouchStart={(e) => { e.preventDefault(); handleTouchStart('up'); }}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart('up')}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                >▲</div>
                <div></div>

                {/* Middle row */}
                <div
                    style={buttonStyle(activeDirection === 'left')}
                    onTouchStart={(e) => { e.preventDefault(); handleTouchStart('left'); }}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart('left')}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                >◀</div>
                <div style={{ ...buttonStyle(false), background: 'transparent', border: 'none' }}></div>
                <div
                    style={buttonStyle(activeDirection === 'right')}
                    onTouchStart={(e) => { e.preventDefault(); handleTouchStart('right'); }}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart('right')}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                >▶</div>

                {/* Bottom row */}
                <div></div>
                <div
                    style={buttonStyle(activeDirection === 'down')}
                    onTouchStart={(e) => { e.preventDefault(); handleTouchStart('down'); }}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart('down')}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                >▼</div>
                <div></div>
            </div>

            {/* Interact Button */}
            <div
                style={{
                    ...buttonStyle(false),
                    width: '70px',
                    height: '70px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginLeft: '20px'
                }}
                onTouchStart={(e) => { e.preventDefault(); onInteract(); }}
                onClick={onInteract}
            >
                E
            </div>
        </div>
    );
};

export default MobileControls;
