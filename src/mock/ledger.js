/* 记账本 mock 数据 */

export const expenseCategories = [
  { id: "food", name: "餐饮", icon: "🍜", children: [{ id: "food-breakfast", name: "早餐" }, { id: "food-lunch", name: "午餐" }, { id: "food-dinner", name: "晚餐" }, { id: "food-snack", name: "零食饮料" }] },
  { id: "transport", name: "交通", icon: "🚇", children: [{ id: "transport-subway", name: "地铁公交" }, { id: "transport-taxi", name: "打车" }, { id: "transport-fuel", name: "加油" }] },
  { id: "shopping", name: "购物", icon: "🛒", children: [{ id: "shopping-daily", name: "日用" }, { id: "shopping-cloth", name: "服饰" }, { id: "shopping-digital", name: "数码" }] },
  { id: "housing", name: "居住", icon: "🏠", children: [{ id: "housing-rent", name: "房租" }, { id: "housing-utility", name: "水电物业" }] },
  { id: "fun", name: "娱乐", icon: "🎮", children: [{ id: "fun-movie", name: "电影演出" }, { id: "fun-game", name: "游戏" }, { id: "fun-video", name: "视频会员" }] },
  { id: "medical", name: "医疗", icon: "💊", children: [{ id: "medical-drug", name: "药品" }, { id: "medical-check", name: "体检" }] },
  { id: "social", name: "人情", icon: "🧧", children: [{ id: "social-gift", name: "礼物" }, { id: "social-dinner", name: "请客" }] },
  { id: "study", name: "教育", icon: "📚", children: [{ id: "study-book", name: "书籍" }, { id: "study-course", name: "课程" }] },
  { id: "pet", name: "宠物", icon: "🐱", children: [{ id: "pet-food", name: "猫粮" }, { id: "pet-vet", name: "医疗" }] },
];

export const incomeCategories = [
  { id: "salary", name: "工资", icon: "💰", children: [] },
  { id: "parttime", name: "兼职", icon: "💼", children: [] },
  { id: "invest", name: "理财", icon: "📈", children: [] },
  { id: "redpacket", name: "红包", icon: "🧧", children: [] },
  { id: "refund", name: "退款", icon: "↩️", children: [] },
];

export const accounts = [
  { id: "cash", name: "现金", type: "cash", icon: "💵", color: "#18A058", initial: 2000 },
  { id: "icbc", name: "工商银行", type: "bank", icon: "🏦", color: "#409EFF", initial: 52000 },
  { id: "alipay", name: "支付宝", type: "alipay", icon: "🅰️", color: "#1677FF", initial: 8600 },
  { id: "wechat", name: "微信", type: "wechat", icon: "💚", color: "#07C160", initial: 3200 },
  { id: "ccb", name: "信用卡", type: "credit", icon: "💳", color: "#E5484D", initial: -2300 },
];

export const members = [
  { id: "u1", name: "安", avatar: "🧑‍💻", role: "admin" },
  { id: "u2", name: "小林", avatar: "👩", role: "member" },
  { id: "u3", name: "妈妈", avatar: "👩‍🦳", role: "viewer" },
];

export const books = [
  { id: "b1", name: "日常账本", icon: "📘", monthExpense: 3280, isDefault: true, memberIds: ["u1", "u2", "u3"] },
  { id: "b2", name: "装修账", icon: "🏗️", monthExpense: 18650, isDefault: false, memberIds: ["u1", "u2"] },
  { id: "b3", name: "旅行基金", icon: "✈️", monthExpense: 890, isDefault: false, memberIds: ["u1"] },
];

function pad(n) { return n < 10 ? "0" + n : "" + n; }
function dstr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

let seed = 42;
function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function amt(base, jitter = 0.35) { return +(base * (1 - jitter + rnd() * jitter * 2)).toFixed(2); }

/* ---------------- 日常账本 b1：近 12 个月 ---------------- */

