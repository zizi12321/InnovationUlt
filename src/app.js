import { isCity } from './cities-rules.js';
import { cityStatusHTML, cityContributionHTML, endorseHintHTML } from './cities-view.js';
import { AGES, COLORS, createBoardState, getSupplyCount, getPlayerSummary } from './state.js';
import { createEngine, SUPPORTED_DOGMAS, SPLAY_NAMES, SPLAY_SLOTS, RULES_VERSION } from './engine.js';
import { chooseAction, chooseAnswer } from './ai.js';
import { colorStyle, compactCardHTML, listCardHTML, cardBackHTML, detailCardHTML, pileTopCardHTML, markHTML, escapeHTML as esc, safeSourceURL } from './cards.js';
import { createGlossary } from './glossary.js';
import { pileSummaryHTML, pileInspectorHTML, pilePreviewHTML, iconCountsHTML } from './pile-view.js';
import { logHTML, roundNumber } from './log-view.js';
import { assessDogma, dogmaButtonHTML, dogmaAssessmentHTML } from './dogma-view.js';
import { dogmaTypeLabel } from './dogma.js';
import { EXPANSIONS, cardSet, setName, enabled, achievementTarget } from './expansions.js';
import { newGameHTML, forecastHTML } from './expansion-view.js';
import { isFigure, isZero } from './figures-rules.js';
import { decreePanelHTML, decreeDetailHTML, figureStatusHTML } from './figures-view.js';
import { rulesHTML, rulesSplayHTML } from './rules-view.js';
import { deckAge } from './artifacts-rules.js';
import { artifactAreasHTML, museumSupplyHTML } from './artifacts-view.js';
import { safeAreaHTML } from './unseen-view.js';

const $ = id => document.getElementById(id), dialog = $('inspector'), SAVE_KEY = 'innovation-base-game-v2';
let data, engine, cardsById, state, glossary, session, pending = null;
let activeSupply = 'base';
let mode = 'game', activeSeat = 'you', paused = false, aiTimer = null;
let viewHistory = [], opener = null, showEnglish = false, choiceSelection = [];
let rulesSection = 'base', rulesSplay = 'left';
const stackSymbol = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5h9v8H3zM5 3h9v8"/></svg>';
const isGame = () => mode === 'game';
const canAct = () => isGame() && (!pending||pending.kind==='subgame-action') && state.phase === 'playing' && state.turn.player === 'you' && !state.turn.showcaseId;
const canOpen = () => isGame() && !pending && state.phase === 'opening';
const disabled = enabled => enabled ? '' : 'disabled';

function message(text = '') { $('action-message').textContent = text; $('action-message').hidden = !text; }
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: RULES_VERSION, session })); }
  catch { message('浏览器未能保存进度。本局仍可继续，但刷新页面可能丢失进度。'); }
}
function recompute() {
  if (session.action) {
    const result = engine.resolve(session.base, session.action, session.answers);
    pending = result.pending; state = pending?.subgameState || result.state;
    if (result.done) session = { base: state, action: null, answers: [] };
  } else { state = session.base; pending = null; engine.assertState(state); }
}
function commitAction(action) {
  if(pending?.kind==='subgame-action'){
    const value=JSON.stringify(action);
    const option=pending.options.find(option=>option.value===value||(()=>{
      const offered=JSON.parse(option.value);
      return offered.type===action.type&&offered.player===action.player&&offered.cardId===action.cardId&&offered.secret===action.secret;
    })());
    if(option)answerChoice([option.value]);
    return;
  }
  if (!isGame() || pending) return;
  const previous = session;
  try {
    clearTimeout(aiTimer); message(); session = { base: state, action, answers: [] }; choiceSelection = [];
    recompute(); save(); renderBoard(true);
  } catch (error) { session = previous; recompute(); message(error.message); renderBoard(); }
}
function answerChoice(answer) {
  const previous = session;
  try {
    session = { ...session, answers: [...session.answers, answer] }; choiceSelection = [];
    recompute(); save(); renderBoard(true);
  } catch (error) { session = previous; recompute(); message(error.message); renderBoard(); }
}
function scheduleAI() {
  clearTimeout(aiTimer);
  if (!isGame() || paused || dialog.open || document.hidden || state.phase !== 'playing') return;
  const response = pending?.player === 'opponent';
  if (!response && (pending || state.turn.player !== 'opponent')) return;
  aiTimer = setTimeout(() => {
    if (response) answerChoice(chooseAnswer(pending, cardsById));
    else { const action = chooseAction(engine.observation(state, 'opponent'), engine.legalActions(state, 'opponent'), cardsById); if (action) commitAction(action); }
  }, 650);
}
function freshGame(expansions = []) {
  activeSupply = 'base';
  clearTimeout(aiTimer); mode = 'game'; activeSeat = 'you'; paused = false;
  session = { base: engine.createGame(Math.random, { expansions }), action: null, answers: [] }; choiceSelection = [];
  recompute(); message(); save(); renderBoard(true);
}

