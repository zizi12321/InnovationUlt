import {colors,hand,tops,pile,score,high,low,maxAge,topAge,all,chooseColor,chooseValue,splay,junkDeck,last,fact,at,value,hue,icon,condition,draw,take,reveal,optional} from './sentence-helpers.js';
import {iconTypes,visibleCount,pickByTrait,anyAchievement} from './effects-echoes-helpers.js';
import {artifact,ageSum,anySet,unqualifiedClaim,standardJunk,artRun,scoreBottoms} from './effects-artifacts-helpers.js';
import {isBonus} from './echoes-rules.js';
const returned=r=>fact(r,'returned'),drawn=r=>fact(r,'drawn'),scored=r=>fact(r,'scored'),melded=r=>fact(r,'melded').at(-1);
const drawnLast=r=>drawn(r).at(-1);
function* meldHand(c,p){yield*take(c,p,hand(c,p),'meld');}
function* returnHand(c,p){yield*take(c,p,hand(c,p),'return');}
function* scoreHand(c,p){yield*take(c,p,hand(c,p),'score');}
function* returnScore(c,p){yield*take(c,p,score(c,p),'return');}
function* chooseAge(c,p,r){r.facts.value=yield*chooseValue(c,p);}
function* junkAge(c,p,r){junkDeck(c,p,r.facts.value);}
function* selfMelded(c,p,r){if(melded(r))yield*c.selfExecute(p,melded(r));else r.fail();}
function* repeatDone(c,p,r){if(condition(r,r.previous))yield*r.repeat();}

