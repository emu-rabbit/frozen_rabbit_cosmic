# Artisan continuation 64-seed 跑前契約（歷史快照）

本檔封存當時的跑前契約；長跑已於 2026-09-06 判讀完成，後續採用見 [v2.2 採用紀錄](v220-adoption-20260906.md)。以下「尚未啟動」與命令只描述當時狀態，不是目前待執行工作。

`last_updated: 2026-09-05`

## 狀態與假說

下一輪候選已選定，尚未啟動完整長跑。開發與獨立確認的成果、敗例、原判準及成本見 [研究報告](resource-certificate-development-20260905.md)；目前採用版本見 [current_state](../../.agents/current_state.md)。本檔只承載接下來的跑前契約。

玩家問題：Artisan 在低耐久但仍有 CP／專家資源時可能反覆等球；只有四步收尾也會漏掉較長的確定滿品質路線。候選先證明可直接完工的完整路線，無證明時比較必成技能接回 Artisan 的完整續作。只用可觀測 state、宣告球色集合與固定內部規劃假設，不讀 evaluator 私有權重、未來 RNG 或 recipe/equipment ID。

## 比較與判讀

- Baseline：`generic-craft-external-reference-v2.1.0`。
- Candidate：`generic-craft-external-reference-exp-artisan-continuation`。
- Reference：`generic-craft-external-reference-exp-certified-route`，隔離續作比較的收益與風險。
- 三臂 fresh，50 families × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × Balanced × 64 seeds，80 actions。32,000 paired cases／96,000 episodes。
- 使用尚未查看的新 base seed `20261213`，與開發 `20260905`、4-seed 確認 `20261117` 分開。不是把已看過案例增加數量後稱全新保留集。
- 主要量尺：hard-quality 滿進展滿品質；其他目標分開列完成品品質 milestone、utility、HQ／收藏價值。全部 family × equipment × world 必須揭露，固定四表只作入口。
- 實際有意義的續作收益暫定 hard-quality 對 reference 至少 +3 個百分點，兩 world 各自非負；低於此值先重新衡量成本，不能只報 aggregate。同時報 paired 勝／負及按 family 聚合的不確定性。
- E02/E09 各自檢查完成與品質交換；特別追蹤 F19/E02、F19/E10 的 normal-heavy 敗例，以及 F14/E09、F33/E02、F35/E09。F36/F46 必須如實列出失敗，不能直接判成裝備不可達。
- 單格若滿品質下降至少 5 個百分點且有至少 4 個淨敗例，列為優先因果診斷；未達也保留全部負向格子。此閾值只決定診斷順序，不是容許隱藏退步或新的發布門檻。
- 分別報 action-limit、terminal failed、policy-null／illegal；長度用雙側滿品質配對與各自完成者 p50/p95/max。需要等球診斷時以完整 action trace 計算觀察類技能，不能把所有資源技能算成空等。
- Native 單步 p95 期望約 100ms 以內；任何 ≥3 秒、illegal、錯誤完工證明先診斷。品質／完成收益與明顯退步、成本交換集中交使用者判斷，不依單次總分升版。
- 本輪結果出現前不改 candidate 參數；若需要新假說，保存本輪結果、另建 identity 與新確認用途。

## 可重現身份

Base checkout `14ac85f` 加本次未提交實作；完整長跑固定使用已建置的 content-addressed binary：

`evaluation-runs/resource-certificate-development/.artifacts/b97a4aee2cfb292023bdd0fa7e4a87c6c0b28e63181ed5acd95ebcf76aa30397/craft-kernel-generic-episode.exe`

檔案 SHA-256 必須等於目錄名稱。這是移除無額外品質收益的 wide 試驗後的 binary；與 bounded 確認 binary 的差別及 50-case regression check 見研究報告。不要以後續重新編譯的檔案覆蓋這個路徑。

## 執行、續跑與狀態

在 repository 根目錄 PowerShell 先貼下列設定；此區塊只建立參數，不啟動運算：

~~~powershell
$evaluationArgs = @(
  '--engine=rust-native'
  '--native-preview'
  '--native-binary=evaluation-runs/resource-certificate-development/.artifacts/b97a4aee2cfb292023bdd0fa7e4a87c6c0b28e63181ed5acd95ebcf76aa30397/craft-kernel-generic-episode.exe'
  '--native-baseline-solver=generic-craft-external-reference-v2.1.0'
  '--native-candidate-solver=generic-craft-external-reference-exp-artisan-continuation'
  '--native-reference-solver=generic-craft-external-reference-exp-certified-route'
  '--risk=balanced'
  '--equipment=E02,E03,E07,E09,E10'
  '--world=balanced-iid,normal-heavy-iid'
  '--seed-count=64'
  '--base-seed=20261213'
  '--workers=4'
  '--time-budget=4h'
  '--shard-timeout=30m'
  '--retries=1'
  '--output=evaluation-runs/resource-certificate-development'
  '--run-id=artisan-continuation-fresh-s64'
)
~~~

啟動或中斷後續跑（同一個命令；有效 completed shards 自動跳過）：

~~~powershell
node tools/evaluate-generic-cosmic-overnight/run.mjs @evaluationArgs
~~~

只查狀態，不啟動 episode：

~~~powershell
node tools/evaluate-generic-cosmic-overnight/run.mjs @evaluationArgs --status-only
~~~

新 PowerShell 視窗先重貼參數區塊，再選執行或查狀態。結果在 `evaluation-runs/resource-certificate-development/artisan-continuation-fresh-s64/manifest.json`；完成後產生同名四表 Markdown。詳細操作契約見 [長跑工作流](../../.agents/workflows/run-generic-overnight-evaluation.md)。

已驗證 release build、CLI help，以及相同三臂與全部裝備／world 的 `handoff-smoke`：只取首個 family／1 seed，10 paired cases／30 episodes；完成後重跑與 status-only 都辨識 completed shard，沒有重算。完整 64-seed 參數也已執行 status-only preflight，正確辨識 96,000 episodes、0/50 completed、50 pending；沒有啟動 episode。

由 4-seed 確認的 8 分鐘估算，固定 4 workers 約需 2～3 小時，這不是承諾；本輪 budget 4 小時，超時可續跑。Runner 以每 episode 20KB 保守預留約 1.92GB，加上 artifacts／報告請留至少 3GB 空間。

本命令沒有自動溫度 guard，請自行監看 CPU 溫度與散熱。若持續高溫，按一次 Ctrl+C 等待 child cleanup，之後可降低 workers 續跑；不要連按或直接關視窗。Windows owned child/grandchild 清理測試已通過，未驗證本次長時間熱穩定性。要使用 AMD 感測與自動 worker 調整，依工作流另行啟動感測，不假設本機已有 reader 運作。
