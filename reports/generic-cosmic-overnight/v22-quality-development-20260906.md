# v2.2 後續品質與球色組研究

`started: 2026-09-06`；基底 checkout `b962bf1`，採用策略固定 v2.2，不升版、不切換 Web。

## 結論

本輪停止，沒有交付 overnight 候選。五個試驗中，前三個固定前期改法退步；擴大全前期續作只小幅改善，最後收斂為「閒靜後、續作比較支持時先掌握」。這個開局候選在 4-seed development 有 9 wins／0 losses，hard-quality 396→405/560（+1.61pp），但未達事先訂下的 +3pp 獨立確認門檻。追加三個 seeds 的收益縮為 +5/420；F43 有局部改善，F36／F46 沒有進步，故停止繼續調參與加 seeds。

這是本輪投入判斷，不是宣稱候選完全無價值、v2.2 已接近最佳，或剩餘失敗可歸咎裝備。開局候選仍保留在 frozen binary 與 source patch，日後有新的因果證據可回到同一身份；不留未採用的 runtime 分支。獨立 base seed `20270119` 未使用；Web／主求解器維持既有 v2.2。

## 結論

本輪停止，沒有交付 overnight 候選。五個試驗中，前三個固定前期改法退步；擴大全前期續作只小幅改善，最後收斂為「閒靜後、續作比較支持時先掌握」。這個開局候選在 4-seed development 有 9 wins／0 losses，hard-quality 396→405/560（+1.61pp），但未達事先訂下的 +3pp 獨立確認門檻。追加三個 seeds 的收益縮為 +5/420；F43 有局部改善，F36／F46 沒有進步，故停止繼續調參與加 seeds。

這是本輪投入判斷，不是宣稱候選完全無價值、v2.2 已接近最佳，或剩餘失敗可歸咎裝備。開局候選仍保留在 frozen binary 與 source patch，日後有新的因果證據可回到同一身份；不留未採用的 runtime 分支。獨立 base seed `20270119` 未使用；Web／主求解器維持既有 v2.2。

## 本輪問題與預先契約

使用者要求繼續多階段提升，優先檢查滿品質率差的家族與宣告球色組的策略價值，直到有足夠成果可交付長跑，或成本不值得再投入。完整上界分析器暫不建置；本輪以可實際執行的策略收益判斷。

- 先重播已看過的 64-seed F19／F36／F46 案例作診斷，不能當新確認資料。
- 開發面板使用新 base seed `20260906`、50 families × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × Balanced × 1 seed（500 paired cases），80 actions；有方向性收益後才在同一 development base 擴成 4 seeds。
- 獨立確認預留 base seed `20270119`、4 seeds、相同完整面板（2,000 paired cases）。候選固定後才查看，不依確認結果反覆調參。
- 每階段 baseline 固定 v2.2；必要時加前一個有效候選作 ablation。主要看 hard-quality 滿進展滿品質；完整面板、五裝備、兩 world 與 family 分開呈現。
- 開發初篩若 hard-quality 淨增至少 5/140，或 F36／F46 合計至少多 3/20 且其他 hard-quality 無淨損失，才值得擴大；未達時可由 trace 支持一個不同假說，不盲目加 seeds。
- 獨立確認的長跑候選目標：hard-quality 對 v2.2 至少 +3 個百分點，兩 world 各自非負；或 F36／F46 各自取得可重現的顯著實用改善且整體不退，明列交換交使用者判斷。此處「可重現」以開發與獨立確認一致方向判讀，不把小樣本當自然成功率。
- 保留所有 paired losses、重要 E02/E09 及專家切片。Non-hard-quality 原則上保持 v2.2 行為；任何收益／代價另列。報雙側成功長度、等待技能診斷、policy-null／illegal 與 native 單步 p50/p95/worst。
- 每次 bounded screen 最多 5 分鐘、確認最多 12 分鐘、固定最多 4 workers；不是啟動 64-seed overnight。單步 p95 期望 100 ms 附近；品質收益不足、不明原因退步、或成本明顯放大時停止該假說。沒有新訊號時停止整輪，不為湊候選繼續變體。

