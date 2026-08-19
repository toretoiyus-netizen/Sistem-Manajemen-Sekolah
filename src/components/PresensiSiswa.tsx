import React, { useState } from 'react';
import {
  CalendarCheck2,
  QrCode,
  Users,
  Download,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  AlertCircle,
  FileSpreadsheet,
  Save,
  BookOpen,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PresensiRecord, Siswa, UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';

interface PresensiSiswaProps {
  currentUser: UserAccount;
}

export const PresensiSiswa: React.FC<PresensiSiswaProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const [activeTab, setActiveTab] = useState<'batch' | 'qrcode' | 'mandiri' | 'rekap'>('batch');

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedRombel, setSelectedRombel] = useState<string>(
    db.rombel[0]?.id || 'ROM-000001'
  );
  const [selectedMapel, setSelectedMapel] = useState<string>(
    db.mapel[0]?.id || 'MAP-000001'
  );

  // Journal notes for teacher
  const [journalMateri, setJournalMateri] = useState('Penerapan Berpikir Komputasional & Algoritma');
  const [journalCatatan, setJournalCatatan] = useState('Siswa aktif berdiskusi. 2 siswa izin kegiatan lomba.');

  // Students in selected rombel
  const rombelObj = db.rombel.find((r) => r.id === selectedRombel);
  const studentsInClass = db.siswa.filter((s) => s.rombel === rombelObj?.namaRombel);

  // Local Attendance State: { [siswaId]: { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa', catatan: string } }
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'; catatan: string }>
  >(() => {
    const init: Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'; catatan: string }> = {};
    db.siswa.forEach((s) => {
      init[s.id] = { status: 'Hadir', catatan: '' };
    });
    return init;
  });

  // QR Code Scanner Simulation
  const [scannedNisn, setScannedNisn] = useState('');
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  // Mandiri GPS Simulation
  const [gpsVerified, setGpsVerified] = useState(false);
  const [selfieTaken, setSelfieTaken] = useState(false);

  const handleStatusChange = (
    siswaId: string,
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'
  ) => {
    setAttendanceState((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        status,
      },
    }));
  };

  const handleCatatanChange = (siswaId: string, catatan: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        catatan,
      },
    }));
  };

  const handleSetAllPresent = () => {
    const updated = { ...attendanceState };
    studentsInClass.forEach((s) => {
      updated[s.id] = { ...updated[s.id], status: 'Hadir' };
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = () => {
    const currentTeacher = db.guru.find((g) => g.id === currentUser.referenceId);

    studentsInClass.forEach((siswa) => {
      const state = attendanceState[siswa.id] || { status: 'Hadir', catatan: '' };
      const newRec: PresensiRecord = {
        id: dbService.generateId('PRS'),
        tanggal: selectedDate,
        siswaId: siswa.id,
        namaSiswa: siswa.namaLengkap,
        nisn: siswa.nisn,
        rombelId: selectedRombel,
        rombelNama: rombelObj?.namaRombel || 'X MIPA 1',
        mapelId: selectedMapel,
        guruId: currentTeacher?.id || 'GURU-000001',
        status: state.status,
        keterangan: state.catatan,
        metode: 'Manual Guru',
        waktuPresensi: new Date().toLocaleTimeString('id-ID'),
      };
      db.presensi.push(newRec);
    });

    dbService.saveToStorage(db);
    alert(`Presensi untuk ${studentsInClass.length} siswa berhasil disimpan ke Google Sheets!`);
  };

  const handleSimulateQRScan = (e: React.FormEvent) => {
    e.preventDefault();
    const found = db.siswa.find((s) => s.nisn === scannedNisn || s.nis === scannedNisn);
    if (found) {
      setAttendanceState((prev) => ({
        ...prev,
        [found.id]: { status: 'Hadir', catatan: 'Scan QR Kartu Pelajar' },
      }));
      setScanSuccessMessage(`Berhasil mencatat kehadiran siswa: ${found.namaLengkap} (${found.rombel})`);
      setScannedNisn('');
    } else {
      alert('NISN tidak ditemukan dalam database siswa.');
    }
  };

  const handleExportExcel = () => {
    const exportData = db.presensi.map((p) => ({
      Tanggal: p.tanggal,
      'Nama Siswa': p.namaSiswa,
      NISN: p.nisn,
      Rombel: p.rombelNama,
      'Status Kehadiran': p.status,
      Keterangan: p.keterangan || '-',
      Metode: p.metode,
      'Waktu Presensi': p.waktuPresensi,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Presensi_Jabar');
    XLSX.writeFile(workbook, `Rekap_Presensi_${selectedDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
              <span>Presensi Siswa & Jurnal KBM</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan kehadiran harian siswa, scan QR kartu pelajar, dan rekapitulasi presensi otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Rekap Excel</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'batch'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Presensi Rombel (Checklist)</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'qrcode'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Kartu Pelajar</span>
          </button>

          <button
            onClick={() => setActiveTab('mandiri')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'mandiri'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Presensi Mandiri Siswa (GPS & Selfie)</span>
          </button>

          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rekap'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Rekapitulasi Kehadiran</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BATCH ATTENDANCE CHECKLIST */}
      {/* ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Presensi</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rombongan Belajar</label>
              <select
                value={selectedRombel}
                onChange={(e) => setSelectedRombel(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {db.rombel.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.namaRombel} ({r.jurusan})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {db.mapel.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSetAllPresent}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-lg border border-slate-300 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Semua Hadir (Quick)</span>
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">No</th>
                    <th className="p-3.5">Nama Lengkap Siswa</th>
                    <th className="p-3.5">NISN / NIS</th>
                    <th className="p-3.5">Status Kehadiran</th>
                    <th className="p-3.5">Keterangan / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentsInClass.map((siswa, idx) => {
                    const cur = attendanceState[siswa.id] || { status: 'Hadir', catatan: '' };

                    return (
                      <tr key={siswa.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{siswa.namaLengkap}</div>
                          <div className="text-[11px] text-slate-500">{siswa.rombel}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">{siswa.nisn}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(siswa.id, st)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                                  cur.status === st
                                    ? st === 'Hadir'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : st === 'Sakit'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : st === 'Izin'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <input
                            type="text"
                            value={cur.catatan}
                            onChange={(e) => handleCatatanChange(siswa.id, e.target.value)}
                            placeholder="Catatan tambahan (opsional)"
                            className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Jurnal Guru & Save Action */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Jurnal Pembelajaran Guru (KBM Hari Ini)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Materi Pokok / Bahasan
                  </label>
                  <input
                    type="text"
                    value={journalMateri}
                    onChange={(e) => setJournalMateri(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Perkembangan Kelas
                  </label>
                  <input
                    type="text"
                    value={journalCatatan}
                    onChange={(e) => setJournalCatatan(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveAttendance}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Presensi & Jurnal KBM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SCAN QR CODE KARTU PELAJAR */}
      {/* ========================================================================= */}
      {activeTab === 'qrcode' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
            <QrCode className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">Scan Barcode / QR Kartu Pelajar</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan barcode scanner atau ketikkan nomor NISN untuk presensi cepat di gerbang / kelas.
            </p>
          </div>

          {scanSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{scanSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSimulateQRScan} className="space-y-3">
            <input
              type="text"
              autoFocus
              value={scannedNisn}
              onChange={(e) => setScannedNisn(e.target.value)}
              placeholder="Arahkan scanner ke QR atau ketik NISN..."
              className="w-full px-4 py-2.5 border-2 border-emerald-500 rounded-xl font-mono text-center text-sm focus:outline-none"
            />

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
            >
              Catat Kehadiran QR
            </button>
          </form>

          <div className="text-[11px] text-slate-400">
            Contoh Coba NISN: <span className="font-mono text-slate-600">0078129301</span>,{' '}
            <span className="font-mono text-slate-600">0078129302</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PRESENSI MANDIRI SISWA (GEOFENCING & SELFIE) */}
      {/* ========================================================================= */}
      {activeTab === 'mandiri' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Presensi Mandiri Berbasis Lokasi (Geofencing)</span>
          </h3>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Radius Sekolah (SMAN 1 Bandung):</span>
              <span className="font-bold text-emerald-700">Dalam Radius (12 Meter)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Koordinat GPS:</span>
              <span className="font-mono text-slate-800">-6.90389, 107.61861</span>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 bg-slate-50">
            <Camera className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-bold text-slate-700">Verifikasi Wajah (Selfie)</div>
            <p className="text-[11px] text-slate-500">
              Ambil swafoto di area sekolah dengan seragam lengkap.
            </p>
            <button
              onClick={() => {
                setSelfieTaken(true);
                alert('Foto wajah berhasil diverifikasi!');
              }}
              className="mt-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-[11px]"
            >
              {selfieTaken ? 'Foto Terverifikasi ✓' : 'Ambil Foto Selfie'}
            </button>
          </div>

          <button
            onClick={() => {
              alert('Presensi Mandiri Siswa Berhasil Dikirim!');
              setActiveTab('rekap');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            Kirim Presensi Mandiri Sekarang
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REKAPITULASI PRESENSI */}
      {/* ========================================================================= */}
      {activeTab === 'rekap' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Riwayat Catatan Presensi Sekolah</h3>
            <span className="text-xs text-slate-500 font-mono">
              Total {db.presensi.length} Data Terdata
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">NISN</th>
                  <th className="p-3">Rombel</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Metode</th>
                  <th className="p-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {db.presensi.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-slate-700">{p.tanggal}</td>
                    <td className="p-3 font-bold text-slate-900">{p.namaSiswa}</td>
                    <td className="p-3 font-mono text-slate-600">{p.nisn}</td>
                    <td className="p-3">{p.rombelNama}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          p.status === 'Hadir'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Sakit'
                            ? 'bg-amber-100 text-amber-800'
                            : p.status === 'Izin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{p.metode}</td>
                    <td className="p-3 font-mono text-slate-500">{p.waktuPresensi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
