# Bio-Dem - Biodiversity knowledge & democracy

# Abstract and rationale

Biological collection specimen museums and herbaria, are a major source for humanities knowledge on biodiversity. Relatively little is known about the effect of society and political systems on the collection and public availability of biological specimens. This is surprising, because some societies would obviously favour scientific research and naturalist activity (e.g. open, safe, democratic) compared to others (repressive, unsafe, authoritarian), and because extensive literature exists that links the environmental performance of countries to their political system.

Bio-Dem is an open-source app to address this gap. It visualizes the number of occurrence records available from the [Global Biodiversity Information Facility](https://www.gbif.org) in relation to political systems as defined by [V-Dem](https://www.v-dem.net/) around the world. Some specific questions that can be explored with Bio-Dem are:

* Are democracies superior in record collection and mobilization?
* Which dimensions of political systems are important (e.g. freedom of movement, rule of law or strength of the civil society)?
* How do armed conflicts impact record availability?

Bio-Dem provides a novel, fun perspective on GBIF data, and can (I) generate novel interdisciplinary research ideas and hypothesis, (II) highlight the relation between political development and record availability (III) excite students of political and natural sciences, equally. Thereby Bio-Dem increases the access to- and usefulness of GBIF data for researchers, policy makers, educators and students.


# Operating instructions
Bio-Dem is an open-source web-app, available at http://bio-dem.surge.sh. The core of the app are two interactive plots to explore the number of biological collections records in relation to political systems. 

The first plot is a scatterplot of data bubble for each country on Earth. The size of the bubbles indicates the number of occurrence record available from GBIF from this country and the colour of each bubble shows the time-aggregated political regime type. Drop down menus customize the x- and y-axis with different dimensions of democracy as provided by V-Dem (v8), as well as the colouring scheme. Values for each country are aggregated by median over a user-selected time period. This plot reveals the number of collection records in a two dimensional democracy space. Four example specifications highlighting particularly exciting results can be selected directly via special highlight buttons next to the plot.

The second plot focusses on the evolution of species occurrence recording through time in individual countries. A bar chart shows the number of occurrence records collected from the selected country each year on a logarithmic scale (fetched live via the GBIF API). The overlaid line shows the development of a selected democracy indicator. Red blocks at the bottom of the bars indicate years with armed conflict on the country territory. Users can chose any country and democracy indicator of interest with the drop-down menus, customize the record count to include only records from domestic institutions or records associated with pictures using the tick boxes and filter to certain taxa using the free text field.

Documentation and background information on Bio-Dem, the data used and the theoretical links between biologic collection activity and political variables are also provided at http://bio-dem.surge.sh, together with two video tutorials.


# Team members
Alexander Zizka<sup>1,3</sup>, Daniel Edler<sup>2,3</sup>, Johannes Klein<sup>3</sup>, Oskar Rydén<sup>3,4</sup>
1. V-Dem Institute, Department of Political Sciences, University of Gothenburg, Sweden
2. Department of Physics, University of Umeå, Sweden
3. Gothenburg Global Biodiversity Centre, University of Gothenburg, Sweden
4. Department of Biological and Environmental Sciences, University of Gothenburg, Sweden

# Link to source location
https://github.com/AntonelliLab/Bio-Dem

# Link to visuals
http://bio-dem.surge.sh/#tutorials

# Bug reports
https://github.com/AntonelliLab/Bio-Dem/issues.

# Contributing
If you want to contribute to the project, send a pull request or contact [us](mailto:bio-dem@googlegroups.com).

# Citation
Bio-Dem is published in
Zizka, A., Rydén, O., Edler, D., Klein, J., Perrigo, A., Silvestro, D., Jagers, S. C., Lindberg, S. I., & Antonelli, A. (2021). Bio-Dem, a tool to explore the relationship between biodiversity data availability and socio-political conditions in time and space. Journal of Biogeography, 48, 2715–2726. https://doi.org/10.1111/jbi.14256
