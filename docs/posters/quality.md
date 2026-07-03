# Poster Quality

本文件定义已生成海报的质量检查规则。主题级视觉语义仍以 `docs/posters/<category>.md` 为准；尺寸、比例和类型映射以 `docs/posters/type-matrix.md` 为准。

## 必须满足

- 文件格式必须为 WebP。
- frontmatter `cover` 必须使用 `/images/<category>/<file>.webp`。
- 物理文件必须存在于 `public/images/<category>/<file>.webp`。
- 图片比例必须匹配 `docs/posters/type-matrix.md` 对当前 `category + kind` 的规则。
- 允许比例只有 `16:9`、`4:5`、`4:3`。
- 禁止使用 `1:1` 作为 feed 主封面。
- `16:9` 推荐尺寸为 `1600x900`，最低 `1280x720`。
- `4:5` 推荐尺寸为 `1440x1800`，最低 `1120x1400`。
- `4:3` 推荐尺寸为 `1600x1200`，最低 `1280x960`。
- 图片必须与当前 feed 的 `category`、`kind` 和 `topic` 相关。
- 每条 feed 必须单独生成海报，禁止把同一张通用模板图批量复用到多条 feed。
- 图片只表达主题、场景和氛围，不承载未经 feed 明确提供的精确事实。

## 禁止

- 1x1、透明、空白、纯色占位图。
- 与事件无关的通用科技图、通用体育图或通用金融图。
- 同一张图片批量复用到多条不同 feed。
- 多事件拼图，除非 `worldcup_feed` 明确要求同一比赛日或同一阶段结构化汇总。
- PPT 风大字海报。
- 依赖图片内文字承载比分、时间、日期、来源、公司名、队伍名、股票价格或政策编号。
- 伪造 logo、官方标志、队标、公司标识或政府印章。
- 左上角 Feeds Hub logo、Feeds Hub wordmark、Feeds Hub 品牌角标。
- 右上角主题、分类、来源或状态标签。
- 投资建议、胜负预测、确定性收益或保证结果的视觉表达。

## 自动验证

`pnpm run validate:feeds` 必须检查：

```text
frontmatter 必填字段
category / kind 合法性
cover 路径
是否存在 docs/posters/<category>.md
是否存在 public/images/<category>/<file>.webp
WebP 可读性
WebP 宽高
WebP 比例是否匹配 category + kind
最低尺寸是否达标
```

人工审查已生成图片时需要确认：

```text
1. 是否与 feed 主题相关。
2. 是否有明显错误文字。
3. 是否出现伪 logo 或伪官方元素。
4. 是否把正文事实错误地画进图片文字。
5. 是否出现左上角 Feeds Hub logo、Feeds Hub 品牌角标或右上角主题标签。
6. 是否符合对应 docs/posters/<category>.md 的主题风格。
7. 是否符合 docs/posters/type-matrix.md 的 ratio 和 type prompt。
8. 是否存在通用模板图复用问题。
```

## 失败处理

如果海报不满足规则：

1. 不提交该内容。
2. 重新按当前 feed 的 `category + kind + topic + facts` 生成 WebP 主封面。
3. 确认生成结果符合主题规则和 type matrix。
4. 再执行 `pnpm run validate:feeds`、`pnpm run check` 和 `pnpm run build`。
