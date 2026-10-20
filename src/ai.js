import { isCity } from './cities-rules.js';
import { isBonus, bonusValue } from './echoes-rules.js';

// Small, deterministic offline policy. It receives an observation, not the
// engine's hidden state. Replace this policy later without changing rules.
export function chooseAction(view, actions, cards) {
  const ownColors = Object.keys(view.me.piles).filter(color => view.me.piles[color].length);
  const newColorHand = view.me.hand.some(id => !view.me.piles[cards.get(id).color].length);
  const uniqueColors = ownColors.filter(color => !view.rival.piles[color].length).length;
  const value = action => {
    if (action.type === 'achieve') return 100 + action.age;
    if (action.type === 'decree') return 65 + ((view.me.decrees || []).includes(action.cardId) ? 0 : 12);
    if (action.type === 'draw') return view.me.hand.length < 2 ? 10 : 1;
    const card = cards.get(action.cardId);
    if (action.type === 'meld') {
      const pile = view.me.piles[card.color], top = cards.get(pile.at(-1));
      return (pile.length ? 0 : 11) + Math.max(0, card.age - view.topAge) * 6 + card.age * .1
        + (isCity(card) ? 5 + card.spots.filter(icon => icon === 9).length * 24 + card.spots.filter(icon => icon === 8).length * (Math.max(1,pile.length) >= (view.rival.splay[card.color] === 'none' ? Math.min(1,view.rival.piles[card.color].length) : view.rival.piles[card.color].length) ? 20 : 4) + card.spots.filter(icon => [11,12,13].includes(icon)).length * (pile.length ? 6 : 0) : 0)
        + (view.expansions?.includes('cities') && !pile.length && !view.me.hand.some(id => id !== card.id && isCity(cards.get(id))) ? 5 : 0)
        + (card.type==='figure' ? 5 + card.effects.length : 0)
        + (view.me.forecast || []).filter(id => cards.get(id).age <= card.age).length * 4
        + card.spots.filter(isBonus).reduce((n, icon) => n + bonusValue(icon) * .6, 0)
        + (top ? Math.max(0, card.age - top.age) * 1.8 : 0)
        + (card.age > view.topAge && view.score >= card.age * 5 ? 20 : 0)
        + (card.age <= 2 ? 3 : 0) - (top && top.age > card.age ? 7 : 0);
    }
    const benefit = {
      B001: 3, B002: 10, B003: 4, B004: view.me.hand.length ? 17 : -4,
      B005: 5, B006: view.me.hand.some(id => cards.get(id).spots.includes(4)) ? 9 : -3,
      B007: uniqueColors * 7 + (newColorHand ? 8 : -3), B008: 9, B009: view.me.hand.length < 5 ? 13 : 3,
      B010: view.me.hand.length >= 3 ? 18 : 5, B011: view.me.hand.length >= 3 ? 15 : -4,
      B012: view.topAge < 2 ? 13 : 4, B013: view.icons[1] > view.rival.icons[1] && view.rival.icons[4] >= 4 ? 10 : -8,
      B014: view.me.hand.some(id => view.me.piles[cards.get(id).color].length) ? 9 : -3,
      B015: 8, B016: view.icons[4] > view.rival.icons[4] && view.rival.handAges.length ? 10 : -5,
      B017: view.me.hand.length ? 10 : -4, B018: -2,
      B019: 8, B020: view.me.hand.length ? 16 : -3, B021: view.icons[1] > view.rival.icons[1] && view.rival.scoreAges.includes(1) ? 10 : -3,
      B022: view.me.score.length > view.me.hand.length ? 14 : -3,
      B023: view.me.hand.length ? 16 : -3, B024: 10, B025: view.me.hand.length ? 14 : 1,
    };
    const shared = view.rival.icons[card.dogma_icon] >= view.icons[card.dogma_icon];
    const late = {
      B033: view.me.score.length ? 10 : -4, B034: view.me.score.length ? 12 : -4,
      B037: shared || !view.rival.scoreCount && !Object.values(view.rival.piles).some(pile => pile.length) ? -4 : 12,
      B039: view.me.hand.length > 1 ? 15 : -4, B043: view.me.score.length ? 14 : -4,
      B045: view.me.hand.length ? 10 : 2, B051: view.me.hand.length ? 12 : -4,
      B057: view.me.score.length ? 17 : 5, B060: view.me.hand.length ? 10 : -4,
      B063: view.me.score.length ? 10 : -4, B064: view.me.hand.length ? 18 : -4,
      B070: view.me.hand.reduce((n, id) => n + cards.get(id).age, 0) > view.score ? 15 : -8,
      B074: view.me.hand.length ? 17 : -4, B078: view.me.hand.length ? 14 : -4,
      B081: view.me.hand.length && view.rival.scoreCount ? 10 : -4,
      B082: view.me.hand.length >= 2 ? 19 : -4, B083: view.rival.scoreCount ? 14 : -4,
      B084: view.icons[3] >= 20 ? 500 : 9, B085: view.me.hand.length ? 14 : 1,
      B088: view.me.hand.length >= 2 ? 15 : -4, B089: view.me.hand.length ? 17 : -4,
      B090: view.me.piles.GREEN.length >= 10 ? 500 : 13,
      B096: view.me.hand.some(id => cards.get(id).age >= 10) ? 10 : -6,
      B099: view.me.hand.length ? 20 : 12,
      B101: view.me.achievementCount >= 2 * view.rival.achievements && !shared ? 500 : 10,
      B106: view.me.hand.length >= 7 ? 500 : 14,
      B111: Object.values(view.me.piles).some(pile => cards.get(pile[0])?.age === 11) ? -10 : 8,
      B114: view.me.hand.length ? 13 : -4,
    };
    // Newer cards get a usable baseline, with pure demands suppressed when
    // the opponent is immune. This is a heuristic, not a look-ahead solver.
    const demandOnly = card.effects.every(effect => effect.kind === 'i_demand_effect');
    const baseline = demandOnly && shared ? -6 : 8 + card.age * .6 + card.effects.filter(effect => effect.kind === 'echo_effect').length * 2;
    const repeats = (view.recentActions || []).filter(action => action.type === 'dogma' && action.cardId === card.id).length;
    // Public action history prevents getting stuck on a legal but ineffective
    // conditional dogma. Revisit it later after drawing or changing the board.
    return (benefit[card.id] ?? late[card.id] ?? baseline) + (view.endorseable?.includes(card.id) ? 4 : 0) - (shared ? 3 : 0) - repeats * 9;
  };
  return actions.slice().sort((a, b) => value(b) - value(a))[0];
}

export function chooseAnswer(choice, cards) {
  const options = choice.options.slice();
  if (choice.prompt.startsWith('签署费用')) return [options.sort((a,b)=>(cards.get(a.value)?.age||0)-(cards.get(b.value)?.age||0))[0].value];
  if (options.some(option => option.value === 'yes')) return ['yes'];
  if (options.some(option => option.value === 'exchange')) return ['skip'];
  // The computer prioritizes making progress. Only legal choices supplied by
  // the engine are considered; opponent-private cards are never supplied.
  options.sort((a, b) => {
    const age = option => option.age ?? cards.get(option.cardId)?.age ?? 0;
    return age(b) - age(a);
  });
  let count = choice.min;
  if (choice.min === 0) count = Math.min(choice.max, options.length);
  else if (choice.max > choice.min && choice.prompt.includes('融合')) count = choice.max;
  return options.slice(0, count).map(option => option.value);
}
