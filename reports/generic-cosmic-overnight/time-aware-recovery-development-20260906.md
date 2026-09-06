# 限時任務的回復等待試驗

已實作並保留 `generic-craft-external-reference-exp-eager-recovery` 研究候選，未升版、未切換正式 v2.3，也沒有新長跑。延後三個資源操作的候選已撤下；原始實作與 frozen binary 可重播。這輪支持付費回復可減少限時失敗的局部假說，不支持全家族品質不退或已完成倒數最佳化。

## 跑前契約

使用者於 2026-09-06 要求優化時間友善程度，並確認實際任務是 10 分鐘完成兩件。固定資料 `WKSMissionUnit` revision `c142b1269a76e9e3fffc42f984a5f193ba565ddc` 的 unit 268 對應 mission recipe 269，`MissionTime=600`；36534／36535 同屬該任務。網站事件合計 708.086 秒、135 招；事件耗時不是遊戲倒數的直接量測。

- 基準 v2.3 保留不變；不升版、不自動切換正式 Web。
- 兩個事前固定試驗：低耐久、沒有掌握、基準推薦觀察且 CP 留得住比爾格的祝福與模範製作時，改用正常價格掌握。Bounded 等 ResourceRecovery 窗口已執行 3 招才介入；Eager 立即介入。窗口包含觀察、秘訣及 buff，不冒稱純觀察連續次數。
- 不修改原 Artisan，不讀配方 ID、裝備 ID、真實 seed、未來球色或 evaluator 私有機率；有掌握回耐久的觀察不受影響。
- 先用已有 500 格（50 families × E02/E03/E07/E09/E10 × 2 assumed worlds）每格一件做 development 篩選，保留原始輸入與逐件 outcomes；單次最多 5 分鐘、4 個 native processes。
- 同時報 hard-quality 完成／滿品質、收藏品檔位、其他 objective 的完成品質、全部招數及尾端，不能用提早失敗的短路線冒充效率。
- 值得擴查的方向：雙方滿品質案例平均至少少 3 招，滿品質與完成淨變化均不低於 -1 個百分點，且無 illegal／policy-null；各 family/equipment/world 的退步另列。這只是有限試驗的繼續條件，不是採用或發布門檻。
- 達條件後以新 seed base 擴查重點低耐久情境與本次兩配方／實際裝備，仍限制一次 5 分鐘。未達條件時保留診斷，不反覆微調門檻追同批分數。
- 以實際約每招 5 秒作時間敏感度，另看 4／6 秒；600 秒扣掉任務其他操作後才是可用製作時間。任務資料可取得總限時，不能從它假裝知道遊戲剩餘倒數。

第一輪兩候選全體平均縮短未達 3 招，因此不作採用擴查。另追加一個最多 192 episodes 的實際任務診斷：本次兩配方與玩家面板 × 2 個既有 worlds × 16 seeds × 3 策略；base 2026090601。目的僅是量出同一任務兩件的品質與時間交換，不改寫第一輪門檻，也不稱為完整獨立確認。開始前固定：兩件都完成、第一件 hard-quality 滿品質，第二件各品質檔位另列；以每招 4／5／6 秒、保留 30 秒其他操作估算是否能在 600 秒內完成。這是時間敏感度，並非遊戲倒數或真實通關率。

## 任務資料

最新兩份 v2.3 玩家紀錄分別用了 76 招／409.184 秒與 59 招／298.902 秒；第一件滿品質 18,900，第二件品質 25,669／27,400，超過第三檔 24,660。第一件共 32 次觀察，其中第 35–51 招有 14 次觀察與 3 次秘訣，約 87.898 秒都停在進展 6,817、品質 2,484、耐久 5、內靜 4。原 Artisan 在等高效以低價掌握回復，而既有續作改善的內靜門檻未涵蓋這個 state，形成這次付費回復試驗的具體原因。

全部 9 份 export 已經正式 `replaySession` 重播；最新兩份依實際歷史重算的正式 v2.3 WASM 建議與 135 招實際操作一致。這是當前實作重播，export 本身沒有原始推薦快照，不冒稱原 binary 身份證明，也不能沿用未選動作的未來球色推算省了多少秒。

`WKSMissionUnit.MissionTime` 經 unit row → WKSMissionRecipe 關聯投影，不能直接混用兩種 ID。Unit 268 對應本產品 mission 269「【高難+】製作飛船制服」，包含宇宙植物性纖維 36534、宇宙複合纖維 36535，整個任務共用 600 秒。

