import { colors, hand, tops, pile, score, has, high, low, topAge, all, chooseColor, chooseValue, junkDeck } from './effect-helpers.js';
import { visibleCount, pickByTrait } from './effects-echoes-helpers.js';
import { demandCard, boardCards, cardAge, anySet, returnExcept, one, drawMany, junkChosenDeck } from './effects-artifacts-helpers.js';

// 岁月遗珍 · RED · 官方终极版卡面顺序。
export const ARTIFACTS_RED_EFFECTS = {
  A001: [
    function*(c,p){const id=yield*one(c,p,high(c,tops(c,p).filter(id=>has(c,id,4))),'hand','强迫：将最高的带权威置顶牌转移给发动者。',c.actor,'transfer');if(!id)junkDeck(c,p,cardAge(c,low(c,tops(c,p))[0]));},
    function*(c,p){c.draw(p,c.value(2));}
  ],
  A002: [function*(c,p){const id=yield*pickByTrait(c,p,'hand',id=>c.card(id).color==='PURPLE','return','归还一张紫色手牌。');if(!id.length)return;const set=yield*anySet(c,p),drawn=c.draw(p,cardAge(c,id[0])+2,'hand',true,set);if(drawn&&c.card(drawn).color==='PURPLE'&&c.move(drawn,'meld',p))yield*c.selfExecute(p,drawn);}],
  A003: [function*(c,p){const ids=yield*drawMany(c,p,3,topAge(c,p,'GREEN'));const returned=yield*one(c,p,ids.filter(id=>hand(c,p).includes(id)),'return','归还刚抽到的一张牌。');yield*one(c,p,ids.filter(id=>id!==returned&&hand(c,p).includes(id)),'score','计分刚抽到的另一张牌。');}],
  A016: [
    function*(c,p){if([4,1].some(icon=>c.state.players.filter(owner=>owner.id!==p).every(owner=>c.iconCompare(c.p(p),owner,icon)<0)))c.draw(p,c.value(3));},
    function*(c,p){if(c.state.players.filter(owner=>owner.id!==p).every(owner=>c.iconCompare(c.p(p),owner,3)<0))c.draw(p,c.value(4));}
  ],
  A017: [
    function*(c,p){yield*one(c,p,tops(c,p).filter(id=>c.card(id).color!=='RED'&&has(c,id,4)),'meld','强迫：转移带权威的非红色置顶牌。',c.actor,'transfer');},
    function*(c,p){c.draw(p,c.value(3),'score');}
  ],
  A026: [function*(c,p){yield*one(c,p,tops(c,p).filter(id=>cardAge(c,id)>topAge(c,c.actor,c.card(id).color)),'meld','强迫：转移比发动者同色置顶牌时代更高的置顶牌。',c.actor,'transfer');}],
  A027: [function*(c,p){const [id]=yield*c.pick(p,'强迫：选择一种置顶颜色，转移该色所有牌至发动者计分区。',tops(c,p));if(id)yield*all(c,p,()=>pile(c,p,c.card(id).color),'score',c.actor,'','transfer');}],
  A036: [function*(c,p){const age=yield*chooseValue(c,p,c.values().filter(v=>v!==c.value(5)));const affected=[];for(const owner of c.state.players){
    const returned=yield*all(c,p,()=>score(c,owner.id).filter(id=>cardAge(c,id)===age),'return');if(returned.length)affected.push(owner.id);}
    const drawn=yield*drawMany(c,p,affected.length,c.value(5),'score');if(drawn.length&&drawn.every(id=>c.didDraw(id,'score',c.value(5))))junkDeck(c,p,age);
  }],
  A037: [function*(c,p){const age=yield*chooseValue(c,c.actor);c.reveal(p,[...score(c,p)]);const ids=yield*all(c,p,()=>score(c,p).filter(id=>cardAge(c,id)===age),'score',c.actor,'','transfer');if(ids.length)yield*one(c,p,tops(c,p).filter(id=>cardAge(c,id)===age),'meld','转移一张同代置顶牌。',c.actor,'transfer');}],
  A046: [function*(c,p){const color=yield*chooseColor(c,p,colors.filter(color=>visibleCount(c,p,color)>visibleCount(c,c.actor,color)));if(!color)return;for(const id of [...pile(c,c.actor,color)])c.transfer(id,'score',c.actor);for(const id of [...pile(c,p,color)])c.transfer(id,'meld',c.actor);}],
  A047: [function*(c,p){if(!score(c,p).length){const color=yield*chooseColor(c,p);yield*all(c,p,()=>pile(c,p,color),'score');}else yield*all(c,p,()=>score(c,p),'return');}],
  A056: [function*(c,p){const [id]=yield*c.pick(p,'强迫：展示一张手牌。',[...hand(c,p)]);if(!id)return;c.reveal(p,[id]);if(tops(c,c.actor).some(top=>cardAge(c,top)===cardAge(c,id))){const color=c.card(id).color;c.move(id,'return',p);yield*all(c,p,()=>pile(c,p,color),'return');}}],
  A057: [function*(c,p){yield*one(c,p,high(c,hand(c,p)),'hand','强迫：转移最高的手牌。',c.actor,'transfer');yield*one(c,p,high(c,score(c,p)),'score','强迫：转移最高的计分牌。',c.actor,'transfer');yield*one(c,p,high(c,tops(c,p).filter(id=>has(c,id,5))),'meld','强迫：转移最高的带工业置顶牌。',c.actor,'transfer');}],
  A066: [function*(c,p){const id=c.draw(p,c.value(7),'meld');if(!id)return;const color=c.card(id).color,bottom=pile(c,p,color)[0];if(bottom){c.reveal(p,[bottom]);if(cardAge(c,bottom)%2===0)yield*all(c,p,()=>pile(c,p,color),'return');}}],
  A067: [
    function*(c,p){c.draw(p,c.value(8),'score');},
    function*(c,p){const id=c.draw(p,c.value(8),'meld');if(id&&cardAge(c,id)===c.value(8))yield*junkChosenDeck(c,p);}
  ],
  A076: [function*(c,p){const id=c.draw(p,c.value(8),'hand',true);if(id)yield*all(c,p,()=>pile(c,p,c.card(id).color),'return');}],
  A077: [],
  A086: [
    function*(c,p){const cols=colors.filter(color=>pile(c,p,color).length&&demandCard(c,pile(c,p,color).at(-1)));for(const color of cols)for(const id of pile(c,p,color).slice(0,2))c.transfer(id,'score',c.actor);},
    function*(c,p){const id=yield*one(c,p,tops(c,p).filter(id=>demandCard(c,id)),'score','计分一张带要求或强迫的置顶牌。');if(id)c.draw(p,c.value(10));}
  ],
  A087: [
    function*(c,p){let ids=yield*pickByTrait(c,p,'hand',id=>cardAge(c,id)===c.value(9),'hand','强迫：转移一张时代 9 手牌。',1,1,c.actor,'transfer');if(!ids.length)ids=yield*pickByTrait(c,p,'score',id=>cardAge(c,id)===c.value(9),'score','强迫：转移一张时代 9 计分牌。',1,1,c.actor,'transfer');if(!ids.length)c.win(c.actor,'魔术贴鞋：对手未能转移时代 9 的手牌或计分牌。');},
    function*(c,p){yield*one(c,p,high(c,tops(c,p)),'score','计分最高的置顶牌。');}
  ],
  A096: [function*(c,p){c.lose(p,'埃克森瓦尔迪兹号的强迫：移除所有牌并出局');}],
  A097: [
    function*(c,p){yield*returnExcept(c,p,'hand',2);yield*returnExcept(c,p,'score',2);},
    function*(c,p){yield*returnExcept(c,p,'score',4);}
  ],
  A106: [function*(c,p){const age=yield*chooseValue(c,p,c.values().filter(age=>!tops(c,p).some(id=>cardAge(c,id)===age)));if(age===null)return;yield*all(c,p,()=>c.state.supply[age]||[],'score');yield*all(c,p,()=>c.state.junk.filter(id=>cardAge(c,id)===age),'score');}],
  A107: [function*(c,p){yield*all(c,p,()=>boardCards(c,p),'junk');for(const age of c.values())c.draw(p,age,'meld');}],
};
