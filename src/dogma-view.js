import { dogmaEligibility, dogmaTypeLabel, isDemand, isCompel } from './dogma.js';
import { resourceIconHTML, colorStyle, escapeHTML as esc } from './cards.js';
import { publicDemandBlockReason, publicOrdinaryBlockReason } from './dogma-hints.js';

export function assessDogma(card, engine, state, actor, names) {
  const ownPlayer = engine.player(state, actor), rivalPlayer = state.players.find(player => player.id !== actor);
  const eligibility = dogmaEligibility(card, engine.icons(ownPlayer), engine.icons(rivalPlayer));
  const forcedSharing = engine.tops(rivalPlayer).includes('F009');
  if(forcedSharing){eligibility.share=true;eligibility.vulnerable=false;}
  const { own, rival, vulnerable, share } = eligibility, iconName = names[card.dogma_icon];
  const steps = engine.effectSteps(state, card.id), hasEchoes = steps.some(step => step.echo);
  const demand = card.effects.some(effect=>isDemand(effect)&&!isCompel(effect)), compel=card.effects.some(isCompel), ordinary = hasEchoes || card.effects.some(effect => !isDemand(effect));
  const observation = engine.observation(state, actor);
  const noDemandTarget = !hasEchoes && vulnerable && isDemand(card.effects[0]) ? publicDemandBlockReason(card, observation, engine.cards) : null;
  const noOrdinaryTarget = !hasEchoes && share && !isDemand(card.effects[0]) ? publicOrdinaryBlockReason(card, observation) : null;
  const rows = [];
  if(compel)rows.push({kind:'compel',label:'强迫',warn:!share,text:share?`${rivalPlayer.name}具有分享资格，会执行强迫（${iconName} ${rival} ≥ ${own}，或业报赋予资格）。`:`强迫不作用于${rivalPlayer.name}：其${iconName}数量 ${rival} < ${own}，不具备分享资格。`});
  if (demand) rows.push({ kind: 'demand', label: '要求', warn: !vulnerable || !!noDemandTarget, text: vulnerable
    ? noDemandTarget ? `要求当前没有可执行目标：${noDemandTarget}` : `${rivalPlayer.name}会执行要求（${iconName} ${rival} < ${own}）。`
    : forcedSharing ? `要求不作用于${rivalPlayer.name}：萨尔贡的业报使其具备分享资格。` : `要求不作用于${rivalPlayer.name}：其${iconName}数量 ${rival} ≥ ${own}。` });
  if (ordinary) rows.push({ kind: 'non-demand', label: '条例', warn: share, text: share
    ? forcedSharing ? `${rivalPlayer.name}因萨尔贡的业报取得分享资格，先分享条例，再由${ownPlayer.name}执行。` : noOrdinaryTarget ? `${rivalPlayer.name}可分享，但${card.effects[0].label}当前无可执行目标：${noOrdinaryTarget}其余效果继续按牌文结算。` : `${rivalPlayer.name}先分享条例，再由${ownPlayer.name}执行（${iconName} ${rival} ≥ ${own}）。`
    : `${rivalPlayer.name}不分享条例（${iconName} ${rival} < ${own}），由${ownPlayer.name}执行；牌文直接影响对手的部分仍会结算。` });
  const hasFigures = state.expansions?.includes('figures');
  const provisional = hasFigures || state.expansions?.includes('cities') ? '这是按当前面板作出的预估；签署费用、庇佑选择及业报可能改变结果，发动后以实际结算为准。' : '';
  return { ...eligibility, hasEchoes, rows, provisional, warnings: rows.filter(row => row.warn).map(row => row.text), ownName: ownPlayer.name, rivalName: rivalPlayer.name };
}

export function dogmaButtonHTML(card, names, assessment, enabled, className = 'pile-dogma') {
  const warning = assessment.warnings.join('\n');
  const tooltip = [warning || '按卡面顺序执行全部效果。',assessment.provisional].filter(Boolean).join('\n');
  const label = `发动${dogmaTypeLabel(card, assessment.hasEchoes)}`;
  return `<button class="${className} dogma-launch" type="button" data-command="dogma" data-id="${card.id}" style="${colorStyle(card.color)}" ${enabled ? '' : 'disabled'} title="${esc(tooltip)}" aria-label="${esc(`${label}：${card.name_zh}${warning ? `。提示：${warning}` : ''}`)}"><span class="dogma-launch-label">${resourceIconHTML(card.dogma_icon, card.color, names)}<span>${label}</span></span>${warning ? '<span class="dogma-warning" role="img" aria-label="对手执行资格提示">!</span>' : ''}</button>`;
}

export function dogmaAssessmentHTML(card, names, assessment, richText) {
  return `<div class="dogma-assessment" style="${colorStyle(card.color)}"><div class="dogma-comparison">${resourceIconHTML(card.dogma_icon, card.color, names)}<strong>${esc(assessment.ownName)} ${assessment.own}</strong><span>：</span><strong>${esc(assessment.rivalName)} ${assessment.rival}</strong><small>按当前可见图标判断</small></div>${assessment.rows.map(row => `<p class="dogma-status${row.warn ? ' has-warning' : ''}"><b>${row.label}</b><span>${richText(row.text, { color: card.color })}</span></p>`).join('')}<p class="dogma-hint">红色提示：电脑能分享条例，或要求／强迫不能影响电脑。仍可照常发动。${esc(assessment.provisional || '')}</p></div>`;
}
