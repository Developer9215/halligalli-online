import { useState } from 'react';
import socket from '../socket.js';

export default function Home({ onJoined }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState('create');
  const [roomMode, setRoomMode] = useState('online');
  const [bellMode, setBellMode] = useState('button');
  const [busy, setBusy] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    socket.emit('room:create', { name, mode: roomMode, bellMode }, (res) => {
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
        <button className={tab === 'create' ? 'tab active' : 'tab'} onClick={() => setTab('create')}>
          방 만들기
        </button>
        <button className={tab === 'join' ? 'tab active' : 'tab'} onClick={() => setTab('join')}>
          방 참가하기
        </button>
      </div>

      {tab === 'create' ? (
        <form className="card-form" onSubmit={handleCreate}>
          <label>
            이름
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="닉네임" maxLength={20} />
          </label>

          <div className="mode-picker">
            <div className="mode-picker-label">진행 방식</div>
            <div className="mode-options">
              <button type="button" className={roomMode === 'online' ? 'mode-opt active' : 'mode-opt'} onClick={() => setRoomMode('online')}>
                <div className="mode-opt-title">📱 온라인</div>
                <div className="mode-opt-desc">각자 폰 화면에서 서로의 카드를 봅니다. 원격 플레이에 적합.</div>
              </button>
              <button type="button" className={roomMode === 'offline' ? 'mode-opt active' : 'mode-opt'} onClick={() => setRoomMode('offline')}>
                <div className="mode-opt-title">👥 오프라인(한자리)</div>
                <div className="mode-opt-desc">내 폰엔 내 카드만 크게. 다른 사람 카드는 그 사람 폰을 직접 봅니다.</div>
              </button>
            </div>
          </div>

          {roomMode === 'offline' && (
            <div className="mode-picker">
              <div className="mode-picker-label">종(벨) 방식</div>
              <div className="mode-options">
                <button type="button" className={bellMode === 'button' ? 'mode-opt active' : 'mode-opt'} onClick={() => setBellMode('button')}>
                  <div className="mode-opt-title">🔘 버튼 벨</div>
                  <div className="mode-opt-desc">각자 폰의 종 버튼을 눌러 반응 속도를 겨룹니다.</div>
                </button>
                <button type="button" className={bellMode === 'physical' ? 'mode-opt active' : 'mode-opt'} onClick={() => setBellMode('physical')}>
                  <div className="mode-opt-title">🛎️ 실물 벨</div>
                  <div className="mode-opt-desc">진짜 벨을 사용하고, 누가 쳤는지만 아무 폰에서 기록합니다.</div>
                </button>
              </div>
            </div>
          )}

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
