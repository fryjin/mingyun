import { gameHeader } from '../../components/game-ui.js';

export function renderIdle(plugin, direction) {
  return `${gameHeader(plugin.title, '隐藏计时')}<section class="game-stage centered"><span class="eyebrow">准备开始</span><div class="bomb-visual idle"><i></i></div><h2>${direction}传递</h2><p>点燃后直接把手机依次传下去，不需要再点击屏幕。</p><p class="safety-note">请正常递交手机，不要抛掷。</p><button class="button danger large" data-light>点燃炸弹</button></section>`;
}

export function renderRunning(plugin, direction) {
  return `${gameHeader(plugin.title, '炸弹已点燃')}<section class="game-stage centered hot"><span class="eyebrow">继续传递</span><div class="bomb-visual burning" data-bomb><i></i></div><h2>别让它停下来</h2><p>按${direction}传递，爆炸前不会显示剩余时间。</p><p class="safety-note">请递交手机，不要抛掷。</p></section>`;
}

export function renderPaused(plugin, direction) {
  return `${gameHeader(plugin.title, '游戏已暂停')}<section class="game-stage centered"><span class="eyebrow">炸弹暂停</span><div class="bomb-visual idle"><i></i></div><h2>计时已暂停</h2><p>返回游戏后不会扣除离开页面的时间。</p><p>准备好后继续按${direction}传递。</p><button class="button danger large" data-resume>继续炸弹</button></section>`;
}

export function renderExplosion(plugin) {
  return `${gameHeader(plugin.title)}<section class="game-stage centered explosion"><span class="eyebrow">时间到</span><div class="explosion-burst" data-burst><span>BOOM</span></div><h2>拿着手机的人遭殃</h2><button class="button primary full" data-punish>抽取惩罚</button><button class="button secondary full" data-again>重新点燃</button></section>`;
}
