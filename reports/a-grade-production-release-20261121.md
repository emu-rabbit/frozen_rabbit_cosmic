# A 級任務正式發布紀錄

## 發布內容

依 2026-11-21 使用者要求，將已驗收 staging `584c18a` 的玩家版本發布正式。正式提交為 `5a07327df70f8eb486eac60011b6210fa7a93090`，相對驗收版只增加離線 parity 工具與測試修補；`apps/web`、`packages`、`native`、`data` 沒有差異。

- [正式站](https://cosmic.frozenrabbit.com/)
- [成功的正式 workflow](https://github.com/emu-rabbit/frozen_rabbit_cosmic/actions/runs/44877129703)
- 任務 manifest version：`ee6c262a106077eea687dff933ea3d58a27be6da1b356396b7483df02cf6183d`，616 個任務。
- 正式 CI 通過 release tests、型別與建置、Rust library／integration、公開範例、兩個跨語言 parity gate 及 Pages 部署。

## 發布前置修補

首次正式 workflow [44876674821](https://github.com/emu-rabbit/frozen_rabbit_cosmic/actions/runs/44876674821) 因歷史 parity bridge 的欄位數檢查失敗而停止，沒有執行部署。

共用 condition enum 新增 Excellent／Poor，讓舊 rollout／root-plan encoder 自動擴成 11×11，但其既有 wire contract 仍是 129／137 欄的 9×9。修補在離線 bridge 明確固定原有九球色順序，並拒絕以此舊協定編碼非 Expert 配方；玩家仍使用 episode v8。

Adaptive checkpoint 綁定的舊 mechanics content hash 也已過期。只在 parity harness 重綁新 metadata，以獨立 program identity 重新 seal；凍結 TypeScript solver、策略節點與限制全部保留，沒有新增 TypeScript 求解策略。

本機驗證：

- Bridge 回歸 26 項通過；型別檢查通過。
- Transition parity 54 cases、fixed-action rollout 10 cases、root-plan matrix 10 requests 通過。
- Rollout 完整 oracle hash 保持原值；root-plan 只將 scenario metadata 還原為歷史 hash 後，其完整 oracle hash 仍與原值一致。
- Adaptive parity 18 cases／386 transitions 通過；新增測試核對重新 seal 前後所有非 metadata 欄位相同。

## Pages 預覽恢復

正式發布替換整份 Pages artifact 後，`/staging/` 實際回應 404。依現行架構流程，以更新此發布紀錄的新 staging commit 觸發預覽重建；正式根目錄仍由最近成功 main revision 重建，部署前與線上正式 manifest 比對。

驗證包含正式與 staging 的 manifest／bundle checksum、首頁 A 級文案、非 Expert 提醒及低品質黑球；模型與實機證據界線沿用 [A 級 catalog 報告](a-grade-cosmic-catalog-20261121.md)，沒有新增遊戲內 trace 或手機效能宣稱。
