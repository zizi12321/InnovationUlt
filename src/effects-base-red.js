import {
  colors, hand, tops, pile, score, has, high,
  low, maxAge, colorCount, pickMove, all, chooseColor, chooseValue,
  splay, junkDeck, rankPick, highest, withIcon, board, pickMoveDirect
} from './effect-helpers.js';

// 红色基础牌；按卡牌编号排列，保留各效果段落的原有顺序。
export const BASE_RED_EFFECTS = {
  B001: [function* (c, p) {
    // Archery chooses from the hand AFTER drawing. It must not transfer the
    // newly drawn 1 when an existing 2 is still the unique highest card.
    c.draw(p, c.value(1));
    yield* pickMoveDirect(c, p, highest(c, hand(c, p)), 'hand', '选择最高时代的一张手牌交给发动者。', 1, 1, c.actor, 'transfer');
  }, function* (c, p) {
    const chosen = yield* c.pick(p, '移除一个时代 1 或 2 的可用成就。', c.state.standard.filter(id => c.card(id).age <= 2), 1, 1, true);
    if (chosen.length) c.move(chosen[0], 'junk', p);
  }],
  B002: [function* (c, p) {
    while (true) {
      const id = c.draw(p, c.value(1), 'hand', true);
      if (!c.card(id).spots.includes(4)) break;
      c.move(id, 'score', p);
    }
  }],
  B003: [function* (c, p) {
    while (true) {
      const candidates = withIcon(c, hand(c, p), 1);
      if (!candidates.length) { c.reveal(p, hand(c, p)); break; }
      const chosen = yield* c.pick(p, '选择一张带有繁荣的手牌转移到发动者的计分区。', candidates);
      if(!c.transfer(chosen[0], 'score', c.actor, '收到转移到计分区的'))break;
      c.transferred++;
      c.draw(p, c.value(1));
    }
  }, function* (c, p) { if (!c.transferred) c.draw(p, c.value(1)); }],
  B016: [function* (c, p) {
    yield* pickMoveDirect(c, p, hand(c, p), 'hand', '转移两张手牌给发动者；不足时尽量转移。', 2, 2, c.actor, 'transfer'); c.draw(p, c.value(2));
  }, function* (c, p) { if (board(c, p).length === 5 && board(c, c.other(p)).length !== 5) c.claimSpecial(p, 'EMPIRE'); }],
  B017: [function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, hand(c, p), 'meld', '融合一张或两张手牌；按点击顺序融合。', 1, 2);
    const red = c.p(p).piles.RED.at(-1), rival = c.other(p);
    if (ids.length !== 2 || !red || !(yield* c.yes(p, '是否把你的红色置顶牌交给对手，然后融合对手的绿色置顶牌？'))) return;
    if(!c.transfer(red, 'meld', rival, '收到转移的'))return;
    const green = c.p(rival).piles.GREEN.at(-1);
    if (green) c.move(green, 'meld', p);
  }],
  B026: [function* (c, p) {
    yield* all(c, p, tops(c, p).filter(id => has(c, id, 4)), 'score', c.actor, '收到转移到计分区的', 'transfer');
  }, function* (c, p) { yield* splay(c, p, ['RED'], 'left'); }],
  B027: [function* (c, p) {
    const id = c.draw(p, c.value(3), 'meld');
    if (has(c, id, 1)) c.draw(p, c.value(4), 'score');
    else if (c.score(c.p(c.other(p))) < c.score(c.p(p))) yield* pickMove(c, p, score(c, p), 'score', '转移一张计分牌给分数较低的对手。', 1, 1, c.other(p), '收到转移到计分区的', 'transfer');
  }],
  B036: [function* (c, p) {
    while (true) { const id = c.draw(p, c.value(3), 'tuck'); if (c.card(id).color === 'GREEN') junkDeck(c, p, c.value(5)); if (!has(c, id, 1)) break; }
  }],
  B037: [function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p).filter(id => has(c, id, 4)), 'score', '转移一张带有权威的置顶牌到发动者的计分区。', 1, 1, c.actor, '收到转移到计分区的', 'transfer'); c.transferred += ids.length;
  }, function* (c, p) { if (c.transferred) c.draw(p, c.value(2), 'score'); }],
  B046: [function* (c, p) { c.draw(p, c.value(5), 'tuck'); }, function* (c, p) { yield* splay(c, p, ['RED'], 'right'); }, function* (c, p) {
    const color = yield* chooseColor(c, p, colors, true, '可以选择一种颜色，将其最上方两张牌计分。');
    if (color) for (const id of pile(c, p, color).slice(-2).reverse()) c.move(id, 'score', p);
  }],
  B047: [function* (c, p) {
    const ids = yield* pickMove(c, p, score(c, p).filter(id => c.card(id).age <= 4), 'score', '转移两张时代不超过 4 的计分牌给发动者。', 2, 2, c.actor, '收到转移到计分区的', 'transfer'); c.transferred += ids.length;
  }, function* (c, p) {
    if (c.transferred) yield* pickMove(c, p, low(c, tops(c, p).filter(id => has(c, id, 1))), 'score', '将带有繁荣的最低时代置顶牌计分。');
  }],
  B056: [function* (c, p) {
    for (let i = 0; i < 3; i++) c.draw(p, c.value(6), 'tuck');
    if (c.iconCompare(c.p(p),c.p(c.other(p)),6)>0) { const id = pile(c, p, 'RED').at(-1); if (id) c.move(id, 'return', p); }
  }, function* (c, p) { yield* splay(c, p, ['RED', 'PURPLE'], 'right'); }],
  B057: [function* (c, p) { c.draw(p, maxAge(c, score(c, p)), 'score'); }],
  B066: [function* (c, p) {
    const n = colorCount(c, c.actor, 1);
    yield* pickMove(c, p, score(c, p), 'score', `转移 ${n} 张计分牌给发动者，不足时尽量执行。`, n, n, c.actor, '收到转移到计分区的', 'transfer');
  }, function* (c, p) { const id = pile(c, p, 'RED')[0]; if (id) c.move(id, 'return', p); }],
  B067: [function* (c, p) {
    const ids = yield* rankPick(c, p, hand(c, p), 3, true, '依次选择最高时代的三张手牌，转移给发动者。');
    const moved=ids.filter(id=>c.transfer(id, 'hand', c.actor));
    if (moved.length && !hand(c, p).length) c.draw(p, c.value(7));
  }],
  B076: [function* (c, p) { if (c.p(p).splay.RED === 'up') yield* splay(c, p, colors, 'up'); }, function* (c, p) { yield* splay(c, p, ['RED'], 'up'); }],
  B077: [function* (c, p) {
    const candidates = tops(c, p).filter(id => c.card(id).color !== 'RED' && !has(c, id, 5));
    const ids = yield* rankPick(c, p, candidates, 2, true, '选择时代最高、颜色不同、不带工业的两张非红色置顶牌。');
    const moved=ids.filter(id=>c.transfer(id, 'score', c.actor, '收到转移到计分区的')); if (moved.length) c.draw(p, c.value(8));
  }],
  B086: [function* (c, p) {
    const n = Math.max(0, hand(c, p).length - 1);
    yield* pickMove(c, p, hand(c, p), 'hand', '转移手牌给发动者，直到只剩一张。', n, n, c.actor, '', 'transfer');
    yield* pickMove(c, p, high(c, score(c, p)), 'score', '同时转移最高的一张计分牌给发动者。', 1, 1, c.actor, '收到转移到计分区的', 'transfer');
  }],
  B087: [function* (c, p) {
    const id = c.draw(p, c.value(10), 'hand', true);
    if (c.card(id).color !== 'RED') return;
    for (const owner of c.state.players) for (const value of [...owner.hand, ...owner.score, ...owner.forecast, ...Object.values(owner.piles).flat()]) c.move(value, 'junk', owner.id);
    c.stopDogma();
  }, function* (c, p) {
    // Official card combines return + draw in ONE shared effect, unlike BGA.
    yield* pickMove(c, p, c.state.players.flatMap(owner => c.tops(owner)).filter(id => id !== 'B087'), 'return', '归还任意玩家一张非核裂变的置顶牌。');
    c.draw(p, c.value(10));
  }],
  B096: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'return', '归还一张手牌。');
    if (!ids.length) return;
    if (c.card(ids[0]).age === c.value(10)) for (const age of new Set(score(c, p).map(id => c.card(id).age))) c.draw(p, c.value(10));
    if (c.card(ids[0]).age === c.value(11)) junkDeck(c, p, c.value(11));
  }],
  B097: [function* (c, p) {
    const id = pile(c, p, 'GREEN').at(-1); if (id) c.move(id, 'score', p);
  }, function* (c, p) {
    // Official card prints two separate shared effects; BGA combines them.
    const id = c.draw(p, c.value(10), 'meld'); if (has(c, id, 5) || has(c, id, 6)) yield* c.selfExecute(p, id);
  }],
  B106: [function* (c, p) {
    const id = c.draw(p, c.value(11), 'hand', true), color = c.card(id).color;
    if (c.splay(p, color, 'aslant')) yield* all(c, p, ()=>pile(c, p, color).slice(0, -4), 'hand', p, '', 'transfer');
  }, function* (c, p) { if (hand(c, p).length >= 8) c.win(p, '天体地质学：手牌至少八张。'); }],
  B107: [function* (c, p) {
    let age = 11;
    while (age >= 1) {
      const ids = yield* pickMove(c, p, tops(c, p).filter(id => c.card(id).age === age), 'score', `计分一张时代 ${age} 的置顶牌。`);
      if (!ids.length) break;
      age = yield* chooseValue(c, p, [age - 1, age - 2], '选择低一个或两个时代，继续计分。');
    }
  }],
};
