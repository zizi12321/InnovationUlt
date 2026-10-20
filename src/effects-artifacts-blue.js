import { colors, hand, tops, pile, score, has, low, colorCount, pickMove, all, junkDeck, junkAchievement } from './effect-helpers.js';
import { iconTypes } from './effects-echoes-helpers.js';
import { demandCard, boardCards, cardAge, ageSum, anySet, unqualifiedClaim, standardJunk, one, drawMany, junkChosenDeck } from './effects-artifacts-helpers.js';
import { isBonus } from './echoes-rules.js';

// 岁月遗珍 · BLUE · 官方终极版卡面顺序。
export const ARTIFACTS_BLUE_EFFECTS = {
  A010: [
    function*(c,p){yield*all(c,p,tops(c,p).filter(id=>demandCard(c,id)),'return');},
    function*(c,p){yield*one(c,p,tops(c,p).filter(id=>c.card(id).color!=='BLUE'&&demandCard(c,id)),'score','计分一张带要求或强迫的非蓝色置顶牌。');}
  ],
  A011: [function*(c,p){while(true){const id=c.draw(p,c.value(1),'hand',true);if(!id)return;const top=pile(c,p,c.card(id).color).at(-1);if(!top||cardAge(c,top)!==cardAge(c,id)||!c.move(id,'score',p))return;}}],
  A012: [function*(c,p){const id=c.draw(p,c.value(4),'hand',true);if(!id)return;const top=pile(c,p,c.card(id).color).at(-1);if(top&&c.card(top).name_en.localeCompare(c.card(id).name_en,'en')<0){c.move(id,'return',p);yield*all(c,p,()=>score(c,p),'return');}}],
  A022: [function*(c,p){const id=c.draw(p,c.value(3),'meld');if(!id)return;const bottom=pile(c,p,c.card(id).color)[0];if(bottom&&c.move(bottom,'meld',p))yield*c.selfExecute(p,bottom);}],
  A023: [function*(c,p){const set=yield*anySet(c,p),ids=yield*drawMany(c,p,2,c.value(2),'hand',false,set);const id=yield*one(c,p,ids.filter(id=>hand(c,p).includes(id)),'meld','融合刚抽到的一张牌。');const rest=ids.filter(value=>value!==id&&hand(c,p).includes(value));if(rest.length)c.transfer(rest[0],'meld',c.other(p));}],
  A032: [function*(c,p){const ids=yield*all(c,p,()=>hand(c,p),'return');c.draw(p,ids.length);}],
  A033: [function*(c,p){const [id]=yield*c.pick(p,'展示一张手牌。',[...hand(c,p)]);if(!id)return;c.reveal(p,[id]);const color=c.card(id).color;c.splay(p,color,'left');const [top]=yield*c.pick(p,'选择任意玩家的该色另一张置顶牌，自执行它。',c.state.players.flatMap(owner=>c.tops(owner)).filter(value=>value!=='A033'&&c.card(value).color===color));if(top)yield*c.selfExecute(p,top);}],
  A042: [
    function*(c,p){const n=colorCount(c,p,4);yield*pickMove(c,p,[...score(c,p)],'score',`强迫：转移 ${n} 张计分牌。`,n,n,c.actor,'','transfer');},
    function*(c,p){yield*junkAchievement(c,p,[c.icons(c.p(p))[4]]);}
  ],
  A043: [function*(c,p){while(true){const returned=yield*one(c,p,[...score(c,p)],'return','归还一张计分牌。');if(!returned)return;const ids=[c.draw(p,c.value(5)),c.draw(p,c.value(6))].filter(Boolean),types=iconTypes(c,returned),matching=ids.filter(id=>iconTypes(c,id).some(icon=>types.includes(icon)));if(matching.length){const [shown]=yield*c.pick(p,'展示一张与归还牌有共同图标的刚抽到的牌。',matching);c.reveal(p,[shown]);return;}c.reveal(p,ids);yield*all(c,p,ids.filter(id=>hand(c,p).includes(id)),'return');}}],
  A052: [function*(c,p){const a=yield*one(c,p,low(c,hand(c,p)),'return','归还时代最低的一张手牌。');const b=yield*one(c,p,low(c,tops(c,p)),'return','归还时代最低的一张置顶牌。');c.draw(p,ageSum(c,[a,b].filter(Boolean)),'score');}],
  A053: [function*(c,p){const before=new Map(tops(c,p).map(id=>[id,cardAge(c,id)]));const ids=yield*all(c,p,tops(c,p).filter(id=>c.card(id).color!=='BLUE'),'return');for(const age of ids.map(id=>before.get(id)).sort((a,b)=>a-b))c.draw(p,age+1,'meld');}],
  A062: [function*(c,p){const a=yield*one(c,p,[...hand(c,p)],'return','归还一张手牌。');const chosen=yield*c.pick(p,'归还一张置顶牌。',tops(c,p));const b=chosen[0],ageB=cardAge(c,b),returned=b&&c.move(b,'return',p);const sum=(a?cardAge(c,a):0)+(returned?ageB:0);if(a&&returned&&sum===10)c.draw(p,c.value(10),'score');else junkDeck(c,p,sum);}],
  A063: [function*(c,p){const id=yield*one(c,p,[...hand(c,p)],'tuck','垫底一张手牌。');if(!id)return;const color=c.card(id).color;c.splay(p,color,'right');const counts={};for(const mark of c.visible(c.p(p),color)){const icon=isBonus(mark.icon)?100:mark.icon;if(c.iconTypes().includes(icon))counts[icon]=(counts[icon]||0)+1;}c.draw(p,Math.max(0,...Object.values(counts)));}],
  A072: [function*(c,p){while(true){const pool=tops(c,p).filter(id=>tops(c,p).some(other=>other!==id&&cardAge(c,id)===cardAge(c,other)));const [a]=yield*c.pick(p,'选择第一张同代置顶牌。',pool);if(!a)return;const [b]=yield*c.pick(p,'选择第二张同代置顶牌。',pool.filter(id=>id!==a&&cardAge(c,id)===cardAge(c,a)));if(!b)return;const cols=[c.card(a).color,c.card(b).color],id=c.draw(p,cardAge(c,a)+1,'meld');if(!id||!c.didDraw(id,'meld')||!cols.includes(c.card(id).color))return;}}],
  A073: [function*(c,p){const id=c.draw(p,c.value(8),'tuck');if(!id||!c.didDraw(id,'tuck'))return;const color=c.card(id).color;c.splay(p,color,'up');const age=pile(c,p,color).length;c.draw(p,age,'score');junkDeck(c,p,age);}],
  A082: [function*(c,p){const id=c.draw(p,c.highest(c.p(p))+1,'meld');const junked=yield*standardJunk(c,p);if(!junked&&id&&c.didDraw(id,'meld')&&c.card(id).spots.filter(icon=>icon===6).length>=3)c.win(p,'沥青滴落实验未移除成就，融合牌具有至少三个效率。');}],
  A083: [
    function*(c,p){for(const age of c.values().filter(age=>age<9).reverse())yield*one(c,p,tops(c,p).filter(id=>cardAge(c,id)===age),'junk',`移除时代 ${age} 的一张置顶牌。`);if(c.values().filter(age=>age<9).every(age=>c.state.junk.some(id=>cardAge(c,id)===age)))c.win(p,'移除区拥有每个低于时代 9 的时代。');},
    function*(c,p){yield*unqualifiedClaim(c,p);}
  ],
  A092: [function*(c,p){while(true){const id=c.draw(p,c.value(9),'meld');if(!id)return;yield*c.selfExecute(p,id);if(!has(c,id,6))return;}}],
  A093: [
    function*(c,p){const ids=yield*all(c,p,()=>score(c,p),'return');c.draw(p,ids.length,'score');},
    function*(c,p){yield*junkChosenDeck(c,p);}
  ],
  A102: [function*(c,p){const id=c.draw(p,c.value(10),'meld',false,'artifacts');if(id&&c.didDraw(id,'meld'))yield*c.selfExecute(p,id);}],
  A103: [function*(c,p){yield*all(c,p,()=>boardCards(c,p),'score');}],
  A112: [
    function*(c,p){for(const color of colors)yield*all(c,p,()=>pile(c,p,color).slice(0,-5),'junk');},
    function*(c,p){for(const color of colors)c.splay(p,color,'aslant');}
  ],
  A113: [function*(c,p){yield*c.subgame(p);}],
};
