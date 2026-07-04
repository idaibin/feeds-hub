# Feeds Hub Update

AI 更新任务入口。本文只定义执行顺序；内容格式、主题、card type、海报和 UI 规则引用对应文档。

## 读取顺序

1. `docs/topics/README.md`
2. `docs/topics/<category>.md`
3. `docs/card-types/README.md`
4. `docs/rules/content-format.md`
5. `docs/rules/poster-spec.md`
6. `docs/rules/ui-spec.md`
7. `src/content.config.ts`

## 输出路径

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

frontmatter `cover`：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

`date` 是写入时间。`eventAt` 是来源标注的事件时间或新闻发布时间；新增内容优先保存 UTC ISO datetime（`Z` 后缀），页面按 `Asia/Shanghai` 渲染。

## 执行流程

1. 遍历 `docs/topics/README.md` 列出的全部主题。
2. 按主题独立获取公开、可核验信息。
3. 跳过无来源、低价值、重复或不符合主题条件的信息。
4. 为有效信息选择 `kind`。
5. 生成符合 `docs/rules/content-format.md` 的 Markdown。
6. 用 `eventKey` 和现有内容去重；重复 `sourceUrl` 只作为复核线索。
7. 优先写入准确、不重复、来源可核验的 Markdown。
8. 当前环境具备图片生成和 WebP 二进制写入能力时，按 `docs/rules/poster-spec.md` 生成并写入海报。
9. 无法生成或写入合规 WebP 时，设置 `coverStatus: "pending"`，不得阻断内容写入。

## GitHub WebP 写入

真实海报写入必须执行 `docs/rules/poster-spec.md` 的 GitHub Connector Flow。关键约束：

- 目标仓库：`idaibin/feeds-hub`。
- 目标分支：`content/<task-name>`。
- 不修改 `main`。
- 不创建 PR。
- WebP blob 使用纯 Base64，禁止 `data:image/webp;base64,` 前缀。
- 原始生成高清尺寸，最终 WebP 小于等于 `300 KB`。
- Markdown、WebP、旧 SVG/PNG 删除放入同一个 tree 和同一个 commit。
- 提交后读取 Markdown 和 WebP 验证，并查询 Vercel commit status。

## 边界

- 一条 feed 只表达一个事件。
- 赛事内容必须覆盖当前可核验状态：预告前瞻、比赛进程或结果。
- 信息生成优先于图片生成。
- 禁止写入 PNG/SVG 主封面或 fallback。
- 禁止把 topic、card type、正文、frontmatter schema 或 UI 细节复制到本文。

## 汇报

每轮说明：

- 遍历主题。
- 新增、跳过、待补项。
- 每条新增 feed 的 `source`、`sourceUrl`、`eventAt`、`eventKey`、`cover`、`coverStatus`。
- 校验命令结果。
- Vercel commit status，若适用。
