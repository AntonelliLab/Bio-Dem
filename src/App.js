import React, { Component } from 'react';
import PropTypes from "prop-types";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Zoom from '@material-ui/core/Zoom';
import ToggleButton, { ToggleButtonGroup } from "@material-ui/lab/ToggleButton";
import * as d3 from 'd3';
import { csv } from 'd3-fetch';
import debounce from 'lodash/debounce';
import { byAlpha2, byAlpha3 } from "iso-country-codes";
import {
  queryGBIFYearFacet,
  queryGBIFCountryFacet,
  queryAutocompletesGBIF
} from "./api/gbif";
import About from './About';
import logo from './logo.svg';
import DualChart from './d3/DualChart';
import ScatterPlot from './d3/ScatterPlot';
import { haveNaN, isWithin } from './d3/helpers';
import AutoSelect from './components/AutoSelect';
import Notice from './components/Notice';
import IconGithub from './components/Github';
import './App.css';
import './d3/d3.css';

/**
 * V-dem variables
 * country,year,v2x_regime,v2x_polyarchy,v2x_freexp_altinf,v2x_frassoc_thick,v2xcl_dmove,v2xcs_ccsi,v2x_corr,v2x_clphy,e_regiongeo,e_peaveduc,e_migdppc,e_wri_pa,confl
AFG,1960,0,0.0878861649162364,0.190868685410209,0.125512007338669,0.266093357150313,0.242432454719204,0.48274120527295,0.37271631597475,14,0.31028929,2744,NA,0
 */
const vdemDataUrl = `${process.env.PUBLIC_URL}/data/vdem_variables.csv`;
// const vdemDataUrl = `https://raw.githubusercontent.com/AntonelliLab/Vdem-Biodiversity/master/analyses/input/vdem_variables.csv?token=AG-YjnEhdZQC1HdaThLt5uEBQRmdT1zLks5bV-6-wA%3D%3D`;

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

// The strings for the v-dem variables used to get the static data
const v2x_polyarchy = "v2x_polyarchy";
const v2x_freexp_altinf = "v2x_freexp_altinf";
const v2x_frassoc_thick = "v2x_frassoc_thick";
const v2x_corr = "v2x_corr";
const e_peaveduc = "e_peaveduc";
const e_migdppc = "e_migdppc";
// Protected areas
const e_wri_pa = "e_wri_pa";

const vdemOptions = [
  // { value: 'v2x_regime' },
  { value: v2x_polyarchy },
  { value: v2x_freexp_altinf },
  { value: v2x_frassoc_thick },
  { value: "v2xcl_dmove" },
  { value: "v2xcs_ccsi" },
  { value: v2x_corr },
  { value: "v2x_clphy" },
  // { value: 'e_regiongeo' },
  { value: e_peaveduc },
  { value: e_migdppc },
  { value: e_wri_pa }
  // { value: 'conf' },
];

const regimeTypes = {
  0: 'Closed autocracy',
  1: 'Electoral autocracy',
  2: 'Electoral democracy',
  3: 'Liberal democracy',
};

const regions = {
  1: 'Eastern Europe and Central Asia',
  2: 'Latin America',
  3: 'The Middle East and North Africa',
  4: 'Sub-Saharan Africa',
  5: 'Western Europe and North America',
  6: 'East Asia',
  7: 'South-East Asia',
  8: 'South Asia',
  9: 'The Pacific',
  10: 'The Carribean',
  'NA': 'NA',
};

// Some external variables lack data for all countries before or after a certain year
const startYear = {
  e_wri_pa: 1990,
};
const stopYear = {
  e_peaveduc: 2010,
  e_migdppc: 2016,
  e_wri_pa: 2010,
};

const regimeColor = d3.scaleSequential(d3.interpolateViridis)
    .domain([0,3]);

const regionColor = regionCode => {
  if (regionCode > 0 && regionCode <= 10) {
    return d3.schemeCategory10[regionCode - 1];
  }
  return '#000';
}

const colorByOptions = [
  {
    value: 'regime',
    label: 'Regime type',
  },
  {
    value: 'region',
    label: 'Region',
  },
];

const yAxisLabelGap = {
  e_migdppc: 100,//asdf
}

const vdemScaleMax = {
  v2x_polyarchy: 1,
  v2x_freexp_altinf: 1,
  v2x_frassoc_thick: 1,
  v2xcl_dmove: 1,
  v2xcs_ccsi: 1,
  v2x_corr: 1,
  v2x_clphy: 1,
  //TODO: Use global max on external variables
}