## 舊經驗與新切入點

Artisan 已依宣告 Pliant 有無調整耐久回復、低耐久等待與資源策略；不能將「知道球色集合」本身當作新增能力。舊 condition-option 實驗的主要問題是收益有限、無機會時持續支付預備與搜尋成本，且局部混用可能破壞完整路線，見 [歷史撤回](condition-information-boundary-and-option-planning-20260831.md)。

v2.2 的續作比較只介入內靜至少 6、未滿品質且 Artisan 建議等球／隨機技能的狀態。第一個待檢查的缺口是：高進展／品質壓力家族是否在此之前已過度消耗資源，以及 Artisan 固定閒靜開局與前期內靜路徑是否限制成品。

所有 selector 只用 mechanics、宣告球色集合、實際 state/history 與剩餘 action budget；不讀 recipe/equipment ID、未來 seed 或 evaluator 私有球色比重。

## 第一階段：前期建設消融

36 件已看過的 E09/E10 診斷重播（各 family 12 件）顯示 F36／F46 到內靜 10 的平均工序約 29／39，F19 約 25；平均高速製作使用次數約 13.6／12.8／10.5。這是抽樣 trace 的線索，不是全量原因比例。

先測兩個獨立覆蓋：`exp-muscle-opening` 在 hard-quality 起手使用堅信，沿用 Artisan 既有堅信 buff 決策，保留快速改革；`exp-early-refinement` 在資源充足的早期普通／長持續球，以加工→精煉加工建立內靜，觀察後續成品是否改善。兩者其餘行為使用 v2.2；先比較 500-case 三臂，不因理論上節省資源就採用。

結果：v2.2 hard-quality 104/140，堅信 93/140（4 wins／15 losses），加工連招 99/140（1 win／6 losses）。兩者撤回；雙方滿品質時雖平均少約 1.6／1.1 actions，不能交換品質退步。500 paired、1,500 episodes、143 秒，無 timeout／retry。完整切片見 [第一階段 JSON](v22-opening-refinement-s1-slices.json)。

堅信有 3 次 illegal-action：保留快速改革至後期，Artisan 在改革仍有效時推薦快速改革，mechanics 明確拒絕 InnovationActive。這揭露既有 fallback 對偏離起手的狀態缺口；不修改已凍結 v2.2 identity，也不將這三件排除分母。案例 fingerprints：54a389e9770b8b08、dec66c43f8069dc8、8e1e34f8da7e0f03。

## 第二階段：當下球色的前期分工

`exp-condition-allocation` 保留 v2.2 起手，只在 hard-quality、內靜 1–8、當下結實／高耐久球且 v2.2 建議高速製作時，若宣告集合還有安定／大進展球，嘗試合法坯料加工，以折減耐久建立內靜。至少保留 74 CP 與 6 actions；不增加預備技能或等球，安定／大進展當下仍保留原決策。相同 500-case development panel 與原接受標準，不調整 seeds。

結果 99/140（4 wins／9 losses），未通過；無非法推薦，hard-quality failed 27→35、action-limit 9→6。雙方滿品質的 95 件平均少 1.78 actions，仍不抵品質損失。500 paired、1,000 episodes、92.7 秒、無 timeout／retry。完整切片見 [第二階段 JSON](v22-condition-allocation-s1-slices.json)。

## 第三階段：提前使用完整續作比較

`exp-early-continuation` 不採用前兩階段規則；只將 v2.2 的雙內部模型續作比較擴到內靜 1–5 的等球／隨機技能狀態。候選、pilot 4、confirmation 16、滿品質至少淨增 4 個模擬樣本且兩模型完成數／滿品質數不退的門檻完全不變。內靜至少 6 與 non-hard-quality 保持 v2.2。假說是讓終局收益判斷前期支出，避免固定偏好過早耗費 CP；代價是前期多支付搜尋。仍用同一 500-case panel；若無足夠收益，停止本輪，不啟動保留確認或 overnight。

