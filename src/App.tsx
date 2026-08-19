import React, { useState } from 'react';
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
import { GASDeploymentPanel } from './components/GASDeploymentPanel';
import { LoginView } from './components/LoginView';
import { RoleType, UserAccount } from './types';
import { dbService } from './services/mockDatabase';

export default function App() {
  const db = dbService.getState();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Active User Account state
  const [currentUser, setCurrentUser] = useState<UserAccount>(db.users[0]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isCatPortalActive, setIsCatPortalActive] = useState<boolean>(false);

  // Reset Student Password Alert modal
  const [resetModalInfo, setResetModalInfo] = useState<{
    siswaName: string;
    nisn: string;
    tempPass: string;
  } | null>(null);

  const handleRoleChange = (newRole: RoleType) => {
    // Find matching user for role or update current
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
    return <CATExamPortal onBackToApp={() => setIsCatPortalActive(false)} />;
  }

  // If not authenticated, render the requested login section
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
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
          activeTab={activeTab}
          onRoleChange={handleRoleChange}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          onOpenCatPortal={() => setIsCatPortalActive(true)}
          onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
          onLogout={() => setIsAuthenticated(false)}
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

          {activeTab === 'tugas_tambahan' && <ManajemenTugasTambahan currentUser={currentUser} />}

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

          {(activeTab === 'gas_deploy' || activeTab === 'gas') && <GASDeploymentPanel />}
        </div>

        {/* Footer Branding */}
        <footer className="h-10 bg-slate-50 border-t border-slate-200 px-6 sm:px-8 flex items-center justify-between text-[10px] font-medium text-slate-400 shrink-0">
          <p>© 2024 Dinas Pendidikan Provinsi Jawa Barat - Versi 3.1.0-Stable</p>
          <p className="hidden sm:flex items-center gap-4 italic">
            <span>Server Latency: 42ms</span>
            <span>Database: Spreadsheet Active (29 Sheets)</span>
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
  );
}
