import { enabled } from './expansions.js';
import { figureTops, isFigure } from './figures-rules.js';
import { FIGURE_EFFECTS } from './effects-figures.js';

export function drain(iterator) {
  const result = iterator.next();
  if (!result.done) throw new Error('业报程序必须使用统一的可重放选牌入口。');
  return result.value;
}

export function createKarmaRuntime(state, card, context, frames, record) {
  let depth = 0;
  const run = (source, index, owner, event) => {
    const karma = FIGURE_EFFECTS[source][index], parent = frames.at(-1);
    const frame = { actor: owner, executor: owner, cardId: source, effectCardId: source, effectKind: 'karma', effectIndex: index,
      mode: 'karma', memory: new Map(), foreseenCardId: parent?.foreseenCardId,
      // Kepler changes every effect during the action. Archimedes changes
      // only its one interrupted effect, so never inherit parent.valueShift.
      actionValueShift:parent?.actionValueShift||0,valueShift:parent?.actionValueShift||0 };
    depth++; frames.push(frame);
    try {
      record(`${context().p(owner).name}触发「${card(source).name_zh}」的业报。`);
      return drain(karma.run(context(), owner, event));
    } finally { frames.pop(); depth--; }
  };
  function trigger(event) {
    if (!enabled(state,'figures') || depth) return false;
    const match = (karma,owner) => {
      const parent=frames.at(-1);frames.push({...parent,valueShift:parent?.actionValueShift||0});
      try{return karma.match(context(),owner,event);}finally{frames.pop();}
    };
    const matches = state.players.flatMap(owner => figureTops(owner,card).flatMap(source =>
      FIGURE_EFFECTS[source].flatMap((karma,index) => karma.kind === 'would' && karma.events.includes(event.type) && match(karma,owner.id)
        ? [{source,index,owner:owner.id,karma}] : [])));
    if (!matches.length) return false;
    // Rulebook p.28: only one applicable Would, chosen by the current player.
    const selected = matches.length === 1 ? matches[0] : (() => {
      const [key] = drain(context().choose(state.turn.player || event.player,'多个业报同时适用：选择本次处理的一个，其余忽略。',matches.map((item,i)=>({value:String(i),label:`${context().p(item.owner).name} · ${card(item.source).name_zh} · 业报 ${item.index+1}`}))));
      return matches[Number(key)];
    })();
    run(selected.source,selected.index,selected.owner,event);
    return selected.karma.replace && !event.continueOriginal;
  }
  function melded(id,owner) {
    if (depth || !enabled(state,'figures') || !isFigure(card(id))) return;
    for (let index=0;index<FIGURE_EFFECTS[id].length;index++) if (FIGURE_EFFECTS[id][index].kind==='when') run(id,index,owner,{type:'melded',player:owner,cardId:id});
  }
  return { trigger, melded, get suppressed(){return depth>0;} };
}
