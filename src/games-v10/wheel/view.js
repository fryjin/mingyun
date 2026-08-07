import { escapeHtml } from '../../core/utils.js';
import { gameHeader } from '../../components/game-ui.js';

const PLAYER_TONES = ['#c8a86d', '#8b668f', '#687caa', '#6f8f88', '#a26f69', '#77718f', '#9a855e', '#607d85', '#8b6f63', '#747c9c', '#87708a', '#65857b'];

function playerNodes(players, step) {
  return players.map((player, index) => {
    const angle = index * step + step / 2;
    const counter = -angle;
    const tone = PLAYER_TONES[index % PLAYER_TONES.length];
    const initial = escapeHtml([...player.name][0] || String(index + 1));
    return `<span class="fate-player-node" data-player-node="${index}" style="--angle:${angle}deg;--counter-angle:${counter}deg;--player-tone:${tone}"><span class="fate-player-node__inner"><i>${String(index + 1).padStart(2, '0')}</i><b>${initial}</b><strong>${escapeHtml(player.name)}</strong></span></span>`;
  }).join('');
}

export function renderWheelGame({ plugin, players }) {
  const count = players.length;
  const step = 360 / count;
  return `${gameHeader(plugin.title, `${count} 位玩家`)}<section class="game-stage centered fate-wheel-game"><div class="fate-wheel-copy"><span>命运正在等待启动</span><strong>下一位会是谁？</strong></div><div class="fate-wheel-stage" data-assembly aria-label="命运转盘，共 ${count} 位玩家"><span class="fate-beacon" aria-hidden="true"><i></i></span><span class="fate-beacon-glow" aria-hidden="true"></span><div class="fate-halo" data-halo aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="fate-wheel" data-wheel style="--counter-rotation:0deg"><div class="fate-wheel-runes" aria-hidden="true"></div><div class="fate-wheel-lines" aria-hidden="true" style="--step:${step}deg"></div>${playerNodes(players, step)}<div class="fate-inner-orbit" data-inner aria-hidden="true"><span></span><span></span><span></span></div><div class="fate-core" data-core aria-hidden="true"><i></i><strong>命运</strong><small>FATE</small></div></div></div><p class="fate-wheel-hint">固定信标最终指向的玩家接受本轮惩罚</p><button class="button primary large fate-spin-button" data-spin>启动命运星盘</button><ol class="sr-only">${players.map(player => `<li>${escapeHtml(player.name)}</li>`).join('')}</ol></section>`;
}

export function renderWheelResult({ plugin, player }) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered fate-result"><span class="eyebrow">命运已锁定</span><h2>${escapeHtml(player.name)} 遭殃</h2><div class="fate-result-sigil" data-winner aria-hidden="true"><span>${escapeHtml([...player.name][0] || '命')}</span><i></i></div><p>本轮由命运星盘选中</p><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-again>再转一次</button></section>`;
}
