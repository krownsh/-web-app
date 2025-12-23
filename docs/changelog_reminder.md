
# 變更日誌

## [2025-12-23] 新增注意事項頁面

### 新增功能
1.  **提醒頁面 (ReminderScreen)**:
    *   位於 `screens/ReminderScreen.tsx`。
    *   將 `注意事項.md` 的內容轉化為結構化的 UI 顯示。
    *   包含主要類別（如生活資訊、出入境規定等）與子類別的摺疊或條列呈現。

2.  **導覽列更新**:
    *   在 `BottomNav` 最右側新增「提醒」按鈕 (Icon: notifications)。
    *   點擊可導航至 `#/reminder`。

### 修改檔案
*   `src/App.tsx`: 新增 `/reminder` 路由。
*   `src/components/BottomNav.tsx`: 新增導覽項目。
*   `src/screens/ReminderScreen.tsx`: 新增頁面元件。
