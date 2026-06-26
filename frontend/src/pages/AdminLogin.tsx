import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Temporary logic: If backend has no admins, we should probably register first, 
      // but for simplicity, assuming login/registration are handled via the same generic flow or API.
      // We will focus just on login for this UI.
      const res = await api.post('/admin/login', { username, password });
      setAuth(res.data.admin, res.data.access_token);
      navigate('/admin');
    } catch (err: any) {
      // Fallback for first time setup (if login fails, try register if it's "admin" / "admin" etc)
      // For production, a proper setup flow is better.
      try {
        const setupRes = await api.post('/admin/register', {
          username,
          password,
          displayName: 'Administrator'
        });
        setAuth(setupRes.data.admin, setupRes.data.access_token);
        navigate('/admin');
      } catch (regErr: any) {
        setError(err.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-200">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/30 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="mt-6 text-center text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          QuizPuzzle Admin
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Sign in to manage your challenges
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-800/50 text-white transition-all"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-800/50 text-white transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800/30">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-100"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            <p className="text-xs text-center text-slate-500 mt-4">
              First time login will automatically create the admin account if none exists.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
