# 🏎️ Rain Pit Strategy AI

An intelligent racing strategy application that uses Machine Learning to predict rain and optimize pit stop decisions in real-time.

## 🌟 Features

### Backend (Python + Flask)
- **Real ML Model**: Random Forest classifier trained on actual weather data
- **Feature Engineering**: Advanced weather pattern analysis
- **RESTful API**: 6 endpoints for predictions, weather data, and strategy
- **Real-time Analysis**: Live rain probability calculations

### Frontend (React + Vite)
- **Live Dashboard**: Real-time weather monitoring with professional charts
- **Strategy Analyzer**: AI-powered race strategy recommendations
- **Pit Stop Calculator**: Intelligent pit timing optimization
- **Professional UI**: F1-style racing theme with smooth animations

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r ../requirements.txt
```

3. Run the backend server:
```bash
python app.py
```

Backend runs on **http://localhost:5000**

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend runs on **http://localhost:3000**

## 📊 API Endpoints

### Weather Endpoints
- `GET /api/weather/current` - Get latest weather data
- `GET /api/weather/history?limit=50` - Get historical data
- `GET /api/analytics/summary` - Get weather analytics

### Prediction Endpoints
- `POST /api/predict` - Predict rain probability
  ```json
  {
    "air_temp": 28.5,
    "track_temp": 42.0,
    "humidity": 65.0,
    "pressure": 993.0,
    "wind_speed": 15.0,
    "wind_direction": 150
  }
  ```

### Strategy Endpoints
- `POST /api/strategy/pitstop` - Calculate pit stop strategy
  ```json
  {
    "rain_probability": 0.65,
    "current_lap": 15,
    "total_laps": 50,
    "current_tire": "soft"
  }
  ```

### Health Check
- `GET /api/health` - Server health status

## 🧠 Machine Learning Model

### Model Architecture
- **Algorithm**: Random Forest Classifier
- **Features**: 8 engineered features including:
  - Air & Track Temperature
  - Humidity & Pressure
  - Wind Speed & Direction
  - Temperature Differential
  - Humidity-Pressure Ratio

### Training
The model trains automatically on first run using the weather dataset in `data/raindata.csv`.

To retrain manually:
```bash
cd backend
python model.py
```

## 📁 Project Structure

```
rain-pit-strategy-ai/
├── backend/
│   ├── app.py              # Flask API server
│   ├── model.py            # ML model implementation
│   └── model_data/         # Saved model files
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Dashboard, Strategy, Pitstop
│   │   ├── api.js          # API service
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── raindata.csv        # Weather training data
└── requirements.txt        # Python dependencies
```

## 🎨 UI Features

### Dashboard
- Real-time weather metrics
- Interactive temperature and humidity charts
- Rain prediction alerts
- Weather analytics summary

### Strategy Analyzer
- Custom weather input
- AI-powered predictions
- Risk level assessment
- Tire recommendations

### Pit Stop Calculator
- Lap-by-lap strategy
- Tire compound optimization
- Urgency-based recommendations
- Race progress tracking

## 🛠️ Technology Stack

### Backend
- Flask - Web framework
- scikit-learn - Machine learning
- pandas - Data processing
- NumPy - Numerical computing

### Frontend
- React 18 - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- Recharts - Data visualization
- React Router - Navigation
- Axios - HTTP client

## 📈 Model Performance

The ML model is trained with:
- **Class Balancing**: Handles imbalanced rain/no-rain data
- **Feature Importance Analysis**: Identifies key weather indicators
- **Cross-validation**: Ensures generalization

## 🎯 Use Cases

1. **Race Strategy Teams**: Real-time pit stop optimization
2. **Weather Analysis**: Track weather pattern trends
3. **Training Tool**: Learn optimal racing strategies
4. **Simulation**: Test different weather scenarios

## 🔧 Development

### Run Backend Tests
```bash
cd backend
python model.py
```

### Build Frontend for Production
```bash
cd frontend
npm run build
```

## 📝 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📞 Support

For issues or questions, please open an issue on the repository.

---

**Built with ❤️ for racing enthusiasts and data scientists**
