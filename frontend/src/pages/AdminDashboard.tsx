import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Challenge {
  _id: string;
  title: string;
  status: 'draft' | 'active' | 'closed';
  gridSize: number;
  shareCode: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await api.get('/challenges');
      setChallenges(res.data);
    } catch (err) {
      console.error('Failed to fetch challenges', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'draft': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'closed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Challenges Dashboard</h2>
        <Link
          to="/admin/challenges/new"
          className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create Challenge
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No challenges yet</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-6">
            Get started by creating your first puzzle and quiz challenge for your players.
          </p>
          <Link
            to="/admin/challenges/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Create your first challenge
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div key={challenge._id} className="bg-slate-900/60 backdrop-blur-lg border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(challenge.status)}`}>
                    {challenge.status.toUpperCase()}
                  </span>
                  <span className="text-slate-500 text-xs bg-slate-800 px-2 py-1 rounded-md">
                    {challenge.gridSize}x{challenge.gridSize} grid
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {challenge.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Code: <span className="font-mono text-cyan-400">{challenge.shareCode}</span>
                </p>
                <div className="flex items-center text-xs text-slate-500 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(challenge.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-slate-800/50 px-6 py-3 border-t border-slate-800 flex justify-between">
                <Link 
                  to={`/admin/challenges/${challenge._id}/edit`}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Manage
                </Link>
                <Link 
                  to={`/leaderboard/${challenge._id}`}
                  className="text-sm text-slate-400 hover:text-white font-medium transition-colors"
                >
                  Leaderboard
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
