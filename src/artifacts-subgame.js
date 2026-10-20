// A113 deliberately uses the same engine, action validation and decision tape.
// Parent cards are parked, not shuffled back into the decks or exposed to AI.
export const ownedPhysicalCards = owner => [
  ...owner.hand,...owner.score,...owner.achievements,...(owner.forecast||[]),...(owner.safe||[]),
  ...(owner.display||[]),...(owner.museum||[]),...Object.values(owner.piles).flat()
];
export function prepareSubgame(parent) {
  const child=structuredClone(parent);
  child.parkedCards=[...(parent.parkedCards||[]),...parent.players.flatMap(ownedPhysicalCards)];
  child.parkedSpecials=[...(parent.parkedSpecials||[]),...parent.players.flatMap(p=>p.specials)];
  child.parkedDecrees=[...(parent.parkedDecrees||[]),...parent.players.flatMap(p=>p.decrees||[])];
  child.parkedMuseums=[...(parent.parkedMuseums||[]),...parent.players.flatMap(p=>[...Object.values(p.museumCards||{}),...(p.museumAchievements||[])])];
  for(const p of child.players){
    for(const key of ['hand','score','achievements','specials','forecast','safe','display','museum','museumAchievements','decrees'])p[key]=[];
    p.museumCards={};p.eliminated=false;
    for(const color of Object.keys(p.piles)){p.piles[color]=[];p.splay[color]='none';}
  }
  child.phase='playing';child.turn={player:parent.turn.player,number:1,left:1};
  child.log=[];child.winner=null;child.opening={};child.endorsements={};child.recentActions=[];
  delete child.turnCounts;delete child.museumCheck;
  child.subgameDepth=(parent.subgameDepth||0)+1;
  return child;
}

export function subgameActionLabel(action,card) {
  if(action.type==='draw')return '抽牌';
  if(action.type==='showcase')return '完成回合开始的展览';
  if(action.type==='achieve')return `统御时代 ${action.age}`;
  if(action.type==='decree')return '颁布法令';
  return `${action.type==='meld'?'融合':'发动'}「${card(action.cardId).name_zh}」`;
}

export function settleSubgame(parent,child) {
  // 不确定边界：官方 A113 卡面没有进一步说明子局准备、平局及
  // 合并时的展开/展示区冲突。这里沿用未被拥有的公共牌区和牌库顺序，
  // 按起始牌英文名决定先手；平局没有赢家，子局双方拥有的牌均移除。
  // 原局牌完整保留，胜者子局牌回到同名区域。展开沿用原局；原局空色
  // 才采用子局展开。展示区已占用时，回归的展示文物轮转回手牌。
  // 此处是明确标注的规则解释，待有官方 FAQ 时可集中修订。
  for(const key of ['supply','expansionSupply','standard','standardOrigins','junk','availableSpecials','junkSpecials','availableDecrees','availableMuseums','ageZeroIntroduced','rng'])parent[key]=child[key];
  const winner=child.winner?.player;
  for(const guest of child.players){
    const host=parent.players.find(p=>p.id===guest.id);
    if(guest.id!==winner){
      parent.junk.push(...ownedPhysicalCards(guest));
      parent.junkSpecials.push(...guest.specials);
      parent.availableDecrees.push(...guest.decrees);
      parent.availableMuseums.push(...Object.values(guest.museumCards),...guest.museumAchievements);
      continue;
    }
    for(const key of ['hand','score','achievements','specials','forecast','safe','museum','museumAchievements','decrees'])(host[key]??=[]).push(...guest[key]);
    Object.assign(host.museumCards,guest.museumCards);
    for(const id of guest.display)(host.display.length?host.hand:host.display).push(id);
    for(const color of Object.keys(host.piles)){
      const wasEmpty=!host.piles[color].length;
      host.piles[color].push(...guest.piles[color]);
      if(wasEmpty)host.splay[color]=guest.splay[color];
    }
  }
  return winner;
}
