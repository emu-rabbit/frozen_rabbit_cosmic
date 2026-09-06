# 目前狀態

`last_verified: 2026-09-06`

本次在 checkout `14ac85f` 上完成 Rust solver 強化、64-seed 三臂長跑判讀與 v2.2 Web 採用；沒有部署查核或新遊戲實證。既有報告中的 `20260907`／`20261003` 檔名與日期保留為歷史標記，不據此推定時間先後；結果須用 commit、binary、config 與 case identity 定位。

## 目前方向

做出手把手帶玩家完成高難配方的網頁，並持續提升求解能力。Artisan 強化、混合架構或自有核心均可探索，品質優先於操作長度與速度；取捨由 [產品使命](skills/mission/project_mission.md) 擁有。使用者已決定將 Artisan continuation 候選採用為 v2.2 並接入 Web。新一輪前先討論如何量出剩餘改善空間；目前沒有待跑長跑，見 [active brief](overnight_review_brief.md)。

## 已有實作

| 範圍 | 本次核對結果 | Code owner |
| --- | --- | --- |
| Rust 主策略 | 採用 `generic-craft-external-reference-v2.2.0`：保留 Artisan fallback，加入資源收尾證明、最多 12 招提案的全宣告球色驗證，以及 hard-quality 等球／冒險狀態的 Artisan 續作抽樣比較。 | `native/craft-kernel/src/generic_solver.rs`、`native/craft-kernel/src/artisan_expert.rs`、`generic_solver/resource_certificate.rs`、`certified_route.rs`、`artisan_continuation.rs` |
| 歷史對照 | v2.1 與三個描述性實驗 identity 保留供重播及消融比較。wide 試驗無額外品質收益，已移除；沒有另選下一個候選。 | `native/craft-kernel/src/generic_solver.rs` |
| Rust 整合 API | `main_solver` façade 提供 recommend→observe；crate 仍為 `publish = false`。 | `native/craft-kernel/src/main_solver.rs`、`Cargo.toml` |
| Web 計算 | Rust→WASM persistent Worker；初始化期限 30 秒、每步推薦 watchdog 3 秒；錯誤／逾時明示，目前沒有獨立快速求解器。 | `apps/web/src/runtime/planner/`、`native/craft-kernel-web` |
| 使用流程 | 任務 catalog、搜尋／篩選、裝備設定檔、四語系、明暗模式、逐步回報、合法替代技能、undo、重置、後續任務導向已接入。 | `apps/web/src/views/`、`apps/web/src/composables/useActiveCraftSession.ts` |
| 紀錄下載 | 終局可下載 debug session；export 以目前 Web policy 覆蓋 protocol 的歷史預設 identity。 | `CraftSolverView.vue`、`useActiveCraftSession.ts`、`packages/protocol/src/events.ts` |
| 儲存 | 裝備與偏好持久化；任務資料使用 IndexedDB 快取；進行中的 craft 只在記憶體，reload 不恢復。 | `apps/web/src/composables/`、`apps/web/src/services/missionData.ts`、`missionDataCache.ts` |
| 資料 | Catalog／family／objective binding 由資料套件生成與維護；既有評測範圍為 432 配方／50 families。 | `packages/data/src/cosmicExpertCatalog.ts`、`tools/import-cosmic-expert-recipes/` |

## 真正尚未完成或未驗證的部分

- 持續檢查主求解器的 policy-null、錯誤與延遲。使用者已決定：沒有 policy-null 時不需要獨立快速求解器，因此其未實作不列為產品缺口或首發門檻。
- 手動 resync UI；protocol 已有 `stateResynced`，不能把 schema 支援當完整操作已完成。
- 製作中／錯誤時的紀錄下載是否需要擴充，以及偏離、undo、resync 的瀏覽器整合驗證。
- 實機操作與遊戲內完整製作證據仍需如實區分；Node／native benchmark 不外推成實機驗證。最終驗收與是否發布由使用者自行決定，不另列裝置或可靠度門檻為待批准事項。
- 所有重要 family × equipment × assumed world 的系統性失敗仍需揭露供使用者判斷。採用一版 solver 不代表使用者已決定發布網站。

## 研究證據入口

本輪新證據已核對 completed shards、paired 切片與敗例 trace；其餘歷史報告未全面重播。歷史報告中的下一步與暫停決定不自動成為現行命令。

| 要回答的問題 | 入口 |
| --- | --- |
| v2.2 的採用、Web 接線與驗證 | [採用紀錄](../reports/generic-cosmic-overnight/v220-adoption-20260906.md)：正式身份與長跑候選對照、native／WASM parity、測試與效能邊界 |
| 新版本是否改善滿品質、長度，有哪些退步 | [64-seed 判讀](../reports/generic-cosmic-overnight/artisan-continuation-s64-review-20260906.md)：96,000 episodes、全部 500 格、paired 得失與成本；不是自然成功率或最佳上限證明。早期開發見 [研究報告](../reports/generic-cosmic-overnight/resource-certificate-development-20260905.md) |
| v2.1 採用及品質／完成交換 | [採納報告](../reports/generic-cosmic-overnight/v210-adoption-review-20260907.md)；不是全面優於 v1.12 的結論 |
| Artisan 上的三步強化成果 | [v2.0 四表](../reports/generic-cosmic-overnight/generic-native-full-quality-certificate-vs-artisan-balanced-e02-e03-e07-e09-e10-2world-64seed-20260904.md) |
| 四步、五步及更深搜尋的收益／成本 | [深度研究](../reports/generic-cosmic-overnight/full-quality-certificate-depth-sweet-spot-20260903.md)；五步尚未採用 |
| 舊版／失敗實驗與因果教訓 | [版本索引](solver_version_history.md)；只在問題相關時讀對應 report |
| 資訊邊界修正前後的 evidence 差異 | [撤回報告](../reports/generic-cosmic-overnight/condition-information-boundary-and-option-planning-20260831.md)；舊 binary 結果不冒充現行結果 |
| Rust→WASM 工程決策 | [邊界報告](../reports/web-runtime/rust-wasm-core-decision-20260830.md)；其中 v1.12 timing／parity 是當時 snapshot |
| 下一輪實驗或長跑 | [active brief](overnight_review_brief.md)、[操作工作流](workflows/run-generic-overnight-evaluation.md) |

待使用者決定與待研究問題集中於 [open_questions.md](research/open_questions.md)。
