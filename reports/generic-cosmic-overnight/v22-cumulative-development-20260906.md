# v2.2 累積改善研究

基底 `b962bf1`；2026-09-06 使用者要求保留小幅正向的開局掌握，繼續探索，累積足夠總收益後再一起長跑。本輪不改 Web／主求解器版本，不執行 unattended overnight。

## 本輪結論

完成三個獨立的新方向初篩，均未超過已保留的開局掌握：隨機技能候選 1 win／1 loss、兩招短段策略 0／0、模擬近端收尾修正 0／0。沒有新增滿品質淨收益，故不擴大 seeds，也不組裝一個只增加複雜度的候選。這只否定本輪具體實作，不能推論所有短段策略或更準確的模擬都無效。

開局掌握已以原 identity 恢復在 Rust，作為後續累積的小改良，新增 frozen episode 回歸測試；不再因整體提升不足 +3pp 將它移除。它仍未通過獨立確認或被 Web 採用。主策略固定 v2.2，尚無新 overnight 命令；獨立 bases `20270223`／`20270119` 均未使用。

## 跑前契約

- 恢復 `exp-opening-recovery`，先以舊 frozen binary 驗證相同狀態的結果，保留原身份。上一輪的 +3pp 是當時自訂研究門檻；使用者現在明確允許累積小幅改善，不再以該門檻淘汰正向組件。舊結果保留原判讀，新決策從本輪開始。
- Development 沿用已看過的 base `20260906`、Balanced、50 families × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × 80 actions。先 1 seed、500 paired cases，再由具體收益決定是否擴到 4 seeds；不能稱為未看過的保留集。
- 新組合先三臂對照 v2.2／開局掌握／組合，報相對兩個基準的 wins、losses、family、裝備、world 與 native p50/p95/worst。分開比較後再合併實測，不能將組件的收益直接相加。
- 品質優先。小幅正向、無重要切片明顯代價且成本接近原策略，可保留累積；初篩若新增組件 hard-quality 淨增至少 2/140，或弱 family 淨增至少 2/10 且其餘 hard-quality 不退，值得擴大。其他結果先診斷，不靠放寬判準加 seeds。
- 組合進獨立確認的參考：相對 v2.2 hard-quality +3pp，或至少一個弱 family +10pp、兩 world 整體非負且無明顯重要切片代價；另須對開局掌握呈現新增收益，避免把舊改善當新突破。這是實驗篩選，不是產品發布門檻。
- 獨立確認預留新 base `20270223`、2 seeds、完整面板；候選固定後才使用。之前 `20270119` 繼續保留。真正 overnight 另凍結候選與未使用 seeds，由使用者啟動。
- 初篩最多 5 分鐘、擴大／確認最多 12 分鐘，最多 4 workers。單步接近或低於 100ms 為期望；有值得交換的品質成果則明列成本。無訊號的方向停止，不要求每個試驗達到整體 +3pp。

## 第一階段：補入有恢復空間的隨機技能候選

目前強化器只比較成功率 100% 的替代招式，高速製作／倉促／冒進被排除；Artisan fallback 仍可使用它們。新試驗在既有介入狀態額外比較這三個合法技能，要求成功與失敗分支都不立即失敗，沿用雙內部球色模型與整件滿品質確認門檻。不增加 risk mode、不讀 evaluator 私有機率，不把失敗品的品質算收益。

`exp-opening-risk-continuation` = 開局掌握 + 上述候選擴充；其餘 v2.2。先跑 500-case 三臂。

開局掌握恢復驗證：59 件（全部 50 families，F43 包含五裝備兩 worlds）對舊 frozen binary 的逐步 action／state／cursor／context 比較，0 mismatches，排除 timing。原身份維持。

初篩結果：v2.2 104/140、開局掌握 108/140、加隨機候選仍 108/140。對開局掌握 1 win／1 loss，F31 +1、F41 −1，均 E02 normal-heavy；F36／F46 無變化。沒有新增收益，撤回此組件，不擴大。500 paired、1,500 episodes、159.1 秒、50/50 shards、無 timeout／retry／illegal。完整 [三臂切片](v22-opening-risk-s1-slices.json) 同時保存相對兩個基準的配對案例。

