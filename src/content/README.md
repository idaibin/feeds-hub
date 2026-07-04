# Content Directory

Feed markdown files live directly under category directories:

- `ai`
- `global`
- `lol`
- `product`
- `rust`
- `stock`
- `worldcup`

Do not add an extra `feeds/` parent directory under `src/content`.

Poster assets, when available, use the matching physical structure under `public/images/<category>/`.

Frontmatter `cover` uses the site path, for example:

```text
/images/<category>/<file>.webp
```

New feed frontmatter must include `coverStatus`:

```text
generated_webp | pending
```

Poster generation, binary image writes, fallback, and pending cover rules are maintained in `docs/rules/poster-spec.md`.

Do not include `public` or `/feeds/` in `cover`.
