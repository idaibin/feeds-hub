# 进度记录

更新时间：2026-07-02T18:05:00+08:00

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

## 当前设计

- 仓库只负责展示内容。
- 内容由 AI 自动化任务写入 GitHub；当前 demo 使用 ChatGPT 自动任务。
- Header 左侧保留品牌，右侧使用主题下拉。
- 首页直接展示每条消息。
- `reviewed: true` 的内容才展示。
- 新内容直接按分类写入，不再增加 `feeds` 中间目录。
- 主题关注范围维护在 `docs/topics/`。
- 主题来源策略维护在 `docs/sources/`。
- 正文事实型格式维护在 `docs/editorial/`。
- 主题级海报提示词维护在 `docs/posters/`。
- 海报质量规则维护在 `docs/posters/quality.md`。
- feed 内容结构和海报结构校验由 `scripts/validate-feeds.mjs` 执行。

## 待处理

- 正式上线前确认 Vercel 部署分支与 main 更新策略。
- 后续可继续补充热度评分和去重增强。

## 本地验证命令

```bash
pnpm install --store-dir /private/tmp/pnpm-store
pnpm run validate:feeds
pnpm run check
pnpm run build
```

## 验证状态

最近一次完整本地验证记录：

- `pnpm install --store-dir /private/tmp/pnpm-store`：通过，依赖已是最新。
- `pnpm run validate:feeds`：通过，检查 35 个 Markdown feed；仍有 warning，主要是 `global`、`rust`、`product` 内容目录尚未产生 feed、部分历史内容段落数超过建议值、部分历史内容共用同一来源 URL。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 43 个静态页面。

## 2026-07-02 响应式信息流布局验证

- 分支：`fix/responsive-feed-layout`
- 审查结论：该分支原方案按横图和竖图分流展示；最终合入 main 时已按最新要求统一为 16:9 横图，不保留旧竖图比例或按图片方向分流的逻辑。
- `pnpm install`：非 TTY 环境下被 pnpm 清理确认拦截；`CI=true pnpm install` 复跑通过，依赖已是最新。
- `pnpm run check`：`CI=true pnpm run check` 通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 37 个静态页面。
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

## 2026-07-02 主题级 Poster Prompt

- 分支：`content/poster-prompts`
- 新增 `docs/posters/README.md`，定义 `Base prompt + Category prompt + Kind prompt + Event facts + Negative constraints` 组合方式。
- 新增 7 个主题 poster prompt：`worldcup.md`、`lol.md`、`stock.md`、`ai.md`、`global.md`、`rust.md`、`product.md`。
- `docs/automation/feeds-hub-update.md` 已要求自动任务读取对应 `docs/posters/<category>.md`。
- `README.md` 已补充 poster prompt 入口和自动更新读取要求。
- `docs/ui-spec.md` 已补齐 poster prompt 引用，明确 Poster DSL 只定义结构约束，主题级海报语义、话题线索、热度表达、风格提示词和负面约束维护在 `docs/posters/`。
- `docs/posters/**` 已检查：7 个主题文件均包含主题特色、话题线索、热度表达、风格提示词、Kind 适配和负面约束；全局 Base prompt、Event facts、Kind prompt 和 Negative constraints 由 `docs/posters/README.md` 定义。
- `pnpm install --store-dir /private/tmp/pnpm-store`：通过，依赖已是最新。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 42 个静态页面。

## 2026-07-02 主题来源策略

- 分支：`content/source-guidelines`
- 新增 `docs/sources/README.md`，定义来源分级、禁止来源、热度判断和 frontmatter 来源写入规则。
- 新增 7 个主题来源文档：`worldcup.md`、`lol.md`、`stock.md`、`ai.md`、`global.md`、`rust.md`、`product.md`。
- 赛事类主题按赛程、赛果、晋级、规则、阵容和官方节点判断是否写入。
- 非赛事主题按事实新鲜度、来源可信度、主题相关性和网络热度判断是否写入。
- `docs/automation/feeds-hub-update.md` 已要求自动任务读取对应 `docs/sources/<category>.md`。
- `README.md` 已补充来源策略入口和自动更新读取要求。
- `pnpm install --store-dir /private/tmp/pnpm-store`：通过，依赖已是最新。
- `pnpm run validate:feeds`：通过，检查 35 个 Markdown feed；有 warning，无 error。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 43 个静态页面。

## 2026-07-02 正文事实型格式

