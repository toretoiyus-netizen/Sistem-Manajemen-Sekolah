export type UserRole =
  | 'SUPER ADMIN'
  | 'ADMIN'
  | 'KEPALA SEKOLAH'
  | 'WAKASEK'
  | 'WALI KELAS'
  | 'GURU WALI'
  | 'GURU MAPEL'
  | 'SISWA';

export type RoleType = UserRole;

export type AdditionalDuty =
  | 'Kepala Sekolah'
  | 'Wakasek Kurikulum'
  | 'Wakasek Kesiswaan'
  | 'Wakasek Sarpras'
  | 'Wakasek Humas'
  | 'Wali Kelas'
  | 'Guru Wali'
  | 'Tidak Ada Tugas Tambahan';

export type JenisSoal =
  | 'Pilihan Ganda'
  | 'Pilihan Ganda Kompleks'
  | 'Benar/Salah'
  | 'Isian'
  | 'Isian Singkat'
  | 'Essay';

export type TingkatKesulitan = 'Mudah' | 'Sedang' | 'Sukar';

export type JenisUjian =
  | 'Ulangan Harian'
  | 'Tugas'
  | 'PTS / Ujian Tengah Semester'
  | 'PAS / Ujian Semester'
  | 'PAS / Akhir Semester'
  | 'UAS'
  | 'Ujian Akhir Semester'
  | 'Ujian Lainnya';

export type PresensiMethod =
  | 'RFID'
  | 'Selfie'
  | 'Lock Location/GPS'
  | 'Barcode/QR Code'
  | 'Manual Guru'
  | 'GPS'
  | 'QR Code'
  | 'Mandiri Siswa (GPS & Selfie)'
  | 'Presensi Mandiri Siswa (GPS & Selfie)'
  | 'Mandiri Siswa (Masuk)'
  | 'Mandiri Siswa (Pulang)';

export type PresensiStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Alpa';

export interface UserAccount {
  id: string;
  username: string; // NIP / NIK / NISN / admin
  nama: string;
  role: UserRole;
  email: string;
  nomorHp: string;
  foto?: string;
  status: 'Aktif' | 'Nonaktif';
  lastLogin?: string;
  mustChangePassword?: boolean;
  referenceId?: string; // ID Guru or ID Siswa
  customPermissions?: string[];
  createdAt: string;
}

export interface Guru {
  id: string; // GURU-000001
  nip: string;
  nik: string;
  nama: string;
  gelar: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  nomorHp: string;
  email: string;
  mataPelajaranUtama: string;
  statusKepegawaian: 'PNS' | 'PPPK' | 'GTT' | 'Guru Tetap Yayasan';
  tugasTambahan: AdditionalDuty;
  role: UserRole;
  foto: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface SiswaDocument {
  id: string;
  namaFile: string;
  jenis: 'Foto' | 'KK' | 'Akta Lahir' | 'KTP Orang Tua' | 'Ijazah' | 'Surat Keterangan';
  driveFileId: string;
  url: string;
  tanggalUpload: string;
}

export interface Siswa {
  id: string; // SIS-000001
  nis: string;
  nisn: string;
  nik: string;
  namaLengkap: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  nomorHp: string;
  email: string;
  namaOrangTua: string;
  namaIbu: string;
  nomorHpOrangTua: string;
  kelas: string; // e.g. "10", "11", "12"
  rombel: string; // e.g. "X IPA 1", "XI RPL 2"
  rombelId?: string;
  guruWaliId: string; // reference to Guru ID
  guruWaliNama?: string;
  waliKelasId: string; // reference to Guru ID
  foto: string;
  status: 'Aktif' | 'Nonaktif';
  dokumen: SiswaDocument[];
}

export interface MataPelajaran {
  id: string; // MAP-000001
  kodeMapel: string;
  namaMapel: string;
  kelompok: 'Umum' | 'Kejuruan / Peminatan' | 'Muatan Lokal (Bahasa Sunda)' | 'Pilihan';
  status: 'Aktif' | 'Nonaktif';
  guruPengampuId?: string[];
}

export interface Rombel {
  id: string; // ROM-000001
  namaRombel: string;
  tingkat: '10' | '11' | '12' | '7' | '8' | '9';
  jurusan: string; // e.g. "MIPA", "IPS", "Teknik Informatika", "Akuntansi", "Umum"
  tahunPelajaran: string; // e.g. "2024/2025"
  waliKelasId: string; // ID Guru
  guruWaliIds?: string[];
  status: 'Aktif' | 'Nonaktif';
}

export interface KBMSchedule {
  id: string; // KBM-000001
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamKe: number;
  jamMulai: string; // e.g. "07:30"
  jamSelesai: string; // e.g. "08:50"
  rombelId: string;
  mapelId: string;
  guruId: string;
  ruang: string;
  keterangan?: string;
}

export interface MediaHotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  keterangan: string;
}

