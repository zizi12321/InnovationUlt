import { COLORS } from './state.js';
import { isBonus, bonusValue, totalBonus } from './echoes-rules.js';
import { cityAchievements } from './cities-rules.js';

export const isFigure = card => card?.type === 'figure' || card?.id?.startsWith('F');
export const isZero = card => card?.type === 'age_zero';
export const actionNumber = state => state.turn.number === 1 ? 1 : 3 - state.turn.left;
export const figureTops = (player, card) => COLORS.flatMap(color => player.piles[color.id].slice(-1)).filter(id => isFigure(card(id)));
export const STANDARD_ICONS = [1, 2, 3, 4, 5, 6, 7];

// Every Each reads this same physical snapshot, never another Each's output.
// The patches describe extra membership as well as numerical modifications.
export function figureState(state, card, visible, registry) {
  const players = state.players, raw = new Map(players.map(p => [p.id, p]));
  const tops = p => COLORS.flatMap(color => p.piles[color.id].slice(-1));
  const marks = p => COLORS.flatMap(color => visible(p, color.id));
  const icons = p => {
    const counts = Object.fromEntries([...STANDARD_ICONS, ...(state.ageZeroIntroduced ? [18] : [])].map(icon => [icon, 0]));
    for (const mark of marks(p)) if (Object.hasOwn(counts, mark.icon)) counts[mark.icon]++;
    return counts;
  };
  const ownedAchievements = p => p.achievements.length + p.specials.length + (p.decrees || []).length + cityAchievements(state, p, visible).total;
  const base = { state, players, p: id => raw.get(id), card, tops, visible, icons,
    other: id => players.find(p => p.id !== id).id, highest: p => Math.max(0, ...tops(p).map(id => card(id).age)),
    hand: p => p.hand, score: p => p.score, achievements: ownedAchievements,
    visibleCards: p => [...new Set(marks(p).map(mark => mark.id))],
    bonuses: p => marks(p).filter(mark => isBonus(mark.icon)).map(mark => bonusValue(mark.icon)),
  };
  const patches = Object.fromEntries(players.map(p => [p.id, { icons: {}, scoreAdd: 0, achievementAdd: 0, achievementAgeAdd: 0,
    eligibilityByAge: {}, handExtra: [], scoreExtra: [], achievementExtra: [], dogmaExtra: [], specialReduction: 0 }]));
  if ((state.expansions || []).includes('figures')) for (const owner of players) for (const id of figureTops(owner, card)) {
    for (const karma of registry[id] || []) if (karma.kind === 'each') karma.apply(base, owner.id, patches);
  }
  const hand = id => [...new Set([...raw.get(id).hand, ...patches[id].handExtra])];
  const scoreCards = id => [...new Set([...raw.get(id).score, ...patches[id].scoreExtra])];
  const scores = Object.fromEntries(players.map(p => [p.id, scoreCards(p.id).reduce((sum,id) => sum + card(id).age,0) + totalBonus(base.bonuses(p)) + patches[p.id].scoreAdd]));
  return { base, patches, hand, scoreCards, score: id => scores[id],
    icons: id => Object.fromEntries(Object.entries(icons(raw.get(id))).map(([icon,count]) => [icon, count + (patches[id].icons[icon] || 0)])),
    achievements: id => ownedAchievements(raw.get(id)) + patches[id].achievementAdd,
  };
}

export function decreeOptions(state, owner, card, registry, decrees) {
  const figures = owner.hand.filter(id => isFigure(card(id))), values = new Set(figures.map(id => card(id).age));
  const allowed = new Set(values.size >= 3 ? figures.map(id => card(id).color) : []);
  for (const id of figureTops(owner, card)) for (const karma of registry[id] || []) {
    if (karma.kind === 'decree' && figures.length >= karma.count) {
      for (const color of karma.color === 'any' ? COLORS.map(c => c.id) : [karma.color]) allowed.add(color);
    }
  }
  return decrees.filter(decree => allowed.has(decree.color)).map(decree => decree.id);
}
