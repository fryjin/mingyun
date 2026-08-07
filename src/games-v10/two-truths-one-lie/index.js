import { registerGame } from '../../games/registry.js';
import { createGamePlugin } from '../../engine/plugin.js';
import { StateMachine } from '../../engine/state-machine.js';
import { TurnManager } from '../../engine/turn-manager.js';
import { bindPageVisibility } from '../../engine/visibility.js';
import { bindGameExit } from '../../components/game-ui.js';
import { punishmentTarget, validateStoryPrompts, voteGroups } from './rules.js';
import {
  renderAnswerPass,
  renderComplete,
  renderComposer,
  renderLiePicker,
  renderNarratorPass,
  renderRevealBoard,
  renderRoundPunishment,
  renderVote,
  renderVotePass
} from './view.js';

const transitions = {
  'narrator-pass': ['compose'],
  compose: ['narrator-pass', 'vote-pass'],
  'vote-pass': ['vote', 'answer-pass'],
  vote: ['vote-pass'],
  'answer-pass': ['answer'],
  answer: ['answer-pass', 'reveal'],
  reveal: ['reveal', 'punishment'],
  punishment: ['narrator-pass', 'complete'],
  complete: ['narrator-pass']
};

const plugin = createGamePlugin({
  id: 'two-truths-one-lie',
  title: '两个真相一个谎言',
  sortOrder: 2.2,
  icon: 'stories',
  color: '#6f8fb5',
  minPlayers: 3,
  maxPlayers: 12,
  supportsAdult: true,
  estimatedTime: '8–25 分钟',
  shortDescription: '三个提示词，秘密投票后逐条揭秘。',
  description: '讲述者输入三个短提示词并口头讲完故事，其他人秘密投票。投票结束后讲述者锁定谎言，再在同一页面逐条揭晓；每位讲述者完成后立即进入惩罚。',
  phoneMode: '讲述公开，投票私密传递',
  resultMode: '每位讲述者结束后立即产生受罚者',
  defaultSettings: { level: 'standard' },
  renderSetup() {
    return '<div class="info-strip"><strong>玩家原创故事</strong><span>下方尺度仅用于每轮惩罚</span></div>';
  },
  mount(root, ctx) {
    const machine = new StateMachine({ initial: 'narrator-pass', transitions });
    let narratorOrder = [];
    let narratorTurn = null;
    let prompts = ['', '', ''];
    let votes = new Map();
    let voters = [];
    let voteTurn = null;
    let lieIndex = null;
    let revealed = new Set();

    const bind = () => bindGameExit(root, ctx);
    const narrator = () => narratorTurn.current();
    const groups = () => voteGroups({ voters, votes, lieIndex });

    const reset = () => {
      narratorOrder = ctx.services.random.shuffle(ctx.players);
      narratorTurn = new TurnManager(narratorOrder);
      machine.reset();
      beginNarrator(false);
    };

    const beginNarrator = (transition = true) => {
      prompts = ['', '', ''];
      votes = new Map();
      lieIndex = null;
      revealed = new Set();
      voters = ctx.players.filter(player => player.id !== narrator().id);
      voteTurn = new TurnManager(voters);
      if (transition) machine.transition('narrator-pass');
      showNarratorPass();
    };

    const showNarratorPass = () => {
      root.innerHTML = renderNarratorPass(plugin, narrator(), narratorTurn.turn, narratorOrder.length);
      bind();
      root.querySelector('[data-private-open]').onclick = () => {
        machine.transition('compose');
        showComposer();
      };
    };

    const showComposer = () => {
      root.innerHTML = renderComposer(plugin, narrator(), prompts);
      bind();
      root.querySelectorAll('[data-prompt]').forEach(input => input.addEventListener('input', () => {
        prompts[Number(input.dataset.prompt)] = input.value.slice(0, 12);
      }));
      root.querySelector('[data-prompt-form]').onsubmit = event => {
        event.preventDefault();
        const result = validateStoryPrompts([...root.querySelectorAll('[data-prompt]')].map(input => input.value));
        const error = root.querySelector('[data-error]');
        if (!result.ok) {
          error.hidden = false;
          error.textContent = result.error;
          return;
        }
        prompts = result.prompts;
        machine.transition('vote-pass');
        showVotePass();
      };
    };

    const showVotePass = () => {
      if (voteTurn.turn > voters.length) {
        machine.transition('answer-pass');
        showAnswerPass();
        return;
      }
      const player = voteTurn.current();
      root.innerHTML = renderVotePass(plugin, player, voteTurn.turn - 1, voters.length);
      bind();
      root.querySelector('[data-private-open]').onclick = () => {
        machine.transition('vote');
        showVote();
      };
    };

    const showVote = () => {
      const player = voteTurn.current();
      let selected = null;
      root.innerHTML = renderVote(plugin, player, prompts, voteTurn.turn, voters.length);
      bind();
      root.querySelectorAll('[data-story]').forEach(button => {
        button.onclick = () => {
          selected = Number(button.dataset.story);
          root.querySelectorAll('[data-story]').forEach(node => {
            const active = Number(node.dataset.story) === selected;
            node.classList.toggle('active', active);
            node.setAttribute('aria-pressed', String(active));
          });
          root.querySelector('[data-confirm-vote]').disabled = false;
        };
      });
      root.querySelector('[data-confirm-vote]').onclick = () => {
        votes.set(player.id, selected);
        machine.transition('vote-pass');
        if (voteTurn.turn >= voters.length) {
          machine.transition('answer-pass');
          showAnswerPass();
        } else {
          voteTurn.next();
          showVotePass();
        }
      };
    };

    const showAnswerPass = () => {
      root.innerHTML = renderAnswerPass(plugin, narrator());
      bind();
      root.querySelector('[data-private-open]').onclick = () => {
        machine.transition('answer');
        showLiePicker();
      };
    };

    const showLiePicker = () => {
      let selected = null;
      root.innerHTML = renderLiePicker(plugin, narrator(), prompts);
      bind();
      root.querySelectorAll('[data-lie]').forEach(button => {
        button.onclick = () => {
          selected = Number(button.dataset.lie);
          root.querySelectorAll('[data-lie]').forEach(node => {
            const active = Number(node.dataset.lie) === selected;
            node.classList.toggle('active', active);
            node.setAttribute('aria-pressed', String(active));
          });
          root.querySelector('[data-lock-lie]').disabled = false;
        };
      });
      root.querySelector('[data-lock-lie]').onclick = () => {
        lieIndex = selected;
        machine.transition('reveal');
        showRevealBoard();
      };
    };

    const showRevealBoard = () => {
      const { correct, wrong } = groups();
      root.innerHTML = renderRevealBoard(plugin, { narrator: narrator(), prompts, revealed, lieIndex, voters, votes, correct, wrong });
      bind();
      root.querySelectorAll('[data-reveal]').forEach(button => {
        button.onclick = () => {
          revealed.add(Number(button.dataset.reveal));
          showRevealBoard();
        };
      });
      root.querySelector('[data-settle-round]')?.addEventListener('click', () => {
        machine.transition('punishment');
        showRoundPunishment();
      });
    };

    const showRoundPunishment = () => {
      const { wrong } = groups();
      root.innerHTML = renderRoundPunishment(plugin, { narrator: narrator(), wrong, current: narratorTurn.turn, total: narratorOrder.length });
      bind();
      root.querySelector('[data-draw-punishment]').onclick = () => {
        const target = punishmentTarget({ narrator: narrator(), wrong });
        ctx.services.punishment.draw(target.players, { onDone: advanceNarrator });
      };
    };

    const advanceNarrator = () => {
      if (narratorTurn.turn >= narratorOrder.length) {
        machine.transition('complete');
        showComplete();
        return;
      }
      narratorTurn.next();
      beginNarrator();
    };

    const showComplete = () => {
      root.innerHTML = renderComplete(plugin);
      bind();
      root.querySelector('[data-restart]').onclick = reset;
      root.querySelector('[data-lobby]').onclick = ctx.goLobby;
    };

    bindPageVisibility(ctx.lifecycle, {
      onHidden() {
        if (machine.state === 'compose') {
          machine.transition('narrator-pass');
          showNarratorPass();
        } else if (machine.state === 'vote') {
          machine.transition('vote-pass');
          showVotePass();
        } else if (machine.state === 'answer') {
          machine.transition('answer-pass');
          showAnswerPass();
        }
      }
    });

    reset();
  }
});

registerGame(plugin, { source: 'v10' });
export default plugin;
