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
        for (let j = 0; j < headers.length; j++) row[headers[j]] = cols[j] ?? "";
        rows.push(row);
    }
    return rows;
}

function normName(s) {
    return String(s || "").trim().toUpperCase();
}

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
        "CÔTE D’IVOIRE": "COTE D'IVOIRE"
    };
    return map[nameUpper] || nameUpper;
}

function partyOrder(p) {
    const x = (p || "").toLowerCase();
    const order = ["two-party", "multi-party", "dominant-party", "one-party", "non-partisan", "unknown"];
    const i = order.indexOf(x);
    return i === -1 ? 999 : i;
}

async function main() {
    const partySystem = await loadJSON("data/party_system.json");
    const turnoutCSV = await loadText("data/voter-turnout-by-country-2026.csv");
    const rows = parseCSV(turnoutCSV);

    // group turnout by party type
    const groups = new Map(); // type -> array of turnout
    let matched = 0;

    for (const r of rows) {
        const country = harmonizeCountryName(normName(r.country));
        const pct = Number(r.VoterTurnout_ParliamentaryVotingTurnoutPct);
        if (!country || !Number.isFinite(pct)) continue;

        const type = (partySystem[country] || "unknown").toLowerCase();
        if (!groups.has(type)) groups.set(type, []);
        groups.get(type).push(pct);
        matched += 1;
    }

    const stats = Array.from(groups.entries()).map(([type, vals]) => {
        const n = vals.length;
        const avg = vals.reduce((a, b) => a + b, 0) / n;
        vals.sort((a, b) => a - b);
        const min = vals[0];
        const max = vals[vals.length - 1];
        return { type, n, avg, min, max };
    }).sort((a, b) => partyOrder(a.type) - partyOrder(b.type));

    const labels = stats.map(s => s.type);
    const dataAvg = stats.map(s => Number(s.avg.toFixed(2)));

    const ctx = document.getElementById("chart");
    new Chart(document.getElementById("chart"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Average voter turnout (%)",
                data: dataAvg,

                // YOUR NEW BAR COLOR
                backgroundColor: "#e1d2ff",
                borderColor: "#c4a9ff",
                borderWidth: 2,

                borderRadius: 8,
                hoverBackgroundColor: "#d4bfff"
            }]
        },

        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 16,
                            weight: "bold"
                        },
                        color: "#111"
                    }
                },

                title: {
                    display: false
                }
            },

            scales: {

                x: {
                    ticks: {
                        font: {
                            size: 15,
                            weight: "bold"
                        },
                        color: "#111"
                    },
                    title: {
                        display: true,
                        text: "Party system type",
                        font: {
                            size: 16,
                            weight: "bold"
                        },
                        color: "#111"
                    }
                },

                y: {
                    ticks: {
                        font: {
                            size: 15,
                            weight: "bold"
                        },
                        color: "#111"
                    },
                    title: {
                        display: true,
                        text: "Average voter turnout (%)",
                        font: {
                            size: 16,
                            weight: "bold"
                        },
                        color: "#111"
                    }
                }

            }
        }
    });

}

main().catch(err => {
    console.error(err);
    alert(err.message);
});
