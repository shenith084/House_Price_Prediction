# 🏡 House Price Prediction — Full Stack App

A premium AI-powered house price prediction web application built with:
- **Frontend**: React 18 with a modern dark glassmorphism UI
- **Backend**: Flask REST API
- **ML Model**: Scikit-learn (trained `house_price_model.pkl`)

---

## 📁 Project Structure

```
House_Price_Prediction/
├── Backend/
│   ├── app.py                  # Flask API server
│   ├── house_price_model.pkl   # Trained ML model
│   └── requirements.txt        # Python dependencies
│
├── Frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js              # Main React component
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Setup & Running

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

---

### 1. Backend (Flask)

```bash
cd Backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```

The API will be available at: `http://localhost:5000`

---

### 2. Frontend (React)

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm start
```

The React app will open at: `http://localhost:3000`

---

## 🌐 API Endpoints

| Method | Endpoint        | Description              |
|--------|-----------------|--------------------------|
| GET    | `/`             | Health check             |
| POST   | `/api/predict`  | Predict house price      |
| GET    | `/api/model-info` | Model metadata         |

### POST `/api/predict` — Request Body

```json
{
  "longitude": -118.25,
  "latitude": 34.05,
  "housing_median_age": 25.0,
  "total_rooms": 2500.0,
  "total_bedrooms": 500.0,
  "population": 1200.0,
  "households": 400.0,
  "median_income": 4.5,
  "ocean_proximity": "<1H OCEAN"
}
```

### Response

```json
{
  "predicted_price": 215000.00,
  "formatted_price": "$215,000.00",
  "status": "success"
}
```

---

## 🧠 Model Features

| Feature              | Description                                                             |
|----------------------|-------------------------------------------------------------------------|
| `longitude`          | Geographic longitude coordinate of the block                            |
| `latitude`           | Geographic latitude coordinate of the block                             |
| `housing_median_age` | Median age of houses in the block group                                 |
| `total_rooms`        | Total number of rooms in the block group                                |
| `total_bedrooms`     | Total number of bedrooms in the block group                             |
| `population`         | Total population in the block group                                     |
| `households`         | Number of households in the block group                                 |
| `median_income`      | Median household income in block (in $10,000s, e.g. 4.5 = $45,000)      |
| `ocean_proximity`    | Coastal distance classification (`<1H OCEAN`, `INLAND`, `NEAR OCEAN`, `NEAR BAY`, `ISLAND`) |

---

## 🎨 UI Features

- ✅ Modern dark glassmorphism wizard interface
- ✅ Geolocation auto-detection (detect current coordinates)
- ✅ Auto-fill coordinates via OpenStreetMap address search
- ✅ Intelligent ocean proximity auto-detector based on GPS coordinates
- ✅ Form input split into logical steps (Location ➔ Building ➔ Demographics)
- ✅ Interactive validation & boundary protection
- ✅ Live API connection status indicator
- ✅ Value confidence range estimation (+/- 8%)
- ✅ Smooth loading states and glassmorphism hover animations
- ✅ Responsive design for desktop, tablet, and mobile screens

---

## 📦 Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | React 18, Vanilla CSS |
| Backend   | Flask 3, Flask-CORS |
| ML        | scikit-learn, numpy, pandas |
| Font      | Inter + Space Grotesk (Google Fonts) |
