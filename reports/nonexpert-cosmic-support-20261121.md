# 非 Expert 宇宙探索任務支援

## 範圍與來源

依 2026-11-21 使用者要求，在既有宇宙探索 Expert catalog 外，加入任務英文名稱以 `EX:`／`EX+:` 開頭、但配方 `IsExpert=false` 的 100 級配方。任務難度名稱、配方旗標與球色集合分開保存；不是加入所有一般宇宙探索任務。

沿用 catalog 固定的 XIVAPI game-data `284bb7f44b9c0976`／7.55、schema `83e965d091116f895d5b17573cc5d12909a5f407`，以及原有 WKS revisions，於本次重新擷取同版本資料。來源 metadata 由 generated module 和任務 manifest 擁有。

- 原有 432 個 Expert recipe 的全部既有欄位逐筆對照均未改變。
- 新增 192 個非 Expert recipe，涵蓋 25 個新 mechanics families；總計 624 recipes／75 families／440 missions。
- 新增配方中，152 個使用 `ConditionsFlag=15`，40 個使用 `995`。因此不能用 `IsExpert=false` 推定一般四球色。
- 新增品質類型包含 104 個收藏品、72 個 HQ 配方與 16 個必要品質配方。
- 本次未更新成全新遊戲版本；繁中名稱沿用既有 Teamcraft snapshot 與 fallback。

收錄來源為固定版本 [XIVAPI Recipe](https://v2.xivapi.com/api/sheet/Recipe/37041?version=284bb7f44b9c0976) 與 [WKSMissionUnit](https://github.com/xivapi/ffxiv-datamining/blob/c142b1269a76e9e3fffc42f984a5f193ba565ddc/csv/en/WKSMissionUnit.csv)。球色倍率與轉換主要依固定版本 [Artisan Simulator](https://github.com/PunishXIV/Artisan/blob/882202ce04fcd4fe405812ea24d78b660d8ff64e/Artisan/CraftingLogic/Simulator.cs) 的 `GetNextCondition`／品質倍率，並參照 [Teamcraft QualityAction](https://github.com/ffxiv-teamcraft/simulator/blob/master/src/model/actions/quality-action.ts)、[Teamcraft simulation](https://github.com/ffxiv-teamcraft/simulator/blob/master/src/simulation/simulation.ts) 與 [原始 crafting model](https://github.com/Ermad/ffxiv-craft-opt-web/blob/master/app/js/ffxivcraftmodel.js)；屬社群模型佐證，沒有新增遊戲內 trace。

## 實作

- Excellent／Poor 加入 Rust、Web DTO、session 與四語球色顯示；品質倍率為 4／0.5，高品質限定技能可在 Excellent 使用，工具額外倍率仍只作用於 Good。
- 非 Expert 配方 Good→Normal（包含 995 特殊球色配方），Excellent→Poor、Poor→Normal；保留球色的 no-step 技能不消耗球色，重新觀察則消耗。Poor 只在 forced transition 出現，不列為隨機回報選項。995 的可用球色與 GoodOmen→Good 等特殊轉換保留，Good 仍依非 Expert 規則回 Normal。
- Rust 對 Excellent 優先考慮品質技能，Poor 考慮重新觀察、未完工的進展或 setup；仍共用既有資源與完工策略。
- 任務點開時顯示使用者指定的繁中提醒，並同步其他三語；取消返回原處，確認後才進入設定。重新開啟、重設與連續任務入口均遵循確認流程；確認後焦點移到已選物品。
- 更新 mechanics、condition、session、catalog identities；公開 Rust API 與 Web ABI 為 v3，episode v8 為 182 欄／11×11 矩陣。舊 v7 Expert fixtures 可讀，不冒充新版輸入。Solver 數字版仍為 v2.4，本輪沒有宣稱策略品質升版。
- 任務 bundle format 5 保存實際 `isExpert`，避免 UI 依名稱猜測。資料包帶四語更新摘要。
- 固定雜湊的授權文字資產以原始 LF 位元組保存，避免 Windows checkout 轉換換行造成 checksum 不符。
- Rust 評測共用矩陣包含新 families；凍結 TypeScript capability bound 維持原 Expert corpus，不將舊上界工具宣稱為新配方驗證。

## 驗證與限制

正式 WASM 與 Rust tests 涵蓋倍率、條件限定技能、forced transition、no-step、重新觀察、隨機游標、偏離、重設與完整製作。工藝瓶在指定測試裝備下的全 Normal／固定彩色路徑均滿品質完工。

新增 25 個 family 各取一個代表配方，在 5408／5237／722、非專家、無工具加成下，測試兩條有界路徑，每件最多 80 actions。原始輸出與 WASM hash 見 [smoke JSON](nonexpert-cosmic-smoke-20261121.json)。

| 固定球色路徑 | 完工 | 滿品質完工 | 耐久／必要品質失敗 | 80 actions 仍未結束 |
| --- | ---: | ---: | ---: | ---: |
| 全 Normal | 18/25 | 8/25 | 2/25 | 5/25 |
| 循環配方宣告的隨機球色 | 25/25 | 25/25 | 0/25 | 0/25 |

兩條路徑都假設所有技能成功，不能視為自然成功率、隨機失敗測試或全裝備保證。檢查中沒有非法推薦或 policy-null；全 Normal 的具體未完工 recipe IDs 為 36653、37390、37391、37399、37775、37777、38195。新增任務仍是 best-effort，不能把這次支援解讀為全部配方保證滿品質。

瀏覽器已檢查：工藝瓶搜尋、提醒原文、取消／重開／確認、確認後鍵盤焦點、正式 WASM 推薦、Excellent→Poor→Normal、undo、重設再提示、既有 Expert 任務直接進設定，以及 360px 深色畫面無橫向溢出。尚未進行遊戲內驗證或手機實機效能測量；未 push、部署或啟動 overnight。

驗證命令：

```powershell
npm run build
npm run test:release
npm run test:tooling
npm run docs:check
cargo test --manifest-path native/craft-kernel/Cargo.toml --lib --tests
git diff --check
```

資料重建沿用固定來源：

```powershell
npm run data:import:cosmic-expert -- --pinned
npm run data:generate:missions -- --source-dir .cache/mission-data/36c0e6045fed3162c1c51aba2250a2638193b29f-c8d8c3f2418b9c21
npm run data:verify:missions
```
