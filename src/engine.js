import { AGES, COLORS, SEATS } from './state.js';
import { EFFECTS } from './effects.js';
import { dogmaEligibility, dogmaTypeLabel, isDemand, isCompel } from './dogma.js';
import { isArtifact, deckAge, boardAge, digQualifies, museumAchievementCount, displayIcons } from './artifacts-rules.js';
import { prepareSubgame, settleSubgame, subgameActionLabel } from './artifacts-subgame.js';
import { EXPANSIONS, cardSet, setName, enabled, normalizeExpansions, achievementTarget } from './expansions.js';
import { isEcho, isBonus, bonusValue, forecastLimit, totalBonus } from './echoes-rules.js';
import { FIGURE_EFFECTS } from './effects-figures.js';
import { isFigure, isZero, figureState, figureTops, actionNumber, decreeOptions } from './figures-rules.js';
import { createKarmaRuntime, drain } from './figures-events.js';
import { DECREE_EFFECTS } from './effects-decrees.js';
import { isCity, cityAchievements, endorsementOptions, CITY_ARROWS, CITY_ACHIEVEMENTS } from './cities-rules.js';
import { CITY_EFFECTS } from './effects-cities.js';
import { safeLimit, secretBacks, secretToken } from './unseen-rules.js';
import { executeSentenceProgram, sentenceEntries } from './sentence-runtime.js';

export const RULES_VERSION = 2;
export const SPLAY_SLOTS = Object.freeze({ none: [], left: [3, 4], right: [0, 1], up: [1, 2, 3], aslant: [0, 1, 2, 3] });
export const SPLAY_NAMES = { none: '未展开', left: '向左展开', right: '向右展开', up: '向上展开', aslant: '斜向展开' };
export const SUPPORTED_DOGMAS = Object.freeze(Object.keys(EFFECTS));
const other = id => id === 'you' ? 'opponent' : 'you';
const clone = value => structuredClone(value);
class GameEnded extends Error {}
class DogmaComplete extends Error {}
class ChoicePending extends Error {
  constructor(choice) { super('等待玩家选择'); this.choice = choice; }
}

