import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalScore: number;
  correctAnswers: number;
  puzzleSolved: boolean;
  timeSpent: number;
  rank: number;
}

export default function Leaderboard() {
  const { challengeId } = useParams<{ challengeId?: string }>();
  const isGlobal = !challengeId;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket(challengeId || null, 'viewer', 'Viewer');

  useEffect(() => {
    fetchLeaderboard();

    if (socket && !isGlobal) {
      socket.on('leaderboard:update', (newEntries: LeaderboardEntry[]) => {
        setEntries(newEntries);
      });
    }

    return () => {
      if (socket) {
        socket.off('leaderboard:update');
      }
    };
  }, [challengeId, socket]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const url = isGlobal ? '/leaderboard/global' : `/leaderboard/${challengeId}`;
      const res = await api.get(url);
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-300 to-yellow-500 text-yellow-900';
      case 2: return 'from-slate-300 to-slate-400 text-slate-800';
      case 3: return 'from-amber-600 to-amber-700 text-amber-100';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-white mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent inline-block">
          {isGlobal ? 'Global Champions' : 'Challenge Leaderboard'}
        </h2>
        <p className="text-slate-400">
          {isGlobal ? 'The absolute best players across all challenges.' : 'Real-time rankings for this specific puzzle challenge.'}
        </p>
        {!isGlobal && (
          <div className="mt-6 flex justify-center gap-4">
            <Link to={`/lobby/${challengeId}`} className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
              Back to Lobby
            </Link>
            <Link to="/leaderboard" className="px-5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-sm font-medium transition-colors">
              View Global Leaderboard
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl">
          <p className="text-slate-400 text-lg">No entries found yet.</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-5 font-semibold w-20 text-center">Rank</th>
                  <th className="p-5 font-semibold">Player</th>
                  <th className="p-5 font-semibold text-right">Total Score</th>
                  <th className="p-5 font-semibold text-center">Questions</th>
                  <th className="p-5 font-semibold text-center">Time</th>
                  <th className="p-5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {entries.map((entry) => (
                  <tr key={entry.playerId} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-5 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                        entry.rank <= 3 ? `bg-gradient-to-br ${getMedalColor(entry.rank)}` : getMedalColor(entry.rank)
                      }`}>
                        {entry.rank}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">{entry.playerName}</div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="font-mono text-2xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        {entry.totalScore.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-5 text-center text-slate-300">
                      {entry.correctAnswers} <span className="text-xs text-slate-500">correct</span>
                    </td>
                    <td className="p-5 text-center text-slate-300 font-mono">
                      {Math.floor(entry.timeSpent / 60)}:{String(entry.timeSpent % 60).padStart(2, '0')}
                    </td>
                    <td className="p-5 text-center">
                      {entry.puzzleSolved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Solved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                          DNF
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
