import { colors, hand, tops, pile, score, has, high, low, maxAge, topAge, colorCount, pickMove, all, chooseColor, chooseValue, choosePrintedValue, splay, junkDeck } from './effect-helpers.js';
export { colors, hand, tops, pile, score, has, high, low, maxAge, topAge, colorCount, pickMove, all, chooseColor, chooseValue, choosePrintedValue, splay, junkDeck };
export const last = r => r.facts.lastCard;
export const fact = (r,key) => r.facts[key]||[];
export const got = (r,key) => fact(r,key).length;
export const at = (c,p,col) => col&&pile(c,p,col).at(-1);
export const value = (c,id) => c.card(id)?.age||0;
export const hue = (c,id) => c.card(id)?.color;
export const icon = (c,id,n) => !!id&&has(c,id,n);
export const condition = (r,yes) => {r.condition=!!yes;return !!yes;};
export function* draw(c,p,n,age,to='hand',reveal=false){for(let i=0;i<n;i++)c.draw(p,age,to,reveal);}
export function* take(c,p,ids,to,min=1,max=min,target=p,keyword=null){
  return yield*pickMove(c,p,ids,to,'提词器：按当前句子选择卡牌。',min,max,target,'',keyword);
}
export function* reveal(c,p,ids,min=1,max=min){
  const selected=yield*c.pick(p,'提词器：选择要展示的牌。',ids,min,max);c.reveal(p,selected);return selected;
}
export function* optional(c,p,work,prompt='提词器：可以执行此句操作。'){if(yield*c.yes(p,prompt))return yield*work();}
export function* doIf(c,p,r,work){if(condition(r,r.previous))return yield*work();}
export function* repeatIf(c,p,r,yes){if(condition(r,yes))yield*r.repeat();}
export function* returnTop(c,p,ids=tops(c,p)){return yield*take(c,p,ids,'return');}
export function* topScore(c,p,col){const id=at(c,p,col);if(id)c.move(id,'score',p);}
