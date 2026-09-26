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
  role: '编导',
  roleEn: 'DIRECTOR',
  role2: '新媒体运营',
  roleEn2: 'NEW MEDIA',
  city: '北京',
  birth: '2004.04',
  since: '2024',
  intro: [
    '我做短视频，从选题到复盘一个人跑得通全流程。',
    '在【范爸爸和范妈妈】这个家庭亲子教育 IP 里，我把选题重构成 4 大内容矩阵，\n策划发布 400+ 条，运营期账号粉丝从 61w 涨到 112.7w，单条最高播放 720 万、获赞 27.9 万。',
    '拍过、剪过、也扛过设备；现在还用 AI 把脚本、字幕、素材生成这一段的周期压下来。',
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
  { num: '112.7', unit: 'w', cn: '账号粉丝', en: 'FOLLOWERS' },
  { num: '720', unit: '万', cn: '单条最高播放', en: 'TOP VIEWS' },
  { num: '27.9', unit: '万', cn: '单条最高获赞', en: 'TOP LIKES' },
]

export const timeline = [
  {
    no: '01',
    period: '2025.06 — 2026.09',
    org: '北京星满川影业文化传媒有限公司',
    orgEn: 'XINGMANCHUAN PICTURES',
    title: '编导',
    titleEn: 'DIRECTOR',
    points: [
      '接手家庭亲子教育类抖音 IP【范爸爸和范妈妈】，负责内容策划、选题搭建、拍摄剪辑、数据复盘。',
      '在原有框架上重构选题，搭建 4 大类内容矩阵：育儿口播科普 / 家庭教育方法论 / 亲子场景痛点 / 爆款书单推荐。',
      '策划发布短视频 400+ 条，运营期间账号粉丝从 61w 增长至 112.7w。',
      '单条最高获赞 27.9 万，最高播放量 720 万；日均转微信私域 5-9 个，橱窗返佣金 4w。',
    ],
  },
  {
    no: '02',
    period: '2024.06 — 2025.06',
    org: '小麻雀（邯郸）文化传媒有限公司',
    orgEn: 'XIAOMAQ MEDIA',
    title: '拍剪实习生',
    titleEn: 'SHOOT & EDIT INTERN',
    points: [
      '承担账号短视频的主要剪辑工作，用剪映 / 达芬奇完成 80+ 条口播、种草、活动快剪及 Vlog 剪辑。',
      '负责节奏卡点、调色、字幕包装、音效设计、转场及封面制作，形成从粗剪到成片的 SOP。',
      '配合编导完成口播、剧情及活动场景拍摄，负责设备调试、机位构图、现场布光及收音。',
      '大二在读期间每周出勤 3 天，累计参与拍摄 32 场，独立完成 16 条外景 / 棚拍素材采集。',
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
    desc: '不是只做内容，是把内容接到增长和收入上。运营期账号粉丝 61w → 112.7w，\n搭建私域—转介绍链路，月均沉淀私域 200-250 个。',
    tags: ['61w → 112.7w', '私域沉淀', '橱窗返佣 4w', '品牌合作'],
  },
]

// 工具与技能（网页修改器 skills.list 同步版：已移除「秘塔」）
export const skills = [
  '剪映', '达芬奇调色', 'Photoshop', 'Illustrator', 'ChatGPT',
  'WorkBuddy', 'LibTV', '视频封面设计', '账号视觉体系', '摄影基础', '数字人制作',
]

// 精选作品 —— 对应 D:\作品集\videos 下的文件
// 09 为网页端新增的占位模块（custom: true），视频尚未提供，回放「待上传」占位图
export const works = [
  {
    slug: 'drama-guzhuang',
    no: '01',
    title: '9.23 古装剧情',
    titleEn: 'PERIOD DRAMA',
    cat: '剧情与舞蹈',
    vertical: false,
    year: '2025',
    note: '古装剧情短片 · 编导 + 剪辑',
  },
  {
    slug: 'dance-dunhuang',
    no: '02',
    title: '敦煌舞',
    titleEn: 'DUNHUANG DANCE',
    cat: '剧情与舞蹈',
    vertical: false,
    year: '2025',
    note: '舞蹈影像 · 氛围调色',
  },
  {
    slug: 'ad-01',
    no: '03',
    title: '广告宣传 01',
    titleEn: 'ADVERTISING',
    cat: '宣传与时尚',
    vertical: false,
    year: '2025',
    note: '广告宣传片',
  },
  {
    slug: 'color-821',
    no: '04',
    title: '821 调色',
    titleEn: 'COLOR GRADING',
    cat: '剪辑与调色',
    vertical: false,
    year: '2025',
    note: '达芬奇调色 · 影调统一',
  },
  {
    slug: 'edit-03',
    no: '05',
    title: '剪辑 03',
    titleEn: 'EDIT REEL 03',
    cat: '剪辑与调色',
    vertical: false,
    year: '2025',
    note: '快节奏剪辑',
  },
  {
    slug: 'edit-01',
    no: '06',
    title: '剪辑 01',
    titleEn: 'EDIT REEL 01',
    cat: '剪辑与调色',
    vertical: false,
    year: '2025',
    note: '商业剪辑 · 卡点节奏',
  },
  {
    slug: 'edit-02',
    no: '07',
    title: '剪辑 02',
    titleEn: 'EDIT REEL 02',
    cat: '剪辑与调色',
    vertical: false,
    year: '2025',
    note: '剪辑 + 转场设计',
  },
  {
    slug: 'edit-04',
    no: '08',
    title: '剪辑 04',
    titleEn: 'EDIT REEL 04',
    cat: '剪辑与调色',
    vertical: false,
    year: '2025',
    note: '剪辑 + 音效设计',
  },
  {
    slug: 'custom-1790234885639',
    no: '09',
    custom: true,
    title: '追踪飞行',
    titleEn: 'TRACKING SHOT',
    cat: '剧情与舞蹈',
    vertical: false,
    year: '2026',
    note: '',
    src: mediaUrl('preview/custom-1790234885639.mp4'),
    poster: mediaUrl('poster/custom-1790234885639.jpg'),
  },
  {
    slug: 'fashion',
    no: '10',
    title: '时尚宣传',
    titleEn: 'FASHION FILM',
    cat: '宣传与时尚',
    vertical: true,
    year: '2025',
    note: '时尚向宣传片 · 竖屏投放版',
  },
  {
    slug: 'vlog-hainan',
    no: '11',
    title: '海南 VLOG',
    titleEn: 'HAINAN VLOG',
    cat: 'VLOG',
    vertical: true,
    year: '2025',
    note: '旅拍 Vlog · 拍摄 + 剪辑 + 调色',
  },
  {
    slug: 'ai-marketing',
    no: '12',
    title: '智能营销成片',
    titleEn: 'AI MARKETING',
    cat: '数字人与智能制作',
    vertical: true,
    year: '2025',
    note: 'AI 辅助营销短片',
  },
  {
    slug: 'marketing-02',
    no: '13',
    title: '营销成片 02',
    titleEn: 'MARKETING 02',
    cat: '营销作品',
    vertical: true,
    year: '2025',
    note: '转化向营销短片',
  },
  {
    slug: 'avatar-0919',
    no: '14',
    title: '9 月 19 日口播',
    titleEn: 'TALKING HEAD',
    cat: '数字人口播剪辑',
    vertical: true,
    year: '2025',
    note: '口播剪辑 · 字幕包装',
  },
  {
    slug: 'ai-edit',
    no: '15',
    title: '智能剪辑成片',
    titleEn: 'AI EDITING',
    cat: '数字人与智能制作',
    vertical: true,
    year: '2025',
    note: 'AI 智能剪辑流程成片',
  },
  {
    slug: 'ai-avatar',
    no: '16',
    title: '数字人口播',
    titleEn: 'AI AVATAR',
    cat: '数字人与智能制作',
    vertical: true,
    year: '2025',
    note: '数字人口播成片 · AI 制作流程',
  }
]

export const categories = [
  'ALL',
  '剧情与舞蹈',
  '剪辑与调色',
  '宣传与时尚',
  '数字人与智能制作',
  '数字人口播剪辑',
  'VLOG',
  '营销作品',
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
