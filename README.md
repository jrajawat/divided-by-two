# Divided by Two: The Illusion of Choice in Two-Party Politics

## Party System vs Voter Turnout World Map

### How to run (recommended)

1) In the `divided-by-two` folder, start a local server:

   Python:
   `python -m http.server 8000`

2) Open in your browser:
   `http://localhost:8000`

### Notes

- Country geometry comes from a local Natural Earth–based GeoJSON file (`data/countries.geojson`), which is preprocessed to avoid antimeridian duplication issues.
- Voter turnout data comes from `data/voter-turnout-by-country-2026.csv`.
- Party system classifications come from `data/party_system.json`.
- Fill opacity represents voter turnout among registered voters.
- Fill color represents the party system type.
- The badges show how many countries successfully matched turnout and party system data.