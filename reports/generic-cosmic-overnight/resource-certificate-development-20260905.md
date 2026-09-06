# Artisan 強化：完工證明與續作比較

## 結論

2026-09-05 完成四階段 Rust 實作／消融與一次獨立確認。選定 `generic-craft-external-reference-exp-artisan-continuation` 作為下一輪候選：已有確定滿品質路線時提早收尾；尚無證明時，比較必成替代技能接回 Artisan 的完整續作，改善低耐久但尚有資源時的等球。

相對 v2.1，獨立 2,000 cases 的滿品質成品增加 48 件，其中 hard-quality 增加 36 件。相對只有完工證明的版本，hard-quality 增加 34 件，兩側皆成功的 353 件平均少 2.60 招。這是值得擴大驗證的改善，**尚不能稱為普遍可靠或已可正式採用**：hard-quality 仍有 168/560 件未完成，且 F19 有負向交換。

正式 Web／預設 identity 仍為 v2.1；研究 Web 需要明示 Cargo feature。沒有數字升版、commit、push 或部署。完整長跑尚未啟動，契約與命令見 [下一輪 brief](../../.agents/overnight_review_brief.md)。

## 獨立確認結果

`confirmation-s4` 使用事前保留 base seed `20261117`、每格 4 seeds，50 families × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × Balanced，80 actions。共 2,000 paired cases／6,000 episodes，三臂 fresh 執行，50/50 shards 完成，無 timeout、retry、illegal 或 policy-null。4 workers，12 分鐘 budget／2 分鐘 shard timeout／0 retries，實際 481.704 秒。確認後沒有依這批結果調整策略。

| 成果 | v2.1 | 只有完工證明 | 證明＋Artisan 續作比較 |
| --- | ---: | ---: | ---: |
| 全部完成品 / 2,000 | 1,713 | 1,723 | 1,757 |
| 全部滿品質成品 / 2,000 | 1,499 | 1,513 | 1,547 |
| Hard-quality 滿品質完成 / 560 | 356 | 358 | 392 |
| 一般收藏品滿品質 / 1,240 | 987 | 999 | 999 |
| 一般製作滿品質 / 80 | 71 | 71 | 71 |
| Master 滿品質 / 120 | 85 | 85 | 85 |
| Native 單步 p95 ms | 4.648 | 22.927 | 23.034 |
| Native 最慢單步 ms | 14.401 | 123.568 | 84.271 |

Candidate 對 v2.1：滿品質 52 wins / 4 losses；hard-quality 40 wins / 4 losses。對完工證明：39 wins / 5 losses，全部位於 hard-quality。Non-hard-quality 的成品與 utility 在後兩臂相同，不能把一般收藏品收益歸給續作比較。

Hard-quality 對完工證明的提升是 6.07 個百分點；以 14 個 family 為 cluster、固定 seed 592023、10,000 次 bootstrap 的描述性 95% 區間為 +2.50～+9.82 個百分點。這只反映此固定裝備／模型面板對 family 的敏感度，沒有多重比較校正，也不是自然遊戲成功率。單格僅 4 seeds，25 個百分點的跳動其實只有一件。

### 球色與裝備

只計 hard-quality 滿品質完成；裝備每列 112 cases，world 每列 280 cases。

| 切片 | v2.1 | 完工證明 | 候選 | 候選對完工證明勝／負 |
| --- | ---: | ---: | ---: | ---: |
| balanced-iid | 225 | 225 | 236 | 11 / 0 |
| normal-heavy-iid | 131 | 133 | 156 | 28 / 5 |
| E02：720＋690 食藥非專家 | 60 | 62 | 69 | 9 / 2 |
| E03：720＋690 食藥專家 | 77 | 77 | 86 | 9 / 0 |
| E07：i750 未鑲嵌食藥 | 43 | 43 | 50 | 7 / 0 |
| E09：i750 五鑲嵌食藥非專家 | 86 | 86 | 89 | 5 / 2 |
| E10：i750 五鑲嵌食藥專家 | 90 | 90 | 98 | 9 / 1 |

兩種 world 都有正向淨增，E02/E09 沒有 aggregate 退步，達成事前確認條件。不過 normal-heavy 下仍只有 156/280（55.7%）完成，代表有減輕對好球的依賴，遠未消除。模型間的差異是壓力敏感度，不能當遊戲球色機率。

### 家族與敗例

每 family 40 cases；以下列出全部 hard-quality 家族。其他 36 families、全部 500 個 family × equipment × world 格子與品質 milestone 分布見 [完整切片 JSON](continuation-confirmation-slices-20260905.json)。固定 E02/E09 balanced-world 的兩組四表見 [自動報表](confirmation-s4.md)。

