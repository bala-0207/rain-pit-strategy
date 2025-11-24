import React, { useState, useEffect } from 'react';
import { Settings, Flag, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import { strategyAPI, predictionAPI, weatherAPI } from '../api';

const Pitstop = () => {
  const [raceData, setRaceData] = useState({
    current_lap: 1,
    total_laps: 50,
    current_tire: 'soft',
    rain_probability: 0,
  });

  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentPrediction();
  }, []);

  const loadCurrentPrediction = async () => {
    try {
      const weatherRes = await weatherAPI.getCurrentWeather();
      if (weatherRes.success) {
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

  const handleCalculateStrategy = async () => {
    setLoading(true);
    try {
      const res = await strategyAPI.getPitstopStrategy(raceData);
      if (res.success) {
        setStrategy(res.strategy);
      }
    } catch (err) {
      console.error('Strategy calculation error:', err);
      alert('Failed to calculate strategy. Make sure backend is running.');
    }
    setLoading(false);
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

  const tireCompounds = [
    { value: 'soft', label: 'Soft (Red)', color: 'bg-red-500' },
    { value: 'medium', label: 'Medium (Yellow)', color: 'bg-yellow-500' },
    { value: 'hard', label: 'Hard (White)', color: 'bg-white' },
    { value: 'intermediate', label: 'Intermediate (Green)', color: 'bg-green-500' },
    { value: 'wet', label: 'Full Wet (Blue)', color: 'bg-blue-500' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Pit Stop Strategy</h1>
        <p className="text-gray-400">Optimize your pit stop timing based on race conditions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <Card title="Race Parameters" icon={Flag}>
            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Rain Probability
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={raceData.rain_probability * 100}
                    onChange={(e) =>
                      handleInputChange('rain_probability', parseFloat(e.target.value) / 100)
                    }
                    className="flex-1"
                  />
                  <span className="text-white font-bold w-16 text-right">
                    {(raceData.rain_probability * 100).toFixed(0)}%
                  </span>
                </div>
                <button
                  onClick={loadCurrentPrediction}
                  className="racing-button-secondary text-sm py-2 px-4 mt-2"
                >
                  Load Current Prediction
                </button>
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
              {/* Main Recommendation */}
              <Card
                title="Pit Strategy Recommendation"
                icon={Settings}
                badge={strategy.urgency}
              >
                <div className="space-y-4">
                  <div className="text-center py-6 border-b border-racing-gray">
                    <div className={`text-5xl font-bold mb-4 ${getUrgencyColor(strategy.urgency)}`}>
                      {strategy.action}
                    </div>
                    <p className="text-xl text-white mb-2">{strategy.recommended_tire}</p>
                    <span className={`px-4 py-2 rounded-lg font-bold ${getUrgencyBg(strategy.urgency)} text-white inline-block`}>
                      {strategy.urgency} URGENCY
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-2">Strategic Reasoning</p>
                    <p className="text-white">{strategy.reasoning}</p>
                  </div>

                  {strategy.estimated_lap && (
                    <div className="stat-card">
                      <p className="text-sm text-gray-400">Recommended Pit Lap</p>
                      <p className="text-3xl font-bold text-racing-accent">
                        Lap {strategy.estimated_lap}
                      </p>
                    </div>
                  )}

                  {strategy.stint_length && (
                    <div className="stat-card">
                      <p className="text-sm text-gray-400">Expected Stint Length</p>
                      <p className="text-2xl font-bold text-white">
                        {strategy.stint_length} laps
                      </p>
                    </div>
                  )}

                  {strategy.confidence && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Confidence Level</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-racing-dark rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              strategy.confidence === 'high' ? 'bg-green-500' :
                              strategy.confidence === 'medium' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{
                              width:
                                strategy.confidence === 'high' ? '90%' :
                                strategy.confidence === 'medium' ? '60%' : '30%',
                            }}
                          ></div>
                        </div>
                        <span className="text-white font-bold uppercase">
                          {strategy.confidence}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Action Items */}
              <Card title="Action Items" icon={AlertTriangle}>
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
                  {strategy.action === 'PREPARE' && (
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
                  {strategy.action === 'CONTINUE' && (
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
                </ul>
              </Card>

              {/* Tire Strategy Visual */}
              <Card title="Tire Compound Guide" icon={TrendingUp}>
                <div className="space-y-2">
                  {tireCompounds.map((tire) => (
                    <div
                      key={tire.value}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        raceData.current_tire === tire.value
                          ? 'bg-racing-accent/20 border border-racing-accent'
                          : 'bg-racing-dark'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${tire.color}`}></div>
                        <span className="text-white">{tire.label}</span>
                      </div>
                      {raceData.current_tire === tire.value && (
                        <span className="text-xs bg-racing-accent text-racing-dark font-bold px-2 py-1 rounded">
                          CURRENT
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card title="Awaiting Strategy Calculation" icon={Settings}>
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  Enter race parameters and click "Calculate Pit Strategy" to get recommendations
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
