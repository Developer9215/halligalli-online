import { useEffect, useState, useCallback } from 'react';
import socket from './socket';
import Home from './components/Home.jsx';
import LobbyScreen from './components/LobbyScreen.jsx';
import GameScreen from './components/GameScreen.jsx';

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [meta, setMeta] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      const saved = sessionStorage.getItem('halligalli-session');
      if (saved) {
        const { roomCode, playerId } = JSON.parse(saved);
        socket.emit('room:rejoin', { roomCode, playerId }, (res) => {
          if (!res || !res.ok) sessionStorage.removeItem('halligalli-session');
        });
      }
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onMetaFruits(m) {
      setMeta(m);
    }
    function onGameState(s) {
      setState(s);
    }
    function onErrorMessage({ message }) {
      setError(message);
      setTimeout(() => setError((cur) => (cur === message ? null : cur)), 3000);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('meta:fruits', onMetaFruits);
    socket.on('game:state', onGameState);
    socket.on('error:message', onErrorMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('meta:fruits', onMetaFruits);
      socket.off('game:state', onGameState);
      socket.off('error:message', onErrorMessage);
    };
  }, []);

  const onJoined = useCallback((roomCode, playerId) => {
    sessionStorage.setItem('halligalli-session', JSON.stringify({ roomCode, playerId }));
  }, []);

  if (!connected || !meta) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>서버에 연결하는 중...</p>
      </div>
    );
  }

  return (
    <div className="app-root">
      {error && <div className="error-toast">{error}</div>}
      {!state && <Home onJoined={onJoined} />}
      {state && state.phase === 'lobby' && <LobbyScreen state={state} />}
      {state && (state.phase === 'playing' || state.phase === 'ended') && <GameScreen meta={meta} state={state} />}
    </div>
  );
}
