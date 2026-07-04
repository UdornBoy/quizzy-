import { calculatePoints } from './scoring.js';

/** @typedef {'lobby'|'question'|'reveal'|'leaderboard'|'ended'} GameState */

const games = new Map(); // pin -> Game

function generatePin() {
  let pin;
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000));
  } while (games.has(pin));
  return pin;
}

export function createGame(hostSocketId, quiz) {
  const pin = generatePin();
  const game = {
    pin,
    hostSocketId,
    quiz,
    state: /** @type {GameState} */ ('lobby'),
    players: new Map(), // socketId -> { id, nickname, emoji, score }
    currentQuestionIndex: -1,
    questionEndsAt: null,
    answers: new Map(), // socketId -> { choiceIndex, timeTakenMs, correct, points }
    timer: null,
  };
  games.set(pin, game);
  return game;
}

export function getGame(pin) {
  return games.get(pin);
}

export function deleteGame(pin) {
  const game = games.get(pin);
  if (game?.timer) clearTimeout(game.timer);
  games.delete(pin);
}

export function addPlayer(game, socketId, nickname, emoji) {
  game.players.set(socketId, { id: socketId, nickname, emoji, score: 0 });
}

export function removePlayer(game, socketId) {
  game.players.delete(socketId);
}

export function isNicknameTaken(game, nickname) {
  const lower = nickname.trim().toLowerCase();
  for (const p of game.players.values()) {
    if (p.nickname.toLowerCase() === lower) return true;
  }
  return false;
}

export function currentQuestion(game) {
  return game.quiz.questions[game.currentQuestionIndex];
}

export function playerList(game) {
  return Array.from(game.players.values()).map((p) => ({
    id: p.id,
    nickname: p.nickname,
    emoji: p.emoji,
  }));
}

export function leaderboard(game, limit = Infinity) {
  return Array.from(game.players.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p) => ({ id: p.id, nickname: p.nickname, emoji: p.emoji, score: p.score }));
}

/**
 * Moves the game into the "question" state for the given index and arms
 * the server-authoritative timer. onEnd is invoked (once) when the timer
 * naturally expires.
 */
export function startQuestion(game, index, onEnd) {
  game.currentQuestionIndex = index;
  game.state = 'question';
  game.answers = new Map();
  const q = currentQuestion(game);
  const durationMs = q.durationSeconds * 1000;
  game.questionEndsAt = Date.now() + durationMs;
  if (game.timer) clearTimeout(game.timer);
  game.timer = setTimeout(() => {
    if (game.state === 'question') {
      endQuestion(game);
      onEnd();
    }
  }, durationMs);
}

export function endQuestion(game) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
  game.state = 'reveal';
}

/** Records a player's answer and returns the scored result. Idempotent per player per question. */
export function submitAnswer(game, socketId, choiceIndex) {
  if (game.state !== 'question') return null;
  if (game.answers.has(socketId)) return null;

  const q = currentQuestion(game);
  const durationMs = q.durationSeconds * 1000;
  const timeTakenMs = durationMs - Math.max(0, game.questionEndsAt - Date.now());
  const correct = choiceIndex === q.correctIndex;
  const points = calculatePoints(correct, timeTakenMs, durationMs);

  const result = { choiceIndex, timeTakenMs, correct, points };
  game.answers.set(socketId, result);

  const player = game.players.get(socketId);
  if (player) player.score += points;

  return result;
}

export function answerCounts(game) {
  const q = currentQuestion(game);
  const counts = new Array(q.choices.length).fill(0);
  for (const a of game.answers.values()) {
    if (a.choiceIndex >= 0 && a.choiceIndex < counts.length) counts[a.choiceIndex] += 1;
  }
  return counts;
}

export function answeredCount(game) {
  return game.answers.size;
}
