import { EXPANSIONS } from './expansions.js';
import { colors, all, pickMove, chooseColor, chooseValue, high, low } from './effect-helpers.js';
import { isFigure } from './figures-rules.js';

export const decree = (color, count = 2) => ({ kind: 'decree', color, count });
export const each = apply => ({ kind: 'each', apply });
export const when = run => ({ kind: 'when', run });
export const would = (events, match, run, replace = false) => ({ kind: 'would', events: Array.isArray(events) ? events : [events], match, run, replace });
export const owned = (p,e) => e.player === p;
export const opposed = (p,e) => e.player !== p;
export const top = (c,p,color) => c.p(p).piles[color].at(-1);
export const fTops = (c,p) => c.tops(c.p(p)).filter(id => isFigure(c.card(id)));
export const boardCards = (c,p) => Object.values(c.p(p).piles).flat();
export const matchingTops = (c,p,predicate) => c.tops(c.p(p)).filter(id => predicate(c.card(id),id));
export const allTops = c => c.state.players.flatMap(p => c.tops(p));
export function addIcon(patch, icon, count) { patch.icons[icon] = (patch.icons[icon] || 0) + count; }
export function* choosePlayer(c,p,prompt='选择一名玩家。') {
  const [id] = yield* c.choose(p,prompt,c.state.players.map(owner=>({value:owner.id,label:owner.name}))); return id;
}
export function* moveOne(c,p,ids,to,prompt='选择一张牌。',optional=false,target=p) {
  return (yield* pickMove(c,p,[...new Set(ids)],to,prompt,optional?0:1,1,target))[0];
}
export function* takeAchievement(c,p,{values=null,eligible=false,exclude=[]}={}) {
  const ids=c.availableAchievements(p).filter(id=>!exclude.includes(id)&&(!values||values.includes(c.card(id)?.age))&&(!eligible||c.eligible(p,id)));
  const special=!values&&!eligible?c.state.availableSpecials.filter(id=>!exclude.includes(id)):[];
  const options=[...ids.map(id=>({value:id,age:c.card(id).age,label:`时代 ${c.card(id).age} 成就`})),...special.map(id=>({value:id,label:c.specials.get(id).name_zh}))];
  const [id]=yield* c.choose(p,'选择统御的成就。',options);
  if(id){if(c.specials.has(id))c.claimSpecialId(p,id);else c.move(id,'achievements',p);}return id;
}
export function* junkAvailable(c,p,values=null,count=1) {
  const ids=c.state.standard.filter(id=>!values||values.includes(c.card(id).age));
  const special=values?[]:c.state.availableSpecials;
  const options=[...ids.map(id=>({value:id,age:c.card(id).age,label:`时代 ${c.card(id).age} 成就`})),...special.map(id=>({value:id,label:c.specials.get(id).name_zh}))];
  const chosen=yield*c.choose(p,'选择移除的可用成就。',options,count,count);
  for(const id of chosen)if(c.specials.has(id))c.specialMove(id,true);else c.move(id,'junk',p);
  return chosen;
}
export function* chooseDeck(c,p,prompt='选择牌库。') {
  const [set]=yield*c.choose(p,prompt,[{value:'base',label:'基础版'},...(c.state.expansions||[]).map(value=>({value,label:EXPANSIONS.find(item=>item.id===value).name}))]);return set;
}
export function* splayChoice(c,p,direction,options=colors) {
  const valid=options.filter(color=>c.p(p).piles[color].length>1&&c.p(p).splay[color]!==direction);
  const color=yield*chooseColor(c,p,valid,false);return color?c.splay(p,color,direction):false;
}
