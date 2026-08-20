import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  KeyRound,
  Download,
  Upload,
  FolderTree,
  FileText,
  CheckCircle,
  X,
  ShieldAlert,
  GraduationCap,
  Award,
  BookOpen,
  AlertTriangle,
  FileCheck2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Siswa, UserAccount, Guru, PortofolioSiswaRecord } from '../types';
import { dbService } from '../services/mockDatabase';
import { useToast } from './Toast';
import { exportToF4LandscapePDF } from '../utils/pdfExportUtil';

interface DataMuridProps {
  currentUser: UserAccount;
  onResetStudentPassword: (siswaId: string) => void;
}

export const DataMurid: React.FC<DataMuridProps> = ({
  currentUser,
  onResetStudentPassword,
}) => {
  const db = dbService.getState();
  const { success } = useToast();
  const role = currentUser.role;
  const currentTeacher = db.guru.find((g) => g.id === currentUser.referenceId);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('Semua');
  const [filterRombel, setFilterRombel] = useState<string>('Semua');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [detailTab, setDetailTab] = useState<'biodata' | 'portofolio_cat'>('biodata');

  // Form State
  const [formData, setFormData] = useState<Partial<Siswa>>({
    nis: '',
    nisn: '',
    nik: '',
    namaLengkap: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Bandung',
    tanggalLahir: '2008-01-01',
    alamat: '',
    nomorHp: '',
    email: '',
    namaOrangTua: '',
    namaIbu: '',
    nomorHpOrangTua: '',
    kelas: '10',
    rombel: 'X MIPA 1',
    guruWaliId: 'GURU-000004',
    waliKelasId: 'GURU-000003',
    status: 'Aktif',
  });

  // Permissions check
  const canCreate = dbService.checkPermission(currentUser, 'siswa.create');
  const canEdit = dbService.checkPermission(currentUser, 'siswa.edit');
  const canDelete = dbService.checkPermission(currentUser, 'siswa.delete');
  const canResetPassword = dbService.checkPermission(currentUser, 'akun.reset_password');

  // Apply Role-Based Filtering
  const baseStudents = db.siswa.filter((s) => {
    if (role === 'WALI KELAS' && currentTeacher) {
      return s.waliKelasId === currentTeacher.id;
    }
    if (role === 'GURU WALI' && currentTeacher) {
      return s.guruWaliId === currentTeacher.id;
    }
    return true;
  });

  const filteredStudents = baseStudents.filter((s) => {
    const matchSearch =
      s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm) ||
      s.rombel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = filterKelas === 'Semua' || s.kelas === filterKelas;
    const matchRombel = filterRombel === 'Semua' || s.rombel === filterRombel;
    return matchSearch && matchKelas && matchRombel;
  });

  const handleOpenCreate = () => {
    setSelectedSiswa(null);
    setFormData({
      nis: `2425${Math.floor(1000 + Math.random() * 9000)}`,
      nisn: `0078${Math.floor(100000 + Math.random() * 900000)}`,
      nik: `3273${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      namaLengkap: '',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Bandung',
      tanggalLahir: '2008-01-01',
      alamat: '',
      nomorHp: '',
      email: '',
      namaOrangTua: '',
      namaIbu: '',
      nomorHpOrangTua: '',
      kelas: '10',
      rombel: 'X MIPA 1',
      guruWaliId: db.guru[3]?.id || 'GURU-000004',
      waliKelasId: db.guru[2]?.id || 'GURU-000003',
      status: 'Aktif',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setFormData(siswa);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (siswa: Siswa, initialTab: 'biodata' | 'portofolio_cat' = 'biodata') => {
    setSelectedSiswa(siswa);
    setDetailTab(initialTab);
    setIsDetailModalOpen(true);
  };

  const handleOpenDocs = (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setIsDocModalOpen(true);
  };

  const handleDelete = (siswaId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      const updated = db.siswa.filter((s) => s.id !== siswaId);
      db.siswa = updated;
      dbService.saveToStorage(db);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap || !formData.nisn) {
      alert('Nama lengkap dan NISN wajib diisi!');
      return;
    }

    if (selectedSiswa) {
      const updated = db.siswa.map((s) =>
        s.id === selectedSiswa.id ? ({ ...s, ...formData } as Siswa) : s
      );
      db.siswa = updated;
    } else {
      const newSiswa: Siswa = {
        ...(formData as Siswa),
        id: dbService.generateId('SIS'),
        foto:
          formData.jenisKelamin === 'Perempuan'
            ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
      db.siswa.push(newSiswa);

      const newUserAccount: UserAccount = {
        id: dbService.generateId('USR'),
        username: newSiswa.nisn,
        nama: newSiswa.namaLengkap,
        email: newSiswa.email || `${newSiswa.nisn}@siswa.sman1bdg.sch.id`,
        nomorHp: newSiswa.nomorHp || '08123456789',
        role: 'SISWA',
        referenceId: newSiswa.id,
        foto: newSiswa.foto,
        status: 'Aktif',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUserAccount);
    }

    dbService.saveToStorage(db);
    setIsFormModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredStudents.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      NISN: s.nisn,
      NIK: s.nik,
      'Nama Lengkap': s.namaLengkap,
      'Jenis Kelamin': s.jenisKelamin,
      'Tempat Lahir': s.tempatLahir,
      'Tanggal Lahir': s.tanggalLahir,
      Kelas: s.kelas,
      Rombel: s.rombel,
      'Nama Orang Tua': s.namaOrangTua,
      'Nama Ibu': s.namaIbu,
      'No HP Ortu': s.nomorHpOrangTua,
      Status: s.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Murid_Jabar');
    XLSX.writeFile(workbook, `Data_Murid_${filterRombel}_2024.xlsx`);
    success('Data siswa berhasil diekspor ke format Excel (.xlsx)', 'Ekspor Berhasil');
  };

  // Export to Precision Landscape F4 PDF
  const handleExportPDF = () => {
    const head = [
      ['No', 'NISN', 'NIS', 'NIK', 'Nama Lengkap Siswa', 'JK', 'Tempat & Tgl Lahir', 'Kelas / Rombel', 'Nama Orang Tua / Wali', 'No. HP', 'Status']
    ];

    const body = filteredStudents.map((s, idx) => [
      idx + 1,
      s.nisn,
      s.nis,
      s.nik,
      s.namaLengkap,
      s.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
      `${s.tempatLahir}, ${s.tanggalLahir}`,
      s.rombel,
      s.namaOrangTua || s.namaIbu || '-',
      s.nomorHpOrangTua || s.nomorHp || '-',
      s.status,
    ]);

    exportToF4LandscapePDF({
      title: 'Buku Induk Data Siswa Terpadu',
      subtitle: `Laporan Data Induk Murid • Tahun Ajaran 2024/2025 • Filter Rombel: ${filterRombel}`,
      fileName: `Buku_Induk_Siswa_${filterRombel}_F4_Landscape.pdf`,
      metaInfo: [
        { label: 'Filter Kelas', value: filterKelas },
        { label: 'Rombel', value: filterRombel },
        { label: 'Total Siswa', value: `${filteredStudents.length} Orang` },
      ],
      head: head,
      body: body,
      signatureRole: role === 'WALI KELAS' ? 'Wali Kelas' : 'Kepala Sekolah / Admin Data',
      signatureName: currentTeacher ? currentTeacher.nama : 'Drs. H. Hendra Sukmana, M.Pd.',
      signatureNip: currentTeacher ? currentTeacher.nip : '197508122002121004',
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 32, halign: 'center' },
        4: { cellWidth: 50 },
        5: { cellWidth: 10, halign: 'center' },
        6: { cellWidth: 40 },
        7: { cellWidth: 26, halign: 'center' },
        8: { cellWidth: 40 },
        9: { cellWidth: 28, halign: 'center' },
        10: { cellWidth: 18, halign: 'center' },
      },
    });

    success('Buku Induk Siswa berhasil dicetak ke format PDF Landscape F4 Presisi!', 'Cetak PDF Selesai');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredStudents.map((s) => ({
      ID: s.id,
      NISN: s.nisn,
      NIK: s.nik,
      NamaLengkap: s.namaLengkap,
      JenisKelamin: s.jenisKelamin,
      TempatLahir: s.tempatLahir,
      TanggalLahir: s.tanggalLahir,
      Kelas: s.kelas,
      Rombel: s.rombel,
      NamaOrangTua: s.namaOrangTua,
      NamaIbu: s.namaIbu,
      NoHpOrangTua: s.nomorHpOrangTua,
      Status: s.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Backup_Data_Siswa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Backup data siswa berhasil disimpan ke file CSV (.csv)', 'Backup Lokal Selesai');
  };

  // Export to JSON
  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredStudents, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `Backup_Data_Siswa_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Backup data siswa berhasil diunduh dalam format JSON (.json)', 'Backup JSON Tersimpan');
  };

  // Check Quota for Guru Wali when adding/editing in form
  const selectedGuruWaliQuota = formData.guruWaliId
    ? dbService.getGuruWaliQuota(formData.guruWaliId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>
                {role === 'WALI KELAS'
                  ? 'Data Siswa Rombel (Wali Kelas)'
                  : role === 'GURU WALI'
                  ? 'Data Siswa Binaan (Guru Wali)'
                  : 'Buku Induk Data Murid'}
              </span>
            </h1>
            {(role === 'WALI KELAS' || role === 'GURU WALI') && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                Hak Akses Terbatas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan data induk siswa, NISN, rombel, pembinaan Guru Wali (standar 20 siswa), serta Rekam Jejak Portofolio Asesmen CAT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Cetak PDF Resmi Format Landscape F4 (Folio) Presisi"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Cetak PDF (F4 Landscape)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Ekspor ke spreadsheet Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Backup lokal ke format CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Backup lokal struktur database lengkap JSON"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>JSON</span>
          </button>

          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="bg-[#1e293b] hover:bg-black text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ml-1"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Notice for Guru Wali: 20 Student Limit Policy */}
      {role === 'GURU WALI' && currentTeacher && (() => {
        const gwQuota = dbService.getGuruWaliQuota(currentTeacher.id);
        return (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${gwQuota.badgeColor}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Informasi Kuota Pembinaan Guru Wali (Standar Maksimal: 20 Siswa)</p>
              <p className="leading-relaxed">{gwQuota.message}</p>
            </div>
          </div>
        );
      })()}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, NISN, atau rombel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Tingkat Kelas</option>
            <option value="10">Kelas 10</option>
            <option value="11">Kelas 11</option>
            <option value="12">Kelas 12</option>
          </select>
        </div>

        <div>
          <select
            value={filterRombel}
            onChange={(e) => setFilterRombel(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Rombel</option>
            <option value="X MIPA 1">X MIPA 1</option>
            <option value="X MIPA 2">X MIPA 2</option>
            <option value="XI MIPA 1">XI MIPA 1</option>
          </select>
        </div>
      </div>

      {/* Siswa Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Foto</th>
                <th className="p-3.5">Nama Lengkap</th>
                <th className="p-3.5">NISN / NIS</th>
                <th className="p-3.5">Kelas & Rombel</th>
                <th className="p-3.5">Wali Kelas</th>
                <th className="p-3.5">Guru Wali</th>
                <th className="p-3.5 text-center">Portofolio CAT</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((siswa) => {
                const wali = db.guru.find((g) => g.id === siswa.waliKelasId);
                const guruWali = db.guru.find((g) => g.id === siswa.guruWaliId);
                const portfolios = (db.portofolioSiswaList || []).filter(
                  (p) => p.siswaId === siswa.id || p.nisn === siswa.nisn
                );

                return (
                  <tr key={siswa.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <img
                        src={siswa.foto}
                        alt={siswa.namaLengkap}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-300 shadow-xs"
                      />
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{siswa.namaLengkap}</div>
                      <div className="text-[11px] text-slate-500">
                        {siswa.jenisKelamin} • {siswa.tempatLahir}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">
                      <div>NISN: {siswa.nisn}</div>
                      <div className="text-slate-400">NIS: {siswa.nis}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">{siswa.rombel}</span>
                      <span className="block text-[10px] text-slate-400">Tingkat {siswa.kelas}</span>
                    </td>
                    <td className="p-3.5 text-slate-700">{wali?.nama || '-'}</td>
                    <td className="p-3.5">
                      <div className="font-medium text-emerald-800">{guruWali?.nama || '-'}</div>
                      <div className="text-[10px] text-slate-400">Binaan Karakter</div>
                    </td>
                    <td className="p-3.5 text-center">
                      {portfolios.length > 0 ? (
                        <button
                          onClick={() => handleOpenDetail(siswa, 'portofolio_cat')}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Award className="w-3 h-3 text-emerald-600" />
                          <span>{portfolios.length} Ujian Rekam</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Belum Ada CAT</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(siswa, 'biodata')}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
                          title="Lihat Biodata & Portofolio"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(siswa)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canResetPassword && (
                          <button
                            onClick={() => onResetStudentPassword(siswa.id)}
                            className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 hover:text-amber-700 cursor-pointer"
                            title="Reset Password Akun Siswa"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(siswa.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FORM MODAL WITH GURU WALI QUOTA 20 LIMIT VALIDATION */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {selectedSiswa ? 'Edit Biodata Siswa' : 'Tambah Siswa Baru ke Buku Induk'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaLengkap}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    placeholder="Nama lengkap sesuai akta"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN (10 Digit) *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="0078129301"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS Sekolah</label>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="24251001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rombel & Kelas</label>
                  <select
                    value={formData.rombel}
                    onChange={(e) => {
                      const rombel = e.target.value;
                      const kelas = rombel.startsWith('X ') ? '10' : rombel.startsWith('XI ') ? '11' : '12';
                      setFormData({ ...formData, rombel, kelas });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="X MIPA 1">X MIPA 1</option>
                    <option value="X MIPA 2">X MIPA 2</option>
                    <option value="XI MIPA 1">XI MIPA 1</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wali Kelas</label>
                  <select
                    value={formData.waliKelasId}
                    onChange={(e) => setFormData({ ...formData, waliKelasId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {db.guru.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.tugasTambahan})
                      </option>
                    ))}
                  </select>
                </div>

                {/* GURU WALI SELECTION WITH NOTIFICATION ON QUOTA */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Guru Wali Pendamping (Batas Kuota Standar: 20 Siswa)
                  </label>
                  <select
                    value={formData.guruWaliId}
                    onChange={(e) => setFormData({ ...formData, guruWaliId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {db.guru.map((g) => {
                      const q = dbService.getGuruWaliQuota(g.id);
                      return (
                        <option key={g.id} value={g.id}>
                          {g.nama} — Binaan: {q.count}/20 Siswa ({q.status})
                        </option>
                      );
                    })}
                  </select>

                  {/* Dynamic Quota Notice for Selected Guru Wali */}
                  {selectedGuruWaliQuota && (
                    <div className={`mt-2 p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${selectedGuruWaliQuota.badgeColor}`}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <strong>{selectedGuruWaliQuota.status === 'Ideal' ? 'Kuota Ideal' : selectedGuruWaliQuota.status === 'Kurang' ? 'Pemberitahuan Kuota Kurang' : 'Pemberitahuan Kuota Melebihi'}: </strong>
                        <span>{selectedGuruWaliQuota.message}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Ayah</label>
                  <input
                    type="text"
                    value={formData.namaOrangTua || ''}
                    onChange={(e) => setFormData({ ...formData, namaOrangTua: e.target.value })}
                    placeholder="Nama lengkap ayah"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No WhatsApp Orang Tua</label>
                  <input
                    type="text"
                    value={formData.nomorHpOrangTua || ''}
                    onChange={(e) => setFormData({ ...formData, nomorHpOrangTua: e.target.value })}
                    placeholder="08129876..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1e293b] hover:bg-black text-white font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAIL MODAL WITH REKAM JEJAK PORTOFOLIO CAT SISWA */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedSiswa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={selectedSiswa.foto}
                  alt={selectedSiswa.namaLengkap}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedSiswa.namaLengkap}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    NISN: {selectedSiswa.nisn} • {selectedSiswa.rombel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs within Modal */}
            <div className="flex items-center gap-2 mt-4 border-b border-slate-100 pb-2">
              <button
                onClick={() => setDetailTab('biodata')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  detailTab === 'biodata'
                    ? 'bg-[#1e293b] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Biodata Induk
              </button>
              <button
                onClick={() => setDetailTab('portofolio_cat')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  detailTab === 'portofolio_cat'
                    ? 'bg-[#1e293b] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rekam Jejak Portofolio CAT</span>
              </button>
            </div>

            {/* TAB CONTENT 1: BIODATA */}
            {detailTab === 'biodata' && (
              <div className="mt-4 space-y-2 divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Tempat, Tanggal Lahir:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSiswa.tempatLahir}, {selectedSiswa.tanggalLahir}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Nama Orang Tua:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSiswa.namaOrangTua} / {selectedSiswa.namaIbu}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Guru Wali Pendamping:</span>
                  <span className="font-bold text-emerald-800">
                    {db.guru.find((g) => g.id === selectedSiswa.guruWaliId)?.nama || '-'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Alamat Domisili:</span>
                  <span className="text-slate-800 text-right max-w-[280px]">
                    {selectedSiswa.alamat}
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: REKAM JEJAK PORTOFOLIO CAT */}
            {detailTab === 'portofolio_cat' && (() => {
              const studentPortfolios = (db.portofolioSiswaList || []).filter(
                (p) => p.siswaId === selectedSiswa.id || p.nisn === selectedSiswa.nisn
              );

              return (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Hasil Asesmen Berbasis Komputer (CAT)</span>
                    <span className="text-[11px] text-slate-400">
                      Total: {studentPortfolios.length} Evaluasi Tercatat
                    </span>
                  </div>

                  {studentPortfolios.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Siswa belum mengikuti ujian atau asesmen CAT.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {studentPortfolios.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {item.mapelNama}
                              </span>
                              <h5 className="font-bold text-slate-900 mt-1">{item.namaUjian}</h5>
                              <span className="text-[10px] text-slate-400">Tgl: {item.tanggalPelaksanaan}</span>
                            </div>

                            <div className="text-right">
                              <span className={`text-xl font-extrabold px-3 py-1 rounded-2xl inline-block ${
                                item.nilai >= item.kkm
                                  ? 'text-emerald-700 bg-emerald-100/70 border border-emerald-300'
                                  : 'text-rose-700 bg-rose-100/70 border border-rose-300'
                              }`}>
                                {item.nilai}
                              </span>
                              <span className="block text-[9px] text-slate-400 mt-0.5">KKM: {item.kkm}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-3">
                              <span>Benar: <strong className="text-emerald-700">{item.jumlahBenar}</strong></span>
                              <span>Salah: <strong className="text-rose-600">{item.jumlahSalah}</strong></span>
                              <span>Status: <strong className={item.statusKelulusan.includes('Tuntas') ? 'text-emerald-800' : 'text-rose-700'}>{item.statusKelulusan}</strong></span>
                            </div>
                            <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {item.kategoriCapaian}
                            </span>
                          </div>

                          {item.catatanEvaluasi && (
                            <p className="text-[11px] text-slate-600 italic bg-white/60 p-2 rounded-xl border border-slate-200/50">
                              💬 Catatan Guru: "{item.catatanEvaluasi}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenDocs(selectedSiswa);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <FolderTree className="w-4 h-4" />
                <span>Lihat Berkas Google Drive</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRIVE DOKUMEN MODAL */}
      {/* ========================================================================= */}
      {isDocModalOpen && selectedSiswa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Berkas Google Drive Siswa</h3>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-800">{selectedSiswa.namaLengkap}</div>
                <div className="text-slate-500 font-mono text-[11px]">NISN: {selectedSiswa.nisn}</div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedSiswa.dokumen && selectedSiswa.dokumen.length > 0 ? (
                  selectedSiswa.dokumen.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="font-bold text-xs text-slate-800">{doc.namaFile}</div>
                          <div className="text-[10px] text-slate-400">
                            {doc.jenis} • {doc.tanggalUpload}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {doc.driveFileId}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Belum ada dokumen yang diupload ke Google Drive untuk siswa ini.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  const newDoc = {
                    id: `DOC-${Date.now()}`,
                    namaFile: `Ijazah_SMP_${selectedSiswa.namaLengkap.replace(/\s+/g, '_')}.pdf`,
                    jenis: 'Ijazah',
                    driveFileId: `1DRV_${Math.random().toString(36).substring(7).toUpperCase()}`,
                    url: '#',
                    tanggalUpload: new Date().toISOString().split('T')[0],
                  };
                  selectedSiswa.dokumen = [...(selectedSiswa.dokumen || []), newDoc];
                  dbService.saveToStorage(db);
                  alert('Dokumen berhasil disinkronisasi ke Google Drive!');
                  setIsDocModalOpen(false);
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Dokumen Baru</span>
              </button>

              <button
                onClick={() => setIsDocModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
