# Feeds Hub

中文主题信息流网站，用于聚合世界杯、LOL 赛事、股市简报和 AI 科技动态。

## 功能

- Astro 静态站点。
- 中文信息流首页。
- Card 展示：图片、标题、副标题、分类、时间。
- 分类页：世界杯、LOL、股市简报、AI 科技。
- 详情页：海报、摘要、正文、来源。
- GitHub Actions 每小时同步一次。
- 每一类主题独立审查，没有有效内容则跳过。
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
npm install
npm run dev
```

## 构建检查

```bash
npm run check
npm run build
```

## 手动同步信息流

```bash
npm run update:feeds
```

只检查不写入：

```bash
npm run update:feeds:dry
```

## 数据源配置

数据源位于：

```text
src/data/topic-sources.json
```

每个主题可以配置多个 RSS 数据源。同步脚本会逐类执行：

1. 获取公开信息。
2. 生成候选内容。
3. 按分类关键词、来源链接、标题长度、摘要长度、重复内容进行审查。
4. 审查通过后写入 Markdown 和 SVG 海报。
5. 没有有效内容则跳过，不产生空提交。

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
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

合并到默认分支后，Vercel 会根据 GitHub 推送自动部署。
