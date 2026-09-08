/* 记事本 mock 数据 */

export const folders = [
  { id: "f1", name: "工作", count: 5 },
  { id: "f2", name: "生活", count: 4 },
  { id: "f3", name: "灵感收集", count: 3 },
];

export const allTags = ["重要", "待处理", "想法", "阅读", "购物", "项目"];

export const notes = [
  {
    id: "n1", type: "richtext", title: "周末采购备忘", folderId: "f2", tags: ["购物"],
    pinned: true, createdAt: "2026-09-05 09:12", updatedAt: "2026-09-06 21:40",
    content: "<p>猫粮 ×2 袋（快见底了）</p><p>洗衣液、鸡蛋、牛奶</p><p>绿萝——客厅那盆快不行了，看看花卉市场</p><hr><p>顺路：快递驿站取件（3-2-101）</p>",
    items: [], reminder: null,
  },
  {
    id: "n2", type: "richtext", title: "项目周会纪要", folderId: "f1", tags: ["重要", "项目"],
    pinned: true, createdAt: "2026-09-04 10:02", updatedAt: "2026-09-04 11:30",
    content: "<h3>本周进展</h3><ul><li>空间广场页视觉定稿 <strong>v2.3</strong></li><li>记账模块接口联调完成 80%</li></ul><h3>风险</h3><p>第三方登录排期未定，先保证账号密码上线。</p><blockquote>下周三前出原型全量演示</blockquote>",
    items: [], reminder: { time: "2026-09-08 09:30", repeat: "none" },
  },
  {
    id: "n3", type: "richtext", title: "《纳瓦尔宝典》读书笔记", folderId: "f3", tags: ["阅读"],
    pinned: false, createdAt: "2026-08-30 22:10", updatedAt: "2026-09-03 08:15",
    content: "<p>财富是你睡觉时也能为你赚钱的资产。</p><p><em>把自己产品化</em>：找到自己的独特知识 × 杠杆。</p><ul><li>独特知识来自热爱与好奇心</li><li>杠杆分三种：劳动力、资本、代码与媒体</li></ul>",
    items: [], reminder: null,
  },
  {
    id: "n4", type: "richtext", title: "旅行准备 · 成都", folderId: "f2", tags: ["待处理"],
    pinned: false, createdAt: "2026-09-01 19:00", updatedAt: "2026-09-02 12:00",
    content: "<p>10.2–10.5，四天三晚。</p><ul><li>民宿已订（春熙路附近，退房 12 点）</li><li>川剧变脸演出票还没买</li><li>火锅店清单：大龙燚、电台巷、组织</li><li>大熊猫基地记得提前一周约票</li></ul>",
    items: [], reminder: { time: "2026-09-10 20:00", repeat: "none" },
  },
  {
    id: "n5", type: "richtext", title: "灵感：广场页迷你日历", folderId: "f3", tags: ["想法"],
    pinned: false, createdAt: "2026-09-06 23:20", updatedAt: "2026-09-06 23:41",
    content: "<p>迷你日历每天格子下加两个小点：绿色=打卡完成，紫色=写了日记。点击直达对应日期。</p><p>可以再加一行「那年今日」的弱提示…</p>",
    items: [], reminder: null,
  },
  {
    id: "n6", type: "richtext", title: "体检报告解读", folderId: "f2", tags: [],
    pinned: false, createdAt: "2026-08-28 16:00", updatedAt: "2026-08-28 16:30",
    content: "<p>维生素 D 偏低 → 已购补剂，每天一粒随餐。</p><p>尿酸临界 → 少喝汤少吃内脏，三个月复查。</p>",
    items: [], reminder: null,
  },
  {
    id: "n7", type: "richtext", title: "九月要点", folderId: "f1", tags: ["待处理", "重要"],
    pinned: false, createdAt: "2026-09-01 08:00", updatedAt: "2026-09-05 18:22",
    content: "<ul><li>健身房会员 9 月底到期，续不续再想想（去年只去了 23 次）</li><li>报销单 7 号截止</li><li>给家里装个门口监控，爸妈家也问一下</li></ul>",
    items: [], reminder: { time: "2026-09-07 09:00", repeat: "daily" },
  },
  {
    id: "n8", type: "richtext", title: "配色方案对比", folderId: "f1", tags: ["项目"],
    pinned: false, createdAt: "2026-09-02 14:00", updatedAt: "2026-09-02 15:10",
    content: "<p>方案 A：经典蓝 #409EFF，通用安全。</p><p>方案 B：靛紫 #7C6AF0 作记事本身份色，与蓝区分度好。</p><p>结论：广场用中性，应用内各留身份色点缀。</p>",
    items: [], reminder: null,
  },
  {
    id: "n9", type: "richtext", title: "爸妈生日礼物想法", folderId: "f2", tags: ["重要"],
    pinned: false, createdAt: "2026-08-25 20:00", updatedAt: "2026-08-26 09:00",
    content: "<p>妈：颈椎按摩仪？丝巾？去年送的围巾她很喜欢。</p><p>爸：茶叶 + 紫砂杯。问问妈的意见。</p>",
    items: [], reminder: null,
  },
  {
    id: "n10", type: "richtext", title: "晨间日记模板草稿", folderId: "f3", tags: ["想法"],
    pinned: false, createdAt: "2026-08-20 07:30", updatedAt: "2026-08-20 07:50",
    content: "<p>今日三问：今天最期待什么？最重要的三件事？昨天的收获？</p>",
    items: [], reminder: null,
  },
];

export const trashedNotes = [
  {
    id: "n11", type: "richtext", title: "旧版导航方案", folderId: "f1", tags: [],
    createdAt: "2026-08-15 10:00", updatedAt: "2026-08-15 10:20",
    content: "<p>顶部导航方案 B，已废弃…</p>",
    items: [], reminder: null, deletedAt: "2026-09-01 12:00", remainDays: 24,
  },
  {
    id: "n12", type: "richtext", title: "临时草稿（作废）", folderId: "f2", tags: [],
    createdAt: "2026-08-18 18:00", updatedAt: "2026-08-18 19:00",
    content: "<p>上周买菜：西红柿、鸡蛋……已过时。</p>",
    items: [], reminder: null, deletedAt: "2026-09-03 09:00", remainDays: 26,
  },
];

/* 历史版本示例（笔记 n2） */
export const versions = [
  { id: "v3", time: "2026-09-04 11:30", words: 128, note: "当前版本" },
  { id: "v2", time: "2026-09-04 10:45", words: 96, note: "补充风险条目" },
  { id: "v1", time: "2026-09-04 10:02", words: 45, note: "初始版本" },
];
