import { hand, tops, pickMove, all } from './effect-helpers.js';
export const ZERO_RED_EFFECTS = {
  Z007: [function*(c,p){const ids=hand(c,p).filter(id=>!c.p(c.actor).piles[c.card(id).color].length||c.card(id).age>0);const [id]=yield*c.pick(p,'展示一张发动者没有该颜色或时代大于 0 的手牌。',ids);if(!id){c.reveal(p,hand(c,p));c.lose(p,'生火：无法展示符合条件的手牌');}c.reveal(p,[id]);},
    function*(c,p){const ids=yield*pickMove(c,p,hand(c,p).filter(id=>c.p(p).piles[c.card(id).color].length),'meld','融合一张自己面板已有颜色的手牌。');if(!ids.length){c.reveal(p,hand(c,p));c.lose(p,'生火：无法融合符合条件的手牌');}}],
  Z008: [function*(c,p){const id=c.draw(p,c.value(0),'hand',true),color=c.card(id).color;c.move(id,'return',p);const target=c.p(p).piles[color].at(-1);if(target)c.transfer(target,'meld',c.actor);},
    function*(c,p){if(tops(c,p).includes('Z003'))c.draw(p,c.value(1));}],
  Z009: [function*(c,p){c.reveal(p,hand(c,p));c.reveal(c.actor,c.p(c.actor).score);yield*all(c,p,()=>hand(c,p).filter(id=>c.p(c.actor).score.some(value=>c.card(value).color===c.card(id).color)),'hand',c.actor,'','transfer');}],
};