const scatterPlotHighlights = [
  {
    buttonLabel: "Protected areas",
    explanation:
      "The majority of high record countries (large bubbles) are democracies (yellow or green) and located in the lower right corner of the plot. The majority of low record countries (small bubbles) are in the lower left corner, indicating that higher polyarchy corresponds to more collected records. There are four countries, two closed autocracies (Bhutan and Saudi Arabia, purple), one electoral autocracy (Seychelles, blue) and one electoral democracy (Venezuela), that protect a relatively large share of land area.",
    onActvatedNewState:
    {
      vdemY: e_wri_pa,
      vdemX: v2x_polyarchy,
      xyYearMin: 1990
    }
  },
  {
    buttonLabel: "Corruption",
    explanation:
      "The majority of high record countries are liberal democracies (large, yellow bubbles) and have little corruption. Furthermore, record collection seems largely independent of the level of corruption (large bubbles are distributed horizontally) and corrupt countries can have many collection records. Additionally, corrupt countries can have relatively larger share of protected areas.",
    onActvatedNewState:
    {
      vdemY: e_wri_pa,
      vdemX: v2x_corr,
      xyYearMin: 1990
    }
  },
  {
    buttonLabel: "GDP",
    explanation:
      "Democratic and economically developed countries often have many GBIF records (large bubbles cluster in the upper right corner of the plot). However, some economically rich countries have very few records (small bubbles with high values on the y-axis: Cyprus, Libya), and some relatively less developed countries have a large number of records (China, India, Tanzania and Uganda), indicating heterogeneity of biological record collection across both democracy and economic development.",
    onActvatedNewState:
    {
      vdemY: e_migdppc,
      vdemX: v2x_polyarchy,
      xyYearMin: 1960
    }
  },
  {
    buttonLabel: "Education",
    explanation:
      "The number of available occurrence records increases with GDP per capita and length of education (bubble size increases from the lower left to the upper right corner). For instance, Burundi (purple bubble in the lower left corner) and Canada (yellow bubble in the upper right corner), are typical examples for this trend. In contrast India does not follow the general pattern, being a large bubble in the lower left corner.",
    onActvatedNewState:
    {
      vdemY: e_peaveduc,
      vdemX: e_migdppc,
      xyYearMin: 1960
    }
  }
];

const dualChartHighlights = [
  {
    buttonLabel: "Angola",
    explanation:
      'The Angolan Civil War. In 1975, when the Angolan Civil War broke out, the collection activity drops drastically. This pattern is valid up until the end of the 1990\'s, a couple of years before the war ended and is visible for domestic and total collections. Ticking the "only domestic records box" furthermore reveals the importance of foreign collections for the country, especially until the mid 1990ies.',
    onActvatedNewState:
    {
      country: 'AGO',
      vdemVariable: v2x_polyarchy,
      onlyDomestic: false,
      onlyWithImage: false,
      filterTaxon: null
    }
  },
  {
    buttonLabel: "India",
    explanation:
      'The Emergency in India 1975 and domestic records. From 1975 and 1977, "The Emergency" took place in India, an event of political turmoil where the prime minister declared a state of emergency and put political rights on freeze in order to take control over the rule. We see that this instability event coincides with a drop in domestic biological record collection.',
    onActvatedNewState:
    {
      country: 'IND',
      vdemVariable: v2x_polyarchy,
      onlyDomestic: true,
      onlyWithImage: false,
      filterTaxon: null
    }
  },
  {
    buttonLabel: "Czechia",
    explanation:
      "The fall of the Soviet Union. In Czechia, record availability from domestic institutions only starts after the Soviet Union collapsed. Possibly a partial effect from the political liberalization and the country's independence.",
    onActvatedNewState:
    {
      country: 'CZE',
      vdemVariable: v2x_polyarchy,
      onlyDomestic: true,
      onlyWithImage: false,
      filterTaxon: null
    }
  },
  {
    buttonLabel: "Cambodia",
    explanation:
      'Decades of political instability in Cambodia. Starting in the 1970\'s, Cambodia experienced a long period of conflicts and autocratization, which coincides with a decrease in biological record collection during this period.',
    onActvatedNewState:
    {
      country: 'KHM',
      vdemVariable: v2x_polyarchy,
      onlyDomestic: false,
      onlyWithImage: false,
      filterTaxon: null
    }
  },
  {
    buttonLabel: "Indonesia",
    explanation:
      'Economic development and domestic collections in Indonesia. In the beginning of the 1980\'s, we see a start of domestic record collection that which increases following Indonesia\'s acceleration in gross domestic product per capita increase in the 1990\'ies. Displaying all records show that the proportion collected by domestic institutions also increases.',
    onActvatedNewState:
    {
      country: 'IDN',
      vdemVariable: e_migdppc,
      onlyDomestic: true,
      onlyWithImage: false,
      filterTaxon: null
    }
  }
];

