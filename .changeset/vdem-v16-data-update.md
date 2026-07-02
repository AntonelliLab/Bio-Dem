---
"v-dem-biodiversity-app": minor
---

Update V-Dem data from v10 to v16 and make all app data reproducible from a single command.

**Data**

- V-Dem democracy indices now cover **1960–2025** (was 1960–2019), regenerated from the `vdemdata` package (v16).
- GBIF occurrence counts refetched through 2025.
- `country_data.csv` land areas are now computed from Natural Earth polygons via `{sf}`; regions (`e_regionpol`) come from V-Dem.
- `colonial_ties.csv` is now regenerated from the ICOW Colonial History Data Set instead of being hand-maintained.
- Conflict flags (`conflict_hi`/`conflict_li`) are derived from UCDP organized-violence fatalities (`e_ovctd`; major ≥1000, minor 1–999 deaths/year, covering 1989+). GDP per capita now comes from V-Dem's `e_gdppc` (renamed from `e_migdppc`); note V-Dem freezes some external covariates earlier than the democracy indices (education ends 2010, GDP ends 2019).

**Tooling**

- New R scripts `bin/generate_vdem_data.R` and `bin/generate_colonial_ties.R`, an R dependency installer `bin/install_r_deps.R`, and a `Makefile` (`make deps`, `make data`, `make vdem`/`gbif`/`colonial`) that regenerate every file in `public/data/`.
- The generated data files are now committed to the repo (previously git-ignored) so the app builds and deploys without the data toolchain.

**App**

- Year selectors and valid-year logic now extend to 2025 (centralized in a single `MAX_YEAR` constant).
- Guarded "records per area" against missing country areas.
- About page and README updated for V-Dem v16 and the new data pipeline.
