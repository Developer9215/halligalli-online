import { useRef, useState } from 'react';

const THRESHOLD = 90;

export default function OfflineCardStack({ me, meta, isMyTurn, onFlip }) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  const fruit = me.topCard ? meta.fruits.find((f) => f.id === me.topCard.fruit) : null;

  function onPointerDown(e) {
    if (!isMyTurn) return;
    setDragging(true);
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!isMyTurn || !dragging) return;
    const delta = e.clientY - startY.current;
    setDragY(Math.min(0, delta));
  }
  function onPointerUp() {
    if (!isMyTurn || !dragging) return;
    setDragging(false);
    if (dragY < -THRESHOLD) onFlip();
    setDragY(0);
  }

  const progress = Math.min(1, Math.abs(dragY) / THRESHOLD);
  const cardKey = me.topCard ? me.topCard.id : 'back';

  return (
    <div className="offline-stack">
      <div className="offline-peek" />
      <div
        key={cardKey}
        className={`offline-big-card ${isMyTurn ? 'enabled' : 'disabled'} ${fruit ? 'face' : 'back'}`}
        style={{
          transform: `translateY(${dragY}px) scale(${1 - progress * 0.05})`,
          opacity: 1 - progress * 0.4,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {fruit ? (
          <>
            <div className="offline-face-emoji">{fruit.emoji.repeat(me.topCard.count)}</div>
            <div className="offline-face-count">x{me.topCard.count}</div>
          </>
        ) : (
          <div className="offline-back-icon">🍀</div>
        )}
      </div>
      <div className="offline-counts">
        <span title="남은 카드">🂠 {me.drawCount}</span>
        <span title="지금까지 쌓인 카드">📤 {me.faceUpCount}</span>
      </div>
      <div className="swipe-hint">
        {isMyTurn ? '↑ 위로 스와이프해서 카드 넘기기' : '내 화면을 다른 사람에게 보여주세요 · 다른 사람 차례를 기다리는 중'}
      </div>
    </div>
  );
}
