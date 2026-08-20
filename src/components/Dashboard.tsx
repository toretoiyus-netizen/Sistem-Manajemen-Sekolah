import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  HelpCircle,
  FileCheck2,
  CalendarCheck,
  Megaphone,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowRight,
  MonitorCheck,
  RefreshCw,
  KeyRound,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { UserAccount, KBMSchedule } from '../types';
import { dbService } from '../services/mockDatabase';
import { StatistikAkademikWidget } from './StatistikAkademikWidget';
import { LogAuditPresensiWidget } from './LogAuditPresensiWidget';
import { RekapitulasiAkademikTable } from './RekapitulasiAkademikTable';

interface DashboardProps {
  currentUser: UserAccount;
  onNavigate: (view: string) => void;
  onOpenCatPortal: () => void;
  onResetStudentPassword?: (siswaId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onNavigate,
  onOpenCatPortal,
  onResetStudentPassword,
}) => {
  const db = dbService.getState();
  const role = currentUser.role;

  // Selected Day for Student Schedule Tab
  const [selectedDay, setSelectedDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');

  // Statistics calculation
  const totalGuru = (db.guru || []).length;
  const totalSiswa = (db.siswa || []).length;
  const totalRombel = (db.rombel || []).length;
  const totalMapel = (db.mapel || []).length;
  const totalSoal = (db.bankSoal || []).length;
  const totalUjian = (db.ujianList || []).length;

  const presensiItems = db.presensiList || db.presensi || [];
  const pengumumanItems = db.pengumumanList || db.pengumuman || [];
  const siswaList = db.siswa || [];
  const guruList = db.guru || [];
  const jadwalList = db.jadwalKBM || [];

  const waliKelasCount = guruList.filter((g) => g.tugasTambahan === 'Wali Kelas').length;
  const guruWaliCount = guruList.filter((g) => g.tugasTambahan === 'Guru Wali').length;

  // Attendance breakdown for today
  const presensiHadir = presensiItems.filter((p) => p.status === 'Hadir').length;
  const presensiSakit = presensiItems.filter((p) => p.status === 'Sakit').length;
  const presensiIzin = presensiItems.filter((p) => p.status === 'Izin').length;
  const hadirPercent = totalSiswa > 0 ? Math.round((presensiHadir / totalSiswa) * 100) : 92;
  const izinSakitPercent = totalSiswa > 0 ? Math.round(((presensiSakit + presensiIzin) / totalSiswa) * 100) : 5;
  const alfaPercent = Math.max(0, 100 - hadirPercent - izinSakitPercent);

  // Current Teacher Profile if logged in as teacher
  const currentTeacher = guruList.find((g) => g.id === currentUser.referenceId);

  // Current Student Profile if logged in as student
  const currentStudent = siswaList.find((s) => s.id === currentUser.referenceId);

  // Filtered Students for Wali Kelas or Guru Wali
  const relevantStudents = siswaList.filter((s) => {
    if (role === 'WALI KELAS' && currentTeacher) {
      return s.waliKelasId === currentTeacher.id;
    }
    if (role === 'GURU WALI' && currentTeacher) {
      return s.guruWaliId === currentTeacher.id;
    }
    return true;
  });

  // Filtered schedule for student
  const studentSchedules = jadwalList.filter((j) => {
    if (role === 'SISWA') {
      const rombel = (db.rombel || []).find((r) => r.namaRombel === (currentStudent?.rombel || 'X MIPA 1'));
      return j.rombelId === rombel?.id && j.hari === selectedDay;
    }
    return j.hari === selectedDay;
  });

  // Filtered announcements
  const visibleAnnouncements = pengumumanItems.filter((p) => {
    if (role === 'SUPER ADMIN' || role === 'ADMIN') return true;
    if (p.target === 'Semua Akun' || p.target === 'SEMUA') return true;
    if ((p.target === 'Semua Guru' || p.target === 'GURU') && role !== 'SISWA') return true;
    if ((p.target === 'Semua Siswa' || p.target === 'SISWA') && role === 'SISWA') return true;
    if ((p.target === 'Wali Kelas' || p.target === 'WALI KELAS') && role === 'WALI KELAS') return true;
    if (p.target === 'Guru Wali' && role === 'GURU WALI') return true;
    if (p.target === 'Guru Mapel' && role === 'GURU MAPEL') return true;
    if (p.target === 'Rombel Tertentu' && currentStudent) {
      const studentRombel = (db.rombel || []).find((r) => r.namaRombel === currentStudent.rombel);
      return p.targetRombelIds?.includes(studentRombel?.id || '');
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Stats Row (Natural Tones 4-Col Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-xl text-xl shrink-0">
            🏫
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-tight truncate">Total Siswa</p>
            <p className="text-2xl font-bold text-slate-900">{totalSiswa.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 flex items-center justify-center rounded-xl text-xl shrink-0">
            👨‍🏫
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-tight truncate">Total Guru</p>
            <p className="text-2xl font-bold text-slate-900">{totalGuru}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 flex items-center justify-center rounded-xl text-xl shrink-0">
            📖
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-tight truncate">Mata Pelajaran</p>
            <p className="text-2xl font-bold text-slate-900">{totalMapel}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 text-purple-700 flex items-center justify-center rounded-xl text-xl shrink-0">
            📝
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-tight truncate">Ujian Aktif</p>
            <p className="text-2xl font-bold text-slate-900">{totalUjian}</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STUDENT VIEW IF LOGGED IN AS SISWA */}
      {/* ========================================================================= */}
      {role === 'SISWA' ? (
        <div className="space-y-6">
          {/* Student Specific Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 font-semibold">
                  Profil Peserta Didik
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{currentStudent?.namaLengkap || currentUser.nama}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelas {currentStudent?.kelas || '10'} {currentStudent?.rombel || 'X MIPA 1'} • NISN: {currentStudent?.nisn || '0071829301'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenCatPortal}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <MonitorCheck className="w-4 h-4 text-slate-950" />
                  <span>Masuk Ruang CAT</span>
                </button>
                <button
                  onClick={() => onNavigate('presensi')}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Presensi GPS/Selfie</span>
                </button>
              </div>
            </div>
          </div>

          {/* JADWAL PELAJARAN TAB */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 underline decoration-emerald-300 underline-offset-4 text-sm sm:text-base">
                  Jadwal Pelajaran Mingguan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pilih hari untuk melihat mata pelajaran dan guru pengampu.</p>
              </div>

              {/* Day Selection Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const).map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedDay === day
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {studentSchedules.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">Tidak ada jadwal KBM untuk hari {selectedDay}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="pb-3">Jam Ke</th>
                        <th className="pb-3">Waktu</th>
                        <th className="pb-3">Mata Pelajaran</th>
                        <th className="pb-3">Guru Pengampu</th>
                        <th className="pb-3">Ruangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {studentSchedules.map((schedule) => {
                        const mapel = db.mapel.find((m) => m.id === schedule.mapelId);
                        const guru = db.guru.find((g) => g.id === schedule.guruId);
                        return (
                          <tr key={schedule.id} className="hover:bg-slate-50/60">
                            <td className="py-3 font-bold text-slate-800">Ke-{schedule.jamKe}</td>
                            <td className="py-3 font-mono text-emerald-700 font-semibold">{schedule.jamMulai} - {schedule.jamSelesai}</td>
                            <td className="py-3 font-semibold text-slate-900">{mapel?.namaMapel || schedule.mapelId}</td>
                            <td className="py-3 text-slate-600">{guru?.nama || schedule.guruId}</td>
                            <td className="py-3 text-slate-500 font-mono text-[11px]">{schedule.ruang}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Statistik Akademik Siswa */}
          <StatistikAkademikWidget initialRange={30} />
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. ADMIN / TEACHER / EXECUTIVE DASHBOARD WITH NATURAL TONES GRID */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Main Visual Grid (12 Cols: 8 Left, 4 Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Activity / Chart / Sub-cards (Col-span 8) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Daily Attendance & Academic Statistics Line Chart */}
              <StatistikAkademikWidget initialRange={30} />

              {/* 2 Sub-Cards: Announcements & Attendance Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Announcements in Natural Tone Style */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Pengumuman Terbaru</h3>
                    <button
                      onClick={() => onNavigate('pengumuman')}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      Semua →
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50/60 rounded-xl border-l-4 border-blue-400">
                      <p className="text-xs font-bold text-blue-900">Persiapan PTS Ganjil 2024</p>
                      <p className="text-[11px] text-blue-700 mt-0.5 line-clamp-1">
                        Seluruh dewan guru diharapkan melengkapi butir soal dan token CAT...
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border-l-4 border-emerald-400">
                      <p className="text-xs font-bold text-emerald-900">Program Jabar Masagi</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5 line-clamp-1">
                        Penguatan pendidikan karakter berbasis budaya lokal Jawa Barat...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Presensi Hari Ini */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Status Presensi (Hari Ini)</h3>
                  <div className="flex justify-around items-center pt-2">
                    <div className="text-center">
                      <div className="text-2xl font-black text-emerald-600">{hadirPercent}%</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                        Hadir
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-100"></div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-amber-500">{izinSakitPercent}%</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                        Izin/Sakit
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-100"></div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-rose-500">{alfaPercent}%</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                        Alfa
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Tasks / Details / Activity Feed (Col-span 4) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col h-full min-h-[480px]">
              <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Aktivitas Sistem Real-Time
              </h3>

              <div className="flex-1 space-y-5 overflow-hidden">
                <div className="flex gap-4">
                  <div className="w-1.5 bg-slate-100 rounded-full relative shrink-0">
                    <div className="absolute top-0 left-0 w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <p className="text-xs font-bold text-slate-900">Sinkronisasi Database Sukses</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">29 Google Spreadsheet Active • 2 mnt lalu</p>
                    </div>
                    <div className="relative">
                      <p className="text-xs font-bold text-slate-900">Token Ujian PTS Diaktifkan</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Wakasek Akademik • 15 mnt lalu</p>
                    </div>
                    <div className="relative">
                      <p className="text-xs font-bold text-slate-900">Presensi Mandiri GPS Masuk</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">32 Siswa X MIPA 1 • 45 mnt lalu</p>
                    </div>
                    <div className="relative opacity-70">
                      <p className="text-xs font-bold text-slate-900">Pembaruan Jadwal KBM Rombel</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Wali Kelas 10-A • 2 jam lalu</p>
                    </div>
                    <div className="relative opacity-60">
                      <p className="text-xs font-bold text-slate-900">Backup Otomatis Google Drive</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sistem GAS Daemon • 4 jam lalu</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onNavigate('presensi')}
                className="mt-6 w-full py-3 bg-[#1e293b] hover:bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Lihat Semua Rekapitulasi
              </button>
            </div>
          </div>

          {/* Academic Recapitulation Table with PDF & Excel Export */}
          {role !== 'SISWA' && (
            <RekapitulasiAkademikTable />
          )}

          {/* Wali Kelas & Guru Wali Special Scoped Section if relevant */}
          {(role === 'WALI KELAS' || role === 'GURU WALI') && (
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-100">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>
                      {role === 'WALI KELAS' ? 'Pengawasan Khusus Wali Kelas: X MIPA 1' : 'Daftar Siswa Binaan Karakter Guru Wali'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">
                    {role === 'WALI KELAS' ? 'Daftar Siswa Rombel yang Anda Kelola' : 'Bimbingan & Rekap Siswa Binaan'}
                  </h3>
                </div>
                <div className="text-xs text-slate-500">
                  Total Kelola: <strong className="text-slate-900">{relevantStudents.length} Siswa</strong>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="pb-3">Foto</th>
                      <th className="pb-3">Nama Siswa</th>
                      <th className="pb-3">NISN / NIS</th>
                      <th className="pb-3">Kelas & Rombel</th>
                      <th className="pb-3">Presensi Hari Ini</th>
                      <th className="pb-3 text-right">Aksi Sandi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {relevantStudents.map((siswa) => {
                      const todayAtt = db.presensiList.find((p) => p.siswaId === siswa.id);
                      return (
                        <tr key={siswa.id} className="hover:bg-slate-50/60">
                          <td className="py-3">
                            <img
                              src={siswa.foto}
                              alt={siswa.namaLengkap}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          </td>
                          <td className="py-3 font-semibold text-slate-900">{siswa.namaLengkap}</td>
                          <td className="py-3 font-mono text-slate-500">{siswa.nisn}</td>
                          <td className="py-3 text-slate-600">{siswa.rombel}</td>
                          <td className="py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                todayAtt?.status === 'Hadir'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {todayAtt?.status || 'Belum Presensi'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {onResetStudentPassword && (
                              <button
                                onClick={() => onResetStudentPassword(siswa.id)}
                                className="bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 font-semibold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>Reset Password</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Real-Time Geofence & GPS Attendance Audit Log */}
          {role !== 'SISWA' && (
            <LogAuditPresensiWidget />
          )}
        </div>
      )}
    </div>
  );
};