// Rules: official Ultimate 4.1, pp. 5–17. Effects are explicit card programs,
// never guessed from translated text. Unsupported cards are always rejected.
export function createEngine(data) {
  const cards = new Map(data.cards.map(card => [card.id, card]));
  const specials = new Map(data.special_achievements.map(card => [card.id, card]));
  const decrees = new Map((data.decrees || []).map(card => [card.id, card]));
  const museums = new Map((data.museums || []).map(card => [card.id, card]));
  const stateBindings = new WeakMap();
  const card = id => cards.get(id);
  const valueCard = (state,id) => {
    const value=card(id);
    return value?.board_age && state.players.some(p=>Object.values(p.piles).some(ids=>ids.includes(id)))
      ? {...value,age:value.board_age} : value;
  };
  const player = (state, id) => state.players.find(item => item.id === id);
  const bind = state => { for (const owner of state.players) stateBindings.set(owner, state); };
  const modifiers = p => {
    const state = stateBindings.get(p);
    return state && enabled(state, 'figures') ? figureState(state, id=>valueCard(state,id), visible, FIGURE_EFFECTS) : null;
  };
  const tops = p => COLORS.flatMap(color => p.piles[color.id].slice(-1));
  const bonuses = p => COLORS.flatMap(color => visible(p, color.id)).filter(mark => isBonus(mark.icon)).map(mark => bonusValue(mark.icon));
  const bonusPoints = p => totalBonus(bonuses(p));
  const score = p => modifiers(p)?.score(p.id) ?? (p.score.reduce((total, id) => total + card(id).age, 0) + bonusPoints(p));
  const handCards = p => modifiers(p)?.hand(p.id) ?? p.hand;
  const scoreCards = p => modifiers(p)?.scoreCards(p.id) ?? p.score;
  const highest = p => Math.max(0, ...tops(p).map(id => boardAge(card(id))));
  function visible(p, color) {
    const pile = p.piles[color];
    return pile.flatMap((id, index) => (index === pile.length - 1 ? [0, 1, 2, 3, 4, 5] : SPLAY_SLOTS[p.splay[color]])
      .filter(slot => card(id).spots[slot] !== null && card(id).spots[slot] !== undefined)
      .map(slot => ({ id, slot, icon: card(id).spots[slot] })));
  }
  function icons(p) {
    const changed = modifiers(p); if (changed) return changed.icons(p.id);
    const result = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, ...(stateBindings.get(p)?.ageZeroIntroduced ? [18] : [])].map(icon => [icon, 0]));
    for (const color of COLORS) for (const mark of visible(p, color.id)) if (Object.hasOwn(result, mark.icon)) result[mark.icon]++;
    return result;
  }
  const cityContributions = p => cityAchievements(stateBindings.get(p) || { players: [p] }, p, visible);
  const achievements = p => modifiers(p)?.achievements(p.id) ?? (p.achievements.length + p.specials.length + (p.decrees || []).length + museumAchievementCount(p) + cityContributions(p).total);
  const endorseOptions = (state, id, cardId) => endorsementOptions(state, player(state, id), card(cardId), card, handCards(player(state, id)));
  const eligibleCard = (state, id, value, multiplier = 1) => {
    const owner = player(state, id), age = valueCard(state,value)?.age;
    const repeats = owner.achievements.filter(achievement => card(achievement).age === age).length;
    const patch = modifiers(owner)?.patches[id];
    return age >= (state.ageZeroIntroduced ? 0 : 1) && age <= highest(owner) + (patch?.achievementAgeAdd || 0) && age * 5 * (repeats + 1) <= (score(owner) + (patch?.eligibilityByAge[age] || 0)) * multiplier;
  };
  const availableAchievements = (state, id) => [...new Set([...state.standard, ...(modifiers(player(state,id))?.patches[id].achievementExtra || [])])];
  const eligible = (state, id) => [...new Set([...availableAchievements(state,id), ...(player(state,id).safe || [])])].filter(value => eligibleCard(state, id, value));
  const dogmaCards = (state, id) => [...new Set([...tops(player(state,id)), ...(modifiers(player(state,id))?.patches[id].dogmaExtra || [])])].filter(id=>!isFigure(card(id))&&!isCity(card(id))&&EFFECTS[id]?.length);
  const legalDecrees = (state,id) => enabled(state,'figures') ? decreeOptions(state,{...player(state,id),hand:handCards(player(state,id))},card,FIGURE_EFFECTS,[...decrees.values()]) : [];
  const baseAges = state => state.ageZeroIntroduced ? [0, ...AGES] : AGES;
  // Generic "icon type" includes city special marks, but not images/echo boxes.
  // Featured-icon eligibility continues to use standard icons only.
  const iconTypes = state => [1,2,3,4,5,6,7,...(enabled(state,'cities')?[8,9,11,12,13,14,15,16,17]:[]),100,...(state.ageZeroIntroduced?[18]:[])];
  const drawAge = (state, requested) => baseAges(state).find(age => age >= Math.max(state.ageZeroIntroduced ? 0 : 1, requested || 0) && state.supply[age]?.length) ?? 12;
  const activeCard = (state, value) => isZero(value) ? !!state.ageZeroIntroduced : cardSet(value) === 'Base' || EXPANSIONS.some(item => enabled(state, item.id) && item.set === cardSet(value));
  const activeSpecials = state => [...specials.values()].filter(value => activeCard(state, value));
  function effectSteps(state, cardId) {
    const definition = card(cardId), owner = state.players.find(p => tops(p).includes(cardId));
    const sources = owner ? [...new Set(visible(owner, definition.color).filter(mark => mark.icon === 10).map(mark => mark.id))] : [cardId];
    return [...sources.flatMap(id => card(id).effects.flatMap((effect, index) => isEcho(effect) ? [{ cardId: id, index, echo: true }] : [])),
      ...definition.effects.flatMap((effect, index) => isEcho(effect) ? [] : [{ cardId, index, echo: false }])];
  }
  // Group responses and shared effects under the active turn's owner.
  function log(state, text, effect = null) { state.log.push({ turn: state.turn.number, player: state.turn.player, text, ...(effect ? { effect } : {}) }); if (state.log.length > 160) state.log.shift(); }

  function createGame(random = Math.random, options = {}) {
    const expansions = normalizeExpansions(options.expansions);
    for (const id of expansions) if (!data.cards.some(value => cardSet(value) === EXPANSIONS.find(item => item.id === id).set)) throw new Error('缺少扩展牌表。');
    const state = {
      version: RULES_VERSION, mode: 'game', phase: 'opening',
      expansions, expansionSupply: Object.fromEntries(expansions.map(id => [id, Object.fromEntries(AGES.map(age => [age, data.cards.filter(item => deckAge(item) === age && cardSet(item) === EXPANSIONS.find(expansion => expansion.id === id).set).map(item => item.id)]))])),
      supply: Object.fromEntries(AGES.map(age => [age, data.cards.filter(item => item.age === age && cardSet(item) === 'Base').map(item => item.id)])),
      players: SEATS.map(seat => ({ ...seat, hand: [], score: [], achievements: [], specials: [],
        forecast: [], safe: [], display: [], museum: [], museumCards: {}, museumAchievements: [],
        piles: Object.fromEntries(COLORS.map(color => [color.id, []])), splay: Object.fromEntries(COLORS.map(color => [color.id, 'none'])) })),
      standard: [], standardOrigins: {}, availableSpecials: [], junkSpecials: [], junk: [],
      availableDecrees: expansions.includes('figures') ? [...decrees.keys()] : [], ageZeroIntroduced: false,
      availableMuseums: expansions.includes('artifacts') ? [...museums.keys()] : [],
      turn: { player: null, number: 0, left: 0 }, opening: {}, log: [], winner: null, endorsements: {},
    };
    state.availableSpecials = activeSpecials(state).map(value => value.id);
    for (const decks of Object.values(state.expansionSupply)) for (const deck of Object.values(decks)) {
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    }
    for (const age of AGES) {
      const deck = state.supply[age];
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      if (age <= 10) { const id = deck.pop(); state.standard.push(id); state.standardOrigins[age] = id; }
    }
    for (const p of state.players) p.hand.push(state.supply[1].pop(), state.supply[1].pop());
    state.rng = Math.floor(random() * 4294967296) >>> 0;
    // The computer commits before seeing the human opening choice.
    const preferred = ['B004', 'B012', 'B009', 'B002', 'B010', 'B008'];
    state.opening.opponent = player(state, 'opponent').hand.slice().sort((a, b) => {
      const rank = id => preferred.includes(id) ? preferred.indexOf(id) : 100;
      return rank(a) - rank(b);
    })[0];
    log(state, '已洗牌，预留时代 1–10 各一张标准成就，双方各抽两张时代 1 手牌。');
    if (expansions.length) log(state, `启用${EXPANSIONS.filter(item => expansions.includes(item.id)).map(item => item.name).join('、')}；本局需 ${achievementTarget(state)} 项成就获胜。`);
    assertState(state);
    return state;
  }

  function assertState(state) {
    bind(state);
    if (state.version !== RULES_VERSION || state.mode !== 'game' || !['opening', 'playing', 'over'].includes(state.phase)) throw new Error('存档版本或阶段不匹配。');
    const seen = new Set(), specialSeen = new Set();
    const expansionIds = normalizeExpansions(state.expansions);
    const record = (id, condition = true) => { if (!cards.has(id) || seen.has(id) || !condition || !activeCard(state, card(id))) throw new Error(`卡牌区域异常：${id}`); seen.add(id); };
    for (const age of baseAges(state)) for (const id of state.supply[age]) record(id, card(id)?.age === age && cardSet(card(id)) === 'Base');
    for (const expansion of expansionIds) {
      const decks = state.expansionSupply?.[expansion];
      if (!decks) throw new Error('扩展牌库缺失。');
      for (const age of AGES) for (const id of decks[age]) record(id, deckAge(card(id)) === age && cardSet(card(id)) === EXPANSIONS.find(item => item.id === expansion).set);
    }
    for (const id of [...state.standard, ...state.junk, ...(state.parkedCards || [])]) record(id);
    if (state.players.length !== 2 || new Set(state.players.map(p => p.id)).size !== 2 || state.players.some(p => !['you', 'opponent'].includes(p.id))) throw new Error('玩家资料异常。');
    for (const p of state.players) {
      for (const id of [...p.hand, ...p.score, ...p.achievements, ...(p.forecast || []), ...(p.safe || [])]) record(id);
      if ((p.display || []).length>1) throw new Error('展示区只能有一张文物。');
      for (const id of [...(p.display || []), ...(p.museum || [])]) record(id,isArtifact(card(id)));
      if ((p.museum || []).some(id=>!museums.has(p.museumCards?.[id])&&state.museumCheck?.orphan!==id) || Object.keys(p.museumCards || {}).some(id=>!p.museum?.includes(id))) throw new Error('博物馆与馆藏不匹配。');
      for (const color of COLORS) {
        const pile = p.piles[color.id];
        if (!Object.hasOwn(SPLAY_SLOTS, p.splay[color.id]) || (pile.length < 2 && p.splay[color.id] !== 'none')) throw new Error('展开状态异常。');
        for (const id of pile) record(id, card(id)?.color === color.id);
      }
      for (const id of p.specials) { if (!specials.has(id) || specialSeen.has(id)) throw new Error('特殊成就重复。'); specialSeen.add(id); }
    }
    for (const id of state.availableSpecials) { if (!specials.has(id) || specialSeen.has(id)) throw new Error('特殊成就异常。'); specialSeen.add(id); }
    for (const id of state.junkSpecials || []) { if (!specials.has(id) || specialSeen.has(id)) throw new Error('移除的特殊成就异常。'); specialSeen.add(id); }
    for (const id of state.parkedSpecials || []) { if (!specials.has(id) || specialSeen.has(id)) throw new Error('子对局暂存成就异常。');specialSeen.add(id); }
    const decreeIds = [...(state.availableDecrees || []), ...state.players.flatMap(p=>p.decrees || []), ...(state.parkedDecrees || [])];
    if (decreeIds.length !== (enabled(state,'figures') ? decrees.size : 0) || new Set(decreeIds).size !== decreeIds.length || decreeIds.some(id=>!decrees.has(id))) throw new Error('法令数量或归属异常。');
    const museumIds=[...(state.availableMuseums || []),...state.players.flatMap(p=>[...Object.values(p.museumCards || {}),...(p.museumAchievements || [])]),...(state.parkedMuseums || [])];
    if(museumIds.length!==(enabled(state,'artifacts')?museums.size:0)||new Set(museumIds).size!==museumIds.length||museumIds.some(id=>!museums.has(id)))throw new Error('博物馆数量或归属异常。');
    if (seen.size !== data.cards.filter(value => activeCard(state, value)).length || specialSeen.size !== activeSpecials(state).length || [...specialSeen].some(id => !activeCard(state, specials.get(id)))) throw new Error('卡牌数量不守恒。');
    if (state.phase === 'playing' && (!['you', 'opponent'].includes(state.turn.player) || ![1, 2].includes(state.turn.left))) throw new Error('回合状态异常。');
    if (state.phase === 'opening' && !player(state, 'opponent').hand.includes(state.opening.opponent)) throw new Error('初始选择异常。');
  }

  function context(state, actor, ask) {
    bind(state);
    const card = id => valueCard(state,id);
    let changes = 0;
    const frames = [], revealed = new Set(), memory = new Map(), drawResults = new Map();
    const choiceControllers = [];
    let forcedChoices = 0;
    let actionScope = { type: null, number: actionNumber(state), meldCardId: null };
    const karma = createKarmaRuntime(state, card, () => ctx, frames, record);
    const frame = () => frames.at(-1);
    function record(text) {
      const active = frame();
      log(state, text, active ? { cardId: active.effectCardId || active.cardId, dogmaCardId: active.cardId, icon: active.featuredIcon || card(active.cardId).dogma_icon || (isFigure(card(active.cardId)) ? 7 : null), kind: active.effectKind || 'activation', index: active.effectIndex, executor: active.executor } : null);
    }
    state.junkSpecials ??= []; // Additive migration for existing version 2 saves.
    state.expansions ??= []; state.expansionSupply ??= {};
    for (const owner of state.players) { owner.forecast ??= []; owner.safe ??=[]; owner.decrees ??= []; owner.display ??=[]; owner.museum ??=[]; owner.museumCards ??={};owner.museumAchievements ??=[]; }
    state.availableMuseums ??=[];
    state.availableDecrees ??= []; state.rng ??= 0x4f6a39d1;
    state.endorsements ??= {}; // Additive: older v2 saves have not used Endorse.
    if (!state.turnCounts || state.turnCounts.number !== state.turn.number) state.turnCounts = { number: state.turn.number, you: {}, opponent: {} };
    const p = id => player(state, id);
    const views = new Map(state.players.map(owner => {
      const view = new Proxy(owner,{get(target,key){if(key==='hand')return handCards(target);if(key==='score')return scoreCards(target);return target[key];}});
      stateBindings.set(view,state);return [owner.id,view];
    }));
    const stateView = new Proxy(state,{get(target,key){return key==='players' ? [...views.values()] : target[key];}});
    const event = (type, id, details={}) => ({type,player:id,actionNumber:actionScope.number,...details});
    function shuffle(deck) {
      for(let i=deck.length-1;i>0;i--){state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;const j=Math.floor(state.rng/4294967296*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    }
    function introduceZero() {
      if(state.ageZeroIntroduced)return;
      state.ageZeroIntroduced=true;state.supply[0]=data.cards.filter(isZero).map(c=>c.id);shuffle(state.supply[0]);
      record('引入时代 0 基础牌库，食物成为标准图标，时代 0 可以被选择。');
    }
    function location(id) {
      for (const age of baseAges(state)) if (state.supply[age].includes(id)) return { array: state.supply[age], label: '牌库', key:'supply', set:'base', age };
      for (const [set,decks] of Object.entries(state.expansionSupply)) for (const age of AGES) if (decks[age].includes(id)) return { array: decks[age], label: '扩展牌库', key:'supply', set, age };
      for (const key of ['standard', 'junk']) if (state[key].includes(id)) return { array: state[key], key, label: key === 'standard' ? '标准成就区' : '移除区' };
      for (const owner of state.players) {
        for (const key of ['hand', 'score', 'achievements', 'forecast', 'safe', 'display', 'museum']) if (owner[key].includes(id)) return { array: owner[key], owner, key };
        for (const color of COLORS) if (owner.piles[color.id].includes(id)) return { array: owner.piles[color.id], owner, key: 'board', color: color.id };
      }
      throw new Error(`找不到卡牌 ${id}`);
    }
    function move(id, to, ownerId = frame()?.actor ?? actor, verb = '', keyword = null, deferWhen = false) {
      const initial = location(id), owner = p(ownerId), definition = card(id);
      const previousSplay = owner.splay[definition.color];
      const performer = frame()?.executor || ownerId;
      const type = keyword || (to==='achievements'?'claim':to);
      const planned = event(type,performer,{cardId:id,age:definition.age,color:definition.color,from:initial,to,target:ownerId,
        meldAction:actionScope.type==='meld'&&actionScope.meldCardId===id});
      if (karma.trigger(planned)) return null;
      // A first karma may already have moved this particular card. The pending
      // instruction applies only while it is still in the selected source zone.
      if(!initial.array.includes(id))return null;
      const from=location(id);
      // Rulebook p.25 describes capacity for foreshadowing but does not explicitly
      // address transfers/exchanges. Follow BGA 4E transferCardFromTo here:
      // all arrivals respect capacity; existing excess cards remain in place.
      if (to === 'foreshadow' || to === 'forecast') {
        if (owner.forecast.length >= forecastLimit(owner)) { record(`${owner.name}的预示区已达容量 ${forecastLimit(owner)}，该牌留在原区域。`); return null; }
        to = 'forecast';
      }
      if (to === 'safeguard' || to === 'safe') {
        // 不确定边界：p.31只明示Safeguard容量；转移/交换进入安全区也
        // 遵守容量，采用BGA 4E的区域容量解释。原有超额牌不会被移除。
        if (from.owner?.id===ownerId && from.key==='safe') return null;
        if (owner.safe.length >= safeLimit(owner)) { record(`${owner.name}的安全区已达容量 ${safeLimit(owner)}，该牌留在原区域。`); return null; }
        to = 'safe';
      }
      from.array.splice(from.array.indexOf(id), 1);
      if(from.key==='museum') {
        const museum=from.owner.museumCards[id];delete from.owner.museumCards[id];
        if(museum)state.availableMuseums.push(museum);
      }
      if (to === 'meld' || to === 'tuck') owner.piles[definition.color][to === 'tuck' ? 'unshift' : 'push'](id);
      else if (to === 'return' || to === 'decktop') {
        const set = cardSet(definition), deck = set === 'Base' ? state.supply[deckAge(definition)] : state.expansionSupply[EXPANSIONS.find(item => item.set === set).id][deckAge(definition)];
        deck[to === 'return' ? 'unshift' : 'push'](id);
      }
      else if (to === 'junk') state.junk.push(id);
      else if (to === 'standard') state.standard.push(id);
      else owner[to].push(id);
      if(to==='safe')revealed.delete(id);
      if(id==='A004'&&['meld','tuck'].includes(to))for(const active of frames)active.dancingVisits?.add(ownerId);
      // A top-to-bottom tuck within one pile is one move. Its temporary
      // removal must not collapse a two-card splay (Socialism).
      if (from.key === 'board' && from.array.length < 2) from.owner.splay[from.color] = 'none';
      changes++;
      if(['score','tuck'].includes(type))state.turnCounts[performer][type]=(state.turnCounts[performer][type]||0)+1;
      const name = from.key === 'board' || to === 'meld' || to === 'tuck' ? `「${definition.name_zh}」` : `时代 ${definition.age} 的一张牌`;
      const words = { meld: '融合', tuck: '垫底', return: '归还', junk: '移除', hand: '获得', score: '计分', achievements: '统御', forecast: '预示', safe:'保密', display:'发掘并展示', museum:'轮转入馆', standard: '加入可用成就的', decktop: '放回对应牌库顶部的' };
      const fromOpponent = from.owner && from.owner.id !== ownerId;
      const destinationName={hand:'手牌',score:'计分区',meld:'面板',tuck:'面板底部',forecast:'预示区',safe:'安全区',achievements:'成就区'};
      if(keyword==='transfer')record(`${from.owner?.name||p(performer).name}将${name}转移至${to==='standard'?'可用成就区':`${owner.name}的${destinationName[to]||to}`}。`);
      else record(fromOpponent && to === 'hand' && !verb
        ? `${from.owner.name}将${name}转移到${owner.name}的手牌。`
        : `${owner.name}${verb || words[to]}${name}。`);
      if (enabled(state, 'cities') && isCity(definition)) {
        if (to === 'meld' && !keyword) {
          for (const [icon, direction] of Object.entries(CITY_ARROWS)) if (previousSplay === direction && definition.spots.includes(Number(icon))) claimSpecial(ownerId, CITY_ACHIEVEMENTS[direction], 'CITIES');
        }
        // Official special cards say "from your hand". As in pinned BGA 4E,
        // credit belongs to the owner of that physical hand, including forced
        // junking. A virtual Each hand does not change physical ownership.
        if (to === 'junk' && from.key === 'hand') {
          if (definition.spots.includes(8)) claimSpecial(from.owner.id, 'GLORY', 'CITIES');
          if (definition.spots.includes(9)) claimSpecial(from.owner.id, 'VICTORY', 'CITIES');
        }
      }
      if(to==='meld'&&!keyword&&!deferWhen)karma.melded(id,ownerId);
      return id;
    }
    function endByScore() {
      const ordered = state.players.slice().sort((a, b) => score(b) - score(a) || achievements(b) - achievements(a));
      const tied = score(ordered[0]) === score(ordered[1]) && achievements(ordered[0]) === achievements(ordered[1]);
      win(tied ? null : ordered[0].id,'尝试抽取时代 12 或更高的牌，按分数、成就数依次比较。');
    }
    function draw(id, age, destination = 'hand', reveal = false, requestedSet = null) {
      let actual = drawAge(state, age);
      if (actual > 11) endByScore();
      const selectDeck = value => {
        let set = requestedSet || 'base';
        if (requestedSet === null && enabled(state,'echoes') && tops(p(id)).filter(cardId=>card(cardId).age===highest(p(id))).length===1)set='echoes';
        // Decide the replacement before falling back from an empty expansion.
        // Every actual draw counts, including another set and a shared draw.
        if (set==='base' && requestedSet===null && enabled(state,'unseen') && state.phase==='playing' && !state.turnCounts[id].draw)set='unseen';
        if(set!=='base'&&state.expansionSupply[set]?.[value]?.length)return {set,deck:state.expansionSupply[set][value]};
        return {set:'base',deck:state.supply[value]};
      };
      let selected=selectDeck(actual);
      if(karma.trigger(event('draw',id,{age:actual,set:selected.set,destination})))return null;
      actual=drawAge(state,age);if(actual>11)endByScore();selected=selectDeck(actual);
      const deck=selected.deck;
      const drawn = deck.at(-1);
      state.turnCounts[id].draw=(state.turnCounts[id].draw||0)+1;
      // Draw-and-foreshadow still draws to hand when the forecast is full.
      let completed;
      if (destination === 'forecast') { move(drawn, 'hand', id, '抽取'); completed=move(drawn, 'foreshadow', id); }
      else if(destination==='hand')completed=move(drawn,'hand',id,'抽取');
      else {move(drawn,'hand',id,'抽取');completed=move(drawn,destination,id);}
      drawResults.set(drawn,{destination,age:card(drawn).age,completed:!!completed});
      if (reveal) revealCards(id, [drawn]);
      return drawn;
    }
    function revealCards(id, ids) {
      ids.forEach(value => revealed.add(value));
      if (ids.length) record(`${p(id).name}展示：${ids.map(value => card(value).name_zh).join('、')}。`);
    }
    function* choose(id, prompt, options, min = 1, max = 1) {
      if(forcedChoices){
        min=Math.max(1,min);
        if(options.some(option=>!['no','skip','pass'].includes(option.value)))options=options.filter(option=>!['no','skip','pass'].includes(option.value));
      }
      if (!options.length || max === 0) return [];
      const controller=[...choiceControllers].reverse().find(item=>item.executor===id)?.controller||id;
      const choice = { player: controller, ...(controller!==id?{executor:id,delegated:true}:{}), prompt, options, min: Math.min(min, options.length), max: Math.min(max, options.length) };
      // Even forced card sequences preserve a chosen order when multiple cards move.
      if (options.length === 1 && choice.min === 1 && choice.max === 1) return [options[0].value];
      // One replayable decision tape also serves synchronous primitive hooks.
      // A karma may ask in the middle of draw/move; no live generator is saved.
      const answer = ask(choice);
      if (!Array.isArray(answer) || new Set(answer).size !== answer.length || answer.length < choice.min || answer.length > choice.max || answer.some(value => !options.some(option => option.value === value))) throw new Error('请选择允许范围内的选项。');
      return answer;
    }
    function* pick(id, prompt, ids, min = 1, max = 1, hiddenFaces = false) {
      const tokens=new Map();
      const selected=yield* choose(id, prompt, ids.map(value => {
        const place = location(value);
        const inOwnView = handCards(p(id)).includes(value) || scoreCards(p(id)).includes(value);
        const secret=place.key==='safe'&&!revealed.has(value);
        const hidden = secret || hiddenFaces || (!inOwnView && (['standard', 'achievements', 'junk'].includes(place.key) ||
          (['hand', 'score', 'forecast'].includes(place.key) && place.owner.id !== id && !revealed.has(value))));
        const token=secret?secretToken(place.owner.id,place.array.indexOf(value)):value;
        tokens.set(token,value);
        return { value:token, cardId: hidden ? null : value, label: hidden ? `${setName(cardSet(card(value)))} · 时代 ${card(value).age} ${secret?`机密牌 #${place.array.indexOf(value)+1}`:['standard','achievements'].includes(place.key) ? '成就' : '牌'}` : card(value).name_zh, age: card(value).age, set: cardSet(card(value)) };
      }), min, max);
      return selected.map(value=>tokens.get(value));
    }
    function* yes(id, prompt) { if(forcedChoices)return true;const values = yield* choose(id, prompt, [{ value: 'yes', label: '执行' }, { value: 'no', label: '跳过' }]); return values[0] === 'yes'; }
    function* controlled(executor,controller,work) {
      choiceControllers.push({executor,controller});
      try{return yield*work();}finally{choiceControllers.pop();}
    }
    function* forceChoices(work) { forcedChoices++;try{return yield*work();}finally{forcedChoices--;} }
    function* executeSentence(id,cardId,ordinal,previous) {
      const entry=sentenceEntries(card(cardId))[ordinal];
      if(!entry)return {executed:false,completed:false,facts:previous?.facts||{}};
      const parent=frame();
      // Executing quoted text is not Self-execute: do not add echoes, sharing,
      // or a chain achievement merely for entering this sentence.
      frames.push({...parent,actor:id,executor:id,cardId,effectCardId:cardId,featuredIcon:card(cardId).dogma_icon,effectIndex:entry.effectIndex,effectKind:'non-demand',memory:parent?.cardId===cardId?parent.memory:new Map()});
      try{return yield*executeSentenceProgram(ctx,id,cardId,ordinal,previous);}finally{frames.pop();}
    }
    function cityDraw(id) {
      if (!enabled(state, 'cities') || handCards(p(id)).some(value => isCity(card(value)))) return null;
      record(`${p(id).name}手中没有城市，按最高置顶时代抽取一张城市牌。`);
      return draw(id, highest(p(id)), 'hand', false, 'cities');
    }
    function splay(id, color, direction, performer = frame()?.executor || actor) {
      if (p(id).piles[color].length < 2 || p(id).splay[color] === direction) return false;
      if(karma.trigger(event('splay',performer,{color,direction,target:id})))return false;
      if(p(id).piles[color].length<2||p(id).splay[color]===direction)return false;
      p(id).splay[color] = direction; changes++;
      record(`${p(id).name}将${COLORS.find(item => item.id === color).name}色牌堆${SPLAY_NAMES[direction]}。`);
      if (direction !== 'none') cityDraw(performer);
      return true;
    }
    function* citySearch(id, age, icon) {
      // Rulebook p.22: this entire operation ignores all karma. Do not route
      // any of its movements through draw/move; even Return Would must not run.
      const deck = state.supply[age], shown = deck.slice(-age).reverse();
      revealCards(id, shown);
      const keep = shown.filter(value => card(value).spots.includes(icon));
      const rest = shown.filter(value => !keep.includes(value));
      const ordered = yield* pick(id, '搜索：按归还顺序选择剩余牌；先选的牌先放到牌库底部。', rest, rest.length, rest.length);
      for (const value of shown) deck.splice(deck.indexOf(value), 1);
      p(id).hand.push(...keep);
      for (const value of ordered) deck.unshift(value);
      if (shown.length) changes++;
      record(`${p(id).name}搜索时代 ${age}：展示 ${shown.length} 张，取得 ${keep.length} 张带【${data.icon_names[icon]}】的牌，归还 ${rest.length} 张。`);
    }
    function* dig(id, covering, covered) {
      if(!enabled(state,'artifacts')||!digQualifies(covering,covered))return;
      const age=drawAge(state,boardAge(covered));
      const rivals=state.players.filter(owner=>owner.id!==id);
      const seizures=rivals.flatMap(owner=>owner.museum.filter(value=>card(value).age===age));
      const canDig=!p(id).display.length&&age<=11&&state.expansionSupply.artifacts[age]?.length;
      const options=[...(canDig?[{value:'dig',label:`发掘时代 ${age} 文物，放入展示区`}]:[]),
        ...seizures.map(value=>({value,cardId:value,age,label:`夺取「${card(value).name_zh}」及其博物馆`})),
        {value:'skip',label:'放弃本次发掘'}];
      if(options.length===1){record(`${p(id).name}符合发掘条件，但展示区已有文物或对应文物牌库无牌，且没有可夺取的同代馆藏。`);return;}
      const [choice]=yield*choose(id,`发掘：覆盖了时代 ${boardAge(covered)} 的「${covered.name_zh}」，跳过基础空牌库后为时代 ${age}。`,options);
      if(choice==='dig'){
        const value=state.expansionSupply.artifacts[age].at(-1);
        move(value,'display',id,'发掘并展示','rotate');
        record(`展示区的「${card(value).name_zh}」将在${p(id).name}下个回合开始时展览。`);
      } else if(choice!=='skip'){
        const from=location(choice),museum=from.owner.museumCards[choice];
        from.array.splice(from.array.indexOf(choice),1);delete from.owner.museumCards[choice];
        p(id).museum.push(choice);p(id).museumCards[choice]=museum;changes++;
        record(`${p(id).name}夺取${from.owner.name}馆藏「${card(choice).name_zh}」，文物与博物馆一同轮转。`);
      }
    }
    function* museumCheck(id) {
      if(state.availableMuseums.length)return;
      const owners=state.players.slice().sort((a,b)=>b.museum.length-a.museum.length);
      state.museumCheck={};
      if(owners[0].museum.length>owners[1].museum.length){
        const owner=owners[0];
        const [value]=yield*pick(owner.id,'博物馆检查：你独自拥有最多馆藏，选择一座博物馆作为成就（文物仍将归还）。',owner.museum);
        const museum=owner.museumCards[value];
        if(!karma.trigger(event('claim',owner.id,{cardId:museum,to:'museumAchievements',target:owner.id}))){
          delete owner.museumCards[value];
          owner.museumAchievements.push(museum);state.museumCheck.orphan=value;changes++;
          record(`${owner.name}独自拥有最多馆藏，取得一座博物馆作为成就。`);
        }
      } else record('博物馆检查：最多馆藏数量并列，无人取得博物馆成就。');
      const remaining=state.players.flatMap(owner=>owner.museum);
      // Return Would can replace individual returns. Museum checks still
      // vacate every museum (p.27); a replaced return stays in its new zone.
      const ordered=yield*pick(id,'博物馆检查：按归还顺序选择双方全部馆藏。',remaining,remaining.length,remaining.length);
      for(const value of ordered){
        const from=location(value),owner=from.owner;
        if(from.key!=='museum')continue;
        move(value,'return',id);
        if(owner.museum.includes(value)){
          // 不确定边界：官方未单列“归还被业报替代但文物未移动”。
          // 保留文物及其馆藏关系，避免无依据地移除实体牌。
          if(state.museumCheck.orphan===value)move(value,'hand',owner.id,'轮转回手牌','rotate');
        }
      }
      delete state.museumCheck;
    }
    function* showcase(id) {
      const value=state.turn.showcaseId;
      delete state.turn.showcaseId;
      if(!p(id).display.includes(value))return;
      const previous=actionScope;actionScope={type:'dogma',number:null,meldCardId:null};
      try{
        record(`${p(id).name}在回合开始时展览「${card(value).name_zh}」，不消耗两次常规行动。`);
        if(EFFECTS[value]?.length && (yield*yes(id,'展览：是否免费发动展示文物？文物图标仅加入本次资格判定，跳过所有回声。'))){
          try{yield*runCard(id,value,'normal',false,true);}
          catch(error){if(!(error instanceof DogmaComplete))throw error;}
          finishAction(state,ctx,false);
        }
        if(p(id).display.includes(value)){
          if(state.availableMuseums.length){
            const museum=state.availableMuseums[0];
            if(move(value,'museum',id,'轮转入馆','rotate')){
              state.availableMuseums.splice(state.availableMuseums.indexOf(museum),1);p(id).museumCards[value]=museum;
              yield*museumCheck(id);
            }
          } else move(value,'hand',id,'因无空馆而轮转回手牌','rotate');
        }
        finishAction(state,ctx,false);
      } finally {actionScope=previous;}
    }
    function* meldAction(id, cardId) {
      const definition = card(cardId), newColor = p(id).piles[definition.color].length === 0;
      const covered=card(p(id).piles[definition.color].at(-1));
      const melded = move(cardId, 'meld', id, '', null, true);
      const stillTop = () => p(id).piles[definition.color].at(-1) === cardId;
      if (!melded || !stillTop()) return false;
      // Rulebook p.9 visual order: City icons, City draw, Dig,
      // When karma, then Promote. Stop later triggers if the melded card leaves top.
      if (enabled(state, 'cities') && isCity(definition)) {
        if (!CITY_EFFECTS[cardId]) throw new Error(`城市程序缺失：${cardId}`);
        for (const step of CITY_EFFECTS[cardId]) {
          const index = definition.effects.findIndex(effect => effect.slot === step.slot);
          frames.push({ actor:id,executor:id,cardId,effectCardId:cardId,effectKind:'city',effectIndex:index,featuredIcon:step.icon,mode:'city',memory:new Map() });
          try { record(`${p(id).name}执行「${definition.name_zh}」的${definition.effects[index].label}。`); yield* step.run(ctx, id, definition); }
          finally { frames.pop(); }
        }
      }
      if (!stillTop()) return false;
      if (newColor) cityDraw(id);
      if (!stillTop()) return false;
      yield*dig(id,definition,covered);
      if (!stillTop()) return false;
      karma.melded(cardId, id);
      return stillTop();
    }
    function claimSpecial(id, key, set = 'BASE') {
      return claimSpecialId(id,`S-${set}-${key}`);
    }
    function claimSpecialId(id,value) {
      if (!state.availableSpecials.includes(value)) return false;
      if (karma.trigger(event('claim',id,{cardId:value,to:'specials',target:id}))) return false;
      const index = state.availableSpecials.indexOf(value);
      if (index < 0) return false;
      state.availableSpecials.splice(index, 1); p(id).specials.push(value); changes++;
      record(`${p(id).name}统御特殊成就「${specials.get(value).name_zh}」。`);
      return true;
    }
    function specialMove(id, toJunk) {
      const source = toJunk ? state.availableSpecials : state.junkSpecials;
      const target = toJunk ? state.junkSpecials : state.availableSpecials;
      const index = source.indexOf(id); if (index < 0) return false;
      source.splice(index, 1); target.push(id); changes++;
      record(`${toJunk ? '移除' : '恢复'}特殊成就「${specials.get(id).name_zh}」。`); return true;
    }
    function win(id, reason) {
      const planned=event('win',id,{winner:id,reason});
      if(id)karma.trigger(planned);
      state.phase = 'over'; state.winner = { player: planned.winner, reason: planned.winner!==id ? `「${card('F096').name_zh}」的业报改写了胜者。` : reason };
      record(planned.winner ? `${p(planned.winner).name}获胜：${state.winner.reason}` : `游戏结束：平局。${reason}`); throw new GameEnded();
    }
    function lose(id, reason) {
      const loser = p(id);
      for (const value of [...loser.hand, ...loser.score, ...loser.achievements, ...loser.forecast, ...loser.safe, ...loser.display, ...loser.museum, ...Object.values(loser.piles).flat()]) move(value, 'junk', id);
      state.junkSpecials.push(...loser.specials); loser.specials = []; loser.eliminated = true;
      state.availableDecrees.push(...loser.decrees);loser.decrees=[];
      state.availableMuseums.push(...loser.museumAchievements);loser.museumAchievements=[];
      win(other(id), `${loser.name}因${reason}出局。`);
    }
    function winUnique(metric, direction, reason) {
      const ordered = state.players.slice().sort((a, b) => direction === 'lowest' ? metric(a) - metric(b) : metric(b) - metric(a));
      if (metric(ordered[0]) !== metric(ordered[1])) win(ordered[0].id, reason);
    }
    function* runCard(id, cardId, mode = 'normal', foreseen = false, showcasing = false) {
      const definition = card(cardId);
      if(isFigure(definition)||isCity(definition)||!definition?.effects.length){record(`「${definition.name_zh}」没有条例，自执行或超执行不产生效果。`);return;}
      if (!definition || !EFFECTS[cardId] || EFFECTS[cardId].length !== definition.effects.length) throw new Error(`条例程序不完整：${cardId}`);
      const foreseenCardId = foreseen ? cardId : frame()?.foreseenCardId;
      const inheritedShift=frame()?.actionValueShift||0;
      const active = { actor: id, cardId, mode, foreseenCardId, memory: new Map(), transferred: 0, returned: 0, effectKind: null, effectIndex: null, executor: id, featuredIcon:definition.dogma_icon, valueShift:inheritedShift, actionValueShift:inheritedShift,
        dancingVisits:new Set(state.players.filter(owner=>Object.values(owner.piles).some(ids=>ids.includes('A004'))).map(owner=>owner.id)) };
      const rival = other(id);
      frames.push(active);
      let shared = false;
      try {
        // Rulebook p.10: Endorse precedes Auspice. Pay using the originally
        // printed featured icon, then freeze visible echoes and eligibility.
        const endorsements = mode === 'normal' ? endorseOptions(state, id, cardId) : [];
        if (endorsements.length) {
          const [cityId] = yield* choose(id, '签署强化：可选一张置顶城市并移除一张不高于它的手牌；每回合至多一次。', [
            { value:'normal',label:'正常发动，本次不签署强化' },
            ...endorsements.map(option => ({ value:option.cityId,cardId:option.cityId,age:card(option.cityId).age,label:`用「${card(option.cityId).name_zh}」签署强化（费用时代 ≤ ${card(option.cityId).age}）` }))
          ]);
          const option = endorsements.find(option => option.cityId === cityId);
          if (option) {
            const [payment] = yield* pick(id, '签署费用：移除一张手牌。自己的每段条例、对手受到的每段要求将执行两次。', option.payments);
            state.endorsements[id] = state.turn.number;
            active.endorsed = true; active.effectKind = 'endorse';
            record(`${p(id).name}用「${card(cityId).name_zh}」签署强化本次条例行动。`);
            // As for Decree, a Would replacement changes the payment operation,
            // not the remainder of the action (official p.28; BGA 4E setupDogma).
            move(payment, 'junk', id);
            active.effectKind = null;
          }
        }
        if(mode==='normal'&&enabled(state,'figures')&&figureTops(p(id),card).some(value=>card(value).spots.includes(definition.dogma_icon))) {
          const [choice]=yield*choose(id,'是否庇佑？使用人物图标判定本次条例的分享与要求。',[
            {value:'normal',label:`保持${data.icon_names[definition.dogma_icon]}`},{value:'auspice',label:'庇佑：改用人物图标'}]);
          if(choice==='auspice')active.featuredIcon=7;
        }
        const steps = effectSteps(state, cardId).filter(step=>!showcasing||!step.echo);
        const eligibilityIcons=()=>{
          const counts=icons(p(id));
          if(showcasing)for(const [icon,count] of Object.entries(displayIcons(p(id),card)))counts[icon]=(counts[icon]||0)+count;
          return counts;
        };
        let eligibility=dogmaEligibility({...definition,dogma_icon:active.featuredIcon},eligibilityIcons(),icons(p(rival)));
        const planned=event('action:dogma',id,{cardId,age:definition.age,color:definition.color,featuredIcon:active.featuredIcon,
          boardOwner:state.players.find(owner=>tops(owner).includes(cardId))?.id,share:eligibility.share,valueShift:inheritedShift});
        if(mode==='normal'&&karma.trigger(planned))return;
        // Action-level karma occurs before effects. Recount after its changes,
        // then freeze sharing and demand eligibility for the entire activation.
        eligibility=dogmaEligibility({...definition,dogma_icon:active.featuredIcon},eligibilityIcons(),icons(p(rival)));
        if(planned.majority)eligibility.share=planned.majority===rival;
        active.majority=planned.majority;
        let share=mode==='normal'&&eligibility.share;
        if(mode==='normal') {
          const sharing=event('sharing',rival,{cardId,eligible:share,featuredIcon:active.featuredIcon});
          karma.trigger(sharing);share=sharing.eligible;
        }
        const actionShift=planned.valueShift;
        active.actionValueShift=actionShift;
        record(`${p(id).name}${mode === 'normal' ? '发动' : mode === 'self' ? '自执行' : '超执行'}「${definition.name_zh}」的${dogmaTypeLabel(definition)}。${mode === 'normal' ? `主导图标【${data.icon_names[active.featuredIcon]}】：${p(id).name} ${eligibility.own}，${p(rival).name} ${eligibility.rival}。` : ''}`);
        for (const step of steps) {
          const { index } = step, effect = card(step.cardId).effects[index], demand = isDemand(effect);
          const compel=isCompel(effect);
          active.effectKind = step.echo ? 'echo' : compel ? 'compel' : demand ? 'demand' : 'non-demand';
          active.effectCardId = step.cardId; active.effectIndex = index; active.executor = null;
          const affected=mode==='normal'?(compel?share:!share):mode==='super'&&!compel;
          const executors = demand ? (!affected ? [] : active.endorsed ? [rival, rival] : [rival])
            : [...(share ? [rival] : []), id, ...(active.endorsed ? [id] : [])];
          if (demand && !executors.length) record(mode !== 'normal'
            ? `跳过${compel?'强迫':'要求'}：${mode==='self'?'自执行跳过所有要求':'超执行跳过强迫'}。`
            : `跳过${compel?'强迫':'要求'}：${p(rival).name}不受影响（【${data.icon_names[active.featuredIcon]}】或业报判定）。`);
          if (!demand && mode === 'normal' && !share) record(`${p(rival).name}不分享${effect.label}（【${data.icon_names[active.featuredIcon]}】或业报判定）。`);
          for (const [execution, executor] of executors.entries()) {
            active.executor = executor;
            const repeated = executors.indexOf(executor) !== execution;
            record(`${p(executor).name}${!demand && executor === rival ? '分享' : '执行'}${effect.label}${repeated ? '（签署强化 · 第二次）' : ''}。`);
            const before = changes;
            active.valueShift=actionShift;
            const effectEvent=event('effect',executor,{cardId:step.cardId,index,echo:step.echo,valueShift:actionShift,frame:active});
            const prevented=karma.trigger(effectEvent);
            active.valueShift=effectEvent.valueShift;
            if(active.valueShift)record(`本段牌文中方框时代数值增加 ${active.valueShift}；张数与普通数字不变。`);
            const demandEvent=event('demand',id,{cardId:step.cardId,index,target:executor,frame:active});
            if(!prevented&&(!demand||!karma.trigger(demandEvent)))yield* EFFECTS[step.cardId][index](ctx, executor);
            if (!demand && executor === rival && changes > before) shared = true;
            if (changes === before) record(`${p(executor).name}的本段效果未改变卡牌区域或展开状态。`);
          }
        }
        if(mode==='normal') {
          active.effectCardId=cardId;active.effectKind='bonus';active.effectIndex=null;active.executor=id;active.valueShift=0;
          const bonusEvent=event(shared?'share-bonus':'no-share-bonus',id,{cardId,age:drawAge(state,highest(p(id))),featuredIcon:active.featuredIcon});
          const replaced=karma.trigger(bonusEvent);
          if(shared&&!replaced){record('分享产生了实际变化，发动者获得一次免费抽牌行动。');yield* drawAction(id,true,enabled(state,'figures')?'figures':null);}
        }
      } finally { frames.pop(); }
    }
    function* nested(id, cardId, mode) {
      if(isFigure(card(cardId))||isCity(card(cardId))||!card(cardId)?.effects.length)return;
      const parent = frame();
      // Official p.16: only a nested self/super keyword in a self/super
      // non-demand awards a Chain achievement, before the next card executes.
      if (parent && parent.mode !== 'normal' && ['non-demand', 'echo'].includes(parent.effectKind)) {
        record(`${p(id).name}触发连锁成就。`); draw(id, 11, 'achievements');
      }
      yield* runCard(id, cardId, mode);
    }
    function* repeatEffect(e,executor,initiator=e.frame.actor) {
      const repeated={...e.frame,actor:initiator,executor};frames.push(repeated);
      try { yield*EFFECTS[e.cardId][e.index](ctx,executor); } finally { frames.pop(); }
    }
    function* asExecutor(id,work) {
      // Some karmas explicitly instruct another player to perform an operation.
      // Preserve the source/karma suppression while attributing its counters and
      // logs to that player, rather than to the Figure's owner.
      frames.push({...frame(),executor:id});
      try{return yield*work();}finally{frames.pop();}
    }
    function* drawAction(id,free=false,set=null) {
      const previous=actionScope;
      if(free)actionScope={type:'draw',number:null,meldCardId:null};
      try { if(!karma.trigger(event('action:draw',id)))draw(id,highest(p(id)),'hand',false,set);if(free)finishAction(state,ctx,false); }
      finally { actionScope=previous; }
    }
    function* freeDogma(id,cardId,foreseen=false) {
      const previous=actionScope;actionScope={type:'dogma',number:null,meldCardId:null};
      try {yield*runCard(id,cardId,'normal',foreseen);finishAction(state,ctx,false);}finally{actionScope=previous;}
    }
    function* issueDecreeColor(id,color) {
      const decree=[...decrees.values()].find(value=>value.color===color);if(!decree)return;
      const holder=state.players.find(owner=>owner.decrees.includes(decree.id));
      record(`${p(id).name}颁布「${decree.name_zh}」法令。`);
      if(holder&&holder.id!==id){holder.decrees.splice(holder.decrees.indexOf(decree.id),1);state.availableDecrees.push(decree.id);changes++;record('该法令由对手持有，现归还公共区，本次不执行效果。');return;}
      yield*DECREE_EFFECTS[color](ctx,id);
      if(!holder&&!karma.trigger(event('claim',id,{cardId:decree.id,to:'decrees',target:id}))){const index=state.availableDecrees.indexOf(decree.id);if(index>=0){state.availableDecrees.splice(index,1);p(id).decrees.push(decree.id);changes++;record(`${p(id).name}取得「${decree.name_zh}」法令成就。`);}}
    }
    function* decreeAction(id,decreeId) {
      if(!legalDecrees(state,id).includes(decreeId))throw new Error('手牌或置顶伟人不满足颁布该法令的条件。');
      if(karma.trigger(event('action:decree',id,{cardId:decreeId,color:decrees.get(decreeId).color})))return;
      // Qualification and permitted colors were chosen before junking the hand.
      // Homer may replace individual junk operations without cancelling Decree.
      for(const value of [...new Set(handCards(p(id)))])move(value,'junk',id);
      yield*issueDecreeColor(id,decrees.get(decreeId).color);
    }
    function fade() {
      if(!enabled(state,'figures'))return;
      for(const id of [other(actor),actor]) {
        const attempted=new Set();
        while(figureTops(p(id),card).length>1) {
          const candidates=figureTops(p(id),card).filter(value=>!attempted.has(value));if(!candidates.length)break;
          const planned=event('fade',id);if(karma.trigger(planned)||planned.preventFade)break;
          const [value]=drain(pick(id,'淡出：计分一张置顶伟人，直到只剩一张。',candidates));
          attempted.add(value);record(`${p(id).name}选择淡出「${card(value).name_zh}」。`);move(value,'score',id);
        }
      }
    }
    function exchange(a,aTarget,aOwner,b,bTarget,bOwner) {
      const current=frame()?.executor??actor, ids=[...new Set([...a,...b])];
      if(karma.trigger(event('exchange',current,{cardIds:ids})))return [];
      // Exchange is its own keyword; do not fire transfer/meld/score karmas for
      // its physical relocations. When-meld likewise does not apply.
      return [...a.map(id=>[id,aTarget,aOwner]),...b.map(id=>[id,bTarget,bOwner])].filter(([id,to,owner])=>move(id,to,owner,'交换获得','exchange-part')).map(([id])=>id);
    }
    function eligibleWithout(id,value,excluded,alsoClaimed=[]) {
      const owner=p(id),patch=modifiers(owner)?.patches[id],age=card(value).age;
      const count=[...owner.achievements,...alsoClaimed].filter(id=>card(id).age===age).length;
      return age<=highest(owner)+(patch?.achievementAgeAdd||0)&&age*5*(count+1)<=score(owner)-(scoreCards(owner).includes(excluded)?card(excluded).age:0)+(patch?.eligibilityByAge[age]||0);
    }
    function iconCompare(a,b,icon) {
      const majority=[...frames].reverse().find(frame=>frame.majority)?.majority;
      if(a.id!==b.id&&icon!==100){if(majority===a.id)return 1;if(majority===b.id)return -1;}
      const count=owner=>icon===100?bonuses(owner).length:(icons(owner)[icon] ?? COLORS.flatMap(color=>visible(owner,color.id)).filter(mark=>mark.icon===icon).length);
      return Math.sign(count(a)-count(b));
    }
    function iconLeader(icon) {
      const ordered=state.players.slice().sort((a,b)=>iconCompare(b,a,icon));
      return iconCompare(ordered[0],ordered[1],icon)>0?ordered[0].id:null;
    }
    function* subgame(id) {
      let child=prepareSubgame(state);
      record(`${p(id).name}开启火星互联网子对局，原局全部个人区域暂存；剩余牌库不洗牌。`);
      const childAsk=choice=>ask({...choice,subgameState:clone(child),subgame:true});
      const setup=context(child,id,childAsk),starts={};
      try{
        // 子局的起始牌按开局准备处理，不消耗正式第一回合的首次抽牌。
        // A113 未明确扩展替换是否适用；沿用这里的基础起始牌解释。
        for(const owner of child.players)starts[owner.id]=setup.draw(owner.id,9,'hand',false,'base');
        for(const owner of child.players)if(starts[owner.id])setup.move(starts[owner.id],'meld',owner.id);
        const first=child.players.map(owner=>owner.id).sort((a,b)=>(card(starts[a])?.name_en||'').localeCompare(card(starts[b])?.name_en||'','en'))[0];
        child.turn={player:first,number:1,left:1};
        delete child.turnCounts;
      }catch(error){if(!(error instanceof GameEnded))throw error;}
      while(child.phase!=='over'){
        const who=child.turn.player,actions=legalActions(child,who);
        const [encoded]=ask({player:who,prompt:'火星互联网子对局：选择行动。原局将在子对局结束后恢复。',
          kind:'subgame-action',subgame:true,subgameState:clone(child),
          observation:observation(child,who),actions,
          options:actions.map(action=>({value:JSON.stringify(action),label:subgameActionLabel(action,card),cardId:['meld','dogma'].includes(action.type)?action.cardId:null})),min:1,max:1});
        const action=actions.find(action=>JSON.stringify(action)===encoded);
        if(!action)throw new Error('子对局行动无效。');
        const before=child,answers=[];
        while(true){
          const result=resolve(before,action,answers);
          child=result.state;
          if(result.done)break;
          const choice=result.pending;
          answers.push(ask({...choice,subgame:true,subgameState:choice.subgameState||clone(child)}));
        }
      }
      const winner=settleSubgame(state,child);bind(state);changes++;
      record(`火星互联网子对局结束：${winner?p(winner).name+'获胜并带回子对局中拥有的牌':'平局'}，其余子对局个人牌移除。原局继续。`);
    }
    const ctx = { state:stateView, rootActor: actor, other, p:id=>views.get(id), rawPlayers:()=>state.players, card, cards, specials, tops, icons, visible, score, highest, achievements,
      values:()=>baseAges(state), value:n=>n+(frame()?.valueShift||0),
      didDraw:(id,destination,age=null)=>{const result=drawResults.get(id);return !!result?.completed&&result.destination===destination&&(age===null||result.age===age);},
      visibleCardCount:(id,color)=>new Set(visible(p(id),color).map(mark=>mark.id)).size,
      scoreCards:id=>scoreCards(p(id)),turnCount:(id,type)=>state.turnCounts[id][type]||0,
      availableAchievements:id=>availableAchievements(state,id),eligibleWithout,
      shuffle,introduceZero,fade,issueDecreeColor,decreeAction,drawAction,freeDogma,citySearch,meldAction,showcase,subgame,
      repeatEffect,asExecutor,repeatDemand:(e,defender,attacker)=>repeatEffect(e,attacker,defender),
      setAction:(type,cardId)=>{actionScope={type,number:actionNumber(state),meldCardId:type==='meld'?cardId:null};},
      deckOptions:()=>[{key:'base',decks:state.supply},...Object.entries(state.expansionSupply).map(([key,decks])=>({key,decks}))].flatMap(({key,decks})=>Object.entries(decks).filter(([,ids])=>ids.length).map(([age])=>({value:`${key}:${age}`,label:`${key==='base'?'基础版':EXPANSIONS.find(item=>item.id===key).name} · 时代 ${age}`,age:Number(age)}))),
      peekDeck:key=>{const [set,age]=key.split(':');return (set==='base'?state.supply:state.expansionSupply[set])[age].at(-1);},
      drawSpecific:(id,value)=>{const from=location(value);if(from.key!=='supply')return null;if(karma.trigger(event('draw',id,{age:card(value).age,set:from.set,destination:'hand'})))return null;if(!from.array.includes(value))return null;state.turnCounts[id].draw=(state.turnCounts[id].draw||0)+1;return move(value,'hand',id,'抽取');},
      transfer:(id,to,owner,verb='转移获得')=>move(id,to,owner,verb,'transfer'),exchange,
      iconCompare,iconLeader,winMostIcons:(icon,reason)=>{const leader=iconLeader(icon);if(leader)win(leader,reason);},
      iconName: icon => data.icon_names[icon], iconTypes: () => iconTypes(state),
      bonuses, bonusPoints, forecastLimit, safeLimit, controlled, forceChoices, executeSentence,
      coin:()=>{state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng>=2147483648;},
      eligible: (id, value, multiplier = 1) => eligibleCard(state, id, value, multiplier),
      remember: (key, id, value) => memory.set(`${key}:${id}`, value), recall: (key, id) => memory.get(`${key}:${id}`),
      rememberLocal: (key, id, value) => frame().memory.set(`${key}:${id}`, value), recallLocal: (key, id) => frame().memory.get(`${key}:${id}`),
      draw, move, pick, choose, yes, splay, claimSpecial, claimSpecialId, specialMove, win, lose, winUnique, location,
      reveal: revealCards, runCard, selfExecute: (id, cardId) => nested(id, cardId, 'self'),
      superExecute: (id, cardId) => nested(id, cardId, 'super'),
      stopDogma: () => { throw new DogmaComplete(); }, democracy: { you: 0, opponent: 0 },
      changed: () => changes, log: record,
      get actor() { return frame()?.actor ?? actor; },
      dancingGirlVisited:id=>!!frame()?.dancingVisits?.has(id),
      get currentCard() { return frame()?.cardId; },
      // Only the promoted card is foreseen, including when nested execution
      // reaches it again. Echoes belonging to other cards are not foreseen.
      get foreseen() { const active = frame(); return !!active?.foreseenCardId && active.foreseenCardId === (active.effectCardId || active.cardId); },
      get transferred() { return frame()?.transferred ?? 0; }, set transferred(value) { frame().transferred = value; },
      get returned() { return frame()?.returned ?? 0; }, set returned(value) { frame().returned = value; },
    };
    return ctx;
  }

  function finishAction(state, ctx, advance = true) {
    ctx.fade();
    // Official p.16: simultaneous special claims start left of the acting player.
    const order = [other(ctx.actor), ctx.actor];
    for (const id of order) {
      const p = ctx.p(id), counts = icons(p), top = tops(p).map(card), reduction=modifiers(p)?.patches[id].specialReduction||0;
      if ([1, 2, 3, 4, 5, 6].every(icon => counts[icon] >= 3-reduction)) ctx.claimSpecial(id, 'EMPIRE');
      if (top.filter(item => item.effects.some(isDemand)).length >= 4-reduction) ctx.claimSpecial(id, 'MONUMENT');
      if (COLORS.filter(color => ['right', 'up', 'aslant'].includes(p.splay[color.id])).length>=5-reduction) ctx.claimSpecial(id, 'WONDER');
      if (counts[6] >= 12-reduction) ctx.claimSpecial(id, 'WORLD');
      if (top.filter(item => boardAge(item) >= 8-reduction).length>=5-reduction) ctx.claimSpecial(id, 'UNIVERSE');
      if (enabled(state, 'echoes')) {
        if (bonuses(p).length >= 8-reduction) ctx.claimSpecial(id, 'WEALTH', 'ECHOES');
        if (p.forecast.length >= 5-reduction) ctx.claimSpecial(id, 'DESTINY', 'ECHOES');
        if (COLORS.some(color => visible(p, color.id).filter(mark => mark.icon === 0).length >= 8-reduction)) ctx.claimSpecial(id, 'HERITAGE', 'ECHOES');
        if (COLORS.some(color => visible(p, color.id).filter(mark => mark.icon === 10).length >= 4-reduction)) ctx.claimSpecial(id, 'HISTORY', 'ECHOES');
        // "Icon type" includes bonuses, whose printed values share one type.
        if (iconTypes(state).some(icon => COLORS.filter(color => visible(p, color.id).filter(mark => (isBonus(mark.icon) ? 100 : mark.icon) === icon).length >= 3-reduction).length >= 4-reduction)) ctx.claimSpecial(id, 'SUPREMACY', 'ECHOES');
      }
      if(enabled(state,'unseen')){
        if(highest(p)>=5-reduction&&p.safe.length>=4-reduction)ctx.claimSpecial(id,'CONFIDENCE','UNSEEN');
        if(highest(p)>=6-reduction&&!top.some(item=>boardAge(item)%2===1))ctx.claimSpecial(id,'ZEN','UNSEEN');
        if(highest(p)>=7-reduction&&!p.achievements.length)ctx.claimSpecial(id,'ANONYMITY','UNSEEN');
        if(highest(p)>=8-reduction&&!counts[5])ctx.claimSpecial(id,'FOLKLORE','UNSEEN');
        if(highest(p)>=9-reduction&&top.length<5-reduction)ctx.claimSpecial(id,'MYSTERY','UNSEEN');
      }
    }
    const winners = order.filter(id => achievements(ctx.p(id)) >= achievementTarget(state)).sort((a, b) => achievements(ctx.p(b)) - achievements(ctx.p(a)));
    if (winners.length) {
      ctx.win(winners[0],`取得至少 ${achievementTarget(state)} 项成就。`);
    }
    if (advance && --state.turn.left === 0) {
      const next=other(state.turn.player);
      state.turn = { player: next, number: state.turn.number + 1, left: 2, showcaseId:player(state,next).display?.[0] };
    }
  }

  function* execute(state, action, ask) {
    const { type, player: id, cardId } = action;
    const p = player(state, id);
    if (!p || state.phase === 'over') throw new Error('当前不能执行行动。');
    const ctx = context(state, id, ask);
    if (state.phase === 'opening') {
      if (type !== 'opening' || id !== 'you' || !p.hand.includes(cardId)) throw new Error('请选择自己的一张起始手牌。');
      const chosen = { you: cardId, opponent: state.opening.opponent };
      for (const seat of SEATS) ctx.move(chosen[seat.id], 'meld', seat.id);
      const first = ['you', 'opponent'].sort((a, b) => card(chosen[a]).name_en.localeCompare(card(chosen[b]).name_en, 'en'))[0];
      state.opening = {}; state.phase = 'playing'; state.turn = { player: first, number: 1, left: 1 };
      log(state, `${player(state, first).name}的起始牌英文名称按字母顺序在前，先手首回合只有一次行动。`);
      return;
    }
    if (state.turn.player !== id) throw new Error('尚未轮到这名玩家。');
    if(state.turn.showcaseId){
      if(type!=='showcase')throw new Error('请先完成回合开始的文物展览。');
      yield*ctx.showcase(id);return;
    }
    ctx.setAction(type,cardId);
    if (type === 'draw') yield*ctx.drawAction(id);
    else if (type === 'meld') {
      if (!handCards(p).includes(cardId)&&!p.museum.includes(cardId)) throw new Error('只能融合自己的手牌或馆藏文物。');
      const melded=yield* ctx.meldAction(id, cardId);
      const candidates = (p.forecast || []).filter(value => card(value).age <= boardAge(card(cardId)));
      if (melded && enabled(state, 'echoes') && candidates.length) {
        const [promoted] = yield* ctx.pick(id, '必须推进一张不高于此次融合时代的预示牌，并免费发动其条例。', candidates);
        const advanced=ctx.move(promoted, 'meld', id, '推进并融合');
        try { if(advanced&&!isCity(card(promoted))&&!isFigure(card(promoted)))yield* ctx.freeDogma(id, promoted, true); }
        catch (error) { if (!(error instanceof DogmaComplete)) throw error; log(state, '推进的免费条例提前结束。'); }
      }
    } else if (type === 'achieve') {
      const achievement = Number.isInteger(action.secret) ? p.safe[action.secret] : action.cardId || state.standard.find(value => card(value).age === action.age);
      if (!eligible(state, id).includes(achievement)) throw new Error('分数、置顶时代或成就可用性不满足。');
      if(ctx.move(achievement, 'achievements', id)&&enabled(state,'figures'))ctx.draw(other(id),highest(player(state,other(id))),'hand',false,'figures');
    } else if (type === 'dogma') {
      if (!dogmaCards(state,id).includes(cardId)) throw new Error('只能发动自己的置顶牌或业报允许的卡牌。');
      if (!EFFECTS[cardId]) throw new Error('这张牌的条例尚未接入。');
      try { yield* ctx.runCard(id, cardId); }
      catch (error) { if (!(error instanceof DogmaComplete)) throw error; log(state, '当前条例行动提前结束。'); }
    } else if(type==='decree') yield*ctx.decreeAction(id,cardId);
    else throw new Error('未知行动。');
    finishAction(state, ctx);
    state.recentActions = [...(state.recentActions || []), { player: id, type, cardId }].slice(-12);
  }

  function resolve(before, action, answers = []) {
    assertState(before);
    const state = clone(before);
    let index = 0;
    const ask = choice => {
      if (index === answers.length) throw new ChoicePending(choice);
      return answers[index++];
    };
    const iterator = execute(state, action, ask);
    try {
      const next = iterator.next();
      if (!next.done) throw new Error('效果程序绕过了统一选牌入口。');
      if (index !== answers.length) throw new Error('存档包含多余的选择。');
      assertState(state);
      return { state, pending: null, done: true };
    } catch (error) {
      if (error instanceof ChoicePending) { assertState(state); return { state, pending: error.choice, done: false }; }
      if (!(error instanceof GameEnded)) throw error;
      assertState(state); return { state, pending: null, done: true };
    }
  }

  function legalActions(state, id) {
    const p = player(state, id);
    if (state.phase !== 'playing' || state.turn.player !== id) return [];
    if(state.turn.showcaseId)return [{type:'showcase',player:id,cardId:state.turn.showcaseId}];
    return [{ type: 'draw', player: id }, ...[...handCards(p),...(p.museum||[])].map(cardId => ({ type: 'meld', player: id, cardId })),
      ...dogmaCards(state,id).map(cardId => ({ type: 'dogma', player: id, cardId })),
      ...eligible(state, id).map(cardId => ({ type: 'achieve', player: id, age: card(cardId).age, ...((p.safe||[]).includes(cardId)?{secret:p.safe.indexOf(cardId)}:{cardId}) })),
      ...legalDecrees(state,id).map(cardId=>({type:'decree',player:id,cardId}))];
  }

  // AI gets own private cards, public boards and backs/counts only. Never give
  // it supply order, standard achievement identities, or the human hand faces.
  function observation(state, id) {
    const own = player(state, id);
    return { turn: { ...state.turn }, recentActions: (state.recentActions || []).filter(action => action.player === id).map(action => ({ type: action.type, cardId: action.cardId })), supply: Object.fromEntries(baseAges(state).map(age => [age, state.supply[age].length])),
      expansions: [...(state.expansions || [])], achievementTarget: achievementTarget(state), bonusPoints: bonusPoints(own),
      cities: cityContributions(own), endorseable: dogmaCards(state,id).filter(cardId => endorseOptions(state,id,cardId).length),
      me: { id, hand: [...handCards(own)], score: [...scoreCards(own)], safe:secretBacks(own,card), safeLimit:safeLimit(own), display:[...(own.display||[])],museum:[...(own.museum||[])],decrees:[...(own.decrees||[])],forecast: [...(own.forecast || [])], piles: clone(own.piles), splay: { ...own.splay }, achievementCount: achievements(own) }, rival: (() => {
        const p = player(state, other(id));
        return { id: p.id, piles: clone(p.piles),safe:secretBacks(p,card),safeLimit:safeLimit(p),display:[...(p.display||[])],museum:[...(p.museum||[])], splay: { ...p.splay }, handAges: handCards(p).map(value => card(value).age),
          handSets: handCards(p).map(value => cardSet(card(value))), forecastSets: (p.forecast || []).map(value => cardSet(card(value))), scoreSets: scoreCards(p).map(value => cardSet(card(value))),
          forecastAges: (p.forecast || []).map(value => card(value).age), bonusPoints: bonusPoints(p), score: score(p), scoreCount: scoreCards(p).length, scoreAges: scoreCards(p).map(value => card(value).age), achievements: achievements(p), icons: icons(p) };
      })(), icons: icons(player(state, id)), topAge: highest(player(state, id)), score: score(player(state, id)) };
  }
  return { cards, specials, decrees, museums, card, valueCard, player, tops, score, highest, icons, visible, achievements, eligible, drawAge,
    handCards,scoreCards,availableAchievements,dogmaCards,legalDecrees,cityContributions,endorseOptions,
    bonuses, bonusPoints, forecastLimit, safeLimit, eligibleCard, achievementTarget, activeSpecials, effectSteps,
    createGame, assertState, resolve, legalActions, observation };
}
