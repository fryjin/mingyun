import { escapeHtml } from '../../core/utils.js';
import { gameHeader, playerChips } from '../../components/game-ui.js';

const finalRotation = {
  1: 'rotateX(-8deg) rotateY(8deg)',
  2: 'rotateX(-8deg) rotateY(-82deg)',
  3: 'rotateX(-8deg) rotateY(172deg)',
  4: 'rotateX(-8deg) rotateY(88deg)',
  5: 'rotateX(-98deg) rotateY(0deg)',
  6: 'rotateX(82deg) rotateY(0deg)'
};

const dot = number => `<span class="dot dot-${number}"></span>`;

export function diceMarkup() {
  return `<div class="dice-scene" data-dice-scene><div class="dice-shadow" data-dice-shadow></div><div class="dice-cube" data-dice-cube aria-label="骰子"><div class="dice-side front">${dot(5)}</div><div class="dice-side back">${dot(1)}${dot(5)}${dot(9)}</div><div class="dice-side right">${dot(1)}${dot(9)}</div><div class="dice-side left">${dot(1)}${dot(3)}${dot(5)}${dot(7)}</div><div class="dice-side top">${dot(1)}${dot(3)}${dot(5)}${dot(7)}${dot(9)}</div><div class="dice-side bottom">${dot(1)}${dot(3)}${dot(4)}${dot(6)}${dot(7)}${dot(9)}</div></div></div>`;
}

export function finalDiceRotation(value) {
  return finalRotation[value];
}

export function renderDiceTurn({ plugin, ctx, turn, rolls }) {
  const player = turn.current();
  return `${gameHeader(plugin.title, `${ctx.settings.loserRule === 'high' ? '最高点' : '最低点'}接受惩罚`)}<section class="game-stage centered dice-game"><div class="turn-progress">第 ${Math.min(turn.turn, ctx.players.length)} / ${ctx.players.length} 位</div><span class="current-player">${escapeHtml(player.name)}</span>${diceMarkup()}<button class="button primary large" data-roll>轻触投骰</button>${rolls.length ? playerChips(rolls, item => item.value) : ''}</section>`;
}

export function renderDiceResult({ plugin, loser, target, tied }) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered"><span class="eyebrow">本轮结果</span><h2>${escapeHtml(loser.name)} 遭殃</h2><div class="result-number" data-result>${target}</div>${tied.length > 1 ? '<p>同点玩家中随机选出一位。</p>' : ''}<button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-next>再来一轮</button></section>`;
}
