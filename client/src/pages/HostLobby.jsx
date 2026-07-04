import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { emitAck } from '../socket.js';
import { useGameSession } from '../GameContext.jsx';

const CLIENT_PORT = 5173;
const SERVER_PORT = 3001;

export default function HostLobby() {
  const navigate = useNavigate();
  const { session, game } = useGameSession();
  const [joinUrl, setJoinUrl] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!session.pin) {
      navigate('/');
      return;
    }

    if (!import.meta.env.DEV) {
      // Production: client and server share one public origin already.
      setJoinUrl(`${window.location.origin}/join?pin=${session.pin}`);
      return;
    }

    // Dev: client (5173) and server (3001) are separate, and phones need the
    // machine's LAN IP (not "localhost") to reach either of them.
    fetch(`${window.location.protocol}//${window.location.hostname}:${SERVER_PORT}/api/local-ip`)
      .then((r) => r.json())
      .then(({ ip }) => {
        setJoinUrl(`${window.location.protocol}//${ip}:${CLIENT_PORT}/join?pin=${session.pin}`);
      })
      .catch(() => {
        setJoinUrl(`${window.location.origin}/join?pin=${session.pin}`);
      });
  }, [session.pin, navigate]);

  // GameSocketSync navigates to /host/game as soon as question:start arrives.

  const handleStart = async () => {
    setError('');
    setStarting(true);
    const res = await emitAck('host:startGame', session.pin);
    if (res.error) {
      setStarting(false);
      setError(res.error);
    }
  };

  const players = game.players;

  return (
    <div className="screen">
      <div className="lobby-host">
        <h2>{session.quizTitle || 'Your Quiz'}</h2>
        <div className="pin-display">
          <span className="pin-label">Game PIN</span>
          <span className="pin-value">{session.pin}</span>
        </div>

        {joinUrl && (
          <div className="qr-wrap">
            <QRCodeSVG value={joinUrl} size={200} />
            <p className="qr-hint">Scan to join, or go to</p>
            <p className="qr-url">{joinUrl}</p>
          </div>
        )}

        <div className="player-grid">
          {players.length === 0 && <p className="waiting-text">Waiting for players to join…</p>}
          {players.map((p) => (
            <div className="player-chip" key={p.id}>
              <span className="player-emoji bounce">{p.emoji}</span>
              <span className="player-name">{p.nickname}</span>
            </div>
          ))}
        </div>

        <p className="player-count">{players.length} player{players.length === 1 ? '' : 's'} joined</p>

        {error && <p className="error-text">{error}</p>}

        <button
          className="btn btn-primary btn-large"
          onClick={handleStart}
          disabled={players.length === 0 || starting}
        >
          {starting ? 'Starting...' : '▶ Start Game'}
        </button>
      </div>
    </div>
  );
}
