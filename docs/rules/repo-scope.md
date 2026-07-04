# Repository Scope

## Role

`idaibin/feeds-hub` is a short-cycle AI information feed product and example site.

It demonstrates how an AI feed update workflow can search information, review topics, deduplicate events, generate summaries, create covers, write structured Markdown, and publish through a static site.

## Owns

- Short-cycle feed entries.
- Category cards.
- Feed summaries.
- AI-generated feed posters and covers.
- Repository-specific feed frontmatter.
- Repository-specific feed content paths.
- Feeds Hub update task entry under `docs/automation/`.

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
idaibin/aicraft/docs/standards/github-branching.md
idaibin/aicraft/docs/standards/ai-content-quality.md
```

## Update Rules

Feeds Hub update task entries live under:

```text
docs/automation/
```

The current update entry is:

```text
docs/automation/feeds-hub-update.md
```

Topic-specific rules live under:

```text
docs/topics/
```

## Allowed Paths

The `Feeds Hub 更新` flow may modify only:

```text
src/content/<category>/*.md
public/images/<category>/*.webp
```

It may modify update documentation only when the user explicitly asks to update rules:

```text
docs/automation/**
docs/rules/**
docs/topics/**
AGENTS.md
README.md
```

It must not modify reusable AI source assets. Those belong in `idaibin/aicraft`.
