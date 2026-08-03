import { ICONS } from './lobby.js';

const COLORS = ['#ff667f','#7d62f4','#2dc7a6','#f2ae45','#4d9de0','#da67cf','#8bc34a','#ff8a55','#6f7bf7','#f25f9d','#44b7c8','#c48bff'];
const LEVEL_LABELS = { 1:'轻松', 2:'标准', 3:'大胆', 4:'成人刺激' };
const PIP_POSITIONS = {
  1:['mc'],
  2:['tl','br'],
  3:['tl','mc','br'],
  4:['tl','tr','bl','br'],
  5:['tl','tr','mc','bl','br'],
  6:['tl','ml','bl','tr','mr','br']
};
const FACE_ROTATION = {
  1:{ x:0,y:0 },
  2:{ x:-90,y:0 },
  3:{ x:0,y:-90 },
  4:{ x:0,y:90 },
  5:{ x:90,y:0 },
  6:{ x:0,y:180 }
};

const registry = new Map();

export function registerGame(plugin) {
  if (!plugin?.id || registry.has(plugin.id)) throw new Error(`游戏插件 ID 冲突：${plugin?.id}`);
  registry.set(plugin.id, Object.freeze(plugin));
  return plugin;
}

export function getGames() {
  return [...registry.values()];
}

export function getGame(id) {
  return registry.get(id) || null;
}

export function createFeedback(store) {
  let audioContext = null;

  const audio = () => {
    if (!store.getState().soundEnabled) return null;
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  };

  const tone = (frequency, duration = .05, volume = .02, type = 'sine', delay = 0) => {
    const context = audio();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  };

  return {
    ui() { tone(480,.045,.018); },
    roll() { [0,.07,.14,.21].forEach((delay,index) => tone(180 + index * 38,.045,.018,'square',delay)); },
    land(score) { tone(310 + score * 35,.11,.035,'triangle'); },
    spinStart() { tone(170,.12,.025,'sawtooth'); tone(260,.1,.018,'triangle',.08); },
    tick(progress) { tone(720 - progress * 230,.025,.012 + progress * .009,'square'); },
    reveal() { tone(392,.16,.03,'triangle'); tone(523,.22,.028,'triangle',.08); tone(659,.25,.022,'sine',.16); },
    vibrate(pattern) {
      if (!store.getState().hapticsEnabled || !navigator.vibrate) return;
      navigator.vibrate(pattern);
    }
  };
}

