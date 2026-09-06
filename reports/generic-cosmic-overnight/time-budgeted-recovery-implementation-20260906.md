# 短收尾與限時回復拆分

日期：2026-09-06。本機基底 HEAD `0068581`，包含未提交策略、資料及 Web 接線變更。沒有部署、新數字版本或新遊戲實證。

## 結論與使用者決策

已將平常使用的短收尾與時間壓力下的付費回復拆開。短收尾只在有滿品質收尾證明的狀態介入；限時回復使用有限抽樣比較，不能保證所有製作的品質與 v2.3 完全相同。本次有限比較也有局部滿品質退步，不能將期限內件數增加解讀為沒有品質代價。

使用者已決定：第一顆實際回報球色開始計時，不手動校準；程式自行決定是否使用限時策略；每品項先按一件、平均分配剩餘時間；對外時間參數為 optional。產品契約由 [product architecture](../../.agents/skills/mission/product_architecture.md) 擁有。

Web 每招估計 5.3 秒，任務預留 30 秒再分配尚未完成品項。這是工程估計，並非遊戲規則。9 份 player records、413 次操作的相鄰操作間隔平均約 5.26 秒；最新 v2.3 兩份紀錄約 5.13 秒。紀錄時間包含網頁操作與等待，不是遊戲精準計時。

## 實作與接口

- `exp-short-certified-finish`：沿用 v2.3，只在原本已有 certified suffix 或品質已滿時搜尋 1–3 招的滿品質收尾；不是全域最少步數證明。
- `exp-time-budgeted-recovery`：本機 Web／公開 Rust 主接口使用此描述性 identity。缺省時間時等同短收尾。時間足以覆蓋剩餘 action limit 時直接保留基線；其餘符合回復條件的狀態，再以基線續作估計判斷壓力。
- 有壓力也不一定回復：候選仍需通過兩種規劃假設下的完成、滿品質、效用及省步比較，再做有限確認。抽樣篩選不是品質不退步的數學證明。
- 舊 `v2.3.0` 與 `exp-compact-recovery` identity 保留原行為供歷史重播。
- Rust API `frozen-rabbit-main-solver-api-v2`：原 `recommend(&state)` 仍可用；新增 `recommend_with_options(&state, options)`，其中 `time_budget: Option<CraftTimeBudget>` 預設 None。整合用法見 [native README](../../native/craft-kernel/README.md)。
- Web ABI `rust-web-planner-abi-v2`：原 141 欄 episode 和 7 欄 reply 不增加必要欄位；可選 `time-budget:<remaining ms>:<action ms>\t` prefix。TS 對外為 `timeBudget?: PlannerTimeBudget`。
- session codec `expert-session-v0.12.0` 保存選填任務計時摘要及實際採用建議的時間預算；undo 重播用當時預算，最新建議用目前剩餘時間。

同任務換品項、undo、重做不重設倒數；新任務重設。不限時與尚未回報球色不傳預算。時間歸零仍提供建議，不改 mechanics 完成／失敗條件。進行中的 session 與計時只在記憶體，reload 不恢復。UI 倒數每秒更新，策略在請求下一個建議時取得時間快照。

## 有限驗證

兩組檢查都使用舊長跑 sample 0，是事後拆分／整合驗證，不是新獨立確認，也不提供自然成功率。

### 短收尾

[驗證腳本](short-finish-split-check-20260906.mjs) 與 `evaluation-runs/compact-policy-development/short-finish-split-check/result.json` 保存資料。

| 指標 | v2.3 | 短收尾 |
| --- | ---: | ---: |
| 案例 | 500 | 500 |
| 完成 | 443 | 443 |
| 滿品質完成 | 387 | 387 |
| 配對滿品質新增／失去 | — | 0／0 |
| 雙方滿品質平均 action uses 差 | — | −0.589 |

另以原 binary 與拆分 binary 重播 200 組 v2.3／舊合併策略，非 timing 欄位差異為 0。共執行 900 episodes，4 workers，107.45 秒。短收尾包含 39 個合法失敗及 18 個 action-limit。

### 時間接線

[驗證腳本](time-budget-integration-check-20260906.mjs) 與 `evaluation-runs/compact-policy-development/time-budget-integration-check/result.json` 保存資料。50 families、兩種 assumed world、輪替裝備，共 100 組案例各執行缺省、600 秒、159 秒當件預算，合計 300 episodes，46.85 秒。

| 指標 | 不傳時間 | 當件 600 秒 | 當件 159 秒 |
| --- | ---: | ---: | ---: |
| 最終完成 | 89 | 89 | 91 |
| 最終滿品質完成 | 77 | 77 | 78 |
| 相對不傳時間的技能序列改變 | 0 | 0 | 45 |

缺省時間相對獨立短收尾、充裕時間相對缺省，非 timing 行為差異皆為 0。159 秒組有 2 件新增滿品質、1 件失去滿品質；76 件雙方滿品質平均少 3.513 招。按每招 5.3 秒、30 招為 159 秒期限計算，期限內滿品質完成由 20 增至 26；這是單件固定操作時間模擬，從第 0 招起算，不等同 Web 第一顆回報起算或 10 分鐘雙品項任務。

12 組完整案例共 454 次 WASM 建議與 native 比較，技能及最終 context 差異 0；該次 WASM p95 為 27.67 ms、max 46.16 ms。此為 Node WASM 測量，不是使用者裝置或遊戲內延遲保證。

### 可重播身份

| Artifact | SHA-256 |
| --- | --- |
| 原合併基準 binary | `5bc5b974646731b8745de3d32b4171342547fde46a977aaaada0735d2eea80cf` |
| 短收尾拆分 binary | `af395a8b878d770698954bcb2ef846ddfb5185e359dab90a1161b039b27b7fc2` |
| 時間 probe binary | `fc795b4d76ebe611dbf244cbee1ac4f00d45ef49339e7cde5de93647f4436a64` |
| 時間驗證 WASM | `f4f77c8e4796a43272ec8668162e924e815a41286c011f5328b648b9dcd981ef` |

Frozen binaries 與 TSV 位於上述 evaluation-runs 路徑；腳本拒絕覆蓋既有輸出。這些是本機證據，並非全部 Git 追蹤檔案。

## 工程檢查與後續範圍

Rust `cargo test --lib --tests`、Web release tests（20 files／124 tests）、typecheck 及正式 `npm run build` 通過。涵蓋 optional 預算解析、零／非法值、缺省行為、第一顆回報起算、無步數技能、換品項、undo 與 export。工程檢查不等同全面求解品質驗證。

最後補上「終局沒有下一顆球可回報，不能啟動倒數」的防護後，重跑相關 2 files／12 tests 及完整 build 通過；docs:check、git diff --check 通過。本機 production preview 的瀏覽器檢查使用任務 32「【高難+】補充優質製作工具」：起手顯示等待回報，回報通常後顯示該任務的 7:00，undo 後為 6:56，換成紡車後為 6:47，確認沒有重設倒數。桌面截圖中計時與推薦可讀；未宣稱所有裝置、語言或遊戲實戰均已驗證。

不需要重跑原本不帶時間的 64,000 episodes 來重複舊結果；若要確認限時分支的交付效益，仍需帶有時間預算與新確認樣本的評測。現有 overnight launcher 不傳當件預算，直接改 identity 只能驗證短收尾。下一次比較範圍由 [active brief](../../.agents/overnight_review_brief.md) 擁有；本次未啟動或交付新版全面長跑命令。
