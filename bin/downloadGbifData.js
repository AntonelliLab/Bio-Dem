import { fetchRecordsPerCountryPerYear } from '../src/api/gbif';
import getTaxonKeys from './getTaxonKeys';
import fs from 'fs';
import util from 'util';
const writeFile = util.promisify(fs.writeFile);


export async function downloadRecords() {
  try {
    console.log('Fetching occurrences records per country per year from gbif...');
    const records = await fetchRecordsPerCountryPerYear();
    const lines = records.map(d => `${d.country},${d.year},${d.records}`);
    const outputFilename = `./public/data/gbif_data.csv`;
    console.log(`Got ${records.length} records! Writing to file '${outputFilename}'...`);
    lines.unshift('country,year,records');
    await writeFile(outputFilename, lines.join('\n'));
    console.log(`${records.length} records written to file '${outputFilename}!`);
  }
  catch(err) {
    console.error('Error:', err.message);
    return [];
  }
}

/**
 * @param taxonFilter GBIF taxon key or search term
 * Examples:
 * Mammalia: 359
 * Reptilia: 358
 * Amphibia: 131
 */
export async function downloadRecordsByTaxon(taxonFilter, { onlyDomestic = false } = {}) {
  try {
    console.log(`Download records (onlyDomestic = ${onlyDomestic}) with taxon filter:`, taxonFilter);
    let taxon = { name: 'all', key: undefined };
    if (taxonFilter && taxonFilter !== 'all') {
      let taxonKey = +taxonFilter;
      let taxonName = taxonFilter;
      if (Number.isNaN(taxonKey)) {
        const keys = await getTaxonKeys(taxonFilter);
        taxonKey = keys[0].key;
        taxonName = keys[0].canonicalName;
      }
      taxon = { name: taxonName, key: taxonKey };
      console.log('Using taxon filter:', JSON.stringify(taxon));
    }
    console.log(`Fetching occurrences records per country per year from gbif...`);
    const records = await fetchRecordsPerCountryPerYear({ taxonFilter: taxon.key, onlyDomestic });
    console.log(`Got ${records.length} records!`);
    return { name: taxon.name, records };
  }
  catch(err) {
    console.error('Error:', err.message);
    return [];
  }
}

/**
 * @param taxonFilters List of GBIF taxon keys or search terms to add after all records
 * Examples: ['all', 'mammalia', 'reptilia', 'amphibia'].
 * The results will be merged to the records of the first search result
 * The search term 'all' means no filter.
 * @param addDomestic for each filter, add a column with the number of records from domestic institutions
 */
export async function downloadRecordsByTaxons(taxonFilters = [], { addDomestic = false } = {}) {
  try {
    if (taxonFilters.length === 0) {
      console.error(`No taxon filter specified. Use 'all' or empty string for all records.`);
      return;
    }
    const filters = taxonFilters.map(f => f === '' ? 'all' : f);
    console.log(`Download records with taxon filters:`, filters);
    // parallel fetching gives error with status code 503 (server overload)
    // const data = await Promise.all(filters.map(filter => downloadRecordsByTaxon(filter)));
    // Fetch serially instead
    const data = [];
    for (let filter of filters) {
      const result = await downloadRecordsByTaxon(filter);
      data.push(result);
      if (addDomestic) {
        const domesticResult = await downloadRecordsByTaxon(filter, { onlyDomestic: true });
        domesticResult.name = `${domesticResult.name}-domestic`;
        data.push(domesticResult);
      }
    }
    
    console.log(`Got ${data.length} resulting datasets:`, JSON.stringify(data.map(r => {
      return { name: r.name, size: r.records.length };
    })));
    // Left join other taxon records on country,year from all records
    console.log(`Merging datasets as left join...`);
    const recordsByCountryYear = {};
    // First create a map from the first records dataset
    data[0].records.forEach(d => recordsByCountryYear[`${d.country},${d.year}`] = { [data[0].name]: d.records });
    // Add records from selected taxonomies
    for (let i = 1; i < data.length; ++i) {
      data[i].records.forEach(d => recordsByCountryYear[`${d.country},${d.year}`][data[i].name] = d.records);
    }
    const names = data.map(d => d.name);
    // const lines = records.map(d => `${d.country},${d.year},${d.records}`);
    const lines = Object.keys(recordsByCountryYear).map(countryYear => {
      const d = recordsByCountryYear[countryYear];
      const records = [];
      for (const name of names) {
        records.push(d[name] || 0);
      }
      return `${countryYear},${records.join(',')}`;
    });
    const outputFilename = `./gbif_data.csv`;
    console.log(`Writing to file '${outputFilename}'...`);
    lines.unshift(`country,year,${names.join(',')}`);
    await writeFile(outputFilename, lines.join('\n'));
    console.log(`${lines.length} lines written to file '${outputFilename}!`);
  }
  catch(err) {
    console.error('Error:', err);
    return [];
  }
}

export default async function run(argv) {
  const cli = require('minimist')(argv);
  
  const taxonFilters = cli._;
  const addDomestic = cli['add-domestic'];

  if(taxonFilters.length === 0) {
    downloadRecords();
  } else {
    // If using multiple taxon filters, use 'all' as first to not 
    // miss records by the left join
    downloadRecordsByTaxons(taxonFilters, { addDomestic });
  }

}