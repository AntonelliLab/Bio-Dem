import axios from "axios";
import countryCodes from "../helpers/countryCodes";
import { countries } from "./data";
import sortyBy from "lodash/sortBy";
import { range } from "d3";

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

const queryFacetByCountryAndYear = async (
  country,
  year,
  {
    onlyWithImage = false,
    taxonFilter = "",
    onlyPreservedSpecimen = false,
    onlyDomestic = false,
  } = {},
) => {
  let url = `${baseURL}${occ}?`;
  url += [
    `country=${encodeURIComponent(country)}`,
    `year=${encodeURIComponent(year)}`,
    `limit=0`,
    `facet=publishingCountry`,
    `facet=basisOfRecord`,
  ].join("&");
  if (taxonFilter) {
    url += `&taxonKey=${encodeURIComponent(taxonFilter)}`;
  }
  if (onlyWithImage) {
    url += `&mediaType=StillImage`;
  }
  if (onlyPreservedSpecimen) {
    url += `&basisOfRecord=PRESERVED_SPECIMEN`;
  }
  if (onlyDomestic) {
    url += `&publishingCountry=${country}`;
  }

  return fetch(url).then((response) => response.json());
};

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
  // Construct the GBIF occurrences API url with facets for year counts
  const years = range(yearMin, yearMax + 1);
  const queries = years.map((year) =>
    queryFacetByCountryAndYear(country, year, {
      onlyWithImage,
      taxonFilter,
      onlyPreservedSpecimen,
      onlyDomestic,
    }),
  );
  try {
    const result = await Promise.all(queries);
    const data = result.map(({ count, facets }, i) => {
      const countPreserved =
        facets
          .find((d) => d.field === "BASIS_OF_RECORD")
          .counts.find((d) => d.name === "PRESERVED_SPECIMEN")?.count || 0;

      const countDomestic = facets
        .find((d) => d.field === "PUBLISHING_COUNTRY")
        .counts.find((d) => d.name === country);

      const data = {
        year: years[i],
        count,
        countPreserved,
        countNotPreserved: count - countPreserved,
        facets,
        countDomestic: countDomestic ? countDomestic.count : 0,
      };
      if (otherCountry) {
        const countOther = facets
          .find((d) => d.field === "PUBLISHING_COUNTRY")
          .counts.find((d) => d.name === otherCountry);
        data.countOther = countOther ? countOther.count : 0;
      }
      data.countRest = data.count - data.countDomestic - (data.countOther || 0);
      return data;
    });
    return { data };
  } catch (error) {
    console.log("Error in fetching results from the GBIF API", error.message);
    return { error };
  }
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
