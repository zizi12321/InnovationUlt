import { choosePrintedValue } from './effect-helpers.js';
import {
  hand, tops, pile, score, has, high, low,
  colorCount, pickMove, all, optionalAll, chooseValue, splay, junkDeck,
  junkAchievement, rankPick, exchange, highest, lowest, withIcon, board,
  pickMoveDirect
} from './effect-helpers.js';

// 黄色基础牌；按卡牌编号排列，保留各效果段落的原有顺序。
export const BASE_YELLOW_EFFECTS = {
  B004: [function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, hand(c, p), 'return', '可以归还一张手牌，抽取高一时代的牌计分。', 0);
    if (ids.length) c.draw(p, c.card(ids[0]).age + 1, 'score');
  }],
  B005: [function* (c, p) {
    yield* pickMoveDirect(c, p, lowest(c, hand(c, p)), 'meld', '融合一张最低时代的手牌。'); c.draw(p, c.value(1));
  }],
  B006: [function* (c, p) {
    const ids = withIcon(c, hand(c, p), 4);
    yield* pickMoveDirect(c, p, ids, 'meld', '可以融合任意数量带有权威的手牌；按点击顺序融合。', 0, ids.length);
  }, function* (c, p) { if (c.p(p).piles.RED.length === 3) c.claimSpecial(p, 'MONUMENT'); }],
  B018: [function* (c, p) {
    const answer = yield* c.choose(p, '可以交换手牌与计分区中各自所有最高牌，或移除时代 3 牌库。', [
      { value: 'exchange', label: '交换最高牌' }, { value: 'junk', label: '移除时代 3 牌库' }, { value: 'skip', label: '跳过' }]);
    if (answer[0] === 'junk') junkDeck(c,p,c.value(3));
    if (answer[0] === 'exchange') {
      const fromHand = highest(c, hand(c, p)), fromScore = highest(c, c.p(p).score);
      exchange(c,fromHand,'score',p,fromScore,'hand',p);
    }
  }],
  B019: [function* (c, p) {
    const count = Object.keys(c.p(p).piles).filter(color => c.visible(c.p(p), color).some(mark => mark.icon === 2)).length;
    for (let i = 0; i < count; i++) c.draw(p, c.value(2));
  }, function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, hand(c, p).filter(id => c.card(id).color === 'GREEN'), 'tuck', '可以垫底一张绿色手牌；否则移除时代 2 牌库及面板置顶的发酵。', 0);
    if (ids.length) return;
    junkDeck(c,p,c.value(2));
    for (const owner of c.state.players) if (board(c, owner.id).includes('B019')) c.move('B019', 'junk', p);
  }],
  B028: [function* (c, p) {
    exchange(c, [...hand(c, p)], 'hand', c.actor, high(c, hand(c, c.actor)), 'hand', p);
  }, function* (c, p) {
    const candidates = hand(c, p).filter(id => has(c, id, 4));
    if (!candidates.length) c.reveal(p, hand(c, p));
    const ids = yield* c.pick(p, '选择一张带有权威的手牌展示并计分。', candidates);
    c.reveal(p, ids); if (ids.length) c.move(ids[0], 'score', p);
  }, function* (c, p) { yield* splay(c, p, ['RED'], 'left'); }],
  B029: [function* (c, p) {
    // Each owner chooses ties among their own hidden score cards (BGA Card32).
    const a = yield* c.pick(p, '选择自己最高时代的计分牌参与交换。', high(c, score(c, p)));
    const b = yield* c.pick(c.actor, '选择自己最低时代的计分牌参与交换。', low(c, score(c, c.actor)));
    exchange(c, a, 'score', c.actor, b, 'score', p);
  }, function* (c, p) { yield* junkAchievement(c, p, [3, 4]); }],
  B038: [function* (c, p) {
    const ids = yield* pickMove(c, p, score(c, p), 'return', '归还一张计分牌。'); if (!ids.length) return;
    const returned = yield* pickMove(c, p, tops(c, p).filter(id => c.card(id).age === c.card(ids[0]).age), 'return', '归还一张与刚才相同时代的置顶牌。');
    if (returned.length) junkDeck(c, p, c.value(4));
  }],
  B039: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'return', '可以归还一张手牌，然后按带概念的颜色数将手牌计分。', 0);
    if (ids.length) { const n = colorCount(c, p, 3); yield* pickMove(c, p, hand(c, p), 'score', `将 ${n} 张手牌计分，不足时尽量执行。`, n, n); }
  }],
  B048: [function* (c, p) {
    const age = yield* chooseValue(c, c.actor, undefined, '发动者选择时代：对手将该时代全部计分牌转移到手中。');
    yield* all(c, p, ()=>score(c, p).filter(id => c.card(id).age === age), 'hand', p, '从计分区取回', 'transfer');
  }, function* (c, p) { yield* splay(c, p, ['YELLOW'], 'right'); }],
  B049: [function* (c, p) {
    c.draw(p, c.value(4), 'tuck'); c.draw(p, c.value(4), 'tuck');
    const id = pile(c, p, 'YELLOW')[0]; if (id) c.move(id, 'score', p); if (id === 'B049') junkDeck(c, p, c.value(6));
  }],
  B058: [function* (c, p) {
    if (yield* c.yes(p, '是否抽取并垫底一张时代 6 的牌，然后计分每个颜色不带工业的置顶牌？')) {
      c.draw(p, c.value(6), 'tuck'); yield* all(c, p, tops(c, p).filter(id => !has(c, id, 5)), 'score');
    }
  }, function* (c, p) { yield* splay(c, p, ['YELLOW'], 'right'); }],
  B059: [function* (c, p) {
    const [chosen] = yield* c.pick(p, '选择一张计分牌，归还该时代的全部计分牌。', score(c, p)); if (!chosen) return;
    const ids = yield* all(c, p, ()=>score(c, p).filter(id => c.card(id).age === c.card(chosen).age), 'return');
    c.returned += ids.length; if (ids.length) c.draw(p, c.value(6), 'meld');
  }, function* (c, p) { if (c.returned) c.draw(p, c.value(7), 'meld'); }],
  B068: [function* (c, p) {
    const n = Math.max(0, hand(c, p).length - 1);
    yield* pickMove(c, p, hand(c, p), 'return', '归还手牌直到只剩一张；按选择顺序归还。', n, n);
  }, function* (c, p) { yield* pickMove(c, p, hand(c, p), 'score', '可以计分一张手牌。', 0); }],
  B069: [function* (c, p) {
    // Owner chooses the lowest card on the launcher side, then the victim
    // chooses highest ties from the original hand, before either half moves.
    const b = yield* c.pick(c.actor, '选择自己最低时代的一张手牌参与交换。', low(c, hand(c, c.actor)));
    const a = yield* rankPick(c, p, hand(c, p), 2, true, '选择最高的两张手牌参与交换。');
    exchange(c, a, 'hand', c.actor, b, 'hand', p);
  }, function* (c, p) { junkDeck(c, p, yield* choosePrintedValue(c, p, [7, 8], '选择移除时代 7 或 8 的整个牌库。')); }],
  B078: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'return', '可以归还最多三张手牌；每个不同的时代抽两张时代 8。', 0, 3);
    for (const age of new Set(ids.map(id => c.card(id).age))) { c.draw(p, c.value(8)); c.draw(p, c.value(8)); }
  }],
  B079: [function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p).filter(id => c.card(id).color !== 'YELLOW' && has(c, id, 6)), 'meld', '转移带有效率的非黄色置顶牌给发动者。', 1, 1, c.actor, '收到转移的', 'transfer');
    if (!ids.length) return; const color = c.card(ids[0]).color, newTop = pile(c, p, color).at(-1);
    if (newTop) c.move(newTop, 'score', p); yield* all(c, p, ()=>pile(c, p, color), 'return');
    if (c.state.players.some(owner => c.tops(owner).includes('B079'))) c.transfer('B079', 'hand', c.actor, '转移到手中的');
  }],
  B088: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'return', '可以归还一张手牌，然后计分一张手牌并抽两张时代 10。', 0);
    if (ids.length) { yield* pickMove(c, p, hand(c, p), 'score', '计分一张手牌。'); c.draw(p, c.value(10)); c.draw(p, c.value(10)); }
  }, function* (c, p) { if (yield* c.yes(p, '是否移除时代 10 的整个牌库？')) junkDeck(c, p, c.value(10)); }],
  B089: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'tuck', '可以垫底任意张手牌，每张抽取一张时代 1 的牌计分。', 0, hand(c, p).length);
    for (const id of ids) c.draw(p, c.value(1), 'score');
  }, function* (c, p) { if (yield* c.yes(p, '是否移除时代 9 的整个牌库？')) junkDeck(c, p, c.value(9)); }],
  B098: [function* (c, p) {
    yield* pickMove(c, p, tops(c, p).filter(id => has(c, id, 2)), 'return', '归还一张带有健康的置顶牌。');
  }, function* (c, p) {
    c.draw(p, c.value(11), 'meld');
    if (c.state.players.every(owner => c.icons(owner)[2] <= c.icons(owner)[5])) c.winUnique(c.score, 'highest', '全球化：无人健康多于工业，分数唯一最高。');
  }],
  B099: [function* (c, p) { yield* optionalAll(c, p, ()=>hand(c, p), 'score', '是否将全部手牌计分？'); }, function* (c, p) { c.draw(p, c.value(11)); }],
  B108: [function* (c, p) {
    const age = yield* chooseValue(c, c.actor, undefined, '发动者选择时代，获得对手该时代全部计分牌。');
    yield* all(c, p, ()=>score(c, p).filter(id => c.card(id).age === age), 'score', c.actor, '收到转移到计分区的', 'transfer');
  }, function* (c, p) {
    const [id] = yield* c.pick(p, '展示并自执行最高时代的一张计分牌。', high(c, score(c, p)));
    if (id) { c.reveal(p, [id]); yield* c.selfExecute(p, id); }
  }],
  B109: [function* (c, p) {
    let color = 'RED';
    while (true) {
      const ids = yield* all(c, p, pile(c, p, color).slice(0, 3), 'return');
      const age = Math.ceil(ids.reduce((n, id) => n + c.card(id).age, 0) / 2);
      const id = c.draw(p, age, 'meld');
      if (ids.length !== 3) break; color = c.card(id).color;
    }
  }],
};
