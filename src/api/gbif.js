import axios from "axios";

const baseURL = "http://api.gbif.org/v1/";
const occ = "occurrence/search";

export const queryGBIFYearFacet = async (country, onlyDomestic) => {
  // Construct the GBIF occurrences API url with facets for year counts
  // TODO: Query for results that have images associated only
  const url = `${baseURL}${occ}`;
  const params = {
    country: country || 'SE',
    limit: 1,
    facet: 'year',
    'year.facetLimit': 80
  }
  if (onlyDomestic) {
    params.publishingCountry = country;
  }

  // GET request to the GBIF-API
  return axios
    .get(url, { params })
    .then(response => {
      return { response };
    })
    .catch(error => {
      console.log(
        "Error in fetching results from the GBIF API",
        error
      );
      return { error };
    });
};

export const queryGBIFCountryFacet = async (year) => {
  // Construct the GBIF occurrences API url with facets for country counts
  const url = `${baseURL}${occ}`;
  const params = {
    year: year ? `${year},2018` : '1960,2018',
    limit: 1,
    facet: 'country',
    'country.facetLimit': 200
  }

  // GET request to the GBIF-API
  return axios
    .get(url, { params })
    .then(response => {
      return { response };
    })
    .catch(error => {
      console.log(
        "Error in fetching results from the GBIF API",
        error
      );
      return { error };
    });
};
