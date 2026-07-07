# Feeds Hub Update

AI 更新任务唯一入口。本文只定义任务计划、topic 遍历、分支生成、写入、验证、合并和清理流程；topic、正文、海报图片和 UI 规则引用对应文档。

本文是仓库内自动更新流程规范，不代表创建、修改或启用 Codex App / ChatGPT / GitHub Actions 的实际定时任务。实际定时任务配置必须由用户另行确认。

## Scope

- Topic YAML 配置：`docs/topics/*.md`。
- 信息类型规则：`docs/types/*.md`。
- Feed Markdown frontmatter、标题、摘要和正文格式：`docs/rules/content-format.md`。
- 海报规则保留在 `docs/posters/`，但 main 更新流程默认隐藏海报生成；只有用户明确要求生成图片或维护 `content/generate-posters` 分支时，才读取 `docs/posters/README.md`、`docs/posters/visual-hierarchy.md`、`docs/posters/quality-gate.md` 和具体 profile。
- 页面和组件展示：`docs/rules/ui-spec.md`。

不要把 topic、type、poster、正文、frontmatter schema 或 UI 细节复制到本文。

## Schedule

- 每轮任务从当前 `origin/main` 开始。
- 内容分支名使用 `content/feeds-hub-update-<yyyyMMdd-HHmm>`。
- 图片生成分支保留为 `content/generate-posters`；该分支用于后续补图和视觉资产实验，不随 main 内容更新自动删除。
- 同一轮任务只使用一个内容分支。
- 如果同名分支已存在，先读取该分支最新 `HEAD`，在其基础上继续，不覆盖已有提交。
- 无合格内容时不创建空提交。

## Execution Flow

1. 读取 `origin/main`、当前远端内容分支和工作流状态。
2. 创建或继续 `content/feeds-hub-update-<yyyyMMdd-HHmm>`。
3. 读取并遍历全部 `docs/topics/*.md` topic 配置，排除 `README.md`；不得依赖本文手写列表。
4. 对每个 topic 按 frontmatter 的 `flows` 读取 `docs/types/<flow>.md`，再按 `sources` 获取公开、可核验信息；无合格信息也必须记录跳过原因。
5. 按 `eventKey` 和现有 `src/content/<category>/` 内容去重，`sourceUrl` 只作为辅助线索；赛事 stage/standings 页面可能包含多场比赛，不得仅因同一 `sourceUrl` 跳过新的赛程、进行中状态或赛果。
6. 对 `flows` 包含 `sports` 的 topic，先执行赛事状态覆盖：已知赛程在比赛前一天必须有 `match_schedule` 预告；比赛当天必须保留最新赛程或补充官方 `match_flow` 进度；比赛结束后必须补 `match_result`，并写明比分、胜负、晋级、淘汰和下一轮关系中已核验的部分。
7. 按 `docs/rules/content-format.md` 生成 Markdown；`source` 只写实际发布方短名，例如 `Reuters`、`FIFA`、`LoL Esports`、`GosuGamers`、`Games of Legends`、`Al Jazeera`、`SB Nation`，不要把赛事名、专题名、页面类型或多个来源拼进显示名。
8. 正文以信息准确和完整为主。来源提供更多可核验事实时，正文应补足背景、时间线、关键数据、下一步和未确认范围；不得只写短摘要，也不得用无来源推断扩写。
9. 写入已核验文本 Markdown。main 流程不生成、不验证、不展示 WebP；frontmatter 仍保留 `cover` 与 `coverStatus` 以兼容 schema，但 `coverStatus` 可保持 `pending`。
10. 读取本轮写入的 Markdown，确认路径、frontmatter、正文完整性、来源可核验性和去重结果。
11. 验证通过后将本轮内容分支 squash 合并到 `main`。
12. 推送 `main`。
13. 删除已合并的本轮内容分支，并刷新远端分支列表。

Topic 配置必须 fail-closed：任一 topic 缺少 `id`、`type`、`flows`、`sources`、`contentDir`、`coverPrefix` 或 `allowedKinds`，`flows` 指向不存在的 `docs/types/<flow>.md`，或 `allowedKinds` 为空时，停止本轮任务并报告配置错误。不要根据旧表、目录名、已有内容或通用经验推断缺失规则。

## GitHub Write Flow

使用 GitHub connector 写入时，采用 blob/tree/commit/ref 流程：

1. 读取目标分支最新 `HEAD` commit 和 tree。
2. Markdown 写入 `src/content/<category>/<yyyy-mm-dd>-<slug>.md`。
3. 用 `GitHub.create_blob` 创建 Markdown blob。
4. 用 `GitHub.create_tree` 写入本轮实际产物。
5. 用 `GitHub.create_commit` 创建提交，parent 为目标分支最新 `HEAD`。
6. 用 `GitHub.update_ref` 更新 `refs/heads/content/feeds-hub-update-<yyyyMMdd-HHmm>`。
7. 重新读取本次变更的 Markdown 验证。

Markdown 和图片分离提交。main 内容分支只负责 Markdown；图片补充必须在 `content/generate-posters` 或用户指定的图片分支中进行。图片成功后是否同步回 main 需要用户明确确认。

`coverStatus: "generated_webp"` 只能在图片分支实际打开图片验收通过后写入。main 更新流程不得因为图片缺失而阻塞文本内容发布。

## Merge Flow

自动任务生成分支后，最终交付以 `main` 为准：

1. 确认内容分支 Markdown、来源、去重和正文完整性验证通过。
2. 确认 `main` 与 `origin/main` 同步。
3. 将内容分支 squash 成一个提交合入 `main`。
4. 合并提交信息使用内容批次语义，例如 `content: update feeds 20260705-0800`。
5. 推送 `main`。
6. 删除对应远端内容分支；不得删除 `content/generate-posters`。
7. 执行 `git fetch --prune` 后再次确认远端分支状态。

若多条自动分支同时存在，按时间顺序逐条验证、去重、合并；不得盲目批量 merge。

## Failure Handling

任一步无法可靠完成时：

- 不推送 `main`。
- 不创建 PR。
- 不写入 SVG/PNG fallback。
- 不写入 data URL 前缀。
- 不在 main 内容流程中生成或验收图片。
- 已生成但未验证的内容保留在内容分支，不合并到 `main`。
- 汇报失败点、受影响 topic、分支名和已完成验证。

## Report

每轮说明：

- 任务计划和分支名。
- 遍历 topic。
- 每个 topic 的 `flows`、来源检查结果和跳过原因。
- 新增、跳过、待补项。
- 每条新增 feed 的 `source`、`sourceUrl`、`eventAt`、`eventKey`、正文补充范围和 `coverStatus`。
- 图片生成默认跳过；如用户明确要求图片分支，另行报告 `posterProfile`、尺寸、视觉验收结论和质量门槛结论。
- 写入提交。
- 产物验证结果。
- squash 合并结果。
- `main` 推送结果。
- 已删除或保留的内容分支。
- Vercel commit status，若适用。
