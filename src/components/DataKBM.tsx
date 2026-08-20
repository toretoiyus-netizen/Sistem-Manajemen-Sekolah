import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
  GraduationCap,
  Clock,
  Building,
  FileText,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { KBMSchedule, MataPelajaran, Rombel, UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';
import { exportToF4LandscapePDF } from '../utils/pdfExportUtil';

interface DataKBMProps {
  currentUser: UserAccount;
}

export const DataKBM: React.FC<DataKBMProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const [activeTab, setActiveTab] = useState<'jadwal' | 'mapel' | 'rombel' | 'guruwali'>('jadwal');

  const role = currentUser.role;
  const isStudent = role === 'SISWA';
  const isWaliKelas = role === 'WALI KELAS';
  const isGuruWali = role === 'GURU WALI';
  const isGuruMapel = role === 'GURU MAPEL';
  const isExecutive = role === 'SUPER ADMIN' || role === 'ADMIN' || role === 'KEPALA SEKOLAH' || role === 'WAKASEK';

  // Find linked student if logged in as SISWA
  const currentStudent = isStudent
    ? db.siswa.find(
        (s) =>
          s.id === currentUser.referenceId ||
          s.nisn === currentUser.username ||
          s.nis === currentUser.username ||
          s.namaLengkap.toLowerCase() === currentUser.nama.toLowerCase()
      ) || db.siswa[0]
    : null;

  // Find linked teacher if teacher role
  const currentGuru = !isStudent
    ? db.guru.find(
        (g) =>
          g.id === currentUser.referenceId ||
          g.nip === currentUser.username ||
          g.nama.toLowerCase() === currentUser.nama.toLowerCase()
      ) || (isWaliKelas || isGuruWali ? db.guru.find(g => g.tugasTambahan === (isWaliKelas ? 'Wali Kelas' : 'Guru Wali')) : db.guru[0])
    : null;

  // Rombel assigned to Wali Kelas
  const assignedWaliRombels = isWaliKelas && currentGuru
    ? db.rombel.filter((r) => r.waliKelasId === currentGuru.id || r.namaRombel.includes('X MIPA 1'))
    : [];

  // Rombels containing mentored students for Guru Wali
  const binaanStudents = isGuruWali && currentGuru
    ? db.siswa.filter((s) => s.guruWaliId === currentGuru.id || s.guruWaliNama?.toLowerCase().includes(currentGuru.nama.toLowerCase()))
    : [];
  const guruWaliRombelNames = Array.from(new Set(binaanStudents.map((s) => s.rombel)));
  const assignedGuruWaliRombels = isGuruWali
    ? db.rombel.filter((r) => guruWaliRombelNames.includes(r.namaRombel))
    : [];

  // Student's own rombel
  const studentRombel = isStudent && currentStudent
    ? db.rombel.find((r) => r.namaRombel === currentStudent.rombel || r.id === currentStudent.rombelId) || db.rombel[0]
    : null;

  // Visible rombels list according to role
  const visibleRombels = isStudent
    ? (studentRombel ? [studentRombel] : [db.rombel[0]])
    : isWaliKelas
    ? (assignedWaliRombels.length > 0 ? assignedWaliRombels : [db.rombel[0]])
    : isGuruWali
    ? (assignedGuruWaliRombels.length > 0 ? assignedGuruWaliRombels : db.rombel.slice(0, 2))
    : db.rombel;

  // Filter for Jadwal
  const [selectedHari, setSelectedHari] = useState<string>('Semua');
  const [selectedRombelFilter, setSelectedRombelFilter] = useState<string>('Semua');

  // Modal State for Schedule Form
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<KBMSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState<Omit<KBMSchedule, 'id'>>({
    hari: 'Senin',
    jamKe: 1,
    jamMulai: '07:30',
    jamSelesai: '08:50',
    rombelId: visibleRombels[0]?.id || db.rombel[0]?.id || 'ROM-000001',
    mapelId: db.mapel[0]?.id || 'MAP-000001',
    guruId: db.guru[0]?.id || 'GURU-000001',
    ruang: 'R. 101 (Gedung Kujang)',
    keterangan: '',
  });

  // Conflict state
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Modal State for Mapel Form
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);
  const [mapelForm, setMapelForm] = useState<Partial<MataPelajaran>>({
    kodeMapel: '',
    namaMapel: '',
    kelompok: 'Kejuruan / Peminatan',
    status: 'Aktif',
  });

  // Modal State for Rombel Form
  const [isRombelModalOpen, setIsRombelModalOpen] = useState(false);
  const [rombelForm, setRombelForm] = useState<Partial<Rombel>>({
    namaRombel: '',
    tingkat: '10',
    jurusan: 'MIPA',
    tahunPelajaran: '2024/2025',
    waliKelasId: db.guru[0]?.id || 'GURU-000001',
    status: 'Aktif',
  });

  const canManageKBM = dbService.checkPermission(currentUser, 'kbm.create');

  // Validate Schedule Conflicts before saving
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    // Call MockDatabase collision detection engine!
    const conflictResult = dbService.validateKBMConflict(
      scheduleForm,
      selectedSchedule ? selectedSchedule.id : undefined
    );

    if (conflictResult.hasConflict) {
      setConflictError(conflictResult.reason || 'Terjadi bentrok jadwal KBM!');
      return;
    }

    if (selectedSchedule) {
      const updated = db.jadwalKBM.map((j) =>
        j.id === selectedSchedule.id ? { ...j, ...scheduleForm } : j
      );
      db.jadwalKBM = updated;
    } else {
      const newId = dbService.generateId('KBM');
      db.jadwalKBM.push({ ...scheduleForm, id: newId });
    }

    dbService.saveToStorage(db);
    setIsScheduleModalOpen(false);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Hapus jadwal pelajaran ini?')) {
      db.jadwalKBM = db.jadwalKBM.filter((j) => j.id !== scheduleId);
      dbService.saveToStorage(db);
    }
  };

  const handleSaveMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapelForm.namaMapel || !mapelForm.kodeMapel) {
      alert('Lengkapi nama dan kode mapel!');
      return;
    }
    const newId = dbService.generateId('MAP');
    db.mapel.push({
      id: newId,
      kodeMapel: mapelForm.kodeMapel || '',
      namaMapel: mapelForm.namaMapel || '',
      kelompok: mapelForm.kelompok || 'Umum',
      status: 'Aktif',
    });
    dbService.saveToStorage(db);
    setIsMapelModalOpen(false);
  };

  const handleSaveRombel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rombelForm.namaRombel) {
      alert('Lengkapi nama rombel!');
      return;
    }
    const newId = dbService.generateId('ROM');
    db.rombel.push({
      id: newId,
      namaRombel: rombelForm.namaRombel || '',
      tingkat: rombelForm.tingkat || '10',
      jurusan: rombelForm.jurusan || 'MIPA',
      tahunPelajaran: rombelForm.tahunPelajaran || '2024/2025',
      waliKelasId: rombelForm.waliKelasId || 'GURU-000001',
      status: 'Aktif',
    });
    dbService.saveToStorage(db);
    setIsRombelModalOpen(false);
  };

  if (isGuruMapel) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Manajemen KBM Dibatasi</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Menu Manajemen Kegiatan Belajar Mengajar (KBM) tidak ditampilkan untuk akun Guru Mata Pelajaran. Pengelolaan kurikulum dan rombel dikelola langsung oleh <strong>Wakasek Kurikulum</strong> dan <strong>Wali Kelas</strong>.
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-200 text-left">
          💡 <em>Akses Anda difokuskan pada penyusunan <strong>Bank Soal</strong>, pembuatan <strong>Paket Ujian CAT</strong>, dan rekap nilai peserta didik.</em>
        </div>
      </div>
    );
  }

  const baseJadwal = db.jadwalKBM.filter((j) => {
    if (isStudent && studentRombel) {
      return j.rombelId === studentRombel.id;
    }
    if (isWaliKelas && assignedWaliRombels.length > 0) {
      return assignedWaliRombels.some((r) => r.id === j.rombelId);
    }
    if (isGuruWali && assignedGuruWaliRombels.length > 0) {
      return assignedGuruWaliRombels.some((r) => r.id === j.rombelId);
    }
    return true;
  });

  const filteredJadwal = baseJadwal.filter((j) => {
    const matchHari = selectedHari === 'Semua' || j.hari === selectedHari;
    const matchRombel = selectedRombelFilter === 'Semua' || j.rombelId === selectedRombelFilter;
    return matchHari && matchRombel;
  });

  const handleExportSchedulePDF = () => {
    const head = [
      ['No', 'Hari', 'Jam Ke', 'Waktu KBM', 'Rombel', 'Mata Pelajaran', 'Guru Pengampu', 'Ruang Kelas', 'Keterangan']
    ];

    const body = filteredJadwal.map((s, idx) => {
      const rombel = db.rombel.find((r) => r.id === s.rombelId);
      const mapel = db.mapel.find((m) => m.id === s.mapelId);
      const guru = db.guru.find((g) => g.id === s.guruId);

      return [
        idx + 1,
        s.hari,
        `Jam ke-${s.jamKe}`,
        `${s.jamMulai} - ${s.jamSelesai}`,
        rombel?.namaRombel || '-',
        mapel?.namaMapel || '-',
        guru?.nama || '-',
        s.ruang,
        s.keterangan || 'KBM Reguler',
      ];
    });

    exportToF4LandscapePDF({
      title: 'Jadwal Pelajaran Kegiatan Belajar Mengajar (KBM)',
      subtitle: `Tahun Ajaran 2024/2025 • Filter Hari: ${selectedHari} • Rombel: ${selectedRombelFilter === 'Semua' ? 'Semua Rombel' : (db.rombel.find(r => r.id === selectedRombelFilter)?.namaRombel || selectedRombelFilter)}`,
      fileName: `Jadwal_KBM_DisdikJabar_F4_Landscape.pdf`,
      metaInfo: [
        { label: 'Filter Hari', value: selectedHari },
        { label: 'Total Sesi KBM', value: `${filteredJadwal.length} Sesi Terjadwal` },
      ],
      head: head,
      body: body,
      signatureRole: 'Wakasek Kurikulum',
      signatureName: 'Dr. H. Bambang Sutrisno, M.Pd.',
      signatureNip: '196803151992031004',
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 32, halign: 'center' },
        4: { cellWidth: 32, halign: 'center' },
        5: { cellWidth: 55 },
        6: { cellWidth: 50 },
        7: { cellWidth: 40 },
        8: { cellWidth: 45 },
      },
    });
  };

  const handleExportScheduleExcel = () => {
    const data = filteredJadwal.map((s, idx) => {
      const rombel = db.rombel.find((r) => r.id === s.rombelId);
      const mapel = db.mapel.find((m) => m.id === s.mapelId);
      const guru = db.guru.find((g) => g.id === s.guruId);

      return {
        No: idx + 1,
        Hari: s.hari,
        'Jam Ke': s.jamKe,
        'Jam Mulai': s.jamMulai,
        'Jam Selesai': s.jamSelesai,
        Rombel: rombel?.namaRombel || '-',
        'Mata Pelajaran': mapel?.namaMapel || '-',
        'Guru Pengampu': guru?.nama || '-',
        'Ruang Kelas': s.ruang,
        Keterangan: s.keterangan || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal_KBM');
    XLSX.writeFile(workbook, `Jadwal_KBM_${selectedHari}_2024.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Manajemen Kegiatan Belajar Mengajar (KBM)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Struktur mata pelajaran, rombel, pembagian jam mengajar, dan deteksi bentrok otomatis.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'jadwal'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Jadwal Pelajaran & Anti-Bentrok</span>
          </button>

          <button
            onClick={() => setActiveTab('mapel')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'mapel'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daftar Mata Pelajaran ({db.mapel.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rombel')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rombel'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Rombel & Wali Kelas ({db.rombel.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guruwali')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'guruwali'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Penugasan Guru Wali</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: JADWAL PELAJARAN (WITH CONFLICT PREVENTION) */}
      {/* ========================================================================= */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Hari:</span>
                <select
                  value={selectedHari}
                  onChange={(e) => setSelectedHari(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Semua">Semua Hari</option>
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Rombel:</span>
                <select
                  value={selectedRombelFilter}
                  onChange={(e) => setSelectedRombelFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Semua">Semua Rombel</option>
                  {visibleRombels.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.namaRombel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportSchedulePDF}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Cetak PDF Format Landscape F4 (Folio) Presisi"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Cetak PDF (F4 Landscape)</span>
              </button>

              <button
                onClick={handleExportScheduleExcel}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Ekspor Jadwal ke Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>

              {canManageKBM && (
                <button
                  onClick={() => {
                    setSelectedSchedule(null);
                    setConflictError(null);
                    setScheduleForm({
                      hari: 'Senin',
                      jamKe: 1,
                      jamMulai: '07:30',
                      jamSelesai: '08:50',
                      rombelId: db.rombel[0]?.id || 'ROM-000001',
                      mapelId: db.mapel[0]?.id || 'MAP-000001',
                      guruId: db.guru[0]?.id || 'GURU-000001',
                      ruang: 'R. 101 (Gedung Kujang)',
                      keterangan: '',
                    });
                    setIsScheduleModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Jadwal KBM</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Hari</th>
                    <th className="p-3.5">Jam Ke</th>
                    <th className="p-3.5">Waktu KBM</th>
                    <th className="p-3.5">Rombel</th>
                    <th className="p-3.5">Mata Pelajaran</th>
                    <th className="p-3.5">Guru Pengampu</th>
                    <th className="p-3.5">Ruang Kelas</th>
                    <th className="p-3.5">Keterangan</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredJadwal.map((schedule) => {
                    const rombel = db.rombel.find((r) => r.id === schedule.rombelId);
                    const mapel = db.mapel.find((m) => m.id === schedule.mapelId);
                    const guru = db.guru.find((g) => g.id === schedule.guruId);

                    return (
                      <tr key={schedule.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-800">{schedule.hari}</td>
                        <td className="p-3.5 font-bold text-slate-700">Jam ke-{schedule.jamKe}</td>
                        <td className="p-3.5 font-mono text-emerald-700 font-bold">
                          {schedule.jamMulai} - {schedule.jamSelesai}
                        </td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-semibold">
                            {rombel?.namaRombel}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900">{mapel?.namaMapel}</td>
                        <td className="p-3.5 text-slate-700">{guru?.nama}</td>
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                          {schedule.ruang}
                        </td>
                        <td className="p-3.5 text-slate-500">{schedule.keterangan || '-'}</td>
                        <td className="p-3.5 text-right">
                          {canManageKBM && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedSchedule(schedule);
                                  setConflictError(null);
                                  setScheduleForm(schedule);
                                  setIsScheduleModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATA PELAJARAN */}
      {/* ========================================================================= */}
      {activeTab === 'mapel' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Daftar Mata Pelajaran Kurikulum</h3>
            {canManageKBM && (
              <button
                onClick={() => setIsMapelModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Mapel</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.mapel.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    {m.kodeMapel}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {m.kelompok}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2">{m.namaMapel}</h4>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Status: <strong className="text-emerald-700">{m.status}</strong></span>
                  <span className="text-slate-400 font-mono">{m.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROMBEL & WALI KELAS */}
      {/* ========================================================================= */}
      {activeTab === 'rombel' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isStudent ? 'Rombongan Belajar (Kelas Anda)' : isWaliKelas ? 'Rombel yang Anda Ampu' : 'Rombongan Belajar (Rombel)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isStudent ? 'Informasi kelas dan wali kelas tempat Anda terdaftar.' : 'Daftar rombel dan wali kelas pengampu.'}
              </p>
            </div>
            {canManageKBM && (
              <button
                onClick={() => setIsRombelModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rombel</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {visibleRombels.map((r) => {
              const wali = db.guru.find((g) => g.id === r.waliKelasId);
              const studentCount = db.siswa.filter((s) => s.rombel === r.namaRombel).length;

              return (
                <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">{r.namaRombel}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Tingkat {r.tingkat}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div>
                      Jurusan: <strong>{r.jurusan}</strong>
                    </div>
                    <div>
                      Wali Kelas: <strong>{wali?.nama || '-'}</strong>
                    </div>
                    <div>
                      Jumlah Siswa: <strong>{studentCount} Siswa</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GURU WALI */}
      {/* ========================================================================= */}
      {activeTab === 'guruwali' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>
                  {isStudent
                    ? 'Informasi Guru Wali & Wali Kelas Anda'
                    : isGuruWali
                    ? 'Daftar Siswa Binaan Anda (Guru Wali)'
                    : isWaliKelas
                    ? 'Bimbingan Siswa Kelas yang Anda Ampu'
                    : 'Matriks Penugasan Guru Wali & Binaan Siswa (Jabar Masagi)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isStudent
                  ? 'Berikut adalah guru pembina karakter dan wali kelas yang mendampingi Anda.'
                  : 'Pendampingan karakter berbasis Jabar Masagi (Surti, Hati, Bukti, Bakti).'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(() => {
              let gurusToRender = db.guru.filter(
                (g) => g.tugasTambahan === 'Guru Wali' || g.tugasTambahan === 'Wali Kelas'
              );

              if (isStudent && currentStudent) {
                const studentWali = db.guru.find(
                  (g) => g.id === currentStudent.waliKelasId || (studentRombel && g.id === studentRombel.waliKelasId)
                );
                const studentGw = db.guru.find(
                  (g) =>
                    g.id === currentStudent.guruWaliId ||
                    g.nama.toLowerCase().includes((currentStudent.guruWaliNama || '').toLowerCase())
                );
                gurusToRender = [studentWali, studentGw].filter(Boolean) as typeof db.guru;
                // De-duplicate
                gurusToRender = gurusToRender.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
              } else if (isGuruWali && currentGuru) {
                gurusToRender = db.guru.filter((g) => g.id === currentGuru.id);
              } else if (isWaliKelas && currentGuru) {
                gurusToRender = db.guru.filter((g) => g.id === currentGuru.id);
              }

              if (gurusToRender.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Belum ada penugasan guru wali yang terhubung.
                  </div>
                );
              }

              return gurusToRender.map((guru) => {
                const binaan = isStudent && currentStudent
                  ? [currentStudent]
                  : db.siswa.filter((s) => s.guruWaliId === guru.id || (guru.tugasTambahan === 'Wali Kelas' && s.rombel === visibleRombels[0]?.namaRombel));

                return (
                  <div key={guru.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={guru.foto}
                          alt={guru.nama}
                          className="w-10 h-10 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{guru.nama}</h4>
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            {guru.tugasTambahan} • NIP: {guru.nip}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg">
                        {isStudent ? 'Pembina Anda' : `${binaan.length} Siswa Binaan`}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {binaan.map((s) => (
                        <div
                          key={s.id}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">{s.namaLengkap}</span>
                            <span className="text-[10px] text-slate-400 font-mono">NISN: {s.nisn}</span>
                          </div>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{s.rombel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* SCHEDULE FORM MODAL (WITH REAL-TIME CONFLICT DETECTOR) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>{selectedSchedule ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal KBM'}</span>
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bentrok Error Banner */}
            {conflictError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <strong>Peringatan Bentrok Jadwal!</strong>
                  <p className="mt-0.5 leading-relaxed">{conflictError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hari *</label>
                  <select
                    value={scheduleForm.hari}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, hari: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Ke *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={scheduleForm.jamKe}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, jamKe: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mulai *</label>
                  <input
                    type="time"
                    value={scheduleForm.jamMulai}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, jamMulai: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Selesai *</label>
                  <input
                    type="time"
                    value={scheduleForm.jamSelesai}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, jamSelesai: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rombel (Kelas) *
                  </label>
                  <select
                    value={scheduleForm.rombelId}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, rombelId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {db.rombel.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.namaRombel} (Tingkat {r.tingkat})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={scheduleForm.mapelId}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, mapelId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    {db.mapel.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.namaMapel} ({m.kodeMapel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Guru Pengampu *
                  </label>
                  <select
                    value={scheduleForm.guruId}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, guruId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    {db.guru.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.tugasTambahan})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ruangan Kelas / Lab *
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.ruang}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, ruang: e.target.value })
                    }
                    placeholder="Contoh: R. 101 (Gedung Kujang)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Simpan & Validasi Bentrok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
