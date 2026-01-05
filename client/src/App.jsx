import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import ChatOverlay from './components/ChatOverlay';
import ColorPicker from './components/ColorPicker';
import StartScreen from './components/StartScreen';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState({});
  const [myId, setMyId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerData, setPlayerData] = useState(null); // { name, characterType }

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleJoinGame = (data) => {
    setPlayerData(data);
    setGameStarted(true);
  };

  // Show Start Screen if game hasn't started
  if (!gameStarted) {
    return <StartScreen onJoinGame={handleJoinGame} />;
  }

  return (
    <div className="app-container">
      <div className="game-wrapper">
        <GameCanvas
          onSocketConnected={(s) => setSocket(s)}
          onPlayersUpdate={(p) => setPlayers(p)}
          onMyIdSet={(id) => setMyId(id)}
          isMobile={isMobile}
          playerData={playerData}
        />
        <ChatOverlay socket={socket} players={players} myId={myId} isMobile={isMobile} />
        {socket && myId && (
          <ColorPicker
            selectedColor={players[myId]?.color || '#ffffff'}
            onSelect={(color) => socket.emit('updateColor', color)}
          />
        )}
      </div>
      <div className="ui-overlay">
        {/* Future UI elements like Health, Quests will go here */}
        <h1>Project Coco</h1>
      </div>
    </div>
  );
}

export default App;
