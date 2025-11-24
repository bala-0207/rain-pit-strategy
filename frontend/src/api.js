import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const weatherAPI = {
  // Get current weather
  getCurrentWeather: async () => {
    const response = await api.get('/weather/current');
    return response.data;
  },

  // Get weather history
  getWeatherHistory: async (limit = 50) => {
    const response = await api.get(`/weather/history?limit=${limit}`);
    return response.data;
  },

  // Get analytics summary
  getAnalyticsSummary: async () => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },
};

export const predictionAPI = {
  // Predict rain probability
  predictRain: async (weatherData) => {
    const response = await api.post('/predict', {
      air_temp: weatherData.air_temp,
      track_temp: weatherData.track_temp,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure,
      wind_speed: weatherData.wind_speed,
      wind_direction: weatherData.wind_direction,
    });
    return response.data;
  },
};

export const strategyAPI = {
  // Get pit stop strategy
  getPitstopStrategy: async (data) => {
    const response = await api.post('/strategy/pitstop', {
      rain_probability: data.rain_probability,
      current_lap: data.current_lap,
      total_laps: data.total_laps,
      current_tire: data.current_tire,
      weather_data: data.weather_data || {}, // Pass weather data if available
    });
    return response.data;
  },
};

export const healthAPI = {
  // Health check
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
