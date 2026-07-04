# Feeds Hub Update

AI 更新任务入口。本文只定义调度顺序和每轮汇报；主题、正文、海报和 UI 规则引用对应文档。

## 执行流程

1. 遍历 `docs/topics/README.md` 列出的全部主题。
2. 按主题独立获取公开、可核验信息；无合格信息则跳过该主题。
3. 按 `docs/topics/<category>.md` 和 `docs/rules/content-format.md` 生成去重后的 Markdown。
4. 按 `docs/posters/README.md` 选择 `kind`、拼装 prompt、生成或标记待补海报。
5. 按项目现有校验命令验证本轮结果。

不要把 topic、poster、正文、frontmatter schema 或 UI 细节复制到本文。

## 汇报

每轮说明：

- 遍历主题。
- 新增、跳过、待补项。
- 每条新增 feed 的 `source`、`sourceUrl`、`eventAt`、`eventKey`、`cover`、`coverStatus`。
- 校验命令结果。
- Vercel commit status，若适用。
