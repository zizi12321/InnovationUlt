import { colors, hand, pile, score, has, all, chooseColor, chooseValue, choosePrintedValue, junkDeck } from './effect-helpers.js';
import { decree, each, would, owned, opposed, top, allTops, addIcon, choosePlayer, moveOne } from './effects-figures-helpers.js';
import { isFigure } from './figures-rules.js';

// 文明巨擘 · BLUE · 终极版；各项业报与官方段落逐一对应。
export const FIGURES_BLUE = {
  F010: [each((b,p,patch)=>{patch[p].achievementAgeAdd+=colors.filter(color=>b.p(p).piles[color].length&&b.p(p).splay[color]==='none').length;})],
  F011: [would('action:dogma',(c,p,e)=>owned(p,e)&&e.age===c.value(1)&&e.actionNumber===2,function*(c,p){const id=c.draw(p,c.value(2),'meld'),color=c.card(id).color,changed=c.splay(p,color,'left');if(changed&&c.card(id).age===c.value(2))yield*all(c,p,c.state.players.flatMap(owner=>owner.piles[color].slice(-1)),'return');})],
  F012: [decree('BLUE'),would('action:dogma',(c,p,e)=>owned(p,e)&&e.featuredIcon===2,function*(c,p){c.draw(p,c.value(2));})],
  F022: [decree('BLUE'),would('effect',(c,p,e)=>owned(p,e),function*(c,p,e){e.valueShift++;})],
  F023: [would('claim',()=>true,function*(c,p){const id=c.draw(p,c.value(3),'tuck'),list=pile(c,p,c.card(id).color),index=list.indexOf(id);if(index>=0)yield*all(c,p,list.slice(index+1),'score');})],
  F032: [would('action:draw',(c,p,e)=>owned(p,e),function*(c,p){yield*moveOne(c,p,allTops(c).filter(id=>has(c,id,4)),'tuck','垫底任意面板上一张带权威的置顶牌。');const color=yield*chooseColor(c,p,colors.filter(color=>pile(c,p,color).length));if(color)c.draw(p,c.visible(c.p(p),color).filter(mark=>[4,3].includes(mark.icon)).length);},true)],
  F033: [decree('BLUE'),would('meld',(c,p,e)=>owned(p,e)&&top(c,p,'RED')&&e.age===c.card(top(c,p,'RED')).age,function*(c,p,e){c.move(e.cardId,'return',p);c.draw(p,e.age+1,'meld');},true)],
  F042: [decree('BLUE'),would('action:draw',(c,p,e)=>owned(p,e),function*(c,p){const id=c.draw(p,c.value(5),'hand',true);c.splay(p,c.card(id).color,'right');if(has(c,id,3))c.move(id,'meld',p);},true)],
  F043: [would('action:dogma',(c,p,e)=>owned(p,e),function*(c,p,e){e.valueShift+=new Set(c.tops(c.p(p)).map(id=>c.card(id).age).filter(age=>age>3)).size;e.continueOriginal=true;},true)],
  F052: [would('action:draw',(c,p,e)=>owned(p,e),function*(c,p){const id=c.draw(p,c.value(1)),target=yield*choosePlayer(c,p);c.transfer(id,'meld',target);}),would('action:dogma',(c,p,e)=>owned(p,e),function*(c,p,e){for(const id of c.tops(c.p(p)).filter(id=>c.card(id).age===e.age))c.splay(p,c.card(id).color,'right');})],
  F053: [would('action:dogma',(c,p,e)=>owned(p,e)&&e.actionNumber===1,function*(c,p){junkDeck(c,p,c.value(6));const age=yield*choosePrintedValue(c,p,[7,8,9]),n=age===c.value(7)?1:age===c.value(8)?2:3,ids=Array.from({length:n},()=>c.draw(p,age,'hand',true));if(ids.reduce((sum,id)=>sum+c.card(id).spots.filter(icon=>icon===6).length,0)>c.icons(c.p(p))[6])yield*all(c,p,ids,'return');},true)],
  F062: [would('meld',(c,p,e)=>owned(p,e),function*(c,p,e){const age=yield*chooseValue(c,p);yield*all(c, p, ()=>[...hand(c,p),...score(c,p)].filter(id=>id!==e.cardId&&c.card(id).age===age), 'meld');}),would('action:draw',(c,p,e)=>owned(p,e),function*(c,p){c.draw(p,c.value(7));})],
  F063: [decree('BLUE'),would('meld',(c,p,e)=>owned(p,e),function*(c,p,e){const id=top(c,c.other(p),e.color);if(id&&isFigure(c.card(id)))c.transfer(id,'hand',p);})],
  F072: [decree('BLUE'),would('claim',(c,p,e)=>owned(p,e),function*(c,p){if(c.state.players.every(owner=>c.achievements(owner)<=c.achievements(c.p(p))))c.win(p,'达尔文：即将统御且无人拥有更多成就。');else c.draw(p,c.value(8));})],
  F073: [each((b,p,patch)=>{const icons=b.icons(b.p(p));for(const icon of Object.keys(icons))if(icons[icon]>0)addIcon(patch[p],icon,b.p(p).hand.length);}),would('return',(c,p,e)=>e.age<8,function*(c,p){c.draw(p,c.value(8));})],
  F082: [each((b,p,patch)=>{patch[p].achievementAdd+=new Set(b.p(p).score.map(id=>b.card(id).age).filter(age=>age>6)).size;}),would('draw',(c,p,e)=>owned(p,e)&&!hand(c,p).some(id=>c.card(id).age===e.age),function*(c,p){c.draw(p,c.value(9));})],
  F083: [decree('BLUE'),would('action:draw',(c,p,e)=>owned(p,e),function*(c,p){for(const owner of c.state.players)c.reveal(owner.id,owner.hand);yield*all(c,p,c.state.players.flatMap(owner=>owner.hand).filter(id=>has(c,id,3)||has(c,id,6)),'meld');})],
  F092: [would('no-share-bonus',(c,p,e)=>opposed(p,e),function*(c,p){const id=c.draw(p,c.value(10),'hand',true);if(c.card(id).color==='BLUE')c.win(p,'霍珀：对手无分享奖励，展示的时代 10 为蓝色。');})],
  F093: [would('draw',(c,p,e)=>e.set==='figures',function*(c,p){junkDeck(c,p,yield*choosePrintedValue(c,p,[9,10]));}),each((b,p,patch)=>{patch[p].scoreExtra.push(...b.state.junk.filter(id=>b.card(id)?.age>=0));})],
  F102: [would(['share-bonus','no-share-bonus'],(c,p,e)=>e.type==='share-bonus'?owned(p,e):opposed(p,e),function*(c,p,e){yield*c.selfExecute(p,e.cardId);})],
  F103: [would('action:dogma',(c,p,e)=>owned(p,e),function*(c,p,e){const n=c.visible(c.p(p),e.color).filter(mark=>mark.icon===0).length;for(let i=0;i<n;i++){const id=pile(c,p,e.color)[0];if(id)c.move(id,'score',p);}}),would('draw',(c,p,e)=>owned(p,e),function*(c,p,e){c.draw(p,e.age,'tuck');})],
  F112: [would('effect',(c,p,e)=>owned(p,e)&&!e.echo,function*(c,p){c.draw(p,c.value(9),'score');})],
  F113: [would('action:dogma',(c,p,e)=>owned(p,e)&&e.actionNumber===2,function*(c,p){for(const color of ['RED','BLUE','GREEN','YELLOW','PURPLE']){const id=top(c,p,color);if(id)yield*c.superExecute(p,id);}},true)],
};
