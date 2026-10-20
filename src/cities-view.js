import { resourceIconHTML, colorStyle } from './cards.js';
import { COLORS } from './state.js';

export const cityStatusHTML = () => '<p class="city-status">城市没有条例；即时图标仅在融合行动后触发。置顶城市可用于签署强化。</p>';
export function cityContributionHTML(contribution, names, detailed = false) {
  const colors = contribution.colors.filter(c => c.flags || c.fountains);
  const rows = colors.map(c => `<span class="city-contribution" style="${colorStyle(c.color)}">${COLORS.find(color => color.id === c.color).name}色：${resourceIconHTML(8,c.color,names)} ${c.activeFlags}/${c.flags}${resourceIconHTML(9,c.color,names)} ${c.fountains}<small>可见牌 ${c.visibleCards}：${c.rivalMax}${c.flags && !c.activeFlags ? ' · 旗帜暂不计入' : ''}</small></span>`).join('');
  return detailed ? `<div class="city-achievement-summary"><b>城市图标贡献 ${contribution.total} 项成就</b><p>旗帜按同色可见卡牌数比较，并列也有效；喷泉无需比较。图标被覆盖后停止计数。</p>${rows || '<small>暂无可见旗帜或喷泉</small>'}</div>`
    : `<span class="city-total" title="有效旗帜 ${contribution.activeFlags} / 可见旗帜 ${contribution.flags}；可见喷泉 ${contribution.fountains}">${resourceIconHTML(8,'BLUE',names)}<b>${contribution.activeFlags}/${contribution.flags}</b>${resourceIconHTML(9,'BLUE',names)}<b>${contribution.fountains}</b><span>城市成就 ${contribution.total}</span></span>`;
}
export function endorseHintHTML(state, engine, card, id = 'you') {
  if (!state.expansions?.includes('cities')) return '';
  if (state.endorsements?.[id] === state.turn.number) return '<p class="endorse-hint is-used">本回合已使用签署强化。</p>';
  const options = engine.endorseOptions(state, id, card.id);
  if (!options.length) return '';
  const max = Math.max(...options.map(option => engine.card(option.cityId).age));
  return `<p class="endorse-hint">可签署强化 · 发动后选择城市，移除一张时代 ≤ ${max} 的手牌。自己的每段条例、对手受到的每段要求执行两次；分享仍一次。</p>`;
}
