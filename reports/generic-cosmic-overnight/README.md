# Generic Cosmic overnight 四表總覽

本目錄同時保存自動四表、人工判讀與歷史研究計畫。它們是當時的 evidence；文中的下一步、暫停、基線或一次性授權不覆蓋 [目前方向](../../.agents/current_state.md)。重播先核對來源 identity，不直接照舊命令啟動。

自動 `<run-id>.md` 由 completed overnight 的 validated shards 生成，固定呈現 Balanced × `balanced-iid` × E02／E09 的四表；三臂則分別呈現 candidate 對 baseline／reference 的兩組四表。固定切片只是閱讀入口，不代表全部裝備／world。精確格式與重建流程由下方 runner workflow 擁有；人工判讀另存，避免重新生成時覆蓋。

原始 `config.json`、`manifest.json` 與 shards 仍由 `evaluation-runs/` 擁有；本目錄不是 raw evidence 的替代品。生成契約與重建命令見 [runner 說明](../../tools/evaluate-generic-cosmic-overnight/README.md)。
