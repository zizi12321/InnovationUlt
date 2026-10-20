import { COLORS } from './state.js';
export const colors = COLORS.map(color => color.id);
export const hand = (c, p) => c.p(p).hand;
export const tops = (c, p) => c.tops(c.p(p));
export const pile = (c, p, color) => c.p(p).piles[color];
export const score = (c, p) => c.p(p).score;
export const has = (c, id, icon) => c.card(id).spots.includes(icon);
export const high = (c, ids) => ids.filter(id => c.card(id).age === Math.max(0, ...ids.map(value => c.card(value).age)));
export const low = (c, ids) => ids.filter(id => c.card(id).age === Math.min(Infinity, ...ids.map(value => c.card(value).age)));
export const maxAge = (c, ids) => Math.max(0, ...ids.map(id => c.card(id).age));
export const colorCount = (c, p, icon) => colors.filter(color => c.visible(c.p(p), color).some(mark => mark.icon === icon)).length;
export const topAge = (c, p, color) => c.card(pile(c, p, color).at(-1))?.age || 0;

export function* pickMove(c, p, ids, to, prompt, min = 1, max = 1, target = p, verb = '', keyword = null) {
  const selected = yield* c.pick(p, prompt, [...new Set(ids)], min, max);
  return selected.filter(id => c.move(id, to, target, verb, keyword));
}
export function* all(c, p, ids, to, target = p, verb = '', keyword = null) {
  const read=typeof ids==='function'?ids:()=>ids;
  if((c.state.expansions||[]).includes('figures')) {
    const considered=new Set(),moved=[];
    // Official p.28: reconsider the named zone/condition after every card.
    // Newly arriving cards can qualify, but a prevented/re-entering card is
    // considered only once. Explicit finite selections pass a frozen array.
    while(true){
      const candidates=[...new Set(read())].filter(id=>!considered.has(id));if(!candidates.length)return moved;
      const [id]=yield*c.pick(p,`依次处理全部符合条件的牌：选择下一张。`,candidates);
      considered.add(id);if(c.move(id,to,target,verb,keyword))moved.push(id);
    }
  }
  const values = [...new Set(read())];
  // Return/meld/tuck order can alter future play. Let the executing player
  // choose the sequence, even for mandatory "all" movements.
  const ordered = values.length > 1 && ['return', 'meld', 'tuck', 'foreshadow'].includes(to)
    ? yield* c.pick(p, `按执行顺序选择全部 ${values.length} 张牌。`, values, values.length, values.length) : values;
  return ordered.filter(id => c.move(id, to, target, verb, keyword));
}
export function* optionalAll(c, p, ids, to, prompt) {
  if (!(typeof ids==='function'?ids():ids).length || !(yield* c.yes(p, prompt))) return [];
  return yield* all(c, p, ids, to);
}
export function* chooseColor(c, p, choices = colors, optional = false, prompt = '选择一种颜色。') {
  const result = yield* c.choose(p, prompt, choices.map(value => ({ value, label: `${COLORS.find(color => color.id === value).name}色` })), optional ? 0 : 1, 1);
  return result[0];
}
export function* chooseValue(c, p, values = c.values(), prompt = '选择一个时代。') {
  // Age 0 is selectable only after Bear Grylls introduces its deck (p.30).
  const options = [...new Set(values)].filter(value => c.values().includes(value)).map(value => ({ value: String(value), label: `时代 ${value}`, age: value }));
  const result = yield* c.choose(p, prompt, options); return result.length ? Number(result[0]) : null;
}
export function* choosePrintedValue(c,p,values,prompt='选择牌文指定的时代。') {
  // Explicit printed boxes can become 12 under a karma; choosing one for a
  // draw must end the game instead of silently removing that option.
  const options=[...new Set(values.map(value=>c.value(value)))].map(value=>({value:String(value),label:`时代 ${value}`,age:value}));
  const [answer]=yield*c.choose(p,prompt,options);return answer===undefined?null:Number(answer);
}
export function* splay(c, p, choices, direction, optional = true) {
  const names = { left: '左', right: '右', up: '上', aslant: '斜向' };
  const valid = choices.filter(color => pile(c, p, color).length > 1 && c.p(p).splay[color] !== direction);
  const color = yield* chooseColor(c, p, valid, optional, `${optional ? '可以' : '必须'}选择一个颜色向${names[direction]}展开。`);
  return color ? c.splay(p, color, direction) : false;
}
export function junkDeck(c, p, age) { for (const id of [...(c.state.supply[age] || [])]) c.move(id, 'junk', p); }
export function* junkAchievement(c, p, ages, optional = false) {
  const selected = yield* c.pick(p, `${optional ? '可以' : '必须'}移除一个指定时代的可用成就。`, c.state.standard.filter(id => ages.includes(c.card(id).age)), optional ? 0 : 1, 1, true);
  if (selected.length) c.move(selected[0], 'junk', p);
}
export function* rankPick(c, p, ids, count, highest = true, prompt = '选择符合时代顺序的牌。') {
  // Select from a frozen pool: removing a top card must not expose another
  // card as a candidate for a "two highest top cards" instruction.
  const remaining = [...ids], chosen = [];
  while (chosen.length < count && remaining.length) {
    const candidates = (highest ? high : low)(c, remaining);
    const [id] = yield* c.pick(p, prompt, candidates);
    chosen.push(id); remaining.splice(remaining.indexOf(id), 1);
  }
  return chosen;
}
export function exchange(c, a, aTarget, aOwner, b, bTarget, bOwner) {
  // Capture both groups before moving either half; an empty half is still legal.
  return c.exchange([...a], aTarget, aOwner, [...b], bTarget, bOwner);
}

// Moved from the original base-card registry without changing behavior.
// Keep direct candidate lists and the existing left-splay choice prompt.
export const highest = (c, ids) => ids.filter(id => c.card(id).age === Math.max(...ids.map(value => c.card(value).age)));
export const lowest = (c, ids) => ids.filter(id => c.card(id).age === Math.min(...ids.map(value => c.card(value).age)));
export const withIcon = (c, ids, icon) => ids.filter(id => c.card(id).spots.includes(icon));
export const board = (c, p) => c.tops(c.p(p));
export function* pickMoveDirect(c, p, ids, to, prompt, min = 1, max = 1, target = p, keyword = null) {
  return yield* pickMove(c,p,ids,to,prompt,min,max,target,'',keyword);
}
export function* splayLeft(c, p, colors) {
  const options = colors.filter(color => c.p(p).piles[color].length >= 2 && c.p(p).splay[color] !== 'left');
  const names = { RED: '红色', YELLOW: '黄色', GREEN: '绿色', BLUE: '蓝色', PURPLE: '紫色' };
  const chosen = yield* c.choose(p, '可以选择一个颜色向左展开，也可以跳过。', options.map(value => ({ value, label: names[value] })), 0, 1);
  if (chosen.length) c.splay(p, chosen[0], 'left');
}
