# 下次清空馬尼拉測試資料

1. 先部署最新前端，再清資料。
2. 在 Supabase SQL Editor 執行 `apps/manila-2026-09/supabase/snapshots/reset_manila_runtime.sql`。
   若要保留主揪外測帳：只跑第一段 `DO $$ ... END $$`（清遊戲／記帳等）。第二段會拿掉所有馬尼拉團籍並刪「只用過馬尼拉」的登入帳。
3. 行程被改壞時，再執行 `manila-2026-09-seed.sql`。平常清空不必跑。
4. 腳本只刪馬尼拉團籍與「只用過馬尼拉、沒出現在泰沃毛／其他 app」的登入帳。
5. Storage 不能靠這份 SQL 刪檔。到 Dashboard → Storage → `zentravel-game-photos` 清掉馬尼拉 trip 資料夾（orphan 檔不影響功能，但會佔空間）。
6. 不會刪曼谷團行程，也不會刪 schema。
7. 請測試者登出、硬重新整理；已加到主畫面的請刪圖示重加，或清網站資料。
8. 攻略本機舊資料會在正式團員下次打開時搬上雲端（收藏變全團可見、必買先當私人）。
9. 前端不要放 service_role。
