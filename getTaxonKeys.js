// Run with tsx (resolves the TypeScript app imports in ./bin and ../src):
//   pnpm exec tsx getTaxonKeys.js <query>
import getTaxonKeys from "./bin/getTaxonKeys.js";

// Ignore a literal "--" separator (e.g. `pnpm run get-taxon-keys -- Reptilia`).
const [taxonKey] = process.argv.slice(2).filter((arg) => arg !== "--");

getTaxonKeys(taxonKey);
