import { useState } from 'react';
import socket from '../socket.js';

export default function PhysicalBellPanel({ state }) {
  const [cooling, setCooling] = useState(false);

  function report(playerId) {
    if (cooling || state.phase !== 'playing') return;
    socket.emit('game:ring', { revealGen: state.revealGen, ringerId: playerId });
    setCooling(true);
    setTimeout(() => setCooling(false), 250);
  }

  return (
    <div className="physical-bell-panel">
      <p className="physical-bell-title">🔔 실물 벨을 먼저 친 사람을 골라주세요</p>
      <div className="player-chip-grid">
        {state.players.map((p) => (
          <button key={p.id} className="player-chip" disabled={cooling} onClick={() => report(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <p className="hint">실제로 벨을 먼저 친 사람이 누구인지는 다 함께 눈으로 확인하고, 아무 폰에서나 그 사람 이름을 눌러 기록하면 됩니다.</p>
    </div>
  );
}
