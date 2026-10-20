// Sufficient public reasons that a first demand cannot move a card. This is
// an advisory, not a simulator: unlisted/uncertain cases stay undecided.
// Only the normal observation is accepted; hidden hand/score faces and draw
// order must never influence a hint. Earlier effects can invalidate later
// prerequisites, so callers only use this for the first printed demand.
export function publicDemandBlockReason(card, view, cards) {
  const own = view.me, rival = view.rival;
  const top = Object.values(rival.piles).flatMap(pile => pile.slice(-1)).map(id => cards.get(id));
  const ownTop = Object.values(own.piles).flatMap(pile => pile.slice(-1)).map(id => cards.get(id));
  const noTop = predicate => !top.some(predicate), has = (c, icon) => c.spots.includes(icon);
  const handCount = rival.handAges.length, scoreAges = rival.scoreAges;
  const noHand = '对手目前没有手牌可转移。', noScore = '对手目前没有符合条件的计分牌。';
  const noTarget = '对手目前没有符合牌文条件的置顶牌。';
  switch (card.id) {
    case 'B003': case 'B035': case 'B065': case 'B067': return !handCount ? noHand : null;
    case 'B013': return rival.icons[4] < 4 ? '对手的权威不足 4，未满足要求中的额外条件。' : noTop(c => has(c, 4)) ? noTarget : null;
    case 'B021': return !scoreAges.includes(1) ? noScore : null;
    case 'B024': return noTop(c => !own.piles[c.color].length) ? noTarget : null;
    case 'B026': case 'B037': return noTop(c => has(c, 4)) ? noTarget : null;
    case 'B028': case 'B069': return !handCount && !own.hand.length ? '双方均无手牌可交换。' : null;
    case 'B029': return !scoreAges.length && !own.score.length ? '双方均无计分牌可交换。' : null;
    case 'B030': return noTop(c => c.color !== 'GREEN' && has(c, 2)) && !ownTop.some(c => !has(c, 2)) ? '双方均无符合本段要求的置顶牌。' : null;
    case 'B038': case 'B048': case 'B059': case 'B094': case 'B108': return !scoreAges.length ? noScore : null;
    case 'B041': return !scoreAges.some(age => [2, 3].includes(age)) ? noScore : null;
    case 'B044': return noTop(c => c.color !== 'PURPLE' && has(c, 1)) ? noTarget : null;
    case 'B047': return !scoreAges.some(age => age <= 4) ? noScore : null;
    case 'B050': case 'B080': return noTop(c => c.color !== 'GREEN' && has(c, 5)) ? noTarget : null;
    case 'B055': return noTop(c => has(c, 3) && c.age > (cards.get(own.piles[c.color].at(-1))?.age || 0)) ? noTarget : null;
    case 'B066': return !scoreAges.length ? noScore : !view.icons[1] ? '发动者没有可见繁荣图标，本段要求转移的数量为 0。' : null;
    case 'B068': return handCount <= 1 ? '对手的手牌已不超过一张，无需归还。' : null;
    case 'B077': return noTop(c => c.color !== 'RED' && !has(c, 5)) ? noTarget : null;
    case 'B079': return noTop(c => c.color !== 'YELLOW' && has(c, 6)) ? noTarget : null;
    case 'B086': return handCount <= 1 && !scoreAges.length ? '对手手牌不超过一张且没有计分牌，本段无可转移目标。' : null;
    case 'B098': return noTop(c => has(c, 2)) ? noTarget : null;
    case 'B100': return !scoreAges.length ? noScore : !rival.achievements ? '对手没有成就，本段要求归还的数量为 0。' : null;
    case 'B110': return !top.some((c, index) => top.some((other, j) => index !== j && c.age === other.age)) ? '对手没有两张同一时代的置顶牌，无法组成要求的配对。' : null;
    case 'B112': return noTop(c => c.spots.some(icon => [1, 3, 4, 5, 6, 7].includes(icon))) ? noTarget : null;
    case 'B115': return noTop(c => c.effects.some(effect => effect.kind === 'i_demand_effect')) ? noTarget : null;
    default: return null;
  }
}

// Only assess the first ordinary segment before any earlier effect can draw,
// transfer or meld cards. Unknown hand colors/icons are deliberately ignored.
export function publicOrdinaryBlockReason(card, view) {
  const rival = view.rival, handCount = rival.handAges.length;
  if (['B004', 'B006', 'B007', 'B010', 'B011', 'B014', 'B017', 'B020', 'B023', 'B039', 'B051', 'B060', 'B064', 'B074', 'B078', 'B081', 'B082', 'B088', 'B089', 'B095', 'B096', 'B099', 'B114'].includes(card.id) && !handCount) return '对手没有手牌，无法执行本段以手牌为起点的效果。';
  if (['B033', 'B034', 'B043', 'B063'].includes(card.id) && !rival.scoreCount) return '对手没有计分牌，无法执行本段效果。';
  if (card.id === 'B022' && rival.scoreCount <= handCount) return '对手的计分牌张数未多于手牌张数，不满足抽牌条件。';
  if (card.id === 'B032' && !rival.icons[4]) return '对手没有可见权威图标，本段抽牌数量为 0。';
  if (card.id === 'B070' && !handCount && !rival.scoreCount) return '对手的手牌和计分区均为空，没有牌可交换。';
  const splayTargets = {
    B025: [Object.keys(rival.piles), 'left'], B031: [['GREEN', 'BLUE'], 'left'],
    B045: [['YELLOW', 'PURPLE'], 'right'], B052: [['BLUE'], 'right'], B062: [['BLUE'], 'right'],
    B073: [['YELLOW', 'BLUE'], 'up'], B092: [['RED', 'GREEN'], 'up'], B105: [['GREEN'], 'up'],
  }[card.id];
  if (splayTargets && !splayTargets[0].some(color => rival.piles[color].length >= 2 && rival.splay[color] !== splayTargets[1])) return '对手没有符合本段展开条件的牌堆。';
  return null;
}