## 第二階段：兩招短段策略

獨立於隨機技能擴充，在開局掌握上加入五組候選：加工→精煉加工、觀察→上級加工、改革→坯料加工、掌握→坯料加工、闊步→比爾格的祝福。整段由同一雙模型續作 comparator 判斷，允許低內靜時比較這些配合，不擴大全部單招介入。

只記錄 setup／consumer，不能標成必成證明；第二招依實際 state、CP、耐久、combo 重驗，不合法或玩家偏離則交回 v2.2，已驗證滿品質收尾仍優先。模擬也使用相同第二招合法性規則。`exp-opening-pair-continuation` 先跑同一 500-case 三臂，對 v2.2 與開局掌握揭露得失，不把上一輪的固定加工連招結果當支持證據。

結果仍 108/140，對開局掌握 0 wins／0 losses，所有 hard-quality family 完成數相同；雙方都滿品質的共同 104 個基準成功案例，對開局掌握只再少 0.375 actions。新增路線記憶成本沒有換到滿品質收益，暫不納入累積組合，也不擴大。500 paired、1,500 episodes、159.5 秒、50/50 shards，無 timeout／retry／illegal。完整 [三臂切片](v22-opening-pair-s1-slices.json)。

## 第三階段：修正模擬中的近端收尾誤判

`exp-opening-forecast-rescue` 在開局掌握上，只修改續作估值：當純 Artisan 的下一招非法、無建議、或合法結果分支會立即失敗時，以既有 depth-2 全宣告球色證明檢查是否其實能滿品質完成。每條模擬最多兩次檢查；有證明才計滿品質成功，沒有則仍用原 Artisan。尊重剩餘 action budget，不把未完成品質算收益，不遞迴呼叫完整 v2.2。模擬以外的正式 v2.2 行為不變。

這只修正一部分 forecast／實際政策落差，不宣稱等於完整 v2.2 模擬。先 500-case 三臂；若新增成本大而無成品收益，停止此方向，不加深證明。

結果仍 108/140，對開局掌握 0 wins／0 losses，未增加滿品質或縮短共同成功案例，撤回此組件。500 paired、1,500 episodes、159.3 秒、50/50 shards，無 timeout／retry／illegal。[完整三臂切片](v22-opening-forecast-rescue-s1-slices.json)。

## 品質與重要切片

全部候選的非 hard-quality 結果保持基準；下面全部只比較滿進展滿品質成品。每個 family 分母 10；同一 development seed 重用於三階段，不是三批獨立確認。

| Family | v2.2 | 開局掌握 | ＋隨機候選 | ＋兩招策略 | ＋收尾估值 |
| --- | ---: | ---: | ---: | ---: | ---: |
| F11 | 10 | 10 | 10 | 10 | 10 |
| F14 | 8 | 8 | 8 | 8 | 8 |
| F16 | 9 | 9 | 9 | 9 | 9 |
| F18 | 10 | 10 | 10 | 10 | 10 |
| F19 | 8 | 8 | 8 | 8 | 8 |
| F28 | 9 | 9 | 9 | 9 | 9 |
| F31 | 7 | 7 | 8 | 7 | 7 |
| F33 | 9 | 9 | 9 | 9 | 9 |
| F35 | 9 | 9 | 9 | 9 | 9 |
| F36 | 4 | 4 | 4 | 4 | 4 |
| F41 | 7 | 7 | 6 | 7 | 7 |
| F43 | 5 | 9 | 9 | 9 | 9 |
| F45 | 8 | 8 | 8 | 8 | 8 |
| F46 | 1 | 1 | 1 | 1 | 1 |
| 合計 /140 | 104 | 108 | 108 | 108 | 108 |

