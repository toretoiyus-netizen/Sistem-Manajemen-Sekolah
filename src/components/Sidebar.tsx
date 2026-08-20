import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  HelpCircle,
  FileCheck2,
  CalendarCheck,
  Megaphone,
  UserCog,
  ShieldCheck,
  User,
  FolderTree,
  FileSpreadsheet,
  Code2,
  MonitorCheck,
  X,
  Briefcase,
  Building2,
  Palette,
} from 'lucide-react';
import { UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';

interface SidebarProps {
  currentUser: UserAccount;
  activeTab?: string;
  activeView?: string;
  setActiveTab?: (tab: string) => void;
  onNavigate?: (view: string) => void;
  onOpenCatPortal?: () => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  activeView,
  setActiveTab,
  onNavigate,
  onOpenCatPortal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const db = dbService.getState();
  const currentActive = activeTab || activeView || 'dashboard';
  const handleNav = (id: string) => {
    if (setActiveTab) setActiveTab(id);
    if (onNavigate) onNavigate(id);
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const role = currentUser.role;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
      badge: 'Statistik',
    },
    {
      id: 'guru',
      label: 'Data Guru',
      icon: GraduationCap,
      show: dbService.checkPermission(currentUser, 'guru.view'),
    },
    {
      id: 'murid',
      alias: 'siswa',
      label: role === 'WALI KELAS' ? 'Siswa Rombel' : role === 'GURU WALI' ? 'Siswa Binaan' : 'Data Murid',
      icon: Users,
      show: dbService.checkPermission(currentUser, 'siswa.view'),
      badge: role === 'WALI KELAS' || role === 'GURU WALI' ? 'Khusus' : undefined,
    },
    {
      id: 'kbm',
      label: role === 'SISWA' ? 'Jadwal KBM Siswa' : 'Data KBM',
      icon: BookOpen,
      show: role !== 'GURU MAPEL' && dbService.checkPermission(currentUser, 'kbm.view'),
    },
    {
      id: 'tugas_tambahan',
      label: 'Tugas Tambahan & Jam Mengajar',
      icon: Briefcase,
      show:
        role === 'SUPER ADMIN' ||
        role === 'ADMIN' ||
        role === 'KEPALA SEKOLAH' ||
        role === 'WAKASEK' ||
        ((currentUser as any).tugasTambahan && (currentUser as any).tugasTambahan.includes('Wakasek')),
      badge: '24 Jam',
    },
    {
      id: 'banksoal',
      label: 'Bank Soal',
      icon: HelpCircle,
      show: dbService.checkPermission(currentUser, 'banksoal.view'),
      badge: 'AI',
    },
    {
      id: 'ujian',
      label: role === 'SISWA' ? 'Ujian Saya' : 'Manajemen Ujian',
      icon: FileCheck2,
      show: dbService.checkPermission(currentUser, 'ujian.view'),
    },
    {
      id: 'presensi',
      label: role === 'SISWA' ? 'Presensi Mandiri' : 'Presensi Siswa',
      icon: CalendarCheck,
      show: dbService.checkPermission(currentUser, 'presensi.view'),
      badge: 'GPS/QR',
    },
    {
      id: 'pengumuman',
      label: 'Pengumuman',
      icon: Megaphone,
      show: dbService.checkPermission(currentUser, 'pengumuman.view'),
    },
    {
      id: 'akun',
      label: 'Manajemen Akun',
      icon: UserCog,
      show: dbService.checkPermission(currentUser, 'akun.view') || dbService.checkPermission(currentUser, 'akun.reset_password'),
    },
    {
      id: 'konfigurasi',
      label: 'Konfigurasi Sekolah',
      icon: Building2,
      show: role === 'SUPER ADMIN',
      badge: 'Admin',
    },
    {
      id: 'gas_deploy',
      alias: 'gas',
      label: 'GAS Deployment',
      icon: Code2,
      show: role === 'SUPER ADMIN',
      badge: 'Super Admin',
    },
    {
      id: 'audit_akses',
      label: 'Audit Akses & RBAC',
      icon: ShieldCheck,
      show: role === 'SUPER ADMIN' || role === 'ADMIN',
      badge: 'Security',
    },
  ];

  const sidebarContent = (
    <div className="w-64 bg-[#1e293b] flex flex-col h-full shrink-0 shadow-xl select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700/50 bg-[#0f172a]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-white/10 rounded-xl p-1 flex items-center justify-center shrink-0 border border-white/10">
            {db.config.logoUrl ? (
              <img src={db.config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="leading-tight min-w-0 flex-1">
            <h1 className="text-white font-bold text-xs tracking-wide uppercase truncate">
              {db.config.namaAplikasi || 'SMS JABAR'}
            </h1>
            <p className="text-emerald-400 text-[10px] font-medium truncate">
              {db.config.sloganAplikasi || db.config.namaSekolah || 'Jawa Barat Juara'}
            </p>
          </div>
        </div>
        {setIsMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* CAT Quick Launcher button */}
      {onOpenCatPortal && (
        <div className="px-3 pt-3">
          <button
            onClick={onOpenCatPortal}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <MonitorCheck className="w-4 h-4 text-slate-950" />
            <span>Ruang CAT Ujian</span>
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-1.5 tracking-widest">
          Navigation
        </div>

        {menuItems.map((item) => {
          if (!item.show) return null;
          const Icon = item.icon;
          const isActive = currentActive === item.id || (item.alias && currentActive === item.alias);

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-[#334155] text-white font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#38bdf8]' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                    isActive ? 'bg-slate-700 text-[#38bdf8]' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card at Bottom */}
      <div className="mt-auto p-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 p-2 bg-[#0f172a] rounded-xl border border-slate-800/80">
          <div className="w-9 h-9 rounded-full bg-emerald-500 border-2 border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {currentUser.nama ? currentUser.nama.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentUser.nama}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter truncate">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