| Family／代表配方 ID | 完工證明 | 候選 | 勝／負 |
| --- | ---: | ---: | ---: |
| F11 / 36205 | 32 | 38 | 6 / 0 |
| F14 / 36219 | 33 | 36 | 4 / 1 |
| F16 / 36222 | 33 | 34 | 1 / 0 |
| F18 / 36225 | 30 | 36 | 6 / 0 |
| F19 / 36227 | 23 | 21 | 0 / 2 |
| F28 / 36990 | 31 | 32 | 1 / 0 |
| F31 / 37001 | 31 | 35 | 4 / 0 |
| F33 / 37003 | 31 | 31 | 1 / 1 |
| F35 / 37005 | 24 | 27 | 4 / 1 |
| F36 / 37006 | 11 | 12 | 1 / 0 |
| F41 / 37526 | 23 | 24 | 1 / 0 |
| F43 / 37528 | 24 | 33 | 9 / 0 |
| F45 / 37530 | 25 | 26 | 1 / 0 |
| F46 / 37531 | 7 | 7 | 0 / 0 |

5 個對完工證明的敗例都在 normal-heavy：F14/E09、F33/E02、F35/E09、F19/E02、F19/E10，對應單格均少一件。F19 整體少兩件，不能用其他 family 的收益抵銷揭露。F46 幾乎沒有改善，F36 仍低，尚未證明是裝備不可達。

[五個敗例完整 trace](continuation-confirmation-loss-traces-20260905.json) 顯示，首次改選包括工匠的絕技、儉約加工、掌握與巧奪天工；並非非法技能或錯誤完工證明，而是對後續 Artisan 成品估計未兌現。F19/E02 在 Good、P6040/Q9565/D50/CP570/IQ10 時，從高速製作改成工匠的絕技，最後碰到 80 招上限；F19/E10 在 D5/CP691/IQ6 由觀察改成巧奪天工，仍於後段失敗。續作估計使用 Artisan fallback，實際每步又可能介入，且兩個內部假設不等於 evaluator world；因此有抽樣誤差與續作模型誤差。沒有針對這些 ID 改參數。

### 等球、長度與效能

對完工證明，hard-quality action-limit 88→48，但 terminal failed 114→120；全部未完成 202→168。不能說每一種失敗都減少。Hard-quality 完成者平均 51.58→50.08 招、p95 74→71；因成功母體改變，配對的 353 件雙側滿品質成品平均 -2.60 招才是較直接的長度比較（111 縮短／11 變長／231 相同）。

另以固定 50-family E02 normal-heavy 開發樣本直接數 `observe`／`carefulObservation`：v2.1 共 952 次、完工證明 902 次、候選 857 次；總招數 2663→2586→2554。這是 [診斷樣本](continuation-consolidation-check-20260905.json)，不是整個確認集的等待次數，也沒有把修復／buff 都算成空等。

[Node-WASM benchmark](artisan-continuation-wasm-20260905.json)：同一 50-family E02 normal-heavy 樣本，2,604 次推薦（含終局回覆），native/WASM 動作及最終 context 0 mismatch；warm p95 15.462ms、p99 18.792ms、max 25.517ms。WASM 613,041 bytes，記憶體約 3.88 MiB。Native 確認是 4-worker throughput 負載，不能直接與 Node-WASM timing 比速度；尚無目標瀏覽器／手機或遊戲實戰驗證。

## 實際決策與工程證據

保留資源證明、12 招路線證明與 Artisan 續作比較；移除只有小幅長度收益、沒有額外品質的 width 96 試驗。各階段原判準留在下方，不事後改寫為必然成功。第四階段通過方向性條件，paired losses 已逐案診斷；F19 退步仍是下一輪重點。選入擴大比較不等於自動升版。

基底 checkout `14ac85f` 加本次未提交變更。Raw inputs、config、manifest、completed shards 位於 `evaluation-runs/resource-certificate-development/<run-id>`；報表不能代替 raw evidence。

| 識別 | 值 |
| --- | --- |
| 確認 binary SHA-256 | `ec76216c43f84ac41258a4043ba31a644334cd277152a4ab571501fe07c65a55` |
| 確認 config SHA-256 | `77be56e9c64108e7add8dfbb61920cd3bedb8d686845c689578ec27155319848` |
| 移除 wide 後交付 binary SHA-256 | `b97a4aee2cfb292023bdd0fa7e4a87c6c0b28e63181ed5acd95ebcf76aa30397` |
| Binary 快照根目錄 | `evaluation-runs/resource-certificate-development/.artifacts/<SHA-256>/craft-kernel-generic-episode.exe` |

