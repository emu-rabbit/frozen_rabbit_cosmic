# 待決事項與研究問題

## 文件角色

本檔只列尚未回答、會影響目前產品決策的問題。已結案或移出範圍的問題直接刪除，不保留長篇時間線。

## 已確認邊界

主求解器沒有 policy-null 時不要求獨立快速求解器。最終是否發布由使用者自行驗收並決定，這兩項不再列為待決。

以下只記錄影響研究或對外宣稱的未知，不自動轉成首發必備工作。Artisan 強化、混合或自有核心均可依玩家成果探索。

## 問題清單

| ID | 問題 | 為何阻塞 | 需要的 evidence | 結案位置 |
| --- | --- | --- | --- | --- |
| RQ-05 | 哪些 hard-quality failures 是策略缺口，哪些接近裝備／assumed world 上限？能否以有限研究成本界定剩餘收益？ | 決定下一個 Rust hypothesis 及尾端停止投入的依據 | 優先弱家族的可執行策略、paired 成品收益與成本；[改善空間提案](solver-headroom-bounds.md) 的投資價值未成立，暫不建置 | Rust evaluation report |
| RQ-06 | 自然 condition transition 是否有足夠 evidence？ | 限制真實成功率 claim | Patch-aware player traces 或 official data、sample metadata、transition matrix | Data package／research report |
| RQ-08 | 哪些玩家完整 traces 能補足目前實戰證據？ | 限制實戰 claim，供使用者驗收參考 | 不同 family／裝備／condition sets 的預設策略匿名 full sessions，含 deviation／resync／failure | Golden trace fixtures |
| RQ-09 | Thiria／Thal's Expert 有哪些可驗證能力值得借用？ | 選擇具體改善假說；不是日常開發 blocker | 確認具體產品／來源、可重現的狀態與輸出、可取得的實作及使用條件；未知部分明示 | 對應研究 report，再更新策略 owner |

## 已移出目前範圍

跨件材料、任務分數、倒數與 Duty Action 的問題不再是本專案 blocker。除非使用者重新把 Mission controller 納入產品，不建立 active research item。

歷史五配方、舊 equipment scorecard、Material Miracle 與舊 promotion questions 已結案；需要追溯時由 Git history 與對應 evaluation report 取回。

## 新增與結案格式

新增問題需包含：

- 唯一 ID；
- 一句可回答的問題；
- 它解除的產品 blocker；
- 最小充分 evidence；
- 結案後更新的 canonical owner。

Evidence 到位後，先更新 owner，再從本檔刪除問題；需要保留的調查結果移入 evaluation output。
