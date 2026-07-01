# 进度记录

更新时间：2026-07-01T00:00:00.000Z

## 已完成

- 初始化 Astro 中文信息流网站。
- 添加世界杯、LOL、股市简报、AI 科技四个默认主题。
- 添加首页、分类页、详情页。
- 添加每小时 GitHub Actions 定时同步任务。
- 添加每类主题独立审查逻辑。
- 添加自动生成 SVG 海报的基础能力。

## 待处理

- Vercel 项目需要在 Vercel 控制台导入 GitHub 仓库后启用自动部署。
- 当前默认数据源使用 Google News RSS 搜索，可在 `src/data/topic-sources.json` 中替换为更稳定的数据源。
- 自动生成海报为基础 SVG 版，后续可以升级为更精致的主题海报模板。

## 本地验证命令

```bash
npm install
npm run check
npm run build
npm run update:feeds:dry
```
