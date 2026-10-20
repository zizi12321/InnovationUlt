import { colors,hand,tops,pile,score,all,splay,last,fact,got,at,value,hue,icon,condition,draw,take,reveal,optional } from './sentence-helpers.js';
export const ZERO_SENTENCES = {
 'Z001:0':[function*(c,p){yield*splay(c,p,colors.filter(col=>c.p(p).splay[col]==='none'),'left',false);},function*(c,p,r){if(condition(r,!r.previous))c.lose(p,'淡水：前句未完成');}],
 'Z003:0':[function*(c,p){yield*take(c,p,Object.values(c.p(p).piles).flat().filter(id=>icon(c,id,18)),'score');},function*(c,p,r){if(condition(r,r.previous)&&last(r)){const n=c.card(last(r)).spots.filter(i=>i===18).length;for(let i=0;i<n;i++)yield*take(c,p,hand(c,p),'meld');}}],
 'Z004:0':[
  function*(c,p){c.draw(p,c.value(0),'meld');},
  function*(c,p,r){const id=fact(r,'drawn').at(-1)||last(r),col=hue(c,id);for(const o of c.state.players)c.reveal(o.id,[...hand(c,o.id)]);if(col)for(const o of c.state.players)yield*all(c,p,()=>hand(c,o.id).filter(v=>hue(c,v)===col),'hand',p,'','transfer');if(id==='Z001')c.draw(p,c.value(1));},
  function*(c,p,r){if(condition(r,colors.some(col=>hand(c,p).filter(id=>hue(c,id)===col).length>=3)))c.draw(p,c.value(2));},
 ],
 'Z005:0':[function*(c,p){c.draw(p,c.value(0));},function*(c,p,r){const id=last(r);if(condition(r,id&&!icon(c,id,18)))yield*optional(c,p,function*(){c.reveal(p,[id]);c.move(id,'score',p);c.draw(p,c.value(0));});}],
 'Z007:1':[function*(c,p){yield*take(c,p,hand(c,p).filter(id=>pile(c,p,hue(c,id)).length),'meld');},function*(c,p,r){if(condition(r,!r.previous))c.lose(p,'生火：前句未完成');}],
 'Z011:1':[function*(c,p){yield*take(c,p,score(c,p),'meld',1,1,c.other(p),'transfer');},function*(c,p,r){if(condition(r,r.previous)){const col=hue(c,last(r)),target=r.facts.target||c.other(p),id=col&&pile(c,target,col)[0];if(id)c.move(id,'meld',p);}}],
 'Z012:0':[function*(c,p){yield*draw(c,p,2,c.value(0));},function*(c,p,r){yield*take(c,p,fact(r,'drawn'),'return');}],
 'Z013:0':[function*(c,p){yield*take(c,p,tops(c,p).filter(id=>id!=='Z013'&&icon(c,id,18)),'score');},function*(c,p,r){if(condition(r,!r.previous))c.lose(p,'腌制：前句未完成');}],
 'Z014:0':[
  function*(c,p){yield*take(c,p,tops(c,p),'return');},
  function*(c,p){c.draw(p,c.value(0));},
  function*(c,p){c.reveal(p,[...hand(c,p)]);},
  function*(c,p,r){const col=hue(c,fact(r,'returned').at(-1)),ids=hand(c,p).filter(id=>hue(c,id)===col);if(condition(r,ids.length===1))c.move(ids[0],'meld',p);},
  function*(c,p,r){if(condition(r,r.otherwise))c.lose(p,'急救：同色手牌条件未满足');},
 ],
 'Z015:0':[function*(c,p,r){const pool=score(c,p),ids=pool.filter(id=>pile(c,p,hue(c,id)).length);if(ids.length)yield*reveal(c,p,ids);else{c.reveal(p,pool);r.fail();}},function*(c,p,r){if(condition(r,r.previous))c.draw(p,c.value(1));}],
};
