import { colors, hand, tops, pile, score, all, chooseValue } from './effect-helpers.js';
export const safe = (c,p) => c.p(p).safe;
export const age = (c,id) => c.card(id)?.age;
export const color = (c,id) => c.card(id)?.color;
export const boardCards = (c,p) => Object.values(c.p(p).piles).flat();
export const standard = (c,values=null) => c.state.standard.filter(id=>!values||values.includes(age(c,id)));
export const ofColor = (c,ids,value) => ids.filter(id=>color(c,id)===value);
export const ofAge = (c,ids,value) => ids.filter(id=>age(c,id)===value);
export const top = (c,p,col) => pile(c,p,col).at(-1);
export const empty = function*(){};
export function* one(c,p,ids,to,prompt='选择一张牌。',optional=false,target=p,keyword=null) {
  const [id]=yield*c.pick(p,prompt,[...new Set(ids)],optional?0:1,1);
  return id&&c.move(id,to,target,'',keyword);
}
export function* safeguard(c,p,ids,optional=false,prompt='选择一张牌保密。') {
  if(safe(c,p).length>=c.safeLimit(c.p(p)))return null;
  return yield*one(c,p,ids,'safeguard',prompt,optional);
}
export function* safeguardAvailable(c,p,values=null,optional=false) {
  return yield*safeguard(c,p,standard(c,values),optional,'保密一张符合时代的可用标准成就。');
}
export function* drawMany(c,p,n,value,to='hand',reveal=false){
  const ids=[];for(let i=0;i<n;i++){const id=c.draw(p,value,to,reveal);if(id&&c.didDraw(id,to))ids.push(id);}return ids;
}
export function* chooseMode(c,p,entries,optional=false,prompt='选择一种效果。'){
  const options=entries.map(([value,label])=>({value,label}));
  const [value]=yield*c.choose(p,prompt,options,optional?0:1,1);return value;
}
export function* group(c,p,ids,n,valid,prompt,optional=false) {
  const combinations=[];
  function visit(start,chosen){if(chosen.length===n){if(valid(chosen))combinations.push(chosen);return;}for(let i=start;i<ids.length;i++)visit(i+1,[...chosen,ids[i]]);}
  visit(0,[]);
  if(!combinations.length)return [];
  if(optional&&!(yield*c.yes(p,prompt)))return [];
  const result=[];
  while(result.length<n){
    const possible=[...new Set(combinations.filter(xs=>result.every(x=>xs.includes(x))).flat())].filter(x=>!result.includes(x));
    const [id]=yield*c.pick(p,prompt,possible);result.push(id);
  }
  return result;
}
export function* scoreHandValue(c,p,optional=false) {
  const values=[...new Set(hand(c,p).map(id=>age(c,id)))];
  if(!values.length||optional&&!(yield*c.yes(p,'可以选择一个时代，计分该时代的所有手牌。')))return [];
  const value=yield*chooseValue(c,p,values);
  return yield*all(c,p,()=>ofAge(c,hand(c,p),value),'score');
}
export function* untie(c,p,owner=p,prompt='选择一个已展开的颜色还原。') {
  const choices=colors.filter(col=>c.p(owner).splay[col]!=='none');
  const [col]=yield*c.choose(p,prompt,choices.map(value=>({value,label:value})));
  return col&&c.splay(owner,col,'none',p)?col:null;
}
export function* revealPick(c,chooser,owner,ids,prompt='选择一张展示的牌。'){
  c.reveal(owner,ids);return (yield*c.pick(chooser,prompt,ids))[0];
}
