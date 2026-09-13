const FRUITS = [
  { id: 'banana', name: '바나나', emoji: '🍌' },
  { id: 'strawberry', name: '딸기', emoji: '🍓' },
  { id: 'lime', name: '라임', emoji: '🍋' },
  { id: 'grape', name: '포도(자두)', emoji: '🍇' },
];

// Real Halli Galli base-game deck: 4 fruits x 14 cards = 56 cards total.
// Per fruit, count-of-fruit-shown frequency: 1x5, 2x3, 3x3, 4x2, 5x1.
const COUNT_FREQUENCY = { 1: 5, 2: 3, 3: 3, 4: 2, 5: 1 };
const DECK_SIZE = FRUITS.length * Object.values(COUNT_FREQUENCY).reduce((a, b) => a + b, 0);

function buildDeck() {
  const deck = [];
  let cardId = 0;
  for (const fruit of FRUITS) {
    for (const [count, freq] of Object.entries(COUNT_FREQUENCY)) {
      for (let i = 0; i < freq; i++) {
        deck.push({ id: `c${cardId++}`, fruit: fruit.id, count: Number(count) });
      }
    }
  }
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealTo(playerCount) {
  const deck = shuffle(buildDeck());
  const hands = Array.from({ length: playerCount }, () => []);
  deck.forEach((card, idx) => hands[idx % playerCount].push(card));
  return hands;
}

function findMatchingFruit(visibleTopCards) {
  const sums = {};
  for (const entry of visibleTopCards) {
    sums[entry.fruit] = (sums[entry.fruit] || 0) + entry.count;
  }
  for (const [fruit, sum] of Object.entries(sums)) {
    if (sum === 5) return fruit;
  }
  return null;
}

module.exports = { FRUITS, DECK_SIZE, buildDeck, shuffle, dealTo, findMatchingFruit };
