#!/usr/bin/env Rscript
#
# generate_colonial_ties.R
# ------------------------
# Regenerate public/data/colonial_ties.csv from the ICOW Colonial History Data
# Set (Issue Correlates of War project, Paul Hensel), version 1.1.
#
#   Source: http://www.paulhensel.org/icowcol.html
#   File:   http://www.paulhensel.org/Data/colhist.zip -> coldata110.csv
#
# The app uses this to colour the world map by colonial relationship ("former
# colony" / "former coloniser") and only cares about cross-continental ties of
# non-European colonies. Columns (schema kept stable for the app):
#   iso2,iso3,cow_state,Name,indep_year,timesince,independence_from,cont_ent,cont_suppr
# Of these the app reads iso3, indep_year, independence_from, cont_ent, cont_suppr;
# the rest are informational.
#
# Usage:
#   Rscript bin/generate_colonial_ties.R [--out=public/data] [--ref-year=YYYY]

suppressMessages({
  library(dplyr)
  library(readr)
  library(countrycode)
})

## ---------------------------------------------------------------- options ----
args <- commandArgs(trailingOnly = TRUE)
opt <- function(name, default) {
  hit <- grep(paste0("^--", name, "="), args, value = TRUE)
  if (length(hit)) sub(paste0("^--", name, "="), "", hit[[1]]) else default
}
OUT_DIR  <- opt("out", "public/data")
# Reference year for the (informational) "timesince" = years since independence.
REF_YEAR <- as.integer(opt("ref-year", format(Sys.Date(), "%Y")))
ICOW_URL <- "http://www.paulhensel.org/Data/colhist.zip"

message("Generating colonial_ties.csv from ICOW Colonial History v1.1")

## ------------------------------------------------------- download + parse ----
zip_path <- tempfile(fileext = ".zip")
download.file(ICOW_URL, zip_path, mode = "wb", quiet = TRUE)
icow <- read.csv(unz(zip_path, "ICOW Colonial History 1.1/coldata110.csv"),
                 fileEncoding = "UTF-8-BOM", stringsAsFactors = FALSE)

## ---------------------------------------------- documented hand-curation ----
# ICOW records independence as gained from `IndFrom` (COW code). For a handful of
# North-African states ICOW attributes independence to the Ottoman Empire
# (COW 640 -> modern Turkey), whereas Bio-Dem reflects their *modern* (20th c.)
# decolonisation. Apply those overrides explicitly, keyed by COW state code.
overrides <- tribble(
  ~State, ~name_override,           ~indep_year_override, ~indfrom_override,
  600,    "Morocco (postcolonial)", 1956,                 220,  # from France
  616,    "Tunisia (postcolonial)", 1956,                 220,  # from France
  651,    "Egypt (postcolonial)",   1922,                 200   # from UK
)

# States excluded from the map layer: the USA (a coloniser itself) and the
# defunct South Vietnam (COW 817). European ex-Ottoman states are dropped
# automatically by the "colony outside Europe" rule below.
EXCLUDE_STATE <- c(2, 817)

## ------------------------------------------------------------- transform ----
dat <- icow %>%
  left_join(overrides, by = "State") %>%
  mutate(
    indep_year = coalesce(indep_year_override,
                          as.integer(substr(sprintf("%06d", IndDate), 1, 4))),
    IndFrom    = coalesce(indfrom_override, IndFrom),
    cow_state  = State,
    iso2 = countrycode(State, "cown", "iso2c", warn = FALSE),
    iso3 = countrycode(State, "cown", "iso3c", warn = FALSE),
    Name = coalesce(name_override,
                    countrycode(State, "cown", "country.name", warn = FALSE)),
    cont_ent          = countrycode(State,   "cown", "continent", warn = FALSE),
    independence_from = countrycode(IndFrom, "cown", "iso2c",     warn = FALSE),
    cont_suppr        = countrycode(IndFrom, "cown", "continent", warn = FALSE),
    timesince         = REF_YEAR - indep_year
  ) %>%
  # Keep only cross-continental ties of colonies *outside* Europe (the app's
  # documented scope), with a resolvable colonised country + coloniser.
  filter(
    IndFrom != -9,
    !State %in% EXCLUDE_STATE,
    !is.na(iso3), !is.na(independence_from),
    !is.na(cont_ent), !is.na(cont_suppr),
    cont_ent != "Europe",
    cont_ent != cont_suppr
  ) %>%
  distinct(iso3, .keep_all = TRUE) %>%
  arrange(cow_state) %>%
  select(iso2, iso3, cow_state, Name, indep_year, timesince,
         independence_from, cont_ent, cont_suppr)

dir.create(OUT_DIR, showWarnings = FALSE, recursive = TRUE)
write_csv(dat, file.path(OUT_DIR, "colonial_ties.csv"), na = "")
message(sprintf("  wrote colonial_ties.csv (%d countries)", nrow(dat)))
