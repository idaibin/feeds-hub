# 进度记录

更新时间：2026-07-02T17:05:00+08:00

## 已完成

- 初始化 Astro 中文信息流网站。
- 添加世界杯、LOL、股市简报、AI 科技四个默认主题。
- 添加首页、分类页、详情页。
- 新增 Feeds Hub 自动更新规范。
- 优化页面样式、Card 样式和移动端布局。
- 首页 `/` 默认展示全部信息，按发布时间倒序排列。
- 主题页 `/category/<category>/` 仅展示当前主题内容。
- 移除页面中的重复主题筛选组件和数量徽标。
- 移除首页 Hero、统计卡和说明文案，页面直接进入内容列表。
- 将内容区改为瀑布流布局：桌面三列、平板两列、手机一列。
- Card 改为消息卡片：顶部海报 banner，下面直接展示标题、时间、摘要和标签。
- 已将 4 条初始化占位内容替换为真实信息流内容。
- 已为 4 条信息分别更新高度相关 SVG 海报。
- 已更新 ChatGPT 自动任务规则：每条信息必须按当时信息、网络热度和主观编辑判断生成海报。
- 新增信息拆分规则：`docs/feed-splitting.md`。
- 已将多重点内容拆分为 10 条独立 feed，每条包含独立标题、`kind`、摘要、来源和海报。
- 已验证 `kind` 字段、拆分内容、SVG 海报和分类页渲染。
- 已将后续规则调整为 WebP 主封面优先，SVG 仅作为兜底或纯信息图。
- 已将新内容路径规则调整为 `src/content/<category>/...`。
- 已将新图片路径规则调整为 `public/images/<category>/...`，页面引用使用 `/images/<category>/...`。
- 已完成历史 Markdown 迁移：旧 `feeds` 中间目录已移除，历史内容统一迁入 `src/content/<category>/...`。
- 已完成历史海报迁移：旧 SVG 海报已转换为 WebP，并统一迁入 `public/images/<category>/...`。
- 已将页面 fallback 海报路径调整为 `/images/<category>/init.webp`。
- 顶部导航改为读取 `CATEGORIES`，避免新增分类后导航遗漏。

## 当前内容

- 世界杯比赛结果：墨西哥 2-0 厄瓜多尔，晋级世界杯 16 强。
- 世界杯球员热点：Gilberto Mora 获得阿兹特克主场关注。
- 世界杯球员热点：Julián Quiñones 从归化前锋到晋级符号。
- LOL 赛事安排：2026 MSI 入围赛收官，1 个正赛名额待定。
- LOL 队伍关注：Gen.G 卫冕背景，BLG 带着 FST 热度。
- 股市风险线：债券收益率、日元和就业数据影响风险偏好。
- 股市权益线：AI 半导体、韩国芯片出口和科技财报接棒。
- 股市产业线：韩国出口创近半世纪最强增速，AI 芯片需求继续外溢。
- AI 政策变化：Anthropic Fable / Mythos 解禁。
- AI 后续关注：解禁后的安全承诺和政府沟通。

## 当前设计

- 仓库只负责展示内容。
- 内容由 ChatGPT 定时写入 GitHub。
- Header 左侧保留品牌，右侧使用主题下拉。
- 首页直接展示每条消息。
- `reviewed: true` 的内容才展示。
- 新内容直接按分类写入，不再增加 `feeds` 中间目录。
- 主题关注范围维护在 `docs/topics/`。
- 主题来源策略维护在 `docs/sources/`。
- 正文事实型格式维护在 `docs/editorial/`。

## 待处理

- 正式上线前确认 Vercel 部署分支与 main 更新策略。
- 后续可继续补充热度评分、去重增强和 feed 验证脚本。

## 本地验证命令

```bash
pnpm install --store-dir /private/tmp/pnpm-store
pnpm run check
pnpm run build
```

## 验证状态

最近一次完整本地验证记录：

