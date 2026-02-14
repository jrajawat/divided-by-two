Voter turnout + party system web map

Files
- index.html
- style.css
- app.js
- data/turnout.csv
- data/party_system.json

How to run (recommended)
1) Unzip the folder
2) In the folder, run a local server:

   Python:
   python -m http.server 8000

3) Open in your browser:
   http://localhost:8000

Notes
- The map geometry comes from world-atlas via a public CDN.
- Country name matching is best effort; the badges show how many countries matched.
- If a country is missing, add an entry to harmonizeCountryName in app.js.