五裝備的 hard-quality 完成數在三個新候選與開局掌握均相同：E02/E03/E07/E09/E10 = 21/23/15/24/25，各分母 28；v2.2 = 21/21/15/23/24。隨機候選在 E02 的 1 win／1 loss 互抵，不能稱為逐格完全保持。兩 worlds 的 hard-quality 完成數同樣均為 62/70、46/70，v2.2 為 61/70、43/70。所有 family × equipment × world 的 500 格、stop reasons 及 paired cases 均在各 `slices.json`。

全 500-case 面板的 v2.2 完成 445、滿品質成品 390；開局掌握和三個新候選均完成 449、滿品質成品 394。這四件都是開局掌握原有的改善，新組件不能重複認領。新候選均無 policy-null／illegal；兩招策略把一件 hard-quality 的 failed 改成 action-limit，仍為失敗。

## 耗時、身份與保留範圍

Native 全面板單步耗時，單位 ms，4 workers；不是 WASM／手機實測。初篩期間有短暫編譯／focused test 負載，細微速度差異不作演算法成本宣稱。

| 試驗 | p50 | p95 | worst | 同輪開局掌握 p95 |
| --- | ---: | ---: | ---: | ---: |
| ＋隨機候選 | 7.667 | 20.743 | 43.766 | 20.667 |
| ＋兩招策略 | 7.688 | 20.658 | 35.490 | 20.489 |
| ＋收尾估值 | 7.719 | 20.856 | 38.995 | 20.650 |

三輪總計 4,500 episodes、500 個不同 paired cases、477.999 秒 runner active wall（約 8 分鐘），各 50/50 shards、0 timeouts／retries。另有重播與測試，未含在此 wall time。Native 時間在目標範圍內；未保留新組件的原因是沒有新增成品收益。

| Run（位於 `evaluation-runs/v22-cumulative-development/`） | Frozen binary SHA-256 |
| --- | --- |
| opening-risk-s1 | `74e08f2ddfee0c84f06e6f57a388c11b04c65fd9a418c2a3155887ec9f9edab4` |
| opening-pair-s1 | `695326cf96adbe25ca70248ad8e081c0c6dc0d2141eec2faa75692c0a76d11e6` |
| opening-forecast-rescue-s1 | `ba900617718cf3f4e82f5fc4f997ca02b969b59e5750f67e396b479a1557c361` |

每個 run 的 config／manifest／raw input／shards 與 `.artifacts/<sha>/craft-kernel-generic-episode.exe` 保留在本機忽略路徑。撤回組件的 [source patch](v22-cumulative-development-source.patch) 以 `b962bf1` 為基底，已在原研究樹檢查 reverse、回到基底時檢查 forward；重播時使用隔離 checkout，不直接疊到已保留開局掌握的工作樹。

當前保留 code owner：`native/craft-kernel/src/generic_solver/opening_recovery.rs`，以及 `artisan_continuation.rs` 的最低內靜參數入口。原 v2.2 仍使用最低內靜 6，只有開局研究入口使用 1；身份 `generic-craft-external-reference-exp-opening-recovery` 未變。三個本輪新分支及短段記憶已移出 runtime。

回歸 fixture `native/craft-kernel/tests/fixtures/opening_recovery.tsv` 來自前輪 frozen binary 的 F43/E03/normal-heavy 案例：v2.2 77 actions 後品質 19196 而失敗；開局掌握 57 actions 滿品質 22000 完成。這是 synthetic policy regression，不能稱為遊戲 golden trace。

## 最終驗證

- 保留版本通過全部 141 項 Rust lib／integration tests，包含新增 frozen 開局案例；release episode binary 編譯成功。
- 移除三個試驗分支後，以最終 release binary 再對舊 frozen binary 比較同一案例的開局掌握與 v2.2：2 次完整逐步 trace／state／RNG cursor／context 比較，0 mismatches，排除 timing。前述 59 件恢復驗證與這次最終驗證分開記錄。
- `docs:check` 與 `git diff --check` 通過。Web 預設維持 v2.2；本輪未進行 WASM／瀏覽器效能驗證、commit 或長跑。