function supplyDecks(set = activeSupply) { return set === 'base' ? state.supply : state.expansionSupply[set]; }
function renderSupply() {
  const available = [{ id: 'base', name: '基础版', set: 'Base' }, ...EXPANSIONS.filter(item => isGame() && enabled(state, item.id))];
  if (!available.some(item => item.id === activeSupply)) activeSupply = 'base';
  const selected = available.find(item => item.id === activeSupply), decks = supplyDecks();
  $('supply-draw-rule').textContent = selected.drawRule ? `抽牌规则：${selected.drawRule}` : '';
  $('supply-draw-rule').hidden = !selected.drawRule;
  $('supply-tabs').innerHTML = available.map(item => `<button type="button" role="tab" data-supply="${item.id}" aria-selected="${item.id === activeSupply}" aria-controls="supply" tabindex="${item.id === activeSupply ? 0 : -1}">${item.name}</button>`).join('');
  $('supply').setAttribute('role', 'tabpanel'); $('supply').setAttribute('aria-label', `${selected.name}时代牌库`);
  const ages=activeSupply==='base'&&state.ageZeroIntroduced?[0,...AGES]:AGES;
  $('supply').style.setProperty('--supply-columns',ages.length);
  document.querySelector('.scroll-hint').textContent=`← 左右滑动查看全部 ${ages.length} 个时代 →`;
  $('supply').innerHTML = ages.map(age => {
    const remaining = decks[age].length;
    return `<button class="age-deck${remaining ? '' : ' is-empty'}${activeSupply==='base'?'':` ${activeSupply}-deck`}" data-age="${age}" aria-label="${selected.name}时代 ${age}，牌库剩余 ${remaining} 张；查看完整牌表"><span class="deck-back"><span class="deck-caption">时代</span><span class="era-number">${age}</span><span class="deck-set">${selected.set.toUpperCase()}</span></span><span class="deck-remaining">剩余 <strong data-remaining="${age}">${remaining}</strong> 张</span></button>`;
  }).join('');
  $('supply-total').textContent = `${selected.name} · 剩余 ${ages.reduce((sum, age) => sum + decks[age].length, 0)} / ${ages.includes(0)?130:115} 张`;
  document.querySelector('.edition-badge').textContent = available.length>1?available.map(item=>item.name).join(' ＋ '):'纯基础';
}
function renderSplayed(player, color) {
  if (!isGame() || player.splay[color] === 'none') return '';
  const slots = SPLAY_SLOTS[player.splay[color]];
  // Compact strips expose only the marks permitted by the splay direction.
  return `<div class="splay-strips" data-direction="${player.splay[color]}" aria-label="${SPLAY_NAMES[player.splay[color]]}露出的标记">${player.piles[color].slice(0, -1).reverse().map(id => `<button class="splay-strip" data-card="${id}" aria-label="${esc(cardsById.get(id).name_zh)}露出的标记">${slots.map(slot => markHTML(cardsById.get(id), slot, data.icon_names)).join('')}<span class="splay-strip-label">${esc(cardsById.get(id).name_zh)}</span></button>`).join('')}</div>`;
}
function renderPlayer(player) {
  const summary = getPlayerSummary(player, cardsById), game = isGame();
  $(`${player.id}-summary`).textContent = `面板 ${summary.count} 张 · 最高置顶时代 ${summary.count?summary.topAge:'—'}${game ? ` · ${engine.score(player)} 分 · ${engine.achievements(player)} / ${achievementTarget(state)} 成就` : ''}`;
  $(`tab-${player.id}-summary`).textContent = game ? `${engine.score(player)} 分 · ${engine.achievements(player)} 成就${state.turn.player === player.id ? ' · 行动中' : ''}` : `${summary.count} 张`;
  $(`${player.id}-icons`).hidden = !game;
  $(`${player.id}-icons`).title=enabled(state,'figures')?'面板总数包含持续业报的修正；各颜色牌堆显示实际可见的印刷图标。':'面板上的可见图标总数';
  if (game) $(`${player.id}-icons`).innerHTML = iconCountsHTML(engine.icons(player), 'BLUE', data.icon_names, false, true) + ((enabled(state, 'echoes')||enabled(state,'figures')||enabled(state,'cities')) ? `<span class="bonus-summary" title="最高奖分按数值，其余各计 1 分"><span class="bonus-art">＋</span>奖分 ${engine.bonusPoints(player)}</span>` : '') + (enabled(state,'cities') ? cityContributionHTML(engine.cityContributions(player), data.icon_names) : '');
  $(`${player.id}-piles`).innerHTML = COLORS.map(color => {
    const pile = player.piles[color.id], top = cardsById.get(pile.at(-1)), splayed = game && player.splay[color.id] !== 'none';
    const launch = top?.effects.length && !isFigure(top) && !isCity(top) && player.id === 'you' && game ? dogmaButtonHTML(top, data.icon_names, assessDogma(top, engine, state, player.id, data.icon_names), canAct() && SUPPORTED_DOGMAS.includes(top.id)) : '';
    return `<article class="color-pile" data-color="${color.id}" data-player="${player.id}" style="${colorStyle(color.id)}"><header class="pile-heading"><h3><span class="color-dot"></span>${color.name}色</h3>${pile.length ? `<button class="pile-count" data-pile="${color.id}" data-player="${player.id}" aria-label="查看${player.name}的${color.name}色牌堆，共 ${pile.length} 张">${stackSymbol}${pile.length} 张</button>` : '<span class="pile-count empty-count">0 张</span>'}</header>${pileSummaryHTML(player, color.id, cardsById, data.icon_names)}${top ? `<div class="pile-stack${pile.length > 1 && !splayed ? ' has-depth' : ''}" data-depth="${pile.length}">${compactCardHTML(top, data.icon_names, glossary.richText)}</div>${renderSplayed(player, color.id)}${isFigure(top)?figureStatusHTML(data.icon_names,glossary.richText):isCity(top)?cityStatusHTML():launch + (game && player.id === 'you' ? endorseHintHTML(state,engine,top) : '')}` : '<div class="empty-pile"><span class="empty-pile-symbol" aria-hidden="true"></span><p>尚无卡牌</p></div>'}</article>`;
  }).join('');
  const area = $(`${player.id}-hand-area`); area.hidden = !game; if (!game) return;
  const visibleHand=engine.handCards(player);
  area.innerHTML = `<div class="hand-heading"><h3>${player.id === 'you' ? '我的手牌' : '电脑手牌'} <span>${visibleHand.length} 张</span></h3><button class="quiet-button" data-score="${player.id}">计分区 · ${engine.score(player)} 分 / ${engine.scoreCards(player).length} 张</button></div>` +
    (player.id === 'you' ? `<div class="hand-grid">${visibleHand.map(id => `<div class="hand-card">${listCardHTML(cardsById.get(id), data.icon_names, '', { showEffects: true, richText: glossary.richText })}<button class="hand-play" data-command="${canOpen() ? 'opening' : 'meld'}" data-id="${id}" ${disabled(canOpen() || canAct())}>${canOpen() ? '选作起始牌' : '融合此牌'}</button></div>`).join('') || '<p class="empty-hand">暂无手牌，可以通过抽牌或条例获得。</p>'}</div>` : `<div class="hidden-hand">${visibleHand.map(id => cardBackHTML(cardsById.get(id), '手牌')).join('') || '<p class="empty-hand">暂无手牌。</p>'}</div><p class="privacy-note">只展示牌背的时代与所属扩展，手牌名称与效果对你隐藏。</p>`);
  if (enabled(state, 'echoes')) area.insertAdjacentHTML('beforeend', forecastHTML(player, cardsById, data.icon_names, glossary.richText));
  if (enabled(state, 'unseen')) {
    area.insertAdjacentHTML('beforeend',safeAreaHTML(player,state,engine,cardsById));
    if(!canAct())area.querySelectorAll('[data-secret]').forEach(button=>{button.disabled=true;});
  }
  if (enabled(state, 'artifacts')) area.insertAdjacentHTML('beforeend', artifactAreasHTML(player,state,cardsById,data.icon_names,glossary.richText,canAct()));
}
function renderTabs() {
  for (const id of ['you', 'opponent']) {
    const selected = activeSeat === id, tab = $(`tab-${id}`);
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    $(id === 'you' ? 'your-board' : 'opponent-board').hidden = !selected;
  }
}
function setSeat(id, focus = false) { activeSeat = id; renderTabs(); if (focus) $(`tab-${id}`).focus(); }
function renderChoice() {
  const panel = $('choice-panel'); panel.hidden = !isGame() || (!pending && !state.turn.showcaseId && state.phase !== 'opening' && state.phase !== 'over');
  if (panel.hidden) return;
  if (state.phase === 'over') {
    panel.innerHTML = `<h2 id="choice-title">${state.winner.player ? `${engine.player(state, state.winner.player).name}获胜` : '本局平局'}</h2><p>${esc(state.winner.reason)}</p><button class="primary-button" data-command="new-game">再来一局</button>`; return;
  }
  if (state.phase === 'opening') {
    panel.innerHTML = '<h2 id="choice-title">选择你的起始牌</h2><p>从两张手牌中选一张融合。电脑已提前作出选择，双方同时亮牌后按英文牌名决定先手。</p><button class="quiet-button" data-command="show-hand">查看我的两张手牌 ↓</button>'; return;
  }
  if(state.turn.showcaseId&&(!pending||pending.kind==='subgame-action')){
    panel.innerHTML=`<h2 id="choice-title">回合开始 · 文物展览</h2><p>先展览展示区文物，再进行本回合的两次行动。可以选择免费发动，也可以直接收入博物馆。</p>${state.turn.player==='you'?`<button class="primary-button" data-command="showcase" data-id="${state.turn.showcaseId}">开始展览 · 不消耗行动</button>`:'<p>电脑正在处理展览。</p>'}`;
    return;
  }
  if(pending.kind==='subgame-action'&&pending.player==='you'){
    panel.innerHTML='<h2 id="choice-title">火星互联网 · 子对局</h2><p class="subgame-banner">原局牌已暂存。请使用棋盘上的行动按钮进行子对局；结束后返回原局。进度仍会自动保存。</p>';
    return;
  }
  if (pending.player !== 'you') { panel.innerHTML = `<h2 id="choice-title">${paused ? '电脑已暂停' : '电脑正在选择'}</h2><p>${esc(pending.prompt)}</p>`; return; }
  panel.innerHTML = `<h2 id="choice-title">${pending.delegated ? '搭便车：代对手作出选择' : '轮到你作出选择'}</h2><p>${esc(pending.prompt)}</p><form id="choice-form"><div class="choice-options">${pending.options.map(option => `<div class="choice-option"><label><input type="checkbox" name="choice" value="${esc(option.value)}" ${choiceSelection.includes(option.value) ? 'checked' : ''}><span>${esc(option.label)}${option.age!==undefined ? `<small>时代 ${option.age}</small>` : ''}</span><b class="choice-order">${choiceSelection.includes(option.value) ? choiceSelection.indexOf(option.value) + 1 : ''}</b></label>${option.cardId ? `<button type="button" class="quiet-button" data-card="${option.cardId}">详情</button>` : ''}</div>`).join('')}</div><div class="choice-footer"><span id="choice-count"></span><button type="submit" class="primary-button" id="confirm-choice">确认选择</button>${pending.max > 1 && pending.max === pending.options.length ? '<button type="button" class="quiet-button" data-command="select-all">按当前顺序全选</button>' : ''}${pending.min === 0 ? '<button type="button" class="quiet-button" data-command="skip-choice">跳过</button>' : ''}</div></form>`;
  updateChoiceCount();
}
function updateChoiceCount() {
  if (!$('choice-count') || !pending) return;
  $('choice-count').textContent = `已选 ${choiceSelection.length} · 允许 ${pending.min}–${pending.max} 项 · 按选择顺序执行`;
  $('confirm-choice').disabled = choiceSelection.length < pending.min || choiceSelection.length > pending.max;
  document.querySelectorAll('[name="choice"]').forEach(input => {
    input.checked = choiceSelection.includes(input.value);
    input.closest('label').querySelector('.choice-order').textContent = input.checked ? choiceSelection.indexOf(input.value) + 1 : '';
  });
}
function renderAchievements() {
  $('achievement-panel').hidden = !isGame(); $('log-panel').hidden = !isGame(); if (!isGame()) return;
  const eligible = engine.eligible(state, 'you'),available=engine.availableAchievements(state,'you');
  const slots = [...new Set([...Object.values(state.standardOrigins), ...available])].sort((a, b) => cardsById.get(a).age - cardsById.get(b).age);
  $('achievements').innerHTML = `<p class="achievement-help">统御需要分数达到时代 × 5，且最高置顶时代足够；已有同代成就会提高所需分数。分数不会被消耗。本局需要 ${achievementTarget(state)} 项成就获胜。</p><div class="standard-achievements">${slots.map(id => {
    const age = cardsById.get(id).age, owner = state.players.find(p => p.achievements.includes(id));
    const status = owner ? owner.id === 'you' ? '我方已取得' : '电脑已取得' : state.standard.includes(id) ? '可用' : available.includes(id)?'业报允许统御':'已移走';
    const required = age * 5 * (engine.player(state, 'you').achievements.filter(value => cardsById.get(value).age === age).length + 1);
    return `<button class="achievement ${owner?.id === 'you' ? 'owned' : ''}" data-achievement="${age}" data-achievement-id="${id}" ${disabled(canAct() && eligible.includes(id))}><strong>${age}</strong><span>${required} 分</span><small>${status}</small></button>`;
  }).join('')}</div><div class="special-achievements">${engine.activeSpecials(state).map(card => {
    const owner = state.players.find(p => p.specials.includes(card.id));
    return `<button data-special="${card.id}">${esc(card.name_zh)} <small>${cardSet(card) !== 'Base' ? `${setName(cardSet(card))} · ` : ''}${owner ? `${owner.name}已取得` : (state.junkSpecials || []).includes(card.id) ? '已移除 · 查看条件' : '可用 · 查看条件'}</small></button>`;
  }).join('')}</div><p class="achievement-help chain-achievements">时代 11 成就：${state.players.map(p => `${esc(p.name)} ${p.achievements.filter(id => cardsById.get(id).age === 11).length} 项`).join(' · ')}。连锁成就及效果取得的成就都计入胜利数量。</p>`;
  if(enabled(state,'cities'))$('achievements').insertAdjacentHTML('beforeend',state.players.map(p=>`<section class="city-player-achievements"><h3>${esc(p.name)}</h3>${cityContributionHTML(engine.cityContributions(p),data.icon_names,true)}</section>`).join(''));
  if(enabled(state,'figures'))$('achievements').insertAdjacentHTML('beforeend',decreePanelHTML(state,engine,canAct()));
  if(enabled(state,'artifacts'))$('achievements').insertAdjacentHTML('beforeend',museumSupplyHTML(state));
  const logList = $('game-log');
  const followLatest = !logList.children.length || logList.scrollHeight - logList.clientHeight - logList.scrollTop < 35;
  const previousScroll = logList.scrollTop;
  logList.innerHTML = logHTML(state, cardsById, data.icon_names, glossary.richText);
  logList.scrollTop = followLatest ? logList.scrollHeight : previousScroll;
  $('latest-event').textContent = state.log.at(-1)?.text || '';
}
function renderBoard(announce = false) {
  cardsById=new Map(engine.cards);
  if(cardsById.has('A077'))cardsById.set('A077',engine.valueCard(state,'A077'));
  renderSupply(); state.players.forEach(renderPlayer); renderTabs(); renderChoice(); renderAchievements();
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('game-actions').hidden = !isGame();
  if (!isGame()) {
    $('mode-label').textContent = mode === 'sample' ? '示例摆牌' : '空白棋盘'; $('turn-status').textContent = '布局预览';
    $('mode-description').textContent = '预览不改变对局进度。点击“当前对局”继续刚才的游戏。';
  } else {
    const you = engine.player(state, 'you');
    $('mode-label').textContent = state.phase === 'opening' ? '准备开局' : state.phase === 'over' ? '对局结束' : `${pending?.subgame?'火星互联网子对局 · ':''}第 ${roundNumber(state.turn.number)} 回合`;
    $('turn-status').textContent = state.phase === 'playing' ? `${state.turn.player === 'you' ? '你' : '电脑'}的行动 · 剩余 ${state.turn.left} 次行动${paused ? ' · 电脑暂停' : ''}` : '';
    $('mode-description').textContent = `${['基础版',...EXPANSIONS.filter(item=>enabled(state,item.id)).map(item=>item.name)].join(' ＋ ')} · ${115*(1+(state.expansions||[]).length)+(state.ageZeroIntroduced?15:0)} 张牌 · 本地电脑对手 · 进度自动保存`;
    const age = engine.drawAge(state, engine.highest(you));
    $('draw-action').textContent = age > 11 ? '抽牌 · 将触发终局' : `抽牌 · 时代 ${age}`;
    $('draw-action').disabled = !canAct(); $('meld-action').disabled = !canAct() || !(engine.handCards(you).length+(you.museum?.length||0));
    $('dogma-action').disabled = !canAct() || !engine.dogmaCards(state,'you').length;
    $('achieve-action').disabled = !canAct() || !engine.eligible(state, 'you').length;
    $('decree-action').hidden=!enabled(state,'figures');$('decree-action').disabled=!canAct()||!engine.legalDecrees(state,'you').length;
    $('action-hint').textContent = pending?.player === 'you' ? '先完成当前选择，条例才会继续。' : canAct() ? '每次行动可抽牌、融合、发动条例或统御；启用文明巨擘还可颁布法令。' : state.phase === 'opening' ? '请从下方手牌中选择一张起始牌。' : state.phase === 'over' ? '可查看双方最终面板与行动记录。' : paused ? '电脑已暂停，点击右侧继续。' : '电脑正在行动；页签可随时切换。';
    $('pause-ai').textContent = paused ? '继续电脑' : '暂停电脑';
  }
  if (announce) $('board-announcement').textContent = isGame() ? `${$('mode-label').textContent}，${$('turn-status').textContent}。${pending?.player === 'you' ? pending.prompt : state.log.at(-1)?.text || ''}` : $('mode-label').textContent;
  scheduleAI();
}

