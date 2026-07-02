import axios from "axios";
import countryCodes from "../helpers/countryCodes";
import { countries } from "./data";
import sortyBy from "lodash/sortBy";

axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

const countriesFiltered = countries.filter((alpha3) =>
  countryCodes.alpha3ToAlpha2(alpha3),
);

const baseURL = "https://api.gbif.org/v1/";
const occ = "occurrence/search";
const autoc = "species/suggest";

export const queryGBIFYearFacetOld = async (
  country,
  { onlyDomestic = false, onlyWithImage = false, taxonFilter = "" },
) => {
  // Construct the GBIF occurrences API url with facets for year counts
  const url = `${baseURL}${occ}`;
  const params = {
    country: country || "SE",
    limit: 0,
    facet: "year",
    "year.facetLimit": 200,
  };
  if (onlyDomestic) {
    params.publishingCountry = country;
  }
  if (taxonFilter) {
    params.taxonKey = taxonFilter;
  }
  if (onlyWithImage) {
    params.mediaType = "StillImage";
  }

  // GET request to the GBIF-API
  return axios
    .get(url, { params })
    .then((response) => {
      return { response };
    })
    .catch((error) => {
      console.log("Error in fetching results from the GBIF API", error.message);
      return { error };
    });
};

// Query GBIF for record counts per year for a country (facet=year over the
// [yearMin, yearMax] range), with optional extra filters. GBIF returns facet
// buckets ordered by count rather than year, and omits years with no records,
// so the caller reindexes by year and fills gaps with 0. Returns a Map of
// year -> count.
const fetchYearCounts = async (
  country,
  { taxonFilter = "", onlyWithImage = false, yearMin, yearMax, extraParams = {} },
) => {
  const url = `${baseURL}${occ}`;
  const params = {
    country,
    limit: 0,
    facet: "year",
    // Bound the result set to the range of interest server-side, and allow
    // enough facet buckets to cover every distinct year in that range.
    year: `${yearMin},${yearMax}`,
    "year.facetLimit": Math.max(200, yearMax - yearMin + 1),
    ...extraParams,
  };
  if (taxonFilter) {
    params.taxonKey = taxonFilter;
  }
  if (onlyWithImage) {
    params.mediaType = "StillImage";
  }

  const response = await axios.get(url, { params });
  const counts = new Map();
  const yearFacet =
    response.data.facets?.find((f) => f.field === "YEAR") ??
    response.data.facets?.[0];
  yearFacet?.counts.forEach((c) => counts.set(+c.name, c.count));
  return counts;
};

/**
 * Records per year for a country, broken down by publisher origin (domestic /
 * former coloniser / rest) and basis of record (preserved specimen).
 *
 * GBIF facets are one-dimensional (no cross-tabulation), so rather than one
 * request per year — which fired ~60 parallel requests and tripped the rate
 * limiter (HTTP 429) — this issues one facet=year request per breakdown
 * dimension (3-4 requests total) and combines them by year.
 */
export const queryGBIFFacetPerYear = async (
  country,
  {
    onlyWithImage = false,
    taxonFilter = "",
    onlyPreservedSpecimen = false,
    onlyDomestic = false,
    yearMin = 1960,
    yearMax = 2019,
    otherCountry = null,
  },
) => {
  try {
    const base = { taxonFilter, onlyWithImage, yearMin, yearMax };
    // Filters reflecting the user's active toggles, applied to every query.
    const baseParams = {};
    if (onlyDomestic) {
      baseParams.publishingCountry = country;
    }
    if (onlyPreservedSpecimen) {
      baseParams.basisOfRecord = "PRESERVED_SPECIMEN";
    }

    const [totalCounts, preservedCounts, domesticCounts, otherCounts] =
      await Promise.all([
        fetchYearCounts(country, { ...base, extraParams: baseParams }),
        fetchYearCounts(country, {
          ...base,
          extraParams: { ...baseParams, basisOfRecord: "PRESERVED_SPECIMEN" },
        }),
        fetchYearCounts(country, {
          ...base,
          extraParams: { ...baseParams, publishingCountry: country },
        }),
        // When already restricted to domestic publishers there is, by
        // definition, no "other country" share, so skip that request.
        otherCountry && !onlyDomestic
          ? fetchYearCounts(country, {
              ...base,
              extraParams: { ...baseParams, publishingCountry: otherCountry },
            })
          : Promise.resolve(new Map()),
      ]);

    const data = [];
    for (let year = yearMin; year <= yearMax; year += 1) {
      const count = totalCounts.get(year) || 0;
      const countPreserved = preservedCounts.get(year) || 0;
      const countDomestic = domesticCounts.get(year) || 0;
      const countOther = otherCounts.get(year) || 0;
      data.push({
        year,
        count,
        countPreserved,
        countNotPreserved: count - countPreserved,
        countDomestic,
        countOther,
        countRest: count - countDomestic - countOther,
      });
    }
    return { data };
  } catch (error) {
    console.log("Error in fetching results from the GBIF API", error.message);
    return { error };
  }
};

