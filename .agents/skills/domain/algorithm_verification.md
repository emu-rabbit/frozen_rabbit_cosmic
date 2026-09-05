# Mechanics 與 Solver 驗證規範

## 文件角色

本檔定義各種 claim 需要的 evidence，以及如何避免 aggregate、synthetic 或 migration 指標誤導產品決策。

## Mechanics 驗證

### Unit／table tests

每個支援技能至少覆蓋：

- legal／illegal；
- success／failure；
- condition modifier；
- CP／耐久／進展／品質與 rounding；
- buff／combo／內靜／一次性技能；
- terminal 與 required quality。

表格 expected value 需要來源或可重播 trace；只把目前 implementation 抄成 expected 不算獨立驗證。

### Invariants

每一步檢查：

- 數值有限且在合法範圍；
- CP、耐久、內靜與 buff duration 不越界；
- terminal 後不再推薦一般技能；
- illegal action 不改 state；
- forced condition 與 no-step action 符合 contract；
- replay 相同 identities／events 得到相同 state。

### Golden traces

Golden trace 要保存 recipe、crafter、initial state、每步 action／success／condition、observed state、versions 與 provenance。逐步一致才支持 mechanics claim；只有 final summary 相同不足。

工作流見 [validate-golden-traces.md](../../workflows/validate-golden-traces.md)。

## Solver 評測矩陣

開發與 release evidence 以 mechanics family 去重，但報告仍能追回 recipe identities。

最低切面：

~~~text
family
× equipment profile／band
× declared condition world
× paired seed
~~~

相同 family 的新名稱配方不重跑同一求解案例。若 objective、condition set 或 mechanics 不同，必須拆 family。

### 必報結果

- progress-only delivery；
- progress-only meaningful-quality floor／utility；
- hard-quality completion；
- quality distribution／high tail；
- policy-null、no-legal-action、terminal failure、action-limit；
- illegal／safety violations；
- 製作長度：全部技能使用數（含 no-step）與實際推進遊戲工序數分開，完成／未完成各報 p50／p90／p95／max；
- CP／耐久尾端與 recovery；
- 後備使用率（若有實際採用）；
- 實際採用 solver 的 latency。

以上是完整評測／發布報告的量尺清單。局部文件、mechanics 修正或 bounded 篩選只跑與 claim 有關的驗證；未採用的後備方案指標明示不適用，不為填表擴建工具或重跑全矩陣。

Aggregate 只作入口。結論必須指出是裝備壓力、condition assumption、資料缺口或策略缺口；未知時明示 mixed／inconclusive。

製作長度目前是觀察量尺，不是自動 release gate。任務倒數、技能動畫、網路與玩家回報延遲尚未進入模型，所以不能從 actions／steps 直接換算任務是否來得及；但 family × equipment × world 的長尾應被保留，供後續用 live 任務時間資料建立門檻。

## 正確性與效果驗收

求解器架構與策略的目標是保有或提高玩家在隨機製作中取得有價值成果的機會，並維持合理的計算與維護成本。選招、路線及 planner context 依新設計演進，以實際效果驗收；mechanics 與 runtime 契約各自嚴格檢查。

| 驗收面向 | 要證明的事情 | 通過依據 |
| --- | --- | --- |
| 正確性與 runtime 契約 | Mechanics、合法性、state／identity、結果標示、計算預算與回傳行為可信 | 規則與 invariants 嚴格成立；必要品質如實計入成功，實際採用的求解器符合契約 |
| 架構與策略效果 | 相對 baseline 提供相當或更好的成功機率、完整品質價值及合理成本 | 以保留集的主要效果、不確定性、重要切片與事前容忍界線決策，允許個別 seed 勝負互換 |
| 明確保持語意的局部調整 | 指定範圍的語意承諾成立 | 依變更風險選擇 focused tests 或 deterministic exact parity，事先聲明輸入範圍、比較欄位及可不同的 metadata |

效果相當的容忍區間、值得採用的改善幅度、重要切片與成本界線由每輪 brief 事前聲明。判斷同時考慮幅度、樣本量與不確定性，接受合理的局部波動與有價值的取捨。合法隨機技能的失敗與 best-effort 未完成按機率、結果和成本評估。

## Paired comparison

Baseline 與 candidate 使用 [common random numbers](../../glossary.md)。Case identity 至少綁 family、equipment、固定的預設策略 identity、world、seed、horizon 與 relevant hashes。

報告包含：

- candidate win／loss／tie，以及完成與未完成之間的雙向變化；
- progress-only 交貨、完整品質效用與 hard-quality 完成／滿品質分層；
- effect interval、事前 practical threshold 與成本；
- family × equipment × world，以及重要弱切片的原因。

### 架構與策略實驗的決策流程