export const ARTIFACTS_SENTENCES = {
 'A002:0':[
  function*(c,p){yield*pickByTrait(c,p,'hand',id=>hue(c,id)==='PURPLE','return','归还紫色手牌。');},
  function*(c,p,r){if(condition(r,r.previous))c.draw(p,value(c,returned(r).at(-1))+2,'hand',true,yield*anySet(c,p));},
  function*(c,p,r){const id=drawnLast(r);if(condition(r,hue(c,id)==='PURPLE')&&c.move(id,'meld',p))yield*c.selfExecute(p,id);},
 ],
 'A003:0':[function*(c,p){yield*draw(c,p,3,topAge(c,p,'GREEN'));},function*(c,p,r){yield*take(c,p,drawn(r).filter(id=>hand(c,p).includes(id)),'return');},function*(c,p,r){yield*take(c,p,drawn(r).filter(id=>hand(c,p).includes(id)),'score');}],
 'A005:0':[meldHand,function*(c,p,r){const id=melded(r),col=hue(c,id);if(col)yield*all(c,p,()=>pile(c,p,col).filter(v=>v!==id),'score');},function*(c,p,r){if(condition(r,r.previous&&scored(r).length))yield*r.repeat();}],
 'A006:0':[
  function*(c,p){yield*reveal(c,p,hand(c,p),3);},
  function*(c,p,r){const ids=fact(r,'revealed');yield*take(c,p,ids,'score',2);yield*take(c,p,ids.filter(id=>hand(c,p).includes(id)),'tuck');},
  function*(c,p,r){const ids=scored(r);if(condition(r,ids.length===2&&hue(c,ids[0])===hue(c,ids[1])))yield*draw(c,p,3,c.value(1));},
 ],
 'A007:0':[scoreHand,function*(c,p,r){const id=at(c,p,hue(c,scored(r).at(-1)));if(condition(r,id))yield*artRun(c,p,id);}],
 'A008:0':[function*(c,p){c.draw(p,c.value(3),'hand',true);},function*(c,p,r){const id=drawnLast(r),col=hue(c,id);if(condition(r,col&&!pile(c,p,col).length)){c.move(id,'meld',p);yield*r.repeat();}}],
 'A011:0':[function*(c,p){c.draw(p,c.value(1),'hand',true);},function*(c,p,r){const id=drawnLast(r),top=at(c,p,hue(c,id));if(condition(r,top&&value(c,top)===value(c,id))){c.move(id,'score',p);yield*r.repeat();}}],
 'A012:0':[function*(c,p){c.draw(p,c.value(4),'hand',true);},function*(c,p,r){const id=drawnLast(r),top=at(c,p,hue(c,id));if(condition(r,top&&c.card(top).name_en.localeCompare(c.card(id).name_en,'en')<0)){c.move(id,'return',p);yield*all(c,p,()=>score(c,p),'return');}}],
 'A013:0':[
  function*(c,p,r){r.facts.color=yield*chooseColor(c,p);},
  function*(c,p){for(const o of c.state.players)c.reveal(o.id,[...o.hand]);},
  function*(c,p,r){const col=r.facts.color,ids=hand(c,p).filter(id=>hue(c,id)===col);if(condition(r,ids.length&&!c.state.players.some(o=>o.id!==p&&o.hand.some(id=>hue(c,id)===col)))){const moved=yield*all(c,p,ids,'return'),ages=moved.map(id=>value(c,id));yield*all(c,p,()=>c.state.standard.filter(id=>ages.includes(value(c,id))),'achievements');}},
 ],
 'A014:0':[returnHand,function*(c,p,r){const col=hue(c,returned(r).at(-1)),owners=c.state.players.filter(o=>!c.tops(o).some(id=>artifact(c,id)));if(col)yield*all(c,p,()=>owners.flatMap(o=>pile(c,o.id,col)),'score');}],
 'A015:0':[
  function*(c,p,r){r.facts.color=yield*chooseColor(c,p);},
  function*(c,p){c.draw(p,c.value(1));},
  function*(c,p,r){yield*pickByTrait(c,p,'hand',id=>hue(c,id)===r.facts.color,'meld','融合所选颜色的手牌。');},
  function*(c,p,r){if(condition(r,r.previous)){const id=melded(r),col=r.facts.color||hue(c,id);if(col)c.splay(p,col,'left');yield*anyAchievement(c,p,1,[value(c,id)]);}},
 ],
 'A018:0':[returnHand,function*(c,p,r){yield*unqualifiedClaim(c,p,[value(c,returned(r).at(-1))]);}],
 'A019:1':[
  function*(c,p){yield*pickByTrait(c,p,'hand',id=>!icon(c,id,4),'score','计分没有权威的手牌。');},
  function*(c,p,r){if(condition(r,r.previous))junkDeck(c,p,value(c,scored(r).at(-1)));},
  function*(c,p,r){if(condition(r,r.otherwise))c.move('A019','tuck',p);},
 ],
 'A021:0':[
  meldHand,scoreHand,
  function*(c,p,r){const a=melded(r),b=scored(r).at(-1);if(condition(r,a&&b&&value(c,a)!==value(c,b))){junkDeck(c,p,value(c,a));junkDeck(c,p,value(c,b));}},
 ],
 'A022:0':[function*(c,p){c.draw(p,c.value(3),'meld');},function*(c,p,r){const col=hue(c,drawnLast(r)),id=col&&pile(c,p,col)[0];if(id&&c.move(id,'meld',p))yield*c.selfExecute(p,id);}],
 'A023:0':[
  function*(c,p,r){r.facts.set=yield*anySet(c,p);},
  function*(c,p,r){for(let i=0;i<2;i++)c.draw(p,c.value(2),'hand',false,r.facts.set||null);},
  function*(c,p,r){const ids=drawn(r).filter(id=>hand(c,p).includes(id)),moved=yield*take(c,p,ids,'meld');for(const id of ids.filter(id=>!moved.includes(id)&&hand(c,p).includes(id)))c.transfer(id,'meld',c.other(p));},
 ],
 'A024:0':[function*(c,p,r){r.facts.value=c.highest(c.p(p));c.draw(p,r.facts.value,'hand',false,'artifacts');},function*(c,p,r){yield*all(c,p,()=>c.state.expansionSupply.artifacts?.[r.facts.value]||[],'junk');}],
 'A024:1':[function*(c,p,r){const [id]=yield*c.choose(p,'选择一位玩家。',c.state.players.map(o=>({value:o.id,label:o.name})));r.facts.target=id;},function*(c,p,r){yield*anyAchievement(c,p,1,[c.highest(c.p(r.facts.target||p))]);}],
 'A025:1':[function*(c,p,r){r.facts.selected=yield*c.pick(p,'选择一张其他紫色置顶牌。',c.state.players.flatMap(o=>c.tops(o)).filter(id=>id!=='A025'&&hue(c,id)==='PURPLE'));},function*(c,p,r){const id=(r.facts.selected||fact(r,'chosen'))[0];if(id)yield*c.selfExecute(p,id);}],
 'A029:0':[
  function*(c,p){c.draw(p,c.value(4),'hand',true);},
  function*(c,p,r){const id=drawnLast(r);if(condition(r,hue(c,id)==='YELLOW'))c.move(id,'tuck',p);},
  function*(c,p,r){const id=drawnLast(r);if(condition(r,hue(c,id)==='PURPLE'))c.move(id,'score',p);},
  function*(c,p,r){if(condition(r,r.otherwise))yield*r.repeat();},
 ],
 'A030:0':[returnHand,function*(c,p,r){yield*take(c,p,hand(c,p),'score',value(c,returned(r).at(-1)));},function*(c,p,r){junkDeck(c,p,ageSum(c,scored(r)));}],
 'A031:0':[
  function*(c,p,r){r.facts.color=yield*chooseColor(c,p,colors.filter(col=>pile(c,p,col).length>1&&c.p(p).splay[col]==='none'));if(r.facts.color)c.splay(p,r.facts.color,'right');},
  function*(c,p,r){r.facts.value=r.facts.color?pile(c,p,r.facts.color).length:0;yield*anyAchievement(c,p,1,[r.facts.value]);},
  function*(c,p,r){if(condition(r,!r.previous))c.draw(p,r.facts.value??0);},
 ],
 'A032:0':[function*(c,p){yield*all(c,p,()=>hand(c,p),'return');},function*(c,p,r){c.draw(p,returned(r).length);}],
 'A033:0':[function*(c,p){yield*reveal(c,p,hand(c,p));},function*(c,p,r){if(condition(r,r.previous)){const col=hue(c,fact(r,'revealed').at(-1));if(!col)return;c.splay(p,col,'left');const [id]=yield*c.pick(p,'选择该色的其他置顶牌自执行。',c.state.players.flatMap(o=>c.tops(o)).filter(id=>id!=='A033'&&hue(c,id)===col));if(id)yield*c.selfExecute(p,id);}}],
 'A034:0':[
  function*(c,p){c.draw(p,c.value(3),'hand',true);},
  function*(c,p,r){if(condition(r,hue(c,drawnLast(r))==='YELLOW'))yield*all(c,p,()=>hand(c,p),'return');},
  function*(c,p,r){if(condition(r,hue(c,drawnLast(r))==='GREEN'))for(const col of colors)c.splay(p,col,'none');},
  function*(c,p,r){if(condition(r,hue(c,drawnLast(r))==='RED'))yield*all(c,p,()=>score(c,p),'return');},
  function*(c,p,r){if(condition(r,hue(c,drawnLast(r))==='BLUE'))c.draw(p,c.value(9));},
 ],
 'A035:0':[
  returnHand,
  function*(c,p,r){if(condition(r,r.previous)){const col=hue(c,returned(r).at(-1)),top=at(c,p,col);if(top)c.move(top,'return',p);else r.fail();yield*pickByTrait(c,p,'score',id=>hue(c,id)===col,'return','归还同色计分牌。');r.facts.returnedThree=r.previous&&!!top;}},
  function*(c,p,r){if(condition(r,r.previous&&(r.facts.returnedThree??returned(r).length>=3)))yield*unqualifiedClaim(c,p);},
 ],
 'A036:0':[
  function*(c,p,r){r.facts.value=yield*chooseValue(c,p,c.values().filter(n=>n!==c.value(5)));},
  function*(c,p,r){const affected=[];for(const o of c.state.players){const ids=yield*all(c,p,()=>score(c,o.id).filter(id=>value(c,id)===r.facts.value),'return');if(ids.length)affected.push(o.id);}r.facts.affectedScores=affected;},
  function*(c,p,r){yield*draw(c,p,(r.facts.affectedScores||[]).length,c.value(5),'score');},
  function*(c,p,r){const ids=scored(r);if(condition(r,ids.length&&ids.every(id=>value(c,id)===c.value(5))))junkDeck(c,p,r.facts.value);},
 ],
 'A039:0':[
  function*(c,p,r){const [n]=yield*c.choose(p,'选择一个张数。',Array.from({length:c.cards.size+1},(_,i)=>({value:String(i),label:`${i} 张`})));r.facts.number=Number(n);r.facts.color=yield*chooseColor(c,p);},
  function*(c,p){yield*draw(c,p,5,c.value(4));c.reveal(p,[...hand(c,p)]);},
  function*(c,p,r){const col=r.facts.color,ids=hand(c,p).filter(id=>hue(c,id)===col);if(condition(r,ids.length===(r.facts.number??r.facts.value))){yield*all(c,p,ids,'score');if(col)c.splay(p,col,'right');}},
  function*(c,p,r){if(condition(r,r.otherwise))yield*all(c,p,()=>hand(c,p),'return');},
 ],
 'A040:1':[function*(c,p){yield*draw(c,p,3,c.value(4));},function*(c,p){yield*pickByTrait(c,p,'hand',id=>hue(c,id)==='GREEN','meld','融合绿色手牌。');},function*(c,p){junkDeck(c,p,topAge(c,p,'GREEN'));}],
 'A041:0':[function*(c,p,r){if(condition(r,hand(c,p).length<4))yield*all(c,p,tops(c,p).filter(id=>hue(c,id)!=='GREEN'),'return');},function*(c,p,r){yield*draw(c,p,returned(r).length,c.value(5));}],
 'A043:0':[
  returnScore,
  function*(c,p,r){if(condition(r,r.previous)){const types=iconTypes(c,returned(r).at(-1)),ids=[c.draw(p,c.value(5)),c.draw(p,c.value(6))].filter(Boolean),matching=ids.filter(id=>iconTypes(c,id).some(n=>types.includes(n)));r.facts.cannotReveal=!matching.length;if(matching.length)yield*reveal(c,p,matching);else{c.reveal(p,ids);r.fail();}}},
  function*(c,p,r){if(condition(r,r.facts.cannotReveal??!r.previous)){yield*all(c,p,drawn(r).filter(id=>hand(c,p).includes(id)),'return');yield*r.repeat();}},
 ],
 'A044:0':[function*(c,p){c.reveal(p,[...hand(c,p)]);},function*(c,p,r){if(condition(r,hand(c,p).length===5&&new Set(hand(c,p).map(id=>hue(c,id))).size===5))c.win(p,'五张手牌为五种颜色。');}],
 'A047:0':[function*(c,p,r){if(condition(r,!score(c,p).length)){const col=yield*chooseColor(c,p);if(col)yield*all(c,p,()=>pile(c,p,col),'score');}},function*(c,p,r){if(condition(r,r.otherwise))yield*all(c,p,()=>score(c,p),'return');}],
 'A049:0':[function*(c,p){const id=c.draw(p,c.value(6),'hand',true);if(id)c.move(id,'return',p);},function*(c,p,r){const col=hue(c,returned(r).at(-1));c.draw(p,col?topAge(c,p,col):0,'meld');},selfMelded],
 'A050:0':[function*(c,p){c.draw(p,c.value(5),'meld');},function*(c,p,r){if(condition(r,drawnLast(r)&&hue(c,drawnLast(r))!=='GREEN'))yield*r.repeat();}],
 'A051:0':[scoreBottoms,function*(c,p){yield*take(c,p,score(c,p),'meld');},function*(c,p,r){const col=hue(c,melded(r));if(col)c.splay(p,col,'right');},function*(c,p,r){junkDeck(c,p,value(c,melded(r)));}],
 'A052:0':[function*(c,p){yield*take(c,p,low(c,hand(c,p)),'return');yield*take(c,p,low(c,tops(c,p)),'return');},function*(c,p,r){c.draw(p,ageSum(c,returned(r)),'score');}],
 'A053:0':[function*(c,p){yield*all(c,p,tops(c,p).filter(id=>hue(c,id)!=='BLUE'),'return');},function*(c,p,r){for(const age of returned(r).map(id=>value(c,id)).sort((a,b)=>a-b))c.draw(p,age+1,'meld');}],
 'A054:0':[function*(c,p){c.draw(p,c.value(6),'hand',true);},function*(c,p,r){if(condition(r,hue(c,drawnLast(r))==='RED'))yield*unqualifiedClaim(c,p,null,true);},function*(c,p,r){if(condition(r,r.otherwise))yield*standardJunk(c,p);}],
 'A055:0':[meldHand,function*(c,p,r){if(condition(r,r.previous))yield*unqualifiedClaim(c,p,[value(c,melded(r))]);},function*(c,p,r){if(condition(r,r.otherwise)&&c.state.standard.length)junkDeck(c,p,Math.min(...c.state.standard.map(id=>value(c,id))));}],
 'A059:0':[function*(c,p){c.draw(p,c.value(6),'meld');},function*(c,p,r){const id=melded(r),col=hue(c,id);if(condition(r,col&&colors.every(v=>visibleCount(c,p,col)<=visibleCount(c,p,v)))){c.move(id,'score',p);yield*r.repeat();}}],
 'A060:0':[function*(c,p){c.draw(p,c.value(1),'score');},function*(c,p,r){r.facts.value=Math.ceil(ageSum(c,score(c,p))/5);r.succeed();},function*(c,p,r){c.draw(p,r.facts.value??0,'score');},junkAge],
 'A061:0':[
  function*(c,p,r){r.facts.colors=yield*c.choose(p,'选择三种颜色。',colors.map(value=>({value,label:value})),3,3);},
  function*(c,p){c.draw(p,c.value(8),'hand',true);},
  function*(c,p,r){const id=drawnLast(r),col=hue(c,id);if(condition(r,fact(r,'colors').includes(col))){c.move(id,'score',p);c.splay(p,col,'up');}},
  function*(c,p,r){const col=hue(c,drawnLast(r));if(condition(r,r.otherwise)&&col){yield*all(c,p,()=>score(c,p).filter(id=>hue(c,id)===col),'return');c.splay(p,col,'none');}},
 ],
 'A062:0':[
  function*(c,p,r){const ids=yield*take(c,p,hand(c,p),'return');r.facts.firstReturn=ids[0];},
  function*(c,p,r){const ids=yield*take(c,p,tops(c,p),'return');r.facts.secondReturn=ids[0];},
  function*(c,p,r){const ids=r.facts.firstReturn||r.facts.secondReturn?[r.facts.firstReturn,r.facts.secondReturn].filter(Boolean):returned(r);r.facts.sum=ageSum(c,ids);if(condition(r,ids.length===2&&r.facts.sum===10))c.draw(p,c.value(10),'score');},
  function*(c,p,r){if(condition(r,r.otherwise))junkDeck(c,p,r.facts.sum??ageSum(c,returned(r)));},
 ],
 'A063:0':[
  function*(c,p){yield*take(c,p,hand(c,p),'tuck');},
  function*(c,p,r){r.facts.color=hue(c,fact(r,'tucked').at(-1));if(r.facts.color)c.splay(p,r.facts.color,'right');},
  function*(c,p,r){const counts={},col=r.facts.color;if(col)for(const m of c.visible(c.p(p),col)){const n=isBonus(m.icon)?100:m.icon;if(c.iconTypes().includes(n))counts[n]=(counts[n]||0)+1;}c.draw(p,Math.max(0,...Object.values(counts)));},
 ],
 'A064:0':[function*(c,p,r){r.facts.color=yield*chooseColor(c,p,high(c,tops(c,p)).map(id=>hue(c,id)));},function*(c,p,r){const id=r.facts.color&&pile(c,p,r.facts.color)[0];if(id)c.move(id,'meld',p);}],
 'A064:1':[function*(c,p){yield*unqualifiedClaim(c,p,null,true);},standardJunk],
 'A065:0':[
  function*(c,p){const ids=yield*reveal(c,p,hand(c,p),2);yield*all(c,p,ids,'return');},
  function*(c,p,r){const ids=returned(r);if(condition(r,ids.length===2&&value(c,ids[0])===value(c,ids[1])))c.draw(p,value(c,ids[0])+1);},
  function*(c,p,r){const ids=returned(r);if(condition(r,ids.length===2&&hue(c,ids[0])===hue(c,ids[1])))yield*unqualifiedClaim(c,p);},
 ],
 'A067:1':[function*(c,p){c.draw(p,c.value(8),'meld');},function*(c,p,r){if(condition(r,value(c,drawnLast(r))===c.value(8)))junkDeck(c,p,yield*chooseValue(c,p));}],
 'A069:0':[
  function*(c,p){yield*take(c,p,hand(c,p),'tuck');},
  function*(c,p,r){if(condition(r,r.previous)){const col=hue(c,fact(r,'tucked').at(-1));if(col){c.splay(p,col,'up');yield*all(c,p,()=>score(c,p).filter(id=>hue(c,id)===col),'tuck');}}},
  function*(c,p,r){if(condition(r,r.previous))yield*standardJunk(c,p);},
 ],
 'A070:0':[
  chooseAge,function*(c,p,r){yield*draw(c,p,3,r.facts.value??0,'hand',true);},
  function*(c,p,r){r.facts.drawnColors=[...new Set(drawn(r).map(id=>hue(c,id)))];for(const col of r.facts.drawnColors)c.splay(p,col,'up');},
  function*(c,p,r){const cols=r.facts.drawnColors||[...new Set(drawn(r).map(id=>hue(c,id)))];if(condition(r,drawn(r).length===3&&cols.every(col=>pile(c,p,col).length===r.facts.value)))c.win(p,'米原器：抽牌颜色的牌数等于所选时代。');},
  function*(c,p,r){if(condition(r,r.otherwise))yield*all(c,p,drawn(r).filter(id=>hand(c,p).includes(id)),'return');},
 ],
 'A071:1':[function*(c,p){c.draw(p,c.value(7),'hand',true);},function*(c,p,r){const id=drawnLast(r);if(condition(r,id&&!icon(c,id,6))){c.move(id,'tuck',p);yield*r.repeat();}}],
 'A072:0':[
  function*(c,p,r){const pool=tops(c,p).filter(id=>tops(c,p).some(v=>v!==id&&value(c,v)===value(c,id))),[a]=yield*c.pick(p,'选择第一张同代置顶牌。',pool),[b]=yield*c.pick(p,'选择第二张同代置顶牌。',pool.filter(v=>v!==a&&value(c,v)===value(c,a)));r.facts.pair=[a,b].filter(Boolean);if(!a||!b)r.fail();},
  function*(c,p,r){if(condition(r,r.previous)){const pair=r.facts.pair||fact(r,'chosen');r.facts.pairColors=pair.map(id=>hue(c,id));c.draw(p,value(c,pair[0])+1,'meld');}},
  function*(c,p,r){if(condition(r,(r.facts.pairColors||[]).includes(hue(c,melded(r)))&&r.previous))yield*r.repeat();},
 ],
 'A073:0':[
  function*(c,p){c.draw(p,c.value(8),'tuck');},
  function*(c,p,r){const col=hue(c,fact(r,'tucked').at(-1));r.facts.color=col;if(col)c.splay(p,col,'up');},
  function*(c,p,r){const col=r.facts.color||hue(c,fact(r,'tucked').at(-1));r.facts.value=col?pile(c,p,col).length:0;c.draw(p,r.facts.value,'score');},junkAge,
 ],
 'A074:0':[function*(c,p){yield*take(c,p,high(c,score(c,p)),'meld');},function*(c,p,r){yield*draw(c,p,2,value(c,melded(r)),'score');},selfMelded],
 'A075:0':[
  function*(c,p){yield*draw(c,p,c.state.players.length,c.value(7),'hand',true);},
  function*(c,p,r){for(const o of c.state.players.filter(o=>o.id!==p))yield*take(c,p,drawn(r).filter(id=>hand(c,p).includes(id)),'meld',1,1,o.id,'transfer');},
  function*(c,p,r){const ids=yield*take(c,p,drawn(r).filter(id=>hand(c,p).includes(id)),'meld');if(ids[0])yield*c.selfExecute(p,ids[0]);},
 ],
 'A078:0':[chooseAge,function*(c,p,r){for(const col of colors)if(at(c,p,col)&&topAge(c,p,col)===r.facts.value)c.splay(p,col,'up');},function*(c,p,r){for(const o of c.state.players)yield*all(c,p,()=>score(c,o.id).filter(id=>value(c,id)===r.facts.value),'return');}],
 'A081:0':[returnHand,function*(c,p,r){const age=value(c,returned(r).at(-1));for(let i=0;i<3;i++){const id=c.draw(p,age,'score');if(!c.didDraw(id,'score',age))r.fail();}},function*(c,p,r){if(condition(r,!r.previous))junkDeck(c,p,maxAge(c,scored(r)));}],
 'A082:0':[function*(c,p){c.draw(p,c.highest(c.p(p))+1,'meld');},standardJunk,function*(c,p,r){const id=melded(r);if(condition(r,!r.previous&&id&&c.card(id).spots.filter(n=>n===6).length>=3))c.win(p,'沥青滴落实验：未移除成就且融合至少三个效率的牌。');}],
 'A083:0':[function*(c,p){for(const n of c.values().filter(n=>n<9).reverse())yield*take(c,p,tops(c,p).filter(id=>value(c,id)===n),'junk');},function*(c,p,r){if(condition(r,c.values().filter(n=>n<9).every(n=>c.state.junk.some(id=>value(c,id)===n))))c.win(p,'移除区包含每个低于 9 的时代。');}],
 'A084:0':[function*(c,p){yield*pickByTrait(c,p,'hand',id=>value(c,id)===c.value(8),'meld','融合时代 8 手牌。');},function*(c,p,r){const id=melded(r);if(condition(r,id&&!c.card(id).effects.length))c.win(p,'红宝石鞋：融合无效果牌。');},function*(c,p,r){if(condition(r,r.otherwise))yield*selfMelded(c,p,r);}],
 'A085:1':[
  function*(c,p){c.draw(p,c.value(8),'hand',true);},
  function*(c,p,r){const col=hue(c,drawnLast(r));if(!col)return;const owners=c.state.players.slice().sort((a,b)=>topAge(c,b.id,col)-topAge(c,a.id,col));if(topAge(c,owners[0].id,col)<=topAge(c,owners[1].id,col)){r.fail();return;}const o=owners[0].id,id=at(c,o,col);if(id)c.move(id,'achievements',o);},repeatDone,
 ],
 'A089:0':[function*(c,p){yield*draw(c,p,2,c.value(10),'meld');},function*(c,p,r){const ids=fact(r,'melded');if(condition(r,ids.length===2&&hue(c,ids[0])===hue(c,ids[1])))c.win(p,'奥德赛：融合两张同色牌。');}],
 'A091:0':[function*(c,p){yield*all(c,p,()=>hand(c,p),'return');},function*(c,p){yield*draw(c,p,5,c.value(9),'hand',true);},function*(c,p,r){if(condition(r,new Set(fact(r,'revealed').map(id=>hue(c,id))).size===5))c.win(p,'辛科姆三号：展示五色牌。');}],
 'A092:0':[function*(c,p){const id=c.draw(p,c.value(9),'meld');if(id)yield*c.selfExecute(p,id);},function*(c,p,r){if(condition(r,icon(c,drawnLast(r),6)))yield*r.repeat();}],
 'A093:0':[function*(c,p){yield*all(c,p,()=>score(c,p),'return');},function*(c,p,r){c.draw(p,returned(r).length,'score');}],
 'A093:1':[chooseAge,junkAge],
 'A094:0':[function*(c,p,r){const id=at(c,p,'BLUE');const before=c.changed();if(id)yield*c.selfExecute(p,id);r.facts.changed=c.changed()!==before;},function*(c,p,r){if(condition(r,r.facts.changed??r.previous)){c.draw(p,c.value(10),'junk');yield*r.repeat();}}],
 'A095:0':[function*(c,p){yield*take(c,p,hand(c,p),'score',0,1);},function*(c,p){yield*take(c,p,score(c,p),'hand',0,1,p,'transfer');},function*(c,p,r){if(condition(r,c.score(c.p(p))===25))c.win(p,'玛丽莲双联画：恰好 25 分。');}],
 'A098:0':[
  function*(c,p){const id=pile(c,p,'YELLOW')[0];if(id)yield*optional(c,p,function*(){c.move(id,'score',p);});},
  function*(c,p){yield*optional(c,p,function*(){c.draw(p,c.value(1),'tuck');});},
  function*(c,p,r){if(condition(r,pile(c,p,'YELLOW')[0]==='B005'))c.win(p,'多莉羊：黄色底牌是驯化。');},
  function*(c,p,r){if(condition(r,r.otherwise)){yield*take(c,p,high(c,hand(c,p)),'meld');c.draw(p,c.value(11));}},
 ],
 'A100:0':[
  function*(c,p,r){if(condition(r,c.state.players.filter(o=>o.id!==p).every(o=>score(c,p).length>o.score.length)))c.win(p,'特斯拉跑车：计分区牌数独自最多。');},
  function*(c,p,r){if(condition(r,r.otherwise))c.draw(p,c.value(11),'hand',true);},
  function*(c,p,r){const col=hue(c,drawnLast(r));if(col)yield*all(c,p,()=>pile(c,p,col),'score');},
  function*(c,p,r){if(condition(r,r.previous)&&drawnLast(r))c.move(drawnLast(r),'return',p);},
  function*(c,p,r){if(condition(r,r.otherwise)&&drawnLast(r))c.move(drawnLast(r),'meld',p);},
 ],
 'A106:0':[function*(c,p,r){r.facts.value=yield*chooseValue(c,p,c.values().filter(n=>!tops(c,p).some(id=>value(c,id)===n)));},function*(c,p,r){yield*all(c,p,()=>c.state.supply[r.facts.value]||[],'score');},function*(c,p,r){yield*all(c,p,()=>c.state.junk.filter(id=>value(c,id)===r.facts.value),'score');}],
 'A108:0':[function*(c,p){yield*draw(c,p,2,c.value(11));},function*(c,p,r){const ids=drawn(r).filter(id=>hand(c,p).includes(id)),first=yield*take(c,p,ids,'meld'),rest=yield*take(c,p,ids.filter(id=>!first.includes(id)&&hand(c,p).includes(id)),'meld');if(rest[0])yield*artRun(c,p,rest[0]);}],
 'A109:0':[
  function*(c,p,r){const [id]=yield*c.pick(p,'选择计分牌。',score(c,p));r.facts.exchangeScore=id;},
  function*(c,p,r){const source=r.facts.exchangeScore||last(r),[id]=yield*c.pick(p,'选择同色置顶牌。',c.state.players.flatMap(o=>c.tops(o)).filter(id=>hue(c,id)===hue(c,source)));r.facts.exchangeTop=id;},
  function*(c,p,r){const a=r.facts.exchangeScore,b=r.facts.exchangeTop;if(a&&b)c.exchange([a],'meld',c.location(b).owner.id,[b],'score',p);else r.fail();},
  function*(c,p,r){yield*optional(c,p,function*(){const ids=yield*take(c,p,hand(c,p),'return',2);if(ids.length!==2)r.fail();});},
  repeatDone,
 ],
 'A110:1':[function*(c,p){yield*take(c,p,tops(c,p).filter(id=>icon(c,id,1)),'return');},repeatDone],
 'A111:0':[function*(c,p){for(const o of c.state.players)yield*all(c,p,()=>score(c,o.id),'junk');},function*(c,p,r){if(condition(r,!r.previous))for(const o of c.state.players){const [id]=yield*c.pick(p,'选择该玩家最高的置顶牌。',high(c,tops(c,o.id)));if(id)yield*all(c,p,tops(c,o.id).filter(v=>hue(c,v)!==hue(c,id)),'score',o.id,'','transfer');}}],
 'A114:0':[function*(c,p,r){r.facts.color=yield*chooseColor(c,p,colors.filter(col=>pile(c,p,col).length));},function*(c,p,r){if(r.facts.color)for(const o of c.state.players)yield*all(c,p,()=>pile(c,o.id,r.facts.color),'junk');}],
 'A114:1':[function*(c,p,r){const [id]=yield*c.pick(p,'选择移除区中有时代的牌。',c.state.junk.filter(id=>value(c,id)>=0),1,1,true);r.facts.value=value(c,id);},function*(c,p,r){yield*all(c,p,()=>c.state.junk.filter(id=>value(c,id)===r.facts.value),'score');},function*(c,p,r){if(condition(r,r.previous&&ageSum(c,scored(r))<11))yield*r.repeat();}],
};
