import { all, pickMove, chooseValue, splay } from './effect-helpers.js';

// Decrees are achievements when owned, but never Special Achievements.
// Keep their effects separate from the five colors of Figure karma programs.
export const DECREE_EFFECTS = {
  RED: function* (c, p) {
    const age = yield* chooseValue(c,p);
    yield* all(c,p,c.state.players.filter(owner=>owner.id!==p).flatMap(owner=>c.tops(owner)).filter(id=>c.card(id).age===age),'return');
  },
  YELLOW: function* (c,p) { yield* splay(c,p,Object.keys(c.p(p).piles),'up',false); },
  GREEN: function* (c,p) { const age=c.highest(c.p(p))+1;for(let i=0;i<3;i++)c.draw(p,age); },
  BLUE: function* (c,p) { c.draw(p,c.highest(c.p(p))+2); },
  PURPLE: function* (c,p) {
    const [target]=yield*c.choose(p,'选择敌对法令的对手。',c.state.players.filter(owner=>owner.id!==p).map(owner=>({value:owner.id,label:owner.name})));
    if(!target)return;
    yield*pickMove(c,p,c.p(target).score,'return','归还该对手计分区的三张牌。',3,3,target);
    yield*all(c,p,c.tops(c.p(target)).filter(id=>c.card(id).type==='figure'),'return',target);
  },
};
