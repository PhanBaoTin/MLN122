import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import PlayerLayout from './components/layout/PlayerLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ChallengeManager from './pages/ChallengeManager';
import PlayerJoin from './pages/PlayerJoin';
import Lobby from './pages/Lobby';
import GamePlay from './pages/GamePlay';
import GameResult from './pages/GameResult';
import Leaderboard from './pages/Leaderboard';

const router = createBrowserRouter([
  // Admin Routes
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'challenges/new', element: <ChallengeManager /> },
      { path: 'challenges/:id/edit', element: <ChallengeManager /> },
    ],
  },
  
  // Player Routes
  {
    path: '/',
    element: <PlayerLayout />,
    children: [
      { index: true, element: <Navigate to="/play" replace /> },
      { path: 'play', element: <PlayerJoin /> }, // Generic join without code
      { path: 'play/:shareCode', element: <PlayerJoin /> },
      { path: 'lobby/:challengeId', element: <Lobby /> },
      { path: 'game/:sessionId', element: <GamePlay /> },
      { path: 'result/:sessionId', element: <GameResult /> },
      { path: 'leaderboard', element: <Leaderboard /> }, // Global
      { path: 'leaderboard/:challengeId', element: <Leaderboard /> }, // Per-challenge
    ],
  },
  
  // Catch all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
