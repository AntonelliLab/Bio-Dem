// Run with tsx (resolves the TypeScript app imports in ./bin and ../src):
//   pnpm exec tsx downloadGbifData.js [taxonFilters...] [--add-domestic]
import run from "./bin/downloadGbifData.js";

run(process.argv.slice(2));
