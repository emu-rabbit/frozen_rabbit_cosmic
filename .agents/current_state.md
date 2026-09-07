# 目前狀態

`last_verified: 2026-09-07`

目前 feature branch `codex/all-cosmic-crafting` 正在擴大宇宙任務支援。已收錄 1,584 配方／138 個既有 signature family；普通球色走 `generic-craft-exp-cosmic-standard`，其他球色委派 v2.4。這是描述性實驗，未升 solver 數字版號、未部署，也未達成全任務穩定品質保證。低等級技能與威力、Rust Web 結算已整合；測試範圍及失敗由 [Standard 階段報告](../reports/cosmic-standard-20260907.md) 管理。下列 v2.4 說明保留作既有高難策略基準。

目前採用 v2.4，已接入 Web 與公開 Rust façade；使用者於 2026-09-06 明確指定升版。行為等同已拆分的 `exp-time-budgeted-recovery`：以 v2.3 加短收尾為預設，只在有時間壓力時比較額外耐久回復。Application／Cargo 仍為 0.1.0，API／WASM ABI 為 v2。對外演算法介紹與串接指引已同步；本次未部署。採用與驗證見 [v2.4 採用紀錄](../reports/generic-cosmic-overnight/v240-adoption-20260906.md)。

## 目前方向

做出手把手帶玩家完成高難配方的網頁，並持續提升求解能力。品質與限時內完成都要納入取捨；目標由 [產品使命](skills/mission/project_mission.md) 擁有。舊合併 Compact Recovery 長跑揭露了局部品質代價，因此使用者選擇拆分短收尾與時間壓力回復。舊結果由 [長跑判讀](../reports/generic-cosmic-overnight/compact-recovery-s64-review-20260906.md) 擁有，下一步驗證範圍見 [active brief](overnight_review_brief.md)。完整上界分析器不作主線。

## 已有實作

| 範圍 | 本次核對結果 | Code owner |
| --- | --- | --- |
| Rust 主策略 | 採用 `generic-craft-external-reference-v2.4.0`；未傳時間時使用 v2.3 加短收尾。歷史 v2.3 identity 保留原行為。 | `native/craft-kernel/src/generic_solver.rs`、`generic_solver/short_certified_finish.rs`、`generic_solver/compact_policy.rs` |
| 歷史候選 | `exp-opening-recovery` 保留供重播，歷史 v2.3 直接共用實作；後續兩個失敗修補未併入。 | [採用紀錄](../reports/generic-cosmic-overnight/v230-adoption-20260906.md) |
| 時間友善拆分 | `exp-short-certified-finish` 為獨立對照；v2.4 與 `exp-time-budgeted-recovery` 共用 optional 當件時間預算實作。舊 `exp-compact-recovery` 與 `exp-eager-recovery` 保留重播。 | [拆分報告](../reports/generic-cosmic-overnight/time-budgeted-recovery-implementation-20260906.md) |
| 歷史對照 | v2.1 與既有描述性實驗 identity 保留供重播及消融比較。 | `native/craft-kernel/src/generic_solver.rs` |
| Rust 整合 API | API v2；原 `recommend(state)` 保留，新增 `recommend_with_options(state, options)`，`time_budget: Option<CraftTimeBudget>` 預設 None；crate 仍為 `publish = false`。 | `native/craft-kernel/src/main_solver.rs`、[整合指引](../native/craft-kernel/README.md) |
| Web 計算 | Rust→WASM persistent Worker；初始化期限 30 秒、每步推薦 watchdog 3 秒；錯誤／逾時明示，目前沒有獨立快速求解器。 | `apps/web/src/runtime/planner/`、`native/craft-kernel-web` |
| 使用流程 | 任務 catalog、搜尋／篩選、裝備設定檔、四語系、明暗模式、逐步回報、合法替代技能、undo、重置、後續任務導向已接入。 | `apps/web/src/views/`、`apps/web/src/composables/useActiveCraftSession.ts` |
| 紀錄下載 | 終局可下載 debug session；export 以目前 Web policy 覆蓋 protocol 的歷史預設 identity。 | `CraftSolverView.vue`、`useActiveCraftSession.ts`、`packages/protocol/src/events.ts` |
| 儲存 | 裝備與偏好持久化；任務資料使用 IndexedDB 快取；進行中的 craft 只在記憶體，reload 不恢復。 | `apps/web/src/composables/`、`apps/web/src/services/missionData.ts`、`missionDataCache.ts` |
| 資料 | Catalog／family／objective binding 由資料套件生成與維護；既有評測範圍為 432 配方／50 families。 | `packages/data/src/cosmicExpertCatalog.ts`、`tools/import-cosmic-expert-recipes/` |
| 任務限時 | Mission bundle format 4 保存總限時；正值為秒數，0 為不限時，缺值不接受；與任務出現時段分開。 | `tools/generate-cosmic-mission-data/`、`apps/web/src/types/missionData.ts` |
| 任務時間估計 | 第一顆實際回報球色起算；每品項一件，扣除 30 秒預留後平均分配未完成品項。每招估計 5.3 秒；undo、重做與同任務換品項不重設倒數。 | `apps/web/src/services/missionClock.ts`、`useActiveCraftSession.ts` |

