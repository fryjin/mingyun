import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { StateMachine } from '../../engine/state-machine.js';
import { TimerController } from '../../engine/timer.js';
import { TurnManager } from '../../engine/turn-manager.js';
import { bindPageVisibility } from '../../engine/visibility.js';
import { questionEngine } from '../../data-engine/question-engine.js';
import { tone, vibrate } from '../../core/utils.js';
import { bindGameExit } from '../../components/game-ui.js';
import { assignRoles, normalizeUndercoverCount, resolveVote, resolveWinner, SPEECH_OPTIONS, wordForPlayer } from './rules.js';
import { renderLoadError, renderSpeaker, renderSpeechReady, renderVote, renderVotePass, renderVoteReady, renderVoteResult, renderWord, renderWordPass } from './view.js';

const transitions = {
  loading: ['word-pass'],
  'word-pass': ['word'],
  word: ['word-pass', 'speech-ready'],
  'speech-ready': ['speech'],
  speech: ['speech', 'vote-ready'],
  'vote-ready': ['vote-pass'],
  'vote-pass': ['vote'],
  vote: ['vote-pass', 'result'],
  result: ['speech-ready', 'loading']
};

const plugin = createGamePlugin({
  id: 'undercover',
  title: '谁是卧底',
  sortOrder: 5,
  icon: 'mask',
  color: '#34d399',
  minPlayers: 4,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '8–20 分钟',
  shortDescription: '看词、描述、投票找出卧底。',
  description: '每个人只会看到自己的词。轮流描述后投票，找出拿到不同词的人。',
  phoneMode: '逐人私密传递',
  resultMode: '找出不同词玩家',
  defaultSettings: { undercoverCount: 1, speechSeconds: 30, level: 'standard' },
  levelOptions: ['light', 'standard', 'bold', 'adult', 'adult-plus'],
  renderSetup(settings) {
    return `<div class="setting-block"><div class="setting-label"><span>卧底人数</span><small>建议每 6 人 1 名</small></div><div class="time-stepper"><button type="button" data-uc-minus>−</button><input data-uc-count type="number" min="1" max="3" value="${settings.undercoverCount || 1}"><button type="button" data-uc-plus>＋</button></div></div><div class="setting-block"><div class="setting-label"><span>发言时限</span><small>默认 30 秒</small></div><div class="segmented compact-options" data-speech>${SPEECH_OPTIONS.map(number => `<button type="button" data-segment data-value="${number}" class="${Number(settings.speechSeconds) === number ? 'active' : ''}">${number ? `${number}秒` : '不限'}</button>`).join('')}</div></div>`;
  },
  bindSetup(sheet) {
    const input = sheet.querySelector('[data-uc-count]');
    sheet.querySelector('[data-uc-minus]').onclick = () => { input.value = Math.max(1, Number(input.value) - 1); };
    sheet.querySelector('[data-uc-plus]').onclick = () => { input.value = Math.min(3, Number(input.value) + 1); };
  },
  readSetup(sheet) {
    return {
      undercoverCount: Number(sheet.querySelector('[data-uc-count]').value || 1),
      speechSeconds: Number(sheet.querySelector('[data-speech] .active')?.dataset.value || 30)
    };
  },
  async mount(root, ctx) {
    const settings = {
      ...ctx.settings,
      undercoverCount: normalizeUndercoverCount(ctx.settings.undercoverCount, ctx.players.length),
      speechSeconds: SPEECH_OPTIONS.includes(Number(ctx.settings.speechSeconds)) ? Number(ctx.settings.speechSeconds) : 30
    };
    const machine = new StateMachine({ initial: 'loading', transitions });
    let pair = null;
    let roles = new Map();
    let alive = [];
    let round = 1;
    let wordTurn = null;
    let speechTurn = null;
    let voteTurn = null;
    let votes = [];
    let speechTimer = null;
    let speechPausedByVisibility = false;

    const bind = () => bindGameExit(root, ctx);
    const cancelSpeechTimer = () => {
      speechTimer?.cancel();
      speechTimer = null;
      speechPausedByVisibility = false;
    };
    ctx.lifecycle.add(cancelSpeechTimer);

    const startGame = async () => {
      cancelSpeechTimer();
      machine.reset();
      root.innerHTML = `${renderLoadError(plugin, '正在加载词组…')}`;
      bind();
      try {
        pair = await questionEngine.drawGame({ gameId: plugin.id, settings });
        if (ctx.lifecycle.disposed) return;
        alive = [...ctx.players];
        roles = assignRoles(ctx.players, settings.undercoverCount, ctx.services.random);
        round = 1;
        wordTurn = new TurnManager(ctx.players);
        machine.transition('word-pass');
        showWordPass();
      } catch (error) {
        if (ctx.lifecycle.disposed) return;
        root.innerHTML = renderLoadError(plugin, error.message);
        bind();
      }
    };

    const showWordPass = () => {
      const player = wordTurn.current();
      root.innerHTML = renderWordPass(plugin, player, settings.level === 'adult-plus');
      bind();
      root.querySelector('[data-private-open]').onclick = () => {
        machine.transition('word');
        showWord(player);
      };
    };

    const showWord = player => {
      root.innerHTML = renderWord(plugin, player, wordForPlayer(player.id, roles, pair));
      bind();
      root.querySelector('[data-remember]').onclick = () => {
        if (wordTurn.turn >= ctx.players.length) {
          machine.transition('speech-ready');
          showSpeechReady();
        } else {
          wordTurn.next();
          machine.transition('word-pass');
          showWordPass();
        }
      };
    };

    const showSpeechReady = () => {
      cancelSpeechTimer();
      speechTurn = new TurnManager(alive);
      root.innerHTML = renderSpeechReady(plugin, round);
      bind();
      root.querySelector('[data-speak]').onclick = () => {
        machine.transition('speech');
        showSpeaker();
      };
    };

    const showSpeaker = () => {
      cancelSpeechTimer();
      const player = speechTurn.current();
      root.innerHTML = renderSpeaker(plugin, round, player, settings.speechSeconds);
      bind();
      root.querySelector('[data-finish]').onclick = finishSpeaker;
      if (!settings.speechSeconds) return;

      let lastSecond = settings.speechSeconds;
      speechTimer = new TimerController({
        durationMs: settings.speechSeconds * 1000,
        tickRateMs: 100,
        onTick(remainingMs) {
          const current = Math.ceil(remainingMs / 1000);
          const time = root.querySelector('[data-time]');
          if (time) time.textContent = String(current);
          if (current !== lastSecond && current <= 5 && current > 0) {
            lastSecond = current;
            tone(400 + current * 40, .03, ctx.global.sound, .02);
          }
        },
        onDone() {
          vibrate([40, 30, 40], ctx.global.haptics);
          finishSpeaker();
        }
      });
      speechTimer.start();
    };

    const finishSpeaker = () => {
      if (machine.state !== 'speech') return;
      cancelSpeechTimer();
      if (speechTurn.turn >= alive.length) {
        machine.transition('vote-ready');
        showVoteReady();
      } else {
        speechTurn.next();
        showSpeaker();
      }
    };

    const showVoteReady = () => {
      voteTurn = new TurnManager(alive);
      votes = [];
      root.innerHTML = renderVoteReady(plugin, round);
      bind();
      root.querySelector('[data-vote]').onclick = () => {
        machine.transition('vote-pass');
        showVotePass();
      };
    };

    const showVotePass = () => {
      const voter = voteTurn.current();
      root.innerHTML = renderVotePass(plugin, voter);
      bind();
      root.querySelector('[data-private-open]').onclick = () => {
        machine.transition('vote');
        showVote(voter);
      };
    };

    const showVote = voter => {
      root.innerHTML = renderVote(plugin, voter, alive);
      bind();
      root.querySelectorAll('[data-candidate]').forEach(button => {
        button.onclick = () => {
          votes.push(button.dataset.candidate);
          if (voteTurn.turn >= alive.length) {
            const result = resolveVote({ alive, votes, random: ctx.services.random });
            alive = alive.filter(player => player.id !== result.eliminated.id);
            const winner = resolveWinner(alive, roles);
            machine.transition('result');
            showVoteResult(result.eliminated, winner);
          } else {
            voteTurn.next();
            machine.transition('vote-pass');
            showVotePass();
          }
        };
      });
    };

    const showVoteResult = (eliminated, winner) => {
      root.innerHTML = renderVoteResult(plugin, { eliminated, winner, pair });
      bind();
      root.querySelector('[data-new]')?.addEventListener('click', startGame);
      root.querySelector('[data-next]')?.addEventListener('click', () => {
        round += 1;
        machine.transition('speech-ready');
        showSpeechReady();
      });
    };

    bindPageVisibility(ctx.lifecycle, {
      onHidden() {
        if (machine.state === 'word') {
          machine.transition('word-pass');
          showWordPass();
          return;
        }
        if (machine.state === 'vote') {
          machine.transition('vote-pass');
          showVotePass();
          return;
        }
        if (machine.state === 'speech' && speechTimer?.state === 'running') {
          const timer = speechTimer;
          timer.pause();
          speechPausedByVisibility = machine.state === 'speech' && speechTimer === timer && timer.state === 'paused';
        }
      },
      onVisible() {
        if (machine.state === 'speech' && speechPausedByVisibility && speechTimer?.state === 'paused') {
          speechPausedByVisibility = false;
          speechTimer.resume();
        }
      }
    });

    startGame();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
