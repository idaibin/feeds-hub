# Feeds Hub

Feeds Hub 是一个 AI 信息自动处理流程示例，用于把信息获取、主题审查、摘要生成、海报生成、内容写入和静态发布串成一套可复用的方法。

它不是固定的信息流站点模板，而是基于 `idaibin/aicraft` 通用规范落地的短周期信息流自动化案例。你可以按自己的关注主题、信息来源、更新频率、内容格式和展示页面进行配置，用它搭建属于自己的信息处理入口。

## 项目定位

- 提供一个短周期 AI 信息流自动化产品 / 示例站。
- 支持按主题拆分信息流，避免不同内容混在一起。
- 通过审查、摘要和结构化写入，降低信息噪音。
- 使用静态站点承载结果，方便部署、访问和长期沉淀。
- 通用 Prompt、Skill、Workflow 和自动化规范由 `idaibin/aicraft` 维护。

## 仓库边界

```text
aicraft = 源能力、源规范
blog = 长文内容发布
feeds-hub = 短周期信息流自动化
```

详见：

```text
docs/repo-scope.md
docs/automation/feeds-hub-update.md
docs/topics/README.md
docs/sources/README.md
docs/editorial/README.md
```

## 功能

- Astro 静态站点。
- 中文信息流首页。
- Card 展示：图片、标题、副标题、分类、时间。
- 分类页：世界杯、LOL、股市简报、AI 科技、全球重点、开源与 Rust、创业与产品设计。
- 详情页：海报、摘要、正文、来源。
- 内容更新由 ChatGPT 自动任务执行，不在仓库内配置 RSS 抓取任务。
- 每一类主题由 ChatGPT 更新前独立审查，没有有效内容则跳过。
- 每一类主题有独立来源策略，维护在 `docs/sources/<category>.md`。
- 正文采用事实型格式，维护在 `docs/editorial/content-format.md`。
- WebP 主封面默认由 ChatGPT 生成，保存到 `public/images/<category>`，页面引用路径使用 `/images/<category>/...`。
- 前端展示 frontmatter `cover` 指向的 16:9 横图海报；推荐尺寸 `1600x900`，最低不低于 `1280x720`。CSS 只负责尺寸和裁切，不生成替代海报。

## 默认主题

| 分类 | 说明 |
|---|---|
| 世界杯 | 默认关注 2026 世界杯，后续按年份扩展。 |
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
pnpm run check
pnpm run build
```

## ChatGPT 自动更新模式

本仓库只负责展示处理后的结果。信息获取、审查、摘要、海报生成和 GitHub 写入由 ChatGPT 自动任务完成。

ChatGPT 定时任务只保留 bootstrap prompt。具体执行时必须先读取：

```text
idaibin/aicraft/docs/standards/cron-automation.md
idaibin/aicraft/docs/standards/github-branching.md
idaibin/aicraft/docs/standards/ai-content-quality.md
idaibin/feeds-hub/docs/repo-scope.md
idaibin/feeds-hub/docs/automation/feeds-hub-update.md
idaibin/feeds-hub/docs/ui-spec.md
idaibin/feeds-hub/docs/topics/README.md
idaibin/feeds-hub/docs/sources/README.md
idaibin/feeds-hub/docs/editorial/README.md
```

自动任务应执行：

1. 读取主题规则、来源规则和正文格式规则。
2. 搜索当前最新信息。
3. 按主题分别审查。
4. 按来源等级、事实新鲜度和网络热度判断是否写入。
5. 没有有效内容时跳过对应主题。
6. 有有效内容时写入事实型 Markdown。
7. 使用 ChatGPT 图片生成能力生成或更新对应 WebP 主封面。
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

## 静态资源路径

仓库物理文件：

```text
public/images/<category>/<file>.webp
```

页面和 frontmatter 中的 `cover`：

```text
/images/<category>/<file>.webp
```

`public` 不写入 `cover`，也不再使用旧的中间图片目录。

海报必须是真实图片资源，不能使用 1x1、透明、空白或纯占位 WebP 代替。

## Vercel 部署

推荐在 Vercel 控制台导入 GitHub 仓库。配置如下：

```text
Framework Preset: Astro
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

合并到默认分支后，Vercel 会根据 GitHub 推送自动部署。
