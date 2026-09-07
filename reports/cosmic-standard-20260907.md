# 宇宙普通球色策略：第一階段

日期：2026-09-07。分支：`codex/all-cosmic-crafting`。這是有界開發篩選，不能當成遊戲成功率或全任務品質保證。

## 範圍與設計

使用者同意共用 Rust mechanics、普通策略與既有高難策略分工。普通策略參考 Artisan StandardSolver 的球色、連段與修復優先順序；不是完整逐行移植。候選先經實際 Rust legality／transition，再檢查有界進展收尾；收尾方案不預言未來品質。無可行收尾時回到明示 best-effort，可能失敗。

只有宣告包含 Excellent、且沒有專家特殊球色的集合使用 Standard；其他集合委派原 v2.4。全部配方已進 catalog，不代表特殊球色、每個 objective 或每種裝備皆已驗證。新策略使用 `generic-craft-exp-cosmic-standard`，沒有取得新數字版本。

共用機制加入技能等級、五種作業威力特性、內靜與倉促加工特性等級、一次性技能初始化，以及依角色實際等級比較配方公式倍率。普通球色倍率與固定轉移由 Rust 結算；Web preview、回報與 replay 共用同一 WASM。固定等級配方不接受不足等級的裝備設定檔，UI 顯示原因。

## 驗證方法

`tests/cosmicMechanicsWasm.test.ts` 在實際產品 WASM 上做連續回報，共 412 案例：83 個普通球色 family 的滿等代表，各兩組合成裝備與兩條球色帶；另選四個品質／耐久比高的浮動配方，涵蓋 10、30、50、70、90 級。裝備使用建議作業精度的 1 與 1.5 倍同時作為作業精度、加工精度；CP 為低於 50 級 300、其餘 600。這不是真實玩家裝備分布。

球色帶為全通常，以及每四次操作的彩球機會並遵守彩球→黑球→通常。隨機技能以操作序號奇偶決定成敗，僅為固定壓力案例。每步檢查非空推薦、合法技能與 Rust 回報接受；完整成功、滿品質與終局失敗分開保存。

可重播並匯出逐案例結果：

```powershell
npm run build:web-wasm
$env:STANDARD_SCREEN_OUTPUT = '.tmp/standard-screen.json'
npx vitest run --config vitest.release.config.ts tests/cosmicMechanicsWasm.test.ts
Remove-Item Env:STANDARD_SCREEN_OUTPUT
```

既有高難委派另以三個當前球色比較新 wrapper 與 v2.4 的 action、option、persona、context fingerprint。這不是完整高難重評。

## 尚未解決

本輪最終 412 案例中，401 完成、295 滿品質、11 失敗；沒有非法推薦或 policy-null。滿品質數包含於完成數中，未滿品質的完成不算滿品質成功。失敗集中於 `36188`、`36192`、`36212` 的進展／資源不足，以及 `37985` 的硬性品質門檻。逐案例資料見 [結果 JSON](cosmic-standard-20260907.json)。這些案例參與過改進，屬於開發集，不是保留集確認。

本輪通過正式 build（資料、typecheck、Vite、SEO）、release suite、Rust library／integration tests 與 docs:check。新增等級邊界與實際配方倍率比較測試；建置仍有大型 chunk 提示。未做部署或視覺／遊戲實證。

- 一般配方薄耐久與高進展的收尾覆蓋仍有限；硬性品質門檻與弱裝備仍可失敗。
- 尚未提供精修任務解鎖設定；目前假設已完成對應職業任務。技能達到等級不等於已完成任務。
- 尚未建立普通策略與完整 Artisan Standard 上游的 paired baseline；本次不宣稱優於 Artisan。
- 尚無低等級遊戲逐步實證、真實球色機率、手機延遲或本輪瀏覽器視覺驗證。
- 普通策略尚未依剩餘時間換取品質／步數，只有沿用操作數上限；既有特殊球色分支仍接收時間預算。
- family 數沿用原 mechanics signature；不同收藏門檻與浮動等級需要在正式效果評測時進一步拆分。

來源：[Artisan StandardSolver](https://github.com/PunishXIV/Artisan/blob/main/Artisan/CraftingLogic/Solvers/StandardSolver.cs)、[Simulator](https://github.com/PunishXIV/Artisan/blob/main/Artisan/CraftingLogic/Simulator.cs)、[官方巧匠技能說明](https://na.finalfantasyxiv.com/crafting_gathering_guide/carpenter/)。遊戲配方與等級資料版本由 `COSMIC_GENERATED_SOURCE` 擁有。
