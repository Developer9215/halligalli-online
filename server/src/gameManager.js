const { randomUUID } = require('crypto');
const cards = require('./cards');

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

class HalliGalliRoom {
  constructor(code) {
    this.code = code;
    this.phase = 'lobby';
    this.players = [];
    this.hostId = null;
    this.mode = 'online';
    this.bellMode = 'button';
    this.turnIndex = 0;
    this.revealGen = 0;
    this.winner = null;
    this.lastResolution = null;
    this.log = [];
  }

  setMode(mode, bellMode) {
    this.mode = mode === 'offline' ? 'offline' : 'online';
    this.bellMode = this.mode === 'offline' && bellMode === 'physical' ? 'physical' : 'button';
  }

  addLog(message) {
    this.log.push({ ts: Date.now(), message });
    if (this.log.length > 300) this.log.shift();
  }
  findPlayer(playerId) {
    return this.players.find((p) => p.id === playerId);
  }
  playerName(playerId) {
    const p = this.findPlayer(playerId);
    return p ? p.name : '???';
  }
  playerIndex(playerId) {
    return this.players.findIndex((p) => p.id === playerId);
  }

  addPlayer(name) {
    const player = {
      id: randomUUID(),
      name: (name || '').slice(0, 20) || '플레이어',
      isConnected: true,
      isHost: this.players.length === 0,
      drawPile: [],
      faceUpPile: [],
    };
    this.players.push(player);
    if (!this.hostId) this.hostId = player.id;
    return player;
  }

  startGame(requesterId) {
    if (this.phase !== 'lobby') throw new Error('게임이 이미 시작되었습니다.');
    if (requesterId !== this.hostId) throw new Error('방장만 게임을 시작할 수 있습니다.');
    if (this.players.length < 2 || this.players.length > 8) throw new Error('플레이어는 2~8명이어야 합니다.');

    const hands = cards.dealTo(this.players.length);
    this.players.forEach((p, idx) => {
      p.drawPile = hands[idx];
      p.faceUpPile = [];
    });

    this.phase = 'playing';
    this.turnIndex = 0;
    this.revealGen = 0;
    this.winner = null;
    this.lastResolution = null;
    this.addLog('게임이 시작되었습니다! 카드가 균등하게 분배되었습니다.');
    this.addLog(`${this.playerName(this.currentPlayerId())}의 차례입니다.`);
  }

  currentPlayerId() {
    if (!this.players.length) return null;
    return this.players[this.turnIndex % this.players.length].id;
  }

  advanceTurnFrom(startIndex) {
    const n = this.players.length;
    for (let i = 0; i < n; i++) {
      const idx = (startIndex + i) % n;
      if (this.players[idx].drawPile.length > 0) {
        this.turnIndex = idx;
        return;
      }
    }
    this.turnIndex = startIndex % n;
  }

  flip(playerId) {
    if (this.phase !== 'playing') throw new Error('지금은 카드를 넘길 수 없습니다.');
    if (playerId !== this.currentPlayerId()) throw new Error('당신의 차례가 아닙니다.');
    const player = this.findPlayer(playerId);
    if (!player.drawPile.length) throw new Error('넘길 카드가 없습니다.');

    const card = player.drawPile.shift();
    player.faceUpPile.push(card);
    this.revealGen += 1;
    this.addLog(`${player.name}이(가) 카드를 넘겼습니다: ${card.fruit} x${card.count}`);

    const nextIdx = this.playerIndex(playerId) + 1;
    this.advanceTurnFrom(nextIdx);
    if (this.currentPlayerId() !== playerId) {
      this.addLog(`${this.playerName(this.currentPlayerId())}의 차례입니다.`);
    }
  }

  visibleTopCards() {
    return this.players
      .filter((p) => p.faceUpPile.length > 0)
      .map((p) => {
        const top = p.faceUpPile[p.faceUpPile.length - 1];
        return { playerId: p.id, fruit: top.fruit, count: top.count };
      });
  }

