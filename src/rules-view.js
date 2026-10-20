import { colorStyle, markHTML, escapeHTML as esc } from './cards.js';
import { EXPANSIONS, enabled, achievementTarget } from './expansions.js';
import { SPLAY_NAMES, SPLAY_SLOTS } from './engine.js';

// Reader content follows the locally archived Ultimate rulebook v4.1.
// Keep this separate from effect programs: reading and examples never mutate a game.
const CHAPTERS = [
  ['base', '基础规则', '从这里开始'],
  ['echoes', '往日回声', '回声 · 奖分 · 预示'],
  ['figures', '文明巨擘', '伟人 · 业报 · 法令'],
  ['cities', '命运之城', '城市 · 搜索 · 签署'],
  ['icons', '图标速查', '看图找含义'],
  ['combined', '组合与进阶', '抽牌来源 · 结算顺序'],
];
const SLOT_NAMES = ['左上', '左下', '中下', '右下', '右上', '中上'];
const STANDARD = [
  [1, '王冠形'], [2, '叶片形'], [3, '灯泡形'],
  [4, '城堡形'], [5, '工厂形'], [6, '时钟形'],
];

function symbols(data) {
  return (code, { color = 'BLUE', search = false, term } = {}) => {
    // A one-slot illustration uses the same atlas/SVG renderer as a real card.
    const card = { id: 'rules-symbol', set: 'Base', color, spots: [code], art_position: [0], search_slots: search ? [0] : [] };
    const key = term || (search ? 'city-search' : code === 0 ? 'image' : `icon${code}`);
    const name = search ? `搜索 · ${data.icon_names[code]}` : code === 0 ? '卡牌插图' : data.icon_names[code];
    return `<button type="button" class="rule-symbol keyword" data-term="${esc(key)}" aria-label="${esc(name)}，查看解释" style="${colorStyle(color)}">${markHTML(card, 0, data.icon_names)}</button>`;
  };
}

export function rulesSplayHTML(direction, data) {
  const selected = Object.hasOwn(SPLAY_SLOTS, direction) ? direction : 'left';
  const visible = SPLAY_SLOTS[selected];
  const names = visible.map(slot => SLOT_NAMES[slot]).join('、') || '无';
  // Deliberately synthetic: six populated positions explain geometry, not a
  // particular card. Actual empty card slots remain empty in the game.
  const sample = { id: 'rules-example', color: 'BLUE', spots: [1, 2, 3, 4, 5, 6] };
  const face = top => `<div class="rule-demo-card ${top ? 'is-top' : 'is-under'}" style="${colorStyle('BLUE')}">${sample.spots.map((_, slot) => markHTML(sample, slot, data.icon_names, false, top || visible.includes(slot))).join('')}<span>${top ? '置顶牌' : '下层牌'}<small>${top ? '六个位置全部可见' : '只计算露出的标记'}</small></span></div>`;
  return `<div class="rule-splay-visual" data-direction="${selected}" role="img" aria-label="${SPLAY_NAMES[selected]}：置顶牌全部可见，下层牌露出${names}">${face(false)}${face(true)}</div><div class="rule-splay-reading"><strong>${SPLAY_NAMES[selected]}</strong><p>下层牌露出：<b>${names}</b>。</p><div class="rule-exposed-icons">${visible.map(slot => `<span>${markHTML(sample, slot, data.icon_names)}<small>${SLOT_NAMES[slot]}</small></span>`).join('') || '<span>下层没有可见标记</span>'}</div><p class="rule-muted">这是六个位置的示意图，非实际卡牌。实际卡牌某位置没有标记时，不增加任何图标。</p></div>`;
}

