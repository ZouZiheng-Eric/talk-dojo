# 回嘴道场 / Talk Dojo

移动端优先的 Web 应用：粘贴短视频链接 → 语境解析（当前为 Mock）→ 三轮高压对话训练 → 战报（评分 + 雷达图 + 金句）→ 本地收藏。无后端、无登录。

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14（App Router） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 图表 | Recharts（雷达图） |
| 动效 | Framer Motion |
| 持久化 | `localStorage`（收藏）、`sessionStorage`（最近一次战报） |

---

## 本地运行

```bash
cd talk-dojo
npm install
npm run dev
```

浏览器访问终端里提示的地址（一般为 `http://localhost:3000`）。

```bash
npm run build   # 生产构建
npm run start   # 运行生产构建（需先 build）
npm run lint    # ESLint
```

### 开发异常时：清理缓存

若出现 **`Cannot find module './xx.js'`**、白屏或热更新错乱：

```bash
# PowerShell
Remove-Item -Recurse -Force .next, node_modules\.cache -ErrorAction SilentlyContinue
npm run dev
```

---

## 交互与动效（迭代参考）

| 能力 | 实现位置 |
|------|----------|
| 路由切换过渡 | `components/PageTransition.tsx`：`AnimatePresence` + `usePathname`，**不使用 `mode="wait"`**，避免与 App Router 换页冲突导致白屏 |
| AI 打字机 | `components/TypewriterText.tsx`：训练页**当前轮**教练气泡 |
| 战报分数滚动 | `components/AnimatedScore.tsx`：`requestAnimationFrame` + easeOut |
| 雷达图入场 | `components/RadarBoard.tsx`：`motion` 容器缩放 + Recharts `animationDuration` |
| 收藏 Toast | `components/ToastProvider.tsx` + `useToast()`，在 `Shell` 内包裹全站 |
| 主按钮样式 | `lib/ui.ts` 的 `btnPrimary`：金→珊瑚渐变、**白字**、`ring` 描边（避免近黑字在渐变异常时被误认为黑按钮） |
| 链接按压反馈 | `lib/ui.ts` 的 `linkPressable`：`active:scale-[0.96]` |

`Shell.tsx` 结构：`ToastProvider` → 顶栏 → `<main><PageTransition>{children}</PageTransition></main>`。

---

## 用户流程（路由）

| 路径 | 文件 | 说明 |
|------|------|------|
| `/` | `src/app/page.tsx` | 输入链接，`router.push('/parse?url=...')` |
| `/parse` | `src/app/parse/page.tsx` | 展示语境画像，进入 `/train?url=...` |
| `/train` | `src/app/train/page.tsx` | 3 轮 AI 话术 + 用户输入，结束后写入战报并 `replace('/report')` |
| `/report` | `src/app/report/page.tsx` | 读 `sessionStorage` 展示战报，可收藏 |
| `/favorites` | `src/app/favorites/page.tsx` | 读 `localStorage` 列表 |

全局壳子（顶栏、背景、Toast、页面过渡）：`src/components/Shell.tsx`，在 `src/app/layout.tsx` 中包裹。

---

## 目录结构（迭代时优先看这里）

```
talk-dojo/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css          # 仅 @tailwind 三行
│   │   ├── page.tsx
│   │   ├── parse/page.tsx
│   │   ├── train/page.tsx
│   │   ├── report/page.tsx
│   │   └── favorites/page.tsx
│   ├── components/
│   │   ├── Shell.tsx            # 顶栏、背景、ToastProvider、PageTransition
│   │   ├── PageTransition.tsx   # 路由切换动画
│   │   ├── ToastProvider.tsx    # useToast、底部 Toast
│   │   ├── TypewriterText.tsx   # 打字机
│   │   ├── AnimatedScore.tsx    # 战报分数动画
│   │   └── RadarBoard.tsx       # Recharts 雷达图
│   └── lib/
│       ├── types.ts
│       ├── constants.ts         # SESSION_REPORT_KEY
│       ├── mock.ts              # mockParse、PRESSURE_MESSAGES
│       ├── report.ts            # buildReport
│       ├── storage.ts           # 收藏
│       └── ui.ts                # glassPanel、btnPrimary、inputField、linkPressable
├── tailwind.config.js
├── next.config.mjs
├── package.json
└── README.md
```

---

## 数据与存储约定

### `sessionStorage`

| Key | 常量 | 写入位置 | 用途 |
|-----|------|----------|------|
| `talk-dojo-last-report` | `SESSION_REPORT_KEY`（`src/lib/constants.ts`） | `train/page.tsx` 训练结束 | `report/page.tsx` 读取；无数据则重定向 `/` |

战报结构见 `BattleReport`（`src/lib/types.ts`）。

### `localStorage`

| Key | 位置 | 结构 |
|-----|------|------|
| `talk-dojo-favorites` | `src/lib/storage.ts` 内常量 `KEY` | `FavoriteItem[]` JSON |

迭代时若改字段，需考虑**旧数据兼容**。

---

## 核心业务扩展指南

### 1. 把「解析」从 Mock 换成真实接口

- 当前：`mockParse(url)` 在 `src/lib/mock.ts`，`parse/page.tsx` 与 `train/page.tsx` 均 `useMemo(() => mockParse(url), [url])`。
- 建议：新增 `parseVideoUrl(url): Promise<ParseResult>`，解析页加 `loading / error`，类型统一用 `ParseResult`。

### 2. 调整训练轮次或 AI 话术

- 轮次：`PRESSURE_MESSAGES` 长度与 `train/page.tsx` 中 `3` 的判定保持一致。
- 话术：改 `src/lib/mock.ts` 的 `PRESSURE_MESSAGES`。

### 3. 评分与战报

- `src/lib/report.ts` 的 `buildReport()`；当前为前端模拟分，可改为接 API。

### 4. UI / 主题

- 色板：`tailwind.config.js` → `dojo.*`。
- 复用 class：`src/lib/ui.ts`；避免在 `globals.css` 写复杂 `@apply`（曾与 Next 构建链冲突）。

### 5. 雷达图维度

- `ReportScores` 与 `RadarBoard.tsx` 的 `LABELS` 同步维护。

---

## 版本与发布（Git）

仓库：`https://github.com/ZouZiheng-Eric/talk-dojo`

```bash
git tag demo_1
git push origin demo_1
```

```bash
git add -A
git commit -m "feat: 简述变更"
git push origin main
```

若远程 `main` 与本地分叉：`git pull origin main --rebase`（或 merge）后再推送。

---

## 依赖说明（升级时注意）

- **Next 14 + React 18**：关注 App Router、`useSearchParams` 与 `Suspense`。
- **Recharts**：客户端组件；升级后与 React 大版本一起测。
- **Framer Motion**：页面过渡与列表动画；避免对 `next/link` 直接使用 `motion(Link)`（与类型不兼容），链接用 `linkPressable` 或包一层 `motion.span`。

---

## 当前限制（产品/技术）

- 解析结果固定 Mock，与输入链接无关。
- 无账号体系，清除浏览器数据会丢失收藏。
- 战报仅保留最近一次于 `sessionStorage`。
- 未接真实大模型；训练话术为静态数组。

---

## License

见仓库根目录 `LICENSE`。
