# ---------------------------------------------------------------------------
# Regenerate the Bio-Dem web-app data in public/data.
#
#   make deps      install R + node dependencies (run once)
#   make data      regenerate everything (vdem + gbif + colonial)  [= make all]
#   make vdem      vdem_variables.csv + country_data.csv   (V-Dem, via {vdemdata})
#   make gbif      gbif_data.csv                           (GBIF occurrence API)
#   make colonial  colonial_ties.csv                       (ICOW Colonial History)
#
# Static, hand-maintained files are NOT regenerated here:
#   vdem_variables_explanations.csv   (curated variable descriptions)
#   gbif_participating_countries.csv  (GBIF membership snapshot)
#
# When a new V-Dem version is released: `make deps` (updates the vdemdata
# package) then `make data`. Bump MAX_YEAR if the release extends coverage:
#   make data MAX_YEAR=2026
# ---------------------------------------------------------------------------

# Latest year to include (V-Dem covers up to this; GBIF/ICOW use it too).
MAX_YEAR ?= 2025
DATA_DIR ?= public/data

# On macOS prefer the CRAN framework R (has binary package support); see
# bin/install_r_deps.R. Override with `make ... RSCRIPT=/path/to/Rscript`.
RSCRIPT ?= $(shell [ -x /usr/local/bin/Rscript ] && echo /usr/local/bin/Rscript || echo Rscript)
PNPM    ?= pnpm

.PHONY: all data vdem gbif colonial gbif-participation deps r-deps node-deps \
        download-taxon-data download-taxon-data-split-by-domestic-records help

all: data

data: vdem gbif colonial gbif-participation

vdem:
	$(RSCRIPT) bin/generate_vdem_data.R --max-year=$(MAX_YEAR) --out=$(DATA_DIR)

colonial:
	$(RSCRIPT) bin/generate_colonial_ties.R --out=$(DATA_DIR) --ref-year=$(MAX_YEAR)

gbif:
	$(PNPM) exec tsx downloadGbifData.js --max-year=$(MAX_YEAR)

# GBIF participation status per country. Join years (member_since) aren't exposed
# by the GBIF API, so existing years in the CSV are preserved; new participants
# are written with an empty year (see the script's warning) to fill in by hand.
gbif-participation:
	$(PNPM) exec tsx bin/downloadGbifParticipation.js

deps: r-deps node-deps

r-deps:
	$(RSCRIPT) bin/install_r_deps.R

node-deps:
	$(PNPM) install

# ---------------------------------------------------------------------------
# Optional extra GBIF datasets (merged multi-taxon), written to ./gbif_data.csv.
# ---------------------------------------------------------------------------
download-taxon-data:
	$(PNPM) exec tsx downloadGbifData.js all Mammalia Amphibia Reptilia --max-year=$(MAX_YEAR)

download-taxon-data-split-by-domestic-records:
	$(PNPM) exec tsx downloadGbifData.js all Mammalia Amphibia Reptilia --add-domestic --max-year=$(MAX_YEAR)

help:
	@grep -E '^[a-z][a-z-]*:' $(MAKEFILE_LIST) | sed 's/:.*//' | sort -u
