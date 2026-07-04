import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emitAck } from '../socket.js';
import { useGameSession } from '../GameContext.jsx';

const SHAPES = ['▲', '◆', '●', '■'];

export default function PlayerGame() {
  const navigate = useNavigate();
  const { session, game } = useGameSession();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!session.pin) {
      navigate('/');
    }
  }, [session.pin, navigate]);

  useEffect(() => {
    if (game.hostLeft) navigate('/');
  }, [game.hostLeft, navigate]);

  // Reset the locked-in answer whenever a new question arrives.
  useEffect(() => {
    setSelected(null);
  }, [game.question?.index]);

  const handleAnswer = async (choiceIndex) => {
    if (selected !== null) return;
    setSelected(choiceIndex);
    await emitAck('player:answer', { pin: session.pin, choiceIndex });
  };

  const { phase, question, myResult, leaderboard: leaderboardData, finalData } = game;

  if (phase === 'ended' && finalData) {
    const myRank = finalData.full.findIndex((p) => p.nickname === session.nickname) + 1;
    const isTop3 = myRank > 0 && myRank <= 3;
    return (
      <div className="screen center-screen">
        <div className="join-card">
          <h1>{isTop3 ? '🏆 You made the podium! 🏆' : 'Game Over'}</h1>
          <span className="emoji-preview bounce">{session.emoji}</span>
          <p className="final-rank">Your rank: #{myRank}</p>
          <p className="final-score">{finalData.full.find((p) => p.nickname === session.nickname)?.score ?? 0} pts</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/')}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'leaderboard' && leaderboardData) {
    const myEntry = leaderboardData.top.find((p) => p.nickname === session.nickname);
    return (
      <div className="screen center-screen">
        <div className="join-card">
          <h2>Leaderboard</h2>
          <div className="full-leaderboard">
            {leaderboardData.top.map((p, i) => (
              <div className={`leaderboard-row ${p.nickname === session.nickname ? 'leaderboard-row-me' : ''}`} key={p.id}>
                <span className="rank">#{i + 1}</span>
                <span className="lb-emoji">{p.emoji}</span>
                <span className="lb-name">{p.nickname}</span>
                <span className="lb-score">{p.score}</span>
              </div>
            ))}
          </div>
          {!myEntry && <p className="waiting-text">Waiting for next question…</p>}
        </div>
      </div>
    );
  }

  if (phase === 'reveal' && myResult) {
    return (
      <div className={`screen center-screen ${myResult.correct ? 'bg-correct' : 'bg-wrong'}`}>
        <div className="result-card">
          <span className="result-icon">{myResult.correct ? '✅' : '❌'}</span>
          <h1>{myResult.correct ? 'Correct!' : 'Wrong!'}</h1>
          <p className="points-earned">+{myResult.points} pts</p>
          <p className="total-score">Total: {myResult.totalScore} pts</p>
        </div>
      </div>
    );
  }

  if (phase === 'question' && question) {
    if (selected !== null) {
      return (
        <div className="screen center-screen">
          <div className="join-card">
            <span className="emoji-preview bounce">{session.emoji}</span>
            <h2>Answer locked in!</h2>
            <p className="waiting-text">Waiting for other players…</p>
          </div>
        </div>
      );
    }

    return (
      <div className="screen">
        <div className="player-question-screen">
          <p className="question-text-small">{question.text}</p>
          <div className="answer-buttons">
            {question.choices.map((choice, i) => (
              <button
                key={i}
                className={`answer-btn shape-bg-${i}`}
                onClick={() => handleAnswer(i)}
              >
                <span className="choice-shape">{SHAPES[i]}</span>
                <span>{choice}</span>
              </button>
            ))}
          </div>
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
