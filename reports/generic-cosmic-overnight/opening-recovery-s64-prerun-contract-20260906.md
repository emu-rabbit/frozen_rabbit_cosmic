# 開局掌握 64-seed 跑前契約（歷史快照）

此處保留長跑前固定的假說與判準；下列「尚未啟動」為當時狀態，不代表目前待執行。完整結果見 [判讀報告](opening-recovery-s64-review-20260906.md)。原 active brief 連結以下改為自本報告目錄解析。

原文件：下一輪 Solver 評測 Brief

`last_updated: 2026-09-06`

使用者決定單獨評估開局掌握是否值得成為 v2.3。候選凍結為 `generic-craft-external-reference-exp-opening-recovery`，不加入其他撤回試驗、不先升版或切換 Web；目前採用仍為 v2.2。

## 問題與資料用途

閒靜後，在雙模型續作支持時提前掌握，能否穩定提高 hard-quality 滿進展滿品質，並保留或縮短操作長度？開發資料曾在 F43 有正向訊號；這次不再要求與其他組件累積後才長跑，也不以整體 +3pp 作一刀切門檻。

沿用 `artisan-continuation-fresh-s64` 的完整 candidate arm（後來原樣採用為 v2.2）。保留原 identity／報告／fingerprint，只新算開局掌握。來源是 fresh three-arm v1，完整來源驗證後用於本次兩臂歷史 baseline，不偽造一份 v2.2 fresh run。

50 families × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × Balanced × 64 seeds，base `20261213`、80 actions：32,000 paired cases，本次新算 32,000、沿用 32,000。此 base 的 v2.2 結果已看過，不能稱為完全未看過的保留集。交付 smoke 的首個 family 另標工程重播，不用它調參。獨立 bases `20270223`／`20270119` 仍未使用，不自動追加長跑。

## 判讀契約

- 主要量尺為 8,960 個 hard-quality 案例的滿進展滿品質；其餘目標、完成率與品質效用分開。等權矩陣不冒充玩家自然分布或遊戲成功率。
- 報 paired wins／losses／ties、差值及 95% 區間。主要區間在每個 family × equipment × world 格內成對 bootstrap；另報按 family 群集重抽的敏感度。固定 10,000 次、分析 RNG seed `230906`；區間不修復已看過 baseline 的選擇偏差。
- 全部 500 格與所有負向格子均揭露。優先看 F43（既有訊號）、F36／F46（弱家族）、E02／E09，以及五裝備與兩 world。F43 沒重現不能只靠總量掩蓋；F36／F46 沒提升不直接判成裝備上限。
- 正向參考幅度為 hard-quality 整體 +0.5pp，或 F43 +5pp 且其餘 hard-quality 沒有明顯整體退步；這是衡量小改良的尺度，不是自動升版或撤回線。低於參考幅度仍交付效果、區間與成本供使用者判斷，不回到舊 +3pp 門檻。
- 不預先認可重大品質交換。單格下降至少 5pp 且淨敗至少 4 件，優先做敗例因果重播；較小負向格子仍保留。區間跨零時明示不確定，不靠追加 seeds 追到顯著。
- 分開報 terminal failed、action-limit、policy-null、illegal。報候選 native p50／p95／worst 與 family 長尾，期望 p95 約 100ms 以內；歷史 baseline 計時只作背景，不能宣稱同負載加速比。任何單步 ≥3 秒或非法推薦先診斷。
- 長度報 A／S 的完成與未完成 p50／p95／max，以及雙側滿品質的配對差。沒有完整動作 trace 時，不從總步數推斷等球次數；必要時只重播相關案例。
- 全量完成後一次判讀，不按中途效果調參、改 axes 或選擇性追加 seeds。缺陷修正須另存 identity／結果。是否採用為 v2.3、是否需要獨立確認，由使用者看完收益與代價決定。

## 操作與證據

凍結 binary、CMD 執行／續跑／status、PowerShell 溫度指令及驗證集中於 [交付紀錄](opening-recovery-s64-handoff-20260906.md)。Run ID `opening-recovery-v23-s64`，完整長跑尚未啟動。由使用者執行，詳細共通契約見 [工作流](../../.agents/workflows/run-generic-overnight-evaluation.md)。

歷史開發與撤回試驗見 [累積改善研究](v22-cumulative-development-20260906.md)；v2.2 的採用與來源一致性見 [採用紀錄](v220-adoption-20260906.md)。
