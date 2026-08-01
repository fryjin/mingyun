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
  const LEVEL_LABELS = { 1: '轻松', 2: '标准', 3: '大胆', 4: '成人刺激' };
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
      { id: 't318', level: 3, text: '你现在最想对某个人说、但一直没说的话是什么？' },

      { id: "t401", level: 4, text: "你最容易被一个人的哪种身体或气质特征吸引？" },
      { id: "t402", level: 4, text: "你对一夜情的真实看法是什么？" },
      { id: "t403", level: 4, text: "在亲密关系里，你更习惯主动还是等待对方主动？" },
      { id: "t404", level: 4, text: "哪一种暧昧方式最容易让你心动？" },
      { id: "t405", level: 4, text: "你经历过最让你脸红的一次调情是什么？" },
      { id: "t406", level: 4, text: "身体吸引和情感契合，你更难放弃哪一个？" },
      { id: "t407", level: 4, text: "你最想尝试、但一直没说出口的成人约会场景是什么？" },
      { id: "t408", level: 4, text: "你有没有把普通友好误认为对方在调情？后来怎样了？" },
      { id: "t409", level: 4, text: "你印象最深的一次接吻发生在什么情境？" },
      { id: "t410", level: 4, text: "亲密关系中哪条界限一旦被越过，你会立刻结束关系？" },
      { id: "t411", level: 4, text: "你能接受伴侣与潜在暧昧对象保持多近的距离？" },
      { id: "t412", level: 4, text: "你能接受的最大年龄差是多少？为什么？" },
      { id: "t413", level: 4, text: "你怎么看开放式关系或非传统亲密关系？" },
      { id: "t414", level: 4, text: "伴侣做什么最容易触发你的占有欲或嫉妒？" },
      { id: "t415", level: 4, text: "你在感情里说过最难圆回来的一次谎是什么？" },
      { id: "t416", level: 4, text: "你有没有对朋友的前任、同事或其他不方便的人心动过？" },
      { id: "t417", level: 4, text: "用三个词描述你理想中的亲密氛围。" },
      { id: "t418", level: 4, text: "如果今晚可以收到一个完全坦诚的答案，你最想问现场谁什么问题？" },
      { id: "t419", level: 4, text: "什么样的声音或说话方式最容易让你产生吸引力？" },
      { id: "t420", level: 4, text: "第一次约会时，你通常最先观察对方什么？" },
      { id: "t421", level: 4, text: "什么样的交友软件简介最容易让你点下喜欢？" },
      { id: "t422", level: 4, text: "你更喜欢感情快速升温，还是慢慢建立暧昧？" },
      { id: "t423", level: 4, text: "你对公开场合的亲密举动接受到什么程度？" },
      { id: "t424", level: 4, text: "第一次接吻时，你更希望自己主动还是对方主动？" },
      { id: "t425", level: 4, text: "争吵之后，你需要先解决情绪还是先恢复亲密感？" },
      { id: "t426", level: 4, text: "情感出轨和身体出轨，哪一种更难原谅？" },
      { id: "t427", level: 4, text: "你能接受伴侣与前任保持联系吗？边界在哪里？" },
      { id: "t428", level: 4, text: "你有过不想让别人知道的秘密关系或暧昧吗？" },
      { id: "t429", level: 4, text: "你能接受和同事发展恋爱关系吗？" },
      { id: "t430", level: 4, text: "关系确定前，你愿意保持多久的暧昧期？" },
      { id: "t431", level: 4, text: "亲密关系中，作息和睡眠习惯不合会影响你多少？" },
      { id: "t432", level: 4, text: "描述一个你理想中的私密约会场景。" },
      { id: "t433", level: 4, text: "你喜欢伴侣用昵称称呼你吗？最能接受哪一类？" },
      { id: "t434", level: 4, text: "什么样的暧昧消息会让你忍不住反复看？" },
      { id: "t435", level: 4, text: "认识多久后接吻，对你来说最舒服？" },
      { id: "t436", level: 4, text: "你做过最大胆的一次告白是什么？" },
      { id: "t437", level: 4, text: "你有没有被完全不符合自己理想型的人强烈吸引过？" },
      { id: "t438", level: 4, text: "强烈化学反应和稳定安全感，你更偏向哪一个？" },
      { id: "t439", level: 4, text: "你有没有故意测试过伴侣会不会吃醋？" },
      { id: "t440", level: 4, text: "你会在意伴侣过去的感情或亲密经历数量吗？" },
      { id: "t441", level: 4, text: "你认为伴侣之间应该坦白所有成人幻想吗？" },
      { id: "t442", level: 4, text: "恋爱后，你能接受对方查看你的手机吗？" },
      { id: "t443", level: 4, text: "你愿意和伴侣共享手机密码吗？为什么？" },
      { id: "t444", level: 4, text: "你能接受情侣之间长期共享定位吗？" },
      { id: "t445", level: 4, text: "什么行为最容易让你瞬间失去亲密兴趣？" },
      { id: "t446", level: 4, text: "亲密之后，你最需要对方怎样的照顾或回应？" },
      { id: "t447", level: 4, text: "拥抱、牵手、接吻和语言表达中，你最依赖哪一种亲密方式？" },
      { id: "t448", level: 4, text: "你更喜欢温柔、热烈还是带一点试探感的接吻氛围？" },
      { id: "t449", level: 4, text: "灯光、音乐、气味中，哪一种最影响你的亲密状态？" },
      { id: "t450", level: 4, text: "哪种音乐最适合你理想中的成人约会氛围？" },
      { id: "t451", level: 4, text: "什么样的气味会让你觉得一个人特别有吸引力？" },
      { id: "t452", level: 4, text: "哪种穿衣风格最容易吸引你？" },
      { id: "t453", level: 4, text: "你对情侣之间的角色扮演接受度有多高？" },
      { id: "t454", level: 4, text: "异地关系中，你认为怎样维持亲密感最有效？" },
      { id: "t455", level: 4, text: "你能接受“只保持身体关系、不谈恋爱”的相处方式吗？" },
      { id: "t456", level: 4, text: "你相信朋友可以自然发展成稳定恋人吗？" },
      { id: "t457", level: 4, text: "你认为分手后还能真正做回普通朋友吗？" },
      { id: "t458", level: 4, text: "你有没有把新关系当作走出上一段感情的方法？" },
      { id: "t459", level: 4, text: "你曾经喜欢过已有伴侣的人吗？你怎么处理的？" },
      { id: "t460", level: 4, text: "你经历过最失败的一次暧昧或告白是什么？" },
      { id: "t461", level: 4, text: "你更享受被追求，还是享受主动追求别人？" },
      { id: "t462", level: 4, text: "你收到过最让你心动的外貌或气质称赞是什么？" },
      { id: "t463", level: 4, text: "你发过最大胆的一条暧昧消息是什么类型？" },
      { id: "t464", level: 4, text: "现场谁的气质最接近你愿意约会的类型？" },
      { id: "t465", level: 4, text: "现场谁的声音最有吸引力？可以只说原因。" },
      { id: "t466", level: 4, text: "现场谁看起来最擅长制造浪漫或暧昧气氛？" },
      { id: "t467", level: 4, text: "如果要和现场一位玩家假扮情侣一天，你会选谁？" },
      { id: "t468", level: 4, text: "现场谁最适合正式恋爱，谁最适合短暂心动？可以选择跳过。" },
      { id: "t469", level: 4, text: "第一次约会中，什么细节会让你立刻想结束？" },
      { id: "t470", level: 4, text: "第一次约会中，什么小细节会让你明显加分？" },
      { id: "t471", level: 4, text: "亲密生活不合拍，对你来说是否足以结束一段关系？" },
      { id: "t472", level: 4, text: "亲密频率不一致时，你更倾向沟通、妥协还是分开？" },
      { id: "t473", level: 4, text: "你是否能坦然和伴侣讨论安全措施与健康边界？" },
      { id: "t474", level: 4, text: "你认为避孕和安全措施应该怎样分担责任？" },
      { id: "t475", level: 4, text: "你能否接受在确认关系前讨论健康检测和安全问题？" },
      { id: "t476", level: 4, text: "分手后，双方共同的私密内容应该怎样处理？" },
      { id: "t477", level: 4, text: "你对成人文字调情或暧昧聊天的接受度如何？" },
      { id: "t478", level: 4, text: "你穿过最让自己有自信的一套约会服装是什么？" },
      { id: "t479", level: 4, text: "什么时刻最容易让你觉得自己很有魅力？" },
      { id: "t480", level: 4, text: "在亲密关系中，你最容易对自己的哪一点不自信？" },
      { id: "t481", level: 4, text: "你最喜欢别人怎样称赞你的外貌或身体状态？" },
      { id: "t482", level: 4, text: "你认为表达同意时，怎样才算足够明确？" },
      { id: "t483", level: 4, text: "当你不想继续亲密互动时，你通常会怎样表达？" },
      { id: "t484", level: 4, text: "如果对方拒绝亲密互动，你希望自己怎样回应才算成熟？" },
      { id: "t485", level: 4, text: "有什么成人关系话题让你好奇，但又有点不好意思谈？" },
      { id: "t486", level: 4, text: "你最想体验哪一部影视作品里的浪漫或成人约会氛围？" },
      { id: "t487", level: 4, text: "你会接受旅行中短暂但真诚的浪漫关系吗？" },
      { id: "t488", level: 4, text: "酒店、海边、城市夜景或家中，你更喜欢哪种私密约会环境？" },
      { id: "t489", level: 4, text: "你觉得慢舞比直接告白更容易制造心动吗？" },
      { id: "t490", level: 4, text: "雨中接吻这种桥段对你来说浪漫还是尴尬？" },
      { id: "t491", level: 4, text: "你最长的一次暗恋或秘密心动持续了多久？" },
      { id: "t492", level: 4, text: "你经历过最强烈的一次双向吸引是什么感觉？" },
      { id: "t493", level: 4, text: "你有没有因为强烈吸引力而留在一段明知不合适的关系里？" },
      { id: "t494", level: 4, text: "你有没有故意装作不在意一个其实非常心动的人？" },
      { id: "t495", level: 4, text: "你有没有刻意让喜欢的人吃醋？结果怎样？" },
      { id: "t496", level: 4, text: "成人关系中，哪个问题最容易让你害羞到想跳过？" },
      { id: "t497", level: 4, text: "你最看重亲密生活里的哪一点：新鲜感、默契、安全感还是频率？" },
      { id: "t498", level: 4, text: "你对情趣用品进入伴侣关系的真实接受度如何？" },
      { id: "t499", level: 4, text: "你更在意亲密前的氛围，还是亲密后的沟通与照顾？" },
      { id: "t500", level: 4, text: "如果伴侣提出一个你没兴趣的成人尝试，你会怎样拒绝又不伤害对方？" }
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
      { id: 'd318', level: 3, text: '用发布会口吻宣布自己接下来一个月的小目标。' },

      { id: "d401", level: 4, text: "选择一位明确自愿的玩家，保持十五秒近距离对视，不需要身体接触。" },
      { id: "d402", level: 4, text: "对一位明确自愿的玩家，用耳语语气说一句暧昧但尊重的称赞。" },
      { id: "d403", level: 4, text: "即兴表演二十秒“第一次见面却明显来电”的场景。" },
      { id: "d404", level: 4, text: "选择一位玩家，用一句你认为成功率最高的搭讪开场白与对方打招呼。" },
      { id: "d405", level: 4, text: "分别用强势、温柔和神秘三种语气说：“今晚你有点危险。”" },
      { id: "d406", level: 4, text: "面对镜头或大家，展示一个你认为最有吸引力的眼神，坚持五秒。" },
      { id: "d407", level: 4, text: "与一位明确自愿的玩家轮流说一句“我觉得你有吸引力，是因为……”。" },
      { id: "d408", level: 4, text: "不使用“回家”和“喝一杯”两个词，演示你会怎样发出深夜续摊邀请。" },
      { id: "d409", level: 4, text: "完成十五秒慢动作走秀，并在结尾对现场一位玩家做一个暧昧表情。" },
      { id: "d410", level: 4, text: "用一句话描述你心中完美深夜约会的最后一分钟。" },
      { id: "d411", level: 4, text: "在双方明确同意的前提下，与一位玩家牵手二十秒；任何一方都可随时结束。" },
      { id: "d412", level: 4, text: "选择一位明确自愿的玩家，坐到双方都舒适的距离，说：“我有个秘密想告诉你。”然后分享一件无伤大雅的小秘密。" },
      { id: "d413", level: 4, text: "即兴录制一段二十秒“发给心动对象的深夜语音”，只表演，不需要真的发送。" },
      { id: "d414", level: 4, text: "让大家指定一个成人爱情电影场景类型，完成十五秒不接触的即兴表演。" },
      { id: "d415", level: 4, text: "说出一种最能让你产生吸引力的特质，并用十秒表演这种特质。" },
      { id: "d416", level: 4, text: "选择一位明确自愿的玩家，对对方说一句：“如果我们在都单身的时候认识……”并补完后半句。" },
      { id: "d417", level: 4, text: "让大家从“强势、温柔、神秘”中选一种风格，用该风格完成十五秒自我介绍。" },
      { id: "d418", level: 4, text: "选择一位明确自愿的玩家，互相说出对方最有魅力的一点；避免评价敏感身体部位。" },
      { id: "d419", level: 4, text: "用二十秒完成一段“只给成年人看的约会节目”自我介绍，但不要涉及露骨内容。" },
      { id: "d420", level: 4, text: "用深夜电台主播的语气播报今晚的天气和心动指数。" },
      { id: "d421", level: 4, text: "选择一位明确自愿的玩家，对视十秒后说一句尊重的暧昧开场白。" },
      { id: "d422", level: 4, text: "独自完成十五秒慢舞，假装有人正在邀请你靠近。" },
      { id: "d423", level: 4, text: "即兴表演二十秒“多年后与旧情人意外重逢”的场景。" },
      { id: "d424", level: 4, text: "录制一段不发送的十五秒交友软件自拍视频，突出你的魅力。" },
      { id: "d425", level: 4, text: "分别用直接、含蓄和幽默三种方式称赞同一个人的气质。" },
      { id: "d426", level: 4, text: "对一把空椅子说一句“再靠近一点，我有话告诉你”，并演完后续五秒。" },
      { id: "d427", level: 4, text: "借助杯子或抱枕，演示你理想中的暧昧靠近方式，不与真人接触。" },
      { id: "d428", level: 4, text: "为一部虚构的成人爱情电影配一段十五秒预告旁白。" },
      { id: "d429", level: 4, text: "选择一位明确自愿的玩家，双方各说一句大胆但尊重的称赞。" },
      { id: "d430", level: 4, text: "和一位明确自愿的玩家表演二十秒“第一次约会却明显来电”，全程不接触。" },
      { id: "d431", level: 4, text: "用手或道具完成一个“接吻前一秒”的电影借位画面，不与真人接触。" },
      { id: "d432", level: 4, text: "选择一位明确自愿的玩家，问一个可以只回答“愿意或不愿意”的暧昧问题，并完全接受对方的答案。" },
      { id: "d433", level: 4, text: "选择一首带有暧昧氛围的歌，对口型表演二十秒。" },
      { id: "d434", level: 4, text: "完成一段十五秒夜场风走秀，不需要脱衣或触碰任何人。" },
      { id: "d435", level: 4, text: "分别用温柔、疲惫和舍不得三种语气说“晚安”。" },
      { id: "d436", level: 4, text: "用三个表情符号设计一条深夜邀约，并解释含义；不要实际发送。" },
      { id: "d437", level: 4, text: "录制一段不发送的二十秒暧昧语音，内容必须尊重且可被拒绝。" },
      { id: "d438", level: 4, text: "发明一款成人约会主题的无酒精鸡尾酒名称，并用广告语介绍它。" },
      { id: "d439", level: 4, text: "给三位玩家各颁发一个友善的暧昧称号，例如“眼神杀手”或“氛围担当”。" },
      { id: "d440", level: 4, text: "表演十秒吃醋情绪，再用十秒演示成熟沟通的正确版本。" },
      { id: "d441", level: 4, text: "演示一次情侣之间讨论边界的健康对话。" },
      { id: "d442", level: 4, text: "表演一次既坚定又不失礼貌地拒绝深夜邀约。" },
      { id: "d443", level: 4, text: "大声说出三条你认为成人互动中必须遵守的边界。" },
      { id: "d444", level: 4, text: "选择一位明确自愿的玩家，在不接触的情况下完成十秒同步转身和回眸。" },
      { id: "d445", level: 4, text: "选择一位明确自愿的玩家，互相模仿对方认为自己最有魅力的姿态。" },
      { id: "d446", level: 4, text: "与一位明确自愿的玩家表演二十秒“电梯里气氛突然暧昧”的场景，全程不接触。" },
      { id: "d447", level: 4, text: "对身边一个物品完成一段十五秒认真又夸张的告白。" },
      { id: "d448", level: 4, text: "说出你理想约会的背景音乐，并哼唱十秒。" },
      { id: "d449", level: 4, text: "为一个虚构香水拍摄十五秒“危险吸引力”广告。" },
      { id: "d450", level: 4, text: "把当前房间介绍成一间浪漫精品酒店，持续二十秒。" },
      { id: "d451", level: 4, text: "摆出三个适合成人交友资料的自信姿势，每个保持三秒。" },
      { id: "d452", level: 4, text: "让一位玩家提供一句普通台词，你用暧昧但不露骨的语气读出来。" },
      { id: "d453", level: 4, text: "用最有魅力的语气完整说一遍绕口令。" },
      { id: "d454", level: 4, text: "分别用警告、期待和害羞三种语气说：“别靠太近，我会误会。”" },
      { id: "d455", level: 4, text: "选择一位明确自愿的玩家，互相补完一句“最想约你去……”。" },
      { id: "d456", level: 4, text: "表演一次邀请心动对象去吃深夜甜品的电话，只表演，不拨打。" },
      { id: "d457", level: 4, text: "面对镜头完成五秒有吸引力的眼神练习。" },
      { id: "d458", level: 4, text: "表演十秒“被人发现自己正在偷看对方”的反应。" },
      { id: "d459", level: 4, text: "表演收到一条大胆暧昧消息后的三种不同反应。" },
      { id: "d460", level: 4, text: "用十秒表演一次自信、成熟、不留误会的拒绝。" },
      { id: "d461", level: 4, text: "即兴表演二十秒“酒吧里遇见神秘陌生人”的开场，不需要饮酒。" },
      { id: "d462", level: 4, text: "为自己设计一句只有三个词的成人约会口号。" },
      { id: "d463", level: 4, text: "选择一位明确自愿的玩家，共同表演二十秒“酒店大堂偶遇”的电影场景，全程不接触。" },
      { id: "d464", level: 4, text: "选择一位明确自愿的玩家，表演二十秒“错过末班车后讨论接下来去哪”，结尾必须尊重双方选择。" },
      { id: "d465", level: 4, text: "表演一次“询问是否可以接吻”的明确同意对话，不需要实际接吻。" },
      { id: "d466", level: 4, text: "演示三种尊重地询问对方是否愿意继续互动的说法。" },
      { id: "d467", level: 4, text: "演示三种清晰表达“不想继续”的方式。" },
      { id: "d468", level: 4, text: "选择一位明确自愿的玩家，称赞对方一个非敏感身体特征或气质特点。" },
      { id: "d469", level: 4, text: "让大家从强势、温柔、神秘中选择一种风格，用该风格演二十秒约会对白。" },
      { id: "d470", level: 4, text: "把一段普通菜单用情书般的语气朗读十五秒。" },
      { id: "d471", level: 4, text: "坐在椅子上完成十五秒节奏感表演，保持衣着完整并不接触他人。" },
      { id: "d472", level: 4, text: "借助抱枕完成二十秒一人浪漫电影片段。" },
      { id: "d473", level: 4, text: "用双手和表情演出十秒“接吻前的犹豫”，不与真人接触。" },
      { id: "d474", level: 4, text: "选择一位明确自愿的玩家，在舒适距离内同步缓慢呼吸十秒；任何一方都可立即结束。" },
      { id: "d475", level: 4, text: "选择一位明确自愿的玩家，轮流说吸引力称赞，任意一方说停即结束。" },
      { id: "d476", level: 4, text: "发明一句用于结束不舒服约会的秘密暗号，并解释它的使用方式。" },
      { id: "d477", level: 4, text: "面对镜子或镜头说一句你认为最有成功率的大胆搭讪词。" },
      { id: "d478", level: 4, text: "完成一次“走开三步再回头”的电影式回眸。" },
      { id: "d479", level: 4, text: "拍摄一段十五秒虚构香水广告，主题是“午夜之后”。" },
      { id: "d480", level: 4, text: "选一首歌，无声表演其中最暧昧的十秒。" },
      { id: "d481", level: 4, text: "为一部虚构成人爱情电影取名，并摆出电影海报姿势。" },
      { id: "d482", level: 4, text: "用深夜电台语气完成二十秒匿名心动告白。" },
      { id: "d483", level: 4, text: "表演二十秒“我们明知道不该心动”的电影对白，不接触任何人。" },
      { id: "d484", level: 4, text: "选择一位明确自愿的玩家，表演二十秒“多年后双方都单身时再次相遇”。" },
      { id: "d485", level: 4, text: "在备忘录里写三句暧昧但尊重的话，不发送，只选择一句读出来。" },
      { id: "d486", level: 4, text: "让大家指定一个普通物品，你把它介绍成一件极具吸引力的约会道具。" },
      { id: "d487", level: 4, text: "只用眼神演出“注意、心动、克制、确认”四个阶段。" },
      { id: "d488", level: 4, text: "选择一位明确自愿的玩家，向对方询问一个关于约会偏好的安全问题。" },
      { id: "d489", level: 4, text: "用自己的手背或杯沿模拟电影中的借位吻镜头，不与真人接触。" },
      { id: "d490", level: 4, text: "用两个杯子或玩偶摆出一个“差一点接吻”的电影画面。" },
      { id: "d491", level: 4, text: "完成一次十五秒自信进场，像全场都在等你出现。" },
      { id: "d492", level: 4, text: "分别用挑衅、温柔、玩笑和认真四种语气说：“我知道你在想什么。”" },
      { id: "d493", level: 4, text: "用最有魅力的播音腔朗读一段“成人模式安全提示”。" },
      { id: "d494", level: 4, text: "表演二十秒成人恋爱真人秀的出场采访。" },
      { id: "d495", level: 4, text: "选择一位明确自愿的玩家，摆一个五秒假情侣海报姿势；可选择完全不接触。" },
      { id: "d496", level: 4, text: "为一场私密约会设计三道“菜单”：开场、主菜和结束安排。" },
      { id: "d497", level: 4, text: "用另一种语言或自创口音，对一位玩家说一句尊重的魅力称赞。" },
      { id: "d498", level: 4, text: "选择一位明确自愿的玩家，让对方选择你的语气，然后说一句安全的暧昧台词。" },
      { id: "d499", level: 4, text: "面对大家自信地说：“任何人都可以说不、暂停或换题。”然后完成一个五秒回眸。" },
      { id: "d500", level: 4, text: "选择一位明确自愿的玩家，双方轮流用一句话描述理想深夜约会的开场，全程不接触。" }
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
  const adultConfirmed = readAdultConsent();
  const savedIntensity = clamp(Number(saved.intensity) || 2, 1, 4);
  const state = {
    route: 'home',
    game: null,
    count: clamp(Number(saved.count) || 4, 2, 12),
    rule: saved.rule === 'min' ? 'min' : 'max',
    intensity: savedIntensity === 4 && !adultConfirmed ? 3 : savedIntensity,
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
    showAdultGate: false,
    adultConfirmed,
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

  function readAdultConsent() {
    try {
      return sessionStorage.getItem('party-game-adult-confirmed') === 'yes';
    } catch {
      return false;
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem('party-game-prefs', JSON.stringify({
        count: state.count,
        rule: state.rule,
        intensity: state.intensity === 4 ? 3 : state.intensity,
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
          <span class="mini-badge adult-mini-badge">成人模式 18+</span>
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
        <p class="safety-note">任何玩家都可以跳过不舒服的题目；成人模式仅限全部参与者均已满 18 岁并自愿开启。</p>
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
        <div class="panel-title"><span>惩罚尺度</span><small>共 308 道题</small></div>
        <div class="segment intensity-segment" style="--segments:4">
          ${[1,2,3,4].map((level) => `<button type="button" class="${state.intensity === level ? 'active' : ''} ${level === 4 ? 'adult-option' : ''}" data-action="set-intensity" data-level="${level}">${LEVEL_LABELS[level]}${level === 4 ? '<small>18+ · 200题</small>' : ''}</button>`).join('')}
        </div>
        <p class="helper">轻松适合破冰；标准增加个人经历；大胆偏关系与情感；成人刺激为独立 18+ 题库，含 100 道真心话与 100 道大冒险，只抽取成人向问题。</p>
      </section>

      <button class="primary-button ${dice ? '' : 'wheel-cta'}" type="button" data-action="start-game">开始游戏　›</button>
      ${state.showAdultGate ? renderAdultGate() : ''}`;
  }

  function renderAdultGate() {
    return `
      <div class="adult-gate-overlay" role="presentation" data-action="adult-overlay-close">
        <section class="adult-gate-sheet" role="dialog" aria-modal="true" aria-labelledby="adultGateTitle" data-adult-sheet>
          <span class="adult-gate-badge">18+ ONLY</span>
          <h2 id="adultGateTitle">开启成人刺激题库？</h2>
          <p>该题库包含 200 道更私密的感情、吸引力、亲密边界与成人关系题目，以及带有暧昧氛围的大冒险。</p>
          <ul>
            <li>所有参与者均已年满 18 岁</li>
            <li>互动必须获得相关玩家明确同意</li>
            <li>任何人都可以跳过或换题，无需解释</li>
          </ul>
          <div class="adult-gate-actions">
            <button type="button" data-action="cancel-adult">暂不开启</button>
            <button type="button" class="confirm" data-action="confirm-adult">确认均已成年并开启</button>
          </div>
        </section>
      </div>`;
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
          <span class="punishment-type ${punishment.type === 'dare' ? 'dare' : ''} ${punishment.level === 4 ? 'adult' : ''}">${typeLabel}<span class="punishment-level">· ${LEVEL_LABELS[punishment.level]}</span></span>
          <p class="punishment-text">${escapeHtml(punishment.text)}</p>
          <div class="type-switch" aria-label="切换惩罚类型">
            <button type="button" class="${punishment.type === 'truth' ? 'active' : ''}" data-action="change-punishment" data-type="truth">换成真心话</button>
            <button type="button" class="${punishment.type === 'dare' ? 'active' : ''}" data-action="change-punishment" data-type="dare">换成大冒险</button>
          </div>
          <div class="result-actions">
            <button type="button" data-action="change-punishment">换一题</button>
            <button type="button" class="again ${state.game === 'wheel' ? 'wheel-again' : ''}" data-action="play-again">再来一轮</button>
          </div>
          <p class="consent-note">${punishment.level === 4 ? '仅限成年人自愿参与；任何互动都需要明确同意，不舒服可直接换题。' : '不舒服就直接换题，不需要解释。'}</p>
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
    if (state.intensity === 4 && !state.adultConfirmed) {
      state.showAdultGate = true;
      render();
      return;
    }
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
    if (state.showAdultGate) {
      state.showAdultGate = false;
      render();
      return;
    }
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
    const matchesIntensity = (item) => state.intensity === 4 ? item.level === 4 : item.level <= state.intensity;
    const eligible = PUNISHMENTS[type].filter((item) => matchesIntensity(item) && !state.recentPunishments.includes(item.id));
    const fallback = PUNISHMENTS[type].filter(matchesIntensity);
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
    else if (action === 'set-intensity') {
      const level = Number(control.dataset.level);
      if (level === 4 && !state.adultConfirmed) {
        state.showAdultGate = true;
        render();
      } else {
        state.intensity = level;
        savePrefs();
        render();
        playUiSound();
      }
    }
    else if (action === 'confirm-adult') {
      state.adultConfirmed = true;
      state.showAdultGate = false;
      state.intensity = 4;
      try { sessionStorage.setItem('party-game-adult-confirmed', 'yes'); } catch {}
      savePrefs();
      render();
      playUiSound();
      showToast('成人刺激题库已开启');
    }
    else if (action === 'cancel-adult') { state.showAdultGate = false; render(); }
    else if (action === 'adult-overlay-close' && !event.target.closest('[data-adult-sheet]')) { state.showAdultGate = false; render(); }
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
