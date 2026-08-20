import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  Menu,
  Shield,
  CheckCircle,
  User,
  KeyRound,
  LogOut,
  Sparkles,
  ExternalLink,
  Camera,
  Calendar,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { UserProfileModal } from './UserProfileModal';
import { KalenderPendidikanModal } from './KalenderPendidikanModal';
import { dbService } from '../services/mockDatabase';

interface NavbarProps {
  currentUser: UserAccount;
  canSimulateRole?: boolean;
  activeTab?: string;
  activeView?: string;
  onRoleChange?: (role: UserRole) => void;
  onSelectRole?: (role: UserRole) => void;
  onToggleMobileMenu?: () => void;
  onOpenCatPortal?: () => void;
  onUpdateCurrentUser?: (updatedUser: UserAccount) => void;
  onLogout?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  canSimulateRole = false,
  activeTab,
  activeView,
  onRoleChange,
  onSelectRole,
  onToggleMobileMenu,
  onOpenCatPortal,
  onUpdateCurrentUser,
  onLogout,
}) => {
  const db = dbService.getState();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isKalenderModalOpen, setIsKalenderModalOpen] = useState(false);
  const [currentTpDisplay, setCurrentTpDisplay] = useState({
    tahun: db.config.tahunPelajaran,
    semester: db.config.semester,
  });
  const [profileModalTab, setProfileModalTab] = useState<'profil' | 'password'>('profil');
  const [searchQuery, setSearchQuery] = useState('');

  const avatarDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const currentTab = activeTab || activeView || 'dashboard';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarDropdownRef.current &&
        !avatarDropdownRef.current.contains(event.target as Node)
      ) {
        setAvatarDropdownOpen(false);
      }
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    if (onRoleChange) onRoleChange(role);
    if (onSelectRole) onSelectRole(role);
    setRoleDropdownOpen(false);
  };

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Beranda';
      case 'guru':
        return 'Data Guru & Tenaga Kependidikan';
      case 'murid':
      case 'siswa':
        return 'Buku Induk Peserta Didik';
      case 'kbm':
        return 'Struktur KBM & Jadwal Pembelajaran';
      case 'tugas_tambahan':
        return 'Manajemen Tugas Tambahan & Beban Kerja (24 Jam)';
      case 'banksoal':
        return 'Bank Soal & Asesmen Digital';
      case 'ujian':
        return 'Manajemen Ujian & Token';
      case 'presensi':
        return 'Presensi Siswa Terpadu';
      case 'pengumuman':
        return 'Pusat Pengumuman & Edaran';
      case 'akun':
        return 'Manajemen Akun & Hak Akses';
      case 'gas_deploy':
      case 'gas':
        return 'Google Apps Script Deployment';
      default:
        return 'Beranda';
    }
  };

  const allRoles: UserRole[] = [
    'SUPER ADMIN',
    'ADMIN',
    'KEPALA SEKOLAH',
    'WAKASEK',
    'WALI KELAS',
    'GURU WALI',
    'GURU MAPEL',
    'SISWA',
  ];

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-base sm:text-lg text-slate-800 italic">
              {getTitle()}
            </h2>
            <button
              onClick={() => setIsKalenderModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 font-bold transition-all shadow-2xs cursor-pointer group"
              title="Buka Kalender Pendidikan & Pengaturan Tahun Pelajaran"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>TP {currentTpDisplay.tahun} - {currentTpDisplay.semester}</span>
              <ChevronDown className="w-3 h-3 text-emerald-600/70" />
            </button>
          </div>
        </div>

        {/* Right: Search, Role Switcher, Notification & Avatar with Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative hidden lg:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari data, murid, jadwal..."
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs w-44 xl:w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 placeholder-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Role Simulator Pill (Active ONLY for Super Admin) */}
          {canSimulateRole ? (
            <div className="relative" ref={roleDropdownRef}>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-full text-xs font-semibold text-amber-900 transition-colors cursor-pointer"
                title="Simulasi Hak Akses Role (Khusus Super Admin)"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline text-amber-700 font-normal">Simulasi Role:</span>
                <span className="text-amber-900 font-black max-w-[100px] truncate">{currentUser.role}</span>
                <ChevronDown className="w-3 h-3 text-amber-600" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ubah Simulasi Role:
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {allRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleSelect(role)}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          currentUser.role === role ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>{role}</span>
                        {currentUser.role === role && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Static Role Badge for all accounts below Super Admin */
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-2xs">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline text-slate-400 font-normal">Peran:</span>
              <span className="text-slate-900 font-bold max-w-[110px] truncate">{currentUser.role}</span>
            </div>
          )}

          {/* Notifications Icon */}
          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer hidden sm:block">
            <Bell className="w-4 h-4" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full border border-white font-bold">
              3
            </span>
          </button>

          {/* ===================================================================== */}
          {/* USER AVATAR ICON & PROFILE / CHANGE PASSWORD DROPDOWN */}
          {/* ===================================================================== */}
          <div className="relative border-l border-slate-200 pl-2 sm:pl-3" ref={avatarDropdownRef}>
            <button
              onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
              className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-full transition-colors group cursor-pointer focus:outline-none"
              title="Profil & Menu Pengguna"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-500/80 bg-slate-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  {currentUser.foto ? (
                    <img
                      src={currentUser.foto}
                      alt={currentUser.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                      {currentUser.nama.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Active Indicator Dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {avatarDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl border border-slate-200 shadow-2xl py-2 z-50 animate-in zoom-in-95 duration-100 text-xs">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-white">
                      {currentUser.foto ? (
                        <img src={currentUser.foto} alt={currentUser.nama} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center">
                          {currentUser.nama.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{currentUser.nama}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.username}</p>
                      <span className="inline-block mt-0.5 text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.2 rounded-full border border-emerald-100">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileModalTab('profil');
                      setIsProfileModalOpen(true);
                      setAvatarDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-emerald-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                    <span>Lihat & Ubah Profil (Upload Foto)</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileModalTab('password');
                      setIsProfileModalOpen(true);
                      setAvatarDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-amber-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                    <span>Ganti Kata Sandi</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-1"></div>

                {/* Logout / Switch */}
                <div className="px-2 py-1">
                  <button
                    onClick={() => {
                      setAvatarDropdownOpen(false);
                      if (onLogout) {
                        onLogout();
                      } else {
                        alert('Anda telah keluar dari sesi akun.');
                      }
                    }}
                    className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Profile & Password Modal */}
      <UserProfileModal
        currentUser={currentUser}
        isOpen={isProfileModalOpen}
        initialTab={profileModalTab}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateCurrentUser={(updated) => {
          if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
        }}
      />

      {/* Kalender Pendidikan & Jadwal Kedinasan Modal */}
      <KalenderPendidikanModal
        isOpen={isKalenderModalOpen}
        onClose={() => setIsKalenderModalOpen(false)}
        currentUser={currentUser}
        onTahunPelajaranChange={(tp, sem) => {
          setCurrentTpDisplay({ tahun: tp, semester: sem });
        }}
      />
    </>
  );
};
