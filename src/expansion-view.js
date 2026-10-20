import { EXPANSIONS, achievementTarget } from './expansions.js';
import { forecastLimit } from './echoes-rules.js';
import { listCardHTML, cardBackHTML } from './cards.js';

export function newGameHTML(state) {
  return `<h2 id="inspector-heading" class="inspector-title" tabindex="-1">开始新对局</h2><p class="inspector-subtitle">选择本局使用的扩展。开始后替换当前本机存档，取消则继续原对局。</p><fieldset class="expansion-options"><legend>游戏内容</legend><label class="expansion-option is-base"><input type="checkbox" checked disabled><span><strong>创世发明：基础版</strong><small>115 张牌 · 始终启用</small></span><em>必选</em></label>${EXPANSIONS.map(item => `<label class="expansion-option${item.available ? '' : ' is-unavailable'}"><input type="checkbox" name="expansion" value="${item.id}" ${(state.expansions || []).includes(item.id) ? 'checked' : ''} ${item.available ? '' : 'disabled'}><span><strong>${item.name}</strong><small>${item.english}</small></span><em>${item.available ? '可选' : '尚未实现'}</em></label>`).join('')}</fieldset><p class="new-game-summary" id="new-game-summary">双人对局 · 需要 ${achievementTarget(state)} 项成就获胜</p><button class="primary-button" data-command="confirm-new">开始新对局</button>`;
}

export function forecastHTML(player, cards, names, richText) {
  const ids = player.forecast || [], own = player.id === 'you';
  return `<section class="forecast-area" aria-label="${own ? '我的' : '电脑'}预示区"><div class="hand-heading"><h3>${own ? '我的' : '电脑'}预示区 <span>${ids.length} / ${forecastLimit(player)}</span></h3><span class="forecast-limit">容量随最佳展开变化</span></div>${own ? `<div class="hand-grid forecast-grid">${ids.map(id => listCardHTML(cards.get(id), names, '预示牌 · 等待融合行动推进', { showEffects: true, richText })).join('') || '<p class="empty-hand">预示牌将在这里保留；融合行动后，必须推进一张不高于刚融合时代的预示牌。</p>'}</div>` : `<div class="hidden-hand">${ids.map(id => cardBackHTML(cards.get(id), '预示牌')).join('') || '<p class="empty-hand">暂无预示牌。</p>'}</div><p class="privacy-note">只显示牌背时代与所属扩展。</p>`}</section>`;
}
