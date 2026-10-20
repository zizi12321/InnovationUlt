import { SPLAY_SLOTS, SPLAY_NAMES } from './engine.js';
import { colorStyle, listCardHTML, resourceIconHTML, escapeHTML as esc } from './cards.js';
import { isBonus, bonusValue } from './echoes-rules.js';

export const DIRECTIONS = ['none', 'left', 'right', 'up', 'aslant'];
const ARROWS = { none: '▣', left: '←', right: '→', up: '↑', aslant: '↗' };
const countSlots = (index, length, direction) => index === length - 1 ? [0, 1, 2, 3, 4, 5] : SPLAY_SLOTS[direction];

export function pileIconCounts(ids, cards, direction = 'none') {
  const counts = Object.fromEntries([1, 2, 3, 4, 5, 6, 7,...(ids.some(id=>cards.get(id).spots.includes(18))?[18]:[])].map(icon => [icon, 0]));
  // Count standard icons only. Bonus and echo marks are listed separately.
  const actual = ids.length < 2 ? 'none' : direction;
  ids.forEach((id, index) => countSlots(index, ids.length, actual).forEach(slot => {
    const icon = cards.get(id).spots[slot]; if (Object.hasOwn(counts, icon)) counts[icon]++;
  }));
  return counts;
}

export function pileExtrasHTML(ids, cards, direction = 'none') {
  const marks = ids.flatMap((id, index) => countSlots(index, ids.length, ids.length < 2 ? 'none' : direction).map(slot => cards.get(id).spots[slot]));
  const bonuses = marks.filter(isBonus), echoCount = marks.filter(icon => icon === 10).length;
  const flags = marks.filter(icon => icon === 8).length, fountains = marks.filter(icon => icon === 9).length;
  if(!bonuses.length&&!echoCount&&!flags&&!fountains)return '';
  const cityMarks = [8,9].map(icon => { const n = icon === 8 ? flags : fountains; return n ? `<span class="city-extra" title="${icon === 8 ? '可见旗帜：同色可见卡牌不比对手少时计为成就' : '每个可见喷泉计为一项成就'}">${resourceIconHTML(icon, cards.get(ids.at(-1)).color, {8:'旗帜',9:'喷泉'})}<b>${n}</b></span>` : ''; }).join('');
  return `<span class="pile-extra-marks" aria-label="可见的特殊标记"><span class="echo-art" title="可见回声">↻</span><b>${echoCount}</b>${bonuses.map(icon => `<span class="bonus-art" title="奖分 ${bonusValue(icon)}">${bonusValue(icon)}</span>`).join('') || ''}${cityMarks}</span>`;
}

export function iconCountsHTML(counts, color, names, delta = false, includeZero = false) {
  const entries = Object.entries(counts).filter(([, n]) => includeZero || n !== 0);
  return entries.map(([icon, n]) => `<span class="resource-count${delta ? n > 0 ? ' is-gain' : ' is-loss' : ''}" data-resource="${icon}" data-count="${n}" title="${esc(names[icon])} ${delta && n > 0 ? '+' : ''}${n}">${resourceIconHTML(Number(icon), color, names)}<b>${delta && n > 0 ? '+' : ''}${n}</b><span class="sr-only">${esc(names[icon])}</span></span>`).join('') || `<span class="resource-empty">${delta ? '无变化' : '无图标'}</span>`;
}

export function pileSummaryHTML(player, color, cards, names) {
  const ids = player.piles[color], direction = player.splay?.[color] || 'none';
  return `<div class="pile-resources" aria-label="该牌堆当前贡献的图标">${ids.length ? iconCountsHTML(pileIconCounts(ids, cards, direction), color, names) : '<span class="resource-empty">暂无图标 · 0</span>'}</div>${pileExtrasHTML(ids, cards, direction) || '<span class="pile-extra-marks is-empty" aria-hidden="true"></span>'}<button class="splay-analysis-link" data-pile="${color}" data-player="${player.id}" ${ids.length ? '' : 'disabled'}><span>${ARROWS[direction]} ${SPLAY_NAMES[direction]}</span><span>展开对比 ↗</span></button>`;
}

