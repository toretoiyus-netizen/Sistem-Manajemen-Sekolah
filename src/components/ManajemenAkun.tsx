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
} from 'lucide-react';
import { RoleType, UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';

interface ManajemenAkunProps {
  currentUser: UserAccount;
}

export const ManajemenAkun: React.FC<ManajemenAkunProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('Semua');

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

  const filteredUsers = db.users.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'Semua' || u.role === filterRole;
    return matchSearch && matchRole;
  });

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama, username, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
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
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                            title={u.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            {u.status === 'Aktif' ? (
                              <Unlock className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-rose-600" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                            title="Edit Data Akun"
                          >
                            <Edit2 className="w-4 h-4" />
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
      {/* 2. ROLE & PERMISSION MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Matriks Hak Akses 7 Role Utama Sekolah</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Modul / Fitur</th>
                  <th className="p-3 text-center">SUPER ADMIN</th>
                  <th className="p-3 text-center">ADMIN</th>
                  <th className="p-3 text-center">KEPALA SEKOLAH</th>
                  <th className="p-3 text-center">WAKASEK</th>
                  <th className="p-3 text-center">WALI KELAS</th>
                  <th className="p-3 text-center">GURU WALI</th>
                  <th className="p-3 text-center">GURU MAPEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { name: 'Buku Induk Guru (CRUD Lengkap)', roles: ['SUPER ADMIN', 'ADMIN', 'KEPALA SEKOLAH'] },
                  { name: 'Buku Induk Murid (Semua Siswa)', roles: ['SUPER ADMIN', 'ADMIN', 'KEPALA SEKOLAH', 'WAKASEK'] },
                  { name: 'Data Siswa Binaan Sendiri (Scope Terbatas)', roles: ['WALI KELAS', 'GURU WALI'] },
                  { name: 'Reset Sandi Siswa Binaan', roles: ['SUPER ADMIN', 'ADMIN', 'WALI KELAS', 'GURU WALI'] },
                  { name: 'Struktur KBM & Jadwal Anti-Bentrok', roles: ['SUPER ADMIN', 'ADMIN', 'WAKASEK'] },
                  { name: 'Bank Soal (Buat & AI Generator)', roles: ['SUPER ADMIN', 'ADMIN', 'WAKASEK', 'WALI KELAS', 'GURU WALI', 'GURU MAPEL'] },
                  { name: 'Manajemen Ujian & Cetak Token', roles: ['SUPER ADMIN', 'ADMIN', 'WAKASEK', 'WALI KELAS', 'GURU MAPEL'] },
                  { name: 'Presensi Harian & Jurnal Guru', roles: ['SUPER ADMIN', 'ADMIN', 'WALI KELAS', 'GURU MAPEL'] },
                  { name: 'Manajemen Akun & Role RBAC', roles: ['SUPER ADMIN', 'ADMIN'] },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                    {roleList.map((r) => (
                      <td key={r} className="p-3 text-center">
                        {item.roles.includes(r) ? (
                          <span className="inline-block w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold leading-4">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>
                    ))}
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