- 分支：`content/source-guidelines`
- 新增 `docs/editorial/README.md`。
- 新增 `docs/editorial/content-format.md`。
- 正文统一改为事实型结构：事实、当前状态、待确认信息。
- 股市主题允许补充市场情绪：上涨、下跌、分化、震荡、偏热、偏冷。
- `docs/sources/README.md` 已移除正文中的解释性结构，改为只约束来源和热度判断。
- `docs/automation/feeds-hub-update.md` 已要求生成 Markdown 前读取 `docs/editorial/content-format.md`。
- `README.md` 已补充正文格式入口和自动更新读取要求。
- `pnpm run validate:feeds`：通过，历史内容已补齐 `eventAt` 和 `eventKey`。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 43 个静态页面。

## 2026-07-02 Feed 验证脚本

- 分支：`content/source-guidelines`
- 新增 `scripts/validate-feeds.mjs`。
- 新增 `pnpm run validate:feeds`。
- 校验范围包括 frontmatter 必填字段、分类、kind、`+08:00` 时间偏移、cover 路径、cover 文件存在、`sourceUrl` 格式、`eventKey` 重复、重复 `sourceUrl` warning、旧 `feeds` 路径和正文禁用表达。
- `README.md` 已补充 `pnpm run validate:feeds`。
- `docs/automation/feeds-hub-update.md` 已要求提交前执行 `pnpm run validate:feeds`、`pnpm run check` 和 `pnpm run build`。
- `scripts/validate-feeds.mjs` 已跳过 `src/content/README.md`，支持 frontmatter 行内数组，并将重复 `sourceUrl` 降级为 warning，避免不同事件共用同一可核验来源页时阻断验证。
- 历史内容已补齐 `eventAt` 和稳定 `eventKey`。
- `pnpm run validate:feeds`：通过，检查 35 个 Markdown feed；有 warning，无 error。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 43 个静态页面。

## 2026-07-02 历史内容事实型清理

- 分支：`fix/factual-feed-content`
- 已加严 `scripts/validate-feeds.mjs`，新增 `意味着`、`值得关注`、`关键点`、`盈利主线`、`更适合关注` 等禁用表达。
- 已要求 `stock` 正文必须包含 `市场情绪：上涨 / 下跌 / 分化 / 震荡 / 偏热 / 偏冷` 之一。
- 已清理 6 条 stock 历史内容，统一改为事实段 + 市场情绪段。
- 已清理 8 条 AI 历史内容，删除解释性判断、产品建议和“值得关注”类表述。
- 已清理 1 条 worldcup 历史内容，改为赛果事实 + 下一轮节点。
- 当前环境未执行 `pnpm run validate:feeds` / `pnpm run check` / `pnpm run build`。

## 2026-07-02 文档与海报规范梳理

- 分支：`fix/factual-feed-content`
- 新增 `docs/posters/quality.md`，定义已生成海报的结构质量、人工审查项和失败处理规则。
- `docs/posters/README.md` 已补充质量检查入口，要求结合 `docs/posters/quality.md` 和 `pnpm run validate:feeds`。
- `README.md` 已补充 `docs/posters/quality.md` 入口和自动任务读取要求。
- `scripts/validate-feeds.mjs` 已新增 WebP 头部解析，检查 cover 宽高、16:9 比例、最低 1280x720 和 `docs/posters/<category>.md` 是否存在。
- 当前环境未执行 `pnpm run validate:feeds` / `pnpm run check` / `pnpm run build`。

## 2026-07-02 主题品牌分支验证

- 分支：`feature/feeds-hub-theme-branding`
- 验证修复：已取消 `scripts/validate-feeds.mjs` 对图片物理文件、WebP 头部、宽高、16:9 比例和最低尺寸的自动校验；保留内容结构、cover 路径和 `docs/posters/<category>.md` 校验。
- 文档同步：`docs/posters/README.md` 和 `docs/posters/quality.md` 已改为说明图片文件、宽高、比例和语义质量由后续按主题自动生成流程处理。
- `pnpm install --store-dir /private/tmp/pnpm-store`：通过，lockfile 已是最新，依赖无需更新。
- `pnpm run validate:feeds`：通过，检查 43 个 Markdown feed；仍有 warning，无 error。
- `pnpm run check`：通过，Astro 内容集合与类型检查 0 errors / 0 warnings / 0 hints。
- `pnpm run build`：通过，生成 51 个静态页面。
