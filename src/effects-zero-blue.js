import { hand, tops, score, high, has, pickMove, exchange } from './effect-helpers.js';
export const ZERO_BLUE_EFFECTS = {
  Z013: [function*(c,p){const ids=yield*pickMove(c,p,tops(c,p).filter(id=>id!=='Z013'&&has(c,id,18)),'score','计分另一张带食物的置顶牌。');if(!ids.length)c.lose(p,'腌制：无法计分另一张带食物的置顶牌');},
    function*(c,p){if(yield*c.yes(p,'是否将全部手牌与对手全部最高时代计分牌交换？'))exchange(c,[...hand(c,p)],'score',c.other(p),high(c,score(c,c.other(p))),'hand',p);}],
  Z014: [function*(c,p){const ids=yield*pickMove(c,p,tops(c,p),'return','归还一张自己的置顶牌。');c.draw(p,c.value(0));c.reveal(p,hand(c,p));const matches=ids.length?hand(c,p).filter(id=>c.card(id).color===c.card(ids[0]).color):[];if(matches.length===1)c.move(matches[0],'meld',p);else c.lose(p,'急救：手牌中与归还牌同色的牌不是恰好一张');}],
  Z015: [function*(c,p){const pool=score(c,p),[id]=yield*c.pick(p,'展示计分区中一张自己面板已有颜色的牌。',pool.filter(id=>c.p(p).piles[c.card(id).color].length));if(id){c.reveal(p,[id]);c.draw(p,c.value(1));}else c.reveal(p,pool);}],
};
