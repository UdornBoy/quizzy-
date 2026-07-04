import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSession } from '../GameContext.jsx';

export default function PlayerLobby() {
  const navigate = useNavigate();
  const { session, game } = useGameSession();

  useEffect(() => {
    if (!session.pin) {
      navigate('/');
    }
  }, [session.pin, navigate]);

  // GameSocketSync navigates to /join/game as soon as question:start arrives.

  if (game.hostLeft) {
    return (
      <div className="screen center-screen">
        <p>The host ended the game.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back home
        </button>
      </div>
    );
  }

  const players = game.players;

  return (
    <div className="screen center-screen">
      <div className="join-card">
        <span className="emoji-preview bounce">{session.emoji}</span>
        <h2>You're in, {session.nickname}!</h2>
        <p className="waiting-text">Waiting for the host to start "{session.quizTitle}"…</p>
        <p className="player-count">{players.length} player{players.length === 1 ? '' : 's'} in the lobby</p>
        <div className="player-grid">
          {players.map((p) => (
            <div className="player-chip" key={p.id}>
              <span className="player-emoji">{p.emoji}</span>
              <span className="player-name">{p.nickname}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
