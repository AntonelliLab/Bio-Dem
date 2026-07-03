---
"v-dem-biodiversity-app": patch
---

Replace the `axios` dependency with the native `fetch` API in the GBIF client and modernise it to async/await with try/catch (no more promise chaining). Request building, 429 retry/backoff, and error handling are consolidated into a single `gbifJson` helper. No behaviour change; removes one runtime dependency.
