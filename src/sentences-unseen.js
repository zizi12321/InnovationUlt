import {colors,hand,tops,pile,score,high,low,maxAge,topAge,all,chooseColor,chooseValue,splay,last,fact,at,value,hue,icon,condition,draw,take,reveal,optional} from './sentence-helpers.js';
import {iconTypes,expansion} from './effects-echoes-helpers.js';
import {safe,standard,safeguard,safeguardAvailable,group,chooseMode,scoreHandValue} from './effects-unseen-helpers.js';
import {artRun} from './effects-artifacts-helpers.js';
const returned=r=>fact(r,'returned'),drawn=r=>fact(r,'drawn'),melded=r=>fact(r,'melded').at(-1),tucked=r=>fact(r,'tucked').at(-1),secured=r=>fact(r,'safeguarded').at(-1);
const drawnLast=r=>drawn(r).at(-1);
function* repeatDone(c,p,r){if(condition(r,r.previous))yield*r.repeat();}
function* legendStep(c,p,col){const id=at(c,p,col);if(!id)return false;yield*c.selfExecute(p,id);const target=at(c,p,col);if(!target)return false;const age=value(c,target);if(!c.move(target,'score',p))return false;c.remember('U045',p,(c.recall('U045',p)||0)+age);return true;}
function* quoteLoop(c,p,index,previous){while(true){const [deck]=yield*c.choose(p,`提词器：选择牌库，执行第 ${index+1} 句。`,c.deckOptions());if(!deck)return;const id=c.peekDeck(deck);if(!id)return;c.reveal(p,[id]);const result=yield*c.executeSentence(p,id,index,previous);if(!result.executed)return;c.move(id,'return',p);previous=result;index++;}}

