import { citySymbolHTML, searchBadgeHTML } from './city-marks.js';
import { COLORS } from './state.js';
import { isDemand } from './dogma.js';
import { cardSet, setName } from './expansions.js';
import { isBonus, bonusValue } from './echoes-rules.js';

const COLOR_BY_ID = new Map(COLORS.map(color => [color.id, color]));
const RESOURCE_ROW = { BLUE: 0, RED: 1, GREEN: 2, YELLOW: 3, PURPLE: 4 };
const SLOT_NAMES = ['左上', '左下', '中下', '右下', '右上', '中上'];
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

export function colorStyle(colorId) {
  const color = COLOR_BY_ID.get(colorId);
  if (!color) throw new Error(`未知卡牌颜色：${colorId}`);
  return `--pile-color:${color.hex};--pile-tint:${color.tint};--pile-soft:${color.soft}`;
}

export function safeSourceURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '#';
  } catch { return '#'; }
}

export function markHTML(card, slot, iconNames, interactive = false, exposed = null) {
  const code = card.spots[slot];
  if (code === null || code === undefined) return '';
  const searching = card.search_slots?.includes(slot);
  const name = code === 0 ? '卡牌插图' : `${searching ? '搜索 · ' : ''}${iconNames[code]}`;
  const term = searching ? 'city-search' : code === 0 ? 'image' : `icon${code}`;
  let art = '';
  if (code === 0 && card.type==='age_zero') art=`<img class="zero-art" src="./assets/age-zero-${card.color.toLowerCase()}.webp" alt="">`;
  else if (code === 0) art = `<span class="hex-art${cardSet(card) === 'Echoes' ? ' is-echoes' : cardSet(card)==='Figures'?' is-figures':cardSet(card)==='Cities'?' is-cities':''}" style="--atlas-x:${-card.art_position[0]}"></span>`;
  else if (code === 7) art = '<img class="avatar-art" src="./assets/avatar.svg" alt="">';
  else if (code === 18) art = '<img class="food-art" src="./assets/food.svg" alt="">';
  else if (citySymbolHTML(code)) art = citySymbolHTML(code);
  else if (code === 10) art = '<span class="echo-art" aria-hidden="true">↻</span>';
  else if (isBonus(code)) art = `<span class="bonus-art" aria-hidden="true">${bonusValue(code)}</span>`;
  else art = `<span class="resource-art" style="--atlas-x:${1 - code};--atlas-y:${-RESOURCE_ROW[card.color]}"></span>`;
  return `<span class="card-mark${searching ? ' has-search' : ''}${exposed === false ? ' is-covered' : ''}" data-slot="${slot}" data-icon="${code}" ${exposed === null ? '' : `data-exposed="${exposed}" data-counted="${exposed && code > 0}"`} role="img" aria-label="${SLOT_NAMES[slot]}：${escapeHTML(name)}${exposed === false ? '（被覆盖，不计数）' : ''}" ${interactive ? `data-term="${term}" tabindex="0"` : ''}>${art}${searching ? searchBadgeHTML : ''}</span>`;
}

// Preserve all six printed positions. Null slots stay empty; do not invent
// icons for the two unused upper positions on current base cards.
export function cardMarksHTML(card, iconNames, interactive = false, visibleSlots = null) {
  return [0, 1, 2, 3, 4, 5].map(slot => markHTML(card, slot, iconNames, interactive, visibleSlots === null ? null : visibleSlots.includes(slot))).join('');
}

export function resourceIconHTML(code, color, iconNames) {
  return featuredIconHTML({ dogma_icon: code, color }, iconNames);
}

export function cardBackHTML(card, zone = '牌') {
  const set = setName(cardSet(card));
  return `<span class="hand-back" aria-label="${set}时代 ${card.age} 的${zone}"><small>${set}</small>${card.age}</span>`;
}

function featuredIconHTML(card, iconNames) {
  if (!card.dogma_icon) return '';
  // This small icon labels the dogma and is NOT an extra board resource.
  const code = card.dogma_icon;
  const art = citySymbolHTML(code) || (code === 7 ? '<img class="avatar-art" src="./assets/avatar.svg" alt="">' : code===18 ? '<img class="food-art" src="./assets/food.svg" alt="">' : `<span class="resource-art" style="--atlas-x:${1 - code};--atlas-y:${-RESOURCE_ROW[card.color]}"></span>`);
  return `<span class="card-mark" role="img" aria-label="${escapeHTML(iconNames[code])}">${art}</span>`;
}

export function compactCardHTML(card, iconNames, richText = escapeHTML) {
  return `<button class="playing-card" data-card="${card.id}" aria-label="打开${COLOR_BY_ID.get(card.color).name}色牌堆，置顶牌${escapeHTML(card.name_zh)}，时代 ${card.age}">${cardMarksHTML(card, iconNames)}<span class="card-copy"><span class="card-title-line"><span class="card-name">${escapeHTML(card.name_zh)}</span><span class="card-age" aria-label="时代 ${card.age}">${card.age}</span></span><span class="card-en">${escapeHTML(card.name_en)}</span><span class="board-effects">${card.effects.map(effect => `<span class="board-effect"><span class="effect-label ${isDemand(effect) ? 'is-demand' : 'is-ordinary'}">${featuredIconHTML(card.type === 'city' ? { ...card, dogma_icon: effect.icon } : card, iconNames)}${escapeHTML(effect.label)}</span><span class="board-effect-text">${richText(effect.zh, { color: card.color, interactive: false })}</span></span>`).join('')}</span><span class="card-code">${card.id} · ${card.effects.length} 段效果 · 点击查看完整效果</span></span></button>`;
}

