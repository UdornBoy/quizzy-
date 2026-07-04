import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import HostCreate from './pages/HostCreate.jsx';
import HostLobby from './pages/HostLobby.jsx';
import HostGame from './pages/HostGame.jsx';
import PlayerJoin from './pages/PlayerJoin.jsx';
import PlayerProfile from './pages/PlayerProfile.jsx';
import PlayerLobby from './pages/PlayerLobby.jsx';
import PlayerGame from './pages/PlayerGame.jsx';
import GameSocketSync from './GameSocketSync.jsx';

export default function App() {
  return (
    <>
      <GameSocketSync />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host/create" element={<HostCreate />} />
        <Route path="/host/lobby" element={<HostLobby />} />
        <Route path="/host/game" element={<HostGame />} />
        <Route path="/join" element={<PlayerJoin />} />
        <Route path="/join/profile" element={<PlayerProfile />} />
        <Route path="/join/lobby" element={<PlayerLobby />} />
        <Route path="/join/game" element={<PlayerGame />} />
      </Routes>
    </>
  );
}
