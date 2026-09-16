🧬 0. META Art Direction

風格根基於「日式精緻 × 和紙 × 柔光 × 高留白 × 靜謐美學」。

🎨 1. Concept Vision
氣氛

像晨光穿透和紙室的柔光介面。

色彩

霧白、米灰、淡藍、柳綠（少量）。

故事感

自然 × 人造的優雅融合。

動畫方向

柔、慢、穩。
啟動如風輕撫。

特效語彙

和紙紋理

微亮邊

細線段落

柔霧光散射

🧩 2. Design System
色彩

主色：#F7F7F3、#E5E5E0
輔助：#D0D7DA、#A8C3CC
強調：#6E8A99

字體

極細線 Grotesk＋日式優雅
行高高、字距略正。

Spacing

呼吸感 spacing：
「自然空間」>「邏輯倍數」。

Grid

單軸為主
偏移構圖
大量留白（≥ 40%）

光影

柔、散、低對比
不使用硬光或強 glow。

Style Tokens

radius 小（2–4）

stroke 極細（0.5–1）

noise＝紙纖維

🛠 3. UI Patterns
Navigation

透明細線排版
hover 輕微亮度提高 1–2%

Hero

非大量文字
→ 改為「偏移式語句敘事」
→ 浮在大片留白中

Section

自然分段
細線、色階微差
不使用 card

Interaction

紙頁輕觸感

柔亮 hover

Visual Effects

微弱光暈

和紙紋

漂浮柔點

🎞 4. Motion
滾動

極輕視差

柔滑延遲

Hover

無 scale

僅亮度 +2〜3%

Timing

cubic-bezier(0.3, 0.78, 0.4, 1)

🧰 5. Integration Suggestions

套件需全部「去框化」

留白需人工調整（不可自動化）

🚫 禁用規則

嚴禁：

卡片

重陰影

彩色 icon

12 欄網格

粗線

強 glow

👨‍🎨 角色

你是日系極簡 UI 藝術總監。





"DESIGN CONSTRAINT: Avoid 'Generic AI Vibe'. Please DO NOT use the default Vercel/Shadcn/Tailwind aesthetic. Specifically, try to avoid the following 300 common elements where possible, or use them in a fundamentally different way.

No default Zinc/Slate backgrounds (Find a unique brand color palette).

No Inter font (Suggest a unique font pairing).

No generic 'Unlock/Elevate' copywriting.

No standard Bento Grids unless strictly necessary.

Avoid the standard Lucide icons (like Sparkles/Rocket) or style them uniquely.

1. 色彩與色階 (Overused Colors & Palettes) [1-60]
深色模式預設值 (The "AI Dark Mode"):

