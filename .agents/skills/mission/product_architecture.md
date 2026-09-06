# 產品架構：Catalog、Craft Solver 與 Session

## 文件角色

本檔定義穩定的產品 surface 與責任邊界。實作現況看 [current_state.md](../../current_state.md)；package 與語言選擇看 [technical_architecture.md](../professional/technical_architecture.md)。

下列是目標能力，不是完成清單。輸出理由或 resync 在 UI 的接入狀態由 current state 管理。

## Recipe catalog

每個可選配方至少綁定：

- canonical recipe／item identity 與來源；
- `RecipeProfile`：等級、進展要求、品質上限、耐久與可用 conditions；
- `CraftObjective`：hard-quality 或 soft-quality／收藏價值目標；
- mechanics family identity；
- 玩家顯示名稱、職業與搜尋 metadata。

任務 metadata 保存 `WKSMissionUnit.MissionTime` 的 `timeLimitSeconds`，正整數代表整個任務的總限時，0 代表無時間限制；缺值或無效數字必須報錯，不能當作不限時。任務出現時段另由 `types: timed` 與出現條件表示，與接取後的倒數不同。這項資料不修改單件 mechanics family，也不代表已接入遊戲剩餘倒數；來源核對見 [限時任務研究](../../../reports/generic-cosmic-overnight/time-aware-recovery-development-20260906.md)。

相同 family 代表所有會改變求解的 mechanics、condition set 與 objective semantics 相同。現階段假設 family 內配方可以共用求解與評測；遊戲 trace 出現反例時，先修正 data／family identity，再判斷是否需要新策略訊號。

Catalog identity、數量與 hashes 由 data package／importer 擁有，本檔不複製 snapshot。

## 單件製作決策

輸入：

~~~text
RecipeProfile
+ CraftObjective
+ CrafterProfile
+ observed CraftState
+ actual action history
~~~

輸出：

- 建議技能；
- 推薦理由；
- 主要替代技能與取捨；
- 實際使用的求解器來源（需要區分時）；
- 計算時間與失敗原因；
- 必要的能力邊界說明。

Mechanics 先產生合法技能與 state transition；solver 再比較路線。Solver intent 放在獨立 planner memory，不污染客觀 `CraftState`。

## 主要求解器

主要求解器可使用固定預算的多步規劃、route memory 與隨機情境比較，目標是在 3 秒內提供較完整的品質／完成取捨。產品只使用單一預設策略；每一步都依實際 state 與 history 重算，不能假設玩家遵循上一個建議。

## 運算與錯誤處理

~~~text
主要求解器，最多 3 秒
  -> 成功：顯示建議
  -> 無建議／逾時／錯誤：明示原因
玩家執行任一合法技能
  -> 記錄實際 action／outcome／condition
  -> 下一步依實際 history 重新推薦
~~~

主求解器沒有 policy-null 時，不要求獨立快速求解器。有實際問題才依 [策略契約](../domain/solver_policy_and_safety.md) 評估修正或後備方案。若 state 已終局、沒有合法技能或輸入損壞，明示結果並提供適用的 resync／restart，不捏造技能。

## Session interaction

- 新 craft 第一手固定 Normal。
- 推薦卡先顯示技能，再讓玩家回報需要的成敗與下一球色。
- 100% 成功或不推進 step 的技能不要求不存在的輸入。
- 玩家可選其他合法技能，session 以實際技能更新。
- 預測與遊戲不符時，以 `stateResynced` event 明確校正，不覆寫歷史。
- Undo 以 event path 重建 state 與 planner memory。
- 進行中的 craft 不自動持久化；reload 後回設定畫面。裝備、語言、明暗模式與首訪語言設定完成狀態可保存。
- Debug export 包含匿名 replay 所需 versions、profiles 與 events。

完整事件契約見 [session_state_and_events.md](../../specs/session_state_and_events.md)。

## 任務時間估計

使用者於 2026-09-06 決定：第一次實際回報球色時開始本機倒數，不增加手動校準；初始自動 Normal 與不需球色的操作不啟動計時。同一任務跨品項共用倒數，先按每品項一件，平均分配剩餘時間給尚未完成的品項。完成品項才移出分母；切換、重做當件與 undo 不重置任務時間，新選任務或確認「重設任務」才重置。此為明示產品近似，不聲稱掌握遊戲必做份數或真實剩餘秒數。

「再次製作」保留當前物品與裝備，清除當件步驟與回報並回到初始製作狀態，任務倒數繼續。「重設任務」重新開啟同一任務的物品與裝備選擇面板；確認後清除任務完成品項與當件進度，重設背景倒數，從第一次實際回報球色重新起算。取消或關閉面板保留原本進度與倒數。

剩餘時間僅在背景估計，不在製作畫面顯示倒數；演算法說明交代起算、分配方式及再次製作與重設任務的差異。求解器只收到 optional 的當件可用時間與操作速度，不讀任務 identity。未傳預算、不限時或尚未開始計時時，只增加有滿品質證明的較短收尾；時間壓力的策略判斷由 Rust 擁有。時間歸零不改寫 mechanics terminal，也不自動停止建議。

## 發布決策

使用者自行驗收並決定是否發布；agent 提供 family matrix、完成成品品質、錯誤與 latency、操作驗證及 synthetic／live 證據界線作參考。產品不維護配方成熟度標籤，不以平均值掩蓋失敗。

## 明確移出的範圍

除上述本機時間估計與平均分配外，跨件材料、任務分數與 Duty Action controller 不在目前產品承諾。歷史結果可保留在 evaluation output，但不為其他 controller 功能預留扁平 state、UI 或 runtime branch。