export const UNSEEN_SENTENCES = {
 'U003:0':[
  function*(c,p){yield*take(c,p,hand(c,p).filter(id=>value(c,id)===1),'return',0,1);},
  function*(c,p,r){if(condition(r,r.previous)){let age=value(c,returned(r).at(-1));yield*safeguardAvailable(c,p,[age]);while(true){age++;const ids=yield*take(c,p,hand(c,p).filter(id=>value(c,id)===age),'return',0,1);if(!ids.length)return;yield*safeguardAvailable(c,p,[age]);}}},
 ],
 'U005:1':[function*(c,p){yield*take(c,p,low(c,standard(c)),'hand',0,1,p,'transfer');},function*(c,p,r){if(condition(r,r.previous))yield*all(c,p,()=>[...pile(c,p,'YELLOW'),...pile(c,p,'BLUE')],'return');}],
 'U006:0':[function*(c,p){c.draw(p,c.value(2),'meld');},function*(c,p,r){const id=melded(r),col=hue(c,id);if(condition(r,col&&pile(c,p,col)[0]===id))c.move(id,'score',p);}],
 'U007:0':[function*(c,p){yield*take(c,p,tops(c,p).filter(id=>icon(c,id,4)),'meld',1,1,c.other(p),'transfer');},function*(c,p,r){if(condition(r,r.previous))yield*take(c,p,low(c,tops(c,r.facts.target||c.other(p)).filter(id=>!icon(c,id,4))),'meld');}],
 'U008:0':[function*(c,p){yield*take(c,p,score(c,p),'return');},function*(c,p,r){if(condition(r,r.previous))c.draw(p,value(c,returned(r).at(-1))+1);}],
 'U011:1':[function*(c,p){yield*take(c,p,hand(c,p),'return',2);},function*(c,p,r){if(condition(r,r.previous))c.draw(p,c.value(2),'score');}],
 'U012:0':[
  function*(c,p){const id=c.draw(p,c.value(1),'hand',true);if(id)c.move(id,'return',p);},
  function*(c,p,r){if(condition(r,['YELLOW','PURPLE'].includes(hue(c,returned(r).at(-1))))){yield*safeguardAvailable(c,p,hand(c,p).map(id=>value(c,id)));yield*all(c,p,()=>hand(c,p),'return');}},
  function*(c,p,r){if(condition(r,r.otherwise))yield*draw(c,p,2,c.value(1));},
 ],
 'U013:0':[
  function*(c,p,r){const ids=yield*group(c,p,[...hand(c,p)],2,ids=>hue(c,ids[0])===hue(c,ids[1]),'选择两张同色手牌垫底。');if(condition(r,ids.length===2))yield*all(c,p,ids,'tuck');else{c.reveal(p,[...hand(c,p)]);r.fail();}},
  function*(c,p,r){if(condition(r,r.previous)){const col=hue(c,tucked(r));if(col){c.splay(p,col,'left');c.draw(p,value(c,pile(c,p,col)[0]),'safeguard');}}},
 ],
 'U014:0':[function*(c,p){const seen=c.recall('U014',p)||[],ids=yield*take(c,p,hand(c,p).filter(id=>iconTypes(c,id).every(n=>!seen.includes(n))),'meld');if(ids[0])c.remember('U014',p,[...new Set([...seen,...iconTypes(c,ids[0])])]);},repeatDone],
 'U015:0':[
  function*(c,p,r){if(condition(r,Object.values(c.icons(c.p(p))).filter(n=>n>=4).length>=4))c.draw(p,c.value(4));},
  function*(c,p,r){const matches=Object.values(c.icons(c.p(p))).filter(n=>n>=3).length>=3;r.facts.previousAlternative=!r.otherwise;if(condition(r,r.otherwise&&matches))c.draw(p,c.value(3));},
  function*(c,p,r){if(condition(r,!r.facts.previousAlternative&&r.otherwise&&Object.values(c.icons(c.p(p))).filter(n=>n>=2).length>=2))c.draw(p,c.value(2));},
 ],
 'U017:0':[
  function*(c,p){c.draw(p,c.value(2),'hand',true);},
  function*(c,p,r){const id=drawnLast(r);yield*safeguard(c,p,hand(c,p).filter(v=>v!==id&&hue(c,v)===hue(c,id)),true);},
  function*(c,p,r){if(condition(r,r.previous)&&drawnLast(r))c.move(drawnLast(r),'score',p);},
  function*(c,p,r){if(condition(r,r.otherwise))yield*all(c,p,()=>hand(c,p).filter(id=>id!==drawnLast(r)),'return');},
 ],
 'U019:1':[function*(c,p,r){r.facts.value=colors.filter(col=>c.p(p).splay[col]!=='none').length;yield*safeguardAvailable(c,p,[r.facts.value]);},function*(c,p,r){const [id]=yield*c.pick(p,'转移所选时代的手牌至任意面板。',hand(c,p).filter(id=>value(c,id)===r.facts.value));if(id){const [o]=yield*c.choose(p,'选择目标面板。',c.state.players.map(o=>({value:o.id,label:o.name})));c.transfer(id,'meld',o);}}],
 'U020:0':[function*(c,p){yield*all(c,p,()=>hand(c,p),'return');},function*(c,p,r){if(condition(r,returned(r).length>=2))c.draw(p,maxAge(c,returned(r))+1);}],
 'U020:1':[function*(c,p){c.draw(p,c.value(2));},function*(c,p){yield*splay(c,p,['BLUE'],'left');}],
 'U021:0':[function*(c,p){const ages=score(c,p).map(id=>value(c,id));yield*take(c,p,tops(c,p).filter(id=>!ages.includes(value(c,id))),'score');},repeatDone],
 'U022:1':[function*(c,p){c.draw(p,c.visibleCardCount(p,'PURPLE'),'meld');},function*(c,p,r){const id=melded(r);if(condition(r,id&&!icon(c,id,1)))c.move(id,'tuck',p);}],
 'U023:0':[
  function*(c,p){c.draw(p,c.value(3),'hand',true);},
  function*(c,p,r){const id=drawnLast(r);if(condition(r,icon(c,id,2)))c.move(id,'score',p);},
  function*(c,p,r){const id=drawnLast(r);r.facts.previousAlternative=!r.otherwise;if(condition(r,r.otherwise&&icon(c,id,1))){c.move(id,'return',p);yield*draw(c,p,2,c.value(3));}},
  function*(c,p,r){if(condition(r,!r.facts.previousAlternative&&r.otherwise)&&drawnLast(r))c.move(drawnLast(r),'tuck',p);},
 ],
 'U025:0':[
  function*(c,p,r){r.facts.color=yield*chooseColor(c,p,colors.filter(col=>c.visible(c.p(p),col).some(m=>m.icon===3)&&pile(c,p,col).length>1&&c.p(p).splay[col]!=='left'),true);if(r.facts.color)c.splay(p,r.facts.color,'left');},
  function*(c,p,r){if(condition(r,r.previous))yield*safeguardAvailable(c,p,[r.facts.color?pile(c,p,r.facts.color).length:0]);},
  function*(c,p,r){if(condition(r,r.otherwise))c.draw(p,c.value(3),'tuck');},
 ],
 'U027:0':[function*(c,p,r){const ids=[...hand(c,p),...score(c,p)],ages=[...new Set(ids.map(id=>value(c,id)))].filter(n=>[2,3].includes(ids.filter(id=>value(c,id)===n).length));r.facts.value=yield*chooseValue(c,p,ages);},function*(c,p,r){yield*all(c,p,()=>[...hand(c,p),...score(c,p)].filter(id=>value(c,id)===r.facts.value),'score',c.other(p),'','transfer');}],
 'U028:0':[function*(c,p){for(const col of colors)yield*take(c,p,hand(c,p).filter(id=>hue(c,id)===col),'tuck',0,1);},function*(c,p,r){if(condition(r,fact(r,'tucked').some(id=>hue(c,id)==='YELLOW'||expansion(c,id))))yield*draw(c,p,2,c.value(3));}],
 'U030:0':[
  function*(c,p,r){const ids=yield*reveal(c,p,safe(c,p).filter(id=>value(c,id)===c.value(4)));r.facts.secretShown=ids[0];},
  function*(c,p,r){const id=r.facts.secretShown||fact(r,'revealed').at(-1);if(condition(r,!!id)){const col=hue(c,id);if(col==='BLUE')c.draw(p,c.value(5));else c.move(id,{GREEN:'tuck',PURPLE:'meld',RED:'achievements',YELLOW:'score'}[col],p);}},
  function*(c,p,r){if(condition(r,r.otherwise)){const id=c.state.supply[c.value(4)]?.at(-1);if(id)c.move(id,'safeguard',p);}},
 ],
 'U032:0':[
  function*(c,p){const n=c.recall('U032','action')??0,[age]=yield*c.choose(p,'选择时代 3 或此前融合时代加 1。',[...new Set([c.value(3),n+1])].map(n=>({value:String(n),label:`时代 ${n}`})));const id=c.draw(p,Number(age),'meld');if(id&&c.didDraw(id,'meld'))c.remember('U032','action',value(c,id));},
  function*(c,p,r){const id=melded(r),col=hue(c,id),under=col&&pile(c,p,col).at(-2);if(condition(r,icon(c,under,3)))yield*r.repeat();},
 ],
 'U033:0':[function*(c,p){yield*take(c,p,[...hand(c,p),...score(c,p)],'return',5);},function*(c,p,r){yield*draw(c,p,2,new Set(returned(r).map(id=>hue(c,id))).size);},function*(c,p,r){const ids=drawn(r),moved=yield*take(c,p,ids,'meld');yield*take(c,p,ids.filter(id=>!moved.includes(id)&&hand(c,p).includes(id)),'score');}],
 'U034:0':[
  function*(c,p){yield*safeguardAvailable(c,p,[hand(c,p).length]);},
  function*(c,p,r){if(condition(r,r.previous)){const age=value(c,secured(r));yield*all(c,p,()=>hand(c,p).filter(id=>value(c,id)===age),'return');}},
  function*(c,p,r){if(condition(r,returned(r).some(id=>value(c,id)===c.value(4))))c.claimSpecial(p,'ANONYMITY','UNSEEN');},
 ],
 'U035:0':[function*(c,p,r){r.facts.color=yield*chooseColor(c,p);},function*(c,p,r){if(r.facts.color)yield*all(c,p,()=>pile(c,p,r.facts.color),'hand',p,'','transfer');}],
 'U035:1':[function*(c,p){c.draw(p,c.value(3),'meld');},function*(c,p,r){const id=melded(r),col=hue(c,id);if(condition(r,col&&pile(c,p,col)[0]===id)){c.move(id,'score',p);yield*take(c,p,hand(c,p).filter(id=>hue(c,id)===col),'score',0,hand(c,p).length);}}],
 'U038:0':[function*(c,p){yield*take(c,p,[...hand(c,p),...score(c,p)],'meld',1,1,c.other(p),'transfer');},function*(c,p,r){if(condition(r,!r.previous))c.claimSpecial(p,'FOLKLORE','UNSEEN');}],
 'U039:0':[function*(c,p,r){const ids=yield*take(c,p,safe(c,p),'standard',1,1,p,'transfer');if(ids[0]){const n=value(c,ids[0])+1,id=c.draw(p,n);if(!c.didDraw(id,'hand',n))r.fail();}},function*(c,p,r){if(condition(r,!r.previous))yield*safeguardAvailable(c,p,[topAge(c,p,'RED')]);}],
 'U041:0':[
  function*(c,p){for(const n of [3,2,1])c.draw(p,c.value(n),'meld');},
  function*(c,p,r){if(condition(r,fact(r,'melded').filter(id=>icon(c,id,1)).length===3))yield*all(c,p,()=>c.state.supply[c.value(5)]||[],'score');},
  function*(c,p,r){if(condition(r,fact(r,'melded').filter(id=>icon(c,id,1)).length>=2)){c.splay(p,'GREEN','right');c.splay(p,'BLUE','right');}},
 ],
 'U042:1':[function*(c,p){yield*take(c,p,hand(c,p),'return',2);},function*(c,p,r){if(condition(r,r.previous))c.draw(p,returned(r).reduce((n,id)=>n+c.card(id).spots.filter(i=>i===2||i===3).length,0));}],
 'U043:0':[
  function*(c,p,r){const mode=yield*chooseMode(c,p,[['safe','抽取并保密时代 4'],['draw','按机密牌时代加 1 抽取并展示']]);r.facts.secretBasis=null;if(mode==='safe')c.draw(p,c.value(4),'safeguard');else{const [id]=yield*c.pick(p,'选择机密牌作为抽牌时代依据。',safe(c,p));r.facts.secretBasis=id;if(id)c.draw(p,value(c,id)+1,'hand',true);}},
  function*(c,p,r){if(condition(r,fact(r,'revealed').some(id=>id===drawnLast(r)&&['RED','PURPLE'].includes(hue(c,id)))))yield*take(c,p,safe(c,p).filter(id=>id!==r.facts.secretBasis),'meld');},
  function*(c,p,r){if(condition(r,r.previous)&&drawnLast(r))c.move(drawnLast(r),'safeguard',p);},
 ],
 'U044:0':[function*(c,p){yield*all(c,p,tops(c,p).filter(id=>icon(c,id,4)),'return');},function*(c,p,r){if(condition(r,!returned(r).length)){yield*take(c,p,score(c,p),'meld');c.draw(p,c.value(4),'score');}}],
 'U045:0':[
  function*(c,p,r){r.facts.color=yield*chooseColor(c,p,colors.filter(col=>col!=='PURPLE'));},
  function*(c,p,r){const id=at(c,p,r.facts.color);if(id)yield*c.selfExecute(p,id);},
  function*(c,p,r){const id=at(c,p,r.facts.color);if(id){const age=value(c,id);if(c.move(id,'score',p))c.remember('U045',p,(c.recall('U045',p)||0)+age);}},
  function*(c,p,r){if(condition(r,r.previous&&(c.recall('U045',p)||0)<9)&&r.facts.color)while((c.recall('U045',p)||0)<9&&(yield*legendStep(c,p,r.facts.color))){}},
 ],
 'U048:0':[function*(c,p){for(const n of [3,4,5,6])c.draw(p,c.value(n),'hand',true);},function*(c,p,r){yield*all(c,p,drawn(r).filter(id=>['GREEN','YELLOW'].includes(hue(c,id))),'meld');},function*(c,p,r){yield*all(c,p,drawn(r).filter(id=>hand(c,p).includes(id)),'return');}],
 'U049:1':[function*(c,p,r){if(condition(r,score(c,p).some(id=>value(c,id)===c.value(1))))c.draw(p,c.value(7));},function*(c,p,r){if(condition(r,r.otherwise))c.draw(p,c.value(5));}],
 'U050:0':[
  function*(c,p,r){r.facts.value=yield*chooseValue(c,p,c.values().filter(n=>n%2));},
  function*(c,p,r){for(const o of c.state.players)yield*all(c,p,()=>score(c,o.id).filter(id=>value(c,id)===r.facts.value),'standard',p,'','transfer');},
  function*(c,p,r){if(condition(r,fact(r,'transferred').length>=4)){c.draw(p,r.facts.value??0,'safeguard');yield*take(c,p,standard(c),'score',3);}},
 ],
 'U051:1':[function*(c,p,r){if(condition(r,c.p(p).splay.RED==='right'&&c.p(p).splay.PURPLE==='right'))c.claimSpecial(p,'MYSTERY','UNSEEN');},function*(c,p,r){if(condition(r,r.otherwise))yield*splay(c,p,['RED','PURPLE'],'right',false);}],
 'U053:1':[
  function*(c,p){const ids=[c.draw(p,c.value(6),'hand',true),c.draw(p,c.value(6),'hand',true)].filter(Boolean);yield*all(c,p,ids,'return');},
  function*(c,p,r){if(condition(r,new Set(drawn(r).flatMap(id=>iconTypes(c,id))).size===2))yield*draw(c,p,2,c.value(6),'score');},
  function*(c,p,r){if(condition(r,new Set(returned(r).flatMap(id=>iconTypes(c,id))).size===4))c.draw(p,c.value(7));},
  function*(c,p){c.draw(p,c.value(6));},
 ],
 'U054:0':[function*(c,p){yield*take(c,p,hand(c,p),'tuck');},function*(c,p,r){if(condition(r,r.previous)){const first=tucked(r),second=c.draw(p,c.value(4),'tuck'),cols=[hue(c,first),hue(c,second)].filter(Boolean);if(!cols.length)return;const col=yield*chooseColor(c,p,[...new Set(cols)]),other=cols.find(v=>v!==col)||col;yield*all(c,p,()=>pile(c,p,col),'score');c.splay(p,other,'right');}}],
 'U056:1':[
  function*(c,p){c.draw(p,c.value(6),'tuck');},
  function*(c,p,r){const col=hue(c,tucked(r));if(condition(r,col&&c.p(p).splay[col]===c.p(p).splay.RED))c.splay(p,col,'up');},
  function*(c,p,r){if(condition(r,r.otherwise)){const col=hue(c,tucked(r));if(col)c.splay(p,col,'none');}},
 ],
 'U060:0':[
  function*(c,p){c.draw(p,c.value(6),'hand',true);},
  function*(c,p,r){const id=drawnLast(r),top=at(c,p,hue(c,id));if(condition(r,icon(c,top,5))){c.move(id,'tuck',p);r.facts.secondDraw=c.draw(p,c.value(7),'hand',true);}},
  function*(c,p,r){const id=r.facts.secondDraw||drawn(r)[1];if(condition(r,icon(c,id,2))){c.move(id,'meld',p);c.draw(p,c.value(8));}},
 ],
 'U061:0':[function*(c,p){yield*safeguardAvailable(c,p,[score(c,p).length]);},function*(c,p,r){if(condition(r,r.previous)){const age=value(c,secured(r));yield*all(c,p,()=>hand(c,p).filter(id=>value(c,id)===age),'score');}}],
 'U062:0':[
  function*(c,p){const ids=yield*take(c,p,tops(c,p),'return'),col=hue(c,ids[0]);if(col)while(at(c,p,col)&&(yield*c.yes(p,'可以继续归还同色置顶牌。'))){if(!c.move(at(c,p,col),'return',p))break;}},
  function*(c,p,r){yield*draw(c,p,returned(r).length,c.value(7));},
  function*(c,p,r){if(condition(r,returned(r).filter(id=>value(c,id)===c.value(7)).length===1))c.draw(p,c.value(8));},
 ],
 'U063:1':[function*(c,p){yield*draw(c,p,3,c.value(7),'hand',true);},function*(c,p,r){yield*take(c,p,drawn(r),'return',2);},function*(c,p,r){const id=drawn(r).find(id=>!returned(r).includes(id));if(id)yield*splay(c,p,[hue(c,id)],'right');}],
 'U064:0':[
  function*(c,p){yield*reveal(c,p,hand(c,p));},
  function*(c,p,r){r.facts.color=hue(c,fact(r,'revealed').at(-1));if(r.facts.color)c.splay(p,r.facts.color,'right');},
  function*(c,p,r){const col=r.facts.color||hue(c,fact(r,'revealed').at(-1)),id=at(c,p,col);if(id)c.move(id,'safeguard',p);},
  function*(c,p,r){yield*safeguardAvailable(c,p,[value(c,secured(r))+1]);},
 ],
 'U069:0':[
  function*(c,p){c.draw(p,c.value(7),'tuck');},
  function*(c,p,r){const col=hue(c,tucked(r));if(condition(r,col&&c.visibleCardCount(p,col)>=7))c.draw(p,c.value(9));},
  function*(c,p,r){const col=hue(c,tucked(r));if(condition(r,r.otherwise)&&col){yield*all(c,p,()=>pile(c,p,col),'junk');c.draw(p,c.value(8));}},
 ],
 'U070:0':[
  function*(c,p){yield*safeguard(c,p,hand(c,p),true);},
  function*(c,p,r){if(condition(r,r.previous))yield*reveal(c,p,standard(c),2);},
  function*(c,p,r){yield*take(c,p,fact(r,'revealed').filter(id=>!icon(c,id,6)&&!icon(c,id,7)),'meld',0,1);},
  function*(c,p,r){yield*all(c,p,fact(r,'revealed').filter(id=>!fact(r,'melded').includes(id)),'return');},
 ],
 'U071:0':[function*(c,p){yield*take(c,p,score(c,p),'meld');},function*(c,p){yield*safeguard(c,p,low(c,standard(c)));},function*(c,p,r){if(condition(r,r.previous))yield*artRun(c,p,melded(r));}],
 'U075:0':[
  function*(c,p){for(const n of [1,2,3,4,5])c.draw(p,c.value(n),'hand',true);},
  function*(c,p,r){r.facts.greenCount=drawn(r).filter(id=>hue(c,id)==='GREEN').length;if(condition(r,r.facts.greenCount>=1))yield*splay(c,p,['GREEN','PURPLE'],'right',false);},
  function*(c,p,r){const n=r.facts.greenCount??drawn(r).filter(id=>hue(c,id)==='GREEN').length;yield*all(c,p,drawn(r),condition(r,n>=2)?'score':'return');},
  function*(c,p,r){if(condition(r,(r.facts.greenCount??drawn(r).filter(id=>hue(c,id)==='GREEN').length)>=3))c.win(p,'老虎机：抽出至少三张绿色牌。');},
 ],
 'U079:0':[
  function*(c,p){c.draw(p,c.value(8),'tuck');},
  function*(c,p,r){const id=tucked(r);if(condition(r,icon(c,id,5)))c.move(id,'score',p);},
  function*(c,p,r){if(condition(r,r.otherwise))r.facts.secondDraw=c.draw(p,c.value(8),'meld');},
  function*(c,p,r){const id=r.facts.secondDraw||melded(r);if(condition(r,r.previous&&id&&value(c,id)===c.value(8)))yield*r.repeat();},
 ],
 'U081:0':[
  function*(c,p,r){r.facts.target=c.other(p);r.succeed();},
  function*(c,p,r){const who=r.facts.target||c.other(p),ids=yield*take(c,who,hand(c,who),'meld',1,1,p,'transfer');r.facts.controller=who;r.facts.hitchhiker=ids[0];},
  function*(c,p,r){if(condition(r,r.previous)){const id=r.facts.hitchhiker||melded(r);if(id)yield*c.controlled(p,r.facts.controller||c.other(p),function*(){yield*c.selfExecute(p,id);});}},
 ],
 'U083:0':[
  function*(c,p){yield*draw(c,p,2,c.value(9),'hand',true);},
  function*(c,p,r){yield*take(c,p,drawn(r),'return',1,drawn(r).length);},
  function*(c,p,r){if(condition(r,returned(r).length===2)){const id=c.state.supply[c.value(10)]?.at(-1);if(id)c.reveal(p,[id]);}},
  function*(c,p,r){const id=fact(r,'revealed').at(-1);if(condition(r,id&&returned(r).some(v=>hue(c,v)===hue(c,id))))c.draw(p,c.value(10));},
 ],
 'U084:1':[function*(c,p){yield*scoreHandValue(c,p,true);},function*(c,p,r){if(condition(r,r.previous)){const id=at(c,p,'PURPLE');if(id)c.move(id,'score',p);}}],
 'U085:0':[function*(c,p){yield*reveal(c,p,high(c,score(c,p)));},function*(c,p,r){if(condition(r,r.previous)){const id=fact(r,'revealed').at(-1);if(id){c.splay(p,hue(c,id),'up');c.move(id,'safeguard',p);}}}],
 'U086:0':[
  function*(c,p,r){const cols=colors.filter(col=>c.p(p).splay[col]!=='none'),order=yield*c.choose(p,'选择还原颜色的顺序。',cols.map(value=>({value,label:value})),cols.length,cols.length);r.facts.unsplayed=order.filter(col=>c.splay(p,col,'none'));},
  function*(c,p,r){for(const col of r.facts.unsplayed||fact(r,'colors')){const id=at(c,p,col);if(id)c.move(id,'return',p);yield*safeguardAvailable(c,p);}},
 ],
 'U088:0':[
  function*(c,p,r){r.facts.wish=yield*chooseMode(c,p,[['draw','抽两张时代 10'],['score','抽取并计分两张时代 8'],['safe','保密两个可用标准成就']]);},
  function*(c,p){c.draw(p,c.value(8),'tuck');},
  function*(c,p,r){if(condition(r,icon(c,tucked(r),3))){if(r.facts.wish==='draw')yield*draw(c,p,2,c.value(10));else if(r.facts.wish==='score')yield*draw(c,p,2,c.value(8),'score');else if(r.facts.wish==='safe')for(let i=0;i<2;i++)yield*safeguardAvailable(c,p);else r.fail();}},
  function*(c,p,r){if(condition(r,['RED','PURPLE'].includes(hue(c,tucked(r)))))yield*r.repeat();},
 ],
 'U091:0':[
  function*(c,p,r){const [deck]=yield*c.choose(p,'提词器：展示一张牌库顶牌。',c.deckOptions());const id=deck&&c.peekDeck(deck);r.facts.quoteCard=id;if(id)c.reveal(p,[id]);},
  function*(c,p,r){const id=r.facts.quoteCard||fact(r,'revealed').at(-1);if(!id){r.fail();return;}r.facts.quoteResult=yield*c.executeSentence(p,id,0,null);if(r.facts.quoteResult.executed)r.succeed();else r.fail();},
  function*(c,p,r){if(condition(r,r.previous)){const id=r.facts.quoteCard||fact(r,'revealed').at(-1);if(id)c.move(id,'return',p);yield*quoteLoop(c,p,1,r.facts.quoteResult||null);}},
 ],
 'U092:0':[function*(c,p,r){r.facts.target=c.other(p);r.succeed();},function*(c,p){yield*draw(c,p,2,c.value(10),'meld');},function*(c,p,r){const [id]=yield*c.pick(r.facts.target||c.other(p),'顾问：选择一张对方置顶牌让其自执行。',tops(c,p));if(id)yield*c.selfExecute(p,id);}],
 'U093:0':[function*(c,p){c.reveal(p,[9,10].map(n=>c.state.supply[c.value(n)]?.at(-1)).filter(Boolean));},function*(c,p){yield*take(c,p,[9,10].map(n=>c.state.supply[c.value(n)]?.at(-1)).filter(Boolean),'return');}],
 'U093:1':[function*(c,p,r){if(condition(r,!tops(c,p).length))c.win(p,'费米悖论：面板没有牌。');},function*(c,p,r){if(condition(r,r.otherwise))yield*all(c,p,()=>c.state.junk,'hand',p,'','transfer');}],
 'U095:0':[function*(c,p){yield*draw(c,p,colors.filter(col=>c.visible(c.p(p),col).some(m=>m.icon===5)).length,c.value(9));},function*(c,p,r){if(condition(r,drawn(r).length===5))c.win(p,'都市传说：抽取五张牌。');}],
 'U098:1':[
  function*(c,p){yield*take(c,p,tops(c,c.other(p)).filter(id=>hue(c,id)!=='YELLOW'&&icon(c,id,6)),'meld');},
  function*(c,p,r){if(condition(r,r.previous)&&melded(r))yield*c.selfExecute(p,melded(r));},
  function*(c,p,r){if(condition(r,r.otherwise))c.draw(p,c.value(11));},
 ],
 'U100:0':[function*(c,p){yield*all(c,p,()=>score(c,p),'return');},function*(c,p,r){yield*draw(c,p,new Set(returned(r).map(id=>value(c,id))).size,c.value(10),'score');}],
 'U103:0':[function*(c,p,r){const ids=yield*take(c,p,tops(c,p),'decktop',0,1);r.facts.placed=!!ids.length;},function*(c,p){yield*take(c,p,hand(c,p),'meld',0,1);},function*(c,p,r){if(condition(r,r.facts.placed||r.previous))yield*r.repeat();}],
 'U104:0':[function*(c,p){yield*take(c,p,colors.flatMap(col=>[pile(c,p,col)[0],at(c,p,col)]).filter(Boolean),'return');},function*(c,p,r){const ids=yield*take(c,p,safe(c,p).filter(id=>value(c,id)===value(c,returned(r).at(-1))),'achievements');const stored=yield*safeguardAvailable(c,p);if(!ids.length||!stored)r.fail();},repeatDone],
 'U105:2':[function*(c,p){yield*take(c,p,hand(c,p),'meld',2);},function*(c,p){yield*take(c,p,hand(c,p),'score',4);},function*(c,p){c.splay(p,'BLUE','up');}],
 'U109:0':[function*(c,p){yield*all(c,p,tops(c,p).filter(id=>icon(c,id,1)||icon(c,id,5)),'tuck');},function*(c,p,r){yield*safeguard(c,p,fact(r,'tucked'),true);}],
 'U109:1':[function*(c,p){for(const col of ['YELLOW','PURPLE'])yield*all(c,p,pile(c,p,col).slice(0,-5),'score');},function*(c,p){for(const col of ['YELLOW','PURPLE'])c.splay(p,col,'aslant');}],
 'U110:0':[function*(c,p){yield*all(c,p,pile(c,p,'GREEN').slice(0,-1),'score');},function*(c,p,r){yield*draw(c,p,fact(r,'scored').length,c.value(11),'tuck');}],
 'U111:0':[function*(c,p){yield*take(c,p,standard(c),'achievements');},function*(c,p,r){const id=fact(r,'claimed').at(-1);if(id)yield*c.selfExecute(p,id);}],
 'U112:0':[
  function*(c,p){yield*take(c,p,colors.map(col=>pile(c,p,col)[0]).filter(Boolean),'return');},
  function*(c,p,r){r.facts.color=hue(c,returned(r).at(-1));if(r.facts.color)c.splay(p,r.facts.color,'aslant');},
  function*(c,p,r){const col=r.facts.color||hue(c,returned(r).at(-1));if(col)yield*all(c,p,()=>pile(c,p,col).filter(id=>!icon(c,id,2)),'score');},
 ],
 'U113:1':[
  function*(c,p,r){r.facts.coin=c.coin();c.log(`${c.p(p).name}抛硬币：${r.facts.coin?'赢':'输'}。`);r.succeed();},
  function*(c,p,r){if(condition(r,r.facts.coin===true))r.succeed();},
  function*(c,p,r){if(condition(r,r.facts.coin===false))yield*take(c,p,safe(c,p),'return');},
  function*(c,p,r){if(condition(r,!r.previous))c.lose(p,'量子计算机：未能归还机密牌。');},
  function*(c,p,r){if(condition(r,r.otherwise))yield*r.repeat();},
 ],
 'U114:0':[
  function*(c,p,r){r.facts.color=yield*chooseColor(c,p,['RED','BLUE','GREEN']);},
  function*(c,p,r){const col=r.facts.color;if(!col){r.fail();return;}const ids=pile(c,p,col).slice(0,-5),moved=yield*all(c,p,ids,'score');const changed=c.splay(p,col,'aslant');if(!moved.length||moved.length!==ids.length||!changed)r.fail();},
  function*(c,p,r){if(condition(r,r.previous)){const ids=low(c,score(c,p)),age=value(c,ids[0]);c.exchange(ids,'achievements',p,c.p(p).achievements.filter(id=>value(c,id)<age),'score',p);}},
 ],
 'U115:0':[function*(c,p){yield*all(c,p,colors.filter(col=>c.p(p).splay[col]!=='none').map(col=>at(c,p,col)).filter(Boolean),'score');},function*(c,p,r){if(condition(r,fact(r,'scored').length<3))c.lose(p,'元宇宙：计分不足三张。');}],
};
