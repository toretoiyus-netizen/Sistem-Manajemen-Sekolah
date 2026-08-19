// ========================
// Weather Dashboard Script
// ========================

// API Configuration
const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const geoLocationBtn = document.getElementById('geoLocationBtn');
const searchSuggestions = document.getElementById('searchSuggestions');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const currentWeatherSection = document.getElementById('currentWeatherSection');
const forecastSection = document.getElementById('forecastSection');
const forecastContainer = document.getElementById('forecastContainer');

// State
let selectedCity = null;

// ========================
// Event Listeners
// ========================

searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        searchWeather(city);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            searchWeather(city);
        }
    }
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 2) {
        fetchCitySuggestions(query);
    } else {
        hideSuggestions();
    }
});

geoLocationBtn.addEventListener('click', () => {
    getGeolocation();
});

// ========================
// Geolocation Function
// ========================

function getGeolocation() {
    showLoading();
    hideError();

    if (!navigator.geolocation) {
        showError('Geolocation tidak didukung oleh browser Anda.');
        hideLoading();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude);
        },
        (error) => {
            hideLoading();
            let errorMsg = 'Tidak dapat mengakses lokasi Anda.';
            if (error.code === error.PERMISSION_DENIED) {
                errorMsg = 'Anda perlu memberikan izin lokasi untuk fitur ini.';
            }
            showError(errorMsg);
        }
    );
}

// ========================
// Geocoding Functions
// ========================

async function fetchCitySuggestions(query) {
    try {
        const response = await fetch(
            `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=6&language=id&format=json`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            displaySuggestions(data.results);
        } else {
            hideSuggestions();
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        hideSuggestions();
    }
}

function displaySuggestions(results) {
    searchSuggestions.innerHTML = '';
    results.forEach((result) => {
        const city = result.name;
        const country = result.country;
        const admin1 = result.admin1 ? `, ${result.admin1}` : '';

        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'suggestion-item';
        suggestionElement.innerHTML = `
            <i class="fas fa-location-dot"></i>
            ${city}${admin1}, ${country}
        `;

        suggestionElement.addEventListener('click', () => {
            searchInput.value = city;
            selectedCity = {
                name: city,
                country: country,
                latitude: result.latitude,
                longitude: result.longitude,
                timezone: result.timezone
            };
            hideSuggestions();
            fetchWeatherByCoordinates(result.latitude, result.longitude, selectedCity);
        });

        searchSuggestions.appendChild(suggestionElement);
    });

    searchSuggestions.classList.add('active');
}

function hideSuggestions() {
    searchSuggestions.classList.remove('active');
    searchSuggestions.innerHTML = '';
}

// ========================
// Weather Functions
// ========================

async function searchWeather(city) {
    try {
        showLoading();
        hideError();

        const response = await fetch(
            `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&language=id&format=json`
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            hideLoading();
            showError(`Kota "${city}" tidak ditemukan. Silakan coba nama kota lain.`);
            return;
        }

        const result = data.results[0];
        selectedCity = {
            name: result.name,
            country: result.country,
            latitude: result.latitude,
            longitude: result.longitude,
            timezone: result.timezone
        };

        hideSuggestions();
        await fetchWeatherByCoordinates(result.latitude, result.longitude, selectedCity);
    } catch (error) {
        hideLoading();
        console.error('Error searching weather:', error);
        showError('Terjadi kesalahan saat mencari cuaca. Silakan coba lagi.');
    }
}

async function fetchWeatherByCoordinates(latitude, longitude, cityInfo = null) {
    try {
        showLoading();
        hideError();

        const params = new URLSearchParams({
            latitude: latitude,
            longitude: longitude,
            current: 'temperature_2m,weather_code,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl,visibility,temperature_2m,apparent_temperature_2m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
            timezone: 'auto',
            forecast_days: 7
        });

        const response = await fetch(`${API_BASE_URL}?${params}`);
        const data = await response.json();

        hideLoading();

        if (data.current) {
            displayCurrentWeather(data, cityInfo);
            displayForecast(data);
        } else {
            showError('Data cuaca tidak tersedia.');
        }
    } catch (error) {
        hideLoading();
        console.error('Error fetching weather:', error);
        showError('Gagal mengambil data cuaca. Silakan coba lagi.');
    }
}

// ========================
// Display Current Weather
// ========================

function displayCurrentWeather(data, cityInfo) {
    const current = data.current;
    const weatherCode = current.weather_code;
    const weatherDesc = getWeatherDescription(weatherCode);
    const weatherIcon = getWeatherIcon(weatherCode);

    const cityName = cityInfo
        ? `${cityInfo.name}, ${cityInfo.country}`
        : `Lokasi (${current.latitude.toFixed(2)}°, ${current.longitude.toFixed(2)}°)`;

    // Update HTML
    document.getElementById('cityName').textContent = cityName;
    document.getElementById('weatherDescription').textContent = weatherDesc;
    document.getElementById('currentTemp').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windSpeed').textContent = `${(current.wind_speed_10m).toFixed(1)} m/s`;
    document.getElementById('pressure').textContent = `${Math.round(current.pressure_msl)} hPa`;
    document.getElementById('visibility').textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature_2m)}°C`;

    // Get rain chance from daily data if available
    const rainChance = data.daily && data.daily.precipitation_probability_max
        ? data.daily.precipitation_probability_max[0]
        : 0;
    document.getElementById('rainChance').textContent = `${rainChance}%`;

    // Update weather icon
    const weatherIconEl = document.getElementById('weatherIcon');
    weatherIconEl.innerHTML = weatherIcon;

    // Update last updated time
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = `Diperbarui: ${timeString}`;

    // Show section
    currentWeatherSection.classList.remove('hidden');
}

// ========================
// Display Forecast
// ========================

function displayForecast(data) {
    const daily = data.daily;
    const dates = daily.time;
    const temps_max = daily.temperature_2m_max;
    const temps_min = daily.temperature_2m_min;
    const weather_codes = daily.weather_code;
    const rain_chances = daily.precipitation_probability_max;

    forecastContainer.innerHTML = '';

    // Start from tomorrow (skip today)
    for (let i = 1; i < Math.min(8, dates.length); i++) {
        const date = new Date(dates[i]);
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const weatherCode = weather_codes[i];
        const weatherDesc = getWeatherDescription(weatherCode);
        const weatherIcon = getWeatherIcon(weatherCode);
        const rainChance = rain_chances[i];

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-date">${dateStr}</div>
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${weatherIcon}</div>
            <div class="forecast-temp">
                <div class="forecast-temp-max">${Math.round(temps_max[i])}°</div>
                <div class="forecast-temp-min">${Math.round(temps_min[i])}°</div>
            </div>
            <div class="forecast-description">${weatherDesc}</div>
            <div style="font-size: 0.8rem; color: #3498db; margin-top: 5px;">
                🌧️ ${rainChance}%
            </div>
        `;
        forecastContainer.appendChild(forecastCard);
    }

    forecastSection.classList.remove('hidden');
}

