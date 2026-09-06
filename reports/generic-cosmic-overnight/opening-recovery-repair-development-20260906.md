# 開局掌握退步修補試驗

2026-09-06 使用者授權做有限試驗。兩個方向各完成 611 件診斷，均未達擴查條件，已撤下試驗 runtime，封存 source 與結果。原 `exp-opening-recovery` 候選保留，正式 v2.2／Web 不變；沒有新長跑。

## 跑前契約

- Deferred：比較立即掌握與「先高速製作、下一步依實際狀態重新比較掌握」。下一步只讀實際狀態與上一招歷史，模擬中的判斷亦不讀未來球色。先試此方向，再獨立試 Confirmed；不預先組合。
- Confirmed：只有原開局掌握提出掌握時，再以另一批內部抽樣確認它勝過 v2.2 當前選擇。原候選不變；新增成本與失去的勝例都計入。
- 診斷面板：64-seed 長跑的全部 114 個滿品質勝負案例，加全部 500 個 family × equipment × world 格子的 sample 0，去重。保留 Balanced、80 actions，使用原 frozen run 的 v2.2／開局掌握 outcomes 作逐案對照，只新算修補候選。
- 這是刻意包含全部已知勝負案例的 development／regression 面板，不能把其成功比例當自然機率或獨立確認。需分開報救回 22 敗多少、丟掉 92 勝多少，以及原本滿品質持平案例新增勝負；進展交貨不替代滿品質。
- 額外淨增至少 5 件 hard-quality 滿品質、重要 family 不出現明顯淨退步，且無 illegal／policy-null，才值得使用既有 500-case development base `20260906` 擴查。正向但較小者保留證據，重新衡量成本，不直接交付新長跑。
- 每個方向最多 5 分鐘診斷、4 workers；若有價值才擴查，單次最多 5 分鐘。新增深度或抽樣使單步明顯超過約 100ms 時，列明品質收益，沒有收益即停止；不以放寬預算挽救失敗方向。
- 不為 `centered`、family ID、equipment ID 或已知 seed 設例外。任何新策略都保留原始失敗與相同面板比較，不能只挑修好的兩案。

## 固定實作

- `exp-opening-deferred`：當原開局掌握選掌握、v2.2 選高速製作，且高速製作兩種成敗都不立即失敗時，雙模型各 8 條續作比較立即與延後掌握；每個模型完成／滿品質不得少，合計滿品質至少多 2 才延後。模擬與實際下一步使用同一個再判斷器：先取得 v2.2 建議，再以雙模型各 4 條、合計至少多 1 滿品質的條件比較掌握。
- Deferred 的單步記憶依實際歷史建立：任何緊接閒靜的高速製作後，重新比較掌握一次，包括玩家自行選的高速製作；下一個實際動作清除窗口。高速成敗後都讀真實 state。這也可能改變原本未選掌握的開局，所以包含原持平 controls，不能只測已知敗例。
- `exp-opening-confirmed`：原開局掌握提出掌握時，再以新 offset 10001、雙模型各 32 條確認；各模型完成／滿品質不得少，合計至少多 8 滿品質才保留，否則回 v2.2 當前建議。這版確認所有掌握提案，沒有假稱只挑到已知估值接近的狀態。
- Deferred root offset 1001、follow-up offset 2001。內部模型與 sampler 繼承原策略，不讀實際 seed／未來 outcome／evaluator 私有權重。仍用 Artisan 作後續 rollout，不宣稱全程精確模擬完整 v2.2。
- Deferred 的記憶已通過成功／失敗觀察、手動偏離與窗口清除的 focused test。試驗中發現新增 context 欄位會連帶改變原策略的 Debug-based fingerprint；該欄位已隨未採用的試驗移除。清理後，原版與 v2.2 對 frozen binary 的 fixture 重播，全部非 timing 欄位（含完整 trace 與 context fingerprint）一致。這不宣稱重跑了完整 64-seed。

## 結果與停止決定

選樣去重後 611 件，其中 hard-quality 251 件；包含全部已知 92 勝／22 敗與 500 格各一件 controls。以下「勝／敗」是相對原開局掌握的滿品質變化，不能換算成自然滿品質率。

| 相對原開局掌握 | 延後掌握 Deferred | 增加抽樣確認 Confirmed |
| --- | ---: | ---: |
| 救回原 22 敗 | 0 | 19 |
| 丟掉原 92 勝 | 0 | 69 |
| 原持平案例新增勝／敗 | 2／2 | 0／0 |
| 額外滿品質淨變化 | 0 | -50 |
| hard-quality 滿品質件數，原為 188 | 188 | 138 |
| 其他 360 件的滿品質件數，原為 294 | 294 | 294 |
| hard-quality 雙方滿品質平均 actions 差 | -0.4194（186 件） | +0.1345（119 件） |
| 非法技能／policy-null | 0／0 | 0／0 |
| 4 workers 執行 wall time | 約 81.27 秒 | 約 79.07 秒 |

