import { escapeHtml } from '../core/utils.js';

export function gameHeader(title, subtitle = '') {
  return `<header class="stage-header"><div><span class="eyebrow">NOW PLAYING</span><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div><button class="icon-button" data-exit aria-label="结束游戏">×</button></header>`;
}

export function bindGameExit(root, ctx) {
  root.querySelector('[data-exit]')?.addEventListener('click', ctx.goLobby);
}

export function privatePass(player, actionText = '继续') {
  return `<section class="private-stage"><span class="privacy-icon">◉</span><span class="eyebrow">请把手机交给</span><h2>${escapeHtml(player.name)}</h2><p>确认周围的人看不到屏幕后继续。</p><button class="button primary full" data-private-open>${escapeHtml(actionText)}</button></section>`;
}

export function playerChips(items, renderValue) {
  return `<div class="score-strip">${items.map(item => `<span>${escapeHtml(item.player.name)} <b>${escapeHtml(String(renderValue(item)))}</b></span>`).join('')}</div>`;
}
