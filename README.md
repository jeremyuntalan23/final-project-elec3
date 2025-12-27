# Final Project Elec3

---

## Project Overview

This repository contains a small collection of front-end projects built for a solo class assignment. The main focus is a Weather app that demonstrates fetching data from a public API, showing current conditions and a 5-day forecast, and a small UI with a dark/light theme toggle. The project is intended to be easy to run locally and ready for instructor review.

## Project Type

- Solo project

## Main Features

- Search weather by city or province name
- Handle multiple location matches and choose the correct one
- Display current weather (temperature, description, humidity, wind, feels-like)
- Display a 5-day forecast (daily snapshot)
- Responsive layout for small and large screens
- Dark / Light theme toggle with persistence (localStorage)
- Small footer with attribution

## APIs Used

### OpenWeatherMap (used by the Weather app)
- API name: OpenWeatherMap
- Base URL: `https://api.openweathermap.org`
- Endpoints used:
  - Geocoding (search locations): `/geo/1.0/direct`
    - Example: `https://api.openweathermap.org/geo/1.0/direct?q={city name}&limit=5&appid={API_KEY}`
    - Parameters: `q` (city name or query), `limit` (max results), `appid` (API key)
  - Current weather: `/data/2.5/weather`
    - Example: `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric`
    - Parameters: `lat`, `lon`, `appid`, `units` (e.g., `metric`)
  - 5-day Forecast: `/data/2.5/forecast`
    - Example: `https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric`
    - Parameters: same as current weather
- Authentication: API key passed as the `appid` query parameter. Sign up at https://openweathermap.org/ to get a free API key.

> Note: If you add other sub-apps that call external APIs (for example an emoji API for the `emoji-hub-api` folder), list them here with base URL, endpoints, parameters, and any authentication details.

## Technologies Used

- HTML5
- CSS3 (custom properties, responsive layout)
- JavaScript (ES6+, Fetch API, localStorage)
- No build step required — plain static files (can be served with any static server)

## Project Structure (important files)

- `weather-api/` — Weather app (index.html, style.css, script.js)
- `emoji-hub-api/` — Emoji demo (index.html, style.css, script.js)
- `calculator/` — Calculator demo
- `stopwatch/` — Stopwatch demo

## How to Clone or Download

1. Clone the repository (replace `<repository-url>` with the actual URL):

```bash
git clone <repository-url>
cd api-final-project-elec3
```

2. Or download the ZIP from your Git hosting and extract it.

## How to Run the Project Locally

These are static front-end projects. You can open files directly in your browser or use a simple local server (recommended for consistent behavior).

Option A — Open directly (quick):

1. Open the folder in your file manager.
2. Double-click `weather-api/index.html` to open it in your default browser.

Option B — Simple local server (recommended):

If you have Python installed, run from the repository root:

```bash
# Python 3
python -m http.server 8000
```

Then open `http://localhost:8000/weather-api/` in your browser.

Option C — VS Code Live Server extension

- Install the Live Server extension and choose `Open with Live Server` on the `weather-api/index.html` file.

### Set up the OpenWeatherMap API key

1. Sign up at https://openweathermap.org/ and obtain an API key.
2. Edit `weather-api/script.js` and replace the placeholder key (if present) or set the `WEATHER_API_KEY` constant with your key:

```js
// weather-api/script.js
const WEATHER_API_KEY = "YOUR_API_KEY_HERE";
```

3. Save and reload the page.

## Credits / API Attribution

- Weather data provided by OpenWeatherMap — https://openweathermap.org/ (please follow their attribution requirements when required)
- Project developed by: Jeremy Untalan

## Notes for the Instructor

- This is a solo project. The code is intentionally small and readable to demonstrate understanding of DOM manipulation, API usage, async/await, and simple state persistence with `localStorage`.
- The Weather app contains a theme toggle that persists user preference.
- No back-end or database is required.

## Troubleshooting

- If you see CORS or network errors when fetching the API, ensure:
  - Your API key is set correctly in `weather-api/script.js`.
  - The network allows outbound requests to `api.openweathermap.org`.
- If fetch responses fail, check the browser devtools Console/Network for details.
