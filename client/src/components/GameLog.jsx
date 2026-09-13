export default function GameLog({ log }) {
  return (
    <div className="game-log">
      {[...log].reverse().map((entry) => (
        <div key={entry.ts + entry.message} className="log-entry">
          {entry.message}
        </div>
      ))}
    </div>
  );
}