/* 餐厅/菜品备注让流水更像真人记的 */
const lunchNotes = ["公司楼下 麻辣烫", "和同事 食堂", "外卖 黄焖鸡", "兰州拉面", "沙县小吃", "茶餐厅 双拼", "外卖 咖喱饭", "公司的轻食"];
const dinnerNotes = ["火锅 人均90", "下班和对象吃饭", "夜市烧烤", "家常菜", "日料定食", "川菜馆", "自己做饭 买菜"];
const breakfastNotes = ["煎饼果子", "包子豆浆", "地铁口肠粉", "三明治 + 咖啡", "茶叶蛋 白粥"];
const taxiNotes = ["加班打车回家", "下雨打车", "赶高铁", "太晚了打车"];
const shopNotes = ["超市周采购", "纸巾 洗发水", "京东 洗衣凝珠", "生鲜 水果", "山姆囤货"];
const funNotes = ["电影 档期新片", "周末剧本杀", "游戏 月卡", "KTV 团建", "视频会员续费"];
const socialNotes = ["同事结婚 随礼", "朋友生日礼物", "请爸妈吃饭", "满月酒 随礼"];

/* b1 单笔支出池：[子分类id, 名称池, 基础金额, 账户] */
const b1Pools = [
  { pool: () => [pick(breakfastNotes), amt(9, 0.4)], cat: ["food-breakfast", "早餐"], acc: "wechat", freq: 0.55, min: 5, max: 12 },
  { pool: () => [pick(lunchNotes), amt(26, 0.45)], cat: ["food-lunch", "午餐"], acc: "alipay", freq: 0.95, min: 12, max: 30 },
  { pool: () => [pick(dinnerNotes), amt(52, 0.6)], cat: ["food-dinner", "晚餐"], acc: "alipay", freq: 0.75, min: 18, max: 120 },
  { pool: () => [pick(["奶茶", "瑞幸生椰拿铁", "咖啡续命", "喜茶"]), amt(18, 0.4)], cat: ["food-snack", "零食饮料"], acc: "wechat", freq: 0.6, min: 8, max: 35 },
  { pool: () => ["地铁通勤", 6], cat: ["transport-subway", "地铁上班"], acc: "alipay", freq: 0.7, min: 4, max: 12 },
  { pool: () => [pick(taxiNotes), amt(34, 0.5)], cat: ["transport-taxi", "打车"], acc: "wechat", freq: 0.22, min: 18, max: 80 },
  { pool: () => [pick(shopNotes), amt(96, 0.55)], cat: ["shopping-daily", "超市采购"], acc: "icbc", freq: 0.3, min: 30, max: 260 },
  { pool: () => [pick(funNotes), amt(58, 0.6)], cat: rnd() > 0.5 ? ["fun-movie", "娱乐"] : ["fun-game", "娱乐"], acc: "wechat", freq: 0.18, min: 25, max: 150 },
  { pool: () => [pick(["猫罐头", "猫砂", "猫条冻干", "猫粮补给"]), amt(115, 0.5)], cat: ["pet-food", "猫粮"], acc: "icbc", freq: 0.12, min: 45, max: 260 },
  { pool: () => [pick(["优衣库 换季", "淘宝 秋装", "球鞋 冲动消费"]), amt(320, 0.6)], cat: ["shopping-cloth", "服饰"], acc: "ccb", freq: 0.08, min: 120, max: 900 },
  { pool: () => [pick(["微信读书年卡", "买书 网易蜗牛", "B站大会员"]), amt(48, 0.5)], cat: ["study-book", "买书"], acc: "alipay", freq: 0.1, min: 18, max: 128 },
];

function addTx(list, tx) {
  list.push({ id: "t" + (10000 + list.length), ...tx });
}

