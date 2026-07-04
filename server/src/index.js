import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  createGame,
  getGame,
  deleteGame,
  addPlayer,
  removePlayer,
  isNicknameTaken,
  currentQuestion,
  playerList,
  leaderboard,
  startQuestion,
  endQuestion,
  submitAnswer,
  answerCounts,
  answeredCount,
} from './gameManager.js';
import { validateQuiz, sanitizeText } from './validate.js';
import { getLocalIp } from './localIp.js';

const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, '../../client/dist');

const app = express();
app.use(cors());
app.get('/api/local-ip', (req, res) => {
  res.json({ ip: getLocalIp(), port: PORT });
});

// In production the built client is served from the same origin as the
// API/socket server, so there's a single public URL for host and players.
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// socket.id -> { pin, role: 'host' | 'player' }
const socketMeta = new Map();

function publicQuestionPayload(game) {
  const q = currentQuestion(game);
  return {
    index: game.currentQuestionIndex,
    total: game.quiz.questions.length,
    text: q.text,
    choices: q.choices,
    durationSeconds: q.durationSeconds,
    endsAt: game.questionEndsAt,
  };
}

function broadcastRevealAndScores(pin, game) {
  const q = currentQuestion(game);
  io.to(pin).emit('question:reveal', {
    index: game.currentQuestionIndex,
    correctIndex: q.correctIndex,
    counts: answerCounts(game),
    totalAnswered: answeredCount(game),
    totalPlayers: game.players.size,
  });
  for (const [socketId, result] of game.answers.entries()) {
    const player = game.players.get(socketId);
    if (!player) continue;
    io.to(socketId).emit('player:result', {
      correct: result.correct,
      points: result.points,
      totalScore: player.score,
    });
  }
  // Players who never answered still need to know the round is over.
  for (const [socketId] of game.players.entries()) {
    if (!game.answers.has(socketId)) {
      io.to(socketId).emit('player:result', { correct: false, points: 0, totalScore: game.players.get(socketId).score });
    }
  }
}

io.on('connection', (socket) => {
  socket.on('host:createGame', (quiz, ack) => {
    const error = validateQuiz(quiz);
    if (error) return ack?.({ error });

    const cleanQuiz = {
      title: sanitizeText(quiz.title, 100),
      questions: quiz.questions.map((q) => ({
        text: sanitizeText(q.text, 300),
        choices: q.choices.map((c) => sanitizeText(c, 100)),
        correctIndex: q.correctIndex,
        durationSeconds: q.durationSeconds,
      })),
    };

    const game = createGame(socket.id, cleanQuiz);
    socket.join(game.pin);
    socketMeta.set(socket.id, { pin: game.pin, role: 'host' });
    ack?.({ pin: game.pin });
  });

  socket.on('player:joinGame', ({ pin, nickname, emoji }, ack) => {
    const game = getGame(pin);
    if (!game) return ack?.({ error: 'Game not found. Check the PIN.' });
    if (game.state !== 'lobby') return ack?.({ error: 'This game has already started.' });

    const cleanNick = sanitizeText(nickname, 20);
    if (!cleanNick) return ack?.({ error: 'Nickname is required.' });
    if (isNicknameTaken(game, cleanNick)) {
      return ack?.({ error: 'That nickname is already taken in this game.' });
    }
    const cleanEmoji = sanitizeText(emoji, 8) || '🙂';

    addPlayer(game, socket.id, cleanNick, cleanEmoji);
    socket.join(pin);
    socketMeta.set(socket.id, { pin, role: 'player' });

    ack?.({
      pin,
      quizTitle: game.quiz.title,
      totalQuestions: game.quiz.questions.length,
      players: playerList(game),
    });
    io.to(pin).emit('lobby:update', { players: playerList(game) });
  });

  socket.on('host:startGame', (pin, ack) => {
    const game = getGame(pin);
    if (!game) return ack?.({ error: 'Game not found.' });
    if (game.hostSocketId !== socket.id) return ack?.({ error: 'Not authorized.' });
    if (game.players.size === 0) return ack?.({ error: 'Need at least one player to start.' });
    if (game.state !== 'lobby') return ack?.({ error: 'Game already started.' });

    startQuestion(game, 0, () => {
      broadcastRevealAndScores(pin, game);
    });
    io.to(pin).emit('question:start', publicQuestionPayload(game));
    ack?.({ ok: true });
  });

  socket.on('player:answer', ({ pin, choiceIndex }, ack) => {
    const game = getGame(pin);
    if (!game) return ack?.({ error: 'Game not found.' });
    const result = submitAnswer(game, socket.id, choiceIndex);
    if (!result) return ack?.({ error: 'Answer not accepted.' });
    ack?.({ locked: true });

    if (answeredCount(game) === game.players.size) {
      endQuestion(game);
      broadcastRevealAndScores(pin, game);
    } else {
      io.to(pin).emit('answer:progress', {
        totalAnswered: answeredCount(game),
        totalPlayers: game.players.size,
      });
    }
  });

  // Advances the state machine: reveal -> leaderboard -> next question | ended.
  // Also allows the host to force-skip an in-progress question straight to reveal.
  socket.on('host:next', (pin, ack) => {
    const game = getGame(pin);
    if (!game) return ack?.({ error: 'Game not found.' });
    if (game.hostSocketId !== socket.id) return ack?.({ error: 'Not authorized.' });

    if (game.state === 'question') {
      endQuestion(game);
      broadcastRevealAndScores(pin, game);
      return ack?.({ ok: true, next: 'reveal' });
    }

    if (game.state === 'reveal') {
      game.state = 'leaderboard';
      io.to(pin).emit('leaderboard:show', {
        top: leaderboard(game, 10),
        index: game.currentQuestionIndex,
        total: game.quiz.questions.length,
      });
      return ack?.({ ok: true, next: 'leaderboard' });
    }

    if (game.state === 'leaderboard') {
      const nextIndex = game.currentQuestionIndex + 1;
      if (nextIndex >= game.quiz.questions.length) {
        game.state = 'ended';
        io.to(pin).emit('game:ended', {
          top3: leaderboard(game, 3),
          full: leaderboard(game),
        });
        return ack?.({ ok: true, next: 'ended' });
      }
      startQuestion(game, nextIndex, () => {
        broadcastRevealAndScores(pin, game);
      });
      io.to(pin).emit('question:start', publicQuestionPayload(game));
      return ack?.({ ok: true, next: 'question' });
    }

    ack?.({ error: `Cannot advance from state "${game.state}"` });
  });

  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    socketMeta.delete(socket.id);
    const game = getGame(meta.pin);
    if (!game) return;

    if (meta.role === 'host') {
      io.to(meta.pin).emit('host:disconnected');
      deleteGame(meta.pin);
    } else {
      removePlayer(game, socket.id);
      if (game.state === 'lobby') {
        io.to(meta.pin).emit('lobby:update', { players: playerList(game) });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  const ip = getLocalIp();
  console.log(`Kahoot-clone server listening on port ${PORT}`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://${ip}:${PORT}`);
});
