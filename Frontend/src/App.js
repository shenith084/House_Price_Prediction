import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ─── API Configuration ────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ─── Feature metadata (matching exact model columns) ─────────────────────────
const NUMERIC_FEATURES = [
  {
    key: 'longitude',
    label: 'Longitude',
    icon: '📍',
    placeholder: '-118.25',
    hint: 'Global longitude (−180 to 180)',
    min: -180.00,
    max: 180.00,
    step: 0.01,
  },
  {
    key: 'latitude',
    label: 'Latitude',
    icon: '🌐',
    placeholder: '34.05',
    hint: 'Global latitude (-90 to 90)',
    min: -90.00,
    max: 90.00,
    step: 0.01,
  },
  {
    key: 'housing_median_age',
    label: 'House Age (yrs)',
    icon: '🏗️',
    placeholder: '25',
    hint: 'Median age of houses in block',
    min: 1,
    max: 52,
    step: 1,
  },
  {
    key: 'total_rooms',
    label: 'Total Rooms',
    icon: '🚪',
    placeholder: '2500',
    hint: 'Total rooms in the block group',
    min: 1,
    max: 40000,
    step: 1,
  },
  {
    key: 'total_bedrooms',
    label: 'Total Bedrooms',
    icon: '🛏️',
    placeholder: '500',
    hint: 'Total bedrooms in the block group',
    min: 1,
    max: 7000,
    step: 1,
  },
  {
    key: 'population',
    label: 'Population',
    icon: '👥',
    placeholder: '1200',
    hint: 'Block group population',
    min: 3,
    max: 36000,
    step: 1,
  },
  {
    key: 'households',
    label: 'Households',
    icon: '🏘️',
    placeholder: '400',
    hint: 'Number of households in block',
    min: 1,
    max: 7000,
    step: 1,
  },
  {
    key: 'median_income',
    label: 'Median Income',
    icon: '💰',
    placeholder: '4.5',
    hint: 'In $10k units (e.g., 4.5 = $45,000)',
    min: 0.5,
    max: 15,
    step: 0.01,
  },
];

const OCEAN_OPTIONS = [
  '<1H OCEAN',
  'INLAND',
  'NEAR OCEAN',
  'NEAR BAY',
  'ISLAND',
];

