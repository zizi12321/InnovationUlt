import { colors, hand, tops, pile, score, has, high, maxAge, topAge, pickMove, all, chooseColor, chooseValue, junkDeck } from './effect-helpers.js';
import { visibleCount, pickByTrait, allByTrait } from './effects-echoes-helpers.js';
import { artifact, cardAge, ageSum, one, artRun, drawMany, scoreBottoms } from './effects-artifacts-helpers.js';

// 岁月遗珍 · GREEN · 官方终极版卡面顺序。
export const ARTIFACTS_GREEN_EFFECTS = {
  A007: [function*(c,p){const id=yield*one(c,p,[...hand(c,p)],'score','计分一张手牌。');if(id)yield*artRun(c,p,pile(c,p,c.card(id).color).at(-1));}],
  A008: [function*(c,p){while(true){const id=c.draw(p,c.value(3),'hand',true);if(!id||pile(c,p,c.card(id).color).length)return;if(!c.move(id,'meld',p))return;}}],
  A009: [function*(c,p){const id=yield*one(c,p,[...score(c,p)],'return','强迫：归还一张计分牌。');if(id){const age=cardAge(c,id);yield*one(c,p,c.p(p).achievements.filter(value=>cardAge(c,value)===age),'achievements','转移一项同代成就给发动者。',c.actor,'transfer');junkDeck(c,p,age);}}],
  A020: [
    function*(c,p){yield*one(c,p,tops(c,p).filter(id=>artifact(c,id)),'meld','强迫：转移一张置顶文物到发动者面板。',c.actor,'transfer');},
    function*(c,p){if(tops(c,p).includes('A018'))c.win(p,'圣枪与圣杯同时置顶。');}
  ],
  A021: [function*(c,p){const a=yield*one(c,p,[...hand(c,p)],'meld','融合一张手牌。');const b=yield*one(c,p,[...hand(c,p)],'score','计分一张手牌。');if(a&&b&&cardAge(c,a)!==cardAge(c,b)){junkDeck(c,p,cardAge(c,a));junkDeck(c,p,cardAge(c,b));}}],
  A030: [function*(c,p){const id=yield*one(c,p,[...hand(c,p)],'return','归还一张手牌。');if(!id)return;const n=cardAge(c,id),ids=yield*pickMove(c,p,[...hand(c,p)],'score',`计分 ${n} 张手牌；不足时全部计分。`,n,n);junkDeck(c,p,ageSum(c,ids));}],
  A031: [function*(c,p){const color=yield*chooseColor(c,p,colors.filter(color=>pile(c,p,color).length>1&&c.p(p).splay[color]==='none'),false,'选择一个未展开的颜色向右展开。');if(!color)return;c.splay(p,color,'right');const age=pile(c,p,color).length;const ids=yield*pickMove(c,p,c.state.standard.filter(id=>cardAge(c,id)===age),'junk','移除与该色牌数相同数值的可用成就。');if(!ids.length)c.draw(p,age);}],
  A040: [
    function*(c,p){yield*all(c,p,()=>hand(c,p),'return');},
    function*(c,p){yield*drawMany(c,p,3,c.value(4));yield*pickByTrait(c,p,'hand',id=>c.card(id).color==='GREEN','meld','融合一张绿色手牌。');junkDeck(c,p,topAge(c,p,'GREEN'));}
  ],
  A041: [
    function*(c,p){if(hand(c,p).length<4){const ids=yield*all(c,p,tops(c,p).filter(id=>c.card(id).color!=='GREEN'),'return');yield*drawMany(c,p,ids.length,c.value(5));}},
    function*(c,p){yield*one(c,p,[...hand(c,p)],'meld','融合一张手牌。');}
  ],
  A050: [function*(c,p){while(true){const id=c.draw(p,c.value(5),'meld');if(!id||c.card(id).color==='GREEN')return;}}],
  A051: [function*(c,p){yield*scoreBottoms(c,p);const id=yield*one(c,p,[...score(c,p)],'meld','从计分区融合一张牌。');if(id){c.splay(p,c.card(id).color,'right');junkDeck(c,p,cardAge(c,id));}}],
  A060: [function*(c,p){c.draw(p,c.value(1),'score');const age=Math.ceil(ageSum(c,score(c,p))/5);c.draw(p,age,'score');junkDeck(c,p,age);}],
  A061: [function*(c,p){const selected=yield*c.choose(p,'选择三种颜色。',colors.map(value=>({value,label:({RED:'红色',YELLOW:'黄色',GREEN:'绿色',BLUE:'蓝色',PURPLE:'紫色'})[value]})),3,3);const id=c.draw(p,c.value(8),'hand',true);if(!id)return;const color=c.card(id).color;if(selected.includes(color)){c.move(id,'score',p);c.splay(p,color,'up');}else{yield*allByTrait(c,p,'score',value=>c.card(value).color===color,'return');c.splay(p,color,'none');}}],
  A070: [function*(c,p){const age=yield*chooseValue(c,p),ids=yield*drawMany(c,p,3,age,'hand',true);const cols=[...new Set(ids.map(id=>c.card(id).color))];for(const color of cols)c.splay(p,color,'up');if(ids.length===3&&cols.every(color=>pile(c,p,color).length===age))c.win(p,'米原器的抽牌颜色均有与所选时代相同的牌数。');else yield*all(c,p,ids.filter(id=>hand(c,p).includes(id)),'return');}],
  A071: [
    function*(c,p){yield*drawMany(c,p,4,c.value(7));yield*pickByTrait(c,p,'hand',id=>c.card(id).color==='BLUE','meld','融合一张蓝色手牌。');yield*all(c,p,()=>hand(c,p),'hand',c.actor,'','transfer');},
    function*(c,p){while(true){const id=c.draw(p,c.value(7),'hand',true);if(!id||has(c,id,6))return;c.move(id,'tuck',p);}}
  ],
  A080: [
    function*(c,p){yield*scoreBottoms(c,p);},
    function*(c,p){const age=c.values().find(age=>c.state.supply[age]?.length);if(age!==undefined)junkDeck(c,p,age);}
  ],
  A081: [function*(c,p){const id=yield*one(c,p,[...hand(c,p)],'return','归还一张手牌。');if(!id)return;const age=cardAge(c,id),ids=yield*drawMany(c,p,3,age,'score');const scored=ids.filter(id=>c.didDraw(id,'score'));if(ids.length!==3||!ids.every(id=>c.didDraw(id,'score',age)))junkDeck(c,p,maxAge(c,scored));}],
  A090: [
    function*(c,p){for(const color of colors)c.splay(p,color,'none');},
    function*(c,p){const valid=colors.filter(color=>pile(c,p,color).length>1&&c.p(p).splay[color]!=='up');const chosen=yield*c.choose(p,'向上展开两种颜色；不足两种则全部展开。',valid.map(value=>({value,label:({RED:'红色',YELLOW:'黄色',GREEN:'绿色',BLUE:'蓝色',PURPLE:'紫色'})[value]})),2,2);for(const color of chosen)c.splay(p,color,'up');}
  ],
  A091: [function*(c,p){yield*all(c,p,()=>hand(c,p),'return');const ids=yield*drawMany(c,p,5,c.value(9),'hand',true);if(new Set(ids.map(id=>c.card(id).color)).size===5)c.win(p,'辛科姆三号展示了五种颜色。');}],
  A100: [function*(c,p){if(c.state.players.filter(owner=>owner.id!==p).every(owner=>score(c,p).length>score(c,owner.id).length))c.win(p,'特斯拉跑车：计分区卡牌数量独自最多。');const id=c.draw(p,c.value(11),'hand',true);if(!id)return;const moved=yield*all(c,p,()=>pile(c,p,c.card(id).color),'score');if(moved.length)c.move(id,'return',p);else c.move(id,'meld',p);}],
  A101: [function*(c,p){const own=Math.max(...colors.map(color=>visibleCount(c,p,color))),rival=Math.max(...c.state.players.filter(owner=>owner.id!==p).flatMap(owner=>colors.map(color=>visibleCount(c,owner.id,color))));if(own>rival)c.win(p,'青函隧道：一种颜色的可见牌数超过所有对手的每种颜色。');}],
  A110: [
    function*(c,p){while((yield*one(c,p,tops(c,p).filter(id=>has(c,id,6)),'return','强迫：归还带效率的置顶牌，然后重复。'))){}},
    function*(c,p){while((yield*one(c,p,tops(c,p).filter(id=>has(c,id,1)),'return','归还带繁荣的置顶牌，然后重复。'))){}}
  ],
  A111: [function*(c,p){let count=0;for(const owner of c.state.players)count+=(yield*all(c,p,()=>score(c,owner.id),'junk')).length;if(count)return;for(const owner of c.state.players){const [top]=yield*c.pick(p,`为${owner.name}选择时代最高的置顶牌，其他颜色的置顶牌转移至其计分区。`,high(c,tops(c,owner.id)));if(!top)continue;yield*all(c,p,tops(c,owner.id).filter(id=>c.card(id).color!==c.card(top).color),'score',owner.id,'','transfer');}}],
};
