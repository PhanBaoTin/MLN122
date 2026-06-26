import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const { isAuthenticated, admin, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              QuizPuzzle Admin
            </h1>
            <nav className="hidden md:flex gap-4">
              <Link to="/admin" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
              <Link to="/admin/challenges/new" className="text-slate-300 hover:text-white transition-colors">New Challenge</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Welcome, {admin?.displayName}</span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
