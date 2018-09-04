import { fetchRecordsPerCountryPerYear } from '../src/api/gbif';
import fs from 'fs';
import util from 'util';
const writeFile = util.promisify(fs.writeFile);

const outputFilename = './public/data/gbif_data.csv';

async function downloadRecords() {
  try {
    console.log('Fetching occurrences records per country per year from gbif...');
    const records = await fetchRecordsPerCountryPerYear();
    const lines = records.map(d => `${d.country},${d.year},${d.records}`);
    console.log(`Got ${records.length} records! Writing to file '${outputFilename}'...`);
    lines.unshift('country,year,records');
    await writeFile(outputFilename, lines.join('\n'));
    console.log(`${records.length} records written to file '${outputFilename}!`);
  }
  catch(err) {
    console.error('Error:', err);
    return [];
  }
}

export default downloadRecords;