# 馬尼拉三日：Cloudflare Pages + 手機 PWA

明天接著做這份即可。泰國「泰沃毛」當時也是同一套：**Vite 打包靜態檔 → Wrangler 上傳 Cloudflare Pages → 手機瀏覽器加入主畫面**。

這不是上架 App Store。上線後會得到 `https://….pages.dev`（HTTPS），才能加成獨立 App 外觀的 PWA。

---

## 現況（2026-09-16）

- 專案路徑：`apps/manila-2026-09`
- PWA 已設定：`vite-plugin-pwa`、`public/Icon*.png`、`display: standalone`
- SPA 轉址已有：`public/_redirects`（內容 `/* /index.html 200`）
- `wrangler` 已在該 app 的 `package.json`（約 4.56）
- 本機當時 **尚未** `wrangler login`
- 資料庫：共用 Supabase `https://vjwiuimmifdcvgilhwie.supabase.co`
- 團碼：`MNL927`
- 前端只准用 publishable key。**禁止**把 `service_role` 放進 `.env` 的 `VITE_` 或任何客戶端

---

## 0. 部署前確認

在：

`D:\others\sideproject\旅遊行程\web app\apps\manila-2026-09`

確認有 `.env`（對齊 `.env.example`）：

```
VITE_SUPABASE_URL=https://vjwiuimmifdcvgilhwie.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<publishable，不是 service_role>
```

`npm run build` 會把這兩個值編進 JS。用 Wrangler **直接上傳 `dist`** 時，不會再讀 Cloudflare 後台環境變數。

---

## 1. 登入 Cloudflare（做一次就好）

PowerShell：

```powershell
cd "D:\others\sideproject\旅遊行程\web app\apps\manila-2026-09"
npx wrangler login
```

用當初放泰沃毛的那個 Cloudflare 帳號在瀏覽器授權。

確認：

```powershell
npx wrangler whoami
```

泰國專案名稱可到 [Workers & Pages](https://dash.cloudflare.com/) 對一下，馬尼拉請用**新專案名**，不要蓋掉泰國那版。

---

## 2. 建置

```powershell
npm run build
```

完成後應有 `dist\`，內含 PWA service worker、manifest，以及 `dist/_redirects`。

---

## 3. 建立 Pages 專案並上傳

第一次：

```powershell
npx wrangler pages project create manila-2026-09
```

production branch 選 `main` 即可。

上傳：

```powershell
npx wrangler pages deploy dist --project-name manila-2026-09
```

成功後會印出網址，類似：

`https://manila-2026-09.pages.dev`

之後改程式只要再：

```powershell
npm run build
npx wrangler pages deploy dist --project-name manila-2026-09
```

泰國那版是在 `apps/bangkok-hua-hin-2025-12` 對它自己的 `--project-name` 做同樣的 `build` + `pages deploy dist`。

---

## 4. Supabase 允許正式網址（必做）

[Authentication → URL Configuration](https://supabase.com/dashboard/project/vjwiuimmifdcvgilhwie/auth/url-configuration)

**Redirect URLs** 加上實際網址（部署後以終端機印出的為準）：

- `https://manila-2026-09.pages.dev`
- `https://manila-2026-09.pages.dev/**`

沒加的話本機登入還可以，手機 PWA 登入／導回會失敗。

---

## 5. 手機加成 PWA

用正式 `https://….pages.dev` 打開（不要用 IP、不要用 http）。

### iPhone

1. 用 **Safari**（不要用 LINE 內建瀏覽器）
2. 登入 + 團碼 `MNL927`
3. 分享 → **加入主畫面**
4. 名稱應為「馬尼拉三日」
5. 從主畫面圖示進去應為全螢幕、沒有 Safari 網址列

### Android

1. 用 **Chrome**
2. 選單 → **加到主畫面** / **安裝應用程式**

---

## 容易踩的坑

| 狀況 | 原因 |
|------|------|
| 重整或進子頁面 404 | `dist/_redirects` 沒進去。建置後確認該檔還在。 |
| 手機登不進去 | Redirect URLs 沒加 `pages.dev`。 |
| 加到主畫面只是書籤 | 沒用 Safari/Chrome，或不是 HTTPS。 |
| 手機還是舊版 | 再 deploy；必要時刪主畫面圖示重加。 |
| 本機有資料、線上沒有 | 同一個 Supabase；多半沒登入或沒入團。 |

---

## 明天開工檢查清單

- [ ] `npx wrangler login` + `whoami`
- [ ] 確認 `.env` 只有 publishable key
- [ ] `npm run build`
- [ ] `wrangler pages project create manila-2026-09`（若尚未建立）
- [ ] `wrangler pages deploy dist --project-name manila-2026-09`
- [ ] 把印出的 `pages.dev` 加進 Supabase Redirect URLs
- [ ] Safari / Chrome 打開、登入、加入主畫面
- [ ] 測首頁團員卡、底部 tab、行程、記帳
