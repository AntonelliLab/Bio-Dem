# ---------------------------------------------------------------------------
# App data provisioning
#
# The web app reads these CSVs from public/data/ at runtime. The source of
# truth is the app-data/ folder in the sibling Vdem-Biodiversity repo (which
# holds the analysis and its outputs).
#
#   make data   copies any MISSING files from app-data into public/data.
#               Files already present in public/data are left untouched.
# ---------------------------------------------------------------------------

APP_DATA_SRC = ../Vdem-Biodiversity/app-data
PUBLIC_DATA = public/data

APP_DATA_FILES = \
	vdem_variables.csv \
	vdem_variables_explanations.csv \
	country_data.csv \
	colonial_ties.csv \
	gbif_data.csv \
	gbif_participating_countries.csv

DATA_TARGETS = $(addprefix $(PUBLIC_DATA)/,$(APP_DATA_FILES))

.PHONY: data download-gbif-data download-taxon-data download-taxon-data-split-by-domestic-records

# Provision public/data with the CSVs the app needs.
data: $(DATA_TARGETS)
	@true

# Copy one data file from Vdem-Biodiversity/app-data into public/data. These
# targets have no prerequisites, so make only runs the recipe when the file is
# not already present in public/data — existing files are never overwritten.
$(DATA_TARGETS): $(PUBLIC_DATA)/%.csv:
	@if [ ! -f "$(APP_DATA_SRC)/$*.csv" ]; then \
		echo "ERROR: source not found: $(APP_DATA_SRC)/$*.csv" >&2; \
		exit 1; \
	fi
	@mkdir -p $(dir $@)
	cp "$(APP_DATA_SRC)/$*.csv" "$@"
	@echo "Copied $*.csv from app-data -> $@"

# ---------------------------------------------------------------------------
# Regenerate GBIF occurrence data from the live GBIF API (advanced). The Node
# data scripts import the app's TypeScript modules, so they run via tsx.
# ---------------------------------------------------------------------------

# Base dataset: records per country per year -> public/data/gbif_data.csv
download-gbif-data:
	pnpm exec tsx downloadGbifData.js

# Merged multi-taxon dataset (Mammalia/Amphibia/Reptilia) -> ./gbif_data.csv
download-taxon-data:
	pnpm exec tsx downloadGbifData.js all Mammalia Amphibia Reptilia

download-taxon-data-split-by-domestic-records:
	pnpm exec tsx downloadGbifData.js all Mammalia Amphibia Reptilia --add-domestic
