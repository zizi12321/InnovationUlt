import { colors, hand, tops, pile, score, high, low, topAge, pickMove, all, chooseColor, junkDeck, junkAchievement } from './effect-helpers.js';
import { pickByTrait, splayAnyBoard } from './effects-echoes-helpers.js';
import { artifact, boardCards, cardAge, sameColor, ageSum, isTop, unqualifiedClaim, standardJunk, one, drawMany } from './effects-artifacts-helpers.js';

// 岁月遗珍 · PURPLE · 官方终极版卡面顺序。
export const ARTIFACTS_PURPLE_EFFECTS = {
  A013: [function*(c,p){const color=yield*chooseColor(c,p);for(const owner of c.state.players)c.reveal(owner.id,[...owner.hand]);const ids=sameColor(c,hand(c,p),color);if(!ids.length||c.state.players.some(owner=>owner.id!==p&&sameColor(c,owner.hand,color).length))return;const moved=yield*all(c,p,ids,'return'),ages=moved.map(id=>cardAge(c,id));yield*all(c,p,()=>c.state.standard.filter(id=>ages.includes(cardAge(c,id))),'achievements');}],
  A014: [
    function*(c,p){const id=yield*one(c,p,[...hand(c,p)],'return','归还一张手牌。');if(id){const color=c.card(id).color,owners=c.state.players.filter(owner=>!c.tops(owner).some(id=>artifact(c,id))).map(owner=>owner.id);yield*all(c,p,()=>owners.flatMap(owner=>pile(c,owner,color)),'score');}},
    function*(c,p){if(isTop(c,'A014'))c.transfer('A014','hand',p);}
  ],
  A015: [function*(c,p){const color=yield*chooseColor(c,p);c.draw(p,c.value(1));const moved=yield*pickByTrait(c,p,'hand',id=>c.card(id).color===color,'meld','融合一张所选颜色的手牌。');if(moved.length){c.splay(p,color,'left');yield*junkAchievement(c,p,[cardAge(c,moved[0])]);}}],
  A024: [
    function*(c,p){const age=c.highest(c.p(p));c.draw(p,age,'hand',false,'artifacts');for(const id of [...(c.state.expansionSupply.artifacts[age]||[])])c.move(id,'junk',p);},
    function*(c,p){const [owner]=yield*c.choose(p,'选择一位玩家，移除与其最高置顶时代相同的可用成就。',c.state.players.map(owner=>({value:owner.id,label:owner.name})));if(owner)yield*junkAchievement(c,p,[c.highest(c.p(owner))]);}
  ],
  A025: [
    function*(c,p){yield*splayAnyBoard(c,p,'left');},
    function*(c,p){const [id]=yield*c.pick(p,'选择任意玩家的另一张紫色置顶牌，自执行它。',c.state.players.flatMap(owner=>c.tops(owner)).filter(id=>id!=='A025'&&c.card(id).color==='PURPLE'));if(id)yield*c.selfExecute(p,id);}
  ],
  A034: [function*(c,p){const id=c.draw(p,c.value(3),'hand',true);if(!id)return;const color=c.card(id).color;if(color==='YELLOW')yield*all(c,p,()=>hand(c,p),'return');if(color==='GREEN')for(const col of colors)c.splay(p,col,'none');if(color==='RED')yield*all(c,p,()=>score(c,p),'return');if(color==='BLUE')c.draw(p,c.value(9));}],
  A035: [function*(c,p){const a=yield*one(c,p,[...hand(c,p)],'return','归还一张手牌。');if(!a)return;const color=c.card(a).color,b=pile(c,p,color).at(-1),returned=b&&c.move(b,'return',p);const ids=yield*pickByTrait(c,p,'score',id=>c.card(id).color===color,'return','归还一张同色计分牌。');if(returned&&ids.length)yield*unqualifiedClaim(c,p);}],
  A044: [function*(c,p){c.reveal(p,[...hand(c,p)]);if(hand(c,p).length===5&&new Set(hand(c,p).map(id=>c.card(id).color)).size===5)c.win(p,'五张手牌恰好为五种颜色。');}],
  A045: [function*(c,p){const ages=tops(c,p).map(id=>cardAge(c,id)),unique=ages.filter(age=>ages.filter(v=>v===age).length===1).sort((a,b)=>a-b);for(const age of unique)c.draw(p,age,'score');}],
  A054: [function*(c,p){const id=c.draw(p,c.value(6),'hand',true);if(id&&c.card(id).color==='RED')yield*unqualifiedClaim(c,p,null,true);else yield*standardJunk(c,p);}],
  A055: [function*(c,p){const id=yield*one(c,p,[...hand(c,p)],'meld','融合一张手牌。');if(id)yield*unqualifiedClaim(c,p,[cardAge(c,id)]);else if(c.state.standard.length)junkDeck(c,p,Math.min(...c.state.standard.map(id=>cardAge(c,id))));}],
  A064: [
    function*(c,p){const color=yield*chooseColor(c,p,high(c,tops(c,p)).map(id=>c.card(id).color));const id=color&&pile(c,p,color)[0];if(id)c.move(id,'meld',p);},
    function*(c,p){yield*unqualifiedClaim(c,p,null,true);yield*standardJunk(c,p);}
  ],
  A065: [function*(c,p){const ids=yield*c.pick(p,'展示并归还两张手牌。',[...hand(c,p)],2,2);c.reveal(p,ids);const moved=yield*all(c,p,ids,'return');if(moved.length!==2)return;const [a,b]=moved;if(cardAge(c,a)===cardAge(c,b))c.draw(p,cardAge(c,a)+1);if(c.card(a).color===c.card(b).color)yield*unqualifiedClaim(c,p);}],
  A074: [function*(c,p){const id=yield*one(c,p,high(c,score(c,p)),'meld','融合最高的计分牌。');if(id){yield*drawMany(c,p,2,cardAge(c,id),'score');yield*c.selfExecute(p,id);}}],
  A075: [function*(c,p){const ids=yield*drawMany(c,p,c.state.players.length,c.value(7),'hand',true);for(const owner of c.state.players.filter(owner=>owner.id!==p)){const id=yield*one(c,p,ids.filter(id=>hand(c,p).includes(id)),'meld',`转移一张刚抽到的牌至${owner.name}面板。`,owner.id,'transfer');if(id)ids.splice(ids.indexOf(id),1);}const last=yield*one(c,p,ids.filter(id=>hand(c,p).includes(id)),'meld','融合最后一张牌。');if(last)yield*c.selfExecute(p,last);}],
  A084: [function*(c,p){const ids=yield*pickByTrait(c,p,'hand',id=>cardAge(c,id)===c.value(8),'meld','融合一张时代 8 的手牌。');if(!ids.length)return;const id=ids[0];if(!c.card(id).effects.length)c.win(p,'红宝石鞋融合了一张没有效果的牌。');else yield*c.selfExecute(p,id);}],
  A085: [
    function*(c,p){yield*one(c,p,c.p(p).achievements.filter(id=>c.card(id).set==='Base'&&cardAge(c,id)<=10),'return','强迫：归还一项已取得的标准成就。');},
    function*(c,p){while(true){const id=c.draw(p,c.value(8),'hand',true);if(!id)return;const color=c.card(id).color,owners=c.state.players.slice().sort((a,b)=>topAge(c,b.id,color)-topAge(c,a.id,color));if(topAge(c,owners[0].id,color)<=topAge(c,owners[1].id,color))return;const owner=owners[0].id,top=pile(c,owner,color).at(-1);if(!top||!c.move(top,'achievements',owner))return;}}
  ],
  A094: [function*(c,p){while(true){const top=pile(c,p,'BLUE').at(-1);if(!top)return;const before=c.changed();yield*c.selfExecute(p,top);if(c.changed()===before)return;c.draw(p,c.value(10),'junk');}}],
  A095: [
    function*(c,p){yield*pickMove(c,p,[...hand(c,p)],'score','可以计分一张手牌。',0,1);yield*pickMove(c,p,[...score(c,p)],'hand','可以将一张计分牌转移回手牌。',0,1,p,'','transfer');if(c.score(c.p(p))===25)c.win(p,'玛丽莲双联画：恰好 25 分。');},
    function*(c,p){yield*standardJunk(c,p);}
  ],
  A104: [function*(c,p){if(!isTop(c,'A104'))return;const ids=c.state.players.flatMap(owner=>c.tops(owner));yield*all(c,p,ids,'junk');for(const owner of c.state.players)yield*all(c,p,()=>hand(c,owner.id),'junk');}],
  A105: [function*(c,p){const pool=score(c,p).filter(id=>score(c,p).filter(other=>cardAge(c,other)===cardAge(c,id)).length===1);const a=yield*one(c,p,low(c,pool),'meld','强迫：融合数值独一无二的最低计分牌。');let b=null;if(a)b=(yield*pickByTrait(c,p,'hand',id=>c.card(id).color===c.card(a).color,'meld','融合一张同色手牌。'))[0];if(a&&!b)c.lose(p,'龙穴：恰好融合了一张牌');else for(const option of c.deckOptions()){const id=c.peekDeck(option.value);if(id)c.move(id,'junk',p);}}],
  A114: [
    function*(c,p){const color=yield*chooseColor(c,p,colors.filter(color=>pile(c,p,color).length));if(color)for(const owner of c.state.players)yield*all(c,p,()=>pile(c,owner.id,color),'junk');},
    function*(c,p){while(true){const [id]=yield*c.pick(p,'选择移除区中一个时代；该时代的全部牌将计分。',[...c.state.junk],1,1,true);if(!id)return;const age=cardAge(c,id),ids=yield*all(c,p,()=>c.state.junk.filter(value=>cardAge(c,value)===age),'score');if(!ids.length||ageSum(c,ids)>=11)return;}}
  ],
  A115: [function*(c,p){yield*all(c,p,()=>boardCards(c,p),'hand',p,'','transfer');}],
};
