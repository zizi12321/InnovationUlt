import { escapeHTML, resourceIconHTML } from './cards.js';

export function createGlossary(terms, dialog, tooltip) {
  const byId = new Map(terms.map(term => [term.id, term]));
  const aliases = new Map();
  const iconNames = Object.fromEntries(terms.filter(term => /^icon(?:[1-9]|1[1-8])$/.test(term.id)).map(term => [term.id.slice(4), term.zh]));
  for (const term of terms) for (const alias of term.aliases) {
    const key = alias.toLocaleLowerCase();
    if (key && !aliases.has(key)) aliases.set(key, ({food:'icon18',flag:'icon8',fountain:'icon9','city-left':'icon11','city-right':'icon12','city-up':'icon13',plus:'icon14','city-junk':'icon15',uplift:'icon16',unsplay:'icon17'}[term.id] || term.id));
  }
  const regex = new RegExp([...aliases.keys()].sort((a, b) => b.length - a.length).map(alias => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
  let anchor = null;
  let timer = null;

  function keywordText(text, { color, interactive }) {
    let result = '', cursor = 0;
    for (const match of text.matchAll(regex)) {
      result += escapeHTML(text.slice(cursor, match.index));
      const id = aliases.get(match[0].toLocaleLowerCase());
      if (/^icon(?:[1-9]|1[1-8])$/.test(id)) {
        const code = Number(id.slice(4)), name = iconNames[code];
        const tag = interactive ? 'button' : 'span';
        result += `<${tag} class="inline-resource${interactive ? ' keyword' : ''}" data-resource="${code}" title="${escapeHTML(name)}"${interactive ? ` type="button" data-term="${id}" aria-label="${escapeHTML(name)}，查看解释"` : ''}>${resourceIconHTML(code, color, iconNames)}</${tag}>`;
      } else {
        // Card faces are buttons themselves: their text must not introduce
        // nested buttons. Full details retain the interactive glossary.
        result += interactive ? `<button type="button" class="keyword" data-term="${id}">${escapeHTML(match[0])}</button>` : escapeHTML(match[0]);
      }
      cursor = match.index + match[0].length;
    }
    return result + escapeHTML(text.slice(cursor));
  }

  function richText(value, { color = 'BLUE', interactive = true } = {}) {
    // Escape source text before generating markup. The JSON is data, never HTML.
    const text = String(value ?? '');
    return text.split(/(【[^】]*】)/g).map(part => {
      if (!part.startsWith('【')) return keywordText(part, { color, interactive });
      const inside = part.slice(1, -1);
      if (/^\d+$/.test(inside)) return `<span class="age-token" aria-label="时代 ${inside}">${inside}</span>`;
      return `<span class="token">${keywordText(inside, { color, interactive })}</span>`;
    }).join('');
  }

  function hide() {
    clearTimeout(timer);
    anchor?.removeAttribute('aria-describedby');
    anchor = null;
    tooltip.hidden = true;
  }

  function position() {
    if (!anchor?.isConnected) { hide(); return; }
    const box = anchor.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight) { hide(); return; }
    const margin = 12, width = tooltip.offsetWidth, height = tooltip.offsetHeight;
    let top = box.bottom + 8;
    if (top + height > innerHeight - margin) top = box.top - height - 8;
    tooltip.style.left = `${Math.max(margin, Math.min(box.left, innerWidth - width - margin))}px`;
    tooltip.style.top = `${Math.max(margin, Math.min(top, innerHeight - height - margin))}px`;
  }

  function show(element) {
    const term = byId.get(element.dataset.term);
    if (!term) return;
    hide(); anchor = element;
    tooltip.innerHTML = `<h3>${escapeHTML(term.zh)}<span>${escapeHTML(term.en)}</span></h3><p>${escapeHTML(term.text)}</p><small>终极版规则 4.1 · 第 ${term.pages.join('、')} 页 · 按 Esc 收起</small>`;
    tooltip.hidden = false;
    anchor.setAttribute('aria-describedby', tooltip.id);
    position();
  }

  function delayedHide() { clearTimeout(timer); timer = setTimeout(hide, 180); }
  dialog.addEventListener('pointerover', event => {
    const target = event.target.closest('[data-term]');
    if (target) show(target);
    if (tooltip.contains(event.target)) clearTimeout(timer);
  });
  dialog.addEventListener('pointerout', event => {
    if (!anchor) return;
    const next = event.relatedTarget;
    if (next && (tooltip.contains(next) || anchor.contains(next))) return;
    delayedHide();
  });
  dialog.addEventListener('focusin', event => {
    const target = event.target.closest('[data-term]');
    if (target) show(target); else if (!tooltip.contains(event.target)) hide();
  });
  dialog.addEventListener('click', event => {
    const target = event.target.closest('[data-term]');
    if (target) show(target); else if (!tooltip.contains(event.target)) hide();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !tooltip.hidden) {
      event.preventDefault(); event.stopPropagation(); hide();
    }
  });
  dialog.addEventListener('close', hide);
  dialog.addEventListener('scroll', hide);
  window.addEventListener('resize', position);
  return { richText, hide };
}
