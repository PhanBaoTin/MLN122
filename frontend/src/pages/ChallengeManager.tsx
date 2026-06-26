import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ChallengeSettings {
  maxQuestionsCount: number;
  questionTimeLimit: number;
  gameTimeLimit: number;
  basePointsPerCorrect: number;
  speedBonusMax: number;
  completionBonus: number;
  timeRemainingWeight: number;
}

interface Challenge {
  _id?: string;
  shareCode?: string;
  title: string;
  description: string;
  gridSize: number;
  status: 'draft' | 'active' | 'closed';
  settings: ChallengeSettings;
  images?: { url: string; originalName: string }[];
  questions?: string[];
}

const defaultSettings: ChallengeSettings = {
  maxQuestionsCount: 20,
  questionTimeLimit: 30,
  gameTimeLimit: 600,
  basePointsPerCorrect: 100,
  speedBonusMax: 50,
  completionBonus: 500,
  timeRemainingWeight: 2,
};

import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

export default function ChallengeManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<'settings' | 'images' | 'questions'>('settings');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  const [challenge, setChallenge] = useState<Challenge>({
    title: '',
    description: '',
    gridSize: 3,
    status: 'draft',
    settings: { ...defaultSettings },
  });


  // Questions State
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    options: [
      { id: '1', text: '' },
      { id: '2', text: '' },
      { id: '3', text: '' },
      { id: '4', text: '' },
    ],
    correctOptionId: '1',
  });

  useEffect(() => {
    if (isEdit) {
      fetchChallenge();
      fetchQuestions();
    }
  }, [id]);

  const fetchChallenge = async () => {
    try {
      const res = await api.get(`/challenges/${id}`);
      setChallenge(res.data);
    } catch (err) {
      console.error(err);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/challenges/${id}/questions`);

      console.log(res.data);

      setQuestions(
        Array.isArray(res.data)
          ? res.data
          : res.data.questions || []
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        const payload = {
          title: challenge.title,
          description: challenge.description,
          gridSize: challenge.gridSize,
          status: challenge.status,
          settings: challenge.settings
            ? {
              maxQuestionsCount: challenge.settings.maxQuestionsCount,
              questionTimeLimit: challenge.settings.questionTimeLimit,
              gameTimeLimit: challenge.settings.gameTimeLimit,
              basePointsPerCorrect: challenge.settings.basePointsPerCorrect,
              speedBonusMax: challenge.settings.speedBonusMax,
              completionBonus: challenge.settings.completionBonus,
              timeRemainingWeight: challenge.settings.timeRemainingWeight,
            }
            : undefined,
          schedule: (challenge as any).schedule
            ? {
              openAt: (challenge as any).schedule.openAt,
              closeAt: (challenge as any).schedule.closeAt,
            }
            : undefined,
          announcement: (challenge as any).announcement,
        };

        await api.put(`/challenges/${id}`, payload);
      } else {
        const res = await api.post('/challenges', challenge);
        navigate(`/admin/challenges/${res.data._id}/edit`);
      }
    } catch (err: any) {
      console.log('STATUS:', err.response?.status);
      console.log('DATA:', err.response?.data);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !id) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post(`/challenges/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setChallenge(res.data);
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!id) return;
    try {
      const res = await api.delete(`/challenges/${id}/images/${index}`);
      setChallenge(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.post(`/challenges/${id}/questions`, newQuestion);
      setNewQuestion({
        questionText: '',
        options: [
          { id: '1', text: '' },
          { id: '2', text: '' },
          { id: '3', text: '' },
          { id: '4', text: '' },
        ],
        correctOptionId: '1',
      });
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await api.delete(`/questions/${qId}`);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !id) return;
    const file = e.target.files[0];
    setUploadingExcel(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const formattedQuestions = jsonData.map((row: any) => {
        return {
          questionText: row['Question']?.toString() || '',
          options: [
            { id: '1', text: row['Option 1']?.toString() || '' },
            { id: '2', text: row['Option 2']?.toString() || '' },
            { id: '3', text: row['Option 3']?.toString() || '' },
            { id: '4', text: row['Option 4']?.toString() || '' },
          ],
          correctOptionId: row['Correct Option']?.toString() || '1',
        };
      }).filter((q: any) => q.questionText.trim() !== '');

      if (formattedQuestions.length > 0) {
        await api.post(`/challenges/${id}/questions/bulk`, { questions: formattedQuestions });
        fetchQuestions();
      } else {
        alert('No valid questions found in the Excel file. Please ensure columns match: Question, Option 1, Option 2, Option 3, Option 4, Correct Option');
      }
    } catch (err) {
      console.error('Excel upload failed', err);
      alert('Failed to process Excel file.');
    } finally {
      setUploadingExcel(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }
  console.log('QUESTIONS STATE:', questions);
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isEdit ? 'Edit Challenge' : 'New Challenge'}
          </h2>
          {isEdit && (
            <div className="flex items-center gap-3">
              <p className="text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded inline-block">
                Share Code: <span className="text-cyan-400">{challenge.shareCode}</span>
              </p>
              <button
                onClick={() => setShowQR(!showQR)}
                className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
                title="Show QR Code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
            </div>
          )}
          {showQR && isEdit && (
            <div className="mt-4 p-4 bg-white rounded-xl inline-block shadow-xl">
              <QRCodeSVG
                value={`${window.location.origin}/play/${challenge.shareCode}`}
                size={150}
                level="H"
                includeMargin={true}
              />
              <p className="text-center text-slate-800 text-xs font-bold mt-2">Scan to Play</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('images')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'images' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                Images
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'questions' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                Questions
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">General Info</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={challenge.title}
                    onChange={(e) => setChallenge({ ...challenge, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={challenge.description}
                    onChange={(e) => setChallenge({ ...challenge, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:border-indigo-500 h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={challenge.status}
                    onChange={(e) => setChallenge({ ...challenge, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Grid Size</label>
                  <select
                    value={challenge.gridSize}
                    onChange={(e) => setChallenge({ ...challenge, gridSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={3}>3x3</option>
                    <option value={4}>4x4</option>
                    <option value={5}>5x5</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Game Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Max Questions</label>
                    <input
                      type="number"
                      value={challenge.settings.maxQuestionsCount}
                      onChange={(e) => setChallenge({
                        ...challenge,
                        settings: { ...challenge.settings, maxQuestionsCount: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Time Limit (Total s)</label>
                    <input
                      type="number"
                      value={challenge.settings.gameTimeLimit}
                      onChange={(e) => setChallenge({
                        ...challenge,
                        settings: { ...challenge.settings, gameTimeLimit: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Time Limit (Question s)</label>
                    <input
                      type="number"
                      value={challenge.settings.questionTimeLimit}
                      onChange={(e) => setChallenge({
                        ...challenge,
                        settings: { ...challenge.settings, questionTimeLimit: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Base Points (Correct)</label>
                    <input
                      type="number"
                      value={challenge.settings.basePointsPerCorrect}
                      onChange={(e) => setChallenge({
                        ...challenge,
                        settings: { ...challenge.settings, basePointsPerCorrect: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Max Speed Bonus</label>
                    <input
                      type="number"
                      value={challenge.settings.speedBonusMax}
                      onChange={(e) => setChallenge({
                        ...challenge,
                        settings: { ...challenge.settings, speedBonusMax: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Completion Bonus</label>
                    <input
                      type="number"
                      value={challenge.settings.completionBonus}
                      onChange={(e) => setChallenge({
                        ...challenge,
                        settings: { ...challenge.settings, completionBonus: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Time Remaining Weight (pts/sec)</label>
                    <input
                      type="number"
                      value={challenge.settings.timeRemainingWeight}
                      onChange={(e) => setChallenge({
                        ...challenge,
                        settings: { ...challenge.settings, timeRemainingWeight: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create & Continue')}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Puzzle Images</h3>
              <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition-colors shadow-lg shadow-indigo-600/20 text-sm font-medium">
                Upload Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

            {challenge.images && challenge.images.length === 0 && (
              <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                <p className="text-slate-400">No images uploaded yet. Players need at least one image to solve.</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {challenge.images?.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-square">
                  {/* Note: In a real environment, the backend server URL is needed here. For this demo, using a generic prefix. */}
                  <img src={`http://localhost:3000${img.url}`} alt={img.originalName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Questions ({questions.length})</h3>
                <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-colors shadow-lg shadow-emerald-600/20 text-sm font-medium">
                  {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} disabled={uploadingExcel} />
                </label>
              </div>
              {questions.length === 0 ? (
                <p className="text-slate-400 italic mb-6">No questions added yet.</p>
              ) : (
                <div className="space-y-4 mb-8">
                  {Array.isArray(questions) && questions.map((q, idx) => (
                    <div key={q._id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-white">Q{idx + 1}: {q.questionText}</span>
                        <button onClick={() => handleDeleteQuestion(q._id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt: any) => (
                          <div key={opt.id} className={`text-sm p-2 rounded-lg ${opt.id === q.correctOptionId ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                            {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
              <h4 className="text-md font-semibold text-white mb-4">Add New Question</h4>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Question Text</label>
                  <input
                    type="text"
                    required
                    value={newQuestion.questionText}
                    onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {newQuestion.options.map((opt, idx) => (
                    <div key={opt.id}>
                      <label className="flex items-center text-sm font-medium text-slate-300 mb-1 gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={newQuestion.correctOptionId === opt.id}
                          onChange={() => setNewQuestion({ ...newQuestion, correctOptionId: opt.id })}
                          className="text-indigo-500 focus:ring-indigo-500"
                        />
                        Option {idx + 1} {newQuestion.correctOptionId === opt.id && '(Correct)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...newQuestion.options];
                          newOpts[idx].text = e.target.value;
                          setNewQuestion({ ...newQuestion, options: newOpts });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg bg-slate-700 text-white focus:outline-none ${newQuestion.correctOptionId === opt.id ? 'border-emerald-500' : 'border-slate-600 focus:border-indigo-500'}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-end">
                  <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20">
                    Add Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
