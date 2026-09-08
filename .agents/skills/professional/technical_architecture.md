# 技術架構與計算所有權

## 文件角色

本檔定義 package、runtime 與語言所有權。會漂移的目前版本與待決事項只放在 [current_state.md](../../current_state.md)。

## 目前 ownership

~~~text
canonical data ──> packages/data
mechanics DTO／legacy fixtures ──> packages/domain
session protocol／replay contract ──> packages/protocol
historical TypeScript solver ──> packages/solver
current solver evolution ──> native/craft-kernel
selected Web compute boundary ──> native/craft-kernel-web ──> native/craft-kernel
UI／session orchestration ──> apps/web
evaluation orchestration ──> tools
~~~

舊 TypeScript solver 已凍結，只能作歷史參考與遷移 evidence。新的 mechanics／solver／planner memory／episode 改善與評測都以 Rust source 為 owner。

## 網站使用分析

`apps/web/src/services/analytics.ts` 擁有 GA4 載入、Consent Mode 與瀏覽事件；`AnalyticsConsentBanner.vue` 提供四語同意提示。機制參照姊妹站 Tome：只在 production 且 `VITE_GA_MEASUREMENT_ID` 非空時啟用，正式 ID 由 `apps/web/.env.production` 管理；空值時不載入 script 或顯示提示。可在 `apps/web/.env.local` 或 build environment 覆寫設定（見 `apps/web/.env.example`），變更後需重新 build。

啟用時先載入 Google tag，analytics／advertising consent 預設 denied；接受後才送出本程式的 page_view、analytics_ready、route_change 與語言／主題事件。接受存入本網站 localStorage，拒絕只維持本次頁面；廣告 consent 始終 denied。這不是同意前零網路請求的機制。初次語言選擇與贊助視窗開啟時暫緩提示。URL query 不納入手動瀏覽事件，不傳送製作 state。正式 GA property 的自動量測設定與收件結果仍需在填入 ID 後另行驗證。

## 製作 Runtime 輸入與輸出

~~~text
RecipeProfile + CraftObjective + CrafterProfile
+ observed CraftState + actual action history
  -> legal actions／mechanics preview
  -> adopted solver
  -> action + reasons + alternatives + elapsed／failure metadata
~~~

Web 不傳送玩家 state 到 server。Session controller 記錄實際事件，undo／resync 由 event path 重建。

## Rust 核心

`native/craft-kernel` 擁有目前演進中的：

- action／condition／transition／terminal mechanics；
- planner context 與 route intent；
- 主要求解策略；有需要時的後備策略亦由同一 Rust owner 維護；
- whole-episode closed-loop compute；
- native evaluation protocols 與 deterministic work budget。
- recipe `qualityMax` 唯一品質上限、預設策略的完整品質 utility、protected floor 與 HQ 機率 utility。

Rust policy 可以有意地超越 frozen TypeScript 行為；TS→Rust 只需要事前定義的 outcome migration evidence，不要求永久逐招複製。

第三方 Rust 整合的穩定入口是 `native/craft-kernel/src/main_solver.rs`。它固定路由目前採用的 `Balanced` 主求解器，以 `MainSolverConfig`／`MainSolverSession` 提供 recommend→observe state-feedback loop，並隱藏 evaluator、歷史 identities 與 planner memory 細節。新增其他語言 adapter 時應建立在這個 façade 上；不得讓公開 contract 依賴 141 欄評測 TSV，也不得在 adapter 複製 policy。

目前主策略在 `native/craft-kernel/src/generic_solver.rs` 的 external-reference 路由：基線包含滿品質完工證明、Artisan 建議、`artisan_continuation.rs` 續作比較與開局耐久回復；`short_certified_finish.rs` 再檢查較短的滿品質收尾，`compact_policy.rs` 依 optional 當件時間預算判斷是否額外比較耐久回復。`certified_route.rs` 重用 `generic_solver/portfolio/` 的 v1 endgame 提案器，再獨立驗證完整路線；v1 的共同 scorer 並非現行產品必經路徑。修改前從 `main_solver.rs`／Web identity 追實際呼叫路徑，不以目錄名稱推定 ownership。

保留 Artisan、改良混合策略或建立自有核心都依 [產品使命](../mission/project_mission.md) 的玩家成果判斷。共同 portfolio 是可用設計，不是所有新策略都必須遷入的目標架構。

