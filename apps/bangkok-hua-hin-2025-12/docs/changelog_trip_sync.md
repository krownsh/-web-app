
# 變更日誌

## [2025-12-23] 行程同步與集合資訊設定

### 新增功能
1.  **即時行程同步 (Real-time Itinerary Sync)**:
    *   **首頁 (Home)**: 當使用者捲動「當下行程」滾輪並停留時，系統會自動記住該行程項目為「當前進度」。即使刷新頁面，也會自動定位到該行程。
    *   **行程頁 (Discovery)**: 進入行程地圖頁面時，會自動切換至「當前進度」所在的天數，並在地圖上高亮顯示該地點。
    *   **資料庫**: `itineraries` 資料表邏輯上新增 `is_current` 欄位以記錄進度。

2.  **集合資訊設定 (Set Meeting Point)**:
    *   **功能**: 在首頁「當下行程」右側新增「設定」按鈕。
    *   **互動**: 點擊後跳出設定彈窗，領隊或使用者可更新該行程的「集合地點」與「備註說明」。
    *   **顯示**: 更新後的資訊即時反映在首頁右側面板，並同步回資料庫。

### 修改檔案
*   `services/SupabaseService.ts`: 新增 `getCurrentItinerary`, `setCurrentItinerary`, `updateItinerary` 方法。
*   `screens/HomeScreen.tsx`: 實作行程同步邏輯及集合資訊設定彈窗。
*   `screens/DiscoveryScreen.tsx`: 新增自動定位當前行程的邏輯。
*   `docs/database_schema.md`: 更新資料表欄位說明。
