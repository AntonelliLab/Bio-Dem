import { fetchRecordsPerCountryPerYear } from './src/api/gbif';
import fs from 'fs';
import util from 'util';
const writeFile = util.promisify(fs.writeFile);

const outputFilename = './public/data/gbif_data.csv';

async function downloadRecords() {
  try {
    const records = await fetchRecordsPerCountryPerYear();
    const lines = records.map(d => `${d.country},${d.year},${d.records}`);
    lines.unshift('country,year,records');
    await writeFile(outputFilename, lines.join('\n'));
    console.log(`${records.length} records written to file '${outputFilename}!`);
  }
  catch(err) {
    console.error('Error:', err);
    return [];
  }
}

downloadRecords();
