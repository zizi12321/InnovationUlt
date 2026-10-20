import { cardBackHTML, escapeHTML as esc } from './cards.js';
import { safeLimit } from './unseen-rules.js';
export const safeSymbol='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>';
export function safeAreaHTML(player,state,engine,cards) {
  const own=player.id==='you',ids=player.safe||[],limit=safeLimit(player);
  const actions=engine.legalActions(state,player.id).filter(a=>Number.isInteger(a.secret));
  return `<section class="safe-area" aria-label="${own?'我的':'电脑'}安全区">
    <div class="hand-heading"><h3>${safeSymbol} 安全区 <span>${ids.length} / ${limit}</span></h3><small>${ids.length>limit?'现有超额牌保留':ids.length===limit?'容量已满':'按存入顺序排列'}</small></div>
    <p class="privacy-note">机密牌对所有人隐藏，包括持有者。只能查看时代、所属扩展与存入顺序。</p>
    <div class="safe-cards">${ids.map((id,index)=>{const card=cards.get(id);return `<div class="secret-card">
      <span class="secret-order">#${index+1}</span>${cardBackHTML(card,'机密牌')}
      ${own?`<button class="quiet-button" data-secret="${index}" ${actions.some(a=>a.secret===index)?'':'disabled'}>统御机密牌</button>`:''}</div>`;}).join('')||'<p class="empty-hand">通过保密效果存入牌，满足资格后可以用一次统御行动取得。</p>'}</div>
  </section>`;
}