export function listCardHTML(card, iconNames, position = '', options = {}) {
  return `<button class="list-card mini-face ${options.showEffects ? 'has-effects' : ''} ${options.className || ''}" data-card="${card.id}" style="${colorStyle(card.color)};${options.style || ''}" aria-label="查看${escapeHTML(card.name_zh)}，时代 ${card.age}${position ? `，${escapeHTML(position)}` : ''}">${cardMarksHTML(card, iconNames, false, options.visibleSlots ?? null)}<span class="list-card-copy"><span class="card-title-line"><span class="list-card-name">${escapeHTML(card.name_zh)}</span><span class="list-card-age">${card.age}</span></span><span class="list-card-en">${escapeHTML(card.name_en)}</span>${position ? `<span class="list-card-position">${escapeHTML(position)}</span>` : ''}${options.showEffects ? `<span class="hand-effects">${cardEffectsHTML(card, iconNames, options.richText, { compact: true })}</span>` : ''}</span></button>`;
}

export function cardEffectsHTML(card, iconNames, richText = escapeHTML, { english = false, compact = false } = {}) {
  const options = { color: card.color, interactive: !compact };
  return card.effects.map(effect => compact
    ? `<span class="hand-effect"><span class="effect-label ${isDemand(effect) ? 'is-demand' : 'is-ordinary'}">${featuredIconHTML(card.type === 'city' ? { ...card, dogma_icon: effect.icon } : card, iconNames)}${escapeHTML(effect.label)}</span><span class="effect-text">${richText(effect.zh, options)}</span></span>`
    : `<section class="effect-section"><h3 class="effect-label ${isDemand(effect) ? 'is-demand' : 'is-ordinary'}">${featuredIconHTML(card.type === 'city' ? { ...card, dogma_icon: effect.icon } : card, iconNames)}${card.type === 'city' ? escapeHTML(effect.label) : richText(effect.label, options)}</h3><p class="effect-text">${richText(effect.zh, options)}</p><p class="effect-en" ${english ? '' : 'hidden'}>${richText(effect.en, options)}</p></section>`
  ).join('');
}

export function pileTopCardHTML(card, data, richText, english) {
  return `<section class="pile-top-effects" aria-label="置顶牌完整效果"><div class="pile-top-heading"><div><span class="preview-eyebrow">置顶牌 · ${card.id}</span><h3>${escapeHTML(card.name_zh)} <span class="list-card-age" aria-label="时代 ${card.age}">${card.age}</span></h3><p class="detail-english-name">${escapeHTML(card.name_en)}</p></div><button class="quiet-button" data-card="${card.id}">完整卡面 ↗</button></div><div class="detail-tools"><label><input type="checkbox" id="show-english" ${english ? 'checked' : ''}>显示英文对照</label><span>悬停图标或虚线词语，查看解释</span></div>${cardEffectsHTML(card, data.icon_names, richText, { english })}</section>`;
}

export function detailCardHTML(card, data, richText, english) {
  const color = COLOR_BY_ID.get(card.color);
  return `<div class="detail-meta"><span>${setName(cardSet(card))} · ${card.id}</span><span>${color.name}色</span><span class="detail-dogma-icon">${card.type==='figure'?'置顶时业报生效':card.type==='city'?'融合行动图标 / 持续图标，无条例':`特性图标 ${featuredIconHTML(card, data.icon_names)}`}</span></div><div class="detail-tools"><label><input type="checkbox" id="show-english" ${english ? 'checked' : ''}>显示英文对照</label><span>悬停图标或虚线词语，查看解释</span></div><div class="detail-face" style="${colorStyle(card.color)}">${cardMarksHTML(card, data.icon_names, true)}<div class="detail-copy"><div class="card-title-line"><h2 class="inspector-title" id="inspector-heading" tabindex="-1">${escapeHTML(card.name_zh)}</h2><span class="card-age" aria-label="时代 ${card.age}">${card.age}</span></div><p class="detail-english-name">${escapeHTML(card.name_en)}</p>${cardEffectsHTML(card, data.icon_names, richText, { english })}</div></div>${card.notes.length ? `<aside class="card-notes" aria-label="资料注释">${card.notes.map(note => `<p>${escapeHTML(note)}</p>`).join('')}</aside>` : ''}<div class="card-source"><span>终极版 · ${card.type==='city'?'BGA 中文牌名 · 图标说明依官方规则整理':'BGA 社区中文译文'}</span><a href="${escapeHTML(safeSourceURL(card.source_url))}" target="_blank" rel="noopener noreferrer">官方卡牌资料 ↗</a></div>`;
}
