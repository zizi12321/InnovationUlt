import { listCardHTML, escapeHTML as esc } from './cards.js';

const museumSymbol='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 8 9-5 9 5H3Zm2 3v8m5-8v8m4-8v8m5-8v8M3 21h18"/></svg>';
export function artifactAreasHTML(player,state,cards,names,richText,canMeld) {
  const own=player.id==='you',display=player.display||[],museum=player.museum||[];
  const ready=state.turn.player===player.id&&state.turn.showcaseId;
  const face=(id,position)=>listCardHTML(cards.get(id),names,position,{showEffects:true,richText});
  return `<section class="artifacts-area" aria-label="${own?'我的':'电脑'}文物区域">
    <div class="artifact-display"><div class="hand-heading"><h3>展示区 <span>${display.length} / 1</span></h3><span class="artifact-stage">${ready?'回合开始 · 待展览':'等待下个回合展览'}</span></div>
    <p class="artifact-help">${richText('展示文物不属于面板，其图标只在展览时用于本次分享与要求的资格判定。')}</p>
    <div class="hand-grid">${display.map(id=>`<div class="hand-card">${face(id,'展示文物 · 下个回合开始展览')}</div>`).join('')||'<p class="empty-hand">通过发掘获得的文物会放在这里。</p>'}</div></div>
    <div class="artifact-museums"><div class="hand-heading"><h3>${museumSymbol} 博物馆 <span>${museum.length} 件馆藏</span></h3><span>公共空馆 ${state.availableMuseums?.length||0} 座</span></div>
    <p class="artifact-help">${richText('馆藏文物可以用一次融合行动加入面板，空馆随即释放。夺取会将文物及博物馆一同移走。')}</p>
    <div class="hand-grid">${museum.map(id=>`<div class="museum-card hand-card">${face(id,`${player.museumCards[id]?esc(player.museumCards[id].replace('M-ARTIFACTS-','博物馆 ')):'博物馆检查 · 即将归还'}`)}${own?`<button class="hand-play" data-command="meld" data-id="${id}" ${canMeld?'':'disabled'}>融合馆藏 · 释放博物馆</button>`:''}</div>`).join('')||'<p class="empty-hand">展览结束后，文物会收入可用博物馆。</p>'}</div>
    <p class="museum-achievements">${museumSymbol} 已取得博物馆成就：<strong>${player.museumAchievements?.length||0}</strong> 项</p></div>
  </section>`;
}
export function museumSupplyHTML(state) {
  return `<section class="museum-supply"><h3>${museumSymbol} 博物馆供应</h3><div class="museum-tokens">${Array.from({length:5},(_,i)=>{
    const id=`M-ARTIFACTS-${i+1}`,owner=state.players.find(p=>(p.museumAchievements||[]).includes(id)),holder=state.players.find(p=>Object.values(p.museumCards||{}).includes(id));
    const available=state.availableMuseums?.includes(id);
    return `<span class="museum-token${owner?' is-achieved':available?'':' is-occupied'}" title="${owner?owner.name+'已统御':holder?holder.name+'的馆藏':'可用博物馆'}">${museumSymbol}<b>${i+1}</b><small>${owner?owner.name+'成就':holder?holder.name+'馆藏':available?'可用':'暂存'}</small></span>`;
  }).join('')}</div><p class="achievement-help">博物馆检查时，唯一拥有最多馆藏的玩家取得一座博物馆成就；馆藏不直接计为成就。</p></section>`;
}