// Default form values
const DEFAULT_VALUES = {
  longitude: '-118.25',
  latitude: '34.05',
  housing_median_age: '25',
  total_rooms: '2500',
  total_bedrooms: '500',
  population: '1200',
  households: '400',
  median_income: '4.5',
  ocean_proximity: '<1H OCEAN',
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatUSD(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

function priceRange(price) {
  return `${formatUSD(price * 0.92)} – ${formatUSD(price * 1.08)}`;
}

// ─── Ocean Proximity Auto-Detector ───────────────────────────────────────────
const CA_COASTLINE = [
  { lat: 32.53, lng: -117.12 }, // San Diego Border
  { lat: 32.65, lng: -117.24 }, // Point Loma
  { lat: 32.85, lng: -117.27 }, // La Jolla
  { lat: 33.00, lng: -117.29 }, // Encinitas
  { lat: 33.20, lng: -117.39 }, // Oceanside
  { lat: 33.45, lng: -117.65 }, // San Clemente
  { lat: 33.60, lng: -117.90 }, // Newport Beach
  { lat: 33.72, lng: -118.15 }, // Long Beach
  { lat: 33.72, lng: -118.40 }, // Palos Verdes
  { lat: 33.85, lng: -118.40 }, // Redondo Beach
  { lat: 34.00, lng: -118.50 }, // Santa Monica
  { lat: 34.02, lng: -118.80 }, // Malibu
  { lat: 34.15, lng: -119.20 }, // Port Hueneme
  { lat: 34.27, lng: -119.30 }, // Ventura
  { lat: 34.40, lng: -119.70 }, // Santa Barbara
  { lat: 34.45, lng: -120.10 }, // Gaviota
  { lat: 34.45, lng: -120.47 }, // Point Conception
  { lat: 34.58, lng: -120.65 }, // Point Arguello
  { lat: 34.90, lng: -120.66 }, // Guadalupe
  { lat: 35.14, lng: -120.64 }, // Pismo Beach
  { lat: 35.37, lng: -120.86 }, // Morro Bay
  { lat: 35.70, lng: -121.30 }, // San Simeon
  { lat: 36.00, lng: -121.60 }, // Big Sur South
  { lat: 36.30, lng: -121.90 }, // Point Sur
  { lat: 36.62, lng: -121.93 }, // Monterey
  { lat: 36.96, lng: -122.02 }, // Santa Cruz
  { lat: 37.20, lng: -122.40 }, // Ano Nuevo
  { lat: 37.46, lng: -122.44 }, // Half Moon Bay
  { lat: 37.77, lng: -122.51 }, // San Francisco Ocean Beach
  { lat: 38.00, lng: -123.00 }, // Point Reyes
  { lat: 38.30, lng: -123.05 }, // Bodega Bay
  { lat: 38.60, lng: -123.35 }, // Sea Ranch
  { lat: 38.95, lng: -123.74 }, // Point Arena
  { lat: 39.44, lng: -123.81 }, // Fort Bragg
  { lat: 39.85, lng: -123.95 }, // Westport
  { lat: 40.20, lng: -124.35 }, // Cape Mendocino South
  { lat: 40.44, lng: -124.41 }, // Cape Mendocino
  { lat: 40.80, lng: -124.16 }, // Eureka
  { lat: 41.05, lng: -124.15 }, // Trinidad
  { lat: 41.50, lng: -124.08 }, // Klamath
  { lat: 41.75, lng: -124.20 }, // Crescent City
  { lat: 42.00, lng: -124.21 }  // Pelican State Beach (OR border)
];

function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function guessOceanProximity(lat, lng) {
  // Check if outside California boundaries completely
  if (lat < 32.5 || lat > 42.0 || lng < -124.5 || lng > -114.0) {
    return 'INLAND';
  }

  // 1. ISLAND — Santa Catalina & Channel Islands
  const ISLANDS = [
    { lat: 33.45, lng: -118.48, r: 0.22 }, // Santa Catalina
    { lat: 32.83, lng: -118.58, r: 0.18 }, // San Clemente
    { lat: 33.25, lng: -119.50, r: 0.18 }, // San Nicolas
    { lat: 34.03, lng: -120.00, r: 0.22 }, // San Miguel
    { lat: 33.97, lng: -119.69, r: 0.22 }, // Santa Cruz
    { lat: 34.00, lng: -119.38, r: 0.18 }, // Santa Rosa
    { lat: 34.01, lng: -119.09, r: 0.12 }, // Anacapa
  ];
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (const isl of ISLANDS) {
    const d = Math.sqrt((lat - isl.lat) ** 2 + ((lng - isl.lng) * cosLat) ** 2);
    if (d < isl.r) return 'ISLAND';
  }

  // 2. NEAR BAY — San Francisco Bay region
  if (
    lat >= 37.2 && lat <= 38.25 &&
    lng >= -122.60 && lng <= -121.75
  ) {
    return 'NEAR BAY';
  }

  // 3. Haversine distance to closest coastline point
  let minDistance = Infinity;
  for (const pt of CA_COASTLINE) {
    const dist = getDistanceInMiles(lat, lng, pt.lat, pt.lng);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  // Very close (under 5 miles)
  if (minDistance <= 5.0) {
    return 'NEAR OCEAN';
  }

  // Far inland
  if (minDistance > 45.0) {
    return 'INLAND';
  }

  // Central Valley exclusion (east of Coast Ranges)
  if (lat > 35.0 && lng > -121.3) {
    return 'INLAND';
  }

  // Otherwise, coastal basin
  return '<1H OCEAN';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Navbar({ online }) {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="brand-icon" aria-hidden="true">🏡</div>
          <span className="brand-title">HousePredict AI</span>
        </div>
        <div className="navbar-status" aria-live="polite">
          <div className={`status-dot ${online ? '' : 'offline'}`} />
          <span>{online ? 'API Connected' : 'API Offline'}</span>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-badge">
        <span>🤖</span> Machine Learning Powered
      </div>
      <h1 id="hero-heading">
        Predict Your Home Value<br />
        <span className="gradient-text">Instantly &amp; Accurately</span>
      </h1>
      <p className="hero-subtitle">
        Enter your property details below and our trained scikit-learn Pipeline
        delivers an instant price estimate — backed by California housing market data.
      </p>
    </section>
  );
}


function ResultPanel({ result }) {
  if (!result) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">🏷️</div>
        <div className="empty-title">No Prediction Yet</div>
        <p className="empty-text">
          Fill in the property details and click "Calculate Valuation" to see the estimated value.
        </p>
      </div>
    );
  }

  const { predicted_price, formData } = result;

  return (
    <div className="result-panel" role="region" aria-label="Prediction result" aria-live="polite">
      <div className="result-price-display">
        <div className="result-label">Estimated Market Value</div>
        <div className="result-price" id="predicted-price">
          {formatUSD(predicted_price)}
        </div>
        <div className="result-subtitle">
          Confidence range: {priceRange(predicted_price)}
        </div>
      </div>

      <div className="result-divider" />

      <div className="result-metrics">
        <div className="metric-item">
          <div className="metric-name">Income Tier</div>
          <div className="metric-value">
            {parseFloat(formData.median_income) > 7 ? '🟢 High' :
              parseFloat(formData.median_income) > 4 ? '🟡 Mid' : '🔴 Low'}
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-name">House Age</div>
          <div className="metric-value">
            {parseFloat(formData.housing_median_age) < 10 ? '🆕 New' :
              parseFloat(formData.housing_median_age) < 30 ? '🏠 Mid' : '🏚️ Old'}
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-name">Ocean Proximity</div>
          <div className="metric-value">{formData.ocean_proximity}</div>
        </div>
        <div className="metric-item">
          <div className="metric-name">Households</div>
          <div className="metric-value">
            {parseInt(formData.households).toLocaleString()}
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-name">Location</div>
          <div className="metric-value">
            {parseFloat(formData.latitude).toFixed(2)}°N,{' '}
            {parseFloat(formData.longitude).toFixed(2)}°
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-name">Population</div>
          <div className="metric-value">
            {parseInt(formData.population).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Location Filler ─────────────────────────────────────────────────────────

function LocationFiller({ onLocationFilled }) {
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null); // 'success' | 'error' | null
  const [searchStatus, setSearchStatus] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── 1. Geolocation ───────────────────────────────────────────────────────────
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoLoading(true);
    setGeoStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        onLocationFilled(lat, lng);
        // Clear address search to avoid confusion — GPS took priority
        setAddressQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchStatus(null);
        setGeoLoading(false);
        setGeoStatus('success');
        setTimeout(() => setGeoStatus(null), 3000);
      },
      () => {
        setGeoLoading(false);
        setGeoStatus('error');
        setTimeout(() => setGeoStatus(null), 4000);
      },
      { timeout: 10000 }
    );
  };

  // ── 2. Address Search (OpenStreetMap Nominatim — free, no API key) ────────────
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddressQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      if (suggestions && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    }
  };

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(parseFloat(item.lat).toFixed(4));
    const lng = parseFloat(parseFloat(item.lon).toFixed(4));
    setAddressQuery(item.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationFilled(lat, lng);
    setSearchStatus('success');
    setTimeout(() => setSearchStatus(null), 3000);
  };

  return (
    <div className="location-filler">
      <div className="location-header">
        <span className="location-subtitle">Auto-fill Longitude &amp; Latitude</span>
      </div>

      <div className="location-methods">
        {/* ── Method 1: Current Location ── */}
        <div className="loc-method">
          <div className="loc-method-badge">1</div>
          <div className="loc-method-body">
            <div className="loc-method-title">📡 Current Location</div>
            <button
              id="btn-use-location"
              type="button"
              className={`btn-loc ${geoStatus === 'success' ? 'btn-loc-success' :
                geoStatus === 'error' ? 'btn-loc-error' : ''
                }`}
              onClick={handleGeolocate}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <><div className="loc-spinner" />Detecting…</>
              ) : geoStatus === 'success' ? (
                <>✅ Location Detected!</>
              ) : geoStatus === 'error' ? (
                <>❌ Permission Denied</>
              ) : (
                <>📡 Use My Location</>
              )}
            </button>
          </div>
        </div>

        <div className="loc-divider"><span>or</span></div>

        {/* ── Method 2: Address Search ── */}
        <div className="loc-method">
          <div className="loc-method-badge">2</div>
          <div className="loc-method-body" ref={wrapperRef} style={{ flex: 1 }}>
            <div className="loc-method-title">🔍 Address Search</div>

            <div className="address-search-wrap">
              <input
                id="address-search-input"
                type="text"
                className="address-input"
                placeholder="e.g. Los Angeles, California…"
                value={addressQuery}
                onChange={handleAddressChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {searching && <div className="address-spinner" />}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list" role="listbox">
                  {suggestions.map((item) => (
                    <li
                      key={item.place_id}
                      role="option"
                      className="suggestion-item"
                      onMouseDown={() => handleSelectSuggestion(item)}
                    >
                      <span className="sug-icon">📍</span>
                      <span className="sug-text">{item.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {searchStatus === 'success' && (
              <span className="loc-success-msg">✅ Coordinates filled from address!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: '📍 Location', desc: 'Set coordinates & ocean distance' },
  { label: '🏠 Building', desc: 'Age, rooms & bedroom layout' },
  { label: '📊 Area Stats', desc: 'Demographics & local income' },
];

export default function App() {
  const [formData, setFormData] = useState({ ...DEFAULT_VALUES });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  // Called by LocationFiller and InteractiveMap when a location is chosen
  const handleLocationFilled = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: String(lat),
      longitude: String(lng),
      ocean_proximity: guessOceanProximity(lat, lng),
    }));
  };

  const getStepFields = (step) => {
    if (step === 0) return ['longitude', 'latitude', 'ocean_proximity'];
    if (step === 1) return ['housing_median_age', 'total_rooms', 'total_bedrooms'];
    if (step === 2) return ['population', 'households', 'median_income'];
    return [];
  };

  const isStepValid = (step) => {
    const fields = getStepFields(step);
    for (const f of fields) {
      if (f === 'ocean_proximity') continue;
      const val = parseFloat(formData[f]);
      if (isNaN(val)) {
        return false;
      }
    }
    return true;
  };

  const handleTabClick = (index) => {
    setError(null);
    setActiveStep(index);
  };

  const handleNext = () => {
    if (isStepValid(activeStep)) {
      setError(null);
      setActiveStep(prev => prev + 1);
    } else {
      setError('Please fill in all details in this step before proceeding.');
    }
  };

  const handleBack = () => {
    setError(null);
    setActiveStep(prev => prev - 1);
  };

  // Check API health on mount
  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then(r => r.ok ? setOnline(true) : setOnline(false))
      .catch(() => setOnline(false));
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_VALUES });
    setResult(null);
    setError(null);
    setActiveStep(0);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Verify all steps have inputs (soft validation)
    for (let i = 0; i < STEPS.length; i++) {
      if (!isStepValid(i)) {
        setActiveStep(i);
        setError(`Please complete all fields in Step ${i + 1} correctly before proceeding.`);
        return;
      }
    }


    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build payload — numeric fields parsed as floats, ocean_proximity as string
      const payload = {};
      for (const f of NUMERIC_FEATURES) {
        const val = parseFloat(formData[f.key]);
        if (isNaN(val)) throw new Error(`"${f.label}" must be a valid number.`);
        payload[f.key] = val;
      }
      payload.ocean_proximity = formData.ocean_proximity;

      const resp = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Prediction request failed.');

      setResult({ ...data, formData });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Prevent automatic prediction/submission on intermediate steps
      if (activeStep < STEPS.length - 1) {
        e.preventDefault();
        handleNext();
      }
    }
  };

  return (
    <div className="app-wrapper">
      <Navbar online={online === true} />

      <main>
        <Hero />

        <div className="main-grid container">
          {/* ── Prediction Form ── */}
          <div>
            <div className="card">
              {/* Premium Wizard Tab Header */}
              <div className="wizard-tabs">
                {STEPS.map((step, idx) => (
                  <button
                    key={step.label}
                    type="button"
                    className={`wizard-tab-btn ${activeStep === idx ? 'active' : ''}`}
                    onClick={() => handleTabClick(idx)}
                  >
                    <div className="tab-num">{idx + 1}</div>
                    <div className="tab-meta">
                      <span className="tab-label">{step.label}</span>
                      <span className="tab-desc">{step.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="card-body">
                <form id="prediction-form" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} noValidate>
                  
                  {/* STEP 1: LOCATION */}
                  {activeStep === 0 && (
                    <div className="step-content animate-fade-in">
                      <LocationFiller onLocationFilled={handleLocationFilled} />

                      <div className="form-grid" style={{ marginTop: '20px' }}>
                        {NUMERIC_FEATURES.filter(f => ['longitude', 'latitude'].includes(f.key)).map(f => (
                          <div className="form-group" key={f.key}>
                            <label className="form-label" htmlFor={`input-${f.key}`}>
                              {f.icon} {f.label}
                            </label>
                            <div className="input-wrapper">
                              <input
                                id={`input-${f.key}`}
                                name={f.key}
                                type="number"
                                className="form-input"
                                placeholder={f.placeholder}
                                value={formData[f.key]}
                                onChange={handleChange}
                                min={f.min}
                                max={f.max}
                                step={0.0001}
                                required
                              />
                            </div>
                            <span className="form-hint">{f.hint}</span>
                          </div>
                        ))}

                        {/* Ocean Proximity */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label" htmlFor="input-ocean_proximity">
                            🌊 Ocean Proximity (Auto-calculated)
                          </label>
                          <div className="input-wrapper">
                            <select
                              id="input-ocean_proximity"
                              name="ocean_proximity"
                              className="form-input form-select"
                              value={formData.ocean_proximity}
                              onChange={handleChange}
                              required
                            >
                              {OCEAN_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                          <span className="form-hint">Coastal distance classification</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: BUILDING DETAILS */}
                  {activeStep === 1 && (
                    <div className="step-content animate-fade-in">
                      <div className="step-header">
                        <h3>🏠 Property Architecture</h3>
                        <p>Configure age and room quantities for the census block group.</p>
                      </div>
                      <div className="form-grid">
                        {NUMERIC_FEATURES.filter(f => ['housing_median_age', 'total_rooms', 'total_bedrooms'].includes(f.key)).map(f => (
                          <div className="form-group" key={f.key}>
                            <label className="form-label" htmlFor={`input-${f.key}`}>
                              {f.icon} {f.label}
                            </label>
                            <div className="input-wrapper">
                              <input
                                id={`input-${f.key}`}
                                name={f.key}
                                type="number"
                                className="form-input"
                                placeholder={f.placeholder}
                                value={formData[f.key]}
                                onChange={handleChange}
                                min={f.min}
                                max={f.max}
                                step={f.step}
                                required
                              />
                            </div>
                            <span className="form-hint">{f.hint}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: DEMOGRAPHICS */}
                  {activeStep === 2 && (
                    <div className="step-content animate-fade-in">
                      <div className="step-header">
                        <h3>📊 Local Demographics</h3>
                        <p>Configure local block population and median household income details.</p>
                      </div>
                      <div className="form-grid">
                        {NUMERIC_FEATURES.filter(f => ['population', 'households', 'median_income'].includes(f.key)).map(f => (
                          <div className="form-group" key={f.key}>
                            <label className="form-label" htmlFor={`input-${f.key}`}>
                              {f.icon} {f.label}
                            </label>
                            <div className="input-wrapper">
                              <input
                                id={`input-${f.key}`}
                                name={f.key}
                                type="number"
                                className="form-input"
                                placeholder={f.placeholder}
                                value={formData[f.key]}
                                onChange={handleChange}
                                min={f.min}
                                max={f.max}
                                step={f.step}
                                required
                              />
                            </div>
                            <span className="form-hint">{f.hint}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-error" role="alert" style={{ marginTop: '20px' }}>
                      <span>⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Form Footer Navigation Controls */}
                  <div className="wizard-actions">
                    {activeStep > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleBack}
                      >
                        ◀ Back
                      </button>
                    )}

                    {activeStep < STEPS.length - 1 ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleNext}
                        style={{ marginLeft: 'auto' }}
                      >
                        Next Step ▶
                      </button>
                    ) : (
                      <button
                        type="submit"
                        id="predict-btn"
                        className="btn btn-primary"
                        disabled={loading}
                        aria-busy={loading}
                        style={{ marginLeft: 'auto' }}
                      >
                        {loading ? (
                          <>
                            <div className="spinner" aria-hidden="true" />
                            Calculating…
                          </>
                        ) : (
                          <>🚀 Calculate Valuation</>
                        )}
                      </button>
                    )}
                  </div>
                </form>

                {result && (
                  <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--color-border)' }}>
                    <button id="reset-btn" className="btn btn-secondary animate-pulse" onClick={handleReset}>
                      🔄 Clear and Start Over
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Result */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon green" aria-hidden="true">💵</div>
                <div>
                  <div className="card-title">Prediction Result</div>
                  <div className="card-subtitle">
                    {result ? 'Your estimated property value' : 'Awaiting your input'}
                  </div>
                </div>
              </div>
              <ResultPanel result={result} />
            </div>

          </div>
        </div>

        {/* Tips Section */}
        <section aria-label="Tips" style={{ marginTop: '8px' }}>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-emoji">💡</div>
              <div className="tip-title">Income is Key</div>
              <p className="tip-text">
                Median income of the neighborhood is the single strongest predictor —
                accounting for ~46% of the model's decision.
              </p>
            </div>
            <div className="tip-card">
              <div className="tip-emoji">🌊</div>
              <div className="tip-title">Coastal Premium</div>
              <p className="tip-text">
                Ocean proximity significantly boosts prices. "NEAR BAY" and "NEAR OCEAN"
                locations command a clear premium over "INLAND" properties.
              </p>
            </div>
            <div className="tip-card">
              <div className="tip-emoji">🧠</div>
              <div className="tip-title">Pipeline Model</div>
              <p className="tip-text">
                Built as a scikit-learn Pipeline with preprocessing (imputation + scaling)
                and a regressor trained on 20,640 California census blocks.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          HousePredict AI — Powered by <strong>Flask</strong> + <strong>React</strong> +{' '}
          <strong>scikit-learn</strong>
        </p>
        <p style={{ marginTop: '6px' }}>
          Based on the{' '}
          <a
            href="https://scikit-learn.org/stable/datasets/real_world.html#california-housing-dataset"
            target="_blank"
            rel="noreferrer"
          >
            California Housing Dataset
          </a>
        </p>
      </footer>
    </div>
  );
}
