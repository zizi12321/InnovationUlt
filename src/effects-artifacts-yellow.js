import { colors, hand, tops, pile, score, has, high, topAge, pickMove, all, chooseColor, chooseValue, junkDeck } from './effect-helpers.js';
import { visibleCount, pickByTrait, allByTrait } from './effects-echoes-helpers.js';
import { cardAge, sameColor, ownTurn, isTop, unqualifiedClaim, standardJunk, one, artRun, drawMany } from './effects-artifacts-helpers.js';

// 岁月遗珍 · YELLOW · 官方终极版卡面顺序。
export const ARTIFACTS_YELLOW_EFFECTS = {
  A004: [
    function*(c,p){c.transfer('A004','meld',p);},
    function*(c,p){if(ownTurn(c,p)&&c.state.players.filter(owner=>owner.id!==p).every(owner=>c.dancingGirlVisited(owner.id)))c.win(p,'舞女在本次行动中到过所有对手的面板。');}
  ],
  A005: [function*(c,p){while(true){const id=yield*one(c,p,[...hand(c,p)],'meld','融合一张手牌。');if(!id)return;const moved=yield*all(c,p,()=>pile(c,p,c.card(id).color).filter(value=>value!==id),'score');if(!moved.length)return;}}],
  A006: [function*(c,p){const ids=yield*c.pick(p,'展示三张手牌；不足时展示全部。',[...hand(c,p)],3,3);c.reveal(p,ids);const scored=yield*pickMove(c,p,ids,'score','从展示的牌中计分两张。',2,2);const rest=ids.filter(id=>hand(c,p).includes(id));yield*one(c,p,rest,'tuck','垫底剩下的一张牌。');if(scored.length===2&&c.card(scored[0]).color===c.card(scored[1]).color)yield*drawMany(c,p,3,c.value(1));}],
  A018: [function*(c,p){const id=yield*one(c,p,[...hand(c,p)],'return','归还一张手牌。');if(id)yield*unqualifiedClaim(c,p,[cardAge(c,id)]);}],
  A019: [
    function*(c,p){yield*one(c,p,tops(c,p).filter(id=>!has(c,id,4)),'return','强迫：归还一张没有权威的置顶牌。');},
    function*(c,p){const ids=yield*pickByTrait(c,p,'hand',id=>!has(c,id,4),'score','计分一张没有权威的手牌。');if(ids.length)junkDeck(c,p,cardAge(c,ids[0]));else c.move('A019','tuck',p);}
  ],
  A028: [function*(c,p){c.reveal(p,[...hand(c,p)]);const [id]=yield*c.pick(c.actor,`选择${c.p(p).name}展示的一张手牌转移到你的面板。`,[...hand(c,p)]);if(id){const age=cardAge(c,id);if(c.transfer(id,'meld',c.actor))junkDeck(c,p,age);}}],
  A029: [function*(c,p){while(true){const id=c.draw(p,c.value(4),'hand',true);if(!id)return;const color=c.card(id).color;if(color==='YELLOW')c.move(id,'tuck',p);if(color==='PURPLE'){c.move(id,'score',p);return;}
    // Official English: "Otherwise" belongs to the second (purple) if.
    // A yellow card is tucked and then the effect repeats.
  }}],
  A038: [
    function*(c,p){yield*all(c,p,tops(c,p).filter(id=>has(c,id,1)),'score',c.actor,'','transfer');},
    function*(c,p){yield*one(c,p,tops(c,p).filter(id=>has(c,id,1)),'score','计分一张带繁荣的置顶牌。');}
  ],
  A039: [function*(c,p){const [number]=yield*c.choose(p,'选择手牌中所选颜色应有的确切张数。',Array.from({length:c.cards.size+1},(_,n)=>({value:String(n),label:`${n} 张`})));const color=yield*chooseColor(c,p);yield*drawMany(c,p,5,c.value(4));c.reveal(p,[...hand(c,p)]);const ids=sameColor(c,hand(c,p),color);if(ids.length===Number(number)){yield*all(c,p,ids,'score');c.splay(p,color,'right');}else yield*all(c,p,()=>hand(c,p),'return');}],
  A048: [function*(c,p){if(!ownTurn(c,p))return;const [id]=yield*c.pick(p,'选择其他玩家的另一张置顶牌，超执行它。',c.state.players.filter(owner=>owner.id!==p).flatMap(owner=>c.tops(owner)).filter(id=>id!=='A048'));if(id)yield*c.superExecute(p,id);}],
  A049: [function*(c,p){const id=c.draw(p,c.value(6),'hand',true);if(!id)return;const color=c.card(id).color;c.move(id,'return',p);const melded=c.draw(p,topAge(c,p,color),'meld');if(melded&&c.didDraw(melded,'meld'))yield*c.selfExecute(p,melded);}],
  A058: [function*(c,p){const red=pile(c,p,'RED').at(-1);if(red)c.transfer(red,'score',c.actor);const green=pile(c,p,'GREEN').at(-1);if(green)c.transfer(green,'meld',c.actor);yield*pickByTrait(c,p,'score',id=>c.card(id).color==='YELLOW','score','转移一张黄色计分牌。',1,1,c.actor,'transfer');yield*pickByTrait(c,p,'score',id=>c.card(id).color==='PURPLE','hand','转移一张紫色计分牌至发动者手牌。',1,1,c.actor,'transfer');}],
  A059: [function*(c,p){while(true){const id=c.draw(p,c.value(6),'meld');if(!id)return;const color=c.card(id).color,n=visibleCount(c,p,color);if(!colors.every(col=>n<=visibleCount(c,p,col))||!c.move(id,'score',p))return;}}],
  A068: [function*(c,p){c.reveal(p,[...hand(c,p)]);const id=c.draw(p,c.value(7));if(id&&hand(c,p).some(other=>other!==id&&c.card(other).color===c.card(id).color)){yield*all(c,p,()=>hand(c,p),'return');yield*all(c,p,()=>score(c,p),'return');}}],
  A069: [function*(c,p){const id=yield*one(c,p,[...hand(c,p)],'tuck','垫底一张手牌。');if(!id)return;const color=c.card(id).color;c.splay(p,color,'up');const ids=yield*allByTrait(c,p,'score',value=>c.card(value).color===color,'tuck');if(ids.length)yield*standardJunk(c,p);}],
  A078: [function*(c,p){const age=yield*chooseValue(c,p);for(const color of colors)if(topAge(c,p,color)===age&&pile(c,p,color).length)c.splay(p,color,'up');for(const owner of c.state.players)yield*all(c,p,()=>score(c,owner.id).filter(id=>cardAge(c,id)===age),'return');}],
  A079: [function*(c,p){while(true){const id=c.draw(p,c.value(8));if(!id)return;if(c.card(id).color==='GREEN'){if(isTop(c,'A079'))c.move('A079','achievements',p);return;}if(!has(c,id,6))return;const color=c.card(id).color;c.move(id,'return',p);const top=pile(c,p,color).at(-1);if(!top||!has(c,top,6))return;c.transfer(top,'achievements',c.actor);}}],
  A088: [
    function*(c,p){const n=tops(c,p).filter(id=>has(c,id,6)).length;yield*drawMany(c,p,n,c.value(9),'score');},
    function*(c,p){junkDeck(c,p,score(c,p).length);}
  ],
  A089: [function*(c,p){const ids=yield*drawMany(c,p,2,c.value(10),'meld');if(ids.length===2&&ids.every(id=>c.didDraw(id,'meld'))&&c.card(ids[0]).color===c.card(ids[1]).color)c.win(p,'奥德赛融合了两张同色牌。');}],
  A098: [
    function*(c,p){const bottom=pile(c,p,'YELLOW')[0];if(bottom&&(yield*c.yes(p,'可以计分最底部的黄色牌。')))c.move(bottom,'score',p);if(yield*c.yes(p,'可以抽取并垫底一张时代 1 的牌。'))c.draw(p,c.value(1),'tuck');if(pile(c,p,'YELLOW')[0]==='B005')c.win(p,'多莉羊：黄色底牌是驯化。');else{yield*one(c,p,high(c,hand(c,p)),'meld','融合最高的手牌。');c.draw(p,c.value(11));}},
    function*(c,p){yield*all(c,p,()=>c.state.standard,'junk');for(const id of [...c.state.availableSpecials])c.specialMove(id,true);}
  ],
  A099: [function*(c,p){c.win(p,'找到威利，立即获胜。');}],
  A108: [function*(c,p){const ids=yield*drawMany(c,p,2,c.value(11));const first=yield*one(c,p,ids.filter(id=>hand(c,p).includes(id)),'meld','先融合其中一张。');const second=yield*one(c,p,ids.filter(id=>id!==first&&hand(c,p).includes(id)),'meld','再融合另一张，并执行其效果。');if(second)yield*artRun(c,p,second);}],
  A109: [function*(c,p){while(true){const [a]=yield*c.pick(p,'选择一张计分牌。',[...score(c,p)]);if(!a)return;const [b]=yield*c.pick(p,'选择任意玩家同色置顶牌，与计分牌交换。',c.state.players.flatMap(owner=>c.tops(owner)).filter(id=>c.card(id).color===c.card(a).color));if(b){const owner=c.location(b).owner.id;c.exchange([a],'meld',owner,[b],'score',p);}if(hand(c,p).length<2||!(yield*c.yes(p,'可以归还两张手牌，然后重复。')))return;const ids=yield*pickMove(c,p,[...hand(c,p)],'return','归还两张手牌。',2,2);if(ids.length!==2)return;}}],
};
