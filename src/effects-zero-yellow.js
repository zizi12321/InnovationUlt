import { colors, hand, score, pickMove, splay, exchange, has } from './effect-helpers.js';
export const ZERO_YELLOW_EFFECTS = {
  Z001: [function*(c,p){if(!(yield*splay(c,p,colors.filter(color=>c.p(p).splay[color]==='none'),'left',false)))c.lose(p,'淡水：无法将未展开的颜色向左展开');}],
  Z002: [function*(c,p){yield*pickMove(c,p,hand(c,p),'score','计分一张手牌。');if(score(c,p).length<score(c,c.actor).length)c.lose(p,'庇护所：计分区牌数仍少于发动者');},
    function*(c,p){const ids=yield*c.pick(p,'选择计分区的两张牌，与全部手牌交换。',score(c,p),2,2);exchange(c,[...hand(c,p)],'score',p,ids,'hand',p);}],
  Z003: [function*(c,p){const ids=yield*pickMove(c,p,Object.values(c.p(p).piles).flat().filter(id=>has(c,id,18)),'score','计分自己面板上一张带食物的牌。');if(ids.length)for(let i=0;i<c.card(ids[0]).spots.filter(icon=>icon===18).length;i++)yield*pickMove(c,p,hand(c,p),'meld','每个食物图标融合一张手牌。');}],
};