function generateDailyBook() {
  const list = [];
  const today = new Date(2026, 8, 7, 20, 0);
  for (let i = 0; i < 370; i++) {
    const day = new Date(today); day.setDate(today.getDate() - i);
    const dow = day.getDay();
    const ym = day.getMonth() + 1;
    const dom = day.getDate();
    const isToday = i === 0;

    /* ---- 周期性固定支出 ---- */
    // 房租：每月 1 号
    if (dom === 1) {
      addTx(list, {
        type: "expense", amount: 3200, categoryId: "housing-rent", categoryName: "房租",
        accountId: "icbc", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), 1, 9, 10)),
        note: "房租 月付",
      });
    }
    // 水电物业：每月 5 号
    if (dom === 5) {
      addTx(list, {
        type: "expense", amount: amt(180, 0.3), categoryId: "housing-utility", categoryName: "水电物业",
        accountId: "alipay", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), 5, 11, 0)),
        note: ym === 7 || ym === 8 ? "夏天空调费 有点吓人" : "水电燃气",
      });
    }
    // 视频会员：每月 12 号
    if (dom === 12) {
      addTx(list, {
        type: "expense", amount: 25, categoryId: "fun-video", categoryName: "视频会员",
        accountId: "wechat", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), 12, 8, 30)),
        note: "爱奇艺连续包月",
      });
    }
    // 猫粮囤货：每月 18 号左右
    if (dom === 18) {
      addTx(list, {
        type: "expense", amount: amt(139, 0.35), categoryId: "pet-food", categoryName: "猫粮",
        accountId: "icbc", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), 18, 21, 0)),
        note: "猫粮 + 猫砂 囤货",
      });
    }
    // 理发：每月一次
    if (dom === 26) {
      addTx(list, {
        type: "expense", amount: amt(68, 0.4), categoryId: "shopping-daily", categoryName: "日用",
        accountId: "wechat", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), 26, 19, 0)),
        note: "理发",
      });
    }

    /* ---- 收入（周期性） ---- */
    // 工资：每月 10 号
    if (dom === 10) {
      addTx(list, {
        type: "income", amount: amt(12800, 0.06), categoryId: "salary", categoryName: "工资",
        accountId: "icbc", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), 10, 10, 0)),
        note: ym === 1 ? "工资 + 年终奖尾款" : "工资 到账",
      });
      if (ym === 1) {
        addTx(list, {
          type: "income", amount: 26000, categoryId: "salary", categoryName: "工资",
          accountId: "icbc", memberId: "u1", bookId: "b1",
          date: dstr(new Date(day.getFullYear(), 0, 15, 10, 0)),
          note: "年终奖 🧨",
        });
      }
    }
    // 理财收益：每周一
    if (dow === 1) {
      addTx(list, {
        type: "income", amount: amt(42, 0.7), categoryId: "invest", categoryName: "理财收益",
        accountId: "alipay", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), dom, 15, 0)),
        note: "基金收益",
      });
    }
    // 偶发收入
    if (dom === 15 && rnd() < 0.5) {
      addTx(list, {
        type: "income", amount: amt(380, 0.5), categoryId: "parttime", categoryName: "稿费",
        accountId: "alipay", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), 15, 14, 20)),
        note: "兼职稿费",
      });
    }
    if (dom === 2 && rnd() < 0.4) {
      addTx(list, {
        type: "income", amount: amt(88, 0.6), categoryId: "refund", categoryName: "退款",
        accountId: "wechat", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), 2, 16, 40)),
        note: "退货退款",
      });
    }
    if (ym === 2 && dom === 9) {
      addTx(list, {
        type: "income", amount: 1200, categoryId: "redpacket", categoryName: "红包",
        accountId: "wechat", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), 1, 9, 12, 0)),
        note: "长辈给的红包",
      });
    }

    /* ---- 人情/大额：低频随机 ---- */
    if (rnd() < 0.035) {
      const note = pick(socialNotes);
      addTx(list, {
        type: "expense", amount: amt(320, 0.7), categoryId: "social-gift", categoryName: "人情",
        accountId: "wechat", memberId: rnd() > 0.7 ? "u2" : "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), dom, 12 + Math.floor(rnd() * 8), Math.floor(rnd() * 60))),
        note,
      });
    }
    if (rnd() < 0.012) {
      addTx(list, {
        type: "expense", amount: amt(260, 0.4), categoryId: "medical-drug", categoryName: "医疗",
        accountId: "icbc", memberId: "u1", bookId: "b1",
        date: dstr(new Date(day.getFullYear(), day.getMonth(), dom, 15, 30)),
        note: pick(["感冒药 维C", "体检复查", "超市 药品"]),
      });
    }

    /* ---- 日常散笔 ---- */
    const weekendBoost = (dow === 0 || dow === 6) ? 1.6 : 1;
    const count = Math.round((1 + rnd() * 2.2) * weekendBoost) + (isToday ? 1 : 0);
    for (let j = 0; j < count; j++) {
      // 周末更可能吃好的/出去玩
      const weighted = [...b1Pools];
      if (dow === 0 || dow === 6) weighted.push(b1Pools[2], b1Pools[7]);
      const p = pick(weighted);
      if (rnd() > p.freq) continue;
      const [name, base] = p.pool();
      const t = new Date(day.getFullYear(), day.getMonth(), dom, 7 + Math.floor(rnd() * 14), Math.floor(rnd() * 60));
      if (t > today) continue;
      addTx(list, {
        type: "expense", amount: base,
        categoryId: p.cat[0], categoryName: p.cat[1],
        accountId: p.acc,
        memberId: rnd() > 0.82 ? "u2" : "u1",
        bookId: "b1",
        date: dstr(t),
        note: name,
      });
    }
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------------- 装修账 b2：近 10 个月，大额低频 ---------------- */

