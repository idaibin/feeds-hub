# Repository Scope

## Role

`idaibin/feeds-hub` is a short-cycle AI information feed automation product and example site.

It demonstrates how AI scheduled tasks can search information, review topics, deduplicate events, generate summaries, create covers, write structured Markdown, and publish through a static site.

## Owns

- Short-cycle feed entries.
- Category cards.
- Feed summaries.
- ChatGPT-generated feed posters and covers.
- Repository-specific feed frontmatter.
- Repository-specific feed content paths.
- Feeds Hub automation task spec under `docs/automation/`.

## Does Not Own

- Long-form blog articles.
- Reusable prompt source assets.
- Reusable skill source assets.
- Shared AI automation standards.
- Shared GitHub branching standards.
- Shared content quality standards.

Reusable prompts, skills, workflow templates, and shared standards belong in `idaibin/aicraft`.

Long-form publishing belongs in `idaibin/blog`.

## Consumes From

This repository consumes shared standards from:

```text
idaibin/aicraft/docs/standards/cron-automation.md
idaibin/aicraft/docs/standards/github-branching.md
idaibin/aicraft/docs/standards/ai-content-quality.md
```

## Automation Rules

Feeds Hub automation task specs live under:

```text
docs/automation/
```

The current scheduled task is:

```text
docs/automation/feeds-hub-update.md
```

Topic-specific rules live under:

```text
docs/topics/
```

## Allowed Paths

The `Feeds Hub 更新` task may modify only:

```text
src/content/<category>/*.md
public/images/<category>/*.webp
```

It may modify automation documentation only when the user explicitly asks to update rules:

```text
docs/automation/**
docs/repo-scope.md
docs/topics/**
docs/ui-spec.md
AGENTS.md
README.md
```

It must not modify reusable AI source assets. Those belong in `idaibin/aicraft`.
