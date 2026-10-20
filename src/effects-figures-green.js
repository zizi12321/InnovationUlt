import { hand, pile, score, has, all, chooseValue, choosePrintedValue, junkDeck } from './effect-helpers.js';
import { decree, each, when, would, owned, allTops, addIcon, moveOne, takeAchievement, junkAvailable, chooseDeck, splayChoice } from './effects-figures-helpers.js';
import { isFigure } from './figures-rules.js';

// 文明巨擘 · GREEN · 终极版；各项业报与官方段落逐一对应。
export const FIGURES_GREEN = {
  F007: [would('draw',(c,p,e)=>owned(p,e)&&e.age>1&&hand(c,p).some(id=>c.card(id).age===c.value(1)),function*(c,p,e){const ids=yield*all(c, p, ()=>hand(c,p), 'return');for(const id of ids)c.draw(p,e.age);})],
  F008: [decree('GREEN'),would('draw',(c,p,e)=>owned(p,e)&&e.actionNumber===1,function*(c,p){c.draw(p,c.value(2),'score');})],
  F009: [would('sharing',(c,p,e)=>owned(p,e)&&!e.eligible,function*(c,p,e){e.eligible=true;yield*junkAvailable(c,p,[1]);},true)],
  F020: [decree('GREEN'),each((b,p,patch)=>{patch[p].dogmaExtra.push(...b.players.flatMap(owner=>owner.piles.BLUE.slice(-1)));})],
  F021: [would('action:dogma',(c,p,e)=>has(c,e.cardId,4),function*(c,p,e){const id=c.draw(p,e.age,'hand',true);if(has(c,id,4)||has(c,id,3))c.move(id,'meld',p);else yield*c.superExecute(e.player,e.cardId);},true)],
  F030: [would(['score','splay'],(c,p,e)=>owned(p,e)&&(e.type==='score'&&!isFigure(c.card(e.cardId))||e.type==='splay'&&e.target===p&&e.direction==='left'),function*(c,p,e){c.splay(p,e.color,'right');},true),each((b,p,patch)=>{patch[p].scoreAdd+=b.visibleCards(b.p(p)).length;})],
  F031: [decree('GREEN'),would('meld',(c,p,e)=>owned(p,e),function*(c,p){const id=c.draw(p,c.value(3),'meld');if(!has(c,id,2))c.move(id,'return',p);})],
  F040: [would('draw',(c,p,e)=>owned(p,e),function*(c,p){junkDeck(c,p,yield*choosePrintedValue(c,p,[4,5]));}),would('meld',(c,p,e)=>owned(p,e),function*(c,p){yield*junkAvailable(c,p,[3,4,5]);})],
  F041: [decree('GREEN'),would('action:dogma',(c,p,e)=>owned(p,e)&&e.age===c.value(1),function*(c,p){if(!c.claimSpecial(p,'WORLD')&&c.tops(c.p(p)).includes('B024'))c.win(p,'卡布拉尔：世界成就不可取得且一神教置顶。');},true)],
  F050: [/* 规则解释："into your hand" 按抽牌的最终去向判断，不计抽取并计分／融合等临时经过手牌。官方未给这种边界的专门例子，保留此注释供核对。 */would('draw',(c,p,e)=>owned(p,e)&&e.destination==='hand'&&hand(c,p).length===4,function*(c,p,e){yield*takeAchievement(c,p,{values:c.values().filter(age=>age<=e.age)});}),would('draw',(c,p,e)=>owned(p,e)&&e.destination==='hand'&&hand(c,p).length===0,function*(c,p){c.draw(p,c.value(6));})],
  F051: [would('action:draw',(c,p,e)=>owned(p,e),function*(c,p){yield*moveOne(c,p,allTops(c).filter(id=>has(c,id,1)),'score','计分任意面板上带繁荣的一张置顶牌。');},true),would('draw',(c,p,e)=>owned(p,e),function*(c,p,e){yield*takeAchievement(c,p,{values:[e.age]});})],
  F060: [each((b,p,patch)=>{addIcon(patch[p],1,b.icons(b.p(p))[1]*2);}),would('action:dogma',(c,p,e)=>owned(p,e)&&!e.share,function*(c,p){const n=c.state.supply[c.value(6)]?.length||0;junkDeck(c,p,c.value(6));if(!n)yield*splayChoice(c,p,'right');})],
  F061: [decree('GREEN'),would('action:draw',(c,p,e)=>owned(p,e),function*(c,p){const id=yield*moveOne(c,p,hand(c,p),'return','归还一张手牌，再从任意已启用套组抽同代牌。');if(id)c.draw(p,c.card(id).age,'hand',false,yield*chooseDeck(c,p));})],
  F070: [would('action:dogma',(c,p,e)=>owned(p,e)&&c.p(p).splay[e.color]==='right',function*(c,p,e){c.splay(p,e.color,'up');}),would('claim',(c,p,e)=>owned(p,e),function*(c,p){for(const owner of c.state.players){const id=owner.piles.YELLOW[0];if(id)c.transfer(id,'standard',p);}})],
  F071: [each((b,p,patch)=>{const icons=b.icons(b.p(p));patch[p].achievementAdd+=Object.keys(icons).filter(icon=>icons[icon]>0&&b.players.filter(owner=>owner.id!==p).every(owner=>icons[icon]>=2*b.icons(owner)[icon])).length;}),would('transfer',()=>true,function*(c,p){junkDeck(c,p,c.value(7));})],
  F080: [decree('GREEN'),would('action:dogma',()=>true,function*(c,p,e){c.splay(p,e.color,'up');})],
  F081: [each((b,p,patch)=>{patch[p].scoreAdd+=b.icons(b.p(p))[6]**2;}),would('score',()=>true,function*(c,p,e){yield*moveOne(c,p,score(c,e.player),'junk','移除该玩家计分区的一张牌。',false,e.player);})],
  F090: [each((b,p,patch)=>{patch[p].specialReduction++;}),would('claim',(c,p,e)=>owned(p,e),function*(c,p){yield*splayChoice(c,p,'up');})],
  F091: [would('action:dogma',(c,p,e)=>owned(p,e),function*(c,p,e){const id=yield*moveOne(c,p,hand(c,p).filter(id=>c.card(id).dogma_icon===e.featuredIcon),'achievements','可以统御一张主导图标相同的手牌，无需资格。',true);if(!id)c.draw(p,c.value(11));})],
  F100: [decree('GREEN'),would('action:dogma',()=>true,function*(c,p,e){const id=pile(c,p,'GREEN')[0];if(id&&(yield*c.yes(p,'是否归还绿色置底牌，使本次条例中所有图标均由你独占多数？'))){if(c.move(id,'return',p))e.majority=p;}})],
  F101: [each((b,p,patch)=>{patch[p].dogmaExtra.push(...b.players.flatMap(owner=>b.tops(owner)));}),would('action:dogma',(c,p,e)=>owned(p,e)&&e.boardOwner!==p,function*(c,p,e){c.splay(p,e.color,'up');})],
  F110: [when(function*(c,p){for(const owner of c.rawPlayers())yield*all(c,p,[...owner.hand,...owner.score,...owner.forecast,...Object.values(owner.piles).flat()],'junk');c.introduceZero();c.draw(p,0);})],
  F111: [would('draw',(c,p,e)=>owned(p,e),function*(c,p){const age=yield*chooseValue(c,p),ids=yield*all(c, p, ()=>c.state.players.flatMap(owner=>owner.score).filter(id=>c.card(id).age===age), 'return');if(ids.length===1)c.move(ids[0],'achievements',p);})],
};
