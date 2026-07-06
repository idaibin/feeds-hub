# Topics

主题文档只写 topic 配置：信息类型、信息源、允许的 `kind`、内容存储位置和海报路径前缀。信息生成规则统一放在 `docs/types/`，海报规则统一放在 `docs/posters/`。

通用规则：

- 默认控制在 8-10 个活跃主题，避免来源、去重和生成频率失控。
- `kind` 只表示内容表达方式，不在 topic 文档内写海报视觉提示词。
- topic `.md` 顶部 YAML frontmatter 是唯一机器可读配置；正文只允许简短说明，不承载规则。
- 每个 topic 必须声明 `id`、`type`、`flows`、`sources`、`contentDir`、`coverPrefix` 和 `allowedKinds`。
- `flows` 决定读取哪些 `docs/types/*.md` 信息规则；一个 topic 可以引用多个 flow，例如 `stock` 同时引用 `realtime` 和 `scheduled-market`。
- topic 独有例外必须显式写在 frontmatter 或正文的 `Topic Overrides` 小节；不能把 topic 特例藏进 automation、poster 或 UI 文档。
- 海报 profile、比例、尺寸和图片规则看 `docs/posters/README.md`，具体 prompt 看 `docs/posters/<profile>.md`。
- 正文格式看 `docs/rules/content-format.md`。
- 自动任务计划、分支创建、提交、合并和清理看 `docs/automation/feeds-hub-update.md`。
- 全局默认站点固定为 GitHub、Reuters、Reddit、X；各 topic 只配置额外搜索网站和关注内容。
- Reddit / X 不作为硬事实来源；可用于网友看法、情绪接受度、乐观/悲观倾向、使用反馈、背景信息和市场反应。
- 官方认证账号的 X 推文可作为官方声明来源，必须提供推文 URL；`sourceName` 简单标注为 `X / 账号名` 或 `官方 X`。
- 最终 `sourceUrl` 优先写 GitHub、Reuters、官方来源或 topic 额外来源中的裁决链接；Reddit / X 只在内容明确讨论社区反应且无更合适来源时作为补充链接。
- 赛事类硬事实以官方赛程、官方比赛中心、官方赛果或权威通讯社为准，包括比分、赛程、胜负、晋级、下一轮关系、阵容和官方状态。
- 赛事类通用状态、去重、正文和来源规则统一看 `docs/types/sports.md`；具体赛事 topic 文件只写来源、范围和特有差异。
- 虎扑等社区/中文赛事站用于补充选手评价、用户情绪、讨论热度和市场关注点，只能作为正文背景和海报氛围参考，不能覆盖官方硬事实。
- 默认站点和 topic 额外来源都无法确认时跳过，不临时扩展来源。
- 海报只接收最终结构化 facts，不读取原始新闻正文或来源全文。
- Markdown 和海报目标路径以 topic frontmatter 为准。

## Default Sites

| Source | Role |
| --- | --- |
| GitHub | releases, repository changes, open-source development, security advisories |
| Reuters | markets, technology, compute, global, company and policy reporting |
| Reddit | community reaction, sentiment, acceptance, optimism/pessimism, usage feedback, and background context only |
| X | official-account tweet URL when used as a statement source; otherwise discussion context only |

## Files

- `worldcup.md`
- `lol.md`
- `stock.md`
- `ai.md`
- `compute.md`
- `global.md`
- `rust.md`
- `dev.md`
- `security.md`
- `product.md`

## Topic File Shape

```yaml
---
id: topic-id
type: realtime | sports | market
flows:
  - realtime
sources:
  primary: []
  secondary: []
  supplemental: []
contentDir: src/content/<topic>/
coverPrefix: /images/<topic>/
allowedKinds: []
---
```

未指定来源时，执行者自行搜索公开、可核验来源；指定来源时优先采用。

## Type Rules

- `docs/types/realtime.md`
- `docs/types/scheduled-market.md`
- `docs/types/sports.md`
