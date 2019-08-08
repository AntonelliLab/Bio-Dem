# A script to calculate the fraction of range per country for all mammals, amphibians and birds from the IUCN maps


#libraries
library(tidyverse)
library(sf)
library(rnaturalearth)
library(countrycode)

# load data
mam <- st_read(dsn = "data/IUCN", layer = "TERRESTRIAL_MAMMALS") ## mammals
amp <- st_read(dsn = "data/IUCN", layer = "AMPHIBIANS") ##amphibians
## birds
con <- st_as_sf(countries110) ##countryborders from Natural Earth
vdm <- read_csv("input/vdem_variables.csv")%>% ## V-Dem data
  filter(year == 2017)%>%
  select(country, v2x_regime, v2x_polyarchy)

# Intersection and area calcualtion
##for mammals and amphibians
names(amp) <- names(mam)
dat <- rbind(mam, amp)

li <- unique(dat$binomial)
res <- tibble()
#11919 species

for(i in 1:length(li)){
  print(i)
  sub <- dat[dat$binomial == li[i],]
  int <- st_intersection(st_buffer(sub,0), con)
  out <- tibble(country = int$iso_a3,
                area = round(st_area(int) / (1000 * 1000), 0),
                species = li[i],
                threat = unique(sub$code))
  out$sp.frac <-  round(out$area / sum(out$area), 3)
  write_delim(out, path = "output/species_frac_country.txt", delim = "\t", append = T)
}

#for birds
# Read the feature class
dat <- st_read("input/BOTW.gdb") #bird species ranges from BirdLife
mar <- read_csv("input/Marine species_BirdLifeInt_strict.csv", col_names = c("SpcRecID", "SCINAME", "english", "family", "iucn")) #List of marine birds from Helen

# Exclude marine birds
dat  <- dat%>%
  filter(!SCINAME %in% mar$SCINAME)

#chop it into smaller pieces
li <- unique(dat$SCINAME)
#10886 species

#run here again
for(i in 10038:length(li)){
  print(i)
  sub <- dat[dat$SCINAME == li[i],]
  int <- st_intersection(st_buffer(sub,0), con)
  out <- tibble(country = int$iso_a3,
                area = round(st_area(int) / (1000 * 1000), 0),
                species = li[i],
                threat = "NA")
  out$sp.frac <-  round(out$area / sum(out$area), 3)
  write_delim(out, path = "output/species_frac_country.txt", delim = "\t", append = T)
}

#reload the data and summarize per country
dat <- read_delim("output/species_frac_country.txt", delim = "\t", 
                  col_names = c("country", "area", "species", "threat", "sp.frac")) %>% 
  filter(!is.nan(sp.frac))

#add higher taxon information from species list
# tax <- bind_rows(mam %>% st_set_geometry(NULL) %>% select(binomial, class),
#                  amp %>% st_set_geometry(NULL) %>% select(binomial, class),
#                  tibble(binomial = li, class = "aves"))

# plo <- left_join(dat, tax, by = c("species" = "binomial"))%>%
#   distinct()%>%
#   left_join(vdm, by = "country")%>% # combine with regimes of the world
#   group_by(v2x_regime, class)%>%
#   summarize(species = sum(sp.frac, na.rm=T))%>%
#   filter(!is.na(v2x_regime))%>%
#   group_by(class)%>%
#   mutate(frac = species / sum(species) *100)
# 
# write_csv(plo, path = "output/species_fraction_per_regime.csv")
# 
# # figure distribution of all species on regimes
# # Relative
# ggplot(data = plo, aes(x = as.character(v2x_regime), y = frac, fill = class))+
#   geom_bar(stat = "identity", position = "dodge")+
#   geom_vline(xintercept = 2.5, lty = 2)+
#   scale_fill_discrete(name = "Taxon", labels = c("Amphibians", "Birds", "Mammals"))+
#   xlab("Regime type")+
#   ylab("Percent of species")+
#   theme_bw()
#   