function openView(view, push = false) {
  clearTimeout(aiTimer); glossary.hide(); if (!dialog.open) opener = document.activeElement;
  if (push && dialog.open) viewHistory.push(view); else viewHistory = [view];
  renderInspector(); if (!dialog.open) dialog.showModal(); dialog.scrollTop = 0; $('inspector-heading')?.focus({ preventScroll: true });
}
function cardCommands(card) {
  if (!isGame()) return '';
  const you = engine.player(state, 'you');
  if (engine.handCards(you).includes(card.id)) return `<div class="card-action-strip"><button class="primary-button" data-command="${canOpen() ? 'opening' : 'meld'}" data-id="${card.id}" ${disabled(canOpen() || canAct())}>${canOpen() ? '选作起始牌' : '融合这张手牌'}</button></div>`;
  if(you.museum?.includes(card.id))return `<div class="card-action-strip"><button class="primary-button" data-command="meld" data-id="${card.id}" ${disabled(canAct())}>融合馆藏 · 释放博物馆</button></div>`;
  if(you.display?.includes(card.id))return `<p class="showcase-notice">展示文物在你的回合开始时展览，可选择免费发动；本次结束后收入博物馆。</p>`;
  if(isCity(card))return cityStatusHTML();
  if(isFigure(card))return figureStatusHTML(data.icon_names,glossary.richText);
  if (engine.dogmaCards(state,'you').includes(card.id)) {
    const assessment = assessDogma(card, engine, state, 'you', data.icon_names);
    return `<div class="card-dogma-controls">${dogmaAssessmentHTML(card, data.icon_names, assessment, glossary.richText)}${endorseHintHTML(state,engine,card)}<div class="card-action-strip">${dogmaButtonHTML(card, data.icon_names, assessment, canAct() && SUPPORTED_DOGMAS.includes(card.id), 'primary-button')}</div></div>`;
  }
  return '';
}
function renderInspector() {
  const view = viewHistory.at(-1); $('inspector-back').hidden = viewHistory.length < 2;
  dialog.classList.toggle('is-pile-inspector', view.kind === 'pile');
  dialog.classList.toggle('is-rules-inspector', view.kind === 'rules');
  if (view.kind === 'card') {
    const card = cardsById.get(view.id); $('inspector-location').textContent = `${setName(cardSet(card))} · ${card.id}`;
    $('inspector-content').innerHTML = cardCommands(card) + detailCardHTML(card, data, glossary.richText, showEnglish);
  } else if (view.kind === 'age') {
    const set = view.set || 'base', setId = set === 'base' ? 'Base' : EXPANSIONS.find(item => item.id === set).set;
    const all = data.cards.filter(card => deckAge(card) === view.age && cardSet(card) === setId); $('inspector-location').textContent = `${setName(setId)}牌表 / CARD REFERENCE`;
    $('inspector-content').innerHTML = `<h2 id="inspector-heading" class="inspector-title" tabindex="-1">${setName(setId)} · 时代 ${view.age}</h2><p class="inspector-subtitle">本时代共 ${all.length} 张牌 · 当前牌库剩余 ${supplyDecks(set)[view.age].length} 张</p><div class="card-list">${all.map(card => listCardHTML(card, data.icon_names)).join('')}</div><p class="list-caption">这里展示完整牌表，不展示牌库顺序或剩余牌的身份。</p>`;
  } else if (view.kind === 'pile') {
    const player = state.players.find(item => item.id === view.player), color = COLORS.find(item => item.id === view.color);
    $('inspector-location').textContent = `${player.name}的面板 / BOARD`;
    const top = cardsById.get(player.piles[color.id].at(-1));
    $('inspector-content').innerHTML = pileInspectorHTML(player, color, cardsById, data.icon_names, view.preview, pileTopCardHTML(top, data, glossary.richText, showEnglish) + cardCommands(top));
    centerStackPreview();
  } else if (view.kind === 'score') {
    const player = engine.player(state, view.player),scoreIds=engine.scoreCards(player); $('inspector-location').textContent = '计分区 / SCORE';
    $('inspector-content').innerHTML = `<h2 id="inspector-heading" class="inspector-title" tabindex="-1">${player.name}的计分区 · ${engine.score(player)} 分</h2><p class="inspector-subtitle">计分牌共 ${scoreIds.reduce((sum, id) => sum + cardsById.get(id).age, 0)} 分，面板奖分 ${engine.bonusPoints(player)} 分，业报另计 ${engine.score(player)-engine.bonusPoints(player)-scoreIds.reduce((sum,id)=>sum+cardsById.get(id).age,0)} 分；统御成就不会消耗分数。</p>${player.id === 'you' ? `<div class="card-list">${scoreIds.map(id => listCardHTML(cardsById.get(id), data.icon_names)).join('')}</div>` : `<div class="hidden-hand">${scoreIds.map(id => cardBackHTML(cardsById.get(id), '计分牌')).join('')}</div><p class="list-caption">对手的计分牌只展示时代与所属扩展。</p>`}`;
  } else if (view.kind === 'special') {
    const card = engine.specials.get(view.id); $('inspector-location').textContent = '特殊成就 / SPECIAL ACHIEVEMENT';
    $('inspector-content').innerHTML = `<h2 id="inspector-heading" class="inspector-title" tabindex="-1">${esc(card.name_zh)}</h2><div class="about-copy">${card.effects.map(effect => `<p>${glossary.richText(effect.zh)}</p>`).join('')}<p>${cardSet(card)==='Cities'?'城市特殊成就会在满足条件的融合或移除发生时立即授予。':'系统会在行动结束时检查并自动授予。卡牌指定的其他取得方式在对应效果结算时处理。'}</p></div>`;
  } else if (view.kind === 'dogmas') {
    const ids = engine.dogmaCards(state,'you'); $('inspector-location').textContent = '发动要求／条例 / DOGMA';
    $('inspector-content').innerHTML = `<h2 id="inspector-heading" class="inspector-title" tabindex="-1">选择可发动的卡牌</h2><p class="inspector-subtitle">点击卡牌查看各段要求／条例。列表包括业报允许发动的对手卡牌；伟人只通过业报生效，城市不提供条例。</p><div class="card-list">${ids.map(id => { const card = cardsById.get(id); return listCardHTML(card, data.icon_names, dogmaTypeLabel(card)); }).join('')}</div>`;
  } else if(view.kind==='decrees') {
    $('inspector-location').textContent='颁布法令';$('inspector-content').innerHTML='<h2 id="inspector-heading" class="inspector-title" tabindex="-1">选择法令</h2>'+decreePanelHTML(state,engine,canAct());
  } else if(view.kind==='decree') {
    $('inspector-location').textContent='文明巨擘 · 法令';$('inspector-content').innerHTML=decreeDetailHTML(engine.decrees.get(view.id),state,engine,glossary.richText,canAct());
  } else if (view.kind === 'rules') {
    $('inspector-location').textContent = '规则手册 · 阅读时暂停电脑行动';
    $('inspector-content').innerHTML = rulesHTML(session.base, data, glossary.richText, view);
    requestAnimationFrame(() => {
      const nav = dialog.querySelector('.rules-nav'), selected = nav?.querySelector('[aria-current=page]');
      if (selected && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = selected.offsetLeft - nav.offsetLeft - (nav.clientWidth - selected.offsetWidth) / 2;
    });
  } else if (view.kind === 'new-game') {
    $('inspector-location').textContent = '新的对局'; $('inspector-content').innerHTML = newGameHTML(session.base);
  } else {
    $('inspector-location').textContent = '对局说明 / ABOUT';
    $('inspector-content').innerHTML = `<div class="about-copy"><h2 id="inspector-heading" class="inspector-title" tabindex="-1">终极版 · 基础与扩展</h2><p>本版已实现双人开局、先手一次行动与后续每回合两次行动、抽牌与融合、条例选择流程、分享和要求、计分、成就及分数终局。</p><p>已接入 115 张基础牌、115 张往日回声牌、115 张文明巨擘伟人、115 张命运之城、115 张岁月遗珍文物和 115 张藏形匿影，另有 5 项法令、5 张博物馆及指定伟人引入的 15 张时代 0 牌。新游戏可选择扩展，牌库通过上方分页切换，默认展示基础牌。</p><p>往日回声：唯一最高置顶牌触发回声抽牌；可见回声从下到上执行；奖分为最高数值加其他奖分个数。预示区容量随最佳展开从 5 降至 1，融合行动后必须推进一张符合时代条件的预示牌并免费发动。</p><p>文明巨擘：分享奖励与统御行动会引入伟人；置顶伟人的业报改变规则。庇佑可将条例主导图标改为人物；行动结束时多余置顶伟人须淡出计分。法令可争夺并计入成就，时代 0 只有被指定伟人引入后才出现。</p><p>命运之城：无城市手牌时，融合行动新增颜色或改为新的展开方向会抽城市。即时图标仅在融合行动触发；旗帜与喷泉按可见状态动态计入成就。每回合可用匹配图标的置顶城市签署强化一次，移除不高于该城市时代的手牌，使自己的每段条例和发出的要求各执行两次。</p><p>岁月遗珍：融合行动可触发发掘或夺取。回合开始展览文物，可免费发动并在本次资格判定中计入其图标，随后轮转入馆。馆藏可以融合；满馆检查会授予博物馆成就并归还文物。强迫作用于有分享资格的对手。火星互联网支持可恢复的子对局；特殊边界解释见规则手册。</p><p>藏形匿影：每位玩家每回合首次普通抽牌按扩展优先级替换。保密的牌进入安全区，双方均不可查看牌面；可通过统御行动取得。安全区容量随最佳展开从 5 降至 1。提词器逐句执行、搭便车代选和可保存的硬币结果均已接入。</p><p>双方主区域用页签切换，默认显示我方。电脑使用本地基础策略；其决策只使用自己的私有信息和公开信息。查看详情时暂缓电脑行动。</p><p>进度自动保存到当前浏览器，包括尚未完成的选牌步骤。更换浏览器、端口或清除网站数据不会保留同一份存档。</p><p>规则依据官方终极版 4.1。城邦的权威门槛、核裂变和机器人学的效果分段以官方卡面为准；资料差异已在详情中注释。</p><div class="about-links"><a href="${esc(safeSourceURL(data.meta.rules_source))}" target="_blank" rel="noopener noreferrer">官方规则 ↗</a><a href="./README.md" target="_blank" rel="noopener noreferrer">项目说明 ↗</a><a href="./THIRD_PARTY_NOTICES.txt" target="_blank" rel="noopener noreferrer">资料署名 ↗</a></div></div>`;
  }
}
function centerStackPreview() {
  requestAnimationFrame(() => {
    const viewport = $('pile-preview')?.querySelector('.stack-viewport'), top = viewport?.querySelector('.is-top');
    if (!top) return;
    viewport.scrollLeft = Math.max(0, top.offsetLeft - (viewport.clientWidth - top.offsetWidth) / 2);
    viewport.scrollTop = Math.max(0, top.offsetTop - 14);
  });
}
function previewSplay(direction) {
  const view = viewHistory.at(-1); if (view?.kind !== 'pile') return;
  const player = state.players.find(item => item.id === view.player), actual = player.splay?.[view.color] || 'none';
  const selected = direction || view.preview || actual;
  // Focus can leave a direction button during a card's pointer-down. Avoid
  // replacing an unchanged preview here, which would remove the click target.
  if ($('pile-preview').querySelector('.stack-stage')?.dataset.direction !== selected) {
    const comparison = dialog.querySelector('.splay-comparison'), before = comparison.getBoundingClientRect().top;
    const inView = before < dialog.getBoundingClientRect().bottom && comparison.getBoundingClientRect().bottom > dialog.getBoundingClientRect().top;
    $('pile-preview').innerHTML = pilePreviewHTML(player.piles[view.color], cardsById, data.icon_names, view.color, actual, selected);
    // The controls sit below the preview. Keep them under the pointer even
    // when a different splay changes the height of the stack above them.
    if (inView) dialog.scrollTop += comparison.getBoundingClientRect().top - before;
    centerStackPreview();
  }
  dialog.querySelectorAll('[data-preview-splay]').forEach(button => {
    button.classList.toggle('is-preview', button.dataset.previewSplay === selected);
    button.setAttribute('aria-pressed', String(button.dataset.previewSplay === (view.preview || actual)));
  });
}
function command(name, id) {
  if (['opening', 'meld', 'dogma','decree','showcase'].includes(name)) { if (dialog.open) dialog.close(); commitAction({ type: name, player: 'you', cardId: id }); }
  else if (name === 'show-hand') { setSeat('you'); $('you-hand-area').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  else if (name === 'skip-choice' && pending?.min === 0) answerChoice([]);
  else if (name === 'select-all' && pending?.player === 'you' && pending.max === pending.options.length) { choiceSelection = pending.options.map(option => option.value); updateChoiceCount(); }
  else if (name === 'new-game') openView({ kind: 'new-game' });
  else if (name === 'confirm-new') { const expansions = [...dialog.querySelectorAll('[name="expansion"]:checked')].map(input => input.value); dialog.close(); freshGame(expansions); }
}
function wireEvents() {
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button || button.disabled) return; const d = button.dataset;
    if (d.rulesSection) {
      rulesSection = d.rulesSection;
      openView({ kind: 'rules', section: rulesSection, splay: rulesSplay });
      return;
    }
    if (d.ruleSplay && viewHistory.at(-1)?.kind === 'rules') {
      glossary.hide(); rulesSplay = d.ruleSplay; viewHistory.at(-1).splay = rulesSplay;
      $('rule-splay-example').innerHTML = rulesSplayHTML(rulesSplay, data);
      dialog.querySelectorAll('[data-rule-splay]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.ruleSplay === rulesSplay)));
      return;
    }
    if (d.command) { command(d.command, d.id); return; }
    if(d.secret!==undefined){commitAction({type:'achieve',player:'you',secret:Number(d.secret)});return;}
    if(d.decree){openView({kind:'decree',id:d.decree},dialog.open);return;}
    if (d.supply) { activeSupply = d.supply; renderSupply(); document.querySelector(`[data-supply="${activeSupply}"]`).focus(); return; }
    if (d.previewSplay) { viewHistory.at(-1).preview = d.previewSplay; previewSplay(d.previewSplay); return; }
    if (d.card) {
      const pile = button.closest('.color-pile');
      if (pile) openView({ kind: 'pile', color: pile.dataset.color, player: pile.dataset.player });
      else openView({ kind: 'card', id: d.card }, dialog.open);
    }
    else if (d.age) openView({ kind: 'age', age: Number(d.age), set: activeSupply });
    else if (d.pile) openView({ kind: 'pile', color: d.pile, player: d.player });
    else if (d.seat) setSeat(d.seat);
    else if (d.special) openView({ kind: 'special', id: d.special });
    else if (d.score) openView({ kind: 'score', player: d.score });
    else if (d.achievement) commitAction({ type: 'achieve', player: 'you', age: Number(d.achievement), cardId: d.achievementId });
    else if (d.mode && d.mode !== mode) {
      clearTimeout(aiTimer); mode = d.mode; message();
      if (mode === 'game') recompute(); else { state = createBoardState(data.cards.filter(card => cardSet(card) === 'Base'&&!isZero(card)), mode); activeSupply = 'base'; pending = null; } renderBoard(true);
    }
  });
  $('supply-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const tabs = [...$('supply-tabs').querySelectorAll('[data-supply]')], index = tabs.findIndex(tab => tab.dataset.supply === activeSupply);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowLeft' ? -1 : 1) + tabs.length) % tabs.length;
    activeSupply = tabs[next].dataset.supply; renderSupply(); $('supply-tabs').querySelector('[aria-selected="true"]').focus();
  });
  document.querySelector('.board-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); setSeat(event.key === 'Home' ? 'you' : event.key === 'End' ? 'opponent' : activeSeat === 'you' ? 'opponent' : 'you', true);
  });
  document.querySelector('.skip-link').addEventListener('click', () => setSeat('you'));
  $('choice-panel').addEventListener('change', event => {
    if (event.target.name !== 'choice') return; const { value, checked } = event.target;
    choiceSelection = choiceSelection.filter(id => id !== value); if (checked) { if (pending.max === 1) choiceSelection = []; choiceSelection.push(value); } updateChoiceCount();
  });
  $('choice-panel').addEventListener('submit', event => { event.preventDefault(); if (pending?.player === 'you') answerChoice(choiceSelection); });
  $('draw-action').addEventListener('click', () => commitAction({ type: 'draw', player: 'you' }));
  $('meld-action').addEventListener('click', () => command('show-hand'));
  $('dogma-action').addEventListener('click', () => openView({ kind: 'dogmas' }));
  $('decree-action').addEventListener('click',()=>openView({kind:'decrees'}));
  $('achieve-action').addEventListener('click', () => {
    const actions=engine.legalActions(state,'you').filter(a=>a.type==='achieve');
    if(actions.length&&actions.every(a=>Number.isInteger(a.secret))){
      setSeat('you');
      document.querySelector('#you-hand-area .safe-area')?.scrollIntoView({behavior:'smooth',block:'center'});
    }else{$('achievement-panel').open=true;$('achievement-panel').scrollIntoView({behavior:'smooth',block:'nearest'});}
  });
  $('pause-ai').addEventListener('click', () => { paused = !paused; renderBoard(); });
  $('log-bottom').addEventListener('click', () => { $('log-panel').open = true; $('game-log').scrollTop = $('game-log').scrollHeight; });
  $('inspector-content').addEventListener('change', event => {
    if (event.target.name === 'expansion') $('new-game-summary').textContent = `双人对局 · 需要 ${6 + dialog.querySelectorAll('[name="expansion"]:checked').length} 项成就获胜`;
    if (event.target.id === 'show-english') { showEnglish = event.target.checked; dialog.querySelectorAll('.effect-en').forEach(element => { element.hidden = !showEnglish; }); }
  });
  const previewOption = event => {
    const button = event.target.closest('[data-preview-splay]');
    if (button && !button.disabled && !button.contains(event.relatedTarget)) previewSplay(button.dataset.previewSplay);
  };
  $('inspector-content').addEventListener('pointerover', previewOption);
  $('inspector-content').addEventListener('focusin', previewOption);
  for (const type of ['pointerout', 'focusout']) $('inspector-content').addEventListener(type, event => {
    const group = event.target.closest('.splay-comparison');
    if (group && !group.contains(event.relatedTarget)) previewSplay();
  });
  $('inspector-back').addEventListener('click', () => {
    if (viewHistory.length < 2) return; glossary.hide(); viewHistory.pop(); renderInspector(); dialog.scrollTop = 0; $('inspector-heading')?.focus({ preventScroll: true });
  });
  $('inspector-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { glossary.hide(); viewHistory = []; if (opener?.isConnected) opener.focus({ preventScroll: true }); scheduleAI(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.addEventListener('visibilitychange', scheduleAI);
  $('about-button').disabled = false; $('new-game-button').disabled = false; $('rules-button').disabled = false;
  $('about-button').addEventListener('click', () => openView({ kind: 'about' }));
  $('rules-button').addEventListener('click', () => openView({ kind: 'rules', section: rulesSection, splay: rulesSplay }));
  $('new-game-button').addEventListener('click', () => openView({ kind: 'new-game' }));
}
async function initialize() {
  if (location.protocol === 'file:') return;
  try {
    const response = await fetch(new URL('../data/base-cards.json', import.meta.url));
    if (!response.ok) throw new Error(`读取卡牌资料失败（HTTP ${response.status}）。`);
    data = await response.json();
    if (data.cards.length !== 115 || new Set(data.cards.map(card => card.id)).size !== 115) throw new Error('基础牌资料数量异常。');
    const expansionResponse = await fetch(new URL('../data/echoes-cards.json', import.meta.url));
    if (!expansionResponse.ok) throw new Error('读取往日回声牌表失败。');
    const echoes = await expansionResponse.json();
    if (echoes.cards.length !== 115) throw new Error('往日回声牌表数量异常。');
    data.cards.push(...echoes.cards); data.special_achievements.push(...echoes.special_achievements);
    data.icon_names = { ...data.icon_names, ...echoes.icon_names };
    data.terms = [...new Map([...data.terms, ...echoes.terms].map(term => [term.id, term])).values()];
    const figuresResponse=await fetch(new URL('../data/figures-cards.json',import.meta.url));
    if(!figuresResponse.ok)throw new Error('文明巨擘牌表读取失败。');
    const figures=await figuresResponse.json();if(figures.cards.length!==130||figures.decrees.length!==5)throw new Error('文明巨擘牌表数量异常。');
    data.cards.push(...figures.cards);data.decrees=figures.decrees;data.icon_names={...data.icon_names,...figures.icon_names};
    data.terms=[...new Map([...data.terms,...figures.terms].map(term=>[term.id,term])).values()];
    const citiesResponse=await fetch(new URL('../data/cities-cards.json',import.meta.url));
    if(!citiesResponse.ok)throw new Error('命运之城牌表读取失败。');
    const cities=await citiesResponse.json();if(cities.cards.length!==115||cities.special_achievements.length!==5)throw new Error('命运之城牌表数量异常。');
    data.cards.push(...cities.cards);data.special_achievements.push(...cities.special_achievements);data.icon_names={...data.icon_names,...cities.icon_names};
    data.terms=[...new Map([...data.terms,...cities.terms].map(term=>[term.id,term])).values()];
    const artifactsResponse=await fetch(new URL('../data/artifacts-cards.json',import.meta.url));
    if(!artifactsResponse.ok)throw new Error('岁月遗珍牌表读取失败。');
    const artifacts=await artifactsResponse.json();
    if(artifacts.cards.length!==115||artifacts.museums.length!==5)throw new Error('岁月遗珍牌表数量异常。');
    data.cards.push(...artifacts.cards);data.museums=artifacts.museums;
    data.terms=[...new Map([...data.terms,...artifacts.terms].map(term=>[term.id,term])).values()];
    const unseenResponse=await fetch(new URL('../data/unseen-cards.json',import.meta.url));
    if(!unseenResponse.ok)throw new Error('藏形匿影牌表读取失败。');
    const unseen=await unseenResponse.json();
    if(unseen.cards.length!==115||unseen.special_achievements.length!==5)throw new Error('藏形匿影牌表数量异常。');
    data.cards.push(...unseen.cards);data.special_achievements.push(...unseen.special_achievements);
    data.terms=[...new Map([...data.terms,...unseen.terms].map(term=>[term.id,term])).values()];
    engine = createEngine(data); cardsById = engine.cards; glossary = createGlossary(data.terms, dialog, $('keyword-tip'));
    let restored = false;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { const saved = JSON.parse(raw); if (saved.version !== RULES_VERSION) throw new Error('版本不匹配'); session = saved.session; recompute(); restored = true; }
    } catch { message('已有存档无法读取，已创建新局。'); }
    if (!restored) { session = { base: engine.createGame(), action: null, answers: [] }; recompute(); }
    wireEvents(); renderBoard(); save(); $('loading').hidden = true; $('app').hidden = false;
    if (!restored) openView({ kind: 'new-game' });
  } catch (error) { $('loading').hidden = true; $('app').hidden = true; $('error-message').textContent = error.message; $('load-error').hidden = false; console.error(error); }
}
initialize();
