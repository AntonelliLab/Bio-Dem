# A script to visualize the relation between biodiversity and democracy globally (Figure 1)

library(tidyverse)
library(sf)
library(rnaturalearth)
library(countrycode)
library(viridis)
library(scales)
library(gridExtra)
library(RColorBrewer)

#load data
con <- st_as_sf(countries110) ##countryborders from Natural Earth
vdm <- read_csv("input/vdem_variables.csv")%>% ## V-Dem data
  filter(year == 2017)%>%
  select(country, v2x_regime, v2x_polyarchy)

ver <- read_delim("output/species_frac_country.txt", delim = "\t", 
                  col_names = c("country", "area", "species", "threat", "sp.frac")) %>% 
  filter(!is.nan(sp.frac)) %>% 
  filter(threat != "EX" | is.na(threat)) %>% 
  mutate(type = "Vertebrates")

pla <- read_delim("output/species_frac_country_plants.txt", delim = "\t") %>% 
  filter(!is.nan(sp.frac)) %>% 
  mutate(type = "Seed plants")
  

# a bar chart with the diversity per regime type
# thre<- dat %>% 
#   filter(threat != "EX" | is.na(threat)) %>% 
#   mutate(threatened = ifelse(threat %in% c("CR", "VU", "EN", "NT"), "threatened", "not threatened")) %>%
#   filter(threatened == "threatened")


plo <- ver %>% 
  bind_rows(pla) %>% 
  left_join(vdm, by = "country") %>% 
  filter(!is.na(v2x_regime)) %>% 
  group_by(v2x_regime, type) %>% 
  summarize(biodiversity = sum(sp.frac)) %>%
  mutate(regime = recode(v2x_regime,
                         `0` = "Closed\nautocracy", 
                         `1` = "Electoral\nautocracy",
                         `2` = "Electoral\ndemocracy",
                         `3` = "Liberal\ndemocracy"))%>% 
  group_by(type)%>%
  mutate(frac = biodiversity / sum(biodiversity) * 100)

plo$type <- factor(plo$type, levels = c("Seed plants", "Vertebrates"))


cols <- brewer.pal(n = 6, name = "Set2")[c(1,4)]

## the plot
barch <- ggplot(data = plo)+
  geom_bar(aes(x = regime, y = frac, fill = type), stat = "identity", position = "dodge")+
  scale_fill_manual(values = cols)+
  xlab("Regime type")+
  ylab("Global Biodiversity [%]")+
  theme_bw()+
  theme(panel.grid.minor = element_blank(),
        panel.grid.major.x = element_blank(),
        legend.position = c(0,1),
        legend.justification = c(-.1, 1.3),
        legend.title = element_blank(),
        text = element_text(size = 16),
        legend.key.size = unit(1.5, unit = "cm"))

# ggsave(file = "figures/fig1B_barchart_biodiversity_regime_type.pdf")

# A scatterplot with the biodiveristy against the 
plo <- ver %>% 
  filter(threat != "EX" | is.na(threat)) %>% 
  bind_rows(pla) %>% 
  group_by(country) %>% 
  summarize(biodiversity = sum(sp.frac)) %>% 
  left_join(vdm, by = "country") %>% 
  mutate(country2 = countrycode(country, origin = "iso3c", destination = "country.name")) %>%
  mutate(regime = recode(v2x_regime,
                         `0` = "Closed\nautocracy", 
                         `1` = "Electoral\nautocracy",
                         `2` = "Electoral\ndemocracy",
                         `3` = "Liberal\ndemocracy")) %>% 
  filter(!is.na(regime))



## the plot
scatt <- ggplot()+
  geom_point(data = plo, aes(x = v2x_polyarchy,  y = biodiversity, color = regime))+
  geom_label(data = filter(plo, biodiversity >= rev(sort(plo$biodiversity))[12]),  
             aes(x = v2x_polyarchy,  y = biodiversity, label = country2), 
             color = "red", nudge_x = -0.018, nudge_y = 20, hjust = 1)+
  scale_color_viridis(option = "D", direction = 1, discrete = T)+
  xlab("Democracy")+
  ylab("Area weighted species richness")+
  theme_bw()+
  theme(panel.grid.minor = element_blank(),
        legend.title = element_blank(),
        legend.position = c(0,1),
        legend.justification = c(-.2, 1.1),
        text = element_text(size = 16))

# ggsave(file = "figures/fig1A_scatterplot_biodiversity_polyarchy.pdf")

# A map showing polyarchy and biodiveristy for each country

rob <- "+proj=robin +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs"

### Number of threatened orchid species
plo2 <- con %>% 
  sf::st_crop( c(xmin=-180, xmax=180, ymin=-90, ymax=90)) %>% 
  sf::st_transform(rob) %>% 
  left_join(plo, by = c("adm0_a3" = "country")) %>% 
  mutate(stand_size = rescale(biodiversity, to=c(1,60)))

plo3 <- st_centroid(plo2) %>% 
  filter(!is.na(v2x_polyarchy))

map <- ggplot()+
  geom_sf(data = plo2, aes(fill = regime))+
  geom_sf(data = plo2 %>% filter(biodiversity >= rev(sort(plo$biodiversity))[12]),
                                 size = 1.2, fill = "transparent", 
          col = "red")+
  geom_sf(data = plo3, aes(size = stand_size), shape = 21, color = "black", fill = "black", 
          show.legend = 'point')+
  scale_fill_viridis(option = "D", direction = 1, 
                     name = "Regime type", discrete = T)+
  coord_sf(datum = NA)+
  ylim(-5400000, 7700000)+
  theme_bw()+
  guides(size = guide_legend(title = "Biodiversity"))+
  # scale_size(guide = "none")+
  theme(panel.background = element_rect(fill = 'white', colour = 'black'),
        #axis.ticks = element_blank(),
        axis.title = element_blank(),
        #axis.text = element_blank(),
        panel.grid.minor = element_blank(),
        panel.grid.major = element_blank(),
        legend.position = c(0,1),
        legend.justification = c(-0.2,1.1),
        panel.border = element_blank(),
        text = element_text(size = 16))


plot_out <- grid.arrange(map, scatt, barch,
  layout_matrix = rbind(c(3, 3, 2, 2),
                        c(3, 3, 2, 2),
                        c(1, 1, 1, 1),
                        c(1, 1, 1, 1),
                        c(1, 1, 1, 1))
)

ggsave(plot = plot_out, file = "output/Figure1_biodiversity_democracy.pdf",
       width = 16, height = 11)
