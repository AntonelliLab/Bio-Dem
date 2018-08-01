import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Zoom from '@material-ui/core/Zoom';
import logo from './logo.svg';
import DualChart from './d3/DualChart';
import ScatterPlot from './d3/ScatterPlot';
import { csv } from 'd3-fetch';
import { byAlpha2, byAlpha3 } from "iso-country-codes";
import AutoSelect from './components/AutoSelect';
import { haveNaN, isWithin } from './d3/helpers';
import * as d3 from 'd3';
import About from './About';
import Notice from './components/Notice';
import { queryGBIFYearFacet, queryGBIFCountryFacet } from "./api/gbif";

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

const vdemOptions = [
  // { value: 'v2x_regime' },
  { value: 'v2x_polyarchy' },
  { value: 'v2x_freexp_altinf' },
  { value: 'v2x_frassoc_thick' },
  { value: 'v2xcl_dmove' },
  { value: 'v2xcs_ccsi' },
  { value: 'v2x_corr' },
  { value: 'v2x_clphy' },
  // { value: 'e_regiongeo' },
  { value: 'e_peaveduc' },
  { value: 'e_migdppc' },
  { value: 'e_wri_pa' },
  // { value: 'conf' },
];

const regimeTypes = {
  0: 'Closed autocracy',
  1: 'Electoral autocracy',
  2: 'Electoral democracy',
  3: 'Liberal democracy',
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
}

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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gbifData: [],
      onlyDomestic: false,
      vdemData: [],
      vdemExplanations: {},
      loaded: false,
      fetching: false,
      country: 'SWE',
      vdemVariable: 'v2x_freexp_altinf',
      countries: [],
      yearMin: 1960,
      yearMax: 2018,
      // XY Plot:
      vdemX: 'v2x_freexp_altinf',
      vdemY: 'v2x_frassoc_thick',
      xyYearMin: 1960,
      xyReduceFunction: 'mean',
    };
    this.refScatterPlot = React.createRef();
    this.refDualChart = React.createRef();
  }
  
  async componentDidMount() {
    window.addEventListener('resize', this.onResize, false);
    await this.initData();
  }

  async componentDidUpdate(prevProps, prevState) {
    const fetchNewCountryCondition = this.state.onlyDomestic !== prevState.onlyDomestic
      || this.state.country !== prevState.country;
    
    if (fetchNewCountryCondition) {
      // Get alpha2 ISO code for this country, as this is what GBIF requires as query
      // TODO: Catch cases where !byAlpha3[event.target.value]
      const alpha2 = byAlpha3[this.state.country].alpha2;
      await this.makeYearFacetQuery(alpha2);
    }

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
  }

  async fetchData() {
    if (this.data) {
      return this.data;
    }
    this.setState({
      fetching: true,
    });
    await this.makeYearFacetQuery('SE');
    await this.makeCountryFacetQuery();
    const vdemData = csv(vdemDataUrl, row => {
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
        confl: +row.confl,
      };
    });
    const vdemExplanations = csv(vdemExplanationsUrl, row => {
      return {
        id: row.id,
        full_name: row.full_name,
        short_name: row.short_name,
        description: row.description,
        relevance: row.relevance,
        references: row.references,
      };
    });
    const data = await Promise.all([vdemData, vdemExplanations]);
    this.data = data;
    this.setState({
      loaded: true,
      fetching: false,
    });
    return data;
  }

  makeYearFacetQuery = async (country) => {
    const { onlyDomestic } = this.state;
    // Query the GBIF API
    console.log('Query gbif with year facet...');
    this.setState({ fetching: true });
    const result = await queryGBIFYearFacet(country, onlyDomestic);
    // console.log('received gbif year facet data:', result);
    if (result.error) {
      // TODO: request errored out => handle UI
      return;
    }
    const gbifData = result.response.data.facets[0].counts.map(d => ({
      year: +d.name,
      collections: +d.count,
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
    this.setState({ fetching: true });
    const result = await queryGBIFCountryFacet(this.state.xyYearMin);
    // console.log('received gbif country facet data:', result);
    if (result.error) {
      // TODO: request errored out => handle UI
      return;
    }
    const gbifCountryFacetData = {};
    result.response.data.facets[0].counts.map(d => {
      const alpha2Country = byAlpha2[d.name];
      gbifCountryFacetData[alpha2Country ? alpha2Country.alpha3 : null] = {
        collections: d.count,
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
  }

  async initData() {
    const data = await this.fetchData();
    const [vdemData, vdemExplanationsArray] = data;
    const countries = {};
    vdemData.forEach(d => {
      countries[d.country] = 1;
    });
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
      countries: Object.keys(countries),
    }, () => {
      this.renderCharts();
    });
  }

  handleChange = (event) => {
    // console.log('handleChange, key:', event.target.name, 'value:', event.target.value);
    this.setState({ [event.target.name]: event.target.value }, () => {
      this.renderCharts();
    });
  }

  onDualChartChangeVdemVariable = (event) => {
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
  }

  handleCountryChange = async (event) => {
    // console.log('querying for this country: ', event.target.value);
    this.setState({ [event.target.name]: event.target.value });
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
      d3.min([...dim.map(d => stopYear[d]), defaultEndYear]),
    ];
  }

  renderCharts() {
    this.renderScatterPlot();
    this.renderDualChart();
  }

  renderScatterPlot() {
    const { vdemData, vdemX, vdemY, xyYearMin, xyReduceFunction, gbifCountryFacetData, vdemExplanations } = this.state;
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
        const x = d3[xyReduceFunction](values, d => d[vdemX]);
        const y = d3[xyReduceFunction](values, d => d[vdemY]);
        const z = d3[xyReduceFunction](values, d => d.v2x_regime);
        return { x, y, z };
      })
      .entries(vdemData
        // Aggregate within selected years
        .filter(d => d.year >= startYear && d.year <= stopYear)
      );

      vdemGrouped.forEach(d => {
        if (d.value !== null && gbifCountryFacetData[d.key]) {
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
      value: d => d.value.records,
      color: d => regimeColor(d.value.z),
      tooltip: d => `
        <div>
          <div><strong>Country:</strong> ${d.key}</div>
          <div><strong>Records:</strong> ${d.value.records}</div>
        </div>
      `,
      xLabel: vdemXLabel,
      yLabel: vdemYLabel,
      title: 'Number of public species records per country'
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
      // z: d => d.v2x_regime,
      color: d => regimeColor(d.v2x_regime),
      zMin: 0,
      zMax: 3,
      // zLabel: d => regimeTypes[d.v2x_regime],
      y2Min: 0,
      y2Max: vdemScaleMax[vdemVariable],
      xLabel: 'Year',
      yLabel: 'Number of records',
      y2Label: y2Label,
      title: 'Number of public species records per country and year',
      fetching,
    });
  }

  renderProgress() {
    const { loaded, fetching } = this.state;
    return (
      <div style={{ height: 10 }}>
        { loaded && !fetching ? null : <LinearProgress /> }
      </div>
    )
  }

  render() {
    const { vdemX, vdemY, xyYearMin } = this.state;
    const xyValidYears = this.getValidYears([vdemX, vdemY], 1960, 2018);
    const xyYearIntervalLimited = xyYearMin < xyValidYears[0] || xyValidYears[1] < 2016;
    return (
      <div className="App">
        <AppBar position="static" color="primary">
          <Toolbar>
            {/* <BioDemLogo className="appbar-logo" alt="appbar-logo" /> */}
            <Typography variant="title" color="inherit">
              Bio-Dem&nbsp;&mdash;&nbsp;Biodiversity knowledge and democracy
            </Typography>
          </Toolbar>
        </AppBar>

        <Grid container>
          <Grid item className="grid-item intro section section-0" xs={12}>
            <Grid container direction="column" alignItems="center">
              <Grid item>
                <BioDemLogo className="intro-logo" alt="intro-logo" />
              </Grid>
              <Grid item>
                <Grid container direction="column" alignItems="center">
                  <Typography variant="display2" gutterBottom className="heading">
                    Bio-Dem
                  </Typography>
                  <div style={{ borderTop: '1px solid #ccc', marginTop: -10, paddingTop: 10 }}>
                    <Typography variant="subheading" gutterBottom style={{ maxWidth: 960 }}>
                      Explore the relations between <a href="#gbif"><strong>biodiversity</strong></a> knowledge and different dimensions of <a href="#v-dem"><strong>democracy</strong></a> across the globe.
                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item className="grid-item section section-1" xs={12}>
            <Grid container>
              <Grid item className="grid-item" xs={12} md={4}>
                <Typography variant="headline" gutterBottom className="heading">
                  Biodiversity knowledge &amp; political regimes
                </Typography>
                <Typography variant="body1" gutterBottom>
                  The scatter plot shows the number of public species records for each country and their mean or median value on two selected dimensions of democracy. Use the drop down menus to customize your search. You can directly move to some particularly exciting results with the highlight buttons below; find explanation of  the plots and the features of Bio-Dem in our <a href="#video">video tutorials</a>, 
                  and learn more about the underlying data and included variables 
                  at <a href="#about">About</a>.
                </Typography>
              </Grid>
              <Grid item className="grid-item" xs={12} md={8}>
                <div id="scatterPlot" ref={this.refScatterPlot} />
                <RegimeLegend />
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
                        value: y, label: y, disabled: !isWithin(y, xyValidYears) || y < 1963
                      }))}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 100, margin: 10 }}>
                    <InputLabel htmlFor="xyReduceFunction">
                      Reduce by
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="xyReduceFunction" id="xyReduceFunction" />}
                      value={this.state.xyReduceFunction}
                      onChange={this.handleChange}
                      options={['mean', 'median'].map(d => ({
                        value: d, label: d
                      }))}
                    />
                  </FormControl>
                  <Zoom in={xyYearIntervalLimited}>
                    <Notice variant="warning" message={
                      <span>Yearly data only available in the sub interval <strong>[{xyValidYears.toString()}]</strong> for the selected dimensions</span>
                    }/>
                  </Zoom>
                </div>
              </Grid>
            </Grid>
          </Grid>
          

          <Grid item className="grid-item section-2" xs={12}>
            <Grid container>

              <Grid item className="grid-item" xs={12} md={4}>
                <Typography variant="headline" gutterBottom className="heading">
                  Biodiversity knowledge through time 
                </Typography>
                <Typography variant="body1" gutterBottom>
                  The dual axis chart shows the yearly evolution of the number of public species records together with the values of the selected democracy dimension. Use the drop down menus and the tick boxes to customize your search.
                </Typography>
              </Grid>

              <Grid item className="grid-item" xs={12} md={8}>
                
                <div id="dualChart" ref={this.refDualChart} />
                <RegimeLegend />
                
                {this.renderProgress()}
                
                <div className="controls">
                  <FormControl className="formControl" style={{ minWidth: 150, margin: 10 }}>
                    <InputLabel htmlFor="country">Country</InputLabel>
                    <AutoSelect
                      input={<Input name="country" id="country" />}
                      value={this.state.country}
                      onChange={this.handleCountryChange}
                      options={this.state.countries.map(d => ({ value: d, label: d }))}
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
                  <FormControl className="formControl" style={{ minWidth: 100, margin: 10 }}>
                    <InputLabel htmlFor="yearMin">
                      From year
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="yearMin" id="yearMin" />}
                      value={this.state.yearMin}
                      onChange={this.onDualChartChangeYearMin}
                      options={d3.range(1960,2018).map(y => ({
                        value: y, label: y
                      }))}
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
                </div>
              </Grid>
            </Grid>
          </Grid>

        </Grid>

        <Grid item className="grid-item section-3" xs={12}>
          <About vdemExplanations={this.state.vdemExplanations}/>
        </Grid>
      </div>
    );
  }
}

export default App;
