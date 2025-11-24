import React, { createContext, useContext, useState, useEffect } from 'react';
import { weatherAPI } from '../api';

const WeatherContext = createContext();

export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (!context) {
        throw new Error('useWeather must be used within WeatherProvider');
    }
    return context;
};

export const WeatherProvider = ({ children }) => {
    const [weatherData, setWeatherData] = useState(null);
    const [source, setSource] = useState('api'); // 'api' or 'strategy'
    const [timestamp, setTimestamp] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch real API data
    const fetchRealWeather = async () => {
        setLoading(true);
        try {
            const res = await weatherAPI.getCurrentWeather();
            if (res.success) {
                setWeatherData(res.data);
                setSource('api');
                setTimestamp(new Date().toISOString());
            }
        } catch (err) {
            console.error('Error fetching weather:', err);
        }
        setLoading(false);
    };

    // Update weather data from Strategy page manual input
    const updateWeatherFromStrategy = (data) => {
        setWeatherData({
            air_temp: data.air_temp,
            track_temp: data.track_temp,
            humidity: data.humidity,
            pressure: data.pressure,
            wind_speed: data.wind_speed,
            wind_direction: data.wind_direction,
        });
        setSource('strategy');
        setTimestamp(new Date().toISOString());
    };

    // Reset to API data (on refresh or manual reset)
    const resetToAPI = () => {
        fetchRealWeather();
    };

    // Load real weather on mount
    useEffect(() => {
        fetchRealWeather();
    }, []);

    const value = {
        weatherData,
        source,
        timestamp,
        loading,
        fetchRealWeather,
        updateWeatherFromStrategy,
        resetToAPI,
    };

    return (
        <WeatherContext.Provider value={value}>
            {children}
        </WeatherContext.Provider>
    );
};
