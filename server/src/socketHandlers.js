const { Store, cards } = require('./gameManager');

const store = new Store();
const socketMeta = new Map();

function broadcastRoom(io, room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit('game:state', room.serializeForPlayer(player.id));
  }
}

function withError(socket, fn) {
  try {
    fn();
  } catch (err) {
    socket.emit('error:message', { message: err.message || '알 수 없는 오류' });
  }
}

function attach(io) {
  io.on('connection', (socket) => {
    socket.emit('meta:fruits', { fruits: cards.FRUITS, deckSize: cards.DECK_SIZE });

    socket.on('room:create', ({ name }, ack) => {
      withError(socket, () => {
        const room = store.create();
        const player = room.addPlayer(name);
        player.socketId = socket.id;
        socketMeta.set(socket.id, { roomCode: room.code, playerId: player.id });
        socket.join(room.code);
        ack && ack({ ok: true, roomCode: room.code, playerId: player.id });
        broadcastRoom(io, room);
      });
    });

    socket.on('room:join', ({ roomCode, name }, ack) => {
      withError(socket, () => {
        const room = store.get(roomCode);
        if (!room) throw new Error('존재하지 않는 방입니다.');
        if (room.phase !== 'lobby') throw new Error('이미 시작된 게임입니다.');
        if (room.players.length >= 8) throw new Error('방이 가득 찼습니다.');
        const player = room.addPlayer(name);
        player.socketId = socket.id;
        socketMeta.set(socket.id, { roomCode: room.code, playerId: player.id });
        socket.join(room.code);
        ack && ack({ ok: true, roomCode: room.code, playerId: player.id });
        room.addLog(`${player.name}님이 입장했습니다.`);
        broadcastRoom(io, room);
      });
    });

    socket.on('room:rejoin', ({ roomCode, playerId }, ack) => {
      withError(socket, () => {
        const room = store.get(roomCode);
        if (!room) throw new Error('존재하지 않는 방입니다.');
        const player = room.findPlayer(playerId);
        if (!player) throw new Error('플레이어를 찾을 수 없습니다.');
        player.socketId = socket.id;
        player.isConnected = true;
        socketMeta.set(socket.id, { roomCode: room.code, playerId: player.id });
        socket.join(room.code);
        room.addLog(`${player.name}님이 재접속했습니다.`);
        ack && ack({ ok: true, roomCode: room.code, playerId: player.id });
        broadcastRoom(io, room);
      });
    });

    function getCtx() {
      const meta = socketMeta.get(socket.id);
      if (!meta) throw new Error('방에 참가하지 않았습니다.');
      const room = store.get(meta.roomCode);
      if (!room) throw new Error('존재하지 않는 방입니다.');
      return { room, playerId: meta.playerId };
    }

    socket.on('game:start', () => {
      withError(socket, () => {
        const { room, playerId } = getCtx();
        room.startGame(playerId);
        broadcastRoom(io, room);
      });
    });

    socket.on('game:flip', () => {
      withError(socket, () => {
        const { room, playerId } = getCtx();
        room.flip(playerId);
        broadcastRoom(io, room);
      });
    });

    socket.on('game:ring', ({ revealGen }) => {
      withError(socket, () => {
        const { room, playerId } = getCtx();
        room.ring(playerId, revealGen);
        broadcastRoom(io, room);
      });
    });

    socket.on('disconnect', () => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = store.get(meta.roomCode);
      socketMeta.delete(socket.id);
      if (!room) return;
      const player = room.findPlayer(meta.playerId);
      if (player) {
        room.addLog(`${player.name}님이 연결을 끊었습니다.`);
        room.removePlayer(meta.playerId);
      }
      broadcastRoom(io, room);
      store.maybeCleanup(room.code);
    });
  });
}

module.exports = { attach };
