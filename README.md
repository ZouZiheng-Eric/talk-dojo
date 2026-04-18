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

---

## 用户流程（路由）

| 路径 | 文件 | 说明 |
|------|------|------|
| `/` | `src/app/page.tsx` | 输入链接，`router.push('/parse?url=...')` |
| `/parse` | `src/app/parse/page.tsx` | 展示语境画像，进入 `/train?url=...` |
| `/train` | `src/app/train/page.tsx` | 3 轮 AI 话术 + 用户输入，结束后写入战报并 `replace('/report')` |
| `/report` | `src/app/report/page.tsx` | 读 `sessionStorage` 展示战报，可收藏 |
| `/favorites` | `src/app/favorites/page.tsx` | 读 `localStorage` 列表 |

全局壳子（顶栏、背景）：`src/components/Shell.tsx`，在 `src/app/layout.tsx` 中包裹所有页面。

---

## 目录结构（迭代时优先看这里）

```
talk-dojo/
├── src/
│   ├── app/                 # 页面（App Router）
│   │   ├── layout.tsx       # 字体、metadata、viewport、Shell
│   │   ├── globals.css      # 仅 @tailwind 三行，复杂样式用 Tailwind class / ui.ts
│   │   ├── page.tsx         # 首页
│   │   ├── parse/page.tsx
│   │   ├── train/page.tsx
│   │   ├── report/page.tsx
│   │   └── favorites/page.tsx
│   ├── components/
│   │   ├── Shell.tsx        # 顶栏 + 背景渐变
│   │   └── RadarBoard.tsx   # Recharts 雷达图
│   └── lib/
│       ├── types.ts         # ParseResult / TrainingRound / BattleReport 等
│       ├── constants.ts     # SESSION_REPORT_KEY
│       ├── mock.ts          # mockParse、PRESSURE_MESSAGES（施压台词）
│       ├── report.ts        # buildReport：由三轮回复生成分数与金句
│       ├── storage.ts       # 收藏读写（localStorage key 见下）
│       └── ui.ts            # glassPanel / btnPrimary / inputField 字符串
├── tailwind.config.js       # dojo 色板与动画
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
| `talk-dojo-favorites` | `src/lib/storage.ts` 内常量 `KEY` | `FavoriteItem[]` JSON，即 `BattleReport` + `id` + `savedAt` |

迭代时若改字段，需考虑**旧数据兼容**（`JSON.parse` 后缺字段时的默认值）。

---

## 核心业务扩展指南

### 1. 把「解析」从 Mock 换成真实接口

- 当前：`mockParse(url)` 在 `src/lib/mock.ts`，`parse/page.tsx` 与 `train/page.tsx` 均 `useMemo(() => mockParse(url), [url])`。
- 建议：
  - 新增 `src/lib/api.ts`（或 `services/parse.ts`），`parseVideoUrl(url): Promise<ParseResult>`。
  - `parse/page.tsx`：在 `useEffect` 中请求，加 `loading / error` 状态；成功后再展示卡片与「进入训练」。
  - 类型仍以 `ParseResult` 为准，避免页面散落字段名。

### 2. 调整训练轮次或 AI 话术

- 轮次数量：由 `PRESSURE_MESSAGES` 长度与 `train/page.tsx` 里 `roundIndex < 3`、`3` 等魔法数字共同决定，修改时需**一并改** `buildReport` 是否假设三轮（`report.ts` 当前对轮数无硬编码，但文案有「3 轮」时需同步 UI）。
- 话术：改 `src/lib/mock.ts` 的 `PRESSURE_MESSAGES` 数组即可。

### 3. 评分与战报逻辑

- 全部在 `src/lib/report.ts` 的 `buildReport()`。
- 当前为基于回复长度 + hash 的**前端模拟分**，非真实 NLP。
- 接入模型评分时：可保留 `buildReport` 为适配层，内部调用 API 返回 `ReportScores` 与 `quotes`。

### 4. UI / 主题

- 颜色：`tailwind.config.js` → `theme.extend.colors.dojo`。
- 卡片/按钮 class 片段：`src/lib/ui.ts`，避免在 `globals.css` 写复杂 `@apply`（曾与 Next 构建链冲突）。

### 5. 雷达图维度

- 类型：`ReportScores`（`composure / logic / boundary / empathy / punch`）。
- 展示：`RadarBoard.tsx` 中 `LABELS` 中文映射；增删维度需同时改类型、`buildReport` 与图表数据。

---

## 版本与发布（Git）

仓库示例：`https://github.com/ZouZiheng-Eric/talk-dojo`

打标签发布里程碑：

```bash
git tag demo_1
git push origin demo_1
```

日常迭代：

```bash
git add -A
git commit -m "feat: 简述变更"
git push origin main
```

若远程 `main` 与本地分叉，先 `git pull origin main --rebase`（或 merge）再推送。

---

## 依赖说明（升级时注意）

- **Next 14 + React 18**：大版本升级请对照官方迁移文档，重点检查 App Router、`useSearchParams` 与 Suspense 边界。
- **Recharts**：需随 React 大版本验证；雷达图在客户端组件中使用（`RadarBoard` 已 `"use client"`）。
- **Framer Motion**：页面级动画；升级后若布局异常，检查 `layout` / `AnimatePresence` API 变更。

---

## 当前限制（产品/技术）

- 解析结果固定 Mock，与输入链接无关。
- 无账号体系，清除浏览器数据会丢失收藏。
- 战报仅保留「最近一次」在 `sessionStorage`；刷新报告页依赖本次会话内已完成训练。
- 未接真实大模型；训练页话术为静态数组。

---

## License

见仓库根目录 `LICENSE`。
