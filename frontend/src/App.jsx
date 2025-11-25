import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WeatherProvider } from './context/WeatherContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Strategy from './pages/Strategy';
import Pitstop from './pages/Pitstop';

function App() {
  return (
    <Router>
      <WeatherProvider>
        <div className="min-h-screen bg-racing-dark">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/pitstop" element={<Pitstop />} />
          </Routes>
        </div>
      </WeatherProvider>
    </Router>
  );
}

export default App;