交付 binary 對確認 binary 以固定 50-case 樣本逐欄比較 full trace、final state、context、動作與停止原因，除了計時欄位外 0 mismatch；這是 consolidation regression check，沒有把不同 binary 冒充完全相同來源。舊 width 試驗來源快照另在 `source-before-consolidation/`。

Rust lib/integration 140 tests、research Web feature 5 個 bridge tests 通過；正式 WASM 建置與 Web adapter 3 tests 通過。Runner 40 個測試通過（其中 process-control 2 tests 需解除 sandbox 才能驗證 Windows child tree 清理）。CLI help、bounded 三臂 smoke、完成後 resume/status-only 依 brief 記錄。文件（162 Markdown files）與 diff 檢查通過。沒有把機械檢查當作遊戲實證。

## 開發期原始契約與逐階段紀錄

## 跑前契約

本輪於 2026-09-05 開始；baseline 是已採用的 `generic-craft-external-reference-v2.1.0`，candidate 是描述性實驗 `generic-craft-external-reference-exp-resource-certificate`，沒有升版或切換 Web。

現行四步證明在滿品質後只檢查一招進展，而且沒有修復耐久、工匠的絕技或專家資源候選。本輪保留既有 v2.1 證明，未命中時以四步 AND/OR 搜尋補充必成進展、資源與品質路線；每個宣告球色分支都要滿品質完工，無證明則使用固定 Artisan。完整 state memo 與 forced-condition 去重只省重複運算。未知不代表不可達。

Development 先跑 50 families × Balanced × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × 1 seed（base 20260905），最多擴為每格 4 seeds 的 bounded screen；80 actions。確認集預留 base 20261117，停止調整後才執行。已看過資料不稱保留集。

主要量尺是 hard-quality 同時滿進展滿品質，其餘只計完成品的滿品質、完整品質檔位與 utility；各 family × equipment × world 另看 paired 勝負、illegal、policy-null、action-limit、長度與 latency。500 cases 只判斷方向；2,000 cases 若滿品質淨增不足 5 件或發現完成/滿品質 paired loss，先診斷，不以 aggregate 升版。這是研究篩選條件，不是統計顯著性或首發門檻。

Native p95 以約 100ms 為期望。超過時報告實際品質增量與成本，重大交換交使用者判斷；任何 >=3 秒推薦、非法選招或假證明先修正。長跑由使用者啟動。

## 第一階段與第二階段跑前契約

第一階段 500 paired cases（`evaluation-runs/resource-certificate-development/screen-s1`）完成 50/50 shards，baseline 完成 434、滿品質 379；resource candidate 完成 438、滿品質 383，4 wins/0 losses。收益在 F26/E02、F26/E03、F08/E10 的 normal-heavy，以及 F09/E07 的 balanced world。Native p95 3.5465→15.3537ms、max 7.6753→33.2228ms；沒有 illegal/policy-null，action-limit 都是 29。Binary `c9f1da1d96dec4867a51dcf0972127a3d8f3d8f6bb41b7c395fd243a9b78a87e`，config `c401aa76cf106dd0e58ea5eb60cf88b9d6dd65572e6f36ef7e8987b5c86488a2`。

第二階段以獨立 identity `generic-craft-external-reference-exp-certified-route`，保留第一階段，另重用 v1 bounded endgame proposer 產生最多 12 actions 的 Normal witness；只有全部宣告球色通過固定路線 full-quality verifier 才接管。證明上限 4096 transitions/512 frontier states，耗盡代表 unknown；已證明路線保存在獨立的 route 欄位，每次實際回報後前進一招，resume 重新核對 state 與證明。這針對「四步之外已可確定收尾卻仍冒險」而不是品質局部分數。

第二階段沿用第一階段的 500-case 開發座標，先相對 resource certificate 隔離增量，再相對 v2.1 整合確認；如果沒有額外滿品質收益或出現 paired 完成/滿品質退步，先診斷。Native p95 仍以約 100ms 為期望，成本與成果並列。固定 base 20261117 暫不查看。

## 第四階段結果與凍結確認契約

第四階段完成 500 cases/50 shards。相對第二階段的 hard-quality 91/140→97/140，7 wins/1 loss；全部 cases 的滿品質 389→395、完成 439→445。Hard-quality action-limit 19→11，但 terminal failed 30→32；兩者不能混稱全部 failure 都改善。Native p95 15.840→15.945ms，max 32.393→35.320ms。

8 個成敗翻轉案例的 [完整診斷 traces](continuation-causal-traces-20260905.json) 顯示主要改動是原本低耐久但 CP 很多的等球 state，改為修復/掌握後接回 Artisan；另有一次草率加工改為儉約加工。唯一敗例是 36219/E07/normal-heavy：首次不同在 P4530/Q3222/D10/CP470/IQ6，Observe→Manipulation，等待 38→28，但最後 Q16241/18900 製作失敗；不能因少等 10 次就列作品質改善。這是 synthetic paired trace，不是自然遊戲實證。

