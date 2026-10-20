import { colors, all, pickMove, chooseValue } from './effect-helpers.js';
import { isDemand } from './dogma.js';
import { isArtifact } from './artifacts-rules.js';
import { EXPANSIONS } from './expansions.js';

export const demandCard = (c,id) => c.card(id).effects.some(isDemand);
export const artifact = (c,id) => isArtifact(c.card(id));
export const boardCards = (c,p) => colors.flatMap(color=>c.p(p).piles[color]);
export const cardAge = (c,id) => c.card(id)?.age;
export const sameColor = (c,ids,color) => ids.filter(id=>c.card(id).color===color);
export const ageSum = (c,ids) => ids.reduce((sum,id)=>sum+c.card(id).age,0);
export const ownTurn = (c,p) => c.state.turn.player===p;
export const isTop = (c,id) => c.state.players.some(owner=>c.tops(owner).includes(id));
export function* anySet(c,p) {
  const options=[{value:'base',label:'基础版'},...EXPANSIONS.filter(e=>c.state.expansions.includes(e.id)).map(e=>({value:e.id,label:e.name}))];
  return (yield*c.choose(p,'选择一个已启用的牌组。',options))[0];
}
export function* unqualifiedClaim(c,p,values=null,standardOnly=false) {
  const options=[...c.state.standard.filter(id=>!values||values.includes(c.card(id).age)).map(id=>({value:id,label:`时代 ${c.card(id).age} 的标准成就`,age:c.card(id).age})),
    ...(!values&&!standardOnly?c.state.availableSpecials.map(id=>({value:id,label:c.specials.get(id).name_zh})):[])];
  const [id]=yield*c.choose(p,'统御一项可用成就，忽略时代与分数限制。',options);
  if(!id)return null;
  return c.specials.has(id)?(c.claimSpecialId(p,id)?id:null):c.move(id,'achievements',p);
}
export function* standardJunk(c,p) {
  return (yield*pickMove(c,p,[...c.state.standard],'junk','移除一项可用标准成就。'))[0];
}
export function* returnExcept(c,p,zone,count) {
  const ids=[...c.p(p)[zone]],n=Math.max(0,ids.length-count);
  return yield*pickMove(c,p,ids,'return',`归还${zone==='hand'?'手牌':'计分区'}中的 ${n} 张牌，保留 ${Math.min(count,ids.length)} 张。`,n,n);
}
export function* one(c,p,ids,to,prompt='选择一张牌。',target=p,keyword=null) {
  return (yield*pickMove(c,p,ids,to,prompt,1,1,target,'',keyword))[0];
}
export function* artRun(c,p,id) {
  if(!id)return;
  if(ownTurn(c,p))yield*c.superExecute(p,id);else yield*c.selfExecute(p,id);
}
export function* drawMany(c,p,count,age,to='hand',reveal=false,set=null) {
  const ids=[];
  for(let i=0;i<count;i++){const id=c.draw(p,age,to,reveal,set);if(id)ids.push(id);}
  return ids;
}
export function* scoreBottoms(c,p) {
  return yield*all(c,p,colors.map(color=>c.p(p).piles[color][0]).filter(Boolean),'score');
}
export function* junkChosenDeck(c,p) {
  const age=yield*chooseValue(c,p);
  if(age!==null)for(const id of [...(c.state.supply[age]||[])])c.move(id,'junk',p);
}
