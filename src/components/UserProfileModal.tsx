import React, { useState } from 'react';
import {
  User,
  Camera,
  Upload,
  X,
  Check,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Trash2,
} from 'lucide-react';
import { UserAccount, Guru, Siswa } from '../types';
import { dbService } from '../services/mockDatabase';

interface UserProfileModalProps {
  currentUser: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCurrentUser: (updatedUser: UserAccount) => void;
  initialTab?: 'profil' | 'password';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateCurrentUser,
  initialTab = 'profil',
}) => {
  const db = dbService.getState();
  const [activeTab, setActiveTab] = useState<'profil' | 'password'>(initialTab);

  // Profile Form States
  const [nama, setNama] = useState(currentUser.nama || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [nomorHp, setNomorHp] = useState(currentUser.nomorHp || '');
  const [foto, setFoto] = useState(currentUser.foto || '');
  const [isUploading, setIsUploading] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');

  // Sync state if currentUser changes
  React.useEffect(() => {
    setNama(currentUser.nama || '');
    setEmail(currentUser.email || '');
    setNomorHp(currentUser.nomorHp || '');
    setFoto(currentUser.foto || '');
    setActiveTab(initialTab);
  }, [currentUser, initialTab]);

  if (!isOpen) return null;

  // Find linked Guru or Siswa record
  const currentGuru = db.guru.find((g) => g.id === currentUser.referenceId || g.nip === currentUser.username);
  const currentSiswa = db.siswa.find((s) => s.id === currentUser.referenceId || s.nisn === currentUser.username);

  // Avatar Presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  ];

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setFoto(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: UserAccount = {
      ...currentUser,
      nama,
      email,
      nomorHp,
      foto,
    };

    // Update in db.users
    db.users = db.users.map((u) => (u.id === currentUser.id ? updatedUser : u));

    // Update in linked Guru record if exists
    if (currentGuru) {
      db.guru = db.guru.map((g) =>
        g.id === currentGuru.id
          ? {
              ...g,
              nama,
              email,
              nomorHp,
              foto: foto || g.foto,
            }
          : g
      );
    }

    // Update in linked Siswa record if exists
    if (currentSiswa) {
      db.siswa = db.siswa.map((s) =>
        s.id === currentSiswa.id
          ? {
              ...s,
              namaLengkap: nama,
              email,
              nomorHp,
              foto: foto || s.foto,
            }
          : s
      );
    }

    dbService.saveToStorage(db);
    onUpdateCurrentUser(updatedUser);

    setProfileSuccessMsg('Profil & foto berhasil diperbarui!');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccessMsg('');

    if (newPassword.length < 6) {
      setPassError('Password baru harus minimal 6 karakter!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi password tidak cocok dengan password baru!');
      return;
    }

    // Update password in db.users
    db.users = db.users.map((u) =>
      u.id === currentUser.id
        ? {
            ...u,
            password: newPassword,
            mustChangePassword: false,
          }
        : u
    );

    dbService.saveToStorage(db);
    setPassSuccessMsg('Kata sandi berhasil diperbarui dengan aman!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      setPassSuccessMsg('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pengaturan Akun & Profil</h3>
              <p className="text-xs text-slate-500">{currentUser.username} • {currentUser.role}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 pt-3 shrink-0">
          <button
            onClick={() => setActiveTab('profil')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profil'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil & Foto</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'password'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ganti Kata Sandi</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PROFIL & UPLOAD FOTO */}
        {/* ========================================================================= */}
        {activeTab === 'profil' && (
          <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Photo Avatar Uploader Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-white flex items-center justify-center">
                  {foto ? (
                    <img src={foto} alt={nama} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-700 text-white font-bold text-xl flex items-center justify-center">
                      {nama.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <label className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Ubah</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Foto Profil Pengguna</h4>
                  <p className="text-[11px] text-slate-500">
                    Format JPG, PNG, atau GIF. Ukuran file maksimal 5 MB.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isUploading ? 'Memproses...' : 'Unggah Foto Baru'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {foto && (
                    <button
                      type="button"
                      onClick={() => setFoto('')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                {/* Preset Avatars */}
                <div className="pt-1 flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
                  {avatarPresets.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt="Preset"
                      onClick={() => setFoto(preset)}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200 hover:scale-110 cursor-pointer transition-transform"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username / NIP / NISN</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.username}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@sekolah.sch.id"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  value={nomorHp}
                  onChange={(e) => setNomorHp(e.target.value)}
                  placeholder="08123456789"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>

            {/* Role & Specific School Data Info */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Informasi Kedinasan / Akademik</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                  {currentUser.role}
                </span>
              </div>

              {currentGuru && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div>Mapel Utama: <strong className="text-slate-800">{currentGuru.mataPelajaranUtama}</strong></div>
                  <div>Tugas Tambahan: <strong className="text-slate-800">{currentGuru.tugasTambahan}</strong></div>
                  <div>Status: <strong className="text-slate-800">{currentGuru.statusKepegawaian}</strong></div>
                  <div>NIP: <strong className="text-slate-800">{currentGuru.nip}</strong></div>
                </div>
              )}

              {currentSiswa && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div>Kelas & Rombel: <strong className="text-slate-800">{currentSiswa.kelas} {currentSiswa.rombel}</strong></div>
                  <div>NISN: <strong className="text-slate-800">{currentSiswa.nisn}</strong></div>
                  <div>Orang Tua: <strong className="text-slate-800">{currentSiswa.namaOrangTua}</strong></div>
                  <div>Status Siswa: <strong className="text-emerald-700 font-bold">Aktif</strong></div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GANTI PASSWORD */}
        {/* ========================================================================= */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
            {passError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl font-medium">
                {passError}
              </div>
            )}

            {passSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccessMsg}</span>
              </div>
            )}

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-700" />
                <span>Keamanan Akun SMS JABAR</span>
              </p>
              <p className="text-[11px] text-amber-800">
                Gunakan kombinasi minimal 6 karakter dengan huruf dan angka untuk mencegah akses yang tidak sah.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password Saat Ini / Lama</label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama Anda"
                  className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password Baru</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Simpan Kata Sandi Baru</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
