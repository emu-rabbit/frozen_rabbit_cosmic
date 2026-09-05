# Agent 協作文件盤點與優化

盤點日期：2026-09-05。起始 checkout：`14ac85f`，工作樹乾淨。本紀錄是本次文件稽核結果，不是新的協作規則入口。

## 範圍與方法

- 以 `git ls-files '*.md'` 盤點原有 155 份文件，另搜尋 AGENTS／CLAUDE／instruction／skill 類入口；未發現其他 repository 自有的隱藏協作入口。
- 24 份 active 協作文件逐份閱讀，核對 owner、方向、重複、命令與目標／現況差異；相關事實追至 Rust 主策略、Web Worker、session export、protocol、cache 與 package scripts。
- 歷史報告做角色、指令字樣與連結／格式檢查；針對目前採用、撤回、架構決策及研究計畫讀取相關判讀。未重算全部報表、未重播 raw shards，也未重新核實所有遊戲數值或外部來源。
- 根目錄 README 與第三方權利記錄只盤點，不改動。API 說明與既有封存契約保留；歷史計畫只加角色標記，原始結果和跑前門檻不改寫。
- 首次盤點完成時，active 文件字元數以 LF 正規化比較為 103,016 → 89,395，減少約 13.2%；後續再依使用者決策刪去必備雙求解器與首發待決規定。這是閱讀量快照，不是自動品質分數。

## 發現與處理

| 問題 | 處理與核對依據 |
| --- | --- |
| 方向被「暫停 Artisan 替換／蒸餾」及自有核心要求綁住 | 產品使命採本次使用者方向：Artisan 強化、混合或自有核心依玩家成果選擇；不自動重啟失敗實驗。 |
| WASM 被寫為待決、舊 portfolio 被寫成現行必經核心 | 依 `main_solver.rs`、`generic_solver.rs` 與 Web protocol 修正為目前 external-reference 路徑；portfolio 保留為可用研究。 |
| 現況累積舊實驗數字、假待辦與冗長 UI 時間線 | 改為 code owner 表、真實落差與 evidence 入口；終局 export 已存在，成熟度欄位已從 protocol 移除。 |
| 主策略 fallback 與 runtime 後備混淆 | 分清 Artisan 決策後備與獨立快速求解器；後續使用者確認主求解器沒有 policy-null 時，後者不必要，不列首發門檻。 |
| 完成率先行被寫成絕對順序，與已接受的品質交換衝突 | 回到完成成品與有意義品質、重要切片與成本；重大未約定交換交使用者決定。 |
| 目標規格被讀成已完成實作 | 在產品、UI、Rust ownership、雙求解器說明標清目標與現況；保留 resync 等尚未完成需求。 |
| 多份文件重複 schema、快速策略細節、版本結果 | Event schema 改連 code；主／快速規則集中至策略 owner；版本歷史縮為差異及 report 索引。 |
| 一次性 Raphael 長跑授權與舊 smoke 命令容易誤用 | 移除跨 task 授權語意；標記 v1.1／v1.2 smoke 只測工具路徑。 |
| 歷史 plan 的下一步仍像現行命令 | 9 份計畫／命令加歷史標記；治理規範明定 report 不覆蓋目前指示。 |
| 固定亂數可行路線被排成最佳 causal policy 的上界 | 改用證據用途表；單條 witness 只能證明存在，不能證明最佳上界。 |
| HQ 的 50／75／100% 檔位與 protected floor 混稱 | 資料規範保留語意檔位，protected floor 回到策略 owner。 |
| 所有技能提及強制三語、UI 固定 bottom sheet、全指標驗證 | 改為按讀者、操作目的與 claim 選擇；保留正式名稱、可及性與發布證據要求。 |
| 現況日期與既有報告標記不一致 | 只更新本次核對日期及範圍；歷史檔名不重命名，以 binary／config／commit 定位。 |

## 決策與驗證界線

使用者後續已決定：主求解器沒有 policy-null 時不要求獨立快速求解器；最終驗收與是否發布由使用者自行決定。兩項已從 [待決事項](../.agents/research/open_questions.md) 結案，active 文件同步修正，不再額外要求首發批准清單。Thiria 的可借用能力仍屬研究問題，不宣稱已整合。

本次只改文件；不修改 solver 行為、不升版、不啟動長跑、不 commit 或部署。驗證使用 `npm run docs:check`、`git diff --check`、變更範圍與歷史正文保留檢查；不把文件檢查當成 runtime、裝置或遊戲驗證。

