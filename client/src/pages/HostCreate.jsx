import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket, emitAck } from '../socket.js';
import { useGameSession } from '../GameContext.jsx';

const SAMPLE_QUIZ = {
  title: 'General Knowledge Sample',
  questions: [
    {
      text: 'What is the capital of France?',
      choices: ['Paris', 'London', 'Berlin', 'Madrid'],
      correctIndex: 0,
      durationSeconds: 20,
    },
    {
      text: 'Which planet is known as the Red Planet?',
      choices: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctIndex: 1,
      durationSeconds: 20,
    },
    {
      text: 'What is 7 x 8?',
      choices: ['54', '56', '64', '48'],
      correctIndex: 1,
      durationSeconds: 15,
    },
  ],
};

function emptyQuestion() {
  return {
    text: '',
    choices: ['', '', '', ''],
    correctIndex: 0,
    durationSeconds: 20,
  };
}

export default function HostCreate() {
  const navigate = useNavigate();
  const { updateSession, resetGame, updateGame } = useGameSession();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const updateQuestion = (index, patch) => {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateChoice = (qIndex, cIndex, value) => {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, choices: q.choices.map((c, j) => (j === cIndex ? value : c)) } : q
      )
    );
  };

  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestion = (index) =>
    setQuestions((qs) => (qs.length > 1 ? qs.filter((_, i) => i !== index) : qs));

  const loadSample = () => {
    setTitle(SAMPLE_QUIZ.title);
    setQuestions(SAMPLE_QUIZ.questions.map((q) => ({ ...q, choices: [...q.choices] })));
    setError('');
  };

  const handleCreate = async () => {
    setError('');
    setCreating(true);
    const quiz = { title, questions };
    const res = await emitAck('host:createGame', quiz);
    setCreating(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    resetGame();
    updateGame({ phase: 'lobby' });
    updateSession({ pin: res.pin, isHost: true, quizTitle: title, totalQuestions: questions.length });
    navigate('/host/lobby');
  };

  return (
    <div className="screen">
      <div className="builder">
        <h1>Create Your Quiz</h1>

        <button className="btn btn-ghost" onClick={loadSample}>
          ⚡ Load sample quiz
        </button>

        <label className="field">
          <span>Quiz title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Trivia Night"
            maxLength={100}
          />
        </label>

        {questions.map((q, qIndex) => (
          <div className="question-card" key={qIndex}>
            <div className="question-card-header">
              <h3>Question {qIndex + 1}</h3>
              {questions.length > 1 && (
                <button className="btn-icon" onClick={() => removeQuestion(qIndex)} title="Remove question">
                  ✕
                </button>
              )}
            </div>

            <label className="field">
              <span>Question text</span>
              <input
                value={q.text}
                onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                placeholder="What is...?"
                maxLength={300}
              />
            </label>

            <div className="choices-grid">
              {q.choices.map((choice, cIndex) => (
                <label className={`field choice-field choice-${cIndex}`} key={cIndex}>
                  <span>
                    Choice {cIndex + 1}
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctIndex === cIndex}
                      onChange={() => updateQuestion(qIndex, { correctIndex: cIndex })}
                    />{' '}
                    correct
                  </span>
                  <input
                    value={choice}
                    onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                    placeholder={`Choice ${cIndex + 1}`}
                    maxLength={100}
                  />
                </label>
              ))}
            </div>

            <label className="field field-inline">
              <span>Timer (seconds)</span>
              <input
                type="number"
                min={5}
                max={120}
                value={q.durationSeconds}
                onChange={(e) => updateQuestion(qIndex, { durationSeconds: Number(e.target.value) })}
              />
            </label>
          </div>
        ))}

        <button className="btn btn-secondary" onClick={addQuestion}>
          ＋ Add question
        </button>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary btn-large" onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating...' : 'Create Game →'}
        </button>
      </div>
    </div>
  );
}
