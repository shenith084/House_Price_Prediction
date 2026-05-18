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
  "MedInc":     5.0,
  "HouseAge":   20,
  "AveRooms":   6.0,
  "AveBedrms":  1.0,
  "Population": 1200,
  "AveOccup":   3.0,
  "Latitude":   34.5,
  "Longitude":  -118.0
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

| Feature    | Description                        |
|------------|------------------------------------|
| MedInc     | Median income (in $10k units)      |
| HouseAge   | Median house age in block group    |
| AveRooms   | Average number of rooms            |
| AveBedrms  | Average number of bedrooms         |
| Population | Block group population             |
| AveOccup   | Average household occupancy        |
| Latitude   | Geographic latitude                |
| Longitude  | Geographic longitude               |

---

## 🎨 UI Features

- ✅ Dark glassmorphism design
- ✅ Responsive layout (mobile-friendly)
- ✅ Feature importance bar chart
- ✅ Live API status indicator
- ✅ Confidence range display
- ✅ Input validation & error handling
- ✅ Loading animations

---

## 📦 Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | React 18, Vanilla CSS |
| Backend   | Flask 3, Flask-CORS |
| ML        | scikit-learn, numpy |
| Font      | Inter + Space Grotesk (Google Fonts) |