function generateDecorBook() {
  const list = [];
  const items = [
    ["材料", "瓷砖 地砖", 8600, "icbc"], ["材料", "乳胶漆 全屋", 3200, "icbc"],
    ["材料", "定制柜体 定金", 12000, "icbc"], ["材料", "木地板 客厅", 7800, "icbc"],
    ["人工", "水电改造", 9200, "icbc"], ["人工", "泥瓦工 贴砖", 8800, "icbc"],
    ["人工", "油工 刷漆", 6400, "icbc"], ["人工", "安装费 灯具五金", 2300, "wechat"],
    ["家具", "沙发 布艺三人位", 4600, "ccb"], ["家具", "餐桌椅 实木", 3100, "ccb"],
    ["家电", "空调 挂机×2", 7400, "ccb"], ["家电", "冰箱 双开门", 5200, "ccb"],
    ["家电", "洗碗机 13套", 4300, "ccb"], ["家电", "扫地机器人", 2600, "alipay"],
    ["软装", "窗帘 遮光", 1800, "wechat"], ["软装", "绿植 花架", 620, "wechat"],
    ["设计", "设计费 半包方案", 5000, "icbc"],
  ];
  const today = new Date(2026, 8, 7);
  // 每 2~3 周一笔大项，共约 20 笔
  for (let k = 0; k < 20; k++) {
    const item = items[Math.floor(rnd() * items.length)];
    const back = Math.floor((k / 20) * 290 + rnd() * 14);
    const day = new Date(today); day.setDate(today.getDate() - back);
    const hour = 10 + Math.floor(rnd() * 9);
    addTx(list, {
      type: "expense",
      amount: +(item[2] * (0.85 + rnd() * 0.3)).toFixed(2),
      categoryId: "custom-expense-decor", categoryName: item[0],
      accountId: item[3], memberId: rnd() > 0.5 ? "u2" : "u1", bookId: "b2",
      date: dstr(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 30)),
      note: item[1],
    });
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------------- 旅行基金 b3：存入 + 少量预支 ---------------- */

function generateTravelBook() {
  const list = [];
  const today = new Date(2026, 8, 7);
  // 每月 8 号定投存入
  for (let m = 0; m < 9; m++) {
    const day = new Date(2026, 8, 8); day.setMonth(day.getMonth() - m);
    addTx(list, {
      type: "income", amount: 2000, categoryId: "salary", categoryName: "工资",
      accountId: "icbc", memberId: "u1", bookId: "b3",
      date: dstr(new Date(day.getFullYear(), day.getMonth(), 8, 9, 0)),
      note: "旅行基金定存",
    });
  }
  // 成都行预演支出
  const spends = [
    ["酒店 预付两晚", 736, "alipay"], ["机票 往返", 1580, "ccb"],
    ["演出票 川剧", 320, "wechat"], ["火锅店 探店", 186, "wechat"],
  ];
  for (let s = 0; s < spends.length; s++) {
    const day = new Date(today); day.setDate(today.getDate() - 10 + s * 3);
    if (day > today) continue;
    addTx(list, {
      type: "expense", amount: spends[s][1], categoryId: "custom-expense-trip", categoryName: "旅行",
      accountId: spends[s][2], memberId: "u1", bookId: "b3",
      date: dstr(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 20, 10)),
      note: spends[s][0],
    });
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export function generateTransactions() {
  return [...generateDailyBook(), ...generateDecorBook(), ...generateTravelBook()]
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* 报表账本切换时可用的装修/旅行自定义分类名（categoryStats 会兜底到 categoryName，无需注册） */
