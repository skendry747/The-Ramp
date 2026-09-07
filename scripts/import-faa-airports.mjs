import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_HEADERS = [
  "EFF_DATE",
  "SITE_NO",
  "SITE_TYPE_CODE",
  "STATE_CODE",
  "ARPT_ID",
  "CITY",
  "COUNTRY_CODE",
  "ARPT_NAME",
  "OWNERSHIP_TYPE_CODE",
  "FACILITY_USE_CODE",
  "LAT_DECIMAL",
  "LONG_DECIMAL",
  "ARPT_STATUS",
  "TWR_TYPE_CODE",
  "ICAO_ID",
];

const args = parseArgs(process.argv.slice(2));
if (!args.file) fail("Pass the FAA APT_BASE.csv path with --file.");

await loadEnvFile(resolve(process.cwd(), ".env.local"));
await loadEnvFile(resolve(process.cwd(), args.envFile ?? ".env.faa-import.local"));

const csvPath = resolve(process.cwd(), args.file);
const csvText = await readFile(csvPath, "utf8");
const [headers, ...values] = parseCsv(csvText);

if (!headers) fail("APT_BASE.csv is empty.");
const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
if (missingHeaders.length) fail(`APT_BASE.csv is missing required columns: ${missingHeaders.join(", ")}`);

const indexes = new Map(headers.map((header, index) => [header, index]));
const sourceRows = values.filter((row) => row.some((value) => value.trim()));
const rows = sourceRows.map((row, index) => mapRow(row, indexes, index + 2));
const effectiveDates = new Set(rows.map((row) => row.source_effective_date));
if (effectiveDates.size !== 1) fail(`Expected one FAA effective date, found: ${[...effectiveDates].join(", ")}`);

const effectiveDate = [...effectiveDates][0];
if (args.effectiveDate && args.effectiveDate !== effectiveDate) {
  fail(`--effective-date ${args.effectiveDate} does not match APT_BASE.csv (${effectiveDate}).`);
}

const usRows = rows.filter((row) => row.country_code === "US");
validateUnique(usRows, (row) => `${row.faa_site_no}|${row.facility_type_code}`, "FAA SITE_NO + facility type");
validateUnique(usRows, (row) => row.faa_lid, "FAA LID");
validateUnique(usRows.filter((row) => row.icao_id), (row) => row.icao_id, "ICAO identifier");
validateUnique(usRows, (row) => row.identifier, "preferred identifier");

const stats = summarize(sourceRows.length, usRows, effectiveDate);
printSummary(stats, args.dryRun ? "Validated (dry run)" : "Validated");
if (args.dryRun) process.exit(0);

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  fail("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.faa-import.local before importing.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
});

const existing = await getAllAirports(supabase);
const newerCycle = existing
  .map((airport) => airport.source_effective_date)
  .filter(Boolean)
  .sort()
  .at(-1);
if (newerCycle && newerCycle > effectiveDate) {
  fail(`Database already contains newer FAA cycle ${newerCycle}; refusing to import ${effectiveDate}.`);
}

const matches = buildExistingIndexes(existing);
const claimedIds = new Set();
const updates = [];
const inserts = [];

for (const row of usRows) {
  const existingAirport = findExisting(row, matches, claimedIds);
  if (existingAirport) {
    claimedIds.add(existingAirport.id);
    updates.push({ id: existingAirport.id, ...row });
  } else {
    inserts.push(row);
  }
}

await upsertBatches(supabase, updates, "id", "Updating matched facilities");
await upsertBatches(supabase, inserts, "faa_site_no,facility_type_code", "Inserting new facilities");

const { data: markedInactive, error: finishError } = await supabase.rpc("finish_faa_airport_import", {
  p_effective_date: effectiveDate,
});
if (finishError) fail(`Could not finalize FAA import: ${finishError.message}`);

const { count, error: countError } = await supabase
  .from("airports")
  .select("id", { count: "exact", head: true })
  .eq("source_effective_date", effectiveDate);
if (countError) fail(`Could not verify FAA import count: ${countError.message}`);
if (count !== usRows.length) {
  fail(`Verification failed: expected ${usRows.length} current-cycle rows, found ${count ?? "unknown"}.`);
}

