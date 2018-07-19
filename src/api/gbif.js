import axios from "axios";

const baseURL = "http://api.gbif.org/v1/";
const occ = "occurrence/search";

export const queryGBIF = async (country) => {
  // Construct the GBIF occurrences API url with facets for year counts
  // Query for results that have images associated only
  const url = `${baseURL}${occ}`;
  const params = {
    country: country || 'SE',
    limit: 1,
    facet: 'year',
    'year.facetLimit': 150
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
