# Source Guidelines

本目录维护 Feeds Hub 各主题的信息来源策略。它只负责信息获取、来源可信度、搜索方式和热度判断，不负责正文格式、UI 或海报视觉。

## 执行顺序

自动更新任务处理每个主题前，应按顺序读取：

```text
docs/topics/<category>.md
docs/sources/<category>.md
docs/editorial/content-format.md
```

如果需要生成海报，再读取：

```text
docs/posters/<category>.md
```

## 来源分级

### Level 1：优先来源

可作为主要事实依据：

- 官方网站
- 官方公告
- 监管或机构文件
- 赛事官方赛程、赛果或公告
- 公司博客、产品文档、release note
- GitHub release、仓库提交、issue、security advisory
- 论文、模型卡、标准文档

### Level 2：可信媒体和数据源

可作为补充事实依据：

- Reuters、AP、BBC、Financial Times、Wall Street Journal、Bloomberg、Nikkei、The Guardian 等 established reporting
- ESPN、BBC Sport、The Athletic 等体育报道
- Leaguepedia、Liquipedia 等结构化赛事资料站
- 行业媒体、工程博客、产品媒体，前提是能追溯到公开事实

### Level 3：参考热度来源

只用于判断热度，不单独作为事实依据：

- 社交平台讨论
- Hacker News、Reddit、社区论坛
- GitHub stars、forks、issue 活跃度
- 搜索趋势、榜单、转发量、评论量
- KOL 观点或播客摘要

Level 3 只能辅助判断热度，不能替代事实核查。

## 禁止来源

默认禁止作为事实依据：

- 无原始链接的搬运号
- 标题党聚合站
- AI 生成摘要站
- 无来源截图
- 只给结论不提供上下文的社交帖
- 付费墙后无法核验的二手转述
- 明显广告软文
- 内容农场

## 热度和写入判断

热度只用于辅助排序和是否进入信息流，不用于正文解释。

### 赛事类

`worldcup`、`lol` 判断：

- 是否为赛程、赛果、晋级、淘汰、阵容、规则或官方节点
- 是否接近比赛时间
- 是否涉及下一场、下一轮或分组形势
- 是否为当前赛事周期内用户关注主题

赛事类正文只写事实、当前状态和后续节点。

### 新闻、技术、市场、产品类

`stock`、`ai`、`global`、`rust`、`product` 判断：

- 事实新鲜度
- 来源可信度
- 主题相关性
- 网络讨论热度
- 是否有明确公开事实或待确认信息

正文只写事实、当前状态和待确认信息。股市主题可以补充市场情绪，如上涨、下跌、分化、震荡、偏热或偏冷。

## 搜索基本要求

每个候选事件至少满足：

1. 有一个可追溯来源。
2. 能确定事件时间或发布时间。
3. 能归入一个明确 `category`。
4. 能归入一个明确 `kind`。
5. 不与最近内容重复。

## 多来源处理

- 官方来源与媒体来源冲突时，优先官方来源。
- 数据源与报道冲突时，优先发布时间更近且能提供原始数据的来源。
- 社交热度高但没有事实来源时，跳过。
- 只有二手报道时，必须在正文里降低确定性表述。

## 输出到 frontmatter

来源字段使用：

```yaml
source: string
sourceUrl: string
```

规则：

- `source` 写主要事实来源名称。
- `sourceUrl` 写主要事实来源链接。
- 多来源可以在正文中补充，但 frontmatter 只保留最核心来源。
- 不要把搜索结果页、聚合页或无法核验的社交截图作为 `sourceUrl`。
