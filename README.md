# 回怼道场 / Talk Dojo

移动端优先的 Web 应用：上传本地短视频 → 语境解析（当前为 Mock）→ 三轮高压对话训练 → 战报（综合分 + 五维雷达 + 金句）→ 本地收藏。无账号、无登录；可选接入 **OpenAI 兼容** 大模型生成训练台词（密钥仅服务端）。

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14（App Router） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 图表 | Recharts（五维雷达图） |
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

### 大模型（可选）

1. 复制根目录 `.env.example` 为 `.env.local`，填写 `LLM_API_BASE`（需包含 `/v1`，与供应商文档一致）、`LLM_API_KEY`、`LLM_MODEL`。
2. 训练页每轮会 `POST /api/chat`，由 Route Handler 转发到 `{LLM_API_BASE}/chat/completions`；未配置密钥或请求失败时自动回退 `src/lib/mock.ts` 的 `PRESSURE_MESSAGES`。
3. 三轮结束后会 `POST /api/score`：模型输出五维分数、综合分、`coachNotes`，以及每轮用户原话的 `lineScores`（金句分）；服务端选出最高分一句写入 `goldenQuote`（正文仍为用户原话），战报金句区主展示该句。**AI 锐评**单独展示 `coachNotes`。失败或未配置密钥时回退本地评分与多段原话摘录。
4. 客户端开关：在 `.env.local` 设置 `NEXT_PUBLIC_USE_LLM=false` 可强制仅用 Mock 台词且不请求评分接口。

服务端相关环境变量集中在 `src/config/server.ts`（**勿**在客户端组件中 import）；客户端可见配置在 `src/config/client.ts`。

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
| 战报档位 | `lib/performanceTier.ts` |
| 五维雷达 | `components/RadarBoard.tsx`：Recharts，Tooltip 为档位 |
| 收藏 Toast | `components/ToastProvider.tsx` + `useToast()`，在 `Shell` 内包裹全站 |
| 主按钮样式 | `lib/ui.ts` 的 `btnPrimary`：金→珊瑚渐变、**白字**、`ring` 描边（避免近黑字在渐变异常时被误认为黑按钮） |
| 链接按压反馈 | `lib/ui.ts` 的 `linkPressable`：`active:scale-[0.96]` |

`Shell.tsx` 结构：`ToastProvider` → 顶栏 → `<main><PageTransition>{children}</PageTransition></main>`。

---

## 用户流程（路由）

| 路径 | 文件 | 说明 |
|------|------|------|
| `/` | `src/app/page.tsx` | 引导至解析页上传本地视频 |
| `/parse` | `src/app/parse/page.tsx` | 上传并解析，展示语境画像，进入 `/train?url=local://video` |
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
│   │   ├── favorites/page.tsx
│   │   └── api/
│   │       ├── chat/route.ts    # 教练台词代理
│   │       └── score/route.ts   # 战报五维评分 + 短评（JSON）
│   ├── config/
│   │   ├── server.ts            # LLM_* 环境变量（仅服务端）
│   │   ├── client.ts            # NEXT_PUBLIC_USE_LLM 等
│   │   └── index.ts
│   ├── components/
│   │   ├── Shell.tsx            # 顶栏、背景、ToastProvider、PageTransition
│   │   ├── PageTransition.tsx   # 路由切换动画
│   │   ├── ToastProvider.tsx    # useToast、底部 Toast
│   │   ├── TypewriterText.tsx   # 打字机
│   │   └── RadarBoard.tsx       # Recharts 五维雷达
│   └── lib/
│       ├── types.ts
│       ├── constants.ts         # SESSION_REPORT_KEY
│       ├── mock.ts              # mockParse、PRESSURE_MESSAGES（LLM 回退）
│       ├── llm/
│       │   ├── messages.ts      # system prompt + OpenAI 风格 messages
│       │   ├── client.ts        # fetchCoachLine → /api/chat
│       │   ├── scoreClient.ts   # fetchAiBattleScore → /api/score
│       │   ├── scoreMessages.ts
│       │   ├── parseScoreJson.ts
│       │   └── server/
│       │       └── postChatCompletion.ts
│       ├── report.ts            # buildReport、buildReportWithOptionalAi
│       ├── storage.ts           # 收藏
│       └── ui.ts                # glassPanel、btnPrimary、inputField、linkPressable
├── .env.example                 # LLM_* 与 NEXT_PUBLIC_USE_LLM 示例
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

- 轮次：`train/page.tsx` 中 `roundIndex >= 3` 与业务约定一致即可；若改轮数需同步 `buildCoachMessages` 等提示逻辑。
- 在线生成：改 `src/lib/llm/messages.ts` 的 system prompt 或 `fetchCoachLine` 调用方式。
- 回退话术：改 `src/lib/mock.ts` 的 `PRESSURE_MESSAGES`（API 未配置或失败时使用）。

### 3. 评分与战报

- `src/lib/report.ts`：`buildReport()` 本地模拟五维；`buildReportWithOptionalAi()` 合并 `/api/score` 结果。

### 4. UI / 主题

- 色板：`tailwind.config.js` → `dojo.*`。
- 复用 class：`src/lib/ui.ts`；避免在 `globals.css` 写复杂 `@apply`（曾与 Next 构建链冲突）。

### 5. 五维档位（后台仍为 0～100，界面只显示夯～拉完了）

| 字段 | 含义 |
|------|------|
| `boundary` | 边界意识：拒不合理要求；轻易道歉/「我尽量」则低分 |
| `pushback` | 反弹力度：被动防守 vs 把压力抛回对方 |
| `logic` | 逻辑闭环：抓漏洞、有理有据 |
| `sarcasm` | 阴阳段位：讽刺/魔法对魔法 |
| `zen` | 情绪内核：破防低分，稳与降维打击高分 |

`ReportScores` / `RadarBoard` / `scoreMessages` 字段对齐；档位换算见 `performanceTier.ts`（80 / 60 / 40 / 20）。

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
- **Framer Motion**：页面过渡与列表动画；避免对 `next/link` 直接使用 `motion(Link)`（与类型不兼容），链接用 `linkPressable` 或包一层 `motion.span`。

---

## 当前限制（产品/技术）

- 未配置大模型时，语境解析为固定 Mock，与所选视频文件无关。
- 无账号体系，清除浏览器数据会丢失收藏。
- 战报仅保留最近一次于 `sessionStorage`。
- 大模型为可选：未配置 `LLM_API_KEY` 或关闭 `NEXT_PUBLIC_USE_LLM` 时，训练话术为静态 Mock。

---

## License

见仓库根目录 `LICENSE`。