// ========================
// Weather Code Mapping
// ========================

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Cerah',
        1: 'Sebagian besar cerah',
        2: 'Berawan',
        3: 'Mendung',
        45: 'Berkabut',
        48: 'Berkabut es',
        51: 'Gerimis ringan',
        53: 'Gerimis sedang',
        55: 'Gerimis lebat',
        61: 'Hujan ringan',
        63: 'Hujan sedang',
        65: 'Hujan lebat',
        71: 'Salju ringan',
        73: 'Salju sedang',
        75: 'Salju lebat',
        80: 'Hujan ringan',
        81: 'Hujan sedang',
        82: 'Hujan lebat',
        85: 'Salju ringan',
        86: 'Salju lebat',
        95: 'Badai petir',
        96: 'Badai petir dengan es',
        99: 'Badai petir dengan es'
    };
    return descriptions[code] || 'Tidak diketahui';
}

function getWeatherIcon(code) {
    // Weather code mapping to Font Awesome icons
    const icons = {
        0: '<i class="fas fa-sun" style="color: #f39c12;"></i>',
        1: '<i class="fas fa-cloud-sun" style="color: #f39c12;"></i>',
        2: '<i class="fas fa-cloud-sun" style="color: #95a5a6;"></i>',
        3: '<i class="fas fa-cloud" style="color: #95a5a6;"></i>',
        45: '<i class="fas fa-smog" style="color: #bdc3c7;"></i>',
        48: '<i class="fas fa-smog" style="color: #bdc3c7;"></i>',
        51: '<i class="fas fa-cloud-rain" style="color: #3498db;"></i>',
        53: '<i class="fas fa-cloud-rain" style="color: #3498db;"></i>',
        55: '<i class="fas fa-cloud-rain" style="color: #2980b9;"></i>',
        61: '<i class="fas fa-cloud-rain" style="color: #3498db;"></i>',
        63: '<i class="fas fa-cloud-rain" style="color: #3498db;"></i>',
        65: '<i class="fas fa-cloud-showers-heavy" style="color: #2980b9;"></i>',
        71: '<i class="fas fa-snowflake" style="color: #ecf0f1;"></i>',
        73: '<i class="fas fa-snowflake" style="color: #ecf0f1;"></i>',
        75: '<i class="fas fa-snowflake" style="color: #bdc3c7;"></i>',
        80: '<i class="fas fa-cloud-rain" style="color: #3498db;"></i>',
        81: '<i class="fas fa-cloud-rain" style="color: #3498db;"></i>',
        82: '<i class="fas fa-cloud-showers-heavy" style="color: #2980b9;"></i>',
        85: '<i class="fas fa-snowflake" style="color: #ecf0f1;"></i>',
        86: '<i class="fas fa-snowflake" style="color: #bdc3c7;"></i>',
        95: '<i class="fas fa-cloud-bolt" style="color: #f39c12;"></i>',
        96: '<i class="fas fa-cloud-bolt" style="color: #f39c12;"></i>',
        99: '<i class="fas fa-cloud-bolt" style="color: #f39c12;"></i>'
    };
    return icons[code] || '<i class="fas fa-cloud"></i>';
}

// ========================
// UI Helper Functions
// ========================

function showLoading() {
    loadingSpinner.classList.remove('hidden');
    currentWeatherSection.classList.add('hidden');
    forecastSection.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// ========================
// Initialize
// ========================

// Load default city on page load (Jakarta)
window.addEventListener('load', () => {
    // Optional: Load default city
    // searchWeather('Jakarta');
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (e.target !== searchInput && !searchSuggestions.contains(e.target)) {
        hideSuggestions();
    }
});

console.log('Weather Dashboard initialized successfully!');
