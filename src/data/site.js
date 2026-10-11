// 站点全部内容数据 —— 集中在此，改文案只动这一个文件
// 视频素材来自 D:\作品集\videos，已转码至 /media/

// 媒体路径必须带 BASE_URL，不能直接写 '/media/xxx'。
// 原因：GitHub Pages 是子路径部署（https://<user>.github.io/<repo>/），
// 绝对路径 '/media/xxx' 会指向域名根目录，全部 404。
// BASE_URL 由 vite.config.js 的 base 决定（这里是 './'），拼接后即为当前目录下的相对路径。
// 写成 `(import.meta.env && import.meta.env.BASE_URL)` 而不是 `import.meta.env?.BASE_URL`：
// Vite 只认前一种写法并把它静态替换成 './'；同时让 node 直接跑本文件时不报错
// （scripts/diff_export.mjs 会 import 这个文件，node 下 import.meta.env 是 undefined）
const BASE = (import.meta.env && import.meta.env.BASE_URL) || './'
export const mediaUrl = (p) => `${BASE}media/${p}`

export const profile = {
  name: '刘杨',
  enName: 'LIU YANG',
  role: '短视频编导',
  roleEn: 'SHORT VIDEO DIRECTOR',
  role2: '新媒体运营',
  roleEn2: 'NEW MEDIA OPERATION',
  city: '北京',
  birth: '2004.04',
  since: '2024',
  intro: [
    '我做短视频，从选题到复盘一个人跑得通全流程。',
    '在【范爸爸和范妈妈】这个家庭亲子教育 IP 里，我把选题重构成 4 大内容矩阵，\n策划发布 400+ 条，运营期账号粉丝从 61w 涨到 113.5w，单条最高播放 720 万、获赞 27.9 万。',
    '拍过、剪过、也扛过设备；现在还用 AI 把脚本、字幕、素材生成这一段的周期压下来。',
    '同时带矩阵小号【范爸育儿】承接大号流量，单条最高播放 120 万+、获赞 4.4 万。',
  ],
  contact: [
    { label: 'TEL', labelCn: '电话', value: '199 3376 9731', href: 'tel:19933769731' },
    { label: 'MAIL', labelCn: '邮箱', value: '3098616818@qq.com', href: 'mailto:3098616818@qq.com' },
    { label: 'DOUYIN', labelCn: '抖音', value: 'v.douyin.com/y9KheBzTZDQ', href: 'https://v.douyin.com/y9KheBzTZDQ/' },
  ],
}

// 项目数据（Hero 与 About 模块共用）
export const stats = [
  { num: '480', unit: '+', cn: '短视频作品', en: 'SHORT VIDEOS' },
  { num: '113.5', unit: 'w', cn: '账号粉丝', en: 'FOLLOWERS' },
  { num: '720', unit: '万', cn: '单条最高播放', en: 'TOP VIEWS' },
  { num: '27.9', unit: '万', cn: '单条最高获赞', en: 'TOP LIKES' },
]

