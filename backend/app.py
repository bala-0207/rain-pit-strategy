from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from model import RainPredictionModel
import os
from datetime import datetime
import requests
from typing import Optional

app = Flask(__name__)
CORS(app)

# Initialize model
rain_model = RainPredictionModel()

# Load or train model on startup
MODEL_PATH = 'model_data'
DATA_PATH = os.path.join('..', 'data', 'raindata.csv')

# Weather API Configuration for Circuit of the Americas (Austin, Texas)
WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
COTA_LAT = 30.1328
COTA_LON = -97.6411
COTA_LOCATION = 'Circuit of the Americas, Austin, Texas'
USE_LIVE_WEATHER = False

# FORCE RETRAIN TO FIX PREDICTIONS
try:
    print("=" * 60)
    print("🔄 RETRAINING MODEL WITH LATEST DATA...")
    print("=" * 60)
    rain_model.train(DATA_PATH)
    rain_model.save_model(MODEL_PATH)
    print("=" * 60)
    print("✓ Model trained and ready!")
    print("=" * 60)
except Exception as e:
    print(f"⚠ Model initialization error: {e}")
    import traceback
    traceback.print_exc()

def fetch_live_weather_cota() -> Optional[dict]:
    """Fetch live weather from Circuit of the Americas (Austin, Texas)"""
    try:
        if not USE_LIVE_WEATHER or WEATHER_API_KEY == 'YOUR_API_KEY_HERE':
            return None
        
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            'lat': COTA_LAT,
            'lon': COTA_LON,
            'appid': WEATHER_API_KEY,
            'units': 'metric'
        }
        
        response = requests.get(url, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            weather = {
                'air_temp': float(data['main']['temp']),
                'track_temp': float(data['main']['temp']) + 12.0,
                'humidity': float(data['main']['humidity']),
                'pressure': float(data['main']['pressure']),
                'wind_speed': float(data['wind']['speed']) * 3.6,
                'wind_direction': float(data['wind'].get('deg', 0)),
                'rain': 1 if 'rain' in data else 0,
                'weather_description': data['weather'][0]['description'],
                'location': COTA_LOCATION,
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"✓ Live weather fetched from COTA: {weather['air_temp']}°C, {weather['humidity']}% humidity")
            return weather
        else:
            print(f"⚠ Weather API error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"⚠ Error fetching live weather: {e}")
        return None

def calculate_confidence(rain_prob, humidity=None, wind_speed=None):
    """Calculate true confidence based on weather variance and track stability"""
    confidence_value = 0.85  # Base confidence
    
    # Reduce confidence for moderate rain probabilities (uncertain conditions)
    if 0.3 < rain_prob < 0.7:
        confidence_value -= 0.20
    
    # Reduce confidence for high humidity variance
    if humidity and (humidity > 85 or humidity < 30):
        confidence_value -= 0.10
    
    # Reduce confidence for high wind (variable conditions)
    if wind_speed and wind_speed > 25:
        confidence_value -= 0.15
    
    confidence_value = max(0.3, min(0.95, confidence_value))
    
    if confidence_value >= 0.80:
        return 'very high', confidence_value
    elif confidence_value >= 0.65:
        return 'high', confidence_value
    elif confidence_value >= 0.50:
        return 'medium', confidence_value
    else:
        return 'low', confidence_value

def detect_rain_spike(rain_prob, current_lap):
    """Detect if there's an upcoming rain spike"""
    spike_lap = None
    spike_detected = False
    
    # Simulate rain spike detection based on probability jump
    # In a real system, this would analyze weather forecast trends
    if 0.45 < rain_prob < 0.65:
        # Moderate probability suggests spike may occur soon
        spike_lap = current_lap + np.random.randint(3, 8)
        spike_detected = True
    elif rain_prob > 0.75:
        # High probability suggests spike is imminent or happening
        spike_lap = current_lap + 1
        spike_detected = True
    
    return {
        'detected': spike_detected,
        'spike_lap': spike_lap
    }

def estimate_lap_time(tire_compound, rain_prob, track_condition='dry'):
    """Estimate expected lap time after pitstop"""
    # Base lap times for each compound (in seconds)
    base_lap_times = {
        'soft': 85.0,
        'medium': 86.5,
        'hard': 88.0,
        'intermediate': 90.0,
        'wet': 95.0
    }
    
    base_time = base_lap_times.get(tire_compound.split()[0].lower(), 86.0)
    
    # Adjust for conditions
    if track_condition == 'wet' and tire_compound.lower() in ['soft', 'medium', 'hard']:
        base_time += 8.0  # Dry tires on wet track are much slower
    elif track_condition == 'damp':
        if tire_compound.lower() == 'intermediate':
            base_time -= 1.5  # Intermediates excel on damp track
        elif tire_compound.lower() in ['soft', 'medium', 'hard']:
            base_time += 3.0  # Dry tires on damp track
    
    # Add variance based on rain probability
    if rain_prob > 0.6:
        base_time += np.random.uniform(0.5, 2.0)
    
    return round(base_time, 1)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': rain_model.model is not None,
        'live_weather_enabled': USE_LIVE_WEATHER,
        'location': COTA_LOCATION if USE_LIVE_WEATHER else 'Dataset only'
    })

