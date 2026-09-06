# Compact Recovery 全面檢核交付

`prepared: 2026-09-06`。候選已完成有限開發與確認，適合交由使用者啟動全面長跑；尚未採用為正式版本。品質、步數與負向切片見 [研究結果](compact-policy-development-20260906.md)，跑前判讀由 [active brief](../../.agents/overnight_review_brief.md) 擁有。

## 凍結的比較

- Baseline：`generic-craft-external-reference-v2.3.0`。
- Candidate：`generic-craft-external-reference-exp-compact-recovery`。
- 50 families × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × Balanced × 64 seeds；80 招上限。每臂 32,000 件，共 64,000 新算 episodes，不沿用歷史結果。
- 新獨立 base `20270223`。Development／確認、F15 追加診斷、玩家任務與 smoke 都不混入這份結果。
- Native SHA-256：`5bc5b974646731b8745de3d32b4171342547fde46a977aaaada0735d2eea80cf`。啟動檔使用 `evaluation-runs/compact-policy-development/.artifacts/<sha>/craft-kernel-generic-episode.exe` 的內容定址快照，實際 checksum 已核對。
- Config fingerprint：`243b8281fce17a6080e0954273b38e5a8919a8b43f6b9f8fe113b91ac9322133`。
- 基底 HEAD：`128c09a0c357cfca3abdd28225654aba5fceb24d` 加當次未提交變更。[最終 source patch](compact-policy-final-source-20260906.patch) 保存 native 修改；在隔離 checkout 才可套用，不直接疊到目前 dirty tree。沒有 commit、push、deploy。

## 先開啟溫度 reader

在「系統管理員 PowerShell」執行：

~~~powershell
Set-Location 'C:\Users\User\Documents\GitHub\frozen_rabbit_cosmic'
& '.\tools\evaluate-generic-cosmic-overnight\read-amd-temperature.ps1' -OutputPath 'C:\Users\User\Documents\GitHub\frozen_rabbit_cosmic\.tmp\overnight-cpu-temperature.json' -DurationMinutes 720
~~~

等它顯示有效 CPU 溫度，保持視窗開啟，再啟動下面的 CMD。沿用已有 AMD reader；本次已做 PowerShell parser 驗證，沒有啟動感測器、修改驅動或宣稱完成本機熱校準。Reader 會在啟動時自行核對 SDK／簽章／驅動及讀值，錯誤時依訊息處理。

## 執行與續跑

在一般權限 CMD 執行：

~~~bat
cd /d C:\Users\User\Documents\GitHub\frozen_rabbit_cosmic
tools\evaluate-generic-cosmic-overnight\run-compact-recovery-s64.cmd
~~~

[啟動檔](../../tools/evaluate-generic-cosmic-overnight/run-compact-recovery-s64.cmd) 保存完整 CLI 與 frozen binary，不需重新建置。中斷後使用同一命令續跑；valid completed shards 自動跳過。不要換 binary、solver、base seed 或矩陣後覆寫同一 run ID。

只查狀態（不需要 reader、不啟動 episodes）：

~~~bat
cd /d C:\Users\User\Documents\GitHub\frozen_rabbit_cosmic
tools\evaluate-generic-cosmic-overnight\run-compact-recovery-s64.cmd --status-only
~~~

起始／最多 4 workers，啟用五分鐘溫控窗口。每次 invocation 預算 4 小時、shard timeout 30 分鐘、retry 1 次；未完可用相同命令續跑。溫控停止 exit 76、時間預算停止 exit 75，確認原因與讀值恢復後再續跑，不自動重啟。

以本次 bounded 速度粗估約 2～4 小時，視家族、負載與降 worker 而變，不是熱校準後的工時承諾。64,000 episodes 建議預留至少 3GB；交付時 C 槽約 243GiB 可用。持續運算需注意散熱：既有 guard 在單筆 ≥93°C、五分鐘內 ≥90°C 累計 60 秒或感測失聯時停止；這是工作停止政策，不是硬體安全規格。

中止按一次 Ctrl+C，等子程序與 manifest 收尾；不要連按或強關視窗。長跑完成後，在 reader 視窗也按 Ctrl+C 停止它。溫控、續跑與中止詳細契約由 [工作流](../../.agents/workflows/run-generic-overnight-evaluation.md) 擁有。

## 結果位置與驗證

- 進度：`evaluation-runs/compact-policy-development/compact-recovery-independent-s64/manifest.json`。
- 原始結果：同目錄 `shards/`；溫控事件：`logs/thermal-*.jsonl`。
- 完成後四表：`reports/generic-cosmic-overnight/compact-recovery-independent-s64.md`。這是入口，仍須依 active brief 查看全部 family × equipment × world，特別是 F15、E07、normal-heavy 的收藏品降檔。
- 完整啟動檔的 `--status-only` 已通過 handshake／config／矩陣驗證，顯示 0/50 shards、50 pending、64,000 planned，未啟動全面長跑。未完成時 exit 1 是 status 契約，不是算到一半失敗。
- Exact identities 的 80-episode smoke（2 families、全部五裝備與兩 worlds、2 seeds，base 2026090603）完成 2/2 shards；重送相同命令未重算，status-only 仍保留 40 paired cases／80 arm rows。Smoke 的固定 2 workers 未啟用溫度感測，不能當長時間熱測。
- 40 個 runner tests 通過，包括 Windows 自有子程序樹中止與溫控；Rust library/integration、120 個 release tests、typecheck、正式 Web/WASM build 與 SEO 檢查通過。Native 清理 parity 150 件及 research WASM 16 件／730 次 recommendation 都無 deterministic mismatch。

目前只準備並驗證命令；長跑由使用者自行啟動。跑完後帶回這份 manifest 或保持原資料目錄，即可依本輪凍結契約判讀，不必重新整理輸出。
