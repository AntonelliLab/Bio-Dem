// Regenerate public/data/gbif_participating_countries.csv from the GBIF API.
//
// Run with tsx (resolves the app's countryCodes helper):
//   pnpm exec tsx bin/downloadGbifParticipation.js
//
// GBIF exposes each participant's current participation status via /v1/node, but
// NOT the year they joined. We therefore refresh the status/membership list from
// the API and PRESERVE the `member_since` years already in the CSV (curated from
// the GBIF website). New participants are written with an empty year and logged
// so it can be filled in by hand.

import fs from "fs";
import path from "path";
import countryCodes from "../src/helpers/countryCodes";

const OUT = path.resolve("public/data/gbif_participating_countries.csv");
const API = "https://api.gbif.org/v1/node?limit=1000";

// GBIF participationStatus -> label used by the app.
const STATUS_LABEL = {
  VOTING: "Voting participant",
  ASSOCIATE: "Associate country participant",
};

// Read existing member_since (last column) keyed by iso3 (first column). Robust
// to commas inside the quoted `name` column because member_since is always last.
function readExistingYears(file) {
  const years = {};
  if (!fs.existsSync(file)) return years;
  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  for (const line of lines.slice(1)) {
    const parts = line.split(",");
    const iso3 = parts[0];
    const since = parts[parts.length - 1].trim();
    if (iso3 && since) years[iso3] = since;
  }
  return years;
}

// Quote a CSV field if it contains a comma or quote.
const csvField = (v) =>
  /[",]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v);

async function main() {
  const existingYears = readExistingYears(OUT);

  const res = await fetch(API);
  if (!res.ok) throw new Error(`GBIF /node failed: ${res.status}`);
  const { results } = await res.json();

  const rows = [];
  const missingYear = [];
  for (const node of results) {
    if (node.type !== "COUNTRY") continue;
    const label = STATUS_LABEL[node.participationStatus];
    if (!label || !node.country) continue;
    const iso2 = node.country;
    const iso3 = countryCodes.alpha2ToAlpha3(iso2);
    if (!iso3) continue;
    const since = existingYears[iso3] ?? "";
    if (!since) missingYear.push(iso3);
    rows.push({
      iso3,
      iso2,
      name: countryCodes.getName(iso3) ?? node.title.replace(/^GBIF /, ""),
      status: label,
      member_since: since,
    });
  }

  rows.sort((a, b) => a.iso3.localeCompare(b.iso3));

  const header = "iso3,iso2,name,status,member_since";
  const body = rows
    .map((r) =>
      [r.iso3, r.iso2, r.name, r.status, r.member_since].map(csvField).join(","),
    )
    .join("\n");
  fs.writeFileSync(OUT, `${header}\n${body}\n`);

  console.log(`Wrote ${rows.length} participants to ${OUT}`);
  if (missingYear.length) {
    console.warn(
      `No member_since year (fill in manually) for: ${missingYear.join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
