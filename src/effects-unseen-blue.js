import { safe, age, color, boardCards, top, one, safeguardAvailable, drawMany, chooseMode, untie, revealPick } from './effects-unseen-helpers.js';
import { colors, hand, tops, pile, score, has, all, chooseValue, splay, rankPick } from './effect-helpers.js';
import { iconTypes } from './effects-echoes-helpers.js';

// 藏形匿影 · BLUE · 官方终极版卡面顺序。
export const UNSEEN_BLUE_EFFECTS = {
  U010: [function*(c,p){while(hand(c,p).length){const [id]=yield*c.pick(p,'要求：展示一张手牌。',hand(c,p));c.reveal(p,[id]);if(hand(c,c.actor).some(x=>color(c,x)===color(c,id))||!c.transfer(id,'hand',c.actor))return;}}],
  U011: [function*(c,p){c.draw(p,c.value(1),'meld');},function*(c,p){const ids=yield*c.pick(p,'归还两张手牌。',hand(c,p),2,2);if(ids.filter(id=>c.move(id,'return',p)).length===2)c.draw(p,c.value(2),'score');}],
  U012: [function*(c,p){const id=c.draw(p,c.value(1),'hand',true);if(!id)return;const col=color(c,id);if(!c.move(id,'return',p))return;if(['YELLOW','PURPLE'].includes(col)){yield*safeguardAvailable(c,p,hand(c,p).map(id=>age(c,id)));yield*all(c,p,()=>hand(c,p),'return');}else yield*drawMany(c,p,2,c.value(1));}],
  U022: [function*(c,p){const n=Math.max(...colors.map(col=>pile(c,p,col).length));yield*splay(c,p,colors.filter(col=>pile(c,p,col).length===n),'left');},
    function*(c,p){const id=c.draw(p,c.visibleCardCount(p,'PURPLE'),'meld');if(id&&c.didDraw(id,'meld')&&!has(c,id,1))c.move(id,'tuck',p);}],
  U023: [function*(c,p){const id=c.draw(p,c.value(3),'hand',true);if(!id)return;if(has(c,id,2))c.move(id,'score',p);else if(has(c,id,1)){c.move(id,'return',p);yield*drawMany(c,p,2,c.value(3));}else c.move(id,'tuck',p);},
    function*(c,p){if(!c.icons(c.p(p))[4])c.claimSpecial(p,'ZEN','UNSEEN');}],
  U032: [function*(c,p){while(true){
    // 不确定边界：首次没有“上张牌”时，按值0加1处理；与BGA 4E
    // 的初次可选1或3一致。后续记录跨分享玩家共用，作用域为整个行动。
    const previous=c.recall('U032','action')??0,values=[...new Set([c.value(3),previous+1])];
    const [chosen]=yield*c.choose(p,'选择时代 3，或本行动此前此效果最后融合牌的时代加 1。',values.map(value=>({value:String(value),label:`时代 ${value}`,age:value})));
    const id=c.draw(p,Number(chosen),'meld');if(!id||!c.didDraw(id,'meld'))return;c.remember('U032','action',age(c,id));const covered=pile(c,p,color(c,id)).at(-2);if(!covered||!has(c,covered,3))return;}}],
  U033: [function*(c,p){const ids=yield*c.pick(p,'从手牌与计分区归还五张牌。',[...new Set([...hand(c,p),...score(c,p)])],5,5);const returned=ids.filter(id=>c.move(id,'return',p));const drawn=yield*drawMany(c,p,2,new Set(returned.map(id=>color(c,id))).size);const melded=yield*one(c,p,drawn,'meld','融合一张刚抽到的牌。');yield*one(c,p,drawn.filter(id=>id!==melded&&c.location(id).key==='hand'),'score','计分另一张刚抽到的牌。');}],
  U042: [function*(c,p){const mode=yield*chooseMode(c,p,[['score','计分一张手牌'],['draw','抽取一张时代 4 牌']]);if(mode==='draw')c.draw(p,c.value(4));else yield*one(c,p,hand(c,p),'score');},
    function*(c,p){const ids=yield*c.pick(p,'归还恰好两张手牌。',hand(c,p),2,2);const returned=ids.filter(id=>c.move(id,'return',p));if(returned.length===2)c.draw(p,returned.reduce((n,id)=>n+c.card(id).spots.filter(i=>i===2||i===3).length,0));}],
  U043: [function*(c,p){const mode=yield*chooseMode(c,p,[['safe','抽取并保密时代 4'],['draw','按一张机密牌时代加 1 抽取并展示']]);if(mode==='safe'){c.draw(p,c.value(4),'safeguard');return;}const [secret]=yield*c.pick(p,'选择作为抽牌时代依据的机密牌。',safe(c,p));if(!secret)return;const id=c.draw(p,age(c,secret)+1,'hand',true);if(id&&['RED','PURPLE'].includes(color(c,id))){const melded=yield*one(c,p,safe(c,p).filter(x=>x!==secret),'meld','融合另一张机密牌。');if(melded)c.move(id,'safeguard',p);}}],
  U052: [function*(c,p){const values=c.state.players.map(o=>top(c,o.id,'GREEN')).filter(Boolean).map(id=>age(c,id));const value=yield*chooseValue(c,p,values);if(value!==null)c.draw(p,value,'meld');},
    function*(c,p){c.draw(p,(age(c,top(c,p,'YELLOW'))||0)+1,'meld');},function*(c,p){yield*splay(c,p,['BLUE'],'right');}],
  U053: [function*(c,p){yield*all(c,p,()=>hand(c,p),'return');},
    function*(c,p){const ids=yield*drawMany(c,p,2,c.value(6),'hand',true);yield*all(c,p,ids,'return');const n=new Set(ids.flatMap(id=>iconTypes(c,id))).size;if(n===2)yield*drawMany(c,p,2,c.value(6),'score');if(n===4)c.draw(p,c.value(7));c.draw(p,c.value(6));}],
  U062: [function*(c,p){const first=yield*one(c,p,tops(c,p),'return','归还一张置顶牌。');const ids=first?[first]:[];if(first){const col=color(c,first);while(top(c,p,col)&&(yield*c.yes(p,'可以继续归还同色置顶牌。'))){const id=top(c,p,col);if(!c.move(id,'return',p))break;ids.push(id);}}yield*drawMany(c,p,ids.length,c.value(7));if(ids.filter(id=>age(c,id)===c.value(7)).length===1)c.draw(p,c.value(8));}],
  U063: [function*(c,p){c.reveal(p,[...hand(c,p)]);},
    function*(c,p){const ids=yield*drawMany(c,p,3,c.value(7),'hand',true),returned=yield*c.pick(p,'归还刚抽到的两张牌。',ids,2,2);for(const id of returned)c.move(id,'return',p);const keep=ids.filter(id=>!returned.includes(id));if(keep.length)yield*splay(c,p,[color(c,keep[0])],'right');}],
  U072: [function*(c,p){const id=yield*one(c,p,tops(c,p).filter(id=>has(c,id,3)),'tuck','要求：垫底一张带概念的置顶牌。');if(id){const target=top(c,p,color(c,id));if(target)c.transfer(target,'meld',c.actor);c.draw(p,c.value(7));}},
    function*(c,p){c.draw(p,c.value(8));}],
  U073: [function*(c,p){const id=yield*revealPick(c,c.actor,p,[...hand(c,p)],'要求：选择对手展示的一张手牌转移至你的面板。');if(id)c.transfer(id,'meld',c.actor);c.draw(p,c.value(7));},
    function*(c,p){yield*one(c,p,safe(c,p),'score','计分一张机密牌。');},function*(c,p){yield*splay(c,p,['BLUE'],'right');}],
  U082: [function*(c,p){const mode=yield*chooseMode(c,p,[['unsplay','还原一个颜色'],['splay','将未展开的颜色向上展开并抽取时代 9']]);if(mode==='unsplay')yield*untie(c,p);else if(yield*splay(c,p,colors.filter(col=>c.p(p).splay[col]==='none'),'up',false))c.draw(p,c.value(9));}],
  U083: [function*(c,p){const ids=yield*drawMany(c,p,2,c.value(9),'hand',true);const selected=yield*c.pick(p,'归还至少一张刚抽到的牌。',ids,1,ids.length);const returned=selected.filter(id=>c.move(id,'return',p));if(returned.length===2){const id=c.state.supply[c.value(10)]?.at(-1);if(id){c.reveal(p,[id]);if(returned.some(x=>color(c,x)===color(c,id)))c.draw(p,c.value(10));}}}],
  U092: [function*(c,p){yield*drawMany(c,p,2,c.value(10),'meld');const [id]=yield*c.pick(c.other(p),'顾问：选择对手的一张置顶牌让其自执行。',tops(c,p));if(id)yield*c.selfExecute(p,id);}],
  U093: [function*(c,p){const ids=[c.state.supply[c.value(9)]?.at(-1),c.state.supply[c.value(10)]?.at(-1)].filter(Boolean);c.reveal(p,ids);yield*one(c,p,ids,'return','归还其中一张牌库顶牌。');},
    function*(c,p){if(!boardCards(c,p).length)c.win(p,'费米悖论：面板上没有牌。');else yield*all(c,p,()=>c.state.junk,'hand',p,'','transfer');}],
  U102: [function*(c,p){const secrets=yield*rankPick(c,p,safe(c,p),2,true,'要求：选择最高的两张机密牌。');for(const id of secrets)c.transfer(id,'safe',c.actor);const highest=yield*rankPick(c,p,score(c,p),2,true,'要求：选择最高的两张计分牌。');for(const id of highest)c.transfer(id,'score',c.actor);const lowest=yield*rankPick(c,p,score(c,p),2,false,'要求：融合剩余最低的两张计分牌。');yield*all(c,p,lowest,'meld');}],
  U103: [function*(c,p){while(true){const first=yield*one(c,p,tops(c,p),'decktop','可以将一张置顶牌放回对应牌库顶部。',true),second=yield*one(c,p,hand(c,p),'meld','可以融合一张手牌。',true);if(!first&&!second)return;}},
    function*(c,p){yield*drawMany(c,p,colors.filter(col=>!pile(c,p,col).length).length,c.value(11));}],
  U112: [function*(c,p){const id=yield*one(c,p,colors.map(col=>pile(c,p,col)[0]).filter(Boolean),'return','归还一张底牌。');if(!id)return;const col=color(c,id);c.splay(p,col,'aslant');yield*all(c,p,()=>pile(c,p,col).filter(id=>!has(c,id,2)),'score');}],
  U113: [function*(c,p){const won=c.coin();c.log(`${c.p(p).name}抛硬币：${won?'赢':'输'}。`);if(!won)c.lose(p,'量子计算机要求的硬币失败');},
    function*(c,p){while(true){const won=c.coin();c.log(`${c.p(p).name}抛硬币：${won?'赢':'输'}。`);if(won)return;if(!(yield*one(c,p,safe(c,p),'return','归还一张机密牌以继续抛硬币。')))c.lose(p,'量子计算机硬币失败且未归还机密牌');}}],
};
