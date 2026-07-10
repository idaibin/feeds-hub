---
id: hot
type: realtime
flows:
  - realtime
sources:
  primary:
    - Weibo hot search
    - X trending
    - X search
    - V2EX latest
    - V2EX hot topics
  secondary:
    - original account posts
    - official statements
    - mainstream media follow-up
    - platform topic pages
  supplemental:
    - screenshots
    - community replies
contentDir: src/content/hot/
allowedKinds:
  - hot_topic
  - news
  - breaking
---

# Hot Topic

Uses `docs/types/realtime.md`.

## Scope

Latest public hot topics from Weibo, X, and V2EX. One feed may contain multiple related hot topics when they belong to the same hour window or the same public discussion cluster.

## Overrides

- Run at most hourly.
- Write no more than 5 `hot` feeds per Beijing calendar day.
- Prefer 1 concise hourly roundup when multiple low-depth topics are active.
- `eventKey` format: `hot:<yyyy-mm-dd>:<hour>:<slug>` for a single topic, or `hot:<yyyy-mm-dd>:<hour>:roundup` for a roundup.
- Title should name the hottest topic or write `热点简报：<main topic>` for a roundup.
- Summary writes what changed in the last hour, not a platform slogan.
- Body must separate confirmed facts from platform reaction.
- Weibo/X/V2EX can identify that a topic is hot, but cannot alone confirm hard facts. For casualties, finance, health, legal, policy, company claims, or public safety, require official statements or authoritative media before writing as fact.
- Do not embed screenshots as evidence. Link to platform topic pages or original posts when available.
