import React, { useState, useEffect } from 'react';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  Palette,
  ShieldAlert,
  Save,
  CheckCircle2,
  RefreshCw,
  BellRing,
  ExternalLink,
  School,
  Lock,
  Sparkles,
  Sliders,
  Radio,
  FileCode2,
  MapPin,
  Compass,
  Navigation,
  LocateFixed,
  Clock,
  Calendar,
  Plus,
  Trash2,
} from 'lucide-react';
import { SystemConfig, UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';
import { useToast } from './Toast';

interface KonfigurasiSekolahProps {
  currentUser: UserAccount;
  onClose?: () => void;
}

export const KonfigurasiSekolah: React.FC<KonfigurasiSekolahProps> = ({ currentUser, onClose }) => {
  const { showToast } = useToast();
  const db = dbService.getState();

  const [activeTab, setActiveTab] = useState<'identitas' | 'lokasi' | 'jadwal_presensi' | 'logo' | 'tema' | 'maintenance' | 'notifikasi'>('identitas');

  // Form State
  const [namaSekolah, setNamaSekolah] = useState(db.config.namaSekolah || 'SMAN 1 KOTA BANDUNG - JAWA BARAT');
  const [namaAplikasi, setNamaAplikasi] = useState(db.config.namaAplikasi || 'Sistem Manajemen Sekolah Jawa Barat');
  const [sloganAplikasi, setSloganAplikasi] = useState(db.config.sloganAplikasi || 'Jawa Barat Juara Lahir Batin');
  const [npsn, setNpsn] = useState(db.config.npsn || '20219283');
  const [alamat, setAlamat] = useState(db.config.alamat || 'Jl. Ir. H. Juanda No. 93, Dago, Coblong, Kota Bandung');
  const [kabupatenKota, setKabupatenKota] = useState(db.config.kabupatenKota || 'Kota Bandung');
  const [provinsi, setProvinsi] = useState(db.config.provinsi || 'Jawa Barat');
  const [logoUrl, setLogoUrl] = useState(db.config.logoUrl || 'https://deskdik.jabarprov.go.id/assets/img/new-disdikjabar.png');
  const [primaryTheme, setPrimaryTheme] = useState<'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'slate'>(
    db.config.primaryColorTheme || 'emerald'
  );

  // Jadwal Presensi & Hari Libur State
  const jdw = db.config.jadwalPresensi || {
    jamMasukMulai: '06:00',
    jamMasukSelesai: '07:15',
    jamMasukToleransi: '07:30',
    jamPulangMulai: '14:00',
    jamPulangSelesai: '18:00',
    hariAktif: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    autoMarkAbsentIfNoExit: true,
  };

  const [jamMasukMulai, setJamMasukMulai] = useState(jdw.jamMasukMulai);
  const [jamMasukSelesai, setJamMasukSelesai] = useState(jdw.jamMasukSelesai);
  const [jamMasukToleransi, setJamMasukToleransi] = useState(jdw.jamMasukToleransi);
  const [jamPulangMulai, setJamPulangMulai] = useState(jdw.jamPulangMulai);
  const [jamPulangSelesai, setJamPulangSelesai] = useState(jdw.jamPulangSelesai);
  const [hariAktif, setHariAktif] = useState<string[]>(jdw.hariAktif || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  const [hariLiburList, setHariLiburList] = useState<Array<{ id: string; tanggal: string; keterangan: string }>>(
    db.config.hariLiburList || [
      { id: 'HLB-001', tanggal: '2026-08-17', keterangan: 'Hari Kemerdekaan Republik Indonesia' },
      { id: 'HLB-002', tanggal: '2026-05-01', keterangan: 'Hari Buruh Internasional' },
      { id: 'HLB-003', tanggal: '2026-12-25', keterangan: 'Hari Raya Natal & Libur Semester' },
    ]
  );

  const [newLiburTanggal, setNewLiburTanggal] = useState('');
  const [newLiburKet, setNewLiburKet] = useState('');

  // GPS Coordinates & Presensi Geofencing State (Super Admin Controlled)
  const [gpsLat, setGpsLat] = useState<number>(db.config.koordinatSekolah?.lat ?? -6.8905);
  const [gpsLng, setGpsLng] = useState<number>(db.config.koordinatSekolah?.lng ?? 107.6167);
  const [gpsRadius, setGpsRadius] = useState<number>(db.config.koordinatSekolah?.radiusMeters ?? 250);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Maintenance State
  const [isMaintenance, setIsMaintenance] = useState(db.config.maintenanceMode?.isEnabled || false);
  const [maintenanceMsg, setMaintenanceMsg] = useState(
    db.config.maintenanceMode?.message ||
      'Sistem Manajemen Sekolah sedang dalam pemeliharaan berkala untuk peningkatan performa. Mohon coba kembali beberapa saat lagi.'
  );
  const [maintenanceDoneTime, setMaintenanceDoneTime] = useState(
    db.config.maintenanceMode?.estimatedDone || '12:00 WIB'
  );

  // Push Notification State
  const [pushEnabled, setPushEnabled] = useState(db.config.pushNotificationConfig?.enabled || false);
  const [gasWebhookUrl, setGasWebhookUrl] = useState(
    db.config.pushNotificationConfig?.gasWebhookUrl ||
      'https://script.google.com/macros/s/AKfycbz_sms_jabar_notification_webhook/exec'
  );
  const [notifyExam, setNotifyExam] = useState(db.config.pushNotificationConfig?.notifyExam ?? true);
  const [notifyAnnouncement, setNotifyAnnouncement] = useState(db.config.pushNotificationConfig?.notifyAnnouncement ?? true);
  const [notifyAttendance, setNotifyAttendance] = useState(db.config.pushNotificationConfig?.notifyAttendance ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(logoUrl);

  const presetLogos = [
    {
      name: 'Logo Disdik Jawa Barat',
      url: 'https://deskdik.jabarprov.go.id/assets/img/new-disdikjabar.png',
    },
    {
      name: 'Tut Wuri Handayani',
      url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png',
    },
    {
      name: 'Provinsi Jawa Barat',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Coat_of_arms_of_West_Java.svg/450px-Coat_of_arms_of_West_Java.svg.png',
    },
  ];

  const colorThemes = [
    { id: 'emerald', name: 'Emerald Jabar', bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-500' },
    { id: 'blue', name: 'Ocean Cadisdik', bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-500' },
    { id: 'indigo', name: 'Royal Indigo', bg: 'bg-indigo-600', text: 'text-indigo-700', border: 'border-indigo-500' },
    { id: 'amber', name: 'Sunset Amber', bg: 'bg-amber-600', text: 'text-amber-700', border: 'border-amber-500' },
    { id: 'rose', name: 'Crimson Rose', bg: 'bg-rose-600', text: 'text-rose-700', border: 'border-rose-500' },
    { id: 'slate', name: 'Modern Slate', bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-700' },
  ];

  // Handle Logo Upload from Local Device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran berkas logo maksimal 2 MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoUrl(base64);
      setImagePreview(base64);
      showToast('Logo berhasil dimuat dari perangkat lokal', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast('Perangkat / Browser ini tidak mendukung fitur Geolocation GPS', 'error');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingGps(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setGpsLat(lat);
        setGpsLng(lng);
        showToast(`Koordinat GPS berhasil dideteksi: ${lat}, ${lng} (Akurasi ±${Math.round(position.coords.accuracy)}m)`, 'success');
      },
      (error) => {
        setIsDetectingGps(false);
        showToast(`Gagal membaca GPS: ${error.message}. Pastikan izin lokasi aktif.`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveAll = () => {
    setIsSaving(true);

    const updatedConfig: Partial<SystemConfig> = {
      namaSekolah,
      namaAplikasi,
      sloganAplikasi,
      npsn,
      alamat,
      kabupatenKota,
      provinsi,
      logoUrl,
      primaryColorTheme: primaryTheme,
      koordinatSekolah: {
        lat: Number(gpsLat) || -6.8905,
        lng: Number(gpsLng) || 107.6167,
        radiusMeters: Number(gpsRadius) || 250,
      },
      jadwalPresensi: {
        jamMasukMulai,
        jamMasukSelesai,
        jamMasukToleransi,
        jamPulangMulai,
        jamPulangSelesai,
        hariAktif,
        autoMarkAbsentIfNoExit: true,
      },
      hariLiburList,
      maintenanceMode: {
        isEnabled: isMaintenance,
        message: maintenanceMsg,
        estimatedDone: maintenanceDoneTime,
        allowedRoles: ['SUPER ADMIN'],
      },
      pushNotificationConfig: {
        enabled: pushEnabled,
        gasWebhookUrl,
        notifyExam,
        notifyAnnouncement,
        notifyAttendance,
      },
    };

    dbService.updateConfig(updatedConfig);

    setTimeout(() => {
      setIsSaving(false);
      showToast('Konfigurasi Identitas, Titik Koordinat GPS, Logo & Mode Pemeliharaan berhasil disimpan!', 'success');
      if (onClose) onClose();
    }, 400);
  };

  // Test Browser Notification
  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      showToast('Browser ini tidak mendukung Web Notifications API', 'error');
      return;
    }

    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      try {
        new Notification(`🔔 ${namaAplikasi}`, {
          body: `Uji coba sistem notifikasi sekolah berhasil! Sistem siap mengirim pengumuman dan jadwal ujian.`,
          icon: logoUrl,
        });
        showToast('Notifikasi uji coba berhasil dikirim ke browser Anda!', 'success');
      } catch (err) {
        showToast('Notifikasi gagal ditampilkan: Periksa izin notifikasi browser', 'error');
      }
    } else {
      showToast('Izin notifikasi browser belum diberikan oleh pengguna.', 'warning');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Konfigurasi & Branding Sekolah</span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">
                Super Admin
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Kustomisasi logo instansi, nama aplikasi, tema warna tampilan, dan mode pemeliharaan sistem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
          )}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Simpan Konfigurasi</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('identitas')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'identitas'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Identitas Sekolah & Aplikasi</span>
        </button>

        <button
          onClick={() => setActiveTab('lokasi')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'lokasi'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Titik Koordinat & Radius GPS Presensi</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded-md">
            Geofence
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jadwal_presensi')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'jadwal_presensi'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan Jam & Hari Libur Presensi</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.2 rounded-md">
            Wajib Absen
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logo')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'logo'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Upload & Kelola Logo</span>
        </button>

        <button
          onClick={() => setActiveTab('tema')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tema'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Pengaturan Tema Warna</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'border-amber-600 text-amber-900 font-bold bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Mode Maintenance</span>
          {isMaintenance && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('notifikasi')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'notifikasi'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Push Notification (GAS)</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* TAB 1: IDENTITAS */}
        {activeTab === 'identitas' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Profil & Nama Instansi</h3>
              <p className="text-xs text-slate-500">
                Nama sekolah dan judul aplikasi akan tampil di navbar atas, menu samping, dan laporan resmi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Aplikasi / Sistem
                </label>
                <input
                  type="text"
                  value={namaAplikasi}
                  onChange={(e) => setNamaAplikasi(e.target.value)}
                  placeholder="Contoh: Sistem Manajemen Sekolah Jawa Barat"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slogan / Tagline Aplikasi
                </label>
                <input
                  type="text"
                  value={sloganAplikasi}
                  onChange={(e) => setSloganAplikasi(e.target.value)}
                  placeholder="Contoh: Jawa Barat Juara Lahir Batin"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Resmi Sekolah / Satuan Pendidikan
                </label>
                <input
                  type="text"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  placeholder="Contoh: SMAN 1 KOTA BANDUNG"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Pokok Sekolah Nasional (NPSN)
                </label>
                <input
                  type="text"
                  value={npsn}
                  onChange={(e) => setNpsn(e.target.value)}
                  placeholder="8 Digit NPSN"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={kabupatenKota}
                  onChange={(e) => setKabupatenKota(e.target.value)}
                  placeholder="Kota Bandung"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap Sekolah
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Ir. H. Juanda No. 93..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: TITIK KOORDINAT & RADIUS GPS PRESENSI */}
        {activeTab === 'lokasi' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Titik Pusat & Geofencing GPS Presensi</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold">
                    Super Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Siswa yang melakukan presensi mandiri wajib berada di dalam radius lingkaran koordinat ini. Jika berada di luar koordinat, sistem akan otomatis menolak presensi.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetectingGps}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isDetectingGps ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <LocateFixed className="w-4 h-4 text-emerald-400" />
                )}
                <span>Dapatkan Koordinat GPS Saat Ini</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Latitude Pusat Sekolah</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={gpsLat}
                  onChange={(e) => setGpsLat(parseFloat(e.target.value) || 0)}
                  placeholder="-6.890500"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Contoh: -6.890500 (Kota Bandung)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Longitude Pusat Sekolah</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={gpsLng}
                  onChange={(e) => setGpsLng(parseFloat(e.target.value) || 0)}
                  placeholder="107.616700"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 107.616700 (Jawa Barat)</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Radius Maksimal Kehadiran yang Diizinkan:</span>
                  <span className="text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {gpsRadius} Meter
                  </span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={gpsRadius}
                  onChange={(e) => setGpsRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>50m (Sangat Ketat / Hanya Kelas)</span>
                  <span>250m (Standar Kampus Sekolah)</span>
                  <span>1000m+ (Area Luas)</span>
                </div>
              </div>
            </div>

            {/* Live Visual Geofence Map Summary Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Geofence Aktif Validasi Presensi
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700">
                  Status: Strict Geofencing Enforced
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400">Titik Koordinat</div>
                  <div className="font-mono font-bold text-emerald-300 mt-0.5">{gpsLat}, {gpsLng}</div>
                </div>
                <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400">Toleransi Jarak</div>
                  <div className="font-mono font-bold text-amber-300 mt-0.5">Maks. {gpsRadius} Meter</div>
                </div>
                <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400">Tindakan Pelanggaran</div>
                  <div className="font-semibold text-rose-400 mt-0.5">Tolak Presensi Otomatis</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 leading-relaxed">
                ℹ️ <strong>Aturan Validasi:</strong> Siswa tidak akan dapat menekan tombol &apos;Kirim Presensi Hadir&apos; jika perangkat GPS mereka mendeteksi jarak lebih besar dari <strong>{gpsRadius} meter</strong> dari koordinat pusat sekolah.
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Preset Koordinat Sekolah Percontohan di Jawa Barat
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGpsLat(-6.8905);
                    setGpsLng(107.6167);
                    setGpsRadius(250);
                    showToast('Preset Kampus SMAN 1 Bandung dimuat', 'info');
                  }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800">SMAN 1 Bandung</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">-6.890500, 107.616700 (250m)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGpsLat(-6.9038);
                    setGpsLng(107.6186);
                    setGpsRadius(200);
                    showToast('Preset SMAN 3 Bandung dimuat', 'info');
                  }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800">SMAN 3 Bandung</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">-6.903800, 107.618600 (200m)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGpsLat(-6.9147);
                    setGpsLng(107.6098);
                    setGpsRadius(300);
                    showToast('Preset Disdik Jabar Jl. Radjiman dimuat', 'info');
                  }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800">Disdik Jabar Radjiman</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">-6.914700, 107.609800 (300m)</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: JADWAL & HARI LIBUR PRESENSI */}
        {activeTab === 'jadwal_presensi' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Jam & Hari Libur Presensi Siswa</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur rentang jam absen masuk, jam absen pulang, hari aktif sekolah, serta kalender libur nasional/sekolah.
              </p>
            </div>

            {/* Config Card: Jam Presensi */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>1. Batas Jam Presensi Masuk & Pulang</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Jam Masuk */}
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                  <div className="font-bold text-xs text-emerald-950 flex items-center justify-between">
                    <span>Absen Masuk (Pagi)</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono">Wajib Absen 1</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600">Jam Mulai</label>
                      <input
                        type="time"
                        value={jamMasukMulai}
                        onChange={(e) => setJamMasukMulai(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600">Jam Selesai</label>
                      <input
                        type="time"
                        value={jamMasukSelesai}
                        onChange={(e) => setJamMasukSelesai(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600">Batas Toleransi</label>
                      <input
                        type="time"
                        value={jamMasukToleransi}
                        onChange={(e) => setJamMasukToleransi(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-900/80 leading-relaxed">
                    *Siswa yang absen setelah <strong>{jamMasukSelesai}</strong> hingga <strong>{jamMasukToleransi}</strong> akan dicatat status <strong>TERLAMBAT</strong>.
                  </p>
                </div>

                {/* Jam Pulang */}
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                  <div className="font-bold text-xs text-blue-950 flex items-center justify-between">
                    <span>Absen Pulang (Sore)</span>
                    <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-mono">Wajib Absen 2</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600">Jam Mulai Pulang</label>
                      <input
                        type="time"
                        value={jamPulangMulai}
                        onChange={(e) => setJamPulangMulai(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600">Jam Batas Akhir</label>
                      <input
                        type="time"
                        value={jamPulangSelesai}
                        onChange={(e) => setJamPulangSelesai(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-900/80 leading-relaxed">
                    *Siswa diwajibkan melakukan Absen Pulang dari jam <strong>{jamPulangMulai}</strong> sampai <strong>{jamPulangSelesai}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Config Card: Hari Aktif */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>2. Hari Aktif Presensi (Senin - Minggu)</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((hari) => {
                  const isChecked = hariAktif.includes(hari);
                  return (
                    <button
                      key={hari}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setHariAktif(hariAktif.filter((h) => h !== hari));
                        } else {
                          setHariAktif([...hariAktif, hari]);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : null}
                      <span>{hari}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Config Card: Daftar Hari Libur */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-600" />
                    <span>3. Kalender Hari Libur Sekolah / Nasional</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Siswa tidak dapat presensi pada tanggal yang terdaftar sebagai hari libur.
                  </p>
                </div>
              </div>

              {/* Form Tambah Libur */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="date"
                  value={newLiburTanggal}
                  onChange={(e) => setNewLiburTanggal(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Keterangan (misal: Hari Raya Idul Fitri / Libur Semester)"
                  value={newLiburKet}
                  onChange={(e) => setNewLiburKet(e.target.value)}
                  className="w-full flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newLiburTanggal || !newLiburKet.trim()) {
                      showToast('Isi tanggal dan keterangan hari libur!', 'error');
                      return;
                    }
                    const newEntry = {
                      id: `HLB-${Date.now()}`,
                      tanggal: newLiburTanggal,
                      keterangan: newLiburKet.trim(),
                    };
                    setHariLiburList([...hariLiburList, newEntry]);
                    setNewLiburTanggal('');
                    setNewLiburKet('');
                    showToast('Hari libur berhasil ditambahkan to daftar.', 'success');
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Libur</span>
                </button>
              </div>

              {/* List Hari Libur */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {hariLiburList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Belum ada hari libur khusus terdaftar.</p>
                ) : (
                  hariLiburList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200">
                          {item.tanggal}
                        </span>
                        <span className="font-semibold text-slate-800">{item.keterangan}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHariLiburList(hariLiburList.filter((h) => h.id !== item.id));
                          showToast('Hari libur dihapus.', 'info');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOGO */}
        {activeTab === 'logo' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Logo Resmi Sekolah & Banner Login</h3>
              <p className="text-xs text-slate-500">
                Unggah gambar logo sekolah format PNG/JPG/SVG atau pilih dari preset logo standar Jawa Barat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Preview Box */}
              <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-widest">
                  Pratinjau Logo Aktif
                </span>
                <div className="w-28 h-28 bg-white rounded-2xl border-2 border-dashed border-slate-300 p-2 flex items-center justify-center shadow-xs overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Pratinjau Logo"
                      className="max-w-full max-h-full object-contain"
                      onError={() => setImagePreview('https://placehold.co/120x120/f1f5f9/475569?text=Logo')}
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-3">
                  Format transparan (PNG) direkomendasikan
                </p>
              </div>

              {/* Upload & Preset Options */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Unggah Logo dari Komputer / HP
                  </label>
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 border-dashed rounded-xl cursor-pointer font-bold text-xs transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Pilih Berkas Gambar (PNG, JPG, SVG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Atau Masukkan URL Gambar Langsung
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => {
                        setLogoUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://..."
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Gunakan Preset Logo Resmi Jawa Barat
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {presetLogos.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setLogoUrl(preset.url);
                          setImagePreview(preset.url);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          logoUrl === preset.url
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="h-8 object-contain" />
                        <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TEMA WARNA */}
        {activeTab === 'tema' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Palet Warna Aplikasi</h3>
              <p className="text-xs text-slate-500">
                Pilih tema warna dominan untuk tombol, lencana, navigasi aktif, dan aksen visual portal sekolah.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {colorThemes.map((theme) => {
                const isSelected = primaryTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setPrimaryTheme(theme.id as any)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? `${theme.border} bg-slate-50 shadow-md ring-2 ring-slate-900/10`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${theme.bg} shadow-xs shrink-0 flex items-center justify-center text-white`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{theme.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{theme.id} theme</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>Tips Tampilan:</strong> Warna tema Emerald Jabar adalah warna resmi khas Dinas Pendidikan Provinsi Jawa Barat yang selaras dengan panduan brand Disdik Jabar Juara.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MAINTENANCE MODE */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Status Mode Pemeliharaan (Maintenance)</span>
                  {isMaintenance && (
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                      Aktif - Akses Terkunci
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Saat diaktifkan, pengguna umum (guru, siswa, wali) akan dialihkan ke layar pemeliharaan dengan pesan kustom.
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMaintenance}
                  onChange={(e) => setIsMaintenance(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Pemeliharaan untuk Pengguna
                </label>
                <textarea
                  rows={3}
                  value={maintenanceMsg}
                  onChange={(e) => setMaintenanceMsg(e.target.value)}
                  placeholder="Tuliskan alasan pemeliharaan server..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimasi Selesai Pemeliharaan
                </label>
                <input
                  type="text"
                  value={maintenanceDoneTime}
                  onChange={(e) => setMaintenanceDoneTime(e.target.value)}
                  placeholder="Contoh: 14:00 WIB atau 21 Agustus 2024"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Kewenangan Super Admin Selama Maintenance:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Super Admin tetap dapat masuk dan membuka seluruh modul untuk melakukan backup data, perbaikan struktur spreadsheet, atau pemulihan akun tanpa terblokir oleh layar pemeliharaan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PUSH NOTIFICATION */}
        {activeTab === 'notifikasi' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sistem Notifikasi Push Browser & Google Apps Script</h3>
              <p className="text-xs text-slate-500">
                Kirimkan peringatan instan ke perangkat laptop & HP guru/siswa untuk jadwal ujian penting atau edaran dinas.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Aktifkan Notifikasi Push Browser</div>
                <div className="text-[11px] text-slate-500">
                  Meminta izin Web Notification saat guru dan siswa membuka portal
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Pemicu Notifikasi Otomatis
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyExam}
                    onChange={(e) => setNotifyExam(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Rilis Token Ujian & Jadwal Asesmen CAT Baru</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAnnouncement}
                    onChange={(e) => setNotifyAnnouncement(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Pengumuman Penting & Edaran Kepala Sekolah / Cadisdik</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAttendance}
                    onChange={(e) => setNotifyAttendance(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Pengingat Presensi Mandiri (Pukul 06:45 - 07:15 WIB)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Webhook Google Apps Script (Backend GAS Push Gateway)
              </label>
              <input
                type="text"
                value={gasWebhookUrl}
                onChange={(e) => setGasWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Test Trigger Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <BellRing className="w-4 h-4 text-amber-400" />
                <span>Kirim Notifikasi Uji Coba Sekarang</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
