# Divided by Two: The Failure of the Two-Party System

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
- Fill opacity represents voter turnout.
- Fill color represents the party system type.
- The badges show how many countries successfully matched turnout and party system data.

Further analysis can be found [here](https://docs.google.com/presentation/d/1-u98jVnhOpqCMqmnke6zAQ1IaF2nMOHCqXY_sAcjGQo/edit?usp=sharing)

### Sources

#### Voter turnout data:  
World Population Review. (2026). Voter Turnout by Country.  
https://worldpopulationreview.com/country-rankings/voter-turnout-by-country

#### Country geometry data:  
datasets/geo-countries (Natural Earth–derived GeoJSON)  
https://github.com/datasets/geo-countries/blob/main/data/countries.geojson

#### Party system classification reference:  
Fiveable. Introduction to Comparative Politics – Comparative Analysis of Party Systems  
https://fiveable.me/introduction-comparative-politics/unit-9/comparative-analysis-party-systems/study-guide/CUIxXkdVzK1juEQ4