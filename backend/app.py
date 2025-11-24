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
WEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')  # Get from environment or config
COTA_LAT = 30.1328  # Circuit of the Americas latitude
COTA_LON = -97.6411  # Circuit of the Americas longitude
COTA_LOCATION = 'Circuit of the Americas, Austin, Texas'
USE_LIVE_WEATHER = False  # Set to True when you have API key

try:
    if os.path.exists(MODEL_PATH):
        rain_model.load_model(MODEL_PATH)
        print("✓ Model loaded successfully")
    else:
        print("Training new model...")
        rain_model.train(DATA_PATH)
        rain_model.save_model(MODEL_PATH)
        print("✓ Model trained and saved")
except Exception as e:
    print(f"⚠ Model initialization: {e}")

def fetch_live_weather_cota() -> Optional[dict]:
    """Fetch live weather from Circuit of the Americas (Austin, Texas)"""
    try:
        if not USE_LIVE_WEATHER or WEATHER_API_KEY == 'YOUR_API_KEY_HERE':
            return None
        
        # OpenWeatherMap API endpoint
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            'lat': COTA_LAT,
            'lon': COTA_LON,
            'appid': WEATHER_API_KEY,
            'units': 'metric'  # Celsius
        }
        
        response = requests.get(url, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract relevant weather data
            weather = {
                'air_temp': float(data['main']['temp']),
                'track_temp': float(data['main']['temp']) + 12.0,  # Track usually 10-15°C hotter than air
                'humidity': float(data['main']['humidity']),
                'pressure': float(data['main']['pressure']),
                'wind_speed': float(data['wind']['speed']) * 3.6,  # Convert m/s to km/h
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

@app.route('/api/predict', methods=['POST'])
def predict_rain():
    """
    Predict rain probability based on weather data
    Expected JSON: {
        "air_temp": float,
        "track_temp": float,
        "humidity": float,
        "pressure": float,
        "wind_speed": float,
        "wind_direction": float
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['air_temp', 'track_temp', 'humidity', 'pressure', 'wind_speed', 'wind_direction']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Prepare data for prediction
        weather_data = {
            'AIR_TEMP': float(data['air_temp']),
            'TRACK_TEMP': float(data['track_temp']),
            'HUMIDITY': float(data['humidity']),
            'PRESSURE': float(data['pressure']),
            'WIND_SPEED': float(data['wind_speed']),
            'WIND_DIRECTION': float(data['wind_direction'])
        }
        
        # Make prediction
        result = rain_model.predict(weather_data)
        
        # Calculate strategy recommendation
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
    """Get latest weather data - live from COTA or from dataset"""
    try:
        # Try to fetch live weather first
        live_weather = fetch_live_weather_cota()
        
        if live_weather:
            # Return live weather from Circuit of the Americas
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
            # Fallback to dataset
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
        
        # Get last N records
        history = df.tail(limit)
        
        # Convert to list of dicts
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
    """
    Calculate pit stop strategy based on current conditions
    """
    try:
        data = request.get_json()
        
        rain_prob = float(data.get('rain_probability', 0))
        current_lap = int(data.get('current_lap', 1))
        total_laps = int(data.get('total_laps', 50))
        current_tire = data.get('current_tire', 'soft')
        
        strategy = calculate_pitstop_strategy(rain_prob, current_lap, total_laps, current_tire)
        
        return jsonify({
            'success': True,
            'strategy': strategy
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

def get_strategy_recommendation(rain_prob, weather_data):
    """Generate strategy recommendation based on rain probability"""
    
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
    
    # Check humidity and temperature
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

def calculate_pitstop_strategy(rain_prob, current_lap, total_laps, current_tire):
    """Calculate optimal pit stop strategy - INTELLIGENT VERSION"""
    
    laps_remaining = total_laps - current_lap
    
    # Tire degradation rates (laps until optimal pit)
    tire_life = {
        'soft': 15,      # Soft tires wear fast
        'medium': 25,    # Medium tires balanced
        'hard': 35,      # Hard tires very durable
        'intermediate': 20,  # Wet tires on drying track
        'wet': 25        # Full wet tires
    }
    
    # CRITICAL: Rain probability overrides tire strategy
    
    # EMERGENCY: Very high rain (80-100%)
    if rain_prob > 0.8:
        if current_tire in ['soft', 'medium', 'hard']:
            # On dry tires with heavy rain coming - PIT IMMEDIATELY
            return {
                'action': 'PIT NOW',
                'recommended_tire': 'Full Wet',
                'urgency': 'CRITICAL',
                'reasoning': f'EMERGENCY! {rain_prob*100:.0f}% rain probability - heavy rain imminent, switch to full wets NOW',
                'estimated_lap': current_lap + 1,  # Next lap!
                'confidence': 'very high',
                'stint_length': 0
            }
        else:
            # Already on wet tires
            return {
                'action': 'STAY OUT',
                'recommended_tire': 'Full Wet',
                'urgency': 'LOW',
                'reasoning': f'Already on wet tires - continue racing',
                'estimated_lap': min(current_lap + 20, total_laps - 2),
                'confidence': 'high',
                'stint_length': 20
            }
    
    # HIGH URGENCY: High rain (60-80%)
    elif rain_prob > 0.6:
        if current_tire in ['soft', 'medium', 'hard']:
            # Rain likely within 5-8 laps - pit soon
            urgent_pit_lap = current_lap + 2  # Pit in 2 laps
            return {
                'action': 'PIT SOON',
                'recommended_tire': 'Intermediate',
                'urgency': 'HIGH',
                'reasoning': f'{rain_prob*100:.0f}% rain probability - rain expected within 5-8 laps, pit on lap {urgent_pit_lap}',
                'estimated_lap': urgent_pit_lap,
                'confidence': 'high',
                'stint_length': 2
            }
        else:
            return {
                'action': 'CONTINUE',
                'recommended_tire': 'Intermediate',
                'urgency': 'LOW',
                'reasoning': 'Already prepared for wet conditions',
                'estimated_lap': min(current_lap + 18, total_laps - 2),
                'confidence': 'medium',
                'stint_length': 18
            }
    
    # MEDIUM URGENCY: Moderate rain (40-60%)
    elif rain_prob > 0.4:
        if current_tire in ['soft', 'medium', 'hard']:
            # Uncertain conditions - pit earlier than normal but not emergency
            cautious_pit_lap = current_lap + 5
            return {
                'action': 'PREPARE',
                'recommended_tire': 'Intermediate (standby)',
                'urgency': 'MEDIUM',
                'reasoning': f'{rain_prob*100:.0f}% rain probability - uncertain conditions, consider early pit on lap {cautious_pit_lap}',
                'estimated_lap': min(cautious_pit_lap, total_laps - 3),
                'confidence': 'medium',
                'stint_length': 5
            }
        else:
            return {
                'action': 'MONITOR',
                'recommended_tire': current_tire,
                'urgency': 'LOW',
                'reasoning': 'Conditions uncertain, monitor weather closely',
                'estimated_lap': min(current_lap + 15, total_laps - 2),
                'confidence': 'medium',
                'stint_length': 15
            }
    
    # LOW RISK: Light rain possibility (20-40%)
    elif rain_prob > 0.2:
        # Dry strategy but slightly conservative
        base_stint = tire_life.get(current_tire, 20)
        conservative_pit = current_lap + int(base_stint * 0.8)  # 80% of normal stint
        
        if current_tire == 'soft':
            next_tire = 'medium'
            reasoning = f'Light rain risk ({rain_prob*100:.0f}%) - slightly early pit at lap {conservative_pit}, switch to medium tires'
        elif current_tire == 'medium':
            next_tire = 'hard'
            reasoning = f'Light rain risk ({rain_prob*100:.0f}%) - conservative strategy, pit lap {conservative_pit} for hard tires'
        else:
            next_tire = 'medium'
            reasoning = f'Light rain risk ({rain_prob*100:.0f}%) - continue on hard tires until lap {conservative_pit}'
        
        return {
            'action': 'CONTINUE',
            'recommended_tire': next_tire,
            'urgency': 'LOW',
            'reasoning': reasoning,
            'estimated_lap': min(conservative_pit, total_laps - 3),
            'confidence': 'medium',
            'stint_length': min(int(base_stint * 0.8), laps_remaining - 3)
        }
    
    # MINIMAL RISK: Dry conditions (0-20% rain)
    else:
        # Normal tire degradation strategy
        base_stint = tire_life.get(current_tire, 20)
        optimal_pit_lap = current_lap + base_stint
        
        # Ensure we don't pit too late
        optimal_pit_lap = min(optimal_pit_lap, total_laps - 2)
        
        # Check if we have enough laps remaining for this stint
        if laps_remaining <= 5:
            return {
                'action': 'STAY OUT',
                'recommended_tire': current_tire,
                'urgency': 'NONE',
                'reasoning': f'Too few laps remaining ({laps_remaining}) - finish race on {current_tire} tires',
                'estimated_lap': total_laps,
                'confidence': 'very high',
                'stint_length': laps_remaining
            }
        
        if current_tire == 'soft':
            next_tire = 'medium'
            reasoning = f'Dry conditions - soft tires optimal for {base_stint} laps, pit lap {optimal_pit_lap} for mediums'
        elif current_tire == 'medium':
            next_tire = 'hard'
            reasoning = f'Dry conditions - medium tires good for {base_stint} laps, pit lap {optimal_pit_lap} for hards'
        elif current_tire == 'hard':
            # On hards, might go to end or switch to mediums if far from end
            if laps_remaining > 30:
                next_tire = 'medium'
                reasoning = f'Hard tires lasting well, consider switch to mediums at lap {optimal_pit_lap} for final stint'
            else:
                next_tire = 'hard'
                reasoning = f'Hard tires can last until end - stay out until lap {min(optimal_pit_lap, total_laps)}'
        else:
            next_tire = 'soft'
            reasoning = f'Dry conditions optimal - pit lap {optimal_pit_lap}'
        
        return {
            'action': 'CONTINUE',
            'recommended_tire': next_tire,
            'urgency': 'LOW',
            'reasoning': reasoning,
            'estimated_lap': optimal_pit_lap,
            'confidence': 'high',
            'stint_length': base_stint
        }

@app.route('/api/analytics/summary', methods=['GET'])
def analytics_summary():
    """Get analytics summary of weather patterns"""
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
    print("🏎️  Rain Pit Strategy AI - Backend Server")
    print("=" * 50)
    print(f"Server starting on http://localhost:5000")
    print("Endpoints:")
    print("  GET  /api/health              - Health check")
    print("  POST /api/predict             - Rain prediction")
    print("  GET  /api/weather/current     - Current weather")
    print("  GET  /api/weather/history     - Weather history")
    print("  POST /api/strategy/pitstop    - Pit stop strategy")
    print("  GET  /api/analytics/summary   - Analytics summary")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
