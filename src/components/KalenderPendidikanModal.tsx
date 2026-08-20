import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit2,
  Trash2,
  Download,
  FileSpreadsheet,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { UserAccount, JadwalKedinasanEvent, TahunPelajaranConfig } from '../types';
import { dbService } from '../services/mockDatabase';
import { exportToF4LandscapePDF } from '../utils/pdfExportUtil';
import * as XLSX from 'xlsx';
import { useToast } from './Toast';

interface KalenderPendidikanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onTahunPelajaranChange?: (tp: string, semester: 'Ganjil' | 'Genap') => void;
}

export const KalenderPendidikanModal: React.FC<KalenderPendidikanModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTahunPelajaranChange,
}) => {
  const { showToast } = useToast();
  const db = dbService.getState();

  const [activeSubTab, setActiveSubTab] = useState<'agenda' | 'pengaturan_tp'>('agenda');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedTarget, setSelectedTarget] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Events & TP list state
  const [events, setEvents] = useState<JadwalKedinasanEvent[]>(db.jadwalKedinasanList || []);
  const [tpList, setTpList] = useState<TahunPelajaranConfig[]>(db.tahunPelajaranList || []);
  const [activeTp, setActiveTp] = useState<{ tahun: string; semester: 'Ganjil' | 'Genap' }>({
    tahun: db.config.tahunPelajaran,
    semester: db.config.semester as 'Ganjil' | 'Genap',
  });

  // Modal for Add/Edit Event
  const [isEventFormOpen, setIsEventFormOpen] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState<Omit<JadwalKedinasanEvent, 'id'>>({
    judul: '',
    kategori: 'Kalender Pendidikan',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date().toISOString().split('T')[0],
    keterangan: '',
    lokasi: 'SMAN 1 Kota Bandung',
    penanggungJawab: currentUser.nama,
    targetAudience: 'Semua',
    warnaBadge: 'bg-emerald-500',
  });

  // Modal for Add TP
  const [isAddTpOpen, setIsAddTpOpen] = useState<boolean>(false);
  const [tpFormData, setTpFormData] = useState({
    tahun: '2025/2026',
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    tanggalMulai: '2025-07-14',
    tanggalSelesai: '2025-12-19',
  });

  if (!isOpen) return null;

  const canManage =
    currentUser.role === 'SUPER ADMIN' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'KEPALA SEKOLAH' ||
    currentUser.role === 'WAKASEK';

  const kategoriOptions: JadwalKedinasanEvent['kategori'][] = [
    'Kalender Pendidikan',
    'Rapat Dinas',
    'Asesmen/Ujian',
    'Libur Nasional',
    'Kegiatan Sekolah',
    'MPLS',
    'Rapor & Evaluasi',
  ];

  const getKategoriBadgeColor = (kategori: string) => {
    switch (kategori) {
      case 'Kalender Pendidikan':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Rapat Dinas':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Asesmen/Ujian':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Libur Nasional':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MPLS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rapor & Evaluasi':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchCat = selectedKategori === 'Semua' || evt.kategori === selectedKategori;
    const matchTarget = selectedTarget === 'Semua' || evt.targetAudience === 'Semua' || evt.targetAudience === selectedTarget;
    const matchSearch =
      searchQuery === '' ||
      evt.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.lokasi && evt.lokasi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchTarget && matchSearch;
  });

  // Handle Event Submit
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.judul.trim()) {
      showToast('Judul agenda tidak boleh kosong', 'error');
      return;
    }

    let updatedList: JadwalKedinasanEvent[];
    if (editingEventId) {
      updatedList = events.map((ev) =>
        ev.id === editingEventId ? { ...ev, ...eventFormData } : ev
      );
      showToast('Agenda kedinasan berhasil diperbarui', 'success');
    } else {
      const newEvent: JadwalKedinasanEvent = {
        ...eventFormData,
        id: dbService.generateId('EVT'),
      };
      updatedList = [newEvent, ...events];
      showToast('Agenda kedinasan baru berhasil ditambahkan', 'success');
    }

    setEvents(updatedList);
    db.jadwalKedinasanList = updatedList;
    dbService.saveToStorage(db);
    setIsEventFormOpen(false);
    setEditingEventId(null);
  };

  const handleDeleteEvent = (id: string, judul: string) => {
    if (confirm(`Hapus agenda: "${judul}"?`)) {
      const updated = events.filter((ev) => ev.id !== id);
      setEvents(updated);
      db.jadwalKedinasanList = updated;
      dbService.saveToStorage(db);
      showToast('Agenda berhasil dihapus', 'info');
    }
  };

  // Handle Switch Active Tahun Pelajaran
  const handleSwitchTp = (tpItem: TahunPelajaranConfig) => {
    const updatedTpList = tpList.map((t) => ({
      ...t,
      isAktif: t.id === tpItem.id,
    }));

    setTpList(updatedTpList);
    setActiveTp({ tahun: tpItem.tahun, semester: tpItem.semester });

    db.config.tahunPelajaran = tpItem.tahun;
    db.config.semester = tpItem.semester;
    db.tahunPelajaranList = updatedTpList;
    dbService.saveToStorage(db);

    if (onTahunPelajaranChange) {
      onTahunPelajaranChange(tpItem.tahun, tpItem.semester);
    }

    showToast(`Tahun Pelajaran aktif diubah ke: ${tpItem.tahun} (${tpItem.semester})`, 'success');
  };

  // Handle Add New TP
  const handleAddTp = (e: React.FormEvent) => {
    e.preventDefault();
    const newTp: TahunPelajaranConfig = {
      id: `TP-${tpFormData.tahun.replace('/', '-')}-${tpFormData.semester.toUpperCase()}`,
      tahun: tpFormData.tahun,
      semester: tpFormData.semester,
      isAktif: false,
      tanggalMulai: tpFormData.tanggalMulai,
      tanggalSelesai: tpFormData.tanggalSelesai,
    };

    const updated = [...tpList, newTp];
    setTpList(updated);
    db.tahunPelajaranList = updated;
    dbService.saveToStorage(db);
    setIsAddTpOpen(false);
    showToast(`Tahun Pelajaran ${newTp.tahun} (${newTp.semester}) berhasil ditambahkan`, 'success');
  };

  // Generate Google Calendar Link for Single Event
  const getGoogleCalendarUrl = (evt: JadwalKedinasanEvent) => {
    const startDate = evt.tanggalMulai.replace(/-/g, '');
    // If multi-day or single-day all-day event
    const endParts = evt.tanggalSelesai.split('-');
    const endDateObj = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]) + 1);
    const endDate = endDateObj.toISOString().split('T')[0].replace(/-/g, '');

    const details = `${evt.keterangan || ''}\n\nPenanggung Jawab: ${evt.penanggungJawab}\nTarget: ${evt.targetAudience}\nKategori: ${evt.kategori}\nSumber: ${db.config.namaSekolah}`;
    const location = evt.lokasi || db.config.namaSekolah;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `[${evt.kategori}] ${evt.judul}`
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  };

  // Export all events to standard .ICS (iCalendar) file
  const handleExportICS = () => {
    if (filteredEvents.length === 0) {
      showToast('Tidak ada agenda untuk diekspor', 'warning');
      return;
    }

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SMS JABAR//Kalender Pendidikan//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Kalender Pendidikan ${activeTp.tahun} (${db.config.namaSekolah})`,
      'X-WR-TIMEZONE:Asia/Jakarta',
    ];

    filteredEvents.forEach((evt) => {
      const dtStart = evt.tanggalMulai.replace(/-/g, '');
      const endParts = evt.tanggalSelesai.split('-');
      const endDateObj = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]) + 1);
      const dtEnd = endDateObj.toISOString().split('T')[0].replace(/-/g, '');

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:SMS-JABAR-EVT-${evt.id}@disdik.jabarprov.go.id`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:[${evt.kategori}] ${evt.judul}`,
        `DESCRIPTION:${(evt.keterangan || '').replace(/\n/g, '\\n')} (PJ: ${evt.penanggungJawab})`,
        `LOCATION:${evt.lokasi || db.config.namaSekolah}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Kalender_Pendidikan_${activeTp.tahun.replace('/', '_')}_${activeTp.semester}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Berkas iCalendar (.ics) berhasil diunduh! Siap disinkronkan ke Google Calendar / Apple Calendar.', 'success');
  };

  // Export PDF
  const handleExportPDF = () => {
    const headers = [
      'No',
      'Kategori Agenda',
      'Nama Kegiatan / Agenda Kedinasan',
      'Tanggal Mulai',
      'Tanggal Selesai',
      'Lokasi / Ruang',
      'Penanggung Jawab',
      'Target Peserta',
    ];

    const rows = filteredEvents.map((evt, idx) => [
      String(idx + 1),
      evt.kategori,
      evt.judul,
      evt.tanggalMulai,
      evt.tanggalSelesai,
      evt.lokasi || '-',
      evt.penanggungJawab,
      evt.targetAudience,
    ]);

    exportToF4LandscapePDF({
      title: 'KALENDER PENDIDIKAN & JADWAL KEDINASAN RESMI SEKOLAH',
      subtitle: `TAHUN PELAJARAN ${activeTp.tahun} - SEMESTER ${activeTp.semester.toUpperCase()} (DINAS PENDIDIKAN JAWA BARAT)`,
      head: [headers],
      body: rows,
      fileName: `Kalender_Pendidikan_Jadwal_Kedinasan_${activeTp.tahun.replace('/', '_')}_${activeTp.semester}.pdf`,
      signatureName: currentUser.nama,
      signatureRole: currentUser.role,
    });
  };

  // Export Excel
  const handleExportExcel = () => {
    const excelData = filteredEvents.map((evt, idx) => ({
      No: idx + 1,
      Kategori: evt.kategori,
      'Judul Kegiatan': evt.judul,
      'Tanggal Mulai': evt.tanggalMulai,
      'Tanggal Selesai': evt.tanggalSelesai,
      'Keterangan / Deskripsi': evt.keterangan,
      Lokasi: evt.lokasi || '-',
      'Penanggung Jawab': evt.penanggungJawab,
      'Target Sasaran': evt.targetAudience,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kalender Pendidikan');
    XLSX.writeFile(wb, `Kalender_Pendidikan_${activeTp.tahun.replace('/', '_')}_${activeTp.semester}.xlsx`);
    showToast('File Excel kalender pendidikan berhasil diunduh', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">
                  Kalender Pendidikan & Jadwal Kedinasan
                </h3>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  TP {activeTp.tahun} - {activeTp.semester}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Pusat agenda resmi akademik, rapat dinas, asesmen, dan periode tahun pembelajaran Disdik Jawa Barat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab Navigation & Action Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('agenda')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'agenda'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Agenda & Kegiatan ({filteredEvents.length})
            </button>

            <button
              onClick={() => setActiveSubTab('pengaturan_tp')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'pengaturan_tp'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Pengaturan Tahun Pelajaran
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportICS}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Sinkronkan / Unduh iCalendar (.ICS) untuk Google Calendar & HP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sinkron (.ICS)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Cetak PDF F4 Landscape"
            >
              <Printer className="w-3.5 h-3.5" />
              PDF F4
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Unduh Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>

            {canManage && activeSubTab === 'agenda' && (
              <button
                onClick={() => {
                  setEditingEventId(null);
                  setEventFormData({
                    judul: '',
                    kategori: 'Kalender Pendidikan',
                    tanggalMulai: new Date().toISOString().split('T')[0],
                    tanggalSelesai: new Date().toISOString().split('T')[0],
                    keterangan: '',
                    lokasi: 'SMAN 1 Kota Bandung',
                    penanggungJawab: currentUser.nama,
                    targetAudience: 'Semua',
                    warnaBadge: 'bg-emerald-500',
                  });
                  setIsEventFormOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Tambah Agenda
              </button>
            )}

            {canManage && activeSubTab === 'pengaturan_tp' && (
              <button
                onClick={() => setIsAddTpOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Tambah Periode TP
              </button>
            )}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeSubTab === 'agenda' ? (
            <>
              {/* Filter and Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul kegiatan, lokasi, penanggung jawab..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">Kategori:</span>
                  <select
                    value={selectedKategori}
                    onChange={(e) => setSelectedKategori(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  >
                    <option value="Semua">Semua Kategori</option>
                    {kategoriOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">Sasaran:</span>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  >
                    <option value="Semua">Semua Target</option>
                    <option value="Guru">Khusus Guru / Pendidik</option>
                    <option value="Siswa">Peserta Didik</option>
                    <option value="Tendik">Tenaga Kependidikan</option>
                    <option value="Wali Murid">Orang Tua / Wali Murid</option>
                  </select>
                </div>
              </div>

              {/* Event Cards List */}
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Tidak ada agenda yang cocok dengan filter</p>
                  <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau kategori agenda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 bg-white border border-slate-200/90 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getKategoriBadgeColor(
                              evt.kategori
                            )}`}
                          >
                            {evt.kategori}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                            Sasaran: {evt.targetAudience}
                          </span>
                          <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            {evt.tanggalMulai === evt.tanggalSelesai
                              ? evt.tanggalMulai
                              : `${evt.tanggalMulai} s.d ${evt.tanggalSelesai}`}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900">{evt.judul}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{evt.keterangan}</p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                          {evt.lokasi && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {evt.lokasi}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            PJ: <strong className="text-slate-700">{evt.penanggungJawab}</strong>
                          </span>
                        </div>
                      </div>

                        <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                          {/* 1-Click Google Calendar Sync Button */}
                          <a
                            href={getGoogleCalendarUrl(evt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] rounded-lg border border-blue-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Simpan otomatis ke Google Calendar pribadi / HP"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">Google Calendar</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>

                          {canManage && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingEventId(evt.id);
                                  setEventFormData({
                                    judul: evt.judul,
                                    kategori: evt.kategori,
                                    tanggalMulai: evt.tanggalMulai,
                                    tanggalSelesai: evt.tanggalSelesai,
                                    keterangan: evt.keterangan,
                                    lokasi: evt.lokasi || '',
                                    penanggungJawab: evt.penanggungJawab,
                                    targetAudience: evt.targetAudience,
                                    warnaBadge: evt.warnaBadge || 'bg-emerald-500',
                                  });
                                  setIsEventFormOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Agenda"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteEvent(evt.id, evt.judul)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Agenda"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Tab 2: Pengaturan Tahun Pelajaran & Semester */
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-emerald-900">
                    Status Tahun Pelajaran Aktif: TP {activeTp.tahun} ({activeTp.semester})
                  </h4>
                  <p className="text-[11px] text-emerald-700/90 leading-relaxed mt-0.5">
                    Mengubah Tahun Pelajaran atau Semester aktif akan secara otomatis menyesuaikan filter KBM, data presensi, cetak rapor, dan kalender kegiatan di seluruh sistem.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tpList.map((tp) => {
                  const isCurrent = tp.tahun === activeTp.tahun && tp.semester === activeTp.semester;
                  return (
                    <div
                      key={tp.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-emerald-900 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isCurrent
                                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Semester {tp.semester}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                              AKTIF SEKARANG
                            </span>
                          )}
                        </div>

                        <h3 className={`text-xl font-black ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                          TP {tp.tahun}
                        </h3>

                        <p className={`text-xs ${isCurrent ? 'text-emerald-200' : 'text-slate-500'}`}>
                          Periode Pembelajaran: {tp.tanggalMulai} s.d {tp.tanggalSelesai}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100/20 flex items-center justify-between">
                        {isCurrent ? (
                          <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Sedang Digunakan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitchTp(tp)}
                            className="w-full py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          >
                            Gunakan TP & Semester Ini
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Standar Kurikulum Merdeka & Disdik Jawa Barat</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* MODAL: ADD / EDIT AGENDA KEDINASAN */}
      {isEventFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                {editingEventId ? 'Edit Agenda Kedinasan' : 'Tambah Agenda / Kalender Pendidikan'}
              </h4>
              <button
                onClick={() => setIsEventFormOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Kegiatan / Agenda *</label>
                <input
                  type="text"
                  required
                  value={eventFormData.judul}
                  onChange={(e) => setEventFormData({ ...eventFormData, judul: e.target.value })}
                  placeholder="Contoh: Rapat Pleno Kelulusan / PTS Semester Ganjil"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Agenda</label>
                  <select
                    value={eventFormData.kategori}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        kategori: e.target.value as JadwalKedinasanEvent['kategori'],
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {kategoriOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sasaran Peserta</label>
                  <select
                    value={eventFormData.targetAudience}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        targetAudience: e.target.value as JadwalKedinasanEvent['targetAudience'],
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Semua">Semua Warga Sekolah</option>
                    <option value="Guru">Guru / Tenaga Pengajar</option>
                    <option value="Siswa">Peserta Didik</option>
                    <option value="Tendik">Tenaga Kependidikan (TU/Staf)</option>
                    <option value="Wali Murid">Orang Tua / Wali Murid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={eventFormData.tanggalMulai}
                    onChange={(e) => setEventFormData({ ...eventFormData, tanggalMulai: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={eventFormData.tanggalSelesai}
                    onChange={(e) => setEventFormData({ ...eventFormData, tanggalSelesai: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi / Ruangan</label>
                  <input
                    type="text"
                    value={eventFormData.lokasi}
                    onChange={(e) => setEventFormData({ ...eventFormData, lokasi: e.target.value })}
                    placeholder="Aula / Ruang Multimedia / Lab"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab (PJ)</label>
                  <input
                    type="text"
                    value={eventFormData.penanggungJawab}
                    onChange={(e) => setEventFormData({ ...eventFormData, penanggungJawab: e.target.value })}
                    placeholder="Nama / Bidang PJ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi / Keterangan Agenda</label>
                <textarea
                  rows={3}
                  value={eventFormData.keterangan}
                  onChange={(e) => setEventFormData({ ...eventFormData, keterangan: e.target.value })}
                  placeholder="Rincian petunjuk teknis pelaksanaan kegiatan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingEventId ? 'Simpan Perubahan' : 'Tambah ke Kalender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TAHUN PELAJARAN */}
      {isAddTpOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Tambah Periode Tahun Pelajaran Baru
              </h4>
              <button
                onClick={() => setIsAddTpOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTp} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Pelajaran (e.g. 2025/2026)</label>
                <input
                  type="text"
                  required
                  value={tpFormData.tahun}
                  onChange={(e) => setTpFormData({ ...tpFormData, tahun: e.target.value })}
                  placeholder="2025/2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Semester</label>
                <select
                  value={tpFormData.semester}
                  onChange={(e) =>
                    setTpFormData({ ...tpFormData, semester: e.target.value as 'Ganjil' | 'Genap' })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai TP</label>
                  <input
                    type="date"
                    required
                    value={tpFormData.tanggalMulai}
                    onChange={(e) => setTpFormData({ ...tpFormData, tanggalMulai: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai TP</label>
                  <input
                    type="date"
                    required
                    value={tpFormData.tanggalSelesai}
                    onChange={(e) => setTpFormData({ ...tpFormData, tanggalSelesai: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTpOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Tahun Pelajaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