export const timeline = [
  {
    no: '01',
    period: '2025.07 — 2026.09',
    org: '北京星满川影业文化传媒有限公司',
    orgEn: 'XINGMANCHUAN PICTURES',
    title: '编导',
    titleEn: 'DIRECTOR',
    points: [
      '接手家庭亲子教育类 IP【范爸爸和范妈妈】，独立负责内容策划、选题搭建、拍摄剪辑、发布与数据复盘全流程。',
      '在原有框架上重构选题，搭建 4 大类内容矩阵：育儿口播科普 / 家庭教育方法论 / 亲子场景痛点 / 爆款书单推荐，形成可复用的选题与脚本结构，策划发布短视频 400+ 条。',
      '运营期间账号粉丝从 61w 增长至 113.5w，单条最高获赞 27.9 万、最高播放量 720 万+。',
      '私域沉淀配合转介绍机制：月均转微私域 200-250 人、转介绍家长 90 人，覆盖北京 / 上海 / 郑州 / 西安，合作学大、中公、励学、新舟等机构，实现橱窗返佣、机构返佣、星图合作与线下讲座交流出场变现。',
      '同步运营矩阵小号【范爸育儿】承接大号流量，单条最高获赞 4.4 万、最高播放 120 万+。',
    ],
  },
  {
    no: '02',
    period: '2024.07 — 2025.06',
    org: '小麻雀（邯郸）文化传媒有限公司',
    orgEn: 'XIAOMAQ MEDIA',
    title: '拍剪实习生',
    titleEn: 'SHOOT & EDIT INTERN',
    points: [
      '承担短视频的主要剪辑工作，使用剪映完成 80+ 条口播、种草、活动快剪及 Vlog 类短视频剪辑。',
      '负责节奏卡点、调色、字幕包装、音效设计、转场及封面制作，形成从粗剪到成片的 SOP。',
      '配合编导 / 运营完成口播、剧情及活动场景的拍摄，负责机位构图、现场布光及收音。',
      '在读期间每周出勤 3 天，累计参与拍摄 32 场，独立完成 16 条外景 / 棚拍素材采集。',
    ],
  },
  {
    no: '03',
    period: '2023.09 — 2026.06',
    org: '邯郸职业技术学院',
    orgEn: 'HANDAN POLYTECHNIC',
    title: '现代物流管理（专科）',
    titleEn: 'LOGISTICS MANAGEMENT',
    points: ['在校期间同步进入传媒公司实习，早于同龄人完成从学生到内容生产的身份切换。'],
  },
]

// 个人优势
export const strengths = [
  {
    no: '001',
    title: '短视频全流程',
    titleEn: 'FULL PIPELINE',
    desc: '拍摄执行、剪辑成片、脚本策划、文案选题、账号发布到数据复盘，一条链路自己能跑完。\n累计参与并策划产出短视频约 480+ 条。',
    tags: ['选题策划', '脚本', '拍摄', '剪辑', '发布', '数据复盘'],
  },
  {
    no: '002',
    title: '落地执行力',
    titleEn: 'FAST EXECUTION',
    desc: '上手速度快，能快速承接账号涨粉、引流及转化类运营工作。实习期即承担账号主要剪辑量，独立沉淀出从粗剪到成片的 SOP。',
    tags: ['80+ 条剪辑', '粗剪到成片 SOP', '32 场拍摄', '16 条独立采集'],
  },
  {
    no: '003',
    title: 'AI 工具提效',
    titleEn: 'AI POWERED',
    desc: '熟练运用 AI 工具辅助脚本构思、文案初稿、素材生成与字幕处理，\n缩短选题与制作周期，提升短视频全流程产出效率。',
    tags: ['脚本构思', '文案初稿', '素材生成', '字幕处理', '数字人'],
  },
  {
    no: '004',
    title: '增长与变现',
    titleEn: 'GROWTH & MONETIZE',
    desc: '不是只做内容，是把内容接到增长和收入上。运营期账号粉丝 61w → 113.5w，\n搭建私域—转介绍链路，月均沉淀私域 200-250 个。',
    tags: ['61w → 113.5w', '私域沉淀', '转介绍 90 人/月', '星图合作'],
  },
]

// 工具与技能 —— 按简历「专业技能」的四类归纳：内容制作 / 平台运营 / 商业转化 / AI 提效
export const skills = [
  // 内容制作
  '剪映', '达芬奇调色', 'Photoshop', 'Illustrator', '视频封面设计', '账号视觉体系', '摄影基础',
  // 平台运营
  '抖音内容策划', '选题矩阵搭建', '账号发布与运营', '数据复盘迭代',
  // 商业转化
  '私域留资', '商品橱窗', '星图合作',
  // AI 提效
  'ChatGPT', 'WorkBuddy', 'LibTV', '数字人制作',
]