兩者均未達跑前「額外淨增至少 5 件」條件，不擴查 500-case development，不調高計算預算，也不追加長跑。兩方向合計 1,222 件新 episodes，既有 v2.2 與開局掌握對照直接沿用；這是不到三分鐘的實際 evaluator 執行成本，不包含開發與測試時間。

### 退步有沒有被修好

增加抽樣確認能救回 F35 的全部 4 個舊敗例，包括先前唯一負向切片 F35／E02／normal-heavy 的兩件；但同時丟掉 F35 的全部 12 個舊勝例。F43 也救回 13 件，卻丟掉 49 件。較嚴格的 gate 確實會減少某些過早掌握，但同時大幅撤銷原本有益的介入，不能稱為有效修補。

延後掌握沒有救回舊敗例；新增的兩勝都在 F41，兩敗分別在 F14／E03／normal-heavy 與 F45／E09／normal-heavy。它改變了部分原持平開局，品質得失相抵，且巢狀續作估算增加尾端延遲。

| hard-quality family | Deferred 勝／敗 | Confirmed 勝／敗 |
| --- | ---: | ---: |
| F11 | 0／0 | 1／4 |
| F14 | 0／1 | 0／0 |
| F18 | 0／0 | 1／4 |
| F35 | 0／0 | 4／12 |
| F41 | 2／0 | 0／0 |
| F43 | 0／0 | 13／49 |
| F45 | 0／1 | 0／0 |
| F16、F19、F28、F31、F33、F36、F46 | 0／0 | 0／0 |

依 E02／E03／E07／E09／E10 的滿品質淨變化，Deferred 為 +1／0／0／-1／0，Confirmed 為 -7／-7／-7／-15／-14。依 balanced-iid／normal-heavy-iid，Deferred 為 +1／-1，Confirmed 為 -18／-32。完整逐件 family × equipment × world 與成敗、actions、quality 存於結果 JSON；未以 aggregate 隱藏退步。

這只否定本次兩個具體實作，不能證明退步無法修復或配方已達裝備上限。更好的介入判斷仍可能存在，但目前證據不支持繼續在這兩個 gate 上反覆調參。

### 單步推薦成本

| native 推薦耗時 | Deferred | Confirmed |
| --- | ---: | ---: |
| Calls | 28,996 | 30,529 |
| P50 | 9.0701 ms | 8.4874 ms |
| P95 | 23.9443 ms | 23.5619 ms |
| Worst | 239.6661 ms | 54.9107 ms |
| 超過 100ms | 41 次 | 0 次 |

這是各自診斷面板的全部呼叫，含多數未介入的步驟；沒有重跑原策略的同場 timing 對照，不能拿較小 P50 推論加了確認反而更快。也不是瀏覽器／WASM 耗時。Deferred 的額外品質收益為零，沒有理由接受較高尾端延遲。

## 可重播證據與清理驗證

- 原 64-seed config fingerprint：`99ca0c9f71723370681915804194879542f2ffc87fe0cc372931afdc8aec4394`。
- 試驗 native binary SHA-256：`85bcc312429d869e5eeecc6d49452122df9cb8516a08fe657fcd8180b5d1458d`；凍結於 `evaluation-runs/opening-recovery-repair/.artifacts/<sha>/craft-kernel-generic-episode.exe`。
- [Source patch](opening-recovery-repair-source-20260906.patch)：對 HEAD `b962bf1` 的 native 差異，包含原開局掌握與本次兩試驗；不是在現行 dirty tree 直接套用的修補包。
- [完整結果](opening-recovery-repair-results-20260906.json)：兩個面板及逐件 outcomes；原始 input／51 欄 output／batch summary 留在 `evaluation-runs/opening-recovery-repair/{deferred,confirmed}-diagnostic-s64/`。解析時有排除原生協定的 9 欄 batch summary，不把它誤當 episode。
- [診斷與重算程式](opening-recovery-repair-screen-20260906.mjs)：兩方向的 `--verify-saved` 均已通過，核對保存 output 重新算出的 outcomes、切片與每次呼叫 timing。Deferred wall time 由原 input／output 檔時間重建，因初次解析曾誤讀 batch summary；沒有為解析問題重跑 episodes。
- 試驗實作先完成 Rust 測試與實際成敗記憶測試。撤下兩個 identity、記憶欄位、dispatcher、額外 evaluator 後，Rust `--lib --tests` 全部 141 tests 通過，release build 通過。留下的 runtime 只有原開局掌握候選與既有策略。
- 清理後 native SHA-256：`6b5605b1f858608f98a410196ee7730e93cc8d4be01fc226d21024658f1c4004`。`opening_recovery.tsv` 分別以原開局掌握及 v2.2 重播，與原 frozen `889253f5…` binary 全部非 timing 輸出一致，包含完整 trace／context；記錄在 `evaluation-runs/opening-recovery-repair/final-parity.json`。
- 未切換 Web、未升版、未 commit，未使用新的獨立 base。原開局掌握是否採用為 v2.3，仍以原完整長跑證據交由使用者決定。
