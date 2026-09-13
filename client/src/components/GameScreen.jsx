import { useState, useEffect, useRef } from 'react';
import socket from '../socket.js';
import PlayerTile from './PlayerTile.jsx';
import SwipeCard from './SwipeCard.jsx';
import GameLog from './GameLog.jsx';

export default function GameScreen({ meta, state }) {
  const [tab, setTab] = useState('play');
  const [toast, setToast] = useState(null);
  const [bellCooling, setBellCooling] = useState(false);
  const lastTsRef = useRef(0);

  useEffect(() => {
    const r = state.lastResolution;
    if (!r || r.ts === lastTsRef.current) return;
    lastTsRef.current = r.ts;
    if (r.type === 'stale') return;
    const name = state.players.find((p) => p.id === r.playerId)?.name || '???';
    if (r.type === 'correct') {
      setToast({ kind: 'correct', text: `✅ ${name}님이 맞혀서 카드 ${r.cardsWon}장을 가져갔습니다!` });
    } else if (r.type === 'wrong') {
      setToast({ kind: 'wrong', text: `❌ ${name}님이 잘못 눌러서 카드를 나눠줬습니다.` });
    }
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [state.lastResolution, state.players]);

  function ringBell() {
    if (bellCooling || state.phase !== 'playing') return;
    socket.emit('game:ring', { revealGen: state.revealGen });
    setBellCooling(true);
    setTimeout(() => setBellCooling(false), 250);
  }
  function flip() {
    socket.emit('game:flip');
  }

  return (
    <div className="game-screen">
      <div className="top-bar">
        <span className="room-code-small">{state.code}</span>
        <span className="turn-indicator">
          {state.phase === 'ended' ? '게임 종료' : `${state.players.find((p) => p.id === state.currentPlayerId)?.name}의 차례`}
        </span>
      </div>

      {toast && <div className={`resolution-toast ${toast.kind}`}>{toast.text}</div>}

      <div className="tab-content">
        {tab === 'play' && (
          <div className="hg-play-tab">
            <div className="player-tile-grid">
              {state.players.map((p) => (
                <PlayerTile key={p.id} player={p} meta={meta} isTurn={p.id === state.currentPlayerId} isMe={p.id === state.me.id} />
              ))}
            </div>

            <SwipeCard enabled={state.me.isMyTurn && state.phase === 'playing'} onFlip={flip} />

            <button className={`bell-btn ${bellCooling ? 'cooling' : ''}`} onPointerDown={ringBell} disabled={state.phase !== 'playing'}>
              🔔
            </button>
          </div>
        )}
        {tab === 'log' && <GameLog log={state.log} />}
      </div>

      <div className="tab-bar">
        <button className={tab === 'play' ? 'active' : ''} onClick={() => setTab('play')}>
          🎮 플레이
        </button>
        <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>
          📜 기록
        </button>
      </div>

      {state.phase === 'ended' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>🏆 {state.players.find((p) => p.id === state.winner)?.name}님 승리!</h3>
            <p>카드 {state.deckSize}장을 모두 모았습니다.</p>
            <p className="hint">방장이 새 방을 만들면 다시 플레이할 수 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
