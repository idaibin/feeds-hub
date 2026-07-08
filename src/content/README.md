# Content Directory

Feed markdown files live directly under category directories:

- `ai`
- `compute`
- `dev`
- `global`
- `github`
- `lol`
- `product`
- `rust`
- `security`
- `stock`
- `worldcup`

Do not add an extra `feeds/` parent directory under `src/content`.

Frontmatter `cover` is a legacy compatibility field. It is not displayed and does not require a matching file. Use a stable site path, for example:

```text
/images/<category>/<file>.webp
```

New feed frontmatter must include `coverStatus` for schema compatibility:

```text
pending
```

Do not include `public` or `/feeds/` in `cover`.
