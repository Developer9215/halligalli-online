import { useRef, useState } from 'react';

const THRESHOLD = 70;

export default function SwipeCard({ enabled, onFlip }) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  function onPointerDown(e) {
    if (!enabled) return;
    setDragging(true);
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!enabled || !dragging) return;
    const delta = e.clientY - startY.current;
    setDragY(Math.min(0, delta));
  }
  function onPointerUp() {
    if (!enabled || !dragging) return;
    setDragging(false);
    if (dragY < -THRESHOLD) {
      onFlip();
    }
    setDragY(0);
  }

  const progress = Math.min(1, Math.abs(dragY) / THRESHOLD);

  return (
    <div className="swipe-zone">
      <div
        className={`swipe-card ${enabled ? 'enabled' : 'disabled'}`}
        style={{
          transform: `translateY(${dragY}px) scale(${1 - progress * 0.06})`,
          opacity: 1 - progress * 0.5,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="swipe-card-back">🍀</div>
      </div>
      <div className="swipe-hint">{enabled ? '↑ 위로 스와이프해서 카드 넘기기' : '다른 사람 차례를 기다리는 중...'}</div>
    </div>
  );
}
