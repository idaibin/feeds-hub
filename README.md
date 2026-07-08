# Feeds Hub

AI-powered information hub built with Astro.

Feeds Hub 把公开信息搜索、主题筛选、事实核验、去重、结构化 Markdown 和静态站点发布串成一套可复制流程。仓库只保存展示层和处理后的 feed 内容；通用 Prompt、Skill、Workflow 和共享自动化规范由 [`idaibin/aicraft`](https://github.com/idaibin/aicraft) 维护。

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
| `docs/rules/content-format.md` | frontmatter、标题、摘要、正文格式 |
| `docs/rules/ui-spec.md` | 页面、card 和详情页展示规则 |

## 默认主题

| 分类 | 说明 |
|---|---|
| `worldcup` | 世界杯赛程、进程、赛果和单场事件 |
| `lol` | LOL 赛事赛程、进程、赛果、阵容和规则 |
| `stock` | 股市、宏观、财报、监管和板块简报 |
| `ai` | AI 模型、产品、论文、工具、政策和公司动态 |
| `compute` | AI 基础设施、芯片、HBM、数据中心、电力和云资本开支 |
| `rust` | Rust、开源、工具链、crate、RFC 和安全公告 |
| `dev` | TypeScript、Node、前端框架、运行时、云平台和开发工具 |
| `security` | CVE、安全公告、供应链风险、开源依赖和云安全事件 |
| `product` | 创业、产品设计、增长、定价、平台和商业化 |
| `global` | 全球范围高信号公共事件 |

## 更新流程

完整执行规则见 `docs/automation/feeds-hub-update.md`。核心顺序：

```text
topics -> sources -> dedupe -> kind -> markdown -> validation
```

必要原则：

- 1 feed = 1 event。
- 信息准确、可核验、去重表达优先。
- `cover` / `coverStatus` 只作 schema 兼容；`coverStatus` 固定为 `pending`。

## 内容结构

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
```

frontmatter 中的 `cover` 是历史兼容占位，不参与展示，也不要求对应文件存在。建议使用稳定站点路径：

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
