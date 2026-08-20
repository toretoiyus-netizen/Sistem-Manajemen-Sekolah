import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Printer,
  RefreshCw,
  Award,
  Download,
  CalendarDays,
  AlertTriangle,
  Building2,
  X,
  Play,
  MonitorCheck,
  FileText,
  FileDown,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { Ujian, UserAccount, BookingUjianCAT, PortofolioSiswaRecord } from '../types';
import { dbService } from '../services/mockDatabase';
import { exportSingleStudentExamPDF, exportBatchExamResultsPDF } from '../utils/pdfExportService';

interface ManajemenUjianProps {
  currentUser: UserAccount;
  onOpenCatPortal: () => void;
}

export const ManajemenUjian: React.FC<ManajemenUjianProps> = ({
  currentUser,
  onOpenCatPortal,
}) => {
  const db = dbService.getState();
  const role = currentUser.role;
  const isStudent = role === 'SISWA';
  const isGuruMapel = role === 'GURU MAPEL';
  const isGuruWali = role === 'GURU WALI';
  const isWaliKelas = role === 'WALI KELAS';
  const isWakasek = role === 'WAKASEK';

  // Match current student
  const currentStudent = isStudent
    ? db.siswa.find(
        (s) =>
          s.id === currentUser.referenceId ||
          s.nisn === currentUser.username ||
          s.nis === currentUser.username ||
          s.namaLengkap.toLowerCase() === currentUser.nama.toLowerCase()
      ) || db.siswa[0]
    : null;

  // Match current teacher
  const currentTeacher = !isStudent
    ? db.guru.find(
        (g) =>
          g.id === currentUser.referenceId ||
          g.nip === currentUser.username ||
          g.nama.toLowerCase() === currentUser.nama.toLowerCase()
      ) || db.guru[0]
    : null;

  // Filtered Portofolio Records based on role requirements
  const allPortofolio = db.portofolioSiswaList || [];
  const filteredPortofolio = allPortofolio.filter((p) => {
    if (isStudent && currentStudent) {
      return p.nisn === currentStudent.nisn || p.namaSiswa.toLowerCase() === currentStudent.namaLengkap.toLowerCase();
    }
    if (isGuruMapel && currentTeacher) {
      const teacherMapel = currentTeacher.mataPelajaranUtama || '';
      return p.mapelNama.toLowerCase().includes(teacherMapel.toLowerCase()) || teacherMapel.toLowerCase().includes(p.mapelNama.toLowerCase());
    }
    if (isGuruWali && currentTeacher) {
      const binaanNisns = db.siswa
        .filter((s) => s.guruWaliId === currentTeacher.id || s.guruWaliNama?.toLowerCase().includes(currentTeacher.nama.toLowerCase()))
        .map((s) => s.nisn);
      return binaanNisns.includes(p.nisn);
    }
    if (isWaliKelas && currentTeacher) {
      const rombelStudentsNisns = db.siswa
        .filter((s) => s.waliKelasId === currentTeacher.id || s.rombel.includes('X MIPA 1'))
        .map((s) => s.nisn);
      return rombelStudentsNisns.includes(p.nisn);
    }
    return true;
  });

  // Active Tab: 'ujian' | 'booking_lab' | 'rekap_portofolio'
  const [activeTab, setActiveTab] = useState<'ujian' | 'booking_lab' | 'rekap_portofolio'>('ujian');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('Semua');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPrintTokenModalOpen, setIsPrintTokenModalOpen] = useState(false);
  const [isClassTokenPrintModalOpen, setIsClassTokenPrintModalOpen] = useState(false);
  const [tokenTargetRombel, setTokenTargetRombel] = useState<string>('X MIPA 1');
  const [tokenTargetSesi, setTokenTargetSesi] = useState<string>('Sesi 1 (07:30 - 09:30)');
  const [tokenTargetHari, setTokenTargetHari] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedUjian, setSelectedUjian] = useState<Ujian | null>(null);

  // Form State for Exam
  const [formData, setFormData] = useState<Partial<Ujian>>({
    namaUjian: '',
    jenis: 'PTS / Ujian Tengah Semester',
    mapelId: db.mapel[0]?.id || 'MAP-000001',
    mapelNama: db.mapel[0]?.namaMapel || 'Bahasa dan Sastra Sunda',
    kelas: '10',
    rombelIds: ['ROM-000001'],
    durasiMenit: 60,
    tanggalMulai: new Date().toISOString(),
    tanggalSelesai: new Date(Date.now() + 86400000 * 7).toISOString(),
    nilaiMinimum: 75,
    acakSoal: true,
    acakJawaban: true,
    tokenRequired: true,
    currentToken: dbService.generateExamToken('JBR'),
    status: 'Published',
    modeMasuk: 'Kombinasi',
    soalIds: db.bankSoal.slice(0, 5).map((s) => s.id),
  });

  // Form State for CAT Booking
  const [bookingForm, setBookingForm] = useState<{
    ujianId: string;
    namaUjian: string;
    guruId: string;
    guruNama: string;
    mapelNama: string;
    ruanganLab: string;
    tanggalUjian: string;
    sesiUjian: 'Sesi 1 (07:30 - 09:30)' | 'Sesi 2 (10:00 - 12:00)' | 'Sesi 3 (13:00 - 15:00)';
    rombelTarget: string[];
    estimasiPeserta: number;
    catatanAdmin?: string;
  }>({
    ujianId: db.ujianList[0]?.id || 'UJIAN-000001',
    namaUjian: db.ujianList[0]?.namaUjian || 'PTS Ganjil: Informatika',
    guruId: currentTeacher?.id || db.guru[0]?.id || 'GURU-000001',
    guruNama: currentTeacher?.nama || db.guru[0]?.nama || 'Guru Pengampu',
    mapelNama: currentTeacher?.mataPelajaranUtama || db.mapel[0]?.namaMapel || 'Informatika',
    ruanganLab: 'Lab Komputer 1 (40 Unit PC)',
    tanggalUjian: new Date().toISOString().split('T')[0],
    sesiUjian: 'Sesi 1 (07:30 - 09:30)',
    rombelTarget: ['X MIPA 1'],
    estimasiPeserta: 36,
    catatanAdmin: 'Pelaksanaan ulangan CAT terjadwal.',
  });

  const canCreate = dbService.checkPermission(currentUser, 'ujian.create');
  const canPublish = dbService.checkPermission(currentUser, 'ujian.publish');

  const filteredUjian = db.ujianList.filter((u) => {
    const matchSearch =
      u.namaUjian.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mapelNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenis = filterJenis === 'Semua' || u.jenis === filterJenis;
    return matchSearch && matchJenis;
  });

  const handleOpenCreate = () => {
    setSelectedUjian(null);
    setFormData({
      namaUjian: '',
      jenis: 'PTS / Ujian Tengah Semester',
      mapelId: db.mapel[0]?.id || 'MAP-000001',
      mapelNama: db.mapel[0]?.namaMapel || 'Bahasa dan Sastra Sunda',
      kelas: '10',
      rombelIds: ['ROM-000001'],
      durasiMenit: 60,
      tanggalMulai: new Date().toISOString(),
      tanggalSelesai: new Date(Date.now() + 86400000 * 7).toISOString(),
      nilaiMinimum: 75,
      acakSoal: true,
      acakJawaban: true,
      tokenRequired: true,
      currentToken: dbService.generateExamToken('JBR'),
      status: 'Published',
      modeMasuk: 'Kombinasi',
      soalIds: db.bankSoal.slice(0, 5).map((s) => s.id),
    });
    setIsFormModalOpen(true);
  };

  const handleRefreshToken = (ujian: Ujian) => {
    const newToken = dbService.generateExamToken('JBR');
    const updated = db.ujianList.map((u) =>
      u.id === ujian.id ? { ...u, currentToken: newToken } : u
    );
    db.ujianList = updated;
    dbService.saveToStorage(db);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaUjian) {
      alert('Mohon isi nama paket ujian!');
      return;
    }

    const newId = dbService.generateId('UJIAN');
    const newUjian: Ujian = {
      ...(formData as Ujian),
      id: newId,
      pembuatId: currentTeacher?.id || 'GURU-000001',
      pembuatNama: currentTeacher?.nama || currentUser.nama,
      linkKhusus: `/ujian/${newId}`,
      antiCheat: {
        enforceFullscreen: true,
        detectTabSwitch: true,
        blockCopyPaste: true,
        blockContextMenu: true,
        autoSubmitOnTimeUp: true,
      },
    };

    db.ujianList.push(newUjian);
    dbService.saveToStorage(db);
    setIsFormModalOpen(false);
  };

  // Booking Save Handler
  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();

    const bookingPayload: Omit<BookingUjianCAT, 'id'> = {
      ujianId: bookingForm.ujianId,
      namaUjian: bookingForm.namaUjian,
      guruId: bookingForm.guruId,
      guruNama: bookingForm.guruNama,
      mapelNama: bookingForm.mapelNama,
      ruanganLab: bookingForm.ruanganLab,
      tanggalUjian: bookingForm.tanggalUjian,
      sesiUjian: bookingForm.sesiUjian,
      jamMulai: bookingForm.sesiUjian.includes('Sesi 1') ? '07:30' : bookingForm.sesiUjian.includes('Sesi 2') ? '10:00' : '13:00',
      jamSelesai: bookingForm.sesiUjian.includes('Sesi 1') ? '09:30' : bookingForm.sesiUjian.includes('Sesi 2') ? '12:00' : '15:00',
      rombelTarget: bookingForm.rombelTarget,
      estimasiPeserta: bookingForm.estimasiPeserta,
      tokenUjian: dbService.generateExamToken('JBR'),
      statusBooking: 'Disetujui / Terjadwal',
      catatanAdmin: bookingForm.catatanAdmin,
      createdAt: new Date().toISOString(),
    };

    // Check for conflict
    const conflictCheck = dbService.validateCATBooking(bookingPayload);

    if (conflictCheck.hasConflict) {
      alert(`⚠️ Peringatan Jadwal Lab Bentrok!\n${conflictCheck.reason}`);
      return;
    }

    const newBooking: BookingUjianCAT = {
      ...bookingPayload,
      id: dbService.generateId('BCAT'),
    };

    if (!db.bookingCATList) {
      db.bookingCATList = [];
    }
    db.bookingCATList.push(newBooking);
    dbService.saveToStorage(db);
    setIsBookingModalOpen(false);
    alert(`Booking Lab CAT untuk ${newBooking.ruanganLab} (${newBooking.sesiUjian}) berhasil diverifikasi!`);
  };

  const handleExportPortfolioExcel = () => {
    const data = filteredPortofolio.map((p, idx) => ({
      No: idx + 1,
      NISN: p.nisn,
      'Nama Siswa': p.namaSiswa,
      'Mata Pelajaran': p.mapelNama,
      'Nama Ujian CAT': p.namaUjian,
      'Tanggal Pelaksanaan': p.tanggalPelaksanaan,
      'Nilai Akhir': p.nilai,
      'KKM Minimum': p.kkm,
      'Jumlah Benar': p.jumlahBenar,
      'Jumlah Salah': p.jumlahSalah,
      'Status Kelulusan': p.statusKelulusan,
      'Kategori Capaian': p.kategoriCapaian,
      'Catatan Evaluasi': p.catatanEvaluasi || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Portofolio_CAT');
    XLSX.writeFile(workbook, `Rekap_Nilai_Portofolio_CAT_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Lab Booking Conflict Preview
  const currentBookingConflict = dbService.validateCATBooking({
    ujianId: bookingForm.ujianId,
    namaUjian: bookingForm.namaUjian,
    guruId: bookingForm.guruId,
    guruNama: bookingForm.guruNama,
    mapelNama: bookingForm.mapelNama,
    ruanganLab: bookingForm.ruanganLab,
    tanggalUjian: bookingForm.tanggalUjian,
    sesiUjian: bookingForm.sesiUjian,
    jamMulai: '07:30',
    jamSelesai: '09:30',
    rombelTarget: bookingForm.rombelTarget,
    estimasiPeserta: bookingForm.estimasiPeserta,
    tokenUjian: 'TEMP',
    statusBooking: 'Diajukan',
    createdAt: new Date().toISOString(),
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-purple-600" />
            <span>{isStudent ? 'Portal Ujian CAT & Portofolio Siswa' : 'Manajemen Ujian, Booking Lab CAT & Portofolio Nilai'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isStudent
              ? 'Akses simulasi ujian CAT, paket soal aktif, dan buku portofolio rekapitulasi nilai Anda.'
              : 'Sistem terintegrasi: Wajib booking lab sebelum ujian CAT, token acak anti-curang, dan sinkronisasi otomatis ke rekam jejak portofolio siswa.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCatPortal}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <MonitorCheck className="w-4 h-4 text-slate-950" />
            <span>{isStudent ? 'Masuk Ruang CAT' : 'Simulasi Ruang Ujian CAT'}</span>
          </button>

          {!isStudent && (
            <button
              onClick={() => setIsClassTokenPrintModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Cetak Slip Token & Peserta Ujian berdasarkan Rombel, Hari dan Sesi"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>Cetak Token (Kelas & Sesi)</span>
            </button>
          )}

          {!isStudent && (
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Booking Lab CAT</span>
            </button>
          )}

          {!isStudent && canCreate && (
            <button
              onClick={handleOpenCreate}
              className="bg-[#1e293b] hover:bg-black text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Paket Ujian</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('ujian')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'ujian'
              ? 'border-purple-600 text-purple-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>{isStudent ? 'Daftar Ujian CAT' : 'Paket Ujian & Token CAT'} ({db.ujianList.length})</span>
        </button>

        {!isStudent && (
          <button
            onClick={() => setActiveTab('booking_lab')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'booking_lab'
                ? 'border-purple-600 text-purple-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Jadwal Booking Laboratorium CAT ({(db.bookingCATList || []).length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('rekap_portofolio')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'rekap_portofolio'
              ? 'border-purple-600 text-purple-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>{isStudent ? 'Rekam Jejak Portofolio Saya' : 'Rekam Jejak Portofolio Siswa'} ({filteredPortofolio.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAKET UJIAN & TOKEN CAT */}
      {/* ========================================================================= */}
      {activeTab === 'ujian' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama ujian atau mapel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Semua">Semua Jenis Ujian</option>
                <option value="PTS / Ujian Tengah Semester">PTS / Tengah Semester</option>
                <option value="PAS / Akhir Semester">PAS / Akhir Semester</option>
                <option value="Ulangan Harian">Ulangan Harian</option>
                <option value="Tugas">Tugas Terstruktur</option>
                <option value="UAS">UAS / Ujian Sekolah</option>
              </select>
            </div>
          </div>

          {/* Ujian Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredUjian.map((ujian) => {
              const finishedCount = (db.portofolioSiswaList || []).filter((p) => p.ujianId === ujian.id).length;

              return (
                <div
                  key={ujian.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                          {ujian.jenis}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">{ujian.namaUjian}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{ujian.mapelNama}</p>
                      </div>

                      {/* Token Pill */}
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400 font-semibold">Token Aktif:</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg">
                            {ujian.currentToken}
                          </span>
                          {canPublish && (
                            <button
                              onClick={() => handleRefreshToken(ujian)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Generate Token Baru"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Exam Metadata Grid */}
                    <div className="mt-4 grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Durasi</div>
                        <div className="font-bold text-slate-800 mt-0.5">{ujian.durasiMenit} Menit</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Jumlah Soal</div>
                        <div className="font-bold text-slate-800 mt-0.5">
                          {ujian.soalIds?.length || 0} Butir
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">KKM Kelulusan</div>
                        <div className="font-bold text-emerald-700 mt-0.5">{ujian.nilaiMinimum}</div>
                      </div>
                    </div>

                    {/* Anti-Cheat & Mode Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                        Lock Fullscreen
                      </span>
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                        Deteksi Tab Switch
                      </span>
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                        Acak Soal & Opsi
                      </span>
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                        Auto Portofolio
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedUjian(ujian);
                        setIsResultModalOpen(true);
                      }}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>Hasil & Portofolio ({finishedCount})</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUjian(ujian);
                          setIsPrintTokenModalOpen(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Cetak Token</span>
                      </button>

                      <button
                        onClick={onOpenCatPortal}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Mulai CAT</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BOOKING LABORATORIUM KOMPUTER CAT */}
      {/* ========================================================================= */}
      {activeTab === 'booking_lab' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl border border-purple-200 text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-700 shrink-0" />
              <div>
                <strong>Ketentuan Booking Laboratorium Komputer CAT:</strong>
                <p className="text-purple-800 text-[11px] mt-0.5">
                  Setiap guru wajib melakukan reservasi jadwal lab sebelum menyelenggarakan ujian CAT. Sistem otomatis memvalidasi jadwal agar tidak terjadi bentrok ruangan dan sesi.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Booking Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Laboratorium</th>
                    <th className="p-3.5">Tanggal & Sesi</th>
                    <th className="p-3.5">Guru Pengampu</th>
                    <th className="p-3.5">Mata Pelajaran & Ujian</th>
                    <th className="p-3.5">Rombel / Peserta</th>
                    <th className="p-3.5">Status Booking</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(db.bookingCATList || []).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-600" />
                        <span>{b.ruanganLab}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{b.tanggalUjian}</div>
                        <div className="text-[11px] text-purple-700 font-medium">{b.sesiUjian}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">{b.guruNama}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{b.mapelNama}</div>
                        <div className="text-[11px] text-slate-500">{b.namaUjian}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{(b.rombelTarget || []).join(', ')}</span>
                        <span className="text-[10px] text-slate-400 block">{b.estimasiPeserta} Siswa</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {b.statusBooking}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              mapelNama: b.mapelNama,
                              namaUjian: `Ujian CAT: ${b.mapelNama} (${(b.rombelTarget || []).join(', ')})`,
                            }));
                            setIsFormModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Tautkan Ujian
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
      {/* TAB 3: REKAM JEJAK PORTOFOLIO NILAI SISWA */}
      {/* ========================================================================= */}
      {activeTab === 'rekap_portofolio' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Rekam Jejak Portofolio Asesmen Siswa (CAT)</span>
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Semua hasil penilaian ulangan CAT otomatis tersimpan ke buku portofolio prestasi peserta didik.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() =>
                  exportBatchExamResultsPDF(
                    {
                      id: 'ALL',
                      namaUjian: isStudent ? 'Rekapitulasi Portofolio Hasil Asesmen CAT Siswa Mandiri' : 'Rekapitulasi Portofolio Hasil Asesmen CAT Siswa',
                      mapelNama: isGuruMapel && currentTeacher ? currentTeacher.mataPelajaranUtama || 'Mata Pelajaran Pengampu' : 'Semua Mata Pelajaran',
                      kelas: '10-12 SMA/SMK',
                      nilaiMinimum: 75,
                    } as any,
                    filteredPortofolio,
                    db.config.namaSekolah
                  )
                }
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Rekap PDF</span>
              </button>

              <button
                onClick={handleExportPortfolioExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Portofolio Excel</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Hasil Asesmen</div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {filteredPortofolio.length} Rekor
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Tingkat Tuntas / Lulus</div>
              <div className="text-lg font-black text-emerald-700 mt-1">
                {(() => {
                  const list = filteredPortofolio;
                  if (list.length === 0) return '0%';
                  const passed = list.filter((p) => p.nilai >= p.kkm).length;
                  return `${Math.round((passed / list.length) * 100)}%`;
                })()}
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Rata-Rata Nilai CAT</div>
              <div className="text-lg font-black text-purple-700 mt-1">
                {(() => {
                  const list = filteredPortofolio;
                  if (list.length === 0) return '0';
                  const total = list.reduce((acc, curr) => acc + curr.nilai, 0);
                  return Math.round(total / list.length);
                })()}
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Perlu Remedial</div>
              <div className="text-lg font-black text-rose-600 mt-1">
                {filteredPortofolio.filter((p) => p.nilai < p.kkm).length} Siswa
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Nama Siswa & NISN</th>
                    <th className="p-3.5">Nama Ujian & Mapel</th>
                    <th className="p-3.5">Tanggal Asesmen</th>
                    <th className="p-3.5">Analisis Soal</th>
                    <th className="p-3.5">Nilai Siswa</th>
                    <th className="p-3.5">Status & Capaian</th>
                    <th className="p-3.5">Catatan Evaluasi</th>
                    <th className="p-3.5 text-right">Laporan PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPortofolio.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{p.namaSiswa}</div>
                        <div className="text-[11px] font-mono text-slate-500">NISN: {p.nisn}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{p.namaUjian}</div>
                        <div className="text-[11px] text-purple-700 font-medium">{p.mapelNama}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                        {p.tanggalPelaksanaan}
                      </td>
                      <td className="p-3.5 text-[11px]">
                        <span className="text-emerald-700 font-bold">✓ {p.jumlahBenar} Benar</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-rose-600 font-bold">✗ {p.jumlahSalah} Salah</span>
                      </td>
                      <td className="p-3.5">
                        <div className={`text-base font-black ${p.nilai >= p.kkm ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {p.nilai}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">KKM: {p.kkm}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            p.nilai >= p.kkm
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.statusKelulusan}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                          {p.kategoriCapaian}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 italic text-[11px] max-w-xs truncate">
                        {p.catatanEvaluasi || '-'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() =>
                            exportSingleStudentExamPDF(p, {
                              sekolahNama: db.config.namaSekolah,
                              guruNama: currentTeacher?.nama || 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
                              rombel: 'X MIPA 1',
                            })
                          }
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          title="Unduh Laporan Hasil Ujian Siswa (PDF Resmi Disdik Jabar)"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                          <span>PDF Rapor</span>
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
      {/* MODAL: BOOKING LABORATORIUM CAT */}
      {/* ========================================================================= */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                <span>Formulir Booking Laboratorium CAT</span>
              </h3>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={bookingForm.guruId}
                  onChange={(e) => {
                    const g = db.guru.find((x) => x.id === e.target.value);
                    setBookingForm({
                      ...bookingForm,
                      guruId: e.target.value,
                      guruNama: g?.nama || 'Guru',
                      mapelNama: g?.mataPelajaranUtama || bookingForm.mapelNama,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                >
                  {db.guru.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama} ({g.mataPelajaranUtama})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Laboratorium Komputer</label>
                  <select
                    value={bookingForm.ruanganLab}
                    onChange={(e) => setBookingForm({ ...bookingForm, ruanganLab: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Lab Komputer 1 (40 Unit PC)">Lab Komputer 1 (40 PC)</option>
                    <option value="Lab Komputer 2 (36 Unit PC)">Lab Komputer 2 (36 PC)</option>
                    <option value="Lab Multimedia & Desain">Lab Multimedia (32 PC)</option>
                    <option value="Ruang Server CBT">Ruang Server CBT (45 PC)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.tanggalUjian}
                    onChange={(e) => setBookingForm({ ...bookingForm, tanggalUjian: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Sesi Ujian</label>
                  <select
                    value={bookingForm.sesiUjian}
                    onChange={(e) => setBookingForm({ ...bookingForm, sesiUjian: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Sesi 1 (07:30 - 09:30)">Sesi 1 (07:30 - 09:30)</option>
                    <option value="Sesi 2 (10:00 - 12:00)">Sesi 2 (10:00 - 12:00)</option>
                    <option value="Sesi 3 (13:00 - 15:00)">Sesi 3 (13:00 - 15:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Rombel</label>
                  <select
                    value={bookingForm.rombelTarget[0] || 'X MIPA 1'}
                    onChange={(e) => setBookingForm({ ...bookingForm, rombelTarget: [e.target.value] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="X MIPA 1">X MIPA 1</option>
                    <option value="X MIPA 2">X MIPA 2</option>
                    <option value="XI MIPA 1">XI MIPA 1</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Siswa</label>
                  <input
                    type="number"
                    value={bookingForm.estimasiPeserta}
                    onChange={(e) => setBookingForm({ ...bookingForm, estimasiPeserta: parseInt(e.target.value) || 36 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Conflict Live Warning */}
              {currentBookingConflict && currentBookingConflict.hasConflict && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Peringatan Bentrok Laboratorium:</strong>
                    <p className="mt-0.5">{currentBookingConflict.reason}</p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Konfirmasi Booking Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CETAK TOKEN MODAL (PRINT READY WITH QR CODE) */}
      {/* ========================================================================= */}
      {isPrintTokenModalOpen && selectedUjian && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>Kartu Token Resmi Ujian CAT</span>
              </h3>
              <button
                onClick={() => setIsPrintTokenModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Card Container */}
            <div className="mt-4 p-6 border-2 border-slate-800 rounded-2xl bg-slate-50/50 print:bg-white text-center">
              <div className="border-b-2 border-slate-800 pb-3 mb-4">
                <div className="text-[10px] font-extrabold tracking-widest text-slate-700 uppercase">
                  PEMERINTAH DAERAH PROVINSI JAWA BARAT • DINAS PENDIDIKAN
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {db.config.namaSekolah || 'SMAN 1 KOTA BANDUNG'} (CAT ASESMEN TERPADU)
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Jl. Ir. H. Juanda No. 93, Dago, Kecamatan Coblong, Kota Bandung
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-base font-bold text-slate-900">{selectedUjian.namaUjian}</h4>
                <div className="text-xs font-semibold text-purple-700">{selectedUjian.mapelNama}</div>
              </div>

              {/* Big Token Display */}
              <div className="my-6 p-4 bg-amber-100 border-2 border-dashed border-amber-400 rounded-2xl inline-block">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                  KODE TOKEN AKTIF SESI
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-black text-slate-950 tracking-widest">
                  {selectedUjian.currentToken}
                </div>
              </div>

              <div className="flex justify-center my-4">
                <QRCodeSVG value={selectedUjian.currentToken} size={110} level="H" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 max-w-xs mx-auto border-t border-slate-200 pt-3">
                <div>Durasi: <strong>{selectedUjian.durasiMenit} Menit</strong></div>
                <div>KKM: <strong>{selectedUjian.nilaiMinimum}</strong></div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between print:hidden">
              <button
                onClick={() => handleRefreshToken(selectedUjian)}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Acak Ulang Token</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintTokenModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kartu Token</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL HASIL NILAI UJIAN CAT */}
      {/* ========================================================================= */}
      {isResultModalOpen && selectedUjian && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rekapitulasi Nilai & Portofolio Siswa</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedUjian.namaUjian}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const examPortfolios = (db.portofolioSiswaList || []).filter((s) => s.ujianId === selectedUjian.id);
                    exportBatchExamResultsPDF(selectedUjian, examPortfolios, db.config.namaSekolah);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Ekspor Seluruh Nilai Ujian Ini ke PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cetak Rekap PDF</span>
                </button>
                <button
                  onClick={() => setIsResultModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">NISN</th>
                    <th className="p-3">Benar/Salah</th>
                    <th className="p-3">Nilai CAT</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(db.portofolioSiswaList || [])
                    .filter((s) => s.ujianId === selectedUjian.id)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{item.namaSiswa}</td>
                        <td className="p-3 font-mono text-slate-600">{item.nisn}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          {item.jumlahBenar}B / {item.jumlahSalah}S
                        </td>
                        <td className="p-3 font-mono text-base font-black text-slate-900">
                          {item.nilai}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              item.nilai >= item.kkm
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.statusKelulusan}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() =>
                              exportSingleStudentExamPDF(item, {
                                sekolahNama: db.config.namaSekolah,
                                guruNama: currentTeacher?.nama || 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
                                rombel: 'X MIPA 1',
                              })
                            }
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Unduh Lembar Laporan Hasil Ujian PDF (Disdik Jabar)"
                          >
                            <FileDown className="w-3 h-3 text-emerald-400" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE EXAM MODAL */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <span>Buat Paket Ujian CAT Baru</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Paket Ujian *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaUjian || ''}
                  onChange={(e) => setFormData({ ...formData, namaUjian: e.target.value })}
                  placeholder="Contoh: PTS Ganjil: Informatika & Berpikir Komputasional"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Ujian</label>
                  <select
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="PTS / Ujian Tengah Semester">PTS / Tengah Semester</option>
                    <option value="PAS / Akhir Semester">PAS / Akhir Semester</option>
                    <option value="Ulangan Harian">Ulangan Harian</option>
                    <option value="Tugas">Tugas Terstruktur</option>
                    <option value="UAS">UAS / Ujian Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={formData.mapelNama}
                    onChange={(e) => {
                      const name = e.target.value;
                      const mObj = db.mapel.find((m) => m.namaMapel === name);
                      setFormData({
                        ...formData,
                        mapelNama: name,
                        mapelId: mObj?.id || 'MAP-000001',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    {db.mapel.map((m) => (
                      <option key={m.id} value={m.namaMapel}>
                        {m.namaMapel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Durasi (Menit) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={formData.durasiMenit || 60}
                    onChange={(e) =>
                      setFormData({ ...formData, durasiMenit: parseInt(e.target.value) || 60 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nilai KKM Minimum *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.nilaiMinimum || 75}
                    onChange={(e) =>
                      setFormData({ ...formData, nilaiMinimum: parseInt(e.target.value) || 75 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Butir Soal dari Bank Soal ({db.bankSoal.length} Tersedia)
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                  {db.bankSoal.map((soal) => {
                    const isChecked = formData.soalIds?.includes(soal.id);
                    return (
                      <label
                        key={soal.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = formData.soalIds || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, soalIds: [...current, soal.id] });
                            } else {
                              setFormData({
                                ...formData,
                                soalIds: current.filter((id) => id !== soal.id),
                              });
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-semibold text-slate-800">{soal.mapelNama}:</span>
                        <span className="text-slate-600 truncate">{soal.pertanyaan}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Simpan & Terbitkan Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CETAK PEMBAGIAN TOKEN PER KELAS, SESI & HARI (Requirement #6) */}
      {/* ========================================================================= */}
      {isClassTokenPrintModalOpen && (() => {
        const targetStudents = db.siswa.filter(
          (s) => tokenTargetRombel === 'Semua' || s.rombel === tokenTargetRombel
        );
        const activeExam = selectedUjian || db.ujianList[0];
        const sysCfg = dbService.getSystemConfig();

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150 text-xs print:p-0 print:border-none print:shadow-none print:my-0">
              {/* Modal Header Controls (Hidden when printing) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <Printer className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Cetak Pembagian Token Ujian (Per Kelas, Sesi & Hari)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Format slip cetak peserta ujian CAT terstandar untuk {sysCfg.namaSekolah}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Kartu Sesi (Print)</span>
                  </button>
                  <button
                    onClick={() => setIsClassTokenPrintModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Controls Bar (Hidden when printing) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 print:hidden">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rombel / Kelas:</label>
                  <select
                    value={tokenTargetRombel}
                    onChange={(e) => setTokenTargetRombel(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Semua">Semua Rombel</option>
                    {db.rombel.map((r) => (
                      <option key={r.id} value={r.namaRombel}>
                        {r.namaRombel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari & Tanggal Ujian:</label>
                  <input
                    type="date"
                    value={tokenTargetHari}
                    onChange={(e) => setTokenTargetHari(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sesi Ujian:</label>
                  <select
                    value={tokenTargetSesi}
                    onChange={(e) => setTokenTargetSesi(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Sesi 1 (07:30 - 09:30)">Sesi 1 (07:30 - 09:30)</option>
                    <option value="Sesi 2 (10:00 - 12:00)">Sesi 2 (10:00 - 12:00)</option>
                    <option value="Sesi 3 (13:00 - 15:00)">Sesi 3 (13:00 - 15:00)</option>
                  </select>
                </div>
              </div>

              {/* Printable Grid of Student Token Slips */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible print:pr-0">
                <div className="text-right text-[11px] text-slate-500 font-mono print:hidden">
                  Total {targetStudents.length} Slip Peserta Siap Dicetak
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
                  {targetStudents.map((siswa, idx) => (
                    <div
                      key={siswa.id}
                      className="border-2 border-slate-800 rounded-2xl p-4 bg-slate-50/50 print:bg-white flex flex-col justify-between space-y-3 break-inside-avoid"
                    >
                      {/* Header */}
                      <div className="border-b-2 border-slate-800 pb-2 text-center">
                        <div className="text-[8px] font-black tracking-widest text-slate-600 uppercase">
                          PEMERINTAH PROVINSI JAWA BARAT • DINAS PENDIDIKAN
                        </div>
                        <div className="text-xs font-black text-slate-900 uppercase">
                          {sysCfg.namaSekolah}
                        </div>
                        <div className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          SLIP TOKEN & KARTU LOGIN PESERTA UJIAN CAT
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                        <div className="col-span-2 space-y-1">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">
                              Nama Peserta Ujian
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs block">
                              {siswa.namaLengkap}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            <div>
                              <span className="text-slate-400 block font-bold text-[8px]">NISN / Username</span>
                              <span className="font-mono font-bold text-slate-800">{siswa.nisn}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold text-[8px]">Rombel</span>
                              <span className="font-bold text-emerald-800">{siswa.rombel}</span>
                            </div>
                          </div>

                          <div className="text-[10px]">
                            <span className="text-slate-400 font-bold block text-[8px]">Hari & Sesi Ujian</span>
                            <span className="font-semibold text-slate-800">
                              {tokenTargetHari} • {tokenTargetSesi}
                            </span>
                          </div>
                        </div>

                        {/* QR Code & Token Box */}
                        <div className="text-center p-2 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
                          <QRCodeSVG
                            value={activeExam?.currentToken || 'JBR-ABCD'}
                            size={56}
                            level="M"
                            className="mx-auto"
                          />
                          <div className="text-[8px] font-bold text-amber-900 uppercase">TOKEN SESI</div>
                          <div className="font-mono font-black text-xs text-amber-950 tracking-wider">
                            {activeExam?.currentToken || 'JBR-ABCD'}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                        <div>Ruang: Lab Komputer 1</div>
                        <div>Password Default: siswa123</div>
                        <div>Paraf Pengawas: _________</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end print:hidden">
                <button
                  onClick={() => setIsClassTokenPrintModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Tutup Window Cetak
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
