# 開局掌握獨立評估 v2.3：長跑交付

`prepared: 2026-09-06`；基底 `b962bf1` 加保留開局掌握與本次工具修改，未 commit。使用者決定單獨長跑，評估是否值得成為 v2.3；目前正式求解器及 Web 仍為 v2.2。判讀假說與尺度由 [active brief](../../.agents/overnight_review_brief.md) 擁有。

## 比較與沿用

- 候選：`generic-craft-external-reference-exp-opening-recovery`，保持前輪測試行為，沒有合併其他三個撤回試驗。
- Baseline：`generic-craft-external-reference-exp-artisan-continuation`，就是後來原樣採用的 v2.2。原字串不改寫，對應依據見 [採用與三方 parity](v220-adoption-20260906.md)。
- 來源：`evaluation-runs/resource-certificate-development/artisan-continuation-fresh-s64`，50/50 shards 完成；只沿用其中 32,000 個 candidate episodes。
- 來源 config fingerprint：`4da316a9e3a815b0f7c0ca7e7d40f5b9fbd9899f9c22b1a6f813b1f3212b13fa`。
- 來源 binary SHA-256：`b97a4aee2cfb292023bdd0fa7e4a87c6c0b28e63181ed5acd95ebcf76aa30397`，實際檔案已核對。
- 沿用工具新增 fresh three-arm v1 candidate arm 支援，保留完整原報告與 provenance。仍拒絕 historical v5 串接、內容漂移、案例不符或誤用 reference arm；runner 完整三臂來源驗證沒有省略。

50 families × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × Balanced × 64 seeds，base `20261213`、80 actions。本次新算 32,000 episodes、沿用 32,000，產生 64,000 邏輯 rows；hard-quality 分母 8,960。來源結果已看過，這是凍結新候選對既有基準的配對長跑，不是全新盲測。Development base `20260906` 不混入，獨立 bases `20270223`／`20270119` 未使用。

## 凍結身份

新 binary：`evaluation-runs/opening-recovery-development/.artifacts/889253f5f76a47373380e8398a32d783cb1477772e08c139be55a95ee02c8621/craft-kernel-generic-episode.exe`。

SHA-256 等於目錄的完整 64 位字串，實際檔案已核對。CLI 固定使用快照，不以日後 target binary 覆蓋。Native source 與本次沿用工具變更保存於 [source patch](opening-recovery-s64-source.patch)，基底 `b962bf1`，只能在隔離 checkout 重播，不能直接疊到目前工作樹。

本次 config fingerprint：`99ca0c9f71723370681915804194879542f2ffc87fe0cc372931afdc8aec4394`。Evaluator bundle SHA-256：`34aef0d763ded03e17272e71c0c2236955a11dd4196ec9fd59d3c09bea19479b`。Resume 再驗證來源 shards SHA；不要修改來源或 evaluator 後硬續跑同一 run ID。

## PowerShell：先開溫度 reader

另開「系統管理員 PowerShell」執行：

~~~powershell
Set-Location 'C:\Users\User\Documents\GitHub\frozen_rabbit_cosmic'
& '.\tools\evaluate-generic-cosmic-overnight\read-amd-temperature.ps1' -OutputPath 'C:\Users\User\Documents\GitHub\frozen_rabbit_cosmic\.tmp\overnight-cpu-temperature.json' -DurationMinutes 720
~~~

約每三秒顯示時間與 CPU 攝氏溫度，並更新 runner 的溫度檔。看到有效讀值後保持視窗開啟，再啟動 CMD。Reader 查核 AMD 簽章／SHA、既有驅動及感測回應；錯誤即停止，不安裝或啟動驅動。

本次已核對有效 AMD 簽章、SHA `B11A073FC9E036A2BB8D139CA0865096997522DD937ECE171758F1E6548B1BB1`，以及 `AMDRyzenMasterDriverV29` 為 RUNNING、路徑符合。Sandbox 的 CIM 查詢被拒後，改用唯讀 `sc.exe query/qc` 核對；不宣稱本次取得即時溫度或完成熱校準。PowerShell 5.1 parser 通過，實際感測由 reader 啟動時驗證。

## CMD：執行、續跑與狀態

一般權限 CMD 執行下列兩行；完整固定參數已存入 [啟動檔](../../tools/evaluate-generic-cosmic-overnight/run-opening-recovery-s64.cmd)，不需要重新 build：

~~~bat
cd /d C:\Users\User\Documents\GitHub\frozen_rabbit_cosmic
tools\evaluate-generic-cosmic-overnight\run-opening-recovery-s64.cmd
~~~

中斷後用完全相同命令續跑，validated completed shards 自動跳過。只查狀態（不需 reader、不啟動 episode）：

~~~bat
cd /d C:\Users\User\Documents\GitHub\frozen_rabbit_cosmic
tools\evaluate-generic-cosmic-overnight\run-opening-recovery-s64.cmd --status-only
~~~

