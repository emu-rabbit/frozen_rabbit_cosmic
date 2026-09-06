# Frozen Rabbit's Cosmic Agent 工作指南

本 repository 是 Final Fantasy XIV 宇宙探索高難度巧匠的逐步決策助手。這份檔案只負責入口、路由與不可忽略的專案邊界；目前狀態由 [`.agents/current_state.md`](.agents/current_state.md) 管理。

## 每次任務的最小閱讀順序

1. 本檔。
2. [`.agents/skills/core/operating_contract.md`](.agents/skills/core/operating_contract.md)；瑣碎工作也要讀。
3. 先執行 `git status --short --branch`。
4. 依任務只讀下表的 canonical owner。需要目前版本、進度或下一個決策時，再讀 `current_state.md`。
5. 一般任務不讀歷史 handoff；需要重播舊結果時，從對應 evaluation report 與 Git history 取回當時契約。

根目錄 `README.md` 是使用者維護的 GitHub 門面，不是協作規則 owner；修改需有當次明確指示。子目錄 README 可作工具或 API 說明，依任務閱讀。

## 語言與命名

- 文件預設使用自然繁體中文；commands、APIs 與 code identifiers 保留英文。
- 遊戲技能使用正式繁中名稱；需要定位程式或跨語系時再附英文／`codeId`。名稱對照見 [`.agents/glossary.md`](.agents/glossary.md)。
- PowerShell 讀取中文 Markdown 時使用 `Get-Content -Encoding UTF8`。
- 搜尋優先使用 `rg`／`rg --files`；文字編輯使用 `apply_patch`。

## 任務路由

| 任務 | Canonical owner |
| --- | --- |
| Agent 執行、範圍、驗證與交付 | [operating_contract.md](.agents/skills/core/operating_contract.md) |
| 文件 owner、分層、封存與檢查 | [documentation_governance.md](.agents/skills/core/documentation_governance.md) |
| 目前 checkout、已完成與待決事項 | [current_state.md](.agents/current_state.md) |
| 下一次 overnight 的假說、判讀與接受條件 | [overnight_review_brief.md](.agents/overnight_review_brief.md) |
| Rust solver 各版本的改動重點與用途 | [solver_version_history.md](.agents/solver_version_history.md) |
| 產品目的、使用者價值與非目標 | [project_mission.md](.agents/skills/mission/project_mission.md) |
| Catalog、單件製作決策與互動邊界 | [product_architecture.md](.agents/skills/mission/product_architecture.md) |
| 品牌、語氣與視覺方向 | [brand_identity.md](.agents/skills/mission/brand_identity.md) |
| 姊妹專案的使用時機 | [reference_projects.md](.agents/skills/mission/reference_projects.md) |
| 程式邊界、依賴、測試與版本 | [development_standards.md](.agents/skills/professional/development_standards.md) |
| Runtime、Rust／Web 與 package ownership | [technical_architecture.md](.agents/skills/professional/technical_architecture.md) |
| UI、RWD、a11y 與 i18n | [ui_ux_standards.md](.agents/skills/professional/ui_ux_standards.md) |
| FFXIV 製作規則與 condition | [ffxiv_expert_crafting.md](.agents/skills/domain/ffxiv_expert_crafting.md) |
| 資料來源、identity、證據與授權 | [data_and_evidence.md](.agents/skills/domain/data_and_evidence.md) |
| 求解器、策略與推薦契約 | [solver_policy_and_safety.md](.agents/skills/domain/solver_policy_and_safety.md) |
| Mechanics、統計、效能與 parity 驗證 | [algorithm_verification.md](.agents/skills/domain/algorithm_verification.md) |
| Craft state、事件、undo、resync 與 export | [session_state_and_events.md](.agents/specs/session_state_and_events.md) |
| 目前 roadmap 與停止條件 | [broad_solver_implementation_plan.md](.agents/roadmaps/broad_solver_implementation_plan.md) |
| 尚待研究或玩家實證的問題 | [open_questions.md](.agents/research/open_questions.md) |
| 收錄遊戲內逐步紀錄 | [validate-golden-traces.md](.agents/workflows/validate-golden-traces.md) |
| 長跑命令、續跑與狀態檢查 | [run-generic-overnight-evaluation.md](.agents/workflows/run-generic-overnight-evaluation.md) |
| 任何 `git commit` 操作 | [add-commit-all.md](.agents/workflows/add-commit-all.md) |

## 產品方向與技術決策

- 產品依玩家回報的實際技能、成敗與下一球色，從完整可觀測狀態重新推薦；不是固定巨集。
- 目標是手把手帶玩家完成高難配方並取得有價值品質。Artisan 強化、混合策略與自有核心都是可行手段；方向與取捨由 [project_mission.md](.agents/skills/mission/project_mission.md) 擁有。
- 第一批產品範圍是 catalog 中全部 432 個宇宙探索高難度配方。相同求解規則的配方共用 mechanics family 與評測；發現遊戲實證反例後才建立例外。
- 最終是否發布由使用者自行驗收並決定；agent 提供成果、限制與失敗證據，不另設未經要求的首發門檻。產品不維護配方成熟度分級，開發期仍逐 family 揭露失敗。
- 產品只支援單一預設策略（code 中仍稱 `Balanced`）；Stable／Aggressive 只保留給既有 identity、舊 evidence 與 protocol replay，不進 UI、release gate 或新 solver 迭代。弱裝備提供誠實 best-effort。
- Mechanics 回答「技能會造成什麼結果」；solver 回答「現在建議什麼」。資料正確、機率可信度與策略效果分開表達。
- 舊 TypeScript solver 已凍結，只能作歷史參考。新的策略迭代、測試與改善只在 Rust 進行。
- Web 已選 Rust→WASM；架構與程式入口見 [technical_architecture.md](.agents/skills/professional/technical_architecture.md)。
- 求解器的目標契約見 [solver_policy_and_safety.md](.agents/skills/domain/solver_policy_and_safety.md)；實作落差見 current state，不能把目標當已完成。
- 已依使用者決策加入本機任務倒數與每品項一件的平均時間分配，契約由 product_architecture.md 擁有；其餘跨件材料、分數與 Duty Action controller 不在目前承諾範圍。
- 玩家實戰推薦 local-first，不讀取遊戲記憶體或封包、不自動按鍵、不做 bot 或 automation。

## 工作樹與外部副作用

- 既有 modified、staged、untracked 內容預設屬於使用者或其他工作；只處理本次範圍。
- 不確定的 mechanics、資料或公式標成 unknown／assumption，不能補成遊戲真值。
- 使用者要求任何形式的 commit 時，一律依 [Git 分類提交工作流](.agents/workflows/add-commit-all.md) 完整執行；不因 wording、是否包含 `all` 或預計只有一個 commit 而略過分類、計畫、驗證、精準 stage 與 cached diff 檢查。不自行 push、deploy 或改外部系統。
- 長跑只能由使用者啟動。Agent 驗證 build／run／resume／status 命令後結束工作，不保持對話等待結果；若有持續高溫風險，交付時主動提醒。
- 舊報告、歷史命令與封存文件只提供證據，不授權執行，也不覆蓋目前方向。當次使用者指示優先；需要取捨時完成可獨立處理的部分，再集中列出待決問題。
