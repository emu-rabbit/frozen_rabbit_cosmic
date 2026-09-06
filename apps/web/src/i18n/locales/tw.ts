import { solverTw } from '../crafting'

export default {
  app: {
    title: '冷凍兔肉的宇宙',
    subtitle: '宇宙探索高難度製作助手',
    logoAlt: '冷凍兔肉的宇宙標誌',
  },
  common: {
    close: '關閉',
    toggleMenu: '開啟或關閉選單',
    closeMenu: '關閉選單',
  },
  nav: {
    primary: '主要功能',
    start: '從任務開始',
    equipmentProfiles: '裝備設定檔',
    solver: '製作求解器',
    favorites: '我的最愛',
    faq: '常見問題',
    settings: '宇宙設定',
    sponsor: '贊助冷凍庫電費',
    github: '開源原始碼 (GitHub)',
  },
  missions: {
    eyebrow: '宇宙探索任務', title: '從任務開始', description: '搜尋任務或物品名稱，開始求解',
    searchLabel: '搜尋任務或物品', searchPlaceholder: '搜尋任務或物品…', loading: '正在載入任務資料…',
    loadError: '任務資料暫時無法載入。', retry: '再試一次', empty: '找不到符合條件的任務。',
    resultCount: '共 {count} 個任務', itemCount: '包含 {count} 個製作物品', loadMore: '顯示更多任務', chooseItem: '選擇要製作的物品', chooseEquipmentProfile: '選擇裝備設定檔', equipmentProfileLabel: '裝備設定檔', equipmentRelicEffect: '遺物效果', equipmentSpecialist: '專家技能', preparingSolver: '正在準備求解器…', solverLoadError: '求解器載入失敗，請再試一次。', retrySolver: '重新載入求解器', startCrafting: '開始製作', favoriteSoon: '最愛功能預留位置',
    filters: { open: '篩選任務', title: '篩選', job: '製作職業', rank: '任務難度', planet: '星球', type: '種類', clear: '清除', apply: '套用' },
    jobs: { carpenter: '木工師', blacksmith: '鍛鐵匠', armorer: '鑄甲匠', goldsmith: '雕金匠', leatherworker: '製革匠', weaver: '裁衣匠', alchemist: '鍊金術士', culinarian: '烹調師' },
    ranks: { a: '一般', ex: '高難', 'ex-plus': '高難+', master: '超難' },
    planets: { 'sinus-ardorum': '渴望灣', phaenna: '法恩娜', oizys: '俄匊斯', auxesia: '奧克塞西亞' },
    types: { timed: '限時', weather: '天氣' },
  },
  favorites: {
    title: '我的最愛', description: '只顯示你收藏的任務，也可以繼續搜尋、篩選並開始製作。',
    add: '將{name}加入我的最愛', remove: '將{name}從我的最愛移除', addShort: '加入我的最愛', removeShort: '從我的最愛移除',
    empty: '還沒有收藏任何任務。你可以在「從任務開始」點選愛心加入。', noMatch: '收藏的任務中沒有符合條件的結果。',
  },
  equipmentProfiles: {
    title: '巧匠裝備設定檔', description: '把常用的最終面板數值保存成設定檔，選擇任務後即可快速套用。',
    listTitle: '設定檔列表', add: '新增', editTitle: '編輯設定檔', defaultLocked: '預設設定檔不可刪除，適用全部巧匠。',
    defaultName: '預設巧匠', unnamed: '未命名設定檔', defaultBadge: '預設', allJobs: '全部巧匠', jobCount: '{count} 個巧匠職業',
    name: '設定檔名稱', jobs: '可套用職業', level: '等級', craftsmanship: '作業精度', control: '加工精度', cp: 'CP 上限', afterConsumables: '（食藥後 {value}）',
    applyToJobs: '套用至 {count} 個職業', jobDialogTitle: '選擇套用職業', jobDialogDescription: '這份面板數值可以套用到哪些巧匠職業？至少保留一個。', jobDialogDone: '完成選擇',
    food: '食物', medicine: '藥品', searchFood: '搜尋食物', searchMedicine: '搜尋藥品', none: '未選擇', noFood: '無食物', noMedicine: '無藥品',
    consumablesLoading: '正在載入食藥資料…', consumablesError: '食藥資料暫時無法載入，請稍後再試。',
    quality: { hq: 'HQ', nq: 'NQ' }, bonusMax: '上限', bonusStats: { craftsmanship: '作業精度', control: '加工精度', maxCp: 'CP' },
    relicTool: '遺物工具效果', relicToolOption: '高品質時上升量x1.75', specialist: '專家技能', specialistOption: '允許專家證限定技能',
    delete: '刪除設定檔', save: '儲存設定檔', saved: '已儲存',
  },
  solver: solverTw,
  settings: {
    title: '宇宙設定',
    description: '調整冷凍兔肉的宇宙偏好設定',
    appearanceTitle: '外觀設定',
    appearanceDescription: '調整宇宙的視覺風格',
    darkMode: '深色模式',
    darkModeDescription: '開啟深色模式，適合在昏暗環境下使用',
    languageTitle: '語言版本',
    languageDescription: '本網站的顯示語言，缺乏翻譯的情況下將顯示英文',
    dataSourcesTitle: '資料來源與致謝',
    dataSourcesDescription: '感謝以下專案提供求解器主幹、任務、配方與遊戲圖示資料',
    sources: {
      artisan: '主要的求解器主幹來源',
      teamcraft: '任務與配方資料',
      xivapi: '遊戲物品與技能圖示',
    },
  },
  faq: {
    description: '這裡整理了一些大家常遇到的疑問',
    rabbitQuestion: '為甚麼要把兔肉冷凍起來，可以烤來吃嗎？',
    rabbitAnswer: '不可以',
    algorithmQuestion: '求解器的演算法是如何運作的？',
    algorithmAnswer: "v2.4 求解器以 Artisan's Expert Solver 為基礎，結合滿品質收尾、後續成果比較與任務時間判斷，依每一步的實際結果提供建議。詳細演算法介紹可參考{guide}。",
    algorithmLink: "這裡",
    optimalQuestion: '本網站的解法是最佳解嗎？',
    optimalAnswer: '主幹演算法屬於經過實驗、有一定能力的決策樹演算法，並非暴力枚舉產生的最佳解。',
    integrationQuestion: '我可以串接本網站的求解器至我的專案中嗎？',
    integrationAnswer: '想要串接請參考{guide}。注意，來自 Artisan 的 BSD 授權條款仍然生效；實作時也請一併包含本專案的 MIT 授權。',
    integrationGuideLink: 'GitHub 指引',
    footer: '還有其他疑問嗎？歡迎透過 GitHub 回報或來信聯繫：{email}',
  },
  algorithm: {
    "back": "回到常見問題",
    "version": "求解器 v2.4",
    "title": "求解器如何決定下一步？",
    "intro": "高難度製作中，一次失敗或一顆好球，就可能改變接下來的安排。求解器會根據你的裝備、配方，以及每一步回報的結果，重新選擇適合當下的技能。",
    "priority": "盡可能把耐久與 CP 換成有價值的品質，並在任務時間吃緊時，考慮更快完成製作的方式。",
    "foundation": {
      "title": "以 Artisan 的製作判斷為基礎",
      "first": "目前的求解器以 Artisan's Expert Solver 為基礎。它會查看進展、品質、耐久、CP 與正在生效的技能，判斷何時推進製作、提高品質、恢復耐久，或等待有利球色。",
      "second": "在這些判斷之上，求解器會再尋找合適的收尾方式，並在部分情況下比較其他技能的後續成果，選出下一步建議。"
    },
    "finish": {
      "title": "尋找滿品質的收尾路線",
      "first": "接近收尾時，多做一次加工可能讓品質達標，卻也可能耗盡完工所需的耐久。求解器會一起考慮進展、品質與消耗，尋找能達到滿品質並完成製作的技能順序，必要時也把恢復耐久或節省消耗的技能排進去。",
      "second": "除了較短的技能組合，它也會嘗試最多 12 招的收尾路線，並依製作規則檢查後續可能出現的球色。找到能在這些球色下成立的路線後，就會建議其中的第一招；下一步再依實際結果確認是否繼續。"
    },
    "compare": {
      "title": "等球之前，看看還有什麼選擇",
      "first": "有時候，等待好球或使用可能失敗的技能，是原本較合適的選擇。對必須達到滿品質的配方，如果還沒有確定的收尾路線，求解器會再比較：先用其他成功率 100% 的技能，之後沿用 Artisan 的判斷，能否得到更好的結果。",
      "second": "它會模擬多種後續情況，包括球色較平均、以及通常球較多的情況。若替代技能在兩種情況下都沒有減少完成與滿品質的次數，而且能多取得足夠的滿品質成果，就會改用這個建議。這些模擬用來比較選擇，實際下一球仍要等你回報。"
    },
    "opening": {
      "title": "提早安排耐久恢復",
      "first": "掌握能在後續操作中逐步恢復耐久，但需要先花費 CP。使用閒靜後，求解器會比較現在啟用掌握，是否比繼續製作或等球更有幫助，因此有時會較早建議使用掌握。",
      "second": "提早使用也有代價：眼前的有利球色可能就此錯過，留給其他技能的 CP 也會減少。求解器會把這些消耗帶入後續模擬；當比較結果支持提前掌握，而且技能可用、效果尚未生效時，才會採用。"
    },
    "shortFinish": {
      "title": "v2.4：能滿品質收尾，就少走幾步",
      "first": "已經找到滿品質的收尾路線，或品質已經達標時，求解器會再找找是否有更短的做法。只有確認較短路線也能完成製作並達到滿品質，才會採用其中的第一招。",
      "second": "這項調整不需要任務倒數，不限時的任務也能使用。它能省去部分不必要的操作，但只檢查有限的技能組合，並不代表每次都能找到最少步數。"
    },
    "time": {
      "title": "時間吃緊時，考慮減少等待",
      "first": "限時任務會從你回報第一顆球色開始，在背景估計剩餘時間，不需要手動校準。同一任務先按每個品項製作一件，在扣除預留時間後，平均分給尚未完成的品項；撤回或換品項會沿用原本的倒數。",
      "second": "時間充裕時，求解器維持原本的品質優先安排。預估來不及時，才額外比較花費 CP 恢復耐久、減少等球的做法，爭取在期限內交出有價值的成品。這是依模擬做出的取捨，可能影響最終品質，也不能保證一定趕得上；背景計時僅供策略判斷，實際剩餘時間請以遊戲內為準。"
    },
    "feedback": {
      "title": "依你實際做出的結果繼續",
      "first": "每次回報技能成敗與下一個球色後，求解器都會更新剩餘資源和技能效果，再計算下一步。即使配方與裝備相同，途中結果不同，也可能走出不同的製作順序。",
      "second": "如果你改用了其他可用技能，照實回報即可。求解器會從新的狀態接著判斷，原先安排的收尾也會重新確認，不需要勉強照著先前的建議走。"
    },
    "limits": {
      "title": "球色與裝備如何影響結果",
      "first": "裝備決定每個技能能增加多少進展與品質，以及可使用的 CP；球色則會改變當步的效果與消耗。連續不利的球色或技能失敗，可能讓原本足夠的資源變得吃緊，同樣的開局也可能得到不同成果。",
      "second": "求解器會利用已知的狀態尋找較好的選擇，但無法預知接下來的球色。為了讓每一步不必等太久，它也只搜尋一部分可能的技能組合，因此仍可能有更好的解法，或遇到無法順利完成的製作。"
    },
    "sourceIntro": "感謝 Artisan 提供高難度製作求解器的基礎。",
    "sourceLink": "查看 Artisan 原始專案"
  },
  welcome: {
    title: '歡迎來到冷凍兔肉的宇宙',
    subtitle: '在你開始之前，請先選擇偏好的語言',
    confirm: '就用這個語言開始吧！',
  },
  sponsor: {
    title: '支持冷凍兔肉的宇宙',
    description: '感謝您的支持！台灣玩家可使用綠界，海外玩家可使用 Ko-fi。如有任何問題，請聯繫：{email}',
    twProvider: '台灣地區（綠界科技）',
    twDescription: '支援超商代碼、ATM 與國內信用卡。',
    globalProvider: '全球地區（Ko-fi / PayPal）',
    globalDescription: '適合海外玩家，支援信用卡與 PayPal。',
    note: '每一份支持都能讓兔肉繼續保持冷凍。',
  },
}