結果 105/140（4 wins／3 losses），未達原初篩標準；F36／F46 不變。但 F43 5→9/10，4 wins 首次改招全部是閒靜後的掌握，基準在低耐久開局等球或高速製作；losses 首次改招在較晚階段。雙側成功 101 件平均少 3.89 actions。這是不同且具體的新訊號，因此追加一次開局資源消融；不是把這個未通過候選直接推進確認。

## 第四階段：只保留開局回復循環

`exp-opening-recovery` 僅在實際上一招為閒靜、掌握未生效時，允許同一續作比較選擇掌握；其他前期改招全部取消，之後保持 v2.2。沒有 family／裝備識別或根據 F43 寫門檻。目的為檢查上述 F43 收益是否由可泛用的開局回復決策帶來。

仍測相同 500 cases。原初篩門檻維持；若只重現 F43 至少 +4/10 且所有其他 hard-quality family 非負，允許一次完整面板 development 4 seeds 以判斷這個新弱家族訊號，不能宣稱通過原門檻。擴大後至少 hard-quality +3pp 且兩 world 非負才進獨立確認；否則停止，不再調參。

初篩 108/140（4 wins／0 losses），F43 5→9/10、其他 hard-quality family 全部不退；兩 world 淨增 +1／+3，符合本階段追加的擴大條件。4 seeds 預估約 6 分鐘，超過原單 seed screen 的 5 分鐘操作預算，因此跑前將此次明確限定為最多 12 分鐘、4 workers，品質判準不變。候選程式與 binary 固定，不依擴大結果調參。

## 1-seed 全家族對照

各欄是滿進展且滿品質件數，每 family 分母 10。所有試驗重用同一 development cases，不能當互相獨立的統計確認。

| Family | v2.2 | 堅信 | 加工連招 | 球色分工 | 前期續作 | 開局掌握 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| F11 | 10 | 10 | 10 | 10 | 10 | 10 |
| F14 | 8 | 7 | 8 | 8 | 8 | 8 |
| F16 | 9 | 9 | 9 | 9 | 8 | 9 |
| F18 | 10 | 8 | 10 | 9 | 10 | 10 |
| F19 | 8 | 6 | 7 | 6 | 8 | 8 |
| F28 | 9 | 8 | 8 | 9 | 9 | 9 |
| F31 | 7 | 5 | 6 | 6 | 6 | 7 |
| F33 | 9 | 8 | 8 | 9 | 9 | 9 |
| F35 | 9 | 8 | 8 | 8 | 8 | 9 |
| F36 | 4 | 5 | 4 | 4 | 4 | 4 |
| F41 | 7 | 6 | 7 | 7 | 7 | 7 |
| F43 | 5 | 6 | 6 | 7 | 9 | 9 |
| F45 | 8 | 6 | 7 | 7 | 8 | 8 |
| F46 | 1 | 1 | 1 | 0 | 1 | 1 |
| 合計 /140 | 104 | 93 | 99 | 99 | 105 | 108 |

| Hard-quality 切片 | v2.2 | 堅信 | 加工連招 | 球色分工 | 前期續作 | 開局掌握 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| E02 /28 | 21 | 20 | 18 | 19 | 21 | 21 |
| E03 /28 | 21 | 19 | 21 | 22 | 22 | 23 |
| E07 /28 | 15 | 11 | 13 | 12 | 14 | 15 |
| E09 /28 | 23 | 21 | 23 | 23 | 24 | 24 |
| E10 /28 | 24 | 22 | 24 | 23 | 24 | 25 |
| balanced-iid /70 | 61 | 58 | 59 | 59 | 61 | 62 |
| normal-heavy-iid /70 | 43 | 35 | 40 | 40 | 44 | 46 |

Non-hard-quality 的 360 件：五候選皆保持 baseline 的完成／滿品質／步數結果。各完整 500 格及 paired wins／losses 保存在對應 `*-slices.json`，full family ID／recipe／equipment 身份由各 run config 與自動報告對照。

## Native 單步耗時與研究成本

以下使用整個 500-case 面板的每次推薦耗時，單位 ms；4 workers 下觀測，不能外推為瀏覽器或手機耗時。開局掌握初篩同時執行 Rust 測試，該次 timing 包含競爭負載；不以最慢值差異宣稱演算法變慢。

