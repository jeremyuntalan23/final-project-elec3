const WEATHER_API_KEY = "e6b6583f13de0bae1794665627763e37";

const API_ENDPOINTS = {
  geocoding: "https://api.openweathermap.org/geo/1.0/direct",
  currentWeather: "https://api.openweathermap.org/data/2.5/weather",
  forecast: "https://api.openweathermap.org/data/2.5/forecast",
};

const locationInput = document.getElementById("location-input");
const searchButton = document.getElementById("search-button");
const loadingMessage = document.getElementById("loading-message");
const errorDisplay = document.getElementById("error-display");
const locationSelector = document.getElementById("location-selector");

const currentWeatherDisplay = document.getElementById("current-weather");
const locationName = document.getElementById("location-name");
const locationCountry = document.getElementById("location-country");
const weatherDesc = document.getElementById("weather-desc");
const temperature = document.getElementById("temperature");
const feelsLikeTemp = document.getElementById("feels-like-temp");
const humidityValue = document.getElementById("humidity-value");
const windSpeed = document.getElementById("wind-speed");

const forecastSection = document.getElementById("forecast-section");
const forecastContainer = document.getElementById("forecast-container");

const toggleLoadingState = (loading, message = "") => {
  loadingMessage.textContent = message;
  searchButton.disabled = loading;
  locationInput.disabled = loading;
  locationSelector.disabled = loading;
};

const displayError = (errorMessage) => {
  errorDisplay.textContent = errorMessage;
  errorDisplay.classList.remove("hide");
};

const removeError = () => {
  errorDisplay.textContent = "";
  errorDisplay.classList.add("hide");
};

const clearWeatherResults = () => {
  currentWeatherDisplay.classList.add("hide");
  forecastSection.classList.add("hide");
  forecastContainer.innerHTML = "";
};

const clearLocationSelector = () => {
  locationSelector.classList.add("hide");
  locationSelector.innerHTML = "";
};

const validateLocationInput = (inputValue) => {
  const trimmedValue = inputValue.trim();
  if (!trimmedValue) return { valid: false, error: "Please enter a city/province name." };
  if (trimmedValue.length < 2) return { valid: false, error: "Please enter at least 2 characters." };

  const validPattern = /^[a-zA-ZÀ-ž\s.,'-]+$/;
  if (!validPattern.test(trimmedValue)) {
    return { valid: false, error: "Please use letters and common punctuation only." };
  }

  return { valid: true, location: trimmedValue };
};

const fetchData = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    let details = "";
    try {
      const errorData = await response.json();
      if (errorData?.message) details = ` (${errorData.message})`;
    } catch {}
    throw new Error(`Request failed: ${response.status} ${response.statusText}${details}`);
  }
  return response.json();
};

const searchLocationCoordinates = async (locationName) => {
  const endpoint = `${API_ENDPOINTS.geocoding}?q=${encodeURIComponent(locationName)}&limit=5&appid=${WEATHER_API_KEY}`;
  const results = await fetchData(endpoint);
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("Location not found. Check spelling.");
  }
  return results;
};