## 真正尚未完成或未驗證的部分

- 拆分已完成有限重播與整合驗證；不能把舊合併策略的獨立長跑當成新時間分支的全面證據。新的獨立確認應評估期限內品質與完成，並特別揭露 E02、E07、F15 及收藏檔位代價。現有 overnight launcher 不傳每件時間預算，直接重跑只測到短收尾。
- Web 已有背景計時與平均分配，製作畫面不顯示估計倒數，但不是遊戲真實倒數同步，也不是跨件材料／分數最佳化。新時間分支仍可能交換品質；尚無新遊戲實證。
- 持續檢查主求解器的 policy-null、錯誤與延遲。使用者已決定：沒有 policy-null 時不需要獨立快速求解器，因此其未實作不列為產品缺口或首發門檻。
- 已重現偏離原起手後的 Artisan fallback 缺口：保留快速改革至後期，可能在改革仍生效時推薦快速改革而違反合法性。三個完整 native 輸入及原因見 [v2.2 後續研究](../reports/generic-cosmic-overnight/v22-quality-development-20260906.md)；本輪未修改已凍結 v2.2 行為，也未完成此情境的瀏覽器驗證。
- 手動 resync UI；protocol 已有 `stateResynced`，不能把 schema 支援當完整操作已完成。
- 製作中／錯誤時的紀錄下載是否需要擴充，以及偏離、undo、resync 的瀏覽器整合驗證。
- 實機操作與遊戲內完整製作證據仍需如實區分；Node／native benchmark 不外推成實機驗證。最終驗收與是否發布由使用者自行決定，不另列裝置或可靠度門檻為待批准事項。
- 所有重要 family × equipment × assumed world 的系統性失敗仍需揭露供使用者判斷。採用一版 solver 不代表使用者已決定發布網站。

## 研究證據入口

開局掌握的退步修補已完成兩個各 611 件的有限診斷：延後掌握品質淨零且增加尾延遲；增加抽樣確認救回 19 敗、犧牲 69 勝。兩者已撤下，未追加長跑；[試驗報告](../reports/generic-cosmic-overnight/opening-recovery-repair-development-20260906.md) 保存實作、切片、成本與停止理由。原開局掌握候選保留。

本輪新證據已核對 completed shards、paired 切片與敗例 trace；其餘歷史報告未全面重播。歷史報告中的下一步與暫停決定不自動成為現行命令。

| 要回答的問題 | 入口 |
| --- | --- |
| 保有品質又降低步數的候選與長跑 | [獨立 64-seed 判讀](../reports/generic-cosmic-overnight/compact-recovery-s64-review-20260906.md)：完整切片、品質與時間交換、局部重播；開發過程見 [品質與步數研究](../reports/generic-cosmic-overnight/compact-policy-development-20260906.md) |
| v2.3 玩家長步數、兩件共用 10 分鐘與 120 個不限時任務 | [限時任務研究](../reports/generic-cosmic-overnight/time-aware-recovery-development-20260906.md)：玩家 trace、任務資料語意、兩種回復試驗、品質與時間交換及 native／WASM parity |
| v2.2 之後還試過什麼、為何停止 | [品質與球色組研究](../reports/generic-cosmic-overnight/v22-quality-development-20260906.md)：五試驗、4-seed 開局回復消融、局部收益、成本與未修可靠性缺口 |
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
