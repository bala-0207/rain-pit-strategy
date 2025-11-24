# 🏎️ Rain Pit Strategy AI

A Formula 1 racing strategy application that uses machine learning to predict rain probability and recommend optimal pit stop timing with intelligent tire selection.

![Project Status](https://img.shields.io/badge/status-live-success)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18.0-61dafb)
![Flask](https://img.shields.io/badge/flask-3.1-black)

## 🌐 Live Demo

- **Frontend:** https://rain-pit-strategy-ui.onrender.com
- **Backend API:** https://rain-pit-strategy.onrender.com

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 About

Rain Pit Strategy AI is an intelligent racing strategy tool that combines real-time weather monitoring, machine learning predictions, and strategic pit stop recommendations. Built for Formula 1 race engineers and enthusiasts, it helps make data-driven decisions about tire changes and pit stop timing based on weather conditions.

## ✨ Features

### 🌤️ Dashboard
- **Live Weather Monitoring** with real-time data updates
- **Rain Probability Gauge** with ML-powered predictions
- **Confidence Levels** indicating prediction reliability
- **Weather Stats Cards** showing air temp, humidity, wind, and pressure
- **Auto-refresh** every 30 seconds (pauses during manual testing)
- **Visual Indicators** for data source (Live/Dataset/Manual Override)

### 🧪 Strategy Analyzer
- **Manual Weather Input** with interactive sliders
- **Scenario Testing** to experiment with different conditions
- **Instant Predictions** using trained ML model
- **Real-time Sync** across all pages when values change
- **Debug Display** showing exact data sent to backend

### 🏁 Pitstop Predictor
- **Smart Tire Selection** considering current tire and track conditions
- **Perfect Pitstop Timing** based on race position and weather
- **Lap Time Predictions** showing speed gains from tire changes
- **Wrong Tire Detection** flagging dangerous situations (dry tires in rain, wet tires in dry)
- **Optimal Compound Choice** (Soft/Medium/Hard for dry, Intermediate/Full Wet for rain)
- **Rain Spike Warnings** predicting when heavy rain will arrive
- **Confidence Scoring** based on weather stability

### 🔄 Shared Weather Context
- **Automatic Synchronization** across Dashboard, Strategy, and Pitstop pages
- **No Manual Switching** - intelligent data source detection
- **Page Refresh Reset** - F5 returns to live API data
- **Visual Badges** showing current data source on all pages

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first styling
- **Context API** - State management

### Backend
- **Flask 3.1** - Python web framework
- **scikit-learn** - Machine learning
- **pandas** - Data manipulation
- **NumPy** - Numerical computing
- **Gunicorn** - Production WSGI server

### ML Model
- **Random Forest Classifier** - Rain prediction
- **Feature Engineering** - Weather parameter analysis
- **Auto-retraining** - Updates on every server start
- **Confidence Calculation** - Reliability scoring

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Clone Repository

```bash
git clone https://github.com/bala-0207/rain-pit-strategy.git
cd rain-pit-strategy
```

## 💻 Installation

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python app.py
```

Backend will start at: `http://localhost:5000`

### Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start at: `http://localhost:3000`

## 📖 Usage

### Running Locally

1. **Start Backend:**
   ```bash
   cd backend
   python app.py
   ```
   Wait for "Model trained and ready!" message.

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Open browser to `http://localhost:3000`

3. **Navigate Pages:**
   - **Dashboard:** Monitor live weather and rain probability
   - **Strategy:** Test different weather scenarios manually
   - **Pitstop:** Get tire recommendations and pit stop timing

### Testing Weather Sync

1. Go to **Strategy** page
2. Adjust weather parameters (e.g., humidity to 95%)
3. Click **"Analyze Strategy"**
4. Switch to **Dashboard** → See values synced with orange badge
5. Switch to **Pitstop** → Rain probability updated automatically
6. Press **F5** → All pages reset to live data

### Testing Smart Tire Logic

**Scenario 1: Wrong tire in dry conditions**
- Pitstop page: Set Current Tire = "Intermediate", Current Lap = 10, Total Laps = 50
- Strategy page: Set Rain Probability low (humidity 50%, normal conditions)
- Click "Analyze Strategy"
- Go to Pitstop → Should recommend switching to Soft/Medium/Hard urgently

**Scenario 2: Wrong tire in wet conditions**
- Pitstop page: Set Current Tire = "Soft"
- Strategy page: Set high rain (humidity 95%, low pressure 985 hPa)
- Click "Analyze Strategy"
- Go to Pitstop → Should flag as DANGER and recommend Full Wet

## 📡 API Documentation

### Base URL
- Local: `http://localhost:5000`
- Production: `https://rain-pit-strategy.onrender.com`

### Endpoints

#### Health Check
```http
GET /api/health
```
Returns server status and model info.

#### Current Weather
```http
GET /api/weather/current
```
Returns latest weather data (live API or dataset).

#### Weather History
```http
GET /api/weather/history?limit=50
```
Returns historical weather readings.

#### Rain Prediction
```http
POST /api/predict
Content-Type: application/json

{
  "air_temp": 28.5,
  "track_temp": 35.2,
  "humidity": 65.0,
  "pressure": 1013.0,
  "wind_speed": 12.5,
  "wind_direction": 180
}
```
Returns rain probability and confidence.

#### Pitstop Strategy
```http
POST /api/strategy/pitstop
Content-Type: application/json

{
  "rain_probability": 0.45,
  "current_lap": 20,
  "total_laps": 50,
  "current_tire": "soft",
  "weather_data": {
    "humidity": 65,
    "wind_speed": 12.5
  }
}
```
Returns optimal pit stop strategy with tire recommendation.


## 🗺️ Roadmap

- [ ] Add historical race analysis
- [ ] Implement real-time telemetry integration
- [ ] Add multi-track support
- [ ] Create mobile app version
- [ ] Add user authentication
- [ ] Implement strategy comparison tools
- [ ] Add race simulation mode

---

**Built with ❤️ for F1 enthusiasts and data science lovers**

⭐ Star this repo if you find it useful!


