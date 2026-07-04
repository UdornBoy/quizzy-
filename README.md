# Quizzy — a Kahoot-style live quiz game

Real-time multiplayer quiz game. One host runs the quiz on a screen; players join
from their phones using a PIN or QR code and race to answer before the timer runs out.

## Stack
- **Server**: Node.js + Express + Socket.IO (in-memory game state, no database)
- **Client**: React + Vite + Socket.IO client, plain CSS (no UI framework)

## Running it

You need two terminals — the server and the client run separately.

**Terminal 1 — server** (port 3001)
```
cd server
npm install
npm run dev
```

**Terminal 2 — client** (port 5173)
```
cd client
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser — that's the host screen.

## Playing a game

1. On the host screen, click **Host a Game**, build a quiz (or click **Load sample quiz**
   to try it instantly), and click **Create Game**.
2. The lobby shows a 6-digit **PIN** and a **QR code**. Players on the same Wi-Fi
   network scan the QR code (or open the printed URL) on their phones to join —
   this works because the client dev server is started with `--host`, exposing it
   on your LAN IP, printed by the server on startup.
3. Each player enters the PIN (if not pre-filled via QR), picks a nickname and an
   animated emoji avatar, and lands in the waiting lobby.
4. The host clicks **Start Game** once enough players have joined.
5. For each question, players tap one of 4 colored/shaped answer buttons before
   the countdown hits zero. Faster correct answers score more points (1000 max,
   decaying to 100 as time runs out); wrong or missed answers score 0.
6. After the timer ends (or the host manually skips), the correct answer and a
   bar chart of how everyone answered is revealed, followed by a live leaderboard.
7. After the last question, the game shows the **top 3 podium** and full final
   standings.

## Notes
- Game state is entirely in-memory — restarting the server clears all games.

## Deploying it permanently (public URL, anyone can join)

The server and client are built as a **single deployable service**: the
Express server serves the built React app directly, so there's exactly one
public URL for both the host and every player. See [DEPLOY.md](DEPLOY.md)
for step-by-step instructions to deploy this to Render for free.