const retrieveCurrentWeather = async (latitude, longitude) => {
  const endpoint = `${API_ENDPOINTS.currentWeather}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
  return fetchData(endpoint);
};

const retrieveForecastData = async (latitude, longitude) => {
  const endpoint = `${API_ENDPOINTS.forecast}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`;
  return fetchData(endpoint);
};

const buildLocationLabel = (location) => {
  const stateInfo = location.state ? `, ${location.state}` : "";
  return `${location.name}${stateInfo}, ${location.country}`;
};

const populateLocationOptions = (locations) => {
  locationSelector.innerHTML = "";
  for (const loc of locations) {
    const option = document.createElement("option");
    option.value = JSON.stringify({
      lat: loc.lat,
      lon: loc.lon,
      name: loc.name,
      state: loc.state || "",
      country: loc.country || "",
    });
    option.textContent = buildLocationLabel(loc);
    locationSelector.appendChild(option);
  }
  locationSelector.classList.remove("hide");
};

const getChosenLocation = () => {
  return JSON.parse(locationSelector.value);
};

const renderWeatherData = (weatherData, locationInfo) => {
  const cityName = locationInfo?.name || weatherData.name || "Unknown";
  const stateInfo = locationInfo?.state ? `, ${locationInfo.state}` : "";
  const countryInfo = locationInfo?.country || weatherData.sys?.country || "";

  const desc = weatherData.weather?.[0]?.description || "N/A";
  const temp = Math.round(weatherData.main?.temp ?? 0);
  const feels = Math.round(weatherData.main?.feels_like ?? 0);
  const humid = weatherData.main?.humidity ?? 0;
  const windVal = weatherData.wind?.speed ?? 0;

  locationName.textContent = `${cityName}${stateInfo}`;
  locationCountry.textContent = countryInfo ? `Country: ${countryInfo}` : "";
  weatherDesc.textContent = desc;
  temperature.textContent = temp;
  feelsLikeTemp.textContent = feels;
  humidityValue.textContent = humid;
  windSpeed.textContent = windVal;

  currentWeatherDisplay.classList.remove("hide");
};

const selectDailyForecasts = (forecastList) => {
  const groupedByDay = new Map();

  for (const entry of forecastList) {
    const timestamp = new Date(entry.dt * 1000);
    const dateKey = timestamp.toISOString().slice(0, 10);
    if (!groupedByDay.has(dateKey)) groupedByDay.set(dateKey, []);
    groupedByDay.get(dateKey).push(entry);
  }

  const dailyGroups = Array.from(groupedByDay.entries()).slice(0, 5);
  const selectedForecasts = [];

  for (const [, entries] of dailyGroups) {
    let closestToNoon = entries[0];
    let minDistance = Infinity;

    for (const entry of entries) {
      const time = new Date(entry.dt * 1000);
      const distance = Math.abs(time.getUTCHours() - 12);
      if (distance < minDistance) {
        minDistance = distance;
        closestToNoon = entry;
      }
    }
    selectedForecasts.push(closestToNoon);
  }

  return selectedForecasts;
};

const formatWeekday = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(undefined, { weekday: "short" });
};

const renderForecast = (forecastData) => {
  const entries = forecastData.list || [];
  if (!entries.length) return;

  const dailyForecasts = selectDailyForecasts(entries);
  forecastContainer.innerHTML = "";

  for (const entry of dailyForecasts) {
    const temp = Math.round(entry.main?.temp ?? 0);
    const desc = entry.weather?.[0]?.description || "N/A";
    const dayLabel = formatWeekday(entry.dt);

    const forecastCard = document.createElement("div");
    forecastCard.className = "forecast-item";
    forecastCard.innerHTML = `
      <p class="day-label">${dayLabel}</p>
      <p class="temp-label">${temp}°C</p>
      <p class="desc-label">${desc}</p>
    `;
    forecastContainer.appendChild(forecastCard);
  }

  forecastSection.classList.remove("hide");
};

const loadWeatherForLocation = async (locationData) => {
  clearWeatherResults();
  removeError();

  try {
    toggleLoadingState(true, "Loading weather...");

    const currentData = await retrieveCurrentWeather(locationData.lat, locationData.lon);
    renderWeatherData(currentData, locationData);

    toggleLoadingState(true, "Loading 5-day forecast...");
    const forecastData = await retrieveForecastData(locationData.lat, locationData.lon);
    renderForecast(forecastData);

    toggleLoadingState(false, "");
  } catch (error) {
    console.error(error);
    toggleLoadingState(false, "");
    displayError(error.message || "Failed to fetch weather.");
  }
};

const executeSearch = async () => {
  removeError();
  clearWeatherResults();
  clearLocationSelector();

  const validation = validateLocationInput(locationInput.value);
  if (!validation.valid) {
    displayError(validation.error);
    return;
  }

  try {
    toggleLoadingState(true, "Searching location...");

    const locations = await searchLocationCoordinates(validation.location);
    populateLocationOptions(locations);

    toggleLoadingState(false, "");
    await loadWeatherForLocation(getChosenLocation());
  } catch (error) {
    console.error(error);
    toggleLoadingState(false, "");
    displayError(error.message || "Failed to find location.");
  }
};

searchButton.addEventListener("click", executeSearch);

locationInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") executeSearch();
});

locationSelector.addEventListener("change", () => {
  loadWeatherForLocation(getChosenLocation());
});

/* Theme toggle and persistence */
(() => {
  const THEME_KEY = "weather_app_theme";
  const themeToggle = document.getElementById("theme-toggle");
  const yearSpan = document.getElementById("current-year");

  const applyTheme = (theme) => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    if (themeToggle) themeToggle.checked = theme === "dark";
  };

  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    initTheme();
  });

  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      const theme = themeToggle.checked ? "dark" : "light";
      applyTheme(theme);
      localStorage.setItem(THEME_KEY, theme);
    });
  }
})();
