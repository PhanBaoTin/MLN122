import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import api from '../services/api';

export default function GameResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { playerId, playerName } = usePlayerStore();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) {
      navigate('/play');
      return;
    }
    
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}`);
        setSession(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
  }, [sessionId, playerId, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return <div className="text-white text-center mt-20">Session not found.</div>;
  }

  const isWin = session.isPuzzleSolved;

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 text-center">
        {/* Confetti / Glow Background */}
        <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full mix-blend-screen filter blur-[80px] opacity-50 ${isWin ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
        <div className={`absolute -bottom-32 -right-32 w-64 h-64 rounded-full mix-blend-screen filter blur-[80px] opacity-50 ${isWin ? 'bg-cyan-500' : 'bg-orange-500'}`}></div>

        <div className="relative z-10">
          <div className="mb-6 inline-block">
            {isWin ? (
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>

          <h2 className="text-4xl font-extrabold text-white mb-2">
            {isWin ? 'Puzzle Solved!' : 'Time is Up!'}
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Great effort, <span className="text-white font-semibold">{playerName}</span>! Here is your final result.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <p className="text-sm font-medium text-slate-400 mb-1">Total Score</p>
              <p className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                {session.totalScore}
              </p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <p className="text-sm font-medium text-slate-400 mb-1">Questions Answered</p>
              <p className="text-3xl font-bold text-white">
                {session.questionsAnswered.filter((q: any) => q.isCorrect).length} <span className="text-lg text-slate-500">/ {session.currentQuestionIndex}</span>
              </p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <p className="text-sm font-medium text-slate-400 mb-1">Moves Used</p>
              <p className="text-3xl font-bold text-white">{session.movesUsed}</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <p className="text-sm font-medium text-slate-400 mb-1">Time Spent</p>
              <p className="text-3xl font-bold text-white">
                {session.completedAt 
                  ? Math.floor((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
                  : session.gameTimeLimit}s
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to={`/leaderboard/${session.challengeId}`}
              className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 transition-all shadow-lg shadow-indigo-600/25 flex-1"
            >
              View Leaderboard
            </Link>
            <Link 
              to={`/lobby/${session.challengeId}`}
              className="px-8 py-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 flex-1"
            >
              Back to Lobby
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