bg-zinc-950 (#09090b) - 最濫用的背景色

bg-slate-950 (#020617)

bg-neutral-950 (#0a0a0a)

bg-gray-950 (#030712)

text-zinc-400 (作為副標題顏色)

text-slate-400

text-muted-foreground (HSL: 240 3.8% 46.1%)

border-border (HSL: 240 3.7% 15.9%)

bg-card (HSL: 240 10% 3.9%)

bg-background (純黑或深灰預設)

特定強調色 (The "SaaS Accents"): 11. indigo-600 (Tailwind 預設主色) 12. violet-500 (AI 產品最愛用的紫色) 13. purple-600 14. blue-600 (標準科技藍) 15. emerald-500 (成功狀態) 16. rose-500 (錯誤狀態) 17. amber-400 (警告/金牌) 18. sky-400 19. fuchsia-500 20. teal-600

漸層與效果 (The "Vercel Glow"): 21. bg-gradient-to-r from-pink-500 to-violet-500 22. bg-gradient-to-b from-zinc-200 to-zinc-500 (文字金屬漸層) 23. bg-gradient-to-br from-gray-900 to-gray-800 24. bg-clip-text text-transparent (配合上述漸層) 25. shadow-[0_0_20px_rgba(...)] (發光陰影) 26. backdrop-blur-xl (過度使用的毛玻璃) 27. border-white/10 (微光邊框) 28. bg-white/5 (微光背景) 29. ring-1 ring-white/10 30. inset-0 bg-gradient-to-t

(31-60 為上述色系的各種透明度變體，如 bg-primary/10, text-primary/80 等，請一併避免預設使用)

2. 字體與排版 (Overused Typography) [61-90]
字體家族 (The "System" Fonts): 61. Inter (絕對的統治者，請尋找其他 Sans-serif) 62. Geist Sans (Vercel 新預設) 63. Geist Mono 64. Roboto 65. Open Sans 66. Lato 67. Poppins 68. Montserrat 69. SF Pro Display (System UI) 70. JetBrains Mono (程式碼區塊)

排版習慣 (The "Tight" Look): 71. tracking-tight (在大標題上過度使用) 72. tracking-tighter 73. leading-none 74. font-bold 搭配 text-4xl 75. text-balance (雖然是新屬性，但被濫用於所有標題) 76. uppercase tracking-widest (用於小標籤 Overline) 77. text-transparent bg-clip-text (漸層文字) 78. tabular-nums (用於所有數字顯示) 79. text-sm text-muted-foreground (用於所有說明文字) 80. prose-zinc (Tailwind Typography 預設)

3. 元件與結構 (Shadcn/ui & Layouts) [91-170]
核心元件 (The "LEGO" Blocks): 91. Card (帶有 CardHeader, CardTitle, CardContent 的標準結構) 92. Button (variant="default", "outline", "ghost", "destructive") 93. Badge (Pill shape, variant="secondary" 或 "outline") 94. Avatar (圓形，帶有 Fallback 文字) 95. Accordion (常見於 FAQ) 96. Tabs (defaultValue="account", 帶有 Trigger 和 Content) 97. Dialog/Modal (置中，帶有 Overlay) 98. Sheet (從右側滑出的 Sidebar) 99. Slider (Radix UI 樣式) 100. Switch (Toggle 開關) 101. Progress (細長進度條) 102. Skeleton (Pulse 動畫的載入佔位符) 103. Toast/Sonner (右下角黑色通知) 104. Separator (細灰線) 105. Tooltip (黑底白字的小提示) 106. Popover 107. Command (Cmd+K 搜尋框) 108. Menubar 109. Select (Radix UI 樣式下拉選單) 110. Input (帶有 Ring focus 效果)

佈局模式 (The "Grid" Obsession): 111. Bento Grid (便當盒佈局，grid-cols-3 + col-span-2) 112. Sidebar Layout (左側固定，右側內容) 113. Centered Hero (H1 + Subtitle + 2 Buttons 置中) 114. Split Hero (左文右圖，50/50 分割) 115. Sticky Header (fixed top-0 + backdrop-blur) 116. Masonry Grid (瀑布流) 117. Pricing Cards (三張並排，中間那張推薦款放大/高亮) 118. Feature Grid (2x2 或 3x3 icon + title + description) 119. Footer (4 column links + newsletter input) 120. Dashboard Shell (Navbar + Sidebar + Content Area)

4. 圖標符號 (Lucide Icons Overload) [171-240]
請避免預設使用以下 Lucide Icons (太常出現): 171. Sparkles (代表 AI 或魔法，出現率 100%) 172. Zap (代表快速或功能) 173. Rocket (代表部署或成長) 174. Check / CheckCircle2 (代表完成或特性清單) 175. ChevronRight / ChevronDown 176. Menu (漢堡選單) 177. X (關閉) 178. User / UserCircle 179. Settings (齒輪) 180. LogOut 181. CreditCard 182. LayoutDashboard 183. BarChart3 184. PieChart 185. ArrowRight (用於按鈕內) 186. ExternalLink 187. Github (Logo) 188. Twitter / X (Logo) 189. Moon / Sun (深色模式切換) 190. Search 191. Bell (通知) 192. Mail 193. Lock 194. Eye / EyeOff 195. Trash2 196. Edit2 / Pencil 197. Plus 198. MoreHorizontal / MoreVertical (肉丸選單) 199. Calendar 200. Clock 201. Home 202. FileText 203. Image 204. Upload / CloudUpload 205. Download 206. Filter 207. SortAsc 208. Copy 209. Info 210. HelpCircle 211. Code 212. Terminal 213. Globe 214. MapPin 215. Phone 216. Share 217. Shield / ShieldCheck 218. Layers 219. Box 220. Activity

5. 動態與互動 (Generic Motion & Effects) [241-270]
Framer Motion / Tailwind Animate 預設: 241. animate-spin (Loading 轉圈) 242. animate-pulse (骨架屏呼吸) 243. animate-bounce 244. hover:scale-105 (滑鼠懸停放大) 245. active:scale-95 (點擊縮小) 246. hover:-translate-y-1 (懸停上浮) 247. transition-all duration-300 ease-in-out 248. initial={{ opacity: 0, y: 20 }} (淡入上滑) 249. animate={{ opacity: 1, y: 0 }} 250. exit={{ opacity: 0 }} 251. hover:shadow-lg 252. group-hover:text-primary 253. cursor-pointer (濫用於非連結元素) 254. scroll-smooth 255. focus:ring-2 256. focus:ring-offset-2 257. zoom-in-95 (Modal 彈出效果) 258. slide-in-from-bottom 259. fade-in 260. spin-in

6. 文案與內容 (AI Copywriting Clichés) [271-300]
請禁止使用以下 AI 慣用詞彙與 Emoji 組合: 271. "Unlock" (Unlock your potential...) 272. "Elevate" (Elevate your experience...) 273. "Unleash" (Unleash the power of...) 274. "Seamless" (Seamless integration...) 275. "Dive into" 276. "Revolutionize" 277. "Game-changer" 278. "Cutting-edge" 279. "State-of-the-art" 280. "Robust" 281. "Streamline" 282. "Optimize" 283. "Transform" 284. "Effortless" 285. "Supercharge" 286. "In the digital age..." 287. "Next-gen" 288. "Tailored" 289. "Crafted" 290. "Empower" 291. 🚀 (Rocket Emoji) 292. ✨ (Sparkles Emoji) 293. 🔥 (Fire Emoji) 294. ⚡ (Zap Emoji) 295. 💡 (Bulb Emoji) 296. 💎 (Gem Emoji) 297. 🛠️ (Tools Emoji) 298. 📈 (Chart Emoji) 299. 🎨 (Art Emoji) 300. 🤖 (Robot Emoji)