console.log("\nFAA airport import complete.");
console.log(`Matched existing UUIDs: ${updates.length}`);
console.log(`Inserted new UUIDs: ${inserts.length}`);
console.log(`Marked inactive because absent from this cycle: ${markedInactive ?? 0}`);
console.log(`Verified current-cycle rows in Supabase: ${count}`);

function parseArgs(input) {
  const parsed = { dryRun: false };
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--dry-run") parsed.dryRun = true;
    else if (token === "--file") parsed.file = input[++index];
    else if (token === "--effective-date") parsed.effectiveDate = input[++index];
    else if (token === "--env-file") parsed.envFile = input[++index];
    else fail(`Unknown argument: ${token}`);
  }
  return parsed;
}

async function loadEnvFile(path) {
  let contents;
  try {
    contents = await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.endsWith("\r") ? value.slice(0, -1) : value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) fail("APT_BASE.csv ends inside a quoted value.");
  if (value.length || row.length) {
    row.push(value.endsWith("\r") ? value.slice(0, -1) : value);
    rows.push(row);
  }
  if (rows[0]?.[0]?.charCodeAt(0) === 0xfeff) rows[0][0] = rows[0][0].slice(1);
  return rows;
}

function mapRow(row, indexes, lineNumber) {
  const field = (name) => (row[indexes.get(name)] ?? "").trim();
  const faaSiteNo = field("SITE_NO");
  const facilityTypeCode = field("SITE_TYPE_CODE").toUpperCase();
  const faaLid = field("ARPT_ID").toUpperCase();
  const icaoId = field("ICAO_ID").toUpperCase() || null;
  const name = field("ARPT_NAME");
  if (!faaSiteNo || !facilityTypeCode || !faaLid || !name) {
    fail(`Required FAA identity field is blank on CSV line ${lineNumber}.`);
  }

  return {
    identifier: icaoId ?? faaLid,
    identifier_type: icaoId ? "ICAO" : "FAA",
    faa_site_no: faaSiteNo,
    faa_lid: faaLid,
    icao_id: icaoId,
    name,
    city: field("CITY") || null,
    state: field("STATE_CODE").toUpperCase() || null,
    country_code: field("COUNTRY_CODE").toUpperCase() || null,
    facility_type_code: facilityTypeCode,
    facility_use_code: field("FACILITY_USE_CODE").toUpperCase() || null,
    ownership_type_code: field("OWNERSHIP_TYPE_CODE").toUpperCase() || null,
    operational_status_code: field("ARPT_STATUS").toUpperCase() || null,
    latitude: numberOrNull(field("LAT_DECIMAL"), "LAT_DECIMAL", lineNumber),
    longitude: numberOrNull(field("LONG_DECIMAL"), "LONG_DECIMAL", lineNumber),
    tower_type_code: field("TWR_TYPE_CODE").toUpperCase() || null,
    source_effective_date: normalizeDate(field("EFF_DATE"), lineNumber),
    is_active: field("ARPT_STATUS").toUpperCase() === "O",
  };
}

function normalizeDate(value, lineNumber) {
  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!match) fail(`Invalid EFF_DATE on CSV line ${lineNumber}: ${value}`);
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function numberOrNull(value, field, lineNumber) {
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) fail(`Invalid ${field} on CSV line ${lineNumber}: ${value}`);
  return number;
}

function validateUnique(rows, keyFor, label) {
  const seen = new Map();
  for (const row of rows) {
    const key = keyFor(row);
    if (!key) continue;
    if (seen.has(key)) fail(`Duplicate ${label} ${key} for ${seen.get(key)} and ${row.faa_lid}.`);
    seen.set(key, row.faa_lid);
  }
}

function summarize(sourceCount, rows, effectiveDate) {
  const byType = Object.fromEntries([...new Set(rows.map((row) => row.facility_type_code))].sort().map((type) => [
    type,
    rows.filter((row) => row.facility_type_code === type).length,
  ]));
  return {
    effectiveDate,
    sourceCount,
    usCount: rows.length,
    operational: rows.filter((row) => row.is_active).length,
    inactive: rows.filter((row) => !row.is_active).length,
    publicUse: rows.filter((row) => row.facility_use_code === "PU").length,
    privateUse: rows.filter((row) => row.facility_use_code === "PR").length,
    withoutIcao: rows.filter((row) => !row.icao_id).length,
    operationalPublicUse: rows.filter((row) => row.is_active && row.facility_use_code === "PU").length,
    operationalPrivateUse: rows.filter((row) => row.is_active && row.facility_use_code === "PR").length,
    operationalWithoutIcao: rows.filter((row) => row.is_active && !row.icao_id).length,
    byType,
  };
}

