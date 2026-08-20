import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
  Shield,
  Activity,
  History,
  FileText,
  Download,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { RoleType, UserAccount, UserRole } from '../types';
import { dbService, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../services/mockDatabase';
import { exportToF4LandscapePDF } from '../utils/pdfExportUtil';
import { useToast } from './Toast';

interface ManajemenAkunProps {
  currentUser: UserAccount;
}

export const ManajemenAkun: React.FC<ManajemenAkunProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const { success, warning, info } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('Semua');

  // Role Matrix Interactive State
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(() => {
    return db.rolePermissions || { ...DEFAULT_ROLE_PERMISSIONS };
  });
  const [permCategoryFilter, setPermCategoryFilter] = useState<string>('Semua');
  const [permSearchTerm, setPermSearchTerm] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [resetSuccessInfo, setResetSuccessInfo] = useState<{ username: string; tempPass: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    username: '',
    nama: '',
    role: 'GURU MAPEL',
    email: '',
    nomorHp: '',
    status: 'Aktif',
    mustChangePassword: true,
  });

  const canManageUsers = dbService.checkPermission(currentUser, 'akun.create');
  const canViewRoles = currentUser.role === 'SUPER ADMIN' || dbService.checkPermission(currentUser, 'role.view');
  const canViewAudit = currentUser.role === 'SUPER ADMIN' || dbService.checkPermission(currentUser, 'audit.view');

  // Find linked teacher if logged in as Wali Kelas or Guru Wali
  const currentTeacher = db.guru.find(
    (g) =>
      g.id === currentUser.referenceId ||
      g.nip === currentUser.username ||
      g.nama.toLowerCase() === currentUser.nama.toLowerCase()
  );
  const myWaliRombel = db.rombel.find((r) => r.waliKelasId === currentTeacher?.id)?.namaRombel || 'X MIPA 1';
  const myStudentIds = db.siswa
    .filter((s) => s.waliKelasId === currentTeacher?.id || s.rombel === myWaliRombel)
    .map((s) => s.id);
  const myStudentNisns = db.siswa
    .filter((s) => s.waliKelasId === currentTeacher?.id || s.rombel === myWaliRombel)
    .map((s) => s.nisn);

  const myBinaanIds = db.siswa
    .filter((s) => s.guruWaliId === currentTeacher?.id)
    .map((s) => s.id);
  const myBinaanNisns = db.siswa
    .filter((s) => s.guruWaliId === currentTeacher?.id)
    .map((s) => s.nisn);

  // Fallback if current active tab is restricted
  React.useEffect(() => {
    if (activeTab === 'roles' && !canViewRoles) {
      setActiveTab('users');
    }
    if (activeTab === 'audit' && !canViewAudit) {
      setActiveTab('users');
    }
  }, [activeTab, canViewRoles, canViewAudit]);

  const filteredUsers = db.users.filter((u) => {
    // Role-based visibility isolation:
    // Wali Kelas can only see their students or their own account
    if (currentUser.role === 'WALI KELAS') {
      const isMyStudent =
        u.role === 'SISWA' &&
        (myStudentIds.includes(u.referenceId || '') || myStudentNisns.includes(u.username));
      const isMyOwnAccount = u.id === currentUser.id;
      if (!isMyStudent && !isMyOwnAccount) return false;
    }
    // Guru Wali can only see their binaan students or their own account
    else if (currentUser.role === 'GURU WALI') {
      const isMyBinaan =
        u.role === 'SISWA' &&
        (myBinaanIds.includes(u.referenceId || '') || myBinaanNisns.includes(u.username));
      const isMyOwnAccount = u.id === currentUser.id;
      if (!isMyBinaan && !isMyOwnAccount) return false;
    }

    const matchSearch =
      u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'Semua' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleExportUsersPDF = () => {
    const head = [
      ['No', 'Username', 'Nama Lengkap', 'Role / Hak Akses', 'Email Dinas', 'No. WhatsApp', 'Status', 'Ganti Sandi']
    ];

    const body = filteredUsers.map((u, idx) => [
      idx + 1,
      u.username,
      u.nama,
      u.role,
      u.email || '-',
      u.nomorHp || '-',
      u.status,
      u.mustChangePassword ? 'Wajib' : 'Normal',
    ]);

    exportToF4LandscapePDF({
      title: 'Daftar Akun Pengguna & Hak Akses Sistem (RBAC)',
      subtitle: `Dokumen Pengendalian Autentikasi Pengguna • Filter Role: ${filterRole}`,
      fileName: `Daftar_Akun_Pengguna_F4_Landscape.pdf`,
      metaInfo: [
        { label: 'Filter Role', value: filterRole },
        { label: 'Total Akun', value: `${filteredUsers.length} Pengguna Terdaftar` },
      ],
      head: head,
      body: body,
      signatureRole: 'Administrator Sistem IT',
      signatureName: 'Dr. H. Bambang Sutrisno, M.Pd.',
      signatureNip: '196803151992031004',
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 55 },
        3: { cellWidth: 40, halign: 'center' },
        4: { cellWidth: 60 },
        5: { cellWidth: 35, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 25, halign: 'center' },
      },
    });
  };

  const handleExportUsersExcel = () => {
    const data = filteredUsers.map((u, idx) => ({
      No: idx + 1,
      Username: u.username,
      'Nama Lengkap': u.nama,
      'Role / Hak Akses': u.role,
      'Email Dinas': u.email,
      'Nomor WhatsApp': u.nomorHp,
      Status: u.status,
      'Wajib Ganti Password': u.mustChangePassword ? 'Ya' : 'Tidak',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Akun_Pengguna');
    XLSX.writeFile(workbook, `Data_Akun_Pengguna_${filterRole}_2024.xlsx`);
  };

  // Toggle permission for a role
  const handleTogglePermission = (targetRole: UserRole, permCode: string) => {
    if (targetRole === 'SUPER ADMIN') {
      info('Role SUPER ADMIN memiliki hak akses absolut ke seluruh sistem.', 'Akses Penuh Super Admin');
      return;
    }

    const currentList = rolePermissions[targetRole] || [];
    const isGranted = currentList.includes(permCode);

    const updatedList = isGranted
      ? currentList.filter((c) => c !== permCode)
      : [...currentList, permCode];

    const updatedMap = {
      ...rolePermissions,
      [targetRole]: updatedList,
    };

    setRolePermissions(updatedMap);
    db.rolePermissions = updatedMap;
    dbService.saveToStorage(db);

    const permName = ALL_PERMISSIONS.find((p) => p.code === permCode)?.name || permCode;
    if (isGranted) {
      warning(`Izin "${permName}" dicabut untuk Role [${targetRole}].`, 'Hak Akses Dicabut');
    } else {
      success(`Izin "${permName}" diberikan untuk Role [${targetRole}].`, 'Hak Akses Diberikan');
    }
  };

  // Reset to Disdik default permissions
  const handleResetPermissionsToDefault = () => {
    if (window.confirm('Kembalikan seluruh matriks hak akses ke standar default kurikulum Disdik Jabar?')) {
      const resetMap = { ...DEFAULT_ROLE_PERMISSIONS };
      setRolePermissions(resetMap);
      db.rolePermissions = resetMap;
      dbService.saveToStorage(db);
      success('Matriks hak akses 7 role berhasil dikembalikan ke standar default!', 'Reset Berhasil');
    }
  };

  // Export Role Matrix to PDF (F4 Landscape)
  const handleExportRoleMatrixPDF = () => {
    const head = [
      ['No', 'Kategori', 'Kode Izin', 'Nama Modul / Fitur', 'SUPER ADMIN', 'ADMIN', 'KEPALA SEKOLAH', 'WAKASEK', 'WALI KELAS', 'GURU WALI', 'GURU MAPEL']
    ];

    const body = ALL_PERMISSIONS.map((p, idx) => [
      idx + 1,
      p.category,
      p.code,
      p.name,
      '✓',
      rolePermissions['ADMIN']?.includes(p.code) ? '✓' : '-',
      rolePermissions['KEPALA SEKOLAH']?.includes(p.code) ? '✓' : '-',
      rolePermissions['WAKASEK']?.includes(p.code) ? '✓' : '-',
      rolePermissions['WALI KELAS']?.includes(p.code) ? '✓' : '-',
      rolePermissions['GURU WALI']?.includes(p.code) ? '✓' : '-',
      rolePermissions['GURU MAPEL']?.includes(p.code) ? '✓' : '-',
    ]);

    exportToF4LandscapePDF({
      title: 'Matriks Hak Akses & Kewenangan 7 Role Pengguna (RBAC)',
      subtitle: `Standar Hak Akses Sistem Informasi Manajemen Akademik • Disdik Provinsi Jawa Barat`,
      fileName: `Matriks_Role_RBAC_F4_Landscape.pdf`,
      metaInfo: [
        { label: 'Total Izin', value: `${ALL_PERMISSIONS.length} Butir Permission` },
        { label: 'Total Role', value: '7 Role Formal Sekolah' },
        { label: 'Otoritas', value: 'Super Admin / Admin Disdik' },
      ],
      head: head,
      body: body,
      signatureRole: 'Super Admin IT',
      signatureName: 'Dr. H. Bambang Sutrisno, M.Pd.',
      signatureNip: '196803151992031004',
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 32 },
        3: { cellWidth: 65 },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 24, halign: 'center' },
        7: { cellWidth: 20, halign: 'center' },
        8: { cellWidth: 22, halign: 'center' },
        9: { cellWidth: 22, halign: 'center' },
        10: { cellWidth: 22, halign: 'center' },
      },
    });

    success('Matriks Role RBAC berhasil dicetak ke PDF Landscape F4!', 'Cetak PDF Selesai');
  };

  // Export Role Matrix to Excel
  const handleExportRoleMatrixExcel = () => {
    const data = ALL_PERMISSIONS.map((p, idx) => ({
      No: idx + 1,
      Kategori: p.category,
      'Kode Izin': p.code,
      'Nama Modul / Fitur': p.name,
      Deskripsi: p.description,
      'SUPER ADMIN': 'Aktif',
      ADMIN: rolePermissions['ADMIN']?.includes(p.code) ? 'Aktif' : 'Tidak',
      'KEPALA SEKOLAH': rolePermissions['KEPALA SEKOLAH']?.includes(p.code) ? 'Aktif' : 'Tidak',
      WAKASEK: rolePermissions['WAKASEK']?.includes(p.code) ? 'Aktif' : 'Tidak',
      'WALI KELAS': rolePermissions['WALI KELAS']?.includes(p.code) ? 'Aktif' : 'Tidak',
      'GURU WALI': rolePermissions['GURU WALI']?.includes(p.code) ? 'Aktif' : 'Tidak',
      'GURU MAPEL': rolePermissions['GURU MAPEL']?.includes(p.code) ? 'Aktif' : 'Tidak',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriks_RBAC_Role');
    XLSX.writeFile(workbook, `Matriks_Role_RBAC_Sekolah_2024.xlsx`);
    success('Matriks Role RBAC berhasil diekspor ke Excel (.xlsx)!', 'Ekspor Excel Berhasil');
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      username: `user_${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      role: 'GURU MAPEL',
      email: '',
      nomorHp: '',
      status: 'Aktif',
      mustChangePassword: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setFormData(user);
    setIsFormModalOpen(true);
  };

  const handleToggleStatus = (user: UserAccount) => {
    const newStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    db.users = db.users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u));
    dbService.saveToStorage(db);
  };

  const handleResetPassword = (user: UserAccount) => {
    const tempPass = `Jabar_${Math.floor(100000 + Math.random() * 900000)}!`;
    db.users = db.users.map((u) =>
      u.id === user.id ? { ...u, mustChangePassword: true } : u
    );
    dbService.saveToStorage(db);
    setResetSuccessInfo({ username: user.username, tempPass });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.nama) {
      alert('Mohon isi username dan nama pengguna!');
      return;
    }

    if (selectedUser) {
      db.users = db.users.map((u) =>
        u.id === selectedUser.id ? ({ ...u, ...formData } as UserAccount) : u
      );
    } else {
      const newId = dbService.generateId('USR');
      const newUser: UserAccount = {
        ...(formData as UserAccount),
        id: newId,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
    }

    dbService.saveToStorage(db);
    setIsFormModalOpen(false);
  };

  const roleList: RoleType[] = [
    'SUPER ADMIN',
    'ADMIN',
    'KEPALA SEKOLAH',
    'WAKASEK',
    'WALI KELAS',
    'GURU WALI',
    'GURU MAPEL',
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Manajemen Akun & Role-Based Access Control (RBAC)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola kredensial login, 7 hirarki peran pengguna, reset sandi acak, dan audit log sistem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManageUsers && (
              <button
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Pengguna</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Daftar Akun Pengguna ({db.users.length})</span>
          </button>

          {canViewRoles && (
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'roles'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Matriks 7 Role & Hak Akses</span>
            </button>
          )}

          {canViewAudit && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail & Log Keamanan</span>
            </button>
          )}
        </div>
      </div>

      {/* Reset Password Banner Notification */}
      {resetSuccessInfo && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start justify-between gap-3 text-xs animate-in zoom-in-95 duration-150">
          <div className="flex items-start gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-amber-950 text-sm">
                Sandi Berhasil Direset Sementara!
              </div>
              <p className="text-amber-900 mt-0.5">
                Username: <strong>{resetSuccessInfo.username}</strong> | Password Sementara:{' '}
                <strong className="font-mono text-base bg-amber-200 px-2 py-0.5 rounded text-amber-950">
                  {resetSuccessInfo.tempPass}
                </strong>
              </p>
              <div className="text-[11px] text-amber-800 mt-1">
                Pengguna akan diwajibkan mengganti kata sandi baru pada saat pertama kali login.
              </div>
            </div>
          </div>
          <button
            onClick={() => setResetSuccessInfo(null)}
            className="p-1 text-amber-700 hover:text-amber-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. USERS LIST */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama, username, atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="w-44">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Role</option>
                  {roleList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportUsersPDF}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Cetak PDF Format Landscape F4 (Folio) Presisi"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Cetak PDF (F4 Landscape)</span>
              </button>

              <button
                onClick={handleExportUsersExcel}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Ekspor ke Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Nama & Username</th>
                    <th className="p-3.5">Role / Hak Akses</th>
                    <th className="p-3.5">Kontak & Email</th>
                    <th className="p-3.5">Wajib Ganti Sandi</th>
                    <th className="p-3.5">Status Akun</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.nama}</div>
                        <div className="font-mono text-[11px] text-slate-500">@{u.username}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{u.email || '-'}</div>
                        <div className="font-mono text-[11px] text-slate-400">{u.nomorHp}</div>
                      </td>
                      <td className="p-3.5">
                        {u.mustChangePassword ? (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            Ya (Wajib)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Tidak</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                            u.status === 'Aktif' ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Gembok Aktifkan / Nonaktifkan */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              u.status === 'Aktif'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                            }`}
                            title={
                              u.status === 'Aktif'
                                ? 'Gembok Hijau (Akun Aktif) - Klik untuk Nonaktifkan'
                                : 'Gembok Merah (Akun Nonaktif) - Klik untuk Aktifkan'
                            }
                          >
                            {u.status === 'Aktif' ? (
                              <Unlock className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-rose-600" />
                            )}
                          </button>

                          {/* Kunci Reset Sandi */}
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg transition-all cursor-pointer"
                            title="Icon Kunci: Reset Kata Sandi Akun"
                          >
                            <KeyRound className="w-4 h-4 text-amber-600" />
                          </button>

                          {/* Edit Data */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                            title="Edit Data Akun Pengguna"
                          >
                            <Edit2 className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
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
      {/* 2. ROLE & PERMISSION MATRIX (INTERACTIVE CHECKBOXES) */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Matriks Hak Akses & RBAC 7 Role Utama Sekolah (Interaktif)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik kotak centang pada setiap kolom peran untuk memberi atau mencabut izin akses secara langsung.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleResetPermissionsToDefault}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Kembalikan ke pengaturan awal Disdik"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar Disdik</span>
              </button>

              <button
                onClick={handleExportRoleMatrixPDF}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Cetak Matriks Role ke PDF Landscape F4 Presisi"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Cetak PDF (F4 Landscape)</span>
              </button>

              <button
                onClick={handleExportRoleMatrixExcel}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Ekspor Matriks Role ke Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={permSearchTerm}
                onChange={(e) => setPermSearchTerm(e.target.value)}
                placeholder="Cari nama izin, modul, atau kode permission..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px] font-medium">Kategori:</span>
              <select
                value={permCategoryFilter}
                onChange={(e) => setPermCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none font-medium"
              >
                <option value="Semua">Semua Kategori</option>
                {['Dashboard', 'Guru', 'Siswa', 'KBM', 'Bank Soal', 'Ujian', 'Presensi', 'Pengumuman', 'Akun', 'Role'].map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 w-8 text-center">No</th>
                  <th className="p-3 min-w-[200px]">Modul & Nama Izin</th>
                  <th className="p-3 w-28">Kategori</th>
                  {roleList.map((r) => (
                    <th key={r} className="p-3 text-center min-w-[100px]">
                      <div className="text-[10px] leading-tight font-black">{r}</div>
                      <div className="text-[9px] text-slate-500 font-normal lowercase">
                        {rolePermissions[r]?.length || (r === 'SUPER ADMIN' ? ALL_PERMISSIONS.length : 0)} izin
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ALL_PERMISSIONS.filter((p) => {
                  const matchSearch =
                    p.name.toLowerCase().includes(permSearchTerm.toLowerCase()) ||
                    p.code.toLowerCase().includes(permSearchTerm.toLowerCase()) ||
                    p.description.toLowerCase().includes(permSearchTerm.toLowerCase());
                  const matchCat = permCategoryFilter === 'Semua' || p.category === permCategoryFilter;
                  return matchSearch && matchCat;
                }).map((perm, idx) => (
                  <tr key={perm.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{perm.name}</div>
                      <div className="text-[11px] text-slate-500">{perm.description}</div>
                      <div className="font-mono text-[10px] text-slate-400">{perm.code}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                        {perm.category}
                      </span>
                    </td>
                    {roleList.map((r) => {
                      const isSuper = r === 'SUPER ADMIN';
                      const isChecked = isSuper ? true : (rolePermissions[r] || []).includes(perm.code);

                      return (
                        <td key={r} className="p-3 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded-lg hover:bg-slate-200/60 transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSuper}
                              onChange={() => handleTogglePermission(r, perm.code)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed accent-emerald-600"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AUDIT LOG */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Audit Trail Aktivitas & Keamanan Real-Time</span>
          </h3>

          <div className="space-y-2 text-xs">
            {[
              {
                time: 'Baru saja',
                user: 'Ahmad Fajar Nugraha',
                action: 'Memulai sesi CAT Ujian: PTS Informatika',
                ip: '180.252.164.21',
                status: 'Success',
              },
              {
                time: '10 Menit lalu',
                user: 'Drs. H. Hendra Permana, M.Pd.',
                action: 'Mereset kata sandi siswa NISN 0078129301',
                ip: '180.252.164.12',
                status: 'Success',
              },
              {
                time: '25 Menit lalu',
                user: 'Dr. Hj. Siti Rohmah, M.Si.',
                action: 'Menghasilkan 3 butir soal baru via Gemini AI Generator',
                ip: '180.252.164.18',
                status: 'Success',
              },
              {
                time: '1 Jam lalu',
                user: 'Administrator Jabar',
                action: 'Memvalidasi jadwal KBM tanpa bentrok ruangan',
                ip: '180.252.164.01',
                status: 'Success',
              },
            ].map((log, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-800">{log.action}</div>
                  <div className="text-[11px] text-slate-500">
                    Oleh: <strong>{log.user}</strong> • IP: {log.ip}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    {log.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE/EDIT USER MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{selectedUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Peran</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  {roleList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Sekolah</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No WhatsApp</label>
                <input
                  type="text"
                  value={formData.nomorHp || ''}
                  onChange={(e) => setFormData({ ...formData, nomorHp: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