280 個已收錄任務中，160 個有倒數，120 個原始為 0，代表無時間限制；沒有缺漏或無效的 MissionTime。不限時任務分布為 sinus-ardorum 8、phaenna 56、oizys 32、auxesia 24；完整 IDs 在結果 JSON。初查時把 0 當作未知，經使用者要求查攻略後更正；不能把這 120 個稱為缺資料。

2026-09-06 網頁核對覆蓋四個星球的代表任務，並非逐一實玩 120 個任務。憧憬灣的 [Construction Necessities 玩家攻略](https://forum.square-enix.com/ffxiv/threads/517789-Cosmic-Tools?goto=nextnewest) 明示 no timer、2 次材料機會；法恩娜的 [臨時集散站](https://ff14.huijiwiki.com/wiki/任务:【高难+】支援建设临时集散站（裁衣匠）)、俄匊斯的 [續·小型化重力控制器](https://ff14.huijiwiki.com/wiki/任务:【高难+】续·开发小型化重力控制器（雕金匠）) 與奥克塞西亚的 [燃料資材開發](https://ff14.huijiwiki.com/wiki/任务:【高难】开发面向奥克塞西亚的燃料资材（刻木匠）) 均明示時間限制為無。最後一項的 [原始 wiki 資料](https://ff14.huijiwiki.com/wiki/Data%3AWKSMission/1391.json) 同時顯示時間限制 0、出現時段 00:00–04:00，直接對應 0→無倒數的語意。任務出現時段的 `types: timed` 與接取後的倒數是不同資料；不限時任務仍可有限定材料、件數與品質要求。

Bundle format 3→4，加入必要的非負整數 `timeLimitSeconds`，保留 0 為不限時；缺值、負值及非整數不接受。產生器與 Web decoder 均驗證，沿用原資料 revisions，沒有刷新其他遊戲資料。新 identity：`0be44cbd33b00210bd8864852ea8829e8db449f7bdac22b5403afea95b51b678`。沒有新增遊戲倒數讀取、跨件 controller 或 UI 計時器。

## 全家族 development 篩選

每臂 500 件，4 processes，兩候選合計 1,000 episodes 約 123.3 秒。基準取既有 v2.3 等同行為的原開局掌握保存結果；不是重新量測 baseline timing，也不是自然成功率。

| 指標 | v2.3 | 等三次再回復 | 立即回復 |
| --- | ---: | ---: | ---: |
| 完成成品 | 442 | 450 | 448 |
| 滿品質成品 | 392 | 393 | 390 |
| 相對 baseline 滿品質勝／敗 | — | 6／5 | 7／9 |
| 雙方滿品質平均招數差 | — | -0.886（387 件） | -1.603（383 件） |
| 完成者招數 p50／p95／max | 41／66／80 | 41／63／78 | 40／64／79 |
| illegal／policy-null | — | 0／0 | 0／0 |

Hard-quality 共 140 件，滿品質 98→99／97；雙方滿品質平均少 1.729／3.355 招。一般收藏品共 310 件，完成 296→301／301，滿品質 255→254／254；雙方完成但檔位下降 5／7 件，不能以交貨增加掩蓋品質下降。HQ 共 20 件，完成 19→20／20、滿品質 17→18／18；Master 共 30 件，完成 29→30／30、滿品質 22→22／21。

立即回復的滿品質淨退步 family：F14、F19、F39、F40、F43、F44、F49 各淨少 1；等三次再回復則 F35、F39、F40、F43、F44 各淨少 1。每格只有一個 sample，不能以此判定穩定優劣或調出 family 特例。完整 family × equipment × world 逐件資料與各軸彙總保存在 [結果 JSON](time-aware-recovery-results-20260906.json)。

兩者均未達全體平均少 3 招的跑前擴查條件。立即回復在 hard-quality 的縮短較明顯，因此僅追加上述事前補述的實際任務診斷；不把它改稱通過原先條件。

## 玩家兩件任務診斷

使用紀錄中的作業精度 5428、加工精度 5257、CP764、專家與宇宙工具加成；兩個既有 assumed worlds 各 16 組，三臂共 192 episodes，約 28.4 秒。不同配方使用不同 deterministic streams；同一配方各策略配對同 seed。策略改變後依自己的 actual action 產生結果，沒有把玩家原本的 success boolean 套到不同技能。

「兩件完成」要求第一件 hard-quality 滿品質完成且第二件完成。第二件品質另列，不等同任務金牌。以下以每招 5 秒、額外保留 30 秒為時間敏感度：

| 32 組模擬 | v2.3 | 等三次再回復 | 立即回復 |
| --- | ---: | ---: | ---: |
| 兩件完成，不限任務時間 | 26 | 29 | 29 |
| 兩件皆滿品質，不限任務時間 | 18 | 18 | 20 |
| 600 秒內兩件完成 | 13 | 15 | 24 |
| 600 秒內第二件第三檔以上 | 13 | 15 | 21 |
| 600 秒內兩件皆滿品質 | 13 | 14 | 19 |

立即回復按 world 切開：

| World，各 16 組 | 兩件完成 | 限時內完成 | 限時內第二件第三檔以上 | 不限時兩件滿品質 |
| --- | ---: | ---: | ---: | ---: |
| balanced-iid | 16→16 | 13→16 | 13→15 | 16→15 |
| normal-heavy-iid | 10→13 | 0→8 | 0→6 | 2→5 |

仍有代價：balanced-iid 失去 1 組雙滿品質。雙方兩件都滿品質的配對中，balanced-iid 15 組平均少 7.533 招，normal-heavy 2 組平均少 14 招；後者樣本極少。兩 world 合計 17 個相同滿品質配對平均少 8.29 招，即 5 秒／招假設下約 41 秒。

4 秒／招時限時內完成 v2.3 24→立即回復 29；6 秒／招時 5→10，均另留 30 秒其他操作。這不是同一場遊戲的反事實證明或任務自然通關率。網站事件兩件 708.086 秒仍是實際時間壓力證據，不能以模擬抹除。

## 保留範圍與限制

只保留立即回復候選：原 v2.3 建議觀察、耐久 ≤10、掌握未生效、品質未滿且 CP 足夠支付掌握並留下比爾格的祝福（有內靜時）與模範製作時，改用掌握。CP reserve 只限制回復支出，不是完工或滿品質證明。已有掌握的觀察、其他合法建議與原 v2.3 均維持原行為。

此候選未使用 600 秒倒數或跨件剩餘工作量，不能稱作任務排程 solver。保留理由是實際任務診斷有值得後續確認的時間收益，並非通過全體品質不退。沒有追加 overnight，不以 32 組小樣本升版。

## 驗證與重播

- 起點 commit：`128c09a0c357cfca3abdd28225654aba5fceb24d`。兩候選原始 native source 在 [patch](time-aware-recovery-source-20260906.patch)，不能在目前 dirty tree 直接套用。
- 原試驗 binary SHA-256：`a190f5fd78b8865becf6ff5bacbb8d6656aebbd84d8da30fef9b52c79add92c8`，凍結於 `evaluation-runs/time-aware-recovery-development/.artifacts/<sha>/craft-kernel-generic-episode.exe`。
- 撤下等待三次候選後，v2.3 與立即回復共 128 件對 frozen 輸出逐欄一致，排除的只有 timing；actions、完整 trace、final state、draw cursors、context 均 0 差異。新 native SHA-256：`ea0e16bef62c0ad630b7cb7f9c319c8bc224cebe3f768282566831dfd53c98db`。
- 研究 feature 專用 WASM 完成 4 個完整製作、209 次 recommendation，對 native action／final context 0 差異；Node-WASM p95 15.20ms、max 18.05ms。不是瀏覽器、手機或遊戲內實測。正式 Web build 不啟用研究策略。
- Rust `--lib --tests` 通過；清理後另驗證回復 guard 與有／無研究 feature 的 Web identity boundary。任務資料測試 3 項、session 測試 9 項、typecheck、正式 production build／SEO 驗證通過。
- 保存 outputs 的重算命令：`node reports/generic-cosmic-overnight/time-aware-recovery-screen-20260906.mjs --verify-saved`、`node reports/generic-cosmic-overnight/time-aware-recovery-player-run-20260906.mjs --verify-saved`。需保留本機 evaluation-runs corpus；全部逐件結果另存本報告 JSON。
- 玩家診斷輸入由 [TypeScript encoder](time-aware-recovery-player-inputs-20260906.ts) 產生；它只編碼 DTO 與既有 world weights。[執行與重算](time-aware-recovery-player-run-20260906.mjs)、[清理後 parity](time-aware-recovery-final-parity-20260906.mjs) 均保留。
