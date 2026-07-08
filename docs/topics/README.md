# Topics

Topic 文件只定义机器可读配置和少量主题特例。通用生成规则放在 `docs/types/`，内容格式放在 `docs/rules/content-format.md`。

## 通用规则

- 默认先处理赛事 `lol`、`worldcup`，再处理 `ai`、`github`、`stock`。
- 其它历史 topic 保留内容和路由，默认不自动生成。
- frontmatter 是唯一机器可读配置，必须包含 `id`、`type`、`flows`、`sources`、`contentDir`、`allowedKinds`。
- topic 特例只写在 `Topic Scope` 或 `Topic Overrides`。
- Reddit / X / 社区只能补充反应和背景，不能确认硬事实。
- 赛事硬事实必须来自官方赛程、比赛中心、赛果、standings/bracket/stage 或权威通讯社。
- 默认和 topic 来源都无法确认时跳过。

## Active Event Calendar

每轮先读本表，再读对应 topic 的 `Topic Overrides`，最后打开官方来源逐场核验。日期按赛事官方当地日期；Markdown `eventAt` 使用 UTC。

| Topic | Event | Window | 必查 |
| --- | --- | --- | --- |
| `worldcup` | FIFA World Cup 2026 | 2026-06-11 to 2026-07-19 | FIFA schedule、scores-fixtures、standings/bracket、match centre |
| `lol` | MSI 2026 Daejeon | 2026-06-28 to 2026-07-12 | LoL Esports schedule、MSI news、内嵌 match data |

关键窗口：

- World Cup: Round of 16 2026-07-04 to 2026-07-07; Quarter-finals 2026-07-09 to 2026-07-11; Semi-finals 2026-07-14 to 2026-07-15; Third-place 2026-07-18; Final 2026-07-19.
- MSI: Play-In 2026-06-28 to 2026-07-01; Bracket 2026-07-03 to 2026-07-06 and 2026-07-08 to 2026-07-12; Upper Final 2026-07-09; Lower Final 2026-07-11; Grand Finals 2026-07-12.

官方入口：

- FIFA schedule: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums
- FIFA scores: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures
- FIFA standings: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings
- LoL Esports schedule: https://lolesports.com/en-GB/leagues/first_stand%2Cmsi%2Cworlds
- MSI update: https://lolesports.com/en-GB/news/msi-and-worlds-updates

## Files

- Active: `ai.md`, `github.md`, `stock.md`, `lol.md`, `worldcup.md`
- Historical: `compute.md`, `global.md`, `rust.md`, `dev.md`, `security.md`, `product.md`

## Shape

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
allowedKinds: []
---
```
