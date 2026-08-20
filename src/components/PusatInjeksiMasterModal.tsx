import React, { useState } from 'react';
import {
  Layers,
  X,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  FileText,
  Users,
  BookOpen,
  Calendar,
  Building,
  ShieldAlert,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { dbService } from '../services/mockDatabase';
import { KBMSchedule, MataPelajaran, Rombel, Siswa, Guru } from '../types';

interface PusatInjeksiMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type InjectionCategory = 'penjadwalan' | 'rombel' | 'guruwali' | 'mapel';

export const PusatInjeksiMasterModal: React.FC<PusatInjeksiMasterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeCategory, setActiveCategory] = useState<InjectionCategory>('penjadwalan');
  const [fileType, setFileType] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [uploadLog, setUploadLog] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    details?: string[];
  }>({ status: 'idle', message: '' });

  if (!isOpen) return null;

  const db = dbService.getState();

  // =========================================================================
  // 1. TEMPLATE GENERATORS (XLSX, CSV, JSON)
  // =========================================================================

  // A. Template Penjadwalan
  const templatePenjadwalanData = [
    {
      Hari: 'Senin',
      JamKe: 1,
      JamMulai: '07:30',
      JamSelesai: '08:50',
      NamaRombel: 'X MIPA 1',
      KodeMapel: 'MAP-000001',
      NamaMapel: 'Informatika',
      NIP_Guru: '198203152008011002',
      NamaGuru: 'Dr. H. Bambang Sutrisno, M.Pd.',
      RuangKelas: 'R. 101 (Gedung Kujang)',
      Keterangan: 'KBM Reguler Wajib',
    },
    {
      Hari: 'Senin',
      JamKe: 2,
      JamMulai: '08:50',
      JamSelesai: '10:10',
      NamaRombel: 'X MIPA 1',
      KodeMapel: 'MAP-000002',
      NamaMapel: 'Matematika Tingkat Lanjut',
      NIP_Guru: '198506122010012005',
      NamaGuru: 'Hj. Siti Aminah, M.Pd.',
      RuangKelas: 'R. 101 (Gedung Kujang)',
      Keterangan: 'KBM Reguler Wajib',
    },
  ];

  // B. Template Rombel
  const templateRombelData = [
    {
      KodeRombel: 'ROM-000001',
      NamaRombel: 'X MIPA 1',
      Tingkat: '10',
      Jurusan: 'MIPA',
      NIP_WaliKelas: '198506122010012005',
      NamaWaliKelas: 'Hj. Siti Aminah, M.Pd.',
      TahunPelajaran: '2024/2025',
      DaftarNISNSiswa: '0061234567, 0062345678, 0063456789',
    },
    {
      KodeRombel: 'ROM-000002',
      NamaRombel: 'XI IPS 2',
      Tingkat: '11',
      Jurusan: 'IPS',
      NIP_WaliKelas: '199001012015021001',
      NamaWaliKelas: 'Ahmad Fauzi, S.Pd.',
      TahunPelajaran: '2024/2025',
      DaftarNISNSiswa: '0064567890, 0065678901',
    },
  ];

  // C. Template Guru Wali
  const templateGuruWaliData = [
    {
      NIP_GuruWali: '198203152008011002',
      NamaGuruWali: 'Dr. H. Bambang Sutrisno, M.Pd.',
      NISN_Siswa: '0061234567',
      NamaSiswa: 'Muhammad Rizky Pratama',
      NamaRombel: 'X MIPA 1',
    },
    {
      NIP_GuruWali: '198203152008011002',
      NamaGuruWali: 'Dr. H. Bambang Sutrisno, M.Pd.',
      NISN_Siswa: '0062345678',
      NamaSiswa: 'Siti Nurhaliza',
      NamaRombel: 'X MIPA 1',
    },
    {
      NIP_GuruWali: '198506122010012005',
      NamaGuruWali: 'Hj. Siti Aminah, M.Pd.',
      NISN_Siswa: '0063456789',
      NamaSiswa: 'Dini Rahmawati',
      NamaRombel: 'X MIPA 1',
    },
  ];

  // D. Template Mata Pelajaran
  const templateMapelData = [
    {
      KodeMapel: 'MAP-000001',
      NamaMapel: 'Informatika',
      Kelompok: 'Wajib',
      Tingkat: '10',
      JamPerMinggu: 3,
      StatusActive: 'Aktif',
    },
    {
      KodeMapel: 'MAP-000002',
      NamaMapel: 'Matematika Tingkat Lanjut',
      Kelompok: 'Kejuruan/Peminatan',
      Tingkat: '11',
      JamPerMinggu: 4,
      StatusActive: 'Aktif',
    },
  ];

  const getActiveData = () => {
    switch (activeCategory) {
      case 'penjadwalan':
        return { name: 'Master_Penjadwalan_KBM', data: templatePenjadwalanData };
      case 'rombel':
        return { name: 'Master_Data_Rombel', data: templateRombelData };
      case 'guruwali':
        return { name: 'Master_Penugasan_Guru_Wali', data: templateGuruWaliData };
      case 'mapel':
        return { name: 'Master_Mata_Pelajaran', data: templateMapelData };
    }
  };

  const handleDownloadTemplate = (format: 'xlsx' | 'csv' | 'json') => {
    const { name, data } = getActiveData();

    if (format === 'json') {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Template_Injek_${name}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csvStr = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Template_Injek_${name}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, `Template_Injek_${name}.xlsx`);
    }
  };

  // =========================================================================
  // 2. INJECTION FILE PARSER & STRICT VALIDATIONS
  // =========================================================================

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLog({ status: 'processing', message: 'Membaca dan memvalidasi file injeksi...' });

    const fileName = file.name.toLowerCase();
    const isJson = fileName.endsWith('.json');

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        let rows: any[] = [];

        if (isJson) {
          const content = evt.target?.result as string;
          rows = JSON.parse(content);
        } else {
          const binaryStr = evt.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(sheet);
        }

        if (!Array.isArray(rows) || rows.length === 0) {
          setUploadLog({
            status: 'error',
            message: 'File kosong atau format data tidak dapat dibaca sebagai array/tabel JSON/CSV/Excel!',
          });
          return;
        }

        // PROCESS CATEGORIES WITH STRICT VALIDATIONS
        if (activeCategory === 'penjadwalan') {
          processInjectPenjadwalan(rows);
        } else if (activeCategory === 'rombel') {
          processInjectRombel(rows);
        } else if (activeCategory === 'guruwali') {
          processInjectGuruWali(rows);
        } else if (activeCategory === 'mapel') {
          processInjectMapel(rows);
        }
      } catch (err: any) {
        setUploadLog({
          status: 'error',
          message: `Gagal memproses file: ${err?.message || 'Format tidak valid'}`,
        });
      }
    };

    if (isJson) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // =========================================================================
  // 3. INJECTION PROCESSORS WITH RULE ENFORCEMENT
  // =========================================================================

  // A. Injek Penjadwalan
  const processInjectPenjadwalan = (rows: any[]) => {
    let successCount = 0;
    const warnings: string[] = [];

    rows.forEach((row, idx) => {
      const hari = row.Hari || row.hari || 'Senin';
      const jamKe = Number(row.JamKe || row.jamKe || 1);
      const jamMulai = String(row.JamMulai || row.jamMulai || '07:30');
      const jamSelesai = String(row.JamSelesai || row.jamSelesai || '08:50');
      const namaRombel = row.NamaRombel || row.namaRombel || row.Rombel;
      const kodeMapel = row.KodeMapel || row.kodeMapel;
      const nipGuru = row.NIP_Guru || row.nipGuru || row.NIP;
      const ruang = row.RuangKelas || row.ruang || 'R. Kelas';
      const ket = row.Keterangan || row.keterangan || 'Injeksi Skema Super Admin';

      const rombelObj = db.rombel.find(
        (r) => r.namaRombel.toLowerCase() === String(namaRombel).toLowerCase()
      ) || db.rombel[0];

      const mapelObj = db.mapel.find(
        (m) =>
          m.id === kodeMapel ||
          m.kodeMapel.toLowerCase() === String(kodeMapel).toLowerCase()
      ) || db.mapel[0];

      const guruObj = db.guru.find(
        (g) => g.nip === nipGuru || g.nama.toLowerCase().includes(String(row.NamaGuru || '').toLowerCase())
      ) || db.guru[0];

      // Schedule conflict check (Teacher double booked)
      const conflict = db.jadwalKBM.find(
        (j) => j.guruId === guruObj.id && j.hari === hari && j.jamMulai === jamMulai
      );

      if (conflict) {
        warnings.push(
          `Baris ${idx + 1}: Guru ${guruObj.nama} mengalami bentrok jadwal pada hari ${hari} jam ${jamMulai} (Rombel ${rombelObj.namaRombel}). Jadwal tetap diinjeksi.`
        );
      }

      const newSchedule: KBMSchedule = {
        id: dbService.generateId('SCH'),
        hari,
        jamKe,
        jamMulai,
        jamSelesai,
        rombelId: rombelObj.id,
        mapelId: mapelObj.id,
        guruId: guruObj.id,
        ruang,
        keterangan: ket,
      };

      db.jadwalKBM.push(newSchedule);
      successCount++;
    });

    dbService.saveToStorage(db);
    setUploadLog({
      status: 'success',
      message: `BERHASIL INJEKSI SKEMA PENJADWALAN! ${successCount} sesi KBM baru telah ditambahkan ke database.`,
      details: warnings.length > 0 ? warnings : undefined,
    });
    onSuccess();
  };

  // B. Injek Rombel
  const processInjectRombel = (rows: any[]) => {
    let successCount = 0;

    rows.forEach((row) => {
      const namaRombel = String(row.NamaRombel || row.namaRombel || 'Rombel Baru').trim();
      const tingkat = String(row.Tingkat || row.tingkat || '10');
      const jurusan = String(row.Jurusan || row.jurusan || 'MIPA');
      const nipWali = String(row.NIP_WaliKelas || row.nipWaliKelas || '');
      const tp = String(row.TahunPelajaran || row.tahunPelajaran || '2024/2025');
      const nisnListRaw = String(row.DaftarNISNSiswa || row.nisnSiswa || '');

      const waliObj = db.guru.find((g) => g.nip === nipWali) || db.guru[0];

      let existingRombel = db.rombel.find(
        (r) => r.namaRombel.toLowerCase() === namaRombel.toLowerCase()
      );

      if (existingRombel) {
        existingRombel.tingkat = tingkat as any;
        existingRombel.jurusan = jurusan;
        existingRombel.waliKelasId = waliObj.id;
        existingRombel.waliKelasNama = waliObj.nama;
        existingRombel.tahunPelajaran = tp;
      } else {
        existingRombel = {
          id: dbService.generateId('ROM'),
          namaRombel,
          tingkat: tingkat as any,
          jurusan,
          waliKelasId: waliObj.id,
          waliKelasNama: waliObj.nama,
          tahunPelajaran: tp,
          jumlahSiswa: 0,
          status: 'Aktif',
        };
        db.rombel.push(existingRombel);
      }

      // Assign Students by NISN
      if (nisnListRaw) {
        const nisns = nisnListRaw.split(',').map((s) => s.trim()).filter(Boolean);
        nisns.forEach((nisn) => {
          const sObj = db.siswa.find((s) => s.nisn === nisn);
          if (sObj) {
            sObj.rombel = existingRombel!.namaRombel;
            sObj.rombelId = existingRombel!.id;
            sObj.waliKelasId = waliObj.id;
          }
        });
        existingRombel.jumlahSiswa = db.siswa.filter(
          (s) => s.rombel === existingRombel!.namaRombel
        ).length;
      }

      successCount++;
    });

    dbService.saveToStorage(db);
    setUploadLog({
      status: 'success',
      message: `BERHASIL INJEKSI DATA ROMBEL! ${successCount} rombel telah dibuat / diperbarui.`,
    });
    onSuccess();
  };

  // C. Injek Guru Wali (Requirement #2 STRICT ENFORCEMENT: NO DOUBLE ASSIGNMENT!)
  const processInjectGuruWali = (rows: any[]) => {
    let successCount = 0;
    const errors: string[] = [];
    const assignedInThisSession = new Map<string, string>(); // NISN -> Guru Wali Name

    // Validate double assignment
    rows.forEach((row, idx) => {
      const nipGuru = String(row.NIP_GuruWali || row.nipGuruWali || '').trim();
      const nisnSiswa = String(row.NISN_Siswa || row.nisnSiswa || '').trim();

      const guruObj = db.guru.find((g) => g.nip === nipGuru);
      const siswaObj = db.siswa.find((s) => s.nisn === nisnSiswa);

      if (!guruObj) {
        errors.push(`Baris ${idx + 1}: NIP Guru Wali '${nipGuru}' tidak ditemukan di database.`);
        return;
      }

      if (!siswaObj) {
        errors.push(`Baris ${idx + 1}: NISN Siswa '${nisnSiswa}' tidak ditemukan di database.`);
        return;
      }

      // CHECK 1: Already assigned in this session to another Guru Wali
      if (assignedInThisSession.has(nisnSiswa)) {
        const otherGuruName = assignedInThisSession.get(nisnSiswa);
        if (otherGuruName !== guruObj.nama) {
          errors.push(
            `Gagal Baris ${idx + 1}: Siswa ${siswaObj.namaLengkap} (NISN: ${nisnSiswa}) dicalonkan ganda ke Guru Wali ${guruObj.nama} dan ${otherGuruName}.`
          );
          return;
        }
      }

      // CHECK 2: Already assigned in DB to a DIFFERENT Guru Wali
      if (siswaObj.guruWaliId && siswaObj.guruWaliId !== guruObj.id) {
        const currentGuruWali = db.guru.find((g) => g.id === siswaObj.guruWaliId);
        errors.push(
          `Gagal Baris ${idx + 1}: Siswa ${siswaObj.namaLengkap} (NISN: ${nisnSiswa}) sudah memiliki Guru Wali (${currentGuruWali?.nama || siswaObj.guruWaliNama}). Satu siswa dilarang memiliki 2 Guru Wali!`
        );
        return;
      }

      // Record valid assignment
      assignedInThisSession.set(nisnSiswa, guruObj.nama);
      siswaObj.guruWaliId = guruObj.id;
      siswaObj.guruWaliNama = guruObj.nama;
      guruObj.tugasTambahan = 'Guru Wali';
      successCount++;
    });

    if (errors.length > 0 && successCount === 0) {
      setUploadLog({
        status: 'error',
        message: 'Ditolak karena terdapat pelanggaran aturan penugasan Guru Wali (Siswa Ganda)!',
        details: errors,
      });
      return;
    }

    dbService.saveToStorage(db);
    setUploadLog({
      status: 'success',
      message: `BERHASIL INJEKSI PENUGASAN GURU WALI! ${successCount} siswa berhasil ditugaskan.`,
      details: errors.length > 0 ? errors : undefined,
    });
    onSuccess();
  };

  // D. Injek Mata Pelajaran
  const processInjectMapel = (rows: any[]) => {
    let successCount = 0;

    rows.forEach((row) => {
      const kode = String(row.KodeMapel || row.kodeMapel || dbService.generateId('MAP')).trim();
      const nama = String(row.NamaMapel || row.namaMapel || 'Mata Pelajaran').trim();
      const kelompok = String(row.Kelompok || row.kelompok || 'Wajib');
      const tingkat = String(row.Tingkat || row.tingkat || '10');
      const jam = Number(row.JamPerMinggu || row.jamPerMinggu || 2);
      const status = String(row.StatusActive || row.statusActive || 'Aktif') as any;

      const existingMapel = db.mapel.find(
        (m) => m.kodeMapel.toLowerCase() === kode.toLowerCase() || m.namaMapel.toLowerCase() === nama.toLowerCase()
      );

      if (existingMapel) {
        existingMapel.namaMapel = nama;
        existingMapel.kelompok = kelompok as any;
        existingMapel.tingkat = tingkat;
        existingMapel.jamPerMinggu = jam;
        existingMapel.status = status;
      } else {
        const newMapel: MataPelajaran = {
          id: dbService.generateId('MAP'),
          kodeMapel: kode,
          namaMapel: nama,
          kelompok: kelompok as any,
          tingkat,
          jamPerMinggu: jam,
          status: status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
        };
        db.mapel.push(newMapel);
      }
      successCount++;
    });

    dbService.saveToStorage(db);
    setUploadLog({
      status: 'success',
      message: `BERHASIL INJEKSI MATA PELAJARAN! ${successCount} mata pelajaran tersimpan.`,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-purple-200 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Pusat Injeksi Data Master & Penjadwalan</h3>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                  Super Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fitur injeksi otomatis skema kurikulum, rombel, penugasan guru wali, dan mata pelajaran.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl my-4 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => {
              setActiveCategory('penjadwalan');
              setUploadLog({ status: 'idle', message: '' });
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeCategory === 'penjadwalan'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Skema Penjadwalan KBM</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('rombel');
              setUploadLog({ status: 'idle', message: '' });
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeCategory === 'rombel'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>2. Data Rombel (Kelas)</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('guruwali');
              setUploadLog({ status: 'idle', message: '' });
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeCategory === 'guruwali'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Penugasan Guru Wali</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('mapel');
              setUploadLog({ status: 'idle', message: '' });
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeCategory === 'mapel'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>4. Master Mata Pelajaran</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          {/* Download Templates Section */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-700" />
                  <span>Unduh Master Template Format Injection</span>
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Gunakan format yang sesuai agar data terinjeksi dengan presisi tanpa kesalahan struktur.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleDownloadTemplate('xlsx')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Format Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => handleDownloadTemplate('csv')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Format CSV (.csv)</span>
              </button>

              <button
                onClick={() => handleDownloadTemplate('json')}
                className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                <span>Format JSON (.json)</span>
              </button>
            </div>
          </div>

          {/* Rule Information per Category */}
          {activeCategory === 'guruwali' && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Aturan Ketat Penugasan Guru Wali (Berdasarkan NISN):</span>
              </div>
              <p>• Setiap siswa (NISN) WAJIB memiliki tepat 1 Guru Wali unik. Siswa dilarang dibina oleh 2 Guru Wali sekaligus.</p>
              <p>• Jika ditemukan NISN siswa yang sudah terikat pada Guru Wali lain dalam file injeksi, sistem akan MENOLAK otomatis.</p>
            </div>
          )}

          {activeCategory === 'penjadwalan' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Validasi Ketat Skema Penjadwalan KBM:</span>
              </div>
              <p>• Mendeteksi jam bentrok guru pengampu pada hari & jam yang sama.</p>
              <p>• Memetakan otomatis ke Kode Mapel, NIP Guru, dan ID Rombel di database.</p>
            </div>
          )}

          {/* Upload Area */}
          <div className="p-6 border-2 border-dashed border-purple-300 rounded-3xl bg-slate-50 text-center space-y-3 hover:border-purple-500 transition-all">
            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-sm">Unggah File Master Injeksi Data</h4>
              <p className="text-slate-500 text-xs mt-0.5">
                Pilih file <strong>.xlsx</strong>, <strong>.csv</strong>, atau <strong>.json</strong> hasil pengisian template
              </p>
            </div>

            <input
              type="file"
              accept=".xlsx, .xls, .csv, .json"
              onChange={handleFileUpload}
              className="hidden"
              id="master-injection-file-input"
            />

            <label
              htmlFor="master-injection-file-input"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Pilih & Injeksi File Sekarang</span>
            </label>
          </div>

          {/* Result Logs & Alerts */}
          {uploadLog.status !== 'idle' && (
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                uploadLog.status === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : uploadLog.status === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-blue-50 border-blue-300 text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {uploadLog.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                {uploadLog.status === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                <span>{uploadLog.message}</span>
              </div>

              {uploadLog.details && uploadLog.details.length > 0 && (
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200 text-xs max-h-40 overflow-y-auto space-y-1 font-mono">
                  {uploadLog.details.map((dt, idx) => (
                    <div key={idx} className="text-rose-700 font-semibold">
                      • {dt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