@app.route('/', methods=['GET'])
def home():
    """Root endpoint - service info"""
    return jsonify({
        'service': 'Rain Pit Strategy AI - Backend',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'predict': '/api/predict (POST)',
            'current_weather': '/api/weather/current',
            'weather_history': '/api/weather/history',
            'pitstop_strategy': '/api/strategy/pitstop (POST)',
            'analytics': '/api/analytics/summary'
        },
        'documentation': 'Send POST requests to /api/predict or /api/strategy/pitstop',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predict', methods=['POST'])
def predict_rain():
    """Predict rain probability based on weather data"""
    try:
        data = request.get_json()
        
        required_fields = ['air_temp', 'track_temp', 'humidity', 'pressure', 'wind_speed', 'wind_direction']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        weather_data = {
            'AIR_TEMP': float(data['air_temp']),
            'TRACK_TEMP': float(data['track_temp']),
            'HUMIDITY': float(data['humidity']),
            'PRESSURE': float(data['pressure']),
            'WIND_SPEED': float(data['wind_speed']),
            'WIND_DIRECTION': float(data['wind_direction'])
        }
        
        result = rain_model.predict(weather_data)
        rain_prob = result['rain_probability']
        strategy = get_strategy_recommendation(rain_prob, weather_data)
        
        return jsonify({
            'success': True,
            'prediction': result,
            'strategy': strategy,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in /api/predict: {error_trace}")
        return jsonify({'error': str(e), 'success': False, 'trace': error_trace}), 500

@app.route('/api/weather/current', methods=['GET'])
def get_current_weather():
    """Get latest weather data"""
    try:
        live_weather = fetch_live_weather_cota()
        
        if live_weather:
            return jsonify({
                'success': True,
                'source': 'live',
                'location': COTA_LOCATION,
                'data': {
                    'timestamp': live_weather['timestamp'],
                    'air_temp': live_weather['air_temp'],
                    'track_temp': live_weather['track_temp'],
                    'humidity': live_weather['humidity'],
                    'pressure': live_weather['pressure'],
                    'wind_speed': live_weather['wind_speed'],
                    'wind_direction': live_weather['wind_direction'],
                    'rain': live_weather['rain'],
                    'weather_description': live_weather.get('weather_description', '')
                }
            })
        else:
            df = pd.read_csv(DATA_PATH, sep=';')
            latest = df.iloc[-1].to_dict()
            
            return jsonify({
                'success': True,
                'source': 'dataset',
                'location': 'Historical data',
                'data': {
                    'timestamp': latest['TIME_UTC_STR'],
                    'air_temp': float(latest['AIR_TEMP']),
                    'track_temp': float(latest['TRACK_TEMP']),
                    'humidity': float(latest['HUMIDITY']),
                    'pressure': float(latest['PRESSURE']),
                    'wind_speed': float(latest['WIND_SPEED']),
                    'wind_direction': float(latest['WIND_DIRECTION']),
                    'rain': int(latest['RAIN']),
                    'weather_description': ''
                }
            })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/weather/history', methods=['GET'])
def get_weather_history():
    """Get historical weather data"""
    try:
        limit = int(request.args.get('limit', 50))
        df = pd.read_csv(DATA_PATH, sep=';')
        history = df.tail(limit)
        
        data = []
        for _, row in history.iterrows():
            data.append({
                'timestamp': row['TIME_UTC_STR'],
                'time_seconds': int(row['TIME_UTC_SECONDS']),
                'air_temp': float(row['AIR_TEMP']),
                'track_temp': float(row['TRACK_TEMP']),
                'humidity': float(row['HUMIDITY']),
                'pressure': float(row['PRESSURE']),
                'wind_speed': float(row['WIND_SPEED']),
                'wind_direction': float(row['WIND_DIRECTION']),
                'rain': int(row['RAIN'])
            })
        
        return jsonify({
            'success': True,
            'data': data,
            'total_records': len(df)
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/strategy/pitstop', methods=['POST'])
def pitstop_strategy():
    """Calculate pit stop strategy with enhanced features"""
    try:
        data = request.get_json()
        
        rain_prob = float(data.get('rain_probability', 0))
        current_lap = int(data.get('current_lap', 1))
        total_laps = int(data.get('total_laps', 50))
        current_tire = data.get('current_tire', 'soft')
        
        # Get weather data if available
        weather_data = data.get('weather_data', {})
        humidity = weather_data.get('humidity')
        wind_speed = weather_data.get('wind_speed')
        
        strategy = calculate_pitstop_strategy(
            rain_prob, current_lap, total_laps, current_tire, humidity, wind_speed
        )
        
        return jsonify({
            'success': True,
            'strategy': strategy
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

def get_strategy_recommendation(rain_prob, weather_data):
    """Generate strategy recommendation"""
    
    if rain_prob > 0.7:
        risk_level = 'HIGH'
        recommendation = 'Prepare for wet conditions immediately'
        tire_choice = 'Intermediate or Full Wet'
        action = 'urgent'
    elif rain_prob > 0.4:
        risk_level = 'MEDIUM'
        recommendation = 'Monitor conditions closely, prepare wet tires'
        tire_choice = 'Keep Intermediate ready'
        action = 'caution'
    else:
        risk_level = 'LOW'
        recommendation = 'Continue with dry strategy'
        tire_choice = 'Soft/Medium/Hard compound'
        action = 'normal'
    
    humidity = weather_data['HUMIDITY']
    temp_diff = weather_data['AIR_TEMP'] - weather_data['TRACK_TEMP']
    
    notes = []
    if humidity > 70:
        notes.append('High humidity increases rain risk')
    if temp_diff < -10:
        notes.append('Track significantly warmer than air - favorable for dry tires')
    elif temp_diff > 0:
        notes.append('Air warmer than track - potential for cooling')
    
    if weather_data['WIND_SPEED'] > 20:
        notes.append('High wind speeds - expect variable conditions')
    
    return {
        'risk_level': risk_level,
        'rain_probability_percent': round(rain_prob * 100, 2),
        'recommendation': recommendation,
        'tire_choice': tire_choice,
        'action': action,
        'notes': notes
    }

def calculate_pitstop_strategy(rain_prob, current_lap, total_laps, current_tire, humidity=None, wind_speed=None):
    """Calculate optimal pit stop strategy - ENHANCED VERSION"""
    
    laps_remaining = total_laps - current_lap
    
    tire_life = {
        'soft': 15,
        'medium': 25,
        'hard': 35,
        'intermediate': 20,
        'wet': 25
    }
    
    # Calculate confidence
    confidence_label, confidence_value = calculate_confidence(rain_prob, humidity, wind_speed)
    
    # Detect rain spike
    rain_spike = detect_rain_spike(rain_prob, current_lap)
    
    # Determine track condition
    if rain_prob > 0.7:
        track_condition = 'wet'
    elif rain_prob > 0.4:
        track_condition = 'damp'
    else:
        track_condition = 'dry'
    
    # EMERGENCY: Very high rain (80-100%)
    if rain_prob > 0.8:
        if current_tire in ['soft', 'medium', 'hard']:
            next_tire = 'Full Wet'
            expected_lap_time = estimate_lap_time(next_tire, rain_prob, 'wet')
            
            return {
                'action': 'PIT NOW',
                'recommended_tire': next_tire,
                'urgency': 'CRITICAL',
                'reasoning': f'Rain spike detected at Lap {rain_spike["spike_lap"]}; pit before conditions worsen',
                'estimated_lap': current_lap + 1,
                'confidence': confidence_label,
                'confidence_value': confidence_value,
                'stint_length': 0,
                'expected_lap_time': expected_lap_time,
                'rain_spike': rain_spike
            }
        else:
            next_tire = 'Full Wet'
            expected_lap_time = estimate_lap_time(next_tire, rain_prob, track_condition)
            
            return {
                'action': 'STAY OUT',
                'recommended_tire': next_tire,
                'urgency': 'LOW',
                'reasoning': 'Already on wet tires - continue racing',
                'estimated_lap': min(current_lap + 20, total_laps - 2),
                'confidence': confidence_label,
                'confidence_value': confidence_value,
                'stint_length': 20,
                'expected_lap_time': expected_lap_time,
                'rain_spike': rain_spike
            }
    
    # HIGH URGENCY: High rain (60-80%)
    elif rain_prob > 0.6:
        if current_tire in ['soft', 'medium', 'hard']:
            urgent_pit_lap = current_lap + 2
            next_tire = 'Intermediate'
            expected_lap_time = estimate_lap_time(next_tire, rain_prob, 'damp')
            
            return {
                'action': 'PIT SOON',
                'recommended_tire': next_tire,
                'urgency': 'HIGH',
                'reasoning': f'Rain spike at Lap {rain_spike["spike_lap"]} detected; prepare for wet conditions',
                'estimated_lap': urgent_pit_lap,
                'confidence': confidence_label,
                'confidence_value': confidence_value,
                'stint_length': 2,
                'expected_lap_time': expected_lap_time,
                'rain_spike': rain_spike
            }
        else:
            next_tire = 'Intermediate'
            expected_lap_time = estimate_lap_time(next_tire, rain_prob, track_condition)
            
            return {
                'action': 'CONTINUE',
                'recommended_tire': next_tire,
                'urgency': 'LOW',
                'reasoning': 'Already prepared for wet conditions',
                'estimated_lap': min(current_lap + 18, total_laps - 2),
                'confidence': confidence_label,
                'confidence_value': confidence_value,
                'stint_length': 18,
                'expected_lap_time': expected_lap_time,
                'rain_spike': rain_spike
            }
    
    # MEDIUM URGENCY: Moderate rain (40-60%)
    elif rain_prob > 0.4:
        if current_tire in ['soft', 'medium', 'hard']:
            cautious_pit_lap = current_lap + 5
            next_tire = 'Intermediate'
            expected_lap_time = estimate_lap_time(next_tire, rain_prob, 'damp')
            
            return {
                'action': 'PREPARE',
                'recommended_tire': next_tire,
                'urgency': 'MEDIUM',
                'reasoning': f'Weather variance high; pit at Lap {cautious_pit_lap} if conditions worsen',
                'estimated_lap': min(cautious_pit_lap, total_laps - 3),
                'confidence': confidence_label,
                'confidence_value': confidence_value,
                'stint_length': 5,
                'expected_lap_time': expected_lap_time,
                'rain_spike': rain_spike
            }
        else:
            next_tire = current_tire
            expected_lap_time = estimate_lap_time(next_tire, rain_prob, track_condition)
            
            return {
                'action': 'MONITOR',
                'recommended_tire': next_tire,
                'urgency': 'LOW',
                'reasoning': 'Conditions uncertain, monitor weather closely',
                'estimated_lap': min(current_lap + 15, total_laps - 2),
                'confidence': confidence_label,
                'confidence_value': confidence_value,
                'stint_length': 15,
                'expected_lap_time': expected_lap_time,
                'rain_spike': rain_spike
            }
    
    # LOW RISK: Light rain (20-40%)
    elif rain_prob > 0.2:
        base_stint = tire_life.get(current_tire, 20)
        conservative_pit = current_lap + int(base_stint * 0.8)
        
        if current_tire == 'soft':
            next_tire = 'Medium'
        elif current_tire == 'medium':
            next_tire = 'Hard'
        else:
            next_tire = 'Medium'
        
        expected_lap_time = estimate_lap_time(next_tire, rain_prob, track_condition)
        
        return {
            'action': 'CONTINUE',
            'recommended_tire': next_tire,
            'urgency': 'LOW',
            'reasoning': f'Dry track optimal; switch to {next_tire} at Lap {conservative_pit}',
            'estimated_lap': min(conservative_pit, total_laps - 3),
            'confidence': confidence_label,
            'confidence_value': confidence_value,
            'stint_length': min(int(base_stint * 0.8), laps_remaining - 3),
            'expected_lap_time': expected_lap_time,
            'rain_spike': rain_spike
        }
    
    # MINIMAL RISK: Dry conditions (0-20%)
    else:
        base_stint = tire_life.get(current_tire, 20)
        optimal_pit_lap = current_lap + base_stint
        optimal_pit_lap = min(optimal_pit_lap, total_laps - 2)
        
        if laps_remaining <= 5:
            expected_lap_time = estimate_lap_time(current_tire, rain_prob, track_condition)
            
            return {
                'action': 'STAY OUT',
                'recommended_tire': current_tire,
                'urgency': 'NONE',
                'reasoning': f'Too few laps remaining; finish race on {current_tire} tires',
                'estimated_lap': total_laps,
                'confidence': confidence_label,
                'confidence_value': confidence_value,
                'stint_length': laps_remaining,
                'expected_lap_time': expected_lap_time,
                'rain_spike': rain_spike
            }
        
        if current_tire == 'soft':
            next_tire = 'Medium'
        elif current_tire == 'medium':
            next_tire = 'Hard'
        elif current_tire == 'hard':
            if laps_remaining > 30:
                next_tire = 'Medium'
            else:
                next_tire = 'Hard'
        else:
            next_tire = 'Soft'
        
        expected_lap_time = estimate_lap_time(next_tire, rain_prob, track_condition)
        
        return {
            'action': 'CONTINUE',
            'recommended_tire': next_tire,
            'urgency': 'LOW',
            'reasoning': f'Optimal conditions; pit at Lap {optimal_pit_lap} for {next_tire} compound',
            'estimated_lap': optimal_pit_lap,
            'confidence': confidence_label,
            'confidence_value': confidence_value,
            'stint_length': base_stint,
            'expected_lap_time': expected_lap_time,
            'rain_spike': rain_spike
        }

@app.route('/api/analytics/summary', methods=['GET'])
def analytics_summary():
    """Get analytics summary"""
    try:
        df = pd.read_csv(DATA_PATH, sep=';')
        
        summary = {
            'total_readings': len(df),
            'rain_events': int(df['RAIN'].sum()),
            'rain_percentage': float((df['RAIN'].sum() / len(df)) * 100),
            'avg_temperature': {
                'air': float(df['AIR_TEMP'].mean()),
                'track': float(df['TRACK_TEMP'].mean())
            },
            'avg_humidity': float(df['HUMIDITY'].mean()),
            'avg_pressure': float(df['PRESSURE'].mean()),
            'avg_wind_speed': float(df['WIND_SPEED'].mean()),
            'temperature_range': {
                'air_min': float(df['AIR_TEMP'].min()),
                'air_max': float(df['AIR_TEMP'].max()),
                'track_min': float(df['TRACK_TEMP'].min()),
                'track_max': float(df['TRACK_TEMP'].max())
            }
        }
        
        return jsonify({
            'success': True,
            'summary': summary
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("🏎️  Rain Pit Strategy AI - Enhanced Backend Server")
    print("=" * 50)
    print(f"Server starting on http://localhost:5000")
    print("Endpoints:")
    print("  GET  /api/health              - Health check")
    print("  POST /api/predict             - Rain prediction")
    print("  GET  /api/weather/current     - Current weather")
    print("  GET  /api/weather/history     - Weather history")
    print("  POST /api/strategy/pitstop    - Pit stop strategy (ENHANCED)")
    print("  GET  /api/analytics/summary   - Analytics summary")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
