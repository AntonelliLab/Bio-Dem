---
"v-dem-biodiversity-app": minor
---

Restore GBIF data on the live app and modernise the build tooling.

- The deployed app had stopped showing GBIF record counts: the per-year fetch
  issued ~100 requests (one per year) and hit GBIF's rate limiter (HTTP 429).
  Year counts are now retrieved with a single faceted query (`facet=year`) per
  breakdown, collapsing ~100 requests into one.
- Making that fix required migrating the build tooling from Create React App to
  Vite + TypeScript (pnpm).
- The offline bulk data download was additionally hardened against 429s with
  lower request concurrency and retries using jittered exponential backoff.
