// Full names are shared by setup, supply tabs, save metadata and card details.
export const EXPANSIONS = Object.freeze([
  { id: 'echoes', set: 'Echoes', name: '往日回声', english: 'Echoes of the Past', available: true,
    drawRule: '抽牌时代先按基础牌库的空堆向上顺延。若你的最高时代置顶牌仅有一张，抽基础牌时改抽对应时代的往日回声牌；该扩展牌库为空则仍抽基础牌。' },
  { id: 'figures', set: 'Figures', name: '文明巨擘', english: 'Figures in the Sand', available: true,
    drawRule: '获得条例分享奖励的免费抽牌时，改抽伟人牌；以统御行动取得标准成就后，每位对手各抽一张伟人牌。按抽牌者最高置顶时代抽取，先按基础空堆顺延；对应伟人牌库为空时改抽基础牌。' },
  { id: 'cities', set: 'Cities', name: '命运之城', english: 'Cities of Destiny', available: true,
    drawRule: '手中没有城市时：以融合行动新增一种面板颜色，或由你将任意玩家的颜色牌堆改为新的展开方向（还原除外），立即按自己的最高置顶时代抽一张城市。先按基础空堆顺延；对应城市牌库为空则抽基础牌，不改抽回声或伟人。' },
  { id: 'artifacts', set: 'Artifacts', name: '岁月遗珍', english: 'Artifacts of History', available: false },
  { id: 'unseen', set: 'Unseen', name: '藏形匿影', english: 'The Unseen', available: false },
]);
export const cardSet = card => card.set || (card.id.startsWith('E') ? 'Echoes' : 'Base');
export const setName = set => EXPANSIONS.find(item => item.set === set)?.name || '基础版';
export const enabled = (state, id) => (state.expansions || []).includes(id);
export const achievementTarget = state => Math.max(3, 8 - state.players.length + (state.expansions || []).length);
export function normalizeExpansions(ids = []) {
  if (!Array.isArray(ids) || ids.some(id => !EXPANSIONS.some(item => item.id === id && item.available))) throw new Error('所选扩展尚未实现。');
  return EXPANSIONS.filter(item => ids.includes(item.id)).map(item => item.id);
}
