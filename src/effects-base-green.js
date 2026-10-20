import {
  colors, hand, tops, pile, score, has, maxAge,
  pickMove, all, chooseValue, splay, exchange, pickMoveDirect
} from './effect-helpers.js';

// 绿色基础牌；按卡牌编号排列，保留各效果段落的原有顺序。
export const BASE_GREEN_EFFECTS = {
  B007: [function* (c, p) {
    const candidates = hand(c, p).filter(id => !c.p(p).piles[c.card(id).color].length);
    // Official p.14 verification: reveal hidden cards when they prove that a
    // mandatory instruction cannot be performed, even though the engine knows.
    if (!candidates.length) c.reveal(p, hand(c, p));
    yield* pickMoveDirect(c, p, candidates, 'meld', '融合一张你面板上尚无该颜色的手牌。');
  }, function* (c, p) {
    const count = Object.keys(c.p(p).piles).filter(color => c.p(p).piles[color].length && !c.p(c.other(p)).piles[color].length).length;
    for (let i = 0; i < count; i++) c.draw(p, c.value(1), 'score');
  }],
  B008: [function* (c, p) { c.draw(p, c.value(1), 'meld'); }],
  B009: [function* (c, p) { c.draw(p, c.value(1)); c.draw(p, c.value(1)); }],
  B020: [function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, hand(c, p), 'return', '可以归还任意张手牌，每种不同的归还时代各抽一张时代 2 的牌计分。', 0, hand(c, p).length);
    for (const age of new Set(ids.map(id => c.card(id).age))) c.draw(p, c.value(2), 'score');
  }],
  B021: [function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, c.p(p).score.filter(id => c.card(id).age === c.value(1)), 'score', '转移一张时代 1 的计分牌到发动者计分区。', 1, 1, c.actor, 'transfer');
    c.transferred += ids.length;
  }, function* (c, p) { if (c.transferred) c.draw(p, c.value(1), 'score'); }],
  B030: [function* (c, p) {
    yield* pickMove(c, p, tops(c, p).filter(id => c.card(id).color !== 'GREEN' && has(c, id, 2)), 'meld', '转移一张带健康的非绿色置顶牌给发动者。', 1, 1, c.actor, '收到转移的', 'transfer');
    yield* pickMove(c, p, tops(c, c.actor).filter(id => !has(c, id, 2)), 'meld', '融合发动者面板上一张不带健康的置顶牌。');
  }],
  B031: [function* (c, p) { yield* splay(c, p, ['GREEN', 'BLUE'], 'left'); }, function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p).filter(id => has(c, id, 2)), 'score', '计分一张带有健康的置顶牌。');
    if (ids.length) for (let i = 0, n = colors.filter(color => c.p(p).splay[color] === 'left').length; i < n; i++) c.draw(p, c.value(4));
  }],
  B040: [function* (c, p) {
    if (yield* splay(c, p, colors.filter(color => c.p(p).splay[color] === 'left'), 'right')) c.draw(p, c.value(4), 'score');
  }, function* (c, p) { if (colors.every(color => c.p(p).splay[color] !== 'none')) c.claimSpecial(p, 'WONDER'); }],
  B041: [function* (c, p) {
    yield* pickMove(c, p, score(c, p).filter(id => [c.value(2), c.value(3)].includes(c.card(id).age)), 'score', '转移一张时代 2 或 3 的计分牌给发动者。', 1, 1, c.actor, '收到转移到计分区的', 'transfer');
  }],
  B050: [function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p).filter(id => c.card(id).color !== 'GREEN' && has(c, id, 5)), 'meld', '转移一张带工业的非绿色置顶牌给发动者。', 1, 1, c.actor, '收到转移的', 'transfer');
    if (ids.length) c.draw(p, c.value(5), 'score');
  }, function* (c, p) { yield* splay(c, p, ['GREEN'], 'right'); }],
  B051: [function* (c, p) {
    const ids = yield* c.pick(p, '可以展示并归还一张手牌。', hand(c, p), 0);
    if (!ids.length) return; const id = ids[0], color = c.card(id).color; c.reveal(p, [id]); c.move(id, 'return', p);
    c.splay(p, color, 'right'); c.draw(p, pile(c, p, color).length);
  }],
  B060: [function* (c, p) {
    const [chosen] = yield* c.pick(p, '展示一张手牌，收集对手该颜色的手牌并融合。', hand(c, p)); if (!chosen) return;
    c.reveal(p, [chosen]); const color = c.card(chosen).color, rival = c.other(p);
    yield* all(c, p, ()=>hand(c, rival).filter(id => c.card(id).color === color), 'hand', p, '获得对手转移的', 'transfer'); c.reveal(rival, hand(c, rival));
    yield* all(c, p, ()=>hand(c, p).filter(id => c.card(id).color === color), 'meld'); c.reveal(p, hand(c, p));
  }],
  B061: [function* (c, p) { if (c.p(p).splay.GREEN === 'right') yield* splay(c, p, colors, 'right'); }, function* (c, p) { yield* splay(c, p, ['GREEN'], 'right'); }],
  B070: [function* (c, p) {
    if (yield* c.yes(p, '是否交换全部手牌和全部计分牌？')) exchange(c, [...hand(c, p)], 'score', p, [...score(c, p)], 'hand', p);
  }],
  B071: [function* (c, p) {
    const ids = yield* all(c, p, tops(c, p).filter(id => !has(c, id, 5)), 'return');
    for (const id of ids) c.draw(p, c.value(8));
  }],
  B080: [function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p).filter(id => c.card(id).color !== 'GREEN' && has(c, id, 5)), 'score', '转移带工业的非绿色置顶牌到发动者计分区。', 1, 1, c.actor, '收到转移到计分区的', 'transfer');
    if (ids.length) c.draw(p, c.value(8), 'meld');
  }, function* (c, p) { c.draw(p, c.value(8), 'meld'); }],
  B081: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'return', '可以归还一张手牌，然后选择时代归还双方该时代所有计分牌。', 0);
    if (!ids.length) return; const age = yield* chooseValue(c, p);
    yield* all(c, p, ()=>c.state.players.flatMap(owner => owner.score).filter(id => c.card(id).age === age), 'return');
  }, function* (c, p) { yield* splay(c, p, ['PURPLE'], 'up'); }],
  B090: [function* (c, p) {
    const ids = [c.draw(p, c.value(9), 'hand', true), c.draw(p, c.value(9), 'hand', true)];
    const [chosen] = yield* c.pick(c.actor, '发动者选择一张刚展示的牌，转移到自己的面板。', ids);
    c.transfer(chosen, 'meld', c.actor, '收到转移的'); c.move(ids.find(id => id !== chosen), 'meld', p);
  }, function* (c, p) { if (pile(c, p, 'GREEN').length >= 10) c.win(p, '协作：面板上至少十张绿色牌。'); }],
  B091: [function* (c, p) { yield* all(c, p, ()=>hand(c, p), 'return'); yield* splay(c, p, ['PURPLE'], 'up'); }, function* (c, p) {
    for (let i = 0; i < 3; i++) c.draw(p, c.value(8));
  }, function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'meld', '融合一张手牌，并自执行该牌。'); if (ids.length) yield* c.selfExecute(p, ids[0]);
  }],
  B100: [function* (c, p) {
    const n = maxAge(c, c.p(p).achievements);
    yield* pickMove(c, p, score(c, p), 'return', `归还 ${n} 张计分牌（最高成就的时代），不足时尽量执行。`, n, n);
  }],
  B101: [function* (c, p) {
    // Zero is at least twice zero (also confirmed by BGA Card100_4E).
    if (c.achievements(c.p(p)) >= 2 * c.achievements(c.p(c.other(p)))) c.win(p, '自助服务：成就数至少是对手的两倍。');
  }, function* (c, p) {
    const [id] = yield* c.pick(p, '自执行一张非自助服务的置顶牌。', tops(c, p).filter(id => id !== 'B101'));
    if (id) yield* c.selfExecute(p, id);
  }],
  B110: [function* (c, p) {
    const original = tops(c, p), candidates = original.filter(id => original.some(other => other !== id && c.card(other).age === c.card(id).age));
    // The pair is an exact prerequisite, not a partial "return two" action.
    const [first] = yield* c.pick(p, '选择两张同一时代、不同颜色的置顶牌：先选第一张。', candidates);
    if (!first) return; const age = c.card(first).age;
    const [second] = yield* c.pick(p, '选择同一时代的第二张置顶牌。', original.filter(id => id !== first && c.card(id).age === age));
    c.move(first, 'return', p); c.move(second, 'return', p);
    yield* all(c, p, ()=>[...hand(c, p), ...score(c, p)].filter(id => c.card(id).age <= age), 'return');
  }],
  B111: [function* (c, p) {
    while (true) {
      const id = c.draw(p, c.value(11), 'tuck'), color = c.card(id).color;
      if (c.card(pile(c, p, color)[1])?.age === c.value(11)) c.lose(p, '太空交通：时代 11 的牌垫在另一张时代 11 下方');
      yield* all(c, p, ()=>pile(c, p, color).slice(0, -5), 'score'); c.splay(p, color, 'aslant');
      if (c.score(c.p(p)) >= c.score(c.p(c.other(p)))) break;
    }
  }],
};
