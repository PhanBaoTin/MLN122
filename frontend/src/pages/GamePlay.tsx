import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import api from '../services/api';
import PuzzleBoard from '../components/game/PuzzleBoard';

export default function GamePlay() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { playerId, playerName } = usePlayerStore();

  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [canMove, setCanMove] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Timers
  const [gameTimeLeft, setGameTimeLeft] = useState<number>(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(0);
  const questionStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!playerId) {
      navigate('/play');
      return;
    }
    fetchGameData();
  }, [sessionId]);

  const fetchGameData = async () => {
    try {
      // 1. Lấy thông tin phiên chơi (Session) hiện tại
      const res = await api.get(`/sessions/${sessionId}`);
      const data = res.data;

      if (data.isCompleted) {
        navigate(`/result/${sessionId}`);
        return;
      }

      setSession(data);

      // Tính toán thời gian game còn lại
      const startedAt = new Date(data.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setGameTimeLeft(Math.max(0, data.gameTimeLimit - elapsed));

      // 2. Gọi tới API Public mà ta vừa mở ở Backend để lấy dữ liệu Challenge
      const qRes = await api.get(`/challenges/${data.challengeId}/questions`);

      // LƯU Ý: Vì BE trả về Object Challenge chứa mảng questions bên trong, 
      // ta cần trỏ đúng vào mảng đó (ví dụ: qRes.data.questions)
      const challengeData = qRes.data;
      const questionList = challengeData.questions || [];

      setQuestions(questionList);

      const qIndex = data.currentQuestionIndex;
      if (qIndex < questionList.length) {
        setCurrentQuestion(questionList[qIndex]);
        setQuestionTimeLeft(30); // 30s đếm ngược cho câu hỏi
        questionStartTimeRef.current = Date.now();
      }

    } catch (err) {
      console.error("Lỗi tải dữ liệu game:", err);
      navigate('/play');
    } finally {
      setLoading(false);
    }
  };

  // Game Timer
  useEffect(() => {
    if (loading || !session || session.isCompleted) return;

    const interval = setInterval(() => {
      setGameTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, session]);

  // Question Timer
  useEffect(() => {
    if (loading || !currentQuestion || canMove || answerStatus !== 'idle') return;

    const interval = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAnswer(true); // submit empty answer on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, currentQuestion, canMove, answerStatus]);

  const handleTimeUp = async () => {
    try {
      await api.post(`/sessions/${sessionId}/timeout`);
      navigate(`/result/${sessionId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAnswer = async (isTimeout = false) => {
    if (!currentQuestion) return;
    if (answerStatus !== 'idle' && !isTimeout) return;

    const timeSpentMs = Date.now() - questionStartTimeRef.current;

    try {
      const res = await api.post(`/sessions/${sessionId}/answer`, {
        questionId: currentQuestion._id,
        selectedOptionId: isTimeout ? null : selectedOptionId,
        timeSpent: timeSpentMs
      });

      setAnswerStatus(res.data.isCorrect ? 'correct' : 'wrong');

      if (res.data.isCorrect) {
        console.log("ANSWER CORRECT");
        setCanMove(true);
      } else {
        // Wrong answer -> Next question immediately
        setTimeout(() => {
          advanceToNextQuestion();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTileClick = async (row: number, col: number) => {
    console.log("CLICK TILE");
    console.log("canMove =", canMove);
    console.log("currentQuestion =", currentQuestion);
    if (!canMove) return;

    try {
      const res = await api.post(`/sessions/${sessionId}/move`, {
        tileRow: row,
        tileCol: col
      });

      setSession((prev: any) => ({
        ...prev,
        puzzleState: res.data.puzzleState,
        totalScore: res.data.totalScore
      }));

      setCanMove(false);

      if (res.data.isCompleted) {
        navigate(`/result/${sessionId}`);
      } else {
        advanceToNextQuestion();
      }
    } catch (err: any) {
      console.log("STATUS:", err.response?.status);
      console.log("DATA:", err.response?.data);
      console.error(err);
    }
  };

  const advanceToNextQuestion = () => {
    setSession((prev: any) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestion(questions[nextIndex]);
        setQuestionTimeLeft(30); // reset timer
        questionStartTimeRef.current = Date.now();
        setSelectedOptionId(null);
        setAnswerStatus('idle');
        return { ...prev, currentQuestionIndex: nextIndex };
      } else {
        // No more questions
        handleTimeUp();
        return prev;
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full mt-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mb-4"></div>
        <h2 className="text-xl font-bold text-slate-300">Loading your puzzle...</h2>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      {/* Left Column: Puzzle */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-400">
                {playerName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Player</p>
              <p className="font-bold text-white">{playerName}</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-xs text-slate-400 mb-1">Target Image</p>
            <img
              src={`${session.assignedImageUrl}`}
              alt="Reference"
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-slate-600 shadow-md hover:scale-150 transition-transform duration-300 origin-top"
            />
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Time Remaining</p>
            <p className={`font-mono text-2xl font-bold ${gameTimeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
              {formatTime(gameTimeLeft)}
            </p>
          </div>
        </div>

        {canMove && (
          <div className="bg-emerald-900/30 border border-emerald-500/50 p-4 rounded-2xl text-center animate-bounce shadow-lg shadow-emerald-900/20">
            <p className="text-emerald-400 font-bold text-lg">Correct! Tap a glowing tile to move it.</p>
          </div>
        )}

        <PuzzleBoard
          puzzleState={session.puzzleState}
          imageUrl={`${session.assignedImageUrl}`}
          gridSize={session.puzzleState.length}
          onTileClick={handleTileClick}
          canMove={canMove}
          isCompleted={session.isCompleted}
        />
      </div>

      {/* Right Column: Questions */}
      <div className="w-full md:w-96 flex flex-col gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">
              Question {session.currentQuestionIndex + 1}
              <span className="text-slate-500 text-sm font-normal ml-2">of {questions.length}</span>
            </h3>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${questionTimeLeft <= 5 ? 'border-red-500 text-red-400 animate-pulse' : 'border-indigo-500 text-indigo-400'
              }`}>
              <span className="font-mono font-bold">{questionTimeLeft}</span>
            </div>
          </div>

          {currentQuestion && (
            <div className="flex-1 flex flex-col">
              <p className="text-xl text-white mb-8 font-medium leading-relaxed">
                {currentQuestion.questionText}
              </p>

              <div className="space-y-3 flex-1">
                {currentQuestion.options?.map((opt: any) => {
                  const isSelected = selectedOptionId === opt.id;
                  let btnClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 ";

                  if (answerStatus === 'idle') {
                    btnClass += isSelected
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600";
                  } else if (answerStatus === 'correct' && isSelected) {
                    btnClass += "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30 animate-pulse";
                  } else if (answerStatus === 'wrong' && isSelected) {
                    btnClass += "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30";
                  } else {
                    btnClass += "bg-slate-800/40 border-slate-800 text-slate-500 opacity-50";
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={answerStatus !== 'idle' || canMove}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={btnClass}
                    >
                      <span className="font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {answerStatus === 'idle' && !canMove && (
                <button
                  onClick={() => handleSubmitAnswer(false)}
                  disabled={!selectedOptionId}
                  className="w-full mt-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 disabled:from-slate-700 disabled:to-slate-700 transition-all shadow-lg"
                >
                  Submit Answer
                </button>
              )}

              {answerStatus === 'wrong' && !canMove && (
                <div className="mt-6 text-center text-red-400 font-medium p-4 bg-red-900/20 border border-red-900/50 rounded-xl">
                  Incorrect! Moving to next question...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
