# 下一輪 Solver 評測 Brief

`last_updated: 2026-09-06`

目前正式版維持 v2.3。使用者要求保有品質並降低步數，已完成四方向 development 與獨立於調整的有限確認，保留 `generic-craft-external-reference-exp-compact-recovery` 作全面長跑候選；尚未採用或升版。[研究結果](compact-policy-development-20260906.md) 擁有篩選、確認、負向切片與成本；[交付紀錄](compact-policy-s64-handoff-20260906.md) 擁有完整命令、身份與操作驗證。

## 本輪比較契約

- Baseline：`generic-craft-external-reference-v2.3.0`。Candidate：`generic-craft-external-reference-exp-compact-recovery`。兩臂全新執行，不沿用歷史結果。
- 假說：先選最短三招內全品質證明，並在原策略低耐久等球時比較掌握／精修／巧奪天工的付費回復，能在品質相當時減少操作。內部採樣比較只提供策略估計，不能冒稱全品質證明。
- 矩陣：50 families × E02/E03/E07/E09/E10 × balanced-iid/normal-heavy-iid × Balanced × 64 seeds；80 招上限。每臂 32,000 件，共 64,000 episodes。獨立 base `20270223`，不混入 development base `20261213` 的 sample 0、確認 sample 1–4、F15 追加診斷 sample 5–20、玩家 base 2026090602 或 smoke base 2026090603。
- 主要效果：完成與滿品質的 paired 差值、雙方滿品質時的全部技能數差、完成者長度 p50/p95；hard-quality 成功、一般收藏品全部檔位、HQ 與 Master 品質尾端各自分開，未完成的短路線不算省時收益。
- 實務目標：雙滿品質配對平均至少少 3 招；完成與滿品質相當的容忍值各為 -0.5 個百分點。使用按 family 保留配對的 95% cluster interval；若區間仍無法排除超過容忍值的退步，標示證據不足，不宣稱品質非劣。也報觀察次數與 80 招截斷，不能把截斷後的 max 當自然長尾上限。
- 切片：E02/E09 為主要裝備，E03/E10 專家與 E07 較弱裝備分開；兩 worlds 不能互相遮蔽。每個 family × equipment × world 都報品質、完成及長度。重點追 F15（第二件的機制家族）、E07 與 normal-heavy 中的收藏品降檔；群集／小樣本不確定性一併揭露，不只報 aggregate。
- 時間：另用 600 秒、每招 4/5/6 秒與保留 30 秒作敏感度，不能把它稱成遊戲真實倒數或自然成功率。正式策略仍未接入任務剩餘時間與跨件 controller。
- Runtime：非法與 policy-null 分開計數；合法隨機失敗不算 illegal。Native/WASM 一致性要求完整觀測 history 與 context；單步成本與 timeout 另報，不把建置、smoke 當裝置或遊戲實證。
- 判讀：確認品質與時間收益是否足夠可泛化，再由使用者決定採用／升版。若 F15 或主要裝備出現穩定的實質品質退步，先診斷付費回復與後續資源使用，不針對同一長跑 seeds 反覆調參或挑結果。

長跑僅由使用者啟動。已準備四 workers、溫控與可續跑命令；agent 的 status-only 不算已執行全面檢核。原 v2.3 [採用紀錄](v230-adoption-20260906.md) 及其歷史長跑契約保留為 evidence，不能覆蓋本輪比較目的。
