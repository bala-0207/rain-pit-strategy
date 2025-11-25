import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertCircle, Cloud, CheckCircle } from 'lucide-react';
import Card from '../components/Card';
import { predictionAPI } from '../api';
import { useWeather } from '../context/WeatherContext';

const Strategy = () => {
  const { weatherData: sharedWeather, updateWeatherFromStrategy, source } = useWeather();
  
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
  const [lastSentData, setLastSentData] = useState(null);

  // Load from shared context when available
  useEffect(() => {
    if (sharedWeather) {
      setWeatherData({
        air_temp: sharedWeather.air_temp,
        track_temp: sharedWeather.track_temp,
        humidity: sharedWeather.humidity,
        pressure: sharedWeather.pressure,
        wind_speed: sharedWeather.wind_speed,
        wind_direction: sharedWeather.wind_direction,
      });
    }
  }, [sharedWeather]);

  const handleInputChange = (field, value) => {
    setWeatherData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    
    // Update shared context with current values
    updateWeatherFromStrategy(weatherData);
    
    // Save what we're sending
    setLastSentData({
      timestamp: new Date().toLocaleTimeString(),
      data: { ...weatherData }
    });
    
    console.log('🚀 SENDING TO BACKEND:', weatherData);
    
    try {
      const res = await predictionAPI.predictRain(weatherData);
      console.log('✅ RECEIVED FROM BACKEND:', res);
      
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
        {source === 'strategy' && (
          <div className="mt-2 inline-block bg-orange-500/20 border border-orange-500 rounded px-3 py-1">
            <span className="text-orange-400 text-sm">📝 Using Strategy values (synced to all pages)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <Card title="Weather Input" icon={Cloud}>
            <div className="space-y-4">
              {/* DEBUG DISPLAY */}
              {lastSentData && (
                <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-400 font-bold mb-2">
                    📤 Last Sent to Backend ({lastSentData.timestamp})
                  </p>
                  <div className="text-xs text-white space-y-1">
                    <div>Air Temp: {lastSentData.data.air_temp}°C</div>
                    <div>Track Temp: {lastSentData.data.track_temp}°C</div>
                    <div>Humidity: {lastSentData.data.humidity}%</div>
                    <div>Pressure: {lastSentData.data.pressure} hPa</div>
                    <div>Wind Speed: {lastSentData.data.wind_speed} km/h</div>
                    <div>Wind Direction: {lastSentData.data.wind_direction}°</div>
                  </div>
                </div>
              )}

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
