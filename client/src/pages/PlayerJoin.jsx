import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGameSession } from '../GameContext.jsx';

export default function PlayerJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateSession } = useGameSession();
  const [pin, setPin] = useState(searchParams.get('pin') ?? '');
  const [error, setError] = useState('');

  const handleNext = () => {
    const clean = pin.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError('Enter the 6-digit game PIN.');
      return;
    }
    updateSession({ pin: clean, isHost: false });
    navigate('/join/profile');
  };

  return (
    <div className="screen center-screen">
      <div className="join-card">
        <h1 className="logo-small">🎯 Quizzy</h1>
        <label className="field">
          <span>Game PIN</span>
          <input
            className="pin-input"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            autoFocus
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-large" onClick={handleNext}>
          Enter →
        </button>
      </div>
    </div>
  );
}
