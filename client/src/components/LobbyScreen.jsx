import socket from '../socket.js';

export default function LobbyScreen({ state }) {
  const me = state.players.find((p) => p.id === state.me.id);
  const isHost = me && me.isHost;
  const n = state.players.length;
  const canStart = n >= 2 && n <= 8;

  function start() {
    socket.emit('game:start');
  }

  return (
    <div className="lobby-screen">
      <div className="room-code-banner">
        방 코드 <span>{state.code}</span>
        <div className="hint">이 코드를 다른 사람에게 공유하세요 (2~8명)</div>
      </div>

      <h2>플레이어 ({n}/8)</h2>
      <ul className="player-list">
        {state.players.map((p) => (
          <li key={p.id} className={p.id === state.me.id ? 'me' : ''}>
            {p.name}
            {p.isHost && <span className="badge">방장</span>}
          </li>
        ))}
      </ul>

      <div className="rules-box">
        <h3>규칙 요약</h3>
        <ul>
          <li>자기 차례가 되면 카드를 위로 스와이프해서 넘깁니다.</li>
          <li>모두의 맨 위 카드를 합쳐 같은 과일이 정확히 5개가 되면, 누구든 🔔 버튼을 먼저 눌러야 합니다.</li>
          <li>맞히면 테이블에 놓인 모든 카드를 가져가고, 틀리면 상대 전원에게 카드를 한 장씩 나눠줍니다.</li>
          <li>카드를 모두 모은 사람이 승리합니다.</li>
        </ul>
      </div>

      {isHost ? (
        <button className="primary-btn" disabled={!canStart} onClick={start}>
          {canStart ? '게임 시작' : '2~8명이 모여야 시작할 수 있습니다'}
        </button>
      ) : (
        <p className="hint">방장이 게임을 시작하기를 기다리는 중...</p>
      )}
    </div>
  );
}
