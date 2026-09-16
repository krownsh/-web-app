# 旅遊行程 Web App 資料庫結構 (Supabase 版)

本專案已從 Google Sheets 遷移至 **Supabase** (PostgreSQL)。以下為各資料表架構說明。

---

## 1. `itineraries` (行程表)
存儲每日行程地點、時間與詳細資訊。

| 欄位名稱 | 資料類型 | 說明 |
| :--- | :--- | :--- |
| `id` | UUID / String | 主鍵 (Primary Key) |
| `day` | String | 行程天數 (例如: D1, D2...) |
| `time` | String | 預計時間 |
| `title` | String | 地點/活動標題 |
| `location` | String | 詳細地點名稱/地址 |
| `type` | String | 類別: attraction, food, shopping, transport |
| `description` | Text | 備註說明 |
| `lat` | Float8 | 緯度 |
| `lng` | Float8 | 經度 |
| `image_url` | Text | 圖片連結 |
| `is_current` | Boolean | 當前行程標記 (True 表示為當下行程) |
| `created_at` | Timestamptz | 建立時間 |

---

## 2. `must_buys` (必買清單)
存儲共同及私人必買項目。

| 欄位名稱 | 資料類型 | 說明 |
| :--- | :--- | :--- |
| `id` | UUID / String | 主鍵 |
| `item_name` | String | 商品名稱 |
| `price` | Numeric | 預估價格 (泰銖) |
| `location_ref` | String | 關聯的地點名稱 |
| `image_url` | Text | 商品圖片 |
| `visibility` | String | `public` 或 `private` |
| `owner_id` | String | 建立者的 ID |
| `created_at` | Timestamptz | 建立時間 |

---

## 3. `budget_records` (消費紀錄)
存儲旅行中的各項支出。

| 欄位名稱 | 資料類型 | 說明 |
| :--- | :--- | :--- |
| `id` | UUID / String | 主鍵 |
| `date` | Date | 消費日期 |
| `time` | Time | 消費時間 |
| `title` | String | 消費項目名稱 |
| `amount` | Numeric | 金額 |
| `currency` | String | 幣別 (THB, TWD...) |
| `category` | String | 類別 (food, transport...) |
| `location` | String | 消費地點 |
| `payment_type` | String | `public` (公積金) 或 `self` (個人) |
| `owner_id` | String | 建立者的 ID |
| `created_at` | Timestamptz | 建立時間 |

---

## 4. `checklist_statuses` (勾選狀態)
存儲使用者對必買清單的勾選進度。

| 欄位名稱 | 資料類型 | 說明 |
| :--- | :--- | :--- |
| `item_id` | String | 必買項目 ID (複合主鍵) |
| `owner_id` | String | 使用者 ID (複合主鍵) |
| `is_checked` | Boolean | 是否已勾選 |
| `updated_at` | Timestamptz | 最後更新時間 |

---

## 5. `budgets` (預算額度)
存儲公積金及個人的預算上限。

| 欄位名稱 | 資料類型 | 說明 |
| :--- | :--- | :--- |
| `id` | String | 主鍵 |
| `budget_type` | String | `public` 或 `self` |
| `amount` | Numeric | 預算總額 |
| `owner_id` | String | 使用者 ID |
| `updated_at` | Timestamptz | 最後更新時間 |

---

## 連線資訊
專案透過 `@supabase/supabase-js` 進行連線，環境變數如下：
- `VITE_SUPABASE_URL`: Supabase 專案 URL
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: 匿名存取金鑰 (Anon Key)

## RLS 政策 (Row Level Security)
- 所有資料表目前均開啟讀寫權限 (開發階段)，後續可根據 `owner_id` 進行過濾。

