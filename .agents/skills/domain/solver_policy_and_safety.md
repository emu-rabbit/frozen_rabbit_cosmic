# Solver Policy、Objective 與安全規範

## 文件角色

本檔定義求解器的決策契約。Mechanics correctness 由 domain／verification owners 管理；目前 implementation 看 [current_state.md](../../current_state.md)。

以下區分目標契約與當前實作；主策略內 Artisan fallback 不等於獨立快速求解器。架構選擇依 [產品使命](../mission/project_mission.md)，不以自有核心或特定 portfolio 為驗收前提。

## 共用輸入

求解器只讀 runtime 可觀測資料：

~~~text
RecipeProfile
CraftObjective
CrafterProfile
CraftState
actual action history
PlannerContext（若有）
~~~

不能讀 recipe ID、equipment ID、future RNG、evaluation label 或 reserved corpus membership 來選特例。Recipe 差異要來自可解釋的 mechanics、condition set 或 objective signal。

## 共用安全順序

1. 驗證 input 與 state invariants。
2. 產生 legal action mask。
3. 區分非法技能、必然失敗與合法但有隨機失敗風險的技能；有可行替代時避免立即確定失敗，無可救回路線時仍提供誠實 best-effort。
4. 評估完工路線、耐久／CP reserve 與品質機會。
5. 依單一預設策略比較 completion、品質與下行結果。
6. 回傳 action、理由、替代選擇與計算 metadata。

Mechanics 沒有合法技能、state 已終局或輸入損壞時明示原因，不捏造推薦。

## 主要求解器

主要求解器可以使用 fixed-budget stochastic planning、route options 與跨步 `PlannerContext`。目標是在 3 秒內比較較完整的完成、品質與 recovery trade-off。

- 每一步都依玩家實際 history 重新規劃。
- Deadline 是 work contract；不能以無上限 search 期待平均很快。
- 逾時、錯誤或無結果明示原因並定位問題；不因可能出錯就預先要求獨立快速求解器。
- Recommendation explanation 來自實際比較訊號，不由 recipe-specific 文案假裝。

## 無建議與按需後備

`Policy-null` 指 state 合法、尚未終局、至少有一個 legal action，但求解器沒有回傳 action。已終局、沒有 legal action 或輸入損壞不算 policy-null，應各自明示原因。

使用者已決定：主求解器沒有 policy-null 時，獨立快速求解器不是必要功能，也不是首發門檻。主線是提升主求解器的成果與可靠性；出現無建議時先定位並修正原因，再判斷是否需要後備策略。

若日後確有需要，後備方案可重用 Artisan 或其他有界決策，不預設必須另建核心。當輪再依實際問題定義預算、合法性、回傳行為與驗證範圍；舊的獨立快速策略 p95 <100ms 不再是現行必備契約。

## Objective

Mechanics completion rule 和 solver utility 分開。配方品質上限由 recipe `qualityMax` 唯一擁有：

- `requiredQuality > 0`：進展與必要品質都是 mechanics hard gate，solver 仍追求 `qualityMax`。
- `requiredQuality = 0`：進展完成可交貨；solver 不把 protected floor 偽造成遊戲失敗條件。
- 一般收藏品完整保存 100／300／700／滿品質四檔；四檔共同構成預設策略的完整品質效用。
- 預設策略使用第三檔作當次 `protectedQualityFloor`。它只是失去安全追品路線時可保住的退路，不是滿足點；到達後仍以滿品質為路線目標。
- 四檔的數值是原始品質點數，由 objective data 宣告；完整四檔不會被 protected floor 截短。
- Master 收藏品沒有套用一般四檔，utility 在 `0..qualityMax` 連續增加；其 protected floor 由 continuous-quality risk policy 推導，到達後仍繼續追求 `qualityMax`。
- HQ 類完整使用品質對應的 HQ 機率曲線。預設策略以 75% HQ 作 protected floor，再由 versioned HQ 曲線反查所需的最小原始品質點；仍使用完整 0% 到 100% HQ 機率效用。
- Quality objective 不能改寫 mechanics terminal。

對 progress-only 配方，低品質完成要和四檔／連續品質／HQ 機率結果分開；不能以 completion aggregate 冒充產品成功。`protectedQualityFloor` 是 solver 依完整 milestone 與預設策略推導的退路檢查點，單位為原始品質點數；達到後完整品質效用仍繼續上升。HQ 報告要同時顯示 50%／75%／100% 語意檔位及其換算品質。

## 預設策略