  ring(submitterId, clientRevealGen, claimedRingerId) {
    if (this.phase !== 'playing') throw new Error('지금은 종을 칠 수 없습니다.');
    if (!this.findPlayer(submitterId)) throw new Error('플레이어를 찾을 수 없습니다.');

    // In offline + physical-bell rooms, the app can't hear the real bell, so anyone can
    // report who actually struck it. In every other mode you can only ring for yourself.
    const usePhysicalClaim = this.mode === 'offline' && this.bellMode === 'physical' && claimedRingerId;
    const playerId = usePhysicalClaim ? claimedRingerId : submitterId;
    const ringer = this.findPlayer(playerId);
    if (!ringer) throw new Error('존재하지 않는 플레이어입니다.');

    if (clientRevealGen !== this.revealGen) {
      this.lastResolution = { type: 'stale', playerId, ts: Date.now() };
      return;
    }

    const matchFruit = cards.findMatchingFruit(this.visibleTopCards());

    if (matchFruit) {
      const won = [];
      for (const p of this.players) {
        won.push(...p.faceUpPile);
        p.faceUpPile = [];
      }
      ringer.drawPile.push(...won);
      this.revealGen += 1;
      this.addLog(`🔔 ${ringer.name}이(가) 정답(${matchFruit})을 맞혀 카드 ${won.length}장을 가져갔습니다.`);
      this.lastResolution = { type: 'correct', playerId, matchFruit, cardsWon: won.length, ts: Date.now() };

      this.advanceTurnFrom(this.playerIndex(playerId) + 1);

      if (ringer.drawPile.length === cards.DECK_SIZE) {
        this.phase = 'ended';
        this.winner = playerId;
        this.addLog(`🏆 ${ringer.name}이(가) 카드를 모두 모아 승리했습니다!`);
      } else {
        this.addLog(`${this.playerName(this.currentPlayerId())}의 차례입니다.`);
      }
    } else {
      const others = this.players.filter((p) => p.id !== playerId);
      let given = 0;
      for (const opp of others) {
        if (ringer.drawPile.length === 0) break;
        opp.drawPile.push(ringer.drawPile.shift());
        given += 1;
      }
      this.addLog(`❌ ${ringer.name}이(가) 잘못 종을 쳐서 카드를 ${given}장 나눠줬습니다.`);
      this.lastResolution = { type: 'wrong', playerId, cardsGiven: given, ts: Date.now() };
    }
  }

  removePlayer(playerId) {
    const player = this.findPlayer(playerId);
    if (!player) return;
    if (this.phase === 'lobby') {
      this.players = this.players.filter((p) => p.id !== playerId);
      if (this.hostId === playerId) this.hostId = this.players[0] ? this.players[0].id : null;
    } else {
      player.isConnected = false;
    }
  }

  serializeForPlayer(playerId) {
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      mode: this.mode,
      bellMode: this.bellMode,
      currentPlayerId: this.currentPlayerId(),
      revealGen: this.revealGen,
      deckSize: cards.DECK_SIZE,
      winner: this.winner,
      lastResolution: this.lastResolution,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        isConnected: p.isConnected,
        isHost: p.id === this.hostId,
        drawCount: p.drawPile.length,
        faceUpCount: p.faceUpPile.length,
        topCard: p.faceUpPile.length ? p.faceUpPile[p.faceUpPile.length - 1] : null,
      })),
      log: this.log.slice(-80),
      me: {
        id: playerId,
        isMyTurn: this.currentPlayerId() === playerId,
      },
    };
  }
}

class Store {
  constructor() {
    this.rooms = new Map();
  }
  create() {
    let code;
    do {
      code = genCode();
    } while (this.rooms.has(code));
    const room = new HalliGalliRoom(code);
    this.rooms.set(code, room);
    return room;
  }
  get(code) {
    return this.rooms.get((code || '').toUpperCase());
  }
  maybeCleanup(code) {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.players.length > 0 && room.players.every((p) => !p.isConnected)) {
      setTimeout(() => {
        const r = this.rooms.get(code);
        if (r && r.players.every((p) => !p.isConnected)) this.rooms.delete(code);
      }, 1000 * 60 * 30);
    }
  }
}

module.exports = { Store, HalliGalliRoom, cards };
