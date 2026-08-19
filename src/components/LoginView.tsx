import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const db = dbService.getState();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim();
      const foundUser = db.users.find(
        (u) =>
          u.username.toLowerCase() === cleanUser.toLowerCase() ||
          u.email?.toLowerCase() === cleanUser.toLowerCase() ||
          u.nomorHp === cleanUser
      );

      if (!foundUser) {
        // Fallback search in Siswa NISN
        const foundSiswa = db.siswa.find((s) => s.nisn === cleanUser || s.nis === cleanUser);
        if (foundSiswa) {
          const studentUser: UserAccount = {
            id: `USR-${foundSiswa.id}`,
            username: foundSiswa.nisn,
            nama: foundSiswa.namaLengkap,
            role: 'SISWA',
            email: foundSiswa.email,
            nomorHp: foundSiswa.nomorHp || '',
            status: 'Aktif',
            mustChangePassword: false,
            referenceId: foundSiswa.id,
            createdAt: new Date().toISOString(),
          };
          setIsLoading(false);
          onLoginSuccess(studentUser);
          return;
        }

        // Fallback search in Guru NIP
        const foundGuru = db.guru.find((g) => g.nip === cleanUser || g.nik === cleanUser);
        if (foundGuru) {
          const teacherUser: UserAccount = {
            id: `USR-${foundGuru.id}`,
            username: foundGuru.nip || foundGuru.nama.toLowerCase().replace(/\s+/g, ''),
            nama: foundGuru.nama,
            role: foundGuru.tugasTambahan === 'Wali Kelas' ? 'WALI KELAS' : foundGuru.tugasTambahan === 'Guru Wali' ? 'GURU WALI' : 'GURU MAPEL',
            email: foundGuru.email,
            nomorHp: foundGuru.nomorHp || '',
            status: 'Aktif',
            mustChangePassword: false,
            referenceId: foundGuru.id,
            createdAt: new Date().toISOString(),
          };
          setIsLoading(false);
          onLoginSuccess(teacherUser);
          return;
        }

        setErrorMessage('NPSN / NIP / NISN / Username tidak terdaftar dalam pangkalan data.');
        setIsLoading(false);
        return;
      }

      if (foundUser.status !== 'Aktif') {
        setErrorMessage('Akun Anda sedang dinonaktifkan. Hubungi Administrator.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLoginSuccess(foundUser);
    }, 400);
  };

  const handleQuickLogin = (role: string) => {
    const user = db.users.find((u) => u.role === role) || db.users[0];
    setUsername(user.username);
    setPassword('••••••••');
    onLoginSuccess(user);
  };

  return (
    <section
      id="login-section"
      className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans"
    >
      <div className="login-container-box w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* LOGIN LEFT SIDE */}
        <div className="login-left-side lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Header Logos & Title */}
            <div className="text-center mb-6">
              <img
                className="logo-left-img mx-auto h-16 sm:h-20 object-contain mb-3"
                src="https://deskdik.jabarprov.go.id/assets/img/new-disdikjabar.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/200x80/ffffff/0a3f70?text=Disdik+Jabar';
                }}
                alt="Logo Disdik Jabar"
              />
              <h5 className="fw-bold text-slate-900 font-black text-lg sm:text-xl tracking-tight mb-1">
                Sistem Manajemen Sekolah Jawa Barat
              </h5>
              <p className="text-emerald-700 sm:text-xs text-[11px] font-bold uppercase tracking-wider mb-2">
                Cabangg Dinas Pendidikan Wilayah XI
              </p>
              <div className="w-12 h-1 bg-emerald-600 rounded-full mx-auto"></div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form id="form-login" onSubmit={handleLogin} className="space-y-4">
              <div className="mb-3">
                <label className="form-label text-slate-800 font-bold text-xs uppercase tracking-wide block mb-1.5">
                  NPSN / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-custom w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    id="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan NIP/NISN/Username"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-slate-800 font-bold text-xs uppercase tracking-wide block mb-1.5">
                  Password
                </label>
                <div className="input-group relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control form-control-custom w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan Password"
                  />
                  <button
                    className="btn btn-outline-secondary absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" id="toggle-pwd-icon" />
                    ) : (
                      <Eye className="w-4 h-4" id="toggle-pwd-icon" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-login-custom w-full py-3.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-800/20 hover:shadow-emerald-800/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Account Switcher (Testing & Demonstration Convenience) */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Akses Cepat Pengujian (Role Preview)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('SUPER ADMIN')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('WALI KELAS')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Wali Kelas
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('GURU MAPEL')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Guru Mapel
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('SISWA')}
                className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Siswa
              </button>
            </div>
          </div>
        </div>

        {/* LOGIN RIGHT SIDE */}
        <div className="login-right-side lg:col-span-6 bg-gradient-to-br from-[#0b3c6d] via-[#0d47a1] to-[#01579b] p-8 sm:p-12 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
          {/* Subtle Background Glow Rings */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6 max-w-sm">
            <img
              className="illustration-right-img mx-auto w-64 sm:w-80 h-auto object-contain drop-shadow-xl transform hover:scale-105 transition-transform duration-500"
              src="https://deskdik.jabarprov.go.id/assets/img/vector-sso.png"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://placehold.co/380x300/1e62d0/ffffff?text=Disdik+SSO+Illustration';
              }}
              alt="SSO Vector"
            />
            <div>
              <h5 className="fw-bold font-bold text-lg sm:text-xl text-white mb-1.5">
                Cabang Dinas Pendidikan Wilayah XI
              </h5>
              <p className="mb-0 text-white/70 font-semibold text-xs sm:text-sm tracking-wide">
                Provinsi Jawa Barat
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-cyan-200/80 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>Single Sign-On (SSO) Terintegrasi</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