export interface BankSoal {
  id: string; // SOAL-000001
  mapelId: string;
  mapelNama: string;
  kelas: string;
  materi: string;
  kompetensi: string;
  jenisSoal: JenisSoal;
  tingkatKesulitan: TingkatKesulitan;
  pertanyaan: string;
  // Media Lampiran
  mediaTipe?: 'none' | 'gambar' | 'gambar_interaktif' | 'video';
  mediaUrl?: string;
  mediaCaption?: string;
  mediaHotspots?: MediaHotspot[];
  pilihanA?: string;
  pilihanB?: string;
  pilihanC?: string;
  pilihanD?: string;
  pilihanE?: string;
  jawabanBenar: string; // e.g. "A", or array JSON for complex, or text for essay
  pembahasan?: string;
  bobot: number;
  folderId?: string;
  pembuatId: string;
  pembuatNama: string;
  status: 'Aktif' | 'Draft' | 'Arsip';
  createdAt: string;
}

export interface FolderBankSoal {
  id: string; // FOLD-000001
  namaFolder: string;
  mapelId?: string;
  mapelNama: string;
  tingkat: '10' | '11' | '12' | 'Semua';
  deskripsi?: string;
  totalSoal?: number;
  createdBy: string;
  createdAt: string;
}

export interface JadwalKedinasanEvent {
  id: string; // EVT-000001
  judul: string;
  kategori: 'Kalender Pendidikan' | 'Rapat Dinas' | 'Asesmen/Ujian' | 'Libur Nasional' | 'Kegiatan Sekolah' | 'MPLS' | 'Rapor & Evaluasi';
  tanggalMulai: string; // YYYY-MM-DD
  tanggalSelesai: string; // YYYY-MM-DD
  keterangan: string;
  lokasi?: string;
  penanggungJawab: string;
  targetAudience: 'Semua' | 'Guru' | 'Siswa' | 'Tendik' | 'Wali Murid';
  warnaBadge?: string;
}

export interface TahunPelajaranConfig {
  id: string;
  tahun: string; // e.g. "2024/2025"
  semester: 'Ganjil' | 'Genap';
  isAktif: boolean;
  tanggalMulai: string;
  tanggalSelesai: string;
}

export interface Ujian {
  id: string; // UJIAN-000001
  namaUjian: string;
  jenis: JenisUjian;
  mapelId: string;
  mapelNama: string;
  kelas: string;
  rombelIds: string[]; // List of rombels allowed
  pembuatId: string;
  pembuatNama: string;
  durasiMenit: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  soalIds: string[];
  nilaiMinimum: number; // KKM e.g. 75
  acakSoal: boolean;
  acakJawaban: boolean;
  tokenRequired: boolean;
  currentToken: string;
  tokenExpiredAt?: string;
  status: 'Draft' | 'Published' | 'Selesai' | 'Arsip';
  linkKhusus: string;
  modeMasuk: 'Token' | 'Akun Siswa' | 'Kombinasi';
  targetSiswaIds?: string[];
  antiCheat: {
    enforceFullscreen: boolean;
    detectTabSwitch: boolean;
    blockCopyPaste: boolean;
    blockContextMenu: boolean;
    autoSubmitOnTimeUp: boolean;
  };
}

export interface JawabanItem {
  soalId: string;
  jawabanSiswa: string;
  isFlagged: boolean; // ragu-ragu / ditandai
  isCorrect?: boolean;
  scoreAwarded?: number;
  updatedAt: string;
}

