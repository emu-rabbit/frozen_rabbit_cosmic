# A 級宇宙探索任務收錄

## 最終範圍

依 2026-11-21 使用者修正，收錄全部 A 級、包含製作配方的宇宙探索任務，包含未標高難的任務；B／C／D 級不收錄，不新增級別篩選。首頁說明使用「搜尋A級任務或物品名稱，開始求解」，其他三語語意同步。

沿用既有固定 game-data `284bb7f44b9c0976`／7.55 與 WKS revisions，不更新遊戲版本。`WKSMissionUnit.LevelGroup` 1／2／3 對應 D／C／B，4／5／6 為 A 級及其高難變體；importer 先依此欄位決定任務 membership，再匯入實際關聯配方。沒有實際任務引用的預留配方排除，未知 LevelGroup 報錯。

來源：

- [固定 WKSMissionUnit](https://github.com/xivapi/ffxiv-datamining/blob/c142b1269a76e9e3fffc42f984a5f193ba565ddc/csv/en/WKSMissionUnit.csv)
- [固定 WKSMissionRecipe](https://github.com/xivapi/ffxiv-datamining/blob/1b5c1af6a79063015f53fda7752cc84ff0545342/csv/en/WKSMissionRecipe.csv)
- [固定 EXD schema](https://github.com/xivdev/EXDSchema/blob/83e965d091116f895d5b17573cc5d12909a5f407/WKSMissionUnit.yml)

最終 catalog 為 616 missions／816 recipes／90 mechanics families，包含 432 Expert 與 384 非 Expert 配方。相較上一階段新增 176 個未標高難的 A 級任務與 192 張配方。每職業共 102 張配方；任務包含主職業為採集、第二職業為巧匠的製作部分，沒有加入純採集任務或採集求解。

## 實作與驗證

- Catalog source 及 session 預設 catalog identity 已更新；generated records 改用明確型別，避免大量 const 推導超出 TypeScript declaration serializer 上限。
- 任務資料包保留 format 5；公開資料結構沒有新增級別欄位。Generator 額外核對每個被收錄任務確實屬 A 級。
- 保留原有職業／難度／星球／種類篩選；「一般」代表沒有高難名稱，不代表新增 B／C／D 級。
- 未標高難的非 Expert A 級任務沿用既有確認提醒與短按鈕，Rust 求解與球色回報沿用前階段支援。
- 提醒的取消／確定按鈕共用相同尺寸；低品質球色使用黑色，名稱維持低品質，並保留結實原有的藍色球。
- 提交前檢查確認 portfolio adapter 保留非 Expert 配方的球色規則，不因移除 recipe identity 而覆寫為 Expert。
- Source tests 覆蓋未標高難 A 級、EX／Master A 級、D／C／B 排除，以及未知級別 fail closed。Catalog tests 覆蓋新增普通 A 配方及低級任務配方不在清單。
- 正式 WASM 測試新增普通 A 級配方 36192 的全 Normal、有界完工路徑；這只是指定滿等面板、技能全部成功的模型測試，不是遊戲內成功率或新家族全面品質保證。
- 先前 EX／EX+ 非 Expert 的 25-family 固定球色回歸仍限原有範圍，不因 catalog 擴大而改寫舊證據。

驗證命令：

```powershell
npm run typecheck
npm run test:release
npm run test:tooling
npm run build
npm run docs:check
git diff --check
```

資料重建使用原本固定 snapshot：

```powershell
npm run data:import:cosmic-expert -- --pinned
npm run data:generate:missions -- --source-dir .cache/mission-data/36c0e6045fed3162c1c51aba2250a2638193b29f-c8d8c3f2418b9c21
npm run data:verify:missions
```

最終本機驗證通過：release 141 項；tooling 31 項與 Node 48 項；Rust library／integration 全套與最終受影響測試；正式建置、公開 Rust 範例、資料包及文件檢查。瀏覽器確認首頁文案、616 個任務、既有篩選分類、非 Expert 提醒與按鈕尺寸一致。

本輪依使用者要求分類提交並交付 staging 預覽，正式站保留既有版本。未改 solver 數字版、未啟動 overnight；仍無新增遊戲內逐步 trace 或手機實機效能證據。