1. **定義比較目的。** 在 active brief 固定主要量尺、版本、切片與加權、效果相當的容忍區間、practical effect、可接受代價、統計方法及停止規則。等權矩陣表示 benchmark 效果；推論玩家平均體驗需要玩家分布依據，各 assumed worlds 另列。
2. **衡量玩家成果。** Hard-quality 成功、progress-only 交貨和品質價值各自評估，再結合製作長度及已知成本。若每次成本與成功價值相同、結果只有成敗，提高成功機率就是改善。尚未建模的材料或任務時間成本列為未知。
3. **檢查重要情境。** 依可觀測的 family、裝備能力、world／state signal 尋找有實質影響的弱點。切片判斷同時看幅度、樣本量與不確定性，容許樣本波動和持平；整體收益與可信的局部代價一併交代。
4. **用保留集驗證。** 已參與調整的資料用於 development／回歸與診斷；promotion 使用未參與決策的資料。區間估計保留配對與群集結構，並處理 repeated looks 與多重比較。
5. **選擇值得維護的實作。** 優先採用可泛化、在保留集效果相當或更好、重要代價可接受且維護成本合理的設計。將完成、品質、計算成本與可追蹤的決策流程一起納入採用判斷；具體落差用於選擇下一個改善方向。

主要效果與重要切片／成本都落在事前約定界線內時，可提出採用建議；證據不足時補最有辨識力的驗證，超出界線或取捨尚未約定時交使用者決策。具體數值由每輪 brief 擁有，最終正式發布仍依下方發布 evidence 審查。

若使用者在看過結果後調整產品取捨，保留原 brief，另記決策日期、理由與資料用途。新判準用於後續實驗；本輪則如實記為看過 evidence 後的決策。

### 按需診斷與觀測

先以結果與分組量尺定位值得調查的情境，再選取相關案例重播。診斷依問題收集候選來源、比較證據、route intent、state、context、RNG 或資源使用，分辨候選覆蓋、續作估計、路線銜接及成本問題。

逐步 trace 與觀測工具的投入以能解除的具體決策問題為準。實際 state 與 context 由已發生的事件更新；候選預覽、假想續作與觀測使用隔離資料及明示預算。

## Condition world

Natural transition 未知時可用多個 plausible／stress worlds，但每個都標 assumption。IID marginal、Normal-heavy、opportunity-scarce 或 all-Normal 都不是實際成功率。

若要宣稱 probability 精確，需要 recipe／family-specific empirical 或 official transition evidence、sample metadata 與 uncertainty。

## 求解器可靠性與延遲

- 檢查主求解器在合法非終局且有合法技能時是否回傳 action，分開報 policy-null、逾時、初始化與傳遞錯誤。
- 主要求解器 3 秒 hard watchdog；只有用滿才算 timeout。Startup、boundary transfer、compute 與 rendering 分開。
- 依實際驗證範圍報 p50／p95／p99／max 與裝置；desktop benchmark 不外推為 mobile 證據。
- 主求解器沒有 policy-null 時，不要求另建或測試獨立快速求解器。若後續採用後備方案，再以當輪契約驗證，不沿用舊 100ms 首發門檻。

## Rust、WASM 與 TypeScript

- Frozen TS→Rust migration 比較 mechanics／codec／RNG／terminal exactness，以及事前定義的 outcome parity；有意演進的 Rust policy不需逐招複製 TS。
- 已採用的 Rust native→同一 Rust WASM core，transition、RNG、terminal 與 solver output 要求 exact parity，除明示 platform metadata。
- 未來若因明確需求更換計算核心，另定 migration parity gate；不預設另寫 TypeScript 複本。
- Parity corpus 包含 full state、action history、planner context、stop reason 與 timing 以外的 deterministic output。
- ABI、binary、schema、solver 或 corpus identity 漂移時 fail closed。

## 能力界線

依 claim 區分三種證據，不把單條路線排成數學上界：

| 證據 | 能回答的問題 |
| --- | --- |
| Causal policy 的 closed-loop outcome | 只使用當時可觀測資料時，這套策略實際取得什麼成果 |
| Fixed-tape witness | 已知某條未來亂數軌跡時，至少存在這一條可行路線 |
| 有效的 optimistic bound | 在明示放寬條件且上界推導成立時，哪些目標仍不可能 |

單條 fixed-tape witness 不是最佳 causal policy 的上界；只有證明求得該 tape 的最佳值，或使用有效上界，才支持相應界線。Sampled outcome 也不能當作無誤差的期望值不等式。

- Closed-loop matrix 是目前 policy 的 evidence，不是裝備理論上限。
- Fixed-tape witness 證明特定未來存在路線，不是 live 可達率。
- Relaxed bound 只有 negative impossibility 具硬意義；not-ruled-out 不等於可達。
- 宣稱 near-model-limit 需要事前定義的 stochastic causal lower／upper bracket；bound 太寬時標 inconclusive。

## 發布 evidence

最終是否發布由使用者自行驗收並決定。以下是 agent 整理成果與限制的參考問題，不是額外的首發批准清單；產品仍不使用 maturity badge：

- 每個 family 的 mechanics 是否有可信 evidence；
- 已採用 solver 的 illegal、policy-null、逾時與錯誤情況；
- progress-only 與 hard-quality 是否各自達到使用者接受的效果；
- 裝備與 worlds 的 worst cells；
- 玩家偏離、undo、resync 與 replay；
- 已量測裝置的 latency 與尚未驗證的範圍；
- 哪些結論仍只來自 synthetic／assumption；
- 是否存在會讓某 family 不宜發布的系統性 failure。

最終是否足夠可靠由使用者檢視完整 evidence 後決定，不能由單一自動分數代替。
