---
"v-dem-biodiversity-app": patch
---

Fix the dual chart failing with "Querying the GBIF API for year facet data failed" when GBIF rate-limits a request (HTTP 429). The live GBIF facet queries (dual chart record bars and the world-map publisher-origin view) now retry rate-limited requests with jittered exponential backoff, matching the offline bulk download — previously they had no retry, so a transient or burst 429 surfaced immediately as an error.
