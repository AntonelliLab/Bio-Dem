BIRD_DATA_FILENAME = ebird_collections_per_country_per_year.csv
VDEM_DATA_FILENAME = vdem_variables.csv

.phony: data

data: public/data/$(BIRD_DATA_FILENAME) public/data/$(VDEM_DATA_FILENAME)
	@true

public/data/$(BIRD_DATA_FILENAME):
	mkdir -p $(dir $@)
	wget https://github.com/AntonelliLab/Vdem-Biodiversity/raw/master/analyses/input/$(BIRD_DATA_FILENAME) -O $@

public/data/$(VDEM_DATA_FILENAME):
	mkdir -p $(dir $@)
	wget https://github.com/AntonelliLab/Vdem-Biodiversity/raw/master/analyses/input/$(VDEM_DATA_FILENAME) -O $@
