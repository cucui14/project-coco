import React, { useRef, useEffect } from 'react';

const colors = [
    '#ffffff', // Default
    '#ffadad', // Reddish
    '#ffd6a5', // Orangeish
    '#fdffb6', // Yellowish
    '#caffbf', // Greenish
    '#9bf6ff', // Cyanish
    '#a0c4ff', // Blueish
    '#bdb2ff', // Purpleish
    '#ffc6ff', // Pinkish
    '#e0e0e0', // Gray
    '#d4c5a3'  // Tan
];

const ColorPicker = ({ selectedColor, onSelect }) => {
    const [isOpen, setIsOpen] = React.useState(false); // Default closed
    const containerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'absolute',
                    bottom: '20px', // Moved to bottom-right
                    right: '20px',
                    background: 'rgba(20, 22, 45, 0.9)',
                    border: '1px solid #7b2cbf',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 100
                }}
            >
                🎨 Customize
            </button>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                bottom: '20px', // Moved to bottom-right
                right: '20px',
                background: 'rgba(20, 22, 45, 0.9)',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #7b2cbf',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                pointerEvents: 'auto',
                zIndex: 100
            }}>
            <div style={{ color: '#fff', fontSize: '12px', textAlign: 'center' }}>Avatar Tint</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {colors.map(c => (
                    <div
                        key={c}
                        onClick={() => { onSelect(c); setIsOpen(false); }}
                        style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: c,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: selectedColor === c ? '2px solid #fff' : '1px solid #444',
                            boxShadow: selectedColor === c ? '0 0 5px #fff' : 'none'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default ColorPicker;

