import {
  hand, tops, pile, score, has, maxAge, colorCount,
  topAge, pickMove, all, optionalAll, chooseValue, splay, junkAchievement,
  pickMoveDirect
} from './effect-helpers.js';

// 蓝色基础牌；按卡牌编号排列，保留各效果段落的原有顺序。
export const BASE_BLUE_EFFECTS = {
  B010: [function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, hand(c, p), 'return', '可以归还最多三张手牌，抽取与归还张数相同的时代牌计分。', 0, 3);
    if (ids.length) c.draw(p, ids.length, 'score');
  }, function* (c, p) { c.draw(p, c.value(1)); }],
  B011: [function* (c, p) {
    // Golden rule p.14 permits a partial return, but the "if you do" reward
    // requires exactly three (p.15). Do not award a 3 for returning fewer.
    if (!hand(c, p).length || !(yield* c.yes(p, '是否归还三张手牌？不足三张时尽量归还，但不会获得时代 3 的奖励。'))) return;
    const ids = yield* pickMoveDirect(c, p, hand(c, p), 'return', '选择三张手牌；按选择顺序放回牌库底。', 3, 3);
    if (ids.length === 3) c.draw(p, c.value(3), 'meld');
  }, function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, hand(c, p).filter(id => c.card(id).age === c.value(3)), 'return', '可以归还一张时代 3 的手牌，抽三张时代 1 的牌。', 0);
    if (ids.length) for (let i = 0; i < 3; i++) c.draw(p, c.value(1));
  }],
  B012: [function* (c, p) { c.draw(p, c.value(2)); }],
  B022: [function* (c, p) { if (c.p(p).score.length > hand(c, p).length) { c.draw(p, c.value(3)); c.draw(p, c.value(3)); } }],
  B023: [function* (c, p) {
    const ids = yield* pickMoveDirect(c, p, hand(c, p), 'return', '可以归还一张手牌，抽取高一时代的牌并融合。', 0);
    if (ids.length) c.draw(p, c.card(ids[0]).age + 1, 'meld');
  }],
  B032: [function* (c, p) {
    const drawn = []; for (let i = 0, n = colorCount(c, p, 4); i < n; i++) drawn.push(c.draw(p, c.value(4), 'hand', true));
    if (drawn.some(id => c.card(id).color === 'RED')) yield* all(c, p, ()=>hand(c, p), 'return');
  }, function* (c, p) {
    yield* pickMove(c, p, hand(c, p), 'meld', '融合一张手牌。');
    yield* pickMove(c, p, hand(c, p), 'score', '将一张手牌计分。');
  }],
  B033: [function* (c, p) { yield* optionalAll(c, p, ()=>score(c, p), 'meld', '是否融合计分区的全部卡牌？'); }, function* (c, p) {
    // Universal condition, including an empty board; checked against Card26.
    if (tops(c, p).every(id => has(c, id, 1))) c.claimSpecial(p, 'WORLD');
  }],
  B042: [function* (c, p) { c.draw(p, c.value(5), 'meld'); }],
  B043: [function* (c, p) {
    const ids = yield* pickMove(c, p, score(c, p), 'return', '可以归还一张计分牌，抽取比紫色置顶牌高两个时代的牌。', 0);
    if (ids.length) c.draw(p, topAge(c, p, 'PURPLE') + 2);
  }, function* (c, p) { yield* splay(c, p, ['BLUE'], 'right'); }],
  B052: [function* (c, p) { yield* splay(c, p, ['BLUE'], 'right'); }, function* (c, p) {
    c.draw(p, c.highest(c.p(p)) + 1, 'score'); yield* pickMove(c, p, score(c, p), 'return', '归还一张计分牌。');
  }],
  B053: [function* (c, p) {
    const drawn = []; for (let i = 0; i < 3; i++) drawn.push(c.draw(p, c.value(6), 'hand', true));
    if (new Set(drawn.map(id => c.card(id).color)).size < 3) yield* all(c, p, ()=>hand(c, p), 'return');
  }],
  B062: [function* (c, p) { yield* splay(c, p, ['BLUE'], 'right'); }, function* (c, p) { c.draw(p, c.value(7), 'meld'); }],
  B063: [function* (c, p) {
    const age = yield* chooseValue(c, p); yield* optionalAll(c, p, ()=>score(c, p).filter(id => c.card(id).age === age), 'meld', '是否融合该时代的全部计分牌？');
  }, function* (c, p) { yield* junkAchievement(c, p, [5, 6, 7], true); }],
  B072: [function* (c, p) {
    const [choice] = yield* c.choose(p, '可以选择进化的效果，也可以跳过。', [
      { value: 'score', label: '抽取并计分时代 8，然后归还一张计分牌' },
      { value: 'draw', label: '抽取比最高计分牌高一个时代的牌' }, { value: 'skip', label: '跳过' }]);
    if (choice === 'score') { c.draw(p, c.value(8), 'score'); yield* pickMove(c, p, score(c, p), 'return', '归还一张计分牌。'); }
    if (choice === 'draw') c.draw(p, Math.max(0, ...score(c, p).map(id => c.card(id).age)) + 1);
  }],
  B073: [function* (c, p) { yield* splay(c, p, ['YELLOW', 'BLUE'], 'up'); }, function* (c, p) {
    const options = [...c.state.availableSpecials.map(id => ({ value: id, label: `移除 ${c.specials.get(id).name_zh}` })),
      ...c.state.junkSpecials.map(id => ({ value: id, label: `恢复 ${c.specials.get(id).name_zh}` }))];
    const [id] = yield* c.choose(p, '可以移除一个可用特殊成就，或恢复一个被移除的特殊成就。', options, 0);
    if (id) c.specialMove(id, c.state.availableSpecials.includes(id));
  }],
  B082: [function* (c, p) {
    const ids = yield* pickMove(c, p, hand(c, p), 'return', '可以归还最多两张手牌；归还两张才获得时代 10 的抽牌及计分。', 0, 2);
    if (ids.length === 2) { c.draw(p, c.value(10)); c.draw(p, c.value(10), 'score'); }
  }],
  B083: [function* (c, p) {
    const n = colorCount(c, p, 6); yield* pickMove(c, p, score(c, c.other(p)), 'return', `归还对手 ${n} 张计分牌，只能查看牌背时代。`, n, n);
  }],
  B092: [function* (c, p) { yield* splay(c, p, ['RED', 'GREEN'], 'up'); }, function* (c, p) {
    const id = c.draw(p, c.value(10), 'meld'); yield* c.selfExecute(p, id);
  }],
  B093: [function* (c, p) {
    const id = c.draw(p, c.value(11), 'meld'); yield* all(c, p, ()=>pile(c, p, c.card(id).color).slice(0, -1), 'score');
  }],
  B102: [function* (c, p) {
    yield* pickMove(c, p, tops(c, c.other(p)).filter(id => has(c, id, 2)), 'score', '计分对手一张带健康的置顶牌。');
  }, function* (c, p) {
    if (c.state.players.some(owner => c.icons(owner)[2] < 2)) c.winMostIcons(2,'生物工程：有人健康少于两个，健康唯一最多。');
  }],
  B103: [function* (c, p) { c.draw(p, c.value(10), 'score'); }, function* (c, p) {
    c.draw(p, c.value(9), 'meld'); const second = c.draw(p, c.value(9), 'meld'); yield* c.selfExecute(p, second);
  }],
  B112: [function* (c, p) {
    const [value] = yield* c.choose(c.actor, '发动者选择一种非健康图标。', [1, 3, 4, 5, 6, 7].map(icon => ({ value: String(icon), label: ({1:'繁荣',3:'概念',4:'权威',5:'工业',6:'效率',7:'头像'})[icon] })));
    // Unlike Hypersonics, this can expose and return two cards of one color.
    for (let i = 0; i < 2; i++) yield* pickMove(c, p, tops(c, p).filter(id => has(c, id, Number(value))), 'return', '归还带有所选图标的一张置顶牌。');
  }, function* (c, p) {
    const ids = yield* pickMove(c, p, tops(c, p), 'return', '归还一张置顶牌。');
    yield* all(c, p, ()=>score(c, p).filter(id => c.card(id).age >= maxAge(c, ids)), 'return');
  }],
  B113: [function* (c, p) {
    const id = c.draw(p, c.value(11), 'meld'), color = c.card(id).color;
    if (c.p(p).splay[color] !== 'aslant') { yield* all(c, p, ()=>pile(c, p, color).slice(0, -4), 'return'); c.splay(p, color, 'aslant'); }
    if (pile(c, p, color).length >= 6) c.win(p, '太阳帆：刚融合的颜色至少有六张牌。');
  }],
};