| 試驗 | p50 | p95 | worst | 同次 baseline p95 |
| --- | ---: | ---: | ---: | ---: |
| 堅信 | 6.204 | 18.213 | 34.870 | 19.281 |
| 加工連招 | 6.730 | 18.886 | 34.364 | 19.281 |
| 球色分工 | 6.410 | 17.657 | 32.622 | 17.784 |
| 前期續作 | 6.573 | 17.598 | 35.362 | 17.614 |
| 開局掌握 | 6.290 | 18.576 | 67.560 | 18.709 |

前四階段共 4,500 episodes，實際 runner active wall 合計 421.4 秒；50/50 shards 均完成、無 timeout／retry。這不含編譯、診斷與人工分析，且不是獨立案例數。

## 身份與重播

所有 run 位於 `evaluation-runs/v22-quality-development/`，config、manifest、raw-partials 與 shard outputs 保留在本機。這些檔案由忽略規則保護，不會隨一般文件提交。下面 SHA-256 對應同目錄 `.artifacts/<sha>/craft-kernel-generic-episode.exe`。

| Run | Binary SHA-256 |
| --- | --- |
| opening-refinement-s1 | `1ce48bdf2be47820516c3851d97753ca414975d971d2f2b53f28978d5d107333` |
| condition-allocation-s1 | `3dace48190c6356a0b2f86dd7869e438d8d66db8b445ee3a7bcbca9370ea275c` |
| early-continuation-s1 | `16e43459bfb6f1dbc0b9ea4dd6033df6c0f4a15d2f967528c06fe8586bef20ca` |
| opening-recovery-s1／s4 | `2c236e4f43ad93830aded50a346e28c6c6996cdb51cbdf9f9be2f4f0491435bb` |

[研究 source patch](v22-quality-development-source.patch) 以 `b962bf1` 為基底，包含五個非數字試驗 identity、測試及非法推薦 probe；不是正式策略採用。重播應使用隔離 checkout 套用 patch，或直接使用上述 frozen binary 與 run 的 raw input。Patch 已通過對研究工作樹的 `git apply --check --reverse`。

[堅信非法推薦輸入](v22-muscle-opening-illegal-cases.tsv) 可交由 patch 中的 `v22_quality_diagnose` example 讀取；[前期續作七個改變成品的案例](v22-early-continuation-changed-cases.json) 保存首次分歧與前置狀態。

開局回復的實際機制：Artisan `solve_mid_durability_pre_quality` 在宣告有高效球、沒有崇敬等條件下，會把 25 耐久視作可等待區間，優先觀察以等折價回復。F43 原始耐久 35，閒靜後即到 25，因此可能很早開始等待。候選仍透過兩個內部球色模型比較整件成品，只有選到掌握才介入；它沒有新增知道私有球色機率的能力，也不能推論所有低耐久配方都應立刻掌握。

## 開局候選 4-seed 擴大結果

完整面板 2,000 paired cases、4,000 episodes；hard-quality 560 cases，non-hard-quality 1,440 cases。包含初篩的 seed index 0，不是 2,000 件全部未看過的新資料。追加 seeds 1–3 的 hard-quality 292→297/420，5 wins／0 losses；F43 在追加資料為 22→24/30，增幅比初篩的 5→9/10 小。

| Hard-quality family /40 | v2.2 | 開局掌握 | wins / losses |
| --- | ---: | ---: | ---: |
| F11 | 36 | 36 | 0 / 0 |
| F14 | 34 | 35 | 1 / 0 |
| F16 | 36 | 36 | 0 / 0 |
| F18 | 36 | 37 | 1 / 0 |
| F19 | 27 | 27 | 0 / 0 |
| F28 | 33 | 33 | 0 / 0 |
| F31 | 29 | 29 | 0 / 0 |
| F33 | 33 | 33 | 0 / 0 |
| F35 | 31 | 32 | 1 / 0 |
| F36 | 14 | 14 | 0 / 0 |
| F41 | 25 | 25 | 0 / 0 |
| F43 | 27 | 33 | 6 / 0 |
| F45 | 31 | 31 | 0 / 0 |
| F46 | 4 | 4 | 0 / 0 |
| 合計 /560 | 396 | 405 | 9 / 0 |