export function openGameSheet({ root, game, store, onClose, onStart, showToast }) {
  const activeCount = store.activePlayers().length;
  const state = store.getState();
  const config = {
    ...structuredClone(game.defaultConfig || {}),
    intensity: state.intensity
  };

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<section class="sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(game.title)} 设置"></section>`;
  root.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const sheet = overlay.querySelector('.sheet');

  const render = () => {
    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-title-row">
        <div class="game-icon" style="--game-color:${game.color}">${ICONS[game.icon]}</div>
        <div>
          <h2>${escapeHtml(game.title)}</h2>
          <div class="sheet-subtitle">${escapeHtml(game.playersLabel)} · ${escapeHtml(game.timeLabel)}${game.supportsAdult ? ' · 支持成人档' : ''}</div>
        </div>
      </div>

      <p class="sheet-copy">${escapeHtml(game.rules)}</p>

      <div class="rule-box">
        <h3>本场规则</h3>
        <div class="rule-row"><span>当前玩家</span><strong>${activeCount} 人在场</strong></div>
        <div class="rule-row"><span>手机使用方式</span><strong>${escapeHtml(game.phoneMode)}</strong></div>
        <div class="rule-row"><span>主要结果</span><strong>${escapeHtml(game.resultMode)}</strong></div>
      </div>

      <div class="settings-label">游戏设置</div>
      ${renderSpecificSettings(game, config)}

      ${game.supportsQuestions ? renderIntensity(config.intensity, game.supportsAdult) : ''}

      ${activeCount < game.minPlayers
        ? `<div class="inline-warning">当前只有 ${activeCount} 位在场玩家，本玩法至少需要 ${game.minPlayers} 人。请先在玩家管理中恢复或增加玩家。</div>`
        : ''}

      ${game.implemented
        ? `<button class="primary-button" type="button" data-start-game ${activeCount < game.minPlayers ? 'disabled' : ''}>开始 ${escapeHtml(game.title)}</button>`
        : `<button class="primary-button" type="button" disabled>玩法逻辑将在后续版本接入</button>`}
      <button class="secondary-button" type="button" data-close-sheet style="margin-top:8px">返回游戏大厅</button>
    `;

    bindSettingEvents();
  };

  const bindSettingEvents = () => {
    sheet.querySelectorAll('[data-config]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.config;
        const value = parseConfigValue(button.dataset.value);
        config[key] = value;
        render();
      });
    });

    const timeInput = sheet.querySelector('[data-time-input]');
    if (timeInput) {
      const updateTime = (value) => {
        config.seconds = Math.min(60, Math.max(3, Number(value) || 5));
        render();
      };
      sheet.querySelector('[data-time-minus]')?.addEventListener('click', () => updateTime(config.seconds - 1));
      sheet.querySelector('[data-time-plus]')?.addEventListener('click', () => updateTime(config.seconds + 1));
      timeInput.addEventListener('change', () => updateTime(timeInput.value));
    }

    sheet.querySelectorAll('[data-intensity]').forEach((button) => {
      button.addEventListener('click', () => {
        const level = Number(button.dataset.intensity);
        if (level === 4 && !hasAdultConsent()) {
          const accepted = window.confirm('确认所有参与者均已年满 18 岁，并同意在任何互动前再次确认自愿参与？');
          if (!accepted) return;
          rememberAdultConsent();
        }
        config.intensity = level;
        render();
      });
    });

    sheet.querySelector('[data-start-game]')?.addEventListener('click', () => {
      store.setIntensity(config.intensity || state.intensity);
      close();
      onStart(game, config);
    });
  };

  const close = () => {
    overlay.classList.remove('show');
    window.setTimeout(() => overlay.remove(), 220);
    onClose?.();
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-close-sheet]')) close();
  });

  render();
  return close;
}

