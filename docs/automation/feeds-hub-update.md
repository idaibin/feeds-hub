# Feeds Hub Update

AI 更新任务唯一入口。本文只定义任务计划、topic 遍历、分支生成、写入、验证、合并和清理流程；topic、正文、海报图片和 UI 规则引用对应文档。

## Scope

- Topic YAML 配置：`docs/topics/*.md`。
- 信息类型规则：`docs/types/*.md`。
- Feed Markdown frontmatter、标题、摘要和正文格式：`docs/rules/content-format.md`。
- 海报 profile 选择、图片比例、WebP、pending cover、视觉层级、质量门槛和图片失败处理：`docs/posters/README.md`、`docs/posters/visual-hierarchy.md`、`docs/posters/quality-gate.md`；具体提示词看 `docs/posters/<profile>.md`。
- 页面和组件展示：`docs/rules/ui-spec.md`。

不要把 topic、type、poster、正文、frontmatter schema 或 UI 细节复制到本文。

## Schedule

- 每轮任务从当前 `origin/main` 开始。
- 分支名使用 `content/feeds-hub-update-<yyyyMMdd-HHmm>`。
- 同一轮任务只使用一个内容分支。
- 如果同名分支已存在，先读取该分支最新 `HEAD`，在其基础上继续，不覆盖已有提交。
- 无合格内容时不创建空提交。

## Execution Flow

1. 读取 `origin/main`、当前远端内容分支和工作流状态。
2. 创建或继续 `content/feeds-hub-update-<yyyyMMdd-HHmm>`。
3. 读取并遍历全部 `docs/topics/*.md` topic 配置，排除 `README.md`；不得依赖本文手写列表。
4. 对每个 topic 按 frontmatter 的 `flows` 读取 `docs/types/<flow>.md`，再按 `sources` 获取公开、可核验信息；无合格信息也必须记录跳过原因。
5. 按 `eventKey` 和现有 `src/content/<category>/` 内容去重，`sourceUrl` 只作为辅助线索；赛事 stage/standings 页面可能包含多场比赛，不得仅因同一 `sourceUrl` 跳过新的赛程、进行中状态或赛果。
6. 按 `docs/rules/content-format.md` 生成 Markdown。
7. 先写入已核验文本 Markdown；再按 `docs/posters/README.md` 选择 poster profile，按 `docs/posters/visual-hierarchy.md` 压缩视觉层级，再按 `docs/posters/<profile>.md` 尝试生成 WebP；最后按 `docs/posters/quality-gate.md` 决定 `coverStatus`。
8. 写入本轮实际产物。
9. 读取本轮写入的 Markdown 和 WebP，确认路径、frontmatter、`coverStatus`、图片尺寸、视觉质量和去重结果。
10. 验证通过后将本轮内容分支 squash 合并到 `main`。
11. 推送 `main`。
12. 删除已合并的本轮内容分支，并刷新远端分支列表。

Topic 配置必须 fail-closed：任一 topic 缺少 `id`、`type`、`flows`、`sources`、`contentDir`、`coverPrefix` 或 `allowedKinds`，`flows` 指向不存在的 `docs/types/<flow>.md`，或 `allowedKinds` 为空时，停止本轮任务并报告配置错误。不要根据旧表、目录名、已有内容或通用经验推断缺失规则。

## GitHub Write Flow

使用 GitHub connector 写入时，采用 blob/tree/commit/ref 流程：

1. 读取目标分支最新 `HEAD` commit 和 tree。
2. Markdown 写入 `src/content/<category>/<yyyy-mm-dd>-<slug>.md`。
3. WebP 写入 `public/images/<category>/<yyyy-mm-dd>-<slug>.webp`。
4. 删除本轮替换掉的同名旧 `.svg` 或 `.png`，如存在。
5. 用 `GitHub.create_blob` 创建 Markdown 和 WebP blob；WebP 使用 base64，且禁止 `data:image/webp;base64,` 前缀。
6. 用 `GitHub.create_tree` 写入本轮实际产物。
7. 用 `GitHub.create_commit` 创建提交，parent 为目标分支最新 `HEAD`。
8. 用 `GitHub.update_ref` 更新 `refs/heads/content/feeds-hub-update-<yyyyMMdd-HHmm>`。
9. 重新读取本次变更的 Markdown 和 WebP 验证。

Markdown 和图片允许分步提交。图片生成失败或暂未生成时，Markdown 可先以 `coverStatus: "pending"` 写入；后续补图提交必须同时写入 WebP 并把对应 Markdown 更新为 `coverStatus: "generated_webp"`。

`coverStatus: "generated_webp"` 只能在实际打开图片验收通过后写入。只检查文件存在、路径匹配或二进制格式不够；必须确认图片遵循对应 `docs/posters/<profile>.md`，且没有提示词、规格说明、模板占位词、重复 fallback 或错误 profile 的可见痕迹。

## Merge Flow

自动任务生成分支后，最终交付以 `main` 为准：

1. 确认内容分支产物验证通过。
2. 确认 `main` 与 `origin/main` 同步。
3. 将内容分支 squash 成一个提交合入 `main`。
4. 合并提交信息使用内容批次语义，例如 `content: update feeds 20260705-0800`。
5. 推送 `main`。
6. 删除对应远端内容分支。
7. 执行 `git fetch --prune` 后再次确认远端分支状态。

若多条自动分支同时存在，按时间顺序逐条验证、去重、合并；不得盲目批量 merge。

## Failure Handling

任一步无法可靠完成时：

- 不推送 `main`。
- 不创建 PR。
- 不写入 SVG/PNG fallback。
- 不写入 data URL 前缀。
- 不把可见提示词、规格标签、模板占位图、重复 fallback 或错误比例/错误 profile 图片标记为 `generated_webp`。
- 已生成但未验证的内容保留在内容分支，不合并到 `main`。
- 汇报失败点、受影响 topic、分支名和已完成验证。

## Report

每轮说明：

- 任务计划和分支名。
- 遍历 topic。
- 每个 topic 的 `flows`、来源检查结果和跳过原因。
- 新增、跳过、待补项。
- 每条新增 feed 的 `source`、`sourceUrl`、`eventAt`、`eventKey`、`cover`、`coverStatus`。
- 每条生成图片的 `posterProfile`、尺寸、视觉验收结论、质量门槛结论；失败时说明为什么保持 `pending`。
- 写入提交。
- 产物验证结果。
- squash 合并结果。
- `main` 推送结果。
- 已删除或保留的内容分支。
- Vercel commit status，若适用。
