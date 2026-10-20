import {colors,hand,tops,pile,score,high,maxAge,colorCount,all,chooseColor,chooseValue,choosePrintedValue,splay,junkDeck,last,fact,at,value,hue,icon,condition,draw,take,optional} from './sentence-helpers.js';
import {forecast,cardBonuses,iconTypes,bottom,visibleCount,echoes,lowAge,topValue,pickByTrait,claim,chooseBonus,anyAchievement,exactGroup} from './effects-echoes-helpers.js';
import {exchange} from './effect-helpers.js';

const returned = r => fact(r,'returned');
const drawn = r => fact(r,'drawn');
const melded = r => fact(r,'melded').at(-1);
function* junkChosen(c,p,r){yield*optional(c,p,function*(){junkDeck(c,p,r.facts.value);});}
function* claimJunk(c,p,r){if(condition(r,r.previous))yield*claim(c,p,high(c,c.state.junk));}
function* chosenValue(c,p,r,values){r.facts.value=yield*choosePrintedValue(c,p,values);}
function* meldOneReturnRest(c,p,r){const ids=drawn(r).filter(id=>hand(c,p).includes(id)),[id]=yield*c.pick(p,'提词器：融合一张新抽的牌，归还其余牌。',ids);if(id)c.move(id,'meld',p);yield*all(c,p,ids.filter(v=>v!==id),'return');}
function* stream(c,p,r){const id=at(c,p,r.facts.color);if(!id){r.fail();return;}const options=[{value:'score',label:'计分置顶牌'}];if(c.eligible(p,id))options.unshift({value:'achievements',label:'统御置顶牌'});const [to]=yield*c.choose(p,'选择统御或计分。',options);return c.move(id,to,p);}
function* scoreTwoBottom(c,p){return yield*take(c,p,colors.filter(col=>col!=='BLUE').map(col=>bottom(c,p,col)).filter(Boolean),'score',2);}
function instrumentImages(c){const visible=new Set(c.state.players.flatMap(o=>colors.flatMap(col=>c.visible(o,col))).filter(m=>m.icon===0).map(m=>m.id));return ['E013','E014','E054','E075'].filter(id=>visible.has(id));}