function renderSpecificSettings(game, config) {
  if (game.id === 'dice') {
    return `
      <div class="setting">
        <div class="setting-head"><span>输家规则</span><strong>${config.rule === 'max' ? '最大点数输' : '最小点数输'}</strong></div>
        <div class="segmented">
          <button type="button" data-config="rule" data-value="max" class="${config.rule === 'max' ? 'active' : ''}">最大点数输</button>
          <button type="button" data-config="rule" data-value="min" class="${config.rule === 'min' ? 'active' : ''}">最小点数输</button>
        </div>
      </div>`;
  }

  if (game.id === 'most-likely') {
    return `
      <div class="setting">
        <div class="setting-head"><span>并列规则</span><strong>${config.tieRule === 'random' ? '随机一人' : '全部接受'}</strong></div>
        <div class="segmented">
          <button type="button" data-config="tieRule" data-value="random" class="${config.tieRule === 'random' ? 'active' : ''}">随机一人</button>
          <button type="button" data-config="tieRule" data-value="all" class="${config.tieRule === 'all' ? 'active' : ''}">全部接受</button>
        </div>
      </div>`;
  }

  if (game.id === 'would-rather') {
    const labels = { minority:'少数派', majority:'多数派', explain:'随机解释' };
    return `
      <div class="setting">
        <div class="setting-head"><span>结算规则</span><strong>${labels[config.settleRule]}</strong></div>
        <div class="segmented">
          ${Object.entries(labels).map(([value,label]) => `<button type="button" data-config="settleRule" data-value="${value}" class="${config.settleRule === value ? 'active' : ''}">${label}</button>`).join('')}
        </div>
      </div>`;
  }

  if (game.id === 'five-second') {
    return `
      <div class="setting">
        <div class="setting-head">
          <span>挑战时长</span>
          <div class="stepper">
            <button type="button" data-time-minus>−</button>
            <input data-time-input type="number" min="3" max="60" value="${config.seconds}" aria-label="挑战时长">
            <button type="button" data-time-plus>＋</button>
          </div>
        </div>
        <div class="preset-row">
          ${[5,10,15,30].map((seconds) => `<button type="button" data-config="seconds" data-value="${seconds}" class="${config.seconds === seconds ? 'active' : ''}">${seconds} 秒</button>`).join('')}
        </div>
      </div>`;
  }

  if (game.id === 'hot-potato') {
    const durations = {
      short:{ label:'短局', detail:'30–60秒' },
      standard:{ label:'标准', detail:'60–120秒' },
      long:{ label:'长局', detail:'120–180秒' }
    };
    return `
      <div class="setting">
        <div class="setting-head"><span>炸弹时长</span><strong>${durations[config.duration].label}</strong></div>
        <div class="preset-row rich">
          ${Object.entries(durations).map(([value,item]) => `
            <button type="button" data-config="duration" data-value="${value}" class="${config.duration === value ? 'active' : ''}">
              <span>${item.label}</span><small>${item.detail}</small>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="setting">
        <div class="setting-head"><span>传递方向</span><strong>${config.direction === 'clockwise' ? '顺时针' : config.direction === 'counter' ? '逆时针' : '随机'}</strong></div>
        <div class="segmented">
          <button type="button" data-config="direction" data-value="clockwise" class="${config.direction === 'clockwise' ? 'active' : ''}">顺时针</button>
          <button type="button" data-config="direction" data-value="counter" class="${config.direction === 'counter' ? 'active' : ''}">逆时针</button>
          <button type="button" data-config="direction" data-value="random" class="${config.direction === 'random' ? 'active' : ''}">随机</button>
        </div>
      </div>`;
  }

  if (game.id === 'undercover') {
    return `
      <div class="setting">
        <div class="setting-head"><span>卧底人数</span><strong>${config.spyCount} 人</strong></div>
        <div class="segmented">
          ${[1,2,3].map((count) => `<button type="button" data-config="spyCount" data-value="${count}" class="${config.spyCount === count ? 'active' : ''}">${count} 人</button>`).join('')}
        </div>
      </div>
      <div class="setting">
        <div class="setting-head"><span>空白牌</span><strong>${config.blankCard ? '开启' : '关闭'}</strong></div>
        <div class="segmented">
          <button type="button" data-config="blankCard" data-value="false" class="${!config.blankCard ? 'active' : ''}">关闭</button>
          <button type="button" data-config="blankCard" data-value="true" class="${config.blankCard ? 'active' : ''}">开启</button>
        </div>
      </div>`;
  }

  if (game.id === 'king') {
    return `
      <div class="setting">
        <div class="setting-head"><span>指令来源</span><strong>${config.commandSource === 'random' ? '随机题库' : '国王自定'}</strong></div>
        <div class="segmented">
          <button type="button" data-config="commandSource" data-value="random" class="${config.commandSource === 'random' ? 'active' : ''}">随机题库</button>
          <button type="button" data-config="commandSource" data-value="custom" class="${config.commandSource === 'custom' ? 'active' : ''}">国王自定</button>
        </div>
      </div>`;
  }

  return '';
}

function renderIntensity(selected, supportsAdult) {
  const options = [
    { level:1,label:'轻松' },
    { level:2,label:'标准' },
    { level:3,label:'大胆' },
    ...(supportsAdult ? [{ level:4,label:'18+' }] : [])
  ];
  return `
    <div class="setting">
      <div class="setting-head"><span>内容尺度</span><strong>${LEVEL_LABELS[selected]}</strong></div>
      <div class="segmented">
        ${options.map((option) => `<button type="button" data-intensity="${option.level}" class="${selected === option.level ? 'active' : ''}">${option.label}</button>`).join('')}
      </div>
    </div>`;
}

function hasAdultConsent() {
  try { return sessionStorage.getItem('mingyun.adult-consent') === 'yes'; } catch { return false; }
}
function rememberAdultConsent() {
  try { sessionStorage.setItem('mingyun.adult-consent','yes'); } catch {}
}

function parseConfigValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function createPunishmentPresenter({ root, loader, feedback, showToast }) {
  let currentOverlay = null;

  const close = () => {
    currentOverlay?.remove();
    currentOverlay = null;
  };

  const present = async ({ loser, level, onAgain }) => {
    close();
    const overlay = document.createElement('div');
    overlay.className = 'result-overlay';
    root.appendChild(overlay);
    currentOverlay = overlay;

    let currentType = secureRandomInt(2) === 0 ? 'truth' : 'dare';
    let currentQuestion = null;

    const render = (loading = false, error = null) => {
      overlay.innerHTML = `
        <section class="result-sheet" role="dialog" aria-modal="true" aria-label="惩罚结果">
          <div class="sheet-handle"></div>
          <div class="result-kicker">命运选中了</div>
          <h2>${escapeHtml(loser.name)}</h2>
          <span class="punishment-type ${currentType === 'dare' ? 'dare' : ''} ${level === 4 ? 'adult' : ''}">
            ${currentType === 'truth' ? '真心话' : '大冒险'} · ${LEVEL_LABELS[level]}
          </span>
          <p class="punishment-text ${loading ? 'loading' : ''}">
            ${loading ? '正在加载题库…' : error ? escapeHtml(error) : escapeHtml(currentQuestion?.text || '暂无题目')}
          </p>
          <div class="type-switch">
            <button type="button" data-punishment-type="truth" class="${currentType === 'truth' ? 'active' : ''}">换成真心话</button>
            <button type="button" data-punishment-type="dare" class="${currentType === 'dare' ? 'active' : ''}">换成大冒险</button>
          </div>
          <div class="result-actions">
            <button type="button" data-new-question>换一题</button>
            <button type="button" class="again" data-play-again>再来一轮</button>
          </div>
          <p class="consent-note">${level === 4
            ? '仅限成年人自愿参与；任何互动都需要明确同意，不舒服可直接换题。'
            : '不舒服就直接换题，不需要解释。'}</p>
        </section>
      `;
    };

    const load = async (forcedType = currentType) => {
      currentType = forcedType;
      render(true);
      try {
        currentQuestion = await loader.draw({ level, type: currentType });
        render(false);
        document.querySelector('#liveRegion').textContent = `新题目：${currentQuestion.text}`;
      } catch (error) {
        console.error(error);
        render(false, '题库加载失败，请检查部署路径或网络后重试。');
        showToast('题库加载失败');
      }
    };

    overlay.addEventListener('click', (event) => {
      const typeButton = event.target.closest('[data-punishment-type]');
      if (typeButton) load(typeButton.dataset.punishmentType);
      if (event.target.closest('[data-new-question]')) load(currentType);
      if (event.target.closest('[data-play-again]')) {
        close();
        onAgain?.();
      }
    });

    feedback.reveal();
    feedback.vibrate([28,45,70]);
    await load();
  };

  return { present, close };
}

function createDicePlugin() {
  return {
    id:'dice',
    title:'命运骰局',
    description:'轮流投骰，自动判定本轮惩罚玩家。',
    playersLabel:'2–12人',
    minPlayers:2,
    maxPlayers:12,
    timeLabel:'1–3 分钟',
    icon:'dice',
    color:'#a78bfa',
    supportsAdult:true,
    supportsQuestions:true,
    implemented:true,
    phoneMode:'主持人操作即可',
    resultMode:'选出本轮惩罚玩家',
    rules:'玩家依次投骰，全部完成后按设定规则自动判定输家；并列时随机决胜。',
    defaultConfig:{ rule:'max', intensity:2 },
    mount:createDiceGame
  };
}

function createWheelPlugin() {
  return {
    id:'wheel',
    title:'命运转盘',
    description:'转盘随机锁定一位玩家并揭晓惩罚。',
    playersLabel:'2–12人',
    minPlayers:2,
    maxPlayers:12,
    timeLabel:'约 30 秒',
    icon:'wheel',
    color:'#f472b6',
    supportsAdult:true,
    supportsQuestions:true,
    implemented:true,
    phoneMode:'主持人操作即可',
    resultMode:'选出本轮惩罚玩家',
    rules:'所有在场玩家均分转盘扇区，转动停止后指针所在玩家接受惩罚。',
    defaultConfig:{ intensity:2 },
    mount:createWheelGame
  };
}

function placeholderPlugin(data) {
  return {
    implemented:false,
    supportsQuestions:true,
    defaultConfig:{ intensity:2, ...(data.defaultConfig || {}) },
    phoneMode:'主持人操作即可',
    resultMode:'选出本轮惩罚玩家',
    ...data
  };
}

registerGame(createDicePlugin());
registerGame(createWheelPlugin());
registerGame(placeholderPlugin({
  id:'most-likely',title:'谁最可能',description:'全员同时指人，得票最多者接受惩罚。',
  playersLabel:'3–12人',minPlayers:3,maxPlayers:12,timeLabel:'30–60 秒',icon:'vote',color:'#22d3ee',
  supportsAdult:true,rules:'读出题目后所有人同时指出最符合的人，由主持人在手机上登记结果。',
  defaultConfig:{ tieRule:'random' }
}));
registerGame(placeholderPlugin({
  id:'would-rather',title:'二选一',description:'站队 A 或 B，再按规则决定本轮玩家。',
  playersLabel:'2–12人',minPlayers:2,maxPlayers:12,timeLabel:'30–90 秒',icon:'split',color:'#60a5fa',
  supportsAdult:true,rules:'所有玩家在两个选项中选择其一，系统按少数派、多数派或解释模式结算。',
  defaultConfig:{ settleRule:'minority' }
}));
registerGame(placeholderPlugin({
  id:'five-second',title:'五秒挑战',description:'倒计时内完成题目，时间可自由设置。',
  playersLabel:'2–12人',minPlayers:2,maxPlayers:12,timeLabel:'3–60 秒',icon:'timer',color:'#fbbf24',
  supportsAdult:true,rules:'当前玩家在设定时间内完成挑战，由其他玩家判断成功或失败。',
  defaultConfig:{ seconds:5 }
}));
registerGame(placeholderPlugin({
  id:'hot-potato',title:'炸弹传递',description:'回答后传递手机，引爆时持有者接受惩罚。',
  playersLabel:'3–12人',minPlayers:3,maxPlayers:12,timeLabel:'1–3 分钟',icon:'bomb',color:'#fb7185',
  supportsAdult:true,phoneMode:'需要轮流传递',rules:'炸弹会在不可见的随机时间引爆。回答后点击传递并把手机交给下一位；不要抛掷手机。',
  defaultConfig:{ duration:'standard', direction:'clockwise' }
}));
registerGame(placeholderPlugin({
  id:'undercover',title:'谁是卧底',description:'查看身份、轮流描述、投票找出卧底。',
  playersLabel:'4–12人',minPlayers:4,maxPlayers:12,timeLabel:'8–20 分钟',icon:'mask',color:'#34d399',
  supportsAdult:false,supportsQuestions:false,phoneMode:'需要轮流传递',resultMode:'阵营胜负',
  rules:'经典推理玩法。设置卧底人数与词库难度后即可开始。',
  defaultConfig:{ spyCount:1, blankCard:false }
}));
registerGame(placeholderPlugin({
  id:'king',title:'国王游戏',description:'随机抽取国王和号码，发布本轮指令。',
  playersLabel:'3–12人',minPlayers:3,maxPlayers:12,timeLabel:'2–5 分钟',icon:'crown',color:'#f59e0b',
  supportsAdult:true,phoneMode:'需要轮流查看号码',rules:'每位玩家获得隐藏号码，其中一人成为国王，由国王指定号码完成任务。',
  defaultConfig:{ commandSource:'random' }
}));

function createDiceGame(container, context) {
  const players = context.store.activePlayers().map((player) => ({ ...player, score:null }));
  const config = context.config;
  let turn = 0;
  let round = 1;
  let busy = false;
  let loser = null;
  let selectedIndex = null;
  let dieX = -18;
  let dieY = 28;
  let dieFace = 1;
  let destroyed = false;

  const render = () => {
    container.innerHTML = `
      <section class="game-stage">
        <div class="game-head">
          <div><small>ROUND ${String(round).padStart(2,'0')}</small><h1>命运骰局</h1></div>
          <span class="rule-pill">${config.rule === 'max' ? '最大点数输' : '最小点数输'}</span>
        </div>
        <div class="player-track">
          ${players.map((player,index) => `
            <div class="player-chip ${!loser && index === turn ? 'current' : ''} ${player.score ? 'done' : ''} ${selectedIndex === index ? 'selected' : ''} ${selectedIndex !== null && selectedIndex !== index ? 'dimmed' : ''}">
              <span>${escapeHtml(player.name)}</span><strong>${player.score ?? '—'}</strong>
            </div>
          `).join('')}
        </div>
        <section class="dice-board">
          <p class="turn-label">${loser ? `本轮输家：<strong>${escapeHtml(loser.name)}</strong>` : `轮到 <strong>${escapeHtml(players[turn].name)}</strong>`}</p>
          <div class="dice-scene" aria-label="骰子点数 ${dieFace}">
            <div id="diceCube" class="dice-cube" style="--rx:${dieX}deg;--ry:${dieY}deg">${renderDieFaces()}</div>
            <div class="dice-shadow"></div>
          </div>
          ${loser
            ? '<button class="roll-button" type="button" data-show-punishment>查看惩罚</button>'
            : `<button class="roll-button" type="button" data-roll ${busy ? 'disabled' : ''}>${busy ? '投掷中…' : '投骰子'}</button>`}
          <p class="dice-hint">每位玩家只有一次机会；并列点数将随机决胜。</p>
        </section>
      </section>
    `;
  };

  const resetRound = () => {
    players.forEach((player) => { player.score = null; });
    turn = 0;
    round += 1;
    loser = null;
    selectedIndex = null;
    render();
  };

  const showPunishment = () => context.punishment.present({
    loser,
    level:config.intensity,
    onAgain:resetRound
  });

  const roll = async () => {
    if (busy || loser || destroyed) return;
    busy = true;
    render();
    const cube = container.querySelector('#diceCube');
    context.feedback.roll();
    context.feedback.vibrate([16,24,16]);
    const score = secureRandomInt(6) + 1;
    const target = FACE_ROTATION[score];
    const startX = dieX;
    const startY = dieY;
    const endX = nextMatchingAngle(startX,target.x,2 + secureRandomInt(2));
    const endY = nextMatchingAngle(startY,target.y,3 + secureRandomInt(2));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 140 : 1050;

    await animateRaf(duration,(time) => {
      if (!cube || destroyed) return;
      const eased = 1 - Math.pow(1 - time,4);
      const wobble = reduced ? 0 : Math.sin(time * Math.PI * 9) * (1 - time) * 5;
      cube.style.setProperty('--rx',`${startX + (endX - startX) * eased + wobble}deg`);
      cube.style.setProperty('--ry',`${startY + (endY - startY) * eased - wobble * .7}deg`);
    });

    if (destroyed) return;
    dieX = endX;
    dieY = endY;
    dieFace = score;
    players[turn].score = score;
    busy = false;
    context.feedback.land(score);
    context.feedback.vibrate(18);

    if (turn === players.length - 1) {
      const scores = players.map((player) => player.score);
      const targetScore = config.rule === 'max' ? Math.max(...scores) : Math.min(...scores);
      const candidates = players.map((player,index) => ({ player,index })).filter(({ player }) => player.score === targetScore);
      const chosen = candidates[secureRandomInt(candidates.length)];
      loser = chosen.player;
      selectedIndex = chosen.index;
      context.feedback.reveal();
      context.feedback.vibrate([28,45,70]);
      document.querySelector('#liveRegion').textContent = `本轮输家是 ${loser.name}`;
    } else {
      turn += 1;
    }
    render();
  };

  const click = (event) => {
    if (event.target.closest('[data-roll]')) roll();
    if (event.target.closest('[data-show-punishment]')) showPunishment();
  };

  container.addEventListener('click',click);
  render();

  return () => {
    destroyed = true;
    container.removeEventListener('click',click);
  };
}

function createWheelGame(container, context) {
  const players = context.store.activePlayers().map((player) => ({ ...player }));
  const config = context.config;
  let round = 1;
  let rotation = 0;
  let busy = false;
  let selectedIndex = null;
  let loser = null;
  let destroyed = false;
  let revealTimer = 0;

  const render = () => {
    const step = 360 / players.length;
    container.innerHTML = `
      <section class="game-stage">
        <div class="game-head">
          <div><small>ROUND ${String(round).padStart(2,'0')}</small><h1>命运转盘</h1></div>
          <span class="rule-pill">${players.length} 位玩家</span>
        </div>
        <section class="wheel-zone">
          <div id="wheelStage" class="wheel-stage ${busy ? 'is-spinning' : ''}">
            <div class="wheel-glow"></div>
            <div class="wheel-rim"></div>
            <div id="wheelRotor" class="wheel-rotor" style="--rotation:${rotation}deg;background:${wheelGradient(players)}">
              ${wheelLabels(players)}
            </div>
            <button id="wheelCenter" class="wheel-center" type="button" data-spin ${busy ? 'disabled' : ''}><span>${busy ? '转动中' : 'SPIN'}</span></button>
            <div id="wheelPointer" class="wheel-pointer"></div>
          </div>
          <p id="wheelStatus" class="wheel-status">${loser ? `命运选中了 <strong>${escapeHtml(loser.name)}</strong>` : busy ? '转盘正在寻找今晚的幸运儿…' : '点击中心或下方按钮开始转动'}</p>
          <div class="wheel-player-list">
            ${players.map((player,index) => `
              <span class="wheel-player-chip ${selectedIndex === index ? 'selected' : ''} ${selectedIndex !== null && selectedIndex !== index ? 'dimmed' : ''}" style="--chip-color:${COLORS[index % COLORS.length]}">
                <b>${index + 1}</b><span>${escapeHtml(player.name)}</span>
              </span>
            `).join('')}
          </div>
        </section>
        <button class="primary-button wheel-cta" type="button" data-spin ${busy ? 'disabled' : ''}>${busy ? '命运转动中…' : '转动转盘'}</button>
      </section>
    `;
  };

  const resetRound = () => {
    selectedIndex = null;
    loser = null;
    round += 1;
    render();
  };

  const spin = async () => {
    if (busy || destroyed) return;
    busy = true;
    selectedIndex = null;
    loser = null;
    render();
    context.feedback.spinStart();

    const rotor = container.querySelector('#wheelRotor');
    const count = players.length;
    const step = 360 / count;
    const chosenIndex = secureRandomInt(count);
    const targetMod = mod(-(chosenIndex * step + step / 2),360);
    const current = rotation;
    const deltaToTarget = mod(targetMod - mod(current,360),360);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const totalDelta = (reduced ? 1 : 6 + secureRandomInt(3)) * 360 + deltaToTarget;
    const duration = reduced ? 520 : 5000 + secureRandomInt(850);
    let previousSector = sectorAtRotation(current,step,count);
    let lastTickAt = 0;

    rotor.classList.add('is-spinning');
    await animateRaf(duration,(time) => {
      if (destroyed || !rotor) return;
      const progress = spinProgress(time);
      let settle = 0;
      if (!reduced && time > .88) {
        const unit = (time - .88) / .12;
        settle = Math.sin(unit * Math.PI * 3) * Math.pow(1 - unit,2) * 1.35;
      }
      const angle = current + totalDelta * progress + settle;
      rotor.style.transform = `rotate(${angle}deg)`;
      const sector = sectorAtRotation(angle,step,count);
      const now = performance.now();
      if (sector !== previousSector && now - lastTickAt > 42) {
        previousSector = sector;
        lastTickAt = now;
        const pointer = container.querySelector('#wheelPointer');
        if (pointer) {
          pointer.classList.remove('tick');
          void pointer.offsetWidth;
          pointer.classList.add('tick');
        }
        if (time > .42) context.feedback.tick(time);
        if (time > .62) context.feedback.vibrate(5);
      }
    });

    if (destroyed) return;
    rotation = current + totalDelta;
    busy = false;
    selectedIndex = chosenIndex;
    loser = players[chosenIndex];
    render();
    context.feedback.reveal();
    context.feedback.vibrate([30,45,75]);
    document.querySelector('#liveRegion').textContent = `转盘选中了 ${loser.name}`;

    revealTimer = window.setTimeout(() => {
      if (destroyed) return;
      context.punishment.present({ loser, level:config.intensity, onAgain:resetRound });
    }, reduced ? 120 : 720);
  };

  const click = (event) => {
    if (event.target.closest('[data-spin]')) spin();
  };

  container.addEventListener('click',click);
  render();

  return () => {
    destroyed = true;
    clearTimeout(revealTimer);
    container.removeEventListener('click',click);
  };
}

function renderDieFaces() {
  return [1,2,3,4,5,6].map((face) => `
    <div class="dice-face face-${face}">
      ${PIP_POSITIONS[face].map((position) => `<span class="pip p-${position}"></span>`).join('')}
    </div>
  `).join('');
}

function wheelGradient(players) {
  const step = 360 / players.length;
  return `conic-gradient(${players.map((_,index) => `${COLORS[index % COLORS.length]} ${index * step}deg ${(index + 1) * step}deg`).join(',')})`;
}

function wheelLabels(players) {
  const count = players.length;
  const step = 360 / count;
  const radius = count > 9 ? 31 : 33;
  return players.map((_,index) => {
    const angle = index * step + step / 2;
    const radians = angle * Math.PI / 180;
    const x = 50 + radius * Math.sin(radians);
    const y = 50 - radius * Math.cos(radians);
    return `<span class="wheel-label" style="--x:${x}%;--y:${y}%;transform:translate(-50%,-50%) rotate(${-angle}deg)">${index + 1}</span>`;
  }).join('');
}

function animateRaf(duration,onFrame) {
  const startedAt = performance.now();
  return new Promise((resolve) => {
    const frame = (now) => {
      const progress = Math.min(1,Math.max(0,(now - startedAt) / duration));
      onFrame(progress);
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

function nextMatchingAngle(start,targetMod,extraTurns) {
  const base = start + extraTurns * 360;
  return base + mod(targetMod - mod(base,360),360);
}

function spinProgress(time) {
  const accelTime = .14;
  const cruiseTime = .22;
  const decelTime = .64;
  const accelDistance = .1555555556;
  const cruiseDistance = .4888888889;
  const decelDistance = .3555555555;
  if (time < accelTime) {
    const unit = time / accelTime;
    return accelDistance * unit * unit;
  }
  if (time < accelTime + cruiseTime) {
    const unit = (time - accelTime) / cruiseTime;
    return accelDistance + cruiseDistance * unit;
  }
  const unit = (time - accelTime - cruiseTime) / decelTime;
  return accelDistance + cruiseDistance + decelDistance * (1 - Math.pow(1 - unit,4));
}

function sectorAtRotation(angle,step,count) {
  return Math.floor(mod(-angle,360) / step) % count;
}

function secureRandomInt(max) {
  if (max <= 0) return 0;
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return Math.floor((values[0] / 4294967296) * max);
  }
  return Math.floor(Math.random() * max);
}

function mod(value,divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
