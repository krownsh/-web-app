
# 變更日誌

## [2025-12-23] 修正地圖中心點偏移問題

### 修正功能
1.  **行程地圖 (DiscoveryScreen)**:
    *   修正 `MapViewUpdater` 中的偏移計算邏輯。
    *   將 `panOffset` 從正值改為負值 (`-screenHeight * 0.22` 及 `-screenHeight * 0.42`)。
    *   **原因**: 使用正值會將地圖「向下」平移，導致目標點（Marker）移動到螢幕更下方，進而被底部面板遮擋。改為負值後，地圖內容會「向上」移動，使 Marker 出現在可視區域的垂直中心（面板上方）。

### 修改檔案
*   `src/screens/DiscoveryScreen.tsx`