// Aggregate publisher-origin breakdown for a country over a year range: which
// countries published the selected country's records (facet=publishingCountry).
// Used to colour the world map in "publisher origin" mode. Returns the raw
// response; response.data.count is the grand total for computing shares.
export const queryPublisherOrigin = async (
  country,
  {
    yearMin = 1960,
    yearMax = 2019,
    taxonFilter = "",
    onlyWithImage = false,
    onlyDomestic = false,
    onlyPreservedSpecimen = false,
  } = {},
) => {
  const url = `${baseURL}${occ}`;
  const params = {
    country,
    limit: 0,
    facet: "publishingCountry",
    "publishingCountry.facetLimit": 400,
    year: `${yearMin},${yearMax}`,
  };
  if (taxonFilter) {
    params.taxonKey = taxonFilter;
  }
  if (onlyWithImage) {
    params.mediaType = "StillImage";
  }
  if (onlyDomestic) {
    params.publishingCountry = country;
  }
  if (onlyPreservedSpecimen) {
    params.basisOfRecord = "PRESERVED_SPECIMEN";
  }

  return axios
    .get(url, { params })
    .then((response) => ({ response }))
    .catch((error) => {
      console.log("Error in fetching results from the GBIF API", error.message);
      return { error };
    });
};

export const queryGBIFCountryFacet = async (yearMin = 1960, yearMax = 2019) => {
  // Construct the GBIF occurrences API url with facets for country counts
  const url = `${baseURL}${occ}`;
  const params = {
    year: yearMin === yearMax ? `${yearMin}` : `${yearMin},${yearMax}`,
    limit: 0,
    facet: "country",
    "country.facetLimit": 200,
  };
  // GET request to the GBIF-API
  return axios
    .get(url, { params })
    .then((response) => {
      return { response };
    })
    .catch((error) => {
      console.log("Error in fetching results from the GBIF API", error.message);
      return { error };
    });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Run async tasks over `items` with at most `limit` running concurrently,
// preserving input order in the results.
async function mapWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await task(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

// GBIF returns HTTP 429 when too many requests arrive at once. Retry the
// rate-limited ones with exponential backoff.
const queryGBIFYearFacetWithRetry = async (country, options, retries = 4) => {
  for (let attempt = 0; ; attempt++) {
    const res = await queryGBIFYearFacetOld(country, options);
    if (res.error?.response?.status === 429 && attempt < retries) {
      await sleep(500 * 2 ** attempt);
      continue;
    }
    return res;
  }
};

export const fetchRecordsPerCountryPerYear = async ({
  yearMin = 1960,
  yearMax = 2019,
  taxonFilter = "",
  onlyDomestic = false,
} = {}) => {
  // Construct the GBIF occurrences API url with facets for country counts
  let result = [];

  // Limit concurrency (and retry 429s) so the bulk download isn't rejected by
  // the GBIF API rate limiter.
  const responses = await mapWithConcurrency(countriesFiltered, 6, (country) =>
    queryGBIFYearFacetWithRetry(countryCodes.alpha3ToAlpha2(country), {
      taxonFilter,
      onlyDomestic,
    }),
  );
  responses.forEach((res, i) => {
    if (res.error) {
      return { error: res.error };
    }
    const country = countriesFiltered[i];
    res.response.data.facets[0].counts.forEach((d) => {
      const year = +d.name;
      if (year >= yearMin && year <= yearMax) {
        result.push({ country, year, records: d.count });
      }
    });
  });
  result = sortyBy(result, ["country", "year"]);
  return result;
};

export const queryAutocompletesGBIF = async (q) => {
  // Construct the GBIF Autocompletes url with query text
  const url = `${baseURL}${autoc}`;
  const params = {
    q,
    // Restrict to results from the GBIF taxonomic backbone only (i.e. not from other providers)
    datasetKey: "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",
    // TODO: One more filter option for this API is by rank, maybe good idea to query for only the higher ranks and Promise all together
  };

  // GET request to the GBIF-API
  return axios
    .get(url, { params })
    .then((response) => {
      return { response };
    })
    .catch((error) => {
      console.log(
        "Error in fetching autocomplete suggestions from GBIF suggest API",
        error,
      );
      return { error };
    });
};
