async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`Failed to load ${path}`);
  return await r.json();
}

async function loadText(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`Failed to load ${path}`);
  return await r.text();
}

function stripOuterQuotes(s) {
  const t = String(s ?? "").trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  return t;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headerLine = lines[0];

  const delim = headerLine.includes("\t") ? "\t" : ",";

  const headers = headerLine.split(delim).map(h => stripOuterQuotes(h.trim()));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim).map(c => stripOuterQuotes(c.trim()));
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cols[j] ?? "";
    }
    rows.push(row);
  }

  return { headers, rows, delim };
}


function getField(row, candidates) {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c];
  }
  const keys = Object.keys(row);
  for (const c of candidates) {
    const k = keys.find(x => x.trim().toLowerCase() === c.trim().toLowerCase());
    if (k) return row[k];
  }
  return undefined;
}

function normName(s) {
  return String(s || "").trim().toUpperCase();
}

function partyColor(partyType) {
  switch (normName(partyType).toLowerCase()) {
    case "multi-party": return "#2ca02c";
    case "two-party": return "#1f77b4";
    case "dominant-party": return "#ff7f0e";
    case "one-party": return "#d62728";
    case "non-partisan": return "#9467bd";
    default: return "#cccccc";
  }
}

function turnoutToStripeWeight(turnoutPct) {
  if (turnoutPct == null || Number.isNaN(turnoutPct)) return 1;
  if (turnoutPct < 40) return 1;
  if (turnoutPct < 60) return 2;
  if (turnoutPct < 80) return 3;
  return 4;
}

function turnoutToOpacity(turnoutPct) {
  if (turnoutPct == null || Number.isNaN(turnoutPct)) return 0.15;
  if (turnoutPct < 40) return 0.25;
  if (turnoutPct < 60) return 0.35;
  if (turnoutPct < 80) return 0.45;
  return 0.6;
}

// A few common name tweaks for world-atlas naming
function harmonizeCountryName(nameUpper) {
  const map = {
    "UNITED STATES OF AMERICA": "UNITED STATES",
    "RUSSIAN FEDERATION": "RUSSIA",
    "IRAN (ISLAMIC REPUBLIC OF)": "IRAN",
    "VENEZUELA (BOLIVARIAN REPUBLIC OF)": "VENEZUELA",
    "SYRIAN ARAB REPUBLIC": "SYRIA",
    "BOLIVIA (PLURINATIONAL STATE OF)": "BOLIVIA",
    "TANZANIA, UNITED REPUBLIC OF": "TANZANIA",
    "VIET NAM": "VIETNAM",
    "LAO PEOPLE'S DEMOCRATIC REPUBLIC": "LAOS",
    "KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF": "NORTH KOREA",
    "KOREA, REPUBLIC OF": "SOUTH KOREA",
    "BRUNEI DARUSSALAM": "BRUNEI",
    "CZECHIA": "CZECH REPUBLIC",
    "CÔTE D’IVOIRE": "COTE D'IVOIRE",
    "CÔTE D'IVOIRE": "COTE D'IVOIRE",
    "BOSNIA AND HERZEGOVINA": "BOSNIA & HERZEGOVINA"
  };
  return map[nameUpper] || nameUpper;
}

function makeLegend(map) {
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    div.innerHTML = `
      <div class="legend-title">Party system (color)</div>
      <div class="legend-row"><span class="swatch" style="background:${partyColor("multi-party")}"></span> Multi-party</div>
      <div class="legend-row"><span class="swatch" style="background:${partyColor("two-party")}"></span> Two-party</div>
      <div class="legend-row"><span class="swatch" style="background:${partyColor("dominant-party")}"></span> Dominant-party</div>
      <div class="legend-row"><span class="swatch" style="background:${partyColor("one-party")}"></span> One-party</div>
      <div class="legend-row"><span class="swatch" style="background:${partyColor("non-partisan")}"></span> Non-partisan</div>
      <div class="small">Fill opacity approximates turnout (registered voters, parliamentary).</div>
    `;
    return div;
  };
  legend.addTo(map);
}

