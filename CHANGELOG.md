# v-dem-biodiversity-app

## 1.6.0

### Minor Changes

- 5f4c299: Restore GBIF data on the live app and modernise the build tooling.

  - The deployed app had stopped showing GBIF record counts: the per-year fetch
    issued ~100 requests (one per year) and hit GBIF's rate limiter (HTTP 429).
    Year counts are now retrieved with a single faceted query (`facet=year`) per
    breakdown, collapsing ~100 requests into one.
  - Making that fix required migrating the build tooling from Create React App to
    Vite + TypeScript (pnpm).
  - The offline bulk data download was additionally hardened against 429s with
    lower request concurrency and retries using jittered exponential backoff.

- 8b57cac: Update V-Dem data from v10 to v16 and make all app data reproducible from a single command.

  **Data**

  - V-Dem democracy indices now cover **1960–2025** (was 1960–2019), regenerated from the `vdemdata` package (v16).
  - GBIF occurrence counts refetched through 2025.
  - `country_data.csv` land areas are now computed from Natural Earth polygons via `{sf}`; regions (`e_regionpol`) come from V-Dem.
  - `colonial_ties.csv` is now regenerated from the ICOW Colonial History Data Set instead of being hand-maintained.
  - Conflict flags (`conflict_hi`/`conflict_li`) are derived from UCDP organized-violence fatalities (`e_ovctd`; major ≥1000, minor 1–999 deaths/year, covering 1989+). GDP per capita now comes from V-Dem's `e_gdppc` (renamed from `e_migdppc`); note V-Dem freezes some external covariates earlier than the democracy indices (education ends 2010, GDP ends 2019).

  **Tooling**

  - New R scripts `bin/generate_vdem_data.R` and `bin/generate_colonial_ties.R`, a GBIF participation script `bin/downloadGbifParticipation.js`, an R dependency installer `bin/install_r_deps.R`, and a `Makefile` (`make deps`, `make data`, `make vdem`/`gbif`/`colonial`/`gbif-participation`) that regenerate every file in `public/data/`. Only `vdem_variables_explanations.csv` stays hand-maintained (curated descriptions). GBIF join years (`member_since`) aren't in the GBIF API, so they're preserved from the existing file.
  - The generated data files are now committed to the repo (previously git-ignored) so the app builds and deploys without the data toolchain.

  **App**

  - Year selectors and valid-year logic now extend to 2025 (centralized in a single `MAX_YEAR` constant).
  - Fixed the GDP-per-capita scatter axis: `e_gdppc` uses a ~0.7–265 (thousands USD) scale, so the hardcoded log-axis bounds were retuned (previously tuned to the old Maddison ~200–200000 range, which collapsed all bubbles to the bottom).
  - Added hover tooltips showing the year and record count on the year-scrubber histogram (used by the scatterplot and world map) and on the dual-chart record bars; the histogram tooltip reads the year from the band scale so edge years (e.g. 2025) are labelled correctly.
  - Conflict wording (bars note, README, `conf` explanation) updated to reflect the UCDP organized-violence source.
  - Guarded "records per area" against missing country areas, and the GBIF-participation label against unknown join years.
  - About page and README updated for V-Dem v16 and the new data pipeline.
