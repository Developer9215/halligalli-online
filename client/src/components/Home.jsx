import { useState } from 'react';
import socket from '../socket.js';

export default function Home({ onJoined }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('create');
  const [busy, setBusy] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    socket.emit('room:create', { name }, (res) => {
      setBusy(false);
      if (res && res.ok) onJoined(res.roomCode, res.playerId);
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim() || code.trim().length !== 4) return;
    setBusy(true);
    socket.emit('room:join', { roomCode: code.trim().toUpperCase(), name }, (res) => {
      setBusy(false);
      if (res && res.ok) onJoined(res.roomCode, res.playerId);
    });
  }

  return (
    <div className="center-screen">
      <h1 className="title">🔔 할리갈리 온라인</h1>
      <div className="tabs">
        <button className={mode === 'create' ? 'tab active' : 'tab'} onClick={() => setMode('create')}>
          방 만들기
        </button>
        <button className={mode === 'join' ? 'tab active' : 'tab'} onClick={() => setMode('join')}>
          방 참가하기
        </button>
      </div>

      {mode === 'create' ? (
        <form className="card-form" onSubmit={handleCreate}>
          <label>
            이름
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="닉네임" maxLength={20} />
          </label>
          <button type="submit" disabled={busy || !name.trim()}>
            방 만들기
          </button>
        </form>
      ) : (
        <form className="card-form" onSubmit={handleJoin}>
          <label>
            이름
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="닉네임" maxLength={20} />
          </label>
          <label>
            방 코드
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              style={{ textTransform: 'uppercase' }}
            />
          </label>
          <button type="submit" disabled={busy || !name.trim() || code.trim().length !== 4}>
            참가하기
          </button>
        </form>
      )}
    </div>
  );
}