export interface PesertaUjianSession {
  id: string;
  ujianId: string;
  siswaId: string;
  nisn: string;
  namaSiswa: string;
  rombelNama: string;
  status: 'Belum Mengerjakan' | 'Sedang Mengerjakan' | 'Sudah Selesai';
  waktuMulai?: string;
  waktuSelesai?: string;
  sisaDetik?: number;
  jawaban: Record<string, JawabanItem>;
  nilaiAkhir?: number;
  isLulus?: boolean;
  violationsCount: number; // anti-cheating warning counts
  submittedAt?: string;
}

export interface PresensiRecord {
  id: string; // PRE-000001
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  nisn: string;
  namaSiswa: string;
  rombelId: string;
  rombelNama: string;
  status: PresensiStatus;
  metode: PresensiMethod;
  jamMasuk?: string;
  jamPulang?: string;
  statusMasuk?: 'Tepat Waktu' | 'Terlambat';
  statusPulang?: 'Sudah Pulang' | 'Belum Pulang' | 'Tidak Absen Pulang';
  waktuPresensi?: string;
  waktuPresensiMasuk?: string;
  waktuPresensiPulang?: string;
  mapelId?: string;
  guruId?: string;
  lokasi?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    isWithinSchoolRadius: boolean;
  };
  lokasiPulang?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    isWithinSchoolRadius: boolean;
  };
  fotoSelfie?: string;
  fotoSelfiePulang?: string;
  rfidCardNumber?: string;
  keterangan?: string;
  lampiranSurat?: string;
}

export interface IzinSakitSubmission {
  id: string;
  siswaId: string;
  nisn: string;
  namaSiswa: string;
  rombelNama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  kategori: 'Izin' | 'Sakit';
  alasan: string;
  lampiranFoto?: string;
  statusPersetujuan: 'Menunggu' | 'Disetujui' | 'Ditolak';
  disetujuiOleh?: string;
  catatan?: string;
  createdAt: string;
}

export interface Pengumuman {
  id: string; // PENG-000001
  judul: string;
  isi?: string;
  konten?: string;
  kategori?: 'Akademik' | 'Kegiatan' | 'Darurat' | 'Tata Tertib';
  isPinned?: boolean;
  lampiranUrl?: string;
  pembuatId?: string;
  pembuatNama?: string;
  pembuatRole?: UserRole;
  penulisId?: string;
  penulisNama?: string;
  target:
    | 'SEMUA'
    | 'GURU'
    | 'SISWA'
    | 'WALI KELAS'
    | 'Semua Guru'
    | 'Semua Siswa'
    | 'Semua Akun'
    | 'Wali Kelas'
    | 'Guru Wali'
    | 'Guru Mapel'
    | 'Rombel Tertentu'
    | 'Role Tertentu'
    | string;
  targetSpecificRoles?: UserRole[];
  targetRombelIds?: string[];
  targetSiswaIds?: string[];
  tanggal?: string;
  tanggalMulai?: string;
  tanggalBerakhir?: string;
  status: 'Aktif' | 'Selesai' | 'Draft' | 'Published';
  prioritas?: 'Biasa' | 'Penting' | 'Mendesak';
  createdAt: string;
}

export interface UserSocialMedia {
  id: string;
  platform: 'Instagram' | 'Facebook' | 'TikTok' | 'YouTube' | 'Website' | 'X / Twitter' | 'LinkedIn' | 'Lainnya';
  url: string;
}

export interface UserProfileData {
  userId: string;
  foto: string;
  nama: string;
  nomorHp: string;
  nomorHpDarurat: string;
  email: string;
  alamat: string;
  bio?: string;
  socialMedia: UserSocialMedia[];
}

