// components/PromoCodeInput.jsx

import { useState } from 'react';

export default function PromoCodeInput({ onCodeValidated, reviewType }) {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);
  const [codeData, setCodeData] = useState(null);

  const handleValidate = async () => {
    setValidating(true);
    setError('');

    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, reviewType })
      });

      const result = await response.json();

      if (result.valid && (result.available !== false)) {
        setValidated(true);
        setCodeData(result);
        onCodeValidated(code.toUpperCase().trim(), result);
      } else {
        setError(result.error || 'Invalid code');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Error validating code. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && code.trim()) {
      handleValidate();
    }
  };

  if (validated) {
    return (
      <div className="code-validated">
        <div className="success-message">
          <span className="success-icon">✓</span>
          <span className="success-text">Beta access granted!</span>
        </div>
        {codeData?.remaining && (
          <div className="credits-remaining">
            <p className="credits-label">Remaining credits:</p>
            <div className="credits-info">
              <span>QuickLooks: {codeData.remaining.quickLooks}</span>
              <span>Full Reviews: {codeData.remaining.fullReviews}</span>
            </div>
          </div>
        )}
        <style jsx>{`
          .code-validated {
            padding: 1rem;
            background: #f0fdf4;
            border: 2px solid #22c55e;
            border-radius: 8px;
            margin-bottom: 1.5rem;
          }
          .success-message {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
          }
          .success-icon {
            font-size: 1.5rem;
            color: #22c55e;
          }
          .success-text {
            font-size: 1rem;
            font-weight: 600;
            color: #166534;
          }
          .credits-remaining {
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid #86efac;
          }
          .credits-label {
            font-size: 0.875rem;
            color: #166534;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }
          .credits-info {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
            color: #15803d;
          }
          .credits-info span {
            background: white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            border: 1px solid #86efac;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="promo-code-section">
      <label htmlFor="promo-code">Beta Access Code</label>
      <div className="code-input-group">
        <input
          id="promo-code"
          type="text"
          placeholder="BETA001"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          disabled={validating}
          maxLength={10}
        />
        <button
          onClick={handleValidate}
          disabled={!code.trim() || validating}
          className="validate-button"
        >
          {validating ? 'Validating...' : 'Validate'}
        </button>
      </div>
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <p className="helper-text">
        Enter your beta code to access free reviews
      </p>

      <style jsx>{`
        .promo-code-section {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .code-input-group {
          display: flex;
          gap: 0.5rem;
        }
        input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          font-family: 'Monaco', 'Courier New', monospace;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
        .validate-button {
          padding: 0.75rem 1.5rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .validate-button:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);
        }
        .validate-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          transform: none;
        }
        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #991b1b;
          font-size: 0.875rem;
        }
        .error-icon {
          font-size: 1rem;
        }
        .helper-text {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