啟動檔直接呼叫 `npm run evaluate:generic-cosmic-overnight -- ...`，只接受空參數或 `--status-only`。未完成的 status-only 目前返回 exit 1，console 的 pending 狀態才是判讀依據，並非已啟動運算。

起始 4 workers、最多 4，啟用五分鐘溫控窗口。單筆 ≥93°C、五分鐘內 ≥90°C 累計 60 秒，或感測逾 10 秒未更新等情況會停止；持續偏熱會先減員。門檻為既有工作停止政策，不是 CPU 安全規格。完整行為見 [工作流](../../.agents/workflows/run-generic-overnight-evaluation.md)。

每次 invocation 預算 4 小時、shard timeout 30 分鐘、retry 1 次。溫控停止 exit 76，budget 用完 exit 75；人工確認並恢復有效感測後才續跑，不自動重啟。中止按一次 Ctrl+C，等待子程序與 manifest 收尾；不要連按或強關視窗。跑完後也在 reader 視窗按 Ctrl+C，它不會跟 runner 自動關閉。

粗估固定四 workers 約 1～2 小時，依家族、負載與溫控變動，非熱校準或完成時間承諾。以 20KB／新算 episode 保守預留約 640MB，含 artifacts／raw／報告建議至少 2GB；交付時 C 槽約 252GB 可用。

## 結果位置與計時

- 進度：`evaluation-runs/opening-recovery-development/opening-recovery-v23-s64/manifest.json`。
- 原始結果及 provenance：同目錄 `shards/`。
- 溫度／增減員：同目錄 `logs/thermal-*.jsonl` 與 `manifest.thermal`。
- 完成後四表：`reports/generic-cosmic-overnight/opening-recovery-v23-s64.md`。

候選逐次推薦耗時可計 p50／p95／worst。歷史 baseline samples 保留但不是本輪量測，`baselineWallClockMs=null`；不能用前後不同負載主張公平速度 A/B。

## 交付驗證

- Rust release offline build 通過；solver 行為未調整，前輪 141 項 Rust 測試與凍結重播仍適用。
- Runner 40 tests 通過，包含三臂來源沿用／漂移拒絕、溫控、manifest／timing 與 Windows owned child/grandchild 中止。Sandbox 的 taskkill 被阻後，在 sandbox 外重跑通過，未放寬程序清理邏輯。
- 完整 CMD `--status-only` 已驗證全部 50 個來源 shards，辨識 32,000 新算／32,000 沿用，0/50 完成、50 pending，未啟動完整長跑。
- 最初的 `opening-recovery-handoff-smoke` 使用首個 family／64 seeds，640 個候選案例超過 4 分鐘 shard 上限，保留為一次 timeout。Sandbox 阻止 parent 的 taskkill，native 子程序隨自己的 timeout 結束；後續核對 parent／native 均已結束。這不是非法推薦或已完成品質結果，也不冒充成功 smoke。
- 改用既有 `resource-certificate-development/handoff-smoke` 作工程來源：首個 family、相同五裝備／兩 world、1 seed、base `20261117`，本次 run ID `opening-recovery-handoff-s1`。新算 10／沿用 10，共 20 rows，約 5 秒完成；不改正式長跑的 64-seed 來源或參數。
- 上述成功 smoke 再次執行與 `--status-only` 都驗證 1/1 completed，沒有新增 attempt 或重新計算。三臂歷史來源的完整 fingerprint 原樣進入兩臂 v5 provenance。
- TypeScript 工具 typecheck、`docs:check`、`git diff --check` 與 source patch reverse check 通過。PowerShell 溫控僅驗證 reader 語法／依賴與模擬護欄，沒有代替使用者啟動長期感測。

## 交付後修正：PowerShell 相對路徑

使用者啟動後，reader 實際在 `C:\Windows\System32\.tmp\overnight-cpu-temperature.json` 持續寫入有效讀值（查核時 51.9°C），專案 `.tmp` 沒有檔案，runner 因 `temperature-unavailable` 在 preflight 停止，0/50 shards、沒有求解失敗。

原因為 `[IO.Path]::GetFullPath` 依 process working directory 解析相對路徑，管理員 PowerShell 的 `Set-Location` 不保證同步改變它。Reader 已改用 PowerShell provider path 解析；上述交付指令另明示絕對輸出路徑。以 Windows PowerShell 5.1 實際執行 script 的路徑賦值，刻意令 process cwd=System32、PowerShell location=repository，重現舊錯誤並驗證修正後相對／絕對路徑均正確。

需在原 reader 視窗 Ctrl+C 後重新執行新指令，再以原 CMD 命令續跑。沒有停用 guard、變更 binary／evaluator／config 或重算基準。凍結 source patch 保留交付當時快照；本節路徑修正發生在快照之後，只影響 reader。
