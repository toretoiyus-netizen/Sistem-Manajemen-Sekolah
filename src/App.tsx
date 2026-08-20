import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DataGuru } from './components/DataGuru';
import { DataMurid } from './components/DataMurid';
import { DataKBM } from './components/DataKBM';
import { ManajemenTugasTambahan } from './components/ManajemenTugasTambahan';
import { BankSoal } from './components/BankSoal';
import { ManajemenUjian } from './components/ManajemenUjian';
import { CATExamPortal } from './components/CATExamPortal';
import { PresensiSiswa } from './components/PresensiSiswa';
import { Pengumuman } from './components/Pengumuman';
import { ManajemenAkun } from './components/ManajemenAkun';
import { KonfigurasiSekolah } from './components/KonfigurasiSekolah';
import { GASDeploymentPanel } from './components/GASDeploymentPanel';
import { LoginView } from './components/LoginView';
import { RoleType, UserAccount } from './types';
import { dbService } from './services/mockDatabase';
import { ToastProvider } from './components/Toast';
import { ShieldAlert, RefreshCw, Lock, Sparkles, Building2 } from 'lucide-react';

const SESSION_STORAGE_KEY = 'sms_jabar_auth_session';

export default function App() {
  const [configState, setConfigState] = useState(dbService.getState().config);

  // Authentication State - Default to FALSE permanently as requested
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSessionChecked, setIsSessionChecked] = useState<boolean>(false);

  // Authenticated Master Account & Active Impersonated/Simulated Account state
  const [authenticatedUser, setAuthenticatedUser] = useState<UserAccount>(() => dbService.getState().users[0]);
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => dbService.getState().users[0]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isCatPortalActive, setIsCatPortalActive] = useState<boolean>(false);

  // Maintenance Bypass Flag (if Super Admin logs in during maintenance)
  const [maintenanceBypass, setMaintenanceBypass] = useState<boolean>(false);

  // Session persistence on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        const parsedUser: UserAccount = JSON.parse(savedSession);
        if (parsedUser && parsedUser.id) {
          // Verify user still exists in database
          const db = dbService.getState();
          const validUser = db.users.find((u) => u.id === parsedUser.id) || parsedUser;
          setAuthenticatedUser(validUser);
          setCurrentUser(validUser);
          setIsAuthenticated(true);
        }
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setIsSessionChecked(true);
    }
  }, []);

  // Listen to config updates from KonfigurasiSekolah
  useEffect(() => {
    const handleConfigUpdated = (e: any) => {
      if (e.detail) {
        setConfigState(e.detail);
      }
    };
    window.addEventListener('sms-jabar-config-updated', handleConfigUpdated);
    return () => window.removeEventListener('sms-jabar-config-updated', handleConfigUpdated);
  }, []);

  const handleLoginSuccess = (user: UserAccount) => {
    setAuthenticatedUser(user);
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
      console.warn('Could not save session to localStorage:', err);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not clear session:', err);
    }
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  // Simulation is strictly allowed ONLY for Super Admin
  const canSimulateRole = authenticatedUser.role === 'SUPER ADMIN';

  // Reset Student Password Alert modal
  const [resetModalInfo, setResetModalInfo] = useState<{
    siswaName: string;
    nisn: string;
    tempPass: string;
  } | null>(null);

  const handleRoleChange = (newRole: RoleType) => {
    // Role simulation is restricted exclusively to SUPER ADMIN
    if (authenticatedUser.role !== 'SUPER ADMIN') {
      return;
    }

    const db = dbService.getState();
    const foundUser = db.users.find((u) => u.role === newRole);
    if (foundUser) {
      setCurrentUser(foundUser);
    } else {
      const updatedUser: UserAccount = {
        ...currentUser,
        role: newRole,
        nama: `${newRole} User`,
      };
      setCurrentUser(updatedUser);
    }
  };

  const handleResetStudentPassword = (siswaId: string) => {
    const db = dbService.getState();
    const s = db.siswa.find((item) => item.id === siswaId);
    if (!s) return;
    const tempPass = `Jabar_${Math.floor(100000 + Math.random() * 900000)}!`;
    const userAcc = db.users.find((u) => u.referenceId === siswaId || u.username === s.nisn);
    if (userAcc) {
      userAcc.mustChangePassword = true;
      dbService.saveToStorage(db);
    }
    setResetModalInfo({
      siswaName: s.namaLengkap,
      nisn: s.nisn,
      tempPass,
    });
  };

  // If in Computer Assisted Test (CAT) fullscreen portal
  if (isCatPortalActive) {
    return (
      <ToastProvider>
        <CATExamPortal onBackToApp={() => setIsCatPortalActive(false)} />
      </ToastProvider>
    );
  }

  // If not authenticated, render LoginView
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    );
  }

  // Check Maintenance Mode
  const isMaintenanceActive = configState.maintenanceMode?.isEnabled && currentUser.role !== 'SUPER ADMIN';

  if (isMaintenanceActive && !maintenanceBypass) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                Mode Pemeliharaan Sistem
              </span>
              <h2 className="text-xl font-black text-white mt-3">
                {configState.namaAplikasi || 'SMS JABAR'} Sedang Diperbarui
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {configState.maintenanceMode?.message ||
                  'Sistem Manajemen Sekolah sedang dalam pemeliharaan berkala untuk peningkatan performa. Mohon coba kembali beberapa saat lagi.'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs text-slate-300">
              Estimasi Selesai:{' '}
              <strong className="text-emerald-400">
                {configState.maintenanceMode?.estimatedDone || '12:00 WIB'}
              </strong>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Keluar ke Halaman Login
              </button>
            </div>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          currentUser={currentUser}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onOpenCatPortal={() => setIsCatPortalActive(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#fdfdfc] overflow-hidden min-w-0">
          {/* Top Header Navbar */}
          <Navbar
            currentUser={currentUser}
            canSimulateRole={canSimulateRole}
            activeTab={activeTab}
            onRoleChange={handleRoleChange}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isMobileMenuOpen={isMobileMenuOpen}
            onOpenCatPortal={() => setIsCatPortalActive(true)}
            onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
            onLogout={handleLogout}
          />

          {/* Scrollable Content View */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                currentUser={currentUser}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenCatPortal={() => setIsCatPortalActive(true)}
                onResetStudentPassword={handleResetStudentPassword}
              />
            )}

            {activeTab === 'guru' && <DataGuru currentUser={currentUser} />}

            {(activeTab === 'murid' || activeTab === 'siswa') && (
              <DataMurid
                currentUser={currentUser}
                onResetStudentPassword={handleResetStudentPassword}
              />
            )}

            {activeTab === 'kbm' && <DataKBM currentUser={currentUser} />}

            {activeTab === 'tugas_tambahan' && (
              ['SUPER ADMIN', 'ADMIN', 'KEPALA SEKOLAH', 'WAKASEK'].includes(currentUser.role) ? (
                <ManajemenTugasTambahan currentUser={currentUser} />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✕</div>
                  <h3 className="font-bold text-slate-800 text-base">Akses Terbatas</h3>
                  <p className="text-xs text-slate-500">Menu Tugas Tambahan & Jam Mengajar hanya dapat diakses oleh Super Admin, Admin, Kepala Sekolah, dan Wakasek Kurikulum.</p>
                  <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl">Kembali ke Dashboard</button>
                </div>
              )
            )}

            {activeTab === 'banksoal' && <BankSoal currentUser={currentUser} />}

            {activeTab === 'ujian' && (
              <ManajemenUjian
                currentUser={currentUser}
                onOpenCatPortal={() => setIsCatPortalActive(true)}
              />
            )}

            {activeTab === 'presensi' && <PresensiSiswa currentUser={currentUser} />}

            {activeTab === 'pengumuman' && <Pengumuman currentUser={currentUser} />}

            {activeTab === 'akun' && <ManajemenAkun currentUser={currentUser} />}

            {activeTab === 'konfigurasi' && (
              currentUser.role === 'SUPER ADMIN' ? (
                <KonfigurasiSekolah
                  currentUser={currentUser}
                  onClose={() => setActiveTab('dashboard')}
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✕</div>
                  <h3 className="font-bold text-slate-800 text-base">Akses Terbatas</h3>
                  <p className="text-xs text-slate-500">Menu Konfigurasi Sekolah hanya dapat diakses oleh akun Super Administrator.</p>
                  <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl">Kembali ke Beranda</button>
                </div>
              )
            )}

            {(activeTab === 'gas_deploy' || activeTab === 'gas') && (
              currentUser.role === 'SUPER ADMIN' ? (
                <GASDeploymentPanel />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✕</div>
                  <h3 className="font-bold text-slate-800 text-base">Akses Terbatas</h3>
                  <p className="text-xs text-slate-500">Pusat Integrasi & Backend Google Apps Script (GAS) hanya dapat diakses oleh akun Super Administrator.</p>
                  <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl">Kembali ke Beranda</button>
                </div>
              )
            )}
          </div>

          {/* Footer Branding */}
          <footer className="h-10 bg-slate-50 border-t border-slate-200 px-6 sm:px-8 flex items-center justify-between text-[10px] font-medium text-slate-400 shrink-0">
            <p>
              © 2024 {configState.namaSekolah || 'Dinas Pendidikan Provinsi Jawa Barat'} -{' '}
              {configState.namaAplikasi || 'SMS JABAR'}
            </p>
            <p className="hidden sm:flex items-center gap-4 italic">
              <span>Status: Terhubung</span>
              <span>Tema: {configState.primaryColorTheme || 'Emerald'}</span>
            </p>
          </footer>
        </main>

        {/* Reset Student Password Modal */}
        {resetModalInfo && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 text-xs">
              <h3 className="text-base font-bold text-slate-900">
                Kata Sandi Siswa Berhasil Direset!
              </h3>
              <p className="text-slate-600 mt-1">
                Informasi kredensial baru untuk siswa binaan:
              </p>

              <div className="my-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                <div>
                  Nama Siswa: <strong>{resetModalInfo.siswaName}</strong>
                </div>
                <div>
                  NISN / Username: <span className="font-mono">{resetModalInfo.nisn}</span>
                </div>
                <div>
                  Password Sementara:{' '}
                  <span className="font-mono font-bold text-sm bg-amber-200 px-2 py-0.5 rounded text-amber-950">
                    {resetModalInfo.tempPass}
                  </span>
                </div>
              </div>

              <p className="text-slate-500 text-[11px]">
                Siswa akan diarahkan untuk membuat password baru saat login ke aplikasi.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                <button
                  onClick={() => setResetModalInfo(null)}
                  className="px-5 py-2.5 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Tutup & Selesai
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
