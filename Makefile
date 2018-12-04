VDEM_DATA_FILENAME = vdem_variables.csv
VDEM_EXPLANATIONS_FILENAME = vdem_variables_explanations.csv

.phony: data download-taxon-data

data: public/data/$(VDEM_DATA_FILENAME) public/data/gbif_data.csv
	@true

public/data/$(VDEM_DATA_FILENAME):
	mkdir -p $(dir $@)
	wget https://github.com/AntonelliLab/Vdem-Biodiversity/raw/master/analyses/input/$(VDEM_DATA_FILENAME) -O $@

public/data/$(VDEM_EXPLANATIONS_FILENAME):
	mkdir -p $(dir $@)
	wget https://github.com/AntonelliLab/Vdem-Biodiversity/raw/master/ebbe_nielsen/$(VDEM_EXPLANATION_FILENAME) -O $@

public/data/gbif_data.csv:
	node downloadGbifData.js

download-taxon-data:
	node downloadGbifData.js all Mammalia Amphibia Reptilia
