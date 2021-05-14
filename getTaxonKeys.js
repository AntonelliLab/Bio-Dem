require("@babel/register");
const getTaxonKeys = require("./bin/getTaxonKeys").default;

const [, , taxonKey] = process.argv;

getTaxonKeys(taxonKey);
