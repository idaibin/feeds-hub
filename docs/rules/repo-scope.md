# Repository Scope

`idaibin/feeds-hub` owns the static feed site, feed content schema, repository-specific update entry, topic rules, poster rules, UI rules, and generated feed cover assets.

## Owns

- Short-cycle feed entries.
- Category cards and feed summaries.
- Repository-specific frontmatter and content paths.
- AI-generated feed posters under `public/images/<category>/`.
- Update task entry under `docs/automation/`.
- Repository-specific rules under `docs/rules/`, `docs/topics/`, and `docs/posters/`.

## Does Not Own

- Long-form blog articles.
- Reusable prompts, skills, workflow templates, or shared standards.
- Shared GitHub branching and AI content quality standards.

Reusable AI assets belong in `idaibin/aicraft`; long-form publishing belongs in `idaibin/blog`.

## External Standards

```text
idaibin/aicraft/docs/standards/github-branching.md
idaibin/aicraft/docs/standards/ai-content-quality.md
```

## Allowed Update Paths

Normal feed update tasks may modify only:

```text
src/content/<category>/*.md
public/images/<category>/*.webp
```

Rule updates require an explicit user request and may touch:

```text
docs/automation/**
docs/rules/**
docs/topics/**
docs/posters/**
AGENTS.md
README.md
```

Do not move reusable AI source assets into this repository.
