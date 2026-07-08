# Realtime Type Rules

用于实时类 topic：`ai`、`github`、`compute`、`rust`、`dev`、`security`、`product`。

## Scope

- 1 feed = 1 个 release、政策、公司更新、advisory、incident、产品变化或市场相关事实。
- 默认重点：`ai`、`github`；sports 由 `sports.md` 先处理，`stock` 使用 `scheduled-market.md`。
- 默认每个 topic 1-3 条高质量 feed。

## Source

- 硬事实必须来自 topic 配置的 primary / secondary sources。
- Reddit、X、论坛只用于反应、背景、情绪、接受度。
- 官方 X 只在账号明确官方且记录 URL 时作为声明来源。
- 来源无法确认就跳过。

## Freshness

- 每轮报告 added / skipped / pending-source。
- 优先任务窗口内最新可核验事件。
- 只有出现新状态、版本、政策、披露或可用性变化时才写新 feed。

## GitHub Signals

- 优先 GitHub Search/API/Trending、repo、releases/tags、advisories、README、changelog。
- star、release、advisory 不能只靠第三方榜单确认。
- AI repo 优先。

## AI Signals

- 可写模型/产品、研究、工程工作流、prompt 技巧、工具案例。
- AI topic 按 OpenAI、Anthropic、Google Gemini、智谱 GLM、阿里 Qwen、月之暗面 Kimi、DeepSeek、Nvidia/AI 芯片链顺序优先检查。
- 必须绑定官方文档、cookbook、论文、GitHub、产品页、release note 或权威报道。
- 不写无来源技巧。