Native binary、ABI、mechanics、solver、action schema 與 evaluation identity 不符時 fail closed。Node parent 可以負責 shards、locks、timeout、retry、resume、atomic persistence 與 report，但不能偷偷改用 TS evaluator。

## Web 採用決策

2026-08-30 選定 Rust→WASM：策略與 mechanics owner 保持 `native/craft-kernel`，`native/craft-kernel-web` 只擁有 versioned ABI、bounded buffer 與 session bridge。TypeScript wrapper 負責 DTO encoding、Worker lifecycle、deadline 與 UI mapping，不擁有策略。

採用依據是當時的 session parity、成本與避免雙份策略維護。歷史數字與證據界線見 [Rust→WASM decision](../../../reports/web-runtime/rust-wasm-core-decision-20260830.md)；不能將舊版量測當成目前版本的裝置效能證明。

`apps/web` 已在正式 UI 骨架切換到 persistent browser Worker，build 由 `tools/build-web-wasm/run.mjs` 產生並交給 Vite 打包的 WASM artifact。任務選擇 dialog 開啟時即開始 streaming 下載／編譯；開始按鈕以 runtime readiness 為 gate，初始化失敗留在 dialog 明確重試，不會進入必然失敗的 craft session。首次初始化使用獨立 30 秒期限，避免手機網路載入被誤算成 solver 執行時間；初始化完成後，每次 recommendation 的 3 秒 watchdog 逾時仍會終止 Worker 並 fail closed。固定 Web fixture 已直接載入 production artifact、核對 ABI／目前採用 identity 並取得非空 action。target-device browser／mobile latency 仍待量測，不能把 Node-WASM 或單一 contract test 寫成產品效能 gate 已通過。若後續實機出現 boundary blocker，先定位 load、transfer、cache、memory 或 compute，再決定是否重開語言選擇。

## 主求解器與按需後備

主求解器沒有 policy-null 時不要求獨立快速求解器。可靠性與回傳行為由 [solver_policy_and_safety.md](../domain/solver_policy_and_safety.md) 擁有。

Artisan fallback 是主策略內的演算法後備，不等於獨立 Worker／runtime 備援；此差異不構成必須再建一套後備的理由。實際錯誤按 load、transfer、compute 或 policy 原因處理，有需要再選擇最小修正。

## Package dependency

~~~text
data ───────> domain
protocol ───> domain
simulator ──> domain
frozen solver ─> domain（歷史研究與 regression evidence）
web ────────> data + domain + protocol + craft-kernel-web WASM
policy-lab ─> domain + simulator + frozen historical solver
native core ─> own Rust types／protocols
tools ──────> owning packages or native binary
~~~

Web 已移除 frozen solver runtime dependency。目前主策略在 timeout／Worker／WASM failure 時明確 fail closed；沒有獨立快速求解器不再列為架構缺口。

## Persistence 與 privacy

- Local storage 只保存裝備、語言、明暗模式與首訪語言設定完成狀態。
- 任務 catalog 另可使用 IndexedDB 資料快取；它不是玩家 craft session 的持久化。
- 進行中的配方、events、state 與 UI state 只存在記憶體；reload 後重新設定。
- Debug export 由玩家主動下載，包含重播所需 identity，不等同自動持久化。
- Storage failure 不影響 mechanics truth；UI 明示後仍可使用當次記憶體 session。
- 不讀遊戲記憶體或封包，不自動操作遊戲。

## Data 與 session 邊界

- Catalog identity 和 objective binding 由 data package 擁有。
- `CraftState` 只保存客觀單件製作狀態。
- Planner intent 保存於獨立 context。
- 任務時間估計由 Web `missionClock` 擁有，當件 optional 時間預算傳給 Rust；它不屬於 CraftState。其他跨件材料、分數或 Duty Action state 不在目前 contract。
- `conditionSelected`、`craftActionUsed`、`craftActionResolved` 與 `stateResynced` 是可重播 interaction 的核心。

## Build 與 deployment

- Vite／Vue Web build、Rust release build、WASM release build、native↔WASM session parity 與 evaluator 是不同驗證層。
- GitHub Pages 或其他 hosting 只部署使用者明確採用的 Web core。
- 本機 commit、build 或 Rust evaluation 不代表公開網站已更新。
- `README.md` 為使用者保護的 GitHub 門面，不作技術 owner。
