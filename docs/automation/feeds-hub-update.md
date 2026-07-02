# Feeds Hub 自动更新任务

本文件是 `Feeds Hub 更新` 自动任务的执行来源。后续自动任务每次运行时必须先读取本文件，再按本文执行。自动任务自身只保留最小 bootstrap prompt，避免任务规则分散在 ChatGPT 定时任务配置里。

## 任务元信息

- 仓库：`idaibin/feeds-hub`
- 生产分支：`main`
- 运行频率：每小时
- 时区：`Asia/Shanghai`
- 是否创建 PR：否
- 是否使用仓库 RSS / GitHub Actions 抓取：否

## 执行边界

本任务只做内容更新。

除非用户明确要求，禁止修改：

- `src/components/**`
- `src/pages/**`
- `src/lib/**`
- `docs/ui-spec.md`
- `AGENTS.md`
- 自动任务执行规范以外的文档

允许修改：

- `src/content/<category>/*.md`
- `public/images/<category>/*.webp`
- 本文件本身（仅当用户要求更新任务规则时）

## Git 提交策略

必须使用“临时分支集中提交，最后无 PR squash 到 main”。

1. 每次运行先读取最新 `main`。
2. 从最新 `main` 创建临时分支，命名为：
   - `cron-update/YYYYMMDD-HHmm`，或
   - `cron-update-YYYYMMDD-HHmm`
3. 本轮所有内容文件、封面文件、修复文件只写入临时分支。
4. 临时分支允许多个中间提交。
5. 本轮完成后，以最新 `main` 为 parent，用临时分支最终 tree 创建一个新的 main commit。
6. main 上本轮只能产生一个提交。
7. main 提交信息固定为：`content: update feeds`
8. 禁止创建 PR。
9. 禁止通过 PR merge / squash merge 合并。
10. squash 到 main 前必须重新读取最新 main；若 main 已变化，先重建最终 tree 到最新 main。
11. 如果无法安全完成“临时分支最终 tree -> main 单提交”，停止并汇报，不要逐个文件直接提交到 main。
12. 成功更新 main 后删除临时分支；工具不支持删除时，在最终汇报说明。

## 默认主题

每轮默认审查以下主题：

- `worldcup`：世界杯 2026
- `lol`：LOL 赛事
- `stock`：股市简报
- `ai`：AI 科技
- `global`：全球重点简报
- `rust`：开源与 Rust 工程
- `product`：创业与产品设计

## 世界杯强制规则

每次运行必须首先检查世界杯。

检查范围：

- 过去 12 小时内已完成比赛
- 当前正在进行比赛
- 未来 24 小时内即将开始比赛

可靠来源优先级：

1. FIFA 官方赛程 / 官方比赛状态
2. 可靠体育数据源
3. Reuters / AP / ESPN / The Guardian 等可靠报道

只要存在上述任一比赛，就不能跳过世界杯主题。

每轮世界杯最多写 3 条，优先级为：

1. 已完赛
2. 正在进行
3. 未来 24 小时赛程

## 世界杯 kind 规则

### `match_result`

用于已结束比赛。

必须包含：

- 双方
- 比分
- 状态：全场结束 / 加时 / 点球
- 晋级或出局影响

标题示例：

```text
比利时 3-2 塞内加尔，32强淘汰战过关
```

eventKey：

```text
worldcup:match_result:<gameId 或 双方>:<eventAt>
```

### `match_schedule`

用于未开始比赛。

必须包含：

- 双方
- 开球时间
- 阶段
- 状态：即将开始 / 今晚开赛 / 明日进行

标题示例：

```text
美国 vs 波黑，08:00 开球
```

eventKey：

```text
worldcup:match_schedule:<gameId 或 双方>:<eventAt>
```

### `hot_topic`

用于人物故事、赛后焦点、关键事件。

要求：

- 单一人物或单一事件
- 不堆比分和赛程
- 不与 match_result / match_schedule 重复

## 其他主题规则

其他主题没有可靠新增事实时可以跳过。

但禁止因为以下原因跳过内容更新：

- “没有 UI 变更”
- “没有模板升级”
- “只是规则没有变化”

每条 feed 只表达一个核心事件。

## 路径规则

内容写入：

```text
src/content/<category>/<yyyy-mm-dd>-<slug>.md
```

主封面写入：

```text
public/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

frontmatter `cover` 使用：

```text
/images/<category>/<yyyy-mm-dd>-<slug>.webp
```

禁止使用：

- `src/content/feeds/**`
- `/images/feeds/**`
- `cover` 里带 `public`

## Frontmatter 必填字段

每条 Markdown 必须包含：

```yaml
title: string
subtitle: string
category: worldcup | lol | stock | ai | global | rust | product
kind: match_result | match_schedule | hot_topic | market_brief | policy_update
topic: string
date: ISO datetime
eventAt: ISO datetime
eventKey: string
cover: string
tags: string[]
summary: string
source: string
sourceUrl: string
reviewed: true
priority: number
```

## 去重规则

发布前必须依次检查：

1. `eventKey` 是否已存在
2. 规范化后的 `sourceUrl` 是否已存在
3. 最近 7 天同 `category`、`kind`、核心主体、`eventAt` 是否重复
4. 标题是否只是旧内容改写

世界杯赛程和赛果必须使用 gameId 或“双方 + 开球时间”作为核心去重键。

同一场比赛的 `match_schedule` 与 `match_result` 不是重复：可以先发赛程，完赛后再发赛果。

## 文案规则

海报只表达：

- 主题
- 关键事实
- 2 到 3 个短标签

卡片文案负责补充：

- title：一句话讲清事件
- subtitle：补充角度，不重复 title
- summary：60 到 100 个中文字符，补充背景、影响或后续观察

禁止：

- 海报与卡片文案重复
- 页面可见文案出现“类型：”“关键词：”“这条只讲”等内部编辑描述
- 一个 feed 塞多个事件

## 封面规则

默认生成 WebP。

如果无法生成真实 WebP：

- 可使用现有分类默认图或模板图
- 但 `cover` 路径必须可访问
- 禁止因封面生成失败跳过可靠世界杯赛程 / 赛果
- 最终汇报必须说明封面是否为占位或模板

## 发布前校验

提交前必须检查：

- frontmatter 完整
- cover 路径正确
- sourceUrl 可信
- Markdown 不含内部编辑说明
- 没有重复内容
- 文件路径符合规范

若环境可执行，运行：

```bash
pnpm run check
pnpm run build
```

不可执行时，在最终汇报中说明。

## 最终汇报格式

每轮最终汇报必须包含：

- 世界杯检查结果
- 更新主题
- 跳过主题和原因
- 新增 feed 数量
- cover 路径
- 临时分支名
- main 提交数量
- main commit sha
- 临时分支是否删除
- 是否创建 PR：必须为否