| Hard-quality 切片 | v2.2 | 開局掌握 | wins / losses |
| --- | ---: | ---: | ---: |
| E02 /112 | 69 | 72 | 3 / 0 |
| E03 /112 | 89 | 92 | 3 / 0 |
| E07 /112 | 52 | 52 | 0 / 0 |
| E09 /112 | 89 | 91 | 2 / 0 |
| E10 /112 | 97 | 98 | 1 / 0 |
| balanced-iid /280 | 243 | 245 | 2 / 0 |
| normal-heavy-iid /280 | 153 | 160 | 7 / 0 |

| F43 裝備，每 world /4 | balanced-iid v2.2→候選 | normal-heavy-iid v2.2→候選 |
| --- | ---: | ---: |
| E02 | 4→4 | 2→3 |
| E03 | 2→4 | 3→4 |
| E07 | 3→3 | 0→0 |
| E09 | 3→3 | 3→4 |
| E10 | 4→4 | 3→4 |

完整交貨 1,768→1,777/2,000，滿品質成品 1,560→1,569；全部收益來自 hard-quality。Hard-quality action-limit 42→36、failed 122→119；policy-null／illegal-action 均 0，沒有以失敗品的較高品質算收益。雙方滿品質的 396 件平均少 0.97 actions；F43 雙側成功 27 件平均少 6.63 actions。這些是配對成功條件下的長度，不是所有玩家平均必省的操作數。

本次 native 全面板推薦：baseline p50/p95/worst = 7.937/22.719/41.260 ms，candidate = 7.964/22.549/38.172 ms。Hard-quality candidate = 7.271/22.105/38.172 ms。這輪沒有同時執行 Rust 測試；與先前小面板的不同時段耗時不作精確速度歸因。

詳見 [4-seed 完整切片](v22-opening-recovery-s4-slices.json) 與 [自動四表](opening-recovery-s4.md)。本次耗時 435.8 秒，50/50 shards 完成、無 timeout／retry。全輪合計 8,500 episodes、857.2 秒 runner active wall（約 14.3 分鐘）；涉及 2,000 個不同案例，重跑與候選臂不能當新樣本。另有小批 trace 診斷、編譯與測試，未含在此 wall time。

## 驗證與交接邊界

- 研究版本 Rust `cargo test --lib --tests`：142 passed；另測 private condition weights 不改首步建議，並檢查 selector 僅接收 declared mask／可觀測 state/history。
- 前四階段相同 500 個 baseline rows 除 timing 完全一致；各候選 non-hard-quality rows 的 outcome、actions、工序與 planner context 除 identity/timing 完全一致。
- 未採用的 Rust 修改已移到 source patch，主程式對基底無 diff；恢復後 release build 通過，native binary SHA-256 `024957d74555f9ef2dcb502afe859ad1a193ba3c75024b28eb94d9e940acb647`。Source patch 的 forward／reverse check 均已檢查。
- `docs:check` 與 `git diff --check` 通過。沒有新 Web 行為、瀏覽器／手機 benchmark、部署、commit 或遊戲內實證。
- 已知快速改革非法推薦是獨立可靠性缺口；沒有因本輪品質研究停止而宣稱它已修好。修正需要新的行為身份與玩家偏離案例驗證，不是擴大這批預設路徑 seeds 就會解決。

## 開局候選 4-seed 擴大結果

完整面板 2,000 paired cases、4,000 episodes；hard-quality 560 cases，non-hard-quality 1,440 cases。包含初篩的 seed index 0，不是 2,000 件全部未看過的新資料。追加 seeds 1–3 的 hard-quality 292→297/420，5 wins／0 losses；F43 在追加資料為 22→24/30，增幅比初篩的 5→9/10 小。

