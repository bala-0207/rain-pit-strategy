import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Gauge, Thermometer, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import SimpleChart from '../components/SimpleChart';
import { weatherAPI, predictionAPI } from '../api';
import { useWeather } from '../context/WeatherContext';

const Dashboard = () => {
  const { weatherData: sharedWeather, source: sharedSource } = useWeather();
  
  const [currentWeather, setCurrentWeather] = useState(null);
  const [weatherHistory, setWeatherHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherSource, setWeatherSource] = useState(null);
  const [weatherLocation, setWeatherLocation] = useState(null);

  // Use shared weather data when available (from Strategy page)
  useEffect(() => {
    if (sharedWeather) {
      setCurrentWeather(sharedWeather);
      
      // Make prediction with shared data
      makePrediction(sharedWeather);
    }
  }, [sharedWeather]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      // Only auto-refresh if NOT using strategy data
      if (sharedSource !== 'strategy') {
        fetchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sharedSource]);

  const makePrediction = async (weather) => {
    try {
      const predRes = await predictionAPI.predictRain({
        air_temp: weather.air_temp,
        track_temp: weather.track_temp,
        humidity: weather.humidity,
        pressure: weather.pressure,
        wind_speed: weather.wind_speed,
        wind_direction: weather.wind_direction,
      });

      if (predRes.success) {
        setPrediction(predRes);
      }
    } catch (err) {
      console.error('Prediction error:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data
      const [weatherRes, historyRes, analyticsRes] = await Promise.all([
        weatherAPI.getCurrentWeather(),
        weatherAPI.getWeatherHistory(50),
        weatherAPI.getAnalyticsSummary(),
      ]);

      if (weatherRes.success && sharedSource !== 'strategy') {
        setCurrentWeather(weatherRes.data);
        setWeatherSource(weatherRes.source || 'dataset');
        setWeatherLocation(weatherRes.location || 'Historical data');

        await makePrediction(weatherRes.data);
      } else if (weatherRes.success) {
        setWeatherSource(weatherRes.source || 'dataset');
        setWeatherLocation(weatherRes.location || 'Historical data');
      }

      if (historyRes.success) {
        setWeatherHistory(historyRes.data);
      }

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.summary);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Make sure the backend server is running on port 5000.');
      setLoading(false);
    }
  };

  const getRiskColor = (probability) => {
    if (probability > 0.7) return 'text-racing-red';
    if (probability > 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBadge = (level) => {
    const colors = {
      HIGH: 'bg-racing-red',
      MEDIUM: 'bg-yellow-500',
      LOW: 'bg-green-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  if (loading && !currentWeather) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loader mx-auto mb-4"></div>
          <p className="text-gray-400">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card icon={AlertTriangle} title="Error">
          <p className="text-racing-red">{error}</p>
          <button onClick={fetchData} className="racing-button mt-4">
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with Location */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Weather Dashboard</h1>
        <div className="flex items-center gap-3">
          <p className="text-gray-400">Real-time weather monitoring and rain prediction</p>
          {sharedSource === 'strategy' ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">•</span>
              <span className="bg-orange-500/20 border border-orange-500 text-orange-400 text-xs px-3 py-1 rounded-full">
                📝 Using Strategy values
              </span>
            </div>
          ) : weatherLocation && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">•</span>
              <span className="text-racing-accent font-semibold">📍 {weatherLocation}</span>
              {weatherSource === 'live' && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  🔴 LIVE
                </span>
              )}
              {weatherSource === 'dataset' && (
                <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                  📊 DATASET
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rain Prediction Alert */}
      {prediction && (
        <div className="mb-6">
          <div
            className={`p-6 rounded-lg border-2 ${
              prediction.strategy.risk_level === 'HIGH'
                ? 'bg-red-900/20 border-racing-red'
                : prediction.strategy.risk_level === 'MEDIUM'
                ? 'bg-yellow-900/20 border-yellow-500'
                : 'bg-green-900/20 border-green-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Cloud className={`w-12 h-12 ${getRiskColor(prediction.prediction.rain_probability)}`} />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Rain Probability: {' '}
                    <span className={getRiskColor(prediction.prediction.rain_probability)}>
                      {(prediction.prediction.rain_probability * 100).toFixed(1)}%
                    </span>
                  </h2>
                  <p className="text-gray-300 mb-2">{prediction.strategy.recommendation}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {prediction.strategy.notes.map((note, idx) => (
                      <span key={idx} className="text-xs bg-racing-gray px-3 py-1 rounded-full">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-lg font-bold ${getRiskBadge(prediction.strategy.risk_level)} text-white`}>
                {prediction.strategy.risk_level} RISK
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Current Weather Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card icon={Thermometer} title="Air Temperature">
          <div className="text-3xl font-bold text-racing-accent">
            {currentWeather?.air_temp?.toFixed(1)}°C
          </div>
          <p className="text-sm text-gray-500 mt-1">Track: {currentWeather?.track_temp?.toFixed(1)}°C</p>
        </Card>

        <Card icon={Droplets} title="Humidity">
          <div className="text-3xl font-bold text-blue-400">
            {currentWeather?.humidity?.toFixed(1)}%
          </div>
          {analytics && (
            <p className="text-sm text-gray-500 mt-1">Avg: {analytics.avg_humidity.toFixed(1)}%</p>
          )}
        </Card>

        <Card icon={Wind} title="Wind Speed">
          <div className="text-3xl font-bold text-green-400">
            {currentWeather?.wind_speed?.toFixed(1)} km/h
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Direction: {currentWeather?.wind_direction}°
          </p>
        </Card>

        <Card icon={Gauge} title="Pressure">
          <div className="text-3xl font-bold text-purple-400">
            {currentWeather?.pressure?.toFixed(1)} hPa
          </div>
          {analytics && (
            <p className="text-sm text-gray-500 mt-1">Avg: {analytics.avg_pressure.toFixed(1)} hPa</p>
          )}
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Temperature Trends" icon={Thermometer}>
          {weatherHistory.length > 0 && (
            <SimpleChart
              data={weatherHistory}
              dataKeys={['air_temp', 'track_temp']}
              colors={['#00D9FF', '#DC0000']}
              type="area"
            />
          )}
        </Card>

        <Card title="Humidity & Pressure" icon={Droplets}>
          {weatherHistory.length > 0 && (
            <SimpleChart
              data={weatherHistory}
              dataKeys={['humidity', 'pressure']}
              colors={['#3B82F6', '#A855F7']}
              type="line"
            />
          )}
        </Card>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <Card title="Session Analytics" icon={AlertTriangle}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-sm text-gray-400">Total Readings</p>
              <p className="text-2xl font-bold text-white">{analytics.total_readings}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-400">Rain Events</p>
              <p className="text-2xl font-bold text-racing-red">{analytics.rain_events}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-400">Rain %</p>
              <p className="text-2xl font-bold text-yellow-400">
                {analytics.rain_percentage.toFixed(1)}%
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-400">Avg Wind Speed</p>
              <p className="text-2xl font-bold text-green-400">
                {analytics.avg_wind_speed.toFixed(1)} km/h
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tire Recommendation */}
      {prediction && (
        <Card title="Recommended Tire Strategy" icon={AlertTriangle} className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-white mb-2">
                {prediction.strategy.tire_choice}
              </p>
              <p className="text-gray-400">{prediction.strategy.recommendation}</p>
            </div>
            <div className={`text-4xl font-bold ${getRiskColor(prediction.prediction.rain_probability)}`}>
              {prediction.prediction.prediction === 1 ? '🌧️' : '☀️'}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