export function stackShapeHTML(ids, cards, names, direction) {
  const n = ids.length, width = 232, height = 160;
  const dx = ['left', 'right', 'aslant'].includes(direction) ? 52 : direction === 'none' ? 3 : 0;
  const dy = ['up', 'aslant'].includes(direction) ? 50 : direction === 'none' ? 3 : 0;
  return `<div class="stack-viewport" tabindex="0" aria-label="${SPLAY_NAMES[direction]}的牌堆形态，可以滚动查看"><div class="stack-stage" data-direction="${direction}" style="width:${width + Math.max(0, n - 1) * dx}px;height:${height + Math.max(0, n - 1) * dy}px">${ids.map((id, index) => {
    const top = index === n - 1, x = (direction === 'left' ? n - 1 - index : index) * dx;
    const y = (['up', 'aslant'].includes(direction) ? n - 1 - index : index) * dy;
    return listCardHTML(cards.get(id), names, top ? '置顶牌' : `自底部第 ${index + 1} 张`, { className: `stack-face${top ? ' is-top' : ''}`, style: `left:${x}px;top:${y}px;z-index:${index + 1}`, visibleSlots: top ? [0, 1, 2, 3, 4, 5] : SPLAY_SLOTS[direction] });
  }).join('')}</div></div>`;
}

export function pilePreviewHTML(ids, cards, names, color, actual, direction) {
  const before = pileIconCounts(ids, cards, actual), after = pileIconCounts(ids, cards, direction);
  const delta = Object.fromEntries(Object.keys(after).map(icon => [icon, after[icon] - before[icon]]));
  return `<div class="pile-preview-heading"><div><span class="preview-eyebrow">${direction === actual ? '当前牌堆' : '展开预览'}</span><h3>${ARROWS[direction]} ${SPLAY_NAMES[direction]}</h3></div><div class="preview-resource-total">${iconCountsHTML(after, color, names)}${pileExtrasHTML(ids, cards, direction)}</div></div>${direction !== actual ? `<div class="preview-delta"><span>相对当前</span>${iconCountsHTML(delta, color, names, true)}</div>` : ''}${stackShapeHTML(ids, cards, names, direction)}<p class="stack-hint">按牌堆的实际顺序叠放 · 点击卡牌查看效果 · 预览不改变对局</p><div class="pile-cards-heading"><h3>逐张查看</h3><span>置顶 → 置底 · 淡色标记在此展开下被覆盖；插图不计数</span></div><div class="pile-reference-grid">${[...ids].reverse().map((id, index) => listCardHTML(cards.get(id), names, index === 0 ? '置顶 · 所有标记可见' : `下层第 ${index} 张 · 亮色标记计入面板`, { visibleSlots: index === 0 ? [0, 1, 2, 3, 4, 5] : SPLAY_SLOTS[direction] })).join('')}</div>`;
}

export function pileInspectorHTML(player, color, cards, names, selected, topContent = '') {
  const ids = player.piles[color.id], actual = player.splay?.[color.id] || 'none', current = pileIconCounts(ids, cards, actual);
  const direction = ids.length > 1 ? selected || actual : 'none';
  return `<div class="pile-inspector" style="${colorStyle(color.id)}"><div class="pile-inspector-title"><div><span class="preview-eyebrow">${esc(player.name)}的公开面板</span><h2 id="inspector-heading" class="inspector-title" tabindex="-1">${color.name}色牌堆 <small>${ids.length} 张</small></h2></div><span class="actual-splay">${ARROWS[actual]} ${SPLAY_NAMES[actual]}</span></div>${topContent}<div id="pile-preview">${pilePreviewHTML(ids, cards, names, color.id, actual, direction)}</div><section class="pile-comparison-section"><h3>展开对比</h3><p class="inspector-subtitle">比较各方向的图标总量及增减。悬停临时预览，点击保留选择；上方牌堆随之更新。</p><div class="splay-comparison" role="group" aria-label="展开方式对比"><div class="comparison-labels"><span>展开方式</span><span>该牌堆的图标总量</span><span>相对当前</span></div>${DIRECTIONS.map(dir => {
    const counts = pileIconCounts(ids, cards, dir), delta = Object.fromEntries(Object.keys(counts).map(icon => [icon, counts[icon] - current[icon]]));
    const unavailable = ids.length < 2 && dir !== 'none';
    return `<button class="splay-option${dir === actual ? ' is-current' : ''}" data-preview-splay="${dir}" aria-pressed="${dir === direction}" ${unavailable ? 'disabled' : ''}><span class="splay-option-name"><b>${ARROWS[dir]}</b><span>${SPLAY_NAMES[dir]}${dir === actual ? '<small>当前</small>' : ''}</span></span><span class="comparison-counts">${unavailable ? '<span class="resource-empty">至少需要两张牌</span>' : iconCountsHTML(counts, color.id, names) + pileExtrasHTML(ids, cards, dir)}</span><span class="comparison-delta">${unavailable ? '—' : dir === actual ? '<span class="resource-empty">基准</span>' : iconCountsHTML(delta, color.id, names, true)}</span></button>`;
  }).join('')}</div></section></div>`;
}