## 逐檔清單

下表覆蓋起始 155 份 Markdown，不包含本次新增的盤點紀錄。Active 的「保留」表示已讀但沒有必要變更；研究 evidence 的「保留」表示角色與機械檢查，不代表每個實驗已重新驗證。

| 文件 | 類型 | 處理 |
| --- | --- | --- |
| [.agents/archive/README.md](../.agents/archive/README.md) | 封存契約 | 保留 |
| [.agents/archive/handoffs/completion-aware-full-review-2026-08-29.md](../.agents/archive/handoffs/completion-aware-full-review-2026-08-29.md) | 封存契約 | 保留 |
| [.agents/archive/handoffs/overnight-v030-review-2026-08-27.md](../.agents/archive/handoffs/overnight-v030-review-2026-08-27.md) | 封存契約 | 保留 |
| [.agents/current_state.md](../.agents/current_state.md) | Active 協作 | 修正／精簡 |
| [.agents/glossary.md](../.agents/glossary.md) | Active 協作 | 修正／精簡 |
| [.agents/overnight_review_brief.md](../.agents/overnight_review_brief.md) | Active 協作 | 修正／精簡 |
| [.agents/research/open_questions.md](../.agents/research/open_questions.md) | Active 協作 | 修正／精簡 |
| [.agents/roadmaps/broad_solver_implementation_plan.md](../.agents/roadmaps/broad_solver_implementation_plan.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/core/documentation_governance.md](../.agents/skills/core/documentation_governance.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/core/operating_contract.md](../.agents/skills/core/operating_contract.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/domain/algorithm_verification.md](../.agents/skills/domain/algorithm_verification.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/domain/data_and_evidence.md](../.agents/skills/domain/data_and_evidence.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/domain/ffxiv_expert_crafting.md](../.agents/skills/domain/ffxiv_expert_crafting.md) | Active 協作 | 保留 |
| [.agents/skills/domain/solver_policy_and_safety.md](../.agents/skills/domain/solver_policy_and_safety.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/mission/brand_identity.md](../.agents/skills/mission/brand_identity.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/mission/product_architecture.md](../.agents/skills/mission/product_architecture.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/mission/project_mission.md](../.agents/skills/mission/project_mission.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/mission/reference_projects.md](../.agents/skills/mission/reference_projects.md) | Active 協作 | 保留 |
| [.agents/skills/professional/development_standards.md](../.agents/skills/professional/development_standards.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/professional/technical_architecture.md](../.agents/skills/professional/technical_architecture.md) | Active 協作 | 修正／精簡 |
| [.agents/skills/professional/ui_ux_standards.md](../.agents/skills/professional/ui_ux_standards.md) | Active 協作 | 修正／精簡 |
| [.agents/solver_version_history.md](../.agents/solver_version_history.md) | Active 協作 | 修正／精簡 |
| [.agents/specs/session_state_and_events.md](../.agents/specs/session_state_and_events.md) | Active 協作 | 修正／精簡 |
| [.agents/workflows/add-commit-all.md](../.agents/workflows/add-commit-all.md) | Active 協作 | 保留 |
| [.agents/workflows/run-generic-overnight-evaluation.md](../.agents/workflows/run-generic-overnight-evaluation.md) | Active 協作 | 修正／精簡 |
| [.agents/workflows/validate-golden-traces.md](../.agents/workflows/validate-golden-traces.md) | Active 協作 | 保留 |
| [AGENTS.md](../AGENTS.md) | Active 協作 | 修正／精簡 |
| [README.md](../README.md) | 門面／權利記錄 | 保留 |
| [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) | 門面／權利記錄 | 保留 |
| [native/craft-kernel/README.md](../native/craft-kernel/README.md) | API 指南 | 保留 |
| [reports/generic-cosmic-overnight/README.md](../reports/generic-cosmic-overnight/README.md) | 研究 evidence | 修正／精簡 |
| [reports/generic-cosmic-overnight/certificate-depth4-vs-depth5-5equipment-2world-20260905-s8.md](../reports/generic-cosmic-overnight/certificate-depth4-vs-depth5-5equipment-2world-20260905-s8.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/certificate-depth4-vs-depth5-5equipment-2world-20261003-s8.md](../reports/generic-cosmic-overnight/certificate-depth4-vs-depth5-5equipment-2world-20261003-s8.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/condition-information-boundary-and-option-planning-20260831.md](../reports/generic-cosmic-overnight/condition-information-boundary-and-option-planning-20260831.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/condition-work-readiness-gate-50f-3risk-2world-4seed-20260902.md](../reports/generic-cosmic-overnight/condition-work-readiness-gate-50f-3risk-2world-4seed-20260902.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/external-reference-certified-finish-direct-s8.md](../reports/generic-cosmic-overnight/external-reference-certified-finish-direct-s8.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/external-reference-full-quality-certificate-readiness-20260903.md](../reports/generic-cosmic-overnight/external-reference-full-quality-certificate-readiness-20260903.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/f36-f46-hard-quality-bounded-study-20260830.md](../reports/generic-cosmic-overnight/f36-f46-hard-quality-bounded-study-20260830.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/full-quality-certificate-depth-sweet-spot-20260903.md](../reports/generic-cosmic-overnight/full-quality-certificate-depth-sweet-spot-20260903.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/funded-tail-development/plan.md](../reports/generic-cosmic-overnight/funded-tail-development/plan.md) | 研究 evidence | 加歷史角色標記 |
| [reports/generic-cosmic-overnight/funded-tail-development/prior-experiments.md](../reports/generic-cosmic-overnight/funded-tail-development/prior-experiments.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-completion-aware-vs-v110-history-64seed-20260829.md](../reports/generic-cosmic-overnight/generic-native-completion-aware-vs-v110-history-64seed-20260829.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-depth4-vs-v112-balanced-all10-2world-64seed-20260907.md](../reports/generic-cosmic-overnight/generic-native-depth4-vs-v112-balanced-all10-2world-64seed-20260907.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-full-quality-certificate-vs-artisan-balanced-e02-e03-e07-e09-e10-2world-64seed-20260904.md](../reports/generic-cosmic-overnight/generic-native-full-quality-certificate-vs-artisan-balanced-e02-e03-e07-e09-e10-2world-64seed-20260904.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v018-64seed-w4-20260825.md](../reports/generic-cosmic-overnight/generic-native-v018-64seed-w4-20260825.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v020-64seed-w4-20260825.md](../reports/generic-cosmic-overnight/generic-native-v020-64seed-w4-20260825.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v021-64seed-w4-20260825.md](../reports/generic-cosmic-overnight/generic-native-v021-64seed-w4-20260825.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v022-64seed-w4-20260825.md](../reports/generic-cosmic-overnight/generic-native-v022-64seed-w4-20260825.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v030-vs-v022-64seed-w3-20260826.md](../reports/generic-cosmic-overnight/generic-native-v030-vs-v022-64seed-w3-20260826.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v110-perf-vs-v030-64seed-20260827.md](../reports/generic-cosmic-overnight/generic-native-v110-perf-vs-v030-64seed-20260827.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v111-checkpoint-vs-v110-history-64seed-20260829.md](../reports/generic-cosmic-overnight/generic-native-v111-checkpoint-vs-v110-history-64seed-20260829.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v113-vs-v112-balanced-e02-e03-e07-e09-e10-2world-64seed-20260902.md](../reports/generic-cosmic-overnight/generic-native-v113-vs-v112-balanced-e02-e03-e07-e09-e10-2world-64seed-20260902.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-native-v114-vs-v112-vs-artisan-balanced-e02-e03-e07-e09-e10-2world-64seed-20260903.md](../reports/generic-cosmic-overnight/generic-native-v114-vs-v112-vs-artisan-balanced-e02-e03-e07-e09-e10-2world-64seed-20260903.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/generic-night-01.md](../reports/generic-cosmic-overnight/generic-night-01.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/runner-temperature-investigation-20260828.md](../reports/generic-cosmic-overnight/runner-temperature-investigation-20260828.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v030-review-20260827/family-summary.md](../reports/generic-cosmic-overnight/v030-review-20260827/family-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v030-review-20260827/migration-risk-assessment.md](../reports/generic-cosmic-overnight/v030-review-20260827/migration-risk-assessment.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v030-review-20260827/review.md](../reports/generic-cosmic-overnight/v030-review-20260827/review.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v100-development/brief.md](../reports/generic-cosmic-overnight/v100-development/brief.md) | 研究 evidence | 加歷史角色標記 |
| [reports/generic-cosmic-overnight/v100-development/commands.md](../reports/generic-cosmic-overnight/v100-development/commands.md) | 研究 evidence | 加歷史角色標記 |
| [reports/generic-cosmic-overnight/v100-development/implementation.md](../reports/generic-cosmic-overnight/v100-development/implementation.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v100-development/results.md](../reports/generic-cosmic-overnight/v100-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v110-development/brief.md](../reports/generic-cosmic-overnight/v110-development/brief.md) | 研究 evidence | 加歷史角色標記 |
| [reports/generic-cosmic-overnight/v110-development/commands.md](../reports/generic-cosmic-overnight/v110-development/commands.md) | 研究 evidence | 加歷史角色標記 |
| [reports/generic-cosmic-overnight/v110-development/implementation.md](../reports/generic-cosmic-overnight/v110-development/implementation.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v110-development/results.md](../reports/generic-cosmic-overnight/v110-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v110-performance/commands.md](../reports/generic-cosmic-overnight/v110-performance/commands.md) | 研究 evidence | 加歷史角色標記 |
| [reports/generic-cosmic-overnight/v110-performance/results.md](../reports/generic-cosmic-overnight/v110-performance/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v110-review-20260828/family-details.md](../reports/generic-cosmic-overnight/v110-review-20260828/family-details.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v110-review-20260828/family-summary.md](../reports/generic-cosmic-overnight/v110-review-20260828/family-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v110-review-20260828/review.md](../reports/generic-cosmic-overnight/v110-review-20260828/review.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v110-review-20260828/slices.md](../reports/generic-cosmic-overnight/v110-review-20260828/slices.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v1100-development/confirm-v1100-broad-cells.md](../reports/generic-cosmic-overnight/v1100-development/confirm-v1100-broad-cells.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v1100-development/confirm-v1100-focus-cells.md](../reports/generic-cosmic-overnight/v1100-development/confirm-v1100-focus-cells.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v1100-development/results.md](../reports/generic-cosmic-overnight/v1100-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v111-completion-aware-bounded-review-20260829.md](../reports/generic-cosmic-overnight/v111-completion-aware-bounded-review-20260829.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v111-development/results.md](../reports/generic-cosmic-overnight/v111-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v111-player-value-review-20260829.md](../reports/generic-cosmic-overnight/v111-player-value-review-20260829.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v112-adoption-review-20260829.md](../reports/generic-cosmic-overnight/v112-adoption-review-20260829.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v114-isolated-contract-vs-v112-vs-artisan-50f-5equipment-2world-s4.md](../reports/generic-cosmic-overnight/v114-isolated-contract-vs-v112-vs-artisan-50f-5equipment-2world-s4.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/budgeted-conditions-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/budgeted-conditions-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/budgeted-conditions-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/budgeted-conditions-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/condition-confirm-broad-cells.md](../reports/generic-cosmic-overnight/v120-development/condition-confirm-broad-cells.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/condition-confirm-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/condition-confirm-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/condition-confirm-focus-cells.md](../reports/generic-cosmic-overnight/v120-development/condition-confirm-focus-cells.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/condition-confirm-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/condition-confirm-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/condition-iq-route-canonical-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/condition-iq-route-canonical-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/condition-route-dev-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/condition-route-dev-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/condition-route-dev-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/condition-route-dev-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/conditions.md](../reports/generic-cosmic-overnight/v120-development/conditions.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/confirm-v1100-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/confirm-v1100-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/confirm-v1100-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/confirm-v1100-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/confirm-v130-final-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/confirm-v130-final-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/confirm-v130-final-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/confirm-v130-final-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/four-conditions-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/four-conditions-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/four-conditions-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/four-conditions-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/funded-tail-dev-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/funded-tail-dev-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/funded-tail-dev-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/funded-tail-dev-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/leaf-conditions-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/leaf-conditions-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/quality-confirm-broad-cells.md](../reports/generic-cosmic-overnight/v120-development/quality-confirm-broad-cells.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/quality-confirm-focus-cells.md](../reports/generic-cosmic-overnight/v120-development/quality-confirm-focus-cells.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/quality-validation-plan.md](../reports/generic-cosmic-overnight/v120-development/quality-validation-plan.md) | 研究 evidence | 加歷史角色標記 |
| [reports/generic-cosmic-overnight/v120-development/results.md](../reports/generic-cosmic-overnight/v120-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v130-beam-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v130-beam-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v130-beam-dev-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v130-beam-dev-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v130-beam-dev-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v130-beam-dev-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v130-beam-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v130-beam-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v130-efficient-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v130-efficient-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v130-efficient-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v130-efficient-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v130-grouped-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v130-grouped-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v130-grouped-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v130-grouped-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v140-compact-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v140-compact-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v140-compact-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v140-compact-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v140-construction-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v140-construction-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v140-construction-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v140-construction-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v140-opening-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v140-opening-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v140-opening-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v140-opening-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v150-cache-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v150-cache-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v150-cache-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v150-cache-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v150-projected-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v150-projected-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v150-projected-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v150-projected-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v160-compact-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v160-compact-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v160-compact-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v160-compact-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v170-certified-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v170-certified-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v170-certified-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v170-certified-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v180-bound-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v180-bound-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v180-bound-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v180-bound-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v180-pruned-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v180-pruned-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v180-pruned-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v180-pruned-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v190-equivalent-broad-summary.md](../reports/generic-cosmic-overnight/v120-development/v190-equivalent-broad-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/v190-equivalent-focus-summary.md](../reports/generic-cosmic-overnight/v120-development/v190-equivalent-focus-summary.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v120-development/validation-plan.md](../reports/generic-cosmic-overnight/v120-development/validation-plan.md) | 研究 evidence | 加歷史角色標記 |
| [reports/generic-cosmic-overnight/v130-development/results.md](../reports/generic-cosmic-overnight/v130-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v140-development/results.md](../reports/generic-cosmic-overnight/v140-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v150-development/results.md](../reports/generic-cosmic-overnight/v150-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v160-development/results.md](../reports/generic-cosmic-overnight/v160-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v170-development/results.md](../reports/generic-cosmic-overnight/v170-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v180-development/results.md](../reports/generic-cosmic-overnight/v180-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v190-development/results.md](../reports/generic-cosmic-overnight/v190-development/results.md) | 研究 evidence | 保留 |
| [reports/generic-cosmic-overnight/v210-adoption-review-20260907.md](../reports/generic-cosmic-overnight/v210-adoption-review-20260907.md) | 研究 evidence | 保留 |
| [reports/learned-candidate-scorer/dataset-exporter-smoke-20260830.md](../reports/learned-candidate-scorer/dataset-exporter-smoke-20260830.md) | 研究 evidence | 保留 |
| [reports/learned-candidate-scorer/teacher-closed-loop-development-smoke-20260830.md](../reports/learned-candidate-scorer/teacher-closed-loop-development-smoke-20260830.md) | 研究 evidence | 保留 |
| [reports/learned-candidate-scorer/teacher-consensus-development-smoke-20260830.md](../reports/learned-candidate-scorer/teacher-consensus-development-smoke-20260830.md) | 研究 evidence | 保留 |
| [reports/learned-candidate-scorer/teacher-preference-stability-smoke-20260830.md](../reports/learned-candidate-scorer/teacher-preference-stability-smoke-20260830.md) | 研究 evidence | 保留 |
| [reports/normal-reference/plan.md](../reports/normal-reference/plan.md) | 研究 evidence | 加歷史角色標記 |
| [reports/normal-reference/probe.md](../reports/normal-reference/probe.md) | 研究 evidence | 保留 |
| [reports/normal-reference/raphael-main-500-refine-120s.md](../reports/normal-reference/raphael-main-500-refine-120s.md) | 研究 evidence | 保留 |
| [reports/normal-reference/raphael-main-500-refine-300s.md](../reports/normal-reference/raphael-main-500-refine-300s.md) | 研究 evidence | 保留 |
| [reports/normal-reference/raphael-main-500.md](../reports/normal-reference/raphael-main-500.md) | 研究 evidence | 保留 |
| [reports/normal-reference/raphael-solved-route-analysis.md](../reports/normal-reference/raphael-solved-route-analysis.md) | 研究 evidence | 保留 |
| [reports/web-runtime/rust-wasm-core-decision-20260830.md](../reports/web-runtime/rust-wasm-core-decision-20260830.md) | 研究 evidence | 保留 |
| [tests/fixtures/native-parity/v1/README.md](../tests/fixtures/native-parity/v1/README.md) | 研究 evidence | 保留 |
| [tools/evaluate-generic-cosmic-overnight/README.md](../tools/evaluate-generic-cosmic-overnight/README.md) | 工具指南 | 修正／精簡 |
| [tools/evaluate-native-generic-cosmic/README.md](../tools/evaluate-native-generic-cosmic/README.md) | 工具指南 | 保留 |
| [tools/evaluate-normal-reference/commands.md](../tools/evaluate-normal-reference/commands.md) | 工具指南 | 修正／精簡 |
