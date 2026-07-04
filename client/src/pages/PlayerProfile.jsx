import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emitAck } from '../socket.js';
import { useGameSession } from '../GameContext.jsx';

const EMOJIS = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦁', '🐷', '🐙', '🦄', '🐢', '🐧', '🦖', '🐝', '🍕'];

export default function PlayerProfile() {
  const navigate = useNavigate();
  const { session, updateSession, resetGame, updateGame } = useGameSession();
  const [nickname, setNickname] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    const clean = nickname.trim();
    if (!clean) {
      setError('Enter a nickname.');
      return;
    }
    setError('');
    setJoining(true);
    const res = await emitAck('player:joinGame', { pin: session.pin, nickname: clean, emoji });
    setJoining(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    resetGame();
    updateGame({ phase: 'lobby', players: res.players ?? [] });
    updateSession({
      nickname: clean,
      emoji,
      quizTitle: res.quizTitle,
      totalQuestions: res.totalQuestions,
    });
    navigate('/join/lobby');
  };

  return (
    <div className="screen center-screen">
      <div className="join-card">
        <h1 className="logo-small">Pick your look</h1>

        <div className="emoji-picker">
          {EMOJIS.map((e) => (
            <button
              key={e}
              className={`emoji-option ${emoji === e ? 'emoji-selected' : ''}`}
              onClick={() => setEmoji(e)}
              type="button"
            >
              {e}
            </button>
          ))}
        </div>

        <div className="emoji-preview bounce">{emoji}</div>

        <label className="field">
          <span>Nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            placeholder="Your name"
            autoFocus
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary btn-large" onClick={handleJoin} disabled={joining}>
          {joining ? 'Joining...' : "Let's go! →"}
        </button>
      </div>
    </div>
  );
}
