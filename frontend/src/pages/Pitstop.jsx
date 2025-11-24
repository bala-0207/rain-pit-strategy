import React, { useState, useEffect } from 'react';
import { Settings, Flag, Clock, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import Card from '../components/Card';
import { strategyAPI, predictionAPI, weatherAPI } from '../api';

const Pitstop = () => {
  const [raceData, setRaceData] = useState({
    current_lap: 1,
    total_laps: 50,
    current_tire: 'soft',
    rain_probability: 0,
  });

  const [weatherData, setWeatherData] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentPrediction();
  }, []);

  const loadCurrentPrediction = async () => {
    try {
      const weatherRes = await weatherAPI.getCurrentWeather();
      if (weatherRes.success) {
        setWeatherData(weatherRes.data);
        
        const predRes = await predictionAPI.predictRain({
          air_temp: weatherRes.data.air_temp,
          track_temp: weatherRes.data.track_temp,
          humidity: weatherRes.data.humidity,
          pressure: weatherRes.data.pressure,
          wind_speed: weatherRes.data.wind_speed,
          wind_direction: weatherRes.data.wind_direction,
        });

        if (predRes.success) {
          setRaceData((prev) => ({
            ...prev,
            rain_probability: predRes.prediction.rain_probability,
          }));
          
          // Auto-calculate strategy when prediction loads
          calculateStrategyWithData({
            ...raceData,
            rain_probability: predRes.prediction.rain_probability
          }, weatherRes.data);
        }
      }
    } catch (err) {
      console.error('Error loading prediction:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setRaceData((prev) => ({
      ...prev,
      [field]: field === 'current_tire' ? value : parseInt(value) || 0,
    }));
  };

  const calculateStrategyWithData = async (data, weather) => {
    setLoading(true);
    try {
      const requestData = {
        ...data,
        weather_data: weather ? {
          humidity: weather.humidity,
          wind_speed: weather.wind_speed
        } : {}
      };
      
      const res = await strategyAPI.getPitstopStrategy(requestData);
      if (res.success) {
        setStrategy(res.strategy);
      }
    } catch (err) {
      console.error('Strategy calculation error:', err);
    }
    setLoading(false);
  };

  const handleCalculateStrategy = async () => {
    await calculateStrategyWithData(raceData, weatherData);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'text-racing-red animate-pulse';
      case 'HIGH':
        return 'text-racing-red';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'LOW':
        return 'text-green-400';
      case 'NONE':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getUrgencyBg = (urgency) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-racing-red animate-pulse';
      case 'HIGH':
        return 'bg-racing-red';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-green-500';
      case 'NONE':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTireColor = (tire) => {
    switch (tire.toLowerCase()) {
      case 'soft':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-white';
      case 'intermediate':
        return 'bg-green-500';
      case 'wet':
      case 'full wet':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const tireCompounds = [
    { value: 'soft', label: 'Soft (Red)', color: 'bg-red-500' },
    { value: 'medium', label: 'Medium (Yellow)', color: 'bg-yellow-500' },
    { value: 'hard', label: 'Hard (White)', color: 'bg-white' },
    { value: 'intermediate', label: 'Intermediate (Green)', color: 'bg-green-500' },
    { value: 'wet', label: 'Full Wet (Blue)', color: 'bg-blue-500' },
  ];

  const isRecommendedTire = (tireValue) => {
    if (!strategy) return false;
    const recommended = strategy.recommended_tire.toLowerCase();
    return recommended.includes(tireValue);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Pit Stop Strategy</h1>
        <p className="text-gray-400">AI-powered pit stop optimization based on live conditions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <Card title="Race Parameters" icon={Flag}>
            <div className="space-y-4">
              {/* Rain Probability - Auto-Synced (Read Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Rain Probability (Auto-Synced)
                </label>
                <div className="w-full bg-racing-dark/50 border border-racing-accent/50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-white font-bold text-2xl">
                    {(raceData.rain_probability * 100).toFixed(0)}%
                  </span>
                  <span className="text-racing-accent text-sm font-medium">
                    ⚡ LIVE
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Synced from Weather Dashboard & Strategy Analyzer
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Current Lap
                </label>
                <input
                  type="number"
                  min="1"
                  value={raceData.current_lap}
                  onChange={(e) => handleInputChange('current_lap', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Total Laps
                </label>
                <input
                  type="number"
                  min="1"
                  value={raceData.total_laps}
                  onChange={(e) => handleInputChange('total_laps', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Current Tire Compound
                </label>
                <select
                  value={raceData.current_tire}
                  onChange={(e) => handleInputChange('current_tire', e.target.value)}
                  className="w-full bg-racing-dark border border-racing-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-racing-accent"
                >
                  {tireCompounds.map((tire) => (
                    <option key={tire.value} value={tire.value}>
                      {tire.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCalculateStrategy}
                disabled={loading}
                className="racing-button w-full mt-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="loader mr-2"></div>
                    Calculating...
                  </span>
                ) : (
                  'Calculate Pit Strategy'
                )}
              </button>
            </div>
          </Card>

          {/* Race Progress */}
          <Card title="Race Progress" icon={Clock} className="mt-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Lap {raceData.current_lap} of {raceData.total_laps}</span>
                  <span>{((raceData.current_lap / raceData.total_laps) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-racing-dark rounded-full h-4">
                  <div
                    className="racing-gradient h-4 rounded-full transition-all"
                    style={{ width: `${(raceData.current_lap / raceData.total_laps) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="stat-card">
                  <p className="text-sm text-gray-400">Laps Completed</p>
                  <p className="text-2xl font-bold text-white">{raceData.current_lap}</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-gray-400">Laps Remaining</p>
                  <p className="text-2xl font-bold text-racing-accent">
                    {raceData.total_laps - raceData.current_lap}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Strategy Results */}
        <div>
          {strategy ? (
            <div className="space-y-6">
              {/* Perfect Pitstop Prediction - MAIN FEATURE */}
              <Card
                title="🏁 Perfect Pitstop Prediction"
                icon={Zap}
                className="border-2 border-racing-accent"
              >
                <div className="space-y-4 bg-gradient-to-br from-racing-accent/10 to-transparent p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Optimal Pitstop Lap</p>
                      <p className="text-3xl font-bold text-racing-accent">
                        Lap {strategy.estimated_lap}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Next Tyre Type</p>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getTireColor(strategy.recommended_tire)}`}></div>
                        <p className="text-lg font-bold text-white">
                          {strategy.recommended_tire}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {strategy.expected_lap_time && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Expected Lap Time After Pitstop</p>
                      <p className="text-2xl font-bold text-white">
                        1:{String(Math.floor(strategy.expected_lap_time - 60)).padStart(2, '0')}.{String(Math.round((strategy.expected_lap_time % 1) * 10)).padStart(1, '0')}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t border-racing-gray pt-3">
                    <p className="text-xs text-gray-400 mb-1">Reason</p>
                    <p className="text-white font-medium">{strategy.reasoning}</p>
                  </div>
                </div>
              </Card>

              {/* Rain Spike Alert - Conditional Display */}
              {strategy.rain_spike && strategy.rain_spike.detected && (
                <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4 flex items-start space-x-3 animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-yellow-500 font-bold text-lg">
                      ⚠️ Rain spike detected at Lap {strategy.rain_spike.spike_lap}
                    </p>
                    <p className="text-white mt-1">
                      Make pitstop before it
                    </p>
                  </div>
                </div>
              )}

              {/* True Confidence Level */}
              <Card title="Confidence Level" icon={TrendingUp}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold uppercase">
                      {strategy.confidence}
                    </span>
                    <span className="text-racing-accent font-bold">
                      {strategy.confidence_value ? `${(strategy.confidence_value * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>
                  <div className="w-full bg-racing-dark rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        strategy.confidence === 'very high' ? 'bg-green-500' :
                        strategy.confidence === 'high' ? 'bg-green-400' :
                        strategy.confidence === 'medium' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{
                        width: strategy.confidence_value 
                          ? `${strategy.confidence_value * 100}%` 
                          : strategy.confidence === 'very high' ? '90%' :
                            strategy.confidence === 'high' ? '75%' :
                            strategy.confidence === 'medium' ? '60%' : '40%'
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Based on weather variance, track stability, and tyre degradation prediction
                  </p>
                </div>
              </Card>

              {/* Enhanced Tire Compound Guide */}
              <Card title="Tyre Compound Guide" icon={TrendingUp}>
                <div className="space-y-2">
                  {tireCompounds.map((tire) => {
                    const isCurrent = raceData.current_tire === tire.value;
                    const isRecommended = isRecommendedTire(tire.value);
                    
                    return (
                      <div
                        key={tire.value}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                          isCurrent && isRecommended
                            ? 'bg-racing-accent/30 border-2 border-racing-accent shadow-lg shadow-racing-accent/50'
                            : isCurrent
                            ? 'bg-blue-500/20 border-2 border-blue-500'
                            : isRecommended
                            ? 'bg-green-500/20 border-2 border-green-500 shadow-md shadow-green-500/30'
                            : 'bg-racing-dark border border-racing-gray'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${tire.color} ${isRecommended ? 'ring-2 ring-green-400' : ''}`}></div>
                          <span className={`${isCurrent || isRecommended ? 'text-white font-bold' : 'text-gray-400'}`}>
                            {tire.label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCurrent && (
                            <span className="text-xs bg-blue-500 text-white font-bold px-2 py-1 rounded">
                              CURRENT
                            </span>
                          )}
                          {isRecommended && (
                            <span className="text-xs bg-green-500 text-white font-bold px-2 py-1 rounded">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Action Items */}
              <Card title="Action Items" icon={Settings}>
                <ul className="space-y-3">
                  {strategy.action === 'PIT NOW' && (
                    <>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-racing-red rounded-full mt-2"></div>
                        <p className="text-white">Box this lap for tire change</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-racing-red rounded-full mt-2"></div>
                        <p className="text-white">Prepare {strategy.recommended_tire} compound</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-racing-red rounded-full mt-2"></div>
                        <p className="text-white">Inform pit crew immediately</p>
                      </li>
                    </>
                  )}
                  {(strategy.action === 'PREPARE' || strategy.action === 'PIT SOON') && (
                    <>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <p className="text-white">Monitor weather conditions closely</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <p className="text-white">Have {strategy.recommended_tire} ready</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <p className="text-white">Be ready to pit around lap {strategy.estimated_lap}</p>
                      </li>
                    </>
                  )}
                  {(strategy.action === 'CONTINUE' || strategy.action === 'MONITOR') && (
                    <>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <p className="text-white">Continue current strategy</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <p className="text-white">Plan pit stop for lap {strategy.estimated_lap}</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <p className="text-white">Prepare {strategy.recommended_tire} for next stop</p>
                      </li>
                    </>
                  )}
                  {strategy.action === 'STAY OUT' && (
                    <>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                        <p className="text-white">Stay out on current tires</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                        <p className="text-white">Current strategy is optimal</p>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                        <p className="text-white">Continue monitoring conditions</p>
                      </li>
                    </>
                  )}
                </ul>
              </Card>
            </div>
          ) : (
            <Card title="Awaiting Strategy Calculation" icon={Settings}>
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  AI-powered strategy ready to calculate
                </p>
                <p className="text-sm text-gray-500">
                  The system will automatically sync rain probability and provide optimal pitstop recommendations
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pitstop;
