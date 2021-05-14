import axios from "axios";
import countryCodes from "../helpers/countryCodes";
import { countries } from "./data";
import sortyBy from "lodash/sortBy";

const countriesFiltered = countries.filter((alpha3) =>
  countryCodes.alpha3ToAlpha2(alpha3),
);

const baseURL = "https://api.gbif.org/v1/";
const occ = "occurrence/search";
const autoc = "species/suggest";

export const queryGBIFYearFacet = async (
  country,
  { onlyDomestic = false, onlyWithImage = false, taxonFilter = "" },
) => {
  // Construct the GBIF occurrences API url with facets for year counts
  const url = `${baseURL}${occ}`;
  const params = {
    country: country || "SE",
    limit: 1,
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

export const queryGBIFCountryFacet = async (yearMin = 1960, yearMax = 2019) => {
  // Construct the GBIF occurrences API url with facets for country counts
  const url = `${baseURL}${occ}`;
  const params = {
    year: yearMin === yearMax ? `${yearMin}` : `${yearMin},${yearMax}`,
    limit: 1,
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

export const fetchRecordsPerCountryPerYear = async ({
  yearMin = 1960,
  yearMax = 2019,
  taxonFilter = "",
  onlyDomestic = false,
} = {}) => {
  // Construct the GBIF occurrences API url with facets for country counts
  let result = [];

  const responses = await Promise.all(
    countriesFiltered.map((country) =>
      queryGBIFYearFacet(countryCodes.alpha3ToAlpha2(country), {
        taxonFilter,
        onlyDomestic,
      }),
    ),
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
