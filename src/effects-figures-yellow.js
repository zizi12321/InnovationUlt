import { colors, hand, score, has, high, low, pickMove, all, chooseValue } from './effect-helpers.js';
import { decree, each, would, owned, opposed, top, fTops, matchingTops, allTops, moveOne, junkAvailable } from './effects-figures-helpers.js';
import { isFigure } from './figures-rules.js';

// 文明巨擘 · YELLOW · 终极版；各项业报与官方段落逐一对应。
export const FIGURES_YELLOW = {
  F004: [would('meld',(c,p,e)=>owned(p,e)&&e.meldAction&&!isFigure(c.card(e.cardId)),function*(c,p,e){yield*c.selfExecute(p,e.cardId);},true),would(['tuck','score'],(c,p,e)=>owned(p,e)&&c.turnCount(p,e.type)===5,function*(c,p){c.draw(p,c.value(1),'achievements');})],
  F005: [would('draw',(c,p,e)=>owned(p,e)&&e.age===c.value(1)&&e.actionNumber===1,function*(c,p){c.draw(p,hand(c,p).filter(id=>c.card(id).age===c.value(1)).length,'score');})],
  F006: [decree('YELLOW'),would('meld',(c,p,e)=>owned(p,e),function*(c,p){const id=c.draw(p,c.value(2),'tuck');if(!has(c,id,4))c.move(id,'return',p);})],
  F018: [decree('YELLOW'),would('action:decree',(c,p,e)=>owned(p,e),function*(c,p){yield*all(c, p, ()=>hand(c,c.other(p)), 'junk');})],
  F019: [would('score',()=>true,function*(c,p){for(const color of colors)c.splay(p,color,'left');}),each((b,p,patch)=>{patch[p].achievementExtra.push(...b.tops(b.p(p)).filter(id=>b.p(p).splay[b.card(id).color]==='none'));})],
  F028: [decree('YELLOW'),would('action:dogma',(c,p,e)=>owned(p,e)&&e.actionNumber===1,function*(c,p){const id=yield*moveOne(c,p,low(c,c.state.standard),'junk','移除最低时代的一张可用标准成就，然后超执行。');if(id)yield*c.superExecute(p,id);},true)],
  F029: [would('draw',(c,p,e)=>owned(p,e),function*(c,p,e){yield*moveOne(c,p,[...hand(c,p),...score(c,c.other(p))].filter(id=>c.card(id).age===e.age),'tuck','从自己手牌或对手计分区垫底一张同代牌。');})],
  F038: [would('meld',(c,p,e)=>owned(p,e),function*(c,p,e){const id=yield*moveOne(c,p,hand(c,p).filter(id=>id!==e.cardId),'meld','先融合另一张手牌。');if(id&&c.card(id).color==='PURPLE'){for(let i=0;i<3;i++)c.draw(p,c.value(4));yield*moveOne(c,p,c.state.players.flatMap(owner=>fTops(c,owner.id)),'score','计分任意面板上的一张置顶伟人。');}})],
  F039: [each((b,p,patch)=>{patch[p].scoreExtra.push(...b.p(p).hand);})],
  F048: [each((b,p,patch)=>{for(const id of b.p(p).hand){const age=b.card(id).age;patch[p].eligibilityByAge[age]=(patch[p].eligibilityByAge[age]||0)+10;}}),would('draw',(c,p,e)=>owned(p,e),function*(c,p){const id=yield*moveOne(c,p,hand(c,p).filter(id=>c.card(id).age===c.value(5)),'return','可以归还一张时代 5 手牌，再抽时代 6。',true);if(id)c.draw(p,c.value(6));})],
  F049: [decree('YELLOW'),each((b,p,patch)=>{patch[p].scoreAdd+=b.icons(b.p(p))[5]*b.achievements(b.p(p));})],
  F058: [decree('YELLOW'),each((b,p,patch)=>{patch[p].achievementExtra.push(...b.tops(b.p(p)).filter(id=>b.card(id).spots.includes(5)));})],
  F059: [would('demand',(c,p,e)=>e.target===p,function*(c,p){yield*moveOne(c,p,hand(c,p),'return','归还一张手牌代替执行该要求。');},true),would('score',(c,p,e)=>opposed(p,e),function*(c,p,e){yield*junkAvailable(c,p,[e.age]);})],
  F068: [would('claim',(c,p,e)=>owned(p,e),function*(c,p,e){const ids=yield*pickMove(c,p,hand(c,p),'return','先归还三张手牌。',3,3);if(ids.length===3)yield*all(c, p, ()=>hand(c,p).filter(id=>id!==e.cardId), 'achievements');})],
  F069: [decree('YELLOW'),would(['transfer','return','score','meld','junk'],(c,p,e)=>c.scoreCards(p).includes(e.cardId),function*(){},true)],
  F078: [would('action:dogma',(c,p,e)=>c.p(p).splay[e.color]!=='left',function*(c,p,e){const choices=c.state.players.filter(owner=>owner.piles[e.color].length>=2&&owner.splay[e.color]!=='left');const [target]=yield*c.choose(p,'将任意玩家该颜色向左展开。',choices.map(owner=>({value:owner.id,label:owner.name})));const changed=target&&c.splay(target,e.color,'left');c.draw(p,c.value(2));c.draw(p,c.value(2));if(changed&&target===p&&colors.every(color=>c.p(p).splay[color]==='left'))c.win(p,'克罗斯比：以此业报使第五种颜色向左展开。');})],
  F079: [decree('YELLOW'),would('meld',(c,p,e)=>owned(p,e),function*(c,p){const id=yield*moveOne(c,p,matchingTops(c,c.other(p),card=>!card.spots.includes(3)&&!card.spots.includes(6)),'score','计分对手一张既无概念也无效率的置顶牌。');if(id&&high(c,score(c,p)).includes(id))c.draw(p,c.value(9));})],
  F088: [would('meld',(c,p,e)=>owned(p,e),function*(c,p,e){for(const owner of c.state.players)c.reveal(owner.id,owner.hand);const ids=yield*all(c,p,c.state.players.flatMap(owner=>owner.hand).filter(id=>id!==e.cardId&&c.card(id).color===e.color),'meld');for(const id of ids)c.draw(p,c.value(9),'achievements');})],
  F089: [would('meld',(c,p,e)=>owned(p,e),function*(c,p){const id=c.draw(p,c.value(9),'score');if(c.card(id).color==='YELLOW'){yield*all(c, p, ()=>c.state.players.flatMap(owner=>owner.score), 'junk');yield*all(c, p, ()=>c.state.standard, 'junk');for(const id of [...c.state.availableSpecials])c.specialMove(id,true);}})],
  F098: [would('draw',(c,p,e)=>owned(p,e)&&!hand(c,p).some(id=>isFigure(c.card(id))),function*(c,p){const options=[...c.cards.values()].filter(isFigure);const [id]=yield*c.choose(p,'说出“谁是”，并指定一位伟人；随后搜索该时代伟人牌库并洗牌。',options.map(card=>({value:card.id,label:`谁是 ${card.name_zh}（时代 ${card.age}）`,age:card.age})));if(id){const age=yield*chooseValue(c,p,Array.from({length:11},(_,i)=>i+1),'选择搜索并重新洗牌的伟人时代牌库。'),deck=c.state.expansionSupply.figures[age];if(deck.includes(id))c.transfer(id,'hand',p);c.shuffle(deck);}})],
  F099: [would('action:dogma',(c,p,e)=>owned(p,e)&&e.featuredIcon===6,function*(c,p){if([1,3,6].includes(c.icons(c.p(p))[6]))c.win(p,'宫本茂：以效率发动条例时恰有 1、3 或 6 个效率。');})],
  F108: [would('action:dogma',()=>true,function*(c,p,e){yield*moveOne(c,p,allTops(c).filter(id=>id!==e.cardId&&has(c,id,5)),'junk','移除另一张带工业的置顶牌。');if(!allTops(c).some(id=>has(c,id,5)))c.win(p,'通贝里：任意面板上均无带工业的置顶牌。');})],
  F109: [would('action:dogma',(c,p,e)=>opposed(p,e),function*(c,p,e){yield*c.asExecutor(e.player,function*(){const id=c.draw(e.player,yield*chooseValue(c,e.player),'hand',true),color=c.card(id).color;c.move(id,'return',e.player);const target=top(c,e.player,color);if(target)yield*c.superExecute(e.player,target);});},true)],
};