- `pnpm install --store-dir /private/tmp/pnpm-store`：通过，依赖已是最新。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 29 个静态页面。
- cover 文件存在性检查：通过，`src/content/<category>/*.md` 中所有 `cover` 均能在 `public/images/<category>/*.webp` 找到。
- 旧路径检查：通过，代码、文档、内容和 public 目录内无旧中间目录或 SVG 路径引用。

## 2026-07-02 响应式信息流布局验证

- 分支：`fix/responsive-feed-layout`
- 审查结论：该分支原方案按横图和竖图分流展示；最终合入 main 时已按最新要求统一为 16:9 横图，不保留旧竖图比例或按图片方向分流的逻辑。
- `pnpm install`：非 TTY 环境下被 pnpm 清理确认拦截；`CI=true pnpm install` 复跑通过，依赖已是最新。
- `pnpm run check`：`CI=true pnpm run check` 通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：`CI=true pnpm run build` 通过，生成 37 个静态页面。
- 移动端布局验证：单列瀑布流保持默认卡片布局。

## 2026-07-02 主题文档拆分与 Header 下拉

- 分支：`feat/feeds-topic-docs`
- 新增 `docs/topics/` 主题规范文件：`worldcup.md`、`lol.md`、`stock.md`、`ai.md`、`global.md`、`rust.md`、`product.md`。
- `docs/automation/feeds-hub-update.md` 已精简为仓库级执行流程，主题细节迁移到 `docs/topics/`。
- `docs/ui-spec.md` 已统一移动端优先、体验优先、WebP 图片、16:9 横图海报、真实海报资源、页面读取 `cover` 和 Header 右侧主题下拉规范。
- Header 主题切换已改为右侧下拉，选项来自 `src/lib/feeds.ts` 的 `CATEGORIES`。
- 删除旧文档：`docs/chatgpt-automation.md`。
- 同步清理 `README.md`、`docs/repo-scope.md` 和本文件中对旧文档的引用。
- `pnpm install --store-dir /private/tmp/pnpm-store`：通过，依赖已是最新。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 37 个静态页面。
- Header 下拉交互验证：通过，移动端无横向主题导航，下拉默认选中当前主题，切换到 AI 科技后进入 `/category/ai/`。
- 海报比例规范已统一为 16:9 横图，推荐尺寸 `1600x900`，最低不低于 `1280x720`，列表卡片和详情页均按该比例展示。

## 2026-07-02 主题来源策略

- 分支：`content/source-guidelines`
- 新增 `docs/sources/README.md`，定义来源分级、禁止来源、热度判断和 frontmatter 来源写入规则。
- 新增 7 个主题来源文档：`worldcup.md`、`lol.md`、`stock.md`、`ai.md`、`global.md`、`rust.md`、`product.md`。
- 赛事类主题按赛程、赛果、晋级、规则、阵容和官方节点判断是否写入。
- 非赛事主题按事实新鲜度、来源可信度、主题相关性和网络热度判断是否写入。
- `docs/automation/feeds-hub-update.md` 已要求自动任务读取对应 `docs/sources/<category>.md`。
- `README.md` 已补充来源策略入口和自动更新读取要求。
- 当前环境未执行 `pnpm run check` / `pnpm run build`。

## 2026-07-02 正文事实型格式

- 分支：`content/source-guidelines`
- 新增 `docs/editorial/README.md`。
- 新增 `docs/editorial/content-format.md`。
- 正文统一改为事实型结构：事实、当前状态、待确认信息。
- 股市主题允许补充市场情绪：上涨、下跌、分化、震荡、偏热、偏冷。
- `docs/sources/README.md` 已移除正文中的解释性结构，改为只约束来源和热度判断。
- `docs/automation/feeds-hub-update.md` 已要求生成 Markdown 前读取 `docs/editorial/content-format.md`。
- `README.md` 已补充正文格式入口和自动更新读取要求。
- 当前环境未执行 `pnpm run check` / `pnpm run build`。
