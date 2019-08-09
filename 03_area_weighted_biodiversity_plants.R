# A script to get the area weighted plant distributions from powo and tdwg

#libraries
library(tidyverse)
library(sf)
library(rnaturalearth)

# load data
## distributions from powo
dis <- read_delim("input/powo_distributions/distribution.txt", delim = "\t", col_names = FALSE, guess_max = 160000) %>% 
  select(ipni_id = X1, country = X2, dis_link = X3, tdwg = X6) %>% 
  arrange(ipni_id) %>% 
  mutate(tdwg = gsub("TDWG:", "", tdwg))

# ## more info from powo
# nam <- read_delim("input/powoNames/taxon.txt", delim = "\t", col_names = FALSE, guess_max = 160000) %>% 
#   select(ipni_id = X1, taxon_level = X3, full_name = X4, family = X5, genus = X6, species = X7, aut = X10, time = X12, distr = X14) %>% 
#   #filter(taxon_level == "Species") %>% 
#   filter(!is.na(species)) %>% 
#     arrange(ipni_id)

# tdwg regions
tdwg <- st_read(dsn = "input/tdwg", layer = "level3")

# real countries
con <- st_as_sf(countries110) ##countryborders from Natural Earth

# # prepare data
# ## merge powo data
# powo <- dis %>% 
#   left_join(nam, by = "ipni_id")


#calculate overlap fraction per country
li <- unique(dis$ipni_id)
res <- tibble()


for(i in 1:length(li)){
  print(paste(i, length(li), sep = "-"))
  
  # subset distribution data
  sub <- dis[dis$ipni_id == li[i],]$tdwg
  sub_sp <- filter(tdwg, LEVEL3_COD  %in% sub)
  
  # Intersect with coutrny borders
  int <- st_intersection(st_buffer(sub_sp,0), con)
  
  # create output tibble
  out <- tibble(country = int$iso_a3,
                area = round(st_area(int) / (1000 * 1000), 0)) %>% 
    group_by(country) %>% 
    summarize(area = sum(area)) %>% 
    mutate(species = li[i])
  
  # Calculate fraction
  out$sp.frac <-  round(out$area / sum(out$area), 3)
  
  # Remove very small areas (anything less than 1%), likely due to misalignemnt between tdwg and rnaturalearth
  
  out <- out %>% 
    mutate(sp.frac = as.numeric(sp.frac)) %>% 
             filter(sp.frac >= 0.01)
  
  if(i == 1){
    write_delim(out, path = "output/species_frac_country_plants.txt", delim = "\t", append = F)
  }else{
    write_delim(out, path = "output/species_frac_country_plants.txt", delim = "\t", append = T)
  }
}




