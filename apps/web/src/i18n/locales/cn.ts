import { solverCn } from '../crafting'

export default {
  app: {
    title: '冷冻兔肉的宇宙',
    subtitle: '宇宙探索高难度制作助手',
    logoAlt: '冷冻兔肉的宇宙标志',
  },
  common: {
    close: '关闭',
    toggleMenu: '打开或关闭菜单',
    closeMenu: '关闭菜单',
  },
  nav: {
    primary: '主要功能',
    start: '从任务开始',
    equipmentProfiles: '装备设置档',
    solver: '制作求解器',
    favorites: '我的收藏',
    faq: '常见问题',
    settings: '宇宙设置',
    sponsor: '赞助冷冻库电费',
    github: '开源代码 (GitHub)',
  },
  missions: {
    eyebrow: '宇宙探索任务', title: '从任务开始', description: '搜索任务或物品名称，开始求解',
    searchLabel: '搜索任务或物品', searchPlaceholder: '搜索任务或物品…', loading: '正在加载任务数据…',
    loadError: '任务数据暂时无法加载。', retry: '再试一次', empty: '找不到符合条件的任务。',
    resultCount: '共 {count} 个任务', itemCount: '包含 {count} 个制作物品', loadMore: '显示更多任务', chooseItem: '选择要制作的物品', chooseEquipmentProfile: '选择装备设置档', equipmentProfileLabel: '装备设置档', equipmentRelicEffect: '遗物效果', equipmentSpecialist: '专家技能', preparingSolver: '正在准备求解器…', solverLoadError: '求解器加载失败，请重试。', retrySolver: '重新加载求解器', startCrafting: '开始制作', favoriteSoon: '收藏功能预留位置',
    filters: { open: '筛选任务', title: '筛选', job: '制作职业', rank: '任务难度', planet: '星球', type: '类型', clear: '清除', apply: '应用' },
    jobs: { carpenter: '木工匠', blacksmith: '锻铁匠', armorer: '铸甲匠', goldsmith: '雕金匠', leatherworker: '制革匠', weaver: '裁衣匠', alchemist: '炼金术士', culinarian: '烹调师' },
    ranks: { a: '一般', ex: '高难', 'ex-plus': '高难+', master: '超难' },
    planets: { 'sinus-ardorum': '憧憬湾', phaenna: '法恩娜', oizys: '俄匊斯', auxesia: '奥克塞西亚' },
    types: { timed: '限时', weather: '天气' },
  },
  favorites: {
    title: '我的收藏', description: '只显示你收藏的任务，也可以继续搜索、筛选并开始制作。',
    add: '将{name}加入我的收藏', remove: '将{name}从我的收藏移除', addShort: '加入我的收藏', removeShort: '从我的收藏移除',
    empty: '还没有收藏任何任务。你可以在“从任务开始”点击爱心加入。', noMatch: '收藏的任务中没有符合条件的结果。',
  },
  equipmentProfiles: {
    title: '巧匠装备设置档', description: '将常用的最终面板数值保存为设置档，选择任务后即可快速应用。',
    listTitle: '设置档列表', add: '新增', editTitle: '编辑设置档', defaultLocked: '默认设置档不可删除，适用于全部巧匠。',
    defaultName: '默认巧匠', unnamed: '未命名设置档', defaultBadge: '默认', allJobs: '全部巧匠', jobCount: '{count} 个巧匠职业',
    name: '设置档名称', jobs: '可应用职业', level: '等级', craftsmanship: '作业精度', control: '加工精度', cp: 'CP 上限', afterConsumables: '（食药后 {value}）',
    applyToJobs: '应用至 {count} 个职业', jobDialogTitle: '选择应用职业', jobDialogDescription: '这份面板数值可以应用到哪些巧匠职业？请至少保留一个。', jobDialogDone: '完成选择',
    food: '食物', medicine: '药品', searchFood: '搜索食物', searchMedicine: '搜索药品', none: '未选择', noFood: '无食物', noMedicine: '无药品',
    consumablesLoading: '正在加载食药数据…', consumablesError: '食药数据暂时无法加载，请稍后再试。',
    quality: { hq: 'HQ', nq: 'NQ' }, bonusMax: '上限', bonusStats: { craftsmanship: '作业精度', control: '加工精度', maxCp: 'CP' },
    relicTool: '遗物工具效果', relicToolOption: '高品质时上升量x1.75', specialist: '专家技能', specialistOption: '允许专家证限定技能',
    delete: '删除设置档', save: '保存设置档', saved: '已保存',
  },
  solver: solverCn,
  settings: {
    title: '宇宙设置',
    description: '调整冷冻兔肉的宇宙偏好设置',
    appearanceTitle: '外观设置',
    appearanceDescription: '调整宇宙的视觉风格',
    darkMode: '深色模式',
    darkModeDescription: '开启深色模式，适合在昏暗环境下使用',
    languageTitle: '语言版本',
    languageDescription: '本网站的显示语言，缺乏翻译的情况下将显示英文',
    dataSourcesTitle: '数据来源与致谢',
    dataSourcesDescription: '感谢以下项目提供求解器主干、任务、配方与游戏图标数据',
    sources: {
      artisan: '主要的求解器主干来源',
      teamcraft: '任务与配方数据',
      xivapi: '游戏物品与技能图标',
    },
  },
  faq: {
    description: '这里整理了一些大家常遇到的疑问',
    rabbitQuestion: '为什么要把兔肉冷冻起来，可以烤来吃吗？',
    rabbitAnswer: '不可以',
    algorithmQuestion: '求解器的算法是如何运作的？',
    algorithmAnswer: "v2.4 求解器以 Artisan's Expert Solver 为基础，结合满品质收尾、后续成果比较与任务时间判断，根据每一步的实际结果提供建议。详细算法介绍可参考{guide}。",
    algorithmLink: "这里",
    optimalQuestion: '本网站的解法是最优解吗？',
    optimalAnswer: '主干算法是经过实验、具备一定能力的决策树算法，并非通过暴力枚举产生的最优解。',
    integrationQuestion: '我可以将本网站的求解器接入我的项目吗？',
    integrationAnswer: '如需接入，请参考{guide}。请注意，来自 Artisan 的 BSD 许可条款仍然有效；实现时也请一并包含本项目的 MIT 许可。',
    integrationGuideLink: 'GitHub 指引',
    footer: '还有其他疑问吗？欢迎通过 GitHub 反馈或来信联系：{email}',
  },
  algorithm: {
    "back": "返回常见问题",
    "version": "求解器 v2.4",
    "title": "求解器如何决定下一步？",
    "intro": "高难度制作中，一次失败或一个好球，就可能改变接下来的安排。求解器会根据你的装备、配方，以及每一步报告的结果，重新选择适合当前情况的技能。",
    "priority": "尽可能把耐久与 CP 换成有价值的品质，并在任务时间吃紧时，考虑更快完成制作的方式。",
    "foundation": {
      "title": "以 Artisan 的制作判断为基础",
      "first": "当前的求解器以 Artisan's Expert Solver 为基础。它会查看进展、品质、耐久、CP 与正在生效的技能，判断何时推进制作、提高品质、恢复耐久，或等待有利球色。",
      "second": "在这些判断之上，求解器还会寻找合适的收尾方式，并在部分情况下比较其他技能的后续成果，选出下一步建议。"
    },
    "finish": {
      "title": "寻找满品质的收尾路线",
      "first": "接近收尾时，多做一次加工可能让品质达标，却也可能耗尽完成制作所需的耐久。求解器会一起考虑进展、品质与消耗，寻找能达到满品质并完成制作的技能顺序，必要时也把恢复耐久或节省消耗的技能安排进去。",
      "second": "除了较短的操作顺序，它也会尝试最多 12 个技能的收尾路线，并根据制作规则检查后续可能出现的球色。找到能在这些球色下成立的路线后，就会建议其中的第一个技能；下一步再根据实际结果确认是否继续。"
    },
    "compare": {
      "title": "等球之前，看看还有什么选择",
      "first": "有时候，等待好球或使用可能失败的技能，是原本较合适的选择。对必须达到满品质的配方，如果还没有确定的收尾路线，求解器会再比较：先用其他成功率 100% 的技能，之后沿用 Artisan 的判断，能否得到更好的结果。",
      "second": "它会模拟多种后续情况，包括球色较均匀、以及通常球较多的情况。如果替代技能在两种情况下都没有减少完成与满品质的次数，而且能多取得足够的满品质成果，就会改用这个建议。这些模拟用于比较选择，实际下一个球色仍要等你报告。"
    },
    "opening": {
      "title": "提前安排耐久恢复",
      "first": "掌握能在后续操作中逐步恢复耐久，但需要先花费 CP。使用闲静后，求解器会比较现在启用掌握，是否比继续制作或等球更有帮助，因此有时会较早建议使用掌握。",
      "second": "提前使用也有代价：当前的有利球色可能就此错过，留给其他技能的 CP 也会减少。求解器会把这些消耗带入后续模拟；当比较结果支持提前掌握，而且技能可用、效果尚未生效时，才会采用。"
    },
    "shortFinish": {
      "title": "v2.4：能满品质收尾，就少走几步",
      "first": "已经找到满品质的收尾路线，或品质已经达标时，求解器会再找找是否有更短的做法。只有确认较短路线也能完成制作并达到满品质，才会采用其中的第一招。",
      "second": "这项调整不需要任务倒计时，不限时的任务也能使用。它能省去部分不必要的操作，但只检查有限的技能组合，并不代表每次都能找到最少步数。"
    },
    "time": {
      "title": "时间吃紧时，考虑减少等待",
      "first": "限时任务会从你报告第一颗球色开始估计剩余时间，不需要手动校准。同一任务先按每个品项制作一件，在扣除预留时间后，平均分给尚未完成的品项；撤回或换品项会沿用原本的倒计时。",
      "second": "时间充裕时，求解器维持原本的品质优先安排。预计来不及时，才额外比较花费 CP 恢复耐久、减少等球的做法，争取在期限内交出有价值的成品。这是根据模拟做出的取舍，可能影响最终品质，也不能保证一定赶得上；画面倒计时是本机估计，仍请留意游戏内的时间。"
    },
    "feedback": {
      "title": "根据你的实际结果继续",
      "first": "每次报告技能成败与下一个球色后，求解器都会更新剩余资源和技能效果，再计算下一步。即使配方与装备相同，途中结果不同，也可能走出不同的制作顺序。",
      "second": "如果你改用了其他合法技能，如实报告即可。求解器会从新的状态继续判断，原先安排的收尾也会重新确认，不需要勉强照着先前的建议走。"
    },
    "limits": {
      "title": "球色与装备如何影响结果",
      "first": "装备决定每个技能能增加多少进展与品质，以及可使用的 CP；球色则会改变当前操作的效果与消耗。连续不利的球色或技能失败，可能让原本足够的资源变得紧张，同样的开局也可能得到不同成果。",
      "second": "求解器会利用已知状态寻找较好的选择，但无法预知接下来的球色。为了让每一步不必等太久，它也只搜索一部分可能的操作顺序，因此仍可能有更好的解法，或遇到无法顺利完成的制作。"
    },
    "sourceIntro": "感谢 Artisan 提供高难度制作求解器的基础。",
    "sourceLink": "查看 Artisan 原始项目"
  },
  welcome: {
    title: '欢迎来到冷冻兔肉的宇宙',
    subtitle: '开始之前，请先选择偏好的语言',
    confirm: '就用这个语言开始吧！',
  },
  sponsor: {
    title: '支持冷冻兔肉的宇宙',
    description: '感谢您的支持！台湾玩家可使用绿界，海外玩家可使用 Ko-fi。如有任何问题，请联系：{email}',
    twProvider: '台湾地区（绿界科技）',
    twDescription: '支持便利店代码、ATM 与台湾信用卡。',
    globalProvider: '全球地区（Ko-fi / PayPal）',
    globalDescription: '适合海外玩家，支持信用卡与 PayPal。',
    note: '每一份支持都能让兔肉继续保持冷冻。',
  },
}
