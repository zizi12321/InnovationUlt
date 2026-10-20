import { colorStyle, escapeHTML as esc, resourceIconHTML } from './cards.js';

export function decreePanelHTML(state,engine,canAct) {
  const legal=engine.legalDecrees(state,'you');
  return `<section class="decree-panel"><h3>法令</h3><p>以手中三个不同时代的伟人颁布同色法令；部分置顶伟人放宽条件。颁布时移除全部手牌，持有的法令计为一项成就。</p><div class="decree-grid">${[...engine.decrees.values()].map(card=>{
    const owner=state.players.find(p=>(p.decrees||[]).includes(card.id));
    return `<button type="button" class="decree-card${canAct&&legal.includes(card.id)?' is-eligible':''}" style="${colorStyle(card.color)}" data-decree="${card.id}"><strong>${esc(card.name_zh)}</strong><small>${owner?`${esc(owner.name)}持有`:'公共区'}</small><span>${canAct&&legal.includes(card.id)?'可以颁布 · 查看':'查看效果与条件'}</span></button>`;
  }).join('')}</div></section>`;
}

export function decreeDetailHTML(card,state,engine,richText,canAct) {
  const owner=state.players.find(p=>(p.decrees||[]).includes(card.id));
  const legal=canAct&&engine.legalDecrees(state,'you').includes(card.id);
  return `<div class="decree-detail" style="${colorStyle(card.color)}"><h2 id="inspector-heading" class="inspector-title" tabindex="-1">${esc(card.name_zh)}法令</h2><p class="inspector-subtitle">${esc(card.name_en)} · ${owner?`${esc(owner.name)}持有`:'公共区'} · 无时代</p>${card.effects.map(effect=>`<p class="decree-effect">${richText(effect.zh,{color:card.color})}</p>`).join('')}<p>颁布将移除你的全部手牌，包括非伟人牌。若由对手持有，本次只将法令归还公共区；若在公共区，先执行效果再取得；若已由你持有，则再次执行效果。</p><button class="primary-button" data-command="decree" data-id="${card.id}" ${legal?'':'disabled'}>${legal?'移除全部手牌并颁布':'当前无法颁布'}</button></div>`;
}

export const figureStatusHTML=(names,richText)=>`<p class="figure-status">${resourceIconHTML(7,'PURPLE',names)}${richText('置顶伟人的业报持续生效；伟人不能发动条例。',{interactive:false})}</p>`;