| Hard-quality family /40 | v2.2 | 開局掌握 | wins / losses |
| --- | ---: | ---: | ---: |
| F11 | 36 | 36 | 0 / 0 |
| F14 | 34 | 35 | 1 / 0 |
| F16 | 36 | 36 | 0 / 0 |
| F18 | 36 | 37 | 1 / 0 |
| F19 | 27 | 27 | 0 / 0 |
| F28 | 33 | 33 | 0 / 0 |
| F31 | 29 | 29 | 0 / 0 |
| F33 | 33 | 33 | 0 / 0 |
| F35 | 31 | 32 | 1 / 0 |
| F36 | 14 | 14 | 0 / 0 |
| F41 | 25 | 25 | 0 / 0 |
| F43 | 27 | 33 | 6 / 0 |
| F45 | 31 | 31 | 0 / 0 |
| F46 | 4 | 4 | 0 / 0 |
| 合計 /560 | 396 | 405 | 9 / 0 |

| Hard-quality 切片 | v2.2 | 開局掌握 | wins / losses |
| --- | ---: | ---: | ---: |
| E02 /112 | 69 | 72 | 3 / 0 |
| E03 /112 | 89 | 92 | 3 / 0 |
| E07 /112 | 52 | 52 | 0 / 0 |
| E09 /112 | 89 | 91 | 2 / 0 |
| E10 /112 | 97 | 98 | 1 / 0 |
| balanced-iid /280 | 243 | 245 | 2 / 0 |
| normal-heavy-iid /280 | 153 | 160 | 7 / 0 |

| F43 裝備，每 world /4 | balanced-iid v2.2→候選 | normal-heavy-iid v2.2→候選 |
| --- | ---: | ---: |
| E02 | 4→4 | 2→3 |
| E03 | 2→4 | 3→4 |
| E07 | 3→3 | 0→0 |
| E09 | 3→3 | 3→4 |
| E10 | 4→4 | 3→4 |

完整交貨 1,768→1,777/2,000，滿品質成品 1,560→1,569；全部收益來自 hard-quality。Hard-quality action-limit 42→36、failed 122→119；policy-null／illegal-action 均 0，沒有以失敗品的較高品質算收益。雙方滿品質的 396 件平均少 0.97 actions；F43 雙側成功 27 件平均少 6.63 actions。這些是配對成功條件下的長度，不是所有玩家平均必省的操作數。

本次 native 全面板推薦：baseline p50/p95/worst = 7.937/22.719/41.260 ms，candidate = 7.964/22.549/38.172 ms。Hard-quality candidate = 7.271/22.105/38.172 ms。這輪沒有同時執行 Rust 測試；與先前小面板的不同時段耗時不作精確速度歸因。

詳見 [4-seed 完整切片](v22-opening-recovery-s4-slices.json) 與 [自動四表](opening-recovery-s4.md)。本次耗時 435.8 秒，50/50 shards 完成、無 timeout／retry。全輪合計 8,500 episodes、857.2 秒 runner active wall（約 14.3 分鐘）；涉及 2,000 個不同案例，重跑與候選臂不能當新樣本。另有小批 trace 診斷、編譯與測試，未含在此 wall time。

## 驗證與交接邊界

- 研究版本 Rust `cargo test --lib --tests`：142 passed；另測 private condition weights 不改首步建議，並檢查 selector 僅接收 declared mask／可觀測 state/history。
- 前四階段相同 500 個 baseline rows 除 timing 完全一致；各候選 non-hard-quality rows 的 outcome、actions、工序與 planner context 除 identity/timing 完全一致。
- 未採用的 Rust 修改已移到 source patch，主程式對基底無 diff；恢復後 release build 通過，native binary SHA-256 `024957d74555f9ef2dcb502afe859ad1a193ba3c75024b28eb94d9e940acb647`。Source patch 的 forward／reverse check 均已檢查。
- `docs:check` 與 `git diff --check` 通過。沒有新 Web 行為、瀏覽器／手機 benchmark、部署、commit 或遊戲內實證。
- 已知快速改革非法推薦是獨立可靠性缺口；沒有因本輪品質研究停止而宣稱它已修好。修正需要新的行為身份與玩家偏離案例驗證，不是擴大這批預設路徑 seeds 就會解決。