export interface SystemConfig {
  namaSekolah: string;
  namaAplikasi?: string;
  sloganAplikasi?: string;
  npsn: string;
  alamat: string;
  kabupatenKota: string;
  provinsi: string;
  logoUrl: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  zonaWaktu: string;
  metodePresensiDefault: PresensiMethod[];
  koordinatSekolah: {
    lat: number;
    lng: number;
    radiusMeters: number;
    namaLokasi?: string;
  };
  jadwalPresensi?: {
    jamMasukMulai: string; // e.g. "06:00"
    jamMasukSelesai: string; // e.g. "07:30" (batas on-time)
    jamMasukToleransi: string; // e.g. "08:00" (batas terlambat)
    jamPulangMulai: string; // e.g. "14:00"
    jamPulangSelesai: string; // e.g. "18:00"
    hariAktif: string[]; // e.g. ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
    autoMarkAbsentIfNoExit: boolean; // Jika tidak absen pulang otomatis dianggap tidak hadir / alpa
  };
  hariLiburList?: Array<{
    id: string;
    tanggal: string; // YYYY-MM-DD
    keterangan: string;
  }>;
  gasConfig?: {
    webAppUrl: string;
    spreadsheetId: string;
    isDeployed: boolean;
    lastPingTime?: string;
    lastPingStatus?: string;
  };
  allowedRolesForRoleMatrix?: UserRole[];
  allowedRolesForAuditTrail?: UserRole[];
  configVersion: string;
  databaseSpreadsheetId: string;
  rootGoogleDriveFolderId: string;
  primaryColorTheme?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'slate';
  maintenanceMode?: {
    isEnabled: boolean;
    message: string;
    estimatedDone: string;
    allowedRoles: UserRole[];
  };
  pushNotificationConfig?: {
    enabled: boolean;
    gasWebhookUrl: string;
    notifyExam: boolean;
    notifyAnnouncement: boolean;
    notifyAttendance: boolean;
  };
}

export interface RolePermissionDefinition {
  code: string;
  name: string;
  category: 'Dashboard' | 'Guru' | 'Siswa' | 'KBM' | 'Bank Soal' | 'Ujian' | 'Presensi' | 'Pengumuman' | 'Akun' | 'Role' | 'Audit & Keamanan';
  description: string;
}

export interface MasterTugasTambahan {
  id: string; // TT-001
  namaTugas: string;
  kategori: 'Pimpinan' | 'Manajemen' | 'Wali / Bimbingan' | 'Laboratorium / Sarpras' | 'Kesiswaan & Ekstrakurikuler';
  bebanJamEkuivalen: number; // e.g. 24, 12, 4, 2, dll
  keterangan: string;
  dasarHukum: string;
}

export interface PenugasanTugasTambahan {
  id: string; // PTT-001
  guruId: string;
  guruNama: string;
  tugasTambahanId: string;
  namaTugas: string;
  bebanJam: number;
  skPenugasan: string;
  tanggalSK: string;
  keterangan?: string;
  status: 'Aktif' | 'Selesai';
}

export interface BookingUjianCAT {
  id: string; // BCAT-000001
  ujianId: string;
  namaUjian: string;
  guruId: string;
  guruNama: string;
  mapelNama: string;
  ruanganLab: string; // e.g. "Lab Komputer 1 (40 Unit PC)", "Lab Komputer 2 (36 Unit PC)", "Ruang Server CBT"
  tanggalUjian: string; // YYYY-MM-DD
  sesiUjian: 'Sesi 1 (07:30 - 09:30)' | 'Sesi 2 (10:00 - 12:00)' | 'Sesi 3 (13:00 - 15:00)';
  jamMulai: string;
  jamSelesai: string;
  rombelTarget: string[];
  estimasiPeserta: number;
  tokenUjian: string;
  statusBooking: 'Diajukan' | 'Disetujui / Terjadwal' | 'Sedang Berlangsung' | 'Selesai' | 'Dibatalkan';
  catatanAdmin?: string;
  createdAt: string;
}

export interface PortofolioSiswaRecord {
  id: string; // PORT-000001
  siswaId: string;
  nisn: string;
  namaSiswa: string;
  ujianId: string;
  namaUjian: string;
  mapelNama: string;
  tanggalPelaksanaan: string;
  nilai: number; // 0 - 100
  kkm: number;
  statusKelulusan: 'Tuntas' | 'Belum Tuntas (Remedial)';
  totalSoal: number;
  jumlahBenar: number;
  jumlahSalah: number;
  catatanEvaluasi: string;
  kategoriCapaian: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
}

