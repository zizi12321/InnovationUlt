import { hand, has } from './effect-helpers.js';
export const ZERO_GREEN_EFFECTS = {
  Z004: [function*(c,p){const id=c.draw(p,c.value(0),'meld'),color=c.card(id).color;for(const owner of c.state.players)c.reveal(owner.id,owner.hand);for(const value of [...new Set(c.state.players.flatMap(owner=>owner.hand).filter(id=>c.card(id).color===color))])c.transfer(value,'hand',p);if(id==='Z001')c.draw(p,c.value(1));const counts={};for(const value of hand(c,p)){const color=c.card(value).color;counts[color]=(counts[color]||0)+1;}if(Object.values(counts).some(n=>n>=3))c.draw(p,c.value(2));}],
  Z005: [function*(c,p){const id=c.draw(p,c.value(0));if(!has(c,id,18)&&(yield*c.yes(p,'该牌没有食物：是否展示、计分，然后再抽时代 0？'))){c.reveal(p,[id]);c.move(id,'score',p);c.draw(p,c.value(0));}}],
  Z006: [function*(c,p){const ids=[c.draw(p,c.value(0),'hand',true),c.draw(p,c.value(0),'hand',true)];const [id]=yield*c.pick(c.actor,'选择一张展示的牌，转移到自己的面板。',ids);if(id)c.transfer(id,'meld',c.actor);}],
};