// 精选作品 —— 2026-10-11 按 D:\作品集\videos 里用户整理好的 5 类共 23 个片子整体重建
// 每个条目都在源码里配好 preview + poster，所以**不能带 custom 标记**：
// 带 custom 会让 Works.jsx / Lightbox.jsx 强制回落到 no-media.jpg 灰占位图
export const works = [
  {
    slug: 'talk-01',
    no: '01',
    title: '口播剪辑 01',
    titleEn: 'TALKING EDIT 01',
    cat: '口播剪辑',
    vertical: true,
    year: '2026',
    note: '口播剪辑 · 字幕包装',
  },
  {
    slug: 'talk-02',
    no: '02',
    title: '口播剪辑 02',
    titleEn: 'TALKING EDIT 02',
    cat: '口播剪辑',
    vertical: true,
    year: '2026',
    note: '口播剪辑 · 节奏卡点',
  },
  {
    slug: 'talk-03',
    no: '03',
    title: '口播剪辑 03',
    titleEn: 'TALKING EDIT 03',
    cat: '口播剪辑',
    vertical: true,
    year: '2026',
    note: '口播剪辑 · 信息密度优化',
  },
  {
    slug: 'edit-01',
    no: '04',
    title: '剪辑 01',
    titleEn: 'EDIT REEL 01',
    cat: '剪辑与调色',
    vertical: false,
    year: '2026',
    note: '商业剪辑 · 卡点节奏',
  },
  {
    slug: 'edit-02',
    no: '05',
    title: '剪辑 02',
    titleEn: 'EDIT REEL 02',
    cat: '剪辑与调色',
    vertical: false,
    year: '2026',
    note: '剪辑 + 转场设计',
  },
  {
    slug: 'color-01',
    no: '06',
    title: '调色 01',
    titleEn: 'COLOR GRADING 01',
    cat: '剪辑与调色',
    vertical: false,
    year: '2026',
    note: '达芬奇调色 · 影调统一',
  },
  {
    slug: 'color-02',
    no: '07',
    title: '调色 02',
    titleEn: 'COLOR GRADING 02',
    cat: '剪辑与调色',
    vertical: false,
    year: '2026',
    note: '氛围调色 · 色彩叙事',
  },
  {
    slug: 'color-03',
    no: '08',
    title: '调色 03',
    titleEn: 'COLOR GRADING 03',
    cat: '剪辑与调色',
    vertical: false,
    year: '2026',
    note: '快节奏调色样片',
  },
  {
    slug: 'color-04',
    no: '09',
    title: '调色 04',
    titleEn: 'COLOR GRADING 04',
    cat: '剪辑与调色',
    vertical: false,
    year: '2026',
    note: '人物肤色与场景分离',
  },
  {
    slug: 'feed-01',
    no: '10',
    title: '信息流 01',
    titleEn: 'INFO FEED 01',
    cat: '信息流',
    vertical: true,
    year: '2026',
    note: '信息流投放版 · 前 3 秒钩子',
  },
  {
    slug: 'feed-02',
    no: '11',
    title: '信息流 02',
    titleEn: 'INFO FEED 02',
    cat: '信息流',
    vertical: true,
    year: '2026',
    note: '信息流投放版 · 转化向',
  },
  {
    slug: 'aigc-demo',
    no: '12',
    title: 'AIGC 成片',
    titleEn: 'AIGC REEL',
    cat: 'AIGC 与数字人',
    vertical: true,
    year: '2026',
    note: 'AI 生成素材整合',
  },
  {
    slug: 'opera',
    no: '13',
    title: '京剧',
    titleEn: 'PEKING OPERA',
    cat: 'AIGC 与数字人',
    vertical: false,
    year: '2026',
    note: 'AI 融合传统戏曲影像',
  },
  {
    slug: 'figure-faxiang',
    no: '14',
    title: '人物法相天地',
    titleEn: 'COSMIC FIGURE',
    cat: 'AIGC 与数字人',
    vertical: false,
    year: '2026',
    note: 'AI 视觉概念片',
  },
  {
    slug: 'drama-guzhuang',
    no: '15',
    title: '古装剧情',
    titleEn: 'PERIOD DRAMA',
    cat: 'AIGC 与数字人',
    vertical: false,
    year: '2026',
    note: '古装剧情 · 编导 + 剪辑',
  },
  {
    slug: 'dunhuang',
    no: '16',
    title: '敦煌舞',
    titleEn: 'DUNHUANG DANCE',
    cat: 'AIGC 与数字人',
    vertical: false,
    year: '2026',
    note: '舞蹈影像 · 氛围调色',
  },
  {
    slug: 'avatar-talk',
    no: '17',
    title: '数字人口播',
    titleEn: 'AI AVATAR TALK',
    cat: 'AIGC 与数字人',
    vertical: true,
    year: '2026',
    note: '数字人口播 · AI 制作流程',
  },
  {
    slug: 'vlog-hainan',
    no: '18',
    title: '海南 VLOG',
    titleEn: 'HAINAN VLOG',
    cat: 'AIGC 与数字人',
    vertical: true,
    year: '2026',
    note: '旅拍 Vlog · 拍摄 + 剪辑 + 调色',
  },
  {
    slug: 'tracking',
    no: '19',
    title: '追踪飞行',
    titleEn: 'TRACKING SHOT',
    cat: 'AIGC 与数字人',
    vertical: false,
    year: '2026',
    note: '运镜与追踪合成',
  },
  {
    slug: 'ad-brand',
    no: '20',
    title: '广告宣传',
    titleEn: 'BRAND AD',
    cat: '品牌与城市宣传',
    vertical: false,
    year: '2026',
    note: '品牌广告宣传片',
  },
  {
    slug: 'fashion',
    no: '21',
    title: '时尚宣传',
    titleEn: 'FASHION FILM',
    cat: '品牌与城市宣传',
    vertical: true,
    year: '2026',
    note: '时尚向宣传 · 竖屏投放版',
  },
  {
    slug: 'ad-luckin',
    no: '22',
    title: '瑞幸咖啡宣传',
    titleEn: 'LUCKIN COFFEE',
    cat: '品牌与城市宣传',
    vertical: false,
    year: '2026',
    note: '品牌联名宣传片',
  },
  {
    slug: 'ad-xiongan',
    no: '23',
    title: '雄安新区宣传',
    titleEn: 'XIONGAN NEW AREA',
    cat: '品牌与城市宣传',
    vertical: false,
    year: '2026',
    note: '城市形象宣传片',
  },
]

