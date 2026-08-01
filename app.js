(() => {
  'use strict';

  const view = document.querySelector('#view');
  const backButton = document.querySelector('#backButton');
  const soundButton = document.querySelector('#soundButton');
  const installButton = document.querySelector('#installButton');
  const networkBadge = document.querySelector('#networkBadge');
  const toast = document.querySelector('#toast');
  const liveRegion = document.querySelector('#liveRegion');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const COLORS = ['#ff667f', '#7d62f4', '#2dc7a6', '#f2ae45', '#4d9de0', '#da67cf', '#8bc34a', '#ff8a55', '#6f7bf7', '#f25f9d', '#44b7c8', '#c48bff'];
  const LEVEL_LABELS = { 1: '轻松', 2: '标准', 3: '大胆' };
  const PLAYER_COUNT_OPTIONS = Array.from({ length: 11 }, (_, index) => index + 2);
  const RANDOM_PLAYER_NAMES = [
    '闪电', '月亮', '橘子', '船长', '奶糖', '星星', '狐狸', '柠檬',
    '可乐', '企鹅', '桃子', '小熊', '云朵', '松鼠', '布丁', '海盐',
    '火箭', '草莓', '咖啡', '鲸鱼', '团子', '椰子', '猫咪', '晚风'
  ];

  const PUNISHMENTS = {
    truth: [
      { id: 't101', level: 1, text: '今天发生过最让你开心的一件小事是什么？' },
      { id: 't102', level: 1, text: '你最想立刻学会的一项技能是什么？' },
      { id: 't103', level: 1, text: '最近反复听的一首歌是什么？' },
      { id: 't104', level: 1, text: '如果明天不用工作，你会怎样安排一天？' },
      { id: 't105', level: 1, text: '你小时候最相信、现在觉得最好笑的事情是什么？' },
      { id: 't106', level: 1, text: '你最满意自己身上的哪个优点？' },
      { id: 't107', level: 1, text: '现场谁最适合一起旅行？为什么？' },
      { id: 't108', level: 1, text: '你手机里使用时间最长的应用是什么？' },
      { id: 't109', level: 1, text: '你最想重新体验一次的快乐记忆是什么？' },
      { id: 't110', level: 1, text: '如果能养一种不受现实限制的宠物，你会选什么？' },
      { id: 't111', level: 1, text: '你最喜欢别人怎样称赞你？' },
      { id: 't112', level: 1, text: '你做过最有仪式感的一件事是什么？' },
      { id: 't113', level: 1, text: '最近一次让你笑到停不下来是因为什么？' },
      { id: 't114', level: 1, text: '你最离不开的一件日常用品是什么？' },
      { id: 't115', level: 1, text: '如果能立即去一个城市住一个月，你会去哪？' },
      { id: 't116', level: 1, text: '你觉得自己最像哪种动物？为什么？' },
      { id: 't117', level: 1, text: '你最想保留到老年的一个习惯是什么？' },
      { id: 't118', level: 1, text: '现场谁的穿搭最符合你的审美？' },

      { id: 't201', level: 2, text: '你最近一次假装没事，其实心里很在意的事情是什么？' },
      { id: 't202', level: 2, text: '你曾经对一个人的第一印象错得有多离谱？' },
      { id: 't203', level: 2, text: '你最想改掉但一直没改掉的习惯是什么？' },
      { id: 't204', level: 2, text: '你做过最冲动的一次决定是什么？' },
      { id: 't205', level: 2, text: '你人生中最尴尬的一次公开场面是什么？' },
      { id: 't206', level: 2, text: '你最害怕被别人误解成怎样的人？' },
      { id: 't207', level: 2, text: '现场谁最可能在关键时刻保持冷静？' },
      { id: 't208', level: 2, text: '如果能删除一段记忆，你会删除哪一段？' },
      { id: 't209', level: 2, text: '你最后悔没有及时说出口的一句话是什么？' },
      { id: 't210', level: 2, text: '你对朋友撒过最无伤大雅的谎是什么？' },
      { id: 't211', level: 2, text: '你最不能接受别人触碰你的哪条边界？' },
      { id: 't212', level: 2, text: '你曾经为了融入群体做过什么违心的事？' },
      { id: 't213', level: 2, text: '哪一次失败对你的影响最大？' },
      { id: 't214', level: 2, text: '你认为自己在人际关系里最大的弱点是什么？' },
      { id: 't215', level: 2, text: '你最近羡慕过谁？羡慕对方什么？' },
      { id: 't216', level: 2, text: '现场谁最适合成为你的工作搭档？' },
      { id: 't217', level: 2, text: '如果必须向现场一人道歉，你会选谁、为什么？' },
      { id: 't218', level: 2, text: '你最想证明给某个人看的一件事是什么？' },

      { id: 't301', level: 3, text: '现场谁最接近你的理想型？可以只说特质。' },
      { id: 't302', level: 3, text: '你有没有喜欢过一个不该喜欢的人？' },
      { id: 't303', level: 3, text: '你最近一次心动是什么时候、因为什么？' },
      { id: 't304', level: 3, text: '你在感情中最容易重复犯什么错误？' },
      { id: 't305', level: 3, text: '你有没有错过一个现在想来很可惜的人？' },
      { id: 't306', level: 3, text: '你最怕伴侣发现自己的哪一面？' },
      { id: 't307', level: 3, text: '你曾经因为嫉妒做过什么不太理智的事？' },
      { id: 't308', level: 3, text: '如果可以匿名问前任一个问题，你会问什么？' },
      { id: 't309', level: 3, text: '你有没有明知道没有结果却仍然坚持过的关系？' },
      { id: 't310', level: 3, text: '你最难释怀的一次告别是什么？' },
      { id: 't311', level: 3, text: '你更害怕失去爱，还是失去自由？为什么？' },
      { id: 't312', level: 3, text: '你曾经偷偷比较过自己和谁？' },
      { id: 't313', level: 3, text: '你在亲密关系中最需要但最难开口的需求是什么？' },
      { id: 't314', level: 3, text: '你有没有故意冷落过一个其实很在意的人？' },
      { id: 't315', level: 3, text: '你最希望现场哪位玩家进一步了解你？' },
      { id: 't316', level: 3, text: '你曾经因为害怕失去而隐瞒过什么感受？' },
      { id: 't317', level: 3, text: '你认为自己最难被爱的一面是什么？' },
      { id: 't318', level: 3, text: '你现在最想对某个人说、但一直没说的话是什么？' }
    ],
    dare: [
      { id: 'd101', level: 1, text: '用三种不同情绪说一遍自己的名字。' },
      { id: 'd102', level: 1, text: '模仿一种动物，直到有人猜中。' },
      { id: 'd103', level: 1, text: '用播音员语气介绍现场所有玩家。' },
      { id: 'd104', level: 1, text: '摆出一个夸张的杂志封面姿势，坚持十秒。' },
      { id: 'd105', level: 1, text: '用方言或自创口音说一句欢迎词。' },
      { id: 'd106', level: 1, text: '在十秒内说出五种带颜色的东西。' },
      { id: 'd107', level: 1, text: '即兴表演十五秒无声电影。' },
      { id: 'd108', level: 1, text: '随机夸奖三位玩家，每人一句且不能重复。' },
      { id: 'd109', level: 1, text: '唱一小段你最熟悉的歌曲。' },
      { id: 'd110', level: 1, text: '用左手在空中写出自己的名字。' },
      { id: 'd111', level: 1, text: '模仿一个常见职业，让大家猜。' },
      { id: 'd112', level: 1, text: '一分钟内避免说“我”字。' },
      { id: 'd113', level: 1, text: '表演一个慢动作起床过程。' },
      { id: 'd114', level: 1, text: '用五个表情完成一段小剧情。' },
      { id: 'd115', level: 1, text: '把身边一件普通物品介绍成奢侈品。' },
      { id: 'd116', level: 1, text: '说一个冷笑话；没人笑也算完成。' },
      { id: 'd117', level: 1, text: '模仿现场一位玩家的标志性动作，保持友善。' },
      { id: 'd118', level: 1, text: '用广告配音方式推荐今晚的聚会。' },

      { id: 'd201', level: 2, text: '选择一位玩家，与对方进行十五秒不笑对视。' },
      { id: 'd202', level: 2, text: '让大家给你三个关键词，并立即编成一句自我介绍。' },
      { id: 'd203', level: 2, text: '即兴跳舞二十秒，其他人负责打拍子。' },
      { id: 'd204', level: 2, text: '演一段偶像剧式告白，对象可以是一件物品。' },
      { id: 'd205', level: 2, text: '选择一位玩家，认真说出对方三个优点。' },
      { id: 'd206', level: 2, text: '用夸张情绪朗读屏幕上的这条惩罚。' },
      { id: 'd207', level: 2, text: '让现场玩家为你设计一个新昵称，本轮内使用。' },
      { id: 'd208', level: 2, text: '用三十秒表演“迟到后努力解释”的场景。' },
      { id: 'd209', level: 2, text: '任选两位玩家，为他们即兴主持一场颁奖礼。' },
      { id: 'd210', level: 2, text: '接受大家指定的一个安全自拍表情，坚持十秒。' },
      { id: 'd211', level: 2, text: '模仿一位大家都认识的影视角色，直到猜中。' },
      { id: 'd212', level: 2, text: '用一句土味情话称赞右手边的玩家。' },
      { id: 'd213', level: 2, text: '用不同语气连续说三遍“这局不算”。' },
      { id: 'd214', level: 2, text: '让一位玩家给你出三个词，现场编成小故事。' },
      { id: 'd215', level: 2, text: '以天气预报的形式描述现场气氛。' },
      { id: 'd216', level: 2, text: '表演一段没有音乐的走秀。' },
      { id: 'd217', level: 2, text: '闭眼听三位玩家各说一句话，猜出是谁。' },
      { id: 'd218', level: 2, text: '选择一位玩家，交换座位并模仿对方一分钟。' },

      { id: 'd301', level: 3, text: '选择一位玩家，用三十秒认真说明你欣赏对方的地方。' },
      { id: 'd302', level: 3, text: '与一位自愿参加的玩家完成二十秒默契动作同步。' },
      { id: 'd303', level: 3, text: '让现场玩家各说一个词，组成一段即兴告白。' },
      { id: 'd304', level: 3, text: '选择一位玩家，互相说出对方给自己的第一印象。' },
      { id: 'd305', level: 3, text: '以“我一直没告诉大家”为开头，讲一件无伤大雅的小事。' },
      { id: 'd306', level: 3, text: '让一位玩家选择你的表演主题，即兴演三十秒。' },
      { id: 'd307', level: 3, text: '面对现场所有人，完成一段真诚的十秒感谢。' },
      { id: 'd308', level: 3, text: '任选一位玩家，给对方设计一句专属应援口号。' },
      { id: 'd309', level: 3, text: '用偶像剧主角的方式邀请一位玩家与你击掌。' },
      { id: 'd310', level: 3, text: '让大家投票选出你最适合的角色，并即兴表演。' },
      { id: 'd311', level: 3, text: '选择一位玩家，轮流说对方优点，先停顿超过三秒的人输。' },
      { id: 'd312', level: 3, text: '用三十秒讲述一次你真正感到骄傲的经历。' },
      { id: 'd313', level: 3, text: '让现场玩家替你设计一句个人宣言，并大声念出。' },
      { id: 'd314', level: 3, text: '选择一位玩家，合作完成一段十五秒即兴广告。' },
      { id: 'd315', level: 3, text: '认真看向镜头或大家，说一句你现在最需要听到的话。' },
      { id: 'd316', level: 3, text: '让大家指定一种情绪，你用这种情绪唱一句歌。' },
      { id: 'd317', level: 3, text: '选择一位玩家，互相为对方取一个只在今晚使用的称号。' },
      { id: 'd318', level: 3, text: '用发布会口吻宣布自己接下来一个月的小目标。' }
    ]
  };

  const PIP_POSITIONS = {
    1: ['mc'],
    2: ['tl', 'br'],
    3: ['tl', 'mc', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'mc', 'bl', 'br'],
    6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br']
  };

  const FACE_ROTATION = {
    1: { x: 0, y: 0 },
    2: { x: -90, y: 0 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    5: { x: 90, y: 0 },
    6: { x: 0, y: 180 }
  };

  const saved = readPrefs();
  const state = {
    route: 'home',
    game: null,
    count: clamp(Number(saved.count) || 4, 2, 12),
    rule: saved.rule === 'min' ? 'min' : 'max',
    intensity: clamp(Number(saved.intensity) || 2, 1, 3),
    players: [],
    nameDrafts: Array.isArray(saved.playerNames) ? saved.playerNames.slice(0, 12) : [],
    turn: 0,
    round: 1,
    busy: false,
    dieFace: 1,
    dieX: -18,
    dieY: 28,
    rotation: 0,
    selectedIndex: null,
    loser: null,
    punishment: null,
    showResult: false,
    recentPunishments: [],
    soundEnabled: saved.soundEnabled !== false
  };

  syncPlayers(state.count, state.nameDrafts);
  let deferredInstallPrompt = null;
  let audioContext = null;
  let toastTimer = 0;
  let revealTimer = 0;

  function readPrefs() {
    try {
      return JSON.parse(localStorage.getItem('party-game-prefs') || '{}');
    } catch {
      return {};
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem('party-game-prefs', JSON.stringify({
        count: state.count,
        rule: state.rule,
        intensity: state.intensity,
        soundEnabled: state.soundEnabled,
        playerNames: state.nameDrafts.slice(0, 12)
      }));
    } catch {
      // Storage can be unavailable in privacy modes; the game still works.
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mod(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function randomInt(max) {
    if (max <= 0) return 0;
    if (window.crypto?.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return Math.floor((array[0] / 4294967296) * max);
    }
    return Math.floor(Math.random() * max);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function playerName(index) {
    const value = state.players[index]?.name?.trim();
    return value || `玩家 ${index + 1}`;
  }

  function syncPlayers(count, seedNames = []) {
    state.players.forEach((player, index) => {
      state.nameDrafts[index] = player.name;
    });

    const next = [];
    for (let index = 0; index < count; index += 1) {
      const current = state.players[index];
      const cachedName = state.nameDrafts[index] ?? seedNames[index];
      next.push({
        id: index + 1,
        name: current?.name ?? cachedName ?? `玩家 ${index + 1}`,
        score: current?.score
      });
    }
    state.players = next;
    state.players.forEach((player, index) => {
      state.nameDrafts[index] = player.name;
    });
  }

  function randomizePlayerNames() {
    const pool = [...RANDOM_PLAYER_NAMES];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const target = randomInt(index + 1);
      [pool[index], pool[target]] = [pool[target], pool[index]];
    }
    state.players.forEach((player, index) => {
      player.name = pool[index] || `玩家 ${index + 1}`;
      state.nameDrafts[index] = player.name;
    });
    savePrefs();
    render();
    showToast('已生成一组随机昵称');
    playUiSound();
  }

  function resetPlayerNames() {
    state.players.forEach((player, index) => {
      player.name = `玩家 ${index + 1}`;
      state.nameDrafts[index] = player.name;
    });
    savePrefs();
    render();
    showToast('已恢复默认玩家名称');
    playUiSound();
  }

  function updateHeader() {
    const onHome = state.route === 'home';
    backButton.hidden = onHome;
    soundButton.classList.toggle('sound-muted', !state.soundEnabled);
    soundButton.setAttribute('aria-label', state.soundEnabled ? '关闭音效与触感' : '开启音效与触感');
  }

  function render() {
    updateHeader();
    clearTimeout(revealTimer);

    if (state.route === 'home') {
      view.innerHTML = renderHome();
    } else if (state.route.endsWith('-setup')) {
      view.innerHTML = renderSetup();
    } else if (state.route === 'dice-game') {
      view.innerHTML = renderDiceGame();
    } else if (state.route === 'wheel-game') {
      view.innerHTML = renderWheelGame();
    }

    view.classList.remove('screen-enter');
    requestAnimationFrame(() => view.classList.add('screen-enter'));
  }

  function renderHome() {
    return `
      <div class="hero">
        <div class="eyebrow">✦ FRIENDS · PARTY · RANDOM</div>
        <h1>今晚，<br><span>谁遭殃？</span></h1>
        <p class="hero-copy">两种随机玩法，一套真心话大冒险题库。选好人数，剩下交给命运。</p>
        <div class="hero-badges">
          <span class="mini-badge">2–12 人 · 单双数</span>
          <span class="mini-badge">离线可玩</span>
          <span class="mini-badge">安全自愿</span>
        </div>
        <div class="mode-grid">
          <button class="mode-card dice" type="button" data-action="open-setup" data-game="dice">
            <span class="mode-icon">⚄</span>
            <span><small>轮流投掷 · 比较点数</small><h2>命运骰局</h2><p>选择最大或最小点数，自动锁定本轮输家。</p></span>
            <span class="mode-arrow">›</span>
          </button>
          <button class="mode-card wheel" type="button" data-action="open-setup" data-game="wheel">
            <span class="mode-icon">↻</span>
            <span><small>惯性转动 · 随机停靠</small><h2>俄罗斯转盘</h2><p>转盘停在谁，谁接受随机惩罚。</p></span>
            <span class="mode-arrow">›</span>
          </button>
        </div>
        <p class="safety-note">任何玩家都可以跳过不舒服的题目；不设置饮酒、危险动作或强制隐私惩罚。</p>
      </div>`;
  }

  function renderSetup() {
    const dice = state.game === 'dice';
    const playerInputs = state.players.map((player, index) => `
      <label class="player-input">
        <span>P${index + 1}</span>
        <input type="text" maxlength="12" autocomplete="off" enterkeyhint="next" spellcheck="false" data-player-index="${index}" value="${escapeHtml(player.name)}" placeholder="玩家 ${index + 1}" aria-label="玩家 ${index + 1} 昵称">
      </label>`).join('');

    return `
      <div class="page-head">
        <div class="eyebrow">GAME SETUP</div>
        <h1>${dice ? '命运骰局' : '俄罗斯转盘'}</h1>
        <p>${dice ? '每个人依次投一次骰子，全部结束后自动判定输家。' : '转盘使用加速、巡航、惯性减速与临停回摆，最终精准锁定玩家。'}</p>
      </div>

      <section class="panel">
        <div class="panel-title"><span>参与人数</span><small>2–12 人，单双数均可</small></div>
        <div class="counter">
          <button type="button" data-action="change-count" data-delta="-1" aria-label="减少一人">−</button>
          <strong>${state.count}</strong>
          <button type="button" data-action="change-count" data-delta="1" aria-label="增加一人">＋</button>
        </div>
        <div class="quick-row count-grid" aria-label="快速选择参与人数">
          ${PLAYER_COUNT_OPTIONS.map((count) => `<button type="button" class="${state.count === count ? 'active' : ''}" data-action="set-count" data-count="${count}" aria-pressed="${state.count === count}">${count}</button>`).join('')}
        </div>
        <p class="helper count-helper">可直接选择 3、5、7、9、11 等单数人数；转盘会自动均分扇区。</p>
      </section>

      <section class="panel player-name-panel">
        <div class="panel-title"><span>玩家名称</span><small>两种模式都会显示</small></div>
        <div class="name-toolbar" aria-label="玩家名称快捷操作">
          <button type="button" data-action="randomize-names">随机昵称</button>
          <button type="button" data-action="reset-names">恢复默认</button>
        </div>
        <div class="player-inputs">${playerInputs}</div>
        <p class="helper">点击名称即可修改，最多 12 个字符；设置会保存在当前设备，下次打开仍会保留。</p>
      </section>

      ${dice ? `
        <section class="panel">
          <div class="panel-title"><span>输家判定</span><small>并列时随机选一位</small></div>
          <div class="segment" style="--segments:2">
            <button type="button" class="${state.rule === 'max' ? 'active' : ''}" data-action="set-rule" data-rule="max">点数最大输</button>
            <button type="button" class="${state.rule === 'min' ? 'active' : ''}" data-action="set-rule" data-rule="min">点数最小输</button>
          </div>
        </section>` : ''}

      <section class="panel">
        <div class="panel-title"><span>惩罚尺度</span><small>共 108 道题</small></div>
        <div class="segment" style="--segments:3">
          ${[1,2,3].map((level) => `<button type="button" class="${state.intensity === level ? 'active' : ''}" data-action="set-intensity" data-level="${level}">${LEVEL_LABELS[level]}</button>`).join('')}
        </div>
        <p class="helper">轻松适合破冰；标准增加个人经历；大胆更偏关系与情感，但仍以自愿和不冒犯为前提。</p>
      </section>

      <button class="primary-button ${dice ? '' : 'wheel-cta'}" type="button" data-action="start-game">开始游戏　›</button>`;
  }

  function renderPlayerTrack() {
    return `<div class="player-track" role="list" aria-label="玩家进度">
      ${state.players.map((player, index) => {
        const current = state.route === 'dice-game' && !state.loser && index === state.turn;
        const selected = state.selectedIndex === index;
        const dimmed = state.selectedIndex !== null && !selected;
        return `<div class="player-chip ${current ? 'current' : ''} ${player.score ? 'done' : ''} ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}" role="listitem">
          <span>${escapeHtml(playerName(index))}</span><strong>${player.score ?? '—'}</strong>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderDieFaces() {
    return [1,2,3,4,5,6].map((face) => `
      <div class="dice-face face-${face}" aria-hidden="true">
        ${PIP_POSITIONS[face].map((position) => `<span class="pip p-${position}"></span>`).join('')}
      </div>`).join('');
  }

  function renderDiceGame() {
    const allDone = Boolean(state.loser);
    const result = state.showResult ? renderResultSheet() : '';
    return `
      <div class="game-head">
        <div><small>ROUND ${String(state.round).padStart(2, '0')}</small><h1>命运骰局</h1></div>
        <span class="rule-pill">${state.rule === 'max' ? '最大点数输' : '最小点数输'}</span>
      </div>
      ${renderPlayerTrack()}
      <section class="dice-board">
        <p class="turn-label">${allDone ? `本轮输家：<strong>${escapeHtml(state.loser.name)}</strong>` : `轮到 <strong>${escapeHtml(playerName(state.turn))}</strong>`}</p>
        <div class="dice-scene" aria-label="骰子点数 ${state.dieFace}">
          <div id="diceCube" class="dice-cube" style="--rx:${state.dieX}deg;--ry:${state.dieY}deg">${renderDieFaces()}</div>
          <div class="dice-shadow" aria-hidden="true"></div>
        </div>
        ${allDone ? `<button class="roll-button" type="button" data-action="show-result">查看惩罚</button>` : `<button id="rollButton" class="roll-button" type="button" data-action="roll-dice" ${state.busy ? 'disabled' : ''}>${state.busy ? '投掷中…' : '投骰子'}</button>`}
        <p class="dice-hint">每位玩家只有一次机会；并列点数将随机决胜。</p>
      </section>
      ${result}`;
  }

  function wheelGradient() {
    const step = 360 / state.players.length;
    return `conic-gradient(${state.players.map((_, index) => `${COLORS[index % COLORS.length]} ${index * step}deg ${(index + 1) * step}deg`).join(',')})`;
  }

  function wheelLabels() {
    const count = state.players.length;
    const step = 360 / count;
    const radius = count > 9 ? 31 : 33;
    return state.players.map((_, index) => {
      const angle = index * step + step / 2;
      const radians = angle * Math.PI / 180;
      const x = 50 + radius * Math.sin(radians);
      const y = 50 - radius * Math.cos(radians);
      return `<span class="wheel-label" style="--x:${x}%;--y:${y}%;--label-angle:${angle}deg">${index + 1}</span>`;
    }).join('');
  }

  function renderWheelPlayers() {
    return `<div class="wheel-player-list" aria-label="玩家列表">
      ${state.players.map((player, index) => {
        const selected = state.selectedIndex === index;
        const dimmed = state.selectedIndex !== null && !selected;
        return `<span class="wheel-player-chip ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}" style="--chip-color:${COLORS[index % COLORS.length]}"><b>${index + 1}</b><span>${escapeHtml(playerName(index))}</span></span>`;
      }).join('')}
    </div>`;
  }

  function renderWheelGame() {
    const step = 360 / state.players.length;
    const status = state.loser ? `命运选中了 <strong>${escapeHtml(state.loser.name)}</strong>` : state.busy ? '转盘正在寻找今晚的幸运儿…' : '点击中心或下方按钮开始转动';
    const result = state.showResult ? renderResultSheet() : '';
    return `
      <div class="game-head">
        <div><small>ROUND ${String(state.round).padStart(2, '0')}</small><h1>俄罗斯转盘</h1></div>
        <span class="rule-pill">${state.players.length} 位玩家</span>
      </div>
      <section class="wheel-zone">
        <div id="wheelStage" class="wheel-stage ${state.busy ? 'is-spinning' : ''}">
          <div class="wheel-glow" aria-hidden="true"></div>
          <div class="wheel-rim" aria-hidden="true"></div>
          <div id="wheelRotor" class="wheel-rotor" style="--rotation:${state.rotation}deg;--step:${step}deg;background:${wheelGradient()}" aria-label="俄罗斯转盘">
            ${wheelLabels()}
          </div>
          <button id="wheelCenter" class="wheel-center" type="button" data-action="spin-wheel" ${state.busy ? 'disabled' : ''}><span>${state.busy ? '转动中' : 'SPIN'}</span></button>
          <div id="wheelPointer" class="wheel-pointer" aria-hidden="true"></div>
        </div>
        <p id="wheelStatus" class="wheel-status">${status}</p>
        ${renderWheelPlayers()}
      </section>
      <button id="spinButton" class="primary-button wheel-cta" type="button" data-action="spin-wheel" ${state.busy ? 'disabled' : ''}>${state.busy ? '命运转动中…' : '转动转盘'}</button>
      ${result}`;
  }

  function renderResultSheet() {
    const punishment = state.punishment;
    if (!state.loser || !punishment) return '';
    const typeLabel = punishment.type === 'truth' ? '真心话' : '大冒险';
    return `
      <div class="result-overlay" role="presentation" data-action="overlay-close">
        <section class="result-sheet" role="dialog" aria-modal="true" aria-labelledby="resultTitle" data-result-sheet>
          <div class="sheet-handle"></div>
          <div class="result-kicker">命运选中了</div>
          <h2 id="resultTitle">${escapeHtml(state.loser.name)}</h2>
          <span class="punishment-type ${punishment.type === 'dare' ? 'dare' : ''}">${typeLabel}<span class="punishment-level">· ${LEVEL_LABELS[punishment.level]}</span></span>
          <p class="punishment-text">${escapeHtml(punishment.text)}</p>
          <div class="type-switch" aria-label="切换惩罚类型">
            <button type="button" class="${punishment.type === 'truth' ? 'active' : ''}" data-action="change-punishment" data-type="truth">换成真心话</button>
            <button type="button" class="${punishment.type === 'dare' ? 'active' : ''}" data-action="change-punishment" data-type="dare">换成大冒险</button>
          </div>
          <div class="result-actions">
            <button type="button" data-action="change-punishment">换一题</button>
            <button type="button" class="again ${state.game === 'wheel' ? 'wheel-again' : ''}" data-action="play-again">再来一轮</button>
          </div>
          <p class="consent-note">不舒服就直接换题，不需要解释。</p>
        </section>
      </div>`;
  }

  function setRoute(route) {
    state.route = route;
    render();
  }

  function openSetup(game) {
    state.game = game;
    state.route = `${game}-setup`;
    state.loser = null;
    state.showResult = false;
    state.selectedIndex = null;
    render();
    playUiSound();
  }

  function changeCount(nextCount) {
    state.count = clamp(nextCount, 2, 12);
    syncPlayers(state.count);
    savePrefs();
    render();
  }

  function startGame() {
    state.players = state.players.map((player, index) => ({ id: index + 1, name: player.name.trim() || `玩家 ${index + 1}` }));
    state.players.forEach((player, index) => {
      state.nameDrafts[index] = player.name;
    });
    state.turn = 0;
    state.round = 1;
    state.busy = false;
    state.loser = null;
    state.punishment = null;
    state.showResult = false;
    state.selectedIndex = null;
    savePrefs();
    setRoute(`${state.game}-game`);
    playUiSound();
  }

  function goBack() {
    if (state.busy) {
      showToast('动画结束后再返回');
      return;
    }
    if (state.route.endsWith('-game')) {
      state.loser = null;
      state.showResult = false;
      state.selectedIndex = null;
      setRoute(`${state.game}-setup`);
    } else {
      state.game = null;
      setRoute('home');
    }
    playUiSound();
  }

  function animateRaf(duration, onFrame) {
    const start = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const progress = clamp((now - start) / duration, 0, 1);
        onFrame(progress);
        if (progress < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  function diceProgress(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function nextMatchingAngle(start, targetMod, extraTurns) {
    const base = start + extraTurns * 360;
    return base + mod(targetMod - mod(base, 360), 360);
  }

  async function rollDice() {
    if (state.busy || state.loser) return;
    state.busy = true;
    const button = document.querySelector('#rollButton');
    const cube = document.querySelector('#diceCube');
    if (!cube) return;
    button.disabled = true;
    button.textContent = '投掷中…';
    cube.classList.add('is-rolling');
    liveRegion.textContent = `${playerName(state.turn)} 正在投骰子`;
    playRollSound();

    const score = randomInt(6) + 1;
    const target = FACE_ROTATION[score];
    const startX = state.dieX;
    const startY = state.dieY;
    const endX = nextMatchingAngle(startX, target.x, reducedMotion.matches ? 0 : 2 + randomInt(2));
    const endY = nextMatchingAngle(startY, target.y, reducedMotion.matches ? 0 : 3 + randomInt(2));
    const duration = reducedMotion.matches ? 140 : 1050;

    await animateRaf(duration, (t) => {
      const eased = diceProgress(t);
      const wobble = reducedMotion.matches ? 0 : Math.sin(t * Math.PI * 9) * (1 - t) * 5;
      const x = startX + (endX - startX) * eased + wobble;
      const y = startY + (endY - startY) * eased - wobble * .7;
      cube.style.setProperty('--rx', `${x}deg`);
      cube.style.setProperty('--ry', `${y}deg`);
    });

    state.dieX = endX;
    state.dieY = endY;
    state.dieFace = score;
    state.players[state.turn].score = score;
    state.busy = false;
    playLandSound(score);
    vibrate(18);

    if (state.turn === state.players.length - 1) {
      const scores = state.players.map((player) => player.score);
      const targetScore = state.rule === 'max' ? Math.max(...scores) : Math.min(...scores);
      const candidates = state.players.map((player, index) => ({ player, index })).filter(({ player }) => player.score === targetScore);
      const chosen = candidates[randomInt(candidates.length)];
      state.loser = chosen.player;
      state.selectedIndex = chosen.index;
      state.punishment = pickPunishment();
      state.showResult = false;
      render();
      playRevealSound();
      vibrate([28, 45, 70]);
      liveRegion.textContent = `本轮输家是 ${state.loser.name}`;
      revealTimer = window.setTimeout(() => {
        state.showResult = true;
        render();
      }, reducedMotion.matches ? 120 : 620);
    } else {
      state.turn += 1;
      render();
      requestAnimationFrame(() => document.querySelector('.player-chip.current')?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }));
    }
  }

  function spinProgress(t) {
    // Continuous velocity profile: accelerate → cruise → frictional deceleration.
    const accelTime = 0.14;
    const cruiseTime = 0.22;
    const decelTime = 0.64;
    const accelDistance = 0.1555555556;
    const cruiseDistance = 0.4888888889;
    const decelDistance = 0.3555555555;

    if (t < accelTime) {
      const u = t / accelTime;
      return accelDistance * u * u;
    }
    if (t < accelTime + cruiseTime) {
      const u = (t - accelTime) / cruiseTime;
      return accelDistance + cruiseDistance * u;
    }
    const u = (t - accelTime - cruiseTime) / decelTime;
    return accelDistance + cruiseDistance + decelDistance * (1 - Math.pow(1 - u, 4));
  }

  function sectorAtRotation(angle, step, count) {
    return Math.floor(mod(-angle, 360) / step) % count;
  }

  function tickPointer(progress) {
    const pointer = document.querySelector('#wheelPointer');
    if (!pointer) return;
    pointer.classList.remove('tick');
    void pointer.offsetWidth;
    pointer.classList.add('tick');
    if (progress > .42) playTickSound(progress);
    if (progress > .62) vibrate(5);
  }

  async function spinWheel() {
    if (state.busy || state.showResult) return;
    const rotor = document.querySelector('#wheelRotor');
    const stage = document.querySelector('#wheelStage');
    const status = document.querySelector('#wheelStatus');
    const spinButton = document.querySelector('#spinButton');
    const centerButton = document.querySelector('#wheelCenter');
    if (!rotor || !stage) return;

    state.busy = true;
    state.loser = null;
    state.punishment = null;
    state.selectedIndex = null;
    stage.classList.add('is-spinning');
    rotor.classList.add('is-spinning');
    spinButton.disabled = true;
    spinButton.textContent = '命运转动中…';
    centerButton.disabled = true;
    centerButton.innerHTML = '<span>转动中</span>';
    status.textContent = '转盘正在寻找今晚的幸运儿…';
    liveRegion.textContent = '俄罗斯转盘开始转动';
    playSpinStartSound();

    const count = state.players.length;
    const step = 360 / count;
    const selectedIndex = randomInt(count);
    const targetMod = mod(-(selectedIndex * step + step / 2), 360);
    const current = state.rotation;
    const deltaToTarget = mod(targetMod - mod(current, 360), 360);
    const turns = reducedMotion.matches ? 1 : 6 + randomInt(3);
    const totalDelta = turns * 360 + deltaToTarget;
    const duration = reducedMotion.matches ? 520 : 5000 + randomInt(850);
    let previousSector = sectorAtRotation(current, step, count);
    let lastTickAt = 0;

    await animateRaf(duration, (t) => {
      const progress = spinProgress(t);
      let settle = 0;
      if (!reducedMotion.matches && t > .88) {
        const u = (t - .88) / .12;
        settle = Math.sin(u * Math.PI * 3) * Math.pow(1 - u, 2) * 1.35;
      }
      const angle = current + totalDelta * progress + settle;
      rotor.style.transform = `rotate(${angle}deg)`;
      const sector = sectorAtRotation(angle, step, count);
      const now = performance.now();
      if (sector !== previousSector && now - lastTickAt > 42) {
        previousSector = sector;
        lastTickAt = now;
        tickPointer(t);
      }
    });

    state.rotation = current + totalDelta;
    rotor.style.transform = `rotate(${state.rotation}deg)`;
    state.busy = false;
    state.selectedIndex = selectedIndex;
    state.loser = state.players[selectedIndex];
    state.punishment = pickPunishment();
    state.showResult = false;
    render();
    playRevealSound();
    vibrate([30, 45, 75]);
    liveRegion.textContent = `转盘选中了 ${state.loser.name}`;

    revealTimer = window.setTimeout(() => {
      state.showResult = true;
      render();
    }, reducedMotion.matches ? 120 : 760);
  }

  function pickPunishment(forcedType = null) {
    const type = forcedType || (randomInt(2) === 0 ? 'truth' : 'dare');
    const eligible = PUNISHMENTS[type].filter((item) => item.level <= state.intensity && !state.recentPunishments.includes(item.id));
    const fallback = PUNISHMENTS[type].filter((item) => item.level <= state.intensity);
    const pool = eligible.length ? eligible : fallback;
    const chosen = pool[randomInt(pool.length)];
    state.recentPunishments.push(chosen.id);
    if (state.recentPunishments.length > 12) state.recentPunishments.shift();
    return { ...chosen, type };
  }

  function changePunishment(type = null) {
    state.punishment = pickPunishment(type);
    render();
    playUiSound();
    liveRegion.textContent = `新题目：${state.punishment.text}`;
  }

  function playAgain() {
    state.showResult = false;
    state.loser = null;
    state.punishment = null;
    state.selectedIndex = null;
    state.round += 1;
    if (state.game === 'dice') {
      state.players.forEach((player) => delete player.score);
      state.turn = 0;
    }
    render();
    playUiSound();
  }

  function closeResult() {
    state.showResult = false;
    render();
  }

  function showResult() {
    if (!state.loser) return;
    state.showResult = true;
    render();
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function ensureAudio() {
    if (!state.soundEnabled) return null;
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }

  function tone(frequency, duration = .05, volume = .025, type = 'sine', delay = 0) {
    const context = ensureAudio();
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
  }

  function playUiSound() { tone(480, .045, .018, 'sine'); }
  function playRollSound() {
    [0, .07, .14, .21].forEach((delay, index) => tone(180 + index * 38, .045, .018, 'square', delay));
  }
  function playLandSound(score) { tone(310 + score * 35, .11, .035, 'triangle'); }
  function playSpinStartSound() { tone(170, .12, .025, 'sawtooth'); tone(260, .1, .018, 'triangle', .08); }
  function playTickSound(progress) { tone(720 - progress * 230, .025, .012 + progress * .009, 'square'); }
  function playRevealSound() { tone(392, .16, .03, 'triangle'); tone(523, .22, .028, 'triangle', .08); tone(659, .25, .022, 'sine', .16); }

  function vibrate(pattern) {
    if (!state.soundEnabled || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    savePrefs();
    updateHeader();
    if (state.soundEnabled) {
      playUiSound();
      showToast('音效与触感已开启');
    } else {
      showToast('音效与触感已关闭');
    }
  }

  function updateNetworkState() {
    const offline = !navigator.onLine;
    networkBadge.textContent = offline ? '离线可玩' : '在线';
    networkBadge.classList.toggle('offline', offline);
  }

  view.addEventListener('click', (event) => {
    const control = event.target.closest('[data-action]');
    if (!control) return;
    const action = control.dataset.action;

    if (action === 'open-setup') openSetup(control.dataset.game);
    else if (action === 'change-count') changeCount(state.count + Number(control.dataset.delta));
    else if (action === 'set-count') changeCount(Number(control.dataset.count));
    else if (action === 'randomize-names') randomizePlayerNames();
    else if (action === 'reset-names') resetPlayerNames();
    else if (action === 'set-rule') { state.rule = control.dataset.rule; savePrefs(); render(); playUiSound(); }
    else if (action === 'set-intensity') { state.intensity = Number(control.dataset.level); savePrefs(); render(); playUiSound(); }
    else if (action === 'start-game') startGame();
    else if (action === 'roll-dice') rollDice();
    else if (action === 'spin-wheel') spinWheel();
    else if (action === 'show-result') showResult();
    else if (action === 'change-punishment') changePunishment(control.dataset.type || null);
    else if (action === 'play-again') playAgain();
    else if (action === 'overlay-close' && !event.target.closest('[data-result-sheet]')) closeResult();
  });

  view.addEventListener('input', (event) => {
    const input = event.target.closest('[data-player-index]');
    if (!input) return;
    const index = Number(input.dataset.playerIndex);
    state.players[index].name = input.value;
    state.nameDrafts[index] = input.value;
    savePrefs();
  });

  view.addEventListener('focusin', (event) => {
    const input = event.target.closest('[data-player-index]');
    if (!input) return;
    const index = Number(input.dataset.playerIndex);
    if (input.value === `玩家 ${index + 1}`) input.select();
  });

  view.addEventListener('keydown', (event) => {
    const input = event.target.closest('[data-player-index]');
    if (!input || event.key !== 'Enter') return;
    event.preventDefault();
    const index = Number(input.dataset.playerIndex);
    const nextInput = view.querySelector(`[data-player-index="${index + 1}"]`);
    if (nextInput) nextInput.focus();
    else input.blur();
  });

  backButton.addEventListener('click', goBack);
  soundButton.addEventListener('click', toggleSound);
  window.addEventListener('online', () => { updateNetworkState(); showToast('网络已恢复'); });
  window.addEventListener('offline', () => { updateNetworkState(); showToast('已进入离线模式'); });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    showToast('已安装到设备');
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {
        showToast('离线缓存初始化失败，在线模式仍可使用');
      });
    });
  }

  updateNetworkState();
  render();
})();