// 每个处理器只对应一个印刷句子。相邻句子的引用通过提词器的操作记录传递。
export const ECHOES_SENTENCES = {
 'E004:1':[function*(c,p,r){r.facts.value=c.value(1);yield*junkChosen(c,p,r);},claimJunk],
 'E005:1':[function*(c,p){c.draw(p,c.value(1),'hand',true);},function*(c,p,r){if(condition(r,hue(c,drawn(r).at(-1))==='YELLOW'))yield*all(c,p,()=>hand(c,p).filter(id=>value(c,id)===c.value(1)),'score');}],
 'E006:0':[
  function*(c,p,r){r.facts.color=yield*chooseColor(c,p);},
  function*(c,p,r){yield*take(c,p,hand(c,p).filter(id=>hue(c,id)===r.facts.color),'tuck',0,hand(c,p).length);},
  function*(c,p,r){const col=r.facts.color;if(condition(r,r.previous&&col&&c.state.players.filter(o=>o.id!==p).every(o=>topValue(c,p,col)>topValue(c,o.id,col))))yield*claim(c,p,hand(c,p),true);},
 ],
 'E007:0':[
  function*(c,p,r){r.facts.color=yield*chooseColor(c,p);yield*draw(c,p,5,c.value(1),'hand',true);},
  function*(c,p,r){yield*all(c,p,drawn(r).filter(id=>hue(c,id)!==r.facts.color),'return');},
  function*(c,p,r){if(condition(r,c.foreseen)&&r.facts.color)for(const o of c.state.players)yield*all(c,p,()=>pile(c,o.id,r.facts.color),'return');},
 ],
 'E008:1':[function*(c,p){yield*take(c,p,hand(c,p),'return',0,2);},function*(c,p,r){for(const id of returned(r)){const [to]=yield*c.choose(p,'选择抽取并融合时代 2，或抽取并预示时代 3。',[{value:'meld',label:'融合 2'},{value:'forecast',label:'预示 3'}]);c.draw(p,c.value(to==='meld'?2:3),to);}}],
 'E009:1':[function*(c,p){yield*take(c,p,hand(c,p),'return',0,hand(c,p).length);},function*(c,p,r){yield*take(c,p,hand(c,p),'score',returned(r).length*2);}],
 'E010:0':[function*(c,p){c.draw(p,c.value(1),'hand',true,'echoes');},function*(c,p,r){const id=drawn(r).at(-1),bonus=id&&cardBonuses(c,id)[0];if(condition(r,bonus))c.draw(p,bonus,'meld');}],
 'E012:1':[function*(c,p){for(let i=0;i<2;i++)c.draw(p,c.value(1),'hand',false,'echoes');},function*(c,p,r){const ids=drawn(r),[id]=yield*c.pick(p,'预示一张刚抽的牌，归还另一张。',ids);if(id)c.move(id,'foreshadow',p);for(const v of ids.filter(v=>v!==id))c.move(v,'return',p);}],
 'E014:2':[function*(c,p){c.draw(p,c.value(1),'hand',true,'echoes');},function*(c,p,r){const id=drawn(r).at(-1);if(condition(r,id&&cardBonuses(c,id).length))c.draw(p,c.value(1));}],
 'E018:2':[function*(c,p,r){r.facts.value=c.value(2);yield*junkChosen(c,p,r);},claimJunk],
 'E019:1':[function*(c,p){yield*take(c,p,hand(c,p),'tuck');},function*(c,p,r){if(condition(r,c.foreseen)){const age=value(c,fact(r,'tucked').at(-1));yield*all(c,p,()=>c.state.supply[age]||[],'tuck');}}],
 'E020:2':[function*(c,p,r){yield*chosenValue(c,p,r,[2,3]);},function*(c,p,r){junkDeck(c,p,r.facts.value);}],
 'E021:1':[function*(c,p,r){r.facts.selected=yield*c.pick(p,'可以选择至多两张手牌。',hand(c,p),0,2);},function*(c,p,r){for(const id of r.facts.selected||fact(r,'chosen')){const [to]=yield*c.choose(p,'融合还是计分所选牌？',[{value:'meld',label:'融合'},{value:'score',label:'计分'}]);c.move(id,to,p);}}],
 'E022:1':[function*(c,p){yield*take(c,p,hand(c,p),'return',0,hand(c,p).length);},function*(c,p,r){const ids=returned(r);for(const age of new Set(ids.map(id=>value(c,id))))yield*draw(c,p,Math.floor(ids.filter(id=>value(c,id)===age).length/2),age+1);}],
 'E023:1':[function*(c,p,r){const n=yield*chooseBonus(c,p,c.state.players.map(o=>o.id));r.facts.bonus=n;if(n){const id=c.draw(p,n);if(value(c,id)!==n)r.fail();}},function*(c,p,r){if(condition(r,r.previous&&c.foreseen)){const age=r.facts.bonus??value(c,drawn(r).at(-1));yield*all(c,p,()=>c.state.standard.filter(id=>value(c,id)===age),'junk');}}],
 'E024:0':[
  function*(c,p){c.draw(p,c.value(3),'forecast');},
  function*(c,p,r){const id=drawn(r).at(-1);yield*take(c,p,hand(c,p).filter(v=>v!==id&&hue(c,v)===hue(c,id)),'tuck',0,1);},
  function*(c,p,r){if(condition(r,r.previous)){const id=drawn(r).at(-1);if(id)c.move(id,'meld',p);}},
  function*(c,p,r){if(condition(r,r.previous&&c.foreseen)){const col=hue(c,melded(r));if(col)for(const o of c.state.players.filter(o=>o.id!==p))yield*all(c,p,()=>pile(c,o.id,col),'meld');}},
 ],
 'E025:0':[function*(c,p){yield*take(c,p,hand(c,p),'meld');},function*(c,p,r){c.draw(p,value(c,melded(r)),'forecast');}],
 'E028:1':[function*(c,p,r){if(condition(r,tops(c,p).some(id=>icon(c,id,4))))c.draw(p,c.value(3),'meld');},function*(c,p,r){if(condition(r,r.otherwise))c.draw(p,c.value(4));}],
 'E029:0':[function*(c,p){yield*take(c,p,hand(c,p),'return',0,hand(c,p).length);},function*(c,p,r){yield*draw(c,p,returned(r).length,c.value(3));}],
 'E030:1':[
  function*(c,p){const id=c.recall('E030',p);yield*take(c,p,id&&hand(c,p).includes(id)?[id]:[],'meld',0,1);},
  function*(c,p,r){if(condition(r,value(c,melded(r))===c.value(3)))yield*claim(c,p,[at(c,p,'GREEN')].filter(Boolean));},
  function*(c,p,r){if(condition(r,value(c,melded(r))===c.value(4))){const id=at(c,p,'GREEN');if(id)c.move(id,'return',p);}},
 ],
 'E031:1':[function*(c,p){yield*splay(c,p,['RED','GREEN'],'left');},function*(c,p,r){if(condition(r,c.foreseen))for(const col of colors)c.splay(p,col,'left');}],
 'E032:1':[function*(c,p){yield*pickByTrait(c,p,'forecast',id=>cardBonuses(c,id).length,'return','可以归还一张带奖分的预示牌。',0);},function*(c,p,r){if(condition(r,r.previous)){const id=returned(r).at(-1),bonuses=id?cardBonuses(c,id):[];c.draw(p,(bonuses.length?Math.max(...bonuses):0)+1,'score');}}],
 'E033:1':[function*(c,p,r){const ids=yield*exactGroup(c,p,hand(c,p),3,ids=>new Set(ids.map(id=>value(c,id))).size===1,'return','可以归还恰好三张同代手牌。');if(ids.length!==3)r.fail();},function*(c,p,r){if(condition(r,r.previous))c.draw(p,value(c,returned(r).at(-1))+2);}],
 'E038:2':[function*(c,p){yield*optional(c,p,function*(){yield*all(c,p,()=>forecast(c,p),'return');});},function*(c,p,r){if(condition(r,returned(r).some(id=>hue(c,id)==='BLUE')))c.claimSpecial(p,'DESTINY','ECHOES');}],
 'E039:1':[
  function*(c,p){yield*take(c,p,hand(c,p),'return',0,3);},
  function*(c,p,r){if(condition(r,r.previous))yield*draw(c,p,returned(r).length,maxAge(c,returned(r))+1);},
  function*(c,p,r){const ids=drawn(r),[keep]=yield*c.pick(p,'选择保留并预示的一张新抽牌。',ids);yield*all(c,p,ids.filter(id=>id!==keep),'return');if(keep)c.move(keep,'foreshadow',p);},
 ],
 'E041:0':[function*(c,p){yield*optional(c,p,function*(){yield*all(c,p,()=>hand(c,p),'return');});},function*(c,p,r){if(condition(r,['BLUE','GREEN','YELLOW'].every(col=>returned(r).some(id=>hue(c,id)===col)))){for(const n of [6,7,8])c.draw(p,c.value(n),'forecast');yield*splay(c,p,colors,'right',false);}}],
 'E043:1':[function*(c,p){yield*take(c,p,forecast(c,p),'decktop',0,1);},function*(c,p,r){if(condition(r,r.previous)){const ids=[...forecast(c,p)],other=yield*c.pick(p,'选择等量的可用标准成就交换。',c.state.standard,ids.length,ids.length,true);exchange(c,ids,'standard',p,other,'forecast',p);junkDeck(c,p,c.value(5));}}],
 'E046:1':[
  function*(c,p){c.draw(p,c.value(6),'hand',true);},
  function*(c,p,r){const id=drawn(r).at(-1);if(condition(r,icon(c,id,5))){c.move(id,'meld',p);yield*r.repeat();}},
  function*(c,p,r){if(condition(r,r.otherwise)){const id=drawn(r).at(-1);if(id)c.move(id,'foreshadow',p);}},
 ],
 'E048:1':[function*(c,p){yield*all(c,p,()=>hand(c,p),'return');},function*(c,p){for(const id of tops(c,p))for(const age of cardBonuses(c,id)){c.draw(p,age);yield*anyAchievement(c,p,1,[age]);}}],
 'E049:1':[function*(c,p){c.draw(p,c.value(4),'tuck');},function*(c,p,r){const col=hue(c,fact(r,'tucked').at(-1));if(condition(r,col&&topValue(c,p,col)<c.value(4)))c.draw(p,c.value(4),'score');}],
 'E051:1':[function*(c,p,r){yield*chosenValue(c,p,r,[3,4,5]);},junkChosen,claimJunk],
 'E053:1':[function*(c,p){c.draw(p,topValue(c,p,'YELLOW')+1,'meld');},function*(c,p,r){const col=hue(c,melded(r));if(condition(r,col==='YELLOW'||c.foreseen&&['RED','PURPLE'].includes(col)))yield*r.repeat();}],
 'E055:1':[
  function*(c,p){yield*take(c,p,hand(c,p),'foreshadow');},
  function*(c,p,r){if(condition(r,r.previous)){const id=c.draw(p,value(c,fact(r,'foreshadowed').at(-1)||last(r)),'hand',true);r.facts.tuningMelded=false;if(value(c,id)>topValue(c,p,hue(c,id)))r.facts.tuningMelded=!!c.move(id,'meld',p);}},
  function*(c,p,r){const id=drawn(r).at(-1);if(condition(r,r.facts.tuningMelded===undefined?!fact(r,'melded').includes(id):!r.facts.tuningMelded)){if(id)c.move(id,'return',p);yield*optional(c,p,function*(){yield*r.repeat();});}},
 ],
 'E056:1':[function*(c,p,r){const ids=yield*exactGroup(c,p,score(c,p),2,ids=>new Set(ids.map(id=>value(c,id))).size===2,'return','可以归还恰好两张不同代的计分牌。');if(ids.length!==2)r.fail();},function*(c,p,r){if(condition(r,r.previous))yield*draw(c,p,3,c.value(6),'tuck');}],
 'E058:1':[
  function*(c,p,r){const id=c.recall('E058',p),col=hue(c,id),ids=col?pile(c,p,col).slice(1).slice(-2).reverse():[];r.facts.denturesNone=!ids.length;yield*all(c,p,ids,'score');},
  function*(c,p,r){if(condition(r,r.facts.denturesNone??!fact(r,'scored').length)){c.remember('E058',p,c.draw(p,c.value(6),'tuck'));yield*r.repeat();}},
 ],
 'E060:1':[
  function*(c,p,r){const rival=c.other(p);r.facts.target=rival;yield*claim(c,p,tops(c,rival).filter(id=>c.p(rival).achievements.some(a=>value(c,a)===value(c,id))),true);},
  function*(c,p,r){if(condition(r,r.previous)){const id=at(c,p,'GREEN');if(id)c.transfer(id,'meld',r.facts.target||c.other(p));}},
  function*(c,p,r){if(condition(r,r.otherwise))c.draw(p,c.value(7),'meld');},
 ],
 'E062:1':[function*(c,p){c.draw(p,c.value(7),'forecast');},function*(c,p,r){if(condition(r,c.foreseen))c.draw(p,lowAge(c,c.state.standard),'forecast');}],
 'E062:2':[function*(c,p){yield*splay(c,p,['GREEN'],'right');},function*(c,p,r){if(condition(r,r.previous))yield*splay(c,p,colors,'up',false);}],
 'E063:1':[function*(c,p){c.draw(p,c.value(7));},function*(c,p,r){if(condition(r,c.recallLocal('E063',p))){c.draw(p,c.value(8));if(c.foreseen)c.draw(p,c.value(9));}}],
 'E065:0':[function*(c,p){c.draw(p,c.value(7),'meld');},function*(c,p,r){const col=hue(c,melded(r));if(col)yield*splay(c,p,[col],'right');}],
 'E065:1':[function*(c,p,r){r.facts.value=c.icons(c.p(p))[3];yield*anyAchievement(c,p,1,[r.facts.value]);},function*(c,p,r){if(condition(r,c.foreseen))yield*all(c,p,()=>c.state.standard.filter(id=>value(c,id)<(r.facts.value??c.icons(c.p(p))[3])),'junk');}],
 'E068:1':[
  function*(c,p,r){r.facts.value=yield*chooseValue(c,p,score(c,p).map(id=>value(c,id)));},
  function*(c,p,r){const [zone]=yield*c.choose(p,'计分对手手牌还是计分区中该时代的所有牌？',[{value:'hand',label:'手牌'},{value:'score',label:'计分区'}]);for(const o of c.state.players.filter(o=>o.id!==p))yield*all(c,p,()=>c.p(o.id)[zone].filter(id=>value(c,id)===r.facts.value),'score');},
  function*(c,p,r){if(r.facts.value!==null&&r.facts.value!==undefined)c.draw(p,r.facts.value,'forecast');},
 ],
 'E069:0':[function*(c,p){yield*take(c,p,hand(c,p),'return',0,1);},function*(c,p,r){if(condition(r,r.previous)){const age=value(c,returned(r).at(-1));for(const o of c.state.players)yield*all(c,p,()=>score(c,o.id).filter(id=>value(c,id)===age),'hand',p,'','transfer');}}],
 'E070:1':[function*(c,p){yield*draw(c,p,2,topValue(c,p,'BLUE'),'hand',true);},meldOneReturnRest],
 'E070:2':[function*(c,p,r){yield*chosenValue(c,p,r,[7,8]);},function*(c,p,r){junkDeck(c,p,r.facts.value);}],
 'E072:2':[function*(c,p,r){if(condition(r,colors.some(col=>echoes(c,p,col)>=3)))c.claimSpecial(p,'HISTORY','ECHOES');},function*(c,p,r){if(condition(r,r.previous&&c.foreseen))c.win(p,'摄影：因预示执行并取得历史成就。');}],
 'E073:0':[function*(c,p){yield*all(c,p,()=>hand(c,p),'return');c.draw(p,c.value(6));},function*(c,p,r){for(const col of new Set(returned(r).map(id=>hue(c,id))))c.draw(p,maxAge(c,hand(c,p))+1);}],
 'E074:2':[function*(c,p,r){yield*chosenValue(c,p,r,[6,7,8,9]);},junkChosen,claimJunk],
 'E075:1':[function*(c,p,r){if(condition(r,instrumentImages(c).length===4))c.win(p,'萨克斯管：四张指定乐器牌的插图均可见。');},function*(c,p,r){if(condition(r,r.otherwise))yield*draw(c,p,instrumentImages(c).length,c.value(7));}],
 'E080:0':[function*(c,p){yield*draw(c,p,3,c.value(8),'tuck');},function*(c,p,r){if(condition(r,fact(r,'tucked').some(id=>hue(c,id)==='GREEN')))yield*r.repeat();}],
 'E081:1':[function*(c,p){yield*take(c,p,score(c,p),'return');},function*(c,p,r){yield*draw(c,p,2,value(c,returned(r).at(-1))-1,'score');}],
 'E082:0':[
  function*(c,p){const n=colorCount(c,p,3);yield*draw(c,p,n,c.value(9));if(c.foreseen)yield*draw(c,p,n,c.value(10));},
  meldOneReturnRest,
  function*(c,p,r){if(condition(r,melded(r)==='B104'))c.win(p,'射电望远镜：融合人工智能。');},
 ],
 'E083:1':[function*(c,p,r){r.facts.value=yield*chooseValue(c,p);},function*(c,p,r){yield*draw(c,p,colorCount(c,p,2),r.facts.value??0);},function*(c,p,r){yield*take(c,p,drawn(r),'foreshadow',0,drawn(r).length);}],
 'E084:0':[function*(c,p){for(const age of c.bonuses(c.p(p)).filter(n=>n%2===0))c.draw(p,age);},function*(c,p,r){if(condition(r,c.foreseen))yield*all(c,p,drawn(r),'standard',p,'','transfer');}],
 'E085:1':[
  function*(c,p,r){r.facts.value=yield*chooseValue(c,p);r.facts.target=c.other(p);},
  function*(c,p,r){const o=r.facts.target||c.other(p);yield*take(c,p,score(c,o).filter(id=>value(c,id)===r.facts.value),'meld',1,1,o,'transfer');},
  function*(c,p,r){const o=r.facts.target||c.other(p);if(condition(r,c.p(o).achievements.some(id=>value(c,id)===r.facts.value)))yield*claim(c,p,score(c,o).filter(id=>value(c,id)===r.facts.value));},
 ],
 'E086:0':[
  function*(c,p){const [id]=yield*c.pick(p,'将一张置顶牌转移至其拥有者的计分区。',c.state.players.flatMap(o=>c.tops(o)).filter(id=>id!=='E086'));if(id)c.transfer(id,'score',c.location(id).owner.id);},
  function*(c,p,r){const id=fact(r,'transferred').at(-1),types=id?iconTypes(c,id):[];yield*take(c,p,hand(c,p).filter(v=>iconTypes(c,v).some(n=>types.includes(n))),'return',0,1);},
  function*(c,p,r){if(condition(r,r.previous))yield*r.repeat();},
 ],
 'E090:1':[
  function*(c,p){yield*take(c,p,tops(c,p).filter(id=>hue(c,id)!=='GREEN'),'hand',0,1,p,'transfer');},
  function*(c,p,r){if(condition(r,r.previous)){const n=value(c,fact(r,'transferred').at(-1)),id=c.draw(p,n,'score');if(!c.didDraw(id,'score',n))r.fail();}},
  function*(c,p,r){if(condition(r,r.previous&&c.foreseen))yield*r.repeat();},
 ],
 'E091:1':[function*(c,p){c.draw(p,c.value(9),'forecast');},function*(c,p,r){if(condition(r,c.foreseen))c.draw(p,c.value(11),'forecast');}],
 'E092:0':[scoreTwoBottom,function*(c,p,r){const ids=fact(r,'scored'),sum=ids.reduce((n,id)=>n+value(c,id),0);if(condition(r,ids.length===2&&sum<12)){c.draw(p,sum);const more=yield*scoreTwoBottom(c,p),next=more.reduce((n,id)=>n+value(c,id),0);if(more.length===2&&next<12)c.draw(p,next);}}],
 'E093:0':[function*(c,p){yield*take(c,p,score(c,p),'return',4);},function*(c,p){yield*all(c,p,()=>c.state.standard,'return');}],
 'E093:1':[function*(c,p){c.draw(p,c.value(11),'forecast');},function*(c,p){c.draw(p,c.value(10),'meld');},function*(c,p,r){if(condition(r,c.foreseen))c.draw(p,c.value(11),'meld');}],
 'E094:2':[function*(c,p,r){const id=c.recall('E094',p);r.facts.karaoke=id;if(id)yield*take(c,p,c.state.standard.filter(v=>value(c,v)===value(c,id)),'achievements');else r.fail();},function*(c,p,r){if(condition(r,r.previous)){const id=r.facts.karaoke||melded(r);if(id)yield*c.selfExecute(p,id);}}],
 'E095:1':[function*(c,p){yield*take(c,p,tops(c,p),'score',0,1);},function*(c,p,r){if(condition(r,at(c,p,'GREEN')==='B031'))c.win(p,'石头：造纸是绿色置顶牌。');}],
 'E096:1':[function*(c,p){yield*all(c,p,()=>hand(c,p).filter(id=>value(c,id)===c.value(9)),'meld');},function*(c,p,r){if(condition(r,!c.foreseen)){yield*all(c,p,()=>hand(c,p),'return');yield*draw(c,p,3,c.value(9));}}],
 'E099:2':[function*(c,p){yield*take(c,p,hand(c,p),'return',0,hand(c,p).length);},function*(c,p,r){for(const id of returned(r))for(let i=0;i<2;i++)yield*claim(c,p,c.state.standard);}],
 'E100:2':[function*(c,p){yield*draw(c,p,3,c.value(11));},function*(c,p,r){if(condition(r,c.foreseen))yield*all(c,p,drawn(r),'foreshadow');}],
 'E101:1':[function*(c,p){yield*splay(c,p,colors,'up');},function*(c,p,r){if(condition(r,c.foreseen))for(const col of colors)c.splay(p,col,'up');}],
 'E102:0':[function*(c,p){yield*claim(c,p,c.state.standard,false,2);},function*(c,p,r){if(condition(r,r.previous&&c.foreseen))yield*r.repeat();}],
 'E103:1':[
  function*(c,p){yield*optional(c,p,function*(){c.draw(p,yield*chooseValue(c,p),'score');});},
  function*(c,p){const id=bottom(c,p,'RED');if(id)c.transfer(id,'hand',p);},
  function*(c,p,r){const ages=ids=>ids.map(id=>value(c,id)).sort((a,b)=>a-b).join(',');if(condition(r,ages(hand(c,p))===ages(score(c,p))))c.win(p,'人类基因组：手牌和计分牌的时代及数量一致。');},
 ],
 'E104:1':[
  function*(c,p){const col=yield*chooseColor(c,p,colors.filter(col=>pile(c,p,col).length),true);if(col){const [n]=yield*c.choose(p,'计分一张或两张置底牌。',[1,2].filter(n=>n<=pile(c,p,col).length).map(n=>({value:String(n),label:`${n} 张`})));yield*all(c,p,pile(c,p,col).slice(0,Number(n)),'score');}},
  function*(c,p,r){if(condition(r,new Set(colors.filter(col=>pile(c,p,col).length).map(col=>visibleCount(c,p,col))).size<=1))c.win(p,'魔方：各颜色可见牌数相同。');},
 ],
 'E105:1':[function*(c,p){c.draw(p,yield*chooseValue(c,p),'meld');},function*(c,p,r){if(condition(r,new Set(c.bonuses(c.p(p))).size===9))c.win(p,'数独：恰好九种不同奖分。');},function*(c,p,r){if(condition(r,r.otherwise)&&melded(r))yield*c.selfExecute(p,melded(r));}],
 'E106:0':[
  function*(c,p){c.draw(p,c.value(10),'hand',true);},
  function*(c,p,r){const col=hue(c,drawn(r).at(-1));r.facts.color=col;if(condition(r,col&&pile(c,p,col).length<6))c.splay(p,col,'aslant');},
  function*(c,p,r){if(condition(r,r.otherwise)&&r.facts.color)for(const o of c.state.players)yield*all(c,p,pile(c,o.id,r.facts.color).slice(0,5),'return');},
  function*(c,p,r){if(condition(r,r.previous))yield*r.repeat();},
 ],
 'E107:1':[function*(c,p){yield*claim(c,p,c.state.players.flatMap(o=>o.hand),true);},function*(c,p,r){if(condition(r,r.previous&&c.foreseen))yield*r.repeat();}],
 'E109:0':[function*(c,p,r){const ids=tops(c,p).filter(id=>hue(c,id)!=='YELLOW').sort((a,b)=>value(c,a)-value(c,b));if(!ids.length)r.fail();for(const id of ids){const n=value(c,id),v=c.draw(p,n,'score');if(!c.didDraw(v,'score',n))r.fail();}},function*(c,p,r){if(condition(r,r.previous&&c.foreseen))c.win(p,'电子竞技：按指定时代完成全部计分。');}],
 'E110:0':[
  function*(c,p,r){const [n]=yield*c.choose(p,'选择一种图标。',c.iconTypes().map(n=>({value:String(n),label:c.iconName(n)})));r.facts.icon=Number(n);},
  function*(c,p,r){const n=r.facts.icon??r.facts.value,leader=c.iconLeader(n);if(!leader||n===100){r.fail();return;}for(const o of c.state.players){c.reveal(o.id,[...o.hand,...o.score]);yield*all(c,p,()=>[...o.hand,...o.score].filter(id=>c.card(id).dogma_icon===n),'hand',leader,'','transfer');}},
 ],
 'E111:0':[
  function*(c,p,r){r.facts.target=c.other(p);r.succeed();},
  function*(c,p,r){const [id]=yield*c.pick(r.facts.target||c.other(p),'为对手选择一张不可查看的手牌。',hand(c,p),1,1,{hiddenFaces:true});r.facts.selected=id?[id]:[];},
  function*(c,p,r){const id=(r.facts.selected||fact(r,'chosen'))[0];if(id)c.move(id,'meld',p);else r.fail();},
  function*(c,p,r){if(condition(r,r.previous&&c.state.turn.player===p)){const id=melded(r);if(id)yield*c.selfExecute(p,id);yield*r.repeat();}},
 ],
 'E112:0':[function*(c,p,r){r.facts.color=yield*chooseColor(c,p,colors.filter(col=>pile(c,p,col).length));},stream,function*(c,p,r){if(condition(r,r.previous&&c.foreseen))while(at(c,p,r.facts.color)){if(!(yield*stream(c,p,r)))break;}}],
 'E113:0':[function*(c,p,r){let n=0;for(const col of colors){const count=pile(c,p,col).length,dir=count>=8?'left':count>=6?'right':count>=4?'up':count>=2?'aslant':null;if(dir&&c.splay(p,col,dir))n++;}r.facts.splayedCount=n;},function*(c,p,r){if(condition(r,r.facts.splayedCount===5))c.win(p,'触摸屏：展开五种颜色。');}],
 'E114:0':[
  function*(c,p,r){if(condition(r,c.state.turn.player===p)){const [id]=yield*c.pick(p,'将一张置顶牌转移至自己的面板。',c.state.players.flatMap(o=>c.tops(o)));if(!id)return;r.facts.originalOwner=c.location(id).owner.id;r.facts.deepfake=id;c.transfer(id,'meld',p);const [target]=yield*c.pick(p,'超执行一张置顶牌。',tops(c,p).filter(v=>v!=='E114'));if(target)yield*c.superExecute(p,target);}},
  function*(c,p,r){const id=r.facts.deepfake||fact(r,'transferred').at(-1);if(condition(r,id&&c.state.players.some(o=>c.tops(o).includes(id)))&&r.facts.originalOwner)c.transfer(id,'meld',r.facts.originalOwner);},
 ],
};
