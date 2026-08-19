import {
  UserRole,
  UserAccount,
  Guru,
  Siswa,
  MataPelajaran,
  Rombel,
  KBMSchedule,
  BankSoal,
  Ujian,
  PesertaUjianSession,
  PresensiRecord,
  IzinSakitSubmission,
  Pengumuman,
  UserProfileData,
  SystemConfig,
  RolePermissionDefinition,
  MasterTugasTambahan,
  PenugasanTugasTambahan,
  BookingUjianCAT,
  PortofolioSiswaRecord,
} from '../types';

export const ALL_PERMISSIONS: RolePermissionDefinition[] = [
  { code: 'dashboard.view', name: 'Lihat Dashboard', category: 'Dashboard', description: 'Akses statistik dan ringkasan data' },
  { code: 'guru.view', name: 'Lihat Data Guru', category: 'Guru', description: 'Melihat daftar dan profil guru' },
  { code: 'guru.create', name: 'Tambah Guru', category: 'Guru', description: 'Menambahkan data guru baru' },
  { code: 'guru.edit', name: 'Edit Guru', category: 'Guru', description: 'Mengubah data guru' },
  { code: 'guru.delete', name: 'Hapus Guru', category: 'Guru', description: 'Menghapus data guru' },
  { code: 'siswa.view', name: 'Lihat Data Siswa', category: 'Siswa', description: 'Melihat daftar dan profil siswa' },
  { code: 'siswa.create', name: 'Tambah Siswa', category: 'Siswa', description: 'Menambahkan data siswa baru' },
  { code: 'siswa.edit', name: 'Edit Siswa', category: 'Siswa', description: 'Mengubah data siswa' },
  { code: 'siswa.delete', name: 'Hapus Siswa', category: 'Siswa', description: 'Menghapus data siswa' },
  { code: 'kbm.view', name: 'Lihat Data KBM', category: 'KBM', description: 'Melihat rombel, mapel, dan jadwal' },
  { code: 'kbm.create', name: 'Kelola KBM', category: 'KBM', description: 'Menambah rombel, mapel, jadwal' },
  { code: 'kbm.edit', name: 'Edit KBM', category: 'KBM', description: 'Mengubah struktur KBM dan jadwal' },
  { code: 'kbm.delete', name: 'Hapus KBM', category: 'KBM', description: 'Menghapus data KBM' },
  { code: 'banksoal.view', name: 'Lihat Bank Soal', category: 'Bank Soal', description: 'Melihat butir soal' },
  { code: 'banksoal.create', name: 'Buat Soal', category: 'Bank Soal', description: 'Membuat butir soal baru' },
  { code: 'banksoal.edit', name: 'Edit Soal', category: 'Bank Soal', description: 'Mengubah butir soal' },
  { code: 'banksoal.delete', name: 'Hapus Soal', category: 'Bank Soal', description: 'Menghapus butir soal' },
  { code: 'ujian.view', name: 'Lihat Ujian', category: 'Ujian', description: 'Melihat daftar ujian sekolah' },
  { code: 'ujian.create', name: 'Buat Ujian', category: 'Ujian', description: 'Membuat jadwal dan paket ujian' },
  { code: 'ujian.publish', name: 'Publish & Token', category: 'Ujian', description: 'Mempublikasikan dan mengelola token ujian' },
  { code: 'ujian.result', name: 'Lihat Hasil Nilai', category: 'Ujian', description: 'Melihat rekap nilai & analitik' },
  { code: 'presensi.view', name: 'Lihat Presensi', category: 'Presensi', description: 'Melihat absensi harian dan rekap' },
  { code: 'presensi.manage', name: 'Kelola Presensi', category: 'Presensi', description: 'Mengatur metode dan persetujuan izin/sakit' },
  { code: 'pengumuman.view', name: 'Lihat Pengumuman', category: 'Pengumuman', description: 'Melihat pengumuman masuk' },
  { code: 'pengumuman.create', name: 'Buat Pengumuman', category: 'Pengumuman', description: 'Membuat dan menerbitkan pengumuman' },
  { code: 'akun.view', name: 'Lihat Akun', category: 'Akun', description: 'Melihat daftar akun pengguna' },
  { code: 'akun.create', name: 'Buat Akun', category: 'Akun', description: 'Menambahkan akun pengguna' },
  { code: 'akun.edit', name: 'Edit Akun', category: 'Akun', description: 'Mengubah data akun' },
  { code: 'akun.reset_password', name: 'Reset Password Siswa', category: 'Akun', description: 'Reset sandi siswa sesuai kewenangan' },
  { code: 'role.view', name: 'Lihat Hak Akses', category: 'Role', description: 'Melihat matriks permission' },
  { code: 'role.edit', name: 'Atur Hak Akses', category: 'Role', description: 'Mengubah izin permission role' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'SUPER ADMIN': ALL_PERMISSIONS.map(p => p.code),
  'ADMIN': ALL_PERMISSIONS.filter(p => !p.code.startsWith('role.')).map(p => p.code),
  'KEPALA SEKOLAH': [
    'dashboard.view', 'guru.view', 'siswa.view', 'kbm.view', 'banksoal.view',
    'ujian.view', 'ujian.result', 'presensi.view', 'pengumuman.view', 'pengumuman.create',
    'akun.view', 'role.view'
  ],
  'WAKASEK': [
    'dashboard.view', 'guru.view', 'siswa.view', 'kbm.view', 'kbm.create', 'kbm.edit',
    'banksoal.view', 'ujian.view', 'ujian.create', 'ujian.publish', 'ujian.result',
    'presensi.view', 'presensi.manage', 'pengumuman.view', 'pengumuman.create'
  ],
  'WALI KELAS': [
    'dashboard.view', 'siswa.view', 'kbm.view', 'presensi.view', 'presensi.manage',
    'pengumuman.view', 'pengumuman.create', 'akun.reset_password', 'ujian.result'
  ],
  'GURU WALI': [
    'dashboard.view', 'siswa.view', 'presensi.view', 'pengumuman.view', 'pengumuman.create',
    'akun.reset_password'
  ],
  'GURU MAPEL': [
    'dashboard.view', 'kbm.view', 'banksoal.view', 'banksoal.create', 'banksoal.edit',
    'ujian.view', 'ujian.create', 'ujian.publish', 'ujian.result', 'pengumuman.view'
  ],
  'SISWA': [
    'dashboard.view', 'kbm.view', 'ujian.view', 'presensi.view', 'pengumuman.view'
  ]
};

const STORAGE_KEY = 'SMS_JABAR_DB_V1';

export interface FullDatabaseState {
  config: SystemConfig;
  rolePermissions: Record<UserRole, string[]>;
  users: UserAccount[];
  guru: Guru[];
  siswa: Siswa[];
  mapel: MataPelajaran[];
  rombel: Rombel[];
  jadwalKBM: KBMSchedule[];
  bankSoal: BankSoal[];
  ujianList: Ujian[];
  pesertaUjianSessions: PesertaUjianSession[];
  presensiList: PresensiRecord[];
  presensi: PresensiRecord[];
  izinSakitList: IzinSakitSubmission[];
  pengumumanList: Pengumuman[];
  pengumuman: Pengumuman[];
  userProfiles: Record<string, UserProfileData>;
  driveFoldersTree: any[];
  sheetsMetadata: { name: string; count: number; lastModified: string }[];
  tugasTambahanMaster: MasterTugasTambahan[];
  penugasanTugasTambahan: PenugasanTugasTambahan[];
  bookingCATList: BookingUjianCAT[];
  portofolioSiswaList: PortofolioSiswaRecord[];
}

export function getInitialSeedDatabase(): FullDatabaseState {
  const config: SystemConfig = {
    namaSekolah: 'SMAN 1 KOTA BANDUNG - JAWA BARAT',
    npsn: '20219283',
    alamat: 'Jl. Ir. H. Juanda No. 93, Dago, Kecamatan Coblong, Kota Bandung',
    kabupatenKota: 'Kota Bandung',
    provinsi: 'Jawa Barat',
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
    tahunPelajaran: '2024/2025',
    semester: 'Ganjil',
    zonaWaktu: 'Asia/Jakarta (WIB)',
    metodePresensiDefault: ['Selfie', 'Lock Location/GPS', 'Barcode/QR Code', 'RFID'],
    koordinatSekolah: {
      lat: -6.8905, // Bandung coordinates near Dago / Gedung Sate
      lng: 107.6167,
      radiusMeters: 250,
    },
    configVersion: 'GAS-SMS-JABAR-2025.1',
    databaseSpreadsheetId: '1AbC_JabarSchoolSpreadsheet_998877665544332211',
    rootGoogleDriveFolderId: '1Fld_DatabaseSekolah_Jabar_FolderRoot_9988',
  };

  const guru: Guru[] = [
    {
      id: 'GURU-000001',
      nip: '197508121999031002',
      nik: '3273011208750001',
      nama: 'Dr. H. Asep Sunandar, M.Pd.',
      gelar: 'M.Pd.',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Bandung',
      tanggalLahir: '1975-08-12',
      alamat: 'Jl. Cisitu Indah No. 12, Coblong, Bandung',
      nomorHp: '081223344551',
      email: 'asep.sunandar@sman1bdg.sch.id',
      mataPelajaranUtama: 'Matematika Peminatan',
      statusKepegawaian: 'PNS',
      tugasTambahan: 'Kepala Sekolah',
      role: 'KEPALA SEKOLAH',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
    },
    {
      id: 'GURU-000002',
      nip: '198004152005012008',
      nik: '3273021504800003',
      nama: 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      gelar: 'M.M.',
      jenisKelamin: 'Perempuan',
      tempatLahir: 'Sumedang',
      tanggalLahir: '1980-04-15',
      alamat: 'Jl. Riau No. 45, Bandung Wetan, Bandung',
      nomorHp: '081223344552',
      email: 'nining.ratna@sman1bdg.sch.id',
      mataPelajaranUtama: 'Bahasa Sunda & Sastra Daerah',
      statusKepegawaian: 'PNS',
      tugasTambahan: 'Wakasek Kurikulum',
      role: 'WAKASEK',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
    },
    {
      id: 'GURU-000003',
      nip: '198511202009021004',
      nik: '3273032011850005',
      nama: 'Mochamad Ridwan, S.Kom., M.T.',
      gelar: 'M.T.',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Cimahi',
      tanggalLahir: '1985-11-20',
      alamat: 'Jl. Cibeunying Kolot No. 7, Coblong, Bandung',
      nomorHp: '081223344553',
      email: 'm.ridwan@sman1bdg.sch.id',
      mataPelajaranUtama: 'Informatika & Pemrograman',
      statusKepegawaian: 'PNS',
      tugasTambahan: 'Wali Kelas',
      role: 'WALI KELAS',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
    },
    {
      id: 'GURU-000004',
      nip: '199003052018032001',
      nik: '3273040503900002',
      nama: 'Siti Sarah Ginanjar, S.Pd.',
      gelar: 'S.Pd.',
      jenisKelamin: 'Perempuan',
      tempatLahir: 'Garut',
      tanggalLahir: '1990-03-05',
      alamat: 'Jl. Tubagus Ismail No. 24, Coblong, Bandung',
      nomorHp: '081223344554',
      email: 'siti.sarah@sman1bdg.sch.id',
      mataPelajaranUtama: 'Fisika Terapan',
      statusKepegawaian: 'PPPK',
      tugasTambahan: 'Guru Wali',
      role: 'GURU WALI',
      foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
    },
    {
      id: 'GURU-000005',
      nip: '199207182020121006',
      nik: '3273051807920008',
      nama: 'Dedi Kusnadi, S.Pd.',
      gelar: 'S.Pd.',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Tasikmalaya',
      tanggalLahir: '1992-07-18',
      alamat: 'Jl. Sukajadi No. 102, Sukajadi, Bandung',
      nomorHp: '081223344555',
      email: 'dedi.kusnadi@sman1bdg.sch.id',
      mataPelajaranUtama: 'Bahasa Indonesia',
      statusKepegawaian: 'GTT',
      tugasTambahan: 'Tidak Ada Tugas Tambahan',
      role: 'GURU MAPEL',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
    },
  ];

  const mapel: MataPelajaran[] = [
    {
      id: 'MAP-000001',
      kodeMapel: 'SUNDA-10',
      namaMapel: 'Bahasa dan Sastra Sunda',
      kelompok: 'Muatan Lokal (Bahasa Sunda)',
      status: 'Aktif',
      guruPengampuId: ['GURU-000002'],
    },
    {
      id: 'MAP-000002',
      kodeMapel: 'INF-10',
      namaMapel: 'Informatika & Literasi Digital',
      kelompok: 'Kejuruan / Peminatan',
      status: 'Aktif',
      guruPengampuId: ['GURU-000003'],
    },
    {
      id: 'MAP-000003',
      kodeMapel: 'MAT-10',
      namaMapel: 'Matematika Peminatan',
      kelompok: 'Kejuruan / Peminatan',
      status: 'Aktif',
      guruPengampuId: ['GURU-000001'],
    },
    {
      id: 'MAP-000004',
      kodeMapel: 'FIS-10',
      namaMapel: 'Fisika',
      kelompok: 'Kejuruan / Peminatan',
      status: 'Aktif',
      guruPengampuId: ['GURU-000004'],
    },
    {
      id: 'MAP-000005',
      kodeMapel: 'BIND-10',
      namaMapel: 'Bahasa Indonesia',
      kelompok: 'Umum',
      status: 'Aktif',
      guruPengampuId: ['GURU-000005'],
    },
  ];

  const rombel: Rombel[] = [
    {
      id: 'ROM-000001',
      namaRombel: 'X MIPA 1',
      tingkat: '10',
      jurusan: 'MIPA',
      tahunPelajaran: '2024/2025',
      waliKelasId: 'GURU-000003', // Mochamad Ridwan
      guruWaliIds: ['GURU-000004'], // Siti Sarah
      status: 'Aktif',
    },
    {
      id: 'ROM-000002',
      namaRombel: 'X MIPA 2',
      tingkat: '10',
      jurusan: 'MIPA',
      tahunPelajaran: '2024/2025',
      waliKelasId: 'GURU-000005',
      guruWaliIds: ['GURU-000003'],
      status: 'Aktif',
    },
    {
      id: 'ROM-000003',
      namaRombel: 'XI MIPA 1',
      tingkat: '11',
      jurusan: 'MIPA',
      tahunPelajaran: '2024/2025',
      waliKelasId: 'GURU-000002',
      guruWaliIds: ['GURU-000004'],
      status: 'Aktif',
    },
  ];

  const siswa: Siswa[] = [
    {
      id: 'SIS-000001',
      nis: '24251001',
      nisn: '0078129301',
      nik: '3273010104080004',
      namaLengkap: 'Ahmad Fajar Nugraha',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Bandung',
      tanggalLahir: '2008-04-01',
      alamat: 'Jl. Dago Asri No. 15, Bandung',
      nomorHp: '085712345601',
      email: 'ahmad.fajar@siswa.sman1bdg.sch.id',
      namaOrangTua: 'Dadang Nugraha',
      namaIbu: 'Eni Rohaeni',
      nomorHpOrangTua: '081298765401',
      kelas: '10',
      rombel: 'X MIPA 1',
      guruWaliId: 'GURU-000004', // Siti Sarah
      waliKelasId: 'GURU-000003', // Mochamad Ridwan
      foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
      dokumen: [
        {
          id: 'DOC-001',
          namaFile: 'Kartu_Keluarga_Ahmad_Fajar.pdf',
          jenis: 'KK',
          driveFileId: '1DRV_KK_001',
          url: '#',
          tanggalUpload: '2024-07-15',
        },
        {
          id: 'DOC-002',
          namaFile: 'Akta_Kelahiran_Ahmad_Fajar.pdf',
          jenis: 'Akta Lahir',
          driveFileId: '1DRV_AKTA_001',
          url: '#',
          tanggalUpload: '2024-07-15',
        },
      ],
    },
    {
      id: 'SIS-000002',
      nis: '24251002',
      nisn: '0078129302',
      nik: '3273012005080002',
      namaLengkap: 'Siti Nurhaliza Putri',
      jenisKelamin: 'Perempuan',
      tempatLahir: 'Cimahi',
      tanggalLahir: '2008-05-20',
      alamat: 'Jl. Cihanjuang No. 88, Cimahi',
      nomorHp: '085712345602',
      email: 'siti.nurhaliza@siswa.sman1bdg.sch.id',
      namaOrangTua: 'Agus Gunawan',
      namaIbu: 'Dewi Sartika',
      nomorHpOrangTua: '081298765402',
      kelas: '10',
      rombel: 'X MIPA 1',
      guruWaliId: 'GURU-000004', // Siti Sarah
      waliKelasId: 'GURU-000003', // Mochamad Ridwan
      foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
      dokumen: [
        {
          id: 'DOC-003',
          namaFile: 'KK_Siti_Nurhaliza.pdf',
          jenis: 'KK',
          driveFileId: '1DRV_KK_002',
          url: '#',
          tanggalUpload: '2024-07-16',
        },
      ],
    },
    {
      id: 'SIS-000003',
      nis: '24251003',
      nisn: '0078129303',
      nik: '3273011409080007',
      namaLengkap: 'Dadang Hermawan Sutisna',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Garut',
      tanggalLahir: '2008-09-14',
      alamat: 'Jl. Cikutra Barat No. 34, Cibeunying Kaler, Bandung',
      nomorHp: '085712345603',
      email: 'dadang.hermawan@siswa.sman1bdg.sch.id',
      namaOrangTua: 'Sutisna Wijaya',
      namaIbu: 'Imas Masitoh',
      nomorHpOrangTua: '081298765403',
      kelas: '10',
      rombel: 'X MIPA 1',
      guruWaliId: 'GURU-000003',
      waliKelasId: 'GURU-000003',
      foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
      dokumen: [],
    },
    {
      id: 'SIS-000004',
      nis: '24251004',
      nisn: '0078129304',
      nik: '3273012211080006',
      namaLengkap: 'Rina Kartika Sari',
      jenisKelamin: 'Perempuan',
      tempatLahir: 'Sumedang',
      tanggalLahir: '2008-11-22',
      alamat: 'Jl. Dipatiukur No. 50, Coblong, Bandung',
      nomorHp: '085712345604',
      email: 'rina.kartika@siswa.sman1bdg.sch.id',
      namaOrangTua: 'Budi Santoso',
      namaIbu: 'Yuyun Yuningsih',
      nomorHpOrangTua: '081298765404',
      kelas: '10',
      rombel: 'X MIPA 2',
      guruWaliId: 'GURU-000003',
      waliKelasId: 'GURU-000005',
      foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
      dokumen: [],
    },
    {
      id: 'SIS-000005',
      nis: '24251005',
      nisn: '0078129305',
      nik: '3273010702080001',
      namaLengkap: 'Galih Chandra Wibawa',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Bandung',
      tanggalLahir: '2008-02-07',
      alamat: 'Jl. Sukaluyu No. 19, Bandung',
      nomorHp: '085712345605',
      email: 'galih.chandra@siswa.sman1bdg.sch.id',
      namaOrangTua: 'Wawan Gunawan',
      namaIbu: 'Rina Rostina',
      nomorHpOrangTua: '081298765405',
      kelas: '11',
      rombel: 'XI MIPA 1',
      guruWaliId: 'GURU-000004',
      waliKelasId: 'GURU-000002',
      foto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      status: 'Aktif',
      dokumen: [],
    },
  ];

  const users: UserAccount[] = [
    {
      id: 'USR-000001',
      username: 'superadmin',
      nama: 'Super Administrator SMS Jabar',
      role: 'SUPER ADMIN',
      email: 'superadmin@disdik.jabarprov.go.id',
      nomorHp: '081100000001',
      status: 'Aktif',
      lastLogin: new Date().toISOString(),
      mustChangePassword: false,
      createdAt: '2024-07-01',
    },
    {
      id: 'USR-000002',
      username: 'admin',
      nama: 'Admin TU & Dapodik SMAN 1 Bandung',
      role: 'ADMIN',
      email: 'admin.tu@sman1bdg.sch.id',
      nomorHp: '081100000002',
      status: 'Aktif',
      lastLogin: new Date().toISOString(),
      mustChangePassword: false,
      createdAt: '2024-07-01',
    },
    {
      id: 'USR-000003',
      username: '197508121999031002',
      nama: 'Dr. H. Asep Sunandar, M.Pd.',
      role: 'KEPALA SEKOLAH',
      email: 'asep.sunandar@sman1bdg.sch.id',
      nomorHp: '081223344551',
      referenceId: 'GURU-000001',
      status: 'Aktif',
      createdAt: '2024-07-01',
    },
    {
      id: 'USR-000004',
      username: '198004152005012008',
      nama: 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      role: 'WAKASEK',
      email: 'nining.ratna@sman1bdg.sch.id',
      nomorHp: '081223344552',
      referenceId: 'GURU-000002',
      status: 'Aktif',
      createdAt: '2024-07-01',
    },
    {
      id: 'USR-000005',
      username: '198511202009021004',
      nama: 'Mochamad Ridwan, S.Kom., M.T.',
      role: 'WALI KELAS',
      email: 'm.ridwan@sman1bdg.sch.id',
      nomorHp: '081223344553',
      referenceId: 'GURU-000003',
      status: 'Aktif',
      createdAt: '2024-07-01',
    },
    {
      id: 'USR-000006',
      username: '199003052018032001',
      nama: 'Siti Sarah Ginanjar, S.Pd.',
      role: 'GURU WALI',
      email: 'siti.sarah@sman1bdg.sch.id',
      nomorHp: '081223344554',
      referenceId: 'GURU-000004',
      status: 'Aktif',
      createdAt: '2024-07-01',
    },
    {
      id: 'USR-000007',
      username: '199207182020121006',
      nama: 'Dedi Kusnadi, S.Pd.',
      role: 'GURU MAPEL',
      email: 'dedi.kusnadi@sman1bdg.sch.id',
      nomorHp: '081223344555',
      referenceId: 'GURU-000005',
      status: 'Aktif',
      createdAt: '2024-07-01',
    },
    {
      id: 'USR-000008',
      username: '0078129301', // Ahmad Fajar NISN
      nama: 'Ahmad Fajar Nugraha',
      role: 'SISWA',
      email: 'ahmad.fajar@siswa.sman1bdg.sch.id',
      nomorHp: '085712345601',
      referenceId: 'SIS-000001',
      status: 'Aktif',
      createdAt: '2024-07-01',
    },
    {
      id: 'USR-000009',
      username: '0078129302', // Siti Nurhaliza NISN
      nama: 'Siti Nurhaliza Putri',
      role: 'SISWA',
      email: 'siti.nurhaliza@siswa.sman1bdg.sch.id',
      nomorHp: '085712345602',
      referenceId: 'SIS-000002',
      status: 'Aktif',
      createdAt: '2024-07-01',
    },
  ];

  const jadwalKBM: KBMSchedule[] = [
    {
      id: 'KBM-000001',
      hari: 'Senin',
      jamKe: 1,
      jamMulai: '07:30',
      jamSelesai: '08:50',
      rombelId: 'ROM-000001', // X MIPA 1
      mapelId: 'MAP-000001', // Bahasa Sunda
      guruId: 'GURU-000002', // Ceu Nining
      ruang: 'R. 101 (Gedung Kujang)',
      keterangan: 'Materi Kawih & Pupuh Sunda',
    },
    {
      id: 'KBM-000002',
      hari: 'Senin',
      jamKe: 2,
      jamMulai: '09:05',
      jamSelesai: '10:25',
      rombelId: 'ROM-000001',
      mapelId: 'MAP-000002', // Informatika
      guruId: 'GURU-000003', // Mochamad Ridwan
      ruang: 'Lab Komputer 1',
      keterangan: 'Algoritma & Pemrograman Berorientasi Objek',
    },
    {
      id: 'KBM-000003',
      hari: 'Selasa',
      jamKe: 1,
      jamMulai: '07:30',
      jamSelesai: '08:50',
      rombelId: 'ROM-000001',
      mapelId: 'MAP-000004', // Fisika
      guruId: 'GURU-000004', // Siti Sarah
      ruang: 'Lab Fisika Terpadu',
      keterangan: 'Kinematika Gerak Lurus',
    },
    {
      id: 'KBM-000004',
      hari: 'Rabu',
      jamKe: 1,
      jamMulai: '07:30',
      jamSelesai: '08:50',
      rombelId: 'ROM-000001',
      mapelId: 'MAP-000003', // Matematika
      guruId: 'GURU-000001', // Dr. Asep
      ruang: 'R. 101 (Gedung Kujang)',
      keterangan: 'Trigonometri Lanjut',
    },
    {
      id: 'KBM-000005',
      hari: 'Kamis',
      jamKe: 1,
      jamMulai: '07:30',
      jamSelesai: '08:50',
      rombelId: 'ROM-000001',
      mapelId: 'MAP-000005', // Bahasa Indonesia
      guruId: 'GURU-000005', // Dedi Kusnadi
      ruang: 'R. 101 (Gedung Kujang)',
      keterangan: 'Teks Laporan Hasil Observasi',
    },
    {
      id: 'KBM-000006',
      hari: 'Jumat',
      jamKe: 1,
      jamMulai: '07:30',
      jamSelesai: '08:30',
      rombelId: 'ROM-000001',
      mapelId: 'MAP-000001', // Bahasa Sunda
      guruId: 'GURU-000002',
      ruang: 'R. 101 (Gedung Kujang)',
      keterangan: 'Panggelar Basa Sunda & Paguneman',
    },
  ];

  const bankSoal: BankSoal[] = [
    {
      id: 'SOAL-000001',
      mapelId: 'MAP-000001',
      mapelNama: 'Bahasa dan Sastra Sunda',
      kelas: '10',
      materi: 'Undak Usuk Basa & Paguneman',
      kompetensi: 'KD 3.1 Menganalisis tatakrama basa Sunda dalam percakapan',
      jenisSoal: 'Pilihan Ganda',
      tingkatKesulitan: 'Sedang',
      pertanyaan: 'Perhatikan diagram interaktif aksara Sunda kuno dan ragam basa hormat di bawah. Ragam basa hormat/lemes nu merenah pikeun diri sorangan dina basa Sunda nyaeta...',
      mediaTipe: 'gambar_interaktif',
      mediaUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
      mediaCaption: 'Diagram Interaktif: Klik titik informasi (hotspot) pada gambar naskah untuk melihat aksara dan kaidah undak-usuk basa.',
      mediaHotspots: [
        { id: 'hs-1', x: 28, y: 35, label: 'Kaidah Lemes Pituin', keterangan: 'Kaidah ragam lemes pikeun diri nyalira nganggo kecap lemes sedeng (sapertos dongkap, bantun).' },
        { id: 'hs-2', x: 68, y: 55, label: 'Kaidah Hormat Ka Batur', keterangan: 'Kaidah hormat ka sepuh/batur nganggo kecap lemes luhur (sapertos sumping, mulih, nyandak).' },
      ],
      pilihanA: 'Abdi nembé sumping ti Bandung.',
      pilihanB: 'Abdi nembé mulih ti Bandung.',
      pilihanC: 'Abdi nembé dongkap ti Bandung.',
      pilihanD: 'Kuring nembé angkat ka Bandung.',
      pilihanE: 'Abdi nembé nyarios ka sepuh.',
      jawabanBenar: 'C',
      pembahasan: 'Pikeun diri sorangan nganggo ragam lemes sedeng nyaeta "dongkap", upami "sumping/mulih" dianggo pikeun ngahormat batur/kolot.',
      bobot: 10,
      pembuatId: 'GURU-000002',
      pembuatNama: 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      status: 'Aktif',
      createdAt: '2024-08-01',
    },
    {
      id: 'SOAL-000002',
      mapelId: 'MAP-000002',
      mapelNama: 'Informatika & Literasi Digital',
      kelas: '10',
      materi: 'Berpikir Komputasional & Algoritma',
      kompetensi: 'KD 3.2 Menalar struktur data antrian (Queue) dan tumpukan (Stack)',
      jenisSoal: 'Pilihan Ganda',
      tingkatKesulitan: 'Mudah',
      pertanyaan: 'Tontonlah cuplikan video simulasi antrean data berikut. Prinsip kerja struktur data antrian (Queue) yang menerapkan mekanisme elemen pertama yang masuk akan keluar lebih awal dinamakan...',
      mediaTipe: 'video',
      mediaUrl: 'https://www.youtube.com/watch?v=kQDXnpL46P8',
      mediaCaption: 'Video Pembelajaran: Simulasi visual mekanisme FIFO pada antrian proses komputer.',
      pilihanA: 'LIFO (Last In First Out)',
      pilihanB: 'FIFO (First In First Out)',
      pilihanC: 'FILO (First In Last Out)',
      pilihanD: 'Binary Search Tree',
      pilihanE: 'Hashing Algorithm',
      jawabanBenar: 'B',
      pembahasan: 'Queue bekerja dengan prinsip FIFO (First In First Out), seperti antrean loket.',
      bobot: 10,
      pembuatId: 'GURU-000003',
      pembuatNama: 'Mochamad Ridwan, S.Kom., M.T.',
      status: 'Aktif',
      createdAt: '2024-08-02',
    },
    {
      id: 'SOAL-000003',
      mapelId: 'MAP-000002',
      mapelNama: 'Informatika & Literasi Digital',
      kelas: '10',
      materi: 'Logika & Struktur Kontrol',
      kompetensi: 'KD 3.3 Menganalisis algoritma perulangan dan percabangan',
      jenisSoal: 'Benar/Salah',
      tingkatKesulitan: 'Mudah',
      pertanyaan: 'Perulangan `while` di dalam bahasa pemrograman akan mengeksekusi blok kode minimal satu kali meskipun kondisi awal bernilai salah (false).',
      pilihanA: 'Benar',
      pilihanB: 'Salah',
      jawabanBenar: 'B',
      pembahasan: 'Salah, yang mengeksekusi minimal satu kali adalah perulangan `do-while`. Perulangan `while` memeriksa kondisi di awal.',
      bobot: 10,
      pembuatId: 'GURU-000003',
      pembuatNama: 'Mochamad Ridwan, S.Kom., M.T.',
      status: 'Aktif',
      createdAt: '2024-08-03',
    },
    {
      id: 'SOAL-000004',
      mapelId: 'MAP-000003',
      mapelNama: 'Matematika Peminatan',
      kelas: '10',
      materi: 'Persamaan Eksponen & Logaritma',
      kompetensi: 'KD 3.1 Menyelesaikan persamaan eksponensial sederhana',
      jenisSoal: 'Pilihan Ganda',
      tingkatKesulitan: 'Sedang',
      pertanyaan: 'Himpunan penyelesaian dari persamaan 2^(2x - 3) = 32 adalah...',
      pilihanA: 'x = 2',
      pilihanB: 'x = 3',
      pilihanC: 'x = 4',
      pilihanD: 'x = 5',
      pilihanE: 'x = 6',
      jawabanBenar: 'C',
      pembahasan: '32 = 2^5. Maka 2x - 3 = 5 => 2x = 8 => x = 4.',
      bobot: 10,
      pembuatId: 'GURU-000001',
      pembuatNama: 'Dr. H. Asep Sunandar, M.Pd.',
      status: 'Aktif',
      createdAt: '2024-08-04',
    },
    {
      id: 'SOAL-000005',
      mapelId: 'MAP-000004',
      mapelNama: 'Fisika',
      kelas: '10',
      materi: 'Gerak Lurus Beraturan (GLB)',
      kompetensi: 'KD 3.4 Menghitung kelajuan dan perpindahan partikel',
      jenisSoal: 'Pilihan Ganda',
      tingkatKesulitan: 'Mudah',
      pertanyaan: 'Sebuah bus Antar Kota Antar Provinsi (AKAP) di Jawa Barat menempuh perjalanan Bandung - Cirebon sejauh 120 km dalam waktu 2 jam secara stabil. Berapakah kecepatan rata-rata bus tersebut?',
      pilihanA: '40 km/jam',
      pilihanB: '50 km/jam',
      pilihanC: '60 km/jam',
      pilihanD: '70 km/jam',
      pilihanE: '80 km/jam',
      jawabanBenar: 'C',
      pembahasan: 'v = s / t = 120 km / 2 jam = 60 km/jam.',
      bobot: 10,
      pembuatId: 'GURU-000004',
      pembuatNama: 'Siti Sarah Ginanjar, S.Pd.',
      status: 'Aktif',
      createdAt: '2024-08-05',
    },
    {
      id: 'SOAL-000006',
      mapelId: 'MAP-000001',
      mapelNama: 'Bahasa dan Sastra Sunda',
      kelas: '10',
      materi: 'Aksara Sunda Tradisional',
      kompetensi: 'KD 3.3 Mengenal dan mengidentifikasi Aksara Sunda Baku',
      jenisSoal: 'Essay',
      tingkatKesulitan: 'Sukar',
      pertanyaan: 'Jelaskeun naon bédana antara Rarangken Panyuku, Panghulu, jeung Paneleng dina aturan nulis Aksara Sunda!',
      jawabanBenar: 'Panyuku pikeun ngarobah sora vokal jadi /u/, Panghulu pikeun ngarobah sora vokal jadi /i/, Paneleng pikeun ngarobah jadi /é/.',
      pembahasan: 'Rarangken mangrupakeun tanda vokalisasi dina aksara Sunda anu nangtukeun sora vokal.',
      bobot: 20,
      pembuatId: 'GURU-000002',
      pembuatNama: 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      status: 'Aktif',
      createdAt: '2024-08-06',
    },
  ];

  const ujianList: Ujian[] = [
    {
      id: 'UJIAN-000001',
      namaUjian: 'PTS Ganjil: Informatika & Berpikir Komputasional',
      jenis: 'PTS / Ujian Tengah Semester',
      mapelId: 'MAP-000002',
      mapelNama: 'Informatika & Literasi Digital',
      kelas: '10',
      rombelIds: ['ROM-000001', 'ROM-000002'],
      pembuatId: 'GURU-000003',
      pembuatNama: 'Mochamad Ridwan, S.Kom., M.T.',
      durasiMenit: 60,
      tanggalMulai: '2025-08-18T00:00:00.000Z',
      tanggalSelesai: '2026-12-31T23:59:59.000Z',
      soalIds: ['SOAL-000002', 'SOAL-000003', 'SOAL-000001', 'SOAL-000004', 'SOAL-000005'],
      nilaiMinimum: 75,
      acakSoal: true,
      acakJawaban: true,
      tokenRequired: true,
      currentToken: 'JBR-789X',
      status: 'Published',
      linkKhusus: '/ujian/UJIAN-000001',
      modeMasuk: 'Kombinasi',
      antiCheat: {
        enforceFullscreen: true,
        detectTabSwitch: true,
        blockCopyPaste: true,
        blockContextMenu: true,
        autoSubmitOnTimeUp: true,
      },
    },
    {
      id: 'UJIAN-000002',
      namaUjian: 'Ulangan Harian 1: Panggelar Basa Sunda & Tatakrama',
      jenis: 'Ulangan Harian',
      mapelId: 'MAP-000001',
      mapelNama: 'Bahasa dan Sastra Sunda',
      kelas: '10',
      rombelIds: ['ROM-000001'],
      pembuatId: 'GURU-000002',
      pembuatNama: 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      durasiMenit: 45,
      tanggalMulai: '2025-08-18T00:00:00.000Z',
      tanggalSelesai: '2026-12-31T23:59:59.000Z',
      soalIds: ['SOAL-000001', 'SOAL-000006'],
      nilaiMinimum: 75,
      acakSoal: false,
      acakJawaban: true,
      tokenRequired: false,
      currentToken: 'SND-4421',
      status: 'Published',
      linkKhusus: '/ujian/UJIAN-000002',
      modeMasuk: 'Akun Siswa',
      antiCheat: {
        enforceFullscreen: true,
        detectTabSwitch: true,
        blockCopyPaste: true,
        blockContextMenu: true,
        autoSubmitOnTimeUp: true,
      },
    },
  ];

  const pesertaUjianSessions: PesertaUjianSession[] = [
    {
      id: 'SES-000001',
      ujianId: 'UJIAN-000001',
      siswaId: 'SIS-000001',
      nisn: '0078129301',
      namaSiswa: 'Ahmad Fajar Nugraha',
      rombelNama: 'X MIPA 1',
      status: 'Sudah Selesai',
      waktuMulai: '2025-08-18T08:00:00.000Z',
      waktuSelesai: '2025-08-18T08:42:15.000Z',
      sisaDetik: 1065,
      jawaban: {
        'SOAL-000002': { soalId: 'SOAL-000002', jawabanSiswa: 'B', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:10:00.000Z' },
        'SOAL-000003': { soalId: 'SOAL-000003', jawabanSiswa: 'B', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:15:00.000Z' },
        'SOAL-000001': { soalId: 'SOAL-000001', jawabanSiswa: 'C', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:22:00.000Z' },
        'SOAL-000004': { soalId: 'SOAL-000004', jawabanSiswa: 'C', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:30:00.000Z' },
        'SOAL-000005': { soalId: 'SOAL-000005', jawabanSiswa: 'C', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:40:00.000Z' },
      },
      nilaiAkhir: 100,
      isLulus: true,
      violationsCount: 0,
      submittedAt: '2025-08-18T08:42:15.000Z',
    },
    {
      id: 'SES-000002',
      ujianId: 'UJIAN-000001',
      siswaId: 'SIS-000002',
      nisn: '0078129302',
      namaSiswa: 'Siti Nurhaliza Putri',
      rombelNama: 'X MIPA 1',
      status: 'Sudah Selesai',
      waktuMulai: '2025-08-18T08:02:00.000Z',
      waktuSelesai: '2025-08-18T08:45:00.000Z',
      sisaDetik: 900,
      jawaban: {
        'SOAL-000002': { soalId: 'SOAL-000002', jawabanSiswa: 'B', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:12:00.000Z' },
        'SOAL-000003': { soalId: 'SOAL-000003', jawabanSiswa: 'A', isFlagged: false, isCorrect: false, scoreAwarded: 0, updatedAt: '2025-08-18T08:18:00.000Z' },
        'SOAL-000001': { soalId: 'SOAL-000001', jawabanSiswa: 'C', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:25:00.000Z' },
        'SOAL-000004': { soalId: 'SOAL-000004', jawabanSiswa: 'C', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:35:00.000Z' },
        'SOAL-000005': { soalId: 'SOAL-000005', jawabanSiswa: 'C', isFlagged: false, isCorrect: true, scoreAwarded: 10, updatedAt: '2025-08-18T08:44:00.000Z' },
      },
      nilaiAkhir: 80,
      isLulus: true,
      violationsCount: 1,
      submittedAt: '2025-08-18T08:45:00.000Z',
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const presensiList: PresensiRecord[] = [
    {
      id: 'PRE-000001',
      tanggal: todayStr,
      siswaId: 'SIS-000001',
      nisn: '0078129301',
      namaSiswa: 'Ahmad Fajar Nugraha',
      rombelId: 'ROM-000001',
      rombelNama: 'X MIPA 1',
      status: 'Hadir',
      metode: 'Lock Location/GPS',
      jamMasuk: '06:55:20 WIB',
      lokasi: {
        latitude: -6.89045,
        longitude: 107.61668,
        accuracy: 12,
        address: 'Radius Sekolah SMAN 1 Bandung, Jawa Barat (Valid GPS)',
        isWithinSchoolRadius: true,
      },
      keterangan: 'Tepat Waktu',
    },
    {
      id: 'PRE-000002',
      tanggal: todayStr,
      siswaId: 'SIS-000002',
      nisn: '0078129302',
      namaSiswa: 'Siti Nurhaliza Putri',
      rombelId: 'ROM-000001',
      rombelNama: 'X MIPA 1',
      status: 'Hadir',
      metode: 'Selfie',
      jamMasuk: '07:05:10 WIB',
      fotoSelfie: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      keterangan: 'Verifikasi Wajah Berhasil',
    },
    {
      id: 'PRE-000003',
      tanggal: todayStr,
      siswaId: 'SIS-000003',
      nisn: '0078129303',
      namaSiswa: 'Dadang Hermawan Sutisna',
      rombelId: 'ROM-000001',
      rombelNama: 'X MIPA 1',
      status: 'Sakit',
      metode: 'Barcode/QR Code',
      jamMasuk: '07:30:00 WIB',
      keterangan: 'Surat dokter terlampir (Demam)',
      lampiranSurat: 'Surat_Dokter_Puskesmas_Dago.pdf',
    },
    {
      id: 'PRE-000004',
      tanggal: todayStr,
      siswaId: 'SIS-000004',
      nisn: '0078129304',
      namaSiswa: 'Rina Kartika Sari',
      rombelId: 'ROM-000002',
      rombelNama: 'X MIPA 2',
      status: 'Hadir',
      metode: 'RFID',
      jamMasuk: '06:48:12 WIB',
      rfidCardNumber: 'RFID-3273-00994411',
      keterangan: 'Tap Kartu Pelajar Digital Jabar',
    },
  ];

  const izinSakitList: IzinSakitSubmission[] = [
    {
      id: 'IZN-000001',
      siswaId: 'SIS-000003',
      nisn: '0078129303',
      namaSiswa: 'Dadang Hermawan Sutisna',
      rombelNama: 'X MIPA 1',
      tanggalMulai: todayStr,
      tanggalSelesai: todayStr,
      kategori: 'Sakit',
      alasan: 'Sakit demam dan flu, istirahat atas petunjuk dokter Puskesmas Dago',
      statusPersetujuan: 'Disetujui',
      disetujuiOleh: 'Mochamad Ridwan, S.Kom., M.T. (Wali Kelas)',
      catatan: 'Disetujui. Lekas sembuh.',
      createdAt: todayStr,
    },
  ];

  const pengumumanList: Pengumuman[] = [
    {
      id: 'PENG-000001',
      judul: 'Pelaksanaan Penilaian Tengah Semester (PTS) Berbasis CAT Tahun 2024/2025',
      isi: 'Diberitahukan kepada seluruh bapak/ibu guru dan peserta didik bahwa PTS Semester Ganjil akan diselenggarakan menggunakan Sistem Manajemen Sekolah Jawa Barat (CAT Ujian). Mohon memastikan akun dan token ujian telah dipersiapkan.',
      pembuatId: 'GURU-000002',
      pembuatNama: 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      pembuatRole: 'WAKASEK',
      target: 'Semua Akun',
      tanggalMulai: '2024-08-15',
      tanggalBerakhir: '2024-09-30',
      status: 'Aktif',
      prioritas: 'Penting',
      createdAt: '2024-08-15',
    },
    {
      id: 'PENG-000002',
      judul: 'Sosialisasi Program Binaan Guru Wali & Pembinaan Karakter Jabar Masagi',
      isi: 'Kepada seluruh Guru Wali dan siswa binaan, mohon menghadiri sesi tatap muka pembinaan karakter dan bimbingan akademik mingguan di aula sekolah pada hari Rabu.',
      pembuatId: 'GURU-000001',
      pembuatNama: 'Dr. H. Asep Sunandar, M.Pd.',
      pembuatRole: 'KEPALA SEKOLAH',
      target: 'Guru Wali',
      tanggalMulai: '2024-08-18',
      tanggalBerakhir: '2024-08-31',
      status: 'Aktif',
      prioritas: 'Biasa',
      createdAt: '2024-08-18',
    },
    {
      id: 'PENG-000003',
      judul: 'Peringatan Disiplin Presensi GPS & Selfie Siswa Kelas X MIPA 1',
      isi: 'Presensi harian wajib dilakukan paling lambat pukul 07.15 WIB di dalam radius sekolah. Peserta didik yang sakit atau izin wajib menyertakan surat keterangan resmi melalui menu presensi.',
      pembuatId: 'GURU-000003',
      pembuatNama: 'Mochamad Ridwan, S.Kom., M.T.',
      pembuatRole: 'WALI KELAS',
      target: 'Rombel Tertentu',
      targetRombelIds: ['ROM-000001'],
      tanggalMulai: '2024-08-18',
      tanggalBerakhir: '2024-09-10',
      status: 'Aktif',
      prioritas: 'Mendesak',
      createdAt: '2024-08-18',
    },
  ];

  const userProfiles: Record<string, UserProfileData> = {
    'USR-000001': {
      userId: 'USR-000001',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      nama: 'Super Administrator SMS Jabar',
      nomorHp: '081100000001',
      nomorHpDarurat: '081100000099',
      email: 'superadmin@disdik.jabarprov.go.id',
      alamat: 'Dinas Pendidikan Provinsi Jawa Barat, Jl. Dr. Radjiman No. 6 Bandung',
      bio: 'Pengelola Infrastruktur Cloud Sistem Manajemen Sekolah Provinsi Jawa Barat',
      socialMedia: [
        { id: '1', platform: 'Instagram', url: 'https://instagram.com/disdikjabar' },
        { id: '2', platform: 'YouTube', url: 'https://youtube.com/@disdikjabar' },
      ],
    },
    'USR-000005': {
      userId: 'USR-000005',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      nama: 'Mochamad Ridwan, S.Kom., M.T.',
      nomorHp: '081223344553',
      nomorHpDarurat: '081223344599',
      email: 'm.ridwan@sman1bdg.sch.id',
      alamat: 'Jl. Cibeunying Kolot No. 7, Coblong, Bandung',
      bio: 'Guru Mapel Informatika & Wali Kelas X MIPA 1 SMAN 1 Bandung',
      socialMedia: [
        { id: '1', platform: 'Instagram', url: 'https://instagram.com/m.ridwan.it' },
        { id: '2', platform: 'LinkedIn', url: 'https://linkedin.com/in/mridwan-jabar' },
        { id: '3', platform: 'Website', url: 'https://ridwan.guru.jabarprov.go.id' },
      ],
    },
  };

  const driveFoldersTree = [
    {
      name: 'DATABASE SEKOLAH',
      id: 'FLD-ROOT',
      subfolders: [
        { name: 'DATABASE (Google Spreadsheet Core)', id: 'FLD-DB', files: ['DATABASE SISTEM MANAJEMEN SEKOLAH.gsheet'] },
        { name: 'SUPER ADMIN', id: 'FLD-SA', files: ['System_Audit_Log.pdf', 'Config_Backup_2025.json'] },
        { name: 'ADMIN', id: 'FLD-ADM', files: ['Rekap_Dapodik_Jabar_2024.xlsx', 'SK_Pembagian_Tugas.pdf'] },
        { name: 'KEPALA SEKOLAH', id: 'FLD-KS', files: ['Laporan_Tahunan_Sekolah.pdf', 'Evaluasi_Kinerja_Guru.xlsx'] },
        { name: 'WAKASEK', id: 'FLD-WK', files: ['Jadwal_KBM_Semester_Ganjil.xlsx', 'Kalender_Akademik_Jabar.pdf'] },
        { name: 'WALI KELAS', id: 'FLD-WKEL', files: ['Buku_Induk_Rombel_X_MIPA_1.xlsx', 'Laporan_Kehadiran_Kelas.pdf'] },
        { name: 'GURU WALI', id: 'FLD-GW', files: ['Catatan_Binaan_Siswa.docx', 'Rapor_Karakter_Masagi.pdf'] },
        { name: 'GURU MAPEL', id: 'FLD-GM', files: ['Silabus_Basa_Sunda.docx', 'Modul_Ajar_Informatika.pdf'] },
        {
          name: 'SISWA',
          id: 'FLD-SISWA',
          subfolders: [
            {
              name: 'KELAS 10',
              id: 'FLD-K10',
              subfolders: [
                {
                  name: 'Ahmad Fajar Nugraha (0078129301)',
                  id: 'FLD-SIS-01',
                  files: ['Kartu_Keluarga_Ahmad_Fajar.pdf', 'Akta_Kelahiran_Ahmad_Fajar.pdf', 'PasFoto_3x4.jpg'],
                },
                {
                  name: 'Siti Nurhaliza Putri (0078129302)',
                  id: 'FLD-SIS-02',
                  files: ['KK_Siti_Nurhaliza.pdf', 'PasFoto_3x4.jpg'],
                },
                {
                  name: 'Dadang Hermawan Sutisna (0078129303)',
                  id: 'FLD-SIS-03',
                  files: ['Dokumen_Pendaftaran.pdf'],
                },
              ],
            },
            {
              name: 'KELAS 11',
              id: 'FLD-K11',
              subfolders: [
                {
                  name: 'Galih Chandra Wibawa (0078129305)',
                  id: 'FLD-SIS-05',
                  files: ['Berkas_Siswa.pdf'],
                },
              ],
            },
            {
              name: 'KELAS 12',
              id: 'FLD-K12',
              subfolders: [],
            },
          ],
        },
        { name: 'DOKUMEN', id: 'FLD-DOC', files: ['Pedoman_Akademik_Jabar.pdf', 'SOP_CAT_Ujian.pdf'] },
        { name: 'FOTO', id: 'FLD-FOTO', files: ['Logo_Sekolah.png', 'Gedung_Sekolah.jpg'] },
        { name: 'UJIAN', id: 'FLD-UJIAN', files: ['Paket_Soal_PTS_Ganjil.json', 'Berita_Acara_Ujian.pdf'] },
        { name: 'BANK SOAL', id: 'FLD-BS', files: ['Bank_Soal_Basa_Sunda_2025.json', 'Bank_Soal_Informatika.json'] },
      ],
    },
  ];

  const sheetNames = [
    'USERS', 'ROLES', 'PERMISSIONS', 'USER_PERMISSIONS', 'GURU', 'TENDIK',
    'SISWA', 'ROMBEL', 'PESERTA_ROMBEL', 'GURU_WALI', 'WALI_KELAS', 'MAPEL',
    'KBM', 'JAM_PELAJARAN', 'BANK_SOAL', 'PILIHAN_SOAL', 'UJIAN', 'PESERTA_UJIAN',
    'TOKEN_UJIAN', 'JAWABAN_UJIAN', 'NILAI_UJIAN', 'PRESENSI', 'IZIN_SAKIT',
    'PENGUMUMAN', 'TARGET_PENGUMUMAN', 'PROFIL', 'DOKUMEN', 'KONFIGURASI', 'TAHUN_PELAJARAN',
    'TUGAS_TAMBAHAN', 'PENUGASAN_GURU', 'BOOKING_CAT', 'PORTOFOLIO_SISWA'
  ];

  const sheetsMetadata = sheetNames.map(name => ({
    name,
    count: Math.floor(Math.random() * 20) + 5,
    lastModified: new Date().toISOString(),
  }));

  const tugasTambahanMaster: MasterTugasTambahan[] = [
    {
      id: 'TT-001',
      namaTugas: 'Kepala Sekolah',
      kategori: 'Pimpinan',
      bebanJamEkuivalen: 24,
      keterangan: 'Ekuivalen beban kerja penuh 24 jam mengajar manajerial, supervisi, dan kewirausahaan.',
      dasarHukum: 'Permendikbud No. 15 Tahun 2018 Pasal 6',
    },
    {
      id: 'TT-002',
      namaTugas: 'Wakasek Kurikulum',
      kategori: 'Manajemen',
      bebanJamEkuivalen: 12,
      keterangan: 'Ekuivalen 12 jam pelajaran per minggu. Wajib tatap muka minimal 12 jam.',
      dasarHukum: 'Permendikbud No. 15 Tahun 2018 Lampiran I',
    },
    {
      id: 'TT-003',
      namaTugas: 'Wakasek Kesiswaan',
      kategori: 'Manajemen',
      bebanJamEkuivalen: 12,
      keterangan: 'Ekuivalen 12 jam pelajaran per minggu untuk pembinaan kesiswaan & OSIS.',
      dasarHukum: 'Permendikbud No. 15 Tahun 2018',
    },
    {
      id: 'TT-004',
      namaTugas: 'Wakasek Sarpras & Humas',
      kategori: 'Manajemen',
      bebanJamEkuivalen: 12,
      keterangan: 'Ekuivalen 12 jam pelajaran per minggu untuk fasilitas dan kemitraan industri.',
      dasarHukum: 'Permendikbud No. 15 Tahun 2018',
    },
    {
      id: 'TT-005',
      namaTugas: 'Wali Kelas',
      kategori: 'Wali / Bimbingan',
      bebanJamEkuivalen: 2,
      keterangan: 'Ekuivalen 2 jam pelajaran per minggu per rombongan belajar.',
      dasarHukum: 'Permendikbud No. 15 Tahun 2018',
    },
    {
      id: 'TT-006',
      namaTugas: 'Guru Wali (Binaan Maks. 20 Siswa)',
      kategori: 'Wali / Bimbingan',
      bebanJamEkuivalen: 2,
      keterangan: 'Ekuivalen 2 jam pelajaran per minggu untuk pembinaan karakter & pendampingan pribadi.',
      dasarHukum: 'Pedoman Program Guru Wali Disdik Jabar 2024',
    },
    {
      id: 'TT-007',
      namaTugas: 'Kepala Laboratorium Komputer / CBT',
      kategori: 'Laboratorium / Sarpras',
      bebanJamEkuivalen: 12,
      keterangan: 'Ekuivalen 12 jam pelajaran per minggu untuk manajemen lab, PC server, dan jaringan CBT.',
      dasarHukum: 'Permendikbudristek No. 25 Tahun 2022',
    },
    {
      id: 'TT-008',
      namaTugas: 'Kepala Perpustakaan Sekolah',
      kategori: 'Laboratorium / Sarpras',
      bebanJamEkuivalen: 12,
      keterangan: 'Ekuivalen 12 jam pelajaran per minggu untuk literasi sekolah dan perpustakaan digital.',
      dasarHukum: 'Permendikbud No. 15 Tahun 2018',
    },
    {
      id: 'TT-009',
      namaTugas: 'Pembina OSIS & Ekstrakurikuler',
      kategori: 'Kesiswaan & Ekstrakurikuler',
      bebanJamEkuivalen: 2,
      keterangan: 'Ekuivalen 2 jam pelajaran per minggu.',
      dasarHukum: 'SK Pembagian Tugas Tambahan SMAN 1',
    },
    {
      id: 'TT-010',
      namaTugas: 'Koordinator Projek Penguatan Profil Pelajar Pancasila (P5)',
      kategori: 'Manajemen',
      bebanJamEkuivalen: 2,
      keterangan: 'Ekuivalen 2 jam pelajaran per minggu per tema projek P5.',
      dasarHukum: 'Kepmendikbudristek No. 56/M/2022',
    },
  ];

  const penugasanTugasTambahan: PenugasanTugasTambahan[] = [
    {
      id: 'PTT-001',
      guruId: 'GURU-000001',
      guruNama: 'Dr. H. Asep Sunandar, M.Pd.',
      tugasTambahanId: 'TT-001',
      namaTugas: 'Kepala Sekolah',
      bebanJam: 24,
      skPenugasan: 'SK.821.2/1042-Disdik/2024',
      tanggalSK: '2024-07-15',
      keterangan: 'Penugasan Kepala Sekolah SMAN 1 Bandung',
      status: 'Aktif',
    },
    {
      id: 'PTT-002',
      guruId: 'GURU-000002',
      guruNama: 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      tugasTambahanId: 'TT-002',
      namaTugas: 'Wakasek Kurikulum',
      bebanJam: 12,
      skPenugasan: 'SK.421.3/088-SMAN1/2024',
      tanggalSK: '2024-07-16',
      keterangan: 'Mengelola jadwal KBM, kalender akademik & kurikulum sekolah',
      status: 'Aktif',
    },
    {
      id: 'PTT-003',
      guruId: 'GURU-000003',
      guruNama: 'Mochamad Ridwan, S.Kom., M.T.',
      tugasTambahanId: 'TT-005',
      namaTugas: 'Wali Kelas',
      bebanJam: 2,
      skPenugasan: 'SK.421.3/089-SMAN1/2024',
      tanggalSK: '2024-07-16',
      keterangan: 'Wali Kelas X MIPA 1 (36 Siswa)',
      status: 'Aktif',
    },
    {
      id: 'PTT-004',
      guruId: 'GURU-000003',
      guruNama: 'Mochamad Ridwan, S.Kom., M.T.',
      tugasTambahanId: 'TT-007',
      namaTugas: 'Kepala Laboratorium Komputer / CBT',
      bebanJam: 12,
      skPenugasan: 'SK.421.3/095-SMAN1/2024',
      tanggalSK: '2024-07-16',
      keterangan: 'Penanggung jawab Lab Komputer 1 & Server CAT Ujian',
      status: 'Aktif',
    },
    {
      id: 'PTT-005',
      guruId: 'GURU-000004',
      guruNama: 'Rina Marlina, M.Pd.',
      tugasTambahanId: 'TT-006',
      namaTugas: 'Guru Wali (Binaan Maks. 20 Siswa)',
      bebanJam: 2,
      skPenugasan: 'SK.421.3/102-SMAN1/2024',
      tanggalSK: '2024-07-16',
      keterangan: 'Guru Wali Kelompok Binaan 1 (20 Siswa)',
      status: 'Aktif',
    },
    {
      id: 'PTT-006',
      guruId: 'GURU-000005',
      guruNama: 'Budi Santoso, S.Pd.',
      tugasTambahanId: 'TT-005',
      namaTugas: 'Wali Kelas',
      bebanJam: 2,
      skPenugasan: 'SK.421.3/090-SMAN1/2024',
      tanggalSK: '2024-07-16',
      keterangan: 'Wali Kelas X MIPA 2',
      status: 'Aktif',
    },
  ];

  const bookingCATList: BookingUjianCAT[] = [
    {
      id: 'BCAT-000001',
      ujianId: 'UJIAN-000001',
      namaUjian: 'PTS Ganjil: Informatika & Berpikir Komputasional',
      guruId: 'GURU-000003',
      guruNama: 'Mochamad Ridwan, S.Kom., M.T.',
      mapelNama: 'Informatika & Literasi Digital',
      ruanganLab: 'Lab Komputer 1 (40 Unit PC)',
      tanggalUjian: '2025-08-20',
      sesiUjian: 'Sesi 1 (07:30 - 09:30)',
      jamMulai: '07:30',
      jamSelesai: '09:30',
      rombelTarget: ['X MIPA 1'],
      estimasiPeserta: 36,
      tokenUjian: 'JBR-789X',
      statusBooking: 'Disetujui / Terjadwal',
      catatanAdmin: 'Ruang Lab 1 telah disterilkan dan jaringan LAN siap.',
      createdAt: '2025-08-16',
    },
    {
      id: 'BCAT-000002',
      ujianId: 'UJIAN-000001',
      namaUjian: 'PTS Ganjil: Informatika & Berpikir Komputasional',
      guruId: 'GURU-000003',
      guruNama: 'Mochamad Ridwan, S.Kom., M.T.',
      mapelNama: 'Informatika & Literasi Digital',
      ruanganLab: 'Lab Komputer 1 (40 Unit PC)',
      tanggalUjian: '2025-08-20',
      sesiUjian: 'Sesi 2 (10:00 - 12:00)',
      jamMulai: '10:00',
      jamSelesai: '12:00',
      rombelTarget: ['X MIPA 2'],
      estimasiPeserta: 35,
      tokenUjian: 'JBR-992K',
      statusBooking: 'Disetujui / Terjadwal',
      catatanAdmin: 'Sesi lanjutan setelah sesi 1.',
      createdAt: '2025-08-16',
    },
    {
      id: 'BCAT-000003',
      ujianId: 'UJIAN-000002',
      namaUjian: 'Ulangan Harian 1: Panggelar Basa Sunda & Tatakrama',
      guruId: 'GURU-000002',
      guruNama: 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      mapelNama: 'Bahasa dan Sastra Sunda',
      ruanganLab: 'Lab Komputer 2 (36 Unit PC)',
      tanggalUjian: '2025-08-22',
      sesiUjian: 'Sesi 1 (07:30 - 09:30)',
      jamMulai: '07:30',
      jamSelesai: '09:30',
      rombelTarget: ['X MIPA 1'],
      estimasiPeserta: 36,
      tokenUjian: 'SND-4421',
      statusBooking: 'Diajukan',
      catatanAdmin: 'Menunggu konfirmasi ketersediaan teknisi lab.',
      createdAt: '2025-08-17',
    },
  ];

  const portofolioSiswaList: PortofolioSiswaRecord[] = [
    {
      id: 'PORT-000001',
      siswaId: 'SIS-000001',
      nisn: '0078129301',
      namaSiswa: 'Ahmad Fajar Nugraha',
      ujianId: 'UJIAN-000001',
      namaUjian: 'PTS Ganjil: Informatika & Berpikir Komputasional',
      mapelNama: 'Informatika & Literasi Digital',
      tanggalPelaksanaan: '2025-08-18',
      nilai: 92,
      kkm: 75,
      statusKelulusan: 'Tuntas',
      totalSoal: 5,
      jumlahBenar: 5,
      jumlahSalah: 0,
      catatanEvaluasi: 'Pemahaman logika komputasi, algoritma, dan konversi biner sangat istimewa.',
      kategoriCapaian: 'Sangat Baik',
    },
    {
      id: 'PORT-000002',
      siswaId: 'SIS-000002',
      nisn: '0078129302',
      namaSiswa: 'Siti Nurhaliza Putri',
      ujianId: 'UJIAN-000001',
      namaUjian: 'PTS Ganjil: Informatika & Berpikir Komputasional',
      mapelNama: 'Informatika & Literasi Digital',
      tanggalPelaksanaan: '2025-08-18',
      nilai: 84,
      kkm: 75,
      statusKelulusan: 'Tuntas',
      totalSoal: 5,
      jumlahBenar: 4,
      jumlahSalah: 1,
      catatanEvaluasi: 'Bagus, perlu peningkatan ketelitian pada pemahaman hardware jaringan.',
      kategoriCapaian: 'Baik',
    },
    {
      id: 'PORT-000003',
      siswaId: 'SIS-000003',
      nisn: '0078129303',
      namaSiswa: 'Dadang Hermawan Sutisna',
      ujianId: 'UJIAN-000001',
      namaUjian: 'PTS Ganjil: Informatika & Berpikir Komputasional',
      mapelNama: 'Informatika & Literasi Digital',
      tanggalPelaksanaan: '2025-08-18',
      nilai: 68,
      kkm: 75,
      statusKelulusan: 'Belum Tuntas (Remedial)',
      totalSoal: 5,
      jumlahBenar: 3,
      jumlahSalah: 2,
      catatanEvaluasi: 'Perlu bimbingan remedial pada materi gerbang logika dan algoritma percabangan.',
      kategoriCapaian: 'Perlu Bimbingan',
    },
  ];

  return {
    config,
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    users,
    guru,
    siswa,
    mapel,
    rombel,
    jadwalKBM,
    bankSoal,
    ujianList,
    pesertaUjianSessions,
    presensiList,
    presensi: presensiList,
    izinSakitList,
    pengumumanList,
    pengumuman: pengumumanList,
    userProfiles,
    driveFoldersTree,
    sheetsMetadata,
    tugasTambahanMaster,
    penugasanTugasTambahan,
    bookingCATList,
    portofolioSiswaList,
  };
}

export class MockDatabaseService {
  private static instance: MockDatabaseService;
  private state: FullDatabaseState;

  private constructor() {
    this.state = this.loadFromStorage();
  }

  public static getInstance(): MockDatabaseService {
    if (!MockDatabaseService.instance) {
      MockDatabaseService.instance = new MockDatabaseService();
    }
    return MockDatabaseService.instance;
  }

  private loadFromStorage(): FullDatabaseState {
    const defaults = getInitialSeedDatabase();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaults,
          ...parsed,
          config: { ...defaults.config, ...(parsed.config || {}) },
          rolePermissions: parsed.rolePermissions || defaults.rolePermissions,
          users: Array.isArray(parsed.users) ? parsed.users : defaults.users,
          guru: Array.isArray(parsed.guru) ? parsed.guru : defaults.guru,
          siswa: Array.isArray(parsed.siswa) ? parsed.siswa : defaults.siswa,
          mapel: Array.isArray(parsed.mapel) ? parsed.mapel : defaults.mapel,
          rombel: Array.isArray(parsed.rombel) ? parsed.rombel : defaults.rombel,
          jadwalKBM: Array.isArray(parsed.jadwalKBM) ? parsed.jadwalKBM : defaults.jadwalKBM,
          bankSoal: Array.isArray(parsed.bankSoal) ? parsed.bankSoal : defaults.bankSoal,
          ujianList: Array.isArray(parsed.ujianList) ? parsed.ujianList : defaults.ujianList,
          pesertaUjianSessions: Array.isArray(parsed.pesertaUjianSessions) ? parsed.pesertaUjianSessions : defaults.pesertaUjianSessions,
          presensiList: Array.isArray(parsed.presensiList)
            ? parsed.presensiList
            : Array.isArray(parsed.presensi)
            ? parsed.presensi
            : defaults.presensiList,
          presensi: Array.isArray(parsed.presensi)
            ? parsed.presensi
            : Array.isArray(parsed.presensiList)
            ? parsed.presensiList
            : defaults.presensi,
          izinSakitList: Array.isArray(parsed.izinSakitList) ? parsed.izinSakitList : defaults.izinSakitList,
          pengumumanList: Array.isArray(parsed.pengumumanList)
            ? parsed.pengumumanList
            : Array.isArray(parsed.pengumuman)
            ? parsed.pengumuman
            : defaults.pengumumanList,
          pengumuman: Array.isArray(parsed.pengumuman)
            ? parsed.pengumuman
            : Array.isArray(parsed.pengumumanList)
            ? parsed.pengumumanList
            : defaults.pengumuman,
          userProfiles: Array.isArray(parsed.userProfiles) ? parsed.userProfiles : defaults.userProfiles,
          tugasTambahanMaster: Array.isArray(parsed.tugasTambahanMaster) ? parsed.tugasTambahanMaster : defaults.tugasTambahanMaster,
          penugasanTugasTambahan: Array.isArray(parsed.penugasanTugasTambahan) ? parsed.penugasanTugasTambahan : defaults.penugasanTugasTambahan,
          bookingCATList: Array.isArray(parsed.bookingCATList) ? parsed.bookingCATList : defaults.bookingCATList,
          portofolioSiswaList: Array.isArray(parsed.portofolioSiswaList) ? parsed.portofolioSiswaList : defaults.portofolioSiswaList,
          driveFoldersTree: Array.isArray(parsed.driveFoldersTree) ? parsed.driveFoldersTree : defaults.driveFoldersTree,
          sheetsMetadata: Array.isArray(parsed.sheetsMetadata) ? parsed.sheetsMetadata : defaults.sheetsMetadata,
        };
      }
    } catch (e) {
      console.warn('Failed to load database from storage, seeding default.', e);
    }
    const seeded = defaults;
    this.saveToStorage(seeded);
    return seeded;
  }

  public saveToStorage(state?: FullDatabaseState) {
    if (state) this.state = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save database to storage', e);
    }
  }

  public resetDatabase(): FullDatabaseState {
    this.state = getInitialSeedDatabase();
    this.saveToStorage();
    return this.state;
  }

  public getState(): FullDatabaseState {
    if (!this.state.presensi) this.state.presensi = this.state.presensiList || [];
    if (!this.state.pengumuman) this.state.pengumuman = this.state.pengumumanList || [];
    return this.state;
  }

  // ID Generators
  public generateId(prefix: string = 'ID'): string {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomNum}`;
  }

  // Auth & Permissions
  public checkLogin(userId: string): UserAccount | null {
    return this.state.users.find(u => u.id === userId && u.status === 'Aktif') || null;
  }

  public checkPermission(user: UserAccount, permissionCode: string): boolean {
    if (user.role === 'SUPER ADMIN') return true;

    // Check user custom permissions override
    if (user.customPermissions && user.customPermissions.includes(permissionCode)) {
      return true;
    }

    const rolePerms = this.state.rolePermissions[user.role] || [];
    return rolePerms.includes(permissionCode);
  }

  public checkOwnership(user: UserAccount, dataType: 'siswa' | 'rombel' | 'soal' | 'ujian', dataId: string): boolean {
    if (user.role === 'SUPER ADMIN' || user.role === 'ADMIN' || user.role === 'KEPALA SEKOLAH') return true;

    const teacher = this.state.guru.find(g => g.id === user.referenceId);
    if (!teacher) return false;

    if (dataType === 'siswa') {
      const siswa = this.state.siswa.find(s => s.id === dataId);
      if (!siswa) return false;

      if (user.role === 'WALI KELAS') {
        return siswa.waliKelasId === teacher.id;
      }
      if (user.role === 'GURU WALI') {
        return siswa.guruWaliId === teacher.id;
      }
      return false;
    }

    if (dataType === 'rombel') {
      const rom = this.state.rombel.find(r => r.id === dataId);
      if (!rom) return false;
      return rom.waliKelasId === teacher.id || (rom.guruWaliIds || []).includes(teacher.id);
    }

    if (dataType === 'soal') {
      const soal = this.state.bankSoal.find(s => s.id === dataId);
      return soal ? soal.pembuatId === teacher.id : false;
    }

    if (dataType === 'ujian') {
      const ujian = this.state.ujianList.find(u => u.id === dataId);
      return ujian ? ujian.pembuatId === teacher.id : false;
    }

    return false;
  }

  // Conflict Checking for KBM Schedule
  public validateKBMConflict(schedule: Omit<KBMSchedule, 'id'>, currentScheduleId?: string): { hasConflict: boolean; reason?: string } {
    const otherSchedules = this.state.jadwalKBM.filter(k => k.id !== currentScheduleId);

    // 1. Teacher double booking check: Guru mengajar dua kelas pada waktu yang sama
    const teacherConflict = otherSchedules.find(
      k => k.hari === schedule.hari &&
           k.jamKe === schedule.jamKe &&
           k.guruId === schedule.guruId
    );
    if (teacherConflict) {
      const guru = this.state.guru.find(g => g.id === schedule.guruId);
      const rombel = this.state.rombel.find(r => r.id === teacherConflict.rombelId);
      return {
        hasConflict: true,
        reason: `Bentrok Guru: ${guru?.nama || 'Guru'} sudah terjadwal mengajar di ${rombel?.namaRombel || 'kelas lain'} pada ${schedule.hari} Jam ke-${schedule.jamKe} (${schedule.jamMulai} - ${schedule.jamSelesai}).`,
      };
    }

    // 2. Rombel double booking check: Rombel memiliki dua mata pelajaran pada jam yang sama
    const rombelConflict = otherSchedules.find(
      k => k.hari === schedule.hari &&
           k.jamKe === schedule.jamKe &&
           k.rombelId === schedule.rombelId
    );
    if (rombelConflict) {
      const mapel = this.state.mapel.find(m => m.id === rombelConflict.mapelId);
      return {
        hasConflict: true,
        reason: `Bentrok Rombel: Rombel sudah memiliki jadwal mata pelajaran "${mapel?.namaMapel || 'Mapel'}" pada ${schedule.hari} Jam ke-${schedule.jamKe}.`,
      };
    }

    // 3. Room double booking check: Ruangan digunakan dua kelas pada waktu yang sama
    if (schedule.ruang && schedule.ruang.trim() !== '') {
      const roomConflict = otherSchedules.find(
        k => k.hari === schedule.hari &&
             k.jamKe === schedule.jamKe &&
             k.ruang.trim().toLowerCase() === schedule.ruang.trim().toLowerCase()
      );
      if (roomConflict) {
        const rombel = this.state.rombel.find(r => r.id === roomConflict.rombelId);
        return {
          hasConflict: true,
          reason: `Bentrok Ruangan: Ruang "${schedule.ruang}" sedang digunakan oleh ${rombel?.namaRombel || 'rombel lain'} pada ${schedule.hari} Jam ke-${schedule.jamKe}.`,
        };
      }
    }

    return { hasConflict: false };
  }

  // Token Generator for CAT Exams (Non-guessable, expiration-ready)
  public generateExamToken(prefix: string = 'JBR'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 4; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${token}`;
  }

  // ---------------------------------------------------------------------------
  // 1. GURU WALI QUOTA CHECKER (STANDAR 20 SISWA BINAAN)
  // ---------------------------------------------------------------------------
  public getGuruWaliQuota(guruId: string) {
    const guru = this.state.guru.find(g => g.id === guruId);
    const siswaBinaan = this.state.siswa.filter(s => s.guruWaliId === guruId);
    const count = siswaBinaan.length;
    const maxQuota = 20;

    let status: 'Kurang' | 'Ideal' | 'Lebih' = 'Ideal';
    let message = `Jumlah siswa binaan (${count}/20) telah memenuhi standar ideal.`;
    let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';

    if (count < maxQuota) {
      status = 'Kurang';
      message = `Perhatian: Jumlah siswa binaan (${count}/20) masih kurang dari kuota standar (20 siswa), namun sistem mengizinkan untuk melanjutkan.`;
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (count > maxQuota) {
      status = 'Lebih';
      message = `Peringatan Kuota Lebih: Guru Wali telah membina (${count}/20) siswa (melebihi kuota standar 20 siswa), namun sistem mengizinkan untuk melanjutkan.`;
      badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
    }

    return {
      guruId,
      guruNama: guru?.nama || 'Guru',
      count,
      maxQuota,
      status,
      message,
      badgeColor,
      siswaList: siswaBinaan,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. TEACHER WORKLOAD (BEBAN 24 JAM MENGAJAR & TUGAS TAMBAHAN & BENTROK)
  // ---------------------------------------------------------------------------
  public getTeacherWorkload(guruId: string) {
    const guru = this.state.guru.find(g => g.id === guruId);
    
    // Hitung Jam Tatap Muka KBM (1 jadwal = 2 jam pelajaran default)
    const schedules = this.state.jadwalKBM.filter(k => k.guruId === guruId);
    const kbmHours = schedules.length * 2;

    // Hitung Beban Jam Ekuivalen Tugas Tambahan Aktif
    const duties = (this.state.penugasanTugasTambahan || []).filter(
      p => p.guruId === guruId && p.status === 'Aktif'
    );
    const tugasTambahanHours = duties.reduce((acc, curr) => acc + (curr.bebanJam || 0), 0);

    const totalHours = kbmHours + tugasTambahanHours;
    const targetHours = 24;

    // Cek Bentrok Jadwal Mengajar Internal Guru
    const conflictReasons: string[] = [];
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        if (
          schedules[i].hari === schedules[j].hari &&
          schedules[i].jamKe === schedules[j].jamKe
        ) {
          const r1 = this.state.rombel.find(r => r.id === schedules[i].rombelId)?.namaRombel || 'Kelas A';
          const r2 = this.state.rombel.find(r => r.id === schedules[j].rombelId)?.namaRombel || 'Kelas B';
          conflictReasons.push(
            `Bentrok Jam Mengajar: Hari ${schedules[i].hari} Jam ke-${schedules[i].jamKe} terdaftar di ${r1} dan ${r2}`
          );
        }
      }
    }

    let statusBeban: 'Kurang' | 'Ideal' | 'Lebih' = 'Ideal';
    let message = `Memenuhi beban kerja wajib (${totalHours}/24 Jam).`;
    let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';

    if (totalHours < targetHours) {
      statusBeban = 'Kurang';
      message = `Beban mengajar kurang (${totalHours}/24 Jam). Perlu tambahan ${targetHours - totalHours} jam KBM / Tugas Tambahan untuk syarat sertifikasi.`;
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (totalHours > targetHours) {
      statusBeban = 'Lebih';
      message = `Beban mengajar melebihi standar (${totalHours}/24 Jam). Terpenuhi dan berlebih ${totalHours - targetHours} jam.`;
      badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
    }

    return {
      guruId,
      guruNama: guru?.nama || 'Guru',
      kbmHours,
      tugasTambahanHours,
      totalHours,
      targetHours,
      statusBeban,
      message,
      badgeColor,
      hasConflict: conflictReasons.length > 0,
      conflictReasons,
      schedules,
      duties,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. BOOKING LAB UJIAN CAT & COLLISION CHECK
  // ---------------------------------------------------------------------------
  public validateCATBooking(
    booking: Omit<BookingUjianCAT, 'id'>,
    excludeBookingId?: string
  ): { hasConflict: boolean; reason?: string } {
    const otherBookings = (this.state.bookingCATList || []).filter(
      b => b.id !== excludeBookingId && b.statusBooking !== 'Dibatalkan'
    );

    const conflict = otherBookings.find(
      b =>
        b.ruanganLab === booking.ruanganLab &&
        b.tanggalUjian === booking.tanggalUjian &&
        b.sesiUjian === booking.sesiUjian
    );

    if (conflict) {
      return {
        hasConflict: true,
        reason: `Bentrok Ruang CAT: "${booking.ruanganLab}" sudah dibooking oleh ${conflict.guruNama} untuk ujian "${conflict.namaUjian}" pada ${booking.tanggalUjian} (${booking.sesiUjian}).`,
      };
    }

    return { hasConflict: false };
  }

  // ---------------------------------------------------------------------------
  // 4. RECORD CAT EXAM RESULT TO STUDENT PORTOFOLIO
  // ---------------------------------------------------------------------------
  public recordExamResultToPortofolio(record: Omit<PortofolioSiswaRecord, 'id'>) {
    if (!this.state.portofolioSiswaList) {
      this.state.portofolioSiswaList = [];
    }

    // Check if entry for this student and exam already exists
    const existingIndex = this.state.portofolioSiswaList.findIndex(
      p => p.siswaId === record.siswaId && p.ujianId === record.ujianId
    );

    const newRecord: PortofolioSiswaRecord = {
      ...record,
      id: this.generateId('PORT'),
    };

    if (existingIndex >= 0) {
      this.state.portofolioSiswaList[existingIndex] = {
        ...this.state.portofolioSiswaList[existingIndex],
        ...record,
      };
    } else {
      this.state.portofolioSiswaList.unshift(newRecord);
    }

    this.saveToStorage();
    return newRecord;
  }
}

export const dbService = MockDatabaseService.getInstance();
