import { escapeHTML as esc, resourceIconHTML, colorStyle } from './cards.js';
import { dogmaTypeLabel } from './dogma.js';

// The engine numbers individual player turns. The log groups each pair as
// one round, including the first player's shorter opening turn.
export const roundNumber = turn => Math.ceil(turn / 2);

export function logGroups(state) {
  const playerIds = state.players.map(player => player.id);
  function owner(entry) {
    if (!entry.turn) return null;
    if (playerIds.includes(entry.player)) return entry.player;
    // Older v2 saves lack the turn owner. Pure-base play strictly alternates,
    // so recover it from the current turn, never from the affected player's
    // name in the text (demands and sharing can act on the other player).
    if (!playerIds.includes(state.turn.player)) return null;
    return (state.turn.number - entry.turn) % 2 === 0
      ? state.turn.player : playerIds.find(id => id !== state.turn.player);
  }
  const groups = [];
  for (const entry of state.log) {
    const player = owner(entry), previous = groups.at(-1);
    if (previous?.turn === entry.turn && previous.player === player) previous.entries.push(entry);
    else groups.push({ turn: entry.turn, player, entries: [entry] });
  }
  // Show the next player's heading as soon as the turn passes, even before
  // their first action produces an entry. This does not write to the save.
  if (state.phase === 'playing' && groups.at(-1)?.turn !== state.turn.number) {
    groups.push({ turn: state.turn.number, player: state.turn.player, entries: [] });
  }
  return groups.map(group => ({
    ...group,
    completed: group.turn < state.turn.number,
    ended: state.phase === 'over' && group.turn === state.turn.number,
    round: roundNumber(group.turn),
  }));
}

function entryHTML(entry, cards, names, richText) {
  const meta = entry.effect, card = cards?.get(meta?.cardId);
  // Old saves did not record the effect source. Keep their wording rather
  // than inventing a demand/non-demand attribution from the affected player.
  const label = card ? meta.kind === 'activation' ? dogmaTypeLabel(card)
    : meta.kind === 'endorse' ? '签署强化' : meta.kind === 'bonus' ? '分享奖励' : card.effects[meta.index]?.label || (meta.kind === 'demand' ? '要求' : '条例') : '';
  return `<li class="log-entry" ${card ? `data-effect-kind="${esc(meta.kind)}" data-source-card="${card.id}"` : ''}>${card ? `<span class="log-effect-tag ${['demand','compel'].includes(meta.kind) ? 'is-demand' : 'is-ordinary'}" style="${colorStyle(card.color)}" title="${esc(card.name_zh)} · ${esc(label)}">${resourceIconHTML(meta.icon || card.dogma_icon, card.color, names)}<b>${esc(label)}</b><span>${esc(card.name_zh)}</span></span>` : ''}<span class="log-entry-text">${richText(entry.text, { color: card?.color || 'BLUE', interactive: false })}</span></li>`;
}

export function logHTML(state, cards, names, richText = esc) {
  return logGroups(state).map(group => {
    const name = state.players.find(player => player.id === group.player)?.name;
    const title = group.turn === 0 ? '开局准备' : name ? `${name}的行动` : '行动记录';
    const status = group.ended ? '对局结束' : group.completed ? group.turn ? '行动结束' : '准备完成' : '进行中';
    const boundary = group.turn > 0 && group.turn % 2 === 0 && group.completed;
    return `<section class="log-turn${group.completed ? ' is-complete' : ''}" data-turn="${group.turn}" data-player="${group.player || 'setup'}"><header class="log-turn-heading"><h3>${esc(title)}</h3><span>${status}</span></header>${group.entries.length ? `<ul class="log-entries" aria-label="${esc(title)}的记录">${group.entries.map(entry => entryHTML(entry, cards, names, richText)).join('')}</ul>` : '<p class="log-waiting">等待行动…</p>'}</section>${boundary ? `<div class="log-round-divider" role="separator" aria-label="第 ${group.round} 回合结束" data-round="${group.round}"><span>第 ${group.round} 回合结束</span></div>` : ''}`;
  }).join('');
}
