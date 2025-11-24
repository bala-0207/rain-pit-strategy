import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os

class RainPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = ['AIR_TEMP', 'TRACK_TEMP', 'HUMIDITY', 'PRESSURE', 
                                'WIND_SPEED', 'WIND_DIRECTION', 'TEMP_DIFF', 
                                'HUMIDITY_PRESSURE_RATIO']
        
    def engineer_features(self, df):
        """Create additional features for better prediction"""
        df = df.copy()
        
        # Temperature difference (air vs track)
        df['TEMP_DIFF'] = df['AIR_TEMP'] - df['TRACK_TEMP']
        
        # Humidity to pressure ratio
        df['HUMIDITY_PRESSURE_RATIO'] = df['HUMIDITY'] / df['PRESSURE']
        
        # Rolling averages for trend detection
        df['AIR_TEMP_ROLLING'] = df['AIR_TEMP'].rolling(window=5, min_periods=1).mean()
        df['HUMIDITY_ROLLING'] = df['HUMIDITY'].rolling(window=5, min_periods=1).mean()
        
        # Humidity change rate
        df['HUMIDITY_CHANGE'] = df['HUMIDITY'].diff().fillna(0)
        
        # Pressure change rate
        df['PRESSURE_CHANGE'] = df['PRESSURE'].diff().fillna(0)
        
        return df
    
    def load_and_prepare_data(self, csv_path):
        """Load and prepare data from CSV"""
        # Read CSV with semicolon delimiter
        df = pd.read_csv(csv_path, sep=';')
        
        # Engineer features
        df = self.engineer_features(df)
        
        # Handle any missing values - only for numeric columns
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].mean())
        
        return df
    
    def train(self, csv_path):
        """Train the rain prediction model"""
        print("Loading data...")
        df = self.load_and_prepare_data(csv_path)
        
        # Prepare features and target
        X = df[self.feature_columns]
        y = df['RAIN']
        
        # Check class distribution
        rain_count = y.sum()
        total_count = len(y)
        print(f"Dataset: {total_count} samples, {rain_count} rain events ({rain_count/total_count*100:.2f}%)")
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y if rain_count > 0 else None
        )
        
        # Train Random Forest with class balancing
        print("Training model...")
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight='balanced',  # Handle imbalanced data
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\nModel Performance:")
        print(f"Accuracy: {accuracy:.4f}")
        
        if rain_count > 0:
            precision = precision_score(y_test, y_pred, zero_division=0)
            recall = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            print(f"Precision: {precision:.4f}")
            print(f"Recall: {recall:.4f}")
            print(f"F1 Score: {f1:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nFeature Importance:")
        print(feature_importance.to_string(index=False))
        
        return self.model
    
    def predict(self, weather_data):
        """
        Predict rain probability
        weather_data: dict with keys matching feature columns
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Create DataFrame from input
        df = pd.DataFrame([weather_data])
        
        # Calculate only the basic engineered features (not rolling averages for single prediction)
        df['TEMP_DIFF'] = df['AIR_TEMP'] - df['TRACK_TEMP']
        df['HUMIDITY_PRESSURE_RATIO'] = df['HUMIDITY'] / df['PRESSURE']
        
        # Select features - use only the 8 features the model was trained on
        X = df[self.feature_columns].fillna(0)
        
        # Scale
        X_scaled = self.scaler.transform(X)
        
        # Predict probability
        rain_proba = self.model.predict_proba(X_scaled)[0]
        
        # Handle case where model only saw one class during training
        if len(rain_proba) == 1:
            # Model only knows one class (likely all no-rain data)
            prediction = int(self.model.predict(X_scaled)[0])
            if prediction == 0:
                # Predicted no rain
                no_rain_prob = float(rain_proba[0])
                rain_prob = 1.0 - no_rain_prob
            else:
                # Predicted rain (unlikely with this dataset)
                rain_prob = float(rain_proba[0])
                no_rain_prob = 1.0 - rain_prob
        else:
            # Normal case: model knows both classes
            no_rain_prob = float(rain_proba[0])
            rain_prob = float(rain_proba[1])
        
        return {
            'rain_probability': rain_prob,
            'no_rain_probability': no_rain_prob,
            'prediction': int(self.model.predict(X_scaled)[0])
        }
    
    def save_model(self, model_path='model_data'):
        """Save trained model and scaler"""
        os.makedirs(model_path, exist_ok=True)
        joblib.dump(self.model, os.path.join(model_path, 'rain_model.pkl'))
        joblib.dump(self.scaler, os.path.join(model_path, 'scaler.pkl'))
        print(f"Model saved to {model_path}")
    
    def load_model(self, model_path='model_data'):
        """Load trained model and scaler"""
        self.model = joblib.load(os.path.join(model_path, 'rain_model.pkl'))
        self.scaler = joblib.load(os.path.join(model_path, 'scaler.pkl'))
        print("Model loaded successfully")

if __name__ == "__main__":
    # Train the model
    model = RainPredictionModel()
    csv_path = os.path.join('..', 'data', 'raindata.csv')
    
    model.train(csv_path)
    model.save_model()
    
    # Test prediction
    test_data = {
        'AIR_TEMP': 28.5,
        'TRACK_TEMP': 42.0,
        'HUMIDITY': 65.0,
        'PRESSURE': 993.0,
        'WIND_SPEED': 15.0,
        'WIND_DIRECTION': 150
    }
    
    result = model.predict(test_data)
    print(f"\nTest Prediction:")
    print(f"Rain Probability: {result['rain_probability']:.2%}")
    print(f"Prediction: {'Rain' if result['prediction'] == 1 else 'No Rain'}")
