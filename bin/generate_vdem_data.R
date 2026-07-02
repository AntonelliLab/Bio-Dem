#!/usr/bin/env Rscript
#
# generate_vdem_data.R
# ---------------------
# Regenerate the two V-Dem-derived data files the Bio-Dem web app needs:
#
#   public/data/vdem_variables.csv   democracy indices + covariates, per country-year
#   public/data/country_data.csv     per-country land area (km^2) + world region
#
# Source: the `vdemdata` R package (https://github.com/vdeminstitute/vdemdata),
# which ships the latest V-Dem Country-Year dataset. To update the app for a new
# V-Dem release, update the package and re-run this script (see the Makefile
# target `vdem`). Land areas come from Natural Earth polygons via {sf}, so they
# are independent of the V-Dem release.
#
# Usage:
#   Rscript bin/generate_vdem_data.R [--max-year=YYYY] [--out=public/data] \
#                                    [--countries-file=src/api/data.ts]
#
# Run from the Bio-Dem repo root (the Makefile does this for you).

suppressMessages({
  library(vdemdata)
  library(dplyr)
  library(readr)
  library(stringr)
  library(sf)
  library(rnaturalearth)
  library(countrycode)
})

## ---------------------------------------------------------------- options ----
args <- commandArgs(trailingOnly = TRUE)
opt <- function(name, default) {
  hit <- grep(paste0("^--", name, "="), args, value = TRUE)
  if (length(hit)) sub(paste0("^--", name, "="), "", hit[[1]]) else default
}

YEAR_MIN       <- 1960
YEAR_MAX       <- as.integer(opt("max-year", max(vdem$year)))
OUT_DIR        <- opt("out", "public/data")
COUNTRIES_FILE <- opt("countries-file", "src/api/data.ts")

# Non-standard / defunct / disputed states that the app does not track in the
# V-Dem panel. Kept as an explicit, documented list (the only hard-coded values
# in this script):
#   DDR East Germany · PSG Palestine/Gaza · SML Somaliland · VDR North Vietnam
#   XKX Kosovo       · YMD South Yemen    · ZZB Zanzibar
BAD_COUNTRIES <- c("DDR", "PSG", "SML", "VDR", "XKX", "YMD", "ZZB")

message(sprintf("Generating V-Dem app data for %d-%d (vdemdata v%s)",
                YEAR_MIN, YEAR_MAX, as.character(packageVersion("vdemdata"))))

## ------------------------------- country set = app registry minus bad codes ----
# The app's canonical country list lives in src/api/data.ts as ISO-3166 alpha-3
# codes. We reuse it as the single source of truth so this script never drifts
# from what the app renders.
ts_src <- paste(readLines(COUNTRIES_FILE, warn = FALSE), collapse = " ")
app_countries <- unique(str_match_all(ts_src, "'([A-Z]{3})'")[[1]][, 2])
keep <- setdiff(app_countries, BAD_COUNTRIES)
message(sprintf("  %d countries (from %s, minus %d excluded)",
                length(keep), COUNTRIES_FILE, length(BAD_COUNTRIES)))

## --------------------------------------------------- vdem_variables.csv ----
# Column mapping to the app schema (unchanged since v10):
#   e_migdppc  <- e_gdppc            (V-Dem renamed the GDP-per-capita series)
#   conflict_* <- e_ovctd            (UCDP organized-violence fatalities)
#
# Conflict intensity follows the UCDP convention and is mutually exclusive:
#   conflict_hi (major) = >= 1000 fatalities in a year
#   conflict_li (minor) = 1..999 fatalities
# e_ovctd covers 1989+; earlier years have no fatality data -> no conflict flag.
vdem_vars <- vdem %>%
  filter(country_text_id %in% keep, year >= YEAR_MIN, year <= YEAR_MAX) %>%
  transmute(
    country = country_text_id,
    year,
    v2x_regime,
    v2x_polyarchy,
    v2x_freexp_altinf,
    v2x_frassoc_thick,
    v2xcl_dmove,
    v2xcs_ccsi,
    v2x_corr,
    v2x_clphy,
    e_peaveduc,
    e_migdppc = e_gdppc,
    conflict_hi = as.integer(!is.na(e_ovctd) & e_ovctd >= 1000),
    conflict_li = as.integer(!is.na(e_ovctd) & e_ovctd >= 1 & e_ovctd < 1000)
  ) %>%
  arrange(country, year)

# Round the continuous columns to 3 decimals (keep keys + conflict flags as-is).
num_cols <- setdiff(names(vdem_vars), c("country", "year", "conflict_hi", "conflict_li"))
vdem_vars[num_cols] <- lapply(vdem_vars[num_cols], \(x) round(x, 3))

dir.create(OUT_DIR, showWarnings = FALSE, recursive = TRUE)
write_csv(vdem_vars, file.path(OUT_DIR, "vdem_variables.csv"), na = "")
message(sprintf("  wrote vdem_variables.csv (%d rows, %d countries, %d-%d)",
                nrow(vdem_vars), dplyr::n_distinct(vdem_vars$country),
                min(vdem_vars$year), max(vdem_vars$year)))

## ------------------------------------------------------ country_data.csv ----
# region: most recent non-NA politico-geographic region (e_regionpol) per country
region <- vdem %>%
  filter(country_text_id %in% keep, !is.na(e_regionpol)) %>%
  group_by(country = country_text_id) %>%
  slice_max(year, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  transmute(country, e_regionpol = as.integer(e_regionpol))

# area: geodesic area (km^2) of present-day Natural Earth country polygons.
# {sf} uses spherical geometry (s2) for lon/lat data, so st_area is geodesic.
ne <- ne_countries(scale = "medium", returnclass = "sf")
ne$area_km2 <- as.numeric(st_area(ne)) / 1e6

# Robust ISO3 key: prefer the "eh" field (fixes France/Norway = "-99"), fall back
# to adm0_a3, then to a name lookup via {countrycode}.
ne_tbl <- st_drop_geometry(ne)
ne_iso <- ne_tbl$iso_a3_eh
ne_iso[is.na(ne_iso) | ne_iso == "-99"] <- ne_tbl$adm0_a3[is.na(ne_iso) | ne_iso == "-99"]
bad_iso <- is.na(ne_iso) | ne_iso == "-99"
if (any(bad_iso)) {
  ne_iso[bad_iso] <- countrycode(ne_tbl$admin[bad_iso],
                                 origin = "country.name", destination = "iso3c",
                                 warn = FALSE)
}
ne_area <- tibble(country = ne_iso, area = round(ne_tbl$area_km2)) %>%
  filter(!is.na(country)) %>%
  group_by(country) %>%
  summarise(area = sum(area), .groups = "drop")   # merge multi-polygon subunits

country_data <- tibble(country = sort(keep)) %>%
  left_join(ne_area, by = "country") %>%
  left_join(region, by = "country")

missing_area <- country_data$country[is.na(country_data$area)]
if (length(missing_area)) {
  message(sprintf("  NOTE: no Natural Earth area for: %s",
                  paste(missing_area, collapse = ", ")))
}

write_csv(country_data, file.path(OUT_DIR, "country_data.csv"), na = "")
message(sprintf("  wrote country_data.csv (%d countries)", nrow(country_data)))
