# Feeds Hub

Build your own AI-powered information hub.

Feeds Hub 是一个面向 AI Agent 和 AI 自动化系统的可复制信息流案例。它把联网搜索、主题筛选、来源校验、内容摘要、封面生成、Markdown 写入和静态站点发布串成一套流程，帮助你搭建属于自己的信息处理入口。

你可以用它持续追踪自己关心的主题，例如 AI 科技、股市、世界杯、LOL 赛事、开源项目、创业与产品设计等。信息不再散落在新闻网站、社交媒体和搜索结果里，而是被整理成一个可访问、可沉淀、可部署的网站。

本仓库的主定位是通用 AI 信息流生成案例，不绑定具体执行者。任何具备联网查询、内容生成、图片生成和文件写入能力的 AI Agent 或自动化系统，都可以接入这套流程。

通用 Prompt、Skill、Workflow 和自动化规范由 [`idaibin/aicraft`](https://github.com/idaibin/aicraft) 维护。

## 它适合做什么

- 个人 AI 新闻入口
- 股市 / 科技 / 开源简报
- 赛事追踪页面
- 创业与产品设计观察
- 团队内部信息看板
- 自定义主题的信息处理系统

## 核心能力

- 按主题自动搜索最新信息
- 对内容做有效性审查，过滤低价值信息
- 按来源等级、事实新鲜度和网络热度判断是否写入
- 生成结构化 Markdown 内容
- 按 WebP、PNG、SVG 优先级生成或更新封面图
- 使用 Astro 构建静态站点
- 支持部署到 Vercel
- 主题、来源、频率、内容格式、card type、海报提示词和页面样式都可以自定义

本仓库的仓库边界、自动化流程、主题规则、card type、正文格式和页面规范分别维护在：

```text
docs/rules/repo-scope.md
docs/automation/feeds-hub-update.md
docs/topics/README.md
docs/card-types/README.md
docs/rules/content-format.md
docs/rules/ui-spec.md
```

## 这不是固定模板

Feeds Hub 不是一个只能按默认主题运行的信息流站点模板。你可以按自己的需求调整：

- 关注主题
- 信息来源
- 更新频率
- 内容结构
- 封面图风格
- 页面展示方式
- 自动化执行工具

当前项目默认包含：

- Astro 静态站点。
- 中文信息流首页。
- Card 展示：图片、标题、副标题、分类、时间。
- 分类页：世界杯、LOL、股市简报、AI 科技、全球重点、开源与 Rust、创业与产品设计。
- 详情页：海报、摘要、正文、来源。
- 内容更新由 AI 自动化任务执行，不在仓库内配置 RSS 抓取任务。
- 每一类主题由 AI 自动化任务更新前独立审查，没有有效内容则跳过。
- 每一类主题的关注范围、可用类型、信息来源和主题海报提示词维护在 `docs/topics/<category>.md`。
- Card type 分类、比例和通用海报类型提示词维护在 `docs/card-types/README.md`。
- 正文采用事实型格式，维护在 `docs/rules/content-format.md`。
- 主封面由执行者使用可用图像生成能力生成，优先保存为高质量高尺寸 WebP；WebP 不可用时使用 PNG；WebP 和 PNG 都不可用时才使用当前 feed 专属 SVG。图片保存到 `public/images/<category>`，页面引用路径使用 `/images/<category>/...`。
- 前端展示 frontmatter `cover` 指向的图片海报；比例只允许 `16:9`、`4:5` 和 `4:3`。CSS 只负责尺寸和裁切，不生成替代海报。
- 海报提示词按 `Card type prompt + Topic poster prompt + Event facts + Negative constraints` 组合生成。

## 默认主题

| 分类 | 说明 |
|---|---|
| 世界杯 | 默认关注 2026 世界杯，后续可按年份扩展。 |
| LOL 赛事 | 支持 LPL、先锋赛、MSI、世界赛等。 |
| 股市简报 | 支持 A 股、美股、创业板、纳斯达克。 |
| AI 科技 | 支持 AI 公司、模型、开源项目、工程工具。 |
| 全球重点 | 支持全球范围内值得关注的综合新闻。 |
| 开源与 Rust | 支持 Rust、开源项目、工程工具、基础设施与开发者生态。 |
| 创业与产品设计 | 支持创业、产品设计、增长、用户体验与商业化。 |

## 本地运行

```bash
pnpm install
pnpm run dev
```

## 构建检查

```bash
pnpm run validate:feeds
pnpm run check
pnpm run build
```

## AI 更新模式

本仓库只负责展示处理后的结果。信息获取、审查、摘要、海报生成和 GitHub 写入由执行者按更新任务入口完成。

任务入口只保留最小流程。具体执行时按需参考：

```text
idaibin/aicraft/docs/standards/github-branching.md
idaibin/aicraft/docs/standards/ai-content-quality.md
idaibin/feeds-hub/docs/rules/repo-scope.md
idaibin/feeds-hub/docs/automation/feeds-hub-update.md
idaibin/feeds-hub/docs/rules/ui-spec.md
idaibin/feeds-hub/docs/topics/README.md
idaibin/feeds-hub/docs/card-types/README.md
idaibin/feeds-hub/docs/rules/content-format.md
```

更新任务执行：

1. 读取任务入口、主题、card type、正文格式和 UI 规则。
2. 按 `docs/topics/<category>.md` 获取主题信息和来源规则。
3. 搜索当前最新信息，审查事实、时间、来源和去重。
4. 按 `docs/card-types/README.md` 根据信息内容选择 `kind`、比例和通用海报提示词。
5. 生成事实型 Markdown。
6. 组合 card type 提示词、topic 提示词和事件事实，按 WebP、PNG、SVG 优先级生成或更新主封面。
7. 执行 `pnpm run validate:feeds`、`pnpm run check`、`pnpm run build`；不能本地执行时等待 CI / Vercel。
8. 按规范提交到指定内容分支或生产分支。

## 内容结构

```text
src/content/
├── worldcup/
├── lol/
├── stock/
├── ai/
├── global/
├── rust/
└── product/
```

每条内容使用 Markdown，`reviewed: true` 才会展示。

封面图存放在：

```text
public/images/<category>/<file>.<webp|png|svg>
```

页面和 frontmatter 中的 `cover` 使用：

```text
/images/<category>/<file>.<webp|png|svg>
```

当前仓库的自动化执行细节见：

```text
docs/automation/feeds-hub-update.md
docs/topics/README.md
docs/card-types/README.md
docs/rules/content-format.md
docs/rules/ui-spec.md
```

通用执行规范见：

```text
idaibin/aicraft/docs/standards/github-branching.md
idaibin/aicraft/docs/standards/ai-content-quality.md
```

## 部署

推荐使用 Vercel 部署。

```text
Framework Preset: Astro
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

合并到默认分支后，Vercel 会根据 GitHub 推送自动部署。