function content(section, state, data, rich, splay) {
  const icon = symbols(data);
  const p = text => `<p>${rich(text)}</p>`;
  const list = items => `<ul>${items.map(item => `<li>${rich(item)}</li>`).join('')}</ul>`;
  const block = (title, body) => `<section class="rule-block"><h3>${title}</h3>${body}</section>`;
  const note = (label, text) => `<aside class="rule-note"><strong>${label}</strong>${p(text)}</aside>`;
  const table = (head, rows) => `<div class="rule-table-wrap"><table class="rule-table"><thead><tr>${head.map(text => `<th scope="col">${esc(text)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((text, i) => i === 0 ? `<th scope="row">${text}</th>` : `<td>${text}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const details = (title, body) => `<details class="rule-details"><summary>${title}</summary>${body}</details>`;
  const specialList = set => `<div class="rule-specials">${data.special_achievements.filter(card => card.set === set || (set === 'Base' && !card.set)).map(card => `<article><h4>${esc(card.name_zh)}</h4>${card.effects.map(effect => p(effect.zh)).join('')}</article>`).join('')}</div>`;
  const draw = id => note('如何抽取', EXPANSIONS.find(item => item.id === id).drawRule);
  const cityRows = () => [
    [`${icon(14)} 加号`, rich('抽一张比这张城市高 1 个时代的牌，通常进入手牌。')],
    [`${icon(16)} 提升`, rich('先移除比这张城市高 1 个时代的整副基础牌库，再抽一张高 2 个时代的牌。')],
    [`${icon(15)} 移除`, rich('移除与这张城市同一时代的可用标准成就。')],
    [`${icon(11)} 向左　${icon(12)} 向右　${icon(13)} 向上`, rich('把自己与这张城市同色的牌堆按箭头方向展开；牌堆至少要有两张牌。')],
    [`${icon(17)} 还原展开`, rich('让对手与这张城市同色的牌堆还原展开。')],
    [`${icon(1, { search: true })} 搜索（示例）`, rich('搜索图标下面的资源决定匹配条件。时代 X 的城市展示同代基础牌库顶部至多 X 张牌，把包含该资源的牌拿入手牌，其余按自选顺序归还牌库底部。')],
  ];

  if (section === 'base') return {
    title: '基础规则', intro: '先理解一回合怎么走，再用图标比较决定发动哪张牌。',
    body: note(`本局目标：${achievementTarget(state)} 项成就`, '双人纯基础需要 6 项成就，每加入一个扩展再加 1 项。分数帮助你取得成就；分数和成就是两种不同的数值。') +
      block('轮到我，先做什么？', `<ol class="rule-steps"><li><b>看手牌和五色面板</b>${p('融合可以提高时代、增加图标或换一个可发动的效果；抽牌可以补充选择。')}</li><li><b>选择并完成一个行动</b>${p('普通回合做两次行动，可以重复选择同一种。先手的第一个回合只有一次行动。卡牌效果里的抽牌、计分等不额外消耗行动。')}</li><li><b>处理完选牌，再继续</b>${p('出现选择框时先完成选择。第二次行动结束后轮到电脑；查看规则或卡牌详情期间，电脑暂停行动。')}</li></ol>`) +
      block('四种基本行动', table(['行动', '怎么做'], [
        ['抽牌', rich('按自己面板最高置顶牌的时代抽一张牌。该时代基础牌库已空就向更高时代找；面板为空时从时代 1 开始。启用扩展时，可能改抽扩展牌。')],
        ['融合', rich('从手牌选一张，放到自己同色牌堆最上面。原顶牌被覆盖；该颜色原有的展开方向保留。空颜色也可以融合。')],
        ['发动要求／条例', rich('选择自己的一张置顶牌，按卡面顺序执行整张牌的效果。通常不能只挑其中一段。具体影响谁，见下面的图标比较。')],
        ['统御（成就行动）', rich('取得一张符合条件的可用标准成就：最高置顶时代不低于它，分数达到门槛。消耗一次行动，但不扣除分数。')],
      ])) +
      block('认清四个区域', table(['区域', '牌放在这里有什么用'], [
        ['手牌', '可以选择融合；手牌上的图标不计入面板总数。'],
        ['五色面板', '每色最上面的牌通常提供可发动效果；所有实际露出的资源图标参与比较。点击任意卡牌打开整个颜色牌堆。'],
        ['计分区', '每张计分牌按时代提供分数，另加面板奖分及伟人修正。计分区不提供普通面板图标。'],
        ['成就区', '记录已取得的成就。每项通常算 1 项，与该成就牌的时代无关。'],
      ])) +
      block('条例分享和要求攻击，如何判断？', `<div class="rule-compare-icon">${icon(4)}<span>以主导图标为「权威」为例：我方 3 个</span></div>` +
        table(['电脑的对应图标', '普通条例', '要求'], [
          ['2 个，比我少', '电脑不分享；我执行。', '电脑受到要求；我不执行自己的要求。'],
          ['3 个，与我相等', '电脑先分享，我再执行。', '电脑不受影响。'],
          ['4 个，比我多', '电脑先分享，我再执行。', '电脑不受影响。'],
        ]) + p('比较双方整个面板的可见对应图标，不只看发动牌所在颜色。资格在发动开始时固定；逐段结算，每段先由分享者执行，再由发动者执行。要求只由受影响的对手执行。') +
        note('红色感叹号是什么意思？', '条例：提示电脑能够分享。要求：提示电脑不受影响。它只是提醒，仍然允许发动；既有要求又有条例时分别判断。') +
        p('若分享者确实改变了卡牌或展开状态，整次条例结束后，发动者获得一次免费的抽牌奖励。多段都被分享，也只奖励一次；单纯展示卡牌不算变化。')) +
      block('图标与展开：只计算真正露出的部分', `<div class="rule-standard-strip">${STANDARD.map(([code]) => `<span>${icon(code)}${esc(data.icon_names[code])}</span>`).join('')}</div>` +
        p('普通资源没有固定的“点击后效果”，它们用于分享、要求及卡牌条件。上方统计是整个人的总数，各颜色统计是该堆的贡献。卡面效果旁的小图标只是主导图标提示，不额外计数。') +
        `<div class="rule-splay-controls" role="group" aria-label="展开方向示意">${Object.keys(SPLAY_SLOTS).map(dir => `<button type="button" data-rule-splay="${dir}" aria-pressed="${dir === splay}">${SPLAY_NAMES[dir]}</button>`).join('')}</div><div id="rule-splay-example" class="rule-splay-example">${rulesSplayHTML(splay, data)}</div>` +
        p('展开必须由卡牌效果允许，不能任意选择。通常要有至少两张牌；该颜色减到一张或零张时还原。上面的按钮仅演示，不改变对局。') +
        `<p>${icon(0)} 六边形位置是卡牌插图，不是普通资源；某些效果会专门统计可见插图。</p>`) +
      block('怎样取得成就、结束游戏？', p('通常取得时代 X 的标准成就需要至少 5 × X 分，并且最高置顶时代至少为 X。例如：最高时代 3、分数 15，就能花一次统御行动取得时代 3 的可用成就，分数仍为 15。') +
        p('若已拥有同一时代的成就，再取得该时代时门槛为：5 × 时代 ×（已拥有的该时代成就数 + 1）。卡牌效果直接给予成就时，按效果执行。') +
        list(['行动结束时，成就数量达到本局目标即可能获胜。特殊成就通常由系统在满足条件后自动授予，无须额外花一次统御行动。',
          '尝试抽取时代 12 或更高的牌，游戏立即结束：先比分数，再比成就数量，仍相同则平局。不是时代 11 牌库一空就立刻结束。',
          '卡牌效果也可能直接宣布胜利或淘汰玩家，此时立即按牌文处理。']) +
        details('基础五项特殊成就', specialList('Base'))) +
      block('常见操作词', table(['关键词', '实际含义'], [
        ['计分', rich('把指定牌放入计分区；它通常按时代增加分数。')],
        ['置底', rich('把牌放到自己同色牌堆的最下面，保留该堆展开。')],
        ['归还', rich('放回该牌原套组、原时代的牌库底部。')],
        ['移除', rich('放入移除区，通常不再从牌库抽到；某些效果仍可以操作它。')],
        ['转移／交换', rich('把现有牌移到指定区域。移到面板不等于融合，不触发专门要求“融合”的规则。')],
      ])) +
      details('开局与进一步阅读', p('系统为每个时代分别洗牌，并从基础时代 1–10 各预留一张标准成就。双方各抽两张时代 1 牌，选一张同时融合；按起始牌英文标题的字母顺序决定先手。') + p('“自执行”“超级执行”“连锁成就”，以及多个扩展的触发顺序，见「组合与进阶」。')),
  };
  if (section === 'echoes') return {
    title: '往日回声', intro: '下层牌的回声可以继续生效；预示让未来的牌提前进入计划。',
    body: draw('echoes') +
      note('怎样才算唯一最高？', '置顶时代为 3、2、1 时，最高的 3 只有一张，通常抽回声。置顶时代为 3、3、1 时，有两张并列最高，通常抽基础。只比较置顶牌。') +
      block(`${icon(10)} 回声：下层也能提供效果`, p('发动某颜色的置顶牌时，先执行该颜色所有可见回声，再执行置顶牌的普通效果。回声按牌堆从底到顶的顺序执行；被覆盖的回声不执行。') +
        p('回声统一使用本次发动牌的主导图标判断分享与要求，不使用各张下层牌自己的主导图标。回声标记本身不当作普通资源计数。')) +
      block(`${icon(106)} 奖分：增加分数`, p('把面板上最高的可见奖分按数值计入分数，其余每个可见奖分各加 1 分。') +
        `<div class="rule-bonus-example">${icon(106)} ${icon(104)} ${icon(102)} <b>＝ 6 ＋ 1 ＋ 1 ＝ 8 分</b></div>` +
        p('它们不是三张计分牌，也不是三项成就；奖分被覆盖后不再贡献分数。')) +
      block('预示区与推进（晋升）', `<ol class="rule-steps"><li><b>预示：为以后准备</b>${p('牌文让你预示时，将牌放到自己的预示区。它暂时不提供面板图标或分数，也不当作普通手牌。')}</li><li><b>融合行动后检查</b>${p('如果预示区有时代不高于刚融合牌的牌，必须选一张推进：将它融合，然后免费发动。效果中的融合不触发这一步。')}</li><li><b>识别“因预示执行”</b>${p('只有刚推进的那张牌在本次免费发动中满足该条件，其他牌的回声不因此获得加成。伟人和城市没有普通条例，推进它们不会凭空产生条例。')}</li></ol>` +
        note('例子', '你有一张时代 3 的预示牌。通过融合行动打出时代 4 的牌后，必须推进一张符合条件的预示牌；若这张时代 3 是唯一符合的，就推进并免费发动它。')) +
      block('预示容量取决于最佳展开', table(['面板最好的展开', '预示容量'], [
        ['没有展开', '5 张'], ['向左', '4 张'], ['向右', '3 张'], ['向上', '2 张'], ['斜向', '1 张'],
      ]) + p('只取面板中最好的方向，不把各颜色相加。已经达到容量时不能再放入；容量下降不会丢弃原有预示牌。')) +
      details('往日回声的五项特殊成就', specialList('Echoes')),
  };
  if (section === 'figures') return {
    title: '文明巨擘', intro: '伟人通过业报改变规则；他们通常无法像基础牌一样发动条例。',
    body: draw('figures') +
      block(`${icon(7)} 头像与庇佑`, p('头像是额外的一种标准资源。若自己的某张置顶伟人含有准备发动牌的原主导图标，可以选择庇佑：这次发动改用双方的头像数量比较分享与要求。') +
        `<p>例如：要发动 ${icon(4)} 权威牌，而你的置顶伟人也有 ${icon(4)} 权威，可以选择改比 ${icon(7)} 头像。能不能庇佑看伟人的印刷图标；比较的则是双方整个面板总数。</p>`) +
      block('业报（因果）：看触发条件', table(['类型', '什么时候起作用'], [
        ['When · 融合时', rich('实际融合该伟人时执行，随后按牌文处理。转移到面板不属于融合；融合行动同时涉及多个扩展时按组合顺序结算。')],
        ['Each · 持续修正', rich('伟人置顶时持续生效，例如增加图标、改变分数或可用区域。多个 Each 各自按原始实体局面计算，不把其他 Each 的修正继续放大。')],
        ['Would · 行动或操作前', rich('即将发生符合条件的操作时，按牌文替换或修改。多个 Would 同时适用时，由当前玩家选择一个。')],
        ['Decree · 法令资格', rich('改变颁布法令需要的条件，以该伟人的文字为准。')],
      ]) + note('看面板哪里？', '上方个人图标总数包含持续业报的修正；颜色牌堆的统计和展开对比显示实际露出的印刷图标，两者因此可能不同。') +
        p('When 或 Would 结算期间，不继续触发其他 When 或 Would，避免无限触发。')) +
      block('淡出（归隐）：通常只保留一位置顶伟人', p('每次行动结束、检查特殊成就和成就胜利之前，若有多张置顶伟人，选择多余的伟人计分，直到只剩一张。相关业报可能改变或阻止此过程。') +
        p('下层伟人不计入“置顶伟人”的数量。移走顶牌后露出另一位伟人时，需要继续检查。')) +
      block('法令：额外的一种行动', list([
        '通常需要手中至少有三张不同时代的伟人。可选法令的颜色取决于手中伟人的颜色；业报可能放宽条件。',
        '颁布法令会移除全部手牌，包括非伟人牌，不只是用来满足条件的三张。',
        '法令无主：执行它并取得，计为一项成就。自己已持有：再次执行。对手持有：只把法令归还公共区，本次不执行也不取得。',
      ]) + p('在行动栏点击“颁布法令”可以查看具体效果和当前是否符合条件。')) +
      details(`${icon(18)} 进阶：时代 0 与食物`, p('特定伟人贝尔·格里尔斯会引入 15 张时代 0 牌；它们并非每局开局就进入牌库。引入后，食物也是一种标准资源，参与相关图标比较。')),
  };
  if (section === 'cities') return {
    title: '命运之城', intro: '城市提供即时图标和持续成就，并能强化一次条例行动。',
    body: draw('cities') +
      note('两个常见触发例子', '手中没有城市：以融合行动在原本空的红色区域打出一张牌，可以抽城市。你用效果把某个牌堆由向左改为向右，也可以抽城市；维持原方向或还原展开则不触发。') +
      block('城市没有可发动的条例', p('城市融合后仍按颜色加入面板，并贡献可见资源。它们没有普通条例，不能直接选择来发动；自执行或超级执行城市也不会产生效果或连锁成就。')) +
      block('即时图标：只在融合行动中触发', p('通过融合行动打出城市时，依次执行中上、再中下的即时图标。卡牌效果让城市融合、置底、转移，或通过预示推进，都不会触发城市即时图标。下层露出的即时图标也不会重复触发。') +
        table(['图标', '怎么处理'], cityRows()) +
        note('搜索不是抽牌', '搜索只检查指定时代的基础牌库，不跳过空时代；找到的牌是拿入手牌。整个搜索过程，包括归还，都不触发也不受业报或扩展抽牌替换影响。放大镜下面的资源仍计入可见资源总数。')) +
      block('持续图标：可见时才计入成就', table(['图标', '条件'], [
        [`${icon(8)} 旗帜`, rich('没有对手比你拥有更多同色可见卡牌时，每个可见旗帜计 1 项成就。并列也有效；比较的是可见卡牌张数，不是资源图标数。')],
        [`${icon(9)} 喷泉`, '每个可见喷泉直接计 1 项成就。'],
      ]) + p('这些是随局面变化的成就贡献，不会取得一张实体成就牌。图标被盖住，或旗帜条件不再满足时，贡献就会失去。展开后露出的下层旗帜和喷泉也能生效。')) +
      block('签署：每回合一次强化', `<ol class="rule-steps"><li><b>选一张匹配的置顶城市</b>${p('它必须含有所发动牌原本的主导图标。先签署，再决定是否用伟人的庇佑改比头像。')}</li><li><b>支付一张手牌</b>${p('移除一张时代不高于该城市的手牌，颜色不限。每回合最多签署一次，免费条例行动也共用这个次数。')}</li><li><b>逐段执行两次</b>${p('自己的每段普通条例及回声执行两次；受影响对手的每段要求执行两次。顺序是第一段两次，再第二段两次。对手分享仍只执行一次；分享奖励仍最多一次。')}</li></ol>` +
        p('嵌套的自执行／超级执行不会另外获得一次签署强化。')) +
      details('城市五项特殊成就', specialList('Cities') +
        p('传统、美誉、盛名要求在融合带对应箭头的城市之前，该色已经按那个方向展开。荣耀、胜利要求城市从手牌被移除；从面板或计分区移除不满足。城市特殊成就在对应融合或移除发生时立即授予。')),
  };
  if (section === 'icons') return {
    title: '图标速查', intro: '悬停或点击图标可看解释。图案随卡牌颜色变化，颜色不改变图标含义。',
    body: block('标准资源：用于数量比较', `<div class="rule-icon-grid">${[...STANDARD, [7, '人像形 · 伟人相关'], [18, '食物形 · 时代 0 引入后']].map(([code, shape]) => `<article>${icon(code)}<div><h4>${esc(data.icon_names[code])}</h4><p>${shape}</p></div></article>`).join('')}</div>` +
        p('主要比较整个面板的可见数量，以发动牌的主导图标为准；某个资源不会自动带来抽牌、攻击或计分，具体效果由牌文决定。') +
        `<div class="rule-colors">${['RED', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE'].map(color => icon(4, { color })).join('')}<span>这五个都是「权威」，只是所属卡牌颜色不同。</span></div>`) +
      block('插图、回声与奖分', table(['图示', '作用'], [
        [`${icon(0)} 插图`, '不算标准资源；部分牌会专门统计可见插图。'],
        [`${icon(10)} 回声`, rich('可见时提供额外效果，在发动该颜色时先结算。')],
        [`${icon(106)} 奖分（示例：6）`, rich('最高可见奖分按数值计分，其余每个加 1 分。')],
      ])) +
      block('城市的持续图标', table(['图示', '作用'], [
        [`${icon(8)} 旗帜`, '同色可见卡牌数量不落后时，每个可见旗帜计 1 项成就。'],
        [`${icon(9)} 喷泉`, '每个可见喷泉计 1 项成就。'],
      ])) +
      block('城市的即时图标', p('以下图标只在融合行动打出城市时触发。完整条件和例子见「命运之城」。') + table(['图示', '作用'], cityRows())) +
      note('空位置就是空位置', '卡牌可能只有四个标记，也可能有六个。空位置不提供资源；效果段旁的主导图标不会额外增加面板计数。'),
  };
  return {
    title: '组合与进阶', intro: '遇到多个扩展同时触发，按这里的顺序理解。具体牌文与业报可以改变通常规则。',
    body: block('这次究竟从哪一套抽牌？', table(['触发来源', '抽取套组'], [
      ['城市专用抽牌', rich('满足城市触发条件时抽城市；城市堆空则抽基础，不再改抽回声或伟人。')],
      ['条例分享奖励', rich('开启文明巨擘时抽伟人；否则按普通抽牌处理，包括往日回声的替代规则。')],
      ['统御行动取得标准成就', rich('开启文明巨擘时，对手额外抽伟人。效果直接取得成就不等于统御行动。')],
      ['普通抽基础牌', rich('开启往日回声，且抽牌者只有一张最高时代置顶牌时，改抽回声；该回声堆空则抽基础。')],
      ['牌文明示的套组', '遵循指定套组及其空堆回退规则。搜索另算，不属于抽牌。'],
    ]) + p('通常先用基础牌库的空堆确定实际时代，再取指定套组该时代的牌。卡牌指定时代时从指定时代开始；普通抽牌行动、奖励及扩展触发抽牌通常从抽牌者最高置顶时代开始。')) +
      block('融合行动的相关结算顺序', `<ol class="rule-flow"><li>融合卡牌</li><li>城市即时图标（如适用）</li><li>新增颜色抽城市（如适用）</li><li>伟人的 When 业报（如适用）</li><li>预示区推进，并免费发动（如适用）</li></ol>` +
        p('只有符合条件的步骤才发生。如果刚融合的原牌在前一步之后已经不再置顶，停止剩余的融合后步骤。城市即时图标自己引起的展开抽牌，在那个展开发生时处理。') +
        p('结束整个行动后，先处理伟人淡出，再检查相应特殊成就及成就胜利。城市特殊成就按其条件在融合或移除发生时立即检查。')) +
      block('条例行动的相关结算顺序', `<ol class="rule-flow"><li>选择发动牌；城市签署（可选，每回合一次）</li><li>伟人庇佑（符合条件时可选）</li><li>处理适用的行动前业报，固定资格与效果</li><li>该颜色的可见回声，从底到顶</li><li>卡面普通效果，按顺序逐段执行</li><li>如有实际分享，奖励发动者抽一张</li></ol>` +
        p('发动牌中途被覆盖、转移或移除，通常仍继续已经确定的剩余效果。签署会改变每段执行次数，但不会改变分享奖励的次数。')) +
      details('自执行、超级执行、连锁成就', list([
        '自执行：按指定牌执行非要求效果，不给其他玩家分享，也不因此取得分享奖励；不必把该牌融合。',
        '超级执行：执行普通效果，并对所有对手执行要求，不比较普通的受影响资格；其他玩家不分享。',
        '若目标是面板置顶牌，自执行或超级执行也包含该颜色可见回声；其他区域的目标只包含那张牌自身的回声。',
        '在自执行或超级执行的非要求效果中，再次触发自执行或超级执行时，会在内层开始前抽取并统御一张时代 11，作为连锁成就。实际需要抽取时仍遵循空堆及游戏结束规则。',
      ])) +
      block('尚未实装的扩展', `<div class="rule-future">${EXPANSIONS.filter(item => !item.available).map(item => `<span>${esc(item.name)} <small>未实装</small></span>`).join('')}</div>` +
        p('目前它们不会进入对局。本页的组合流程仅包含基础和已实现的三个扩展。')) +
      details('规则依据与边界说明', p('本手册依据终极版官方规则 4.1，按当前双人网页的操作方式重新整理。界面沿用预示／推进、业报、法令等现有译名；不同中文版本可能称为预见／晋升、因果、政令。') +
        // Official text does not separately resolve these edge cases. The game
        // already documents its pinned BGA interpretation; do not present it as
        // an explicit official ruling.
        p('官方没有单独举例说明转移／交换进入预示区的容量边界，本项目沿用已核对的 BGA 实现，统一受容量限制。强制从他人手牌移除城市时，特殊成就按实体手牌所有者归属。这些口径及代码注释详见项目的规则实现范围。') +
        '<p><a href="./RULES.md" target="_blank" rel="noopener noreferrer">规则实现范围与资料差异 ↗</a> · <a href="https://www.asmadigames.com/rules/InnoUlt_Rulebook_v4.1.pdf" target="_blank" rel="noopener noreferrer">官方终极版规则 4.1 ↗</a></p>'),
  };
}

export function rulesHTML(state, data, richText, view = {}) {
  const section = CHAPTERS.some(([id]) => id === view.section) ? view.section : 'base';
  const splay = Object.hasOwn(SPLAY_SLOTS, view.splay) ? view.splay : 'left';
  const chapter = content(section, state, data, richText, splay);
  const expansion = EXPANSIONS.find(item => item.id === section);
  const status = expansion ? enabled(state, section) ? '本局已开启' : '本局未开启 · 仍可阅读' : section === 'base' ? '所有对局通用' : '随时查阅';
  return `<div class="rules-reader"><nav class="rules-nav" aria-label="规则章节"><span class="rules-nav-label">规则手册</span>${CHAPTERS.map(([id, title, subtitle], index) => `<button type="button" data-rules-section="${id}" ${section === id ? 'aria-current="page"' : ''}><span class="rules-nav-number">0${index + 1}</span><span><strong>${title}</strong><small>${subtitle}</small></span>${enabled(state, id) ? '<em aria-label="本局已开启">已开启</em>' : ''}</button>`).join('')}<p>悬停或点击图标、虚线词语<br>查看简短解释</p></nav><article class="rules-article"><header class="rules-chapter-header"><span class="rules-status">${status}</span><h2 id="inspector-heading" class="inspector-title" tabindex="-1">${chapter.title}</h2><p>${chapter.intro}</p></header>${chapter.body}<footer class="rules-source">终极版 4.1 · 双人玩法 · 离线规则手册</footer></article></div>`;
}
