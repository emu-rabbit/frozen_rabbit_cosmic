# Frozen Rabbit's Cosmic

> **A little company for your next cosmic craft.** A Final Fantasy XIV Cosmic Exploration expert crafting assistant, one action at a time.

[![FFXIV](https://img.shields.io/badge/Final%20Fantasy%20XIV-FFXIV-blue.svg)](https://na.finalfantasyxiv.com/)
[![Vue](https://img.shields.io/badge/Vue-3-green.svg)](https://vuejs.org/)
[![Rust](https://img.shields.io/badge/Solver-Rust%20%2B%20WASM-orange.svg)](native/craft-kernel/README.md)

[English](#overview) · [繁體中文](#繁體中文)

## Overview

**Frozen Rabbit's Cosmic** helps FFXIV crafters decide what to do next in Cosmic Exploration expert recipes. When durability is running low, CP is getting tight, and the condition changes your plans again, the rabbit is here to help sort out the next step.

Choose a mission, enter your crafter stats, and report each action's result and the new condition. Cosmic recommends the next action from what actually happened, aiming to finish the craft with as much quality as it can.

Website: [Open Frozen Rabbit's Cosmic](https://emu-rabbit.github.io/frozen_rabbit_cosmic/)

## Core Features

### From Mission to Craft

- **Mission search and filters**: Find missions by mission or item name, then narrow the list by crafting job, difficulty, planet, or mission type.
- **Favorite missions**: Keep frequently used missions close at hand.
- **Eight crafting jobs**: Browse a catalog of 432 Cosmic Exploration expert recipes.

### Step-by-Step Guidance

- **Recommendations that follow the craft**: Each result updates progress, quality, durability, CP, and active effects before the next suggestion.
- **Room for your own choices**: Used a different available action? Report it and continue from the actual result.
- **Undo and craft records**: Undo a mistaken entry, or download the craft record once the craft ends to help explain a problem.

### Gear and Comfort

- **Equipment profiles**: Save crafter stats, food, medicine, relic tool effects, and specialist settings, then reuse them across your crafting jobs.
- **Four languages**: Traditional Chinese, Simplified Chinese, English, and Japanese, with English fallback when a translation is missing.
- **Light / dark mode**: The familiar soft green Frozen Rabbit look, ready for another evening in space.

## Getting Started

1. Create an equipment profile with your crafter stats and any food or medicine you plan to use.
2. Search for a mission, choose the item to craft, and select your equipment profile.
3. Use the suggested action in the game. If you use a different action, select that action on the website.
4. Report success or failure when needed, then select the new condition shown in the game.
5. Follow the updated suggestion and repeat until the craft ends.

Equipment profiles and preferences are saved in your browser. An ongoing craft is not restored after refreshing or closing the page, so keep the page open while crafting.

## Current Scope

Cosmic is still in development and focuses on individual Cosmic Exploration expert crafts. Results depend on your equipment, conditions, and action outcomes; recommendations do not guarantee completion or maximum quality.

You play in the game and report the results yourself. The website calculates suggestions in your browser without reading game memory or packets, or pressing buttons for you. It does not plan shared time or resources across an entire multi-item mission.

## Tech Stack

- **Frontend**: Vue 3, TypeScript, and Vite
- **Solver**: Rust, compiled to WebAssembly and run in a Web Worker
- **Interface**: PrimeVue, PrimeIcons, and Vue I18n
- **Testing**: Vitest and Rust tests

## Local Development

Install Node.js 24 with npm, and a stable Rust toolchain with Cargo and rustup. From the repository root:

```bash
rustup target add wasm32-unknown-unknown
npm ci
npm run dev
```

Open [localhost:4173](http://localhost:4173). The development command builds the Rust solver for WebAssembly before starting the website, so the first launch may take a little longer.

Useful commands:

```bash
npm run build       # Production website build
npm test            # Release test suite
npm run typecheck   # TypeScript checks
npm run docs:check  # Documentation checks
```

The production website is written to `apps/web/dist`. When hosting under a subpath, set `VITE_BASE_PATH` to that path, such as `/frozen_rabbit_cosmic/`, before building.

## Use the Solver in Your Project

The Rust solver can also be used from another application. Provide the recipe, crafter stats, and current craft state; request a recommendation, then report the actual action result to get the next one.

The [solver integration guide](native/craft-kernel/README.md) covers Git and local Cargo dependencies, configuration, the `recommend` / `observe` flow, and result handling in English and Traditional Chinese. A [complete Rust example](native/craft-kernel/examples/main_solver.rs) is included. The crate is not currently published on crates.io.

## Credits and Licenses

Cosmic builds on the work of the FFXIV community:

- **[Artisan](https://github.com/PunishXIV/Artisan)**: Its Expert Solver provides the foundation of Cosmic's crafting decisions, adapted to Rust with additional strategy improvements. The adapted code retains its BSD 3-Clause license.
- **[FFXIV Teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft)** and **[Teamcraft Simulator](https://github.com/ffxiv-teamcraft/simulator)**: Item names, food and medicine data, and references for crafting formulas and action behavior.
- **[XIVAPI](https://xivapi.com/)** and **[FFXIV datamining](https://github.com/xivapi/ffxiv-datamining)**: Recipe and mission data, game tables, and icon access.
- **[The Waking Sands](https://github.com/thewakingsands)**: Traditional and Simplified Chinese game data used for localized mission names.

Original code is licensed under the [MIT License](LICENSE). Third-party code and game materials retain their respective terms; see [Third-party notices](THIRD_PARTY_NOTICES.md) for source revisions, attribution, and license texts. When integrating or redistributing the solver, include the applicable MIT and Artisan BSD notices.

FINAL FANTASY XIV © SQUARE ENIX. This is a fan-made community tool, not affiliated with or endorsed by Square Enix. Game materials are subject to Square Enix's [Materials Usage License](https://support.na.square-enix.com/rule.php?id=5382&la=1&tag=authc).

## Sister Projects

- **[Frozen Rabbit Workshop](https://github.com/emu-rabbit/frozen_rabbit_workshop)**: Plan materials, compare preparation options, and organize your shopping, crafting, and gathering lists.
- **[Frozen Rabbit Tome](https://github.com/emu-rabbit/frozen_rabbit_tome)**: Explore gathering recommendations, rotation simulations, and collectable strategies.

## FAQ

**Q: Is every suggestion the best possible action?**

**A:** Cosmic uses Artisan's Expert Solver as a foundation and compares additional options in some situations. It cannot see future conditions or try every possible route, so better choices may still exist.

**Q: How can I report a problem?**

**A:** Open a [GitHub issue](https://github.com/emu-rabbit/frozen_rabbit_cosmic/issues) with the mission, your equipment stats, and what happened. If the craft has ended, attaching its downloaded record can help reproduce the problem.

**Q: Why is the rabbit meat frozen? Can I roast it instead?**

**A: No.**

---

*Made with love for the FFXIV community.*

---

## 繁體中文

### 冷凍兔肉的宇宙 | Frozen Rabbit's Cosmic

> **宇宙裡的高難度製作，兔肉陪你一招一招來。** 為《Final Fantasy XIV》（FFXIV）宇宙探索高難度製作設計的逐步助手。

### 專案簡介

**冷凍兔肉的宇宙** 幫助巧匠在宇宙探索高難度配方中判斷下一步。耐久快見底、CP 越用越少，偏偏球色又打亂了計畫？讓兔肉陪你整理眼前的狀況，看看接下來可以怎麼做。

選好任務、填入角色數值，每一步回報技能結果與新的球色，宇宙就會依照實際情況重新推薦技能，在完成製作的同時，盡可能爭取更好的品質。

網站連結：[開始使用冷凍兔肉的宇宙](https://emu-rabbit.github.io/frozen_rabbit_cosmic/)

### 核心功能

#### 從任務開始

- **任務搜尋與篩選**：用任務或物品名稱搜尋，也能依製作職業、難度、星球與任務種類縮小範圍。
- **我的最愛**：收藏常做的任務，下次不用重新找起。
- **八大巧匠職業**：收錄 432 個宇宙探索高難度配方。

#### 一步一步陪你製作

- **跟著實際結果調整**：每次回報後，依目前的進展、品質、耐久、CP 與技能效果，重新建議下一招。
- **也能照自己的想法走**：用了其他可用技能？照實回報，就能從新的狀態繼續。
- **復原與製作紀錄**：誤按可以復原；製作結束後，也能下載紀錄，方便回報遇到的問題。

#### 裝備與舒適度

- **裝備設定檔**：保存角色數值、食物、藥品、遺物工具效果與專家技能設定，並套用到適合的巧匠職業。
- **四語系支援**：提供繁體中文、簡體中文、English 與日本語；缺少翻譯時會顯示英文。
- **明亮／深色模式**：延續冷凍兔肉系列的柔和綠色，陪你舒服地度過宇宙裡的製作時光。

### 開始使用

1. 建立裝備設定檔，填入角色數值，選好要使用的食物與藥品。
2. 搜尋任務，選擇要製作的物品，並套用裝備設定檔。
3. 在遊戲中使用建議技能；若改用其他技能，就在網頁選擇實際使用的那一招。
4. 需要時回報技能成功或失敗，再點選遊戲中出現的新球色。
5. 查看更新後的建議，重複回報直到製作結束。

裝備設定檔與偏好會保存在你的瀏覽器中。進行中的製作不會在重新整理或關閉頁面後恢復，製作途中記得讓頁面保持開啟。

### 目前支援範圍

宇宙仍在持續開發，目前專注於宇宙探索高難度配方的單件製作。裝備、球色與技能成敗都會影響成果，推薦手法無法保證每次完成或達到滿品質。

你在遊戲裡操作，再自行回報結果；網站在瀏覽器內計算建議，不讀取遊戲記憶體或封包，也不會替你按技能。目前尚未替整個多件任務分配共用時間與資源。

### 技術架構

- **網頁介面**：Vue 3、TypeScript 與 Vite
- **求解器**：Rust 編譯成 WebAssembly，在 Web Worker 中運算
- **介面元件與多語系**：PrimeVue、PrimeIcons 與 Vue I18n
- **測試**：Vitest 與 Rust tests

### 本機開發

先安裝 Node.js 24（含 npm），以及包含 Cargo、rustup 的 Rust stable 工具鏈，再於專案根目錄執行：

```bash
rustup target add wasm32-unknown-unknown
npm ci
npm run dev
```

開啟 [localhost:4173](http://localhost:4173) 即可使用。開發指令會先將 Rust 求解器編譯為 WebAssembly，第一次啟動可能需要多等一下。

常用指令：

```bash
npm run build       # 建置正式網站
npm test            # 執行發布用測試集
npm run typecheck   # 檢查 TypeScript 型別
npm run docs:check  # 檢查文件格式與連結
```

建置結果位於 `apps/web/dist`。若網站放在子路徑，請在建置前將 `VITE_BASE_PATH` 設為對應路徑，例如 `/frozen_rabbit_cosmic/`。

### 串接到你的專案

想在自己的工具裡使用求解器，也可以直接串接 Rust 函式庫。提供配方、角色數值與目前製作狀態，取得建議後，再回報實際技能結果，就能繼續取得下一步。

[求解器串接指引](native/craft-kernel/README.md) 提供中英文說明，涵蓋 Git／本機 Cargo 安裝、設定方式、`recommend`／`observe` 呼叫流程與回傳結果處理，另附[完整 Rust 範例](native/craft-kernel/examples/main_solver.rs)。目前尚未發布至 crates.io。

### 致謝與授權

感謝以下社群專案，讓宇宙有了製作判斷與資料的基礎：

- **[Artisan](https://github.com/PunishXIV/Artisan)**：Expert Solver 是本專案求解器的主幹來源，移植至 Rust 後加入進一步的策略改善；改寫部分保留 BSD 3-Clause 授權。
- **[FFXIV Teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft)** 與 **[Teamcraft Simulator](https://github.com/ffxiv-teamcraft/simulator)**：提供物品名稱、食物與藥品資料，以及製作公式和技能行為的參考。
- **[XIVAPI](https://xivapi.com/)** 與 **[FFXIV datamining](https://github.com/xivapi/ffxiv-datamining)**：提供配方、任務、遊戲資料表與圖示來源。
- **[The Waking Sands](https://github.com/thewakingsands)**：提供任務名稱使用的繁體中文與簡體中文遊戲資料。

本專案原創程式碼採用 [MIT License](LICENSE)。第三方程式碼與遊戲素材依各自條款使用；完整來源版本、版權聲明與授權文字請見[第三方聲明](THIRD_PARTY_NOTICES.md)。串接或散布求解器時，請一併保留適用的 MIT 與 Artisan BSD 聲明。

FINAL FANTASY XIV © SQUARE ENIX。本專案為玩家自製社群工具，並非 Square Enix 官方專案，也未受到官方背書。遊戲素材適用 Square Enix 的[素材使用條款](https://support.na.square-enix.com/rule.php?id=5382&la=1&tag=authc)。

### 姊妹專案

- **[冷凍兔肉的工坊](https://github.com/emu-rabbit/frozen_rabbit_workshop)**：拆解備料需求、比較籌備方式，整理購買、製作與採集清單。
- **[冷凍兔肉的秘笈](https://github.com/emu-rabbit/frozen_rabbit_tome)**：採集策略推薦、手法模擬與收藏品判斷工具。

### 常見問題

**Q: 每次推薦的都是最佳解嗎？**

**A:** 宇宙以 Artisan 的 Expert Solver 為基礎，在部分情況下比較更多選擇。它無法預知下一個球色，也不會窮舉所有走法，因此仍可能有更好的解法。

**Q: 遇到問題可以怎麼回報？**

**A:** 歡迎到 [GitHub Issues](https://github.com/emu-rabbit/frozen_rabbit_cosmic/issues) 告訴我們任務名稱、裝備數值與發生的狀況。若製作已結束，也可以附上下載的製作紀錄，方便重現問題。

**Q: 為甚麼要把兔肉冷凍起來，可以烤來吃嗎？**

**A: 不可以。**

---

*Made with love for the FFXIV community.*
