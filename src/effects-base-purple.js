import {
  colors, hand, tops, pile, score, has, high,
  maxAge, topAge, pickMove, all, chooseValue, splay, junkAchievement,
  exchange, withIcon, board, pickMoveDirect, splayLeft
} from './effect-helpers.js';

// 紫色基础牌；按卡牌编号排列，保留各效果段落的原有顺序。
export const BASE_PURPLE_EFFECTS = {
  B013: [function* (c, p) {
    // BGA text omits "at least"; official B013 says >=4, not exactly four.
    if (c.icons(c.p(p))[4] < 4) return;
    const ids = yield* pickMoveDirect(c, p, withIcon(c, board(c, p), 4), 'meld', '转移一张带有权威的置顶牌到发动者面板。', 1, 1, c.actor, 'transfer');
    if (ids.length) c.draw(p, c.value(1));
  }],
  B014: [function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, hand(c, p).filter(id => c.p(p).piles[c.card(id).color].length), 'tuck', '可以将一张面板已有颜色的手牌垫底。', 0);
    if (ids.length) yield* splayLeft(c, p, [c.card(ids[0]).color]);
  }],
  B015: [function* (c, p) {
    const id = c.draw(p, c.value(1), 'hand', true);
    if (c.p(p).piles[c.card(id).color].length) { c.move(id, 'meld', p); c.draw(p, c.value(1)); }
  }],
  B024: [function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, board(c, p).filter(id => !c.p(c.actor).piles[c.card(id).color].length), 'score', '转移一张发动者尚无该颜色的置顶牌到其计分区。', 1, 1, c.actor, 'transfer');
    if (ids.length) c.draw(p, c.value(1), 'tuck');
  }, function* (c, p) { c.draw(p, c.value(1), 'tuck'); }],
  B025: [function* (c, p) { yield* splayLeft(c, p, Object.keys(c.p(p).piles)); }, function* (c, p) {
    yield* pickMoveDirect(c, p, hand(c, p), 'score', '可以将一张手牌计分。', 0);
  }],
  B034: [function* (c, p) {
    const ids = yield* pickMove(c, p, high(c, score(c, p)), 'return', '可以归还最高的一张计分牌。', 0);
    if (ids.length) c.draw(p, maxAge(c, score(c, p)) + 2);
  }],
  B035: [function* (c, p) {
    const candidates = hand(c, p).filter(id => has(c, id, 4));
    if (!candidates.length) c.reveal(p, hand(c, p));
    const ids = yield* c.pick(p, '展示并转移一张带有权威的手牌给发动者。', candidates);
    c.reveal(p, ids);
    if (ids.length && c.transfer(ids[0], 'hand', c.actor)) { for (const id of [...c.state.availableSpecials]) c.specialMove(id, true); }
  }, function* (c, p) { if (yield* splay(c, p, ['YELLOW', 'PURPLE'], 'left')) c.draw(p, c.value(3)); }],
  B044: [function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p).filter(id => c.card(id).color !== 'PURPLE' && has(c, id, 1)), 'meld', '转移一张带繁荣的非紫色置顶牌给发动者。', 1, 1, c.actor, '收到转移的', 'transfer');
    if (ids.length) c.draw(p, c.value(4), 'meld');
  }, function* (c, p) { yield* splay(c, p, ['GREEN'], 'right'); }],
  B045: [function* (c, p) { yield* splay(c, p, ['YELLOW', 'PURPLE'], 'right'); }, function* (c, p) {
    const n = colors.filter(color => c.p(p).splay[color] !== 'none').length;
    yield* pickMove(c, p, hand(c, p), 'tuck', `可以垫底最多 ${n} 张手牌。`, 0, n);
  }],
  B054: [function* (c, p) {
    while (true) { const id = c.draw(p, c.value(6), 'hand', true); if (!['GREEN', 'BLUE'].includes(c.card(id).color)) break; c.move(id, 'meld', p); }
  }, function* (c, p) {
    // Empty set also satisfies "all non-purple top cards" (Card53).
    if (tops(c, p).every(id => c.card(id).color === 'PURPLE' || c.card(id).age >= 6)) c.claimSpecial(p, 'UNIVERSE');
  }],
  B055: [function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p).filter(id => has(c, id, 3) && c.card(id).age > topAge(c, c.actor, c.card(id).color)), 'meld', '转移一张带概念、且比发动者同色置顶牌时代更高的置顶牌。', 1, 1, c.actor, '收到转移的', 'transfer');
    if (ids.length) c.draw(p, c.value(5));
  }],
  B064: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'return', '可以归还任意数量手牌；累计比较本次行动中双方因民主归还的张数。', 0, hand(c, p).length);
    c.democracy[p] += ids.length; if (c.democracy[p] > c.democracy[c.other(p)]) c.draw(p, c.value(8), 'score');
  }],
  B065: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'score', '转移一张手牌到发动者计分区。', 1, 1, c.actor, '收到转移到计分区的', 'transfer'); if (ids.length) c.draw(p, c.value(6));
  }, function* (c, p) { yield* splay(c, p, ['RED', 'PURPLE'], 'right'); }],
  B074: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'tuck', '可以垫底最多三张手牌；每个不同的时代抽一张时代 7 的牌计分。', 0, 3);
    for (const age of new Set(ids.map(id => c.card(id).age))) c.draw(p, c.value(7), 'score');
  }],
  B075: [function* (c, p) { yield* all(c, p, ()=>hand(c, p), 'return'); }, function* (c, p) { for (let i = 0; i < 3; i++) c.draw(p, c.value(6)); }, function* (c, p) {
    yield* splay(c, p, colors.filter(color => c.p(p).splay[color] === 'right'), 'up');
  }],
  B084: [function* (c, p) {
    const selected = yield* c.choose(p, '选择两种颜色，再抽取并展示时代 9。', colors.map(value => ({ value, label: ({ RED:'红色', YELLOW:'黄色', GREEN:'绿色', BLUE:'蓝色', PURPLE:'紫色' })[value] })), 2, 2);
    const id = c.draw(p, c.value(9), 'hand', true), color = c.card(id).color;
    if (selected.includes(color)) { c.move(id, 'meld', p); c.splay(p, color, 'up'); } else c.splay(p, color, 'none');
  }, function* (c, p) { if (c.icons(c.p(p))[3] >= 20) c.win(p, '经验主义：至少二十个概念图标。'); }],
  B085: [function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p), 'tuck', '可以将一张置顶牌移至其同色牌堆底部，然后垫底全部手牌。', 0);
    if (ids.length) yield* all(c, p, ()=>hand(c, p), 'tuck');
  }, function* (c, p) { yield* junkAchievement(c, p, [8, 9, 10], true); }],
  B094: [function* (c, p) {
    const age = yield* chooseValue(c, c.actor, undefined, '发动者选择时代：将对手该时代全部计分牌转移到自己手中。');
    const ids = yield* all(c, p, ()=>score(c, p).filter(id => c.card(id).age === age), 'hand', c.actor, '', 'transfer');
    if (ids.length) yield* pickMove(c, p, tops(c, c.actor).filter(id => !has(c, id, 2)), 'hand', '从发动者面板取回一张不带健康的置顶牌。', 1, 1, p, '', 'transfer');
  }],
  B095: [function* (c, p) {
    const [id] = yield* c.pick(p, '展示一张手牌，取得对手该颜色的置顶牌。', hand(c, p)); if (!id) return;
    c.reveal(p, [id]); const target = pile(c, c.other(p), c.card(id).color).at(-1); if (target) c.transfer(target, 'hand', p);
  }, function* (c, p) { yield* splay(c, p, ['YELLOW', 'BLUE'], 'up'); }],
  B104: [function* (c, p) { c.draw(p, c.value(10), 'score'); }, function* (c, p) {
    const ids = c.state.players.flatMap(owner => c.tops(owner));
    if (ids.includes('B097') && ids.includes('B103')) c.winUnique(c.score, 'lowest', '人工智能：机器人学和软件均置顶，分数唯一最低。');
  }],
  B105: [function* (c, p) { yield* splay(c, p, ['GREEN'], 'up'); }, function* (c, p) { c.draw(p, c.value(10), 'score'); }, function* (c, p) { c.draw(p, c.value(10), 'meld'); c.draw(p, c.value(10), 'meld'); }],
  B114: [function* (c, p) {
    const [id] = yield* c.pick(p, '展示并移除一张手牌，然后自执行它。', hand(c, p));
    // With no chosen card the remaining linked instructions are skipped;
    // confirmed by BGA Card448, whose second interaction only starts on choice.
    if (!id) return; const age = c.card(id).age;
    c.reveal(p, [id]); c.move(id, 'junk', p);
    yield* all(c, p, ()=>hand(c, p).filter(value => c.card(value).age === age), 'return');
    for (let i = 0; i < 3; i++) c.draw(p, age); yield* c.selfExecute(p, id);
  }],
  B115: [function* (c, p) {
    const ids = yield* all(c, p, tops(c, p).filter(id => c.card(id).effects.some(effect => effect.kind === 'i_demand_effect')), 'meld', c.actor, '收到转移的', 'transfer');
    if (ids.length) exchange(c, [...score(c, p)], 'score', c.actor, [...score(c, c.actor)], 'score', p);
  }],
};
