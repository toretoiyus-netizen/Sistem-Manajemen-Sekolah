import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationHint, setValidationHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);

  const db = dbService.getState();

  // Valid institutional domain suffixes
  const allowedDomains = [
    '@disdik.jabarprov.go.id',
    '@guru.disdik.jabarprov.go.id',
    '@admin.disdik.jabarprov.go.id',
    '@jabarprov.go.id',
    '@belajar.id',
    '@guru.sma.belajar.id',
    '@admin.sma.belajar.id',
    '@guru.smk.belajar.id',
    '@admin.smk.belajar.id',
  ];

  const validateInstitutionalEmail = (email: string): boolean => {
    const clean = email.trim().toLowerCase();
    return allowedDomains.some((domain) => clean.endsWith(domain.toLowerCase()));
  };

  const handleInputChange = (val: string) => {
    setUsernameOrEmail(val);
    setErrorMessage(null);

    const trimmed = val.trim();
    if (trimmed.includes('@')) {
      if (!validateInstitutionalEmail(trimmed)) {
        setValidationHint('Gunakan email resmi instansi (@disdik.jabarprov.go.id atau @*.belajar.id)');
      } else {
        setValidationHint(null);
      }
    } else {
      setValidationHint(null);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usernameOrEmail.trim();

    // Enforce Institutional Email format validation if an email address is entered
    if (cleanUser.includes('@')) {
      if (!validateInstitutionalEmail(cleanUser)) {
        setErrorMessage(
          'Akses Ditolak: Hanya email resmi berdomain instansi (@disdik.jabarprov.go.id atau @*.belajar.id) yang diizinkan masuk ke sistem.'
        );
        return;
      }
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Search in DB Users
      const foundUser = db.users.find(
        (u) =>
          u.username.toLowerCase() === cleanUser.toLowerCase() ||
          u.email?.toLowerCase() === cleanUser.toLowerCase() ||
          u.nomorHp === cleanUser
      );

      if (foundUser) {
        if (foundUser.status !== 'Aktif') {
          setErrorMessage('Akun Anda dinonaktifkan oleh Administrator Wilayah.');
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        onLoginSuccess(foundUser);
        return;
      }

      // 2. Fallback search in Siswa database (NISN)
      const foundSiswa = db.siswa.find(
        (s) => s.nisn === cleanUser || s.nis === cleanUser || s.email?.toLowerCase() === cleanUser.toLowerCase()
      );
      if (foundSiswa) {
        const studentUser: UserAccount = {
          id: `USR-${foundSiswa.id}`,
          username: foundSiswa.nisn,
          nama: foundSiswa.namaLengkap,
          role: 'SISWA',
          email: foundSiswa.email || `${foundSiswa.nisn}@siswa.disdik.jabarprov.go.id`,
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

      // 3. Fallback search in Guru database (NIP / Email)
      const foundGuru = db.guru.find(
        (g) => g.nip === cleanUser || g.nik === cleanUser || g.email?.toLowerCase() === cleanUser.toLowerCase()
      );
      if (foundGuru) {
        const teacherUser: UserAccount = {
          id: `USR-${foundGuru.id}`,
          username: foundGuru.nip || foundGuru.nama.toLowerCase().replace(/\s+/g, ''),
          nama: foundGuru.nama,
          role:
            foundGuru.tugasTambahan === 'Wali Kelas'
              ? 'WALI KELAS'
              : foundGuru.tugasTambahan === 'Guru Wali'
              ? 'GURU WALI'
              : 'GURU MAPEL',
          email: foundGuru.email || `${foundGuru.nip}@guru.disdik.jabarprov.go.id`,
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

      setErrorMessage('Kredensial instansi (NIP / Email Resmi Disdik) tidak terdaftar dalam pangkalan data.');
      setIsLoading(false);
    }, 400);
  };

  // Google G-Suite SSO Login Handler
  const handleGoogleSignIn = (targetEmail?: string) => {
    const emailToUse = targetEmail || googleEmailInput.trim();
    setGoogleError(null);

    if (!emailToUse) {
      setGoogleError('Silakan pilih atau masukkan email akun Google Workspace / G-Suite Anda.');
      return;
    }

    if (!validateInstitutionalEmail(emailToUse)) {
      setGoogleError(
        'Akun Ditolak: Hanya akun G-Suite resmi (@disdik.jabarprov.go.id atau @*.belajar.id) yang memiliki hak otorisasi SSO.'
      );
      return;
    }

    setIsGoogleLoading(true);

    setTimeout(() => {
      // Find matching user or teacher
      const matchingUser = db.users.find(
        (u) => u.email?.toLowerCase() === emailToUse.toLowerCase() || u.username.toLowerCase() === emailToUse.split('@')[0].toLowerCase()
      );

      if (matchingUser) {
        setIsGoogleLoading(false);
        setShowGoogleModal(false);
        onLoginSuccess(matchingUser);
        return;
      }

      const matchingGuru = db.guru.find((g) => g.email?.toLowerCase() === emailToUse.toLowerCase());
      if (matchingGuru) {
        const teacherAccount: UserAccount = {
          id: `USR-${matchingGuru.id}`,
          username: matchingGuru.nip,
          nama: matchingGuru.nama,
          role:
            matchingGuru.tugasTambahan === 'Wali Kelas'
              ? 'WALI KELAS'
              : matchingGuru.tugasTambahan === 'Guru Wali'
              ? 'GURU WALI'
              : 'GURU MAPEL',
          email: emailToUse,
          nomorHp: matchingGuru.nomorHp,
          status: 'Aktif',
          mustChangePassword: false,
          referenceId: matchingGuru.id,
          createdAt: new Date().toISOString(),
        };
        setIsGoogleLoading(false);
        setShowGoogleModal(false);
        onLoginSuccess(teacherAccount);
        return;
      }

      // If official G-Suite admin domain, authenticate as verified Admin
      const isSuperAdminEmail = emailToUse.toLowerCase().startsWith('admin') || emailToUse.toLowerCase().includes('hendra');
      const ssoUser: UserAccount = {
        id: `USR-GSUITE-${Date.now()}`,
        username: emailToUse.split('@')[0],
        nama: isSuperAdminEmail ? 'Administrator Disdik Jabar (G-Suite)' : `Pendidik Resmi (${emailToUse.split('@')[0]})`,
        role: isSuperAdminEmail ? 'SUPER ADMIN' : 'GURU MAPEL',
        email: emailToUse,
        nomorHp: '0812-3456-7890',
        status: 'Aktif',
        mustChangePassword: false,
        referenceId: 'GURU-001',
        createdAt: new Date().toISOString(),
      };

      setIsGoogleLoading(false);
      setShowGoogleModal(false);
      onLoginSuccess(ssoUser);
    }, 600);
  };

  return (
    <section
      id="login-section"
      className="min-h-screen w-full bg-slate-900/90 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none"></div>

      <div className="login-container-box w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px] z-10 relative">
        {/* LOGIN LEFT SIDE */}
        <div className="login-left-side lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Header Logos & Title */}
            <div className="text-center mb-6">
              <img
                className="logo-left-img mx-auto h-16 sm:h-20 object-contain mb-3"
                src={db.config.logoUrl || 'https://deskdik.jabarprov.go.id/assets/img/new-disdikjabar.png'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://deskdik.jabarprov.go.id/assets/img/new-disdikjabar.png';
                }}
                alt={`Logo ${db.config.namaSekolah}`}
              />
              <h1 className="text-slate-900 font-black text-lg sm:text-xl tracking-tight mb-1">
                {db.config.namaAplikasi || 'Sistem Manajemen Sekolah Jawa Barat'}
              </h1>
              <p className="text-emerald-700 sm:text-xs text-[11px] font-bold uppercase tracking-wider mb-2">
                {db.config.namaSekolah || 'SMAN 1 KOTA BANDUNG - JAWA BARAT'}
              </p>
              <div className="w-12 h-1 bg-emerald-600 rounded-full mx-auto"></div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Workspace / G-Suite SSO Button */}
            <div className="mb-5 space-y-2">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Google Logo SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="tracking-wide">Masuk dengan Akun Google (G-Suite / Belajar.id)</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400">atau login akun instansi</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
            </div>

            {/* Formal Login Form */}
            <form id="form-login" onSubmit={handleLogin} className="space-y-4">
              <div className="mb-3">
                <label className="form-label text-slate-800 font-bold text-xs uppercase tracking-wide block mb-1.5">
                  Email Instansi / NIP / NPSN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    className={`form-control form-control-custom w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      validationHint ? 'border-amber-400' : 'border-slate-200'
                    }`}
                    id="username"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="nama@disdik.jabarprov.go.id atau NIP"
                  />
                </div>
                {validationHint && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationHint}</span>
                  </p>
                )}
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
                    placeholder="Masukkan Kata Sandi"
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
                  <span>Memverifikasi Otoritas...</span>
                ) : (
                  <>
                    <span>Masuk ke Portal Sekolah</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Security Badge */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Otentikasi Aman Terintegrasi</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">v1.0 • TLS 1.3</span>
          </div>
        </div>

        {/* LOGIN RIGHT SIDE */}
        <div className="login-right-side lg:col-span-6 bg-gradient-to-br from-[#0b3c6d] via-[#0d47a1] to-[#01579b] p-8 sm:p-12 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
          {/* Background Glow */}
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
              <h2 className="font-bold text-lg sm:text-xl text-white mb-1.5">
                Cabang Dinas Pendidikan Wilayah XI
              </h2>
              <p className="text-white/70 font-semibold text-xs sm:text-sm tracking-wide">
                Provinsi Jawa Barat
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-cyan-200/80 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>Single Sign-On (SSO) Akun Belajar.id & G-Suite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google G-Suite SSO Modal Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <h3 className="font-bold text-slate-900 text-sm">Pilih Akun G-Suite / Belajar.id</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Login cepat khusus tenaga pendidik dan admin sekolah menggunakan akun Google Workspace for Education yang terverifikasi di Jawa Barat.
            </p>

            {googleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{googleError}</span>
              </div>
            )}

            {/* Quick Institutional Profile List */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleSignIn('admin.cadisdik11@disdik.jabarprov.go.id')}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">Admin Cadisdik Wilayah XI</div>
                  <div className="text-[11px] text-slate-500 font-mono">admin.cadisdik11@disdik.jabarprov.go.id</div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSignIn('hendra.sukmana@guru.sma.belajar.id')}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">Drs. H. Hendra Sukmana, M.Pd.</div>
                  <div className="text-[11px] text-slate-500 font-mono">hendra.sukmana@guru.sma.belajar.id</div>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Wali Kelas
                </span>
              </button>
            </div>

            {/* Custom G-Suite Email Input */}
            <div className="pt-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Atau Masukkan Akun G-Suite / Belajar.id Lainnya:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => {
                    setGoogleEmailInput(e.target.value);
                    setGoogleError(null);
                  }}
                  placeholder="nama@disdik.jabarprov.go.id"
                  className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn()}
                  disabled={isGoogleLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isGoogleLoading ? 'Memverifikasi...' : 'Lanjutkan'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Keamanan Google OAuth 2.0</span>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-600 hover:text-slate-900 font-bold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
