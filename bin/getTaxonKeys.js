import { queryAutocompletesGBIF } from '../src/api/gbif';

export default async function getTaxonKeys(query) {
  const res = await queryAutocompletesGBIF(query);
  if (res.error) {
    console.error(`Error trying to fetch gbif taxon keys from query '${query}:`, res.error);
    throw new Error(res.error);
  }
  const { data } = res.response;
  if (data.length === 0) {
    console.error(`No search result for query ${query}`);
    throw new Error(`No search result for query ${query}`);
  }
  const result = data.map(d => ({
    canonicalName: d.canonicalName,
    key: d.key,
  }));
  console.log(`Taxon filter ${query} results:\n${JSON.stringify(result, null, '\t')}`);
  return result;
}
