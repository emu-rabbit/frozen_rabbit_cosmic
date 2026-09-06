# 下一輪 Solver 評測 Brief

`last_updated: 2026-09-06`

使用者已採用 v2.4，本機 Web／Rust façade 同步接入，行為等同已拆分的 `exp-time-budgeted-recovery`。採用與版本核對見 [採用紀錄](../reports/generic-cosmic-overnight/v240-adoption-20260906.md)，計時與 optional API 決策見 [拆分報告](../reports/generic-cosmic-overnight/time-budgeted-recovery-implementation-20260906.md)。舊合併策略的 [獨立長跑判讀](../reports/generic-cosmic-overnight/compact-recovery-s64-review-20260906.md) 是歷史對照，不能充當新分支的獨立證據。

## 下一步驗證

不需要原封不動重跑舊 64,000 episodes。短收尾、缺省／充裕時間不啟動額外回復及 native／WASM 接線已有有限驗證；若要確認新策略對限時交付的效果，仍需要一次帶有時間預算的獨立比較。

現有 overnight launcher 不傳每件時間預算，直接指定新 identity 只會測到短收尾。本次沒有準備可直接啟動的新版全面長跑命令，也沒有啟動長跑。先補時間情境的 evaluator 與事前比較契約，再由使用者啟動。

v2.4 升版與接線已由使用者決定；新的獨立驗證是取得限時效益證據，不是額外的採用批准流程。目前沒有排定新長跑。

## 比較契約應包含

- 對照 v2.3、獨立短收尾與限時分支；新 seed 不與本次事後抽取的 sample 0 混用。
- 缺省與充裕時間的行為一致性，以及緊迫時間的品質交換。期限內完成、期限內滿品質／收藏檔位與最終完成分開。
- 單件 budget 與 10 分鐘兩品項情境分開；後者必須遵守第一顆回報球色起算、每品項一件、平均分剩餘時間及 30 秒預留的產品契約，揭露固定操作秒數假設。
- 保留 family × equipment × assumed world 配對切片；特別判讀 E02、E07、F15。完成、hard-quality、收藏檔位、HQ 與 Master 品質尾端分開。
- 省步只以有效成果與雙方同品質配對判讀；A 與 S、80 招截斷、合法隨機失敗及 runtime 錯誤分開。
- 保存技能計數、時間分支觸發、超時與成本；不讀 private world、配方／裝備 identity 或未來 RNG 來選策略。
