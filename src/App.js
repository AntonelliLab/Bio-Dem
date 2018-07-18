import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import LinearProgress from '@material-ui/core/LinearProgress';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import './App.css';
import DualChart from './d3/DualChart';
import { csv } from 'd3-fetch';

/**
 * Bird collections per year from GBIF
 * country,date,collections
 ABW,1908,5
 ABW,1944,1
 */
const birdDataUrl = `${process.env.PUBLIC_URL}/data/ebird_collections_per_country_per_year.csv`;
// const birdDataUrl = `https://raw.githubusercontent.com/AntonelliLab/Vdem-Biodiversity/master/analyses/input/ebird_collections_per_country_per_year.csv?token=AG-Yjp1YGlsR4_0uJUefhgpd-9EhfBV-ks5bV9v7wA%3D%3D`;
/**
 * V-dem variables
 * country,year,v2x_regime,v2x_freexp_altinf,v2x_frassoc_thick,v2x_rule,v2xcl_dmove,v2xcs_ccsi,v2x_corr,v2x_clphy,e_area,e_regiongeo,e_peaveduc,e_migdppc,e_peginiwi,e_wri_pa,e_population,e_Civil_War,e_miinterc,confl
AFG,1960,0,0.190868685410209,0.125512007338669,0.368635436412438,0.266093357150313,0.242432454719204,0.48274120527295,0.37271631597475,NA,14,0.31028929,2744,NA,NA,9616e3,0,0,0
AFG,1961,0,0.18535179976794,0.129522240943792,0.368635436412438,0.266093357150313,0.268914369944661,0.48274120527295,0.37271631597475,652090,14,0.340960361,2708,NA,NA,9799e3,0,0,0
 */
const vdemDataUrl = `${process.env.PUBLIC_URL}/data/vdem_variables.csv`;
// const vdemDataUrl = `https://raw.githubusercontent.com/AntonelliLab/Vdem-Biodiversity/master/analyses/input/vdem_variables.csv?token=AG-YjnEhdZQC1HdaThLt5uEBQRmdT1zLks5bV-6-wA%3D%3D`;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      birdData: [],
      vdemData: [],
      loaded: false,
      fetching: false,
      country: 'SWE',
      vdemVariable: 'v2x_freexp_altinf',
      countries: [],
    };
  }

  async fetchData() {
    if (this.data) {
      return this.data;
    }
    this.setState({
      fetching: true,
    });
    const birdData = csv(birdDataUrl, row => {
      const year = +row.date;
      if (Number.isNaN(year)) {
        return null;
      }
      return {
        date: new Date(+row.date, 0),
        year: +row.date,
        country: row.country,
        collections: +row.collections,
      };
    });
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
    const data = await Promise.all([birdData, vdemData]);
    this.data = data;
    this.setState({
      loaded: true,
      fetching: false,
    });
    return data;
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value }, () => {
      this.renderChart();
    });
  }

  async initData() {
    const data = await this.fetchData();
    const [birdData, vdemData] = data;
    const countries = {};
    vdemData.forEach(d => {
      countries[d.country] = 1;
    });
    this.setState({
      birdData,
      vdemData,
      countries: Object.keys(countries),
    }, () => {
      this.renderChart();
    });
  }

  async componentDidMount() {
    await this.initData();
  }

  renderChart() {
    const { birdData, vdemData } = this.state;
    
    const vdemFiltered = vdemData
      .filter(d => d.country === this.state.country)
      // .sort((a,b) => a.year - b.year);
    // console.log('vdemFiltered:', vdemFiltered);

    
    DualChart('#chart', {
      data: birdData.filter(d => d.country === this.state.country),
      secondData: vdemFiltered,
      height: 300,
      xMin: 1960,
      x: d => d.year,
      y: d => d.collections,
      x2: d => d.year,
      y2: d => d[this.state.vdemVariable],
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
            <Typography variant="title" color="inherit">
              V-dem - biodiversity
            </Typography>
          </Toolbar>
        </AppBar>
        <div className="main">
          <div className="controls">
            <FormControl className="formControl" style={{ minWidth: 150, margin: 20 }}>
              <InputLabel htmlFor="country">Country</InputLabel>
              <Select
                value={this.state.country}
                onChange={this.handleChange}
                input={<Input name="country" id="country" />}
              >
                { this.state.countries.map(country => <MenuItem key={country} value={country}>{country}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl className="formControl" style={{ minWidth: 150, margin: 20 }}>
              <InputLabel htmlFor="vdemVariable">Political variable</InputLabel>
              <Select
                value={this.state.vdemVariable}
                onChange={this.handleChange}
                input={<Input name="vdemVariable" id="vdemVariable" />}
              >
                <MenuItem value="v2x_regime">v2x_regime</MenuItem>
                <MenuItem value="v2x_freexp_altinf">v2x_freexp_altinf</MenuItem>
                <MenuItem value="v2x_frassoc_thick">v2x_frassoc_thick</MenuItem>
                <MenuItem value="v2x_rule">v2x_rule</MenuItem>
                <MenuItem value="v2xcl_dmove">v2xcl_dmove</MenuItem>
                <MenuItem value="v2xcs_ccsi">v2xcs_ccsi</MenuItem>
                <MenuItem value="v2x_corr">v2x_corr</MenuItem>
                <MenuItem value="v2x_clphy">v2x_clphy</MenuItem>
                <MenuItem value="e_area">e_area</MenuItem>
                <MenuItem value="e_regiongeo">e_regiongeo</MenuItem>
                <MenuItem value="e_peaveduc">e_peaveduc</MenuItem>
                <MenuItem value="e_migdppc">e_migdppc</MenuItem>
                <MenuItem value="e_peginiwi">e_peginiwi</MenuItem>
                <MenuItem value="e_wri_pa">e_wri_pa</MenuItem>
                <MenuItem value="e_population">e_population</MenuItem>
                <MenuItem value="e_Civil_War">e_Civil_War</MenuItem>
                <MenuItem value="e_miinterc">e_miinterc</MenuItem>
                <MenuItem value="conf">confl</MenuItem>
              </Select>
            </FormControl>
          </div>
          { this.renderProgress() }
          <div id="chart"/>
          <div id="chart2"/>
        </div>
      </div>
    );
  }
}

export default App;
