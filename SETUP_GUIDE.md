# 🚀 SETUP AND RUN GUIDE

## Complete Installation Guide for Windows

### Step 1: Backend Setup

1. Open Command Prompt or PowerShell

2. Navigate to the backend directory:
```bash
cd C:\CHAINAIM3003\mcp-servers\Projects\rain-pit-strategy-ai\backend
```

3. Install Python dependencies:
```bash
pip install -r ..\requirements.txt
```

If you get SSL errors, use:
```bash
pip install -r ..\requirements.txt --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org
```

4. Start the backend server:
```bash
python app.py
```

You should see:
```
🏎️  Rain Pit Strategy AI - Backend Server
Server starting on http://localhost:5000
```

**Keep this terminal open!** The backend must run continuously.

---

### Step 2: Frontend Setup

1. Open a NEW Command Prompt or PowerShell window

2. Navigate to the frontend directory:
```bash
cd C:\CHAINAIM3003\mcp-servers\Projects\rain-pit-strategy-ai\frontend
```

3. Install Node.js dependencies:
```bash
npm install
```

This will take a few minutes to download all packages.

4. Start the development server:
```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

5. Open your browser and go to: **http://localhost:3000**

---

## ✅ Verification Checklist

### Backend is Running
- [ ] Terminal shows "Server starting on http://localhost:5000"
- [ ] No error messages about missing packages
- [ ] Visit http://localhost:5000/api/health in browser - should show JSON response

### Frontend is Running
- [ ] Terminal shows "Local: http://localhost:3000"
- [ ] Browser opens to the dashboard
- [ ] You see the "Rain Pit Strategy AI" header
- [ ] Weather data loads on the dashboard

---

## 🎯 First Time Usage

### Step 1: Check Dashboard
1. Open http://localhost:3000
2. You should see:
   - Current weather metrics
   - Rain prediction alert
   - Temperature and humidity charts
   - Weather analytics

### Step 2: Try Strategy Analyzer
1. Click "Strategy" in the navigation
2. Weather inputs should be pre-loaded
3. Click "Analyze Strategy"
4. View AI predictions and recommendations

### Step 3: Test Pit Stop Calculator
1. Click "Pit Stop" in navigation
2. Enter race parameters (or use defaults)
3. Click "Calculate Pit Strategy"
4. Review pit stop recommendations

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem**: `ModuleNotFoundError: No module named 'flask'`
**Solution**: Install dependencies again:
```bash
pip install flask flask-cors pandas numpy scikit-learn joblib
```

**Problem**: Port 5000 already in use
**Solution**: Kill the process or change port in `backend/app.py` line 285:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change to 5001
```
Then update frontend `src/api.js` line 3:
```javascript
const API_BASE_URL = 'http://localhost:5001/api';
```

### Frontend Won't Start

**Problem**: `npm: command not found`
**Solution**: Install Node.js from https://nodejs.org/

**Problem**: Dependencies won't install
**Solution**: Clear cache and retry:
```bash
npm cache clean --force
npm install
```

**Problem**: Blank page or errors
**Solution**: Check browser console (F12) for errors. Make sure backend is running.

### Data Not Loading

**Problem**: Dashboard shows "Failed to fetch data"
**Solution**: 
1. Verify backend is running on port 5000
2. Check http://localhost:5000/api/health
3. Open browser DevTools (F12) → Network tab
4. Refresh page and check for failed API calls

---

## 📱 Application Features

### 1. Dashboard (Home)
- **Real-time weather monitoring**
- **Rain probability predictions**
- **Interactive charts**
- **Weather analytics**

### 2. Strategy Analyzer
- **Custom weather inputs**
- **AI rain predictions**
- **Risk level assessment**
- **Tire recommendations**

### 3. Pit Stop Calculator
- **Lap-based strategy**
- **Tire compound selection**
- **Pit timing optimization**
- **Urgency indicators**

---

## 🎨 UI Color Guide

- **Red (#DC0000)**: High urgency, rain risk
- **Yellow (#FFEB3B)**: Medium risk, caution
- **Green (#4CAF50)**: Low risk, safe conditions
- **Cyan (#00D9FF)**: Accent, highlights
- **Dark (#15151E)**: Background
- **Gray (#38383F)**: Cards, containers

---

## 💾 Model Information

The ML model automatically trains on first run using `data/raindata.csv`:
- **Total Samples**: ~44 weather readings
- **Features**: 8 engineered weather indicators
- **Algorithm**: Random Forest with 200 trees
- **Training Time**: ~1-2 seconds

Model is saved in `backend/model_data/` for instant loading on subsequent runs.

---

## 🔄 Updating the Application

### Update Weather Data
1. Replace `data/raindata.csv` with new data
2. Delete `backend/model_data/` folder
3. Restart backend - model will retrain automatically

### Modify Predictions
Edit `backend/model.py` to adjust:
- Feature engineering (line 21-40)
- Model parameters (line 72-80)
- Prediction thresholds

### Customize UI
Edit files in `frontend/src/`:
- `index.css` - Colors and styles
- `pages/*.jsx` - Page layouts
- `components/*.jsx` - Component designs

---

## 📊 API Testing

### Using Browser
Test endpoints directly:
- http://localhost:5000/api/health
- http://localhost:5000/api/weather/current
- http://localhost:5000/api/analytics/summary

### Using Postman or curl

**Predict Rain:**
```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d "{\"air_temp\":28.5,\"track_temp\":42.0,\"humidity\":65.0,\"pressure\":993.0,\"wind_speed\":15.0,\"wind_direction\":150}"
```

**Pit Strategy:**
```bash
curl -X POST http://localhost:5000/api/strategy/pitstop \
  -H "Content-Type: application/json" \
  -d "{\"rain_probability\":0.65,\"current_lap\":15,\"total_laps\":50,\"current_tire\":\"soft\"}"
```

---

## 🎓 Learning Resources

### Understanding the Code

**Backend (Python)**:
- `model.py` - ML model training and prediction
- `app.py` - API routes and business logic

**Frontend (React)**:
- `src/App.jsx` - Main app structure
- `src/pages/Dashboard.jsx` - Weather dashboard
- `src/pages/Strategy.jsx` - Strategy analyzer
- `src/pages/Pitstop.jsx` - Pit stop calculator

### Key Technologies
- **Flask**: Python web framework
- **scikit-learn**: Machine learning library
- **React**: UI framework
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS

---

## ✨ Next Steps

1. **Explore the Dashboard**: View real-time weather data
2. **Test Predictions**: Try different weather scenarios
3. **Optimize Strategy**: Calculate pit stop timing
4. **Customize**: Modify colors, add features
5. **Learn**: Study the ML model implementation

---

## 📞 Need Help?

- Check terminal outputs for error messages
- Review browser console (F12) for frontend errors
- Verify both servers are running simultaneously
- Ensure ports 3000 and 5000 are not blocked by firewall

**Happy Racing! 🏁**
