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

Poster assets use the matching physical structure under `public/images/<category>/`.

Frontmatter `cover` uses the site path, for example:

```text
/images/<category>/<file>.webp
```

Do not include `public` or `/feeds/` in `cover`.
