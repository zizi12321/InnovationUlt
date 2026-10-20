import { colors, high, pickMove, chooseValue, chooseColor, all, junkDeck } from './effect-helpers.js';
import { cardSet } from './expansions.js';
import { isBonus, bonusValue } from './echoes-rules.js';

export const forecast = (c, p) => c.p(p).forecast;
export const expansion = (c, id) => cardSet(c.card(id)) !== 'Base';
export const cardBonuses = (c, id) => c.card(id).spots.filter(isBonus).map(bonusValue);
// BGA 4E AbstractCard.getIcons: all bonus values share the bonus icon type;
// hex images and echo-effect boxes are not icon types for these comparisons.
export const iconTypes = (c, id) => [...new Set(c.card(id).spots.filter(icon => icon >= 1 && icon <= 17 && icon !== 10 || icon === 18 && c.state.ageZeroIntroduced || isBonus(icon)).map(icon => isBonus(icon) ? 100 : icon))];
export const bottom = (c, p, color) => c.p(p).piles[color][0];
export const visibleCount = (c, p, color) => new Set(c.visible(c.p(p), color).map(mark => mark.id)).size;
export const echoes = (c, p, color) => c.visible(c.p(p), color).filter(mark => mark.icon === 10).length;
export const lowAge = (c, ids) => ids.length ? Math.min(...ids.map(id => c.card(id).age)) : 0;
export const topValue = (c, p, color) => c.card(c.p(p).piles[color].at(-1))?.age || 0;
export function* pickByTrait(c, p, zone, predicate, to, prompt, min = 1, max = 1, target = p, keyword = null) {
  const pool = [...c.p(p)[zone]], ids = pool.filter(predicate);
  const chosen = yield* c.pick(p, prompt, ids, min, max);
  // Official pp.13–14: verify a hidden face restriction, including inability
  // to satisfy a mandatory effect. Declining an optional effect reveals nothing.
  c.reveal(p, chosen.length < min ? pool : chosen);
  const moved = [];
  for (const id of chosen) if (c.move(id, to, target, '', keyword)) moved.push(id);
  return moved;
}
export function* allByTrait(c, p, zone, predicate, to, target = p, keyword = null) {
  const seen = new Set();
  const read = () => {
    const pool = [...c.p(p)[zone]], arrivals = pool.filter(id=>!seen.has(id));
    // Verify every new arrival as well as the original hidden zone.
    if(arrivals.length)c.reveal(p, arrivals);
    arrivals.forEach(id=>seen.add(id));
    return pool.filter(predicate);
  };
  return yield* all(c, p, read, to, target, '', keyword);
}
export function* moveChoice(c, p, ids, to, prompt, min = 1, max = 1, target = p, hidden = false, keyword = null) {
  const chosen = yield* c.pick(p, prompt, [...ids], min, max, hidden), moved = [];
  for (const id of chosen) if (c.move(id, to, target, '', keyword)) moved.push(id);
  return moved;
}
export function* claim(c, p, ids, optional = false, multiplier = 1) {
  return yield* moveChoice(c, p, ids.filter(id => c.eligible(p, id, multiplier)), 'achievements', '选择符合时代和分数条件的牌统御。', optional ? 0 : 1);
}
export function* junkAndClaim(c, p, age) {
  if (!(yield* c.yes(p, `是否移除时代 ${age} 基础牌库，并在符合条件时统御移除区最高牌？`))) return;
  const count = c.state.supply[age]?.length || 0;
  junkDeck(c, p, age);
  if (count) yield* claim(c, p, high(c, c.state.junk));
}
export function* chooseBonus(c, p, owners = [p], predicate = () => true) {
  // Choosing a printed bonus is not choosing an age: bonus 12 is valid and
  // may immediately end the game when an effect uses it as a draw value.
  const values = [...new Set(owners.flatMap(id => c.bonuses(c.p(id))).filter(predicate))];
  const [value] = yield* c.choose(p, '选择一个可见奖分的数值。', values.map(value => ({ value: String(value), label: `奖分 ${value}` })));
  return value ? Number(value) : null;
}
export function* anyAchievement(c, p, count = 1, values = null) {
  // Special achievements have no value. They are options only for unqualified
  // "available achievement" instructions, never for a value-restricted one.
  const options = [...c.state.standard.filter(id => !values || values.includes(c.card(id).age)).map(id => ({ value: id, label: `时代 ${c.card(id).age} 的可用成就`, age: c.card(id).age })),
    ...(!values ? c.state.availableSpecials.map(id => ({ value: id, label: c.specials.get(id).name_zh })) : [])];
  const ids = yield* c.choose(p, '选择要移除的可用成就。', options, count, count);
  for (const id of ids) if (c.specials.has(id)) c.specialMove(id, true); else c.move(id, 'junk', p);
  return ids;
}
export function* allOfAge(c, p, ids, to, age, target = p, keyword = null) {
  return yield* all(c, p, ()=>(typeof ids==='function'?ids():ids).filter(id => c.card(id).age === age), to, target, '', keyword);
}
export function* splayAnyBoard(c, p, direction) {
  const options = c.state.players.flatMap(owner => colors.filter(color => owner.piles[color].length > 1 && owner.splay[color] !== direction).map(color => ({ value: `${owner.id}:${color}`, label: `${owner.name}的${{RED:'红',YELLOW:'黄',GREEN:'绿',BLUE:'蓝',PURPLE:'紫'}[color]}色牌堆` })));
  const [choice] = yield* c.choose(p, '选择一个玩家的颜色牌堆展开。', options);
  if (choice) { const [owner, color] = choice.split(':'); c.splay(owner, color, direction); }
}
export function* exactGroup(c, p, ids, count, valid, to, prompt) {
  // Enumerate valid sets before asking, so the UI and offline AI cannot pick
  // an invalid combination. No card effect is inferred from its wording.
  const combinations = [];
  function walk(start, chosen) {
    if (chosen.length === count) { if (valid(chosen)) combinations.push(chosen); return; }
    for (let i = start; i < ids.length; i++) walk(i + 1, [...chosen, ids[i]]);
  }
  walk(0, []);
  if (!combinations.length || !(yield* c.yes(p, prompt))) return [];
  const chosen = [];
  for (let i = 0; i < count; i++) {
    const options = [...new Set(combinations.filter(group => chosen.every(id => group.includes(id))).flat())].filter(id => !chosen.includes(id));
    const [id] = yield* c.pick(p, prompt, options); chosen.push(id);
  }
  return chosen.filter(id => c.move(id, to, p));
}
