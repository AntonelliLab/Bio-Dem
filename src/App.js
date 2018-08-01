import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import IconPublic from '@material-ui/icons/Public';
import IconPerson from '@material-ui/icons/RecordVoiceOver';
import logo from './logo.svg';
import DualChart from './d3/DualChart';
import ScatterPlot from './d3/ScatterPlot';
import { csv } from 'd3-fetch';
import { byAlpha2, byAlpha3 } from "iso-country-codes";
import AutoSelect from './components/AutoSelect';
import * as d3 from 'd3';
import About from './About';
import { queryGBIFYearFacet, queryGBIFCountryFacet } from "./api/gbif";

import './App.css';
import './d3/d3.css';

/**
 * V-dem variables
 * country,year,v2x_regime,v2x_freexp_altinf,v2x_frassoc_thick,v2x_rule,v2xcl_dmove,v2xcs_ccsi,v2x_corr,v2x_clphy,e_area,e_regiongeo,e_peaveduc,e_migdppc,e_peginiwi,e_wri_pa,e_population,e_Civil_War,e_miinterc,confl
AFG,1960,0,0.190868685410209,0.125512007338669,0.368635436412438,0.266093357150313,0.242432454719204,0.48274120527295,0.37271631597475,NA,14,0.31028929,2744,NA,NA,9616e3,0,0,0
AFG,1961,0,0.18535179976794,0.129522240943792,0.368635436412438,0.266093357150313,0.268914369944661,0.48274120527295,0.37271631597475,652090,14,0.340960361,2708,NA,NA,9799e3,0,0,0
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
  { value: 'v2x_freexp_altinf' },
  { value: 'v2x_frassoc_thick' },
  // { value: 'v2x_rule' },
  { value: 'v2xcl_dmove' },
  { value: 'v2xcs_ccsi' },
  { value: 'v2x_corr' },
  { value: 'v2x_clphy' },
  // { value: 'e_area' },
  // { value: 'e_regiongeo' },
  { value: 'e_peaveduc' },
  { value: 'e_migdppc' },
  // { value: 'e_peginiwi' },
  { value: 'e_wri_pa' },
  // { value: 'e_population' },
  // { value: 'e_Civil_War' },
  // { value: 'e_miinterc' },
  // { value: 'conf' },
];

// const BioDemLogo = () => (
//   <span style={{ position: 'relative', marginLeft: 5, marginRight: 5 }}>
//     <span style={{ position: 'absolute', left: 2, top: -11 }}>
//       <IconPerson />
//     </span>
//     <IconPublic />
//   </span>
// );

const BioDemLogo = ({ className = "logo", alt="logo" }) => (
  <img src={logo} className={className} alt={alt} />
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
  }

  async componentDidMount() {
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
        v2x_freexp_altinf: +row.v2x_freexp_altinf,
        v2x_frassoc_thick: +row.v2x_frassoc_thick,
        v2x_rule: +row.v2x_rule,
        v2xcl_dmove: +row.v2xcl_dmove,
        v2xcs_ccsi: +row.v2xcs_ccsi,
        v2x_corr: +row.v2x_corr,
        v2x_clphy: +row.v2x_clphy,
        e_area: +row.e_area,
        e_regiongeo: +row.e_regiongeo,
        e_peaveduc: +row.e_peaveduc,
        e_migdppc: +row.e_migdppc,
        e_peginiwi: +row.e_peginiwi,
        e_wri_pa: +row.e_wri_pa,
        e_population: +row.e_population,
        e_Civil_War: +row.e_Civil_War,
        e_miinterc: +row.e_miinterc,
        conf: +row.confl,
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
    console.log('Query gbif...');
    this.setState({ fetching: true });
    const result = await queryGBIFYearFacet(country, onlyDomestic);
    console.log('received gbif year facet data:', result);
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
      this.renderChart();
    });
  }

  makeCountryFacetQuery = async () => {
    // Query the GBIF API
    console.log('Query gbif...');
    this.setState({ fetching: true });
    const result = await queryGBIFCountryFacet(this.state.xyYearMin);
    console.log('received gbif country facet data:', result);
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
        this.renderChart();
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
      this.renderChart();
    });
  }

  handleChange = (event) => {
    console.log('handleChange, key:', event.target.name, 'value:', event.target.value);
    this.setState({ [event.target.name]: event.target.value }, () => {
      this.renderChart();
    });
  }

  handleCountryChange = async (event) => {
    console.log('querying for this country: ', event.target.value);
    this.setState({ [event.target.name]: event.target.value });
  }

  renderChart() {
    const { gbifData, vdemData, yearMin, yearMax, fetching, vdemVariable, vdemExplanations } = this.state;
    
    const y2Label = vdemExplanations[vdemVariable] ? vdemExplanations[vdemVariable].short_name : vdemVariable;

    const vdemFiltered = vdemData
      .filter(d => d.country === this.state.country && d.year >= yearMin && d.year <= yearMax)
    
    const gbifDataFiltered = gbifData
      .filter(d => d.year >= yearMin && d.year <= yearMax)
      .sort((a,b) => a.year - b.year)
    
    console.log('renderChart with fethcing:', fetching);
    DualChart('#dualChart', {
      data: gbifDataFiltered,
      secondData: vdemFiltered,
      height: 300,
      left: 110,
      xMin: yearMin,
      x: d => d.year,
      y: d => d.collections,
      x2: d => d.year,
      y2: d => d[this.state.vdemVariable],
      y2Min: 0,
      y2Max: 1,
      xLabel: 'Year',
      yLabel: '#Records',
      y2Label: y2Label,
      title: 'Number of public species records per country and year',
      fetching,
    });


    const { vdemX, vdemY, xyYearMin, xyReduceFunction, gbifCountryFacetData } = this.state;
    const vdemXLabel = vdemExplanations[vdemX] ? vdemExplanations[vdemX].short_name : vdemX;
    const vdemYLabel = vdemExplanations[vdemY] ? vdemExplanations[vdemY].short_name : vdemY;
    
    const vdemScatterData = vdemData
      .filter(d => d.year >= xyYearMin);
    
    const vdemGrouped = d3.nest()
      .key(d => d.country)
      .rollup(values => {
        const x = d3[xyReduceFunction](values, d => d[vdemX]);
        const y = d3[xyReduceFunction](values, d => d[vdemY]);
        return { x, y };
      })
      .entries(vdemScatterData);
    
    // console.log('vdemData:', vdemData);
    // console.log('vdemGrouped:', vdemGrouped);
    // console.log('countryFacetData', gbifCountryFacetData);
    vdemGrouped.forEach(d => {
      d.value.records = gbifCountryFacetData[d.key] ? gbifCountryFacetData[d.key].collections : 0;
    });

    ScatterPlot('#xyChart', {
      // data: vdemData,
      // data: vdemFiltered,
      data: vdemGrouped,
      height: 300,
      // x: d => d[vdemX],
      // y: d => d[vdemY],
      x: d => d.value.x,
      y: d => d.value.y,
      value: d => d.value.records,
      xLabel: vdemXLabel,
      yLabel: vdemYLabel,
      title: 'Number of public species records per country'
    });
  }

  renderProgress() {
    const { loaded, fetching } = this.state;
    return (
      <div style={{ height: 20 }}>
        { loaded && !fetching ? null : <LinearProgress /> }
      </div>
    )
  }

  render() {
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
          <Grid item className="grid-item" xs={12} className="intro section section-0">
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

          
          <Grid item className="grid-item" xs={12} className="section section-1">
            <Grid container>
              <Grid item className="grid-item" xs={12} md={4}>
                <Typography variant="headline" gutterBottom className="heading">
                  Biodiversity knowledge &amp; political regimes
                </Typography>
                <Typography variant="body1" gutterBottom>
                  The scatter plot shows the number of public species records for each country and their mean or median value on two selected dimensions of democracy. Use the drop down menus to customize your search. You can directly move to some particularly exciting results with the highlight buttons below; find explanation of  the plots and the features of Bio-Dem in our <a href="#">video tutorials</a>, 
                  and learn more about the underlying data and included variables 
                  at <a href="#about">About</a>.
                </Typography>
              </Grid>
              <Grid item className="grid-item" xs={12} md={8}>
                <div id="xyChart" />

                {this.renderProgress()}

                <div className="controls">
                  <FormControl className="formControl" style={{ minWidth: 200, margin: 20 }}>
                    <InputLabel htmlFor="vdemX">X axis</InputLabel>
                    <AutoSelect
                      input={<Input name="vdemX" id="vdemX" />}
                      value={this.state.vdemX}
                      onChange={this.handleChange}
                      options={vdemOptions}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 200, margin: 20 }}>
                    <InputLabel htmlFor="vdemY">Y axis</InputLabel>
                    <AutoSelect
                      input={<Input name="vdemY" id="vdemY" />}
                      value={this.state.vdemY}
                      onChange={this.handleChange}
                      options={vdemOptions}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 100, margin: 20 }}>
                    <InputLabel htmlFor="xyYearMin">
                      From year
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="xyYearMin" id="xyYearMin" />}
                      value={this.state.xyYearMin}
                      onChange={this.handleChange}
                      options={d3.range(1960,2018).map(y => ({
                        value: y, label: y
                      }))}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 100, margin: 20 }}>
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
                </div>
              </Grid>
            </Grid>
          </Grid>
          

          <Grid item className="grid-item" xs={12} className="section section-2">
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
                
                <div id="dualChart" />
                
                {this.renderProgress()}
                
                <div className="controls">
                  <FormControl className="formControl" style={{ minWidth: 150, margin: 20 }}>
                    <InputLabel htmlFor="country">Country</InputLabel>
                    <AutoSelect
                      input={<Input name="country" id="country" />}
                      value={this.state.country}
                      onChange={this.handleCountryChange}
                      options={this.state.countries.map(d => ({ value: d, label: d }))}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 200, margin: 20 }}>
                    <InputLabel htmlFor="vdemVariable">
                      Political variable
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="vdemVariable" id="vdemVariable" />}
                      value={this.state.vdemVariable}
                      onChange={this.handleChange}
                      options={vdemOptions}
                    />
                  </FormControl>
                  <FormControl className="formControl" style={{ minWidth: 100, margin: 20 }}>
                    <InputLabel htmlFor="yearMin">
                      From year
                    </InputLabel>
                    <AutoSelect
                      input={<Input name="yearMin" id="yearMin" />}
                      value={this.state.yearMin}
                      onChange={this.handleChange}
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

        <Grid item className="grid-item" xs={12} className="section section-3">
          <About vdemExplanations={this.state.vdemExplanations}/>
        </Grid>
      </div>
    );
  }
}

export default App;
