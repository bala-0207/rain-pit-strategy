# 🌐 LIVE WEATHER SETUP GUIDE

## Get Real-Time Weather from Circuit of the Americas (Austin, Texas)

Your app is now configured to fetch **LIVE weather** from the Circuit of the Americas F1 track in Austin, Texas!

---

## 📋 Quick Setup (5 Minutes)

### Step 1: Get Free OpenWeatherMap API Key

1. **Go to:** https://openweathermap.org/api

2. **Click "Sign Up"** (top right)

3. **Fill in the form:**
   - Email: your@email.com
   - Username: (anything you want)
   - Password: (create a password)

4. **Verify your email** (check inbox/spam)

5. **Go to API Keys** (in your dashboard)

6. **Copy your API key** (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

---

### Step 2: Add API Key to Your App

**Option A: Quick Test (Temporary)**

1. Open: `backend/app.py`

2. Find line 22:
   ```python
   WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
   ```

3. Replace with your key:
   ```python
   WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')
   ```

4. Find line 26:
   ```python
   USE_LIVE_WEATHER = False
   ```

5. Change to:
   ```python
   USE_LIVE_WEATHER = True
   ```

6. **Save the file**

---

**Option B: Best Practice (Recommended - Environment Variable)**

1. **Windows PowerShell:**
   ```powershell
   $env:OPENWEATHER_API_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
   ```

2. **Or create a .env file** in the backend folder:
   ```
   OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

3. **Update app.py line 26:**
   ```python
   USE_LIVE_WEATHER = True
   ```

---

### Step 3: Restart Backend

```powershell
cd C:\CHAINAIM3003\mcp-servers\Projects\rain-pit-strategy-ai\backend
python app.py
```

**You should see:**
```
✓ Live weather fetched from COTA: 18.5°C, 65% humidity
```

---

## ✅ How to Verify It's Working

### Check Backend Terminal:
Look for this message every 30 seconds:
```
✓ Live weather fetched from COTA: 18.5°C, 65% humidity
```

### Check Dashboard:
- **Top of dashboard** should show: "📍 Circuit of the Americas, Austin, Texas"
- Weather data updates every 30 seconds with REAL conditions
- Rain probability changes based on actual weather in Austin!

### Test API Directly:
Open browser: http://localhost:5000/api/health

Should show:
```json
{
  "status": "healthy",
  "live_weather_enabled": true,
  "location": "Circuit of the Americas, Austin, Texas"
}
```

---

## 🌍 Current Location

**Track:** Circuit of the Americas (COTA)  
**City:** Austin, Texas, USA  
**Coordinates:** 30.1328°N, 97.6411°W  
**Famous Race:** United States Grand Prix

---

## 🔄 How Live Weather Works

**Every 30 seconds:**
1. App calls OpenWeatherMap API
2. Gets current weather for Austin, Texas
3. Extracts: temperature, humidity, pressure, wind
4. Calculates track temperature (air temp + 12°C)
5. Feeds to AI model
6. Displays rain probability
7. Updates strategy recommendations

---

## 📊 What You'll See

**Before (Static Data):**
- Always shows same weather from CSV
- Rain probability never changes

**After (Live Weather):**
- Shows REAL current conditions in Austin
- Rain probability changes based on actual weather
- Track temperature calculated from air temp
- Wind speed and direction from real data

**Example:**
```
Right now in Austin, Texas:
🌡️ Air: 22°C  Track: 34°C
💧 Humidity: 68%
🌪️ Wind: 15 km/h from 180°
🌧️ Rain Probability: 35% (Medium risk)
```

---

## 💰 API Limits (Free Tier)

**OpenWeatherMap Free:**
- ✅ 1,000 calls per day
- ✅ Updates every 30 seconds = 2,880 calls/day

**Solution:**
- Change refresh to 60 seconds = 1,440 calls/day ✅
- Or update every 2 minutes = 720 calls/day (plenty!)

**To adjust refresh rate:**
Edit `frontend/src/pages/Dashboard.jsx` line 18:
```javascript
const interval = setInterval(fetchData, 60000); // 60 seconds instead of 30
```

---

## 🆓 Alternative Free APIs (If Needed)

### WeatherAPI.com
- **Free tier:** 1,000,000 calls/month
- **Setup:** Similar to OpenWeatherMap
- **URL:** https://www.weatherapi.com/

### Tomorrow.io
- **Free tier:** 500 calls/day
- **More accurate:** Hyperlocal weather
- **URL:** https://www.tomorrow.io/

---

## 🐛 Troubleshooting

**Problem:** "Weather API error: 401"  
**Solution:** Invalid API key - check you copied it correctly

**Problem:** "Weather API error: 429"  
**Solution:** Too many requests - increase refresh interval

**Problem:** Still showing dataset weather  
**Solution:** Check `USE_LIVE_WEATHER = True` in app.py line 26

**Problem:** No weather updates  
**Solution:** 
1. Check internet connection
2. Verify API key is active (can take 10 mins after signup)
3. Check terminal for error messages

---

## 🎯 What Changes Were Made

### Backend Changes:
1. ✅ Added OpenWeatherMap API integration
2. ✅ Configured for Circuit of the Americas coordinates
3. ✅ Auto-calculates track temperature (air + 12°C)
4. ✅ Converts wind speed to km/h
5. ✅ Falls back to CSV data if API unavailable

### Pit Stop Intelligence:
1. ✅ Tire-specific degradation rates (soft/medium/hard)
2. ✅ Rain-adjusted pit timing
3. ✅ Emergency strategies (80%+ rain = PIT NOW!)
4. ✅ Conservative strategies (20-40% rain)
5. ✅ Race-end logic (don't pit in last 5 laps)

---

## 🏁 You're All Set!

Once you add the API key and restart:
- **Real weather** from Austin, Texas
- **Dynamic rain predictions**
- **Intelligent pit strategies**
- **Professional racing tool** 🏎️

Enjoy your intelligent F1 strategy system!