- 產品只支援一套策略，現有 code／wire identity 仍稱 `Balanced`。它使用單調增加到 `qualityMax`／100% HQ 的完整品質效用，不降低品質慾望，也不把 protected floor 當成任務完成。
- 只有可見的大幅檔位／滿品質機率提升，才可交換少量完成率；未跨檔的小幅平均品質增加不構成交換理由。
- Stable／Aggressive 只為既有 solver identity、歷史 evidence 與 protocol replay 保留解析能力。新策略不為它們分流、調參或擴大評測；重新支援必須等預設策略足夠好後由使用者另行決定。

架構與策略改善以隨機世界中的成功機率、完整品質價值與可接受成本判斷，允許個別 paired seed 勝負互換。正確性、效果驗收與按需診斷由 [algorithm_verification.md](algorithm_verification.md) 擁有。

效果報告只把已完成製作計入玩家可感知品質收益：一般收藏品比較 100／300／700／滿品質檔位遷移；未完成但品質較高不算改善。HQ／Master 先看完成與滿品質尾端，小幅平均品質變動只作輔助量尺。

正式支援能力以有食物與藥的 E02／E09 為主，並以 E03／E10 專家與 E05／E07 合理鑲嵌差異檢查泛化。弱裝備保留在 evidence 中，但以 best-effort 解讀，不讓其 aggregate 主導主戰產品決策。

## PlannerContext

`PlannerContext` 可以記錄：

- route／option intent；
- 已建立的 setup 與預期 consumer；
- completion reserve／finisher certificate；
- recovery mode；
- 剩餘 work budget。

它不可以修改或偽裝 `CraftState`。玩家偏離、resync 或 forced outcome 後，context 要依實際 state 更新、失效或重建。

## Condition opportunities

高品質、高效、安定、結實、大進展、長持續、高耐久與好兆頭都必須進入候選比較。Condition-specific action 未採用時，理由要來自 legality、resource、objective 或完整路線 trade-off，不是 selector 忘了加入。

Specialized behavior 只有在多個 families 反覆出現相同可觀察 failure，且由 mechanics／objective／condition signal 選擇時，才可升為 generic option。Recipe-ID patch 不進 runtime。

## 策略候選組合

若某輪選用 candidate portfolio，以下原則協助維持一致比較；它不是現行 Artisan＋certificate 的架構描述，也不要求所有新求解器改用 portfolio：

1. 每個 progress、quality、condition、resource、specialist option 只產生 legal candidate 與理由證據。
2. 共用 scorer 同時比較 completion certificate、完整品質 utility、下行風險、資源與 action budget。
3. 最終只在一處決定 action；null recovery 與 bounded final fallback 另有明確 contract。

Candidate evidence 使用共同型別，至少包含來源、legal preview、成功／失敗分支、完工證明、品質 utility、CP／耐久與預估 continuation。新增 producer 時以 overlap 與 interaction tests 驗證它和既有 producers 的共同命中；升為 runtime policy 前在保留集跨 family／裝備／world 重現效果。

### 局部估值與完整策略

候選估值只在它所假設的 continuation、planner context 與後續重規劃規則下成立；單一步驟的較高分、較小 paired uncertainty 或較深預演，不能單獨證明把該 decision 插入現行 policy 後會得到更好的玩家結果。兩個各自能成功的完整 policy 也不能任意逐 state 混用，因為 setup、resource reserve、finisher timing 與 recovery intent 可能跨步相依。

Candidate／scorer／selector 診斷可區分：候選缺漏、估值錯誤、跨步 intent 遺失、或 horizon 尚未看見後續價值。依實際改動驗證部署後的完整 closed loop；只有比較整段接管與局部混用能回答本輪問題時才同時跑兩者。驗收看完成成品與品質，不以局部 score 或 action agreement 代替。相關負例見 [closed-loop consensus report](../../../reports/learned-candidate-scorer/teacher-consensus-development-smoke-20260830.md)。

## 玩家自由與 recovery

- 玩家可採推薦或其他 legal action。
- 每個 resolved step 記錄 actual action／success／next condition。
- 下一步依實際 state／history 重新嘗試主要求解器。
- Manual action 造成的弱 state 仍由 solver best-effort；不能只接受自己產生的路線。
- Mismatch 先 resync，保留 event history。

## 發布決策

最終驗收與是否發布由使用者自行決定。Agent 依 [algorithm_verification.md](algorithm_verification.md) 提供各 family 的成果、policy-null、合法性、延遲與證據限制，不另立未經要求的首發門檻。系統性失敗如實揭露，產品不以配方成熟度標籤掩蓋弱項。

## 歷史 policy

舊五配方 guides、TypeScript thresholds、named configs、scorecards 與 policy-lab experiments 只作 historical／regression evidence。它們不是 runtime fallback、不是新 solver owner，也不構成逐招相容義務。
