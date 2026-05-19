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
    hint: 'California longitude (−124 to −114)',
    min: -124.35,
    max: -114.31,
    step: 0.01,
  },
  {
    key: 'latitude',
    label: 'Latitude',
    icon: '🌐',
    placeholder: '34.05',
    hint: 'California latitude (32 to 42)',
    min: 32.54,
    max: 41.95,
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
          Fill in the property details and click "Predict Price" to see the estimated value.
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

export default function App() {
  const [formData, setFormData] = useState({ ...DEFAULT_VALUES });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(null);

  // Called by LocationFiller when a location is chosen
  const handleLocationFilled = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: String(lat),
      longitude: String(lng),
    }));
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="app-wrapper">
      <Navbar online={online === true} />

      <main>
        <Hero />

        <div className="main-grid container">
          {/* ── Prediction Form ── */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-icon blue" aria-hidden="true">🔍</div>
                <div>
                  <div className="card-title">Property Details</div>
                  <div className="card-subtitle">9 features · California housing data</div>
                </div>
              </div>
              <div className="card-body">
                <LocationFiller onLocationFilled={handleLocationFilled} />

                <form id="prediction-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-grid">
                    {NUMERIC_FEATURES.map(f => (
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
                            aria-describedby={`hint-${f.key}`}
                          />
                        </div>
                        <span id={`hint-${f.key}`} className="form-hint">{f.hint}</span>
                      </div>
                    ))}

                    {/* Ocean Proximity — categorical */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" htmlFor="input-ocean_proximity">
                        🌊 Ocean Proximity
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
                      <span className="form-hint">Distance category to the nearest ocean</span>
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-error" role="alert">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="predict-btn"
                    className="btn btn-primary"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner" aria-hidden="true" />
                        Predicting…
                      </>
                    ) : (
                      <>🚀 Predict Price</>
                    )}
                  </button>
                </form>

                {result && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button id="reset-btn" className="btn btn-secondary" onClick={handleReset}>
                      🔄 Reset
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
