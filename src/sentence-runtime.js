import { EFFECTS } from './effects.js';
import { isDemand } from './dogma.js';
import { BASE_SENTENCES } from './sentences-base.js';
import { ZERO_SENTENCES } from './sentences-zero.js';
import { ECHOES_SENTENCES } from './sentences-echoes.js';
import { ARTIFACTS_SENTENCES } from './sentences-artifacts.js';
import { UNSEEN_SENTENCES } from './sentences-unseen.js';

// Sentence programs are explicit, just like normal effects. Text splitting only
// locates a printed sentence; it never infers a card's behavior from its words.
export const SENTENCE_PROGRAMS = {...BASE_SENTENCES,...ZERO_SENTENCES,...ECHOES_SENTENCES,...ARTIFACTS_SENTENCES,...UNSEEN_SENTENCES};
export const sentences = text => text.trim().split(/(?<=[.!?])\s+(?=[A-Z])/u);
export function sentenceEntries(card) {
  if(card.type==='figure'||card.type==='city')return [];
  return card.effects.flatMap((effect,effectIndex)=>isDemand(effect)||effect.kind==='echo_effect'?[]:
    sentences(effect.en).map((text,index,all)=>({text,effectIndex,index,count:all.length})));
}
export function sentenceCoverage(cards) {
  return cards.flatMap(card=>sentenceEntries(card).filter(entry=>entry.count>1&&!SENTENCE_PROGRAMS[`${card.id}:${entry.effectIndex}`]?.[entry.index])
    .map(entry=>({card:card.id,effect:entry.effectIndex,sentence:entry.index,text:entry.text})));
}

// Operation facts survive between selected cards. Completion is deliberately
// distinct from "sentence exists": a failed instruction may be followed by an
// "If you don't" sentence on the next card (official U091 appendix).
// 不确定边界：附注没有逐项定义跨卡的“该牌／那些牌／该颜色”。
// 此处引用最近一次对应操作的记录；没有对应记录时使用空集合或值0，
// 不凭空创建可选卡牌。各牌明确命名的回声记忆仍读取该命名效果。
export function* executeSentenceProgram(context,player,cardId,ordinal,previous) {
  const card=context.card(cardId),entry=sentenceEntries(card)[ordinal];
  if(!entry)return {executed:false,completed:false,facts:previous?.facts||{}};
  const program=entry.count===1?EFFECTS[cardId]?.[entry.effectIndex]:SENTENCE_PROGRAMS[`${cardId}:${entry.effectIndex}`]?.[entry.index];
  if(!program)throw new Error(`逐句效果尚未登记：${cardId} / ${entry.effectIndex+1} / ${entry.index+1}`);
  const facts=structuredClone(previous?.facts||{}),seen=new Set();
  let activity=0,failed=false;
  const remember=(key,values)=>{if(!seen.has(key)){facts[key]=[];seen.add(key);}facts[key].push(...values);};
  const observe=(name,args,result)=>{
    if(name==='draw'){
      const [who,,destination='hand',shown=false]=args;
      if(result){remember('drawn',[result]);facts.lastCard=result;facts.player=who;activity++;
        if(shown)remember('revealed',[result]);
        const key={meld:'melded',tuck:'tucked',score:'scored',safeguard:'safeguarded',forecast:'foreshadowed',junk:'junked',achievements:'claimed'}[destination];
        if(key&&context.didDraw(result,destination))remember(key,[result]);
      }
      if(!result||!context.didDraw(result,destination,args[1]))failed=true;
    }else if(['move','transfer'].includes(name)){
      const [id,to,who=player]=args;
      if(!result){failed=true;return;}
      remember('moved',[id]);facts.lastCard=id;facts.player=who;activity++;
      const key={return:'returned',meld:'melded',tuck:'tucked',score:'scored',foreshadow:'foreshadowed',forecast:'foreshadowed',safeguard:'safeguarded',safe:'safeguarded',junk:'junked',achievements:'claimed'}[to];
      if(key)remember(key,[id]);
      if(name==='transfer'||args[4]==='transfer'){remember('transferred',[id]);facts.target=who;}
    }else if(name==='reveal'){
      if(args[1].length){remember('revealed',args[1]);facts.lastCard=args[1].at(-1);activity++;}else failed=true;
    }else if(name==='splay'){
      if(result){facts.color=args[1];facts.direction=args[2];activity++;}else failed=true;
    }else if(['claimSpecial','claimSpecialId','specialMove'].includes(name)){
      if(result)activity++;else failed=true;
    }else if(name==='exchange'){
      if(result?.length){remember('moved',result);facts.lastCard=result.at(-1);activity++;}else failed=true;
    }
  };
  const tracked=new Proxy(context,{get(target,key){
    if(['draw','move','transfer','reveal','splay','claimSpecial','claimSpecialId','specialMove','exchange'].includes(key))
      return(...args)=>{const result=target[key](...args);observe(key,args,result);return result;};
    if(key==='pick'||key==='choose')return function*(...args){
      const result=yield*target[key](...args),requested=args[3]??1;
      if(result.length){activity++;facts.chosen=[...result];if(key==='pick')facts.lastCard=result.at(-1);
        if(result.every(v=>['RED','YELLOW','GREEN','BLUE','PURPLE'].includes(v))){facts.colors=[...result];facts.color=result.at(-1);}
        if(result.length===1&&/^\d+$/.test(result[0]))facts.value=Number(result[0]);
      }
      if(result.length<requested||!result.length)failed=true;
      return result;
    };
    if(key==='yes')return function*(...args){const result=yield*target.yes(...args);if(!result)failed=true;return result;};
    if(key==='selfExecute'||key==='superExecute')return function*(...args){
      const targetCard=target.card(args[1]);if(!sentenceEntries(targetCard).length){failed=true;return;}
      activity++;return yield*target[key](...args);
    };
    return target[key];
  }});
  const run={
    previous:previous?.completed||false,facts,
    // 不确定边界：官方附注只解释If you do/don't；跨卡Otherwise
    // 沿用上一句最后的条件，上一句没有条件时按未完成处理。
    otherwise:previous?.condition===undefined?!previous?.completed:previous.condition===false,
    cardId,effectIndex:entry.effectIndex,
    fail:()=>{failed=true;},
    succeed:()=>{activity++;},
    // 不确定边界：官方只明确跨卡逐句顺序，没有解释被引用的
    // “重复此效果”。此处重复被引用牌的原段落；明确要求更换
    // 数值、固定颜色或仅重复一次的句子由各处理器单独实现。
    repeat:function*(){yield*EFFECTS[cardId][entry.effectIndex](tracked,player);},
  };
  context.log(`提词器逐句执行「${card.name_zh}」第 ${ordinal+1} 句：${entry.text}`);
  yield*program(tracked,player,run);
  return {executed:true,completed:activity>0&&!failed,facts,condition:run.condition};
}
