import { hand, tops, score, pickMove } from './effect-helpers.js';
export const ZERO_PURPLE_EFFECTS = {
  Z010: [function*(c,p){if(tops(c,p).filter(id=>c.card(id).age===0).length===5)c.win(p,'鸟语：拥有五张时代 0 置顶牌。');}],
  Z011: [function*(c,p){yield*pickMove(c,p,hand(c,p),'score','计分两张手牌。',2,2);},
    function*(c,p){const [id]=yield*c.pick(p,'选择一张计分牌转移到对手面板。',score(c,p));if(id&&c.transfer(id,'meld',c.other(p))){const bottom=c.p(c.other(p)).piles[c.card(id).color][0];if(bottom)c.move(bottom,'meld',p);}}],
  Z012: [function*(c,p){const ids=[c.draw(p,c.value(0)),c.draw(p,c.value(0))];yield*pickMove(c,p,ids,'return','归还刚抽的两张牌之一。');}],
};
