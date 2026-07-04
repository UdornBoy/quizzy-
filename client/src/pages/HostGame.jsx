import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emitAck } from '../socket.js';
import { useGameSession } from '../GameContext.jsx';

const SHAPES = ['▲', '◆', '●', '■'];

export default function HostGame() {
  const navigate = useNavigate();
  const { session, game } = useGameSession();
  const [timeLeft, setTimeLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!session.pin) {
      navigate('/');
    }
  }, [session.pin, navigate]);

  useEffect(() => {
    if (game.phase !== 'question' || !game.question) return;
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const remaining = Math.max(0, game.question.endsAt - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
    }, 100);
    return () => clearInterval(tickRef.current);
  }, [game.phase, game.question]);

  const handleNext = async () => {
    setBusy(true);
    await emitAck('host:next', session.pin);
    setBusy(false);
  };

  const { phase, question, progress, reveal, leaderboard: leaderboardData, finalData } = game;

  if (phase === 'ended' && finalData) {
    const [first, second, third] = finalData.top3;
    return (
      <div className="screen">
        <div className="final-screen">
          <h1>🏆 Final Results 🏆</h1>
          <div className="podium">
            {second && (
              <div className="podium-spot podium-2">
                <span className="podium-emoji">{second.emoji}</span>
                <span className="podium-name">{second.nickname}</span>
                <span className="podium-score">{second.score}</span>
                <div className="podium-block">2</div>
              </div>
            )}
            {first && (
              <div className="podium-spot podium-1">
                <span className="podium-emoji">{first.emoji}</span>
                <span className="podium-name">{first.nickname}</span>
                <span className="podium-score">{first.score}</span>
                <div className="podium-block">1</div>
              </div>
            )}
            {third && (
              <div className="podium-spot podium-3">
                <span className="podium-emoji">{third.emoji}</span>
                <span className="podium-name">{third.nickname}</span>
                <span className="podium-score">{third.score}</span>
                <div className="podium-block">3</div>
              </div>
            )}
          </div>

          <div className="full-leaderboard">
            {finalData.full.map((p, i) => (
              <div className="leaderboard-row" key={p.id}>
                <span className="rank">#{i + 1}</span>
                <span className="lb-emoji">{p.emoji}</span>
                <span className="lb-name">{p.nickname}</span>
                <span className="lb-score">{p.score}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-large" onClick={() => navigate('/')}>
            New Game
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'leaderboard' && leaderboardData) {
    return (
      <div className="screen">
        <div className="leaderboard-screen">
          <h2>
            Leaderboard — Question {leaderboardData.index + 1} of {leaderboardData.total}
          </h2>
          <div className="full-leaderboard">
            {leaderboardData.top.map((p, i) => (
              <div className="leaderboard-row" key={p.id}>
                <span className="rank">#{i + 1}</span>
                <span className="lb-emoji">{p.emoji}</span>
                <span className="lb-name">{p.nickname}</span>
                <span className="lb-score">{p.score}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-large" onClick={handleNext} disabled={busy}>
            {leaderboardData.index + 1 >= leaderboardData.total ? 'Show Final Results →' : 'Next Question →'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'reveal' && reveal && question) {
    const maxCount = Math.max(1, ...reveal.counts);
    return (
      <div className="screen">
        <div className="reveal-screen">
          <h2>Answer: {question.choices[reveal.correctIndex]}</h2>
          <p className="answered-count">
            {reveal.totalAnswered}/{reveal.totalPlayers} answered
          </p>
          <div className="bar-chart">
            {reveal.counts.map((count, i) => (
              <div className="bar-col" key={i}>
                <div className="bar-count">{count}</div>
                <div
                  className={`bar shape-bg-${i} ${i === reveal.correctIndex ? 'bar-correct' : ''}`}
                  style={{ height: `${(count / maxCount) * 200}px` }}
                />
                <div className="bar-shape">{SHAPES[i]}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-large" onClick={handleNext} disabled={busy}>
            Show Leaderboard →
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'question' && question) {
    return (
      <div className="screen">
        <div className="host-question-screen">
          <div className="question-top">
            <span className="question-index">
              Question {question.index + 1}/{question.total}
            </span>
            <span className="timer-badge">{timeLeft}s</span>
          </div>
          <h1 className="question-text">{question.text}</h1>
          <p className="answered-count">
            {progress.totalAnswered}/{progress.totalPlayers} answered
          </p>
          <div className="choices-display">
            {question.choices.map((choice, i) => (
              <div className={`choice-display shape-bg-${i}`} key={i}>
                <span className="choice-shape">{SHAPES[i]}</span>
                <span>{choice}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={handleNext} disabled={busy}>
            Skip / End Question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen center-screen">
      <p>Loading…</p>
    </div>
  );
}
