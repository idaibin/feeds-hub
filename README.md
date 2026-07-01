# Feeds Hub

中文主题信息流网站，用于展示 ChatGPT 自动任务写入的世界杯、LOL 赛事、股市简报和 AI 科技动态。

## 功能

- Astro 静态站点。
- 中文信息流首页。
- Card 展示：图片、标题、副标题、分类、时间。
- 分类页：世界杯、LOL、股市简报、AI 科技。
- 详情页：海报、摘要、正文、来源。
- 内容更新由 ChatGPT 自动任务执行，不在仓库内配置 RSS 抓取任务。
- 每一类主题由 ChatGPT 更新前独立审查，没有有效内容则跳过。
- 图片默认保存到 `public/images/feeds`。

## 默认主题

| 分类 | 说明 |
|---|---|
| 世界杯 | 默认关注 2026 世界杯，后续按年份扩展。 |
| LOL 赛事 | 支持 LPL、先锋赛、MSI、世界赛等。 |
| 股市简报 | 支持 A 股、美股、创业板、纳斯达克。 |
| AI 科技 | 支持 AI 公司、模型、开源项目、工程工具。 |

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

本仓库只负责展示内容。每小时的信息获取、审查、摘要、海报生成和 GitHub 写入由 ChatGPT 自动任务完成。

自动任务应执行：

1. 搜索当前最新信息。
2. 按主题分别审查：世界杯、LOL、股市简报、AI 科技。
3. 没有有效内容时跳过对应主题。
4. 有有效内容时写入 Markdown。
5. 生成或更新对应海报。
6. 提交到指定内容分支。

详细规则见：

```text
docs/chatgpt-automation.md
```

## 内容结构

```text
src/content/feeds/
├── worldcup/
├── lol/
├── stock/
└── ai/
```

每条内容使用 Markdown，`reviewed: true` 才会展示。

## Vercel 部署

推荐在 Vercel 控制台导入 GitHub 仓库。配置如下：

```text
Framework Preset: Astro
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

合并到默认分支后，Vercel 会根据 GitHub 推送自动部署。
