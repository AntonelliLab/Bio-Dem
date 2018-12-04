require('@babel/register');
const api = require('./bin/downloadGbifData');
const { downloadRecords, downloadRecordsByTaxons } = api;

// const [,,taxonKey] = process.argv;
const taxonFilters = process.argv.slice(2) || [''];

if(taxonFilters.length === 0) {
  downloadRecords();
} else {
  // If using multiple taxon filters, use 'all' as first to not 
  // miss records by the left join
  downloadRecordsByTaxons(taxonFilters);
}