const BioDemLogo = ({ className = "logo", alt="logo" }) => (
  <img src={logo} className={className} alt={alt} />
);

const RegimeLegend = () => (
  <Grid container className="regimeLegend" justify="center">
    { Object.keys(regimeTypes).map(v =>
      <div key={v} style={{ padding: 5, fontSize: '0.75em' }}>
        <span style={{ backgroundColor: regimeColor(v), marginRight: 2 }}>&nbsp;&nbsp;&nbsp;</span>
        {regimeTypes[v]}
      </div>
    )}
  </Grid>
);

const RegionLegend = () => (
  <Grid container className="regionLegend" justify="center">
    { Object.keys(regions).map(v =>
      <div key={v} style={{ padding: 5, fontSize: '0.75em' }}>
        <span style={{ backgroundColor: regionColor(v), marginRight: 2 }}>&nbsp;&nbsp;&nbsp;</span>
        {regions[v]}
      </div>
    )}
  </Grid>
);

const ColorLegend = ({ type }) => type === 'regime' ? 
  <RegimeLegend /> : <RegionLegend />;

ColorLegend.propTypes = {
  type: PropTypes.oneOf(['regime', 'region']),
};

const HighlightsButtonGroup = (props) => (
  <div className="toggleContainer">
    <ToggleButtonGroup {...props} exclusive >
      {
        props.highlights.map((h, index) => (
          <ToggleButton key={index} value={index}>
            <Typography variant="body1" gutterBottom>
              {h.buttonLabel}
            </Typography>
          </ToggleButton>
        ))
      }
    </ToggleButtonGroup>
    <Typography variant="body1" gutterBottom>
      { props.value !== null ? props.highlights[props.value].explanation : null }
    </Typography>
  </div>
);
  