現在凍結第二＋第四階段的組合（不含 wide）。獨立確認使用先前保留的 base 20261117、每格 4 seeds，共 2,000 paired cases，50 families × 5 equipment × 2 worlds × Balanced，80 actions；fresh v2.1 baseline、第四階段 candidate、第二階段 reference 三臂，共 6,000 episodes。限定 4 workers、12 分鐘總 budget、每 shard 2 分鐘、0 retries；這是一次 bounded confirmation，不啟動 64-seed long run。

確認主要看 hard-quality 相對第二階段淨增至少 10/560、兩個 world 各自非負；若未達或主要 E02/E09 退步，先診斷，不自動採用。整體相對 v2.1 另檢查完整品質檔位、full quality、完成、paired losses、逐 family/equipment/world、illegal/policy-null、action-limit 與長度。Native p95 期望約 100ms 以內；樣本量不足的單格不能稱可靠成功率。本輪不依確認集改參數；有問題則保存這次失敗與後續新假說。

## 第三階段結果與第四階段跑前契約

`wide-route-screen-s1` 的 500 cases 沒有額外完成、滿品質或 utility；兩側均完成 439、滿品質 389。既有 389 件雙側滿品質成品有 64 件縮短、14 件變長、311 件持平，平均少 0.440 招；native p95 15.994→18.289ms。使用者補充等球/操作長度問題後，這是次要可參考改善，但不因這個結果升版或繼續單純增加 width。

第四階段 `generic-craft-external-reference-exp-artisan-continuation` 使用第二階段基礎，針對 required-quality 配方、內靜至少 6、尚未滿品質且 Artisan 建議等球或隨機技能的 state，評估必成替代技能接回 Artisan 的完整續作。它不執行第三階段 wide proposal。Pilot 每個候選各 4 samples × 2 個內部假設，排名前兩個再用獨立 16 samples × 2 假設確認。兩模型分別為宣告球色等權、Normal 相對其他球色合計 2:1；都是固定 planning assumptions，沒有接收 evaluator 私有權重或實際 RNG。確認要求兩模型完成/滿品質估計都不下降、合計至少多 4 個滿品質 samples。這是估計，不是完工證明，也不宣稱真實機率。

第四階段先沿用 500 cases、80 actions、2 workers、最多 5 分鐘的 bounded screen，baseline 為第二階段。主要問題是 hard-quality 的 91/140 能否提高；淨增加至少 5 件才值得擴大，並揭露 paired losses 與逐 family/world 結果。超過一個 family 的明顯負向交換先診斷，不能只報 aggregate。Non-hard-quality 應與第二階段 exact outcome/動作一致。若效益不足、native p95 >100ms 或整段 policy 混用退步，停止此方法，不影響已成立的證明路線。

## 第二階段結果與第三階段跑前契約

`route-screen-s1` 完成 500 paired cases/50 shards。相對 resource certificate，完成 438→439，滿品質 383→389。已完成製作的平均技能數 45.105→43.387，但 p95 71→72；新完成案例使兩組母體不同，不能把平均與尾端直接解讀為 paired 長度改善。單次推薦 p95 15.8775→16.6224ms，max 68.0993→90.929ms。後續另外抽取完整 trace 衡量等球技能與同案例長度。

第三階段 `generic-craft-external-reference-exp-wide-certified-route` 保留前兩階段的每個證明機會；只有原 32-width proposal 未證明時，再試 96-width、每 bucket 最多 4 條路線的 12-action proposal。驗證上限及全品質條件不變。目的是較早找到資源已足夠的完整解，減少等球依賴；先用相同 500 cases 對第二階段隔離增量。沒有額外滿品質或有可重現 paired 品質退步就不擴大；成本接近 100ms 時與成果一起判斷。這是調整中的 development，未動用 base 20261117 確認集。

- [Thiria 官方 Expert 指南](https://thiria.com/expert/guide/) 說明找到不受球色影響的完整解後可採用。這裡只借用可驗證的設計概念，沒有接入它的程式、模型或成功率；2026-09-05 查閱。
- Rust v1 的 `portfolio/endgame.rs` 提供 repair、specialist、buff 候選與有效性篩選的參考；`portfolio/robust.rs` 提供 forced-color/no-step 分支去重思路。
- Rust v0/TS 遷移歷史提醒：資源、必成完工與有限等待有價值，但逐步混用局部分數不保證完整路線。本輪不重新接入舊 scorer，也不新增 TS 策略。