export const categories = [
  'ALL',
  '口播剪辑',
  '剪辑与调色',
  '信息流',
  'AIGC 与数字人',
  '品牌与城市宣传',
]

export const navItems = [
  { id: 'hero', cn: '首页', en: 'HOME', no: '00' },
  { id: 'about', cn: '关于我', en: 'ABOUT', no: '01' },
  { id: 'works', cn: '精选项目', en: 'WORKS', no: '02' },
  { id: 'strengths', cn: '个人优势', en: 'STRENGTHS', no: '03' },
  { id: 'contact', cn: '联系', en: 'CONTACT', no: '04' },
]

/* ============ 字号 / 位置基线 ============
   来自网页修改器的调整，已固化成源码默认值。
   用户后续在网页上再调会存在 overrides.style 里，优先级高于这里。 */
export const baseStyles = {
  'stat.0.unit': { fontSize: '30px' },
  'stat.1.unit': { fontSize: '30px' },
  'stat.2.unit': { fontSize: '29px' },
  'stat.0.cn': { fontSize: '13px' },
  'contact.TEL.value': { fontSize: '24px' },
  'contact.MAIL.value': { fontSize: '24px' },
  'contact.DOUYIN.value': { fontSize: '24px' },
  'contact.city': { fontSize: '24px' },
  'contact.based': { fontSize: '24px' },
  'hero.name': { dx: 17, dy: -48 },
  'hero.kicker': { dx: -3, dy: -42 },
  'hero.stat0.num': { dx: 0, dy: 40 },
  'hero.stat1.num': { dx: 0, dy: 39 },
  'hero.stat2.num': { dx: -1, dy: 37 },
  'about.title': { dx: 0, dy: 0 },
  'about.en': { dx: 0, dy: 9 },
}

export const marqueeText = [
  'DIRECTOR',
  '✦',
  'NEW MEDIA OPERATION',
  '✦',
  'SHORT VIDEO',
  '✦',
  '480+ FILMS',
  '✦',
  'AI POWERED',
  '✦',
]
