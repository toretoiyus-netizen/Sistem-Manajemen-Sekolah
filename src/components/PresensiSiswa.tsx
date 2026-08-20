import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarCheck2,
  Calendar,
  QrCode,
  Users,
  Download,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  AlertCircle,
  FileSpreadsheet,
  Save,
  BookOpen,
  FileText,
  ShieldCheck,
  Award,
  RefreshCw,
  XCircle,
  Check,
  X,
  Upload,
  Scan,
  Compass,
  FileCheck,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PresensiRecord, Siswa, UserAccount, IzinSakitSubmission } from '../types';
import { dbService } from '../services/mockDatabase';
import { exportToF4LandscapePDF } from '../utils/pdfExportUtil';

interface PresensiSiswaProps {
  currentUser: UserAccount;
}

// Haversine formula to calculate exact distance between two coordinates in meters
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Audio Beep generator for camera snapshot & barcode scan
function playBeepSound(frequency = 880, duration = 0.12) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore audio context autoplay restriction
  }
}

export const PresensiSiswa: React.FC<PresensiSiswaProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const isStudent = currentUser.role === 'SISWA';
  const isTeacherOrAdmin = !isStudent;

  // School GPS Configuration set by Super Admin
  const schoolCoordinates = db.config.koordinatSekolah || {
    lat: -6.8905,
    lng: 107.6167,
    radiusMeters: 250,
  };

  // Find linked student if logged in as SISWA
  const currentStudent = isStudent
    ? db.siswa.find(
        (s) =>
          s.id === currentUser.referenceId ||
          s.nisn === currentUser.username ||
          s.nis === currentUser.username ||
          s.namaLengkap.toLowerCase() === currentUser.nama.toLowerCase()
      ) || db.siswa[0]
    : null;

  // Active tab state
  const [activeTab, setActiveTab] = useState<
    'mandiri' | 'usulan_izin' | 'riwayat_siswa' | 'kartu_siswa' | 'batch' | 'validasi_izin' | 'qrcode' | 'rekap'
  >(isStudent ? 'mandiri' : 'batch');

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedRombel, setSelectedRombel] = useState<string>(
    db.rombel[0]?.id || 'ROM-000001'
  );
  const [selectedMapel, setSelectedMapel] = useState<string>(
    db.mapel[0]?.id || 'MAP-000001'
  );

  // Journal notes for teacher
  const [journalMateri, setJournalMateri] = useState('Penerapan Berpikir Komputasional & Algoritma');
  const [journalCatatan, setJournalCatatan] = useState('Siswa aktif berdiskusi. 2 siswa izin kegiatan lomba.');

  // Students in selected rombel (for teacher view)
  const rombelObj = db.rombel.find((r) => r.id === selectedRombel);
  const studentsInClass = db.siswa.filter((s) => s.rombel === rombelObj?.namaRombel);

  // Local Attendance State for Batch Checklist
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'; catatan: string }>
  >(() => {
    const init: Record<string, { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'; catatan: string }> = {};
    db.siswa.forEach((s) => {
      init[s.id] = { status: 'Hadir', catatan: '' };
    });
    return init;
  });

  // =========================================================================
  // 1. LIVE CAMERA & SWAFOTO (SELFIE) STATE
  // =========================================================================
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);

  // Auto-start camera for selfie
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Kamera perangkat dapat diaktifkan secara otomatis saat tombol swafoto ditekan.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedSelfie(dataUrl);
        playBeepSound(1046, 0.1);
        stopCamera();
      }
    } else {
      // Simulated selfie fallback
      setCapturedSelfie(
        currentStudent?.foto ||
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
      );
      playBeepSound(1046, 0.1);
    }
  };

  // Trigger camera on mount of selfie tab
  useEffect(() => {
    if (isStudent && activeTab === 'mandiri' && !capturedSelfie) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, isStudent]);

  // =========================================================================
  // 2. GPS & GEOFENCING STRICT LOCATION VALIDATION
  // =========================================================================
  const [gpsSimMode, setGpsSimMode] = useState<'real' | 'inside' | 'outside'>('inside');
  const [studentGps, setStudentGps] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    distance: number;
    isWithinRadius: boolean;
    address: string;
  }>({
    lat: schoolCoordinates.lat,
    lng: schoolCoordinates.lng,
    accuracy: 10,
    distance: 12,
    isWithinRadius: true,
    address: 'Radius Gerbang Kampus SMAN 1 Bandung (Valid GPS)',
  });
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Recalculate distance when coordinates or preset change
  const updateGpsCalculation = (lat: number, lng: number, acc: number, addr: string) => {
    const dist = calculateDistanceInMeters(lat, lng, schoolCoordinates.lat, schoolCoordinates.lng);
    const valid = dist <= schoolCoordinates.radiusMeters;
    setStudentGps({
      lat,
      lng,
      accuracy: acc,
      distance: dist,
      isWithinRadius: valid,
      address: addr,
    });
  };

  const handleRealGpsDetection = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung fitur Geolocation');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        updateGpsCalculation(lat, lng, acc, `Koordinat GPS Perangkat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      },
      (err) => {
        setIsDetectingGps(false);
        alert(`Gagal mendeteksi lokasi GPS: ${err.message}. Menggunakan simulasi.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleGpsModeChange = (mode: 'real' | 'inside' | 'outside') => {
    setGpsSimMode(mode);
    if (mode === 'inside') {
      updateGpsCalculation(
        schoolCoordinates.lat + 0.00008,
        schoolCoordinates.lng + 0.00008,
        8,
        'Kampus SMAN 1 Bandung, Jawa Barat (Di dalam area sekolah)'
      );
    } else if (mode === 'outside') {
      // 3.5 km away from school
      updateGpsCalculation(
        schoolCoordinates.lat + 0.032,
        schoolCoordinates.lng + 0.032,
        25,
        'Di Luar Radius: Kediaman Siswa / Luar Wilayah Sekolah (±3.6 km)'
      );
    } else {
      handleRealGpsDetection();
    }
  };

  // =========================================================================
  // 3. STUDENT PRESENSI MANDIRI & USULAN IZIN/SAKIT WORKFLOW
  // =========================================================================
  const [jenisPresensi, setJenisPresensi] = useState<'Masuk' | 'Pulang'>('Masuk');
  const [studentSelfStatus, setStudentSelfStatus] = useState<'Hadir' | 'Sakit' | 'Izin'>('Hadir');
  const [studentSelfNotes, setStudentSelfNotes] = useState('');
  const [studentIzinStartDate, setStudentIzinStartDate] = useState(selectedDate);
  const [studentIzinEndDate, setStudentIzinEndDate] = useState(selectedDate);
  const [studentIzinFileProof, setStudentIzinFileProof] = useState<string | null>(null);
  const [studentSearchHistory, setStudentSearchHistory] = useState('');
  const [studentFeedbackMsg, setStudentFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Modals for GPS Violation and Holiday Blocking
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayReason, setHolidayReason] = useState('');

  // Student-Only presensi records
  const myPresensiList = currentStudent
    ? db.presensi.filter(
        (p) => p.siswaId === currentStudent.id || p.nisn === currentStudent.nisn
      )
    : [];

  // Student-Only izin/sakit submissions
  const myIzinSubmissions = currentStudent
    ? (db.izinSakitList || []).filter(
        (iz) => iz.siswaId === currentStudent.id || iz.nisn === currentStudent.nisn
      )
    : [];

  // Pending submissions for Wali Kelas / Teacher / Admin
  const allIzinSubmissions = db.izinSakitList || [];
  const pendingIzinCount = allIzinSubmissions.filter((i) => i.statusPersetujuan === 'Menunggu').length;

  const studentHadirCount = myPresensiList.filter((p) => p.status === 'Hadir').length;
  const studentIzinCount = myPresensiList.filter((p) => p.status === 'Izin').length;
  const studentSakitCount = myPresensiList.filter((p) => p.status === 'Sakit').length;
  const studentAlpaCount = myPresensiList.filter((p) => p.status === 'Alpa').length;
  const studentTotalPresensi = myPresensiList.length;
  const studentRate =
    studentTotalPresensi > 0
      ? Math.round((studentHadirCount / studentTotalPresensi) * 100)
      : 100;

  // Submit Presensi Hadir / Usulan Izin-Sakit
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    // 1. Check Holiday & Non-Active Day Configuration
    const sysCfg = dbService.getSystemConfig();
    const hariLiburList = sysCfg.hariLiburList || [];
    const isHoliday = hariLiburList.some((h) => h.tanggal === selectedDate);

    const dateParts = selectedDate.split('-');
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[dateObj.getDay()];
    const hariAktif = sysCfg.jadwalPresensi?.hariAktif || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const isNonActiveDay = !hariAktif.includes(dayName);

    if (isHoliday || isNonActiveDay) {
      const liburObj = hariLiburList.find((h) => h.tanggal === selectedDate);
      const reason = isHoliday
        ? `Hari Libur Sekolah: ${liburObj?.keterangan || 'Libur Nasional / Khusus'}`
        : `Hari ${dayName} Bukan Merupakan Hari Aktif Presensi Sekolah.`;
      setHolidayReason(reason);
      setShowHolidayModal(true);
      return;
    }

    // IF STATUS IS 'HADIR' -> STRICT GPS & SELFIE CHECK
    if (studentSelfStatus === 'Hadir') {
      if (!studentGps.isWithinRadius) {
        setShowGpsModal(true);
        return;
      }

      if (!capturedSelfie) {
        setStudentFeedbackMsg({
          type: 'error',
          text: 'Harap ambil swafoto (selfie) wajah berseragam sebelum mengirim presensi hadir.',
        });
        return;
      }

      const timeNow = new Date().toLocaleTimeString('id-ID');
      const newRec: PresensiRecord = {
        id: dbService.generateId('PRS'),
        tanggal: selectedDate,
        siswaId: currentStudent.id,
        namaSiswa: currentStudent.namaLengkap,
        nisn: currentStudent.nisn,
        rombelId: db.rombel.find((r) => r.namaRombel === currentStudent.rombel)?.id || 'ROM-000001',
        rombelNama: currentStudent.rombel,
        mapelId: 'MAP-UMUM',
        guruId: currentStudent.waliKelasId || 'GURU-000003',
        status: 'Hadir',
        keterangan: studentSelfNotes || `Presensi ${jenisPresensi} Mandiri Siswa (Validasi GPS & Verifikasi Swafoto)`,
        metode: jenisPresensi === 'Masuk' ? 'Mandiri Siswa (Masuk)' : 'Mandiri Siswa (Pulang)',
        waktuPresensi: timeNow,
        jamMasuk: jenisPresensi === 'Masuk' ? timeNow : undefined,
        jamPulang: jenisPresensi === 'Pulang' ? timeNow : undefined,
        waktuPresensiMasuk: jenisPresensi === 'Masuk' ? timeNow : undefined,
        waktuPresensiPulang: jenisPresensi === 'Pulang' ? timeNow : undefined,
        lokasi: {
          latitude: studentGps.lat,
          longitude: studentGps.lng,
          accuracy: studentGps.accuracy,
          address: studentGps.address,
          isWithinSchoolRadius: true,
        },
        fotoSelfie: capturedSelfie,
      };

      dbService.recordPresensi(newRec);
      playBeepSound(1046, 0.15);

      setStudentFeedbackMsg({
        type: 'success',
        text: `Presensi ${jenisPresensi} Mandiri Anda pada tanggal ${selectedDate} (${timeNow}) berhasil diverifikasi dan tersimpan!`,
      });

      setTimeout(() => {
        setActiveTab('riwayat_siswa');
        setStudentFeedbackMsg(null);
      }, 1800);
    } else {
      // IF STATUS IS 'IZIN' OR 'SAKIT' -> PROPOSAL ONLY (USULAN PERLU VALIDASI WALI KELAS)
      if (!studentSelfNotes.trim()) {
        setStudentFeedbackMsg({
          type: 'error',
          text: `Harap isi alasan lengkap pengajuan ${studentSelfStatus} dan informasi terkait.`,
        });
        return;
      }

      const newUsulan: IzinSakitSubmission = {
        id: dbService.generateId('IZN'),
        siswaId: currentStudent.id,
        nisn: currentStudent.nisn,
        namaSiswa: currentStudent.namaLengkap,
        rombelNama: currentStudent.rombel,
        tanggalMulai: studentIzinStartDate,
        tanggalSelesai: studentIzinEndDate,
        kategori: studentSelfStatus,
        alasan: studentSelfNotes,
        lampiranFoto: studentIzinFileProof || capturedSelfie || undefined,
        statusPersetujuan: 'Menunggu',
        createdAt: new Date().toISOString().split('T')[0],
      };

      if (!db.izinSakitList) {
        db.izinSakitList = [];
      }
      db.izinSakitList.unshift(newUsulan);
      dbService.saveToStorage(db);
      playBeepSound(880, 0.15);

      setStudentFeedbackMsg({
        type: 'success',
        text: `Usulan ${studentSelfStatus} Anda berhasil dikirim! Status saat ini: "Menunggu Validasi Wali Kelas". Kehadiran akan tercatat resmi setelah disetujui oleh Wali Kelas.`,
      });

      setTimeout(() => {
        setActiveTab('usulan_izin');
        setStudentFeedbackMsg(null);
      }, 2000);
    }
  };

  // =========================================================================
  // 4. WALI KELAS / GURU: VALIDASI IZIN & SAKIT
  // =========================================================================
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApproveSubmission = (submission: IzinSakitSubmission) => {
    // 1. Update status in izinSakitList
    submission.statusPersetujuan = 'Disetujui';
    submission.disetujuiOleh = currentUser.nama;
    submission.catatan = `Disetujui pada ${new Date().toLocaleTimeString('id-ID')}`;

    // 2. Automatically record in official presensi database
    const officialPresensi: PresensiRecord = {
      id: dbService.generateId('PRS'),
      tanggal: submission.tanggalMulai,
      siswaId: submission.siswaId,
      namaSiswa: submission.namaSiswa,
      nisn: submission.nisn,
      rombelId: db.rombel.find((r) => r.namaRombel === submission.rombelNama)?.id || 'ROM-000001',
      rombelNama: submission.rombelNama,
      status: submission.kategori,
      keterangan: `Disetujui Wali Kelas (${currentUser.nama}): ${submission.alasan}`,
      metode: 'Mandiri Siswa (GPS & Selfie)',
      waktuPresensi: new Date().toLocaleTimeString('id-ID'),
      lampiranSurat: submission.lampiranFoto,
    };

    db.presensi.unshift(officialPresensi);
    dbService.saveToStorage(db);
    playBeepSound(1046, 0.1);
    alert(`Usulan ${submission.kategori} atas nama ${submission.namaSiswa} berhasil DISETUJUI dan dicatat dalam rekapitulasi kehadiran resmi.`);
  };

  const handleRejectSubmission = (submissionId: string) => {
    const item = db.izinSakitList.find((i) => i.id === submissionId);
    if (item) {
      item.statusPersetujuan = 'Ditolak';
      item.disetujuiOleh = currentUser.nama;
      item.catatan = rejectionReason || 'Alasan pengajuan tidak memenuhi kriteria / surat tidak valid.';
      dbService.saveToStorage(db);
      setRejectModalId(null);
      setRejectionReason('');
      alert(`Usulan telah DITOLAK. Status diperbarui.`);
    }
  };

  // =========================================================================
  // 5. LIVE BARCODE / QR SCANNER WITH LASER INFRARED & LIVE CAMERA (ADMIN ONLY)
  // =========================================================================
  const [scannedNisn, setScannedNisn] = useState('');
  const [scannedStudentResult, setScannedStudentResult] = useState<Siswa | null>(null);
  const [scanHistoryLog, setScanHistoryLog] = useState<
    Array<{ siswa: Siswa; waktu: string; metode: string }>
  >([]);

  const startScannerCamera = async () => {
    try {
      if (scannerStreamRef.current) {
        scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      scannerStreamRef.current = stream;
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream;
        scannerVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Scanner camera error:', err);
    }
  };

  const stopScannerCamera = () => {
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isStudent && activeTab === 'qrcode') {
      startScannerCamera();
    }
    return () => {
      stopScannerCamera();
    };
  }, [activeTab, isStudent]);

  const processBarcodeScan = (nisnOrCode: string) => {
    const code = nisnOrCode.trim();
    if (!code) return;

    const found = db.siswa.find(
      (s) =>
        s.nisn === code ||
        s.nis === code ||
        s.id === code ||
        s.namaLengkap.toLowerCase().includes(code.toLowerCase())
    );

    if (found) {
      playBeepSound(1200, 0.15);
      setScannedStudentResult(found);

      // Record presence
      const newRec: PresensiRecord = {
        id: dbService.generateId('PRS'),
        tanggal: selectedDate,
        siswaId: found.id,
        namaSiswa: found.namaLengkap,
        nisn: found.nisn,
        rombelId: db.rombel.find((r) => r.namaRombel === found.rombel)?.id || 'ROM-000001',
        rombelNama: found.rombel,
        status: 'Hadir',
        keterangan: 'Tap Kartu Pelajar Digital / Infrared Barcode Gate Scanner',
        metode: 'Barcode/QR Code',
        waktuPresensi: new Date().toLocaleTimeString('id-ID'),
      };

      db.presensi.unshift(newRec);
      dbService.saveToStorage(db);

      setScanHistoryLog((prev) => [
        { siswa: found, waktu: new Date().toLocaleTimeString('id-ID'), metode: 'Laser / Barcode Scan' },
        ...prev.slice(0, 9),
      ]);
      setScannedNisn('');
    } else {
      playBeepSound(300, 0.2);
      alert(`Kode Barcode / NISN "${code}" tidak ditemukan dalam pangkalan data siswa aktif.`);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcodeScan(scannedNisn);
  };

  // =========================================================================
  // 6. TEACHER BATCH CHECKLIST HANDLERS
  // =========================================================================
  const handleStatusChange = (siswaId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa') => {
    setAttendanceState((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        status,
      },
    }));
  };

  const handleCatatanChange = (siswaId: string, catatan: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        catatan,
      },
    }));
  };

  const handleSetAllPresent = () => {
    const updated = { ...attendanceState };
    studentsInClass.forEach((s) => {
      updated[s.id] = { ...updated[s.id], status: 'Hadir' };
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = () => {
    const currentTeacher = db.guru.find((g) => g.id === currentUser.referenceId);

    studentsInClass.forEach((siswa) => {
      const state = attendanceState[siswa.id] || { status: 'Hadir', catatan: '' };
      const newRec: PresensiRecord = {
        id: dbService.generateId('PRS'),
        tanggal: selectedDate,
        siswaId: siswa.id,
        namaSiswa: siswa.namaLengkap,
        nisn: siswa.nisn,
        rombelId: selectedRombel,
        rombelNama: rombelObj?.namaRombel || 'X MIPA 1',
        mapelId: selectedMapel,
        guruId: currentTeacher?.id || 'GURU-000001',
        status: state.status,
        keterangan: state.catatan,
        metode: 'Manual Guru',
        waktuPresensi: new Date().toLocaleTimeString('id-ID'),
      };
      db.presensi.push(newRec);
    });

    dbService.saveToStorage(db);
    playBeepSound(1046, 0.15);
    alert(`Presensi untuk ${studentsInClass.length} siswa berhasil disimpan ke database presensi sekolah!`);
  };

  // =========================================================================
  // 7. EXPORT HANDLERS (PDF & EXCEL) - STRICTLY RESPECTS ROLE
  // =========================================================================
  const handleExportPDF = () => {
    const recordsToExport = isStudent ? myPresensiList : db.presensi;

    const head = [
      ['No', 'Tanggal', 'Nama Lengkap Siswa', 'NISN', 'Rombel', 'Status Kehadiran', 'Keterangan', 'Metode Presensi', 'Waktu Tercatat'],
    ];

    const body = recordsToExport.map((p, idx) => [
      idx + 1,
      p.tanggal,
      p.namaSiswa,
      p.nisn,
      p.rombelNama,
      p.status,
      p.keterangan || '-',
      p.metode,
      p.waktuPresensi || '-',
    ]);

    exportToF4LandscapePDF({
      title: isStudent
        ? `Laporan Riwayat Kehadiran Siswa Mandiri - ${currentStudent?.namaLengkap}`
        : 'Laporan Rekapitulasi Presensi & Kehadiran Siswa',
      subtitle: isStudent
        ? `NISN: ${currentStudent?.nisn} • Kelas: ${currentStudent?.rombel} • Dokumen Presensi Resmi Siswa Jabar`
        : `Dokumen Rekap Presensi KBM Harian • Disdik Jabar • Tanggal Cetak: ${selectedDate}`,
      fileName: isStudent
        ? `Presensi_${currentStudent?.nisn}_${selectedDate}_F4.pdf`
        : `Rekap_Presensi_Siswa_${selectedDate}_F4_Landscape.pdf`,
      metaInfo: [
        { label: isStudent ? 'Nama Siswa' : 'Tanggal Rekap', value: isStudent ? (currentStudent?.namaLengkap || '') : selectedDate },
        { label: isStudent ? 'NISN / Rombel' : 'Total Catatan', value: isStudent ? `${currentStudent?.nisn} (${currentStudent?.rombel})` : `${recordsToExport.length} Data Kehadiran` },
      ],
      head: head,
      body: body,
      signatureRole: isStudent ? 'Peserta Didik' : 'Wali Kelas / Guru Piket',
      signatureName: isStudent ? (currentStudent?.namaLengkap || '') : 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      signatureNip: isStudent ? `NISN: ${currentStudent?.nisn}` : '197405101999032001',
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 60 },
        3: { cellWidth: 32, halign: 'center' },
        4: { cellWidth: 35, halign: 'center' },
        5: { cellWidth: 30, halign: 'center' },
        6: { cellWidth: 50 },
        7: { cellWidth: 32, halign: 'center' },
        8: { cellWidth: 27, halign: 'center' },
      },
    });
  };

  const handleExportExcel = () => {
    const recordsToExport = isStudent ? myPresensiList : db.presensi;

    const exportData = recordsToExport.map((p) => ({
      Tanggal: p.tanggal,
      'Nama Siswa': p.namaSiswa,
      NISN: p.nisn,
      Rombel: p.rombelNama,
      'Status Kehadiran': p.status,
      Keterangan: p.keterangan || '-',
      Metode: p.metode,
      'Waktu Presensi': p.waktuPresensi || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isStudent ? 'Presensi_Saya' : 'Rekap_Presensi_Jabar');
    XLSX.writeFile(
      workbook,
      isStudent
        ? `Presensi_${currentStudent?.nisn || 'Siswa'}_${selectedDate}.xlsx`
        : `Rekap_Presensi_${selectedDate}.xlsx`
    );
  };

  const currentWaliKelasName = currentStudent
    ? db.guru.find((g) => g.id === currentStudent.waliKelasId)?.nama || 'Wali Kelas'
    : 'Wali Kelas';

  return (
    <div className="space-y-6">
      {/* Hidden Canvas for Live Video Capturing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ========================================================================= */}
      {/* HEADER & TAB BAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
              <span>{isStudent ? 'Presensi Mandiri & Rekam Kehadiran Siswa' : 'Manajemen Presensi & Jurnal KBM'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isStudent
                ? `Portal presensi mandiri, pengajuan izin/sakit, dan catatan kehadiran siswa ${currentStudent?.namaLengkap || currentUser.nama} (${currentStudent?.rombel || 'X MIPA 1'}).`
                : 'Pencatatan kehadiran harian siswa, validasi pengajuan izin/sakit oleh wali kelas, dan scan barcode laser.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Cetak PDF Rekap Presensi Format Landscape F4 (Folio)"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Cetak PDF ({isStudent ? 'Riwayat Saya' : 'F4 Landscape'})</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation - STRICTLY ADAPTED BY ROLE */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
          {isStudent ? (
            <>
              <button
                onClick={() => setActiveTab('mandiri')}
                className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'mandiri'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Presensi Hadir (GPS & Swafoto)</span>
              </button>

              <button
                onClick={() => setActiveTab('usulan_izin')}
                className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'usulan_izin'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Status Usulan Izin & Sakit ({myIzinSubmissions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('riwayat_siswa')}
                className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'riwayat_siswa'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Riwayat Kehadiran Resmi ({myPresensiList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('kartu_siswa')}
                className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'kartu_siswa'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Kartu Pelajar & Barcode Presensi</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('batch')}
                className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'batch'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Presensi Rombel (Checklist Guru)</span>
              </button>

              <button
                onClick={() => setActiveTab('validasi_izin')}
                className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'validasi_izin'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>Validasi Usulan Izin & Sakit Siswa</span>
                {pendingIzinCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                    {pendingIzinCount} Menunggu
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('qrcode')}
                className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'qrcode'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scan className="w-4 h-4 text-emerald-600" />
                <span>Scan Barcode / Laser Gate (Admin)</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-emerald-300">
                  Laser Infrared
                </span>
              </button>

              <button
                onClick={() => setActiveTab('rekap')}
                className={`px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'rekap'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Rekapitulasi Kehadiran Sekolah</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SISWA: TAB 1. PRESENSI MANDIRI (LIVE CAMERA + STRICT GPS GEOFENCING) */}
      {/* ========================================================================= */}
      {isStudent && activeTab === 'mandiri' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form Presensi Mandiri */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>Check-In Presensi Mandiri Siswa</span>
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Verifikasi lokasi koordinat GPS sekolah dan swafoto wajah langsung dengan seragam lengkap.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full border border-emerald-200 text-[11px]">
                {currentStudent?.rombel}
              </span>
            </div>

            {/* Notification Feedback Box */}
            {studentFeedbackMsg && (
              <div
                className={`p-4 rounded-xl font-bold flex items-start gap-3 border ${
                  studentFeedbackMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {studentFeedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs leading-relaxed">{studentFeedbackMsg.text}</div>
              </div>
            )}

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              {/* Profil Siswa Readonly */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Nama Lengkap Siswa</label>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{currentStudent?.namaLengkap}</div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">NISN / NIS</label>
                  <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                    {currentStudent?.nisn} / {currentStudent?.nis}
                  </div>
                </div>
              </div>

              {/* Status Kehadiran Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Pilih Kategori Presensi</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSelfStatus('Hadir');
                      if (!capturedSelfie) startCamera();
                    }}
                    className={`p-3 rounded-xl font-bold text-xs transition-all border text-center flex flex-col items-center gap-1 cursor-pointer ${
                      studentSelfStatus === 'Hadir'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hadir di Sekolah</span>
                    <span className="text-[9px] opacity-80">Wajib GPS & Swafoto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentSelfStatus('Izin');
                      stopCamera();
                    }}
                    className={`p-3 rounded-xl font-bold text-xs transition-all border text-center flex flex-col items-center gap-1 cursor-pointer ${
                      studentSelfStatus === 'Izin'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Pengajuan Izin</span>
                    <span className="text-[9px] opacity-80">Usulan ke Wali Kelas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentSelfStatus('Sakit');
                      stopCamera();
                    }}
                    className={`p-3 rounded-xl font-bold text-xs transition-all border text-center flex flex-col items-center gap-1 cursor-pointer ${
                      studentSelfStatus === 'Sakit'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Pengajuan Sakit</span>
                    <span className="text-[9px] opacity-80">Surat Keterangan</span>
                  </button>
                </div>
              </div>

              {/* TIPE ABSENSI: MASUK VS PULANG (WAJIB SISWA) */}
              {studentSelfStatus === 'Hadir' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                    <span>Pilih Sesi Presensi Mandiri *</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded font-mono font-semibold">
                      Siswa Wajib Absen Masuk & Pulang
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setJenisPresensi('Masuk')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        jenisPresensi === 'Masuk'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>1. Absen Masuk (Pagi)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJenisPresensi('Pulang')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        jenisPresensi === 'Pulang'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>2. Absen Pulang (Sore)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tanggal Presensi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Presensi</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setStudentIzinStartDate(e.target.value);
                    setStudentIzinEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* IF 'HADIR' -> SHOW STRICT GEOFENCE VALIDATION & LIVE WEBCAM */}
              {studentSelfStatus === 'Hadir' && (
                <>
                  {/* Strict GPS Location Validation Status Box */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      studentGps.isWithinRadius
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin
                          className={`w-4 h-4 ${studentGps.isWithinRadius ? 'text-emerald-600' : 'text-rose-600'}`}
                        />
                        <span className="font-bold">Status Validasi Koordinat GPS:</span>
                      </div>
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 ${
                          studentGps.isWithinRadius
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-rose-200 text-rose-900 animate-pulse'
                        }`}
                      >
                        {studentGps.isWithinRadius ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            Lokasi Valid ({studentGps.distance}m)
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-700" />
                            Lokasi Ditolak ({studentGps.distance}m)
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500">Pusat Koordinat Sekolah (Super Admin):</span>
                        <div className="font-mono font-semibold text-slate-800">
                          {schoolCoordinates.lat}, {schoolCoordinates.lng} (Radius Maks: {schoolCoordinates.radiusMeters}m)
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Koordinat Perangkat Anda:</span>
                        <div className="font-mono font-semibold text-slate-800">
                          {studentGps.lat.toFixed(6)}, {studentGps.lng.toFixed(6)} (Jarak: {studentGps.distance}m)
                        </div>
                      </div>
                    </div>

                    {!studentGps.isWithinRadius && (
                      <div className="p-2.5 bg-rose-100 border border-rose-200 rounded-lg text-rose-900 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          <strong>Presensi Ditolak!</strong> Anda berada di luar jangkauan radius sekolah. Tombol kirim presensi terkunci hingga Anda berada di area sekolah.
                        </span>
                      </div>
                    )}

                    {/* Geolocation Simulation Mode Selector for Testing */}
                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-slate-400" />
                        Uji Coba Lokasi (Simulator Presensi):
                      </span>
                      <div className="inline-flex rounded-lg bg-white/80 p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleGpsModeChange('inside')}
                          className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                            gpsSimMode === 'inside'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🏫 Di Sekolah (12m - Valid)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGpsModeChange('outside')}
                          className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                            gpsSimMode === 'outside'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🏠 Di Luar Radius (3.6km - Ditolak)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGpsModeChange('real')}
                          disabled={isDetectingGps}
                          className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                            gpsSimMode === 'real'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isDetectingGps ? 'Mendeteksi...' : '📍 GPS Nyata Perangkat'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Live Webcam Video & Swafoto (Selfie) Box */}
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Verifikasi Swafoto Langsung (Kamera Otomatis)</span>
                      </div>
                      {capturedSelfie && (
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedSelfie(null);
                            startCamera();
                          }}
                          className="text-emerald-700 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Ambil Ulang Swafoto</span>
                        </button>
                      )}
                    </div>

                    {/* Camera Video Stream Frame */}
                    <div className="relative max-w-sm mx-auto aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 flex items-center justify-center shadow-inner">
                      {capturedSelfie ? (
                        <div className="relative w-full h-full">
                          <img
                            src={capturedSelfie}
                            alt="Swafoto Siswa"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-2 left-2 right-2 bg-emerald-950/80 backdrop-blur-xs text-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-center border border-emerald-500/40">
                            ✓ Swafoto Wajah Berhasil Terverifikasi
                          </div>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover mirror"
                          />
                          {/* Face Oval Framing Guide */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-44 h-56 border-2 border-dashed border-emerald-400/80 rounded-[50%] shadow-lg shadow-emerald-500/10 flex items-center justify-center">
                              <span className="text-[10px] text-emerald-300 font-bold bg-slate-900/60 px-2 py-0.5 rounded-full">
                                Posisikan Wajah di Sini
                              </span>
                            </div>
                          </div>

                          {!isCameraActive && (
                            <div className="absolute inset-0 bg-slate-900/90 text-white p-4 flex flex-col items-center justify-center text-center gap-2">
                              <Camera className="w-8 h-8 text-emerald-400" />
                              <p className="text-[11px] text-slate-300 max-w-xs">
                                {cameraError || 'Mengaktifkan kamera live otomatis...'}
                              </p>
                              <button
                                type="button"
                                onClick={startCamera}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                              >
                                Buka Ulang Kamera
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Action Capture Buttons */}
                    {!capturedSelfie && (
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Jepret Swafoto Presensi</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* IF 'IZIN' OR 'SAKIT' -> PROPOSAL FORM (USULAN WALI KELAS) */}
              {studentSelfStatus !== 'Hadir' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-4">
                  <div className="flex items-start gap-2.5 text-amber-950">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">Alur Pengajuan Usulan {studentSelfStatus}</div>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Pengajuan ini bersifat <strong>Usulan</strong> dan tidak langsung otomatis menjadi kehadiran tercatat. Usulan Anda akan diteruskan ke <strong>Wali Kelas ({currentWaliKelasName})</strong> untuk divalidasi dan disetujui.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mulai Tanggal</label>
                      <input
                        type="date"
                        value={studentIzinStartDate}
                        onChange={(e) => setStudentIzinStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
                      <input
                        type="date"
                        value={studentIzinEndDate}
                        onChange={(e) => setStudentIzinEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alasan Lengkap {studentSelfStatus} *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={studentSelfNotes}
                      onChange={(e) => setStudentSelfNotes(e.target.value)}
                      placeholder={`Jelaskan alasan izin / keluhan sakit dan kronologis secara jelas kepada wali kelas...`}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Unggah Surat Dokter / Bukti Surat Izin Orang Tua (Opsional / Gambar)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Pilih Berkas / Foto Surat</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setStudentIzinFileProof(`Surat_${file.name}`);
                              alert(`Berkas "${file.name}" berhasil dilampirkan.`);
                            }
                          }}
                        />
                      </label>
                      {studentIzinFileProof && (
                        <span className="text-[11px] font-mono text-emerald-700 font-bold">
                          ✓ {studentIzinFileProof}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={studentSelfStatus === 'Hadir' && (!studentGps.isWithinRadius || !capturedSelfie)}
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  studentSelfStatus === 'Hadir'
                    ? studentGps.isWithinRadius && capturedSelfie
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {studentSelfStatus === 'Hadir'
                    ? 'Kirim Presensi Hadir Mandiri Hari Ini'
                    : `Ajukan Usulan ${studentSelfStatus} ke Wali Kelas`}
                </span>
              </button>
            </form>
          </div>

          {/* Right: Personal Attendance Summary */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Statistik Kehadiran Pribadi Siswa</span>
              </h4>

              <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-3xl font-black text-emerald-700">{studentRate}%</div>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-1">
                  Persentase Kehadiran Semester Ini
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Hadir Terverifikasi</span>
                  <p className="text-lg font-bold text-emerald-700">{studentHadirCount} Hari</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Izin Disetujui</span>
                  <p className="text-lg font-bold text-blue-700">{studentIzinCount} Hari</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Sakit Disetujui</span>
                  <p className="text-lg font-bold text-amber-700">{studentSakitCount} Hari</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Alpa / Tanpa Keterangan</span>
                  <p className="text-lg font-bold text-rose-700">{studentAlpaCount} Hari</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('riwayat_siswa')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Lihat Riwayat Lengkap Kehadiran →
                </button>
              </div>
            </div>

            {/* Quick Card info */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2 border border-slate-800">
              <div className="font-bold flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Ketentuan Presensi SMAN 1 Bandung</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                <li>Batas waktu presensi pagi: 06.30 - 07.15 WIB.</li>
                <li>Geofencing aktif: Presensi hadir hanya berlaku dalam radius sekolah ({schoolCoordinates.radiusMeters}m).</li>
                <li>Pengajuan Izin/Sakit wajib menunggu persetujuan Wali Kelas.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SISWA: TAB 2. STATUS USULAN IZIN & SAKIT */}
      {/* ========================================================================= */}
      {isStudent && activeTab === 'usulan_izin' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Daftar Usulan Izin & Sakit Anda</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau status persetujuan usulan izin atau sakit yang telah Anda ajukan kepada wali kelas.
              </p>
            </div>
            <button
              onClick={() => {
                setStudentSelfStatus('Izin');
                setActiveTab('mandiri');
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>+ Buat Usulan Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Rentang Tanggal</th>
                  <th className="p-3">Alasan Pengajuan</th>
                  <th className="p-3">Status Usulan</th>
                  <th className="p-3">Validasi Wali Kelas</th>
                  <th className="p-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {myIzinSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada usulan izin atau sakit yang diajukan.
                    </td>
                  </tr>
                ) : (
                  myIzinSubmissions.map((iz, idx) => (
                    <tr key={iz.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            iz.kategori === 'Izin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {iz.kategori}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-800">
                        {iz.tanggalMulai === iz.tanggalSelesai
                          ? iz.tanggalMulai
                          : `${iz.tanggalMulai} s/d ${iz.tanggalSelesai}`}
                      </td>
                      <td className="p-3 text-slate-700 max-w-xs">{iz.alasan}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                            iz.statusPersetujuan === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : iz.statusPersetujuan === 'Ditolak'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {iz.statusPersetujuan === 'Disetujui' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {iz.statusPersetujuan === 'Ditolak' && <XCircle className="w-3 h-3 text-rose-600" />}
                          {iz.statusPersetujuan === 'Menunggu' && <Clock className="w-3 h-3 text-amber-600" />}
                          {iz.statusPersetujuan === 'Menunggu' ? 'Menunggu Wali Kelas' : iz.statusPersetujuan}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{iz.disetujuiOleh || '-'}</td>
                      <td className="p-3 text-slate-500 italic text-[11px]">{iz.catatan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SISWA: TAB 3. RIWAYAT KEHADIRAN SAYA */}
      {/* ========================================================================= */}
      {isStudent && activeTab === 'riwayat_siswa' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Riwayat Kehadiran Resmi: {currentStudent?.namaLengkap}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar rekaman presensi mandiri dan presensi harian kelas yang tercatat sah dalam sistem.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tanggal..."
                  value={studentSearchHistory}
                  onChange={(e) => setStudentSearchHistory(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Tanggal Presensi</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Waktu Tercatat</th>
                  <th className="p-3">Metode Presensi</th>
                  <th className="p-3">Keterangan / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {myPresensiList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Belum ada catatan presensi yang tersimpan untuk akun Anda.
                    </td>
                  </tr>
                ) : (
                  myPresensiList
                    .filter((p) =>
                      studentSearchHistory ? p.tanggal.includes(studentSearchHistory) : true
                    )
                    .map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{p.tanggal}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              p.status === 'Hadir'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : p.status === 'Sakit'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : p.status === 'Izin'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{p.waktuPresensi || '-'}</td>
                        <td className="p-3 text-slate-700">
                          <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {p.metode}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{p.keterangan || '-'}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SISWA: TAB 4. KARTU DIGITAL & BARCODE PRESENSI */}
      {/* ========================================================================= */}
      {isStudent && activeTab === 'kartu_siswa' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <QrCode className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">Kartu Pelajar & Barcode Presensi Digital</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tunjukkan barcode ini saat melakukan presensi di gerbang scanner laser atau mesin presensi sekolah.
            </p>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 text-left shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">KARTU PRESENSI PELAJAR</p>
                <h4 className="text-sm font-bold text-white mt-0.5">SMAN 1 KOTA BANDUNG</h4>
              </div>
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-20 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                {currentStudent?.foto ? (
                  <img
                    src={currentStudent.foto}
                    alt={currentStudent.namaLengkap}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                    FOTO
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-bold text-white text-sm">{currentStudent?.namaLengkap}</div>
                <div className="font-mono text-emerald-300 text-xs">NISN: {currentStudent?.nisn}</div>
                <div className="text-slate-400 text-[11px]">Rombel: {currentStudent?.rombel}</div>
                <div className="text-slate-400 text-[11px]">Status: Peserta Didik Aktif</div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl text-center">
              <div className="font-mono text-slate-900 font-black text-lg tracking-widest">
                |||| | ||||| || |||||| |
              </div>
              <div className="font-mono text-slate-800 font-bold text-xs mt-1">{currentStudent?.nisn}</div>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">SMART RFID / INFRARED BARCODE</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEACHER / ADMIN: 1. BATCH ATTENDANCE CHECKLIST */}
      {/* ========================================================================= */}
      {isTeacherOrAdmin && activeTab === 'batch' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Presensi</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rombel / Kelas</label>
              <select
                value={selectedRombel}
                onChange={(e) => setSelectedRombel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {db.rombel.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.namaRombel} ({r.tingkat})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {db.mapel.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleSetAllPresent}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer text-center"
              >
                Set Semua Hadir
              </button>

              <button
                onClick={handleSaveAttendance}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>
          </div>

          {/* Jurnal Mengajar Form */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Jurnal Mengajar Guru (KBM Harian)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Materi Pokok / Pembahasan</label>
                <input
                  type="text"
                  value={journalMateri}
                  onChange={(e) => setJournalMateri(e.target.value)}
                  placeholder="Contoh: Algoritma dan Struktur Data"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Kejadian di Kelas</label>
                <input
                  type="text"
                  value={journalCatatan}
                  onChange={(e) => setJournalCatatan(e.target.value)}
                  placeholder="Contoh: Diskusi aktif, 1 siswa izin ke UKS"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Siswa {rombelObj?.namaRombel} ({studentsInClass.length} Siswa)
              </h3>
              <span className="text-xs text-slate-500 font-mono">Tahun Ajaran 2024/2025</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">No</th>
                    <th className="p-3">NISN</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Status Kehadiran</th>
                    <th className="p-3">Keterangan Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentsInClass.map((siswa, idx) => {
                    const current = attendanceState[siswa.id] || { status: 'Hadir', catatan: '' };
                    return (
                      <tr key={siswa.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono text-slate-600">{siswa.nisn}</td>
                        <td className="p-3 font-bold text-slate-900">{siswa.namaLengkap}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(siswa.id, st)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  current.status === st
                                    ? st === 'Hadir'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : st === 'Izin'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : st === 'Sakit'
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Catatan..."
                            value={current.catatan}
                            onChange={(e) => handleCatatanChange(siswa.id, e.target.value)}
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEACHER / WALI KELAS: 2. VALIDASI USULAN IZIN & SAKIT SISWA */}
      {/* ========================================================================= */}
      {isTeacherOrAdmin && activeTab === 'validasi_izin' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                <span>Panel Validasi & Persetujuan Usulan Izin / Sakit Siswa</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi permohonan izin dan sakit yang diajukan mandiri oleh peserta didik. Menyetujui usulan akan otomatis mencatat data ke rekapitulasi kehadiran resmi.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-900 font-bold rounded-xl border border-amber-200 text-xs">
              {pendingIzinCount} Usulan Menunggu Tindakan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Siswa & Rombel</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Rentang Tanggal</th>
                  <th className="p-3">Alasan & Lampiran</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Tindakan Wali Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allIzinSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tidak ada usulan izin atau sakit siswa saat ini.
                    </td>
                  </tr>
                ) : (
                  allIzinSubmissions.map((iz, idx) => (
                    <tr key={iz.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{iz.namaSiswa}</div>
                        <div className="font-mono text-[11px] text-slate-500">{iz.nisn} • {iz.rombelNama}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            iz.kategori === 'Izin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {iz.kategori}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-800 font-semibold">
                        {iz.tanggalMulai === iz.tanggalSelesai
                          ? iz.tanggalMulai
                          : `${iz.tanggalMulai} s/d ${iz.tanggalSelesai}`}
                      </td>
                      <td className="p-3 max-w-xs space-y-1">
                        <div className="text-slate-700">{iz.alasan}</div>
                        {iz.lampiranFoto && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            📎 {iz.lampiranFoto}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                            iz.statusPersetujuan === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : iz.statusPersetujuan === 'Ditolak'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {iz.statusPersetujuan === 'Disetujui' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {iz.statusPersetujuan === 'Ditolak' && <XCircle className="w-3 h-3 text-rose-600" />}
                          {iz.statusPersetujuan === 'Menunggu' && <Clock className="w-3 h-3 text-amber-600" />}
                          {iz.statusPersetujuan}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {iz.statusPersetujuan === 'Menunggu' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveSubmission(iz)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Setujui dan masukkan ke rekap presensi"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectModalId(iz.id);
                                setRejectionReason('');
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Tolak pengajuan"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Selesai ({iz.disetujuiOleh})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Penolakan Usulan */}
          {rejectModalId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>Alasan Penolakan Usulan Izin/Sakit</span>
                </h3>
                <p className="text-slate-500">
                  Tuliskan alasan penolakan agar siswa dapat mengetahui kekurangan berkas atau alasan pengajuan ditolak.
                </p>

                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Surat keterangan dokter tidak terlampir atau tanggal tidak sesuai jadwal KBM..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectSubmission(rejectModalId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Konfirmasi Tolak Usulan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEACHER / ADMIN: 3. LIVE BARCODE / LASER INFRARED SCANNER */}
      {/* ========================================================================= */}
      {isTeacherOrAdmin && activeTab === 'qrcode' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Live Scanner Viewfinder with Infrared Laser Animation */}
            <div className="md:col-span-6 bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Infrared Laser Scanner Active
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Gate Presensi Otomatis
                </span>
              </div>

              {/* Camera Scanner Box with Animated Laser Line */}
              <div className="relative aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden border-2 border-emerald-500/40 flex items-center justify-center shadow-inner">
                <video
                  ref={scannerVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Animated Red Infrared Scanning Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-lg shadow-rose-500 animate-bounce pointer-events-none"></div>

                {/* Targeting Corners Overlay */}
                <div className="absolute inset-8 border-2 border-emerald-400/50 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                    <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                  </div>
                  <div className="text-center font-mono text-[10px] text-emerald-300 bg-black/60 py-0.5 px-2 rounded-full self-center">
                    Arahkan Barcode / QR Siswa ke Area Ini
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                    <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                  </div>
                </div>
              </div>

              {/* Manual / USB Hardware Scanner Input Form */}
              <form onSubmit={handleBarcodeSubmit} className="space-y-3">
                <div className="relative">
                  <Scan className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="text"
                    autoFocus
                    value={scannedNisn}
                    onChange={(e) => setScannedNisn(e.target.value)}
                    placeholder="Input Barcode / Scan USB / Ketik NISN..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border-2 border-emerald-500/60 rounded-xl font-mono text-center text-sm font-bold text-white tracking-widest placeholder:text-slate-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Catat Kehadiran Barcode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Demo scan random student
                      const randomSiswa = db.siswa[Math.floor(Math.random() * db.siswa.length)];
                      processBarcodeScan(randomSiswa.nisn);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Simulasi Tap Siswa</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Scanned Result Card & Real-time Scan Session Log */}
            <div className="md:col-span-6 space-y-4">
              {/* Verified Result Card */}
              {scannedStudentResult ? (
                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-lg animate-in zoom-in-95 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Presensi Berhasil Diverifikasi
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date().toLocaleTimeString('id-ID')} WIB
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      {scannedStudentResult.foto ? (
                        <img
                          src={scannedStudentResult.foto}
                          alt={scannedStudentResult.namaLengkap}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                          FOTO
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 text-sm">{scannedStudentResult.namaLengkap}</div>
                      <div className="font-mono text-emerald-700 font-bold">NISN: {scannedStudentResult.nisn}</div>
                      <div className="text-slate-600">Rombel: {scannedStudentResult.rombel}</div>
                      <div className="text-slate-500 text-[11px]">Wali: {currentWaliKelasName}</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold text-center text-xs">
                    ✓ Status: Hadir Tepat Waktu (Gerbang Laser SMAN 1 Bandung)
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-2 text-xs">
                  <Scan className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-700">Menunggu Pemindaian Barcode...</div>
                  <p className="text-slate-400 text-[11px]">
                    Hasil pemindaian kartu dan foto profil siswa akan muncul otomatis di panel ini.
                  </p>
                </div>
              )}

              {/* Real-time Session Scan History */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Log Pemindaian Sesi Ini</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {scanHistoryLog.length} Siswa Terpindai
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {scanHistoryLog.length === 0 ? (
                    <p className="text-slate-400 text-center py-4 text-[11px]">
                      Belum ada siswa yang melakukan pemindaian barcode pada sesi ini.
                    </p>
                  ) : (
                    scanHistoryLog.map((log, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/70 text-[11px]"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{log.siswa.namaLengkap}</div>
                          <div className="text-slate-500 font-mono">{log.siswa.nisn} • {log.siswa.rombel}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-700">{log.waktu}</span>
                          <div className="text-[10px] text-slate-400">{log.metode}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEACHER / ADMIN: 4. REKAPITULASI PRESENSI SEMUA SISWA */}
      {/* ========================================================================= */}
      {isTeacherOrAdmin && activeTab === 'rekap' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Riwayat Catatan Presensi Seluruh Sekolah</h3>
            <span className="text-xs text-slate-500 font-mono">
              Total {db.presensi.length} Data Kehadiran
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">NISN</th>
                  <th className="p-3">Rombel</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Metode</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {db.presensi.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-slate-700">{p.tanggal}</td>
                    <td className="p-3 font-bold text-slate-900">{p.namaSiswa}</td>
                    <td className="p-3 font-mono text-slate-600">{p.nisn}</td>
                    <td className="p-3">{p.rombelNama}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          p.status === 'Hadir'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Sakit'
                            ? 'bg-amber-100 text-amber-800'
                            : p.status === 'Izin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{p.metode}</td>
                    <td className="p-3 font-mono text-slate-500">{p.waktuPresensi || '-'}</td>
                    <td className="p-3 text-slate-600 text-[11px] max-w-xs truncate">{p.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: STATUS VALIDASI KOORDINAT GPS (TIDAK SESUAI) */}
      {showGpsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-300 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-rose-100 border-2 border-rose-300 rounded-2xl flex items-center justify-center shrink-0 text-rose-600">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Status Validasi Koordinat GPS
                </div>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Di Luar Radius Sekolah!
                </h3>
              </div>
              <button
                onClick={() => setShowGpsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-2 text-xs text-rose-950">
              <div className="flex justify-between items-center pb-2 border-b border-rose-200/80">
                <span className="text-slate-600 font-semibold">Jarak Anda ke Sekolah:</span>
                <span className="font-mono font-black text-rose-700 bg-rose-200/70 px-2 py-0.5 rounded">
                  {studentGps.distance} Meter
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-rose-200/80">
                <span className="text-slate-600 font-semibold">Batas Radius Maksimal:</span>
                <span className="font-mono font-bold text-slate-800">
                  {schoolCoordinates.radiusMeters} Meter
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-600 font-semibold block mb-0.5">Alamat / Koordinat Perangkat:</span>
                <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-rose-200">
                  {studentGps.address || `${studentGps.lat.toFixed(6)}, ${studentGps.lng.toFixed(6)}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem menolak presensi Anda karena berada di luar jangkauan wilayah sekolah. Mohon pastikan GPS perangkat aktif dan Anda berada di area kampus sekolah.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleGpsModeChange('inside');
                  setShowGpsModal(false);
                }}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md text-center"
              >
                🏫 Gunakan Lokasi Sekolah (Simulator)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRealGpsDetection();
                  setShowGpsModal(false);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                🔄 Coba Deteksi Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: HARI LIBUR SEKOLAH / NON-AKTIF */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-300 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-amber-100 border-2 border-amber-300 rounded-2xl flex items-center justify-center shrink-0 text-amber-700">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Jadwal Presensi Sekolah
                </div>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Hari Ini Libur / Tidak Ada Jadwal
                </h3>
              </div>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Keterangan Penolakan Presensi:</span>
              </div>
              <p className="font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200">
                {holidayReason}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Siswa tidak perlu melakukan presensi pada hari libur nasional atau di luar hari aktif yang ditentukan sekolah.
            </p>

            <button
              type="button"
              onClick={() => setShowHolidayModal(false)}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md text-center"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