class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      gbifData: [],
      gbifError: {},
      onlyDomestic: false,
      onlyWithImage: false,
      vdemData: [],
      vdemExplanations: {},
      loaded: false,
      fetching: false,
      country: "SWE",
      vdemVariable: v2x_freexp_altinf,
      filterTaxon: undefined,
      countries: [],
      yearMin: 1960,
      yearMax: 2018,
      colorBy: 'regime',
      // XY Plot:
      vdemX: v2x_freexp_altinf,
      vdemY: v2x_frassoc_thick,
      xyYearMin: 1960,
      normalizeByArea: false,
      // Taxon filter
      taxonFilter: '',
      taxaAutocompletes: [],
      // Active highlights
      activeScatterPlotHighlight: null,
      activeDualChartHighlight: null
    };
    this.refScatterPlot = React.createRef();
    this.refDualChart = React.createRef();
  }
  
  async componentDidMount() {
    window.addEventListener('resize', this.onResize, false);
    await this.initData();
  }

  async componentDidUpdate(prevProps, prevState) {
    // Changes in state that require a new GBIF year facet query
    const fetchNewCountryCondition =
      this.state.onlyDomestic !== prevState.onlyDomestic ||
      this.state.country !== prevState.country ||
      this.state.taxonFilter !== prevState.taxonFilter ||
      this.state.onlyWithImage !== prevState.onlyWithImage;

    if (fetchNewCountryCondition) {
      // Get alpha2 ISO code for this country, as this is what GBIF requires as query
      // TODO: Catch cases where !byAlpha3[event.target.value]
      const alpha2 = byAlpha3[this.state.country].alpha2;
      await this.makeYearFacetQuery(alpha2);
    }

    // Changes in state that require a new GBIF country facet query
    const fetchNewYearCondition = this.state.xyYearMin !== prevState.xyYearMin;

    if (fetchNewYearCondition) {
      await this.makeCountryFacetQuery();
    }
  }

  onResize = () => {
    if (this.rqf) {
      return;
    }
    this.rqf = window.requestAnimationFrame(() => {
      this.rqf = null;
      // Re-render charts with new size
      this.renderCharts();
    });
  };

  async fetchData() {
    if (this.data) {
      return this.data;
    }
    this.setState({
      fetching: true
    });
    const vdemDataPromise = csv(vdemDataUrl, row => {
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
        e_wri_pa: +row.e_wri_pa,
        confl: +row.confl
      };
    });
    const vdemExplanationsPromise = csv(vdemExplanationsUrl, row => {
      return {
        id: row.id,
        full_name: row.full_name,
        short_name: row.short_name,
        description: row.description,
        relevance: row.relevance,
        references: row.references
      };
    });
    const countryDataPromise = csv(countryDataUrl, row => {
      return {
        value: row.country,
        label: byAlpha3[row.country] ? byAlpha3[row.country].name : row.country,
        area: +row.area,
        regionCode: +row.e_regionpol,
        regionName: regions[row.e_regionpol],
      };
    });
    const [vdemData, vdemExplanations, countryData] = await Promise.all([
      vdemDataPromise,
      vdemExplanationsPromise,
      countryDataPromise,
      this.makeYearFacetQuery(byAlpha3[this.state.country].alpha2),
      this.makeCountryFacetQuery(),
    ]);
    const countryMap = {};
    countryData.forEach(d => {
      countryMap[d.value] = d;
    })
    this.countryMap = countryMap;

    const data = [vdemData, vdemExplanations, countryData];
    this.data = data;
    this.setState({
      loaded: true,
      fetching: false
    });
    return data;
  }

  makeYearFacetQuery = async country => {
    const { onlyDomestic, onlyWithImage, taxonFilter } = this.state;
    // Query the GBIF API
    console.log('Query gbif with year facet...');
    const gbifError = Object.assign({}, this.state.gbifError);
    delete gbifError['101'];
    this.setState({ fetching: true, gbifError });
    const result = await queryGBIFYearFacet(country, onlyDomestic, onlyWithImage, taxonFilter);
    // console.log('received gbif year facet data:', result);
    if (result.error) {
      const gbifError = Object.assign({}, this.state.gbifError);
      gbifError['101'] = result.error;
      this.setState({ fetching: false, gbifError });
      return;
    }

    const gbifData = result.response.data.facets[0].counts.map(d => ({
      year: +d.name,
      collections: +d.count
    }));
    // Fetching is complete rerender chart
    this.setState({
      gbifData, fetching: false,
    }, () => {
      this.renderCharts();
    });
  }

  makeCountryFacetQuery = async () => {
    // Query the GBIF API
    console.log('Query gbif with country facet...');
    const gbifError = Object.assign({}, this.state.gbifError);
    delete gbifError['102'];
    this.setState({ fetching: true, gbifError });
    const result = await queryGBIFCountryFacet(this.state.xyYearMin);
    // console.log('received gbif country facet data:', result);
    if (result.error) {
      const gbifError = Object.assign({}, this.state.gbifError);
      gbifError['102'] = result.error;
      this.setState({ fetching: false, gbifError });
      return;
    }

    const gbifCountryFacetData = {};
    result.response.data.facets[0].counts.map(d => {
      const alpha2Country = byAlpha2[d.name];
      gbifCountryFacetData[alpha2Country ? alpha2Country.alpha3 : null] = {
        collections: d.count
      };
      return true;
    });

    // Fetching is complete rerender chart
    this.setState(
      {
        gbifCountryFacetData,
        fetching: false
      },
      () => {
        this.renderCharts();
      }
    );
  };

  async initData() {
    const data = await this.fetchData();
    const [vdemData, vdemExplanationsArray, countryData] = data;
    const vdemExplanations = {};
    vdemExplanationsArray.forEach(d => {
      vdemExplanations[d.id] = d;
    });
    vdemOptions.forEach(d => {
      if (!vdemExplanations[d.value]) {
        console.log('Missing explanation for value:', d.value);
      }
      d.label = vdemExplanations[d.value].short_name;
      d.description = vdemExplanations[d.value].description;
      d.relevance = vdemExplanations[d.value].relevance;
      d.references = vdemExplanations[d.value].references;
      d.full_name = vdemExplanations[d.value].full_name;
    });
    this.setState({
      loaded: true,
      vdemData,
      vdemExplanations,
      countries: countryData,
    }, () => {
      this.renderCharts();
    });
  }

  handleChange = event => {
    // console.log('handleChange, key:', event.target.name, 'value:', event.target.value);
    this.setState({ [event.target.name]: event.target.value }, () => {
      this.renderCharts();
    });
  };

  onDualChartChangeVdemVariable = event => {
    // const { vdemData, country } = this.state;
    // const vdemVariable = event.target.value;
    // const vdemValues = vdemData.filter(d => d.country === country);
    // const [ validVdemIndexMin, validVdemIndexMax ] = getFirstContiguousRangeNotNaN(vdemValues, d => d[vdemVariable]);
    // const vdemYearMin = validVdemIndexMin === -1 ? -1 : vdemValues[validVdemIndexMin].year;
    // const vdemYearMax = validVdemIndexMax === -1 ? -1 : vdemValues[validVdemIndexMax].year;
    // console.log('vdemYearMin, vdemYearMax:', vdemYearMin, vdemYearMax);
    
    this.setState({
      [event.target.name]: event.target.value,
      // vdemYearMin,
      // vdemYearMax,
    }, () => {
      this.renderDualChart();
    });
  }

  onDualChartChangeYearMin = (event) => {
    this.setState({ [event.target.name]: event.target.value }, () => {
      this.renderDualChart();
    });
  };

  onInputChangeTaxonFilter = debounce((newValue) => {
    if (newValue.length > 1) {
      this.makeAutocompletesQuery(newValue);
    } else if (newValue === '') {
      // this.setState({ taxonFilter: '' });
    }
  }, 400, { maxWait: 3000 })

  onDualChartChangeTaxonFilter = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    }, () => {
      this.renderDualChart();
    });
  }

  makeAutocompletesQuery = async newValue => {
    // Query autocompletes API
    console.log('Query gbif autocompletes API ...');
    const gbifError = Object.assign({}, this.state.gbifError);
    delete gbifError['103'];
    this.setState({ fetching: true, gbifError });
    // TODO: This queries the suggest API of GBIF which is nor really good customizable
    // TODO: Maybe some result filtering to not show "synonyms" or only specific ranks
    // TODO: One more filter option for this API is by rank, maybe good idea to query for only the higher ranks and Promise all together
    const result = await queryAutocompletesGBIF(newValue);
    // console.log('received gbif autocompletes data:', result);
    if (result.error) {
      const gbifError = Object.assign({}, this.state.gbifError);
      gbifError['103'] = result.error;
      this.setState({ fetching: false, gbifError });
      return;
    }
    // Transform the taxa array into the requered form
    const taxaAutocompletes = result.response.data.map(t => ({
      label: t.canonicalName,
      value: t.nubKey || t.key
    }));
    // Save retrieved taxa to state
    this.setState({ taxaAutocompletes });
  };
  handleCountryChange = async event => {
    // console.log('querying for this country: ', event.target.value);
    this.setState({ [event.target.name]: event.target.value });
  };

  onScatterPlotClickCountry = d => {
    this.setState({
      country: d.key
    });
  };

  onScatterPlotHighlightsChange = index => {
    this.setState({ activeScatterPlotHighlight: index });
    // If the current highlight is deselected, do nothing
    if (index === null) {
      return;
    }
    this.setState(
      scatterPlotHighlights[index].onActvatedNewState,
      () => {
        this.renderScatterPlot();
      }
    );
  };

  onDualChartHighlightsChange = index => {
    this.setState({ activeDualChartHighlight: index });
    // If the current highlight is deselected, do nothing
    if (index === null) {
      return;
    }
    this.setState(
      dualChartHighlights[index].onActvatedNewState,
      () => {
        this.renderDualChart();
      }
    );
  };

  onScatterPlotChangeColorBy = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    }, () => {
      this.renderScatterPlot();
    });
  }

  onScatterPlotChangeNormalization = (event) => {
    const { value, checked } = event.target;
    this.setState({
      [value]: checked,
    }, () => {
      this.renderScatterPlot();
    });
  }

  /**
   * Get valid year range for selected data dimensions
   * This will adjust for data limits where certain dimensions lack values for all countries.
   * @param {Array<Number>|Number} dimensions dimensions to check for constraints on valid years
   * @param {Number} defaultStartYear default value if not constrained
   * @returns {Array<Number>} an array with [startYear, endYear]
   */
  getValidYears(dimension, defaultStartYear = 1960, defaultEndYear = 2017) {
    const dim = Array.isArray(dimension) ? dimension : [dimension];
    return [
      d3.max([...dim.map(d => startYear[d]), defaultStartYear]),
      d3.min([...dim.map(d => stopYear[d]), defaultEndYear])
    ];
  }

  renderCharts() {
    this.renderScatterPlot();
    this.renderDualChart();
  }

  renderScatterPlot() {
    const { vdemData, vdemX, vdemY, xyYearMin, gbifCountryFacetData, vdemExplanations } = this.state;
    const vdemXLabel = vdemExplanations[vdemX] ? vdemExplanations[vdemX].short_name : vdemX;
    const vdemYLabel = vdemExplanations[vdemY] ? vdemExplanations[vdemY].short_name : vdemY;
    
    const [startYear, stopYear] = this.getValidYears([vdemX, vdemY], xyYearMin);

    const vdemGrouped = d3.nest()
      .key(d => d.country)
      .rollup(values => {
        if (haveNaN([values[0][vdemX], values[0][vdemY], values[0].v2x_regime]) ||
          haveNaN(values, d => d[vdemX]) ||
          haveNaN(values, d => d[vdemY]) ||
          haveNaN(values, d => d.v2x_regime))
        {
          return null;
        }
        const x = d3.median(values, d => d[vdemX]);
        const y = d3.median(values, d => d[vdemY]);
        const z = d3.median(values, d => d.v2x_regime);
        return { x, y, z };
      })
      .entries(vdemData
        // Aggregate within selected years
        .filter(d => d.year >= startYear && d.year <= stopYear)
      );

      vdemGrouped.forEach(d => {
        if (d.value !== null && gbifCountryFacetData && gbifCountryFacetData[d.key]) {
          d.value.records = gbifCountryFacetData[d.key].collections;
        }
      });
      
      // Filter countries lacking values on the x y dimensions or have zero records (log safe)
      const vdemFiltered = vdemGrouped.filter(d => d.value !== null && d.value.records > 0);
      // console.log('vdemData:', vdemData);
      // console.log('vdemGrouped:', vdemGrouped);
      // console.log('vdemFiltered:', vdemFiltered);
      // console.log('countryFacetData', gbifCountryFacetData);

    ScatterPlot(this.refScatterPlot.current, {
      // data: vdemData,
      // data: vdemFiltered,
      // data: vdemGrouped,
      left: yAxisLabelGap[vdemY] || 70,
      data: vdemFiltered,
      height: 300,
      // x: d => d[vdemX],
      // y: d => d[vdemY],
      x: d => d.value.x,
      y: d => d.value.y,
      value: d => this.state.normalizeByArea ? d.value.records / this.countryMap[d.key].area : d.value.records,
      color: d => {
        switch (this.state.colorBy) {
          case 'regime':
            return regimeColor(d.value.z);
          case 'region':
            return regionColor(this.countryMap[d.key].regionCode);
          default:
            return '#000';
        }
      },
      tooltip: d => `
        <div>
          <div><strong>Country:</strong> ${this.countryMap[d.key].label}</div>
          <div><strong>Region:</strong> ${this.countryMap[d.key].regionName}</div>
          <div><strong>Area:</strong> ${this.countryMap[d.key].area.toLocaleString('en')} km²</div>
          <div><strong>Records:</strong> ${d.value.records.toLocaleString('en')}</div>
        </div>
      `,
      xLabel: vdemXLabel,
      yLabel: vdemYLabel,
      title: 'Number of public species records per country',
      selected: d => d.key === this.state.country,
      onClick: this.onScatterPlotClickCountry
    });
  }

  renderDualChart() {
    const { gbifData, vdemData, yearMin, yearMax, fetching, vdemVariable, vdemExplanations } = this.state;
    
    const y2Label = vdemExplanations[vdemVariable] ? vdemExplanations[vdemVariable].short_name : vdemVariable;

    const vdemFiltered = vdemData
      .filter(d => d.country === this.state.country && d.year >= yearMin && d.year <= yearMax)
    
    // const gbifDataFiltered = gbifData
    //   .filter(d => d.year >= yearMin && d.year <= yearMax)
    //   .sort((a,b) => a.year - b.year)
    
    // Merge gbif data into vdem data 
    const gbifRecordsByYear = {};
    gbifData.forEach(d => {
      gbifRecordsByYear[d.year] = d.collections;
    });
    vdemFiltered.forEach(d => {
      d.records = gbifRecordsByYear[d.year] || 0;
    });
    // console.log('gbifRecordsByYear:', gbifRecordsByYear);
    // console.log('vdemFiltered:', vdemFiltered);

    // console.log('renderCharts with fethcing:', fetching);
    DualChart(this.refDualChart.current, {
      // data: gbifDataFiltered,
      data: vdemFiltered,
      height: 300,
      left: 70,
      right: yAxisLabelGap[vdemVariable] || 70,
      xTickGap: 140,
      xMin: yearMin,
      // xMax: yearMax,
      yMin: 1,
      yMax: 50000000,
      x: d => d.year,
      y: d => d.records,
      y2: d => d[vdemVariable],
      aux: d => d.confl,
      // aux: d => d.year < 2000,
      auxLabel: 'Conflict',
      // z: d => d.v2x_regime,
      color: d => regimeColor(d.v2x_regime),
      // zLabel: d => regimeTypes[d.v2x_regime],
      y2Min: 0,
      y2Max: vdemScaleMax[vdemVariable],
      xLabel: 'Year',
      yLabel: 'Number of records',
      y2Label: y2Label,
      title: 'Number of public species records per country and year',
      fetching
    });
  }

  renderProgress() {
    const { loaded, fetching } = this.state;
    return (
      <div style={{ height: 10 }}>
        { loaded && !fetching ? null : <LinearProgress /> }
      </div>
    );
  }

  render() {
    const { vdemX, vdemY, xyYearMin, gbifError } = this.state;
    const xyValidYears = this.getValidYears([vdemX, vdemY], 1960, 2018);
    const xyYearIntervalLimited = xyYearMin < xyValidYears[0] || xyValidYears[1] < 2016;
    return (
      <div className="App">
        <AppBar color="primary" position="fixed" className="appbar">
          <Toolbar variant="dense">
            <IconButton href="#top" color="inherit" aria-label="Home">
              <BioDemLogo className="appbar-logo" alt="appbar-logo" />
            </IconButton>
            <Button href="#about" color="inherit">About</Button>
            <span style={{ flexGrow: 1 }} />
            <Button href="#tutorials" color="inherit">Tutorials</Button>
            <span style={{ flexGrow: 1 }} />
            <IconButton href="https://github.com/AntonelliLab/Bio-Dem" color="inherit" aria-label="Github">
              <IconGithub />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Grid container>
          <Grid item className="grid-item intro section section-0" xs={12}>
            <Grid container direction="column" alignItems="center">
              <Grid item style={{ marginTop: 0, padding: '40px 0' }}>
                <Grid container direction="column" alignItems="center">
                  <Typography variant="display2" gutterBottom className="heading">
                    Bio-Dem
                  </Typography>
                  <div style={{ borderTop: '1px solid #ccc', marginTop: -10, paddingTop: 10 }}>
                    <Typography variant="headline" gutterBottom className="heading" style={{ color: '#666' }}>
                      <strong>Biodiversity</strong> knowledge &amp; <strong>democracy</strong>
                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item className="grid-item section section-1" xs={12}>
            <Grid container>
              <Grid item className="grid-item" xs={12} style={{ paddingTop: 10 }}>
                <Typography variant="subheading" gutterBottom>
                  Welcome to explore the connection between <em>biodiversity</em> data and dimensions of <em>democracy</em> across the globe, using open data from <a href="#gbif"><strong>GBIF</strong></a> and <a href="#v-dem"><strong>V-Dem</strong></a>. Checkout our <a href="#tutorials">video tutorial</a> to get started!
                </Typography>
              </Grid>
              <Grid item className="grid-item" xs={12} md={4}>
                <Typography variant="headline" gutterBottom className="heading">
                  Biodiversity knowledge &amp; political regimes
                </Typography>
                <Typography variant="body1" gutterBottom>
                  In this interactive scatterplot, each data bubble represents a political country; the size of the bubbles indicates 
				  the number of occurrence record available from this country and the colour shows the time-aggregated political regime type. 
				  Hover over any bubble for the country name and the number of records. Use the drop down menus to customize the x- and y-axis 
				  with different dimensions of democracy. Values for each country are aggregated by median over the chosen time period. 
				  Use the highlight buttons on top of the plot to choose preselected plots showing particularly exciting results.
                </Typography>
                <HighlightsButtonGroup
                  highlights={scatterPlotHighlights}
                  onChange={this.onScatterPlotHighlightsChange}
                  value={this.state.activeScatterPlotHighlight}
                />
              </Grid>
              <Grid item className="grid-item" xs={12} md={8}>
                <div id="scatterPlot" ref={this.refScatterPlot} />
                <ColorLegend type={this.state.colorBy} />
                {this.renderProgress()}
                <div className="controls">
                  <FormControl className="formControl" style={{ minWidth: 240, margin: 10 }}>
                    <InputLabel htmlFor="vdemY">Y axis</InputLabel>
                    <AutoSelect
                      input={<Input name="vdemY" id="vdemY" />}
                      value={this.state.vdemY}
                      onChange={this.handleChange}
                      options={vdemOptions}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 240, margin: 10 }}>
                    <InputLabel htmlFor="vdemX">X axis</InputLabel>
                    <AutoSelect
                      input={<Input name="vdemX" id="vdemX" />}
                      value={this.state.vdemX}
                      onChange={this.handleChange}
                      options={vdemOptions}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 100, margin: 10 }}>
                    <InputLabel htmlFor="xyYearMin">
                      From year
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="xyYearMin" id="xyYearMin" />}
                      value={this.state.xyYearMin}
                      onChange={this.handleChange}
                      options={d3.range(1960,2018).map(y => ({
                        value: y, label: y, disabled: !isWithin(y, xyValidYears)
                      }))}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 150, margin: 10 }}>
                    <InputLabel htmlFor="colorBy">
                      Color by
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="colorBy" id="colorBy" />}
                      value={this.state.colorBy}
                      onChange={this.onScatterPlotChangeColorBy}
                      options={colorByOptions}
                    />
                  </FormControl>
                  <FormControlLabel
                    control={
                    <Checkbox
                      checked={this.state.normalizeByArea}
                      onChange={this.onScatterPlotChangeNormalization}
                      value="normalizeByArea"
                    />
                    }
                    label="Normalize records by country area"
                  />
                  <Zoom in={xyYearIntervalLimited} mountOnEnter unmountOnExit>
                    <Notice variant="warning" message={
                      <span>Yearly data only available in the sub interval <strong>[{xyValidYears.toString()}]</strong> for the selected dimensions</span>
                    }/>
                  </Zoom>
                  <Zoom in={gbifError['102']} mountOnEnter unmountOnExit>
                    <Notice variant="error" message={
                      <span>Error: Querying the GBIF API for country facet data failed</span>
                    }/>
                  </Zoom>
                </div>
              </Grid>
            </Grid>
          </Grid>

          <Grid item className="grid-item section section-2" xs={12}>
            <Grid container>
              <Grid item className="grid-item" xs={12} md={4}>
                <Typography variant="headline" gutterBottom className="heading">
                  Biodiversity knowledge through time 
                </Typography>
                <Typography variant="body1" gutterBottom>
                  The evolution of species occurrence recording through time. The bars show the number of occurrence records collected from the selected 
				  country each year on a logarithmic scale (left y-axis). The overlaid line shows the development of a selected democracy indicator (right y axis). 
				  Red blocks at the bottom of the bars indicate years with armed conflict on the country territory. Chose any country and democracy indicator 
				  with the drop-down menus, customize the record count to include only records from domestic 
				  institutions or records associated with pictures using the tick boxes and filter to certain taxa using the free text field.
                </Typography>
                <HighlightsButtonGroup
                  highlights={dualChartHighlights}
                  onChange={this.onDualChartHighlightsChange}
                  value={this.state.activeDualChartHighlight}
                />
              </Grid>

              <Grid item className="grid-item" xs={12} md={8}>
                <div id="dualChart" ref={this.refDualChart} />
                <RegimeLegend />
                
                {this.renderProgress()}
                
                <div className="controls">
                  <FormControl className="formControl" style={{ minWidth: 260, margin: 10 }}>
                    <InputLabel htmlFor="country">Country</InputLabel>
                    <AutoSelect
                      input={<Input name="country" id="country" />}
                      value={this.state.country}
                      onChange={this.handleCountryChange}
                      options={this.state.countries}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 240, margin: 10 }}>
                    <InputLabel htmlFor="vdemVariable">
                      Political variable
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="vdemVariable" id="vdemVariable" />}
                      value={this.state.vdemVariable}
                      onChange={this.onDualChartChangeVdemVariable}
                      options={vdemOptions}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 240, margin: 10 }}>
                    <InputLabel htmlFor="taxonFilter">
                      Taxon filter
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="taxonFilter" id="taxonFilter" />}
                      value={this.state.taxonFilter}
                      onChange={this.onDualChartChangeTaxonFilter}
                      onInputChange={this.onInputChangeTaxonFilter}
                      options={this.state.taxaAutocompletes}
                      isClearable
                    />
                  </FormControl>
                  <FormControlLabel
                    control={
                    <Checkbox
                      checked={this.state.onlyDomestic}
                      onChange={() => this.setState({ onlyDomestic: !this.state.onlyDomestic })}
                    />
                    }
                    label="Only show records from domestic institutions"
                  />
                  <FormControlLabel
                    control={
                    <Checkbox
                      checked={this.state.onlyWithImage}
                      onChange={() => this.setState({ onlyWithImage: !this.state.onlyWithImage })}
                    />
                    }
                    label="Only show records with photo"
                  />
                  <Zoom in={gbifError['101']} mountOnEnter unmountOnExit>
                    <Notice variant="error" message={
                      <span>Error: Querying the GBIF API for year facet data failed</span>
                    } />
                  </Zoom>
                  <Zoom in={gbifError['103']} mountOnEnter unmountOnExit>
                    <Notice variant="error" message={
                      <span>Error: Querying the GBIF API for taxon data failed</span>
                    } />
                  </Zoom>
                </div>
              </Grid>
            </Grid>
          </Grid>

          <Grid item className="grid-item section section-3" xs={12}>
            <About vdemExplanations={this.state.vdemExplanations} />
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default App;