async function main() {
  const map = L.map("map", {
    worldCopyJump: false, preferCanvas: false, renderer: L.svg(), zoomControl: false   // disable default position
  }).setView([20, 0], 2);

  // add zoom control manually where you want
  L.control.zoom({
    position: "topright"
  }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 6,
    attribution: "&copy; OpenStreetMap contributors",
    noWrap: true
  }).addTo(map);

  const bounds = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));
  map.setMaxBounds(bounds);
  map.on("drag", () => map.panInsideBounds(bounds, { animate: false }));
  map.setMinZoom(1);

  const partySystem = await loadJSON("data/party_system.json");
  const turnoutCSV = await loadText("data/voter-turnout-by-country-2026.csv");
  const parsed = parseCSV(turnoutCSV);
  console.log("Turnout delimiter:", JSON.stringify(parsed.delim));
  console.log("Turnout headers:", parsed.headers);
  console.log("First row keys:", Object.keys(parsed.rows[0] || {}));
  const turnoutRows = parsed.rows;


  const turnoutByCountry = new Map();
  const yearByCountry = new Map();

  for (const r of turnoutRows) {
    const countryRaw = getField(r, ["country", "Country", "COUNTRY"]);
    if (!countryRaw) continue;

    const pctRaw = getField(r, [
      "VoterTurnout_ParliamentaryVotingTurnoutPct",
      "VoterTurnout_ParliamentaryVotingTurnoutPct ",
      "turnout",
      "Turnout"
    ]);
    const yearRaw = getField(r, [
      "VoterTurnout_ParliamentaryTurnoutDataYear",
      "year",
      "Year"
    ]);

    const c = harmonizeCountryName(normName(countryRaw));
    if (!c) continue;

    const pct = Number(pctRaw);
    const yr = Number(yearRaw);

    turnoutByCountry.set(c, Number.isFinite(pct) ? pct : null);
    yearByCountry.set(c, Number.isFinite(yr) ? yr : null);
  }

  const countriesGeo = await loadJSON("data/countries.geojson");
  const countries = countriesGeo.features;

  // normalize name field to ADMIN
  for (const f of countries) {
    f.properties = f.properties || {};
    const nm =
      f.properties.ADMIN ||
      f.properties.NAME ||
      f.properties.name ||
      f.properties.SOVEREIGNT ||
      "UNKNOWN";
    f.properties.ADMIN = normName(nm);
  }


  function turnoutToFillOpacity(turnoutPct) {
    if (turnoutPct == null || Number.isNaN(turnoutPct)) return 0.15;
    const t = Math.max(0, Math.min(100, turnoutPct));
    return 0.15 + (t / 100) * 0.65; // 0.15 to 0.80
  }

  function styleFeature(feature) {
    const rawName = normName(feature.properties.ADMIN);
    const name = harmonizeCountryName(rawName);

    const turnoutPct = turnoutByCountry.get(name);
    const partyType = partySystem[name] || partySystem[rawName] || "unknown";

    return {
      color: "#222",
      weight: 1.0,
      fillOpacity: turnoutToFillOpacity(turnoutPct),
      fillColor: partyColor(partyType)
    };
  }

  function onEachFeature(feature, layer) {
    const rawName = normName(feature.properties.ADMIN);
    const name = harmonizeCountryName(rawName);

    const turnoutPct = turnoutByCountry.get(name);
    const partyType = partySystem[name] || partySystem[rawName] || "unknown";
    const yr = yearByCountry.get(name);

    const turnoutLabel = (turnoutPct == null) ? "N/A" : `${turnoutPct.toFixed(1)}%`;
    const yearLabel = (yr == null) ? "N/A" : String(yr);

    layer.bindPopup(
      `<b>${name}</b><br/>Party system: ${partyType}<br/>Turnout: ${turnoutLabel}<br/>Year: ${yearLabel}`
    );

  }

  const geo = L.geoJSON(countries, { style: styleFeature, onEachFeature }).addTo(map);
  makeLegend(map);

  // Controls
  const btn = document.getElementById("btn-refit");
  btn.addEventListener("click", () => {
    map.setView([20, 0], 2);
  });

  // Quick diagnostics
  const matched = { turnout: 0, party: 0, total: countries.length };
  for (const f of countries) {
    const rawName = normName(f.properties.ADMIN);
    const name = harmonizeCountryName(rawName);
    if (turnoutByCountry.has(name)) matched.turnout += 1;
    if (partySystem[name] || partySystem[rawName]) matched.party += 1;
  }
  document.getElementById("badge-turnout").textContent = `Turnout matched: ${matched.turnout}/${matched.total}`;
  document.getElementById("badge-party").textContent = `Party matched: ${matched.party}/${matched.total}`;
}

main().catch(err => {
  console.error(err);
  alert(err.message);
});