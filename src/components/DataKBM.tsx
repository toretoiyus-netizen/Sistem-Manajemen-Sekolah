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
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { KBMSchedule, MataPelajaran, Rombel, UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';
import { exportToF4LandscapePDF } from '../utils/pdfExportUtil';
import { PusatInjeksiMasterModal } from './PusatInjeksiMasterModal';

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

  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State for Mapel Form
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState<MataPelajaran | null>(null);
  const [mapelForm, setMapelForm] = useState<Partial<MataPelajaran>>({
    kodeMapel: '',
    namaMapel: '',
    kelompok: 'Kejuruan / Peminatan',
    status: 'Aktif',
  });

  // Modal State for Rombel Form
  const [isRombelModalOpen, setIsRombelModalOpen] = useState(false);
  const [selectedRombel, setSelectedRombel] = useState<Rombel | null>(null);
  const [rombelForm, setRombelForm] = useState<Partial<Rombel>>({
    namaRombel: '',
    tingkat: '10',
    jurusan: 'MIPA',
    tahunPelajaran: '2024/2025',
    waliKelasId: db.guru[0]?.id || 'GURU-000001',
    status: 'Aktif',
  });

  // Modal State for Guru Wali Assignment (Penugasan via NISN)
  const [isGuruWaliModalOpen, setIsGuruWaliModalOpen] = useState(false);
  const [selectedGuruWaliId, setSelectedGuruWaliId] = useState<string>(
    db.guru.find((g) => g.tugasTambahan === 'Guru Wali')?.id || db.guru[0]?.id || ''
  );
  const [nisnSearchQuery, setNisnSearchQuery] = useState('');
  const [assignedStudentNisns, setAssignedStudentNisns] = useState<string[]>([]);

  const canManageKBM = dbService.checkPermission(currentUser, 'kbm.create');

  // Open Guru Wali Assignment modal
  const handleOpenGuruWaliModal = (guruId?: string) => {
    const targetGuruId = guruId || selectedGuruWaliId || db.guru[0]?.id || '';
    setSelectedGuruWaliId(targetGuruId);

    const targetGuru = db.guru.find((g) => g.id === targetGuruId);
    const assignedNisns = db.siswa
      .filter((s) => s.guruWaliId === targetGuruId || (targetGuru && s.guruWaliNama?.toLowerCase().includes(targetGuru.nama.toLowerCase())))
      .map((s) => s.nisn);

    setAssignedStudentNisns(assignedNisns);
    setNisnSearchQuery('');
    setIsGuruWaliModalOpen(true);
  };

  // Modal State for Master Injection Center
  const [isMasterInjectModalOpen, setIsMasterInjectModalOpen] = useState(false);

  // Modal State for Rombel Student Selection via NISN Search
  const [rombelSelectedNisns, setRombelSelectedNisns] = useState<string[]>([]);
  const [rombelNisnQuery, setRombelNisnQuery] = useState('');

  const handleOpenRombelModal = (rombel?: Rombel) => {
    if (rombel) {
      setSelectedRombel(rombel);
      setRombelForm({
        namaRombel: rombel.namaRombel,
        tingkat: rombel.tingkat,
        jurusan: rombel.jurusan,
        waliKelasId: rombel.waliKelasId,
        tahunPelajaran: rombel.tahunPelajaran,
        status: rombel.status,
      });
      // Get existing NISNs in this rombel
      const currentNisns = db.siswa.filter((s) => s.rombel === rombel.namaRombel || s.rombelId === rombel.id).map((s) => s.nisn);
      setRombelSelectedNisns(currentNisns);
    } else {
      setSelectedRombel(null);
      setRombelForm({
        namaRombel: '',
        tingkat: '10',
        jurusan: 'MIPA',
        waliKelasId: db.guru[0]?.id || '',
        tahunPelajaran: db.config.tahunPelajaran || '2024/2025',
        status: 'Aktif',
      });
      setRombelSelectedNisns([]);
    }
    setRombelNisnQuery('');
    setIsRombelModalOpen(true);
  };

  const handleSaveGuruWaliAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetGuru = db.guru.find((g) => g.id === selectedGuruWaliId);
    if (!targetGuru) {
      alert('Pilih Guru Wali terlebih dahulu!');
      return;
    }

    // STRICT VALIDATION FOR DOUBLE ASSIGNMENT (Requirement #2)
    const doubleAssignedStudents: string[] = [];
    assignedStudentNisns.forEach((nisn) => {
      const student = db.siswa.find((s) => s.nisn === nisn);
      if (student && student.guruWaliId && student.guruWaliId !== targetGuru.id) {
        const otherGuru = db.guru.find((g) => g.id === student.guruWaliId);
        doubleAssignedStudents.push(
          `${student.namaLengkap} (NISN: ${student.nisn}) • Guru Wali Terdaftar: ${otherGuru?.nama || student.guruWaliNama}`
        );
      }
    });

    if (doubleAssignedStudents.length > 0) {
      alert(
        `PERINGATAN SISWA GANDA DITOLAK!\n\nTerdapat ${doubleAssignedStudents.length} siswa yang sudah terikat pada Guru Wali lain:\n\n` +
          doubleAssignedStudents.join('\n') +
          `\n\nSesuai aturan kurikulum, 1 siswa hanya boleh memiliki 1 Guru Wali unik. Mohon lepaskan siswa dari Guru Wali sebelumnya terlebih dahulu!`
      );
      return;
    }

    // 1. Remove assignment for students previously assigned to this guru but not in assignedStudentNisns
    db.siswa.forEach((s) => {
      if (s.guruWaliId === targetGuru.id && !assignedStudentNisns.includes(s.nisn)) {
        s.guruWaliId = undefined;
        s.guruWaliNama = undefined;
      }
    });

    // 2. Add assignment for students in assignedStudentNisns
    assignedStudentNisns.forEach((nisn) => {
      const student = db.siswa.find((s) => s.nisn === nisn);
      if (student) {
        student.guruWaliId = targetGuru.id;
        student.guruWaliNama = targetGuru.nama;
      }
    });

    dbService.saveToStorage(db);
    alert(`Penugasan Guru Wali (${targetGuru.nama}) untuk ${assignedStudentNisns.length} siswa binaan berhasil disimpan!`);
    setIsGuruWaliModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleToggleStudentToGuruWali = (nisn: string) => {
    if (assignedStudentNisns.includes(nisn)) {
      setAssignedStudentNisns(assignedStudentNisns.filter((n) => n !== nisn));
    } else {
      setAssignedStudentNisns([...assignedStudentNisns, nisn]);
    }
  };

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
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Hapus jadwal pelajaran ini?')) {
      db.jadwalKBM = db.jadwalKBM.filter((j) => j.id !== scheduleId);
      dbService.saveToStorage(db);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleSaveMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapelForm.namaMapel || !mapelForm.kodeMapel) {
      alert('Lengkapi nama dan kode mapel!');
      return;
    }

    if (selectedMapel) {
      const idx = db.mapel.findIndex((m) => m.id === selectedMapel.id);
      if (idx !== -1) {
        db.mapel[idx] = {
          ...db.mapel[idx],
          kodeMapel: mapelForm.kodeMapel || '',
          namaMapel: mapelForm.namaMapel || '',
          kelompok: (mapelForm.kelompok as any) || 'Umum',
          status: (mapelForm.status as any) || 'Aktif',
        };
      }
    } else {
      const newId = dbService.generateId('MAP');
      db.mapel.push({
        id: newId,
        kodeMapel: mapelForm.kodeMapel || '',
        namaMapel: mapelForm.namaMapel || '',
        kelompok: (mapelForm.kelompok as any) || 'Umum',
        status: (mapelForm.status as any) || 'Aktif',
      });
    }

    dbService.saveToStorage(db);
    setIsMapelModalOpen(false);
    setSelectedMapel(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteMapel = (mapelId: string) => {
    if (confirm('Hapus mata pelajaran ini?')) {
      db.mapel = db.mapel.filter((m) => m.id !== mapelId);
      dbService.saveToStorage(db);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleSaveRombel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rombelForm.namaRombel) {
      alert('Lengkapi nama rombel!');
      return;
    }

    const waliGuru = db.guru.find((g) => g.id === rombelForm.waliKelasId);
    let targetRombelId = selectedRombel?.id;

    if (selectedRombel) {
      const idx = db.rombel.findIndex((r) => r.id === selectedRombel.id);
      if (idx !== -1) {
        db.rombel[idx] = {
          ...db.rombel[idx],
          namaRombel: rombelForm.namaRombel || '',
          tingkat: rombelForm.tingkat || '10',
          jurusan: rombelForm.jurusan || 'MIPA',
          tahunPelajaran: rombelForm.tahunPelajaran || '2024/2025',
          waliKelasId: rombelForm.waliKelasId || 'GURU-000001',
          waliKelasNama: waliGuru?.nama || 'Wali Kelas',
          status: (rombelForm.status as any) || 'Aktif',
        };
      }
    } else {
      const newId = dbService.generateId('ROM');
      targetRombelId = newId;
      db.rombel.push({
        id: newId,
        namaRombel: rombelForm.namaRombel || '',
        tingkat: rombelForm.tingkat || '10',
        jurusan: rombelForm.jurusan || 'MIPA',
        tahunPelajaran: rombelForm.tahunPelajaran || '2024/2025',
        waliKelasId: rombelForm.waliKelasId || 'GURU-000001',
        waliKelasNama: waliGuru?.nama || 'Wali Kelas',
        status: (rombelForm.status as any) || 'Aktif',
        jumlahSiswa: rombelSelectedNisns.length,
      });
    }

    // Assign students to this rombel by NISN
    if (rombelSelectedNisns.length > 0) {
      rombelSelectedNisns.forEach((nisn) => {
        const student = db.siswa.find((s) => s.nisn === nisn);
        if (student) {
          student.rombel = rombelForm.namaRombel || student.rombel;
          if (targetRombelId) student.rombelId = targetRombelId;
          if (rombelForm.waliKelasId) student.waliKelasId = rombelForm.waliKelasId;
        }
      });
    }

    // Update student count in rombel
    const rObj = db.rombel.find((r) => r.namaRombel === rombelForm.namaRombel || r.id === targetRombelId);
    if (rObj) {
      rObj.jumlahSiswa = db.siswa.filter((s) => s.rombel === rObj.namaRombel || s.rombelId === rObj.id).length;
    }

    dbService.saveToStorage(db);
    alert(`Rombel ${rombelForm.namaRombel} berhasil disimpan dengan ${rombelSelectedNisns.length} siswa terdaftar!`);
    setIsRombelModalOpen(false);
    setSelectedRombel(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteRombel = (rombelId: string) => {
    if (confirm('Hapus rombel ini?')) {
      db.rombel = db.rombel.filter((r) => r.id !== rombelId);
      dbService.saveToStorage(db);
      setRefreshKey((prev) => prev + 1);
    }
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

  // State & Handlers for Injek Skema Penjadwalan (Super Admin Only)
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  const [injectFileSuccess, setInjectFileSuccess] = useState<string | null>(null);

  const handleDownloadScheduleTemplate = () => {
    const templateData = [
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
      {
        Hari: 'Selasa',
        JamKe: 1,
        JamMulai: '07:30',
        JamSelesai: '08:50',
        NamaRombel: 'XI IPS 2',
        KodeMapel: 'MAP-000003',
        NamaMapel: 'Bahasa Indonesia',
        NIP_Guru: '199001012015021001',
        NamaGuru: 'Ahmad Fauzi, S.Pd.',
        RuangKelas: 'R. 202 (Gedung Siliwangi)',
        Keterangan: 'Peminatan IPS',
      },
      {
        Hari: 'Rabu',
        JamKe: 1,
        JamMulai: '07:30',
        JamSelesai: '08:50',
        NamaRombel: 'XII BAHASA',
        KodeMapel: 'MAP-000004',
        NamaMapel: 'Bahasa Inggris Lanjutan',
        NIP_Guru: '197804202005012003',
        NamaGuru: 'Dra. Ratna Dewi',
        RuangKelas: 'Lab Bahasa',
        Keterangan: 'Muatan Lokal',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Format_Injek_Penjadwalan');
    XLSX.writeFile(workbook, `Template_Injek_Skema_Penjadwalan_KBM_Disdik.xlsx`);
  };

  const handleFileUploadInject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          alert('File kosong atau format sheet tidak valid!');
          return;
        }

        let injectedCount = 0;
        rows.forEach((row) => {
          const hari = row.Hari || row.hari || 'Senin';
          const jamKe = Number(row.JamKe || row.jamKe || 1);
          const jamMulai = String(row.JamMulai || row.jamMulai || '07:30');
          const jamSelesai = String(row.JamSelesai || row.jamSelesai || '08:50');
          const namaRombel = row.NamaRombel || row.namaRombel || row.Rombel || 'X MIPA 1';
          const kodeMapel = row.KodeMapel || row.kodeMapel || row.Mapel;
          const namaMapel = row.NamaMapel || row.namaMapel;
          const nipGuru = row.NIP_Guru || row.nipGuru || row.NIP;
          const namaGuru = row.NamaGuru || row.namaGuru || row.Guru;
          const ruang = row.RuangKelas || row.ruang || 'R. 101';
          const ket = row.Keterangan || row.keterangan || 'Hasil Injek Skema';

          // Resolve Rombel ID
          let rombelObj = db.rombel.find((r) => r.namaRombel.toLowerCase() === String(namaRombel).toLowerCase());
          if (!rombelObj) rombelObj = db.rombel[0];

          // Resolve Mapel ID
          let mapelObj = db.mapel.find((m) =>
            m.id === kodeMapel ||
            m.kodeMapel.toLowerCase() === String(kodeMapel).toLowerCase() ||
            (namaMapel && m.namaMapel.toLowerCase().includes(String(namaMapel).toLowerCase()))
          );
          if (!mapelObj) mapelObj = db.mapel[0];

          // Resolve Guru ID
          let guruObj = db.guru.find((g) =>
            g.nip === nipGuru ||
            (namaGuru && g.nama.toLowerCase().includes(String(namaGuru).toLowerCase()))
          );
          if (!guruObj) guruObj = db.guru[0];

          const newSchedule: KBMSchedule = {
            id: dbService.generateId('SCH'),
            hari: hari,
            jamKe: jamKe,
            jamMulai: jamMulai,
            jamSelesai: jamSelesai,
            rombelId: rombelObj ? rombelObj.id : 'ROM-000001',
            mapelId: mapelObj ? mapelObj.id : 'MAP-000001',
            guruId: guruObj ? guruObj.id : 'GURU-000001',
            ruang: ruang,
            keterangan: ket,
          };

          db.jadwalKBM.push(newSchedule);
          injectedCount++;
        });

        dbService.saveToStorage(db);
        setInjectFileSuccess(`Berhasil menginjeksi ${injectedCount} skema jadwal KBM baru ke database!`);
        alert(`SUKSES INJEK! ${injectedCount} jadwal KBM berhasil dimasukkan ke sistem.`);
        setIsInjectModalOpen(false);
      } catch (err) {
        alert('Gagal memproses file skema penjadwalan. Pastikan file berformat .xlsx atau .csv standar!');
      }
    };
    reader.readAsBinaryString(file);
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
            <span>Jadwal Pelajaran</span>
          </button>

          {!isStudent && (
            <>
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
            </>
          )}
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

              {role === 'SUPER ADMIN' && (
                <>
                  <button
                    onClick={() => setIsMasterInjectModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    title="Pusat Injeksi Data Master (Penjadwalan, Rombel, Guru Wali, Mapel)"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Pusat Injeksi Data Master</span>
                  </button>

                  <button
                    onClick={handleDownloadScheduleTemplate}
                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Unduh Format Master Template Injek Penjadwalan KBM"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" />
                    <span>Format Injek (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => setIsInjectModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                    title="Injek Skema Penjadwalan Otomatis ke Database (Super Admin Only)"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Injek Skema Jadwal</span>
                  </button>
                </>
              )}

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

            {canManageKBM && (
              <button
                onClick={() => handleOpenGuruWaliModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Users className="w-4 h-4" />
                <span>Atur Penugasan Guru Wali (Pilih via NISN)</span>
              </button>
            )}
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

      {/* MODAL TAMBAH MAPEL */}
      {isMapelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Tambah Mata Pelajaran Baru</span>
              </h3>
              <button
                onClick={() => setIsMapelModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMapel} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Mapel *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MP-MAT-XI, MP-BIN-X"
                  value={mapelForm.kodeMapel || ''}
                  onChange={(e) => setMapelForm({ ...mapelForm, kodeMapel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika Peminatan"
                  value={mapelForm.namaMapel || ''}
                  onChange={(e) => setMapelForm({ ...mapelForm, namaMapel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelompok Mata Pelajaran *</label>
                <select
                  value={mapelForm.kelompok || 'Kejuruan / Peminatan'}
                  onChange={(e) => setMapelForm({ ...mapelForm, kelompok: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Umum">Umum / Wajib A</option>
                  <option value="Kejuruan / Peminatan">Kejuruan / Peminatan</option>
                  <option value="Muatan Lokal">Muatan Lokal (Mulok)</option>
                  <option value="Projek IPAS">Projek IPAS / P5</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapelModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ROMBEL */}
      {isRombelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Tambah Rombongan Belajar (Rombel) Baru</span>
              </h3>
              <button
                onClick={() => setIsRombelModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRombel} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Rombel / Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X MIPA 3, XI IPS 2, XII TKR 1"
                  value={rombelForm.namaRombel || ''}
                  onChange={(e) => setRombelForm({ ...rombelForm, namaRombel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas *</label>
                  <select
                    value={rombelForm.tingkat || '10'}
                    onChange={(e) => setRombelForm({ ...rombelForm, tingkat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="10">Kelas 10 (Fase E)</option>
                    <option value="11">Kelas 11 (Fase F)</option>
                    <option value="12">Kelas 12 (Fase F)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jurusan / Program *</label>
                  <select
                    value={rombelForm.jurusan || 'MIPA'}
                    onChange={(e) => setRombelForm({ ...rombelForm, jurusan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="MIPA">MIPA</option>
                    <option value="IPS">IPS</option>
                    <option value="Bahasa">Bahasa</option>
                    <option value="Kejuruan">Kejuruan (Keahlian)</option>
                    <option value="Umum">Umum / Merdeka</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Wali Kelas *</label>
                <select
                  value={rombelForm.waliKelasId || ''}
                  onChange={(e) => setRombelForm({ ...rombelForm, waliKelasId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  {db.guru.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama} ({g.nip ? `NIP: ${g.nip}` : 'Non-NIP'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran *</label>
                <input
                  type="text"
                  value={rombelForm.tahunPelajaran || db.config.tahunPelajaran || '2024/2025'}
                  onChange={(e) => setRombelForm({ ...rombelForm, tahunPelajaran: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRombelModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Simpan Rombel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENUGASAN GURU WALI VIA NISN */}
      {isGuruWaliModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Atur Penugasan Guru Wali & Binaan Siswa via NISN</span>
              </h3>
              <button
                onClick={() => setIsGuruWaliModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGuruWaliAssignment} className="mt-4 space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              {/* Select Guru Wali */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Guru Wali / Pembina *</label>
                <select
                  value={selectedGuruWaliId}
                  onChange={(e) => handleOpenGuruWaliModal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  {db.guru.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama} ({g.tugasTambahan}) • NIP: {g.nip || '-'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search by NISN or Nama */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cari Siswa Berdasarkan NISN atau Nama</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik NISN (e.g. 0061234567) atau Nama Siswa..."
                    value={nisnSearchQuery}
                    onChange={(e) => setNisnSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Summary Counter */}
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-blue-900 font-medium">
                  Jumlah Siswa Terpilih Binaan: <strong>{assignedStudentNisns.length} Siswa</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allNisns = db.siswa.map((s) => s.nisn);
                      setAssignedStudentNisns(allNisns);
                    }}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignedStudentNisns([])}
                    className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-300"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Student Checklist Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 text-center w-10">Pilih</th>
                      <th className="p-2.5">NISN</th>
                      <th className="p-2.5">Nama Lengkap Siswa</th>
                      <th className="p-2.5">Rombel</th>
                      <th className="p-2.5">Guru Wali Saat Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {db.siswa
                      .filter((s) => {
                        if (!nisnSearchQuery) return true;
                        const q = nisnSearchQuery.toLowerCase();
                        return s.nisn.includes(q) || s.namaLengkap.toLowerCase().includes(q) || s.rombel.toLowerCase().includes(q);
                      })
                      .map((siswa) => {
                        const isChecked = assignedStudentNisns.includes(siswa.nisn);
                        return (
                          <tr
                            key={siswa.id}
                            onClick={() => handleToggleStudentToGuruWali(siswa.nisn)}
                            className={`cursor-pointer transition-colors ${isChecked ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                          >
                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStudentToGuruWali(siswa.nisn)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-2.5 font-mono font-bold text-blue-900">{siswa.nisn}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{siswa.namaLengkap}</td>
                            <td className="p-2.5 font-mono text-slate-600">{siswa.rombel}</td>
                            <td className="p-2.5 text-slate-500 italic">
                              {siswa.guruWaliNama || '-'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGuruWaliModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Simpan Penugasan Guru Wali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: INJEK SKEMA PENJADWALAN KBM (SUPER ADMIN ONLY) */}
      {isInjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Injek Skema Penjadwalan KBM</h3>
                  <p className="text-xs text-slate-500">Khusus Otoritas Super Admin IT & Kurikulum</p>
                </div>
              </div>
              <button
                onClick={() => setIsInjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Petunjuk Penting Injek Skema:</span>
                </div>
                <p>
                  1. Unduh master template resmi terlebih dahulu via tombol <strong>"Format Injek (.xlsx)"</strong>.
                </p>
                <p>
                  2. Kolom wajib: <code>Hari</code>, <code>JamKe</code>, <code>JamMulai</code>, <code>JamSelesai</code>, <code>NamaRombel</code>, <code>KodeMapel</code>, <code>NIP_Guru</code>, <code>RuangKelas</code>.
                </p>
                <p>
                  3. Sistem akan memetakan otomatis ke ID Rombel, Mapel, dan Guru yang ada di database.
                </p>
              </div>

              {injectFileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{injectFileSuccess}</span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <label className="block font-bold text-slate-800">
                  Pilih File Master Excel (.xlsx / .csv):
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUploadInject}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={handleDownloadScheduleTemplate}
                className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template Format</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInjectModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUSAT INJEKSI DATA MASTER MODAL */}
      <PusatInjeksiMasterModal
        isOpen={isMasterInjectModalOpen}
        onClose={() => setIsMasterInjectModalOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
};
