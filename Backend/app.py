import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "house_price_model.pkl")

try:
    model = joblib.load(MODEL_PATH)
    print("[OK] Model loaded successfully!")
    print(f"     Model type: {type(model).__name__}")
except FileNotFoundError:
    model = None
    print("[ERROR] Model file not found. "
          "Please ensure house_price_model.pkl exists.")

# Feature columns expected by the model (must match training order)
FEATURE_COLUMNS = [
    'longitude',
    'latitude',
    'housing_median_age',
    'total_rooms',
    'total_bedrooms',
    'population',
    'households',
    'median_income',
    'ocean_proximity',
]

OCEAN_PROXIMITY_OPTIONS = [
    "NEAR BAY",
    "INLAND",
    "NEAR OCEAN",
    "<1H OCEAN",
    "ISLAND",
]


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "House Price Prediction API is running!",
        "status": "ok",
        "model_loaded": model is not None,
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({
            "error": "Model not loaded. Please check the server."
        }), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided."}), 400

        # Build a DataFrame with columns in the exact training order
        row = {
            "longitude":          float(data.get("longitude", 0)),
            "latitude":           float(data.get("latitude", 0)),
            "housing_median_age": float(data.get("housing_median_age", 0)),
            "total_rooms":        float(data.get("total_rooms", 0)),
            "total_bedrooms":     float(data.get("total_bedrooms", 0)),
            "population":         float(data.get("population", 0)),
            "households":         float(data.get("households", 0)),
            "median_income":      float(data.get("median_income", 0)),
            "ocean_proximity": str(
                data.get("ocean_proximity", "<1H OCEAN")
            ),
        }

        # Validate ocean_proximity
        if row["ocean_proximity"] not in OCEAN_PROXIMITY_OPTIONS:
            return jsonify({
                "error": (
                    f"Invalid ocean_proximity. "
                    f"Must be one of: {OCEAN_PROXIMITY_OPTIONS}"
                )
            }), 400

        df = pd.DataFrame([row])
        prediction = model.predict(df)[0]

        # This model outputs actual dollar values directly
        predicted_price = round(float(prediction), 2)

        return jsonify({
            "predicted_price":  predicted_price,
            "formatted_price":  f"${predicted_price:,.2f}",
            "status":           "success",
        })

    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid input value: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/api/model-info", methods=["GET"])
def model_info():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    return jsonify({
        "model_type": type(model).__name__,
        "pipeline_steps": [s[0] for s in model.steps],
        "features": FEATURE_COLUMNS,
        "ocean_proximity_options": OCEAN_PROXIMITY_OPTIONS,
        "target": "Median House Value (in USD, actual dollars)",
        "status": "loaded",
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
