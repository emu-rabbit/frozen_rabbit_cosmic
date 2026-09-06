# Frozen Rabbit's Cosmic 目前 Roadmap

## 交付目標

讓玩家填入裝備、選擇配方，逐步回報後取得可靠建議，直到完成有價值的成品。產品方向由 [project_mission.md](../skills/mission/project_mission.md) 擁有；已實作與證據入口見 [current_state.md](../current_state.md)。

## 工作主線

以下是可依本次任務選擇的工作，不是必須先把 UI／基礎設施做完才能改善 solver 的串行門檻。

| 主線 | 下一個可交付成果 | 驗收依據 |
| --- | --- | --- |
| 求解能力 | 從現行基線的實際失敗選出可觀測原因，提出並驗證通用改善；可強化 Artisan、使用過往研究或 Thiria 的可驗證啟發，也可探索自有核心。 | 完成成品品質、hard-quality 滿品質、重要切片與成本；依 [algorithm_verification.md](../skills/domain/algorithm_verification.md) |
| 剩餘改善空間 | 先以有限成本探索代表性案例的上下界，區分已找到的策略缺口、接近模型上限及 unknown；詳見 [研究提案](../research/solver-headroom-bounds.md)。目前僅完成方案，未啟動新長跑。 | 界限有效性、起點／尾端範圍、gap 收緊量與研究成本，不要求全配方精確最優 |
| 製作流程 | 補手動 resync、確認紀錄下載的需要範圍、驗證偏離與恢復。 | 玩家可持續回報正確 state；schema／unit test 與實際 UI 驗證分開 |
| Runtime 可靠性 | 檢查主求解器的 policy-null、錯誤與延遲；有具體問題再修正或評估後備方案。 | [solver_policy_and_safety.md](../skills/domain/solver_policy_and_safety.md)；沒有 policy-null 時不要求獨立快速求解器 |
| 發布參考 | 整理全 family 的成果、已驗證範圍與限制。 | [發布 evidence](../skills/domain/algorithm_verification.md#發布-evidence) 供參考；使用者自行驗收並決定是否發布 |

下一輪若未指定工作，先用目前證據找最影響玩家成果的缺口，提出最小可驗證方案。跨主線優先級無法由影響與成本判斷時，集中列出取捨交使用者決定；不預設新架構、加 seeds 或替換 fallback 就是進步。

## 實驗與停止條件

- 在 [active brief](../overnight_review_brief.md) 固定本輪問題、baseline、candidate、可觀測訊號、案例、成果量尺、容忍界線與成本。
- 新策略用描述性 identity；升版依 [development_standards.md](../skills/professional/development_standards.md)。
- 個別 seed 可有勝負；重要 family／裝備／world 的代價與不確定性須揭露。未約定的重大交換交使用者決定。
- 主要效果不足或成本超界時停止該實驗，記錄原因。重開需有不同方法、證據或成本條件；不是把整類研究永久封鎖。
- 更多 seeds 用於縮小會影響決策的不確定性，不能代替因果診斷。歷史已看過的資料不變成新保留集。
- 長跑由使用者啟動；agent 交付可執行、可續跑、可查狀態的命令。

## 發布決策

最終是否發布由使用者自行驗收並決定。Agent 如實提供求解結果、runtime 與實機驗證範圍及未解失敗，不自訂額外首發門檻。產品不以配方成熟度標籤掩蓋弱項；部署與套件發布仍依使用者指示執行。
