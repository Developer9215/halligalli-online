export default function PlayerTile({ player, meta, isTurn, isMe }) {
  const fruit = player.topCard ? meta.fruits.find((f) => f.id === player.topCard.fruit) : null;

  return (
    <div className={`player-tile ${isTurn ? 'turn' : ''} ${isMe ? 'me' : ''}`}>
      <div className="player-tile-name">
        {player.name}
        {isTurn && <span className="turn-dot" />}
        {!player.isConnected && <span className="disc-badge">끊김</span>}
      </div>
      <div className="player-tile-face">
        {fruit ? (
          <div className="face-card">
            <div className="face-emoji">{fruit.emoji.repeat(Math.min(player.topCard.count, 5))}</div>
            <div className="face-count">x{player.topCard.count}</div>
          </div>
        ) : (
          <div className="face-empty">-</div>
        )}
      </div>
      <div className="player-tile-counts">
        <span title="남은 카드">🂠 {player.drawCount}</span>
        <span title="테이블에 쌓인 카드">📤 {player.faceUpCount}</span>
      </div>
    </div>
  );
}
