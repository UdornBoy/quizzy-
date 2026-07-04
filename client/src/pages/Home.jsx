import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="screen center-screen">
      <div className="home-card">
        <h1 className="logo">🎯 Quizzy</h1>
        <p className="subtitle">A live, team-interactive quiz game</p>
        <div className="home-actions">
          <button className="btn btn-primary btn-large" onClick={() => navigate('/host/create')}>
            🖥️ Host a Game
          </button>
          <button className="btn btn-secondary btn-large" onClick={() => navigate('/join')}>
            📱 Join a Game
          </button>
        </div>
      </div>
    </div>
  );
}