function printSummary(stats, heading) {
  console.log(`${heading}: FAA APT_BASE.csv`);
  console.log(`Effective date: ${stats.effectiveDate}`);
  console.log(`All source rows: ${stats.sourceCount}`);
  console.log(`U.S. rows selected: ${stats.usCount}`);
  console.log(`Operational: ${stats.operational}`);
  console.log(`Closed/inactive retained: ${stats.inactive}`);
  console.log(`Public use: ${stats.publicUse}`);
  console.log(`Private use: ${stats.privateUse}`);
  console.log(`Without ICAO: ${stats.withoutIcao}`);
  console.log(`Operational public/private: ${stats.operationalPublicUse}/${stats.operationalPrivateUse}`);
  console.log(`Operational without ICAO: ${stats.operationalWithoutIcao}`);
  console.log(`Facility types: ${Object.entries(stats.byType).map(([type, count]) => `${type}=${count}`).join(", ")}`);
}

async function getAllAirports(supabase) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("airports")
      .select("id,identifier,faa_site_no,faa_lid,icao_id,name,city,state,facility_type_code,source_effective_date")
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) fail(`Could not read existing airports. Apply the FAA migration first. ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function buildExistingIndexes(existing) {
  const bySiteType = new Map();
  const byIcao = new Map();
  const byLid = new Map();
  const byIdentifier = new Map();
  const byNameLocation = new Map();

  for (const airport of existing) {
    if (airport.faa_site_no && airport.facility_type_code) {
      bySiteType.set(`${airport.faa_site_no}|${airport.facility_type_code}`, airport);
    }
    if (airport.icao_id) byIcao.set(airport.icao_id.toUpperCase(), airport);
    if (airport.faa_lid) byLid.set(airport.faa_lid.toUpperCase(), airport);
    if (airport.identifier) byIdentifier.set(airport.identifier.toUpperCase(), airport);

    const locationKey = nameLocationKey(airport);
    if (locationKey) {
      const candidates = byNameLocation.get(locationKey) ?? [];
      candidates.push(airport);
      byNameLocation.set(locationKey, candidates);
    }
  }

  return { bySiteType, byIcao, byLid, byIdentifier, byNameLocation };
}

function findExisting(row, indexes, claimedIds) {
  const candidates = [
    indexes.bySiteType.get(`${row.faa_site_no}|${row.facility_type_code}`),
    row.icao_id ? indexes.byIcao.get(row.icao_id) : null,
    indexes.byLid.get(row.faa_lid),
    row.icao_id ? indexes.byIdentifier.get(row.icao_id) : null,
    indexes.byIdentifier.get(row.faa_lid),
  ];

  for (const candidate of candidates) {
    if (candidate && !claimedIds.has(candidate.id)) return candidate;
  }

  const locationMatches = indexes.byNameLocation.get(nameLocationKey(row)) ?? [];
  const unclaimed = locationMatches.filter((candidate) => !claimedIds.has(candidate.id));
  return unclaimed.length === 1 ? unclaimed[0] : null;
}

function nameLocationKey(airport) {
  if (!airport.name || !airport.city || !airport.state) return null;
  return [normalizeName(airport.name), normalizeText(airport.city), normalizeText(airport.state)].join("|");
}

function normalizeName(value) {
  return normalizeText(value)
    .replace(/\bINTERNATIONAL\b/g, "INTL")
    .replace(/\bREGIONAL\b/g, "RGNL")
    .replace(/\bMUNICIPAL\b/g, "MUNI")
    .replace(/\bMEMORIAL\b/g, "MEML")
    .replace(/\bAIRPORT\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

async function upsertBatches(supabase, rows, onConflict, label) {
  const batchSize = 250;
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const { error } = await supabase.from("airports").upsert(batch, { onConflict });
    if (error) fail(`${label} failed at row ${start + 1}: ${error.message}`);
    const complete = Math.min(start + batch.length, rows.length);
    process.stdout.write(`\r${label}: ${complete}/${rows.length}`);
  }
  if (rows.length) process.stdout.write("\n");
}

function fail(message) {
  console.error(`FAA import error: ${message}`);
  process.exit(1);
}
