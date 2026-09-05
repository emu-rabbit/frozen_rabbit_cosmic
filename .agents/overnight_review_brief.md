# 下一輪 Solver 評測 Brief

`last_updated: 2026-09-05`

## 狀態

目前沒有排定新 long run，也沒有待判讀的新候選。採用版本與既有報告見 [current_state.md](current_state.md)；研究方向見 [產品使命](skills/mission/project_mission.md)。

本檔只承載下一輪跑前契約，沒有 candidate 時不累積前輪結果或以舊「暫停」限制新研究。

## 有新候選時填寫

| 欄位 | 必須說清楚的內容 |
| --- | --- |
| 玩家問題 | 哪種完成／品質／操作失敗值得改善，支持它的現有證據 |
| 假說 | 用哪些 runtime 可觀測訊號改變決策；預期改善哪些情境 |
| 比較身份 | 已採用 baseline、candidate、必要的 reference；source／binary／config identity |
| 案例與用途 | family、裝備、world、seed、action budget；development 與保留集分開 |
| 判讀 | 主要成果、重要切片、paired 勝負、不確定性、實際有意義的改善與容忍界線 |
| 代價與停止 | 完成／品質交換、推薦 latency、操作長度與研究成本；何時停止或請使用者決定 |
| 操作交付 | bounded 驗證、完整 run／resume／status 命令及安全中止；依 [工作流](workflows/run-generic-overnight-evaluation.md) |

預設與目前採用策略比較。要隔離強化效果時另選對應基線，例如 certificate 增量對其前版、整體強化對固定 Artisan。v1.12 等歷史版本只在比較問題需要時加入，不要求所有新候選永遠重跑舊基線。

若考慮提高 seed 數，先說明要縮小哪個會改變決策的誤差；不預設必須從 64 提到 256。結果出現後保存原判準與實際決策到 report，再把本檔重設為下一輪或「未排定」。
