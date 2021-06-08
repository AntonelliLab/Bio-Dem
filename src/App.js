import React, { Component } from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Grid from "@material-ui/core/Grid";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import LinearProgress from "@material-ui/core/LinearProgress";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Zoom from "@material-ui/core/Zoom";
import Accordion from "@material-ui/core/Accordion";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import IconDownload from "@material-ui/icons/CloudDownload";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
// import IconPlay from '@material-ui/icons/PlayCircleOutline';
// import IconPause from '@material-ui/icons/PauseCircleOutline';
import * as d3 from "d3";
import { csv } from "d3-fetch";
import debounce from "lodash/debounce";
import throttle from "lodash/throttle";
import { saveAs } from "file-saver";
import {
  queryGBIFCountryFacet,
  queryAutocompletesGBIF,
  queryGBIFFacetPerYear,
} from "./api/gbif";
import About from "./About";
import logo from "./logo.svg";
import DualChart from "./d3/DualChart";
import ScatterPlot from "./d3/ScatterPlot";
import Brush from "./d3/Brush";
import { haveNaN } from "./d3/helpers";
import countryCodes from "./helpers/countryCodes";
import { hexToRGBA } from "./helpers/colors";
import AutoSelect, { MuiSelect, MuiMultiSelect } from "./components/AutoSelect";
import Notice from "./components/Notice";
import IconGithub from "./components/Github";
import WorldMap from "./components/WorldMap";
import "./App.css";
import "./d3/d3.css";

const MOCK_GBIF_REQUESTS = false;

/**
 * V-dem variables
country,year,v2x_regime,v2x_polyarchy,v2x_freexp_altinf,v2x_frassoc_thick,v2xcl_dmove,v2xcs_ccsi,v2x_corr,v2x_clphy,e_peaveduc,e_migdppc,conflict_hi,conflict_li
AFG,1960,0,0.093,0.179,0.12,0.218,0.254,0.482,0.369,0.31,2744,0,0
 */
const vdemDataUrl = `${process.env.PUBLIC_URL}/data/vdem_variables.csv`;

/**
 * V-dem variables explanations
 * id, full_name, short_name, description, relevance, references, comment
 */
const vdemExplanationsUrl = `${process.env.PUBLIC_URL}/data/vdem_variables_explanations.csv`;

/**
 * Country data
 * country,area,e_regionpol
AFG,642182,8
AGO,1244654,4
 */
const countryDataUrl = `${process.env.PUBLIC_URL}/data/country_data.csv`;

/**
 * Country data on colonial ties
iso2,iso3,cow_state,Name,indep_year,timesince,independence_from,cont_ent,cont_suppr
CA,CAN,20,Canada,1867,154,GB,Americas,Europe
BS,BHS,31,Bahamas,1973,48,GB,Americas,Europe
 */
const colonialTiesUrl = `${process.env.PUBLIC_URL}/data/colonial_ties.csv`;

/**
 * Gbif pre-downloaded data from api
country,year,records
AFG,1960,857
AFG,1961,445
 */
const gbifDataUrl = `${process.env.PUBLIC_URL}/data/gbif_data.csv`;

/**
 * Country data gbif participation status
iso3,iso2,name,status,member_since
AND,AD,Andorra,Voting participant,2010
AGO,AO,"Angola, Republic of",Associate country participant,2019
 */
const gbifParticipatingCountriesUrl = `${process.env.PUBLIC_URL}/data/gbif_participating_countries.csv`;

// The strings for the v-dem variables used to get the static data
const v2x_polyarchy = "v2x_polyarchy";
const v2x_freexp_altinf = "v2x_freexp_altinf";
const v2x_frassoc_thick = "v2x_frassoc_thick";
const v2x_corr = "v2x_corr";
const e_peaveduc = "e_peaveduc";
const e_migdppc = "e_migdppc";

// Error codes used within the app
const yearFacetQueryErrorCoded = "101";
const countryFacetQueryErrorCoded = "102";
const autocompletesQueryErrorCoded = "103";

const vdemOptions = [
  { value: v2x_polyarchy },
  { value: v2x_freexp_altinf },
  { value: v2x_frassoc_thick },
  { value: "v2xcl_dmove" },
  { value: "v2xcs_ccsi" },
  { value: v2x_corr },
  { value: "v2x_clphy" },
  { value: e_peaveduc },
  { value: e_migdppc },
];

const circleSizeOptions = [
  {
    value: "records",
    label: "Number of records",
  },
  {
    value: "recordsPerArea",
    label: "Records per area",
  },
];

const extraYOptions = [
  ...circleSizeOptions,
  {
    value: "yearsSinceIndependence",
    label: "Years since independence",
  },
];

const scatterYOptions = extraYOptions.concat(vdemOptions);

const worldMapColorByOptions = [
  {
    value: "publishingCountry",
    label: "Publishing country",
  },
  ...scatterYOptions,
];

const scatterYOptionsLabelMap = new Map(
  scatterYOptions.map((d) => [d.value, d.label]),
);

const worldMapColorByOptionsLabelMap = new Map(
  worldMapColorByOptions.map((d) => [
    d.value,
    d.value === "publishingCountry" ? "Number of records" : d.label,
  ]),
);

const gbifExplanations = [
  {
    id: "records",
    label: "Number of records",
    short_name: "Number of records",
    full_name: "Number of GBIF records",
    description:
      "Number of species occurrence records in GBIF in selected years.",
    relevance:
      "This variable indicates the level of scientific knowledge and information available of biodiversity records in a country, as defined by GBIF.",
  },
  {
    id: "recordsPerArea",
    label: "Records per area",
    short_name: "Records per area",
    full_name: "Number of GBIF records",
    description:
      "Number of species occurrence records in GBIF in selected years per country area.",
    relevance:
      "This variable accounts for the fact that the size of a country might affect the absolute number of records collected.",
  },
  {
    id: "yearsSinceIndependence",
    label: "Years since independence",
    short_name: "Years since independence",
    full_name:
      "Number of years since independence from last imperial suppressor",
    description:
      "The time since independence from the last imperial suppressor. Only for colonial ties outside Europe and for connection of countries on different continents. Countries with no such data are filtered out.",
    relevance:
      "The longer a country is independent, the more time there may be for establishment of domestic scientific institutions and the lower the on-going ties of scientific dependency to the former imperialistic power may be.",
  },
];

const regimeTypes = {
  0: "Closed autocracy",
  1: "Electoral autocracy",
  2: "Electoral democracy",
  3: "Liberal democracy",
};

const regions = {
  1: "Eastern Europe and Central Asia",
  2: "Latin America",
  3: "The Middle East and North Africa",
  4: "Sub-Saharan Africa",
  5: "Western Europe and North America",
  6: "East Asia",
  7: "South-East Asia",
  8: "South Asia",
  9: "The Pacific",
  10: "The Carribean",
  NA: "NA",
};

const regionOptions = d3.range(0, 11).map((id) => ({
  value: id,
  label: id === 0 ? "All regions" : regions[id],
}));

const colorByOptions = [
  {
    value: "regime",
    label: "Regime type",
  },
  {
    value: "region",
    label: "Region",
  },
  {
    value: "gbifParticipationStatus",
    label: "GBIF participation",
  },
  {
    value: "colonialHistory",
    label: "Colonial history",
  },
];

const getColonialOtherCountry = (country, countryMap) => {
  const countryData = countryMap[country];
  let otherCountry = countryData.colonised || countryData.coloniser;
  if (otherCountry) {
    otherCountry = countryCodes.alpha3ToAlpha2(otherCountry);
  }
  return otherCountry;
};

const dualChartColorByOptions = [
  {
    value: "none",
    label: "None",
  },
  {
    value: "regime",
    label: "Regime type",
  },
  {
    value: "basisOfRecord",
    label: "Basis of record",
  },
  {
    value: "publishingCountry",
    label: "Publishing country",
  },
];

const dualChartShowProportionsOptions = [
  {
    value: "publishedByDomestic",
    label: "Published by domestic",
  },
  {
    value: "publishedByFormerColoniser",
    label: "Published by former coloniser",
  },
  {
    value: "preservedSpecimen",
    label: "Preserved specimen",
  },
];

const showProportionsLabelMap = new Map(
  dualChartShowProportionsOptions.map(({ value, label }) => [value, label]),
);
const getShowProportionsLabel = (value) => {
  return showProportionsLabelMap.get(value);
};

const regimeColor = d3.scaleSequential(d3.interpolateViridis).domain([0, 3]);

const regionColor = (regionCode) => {
  if (regionCode > 0 && regionCode <= 10) {
    return d3.schemeCategory10[regionCode - 1];
  }
  return "#000000";
};

const GBIF_PARTICIPATION_VALUES = [
  "Voting participant",
  "Associate country participant",
  "Not a participant",
];

const gbifParticipationColor = (status) => {
  switch (status) {
    case "Voting participant":
      // return "#e41a1c";
      // return "#1b9e77";
      // return "#399B92";
      return regimeColor(2);
    case "Associate country participant":
      // return "#377eb8";
      // return "#d95f02";
      // return "#486293";
      return regimeColor(1);
    default:
      return "#888888";
  }
};

const colonialHistoryColor = (status) => {
  switch (status) {
    case "colonised":
      return regimeColor(2);
    case "coloniser":
      return regimeColor(1);
    default:
      return "#888888";
  }
};
const countryLabelSuffixByGbifParticipationStatus = {
  "Voting participant": "ᵛ",
  "Associate country participant": "ᵃ",
  "Not a participant": "",
};
const countryLabelWithGbifParticipation = (d) =>
  `${d.label} ${
    countryLabelSuffixByGbifParticipationStatus[d.gbifParticipationStatus]
  }`;

