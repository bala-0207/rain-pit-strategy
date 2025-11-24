import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertCircle, Cloud, CheckCircle } from 'lucide-react';
import Card from '../components/Card';
import { weatherAPI, predictionAPI } from '../api';

const Strategy = () => {
  const [weatherData, setWeatherData] = useState({
    air_temp: 28.5,
    track_temp: 42.0,
    humidity: 65.0,
    pressure: 993.0,
    wind_speed: 15.0,
    wind_direction: 150,
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);

  useEffect(() => {
    loadCurrentWeather();
  }, []);

  const loadCurrentWeather = async () => {
    try {
      const res = await weatherAPI.getCurrentWeather();
      if (res.success) {
        setCurrentWeather(res.data);
        setWeatherData({
          air_temp: res.data.air_temp,
          track_temp: res.data.track_temp,
          humidity: res.data.humidity,
          pressure: res.data.pressure,
          wind_speed: res.data.wind_speed,
          wind_direction: res.data.wind_direction,
        });
      }
    } catch (err) {
      console.error('Error loading weather:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setWeatherData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await predictionAPI.predictRain(weatherData);
      if (res.success) {
        setPrediction(res);
      }
    } catch (err) {
      console.error('Prediction error:', err);
      alert('Failed to get prediction. Make sure backend is running.');
    }
    setLoading(false);
  };

  const getRiskColor = (probability) => {
    if (probability > 0.7) return 'text-racing-red';
    if (probability > 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Race Strategy Analyzer</h1>
        <p className="text-gray-400">Input weather conditions to get AI-powered strategy recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <Card title="Weather Input" icon={Cloud}>
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={loadCurrentWeather}
                  className="racing-button-secondary text-sm py-2 px-4"
                >
                  Load Current Weather
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Air Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weatherData.air_temp}
                  onChange={(e) => handleInputChange('air_temp', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Track Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weatherData.track_temp}
                  onChange={(e) => handleInputChange('track_temp', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Humidity (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weatherData.humidity}
                  onChange={(e) => handleInputChange('humidity', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Atmospheric Pressure (hPa)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weatherData.pressure}
                  onChange={(e) => handleInputChange('pressure', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Wind Speed (km/h)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weatherData.wind_speed}
                  onChange={(e) => handleInputChange('wind_speed', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Wind Direction (degrees)
                </label>
                <input
                  type="number"
                  step="1"
                  value={weatherData.wind_direction}
                  onChange={(e) => handleInputChange('wind_direction', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                />
              </div>

              <button
                onClick={handlePredict}
                disabled={loading}
                className="racing-button w-full mt-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="loader mr-2"></div>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Strategy'
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* Results Section */}
        <div>
          {prediction ? (
            <div className="space-y-6">
              {/* Rain Prediction */}
              <Card title="Rain Prediction" icon={Cloud}>
                <div className="text-center py-6">
                  <div className={`text-6xl font-bold mb-4 ${getRiskColor(prediction.prediction.rain_probability)}`}>
                    {(prediction.prediction.rain_probability * 100).toFixed(1)}%
                  </div>
                  <p className="text-xl text-gray-300 mb-2">
                    {prediction.prediction.prediction === 1 ? 'Rain Expected 🌧️' : 'Dry Conditions ☀️'}
                  </p>
                  <div className="mt-4 p-4 bg-racing-dark rounded-lg">
                    <p className="text-sm text-gray-400">Confidence</p>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <div className="flex-1 bg-racing-gray rounded-full h-3">
                        <div
                          className="bg-racing-accent h-3 rounded-full transition-all"
                          style={{ width: `${prediction.prediction.rain_probability * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-bold">
                        {(prediction.prediction.rain_probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Strategy Recommendation */}
              <Card title="Recommended Strategy" icon={Target}>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      prediction.strategy.risk_level === 'HIGH' ? 'bg-racing-red' :
                      prediction.strategy.risk_level === 'MEDIUM' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}>
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Risk Level</p>
                      <p className="text-xl font-bold text-white">{prediction.strategy.risk_level}</p>
                    </div>
                  </div>

                  <div className="border-t border-racing-gray pt-4">
                    <p className="text-sm text-gray-400 mb-2">Recommendation</p>
                    <p className="text-white">{prediction.strategy.recommendation}</p>
                  </div>

                  <div className="border-t border-racing-gray pt-4">
                    <p className="text-sm text-gray-400 mb-2">Tire Choice</p>
                    <p className="text-lg font-bold text-racing-accent">
                      {prediction.strategy.tire_choice}
                    </p>
                  </div>

                  {prediction.strategy.notes && prediction.strategy.notes.length > 0 && (
                    <div className="border-t border-racing-gray pt-4">
                      <p className="text-sm text-gray-400 mb-2">Additional Notes</p>
                      <ul className="space-y-2">
                        {prediction.strategy.notes.map((note, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-racing-accent mt-1 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>

              {/* Model Confidence */}
              <Card title="Model Analysis" icon={TrendingUp}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat-card">
                    <p className="text-sm text-gray-400">No Rain</p>
                    <p className="text-2xl font-bold text-green-400">
                      {(prediction.prediction.no_rain_probability * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="stat-card">
                    <p className="text-sm text-gray-400">Rain</p>
                    <p className="text-2xl font-bold text-racing-red">
                      {(prediction.prediction.rain_probability * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card title="Waiting for Analysis" icon={AlertCircle}>
              <div className="text-center py-12">
                <Cloud className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  Enter weather conditions and click "Analyze Strategy" to get AI recommendations
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Strategy;
