import { COLORS } from './state.js';

export const isCity = card => card?.type === 'city' || card?.set === 'Cities' && card.age >= 1;
export const CITY_ARROWS = Object.freeze({ 11: 'left', 12: 'right', 13: 'up' });
export const CITY_ACHIEVEMENTS = Object.freeze({ left: 'TRADITION', right: 'REPUTE', up: 'FAME' });

// Constant icons are physical board contributions, before any Figure Each.
// A lower card counts as visible only if its splay exposes a printed position.
export function cityAchievements(state, owner, visible) {
  const colors = COLORS.map(({ id: color }) => {
    const marks = visible(owner, color).filter(mark => mark.icon !== null && mark.icon !== undefined);
    const count = new Set(marks.map(mark => mark.id)).size;
    const opponents = state.players.filter(p => p.id !== owner.id).map(p =>
      new Set(visible(p, color).filter(mark => mark.icon !== null && mark.icon !== undefined).map(mark => mark.id)).size);
    const flags = marks.filter(mark => mark.icon === 8).length;
    const fountains = marks.filter(mark => mark.icon === 9).length;
    const qualifies = opponents.every(other => other <= count);
    return { color, visibleCards: count, rivalMax: Math.max(0, ...opponents), flags, fountains,
      activeFlags: qualifies ? flags : 0, total: fountains + (qualifies ? flags : 0) };
  });
  return { colors, flags: colors.reduce((n, c) => n + c.flags, 0),
    activeFlags: colors.reduce((n, c) => n + c.activeFlags, 0),
    fountains: colors.reduce((n, c) => n + c.fountains, 0), total: colors.reduce((n, c) => n + c.total, 0) };
}

export function endorsementOptions(state, owner, definition, card, hand = owner.hand) {
  if (!(state.expansions || []).includes('cities') || !definition?.dogma_icon || state.endorsements?.[owner.id] === state.turn.number) return [];
  return COLORS.flatMap(({ id }) => owner.piles[id].slice(-1)).filter(id => isCity(card(id)) && card(id).spots.includes(definition.dogma_icon))
    .map(cityId => ({ cityId, payments: hand.filter(id => card(id).age <= card(cityId).age) }))
    .filter(option => option.payments.length);
}
