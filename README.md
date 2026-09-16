# 旅遊行程 Apps

同一個 Git repo、同一個 Supabase 專案，兩個**完全獨立**的前端 App。沒有共用 UI、theme kit 或 runtime 切團層。

| App | 目錄 | 資料庫前綴 | 團碼 | 開發埠 |
| --- | --- | --- | --- | --- |
| 馬尼拉三日 | `apps/manila-2026-09` | `zentravel_*` | MNL927 | 3001 |
| 泰沃毛（曼谷／華欣） | `apps/bangkok-hua-hin-2025-12` | `thaiwomao_*` | BKK512 | 3000 |

## 開發

```bash
cd apps/manila-2026-09
cp ../../.env.example .env   # 若還沒有
npm install
npm run dev
```

```bash
cd apps/bangkok-hua-hin-2025-12
cp ../../.env.example .env
npm install
npm run dev
```

兩個 App 都只使用 publishable key，不要把 service_role 放進前端。

登入帳號來自共用的 `auth.users`。馬尼拉要先在 `zentravel_users` 註冊；泰沃毛要先在 `thaiwomao_users` 註冊，兩邊名單互不相通。

## 資料庫

Migration 放在 repo 根目錄 `supabase/migrations/`，套用到共用專案 `vjwiuimmifdcvgilhwie`。
