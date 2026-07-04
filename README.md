# Feeds Hub

AI-powered information hub built with Astro.

Feeds Hub 把公开信息搜索、主题筛选、事实核验、去重、结构化 Markdown、可选 WebP 海报和静态站点发布串成一套可复制流程。仓库只保存展示层和处理后的 feed 内容；通用 Prompt、Skill、Workflow 和共享自动化规范由 [`idaibin/aicraft`](https://github.com/idaibin/aicraft) 维护。

## 用途

- 个人 AI 新闻入口
- 股市、科技、开源或产品简报
- 世界杯、LOL 等赛事追踪
- 团队内部信息看板
- 自定义主题信息流站点

## 文档入口

| 文件 | 负责 |
|---|---|
| `docs/rules/repo-scope.md` | 仓库边界和允许修改路径 |
| `docs/automation/feeds-hub-update.md` | AI 更新任务入口 |
| `docs/topics/README.md` | 主题列表和主题文档格式 |
| `docs/topics/<category>.md` | 单主题范围、来源、跳过条件 |
| `docs/card-types/README.md` | `kind` 选择和通用海报提示词 |
| `docs/rules/content-format.md` | frontmatter、标题、摘要、正文格式 |
| `docs/rules/poster-spec.md` | WebP 海报、GitHub 写入、pending cover |
| `docs/rules/ui-spec.md` | 页面、card、详情页和图片展示规则 |

## 默认主题

| 分类 | 说明 |
|---|---|
| `worldcup` | 世界杯赛程、进程、赛果和单场事件 |
| `lol` | LOL 赛事赛程、进程、赛果、阵容和规则 |
| `stock` | 股市、宏观、财报、监管和板块简报 |
| `ai` | AI 模型、产品、论文、工具、政策和公司动态 |
| `global` | 全球范围高信号公共事件 |
| `rust` | Rust、开源、工具链、crate、RFC 和安全公告 |
| `product` | 创业、产品设计、增长、定价、平台和商业化 |

## 更新流程

完整执行规则见 `docs/automation/feeds-hub-update.md`。核心顺序：

```text
topics -> sources -> dedupe -> kind -> markdown -> optional webp -> validation
```

必要原则：

- 1 feed = 1 event。
- 信息生成优先于图片生成。
- 无法生成合规 WebP 时，保留内容并设置 `coverStatus: "pending"`。
- 海报只允许 WebP，禁止 SVG/PNG 主封面。
- 图片写入 GitHub 必须按 `docs/rules/poster-spec.md` 的 blob/tree/commit/ref 流程。

## 内容结构

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

frontmatter 中的 `cover` 使用站点路径：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

`reviewed: true` 的内容才会展示。

## 本地运行

```bash
pnpm install
pnpm run dev
```

## 校验

```bash
pnpm run validate:feeds
pnpm run check
pnpm run build
```

## 部署

推荐 Vercel：

```text
Framework Preset: Astro
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```
