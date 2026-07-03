import countryCodes from "../helpers/countryCodes";
import { countries } from "./data";
import sortBy from "lodash/sortBy";

const countriesFiltered = countries.filter((alpha3) =>
  countryCodes.alpha3ToAlpha2(alpha3),
);

const baseURL = "https://api.gbif.org/v1/";
const occ = "occurrence/search";
const autoc = "species/suggest";

// Default upper bound for year ranges: the current year, so queries aren't
// silently capped at a hard-coded past year as the app data is extended.
const CURRENT_YEAR = new Date().getFullYear();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch JSON from the GBIF API. Params with an empty/undefined value are
// dropped. GBIF returns HTTP 429 when too many requests arrive at once (the live
// charts fire several facet queries in parallel, and the bulk download hits
// ~175 countries), so retry rate-limited requests with jittered exponential
// backoff. Throws on a non-OK response so callers can handle it in one place.
const gbifJson = async (path, params = {}, { retries = 4 } = {}) => {
  const url = new URL(path, baseURL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url);
    if (response.status === 429 && attempt < retries) {
      await sleep(Math.min(500 * 2 ** attempt, 4000) + Math.random() * 500);
      continue;
    }
    if (!response.ok) {
      throw new Error(`GBIF API request failed (${response.status}): ${url}`);
    }
    return response.json();
  }
};

export const queryGBIFYearFacetOld = async (
  country,
  { onlyDomestic = false, onlyWithImage = false, taxonFilter = "", retries = 4 } = {},
) => {
  try {
    const response = await gbifJson(
      occ,
      {
        country: country || "SE",
        limit: 0,
        facet: "year",
        "year.facetLimit": 200,
        publishingCountry: onlyDomestic ? country : undefined,
        taxonKey: taxonFilter || undefined,
        mediaType: onlyWithImage ? "StillImage" : undefined,
      },
      { retries },
    );
    return { response };
  } catch (error) {
    console.log("Error in fetching results from the GBIF API", error.message);
    return { error };
  }
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
  const data = await gbifJson(occ, {
    country,
    limit: 0,
    facet: "year",
    // Bound the result set to the range of interest server-side, and allow
    // enough facet buckets to cover every distinct year in that range.
    year: `${yearMin},${yearMax}`,
    "year.facetLimit": Math.max(200, yearMax - yearMin + 1),
    taxonKey: taxonFilter || undefined,
    mediaType: onlyWithImage ? "StillImage" : undefined,
    ...extraParams,
  });
  const counts = new Map();
  const yearFacet =
    data.facets?.find((f) => f.field === "YEAR") ?? data.facets?.[0];
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
    yearMax = CURRENT_YEAR,
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
// Used to colour the world map in "publisher origin" mode. Returns the parsed
// response; response.count is the grand total for computing shares.
export const queryPublisherOrigin = async (
  country,
  {
    yearMin = 1960,
    yearMax = CURRENT_YEAR,
    taxonFilter = "",
    onlyWithImage = false,
    onlyDomestic = false,
    onlyPreservedSpecimen = false,
  } = {},
) => {
  try {
    const response = await gbifJson(occ, {
      country,
      limit: 0,
      facet: "publishingCountry",
      "publishingCountry.facetLimit": 400,
      year: `${yearMin},${yearMax}`,
      taxonKey: taxonFilter || undefined,
      mediaType: onlyWithImage ? "StillImage" : undefined,
      publishingCountry: onlyDomestic ? country : undefined,
      basisOfRecord: onlyPreservedSpecimen ? "PRESERVED_SPECIMEN" : undefined,
    });
    return { response };
  } catch (error) {
    console.log("Error in fetching results from the GBIF API", error.message);
    return { error };
  }
};

export const queryGBIFCountryFacet = async (
  yearMin = 1960,
  yearMax = CURRENT_YEAR,
) => {
  try {
    const response = await gbifJson(occ, {
      year: yearMin === yearMax ? `${yearMin}` : `${yearMin},${yearMax}`,
      limit: 0,
      facet: "country",
      "country.facetLimit": 200,
    });
    return { response };
  } catch (error) {
    console.log("Error in fetching results from the GBIF API", error.message);
    return { error };
  }
};

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

export const fetchRecordsPerCountryPerYear = async ({
  yearMin = 1960,
  yearMax = CURRENT_YEAR,
  taxonFilter = "",
  onlyDomestic = false,
} = {}) => {
  // Limit concurrency (gbifJson retries 429s) so the bulk download isn't
  // rejected by the GBIF API rate limiter. Concurrency of 3 keeps well under the
  // limit; a full ~175-country run then completes without dropping countries.
  const responses = await mapWithConcurrency(countriesFiltered, 3, (country) =>
    queryGBIFYearFacetOld(countryCodes.alpha3ToAlpha2(country), {
      taxonFilter,
      onlyDomestic,
      retries: 7,
    }),
  );
  const result = [];
  responses.forEach((res, i) => {
    if (res.error) {
      return;
    }
    const country = countriesFiltered[i];
    res.response.facets?.[0]?.counts.forEach((d) => {
      const year = +d.name;
      if (year >= yearMin && year <= yearMax) {
        result.push({ country, year, records: d.count });
      }
    });
  });
  return sortBy(result, ["country", "year"]);
};

export const queryAutocompletesGBIF = async (q) => {
  try {
    const response = await gbifJson(autoc, {
      q,
      // Restrict to results from the GBIF taxonomic backbone only (i.e. not from
      // other providers).
      datasetKey: "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",
    });
    return { response };
  } catch (error) {
    console.log(
      "Error in fetching autocomplete suggestions from GBIF suggest API",
      error,
    );
    return { error };
  }
};
