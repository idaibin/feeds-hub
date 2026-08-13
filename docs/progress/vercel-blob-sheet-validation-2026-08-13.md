# Vercel Blob And Google Sheets Validation — 2026-08-13

## Scope

- Repository basis: `fe680131ab6222fc4553595213f3cf205811ce9d`.
- AI Engineering System basis: `fb101496f52bbc1a403f825c8825622c080b3a42`.
- Validation branch: `agent/verify-blob-sheet-pipeline`.
- Preview only. No `main` merge, Production deployment, or Production database write.

## Verified

- Vercel deployment `dpl_3wiAz5gS2sK33oCVYHBedeZJzvsh` built source commit
  `860575df9b4fada98a06c1694f2d218f57d40c56` in `iad1`.
- The exact Preview build uploaded the repository PNG fixture to the connected public Blob store.
- Blob public readback returned HTTP 200, `image/png`, 9,853 bytes, inline disposition, and
  `Access-Control-Allow-Origin: *`.
- Source, build result, pathname, and public readback all matched SHA-256
  `b2dbbbf924955244f695fd46282a4b4113f47414ad7771b731ca0bf81d742c17`.
- The stable public Blob URL was persisted in `Feeds Hub Automation Probe`, `Sheet1!H2`, as an
  `IMAGE()` formula. The formula and validation row were read back from Sheets.
- The probe is idempotent: pathname is derived from the content hash, random suffixes are disabled,
  and retry overwrites the same object.

## Blocked / Not Verified

- Google Sheets returned `#REF!` with: `Please use a desktop web browser to allow access to fetch
  data from external urls.` The public Blob URL therefore does not remove the first-use user
  authorization gate for `IMAGE()`.
- Visual image rendering in the Sheet is not verified until that Google authorization is granted
  and the cell is read back again.
- Neon ingestion and Feeds API readback were not attempted. This repository has no isolated Preview
  database, and the authorization explicitly excluded Production.
- Full local tests reached 75/76; the remaining real-HTTP Astro test could not bind a local port in
  the sandbox. Vercel's standard `npm ci` and `npm run build` completed successfully.

## Conclusion

`Work -> stable URL handoff -> Vercel Blob -> public readback -> Google Sheet formula` is viable.
Automatic Sheet image rendering is not yet viable without one-time Google external-data approval.
Database ingestion requires a separately approved isolated Preview database or a new Production
change window; neither may be inferred from this validation.
