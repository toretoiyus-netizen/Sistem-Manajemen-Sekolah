import React, { useState } from 'react';
import {
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  FileText,
  UserCheck,
  Shield,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { UserAccount, MasterTugasTambahan, PenugasanTugasTambahan, Guru } from '../types';
import { dbService } from '../services/mockDatabase';

interface ManajemenTugasTambahanProps {
  currentUser: UserAccount;
}

export const ManajemenTugasTambahan: React.FC<ManajemenTugasTambahanProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const [activeSubTab, setActiveSubTab] = useState<'beban_guru' | 'penugasan' | 'master_tugas'>('beban_guru');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('semua');

  // Modal State for New/Edit Assignment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPenugasan, setEditingPenugasan] = useState<PenugasanTugasTambahan | null>(null);

  // Form State
  const [selectedGuruId, setSelectedGuruId] = useState('');
  const [selectedTugasMasterId, setSelectedTugasMasterId] = useState('');
  const [skPenugasan, setSkPenugasan] = useState('');
  const [tanggalSK, setTanggalSK] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');
  const [statusTugas, setStatusTugas] = useState<'Aktif' | 'Selesai'>('Aktif');

  // Compute Workload for all teachers
  const teachersWorkload = db.guru.map((g) => {
    return {
      guru: g,
      ...dbService.getTeacherWorkload(g.id),
      guruWaliInfo: dbService.getGuruWaliQuota(g.id),
    };
  });

  // Filtered teachers
  const filteredTeachers = teachersWorkload.filter((item) => {
    const matchSearch =
      item.guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guru.nip.includes(searchQuery) ||
      item.guru.mataPelajaranUtama.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (filterStatus === 'kurang') return item.statusBeban === 'Kurang';
    if (filterStatus === 'ideal') return item.statusBeban === 'Ideal';
    if (filterStatus === 'lebih') return item.statusBeban === 'Lebih';
    if (filterStatus === 'bentrok') return item.hasConflict;

    return true;
  });

  const handleOpenAddModal = () => {
    setEditingPenugasan(null);
    setSelectedGuruId(db.guru[0]?.id || '');
    setSelectedTugasMasterId(db.tugasTambahanMaster[0]?.id || '');
    setSkPenugasan(`SK.421.3/${Math.floor(100 + Math.random() * 900)}-SMAN1/2024`);
    setTanggalSK(new Date().toISOString().split('T')[0]);
    setKeterangan('');
    setStatusTugas('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PenugasanTugasTambahan) => {
    setEditingPenugasan(p);
    setSelectedGuruId(p.guruId);
    const master = db.tugasTambahanMaster.find((m) => m.namaTugas === p.namaTugas);
    setSelectedTugasMasterId(master?.id || db.tugasTambahanMaster[0]?.id || '');
    setSkPenugasan(p.skPenugasan);
    setTanggalSK(p.tanggalSK);
    setKeterangan(p.keterangan || '');
    setStatusTugas(p.status);
    setIsModalOpen(true);
  };

  const handleSavePenugasan = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedGuru = db.guru.find((g) => g.id === selectedGuruId);
    const selectedMaster = db.tugasTambahanMaster.find((m) => m.id === selectedTugasMasterId);

    if (!selectedGuru || !selectedMaster) return;

    if (editingPenugasan) {
      db.penugasanTugasTambahan = db.penugasanTugasTambahan.map((p) =>
        p.id === editingPenugasan.id
          ? {
              ...p,
              guruId: selectedGuru.id,
              guruNama: selectedGuru.nama,
              tugasTambahanId: selectedMaster.id,
              namaTugas: selectedMaster.namaTugas,
              bebanJam: selectedMaster.bebanJamEkuivalen,
              skPenugasan,
              tanggalSK,
              keterangan,
              status: statusTugas,
            }
          : p
      );
    } else {
      const newPenugasan: PenugasanTugasTambahan = {
        id: dbService.generateId('PTT'),
        guruId: selectedGuru.id,
        guruNama: selectedGuru.nama,
        tugasTambahanId: selectedMaster.id,
        namaTugas: selectedMaster.namaTugas,
        bebanJam: selectedMaster.bebanJamEkuivalen,
        skPenugasan,
        tanggalSK,
        keterangan,
        status: statusTugas,
      };
      db.penugasanTugasTambahan.unshift(newPenugasan);
    }

    dbService.saveToStorage(db);
    setIsModalOpen(false);
  };

  const handleDeletePenugasan = (id: string) => {
    if (confirm('Yakin ingin menghapus penugasan tugas tambahan ini?')) {
      db.penugasanTugasTambahan = db.penugasanTugasTambahan.filter((p) => p.id !== id);
      dbService.saveToStorage(db);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Standar 24 Jam Mengajar & Ekuivalensi Beban Kerja Guru</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Manajemen Tugas Tambahan & Jam Mengajar
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Pantau akumulasi jam tatap muka KBM, penugasan tugas tambahan ekuivalen (Permendikbud No. 15 Tahun 2018), 
              pemenuhan syarat beban 24 jam sertifikasi, serta deteksi bentrok jadwal mengajar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah SK Tugas Tambahan</span>
            </button>
          </div>
        </div>

        {/* Quick Workload Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-400 block">Total Guru Aktif</span>
            <span className="text-xl font-extrabold text-white">{db.guru.length} Guru</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-400 block">Memenuhi Beban (≥24 Jam)</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {teachersWorkload.filter((t) => t.totalHours >= 24).length} Guru
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-400 block">Kurang Beban (&lt;24 Jam)</span>
            <span className="text-xl font-extrabold text-amber-400">
              {teachersWorkload.filter((t) => t.totalHours < 24).length} Guru
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-400 block">Indikator Bentrok Jadwal</span>
            <span className="text-xl font-extrabold text-rose-400">
              {teachersWorkload.filter((t) => t.hasConflict).length} Terdeteksi
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('beban_guru')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'beban_guru'
                ? 'bg-[#1e293b] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Rekap Beban Mengajar Guru (24 Jam)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('penugasan')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'penugasan'
                ? 'bg-[#1e293b] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daftar SK Penugasan ({db.penugasanTugasTambahan.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('master_tugas')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'master_tugas'
                ? 'bg-[#1e293b] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Ekuivalensi Jam Tugas</span>
          </button>
        </div>

        {/* Search & Status Filter (for beban_guru) */}
        {activeSubTab === 'beban_guru' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama guru..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-44 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="semua">Semua Status Beban</option>
              <option value="kurang">Kurang Beban (&lt;24 Jam)</option>
              <option value="ideal">Memenuhi Beban (≥24 Jam)</option>
              <option value="bentrok">Ada Bentrok Jadwal</option>
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB TAB 1: REKAP BEBAN MENGAJAR GURU & BENTROK */}
      {/* ========================================================================= */}
      {activeSubTab === 'beban_guru' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ketentuan Batas Jam Mengajar Guru (24 Jam Tatap Muka / Ekuivalen)</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Berdasarkan regulasi sertifikasi guru, batas minimal beban mengajar adalah <strong>24 Jam Pelajaran (JPM) per minggu</strong>. 
                Guru yang memiliki jam tatap muka kurang dapat dipenuhi melalui ekuivalensi <strong>Tugas Tambahan</strong> (seperti Wakasek 12 Jam, Ka. Lab 12 Jam, Wali Kelas 2 Jam, Guru Wali 2 Jam).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Nama Guru & NIP</th>
                    <th className="p-4">Mata Pelajaran</th>
                    <th className="p-4 text-center">Jam KBM</th>
                    <th className="p-4">Tugas Tambahan & Ekuivalen</th>
                    <th className="p-4 text-center">Total Jam</th>
                    <th className="p-4">Status Beban & Keterangan</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((item) => (
                    <tr key={item.guru.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.guru.nama}</div>
                        <div className="text-[11px] text-slate-500 font-mono">NIP: {item.guru.nip}</div>
                        {/* Status Guru Wali Quota */}
                        {item.guruWaliInfo.count > 0 && (
                          <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${item.guruWaliInfo.badgeColor}`}>
                            <span>Guru Wali: {item.guruWaliInfo.count}/20 Siswa</span>
                            {item.guruWaliInfo.status === 'Kurang' && <span>(Belum Kuota 20)</span>}
                            {item.guruWaliInfo.status === 'Lebih' && <span>(Lebih Kuota 20)</span>}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-slate-800">{item.guru.mataPelajaranUtama}</span>
                        <span className="block text-[10px] text-slate-400">{item.guru.statusKepegawaian}</span>
                      </td>

                      <td className="p-4 text-center font-bold text-slate-800">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg">{item.kbmHours} Jam</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{item.schedules.length} Kelas</span>
                      </td>

                      <td className="p-4">
                        {item.duties.length === 0 ? (
                          <span className="text-slate-400 italic">Tidak ada tugas tambahan</span>
                        ) : (
                          <div className="space-y-1">
                            {item.duties.map((d) => (
                              <div key={d.id} className="flex items-center gap-1.5 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold text-slate-700">{d.namaTugas}</span>
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] border border-emerald-100">
                                  +{d.bebanJam} Jam
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="text-sm font-extrabold text-slate-900">
                          {item.totalHours} <span className="text-xs font-normal text-slate-500">/ 24 Jam</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 mx-auto mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.totalHours >= 24 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, (item.totalHours / 24) * 100)}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${item.badgeColor}`}>
                            {item.statusBeban === 'Ideal' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {item.statusBeban === 'Kurang' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {item.statusBeban === 'Lebih' && <Award className="w-3 h-3 text-blue-600" />}
                            <span>{item.message}</span>
                          </span>

                          {/* Collision / Bentrok Warning */}
                          {item.hasConflict && (
                            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-900 font-bold space-y-0.5 mt-1">
                              <div className="flex items-center gap-1 text-rose-700">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>PERINGATAN BENTROK JAM MENGAJAR:</span>
                              </div>
                              {item.conflictReasons.map((cr, idx) => (
                                <p key={idx} className="font-normal text-rose-800 pl-4">• {cr}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedGuruId(item.guru.id);
                            handleOpenAddModal();
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-[11px]"
                        >
                          + Tugas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 2: DAFTAR SK PENUGASAN TUGAS TAMBAHAN */}
      {/* ========================================================================= */}
      {activeSubTab === 'penugasan' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Surat Keputusan (SK) Tugas Tambahan Guru Aktif</h3>
              <button
                onClick={handleOpenAddModal}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Terbitkan SK Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Nama Guru</th>
                    <th className="p-4">Jenis Tugas Tambahan</th>
                    <th className="p-4 text-center">Beban Jam</th>
                    <th className="p-4">Nomor SK & Tanggal</th>
                    <th className="p-4">Keterangan Penugasan</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.penugasanTugasTambahan.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{p.guruNama}</td>
                      <td className="p-4 font-semibold text-emerald-800">{p.namaTugas}</td>
                      <td className="p-4 text-center font-extrabold text-slate-800">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                          +{p.bebanJam} Jam
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-slate-800 font-semibold">{p.skPenugasan}</div>
                        <div className="text-[10px] text-slate-400">Tgl: {p.tanggalSK}</div>
                      </td>
                      <td className="p-4 text-slate-600">{p.keterangan || '-'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          p.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePenugasan(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB TAB 3: MASTER EKUIVALENSI JAM TUGAS TAMBAHAN */}
      {/* ========================================================================= */}
      {activeSubTab === 'master_tugas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.tugasTambahanMaster.map((m) => (
              <div key={m.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase">
                      {m.kategori}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{m.namaTugas}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-2xl inline-block">
                      {m.bebanJamEkuivalen} JPM
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">Jam Pelajaran/Minggu</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{m.keterangan}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium">Dasar Regulasi:</span>
                  <span className="font-mono font-semibold text-slate-700">{m.dasarHukum}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT PENUGASAN TUGAS TAMBAHAN */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPenugasan ? 'Ubah SK Tugas Tambahan' : 'Terbitkan SK Penugasan Tugas Tambahan'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePenugasan} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Guru Penerima Tugas</label>
                <select
                  required
                  value={selectedGuruId}
                  onChange={(e) => setSelectedGuruId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {db.guru.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama} (NIP: {g.nip} - {g.mataPelajaranUtama})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Tugas Tambahan & Beban Ekuivalensi</label>
                <select
                  required
                  value={selectedTugasMasterId}
                  onChange={(e) => setSelectedTugasMasterId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {db.tugasTambahanMaster.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.namaTugas} (+{m.bebanJamEkuivalen} Jam) - {m.kategori}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Surat Keputusan (SK)</label>
                  <input
                    type="text"
                    required
                    value={skPenugasan}
                    onChange={(e) => setSkPenugasan(e.target.value)}
                    placeholder="SK.421.3/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Berlaku SK</label>
                  <input
                    type="date"
                    required
                    value={tanggalSK}
                    onChange={(e) => setTanggalSK(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Rincian Penugasan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Wali Kelas X MIPA 1 / Penanggung jawab Server CBT"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Penugasan</label>
                <select
                  value={statusTugas}
                  onChange={(e) => setStatusTugas(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="Aktif">Aktif (Berlaku pada Jam Kerja)</option>
                  <option value="Selesai">Selesai / Nonaktif</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingPenugasan ? 'Simpan Perubahan' : 'Terbitkan SK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
