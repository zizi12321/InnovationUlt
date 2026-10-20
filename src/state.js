export const AGES = Object.freeze(Array.from({ length: 11 }, (_, index) => index + 1));
export const COLORS = Object.freeze([
  { id: 'RED', name: '红', hex: '#a6473e', tint: '#f7e8e3', soft: '#fcf5f2' },
  { id: 'YELLOW', name: '黄', hex: '#95701e', tint: '#f4edce', soft: '#fdf9e9' },
  { id: 'GREEN', name: '绿', hex: '#4f7858', tint: '#e5eee0', soft: '#f4f8ef' },
  { id: 'BLUE', name: '蓝', hex: '#426d93', tint: '#e2ebf4', soft: '#f2f7fb' },
  { id: 'PURPLE', name: '紫', hex: '#7c5c95', tint: '#ece4f2', soft: '#f8f3fb' },
]);
export const SEATS = Object.freeze([{ id: 'opponent', name: '电脑' }, { id: 'you', name: '你' }]);

// Preview fixtures only, NOT legal starting positions or AI decisions.
// A future rules engine must implement achievement reservation, initial hands,
// opening choices and turn order separately instead of treating this as setup.
const EXAMPLE_PILES = {
  opponent: { RED: [1, 2, 4], YELLOW: [1, 3], GREEN: [1, 2], BLUE: [1, 3, 4], PURPLE: [1, 2] },
  you: { RED: [1, 3], YELLOW: [1, 2, 4], GREEN: [1, 3], BLUE: [1, 2], PURPLE: [1, 3] },
};

export function createBoardState(cards, mode = 'sample') {
  if (!['sample', 'empty'].includes(mode)) throw new Error('未知的棋盘视图。');
  const cardById = new Map(cards.map(card => [card.id, card]));
  const state = {
    version: 1,
    mode,
    // Arrays contain IDs; the last element is the top of a deck or color pile.
    supply: Object.fromEntries(AGES.map(age => [age, cards.filter(card => card.age === age).map(card => card.id)])),
    players: SEATS.map(seat => ({ ...seat, piles: Object.fromEntries(COLORS.map(color => [color.id, []])) })),
  };
  if (mode === 'sample') {
    for (const player of state.players) {
      for (const color of COLORS) {
        for (const age of EXAMPLE_PILES[player.id][color.id]) {
          const deck = state.supply[age];
          const index = deck.findIndex(id => cardById.get(id).color === color.id);
          if (index === -1) throw new Error(`示例缺少时代 ${age} 的${color.name}牌。`);
          player.piles[color.id].push(deck.splice(index, 1)[0]);
        }
      }
    }
  }
  assertBoardState(state, cards);
  return state;
}

export function getSupplyCount(state) {
  return AGES.reduce((sum, age) => sum + state.supply[age].length, 0);
}

export function getPlayerSummary(player, cardById) {
  const piles = Object.values(player.piles);
  return {
    count: piles.reduce((sum, pile) => sum + pile.length, 0),
    topAge: Math.max(0, ...piles.filter(pile => pile.length).map(pile => cardById.get(pile.at(-1)).age)),
  };
}

export function assertBoardState(state, cards) {
  const cardById = new Map(cards.map(card => [card.id, card]));
  const seen = new Set();
  function record(id, matchesZone) {
    const card = cardById.get(id);
    if (!card || seen.has(id) || !matchesZone(card)) throw new Error(`卡牌位置异常：${id}`);
    seen.add(id);
  }
  for (const age of AGES) for (const id of state.supply[age]) record(id, card => card.age === age);
  for (const player of state.players) for (const color of COLORS) {
    for (const id of player.piles[color.id]) record(id, card => card.color === color.id);
  }
  if (seen.size !== cards.length) throw new Error('存在未归属任何区域的基础牌。');
  // When adding hands / score piles / achievements, include them in this
  // conservation check. Do not weaken the check to accommodate missing zones.
}
