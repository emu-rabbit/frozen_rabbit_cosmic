# 普通配方開發樣本

這是有限的 native 開發評測，不是遊戲成功率、全配方驗收或 unattended 長跑。結案結果見 [階段報告](../../reports/cosmic-standard-search-stage-20260907.md)。在 repository 根目錄執行。

先確認 `.tmp/raphael-reference/upstream` 存在且 HEAD 為 `411168605989d573d89f2d71c01acac9f099e55a`。缺少時才從 `https://github.com/KonaeAkira/raphael-rs.git` clone 到該路徑，並 checkout 此 revision；不要覆寫既有 checkout。Wrapper 的 Cargo manifest 已指向此來源。

```powershell
git -C .tmp/raphael-reference/upstream rev-parse HEAD
cargo build --manifest-path tools/evaluate-normal-reference/native/Cargo.toml --release --locked
node tools/evaluate-cosmic-standard/prepare.mjs .tmp/cosmic-standard-replay
node tools/evaluate-cosmic-standard/screen.mjs raphael .tmp/cosmic-standard-replay
node tools/evaluate-cosmic-standard/screen.mjs policy .tmp/cosmic-standard-replay generic-craft-exp-cosmic-standard-search 0 16
node tools/evaluate-cosmic-standard/summarize.mjs .tmp/cosmic-standard-replay
```

`prepare` 建立 24 個開發輸入；`raphael` 選其中四個，8 秒／案，整批 40 秒 timeout；`policy` 固定三個目標裝備切片，16 seed／片，整批 55 秒 timeout，單一 native process。`summarize` 檢查 48 個不重複 episode 與四個 reference，保存至輸出目錄的 `stage-summary.json`。超時不產生成功報告；可用 Ctrl+C 中止。檔名相同會覆寫，重跑應使用新的輸出目錄。工具不在 Web bundle。

球色權重明示為合成 Normal／Good／Excellent 78／20／2，強制轉移由 mechanics 處理。開發 seed 已被用於調參；本工具預設沒有啟動獨立確認。原始 `computeNs` 是整件累計，`maxRecommendationNs` 才是單步最大值。不同 binary 的時間與 hash 會改變，不要求重現相同耗時。
