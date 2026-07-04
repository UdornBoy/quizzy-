import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from './socket.js';
import { useGameSession } from './GameContext.jsx';

/**
 * Registers every game socket listener exactly once, for the lifetime of the
 * app, independent of which page is currently mounted. Pages only ever read
 * from GameContext and never subscribe to sockets themselves — this is what
 * prevents events (e.g. the very first question:start after a lobby) from
 * firing while nobody is listening during a route transition.
 */
export default function GameSocketSync() {
  const navigate = useNavigate();
  const { session, updateGame } = useGameSession();
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    const gamePath = () => (sessionRef.current.isHost ? '/host/game' : '/join/game');

    const onLobbyUpdate = ({ players }) => updateGame({ players });

    const onQuestionStart = (q) => {
      updateGame({
        phase: 'question',
        question: q,
        progress: { totalAnswered: 0, totalPlayers: 0 },
        reveal: null,
        myResult: null,
      });
      navigate(gamePath());
    };

    const onProgress = (p) => updateGame({ progress: p });
    const onReveal = (r) => updateGame({ phase: 'reveal', reveal: r });
    const onLeaderboard = (l) => updateGame({ phase: 'leaderboard', leaderboard: l });
    const onEnded = (data) => updateGame({ phase: 'ended', finalData: data });
    const onResult = (r) => updateGame({ myResult: r });
    const onHostDisconnected = () => updateGame({ hostLeft: true });

    socket.on('lobby:update', onLobbyUpdate);
    socket.on('question:start', onQuestionStart);
    socket.on('answer:progress', onProgress);
    socket.on('question:reveal', onReveal);
    socket.on('leaderboard:show', onLeaderboard);
    socket.on('game:ended', onEnded);
    socket.on('player:result', onResult);
    socket.on('host:disconnected', onHostDisconnected);

    return () => {
      socket.off('lobby:update', onLobbyUpdate);
      socket.off('question:start', onQuestionStart);
      socket.off('answer:progress', onProgress);
      socket.off('question:reveal', onReveal);
      socket.off('leaderboard:show', onLeaderboard);
      socket.off('game:ended', onEnded);
      socket.off('player:result', onResult);
      socket.off('host:disconnected', onHostDisconnected);
    };
    // Intentionally empty — this must subscribe exactly once for the app's
    // lifetime. Freshness for isHost/pin is handled via sessionRef.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