// Some external variables lack data for all countries before or after a certain year
const customStartYear = {};
const customStopYear = {
  e_peaveduc: 2010,
  e_migdppc: 2016,
};

const yAxisLabelGap = {
  e_migdppc: 80,
};

const vdemScaleMax = {
  v2x_polyarchy: 1,
  v2x_freexp_altinf: 1,
  v2x_frassoc_thick: 1,
  v2xcl_dmove: 1,
  v2xcs_ccsi: 1,
  v2x_corr: 1,
  v2x_clphy: 1,
  e_peaveduc: 15,
  e_migdppc: 2e5,
  records: 1e8,
  recordsPerArea: 1e3,
  yearsSinceIndependence: 240,
  publishingCountry: null,
};

const vdemScaleMin = {
  v2x_polyarchy: 0,
  v2x_freexp_altinf: 0,
  v2x_frassoc_thick: 0,
  v2xcl_dmove: 0,
  v2xcs_ccsi: 0,
  v2x_corr: 0,
  v2x_clphy: 0,
  e_peaveduc: 0,
  e_migdppc: 2e2,
  records: 1e2,
  recordsPerArea: 1e-2,
  yearsSinceIndependence: 0,
  publishingCountry: null,
};

const aggregationMethod = {
  v2x_regime: "mean",
  v2x_polyarchy: "median",
  v2x_freexp_altinf: "median",
  v2x_frassoc_thick: "median",
  v2xcl_dmove: "median",
  v2xcs_ccsi: "median",
  v2x_corr: "median",
  v2x_clphy: "median",
  e_peaveduc: "median",
  e_migdppc: "median",
  records: "sum",
  recordsPerArea: "sum",
  yearsSinceIndependence: "mean", // constant
};

const useLogScale = {
  records: true,
  recordsPerArea: true,
  e_migdppc: true,
  publishingCountry: true,
};

const BioDemLogo = ({ className = "logo", alt = "logo" }) => (
  <img src={logo} className={className} alt={alt} />
);

const RegimeLegend = ({ fillOpacity = 0.5 }) => (
  <Grid container className="regimeLegend" justify="center">
    {Object.keys(regimeTypes).map((v) => (
      <div key={v} style={{ padding: 5, fontSize: "0.75em" }}>
        <span
          style={{
            border: `1px solid ${regimeColor(v)}`,
            backgroundColor: hexToRGBA(regimeColor(v), fillOpacity),
            marginRight: 2,
          }}
        >
          &nbsp;&nbsp;&nbsp;
        </span>
        {regimeTypes[v]}
      </div>
    ))}
  </Grid>
);

const RegionLegend = ({ fillOpacity = 0.5 }) => (
  <Grid container className="regionLegend" justify="center">
    {Object.keys(regions).map((v) => (
      <div key={v} style={{ padding: 5, fontSize: "0.75em" }}>
        <span
          style={{
            border: `1px solid ${regionColor(v)}`,
            backgroundColor: hexToRGBA(regionColor(v), fillOpacity),
            marginRight: 2,
          }}
        >
          &nbsp;&nbsp;&nbsp;
        </span>
        {regions[v]}
      </div>
    ))}
  </Grid>
);

const GbifParticipationLegend = ({ fillOpacity = 0.5 }) => (
  <Grid container className="gbifParticipationLegend" justify="center">
    {GBIF_PARTICIPATION_VALUES.map((v) => (
      <div key={v} style={{ padding: 5, fontSize: "0.75em" }}>
        <span
          style={{
            border: `1px solid ${gbifParticipationColor(v)}`,
            backgroundColor: hexToRGBA(gbifParticipationColor(v), fillOpacity),
            marginRight: 2,
          }}
        >
          &nbsp;&nbsp;&nbsp;
        </span>
        {v}
      </div>
    ))}
  </Grid>
);

const COLONIAL_HISTORY_ITEMS = [
  { key: "colonised", label: "Former colony" },
  { key: "coloniser", label: "Former colonialist suppressor" },
];

const ColonialHistoryLegend = ({ fillOpacity = 0.5 }) => (
  <Grid container className="colonialHistoryLegend" justify="center">
    {COLONIAL_HISTORY_ITEMS.map(({ key, label }) => (
      <div key={key} style={{ padding: 5, fontSize: "0.75em" }}>
        <span
          style={{
            border: `1px solid ${colonialHistoryColor(key)}`,
            backgroundColor: hexToRGBA(colonialHistoryColor(key), fillOpacity),
            marginRight: 2,
          }}
        >
          &nbsp;&nbsp;&nbsp;
        </span>
        {label}
      </div>
    ))}
  </Grid>
);

const ColorLegend = ({ type }) => {
  switch (type) {
    case "regime":
      return <RegimeLegend />;
    case "region":
      return <RegionLegend />;
    case "gbifParticipationStatus":
      return <GbifParticipationLegend />;
    case "colonialHistory":
      return <ColonialHistoryLegend />;
    default:
      return null;
  }
};

ColorLegend.propTypes = {
  type: PropTypes.oneOf([
    "regime",
    "region",
    "gbifParticipationStatus",
    "colonialHistory",
  ]),
};

