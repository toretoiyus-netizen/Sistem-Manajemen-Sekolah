import React, { useState, useEffect, useCallback } from 'react';
import {
  MonitorCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Send,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Sparkles,
  Award,
  KeyRound,
  RotateCcw,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Ujian, BankSoal, PesertaUjianSession } from '../types';
import { dbService } from '../services/mockDatabase';
import { QuestionMediaRenderer } from './QuestionMediaRenderer';
import { useToast } from './Toast';

interface CATExamPortalProps {
  onBackToApp: () => void;
  preSelectedExamId?: string;
}

export const CATExamPortal: React.FC<CATExamPortalProps> = ({
  onBackToApp,
  preSelectedExamId,
}) => {
  const db = dbService.getState();
  const { success, info, error } = useToast();

  // Screen Stage: 'login' | 'exam' | 'finish'
  const [stage, setStage] = useState<'login' | 'exam' | 'finish'>('login');

  // Login Form
  const [inputNisn, setInputNisn] = useState('0078129301');
  const [inputToken, setInputToken] = useState('JBR-789X');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Exam & Questions
  const [activeUjian, setActiveUjian] = useState<Ujian | null>(null);
  const [questions, setQuestions] = useState<BankSoal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Answers State: { [soalId]: { jawaban: string, isFlagged: boolean } }
  const [answers, setAnswers] = useState<Record<string, { jawaban: string; isFlagged: boolean }>>({});
  const [autoSavedTime, setAutoSavedTime] = useState<string>('Tersimpan');

  // Countdown Timer
  const [remainingSeconds, setRemainingSeconds] = useState(3600);

  // Anti-Cheat Tracker
  const [tabViolations, setTabViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmFinishModal, setShowConfirmFinishModal] = useState(false);

  // Final Result State
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [finalPassed, setFinalPassed] = useState<boolean>(true);

  // Auto initialize if preSelected
  useEffect(() => {
    if (preSelectedExamId) {
      const u = db.ujianList.find((x) => x.id === preSelectedExamId);
      if (u) {
        setInputToken(u.currentToken);
      }
    }
  }, [preSelectedExamId, db.ujianList]);

  // Anti-cheat tab switch detection
  useEffect(() => {
    if (stage !== 'exam') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolations((prev) => {
          const next = prev + 1;
          alert(
            `⚠️ PERINGATAN ANTI-CURANG!\nAnda terdeteksi berpindah tab atau meminimalkan browser (Pelanggaran ke-${next}). Aktivitas ini dicatat oleh sistem pengawas CAT.`
          );
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stage]);

  // Timer countdown hook
  useEffect(() => {
    if (stage !== 'exam') return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam(true); // Auto submit on time up!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // 1. Verify token
    const ujian = db.ujianList.find(
      (u) => u.currentToken.toUpperCase().trim() === inputToken.toUpperCase().trim()
    );

    if (!ujian) {
      setLoginError('Token Ujian tidak valid! Periksa kembali kartu token Anda.');
      return;
    }

    if (ujian.status !== 'Published') {
      setLoginError('Ujian ini belum dipublikasikan atau sedang ditutup oleh panitia.');
      return;
    }

    // 2. Fetch questions
    const questionList = db.bankSoal.filter((s) => (ujian.soalIds || []).includes(s.id));
    if (questionList.length === 0) {
      setLoginError('Belum ada butir soal yang dimuat ke dalam paket ujian ini.');
      return;
    }

    // Acak soal jika ujian diatur acak
    let finalQuestions = [...questionList];
    if (ujian.acakSoal) {
      finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);
    }

    setActiveUjian(ujian);
    setQuestions(finalQuestions);
    setRemainingSeconds(ujian.durasiMenit * 60);
    setCurrentIndex(0);
    setAnswers({});
    setTabViolations(0);
    setStage('exam');
  };

  const handleSelectOption = (soalId: string, optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [soalId]: {
        jawaban: optionKey,
        isFlagged: prev[soalId]?.isFlagged || false,
      },
    }));
    setAutoSavedTime(`Tersimpan ${new Date().toLocaleTimeString('id-ID')}`);
  };

  const handleToggleFlag = (soalId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [soalId]: {
        jawaban: prev[soalId]?.jawaban || '',
        isFlagged: !prev[soalId]?.isFlagged,
      },
    }));
  };

  const handleFinishExam = useCallback(
    (isTimeUp: boolean = false) => {
      if (!activeUjian || questions.length === 0) return;

      // Calculate score
      let earnedScore = 0;
      let totalMaxScore = 0;
      let correctCount = 0;
      let wrongCount = 0;

      questions.forEach((q) => {
        totalMaxScore += q.bobot;
        const studentAns = answers[q.id]?.jawaban;
        if (studentAns && studentAns.toUpperCase().trim() === q.jawabanBenar.toUpperCase().trim()) {
          earnedScore += q.bobot;
          correctCount += 1;
        } else if (studentAns) {
          wrongCount += 1;
        } else {
          wrongCount += 1; // unanswered counts as wrong
        }
      });

      const finalCalculated = Math.round((earnedScore / (totalMaxScore || 1)) * 100);
      const isPassed = finalCalculated >= activeUjian.nilaiMinimum;

      // Find student
      const student = db.siswa.find((s) => s.nisn === inputNisn.trim()) || db.siswa[0];
      if (student && activeUjian) {
        dbService.recordExamResultToPortofolio({
          siswaId: student.id,
          nisn: student.nisn,
          namaSiswa: student.namaLengkap,
          ujianId: activeUjian.id,
          namaUjian: activeUjian.namaUjian,
          mapelNama: activeUjian.mapelNama,
          tanggalPelaksanaan: new Date().toISOString().split('T')[0],
          nilai: finalCalculated,
          kkm: activeUjian.nilaiMinimum,
          statusKelulusan: isPassed ? 'Tuntas' : 'Belum Tuntas (Remedial)',
          totalSoal: questions.length,
          jumlahBenar: correctCount,
          jumlahSalah: wrongCount,
          catatanEvaluasi: `Hasil evaluasi CAT resmi ${activeUjian.namaUjian}. Capaian ${finalCalculated}/100.`,
          kategoriCapaian:
            finalCalculated >= 90
              ? 'Sangat Baik'
              : finalCalculated >= 75
              ? 'Baik'
              : finalCalculated >= 60
              ? 'Cukup'
              : 'Perlu Bimbingan',
        });
      }

      setFinalScore(finalCalculated);
      setFinalPassed(isPassed);
      setShowConfirmFinishModal(false);
      setStage('finish');

      success(
        `Ujian CAT berhasil diserahkan! Skor Anda: ${finalCalculated} (${isPassed ? 'Tuntas/Lulus' : 'Belum Tuntas'}).`,
        'Asesmen Berhasil Disimpan'
      );

      if (isPassed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    },
    [activeUjian, questions, answers, success]
  );

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter((a: { jawaban: string; isFlagged: boolean }) => a.jawaban && a.jawaban !== '').length;

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top CAT Emergency Ribbon */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 px-4 py-2 border-b border-emerald-800/40 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
            PORTAL CAT RESMI JAWA BARAT
          </span>
          <span className="text-emerald-200 hidden sm:inline">
            SMAN 1 KOTA BANDUNG • SISTEM ASESMEN TERPADU
          </span>
        </div>
        <button
          onClick={onBackToApp}
          className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Aplikasi</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. LOGIN & TOKEN VERIFICATION SCREEN */}
      {/* ========================================================================= */}
      {stage === 'login' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-amber-950/60 mb-3">
                <MonitorCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Ruang Ujian Berbasis Komputer (CAT)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan NISN dan Token Ujian resmi yang tertera pada kartu ujian Anda.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-700/50 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div>{loginError}</div>
              </div>
            )}

            <form onSubmit={handleStartExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">NISN Peserta Didik</label>
                <input
                  type="text"
                  required
                  value={inputNisn}
                  onChange={(e) => setInputNisn(e.target.value)}
                  placeholder="10 Digit NISN (Contoh: 0078129301)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Token Ujian *</label>
                <input
                  type="text"
                  required
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Contoh: JBR-789X"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm uppercase"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-950/40 text-sm transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <MonitorCheck className="w-4 h-4" />
                  <span>Verifikasi & Masuk Ruang Ujian</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
                Peringatan: Selama ujian berlangsung, dilarang membuka tab baru, menyalin soal, atau
                menggunakan alat bantu. Sistem diawasi secara real-time.
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACTIVE COMPUTER ASSISTED TEST (CAT) EXAM RUNNER */}
      {/* ========================================================================= */}
      {stage === 'exam' && currentQ && (
        <div className="flex-1 flex flex-col">
          {/* Active CAT Header Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded">
                  {activeUjian?.jenis}
                </span>
                <span className="font-bold text-sm text-white">{activeUjian?.namaUjian}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Peserta: <strong className="text-amber-300">Ahmad Fajar Nugraha</strong> (NISN:{' '}
                {inputNisn}) • X MIPA 1
              </div>
            </div>

            {/* Live Countdown Clock */}
            <div className="flex items-center gap-4">
              {/* Auto Save Badge */}
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{autoSavedTime}</span>
              </div>

              {/* Countdown Pill */}
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black border ${
                  remainingSeconds < 300
                    ? 'bg-rose-950 text-rose-300 border-rose-600 animate-bounce'
                    : 'bg-slate-950 text-amber-300 border-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{formatTimer(remainingSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Main Question + Navigator Split */}
          <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left 3 Columns: Active Question Canvas */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
              <div>
                {/* Question Header & Flag Button */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                      {currentIndex + 1}
                    </span>
                    <span className="text-xs text-slate-400">
                      dari <strong>{totalQuestions} Butir Soal</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-emerald-400 font-mono">
                      Bobot: {currentQ.bobot} Poin
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(currentQ.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      answers[currentQ.id]?.isFlagged
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {answers[currentQ.id]?.isFlagged ? 'Ditandai Ragu-ragu' : 'Tandai Ragu'}
                    </span>
                  </button>
                </div>

                {/* Question Text */}
                <div className="mt-6 text-base sm:text-lg font-medium text-slate-100 leading-relaxed font-sans">
                  {currentQ.pertanyaan}
                </div>

                {/* Media Attachment (Video / Interactive Image / Standard Image) */}
                {currentQ.mediaTipe && currentQ.mediaTipe !== 'none' && currentQ.mediaUrl && (
                  <div className="mt-4">
                    <QuestionMediaRenderer
                      mediaTipe={currentQ.mediaTipe}
                      mediaUrl={currentQ.mediaUrl}
                      mediaCaption={currentQ.mediaCaption}
                      mediaHotspots={currentQ.mediaHotspots}
                    />
                  </div>
                )}

                {/* Multiple Choice Options */}
                {currentQ.jenisSoal === 'Pilihan Ganda' && (
                  <div className="mt-8 space-y-3">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => {
                      const optKey = `pilihan${opt}` as keyof BankSoal;
                      const optVal = currentQ[optKey] as string;
                      if (!optVal) return null;
                      const isSelected = answers[currentQ.id]?.jawaban === opt;

                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectOption(currentQ.id, opt)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                            isSelected
                              ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/50'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {opt}
                          </div>
                          <span className="text-sm sm:text-base leading-relaxed">{optVal}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Benar/Salah Options */}
                {currentQ.jenisSoal === 'Benar/Salah' && (
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {['A', 'B'].map((opt) => {
                      const label = opt === 'A' ? 'Benar' : 'Salah';
                      const isSelected = answers[currentQ.id]?.jawaban === opt;

                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectOption(currentQ.id, opt)}
                          className={`p-6 rounded-2xl border text-center text-base font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Essay / Isian Input */}
                {(currentQ.jenisSoal === 'Essay' || currentQ.jenisSoal === 'Isian Singkat') && (
                  <div className="mt-8">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Tuliskan Jawaban Uraian Anda:
                    </label>
                    <textarea
                      rows={5}
                      value={answers[currentQ.id]?.jawaban || ''}
                      onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                      placeholder="Ketik jawaban lengkap di sini..."
                      className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Nav Controller */}
              <div className="mt-10 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Soal Sebelumnya</span>
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
                    }
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <span>Soal Selanjutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmFinishModal(true)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Selesai & Kumpulkan Ujian</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right 1 Column: Question Grid Navigator */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Nomor Soal ({answeredCount}/{totalQuestions} Terjawab)
                </h3>

                {/* Number Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const ans = answers[q.id];
                    const isAnswered = ans && ans.jawaban && ans.jawaban !== '';
                    const isFlagged = ans?.isFlagged;
                    const isActive = currentIndex === idx;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-full aspect-square rounded-xl text-xs font-black flex items-center justify-center transition-all border ${
                          isActive
                            ? 'ring-2 ring-amber-400 border-amber-300 scale-105'
                            : 'border-slate-800'
                        } ${
                          isFlagged
                            ? 'bg-amber-500 text-slate-950'
                            : isAnswered
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-600"></span>
                    <span>Sudah Dijawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
                    <span>Ragu-ragu (Ditandai)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-700"></span>
                    <span>Belum Dijawab</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowConfirmFinishModal(true)}
                  className="w-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kumpulkan Ujian</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FINISH & SCORE RESULT SCREEN */}
      {/* ========================================================================= */}
      {stage === 'finish' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                finalPassed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              <Award className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              LEMBAR HASIL ASESMEN RESMI
            </span>
            <h2 className="text-xl font-black text-white mt-1">{activeUjian?.namaUjian}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Peserta: Ahmad Fajar Nugraha • NISN: {inputNisn}
            </p>

            {/* Big Score Box */}
            <div className="my-6 p-6 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold">NILAI AKHIR ANDA:</div>
              <div className="text-5xl font-mono font-black text-white mt-1">{finalScore}</div>
              <div className="mt-2">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full ${
                    finalPassed
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {finalPassed ? 'LULUS / MEMENUHI KKM' : 'REMEDIAL DIPERLUKAN'}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div>
                KKM Minimum: <strong>{activeUjian?.nilaiMinimum}</strong>
              </div>
              <div>
                Pelanggaran Terdeteksi: <strong>{tabViolations} Kali</strong>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-3">
              <button
                onClick={onBackToApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Kembali ke Dashboard Sekolah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM FINISH MODAL */}
      {showConfirmFinishModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">Kumpulkan Jawaban Ujian?</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Anda telah menjawab <strong>{answeredCount}</strong> dari{' '}
              <strong>{totalQuestions}</strong> butir soal. Apakah Anda yakin ingin mengakhiri sesi
              ujian sekarang?
            </p>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setShowConfirmFinishModal(false)}
                className="px-4 py-2 border border-slate-700 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-800"
              >
                Kembali Periksa
              </button>
              <button
                onClick={() => handleFinishExam(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
