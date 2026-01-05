import React, { useState, useEffect, useRef } from 'react';

const ChatOverlay = ({ socket, players, myId, isMobile = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(!isMobile); // Open by default on desktop, closed on mobile
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg].slice(-50)); // Keep last 50
    };
    socket.on('chatMessage', handleMessage);
    return () => socket.off('chatMessage', handleMessage);
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update isOpen when isMobile changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socket) {
      socket.emit('chatMessage', { text: input });
      setInput('');
      if (document.activeElement) document.activeElement.blur();
    }
  };

  // Toggle button for mobile
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          top: isMobile ? '70px' : 'auto', // Top on mobile (below coins)
          bottom: isMobile ? 'auto' : '20px', // Bottom on desktop
          left: '20px',
          background: 'rgba(20, 22, 45, 0.9)',
          border: '1px solid #7b2cbf',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          pointerEvents: 'auto',
          fontSize: '16px',
          zIndex: 100
        }}
      >
        💬 Chat
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: isMobile ? '180px' : '20px', // Move above mobile controls
      left: '20px',
      width: isMobile ? '280px' : '350px',
      height: isMobile ? '200px' : '250px',
      background: 'rgba(20, 22, 45, 0.95)',
      color: '#e0e0e0',
      padding: '10px',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #7b2cbf',
      pointerEvents: 'auto',
      zIndex: 100
    }}>
      {/* Close button on mobile */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'transparent',
            border: 'none',
            color: '#888',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      )}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', fontSize: '14px' }}>
        {messages.map(m => {
          const p = players[m.playerId];
          const color = p ? p.color : '#fff';
          const displayName = p && p.name ? p.name : m.playerId.slice(0, 5);
          return (
            <div key={m.id} style={{ marginBottom: '4px' }}>
              <strong style={{ color }}>{displayName}:</strong> {m.text}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Say something..."
          style={{
            width: '100%',
            padding: '8px',
            background: '#0a0b1e',
            border: '1px solid #7b2cbf',
            color: 'white',
            borderRadius: '4px',
            outline: 'none'
          }}
          onKeyDown={e => e.stopPropagation()} // Stop bubbling
        />
      </form>
    </div>
  );
};

export default ChatOverlay;