const HighlightsPanel = (props) => (
  <div className="highlightsContainer">
    <Typography variant="subtitle1" gutterBottom style={{ paddingLeft: 0 }}>
      Highlights
    </Typography>
    <React.Fragment>
      {props.highlights.map((h, index) => (
        <Accordion
          key={index}
          expanded={props.value === index}
          onChange={() => props.onChange(index)}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`${props.label}_panel${index}-content`}
            id={`${props.label}_panel${index}-header`}
          >
            <Typography>{h.buttonLabel}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              {props.highlights[index].explanation}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </React.Fragment>
  </div>
);

const CountryHighlight = ({ code, name, onClick }) => (
  <strong className="country-highlight" onClick={() => onClick(code)}>
    {name}
  </strong>
);

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    // maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: "1px solid #dadde9",
  },
}))(Tooltip);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gbifData: [],
      gbifError: {},
      vdemData: [],
      vdemExplanations: [],
      variableExplanations: {}, // Combination of vdem and gbif explanations mapped by variable id
      loaded: false,
      fetching: false,
      data: null,
      countries: [],
      yearMin: 1960,
      yearMax: 2020,
      // yearMin: 1990,
      // yearMax: 1995,
      // ScatterPlot:
      vdemX: v2x_freexp_altinf,
      vdemY: v2x_frassoc_thick,
      vdemZ: "records",
      xyYearMin: 1960,
      xyYearMax: 2019,
      worldYearMin: 1960,
      worldYearMax: 2019,
      worldMapDataScaleMin: 0,
      worldMapDataScaleMax: 1,
      colorBy: "regime",
      dualChartColorBy: "regime", // ["none", "regime", "basisOfRecord", "publishingCountry"]
      mapColorBy: "publishingCountry", // "records",
      dualChartShowProportions: ["publishedByDomestic", "preservedSpecimen"], // ["publishedByDomestic", "publishedByFormerColoniser", "preservedSpecimen"]
      // dualChartShowProportions: dualChartShowProportionsOptions.slice(0, 1), // ["publishedByDomestic", "preservedSpecimen"], // ["publishedByDomestic", "publishedByFormerColoniser", "preservedSpecimen"]
      regionFilter: 0,
      // DualChart
      // country: "SWE",
      // country: "SYR",
      country: "MDG",
      vdemVariable: v2x_freexp_altinf,
      onlyDomestic: false,
      onlyWithImage: false,
      onlyPreservedSpecimen: false,
      // Taxon filter
      taxonFilter: "",
      filterTaxon: undefined,
      taxaAutocompletes: [],
      // Active highlights
      activeScatterPlotHighlight: null,
      activeDualChartHighlight: null,
      worldMapData: new Map(), // country => value (alpha3 to value of mapColorBy)
    };
    this.refScatterPlot = React.createRef();
    this.refBrush = React.createRef();
    this.refBrushWorld = React.createRef();
    this.refDualChart = React.createRef();
    this.refWorldMap = React.createRef();

    const Country = ({ code, name }) => (
      <CountryHighlight
        code={code}
        name={name}
        onClick={this.onClickHighlightCountry}
      />
    );

    this.scatterPlotHighlights = [
      {
        buttonLabel: "GDP",
        explanation: (
          <span>
            Democratic and economically developed countries often have many GBIF
            records (large bubbles cluster in the upper right corner of the
            plot). However, some economically rich countries have very few
            records (small bubbles with high values on the y-axis:{" "}
            <Country code="CYP" name="Cyprus" />,{" "}
            <Country code="LBY" name="Libya" />
            ), and some relatively less developed countries have a large number
            of records (<Country code="CHN" name="China" />,{" "}
            <Country code="IND" name="India" />,{" "}
            <Country code="TZA" name="Tanzania" /> and{" "}
            <Country code="BTN" name="Uganda" />
            ), indicating heterogeneity of biological record collection across
            both democracy and economic development.
          </span>
        ),
        onActivatedNewState: {
          vdemY: e_migdppc,
          vdemX: v2x_polyarchy,
          xyYearMin: 1960,
          worldYearMin: 1960,
          colorBy: "regime",
        },
      },
      {
        buttonLabel: "Education",
        explanation: (
          <span>
            The number of available occurrence records increases with GDP per
            capita and length of education (bubble size increases from the lower
            left to the upper right corner). For instance,{" "}
            <Country code="BDI" name="Burundi" /> (purple bubble in the lower
            left corner) and <Country code="CAN" name="Canada" /> (yellow bubble
            in the upper right corner), are typical examples for this trend. In
            contrast <Country code="IND" name="India" /> does not follow the
            general pattern, being a large bubble in the lower left corner.
          </span>
        ),
        onActivatedNewState: {
          vdemY: e_peaveduc,
          vdemX: e_migdppc,
          xyYearMin: 1960,
          worldYearMin: 1960,
          colorBy: "regime",
        },
      },
    ];

    this.dualChartHighlights = [
      {
        buttonLabel: "Angola",
        explanation: (
          <span>
            The Angolan Civil War. In 1975, when the Angolan Civil War broke
            out, the collection activity drops drastically. This pattern is
            valid up until the end of the 1990's, a couple of years before the
            war ended and is visible for domestic and total collections. Ticking
            the "only domestic records box" furthermore reveals the importance
            of foreign collections for the country, especially until the mid
            1990ies.
          </span>
        ),
        onActivatedNewState: {
          country: "AGO",
          vdemVariable: v2x_polyarchy,
          onlyDomestic: false,
          onlyWithImage: false,
          filterTaxon: null,
        },
      },
      {
        buttonLabel: "India",
        explanation: (
          <span>
            The Emergency in India 1975 and domestic records. From 1975 and
            1977, "The Emergency" took place in India, an event of political
            turmoil where the prime minister declared a state of emergency and
            put political rights on freeze in order to take control over the
            rule. We see that this instability event coincides with a drop in
            domestic biological record collection.
          </span>
        ),
        onActivatedNewState: {
          country: "IND",
          vdemVariable: v2x_polyarchy,
          onlyDomestic: true,
          onlyWithImage: false,
          filterTaxon: null,
        },
      },
      {
        buttonLabel: "Czechia",
        explanation: (
          <span>
            The fall of the Soviet Union. In Czechia, record availability from
            domestic institutions only starts after the Soviet Union collapsed.
            Possibly a partial effect from the political liberalization and the
            country's independence."
          </span>
        ),
        onActivatedNewState: {
          country: "CZE",
          vdemVariable: v2x_polyarchy,
          onlyDomestic: true,
          onlyWithImage: false,
          filterTaxon: null,
        },
      },
      {
        buttonLabel: "Cambodia",
        explanation: (
          <span>
            Decades of political instability in Cambodia. Starting in the
            1970\'s, Cambodia experienced a long period of conflicts and
            autocratization, which coincides with a decrease in biological
            record collection during this period.
          </span>
        ),
        onActivatedNewState: {
          country: "KHM",
          vdemVariable: v2x_polyarchy,
          onlyDomestic: false,
          onlyWithImage: false,
          filterTaxon: null,
        },
      },
      {
        buttonLabel: "Indonesia",
        explanation: (
          <span>
            Economic development and domestic collections in Indonesia. In the
            beginning of the 1980\'s, we see a start of domestic record
            collection that which increases following Indonesia\'s acceleration
            in gross domestic product per capita increase in the 1990\'ies.
            Displaying all records show that the proportion collected by
            domestic institutions also increases.
          </span>
        ),
        onActivatedNewState: {
          country: "IDN",
          vdemVariable: e_migdppc,
          onlyDomestic: true,
          onlyWithImage: false,
          filterTaxon: null,
        },
      },
    ];
  }

  async componentDidMount() {
    // Add an event listener that fires when the window get's resized
    window.addEventListener("resize", this.onResize, false);
    // Load the initial batch of data required on app start
    await this.initData();
  }

  async componentDidUpdate(prevProps, prevState) {
    // Changes in state that require a new GBIF year facet query
    const fetchNewCountryCondition =
      this.state.onlyDomestic !== prevState.onlyDomestic ||
      this.state.country !== prevState.country ||
      this.state.taxonFilter !== prevState.taxonFilter ||
      this.state.onlyWithImage !== prevState.onlyWithImage ||
      this.state.onlyPreservedSpecimen !== prevState.onlyPreservedSpecimen;

    if (fetchNewCountryCondition) {
      // Get alpha2 ISO code for this country, as this is what GBIF requires as query
      await this.makeYearFacetQuery(
        countryCodes.alpha3ToAlpha2(this.state.country),
      );
      this.setState({
        worldMapLoading: false,
      });
    }
  }

  getEnabledExtraCurves = () => {
    const { country, dualChartColorBy } = this.state;
    const enabledCurves = [];
    // if (dualChartColorBy !== "basisOfRecord") {
    enabledCurves.push("preservedSpecimen");
    // }
    // if (dualChartColorBy !== "publishingCountry") {
    enabledCurves.push("publishedByDomestic");
    if (this.countryMap && this.countryMap[country].colonised) {
      enabledCurves.push("publishedByFormerColoniser");
      // }
    }
    return enabledCurves;
  };

  onResize = () => {
    if (this.rqf) {
      return;
    }
    this.rqf = window.requestAnimationFrame(() => {
      this.rqf = null;
      // Re-render charts with new size
      this.renderCharts();
      this.renderBrush();
    });
  };

  async fetchData() {
    if (this.state.data) {
      return this.state.data;
    }
    this.setState({
      fetching: true,
    });
    const vdemDataPromise = csv(vdemDataUrl, (row) => {
      const year = +row.year;
      if (Number.isNaN(year)) {
        return null;
      }
      return {
        country: row.country,
        year: +row.year,
        v2x_regime: +row.v2x_regime,
        v2x_polyarchy: +row.v2x_polyarchy,
        v2x_freexp_altinf: +row.v2x_freexp_altinf,
        v2x_frassoc_thick: +row.v2x_frassoc_thick,
        v2xcl_dmove: +row.v2xcl_dmove,
        v2xcs_ccsi: +row.v2xcs_ccsi,
        v2x_corr: +row.v2x_corr,
        v2x_clphy: +row.v2x_clphy,
        e_peaveduc: +row.e_peaveduc,
        e_migdppc: +row.e_migdppc,
        conflict_major: +row.conflict_hi,
        conflict_minor: +row.conflict_li,
      };
    });
    const vdemExplanationsPromise = csv(vdemExplanationsUrl, (row) => {
      return {
        id: row.id,
        full_name: row.full_name,
        short_name: row.short_name,
        description: row.description,
        relevance: row.relevance,
        references: row.references,
      };
    });
    const countryDataPromise = csv(countryDataUrl, (row) => {
      if (!countryCodes.alpha3ToAlpha2(row.country)) {
        console.log("country code not translatable:", row.country);
      }
      return {
        value: row.country,
        label: countryCodes.getName(row.country),
        area: +row.area,
        regionCode: +row.e_regionpol,
        regionName: regions[row.e_regionpol],
      };
    });
    const colonialTiesPromise = csv(colonialTiesUrl, (row) => {
      /**
       * iso2,iso3,cow_state,Name,indep_year,timesince,independence_from,cont_ent,cont_suppr
CA,CAN,20,Canada,1867,154,GB,Americas,Europe
BS,BHS,31,Bahamas,1973,48,GB,Americas,Europe
       */
      return {
        colonisedCountry: row.iso3,
        colonisedContinent: row.cont_ent,
        coloniserCountry: countryCodes.alpha2ToAlpha3(row.independence_from),
        coloniserContinent: row.cont_suppr,
        yearOfIndependence: +row.indep_year,
      };
    });
    const gbifDataPromise = csv(gbifDataUrl, (row) => {
      return {
        country: row.country,
        year: +row.year,
        records: row.records,
      };
    });
    const gbifParticipatingCountriesPromise = csv(
      gbifParticipatingCountriesUrl,
      (row) => {
        /**
       * iso3,iso2,name,status,member_since
AND,AD,Andorra,Voting participant,2010
AGO,AO,"Angola, Republic of",Associate country participant,2019
       */
        return {
          country: row.iso3,
          status: row.status,
          since: +row.member_since,
        };
      },
    );
    const [
      vdemData,
      vdemExplanations,
      countryData,
      colonialTies,
      gbifYearlyCountryData,
      gbifParticipatingCountries,
    ] = await Promise.all([
      vdemDataPromise,
      vdemExplanationsPromise,
      countryDataPromise,
      colonialTiesPromise,
      gbifDataPromise,
      gbifParticipatingCountriesPromise,
    ]);
    const gbifParticipationMap = new Map(
      gbifParticipatingCountries.map((d) => [d.country, d]),
    );
    const colonisedCountries = new Map(
      colonialTies.map((d) => [d.colonisedCountry, d]),
    );
    const coloniserCountries = new Map(
      colonialTies.map((d) => [d.coloniserCountry, d]),
    );
    const currentYear = new Date().getFullYear();
    const yearsSinceIndependenceMap = new Map(
      colonialTies.map((d) => [
        d.colonisedCountry,
        currentYear - d.yearOfIndependence,
      ]),
    );
    vdemData.forEach((d) => {
      const years = yearsSinceIndependenceMap.get(d.country);
      if (years !== undefined) {
        d.yearsSinceIndependence = years;
      }
    });

    const countryMap = {};
    countryData.forEach((d) => {
      const gbifParticipation = gbifParticipationMap.get(d.value);
      if (gbifParticipation !== undefined) {
        d["gbifParticipationStatus"] = gbifParticipation.status;
        d["gbifParticipationSince"] = gbifParticipation.since;
        d[
          "gbifParticipationText"
        ] = `${gbifParticipation.status} (since ${gbifParticipation.since})`;
      } else {
        d["gbifParticipationStatus"] = "Not a participant";
        d["gbifParticipationText"] = "Not a participant";
      }
      const colonisedData = colonisedCountries.get(d.value);
      const coloniserData = coloniserCountries.get(d.value);
      d["colonised"] = colonisedData ? colonisedData.coloniserCountry : null;
      d["coloniser"] = coloniserData ? coloniserData.coloniserCountry : null;
      d["yearOfIndependence"] = colonisedData
        ? colonisedData.yearOfIndependence
        : null;
      d["colonialHistory"] = d["colonised"]
        ? "colonised"
        : d["coloniser"]
        ? "coloniser"
        : "";
      countryMap[d.value] = d;
    });
    this.countryMap = countryMap;

    await this.makeYearFacetQuery(
      countryCodes.alpha3ToAlpha2(this.state.country),
    );
    // this.makeCountryFacetQuery();

    countryData.sort((a, b) => a.label.localeCompare(b.label));

    const data = {
      vdemData,
      vdemExplanations,
      countryData,
      colonialTies,
      gbifYearlyCountryData,
      gbifParticipatingCountries,
    };
    this.setState({
      loaded: true,
      fetching: false,
      data,
    });
    return data;
  }

  async initData() {
    const data = await this.fetchData();
    const { vdemData, vdemExplanations, countryData, gbifYearlyCountryData } =
      data;
    const variableExplanations = {};
    vdemExplanations.forEach((d) => {
      variableExplanations[d.id] = d;
      scatterYOptionsLabelMap.set(d.id, d.short_name);
    });
    gbifExplanations.forEach((d) => {
      variableExplanations[d.id] = d;
      scatterYOptionsLabelMap.set(d.id, d.short_name);
    });

    vdemOptions.forEach((d) => {
      const info = variableExplanations[d.value];
      if (!info) {
        console.log("Missing explanation for value:", d.value);
      } else {
        d.label = info.short_name;
      }
    });

    // Integrate gbif data into vdem data
    const gbifDataPerCountryAndYear = {};
    gbifYearlyCountryData.forEach((d) => {
      gbifDataPerCountryAndYear[`${d.country}-${d.year}`] = d.records;
    });

    vdemData.forEach((d) => {
      const numRecords =
        gbifDataPerCountryAndYear[`${d.country}-${d.year}`] || 0;
      d.records = numRecords;
      d.recordsPerArea = numRecords / this.countryMap[d.country].area;
    });

    this.setState(
      {
        loaded: true,
        vdemData,
        vdemExplanations,
        variableExplanations,
        countries: countryData,
      },
      () => {
        this.renderCharts();
        this.renderBrush();

        this.generateWorldMapData();
      },
    );
  }

  /**
   * For the bar plot
   * Query the GBIF API for a year facet search,
   * prepare and handle negative or postive results.
   */
  makeYearFacetQuery = async (country) => {
    const {
      onlyWithImage,
      taxonFilter,
      onlyPreservedSpecimen,
      yearMin,
      yearMax,
    } = this.state;
    // Build up state for a query
    const gbifError = Object.assign({}, this.state.gbifError);
    delete gbifError[yearFacetQueryErrorCoded];
    this.setState({ fetching: true, gbifError });

    const otherCountry = getColonialOtherCountry(
      countryCodes.alpha2ToAlpha3(country),
      this.countryMap,
    );

    const queryGBIFFacetPerYearMock = () => Promise.resolve({ data: [] });
    const queryFunction = MOCK_GBIF_REQUESTS
      ? queryGBIFFacetPerYearMock
      : queryGBIFFacetPerYear;
    // Query the GBIF API
    const result = await queryFunction(country, {
      onlyWithImage,
      taxonFilter,
      onlyPreservedSpecimen,
      otherCountry,
      yearMin,
      yearMax,
    });

    // If the query errored out set to error state
    if (result.error) {
      const gbifError = Object.assign({}, this.state.gbifError);
      gbifError[yearFacetQueryErrorCoded] = result.error;
      this.setState({ fetching: false, gbifError });
      return;
    }
    // Fetching is complete rerender chart
    this.setState(
      {
        gbifData: result.data,
        fetching: false,
      },
      () => {
        this.renderCharts();
      },
    );
  };

  /**
   * For the scatter plot:
   * Query the GBIF API for a country facet search,
   * prepare and handle negative or postive results.
   */
  makeCountryFacetQuery = async () => {
    // Build up state for a query
    const gbifError = Object.assign({}, this.state.gbifError);
    delete gbifError[countryFacetQueryErrorCoded];
    this.setState({ fetching: true, gbifError });
    // Query the GBIF API
    const result = await queryGBIFCountryFacet(this.state.xyYearMin);
    // If the query errored out set to error state
    if (result.error) {
      const gbifError = Object.assign({}, this.state.gbifError);
      gbifError[countryFacetQueryErrorCoded] = result.error;
      this.setState({ fetching: false, gbifError });
      return;
    }
    // Transform the result as required for the ScatterPlot
    const gbifCountryFacetData = {};
    result.response.data.facets[0].counts.map((d) => {
      gbifCountryFacetData[countryCodes.alpha2ToAlpha3(d.name)] = {
        count: d.count,
      };
      return true;
    });
    // Fetching is complete rerender chart
    this.setState(
      {
        gbifCountryFacetData,
        fetching: false,
      },
      () => {
        this.renderCharts();
      },
    );
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value }, () => {
      this.renderCharts();
    });
  };

  handleMapChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value }, () => {
      this.generateWorldMapData();
    });
  };

  handleCountryChange = async (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  /**
   * Generic handler for setting state for a new display conformation for the {@link DualChart},
   * then trigger rerender.
   */
  onDualChartChange = (event) => {
    this.setState(
      {
        [event.target.name]: event.target.value,
      },
      () => {
        this.renderDualChart();
      },
    );
  };

  onDualChartChangeShowProportions = (event) => {
    this.setState(
      {
        [event.target.name]: event.target.value,
      },
      () => {
        this.renderDualChart();
      },
    );
  };

  onInputChangeTaxonFilter = debounce(
    (newValue) => {
      if (newValue.length > 1) {
        this.makeAutocompletesQuery(newValue);
      } else if (newValue === "") {
        // this.setState({ taxonFilter: '' });
      }
    },
    400,
    { maxWait: 3000 },
  );

  /**
   * Query the GBIF autocompletes API, prepare and handle negative or postive results.
   */
  makeAutocompletesQuery = async (newValue) => {
    // Build up state for a query
    const gbifError = Object.assign({}, this.state.gbifError);
    delete gbifError[autocompletesQueryErrorCoded];
    this.setState({ fetching: true, gbifError });
    // TODO: This queries the suggest API of GBIF which is not really good customizable
    // TODO: Maybe some result filtering to not show "synonyms" or only specific ranks
    // TODO: One more filter option for this API is by rank, maybe good idea to query for only the higher ranks and Promise all together
    // Query autocompletes API
    const result = await queryAutocompletesGBIF(newValue);
    // If the query errored out set to error state
    if (result.error) {
      const gbifError = Object.assign({}, this.state.gbifError);
      gbifError[autocompletesQueryErrorCoded] = result.error;
      this.setState({ fetching: false, gbifError });
      return;
    }
    // Transform the taxa array as required for dropdown menu
    const taxaAutocompletes = result.response.data.map((t) => ({
      label: t.canonicalName,
      value: t.nubKey || t.key,
    }));
    // Save retrieved taxa to state
    this.setState({ taxaAutocompletes, fetching: false });
  };

  onScatterPlotClickCountry = (d) => {
    this.setState({
      country: d.key,
    });
  };

  /**
   * Function to set the {@link ScatterPlot} to a specific state. Called when one of the highlight buttons is pressed.
   */
  onScatterPlotHighlightsChange = (index) => {
    // Set state for button being selected
    this.setState({
      activeScatterPlotHighlight:
        index === this.state.activeScatterPlotHighlight ? null : index,
    });
    // If the current highlight is deselected, do nothing
    if (index === null) {
      return;
    }
    // Set the state of the ScatterPlot as defined in the highlights array
    this.setState(this.scatterPlotHighlights[index].onActivatedNewState, () => {
      this.renderScatterPlot();
    });
  };

  /**
   * Function to set the {@link DualChart} to a specific state. Called when one of the highlight buttons is pressed.
   */
  onDualChartHighlightsChange = (index) => {
    // Set state for button being selected
    this.setState({
      activeDualChartHighlight:
        index === this.state.activeDualChartHighlight ? null : index,
    });
    // If the current highlight is deselected, do nothing
    if (index === null) {
      return;
    }
    // Set the state of the DualChart as defined in the highlights array
    this.setState(this.dualChartHighlights[index].onActivatedNewState, () => {
      this.renderDualChart();
    });
  };

  onScatterPlotChangeColorBy = (event) => {
    this.setState(
      {
        [event.target.name]: event.target.value,
      },
      () => {
        this.renderScatterPlot();
      },
    );
  };

  onScatterPlotChangeRegionFilter = (event) => {
    this.setState(
      {
        [event.target.name]: event.target.value,
      },
      () => {
        this.renderScatterPlot();
        this.renderBrush();
      },
    );
  };

  onScatterPlotChangeBubbleSizeBy = (event) => {
    const { value, checked } = event.target;
    this.setState(
      {
        [value]: checked,
      },
      () => {
        this.renderScatterPlot();
      },
    );
  };

  generateSVGContent = (parent) => {
    let svgContent = parent.innerHTML;
    svgContent = svgContent.replace(
      /^<svg/,
      [
        "<svg",
        'xmlns="http://www.w3.org/2000/svg"',
        'xmlns:xlink="http://www.w3.org/1999/xlink"',
        'version="1.1"',
      ].join(" "),
    );
    svgContent = svgContent.replace(/<\/svg>[\s\S]*/, "</svg>");
    // Safari inserts NS1/NS2 namespaces as xlink is not defined within the svg html
    svgContent = svgContent.replace("NS1", "xlink");
    svgContent = svgContent.replace("NS2", "xlink");
    return new Blob([svgContent], { type: "image/svg+xml" });
  };

  onClickSaveScatterPlotData = () => {
    const { vdemX, vdemY } = this.state;

    // [{ key, value: { records, recordsPerArea, x, y }}]
    // key is language code, x and y is axis values
    const data = this.generateScatterPlotData();
    const lines = [`country,records,records_per_area,${vdemX},${vdemY}`];
    data.forEach((d) => {
      const { records, recordsPerArea, x, y } = d.value;
      lines.push(`${d.key},${records},${recordsPerArea},${x},${y}`);
    });
    lines.push("\n");

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "bio-dem_scatterplot.csv");
  };

  onClickSaveDualChartData = () => {
    const { vdemVariable } = this.state;

    const data = this.generateDualChartData();
    const lines = [
      [
        "country",
        "year",
        "records",
        "records_per_area",
        `${vdemVariable}`,
        "conflict_major",
        "conflict_minor",
        "records_domestic",
        "records_coloniser",
        "records_preserved_specimen",
      ].join(","),
    ];
    data.forEach((d) => {
      lines.push(
        `${d.country},${d.year},${d.records},${d.recordsPerArea},${d.y2},${
          d.conflict_major ? "1" : "0"
        }${d.conflict_minor ? "1" : "0"},${d.countDomestic},${
          d.countColoniser
        },${d.countPreserved}`,
      );
    });
    lines.push("\n");

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "bio-dem_dualchart.csv");
  };

  onClickSaveWorldMapData = () => {
    const { worldMapData, mapColorBy } = this.state;
    const lines = [`country,${mapColorBy}`];
    worldMapData.forEach((value, country) => {
      lines.push(`${country},${value}`);
    });
    lines.push("\n");
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "bio-dem_worldmap.csv");
  };

  onClickSaveScatterPlotSVG = () => {
    const blob = this.generateSVGContent(this.refScatterPlot.current);
    saveAs(blob, "bio-dem_scatterplot.svg");
  };

  onClickSaveDualChartSVG = () => {
    const blob = this.generateSVGContent(this.refDualChart.current);
    saveAs(blob, "bio-dem_dualchart.svg");
  };

  onClickSaveWorldMapSVG = () => {
    const blob = this.generateSVGContent(this.refWorldMap.current);
    saveAs(blob, "bio-dem_worldmap.svg");
  };

  onClickPlay = () => {
    this.setState({
      isPlaying: true,
    });
  };

  onClickPause = () => {
    this.setState({
      isPlaying: false,
    });
  };

  onClickHighlightCountry = (code) => {
    this.setState({
      country: code,
    });
  };

  onWorldMapMouseOver = (countryCode) => {
    this.setState({
      worldMapMouseOverCountry: countryCode,
    });
  };
  onWorldMapMouseOut = () => {
    this.setState({
      worldMapMouseOverCountry: null,
    });
  };
  onWorldMapClick = (countryCode) => {
    if (countryCode === null || countryCode === this.state.country) {
      return;
    }
    this.setState({
      country: countryCode,
    });
  };

  /**
   * Get valid year range for selected data dimensions
   * This will adjust for data limits where certain dimensions lack values for all countries.
   * @param {Array<Number>|Number} dimensions dimensions to check for constraints on valid years
   * @param {Number} defaultStartYear default value if not constrained
   * @returns {Array<Number>} an array with [startYear, endYear]
   */
  getValidYears(dimension, defaultStartYear = 1960, defaultEndYear = 2019) {
    const dim = Array.isArray(dimension) ? dimension : [dimension];
    return [
      d3.max([...dim.map((d) => customStartYear[d]), defaultStartYear]),
      d3.min([...dim.map((d) => customStopYear[d]), defaultEndYear]),
    ];
  }

  onBrush = throttle((domain) => {
    const [xyYearMin, xyYearMax] = domain.map((d) => d.getFullYear());
    if (
      xyYearMin !== this.state.xyYearMin ||
      xyYearMax !== this.state.xyYearMax
    ) {
      this.setState(
        {
          xyYearMin,
          xyYearMax,
        },
        () => {
          this.renderScatterPlot();
        },
      );
    }
  }, 50);

  onBrushWorld = throttle((domain) => {
    const [worldYearMin, worldYearMax] = domain.map((d) => d.getFullYear());
    if (
      worldYearMin !== this.state.worldYearMin ||
      worldYearMax !== this.state.worldYearMax
    ) {
      this.setState(
        {
          worldYearMin,
          worldYearMax,
        },
        () => {
          this.generateWorldMapData();
        },
      );
    }
  }, 50);

  renderCharts() {
    this.renderScatterPlot();
    this.renderDualChart();
    this.generateWorldMapData();
  }

  generateScatterPlotData() {
    const { vdemData, vdemX, vdemY, xyYearMin, xyYearMax, regionFilter } =
      this.state;
    if (vdemData.length === 0) {
      return;
    }
    const [startYear, stopYear] = this.getValidYears(
      [vdemX, vdemY],
      xyYearMin,
      xyYearMax,
    );
    const vdemGrouped = d3.rollup(
      vdemData.filter(
        (d) =>
          d.year >= startYear &&
          d.year <= stopYear &&
          (regionFilter === 0 ||
            this.countryMap[d.country].regionCode === regionFilter),
      ),
      (values) => {
        if (
          haveNaN([values[0][vdemX], values[0][vdemY], values[0].v2x_regime]) ||
          haveNaN(values, (d) => d[vdemX]) ||
          haveNaN(values, (d) => d[vdemY]) ||
          haveNaN(values, (d) => d.v2x_regime)
        ) {
          return null;
        }
        const x = d3[aggregationMethod[vdemX]](values, (d) => d[vdemX]);
        const y = d3[aggregationMethod[vdemY]](values, (d) => d[vdemY]);
        const z = d3.median(values, (d) => d.v2x_regime);
        const records =
          vdemY === "records" ? y : d3.sum(values, (d) => d.records);
        const recordsPerArea =
          vdemY === "recordsPerArea"
            ? y
            : d3.sum(values, (d) => d.recordsPerArea);
        return { x, y, z, records, recordsPerArea };
      },
      (d) => d.country,
    );

    // Filter countries lacking values on the x y dimensions or have zero records (log safe)
    return Array.from(vdemGrouped, ([key, value]) => ({ key, value })).filter(
      (d) => d.value !== null && d.value.records > 0 && d.value.y !== undefined,
    );
  }

  generateWorldMapData() {
    const {
      vdemData,
      gbifData,
      mapColorBy,
      worldYearMin,
      worldYearMax,
      regionFilter,
    } = this.state;
    if (vdemData.length === 0) {
      return;
    }
    let worldMapDataScaleMin = vdemScaleMin[mapColorBy] || 0;
    let worldMapDataScaleMax = vdemScaleMax[mapColorBy];
    const [startYear, stopYear] = this.getValidYears(
      [mapColorBy],
      worldYearMin,
      worldYearMax,
    );
    if (mapColorBy === "publishingCountry") {
      const worldMapData = new Map();
      let totalCount = 0;
      (gbifData || []).forEach((yearData) => {
        totalCount += yearData.count;
        if (yearData.year < worldYearMin || yearData.year > worldYearMax) {
          return;
        }
        yearData.facets
          .find((d) => d.field === "PUBLISHING_COUNTRY")
          .counts.forEach(({ name, count }) => {
            const country = countryCodes.alpha2ToAlpha3(name);
            const countryCount = (worldMapData.get(country) || 0) + count;
            worldMapData.set(country, countryCount);
          });
      });
      worldMapDataScaleMin = 1e2;
      worldMapDataScaleMax = totalCount;
      this.setState({
        worldMapData,
        worldMapDataScaleMax,
        worldMapDataScaleMin,
      });
      return worldMapData;
    }
    const worldMapData = d3.rollup(
      vdemData.filter(
        (d) =>
          d.year >= startYear &&
          d.year <= stopYear &&
          (regionFilter === 0 ||
            this.countryMap[d.country].regionCode === regionFilter),
      ),
      (values) => {
        if (
          haveNaN([values[0][mapColorBy]]) ||
          haveNaN(values, (d) => d[mapColorBy])
        ) {
          return null;
        }
        const z = d3[aggregationMethod[mapColorBy]](
          values,
          (d) => d[mapColorBy],
        );
        return z;
      },
      (d) => d.country,
    );

    // Filter countries lacking values on the x y dimensions or have zero records (log safe)
    this.setState({ worldMapData, worldMapDataScaleMax, worldMapDataScaleMin });
    return worldMapData;
  }

  renderScatterPlot() {
    const { vdemData, vdemX, vdemY, vdemZ, variableExplanations } = this.state;
    if (vdemData.length === 0) {
      return;
    }

    const vdemFiltered = this.generateScatterPlotData();
    const vdemXLabel = variableExplanations[vdemX]
      ? variableExplanations[vdemX].short_name
      : vdemX;
    const vdemYLabel = variableExplanations[vdemY]
      ? variableExplanations[vdemY].short_name
      : vdemY;

    ScatterPlot(this.refScatterPlot.current, {
      left: yAxisLabelGap[vdemY] || 70,
      xTickGap: 120,
      yLogScale: useLogScale[vdemY],
      xLogScale: useLogScale[vdemX],
      data: vdemFiltered,
      height: 400,
      xMin: vdemScaleMin[vdemX],
      xMax: vdemScaleMax[vdemX],
      yMin: vdemScaleMin[vdemY],
      yMax: vdemScaleMax[vdemY],
      valueMin: vdemScaleMin[vdemZ],
      valueMax: vdemScaleMax[vdemZ],
      zLogScale: useLogScale[vdemZ],
      x: (d) => d.value.x,
      y: (d) => d.value.y,
      value: (d) => d.value[vdemZ],
      color: (d) => {
        switch (this.state.colorBy) {
          case "regime":
            return regimeColor(d.value.z);
          case "region":
            return regionColor(this.countryMap[d.key].regionCode);
          case "gbifParticipationStatus":
            return gbifParticipationColor(
              this.countryMap[d.key].gbifParticipationStatus,
            );
          case "colonialHistory":
            return colonialHistoryColor(this.countryMap[d.key].colonialHistory);
          default:
            return "#000000";
        }
      },
      tooltip: (d) => `
        <div>
          <div><strong>Country:</strong> ${this.countryMap[d.key].label} (${
        d.key
      })</div>
          <div><strong>Region:</strong> ${
            this.countryMap[d.key].regionName
          }</div>
          <div><strong>Area:</strong> ${this.countryMap[
            d.key
          ].area.toLocaleString("en")} km²</div>
          <div><strong>Records:</strong> ${d.value.records.toLocaleString(
            "en",
          )}</div>
          <div><strong>GBIF membership:</strong> ${
            this.countryMap[d.key].gbifParticipationText
          }</div>
        </div>
      `,
      xLabel: vdemXLabel,
      yLabel: vdemYLabel,
      title: "Number of public species records per country",
      selected: (d) => d.key === this.state.country,
      onClick: this.onScatterPlotClickCountry,
    });
  }

  renderWorldMapTooltip = () => {
    const {
      worldMapMouseOverCountry: country,
      mapColorBy,
      worldMapData,
    } = this.state;
    if (!country || !worldMapData) {
      return "";
    }
    const countryData = this.countryMap[country];
    if (!countryData) {
      return (
        <React.Fragment>
          <Typography color="inherit">{country}</Typography>
          <div>
            <div>The country is not part of our dataset</div>
          </div>
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <Typography color="inherit">
          {countryData.label} ({country})
        </Typography>
        <div>
          <div>
            <strong>Region:</strong> {countryData.regionName}
          </div>
          <div>
            <strong>Area:</strong> {countryData.area.toLocaleString("en")} km²
          </div>
          <div>
            <strong>GBIF membership:</strong>{" "}
            {countryData.gbifParticipationText}
          </div>
          <div>
            <strong>{worldMapColorByOptionsLabelMap.get(mapColorBy)}:</strong>{" "}
            {worldMapData.get(country)}
          </div>
        </div>
      </React.Fragment>
    );
  };

  renderBrush() {
    const { vdemData, regionFilter } = this.state;
    if (vdemData.length === 0) {
      return;
    }
    const [startYear, stopYear] = [1960, 2019];
    const recordsPerYear = Array.from(
      d3.rollup(
        vdemData.filter(
          (d) =>
            d.year >= startYear &&
            d.year <= stopYear &&
            (regionFilter === 0 ||
              this.countryMap[d.country].regionCode === regionFilter),
        ),
        (values) => {
          const numRecords = d3.sum(values, (d) => d.records);
          const regime = d3.mean(values, (d) => d.v2x_regime);
          return {
            records: numRecords,
            regime,
          };
        },
        (d) => d.year,
      ),
      ([key, value]) => ({ key, value }),
    );

    Brush(this.refBrush.current, {
      data: recordsPerYear,
      height: 70,
      top: 10,
      left: 20,
      right: 20,
      bottom: 25,
      xTickGap: 140,
      xMin: startYear,
      xMax: stopYear,
      x: (d) => d.key,
      y: (d) => d.value.records,
      barColor: (d) => regimeColor(d.value.regime),
      xLabel: "",
      onBrush: this.onBrush,
      selectedYears: [startYear, stopYear].map((year) => new Date(year, 0)),
    });

    Brush(this.refBrushWorld.current, {
      data: recordsPerYear,
      height: 70,
      top: 10,
      left: 20,
      right: 20,
      bottom: 25,
      xTickGap: 140,
      xMin: startYear,
      xMax: stopYear,
      x: (d) => d.key,
      y: (d) => d.value.records,
      barColor: (d) => regimeColor(d.value.regime),
      xLabel: "",
      onBrush: this.onBrushWorld,
      selectedYears: [startYear, stopYear].map((year) => new Date(year, 0)),
    });
  }

  generateDualChartData() {
    const { gbifData, vdemData, yearMin, yearMax, vdemVariable } = this.state;
    if (vdemData.length === 0) {
      return;
    }

    const vdemFiltered = vdemData.filter(
      (d) =>
        d.country === this.state.country &&
        d.year >= yearMin &&
        d.year <= yearMax,
    );

    // Merge gbif data into vdem data
    const gbifDataByYear = {};
    gbifData.forEach((d) => {
      gbifDataByYear[d.year] = d;
    });
    vdemFiltered.forEach((d) => {
      d.y2 = d[vdemVariable];
      const {
        count = 0,
        countDomestic = 0,
        countOther: countColoniser = 0,
        countRest: countOther = 0,
        countPreserved = 0,
        countNotPreserved = 0,
      } = gbifDataByYear[d.year] || {};
      d.records = count;
      d.countDomestic = countDomestic;
      d.countColoniser = countColoniser;
      d.countOther = countOther;
      d.countPreserved = countPreserved;
      d.countNotPreserved = countNotPreserved;
    });
    return vdemFiltered;
  }

  renderDualChart() {
    const {
      vdemData,
      yearMin,
      fetching,
      vdemVariable,
      variableExplanations,
      dualChartColorBy,
    } = this.state;
    if (vdemData.length === 0) {
      return;
    }

    const vdemFiltered = this.generateDualChartData();
    const y2Label = variableExplanations[vdemVariable]
      ? variableExplanations[vdemVariable].short_name
      : vdemVariable;

    const selectedCountryData = this.countryMap[this.state.country];
    const { yearOfIndependence, otherCountry } = selectedCountryData;

    const legendItems = ((by) => {
      switch (by) {
        case "none":
          return [];
        case "regime":
          // return [{ key: "records", label: "Records" }];
          return Object.keys(regimeTypes).map((key) => ({
            key,
            label: regimeTypes[key],
            data: { v2x_regime: key },
          }));
        case "basisOfRecord":
          return [
            {
              key: "countPreserved",
              label: "Preserved specimen",
            },
            { key: "countNotPreserved", label: "Other" },
          ];
        case "publishingCountry":
          const items = [{ key: "countDomestic", label: "Domestic" }];
          const countryData = this.countryMap[this.state.country];
          if (countryData.colonised) {
            items.push({
              key: "countColoniser",
              label: `Former coloniser (${countryData.colonised})`,
            });
          }
          items.push({ key: "countOther", label: "Other" });
          return items;
      }
    })(dualChartColorBy);

    const stackKeys =
      dualChartColorBy === "regime" || dualChartColorBy === "none"
        ? [{ key: "records", label: "Records" }]
        : legendItems.map((item) => item.key);

    // const colorStackedRange = d3.range(4).map((i) => regimeColor(i));
    // const colorStackedRange = ["#7fc97f", "#beaed4", "#fdc086", "#ffff99"];
    // const colorStackedRange = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a'];
    const colorStackedRange = [
      // "#C5DE39",
      // "#78B078",
      "#7fc97f",
      // "#93D64D",
      // "#2E868D",
      "#482470",
      // "#fda066",
      "#FBA250",
      // "#fdc086",
      "#1b9e77",
      // "#d95f02",
      // "#7570b3",
      // "#e7298a",
      // "#66a61e",
      // "#e6ab02",
      // "#a6761d",
      "#aaaaaa",
      // "#beaed4",
    ];

    const colorStacked = d3
      .scaleOrdinal()
      .domain(stackKeys)
      .range(colorStackedRange);

    const dualChartColor = (d) => {
      switch (dualChartColorBy) {
        case "none":
          return "#6588A3";
        case "regime":
          return regimeColor(d.data ? d.data.v2x_regime : d.v2x_regime);
        case "basisOfRecord":
        case "publishingCountry":
          return colorStacked(d.key);
        default:
          return "black";
      }
    };

    const { dualChartShowProportions } = this.state;

    const countryData = this.countryMap[this.state.country];

    const extraCurvesSelected = dualChartShowProportions.map((value) => {
      switch (value) {
        case "publishedByDomestic":
          return {
            key: value,
            label: `${getShowProportionsLabel(value)}`,
            title: "Proportion from domestic publisher",
            y: (d) => d.countDomestic / d.records,
            // stroke: "#6ad8ff",
            // fill: "#0d86b2",
            stroke: "#a6cee3",
            fill: "#1f78b4",
          };
        case "publishedByFormerColoniser":
          return {
            key: value,
            label: `${getShowProportionsLabel(value)} (${
              countryData.colonised
            })`,
            y: (d) => d.countColoniser / d.records,
            // stroke: "#d2b3ff",
            // fill: "#5e339c",
            stroke: "#cab2d6",
            fill: "#6a3d9a",
          };
        case "preservedSpecimen":
          return {
            key: value,
            label: `${getShowProportionsLabel(value)}`,
            y: (d) => d.countPreserved / d.records,
            // stroke: "#F8435E",
            // fill: "#AF0735",
            stroke: "#b2df8a",
            fill: "#33a02c",
          };
      }
    });
    const enabledExtraCurves = this.getEnabledExtraCurves();
    const extraCurves = extraCurvesSelected.filter(
      ({ key }) => enabledExtraCurves.indexOf(key) !== -1,
    );

    DualChart(this.refDualChart.current, {
      data: vdemFiltered,
      stackKeys,
      grouped: true, // Better than stacked for log scale
      extraCurves,
      height: 400,
      left: 70,
      right: yAxisLabelGap[vdemVariable] || 70,
      xTickGap: 140,
      xMin: yearMin,
      yMin: 1,
      yMax: 50000000,
      y2LogScale: useLogScale[vdemVariable],
      x: (d) => d.year,
      y: (d) => d.records,
      y2: (d) => d.y2,
      aux: (d) => d.conflict_major,
      auxLabel: "Major conflict",
      aux2: (d) => d.conflict_minor,
      aux2Label: "Minor conflict",
      color: dualChartColor,
      // y2Stroke: "#fdd471",
      // y2Fill: "#b88918",
      // y2Stroke: "#a6cee3",
      // y2Fill: "#1f78b4",
      y2Stroke: "#FBA250",
      y2Fill: "#A60729",
      legend: legendItems,
      fillOpacity: (d) => 0.75,
      y2Min: 0,
      y2Max: vdemScaleMax[vdemVariable],
      xLabel: "Year",
      yLabel: "Number of records",
      y2Label: y2Label,
      verticalLineAt: yearOfIndependence,
      verticalLineLabel: "Independence",
      title: `Number of public species records per year in ${countryData.label}`,
      fetching,
    });
  }

  renderProgress() {
    // If the app is loading static data or fetching data from the GBIF API, render a progress animation
    const { loaded, fetching } = this.state;
    return (
      <div style={{ height: 10 }}>
        {loaded && !fetching ? null : <LinearProgress />}
      </div>
    );
  }

  render() {
    const {
      vdemX,
      vdemY,
      vdemZ,
      xyYearMin,
      gbifError,
      variableExplanations,
      mapColorBy,
    } = this.state;
    const xyValidYears = this.getValidYears([vdemX, vdemY], 1960, 2018);
    const xyYearIntervalLimited =
      xyYearMin < xyValidYears[0] || xyValidYears[1] < 2016;

    const enabledCurves = this.getEnabledExtraCurves();
    const dualChartShowProportionsFiltered =
      this.state.dualChartShowProportions.filter(
        (value) => enabledCurves.indexOf(value) !== -1,
      );
    const dualChartShowProportionsOptionsFiltered =
      dualChartShowProportionsOptions.filter(
        ({ value }) => enabledCurves.indexOf(value) !== -1,
      );

    const country = this.countryMap
      ? this.countryMap[this.state.country].label
      : "";

    return (
      <div className="App">
        <AppBar color="primary" position="fixed" className="appbar">
          <Toolbar variant="dense">
            <IconButton
              href="#top"
              color="inherit"
              aria-label="Home"
              style={{ padding: 0 }}
            >
              <BioDemLogo className="appbar-logo" alt="appbar-logo" />
            </IconButton>
            <Button href="#about" color="inherit">
              About
            </Button>
            <Button href="#tutorials" color="inherit">
              Tutorials
            </Button>
            <Button href="#team" color="inherit">
              Team
            </Button>
            <span style={{ flexGrow: 1 }} />
            <span>{`${process.env.REACT_APP_VERSION}`}</span>
            <IconButton
              href="https://github.com/AntonelliLab/Bio-Dem"
              color="inherit"
              aria-label="Github"
              style={{ padding: 8 }}
            >
              <IconGithub />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Grid container>
          <Grid item className="grid-item intro section section-0" xs={12}>
            <Grid container direction="column" alignItems="center">
              <Grid item style={{ marginTop: 0, padding: "40px 0" }}>
                <Grid container direction="column" alignItems="center">
                  <Typography
                    variant="h3"
                    gutterBottom
                    className="heading"
                    style={{ color: "rgba(0, 0, 0, 0.54)" }}
                  >
                    Bio-Dem
                  </Typography>
                  <div
                    style={{
                      borderTop: "1px solid #ccc",
                      marginTop: -10,
                      paddingTop: 10,
                    }}
                  >
                    <Typography
                      variant="h5"
                      gutterBottom
                      className="heading"
                      style={{ color: "#666" }}
                    >
                      <strong>Biodiversity</strong> knowledge &amp;{" "}
                      <strong>democracy</strong>
                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item className="grid-item section section-1" xs={12}>
            <Grid container>
              <Grid
                item
                className="grid-item"
                xs={12}
                style={{ paddingTop: 10 }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Welcome to explore the connection between{" "}
                  <em>biodiversity</em> data and dimensions of{" "}
                  <em>democracy</em> across the globe, using open data from{" "}
                  <a href="#gbif">
                    <strong>GBIF</strong>
                  </a>{" "}
                  and{" "}
                  <a href="#v-dem">
                    <strong>V-Dem</strong>
                  </a>
                  . Checkout our <a href="#tutorials">video tutorial</a> to get
                  started!
                </Typography>
              </Grid>
              <Grid item className="grid-item" xs={12} md={4}>
                <Typography variant="h5" gutterBottom className="heading">
                  Biodiversity knowledge &amp; political regimes
                </Typography>
                <Typography variant="body2" gutterBottom>
                  In this interactive scatterplot, each data bubble represents a
                  political country; the size of the bubbles indicates the
                  number of occurrence record available from this country. Hover
                  over any bubble for the country name and the number of
                  records. Use the drop down menus to customize the x- and
                  y-axis with different dimensions of democracy, or to change
                  the colouring scheme. Values for each country are aggregated
                  by median over the chosen time period. Click on a bubble to
                  view the time series of collections from this country in the
                  plot below. Use the highlight buttons below to choose
                  preselected plots showing particularly exciting results.
                </Typography>
                <HighlightsPanel
                  label="scatterplot-highlights"
                  highlights={this.scatterPlotHighlights}
                  onChange={this.onScatterPlotHighlightsChange}
                  value={this.state.activeScatterPlotHighlight}
                />
              </Grid>
              <Grid item className="grid-item" xs={12} md={8}>
                <div id="scatterPlot" ref={this.refScatterPlot} />
                <ColorLegend type={this.state.colorBy} />
                {this.renderProgress()}
                <div id="brush" ref={this.refBrush} />
                <div className="play-container">
                  <div>
                    Selected years: {this.state.xyYearMin} -{" "}
                    {this.state.xyYearMax}
                  </div>
                  <div style={{ marginLeft: 5 }}>
                    {/* { this.state.isPlaying ?
                      <IconPause className="icon" onClick={this.onClickPause} /> :
                      <IconPlay className="icon" onClick={this.onClickPlay} />
                    } */}
                  </div>
                </div>

                <div className="controls">
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 240, margin: 10 }}
                  >
                    <InputLabel htmlFor="vdemY">Y axis</InputLabel>
                    <MuiSelect
                      input={<Input name="vdemY" id="vdemY" />}
                      value={this.state.vdemY}
                      onChange={this.handleChange}
                      options={scatterYOptions}
                    />
                  </FormControl>
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 240, margin: 10 }}
                  >
                    <InputLabel htmlFor="vdemX">X axis</InputLabel>
                    <MuiSelect
                      input={<Input name="vdemX" id="vdemX" />}
                      value={this.state.vdemX}
                      onChange={this.handleChange}
                      options={scatterYOptions}
                    />
                  </FormControl>
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 150, margin: 10 }}
                  >
                    <InputLabel htmlFor="colorBy">Color by</InputLabel>
                    <MuiSelect
                      input={<Input name="colorBy" id="colorBy" />}
                      value={this.state.colorBy}
                      onChange={this.onScatterPlotChangeColorBy}
                      options={colorByOptions}
                    />
                  </FormControl>
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 320, margin: 10 }}
                  >
                    <InputLabel htmlFor="regionFilter">Regions</InputLabel>
                    <MuiSelect
                      input={<Input name="regionFilter" id="regionFilter" />}
                      value={this.state.regionFilter}
                      onChange={this.onScatterPlotChangeRegionFilter}
                      options={regionOptions}
                    />
                  </FormControl>
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 200, margin: 10 }}
                  >
                    <InputLabel htmlFor="vdemZ">Circle size by</InputLabel>
                    <MuiSelect
                      input={<Input name="vdemZ" id="vdemZ" />}
                      value={this.state.vdemZ}
                      onChange={this.handleChange}
                      options={circleSizeOptions}
                    />
                  </FormControl>
                  <Zoom in={xyYearIntervalLimited} mountOnEnter unmountOnExit>
                    <Notice
                      variant="warning"
                      message={
                        <span>
                          Yearly data only available in the sub interval{" "}
                          <strong>[{xyValidYears.toString()}]</strong> for the
                          selected dimensions
                        </span>
                      }
                    />
                  </Zoom>
                  <Zoom
                    in={gbifError[countryFacetQueryErrorCoded]}
                    mountOnEnter
                    unmountOnExit
                  >
                    <Notice
                      variant="error"
                      message={
                        <span>
                          Error: Querying the GBIF API for country facet data
                          failed
                        </span>
                      }
                    />
                  </Zoom>
                  <div style={{ marginTop: 10 }}>
                    <h3>
                      Selected variables:
                      <Button
                        variant="outlined"
                        size="small"
                        style={{ marginLeft: 8 }}
                        download="bio-dem_scatterplot.csv"
                        onClick={this.onClickSaveScatterPlotData}
                      >
                        <IconDownload
                          fontSize="small"
                          style={{ marginRight: 5 }}
                        />
                        CSV
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        style={{ marginLeft: 8 }}
                        download="bio-dem_scatterplot.svg"
                        onClick={this.onClickSaveScatterPlotSVG}
                      >
                        <IconDownload
                          fontSize="small"
                          style={{ marginRight: 5 }}
                        />
                        SVG
                      </Button>
                    </h3>
                    {variableExplanations[vdemY] ? (
                      <div>
                        <h4>{variableExplanations[vdemY].short_name}</h4>
                        {variableExplanations[vdemY].description}
                      </div>
                    ) : null}

                    {variableExplanations[vdemX] ? (
                      <div>
                        <h4>{variableExplanations[vdemX].short_name}</h4>
                        {variableExplanations[vdemX].description}
                      </div>
                    ) : null}

                    {vdemZ !== vdemY && variableExplanations[vdemZ] ? (
                      <div>
                        <h4>{variableExplanations[vdemZ].short_name}</h4>
                        {variableExplanations[vdemZ].description}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>

          <Grid item className="grid-item section section-2" xs={12}>
            <Grid container>
              <Grid item className="grid-item" xs={12} md={4}>
                <Typography variant="h5" gutterBottom className="heading">
                  Biodiversity knowledge through time
                </Typography>
                <Typography variant="body2" gutterBottom>
                  The evolution of species occurrence recording through time.
                  The bars show the number of occurrence records collected from
                  the selected country each year on a logarithmic scale (left
                  y-axis). The overlaid line shows the development of a selected
                  democracy indicator (right y axis). Red blocks at the bottom
                  of the bars indicate years with armed conflict on the country
                  territory. Chose any country and democracy indicator with the
                  drop-down menus, customize the record count to include only
                  records from domestic institutions or records associated with
                  pictures using the tick boxes and filter to certain taxa using
                  the free text field. The selected country will be highlighted
                  in the bubble chart. Use the buttons below this text to
                  display selected plots that highlight particularly interesting
                  results.
                </Typography>
                <HighlightsPanel
                  label="timeplot-highlights"
                  highlights={this.dualChartHighlights}
                  onChange={this.onDualChartHighlightsChange}
                  value={this.state.activeDualChartHighlight}
                />
              </Grid>

              <Grid item className="grid-item" xs={12} md={8}>
                <div id="dualChart" ref={this.refDualChart} />

                {this.renderProgress()}

                <div className="controls">
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 260, margin: 10 }}
                    title={this.state.country}
                  >
                    <InputLabel htmlFor="country">Country</InputLabel>
                    <MuiSelect
                      input={<Input name="country" id="country" />}
                      value={this.state.country}
                      onChange={this.handleCountryChange}
                      options={this.state.countries}
                      const
                      label={countryLabelWithGbifParticipation}
                    />
                  </FormControl>
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 240, margin: 10 }}
                  >
                    <InputLabel htmlFor="vdemVariable">
                      Political variable
                    </InputLabel>
                    <MuiSelect
                      input={<Input name="vdemVariable" id="vdemVariable" />}
                      value={this.state.vdemVariable}
                      onChange={this.onDualChartChange}
                      options={vdemOptions}
                    />
                  </FormControl>
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 240, margin: 10 }}
                  >
                    <AutoSelect
                      name="taxonFilter"
                      label="Taxon filter"
                      onChange={this.onDualChartChange}
                      onInputChange={this.onInputChangeTaxonFilter}
                      options={this.state.taxaAutocompletes}
                      isClearable
                      allowNoSelection
                    />
                  </FormControl>
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 260, margin: 10 }}
                  >
                    <InputLabel htmlFor="dualChartColorBy">
                      Color bars by
                    </InputLabel>
                    <MuiSelect
                      input={
                        <Input name="dualChartColorBy" id="dualChartColorBy" />
                      }
                      value={this.state.dualChartColorBy}
                      onChange={this.onDualChartChange}
                      options={dualChartColorByOptions}
                    />
                  </FormControl>
                  <FormControlLabel
                    style={{ marginLeft: 0 }}
                    control={
                      <Checkbox
                        checked={this.state.onlyWithImage}
                        onChange={() =>
                          this.setState({
                            onlyWithImage: !this.state.onlyWithImage,
                          })
                        }
                      />
                    }
                    label="Require photo"
                  />
                  <FormControlLabel
                    style={{ marginLeft: 0 }}
                    control={
                      <Checkbox
                        checked={this.state.onlyPreservedSpecimen}
                        onChange={() =>
                          this.setState({
                            onlyPreservedSpecimen:
                              !this.state.onlyPreservedSpecimen,
                          })
                        }
                      />
                    }
                    label="Require preserved specimen"
                  />
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 240, margin: 10 }}
                  >
                    <InputLabel htmlFor="dualChartShowProportions">
                      Show proportions
                    </InputLabel>
                    <MuiMultiSelect
                      value={dualChartShowProportionsFiltered}
                      onChange={this.onDualChartChangeShowProportions}
                      input={<Input name="dualChartShowProportions" />}
                      options={dualChartShowProportionsOptionsFiltered}
                      label={getShowProportionsLabel}
                    />
                  </FormControl>
                </div>
                <div>
                  <Zoom
                    in={gbifError[yearFacetQueryErrorCoded]}
                    mountOnEnter
                    unmountOnExit
                  >
                    <Notice
                      variant="error"
                      message={
                        <span>
                          Error: Querying the GBIF API for year facet data
                          failed
                        </span>
                      }
                    />
                  </Zoom>
                  <Zoom
                    in={gbifError[autocompletesQueryErrorCoded]}
                    mountOnEnter
                    unmountOnExit
                  >
                    <Notice
                      variant="error"
                      message={
                        <span>
                          Error: Querying the GBIF API for taxon data failed
                        </span>
                      }
                    />
                  </Zoom>
                </div>
                <div>
                  <small>
                    Country{" "}
                    <a href="https://www.gbif.org/the-gbif-network">
                      GBIF membership
                    </a>
                    : ᵛ&nbsp;=&nbsp;voting participant, ᵃ&nbsp;=&nbsp;associate
                    country participant
                  </small>
                </div>
                <div style={{ marginTop: 10 }}>
                  <h3>
                    Selected variables:
                    <Button
                      variant="outlined"
                      size="small"
                      style={{ marginLeft: 8 }}
                      download="bio-dem_dualchart.csv"
                      onClick={this.onClickSaveDualChartData}
                    >
                      <IconDownload
                        fontSize="small"
                        style={{ marginRight: 5 }}
                      />
                      CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      style={{ marginLeft: 8 }}
                      download="bio-dem_dualchart.svg"
                      onClick={this.onClickSaveDualChartSVG}
                    >
                      <IconDownload
                        fontSize="small"
                        style={{ marginRight: 5 }}
                      />
                      SVG
                    </Button>
                  </h3>
                  <h4>
                    {variableExplanations[this.state.vdemVariable]
                      ? variableExplanations[this.state.vdemVariable].short_name
                      : ""}
                  </h4>
                  {variableExplanations[this.state.vdemVariable]
                    ? variableExplanations[this.state.vdemVariable].description
                    : ""}
                </div>
              </Grid>
            </Grid>
          </Grid>

          <Grid item className="grid-item section section-3" xs={12}>
            <Grid container>
              <Grid item className="grid-item" xs={12} md={4}>
                <Typography variant="h5" gutterBottom className="heading">
                  Data through space and time
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Biodiversity and democracy data mapped to space.
                </Typography>
                <div className="controls">
                  <FormControl
                    className="formControl"
                    style={{ minWidth: 240, margin: 10 }}
                  >
                    <InputLabel htmlFor="mapColorBy">
                      Color countries by
                    </InputLabel>
                    <MuiSelect
                      input={<Input name="mapColorBy" id="mapColorBy" />}
                      value={this.state.mapColorBy}
                      onChange={this.handleMapChange}
                      options={worldMapColorByOptions}
                    />
                  </FormControl>
                </div>
                <Typography
                  variant="body2"
                  gutterBottom
                  style={{ marginTop: "1em" }}
                >
                  Select a time window and drag to explore how the data evolves
                  in time.
                </Typography>
                <div id="brushWorld" ref={this.refBrushWorld} />
                <div className="play-container">
                  <div>
                    Selected years: {this.state.worldYearMin} -{" "}
                    {this.state.worldYearMax}
                  </div>
                  <div style={{ marginLeft: 5 }}></div>
                </div>

                <div style={{ marginTop: 30 }}>
                  <h3>
                    Download map:
                    <Button
                      variant="outlined"
                      size="small"
                      style={{ marginLeft: 8 }}
                      download="bio-dem_worldmap.csv"
                      onClick={this.onClickSaveWorldMapData}
                    >
                      <IconDownload
                        fontSize="small"
                        style={{ marginRight: 5 }}
                      />
                      CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      style={{ marginLeft: 8 }}
                      download="bio-dem_worldmap.svg"
                      onClick={this.onClickSaveWorldMapSVG}
                    >
                      <IconDownload
                        fontSize="small"
                        style={{ marginRight: 5 }}
                      />
                      SVG
                    </Button>
                  </h3>
                </div>
              </Grid>

              <Grid item className="grid-item" xs={12} md={8}>
                <ParentSize>
                  {({ width }) => (
                    <HtmlTooltip
                      title={this.renderWorldMapTooltip()}
                      open={!!this.state.worldMapMouseOverCountry}
                    >
                      <div>
                        {this.renderProgress()}
                        <div style={{ textAlign: "center" }}>
                          {mapColorBy === "publishingCountry"
                            ? `Publisher origin for records in ${country}`
                            : " "}
                        </div>

                        <div ref={this.refWorldMap}>
                          <WorldMap
                            width={width}
                            data={this.state.worldMapData}
                            colorBy={mapColorBy}
                            valueMin={this.state.worldMapDataScaleMin}
                            valueMax={this.state.worldMapDataScaleMax}
                            logScale={
                              mapColorBy === "publishingCountry" ||
                              useLogScale[mapColorBy]
                            }
                            onMouseOver={this.onWorldMapMouseOver}
                            onMouseOut={this.onWorldMapMouseOut}
                            onClick={this.onWorldMapClick}
                          />
                        </div>
                      </div>
                    </HtmlTooltip>
                  )}
                </ParentSize>
                <div className="controls"></div>
              </Grid>
            </Grid>
          </Grid>

          <Grid item className="grid-item section section-4" xs={12}>
            <About
              vdemExplanations={this.state.vdemExplanations}
              gbifExplanations={gbifExplanations}
            />
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default App;
