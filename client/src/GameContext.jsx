import { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

const initialSession = {
  pin: null,
  isHost: false,
  nickname: '',
  emoji: '',
  quizTitle: '',
  totalQuestions: 0,
};

const initialGame = {
  phase: 'idle', // idle | lobby | question | reveal | leaderboard | ended
  players: [],
  question: null,
  progress: { totalAnswered: 0, totalPlayers: 0 },
  reveal: null,
  leaderboard: null,
  finalData: null,
  myResult: null,
  hostLeft: false,
};

export function GameProvider({ children }) {
  const [session, setSession] = useState(initialSession);
  const [game, setGame] = useState(initialGame);

  const updateSession = (patch) => setSession((prev) => ({ ...prev, ...patch }));
  const updateGame = (patch) => setGame((prev) => ({ ...prev, ...patch }));
  const resetGame = () => setGame(initialGame);
  const resetAll = () => {
    setSession(initialSession);
    setGame(initialGame);
  };

  return (
    <GameContext.Provider value={{ session, updateSession, game, updateGame, resetGame, resetAll }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameSession() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameSession must be used within GameProvider');
  return ctx;
}
