import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Sparkles,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  FileCheck2,
  BookOpen,
  Video,
  Image as ImageIcon,
  Lock,
  AlertCircle,
  Upload,
  Info,
  Layers,
  RefreshCw,
  FileText,
  Download,
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  FolderTree,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BankSoal as BankSoalType, UserAccount, MediaHotspot, FolderBankSoal } from '../types';
import { dbService } from '../services/mockDatabase';
import { QuestionMediaRenderer } from './QuestionMediaRenderer';
import { useToast } from './Toast';
import { exportToF4LandscapePDF } from '../utils/pdfExportUtil';

interface BankSoalProps {
  currentUser: UserAccount;
}

export const BankSoal: React.FC<BankSoalProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const { success, error, warning } = useToast();

  // Navigation tab: 'folders' | 'questions'
  const [activeViewTab, setActiveViewTab] = useState<'folders' | 'questions'>('folders');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMapel, setFilterMapel] = useState<string>('Semua');
  const [filterTingkat, setFilterTingkat] = useState<string>('Semua');
  const [filterJenis, setFilterJenis] = useState<string>('Semua');
  const [filterMedia, setFilterMedia] = useState<string>('Semua');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderBankSoal | null>(null);
  const [selectedSoal, setSelectedSoal] = useState<BankSoalType | null>(null);

  // Folder form state
  const [folderForm, setFolderForm] = useState<{
    namaFolder: string;
    mapelNama: string;
    tingkat: '10' | '11' | '12' | 'Semua';
    deskripsi: string;
  }>({
    namaFolder: '',
    mapelNama: db.mapel[0]?.namaMapel || 'Bahasa dan Sastra Sunda',
    tingkat: '10',
    deskripsi: '',
  });

  // Identify Teacher and Allowed Subjects
  const isSuperOrAdmin = currentUser.role === 'SUPER ADMIN' || currentUser.role === 'ADMIN';
  const currentTeacher = db.guru.find((g) => g.id === currentUser.referenceId || g.nip === currentUser.username);

  // Determine allowed mapel list for current user
  const allowedMapelList = React.useMemo(() => {
    if (isSuperOrAdmin) {
      return db.mapel;
    }
    if (currentTeacher) {
      // Find matching mapel from mataPelajaranUtama or guruPengampuId or jadwalKBM
      const filtered = db.mapel.filter(
        (m) =>
          m.namaMapel.toLowerCase().trim() === currentTeacher.mataPelajaranUtama.toLowerCase().trim() ||
          m.guruPengampuId?.includes(currentTeacher.id) ||
          db.jadwalKBM.some((j) => j.guruId === currentTeacher.id && j.mapelId === m.id)
      );
      if (filtered.length > 0) return filtered;
      // Fallback matching by primary subject string
      const matched = db.mapel.filter((m) =>
        m.namaMapel.toLowerCase().includes(currentTeacher.mataPelajaranUtama.toLowerCase())
      );
      if (matched.length > 0) return matched;
    }
    return db.mapel;
  }, [isSuperOrAdmin, currentTeacher, db.mapel, db.jadwalKBM]);

  const defaultMapel = allowedMapelList[0] || db.mapel[0];

  // AI Generator Form State
  const [aiPromptTopic, setAiPromptTopic] = useState('Budaya Sunda & Aksara Tradisional');
  const [aiSelectedMapel, setAiSelectedMapel] = useState(defaultMapel?.namaMapel || 'Bahasa dan Sastra Sunda');
  const [aiQuestionCount, setAiQuestionCount] = useState(3);
  const [aiIncludeMedia, setAiIncludeMedia] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Manual Form State
  const [formData, setFormData] = useState<Partial<BankSoalType>>({
    mapelId: defaultMapel?.id || 'MAP-000001',
    mapelNama: defaultMapel?.namaMapel || 'Bahasa dan Sastra Sunda',
    kelas: '10',
    materi: '',
    kompetensi: '',
    jenisSoal: 'Pilihan Ganda',
    tingkatKesulitan: 'Sedang',
    pertanyaan: '',
    mediaTipe: 'none',
    mediaUrl: '',
    mediaCaption: '',
    mediaHotspots: [],
    pilihanA: '',
    pilihanB: '',
    pilihanC: '',
    pilihanD: '',
    pilihanE: '',
    jawabanBenar: 'A',
    pembahasan: '',
    bobot: 10,
    status: 'Aktif',
  });

  const canCreate = dbService.checkPermission(currentUser, 'banksoal.create');
  const canEdit = dbService.checkPermission(currentUser, 'banksoal.edit');
  const canDelete = dbService.checkPermission(currentUser, 'banksoal.delete');

  const currentActiveFolder = (db.folderBankSoal || []).find((f) => f.id === activeFolderId);

  const filteredSoal = db.bankSoal.filter((s) => {
    const matchSearch =
      s.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.materi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mapelNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMapel = filterMapel === 'Semua' || s.mapelNama === filterMapel;
    const matchTingkat = filterTingkat === 'Semua' || s.tingkatKesulitan === filterTingkat;
    const matchJenis = filterJenis === 'Semua' || s.jenisSoal === filterJenis;
    const matchMedia =
      filterMedia === 'Semua' ||
      (filterMedia === 'Video' && s.mediaTipe === 'video') ||
      (filterMedia === 'Gambar Interaktif' && s.mediaTipe === 'gambar_interaktif') ||
      (filterMedia === 'Gambar' && s.mediaTipe === 'gambar') ||
      (filterMedia === 'Tanpa Media' && (!s.mediaTipe || s.mediaTipe === 'none'));

    // Match folder if activeFolderId is selected
    const matchFolder =
      !activeFolderId ||
      s.folderId === activeFolderId ||
      (currentActiveFolder &&
        s.mapelNama === currentActiveFolder.mapelNama &&
        (currentActiveFolder.tingkat === 'Semua' || s.kelas === currentActiveFolder.tingkat));

    return matchSearch && matchMapel && matchTingkat && matchJenis && matchMedia && matchFolder;
  });

  // Folder Handlers
  const handleOpenCreateFolder = () => {
    setEditingFolder(null);
    setFolderForm({
      namaFolder: '',
      mapelNama: defaultMapel?.namaMapel || db.mapel[0]?.namaMapel || 'Bahasa dan Sastra Sunda',
      tingkat: '10',
      deskripsi: '',
    });
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (f: FolderBankSoal) => {
    setEditingFolder(f);
    setFolderForm({
      namaFolder: f.namaFolder,
      mapelNama: f.mapelNama,
      tingkat: f.tingkat,
      deskripsi: f.deskripsi || '',
    });
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.namaFolder) {
      alert('Mohon isi nama folder bank soal!');
      return;
    }

    const mapelObj = db.mapel.find((m) => m.namaMapel === folderForm.mapelNama) || defaultMapel;

    if (editingFolder) {
      const updatedList = (db.folderBankSoal || []).map((f) =>
        f.id === editingFolder.id
          ? {
              ...f,
              namaFolder: folderForm.namaFolder,
              mapelId: mapelObj.id,
              mapelNama: folderForm.mapelNama,
              tingkat: folderForm.tingkat,
              deskripsi: folderForm.deskripsi,
            }
          : f
      );
      db.folderBankSoal = updatedList;
      success('Folder Bank Soal berhasil diperbarui!', 'Folder Diperbarui');
    } else {
      const newFolder: FolderBankSoal = {
        id: dbService.generateId('FOLD'),
        namaFolder: folderForm.namaFolder,
        mapelId: mapelObj.id,
        mapelNama: folderForm.mapelNama,
        tingkat: folderForm.tingkat,
        deskripsi: folderForm.deskripsi,
        createdBy: currentTeacher?.nama || currentUser.nama,
        createdAt: new Date().toISOString().split('T')[0],
      };
      db.folderBankSoal = [newFolder, ...(db.folderBankSoal || [])];
      success('Folder Bank Soal baru berhasil dibuat!', 'Folder Dibuat');
    }

    dbService.saveToStorage(db);
    setIsFolderModalOpen(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm('Hapus folder ini? Butir soal di dalamnya tidak akan terhapus, hanya dipisahkan dari folder.')) {
      db.folderBankSoal = (db.folderBankSoal || []).filter((f) => f.id !== folderId);
      db.bankSoal = db.bankSoal.map((s) => (s.folderId === folderId ? { ...s, folderId: undefined } : s));
      dbService.saveToStorage(db);
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }
      success('Folder Bank Soal berhasil dihapus.', 'Folder Dihapus');
    }
  };

  const handleExportBankSoalPDF = () => {
    const head = [
      ['No', 'Mata Pelajaran', 'Materi / Topik', 'Tingkat', 'Jenis Soal', 'Butir Pertanyaan', 'Kunci', 'Tipe Media', 'Pembuat']
    ];

    const body = filteredSoal.map((s, idx) => {
      const qText = s.pertanyaan.length > 70 ? s.pertanyaan.substring(0, 68) + '...' : s.pertanyaan;
      return [
        idx + 1,
        s.mapelNama,
        s.materi || '-',
        s.tingkatKesulitan,
        s.jenisSoal,
        qText,
        s.jawabanBenar,
        s.mediaTipe || 'none',
        s.pembuatNama || 'Guru',
      ];
    });

    exportToF4LandscapePDF({
      title: 'Naskah Bank Soal & Instrumen Asesmen Pembelajaran',
      subtitle: `Dokumen Bank Soal Digital Disdik Jabar • Filter Mapel: ${filterMapel} • Tingkat: ${filterTingkat}`,
      fileName: `Bank_Soal_${filterMapel}_F4_Landscape.pdf`,
      metaInfo: [
        { label: 'Filter Mapel', value: filterMapel },
        { label: 'Filter Tingkat', value: filterTingkat },
        { label: 'Total Soal', value: `${filteredSoal.length} Butir` },
      ],
      head: head,
      body: body,
      signatureRole: 'Guru Penyusun / Tim MGMP',
      signatureName: currentTeacher ? currentTeacher.nama : 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.',
      signatureNip: currentTeacher ? currentTeacher.nip : '197405101999032001',
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 38 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 26, halign: 'center' },
        5: { cellWidth: 100 },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 25, halign: 'center' },
        8: { cellWidth: 37 },
      },
    });

    success('Bank Soal berhasil dicetak ke PDF Landscape F4 Presisi!', 'Cetak PDF Selesai');
  };

  const handleExportBankSoalExcel = () => {
    const data = filteredSoal.map((s, idx) => ({
      No: idx + 1,
      'Mata Pelajaran': s.mapelNama,
      'Materi / Topik': s.materi,
      'Tingkat Kesulitan': s.tingkatKesulitan,
      'Jenis Soal': s.jenisSoal,
      Pertanyaan: s.pertanyaan,
      'Pilihan A': s.pilihanA || '-',
      'Pilihan B': s.pilihanB || '-',
      'Pilihan C': s.pilihanC || '-',
      'Pilihan D': s.pilihanD || '-',
      'Pilihan E': s.pilihanE || '-',
      'Kunci Jawaban': s.jawabanBenar,
      'Bobot Nilai': s.bobot,
      'Tipe Media': s.mediaTipe,
      'URL Media': s.mediaUrl || '-',
      Pembahasan: s.pembahasan || '-',
      Pembuat: s.pembuatNama,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bank_Soal_Jabar');
    XLSX.writeFile(workbook, `Bank_Soal_${filterMapel}_2024.xlsx`);
    success('Bank Soal berhasil diekspor ke format Excel (.xlsx)', 'Ekspor Excel Berhasil');
  };

  const handleOpenCreate = () => {
    setSelectedSoal(null);
    setFormData({
      mapelId: defaultMapel?.id || 'MAP-000001',
      mapelNama: defaultMapel?.namaMapel || 'Bahasa dan Sastra Sunda',
      kelas: '10',
      materi: '',
      kompetensi: '',
      jenisSoal: 'Pilihan Ganda',
      tingkatKesulitan: 'Sedang',
      pertanyaan: '',
      mediaTipe: 'none',
      mediaUrl: '',
      mediaCaption: '',
      mediaHotspots: [],
      pilihanA: '',
      pilihanB: '',
      pilihanC: '',
      pilihanD: '',
      pilihanE: '',
      jawabanBenar: 'A',
      pembahasan: '',
      bobot: 10,
      status: 'Aktif',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (soal: BankSoalType) => {
    // Check if teacher is allowed to edit this mapel
    if (!isSuperOrAdmin && currentTeacher) {
      const isAllowed = allowedMapelList.some((m) => m.id === soal.mapelId || m.namaMapel === soal.mapelNama);
      if (!isAllowed) {
        alert(
          `Akses Dibatasi: Anda hanya berwenang mengelola bank soal untuk mata pelajaran "${currentTeacher.mataPelajaranUtama}".`
        );
        return;
      }
    }
    setSelectedSoal(soal);
    setFormData({
      ...soal,
      mediaTipe: soal.mediaTipe || 'none',
      mediaHotspots: soal.mediaHotspots || [],
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = (soal: BankSoalType) => {
    if (!isSuperOrAdmin && currentTeacher) {
      const isAllowed = allowedMapelList.some((m) => m.id === soal.mapelId || m.namaMapel === soal.mapelNama);
      if (!isAllowed) {
        alert(
          `Akses Dibatasi: Anda hanya berwenang menghapus soal mata pelajaran yang Anda ampu (${currentTeacher.mataPelajaranUtama}).`
        );
        return;
      }
    }
    if (confirm('Apakah Anda yakin ingin menghapus butir soal ini dari Bank Soal?')) {
      db.bankSoal = db.bankSoal.filter((s) => s.id !== soal.id);
      dbService.saveToStorage(db);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pertanyaan || !formData.jawabanBenar) {
      alert('Mohon isi pertanyaan dan kunci jawaban soal!');
      return;
    }

    // Double check subject permission
    if (!isSuperOrAdmin && currentTeacher) {
      const isAllowed = allowedMapelList.some((m) => m.id === formData.mapelId);
      if (!isAllowed) {
        warning(
          `Pelanggaran Hak Akses: Guru tidak diperkenankan menambahkan/mengedit soal di luar mata pelajaran yang diampu (${currentTeacher.mataPelajaranUtama}).`,
          'Hak Akses Dibatasi'
        );
        return;
      }
    }

    if (selectedSoal) {
      const updated = db.bankSoal.map((s) =>
        s.id === selectedSoal.id ? ({ ...s, ...formData } as BankSoalType) : s
      );
      db.bankSoal = updated;
      success('Butir soal berhasil diperbarui di Bank Soal!', 'Bank Soal');
    } else {
      const newId = dbService.generateId('SOAL');
      const newSoal: BankSoalType = {
        ...(formData as BankSoalType),
        id: newId,
        pembuatId: currentTeacher?.id || currentUser.referenceId || 'GURU-000001',
        pembuatNama: currentTeacher?.nama || currentUser.nama,
        createdAt: new Date().toISOString().split('T')[0],
      };
      db.bankSoal.push(newSoal);
      success('Butir soal baru berhasil ditambahkan dan siap digunakan!', 'Soal Tersimpan');
    }

    dbService.saveToStorage(db);
    setIsFormModalOpen(false);
  };

  // Upload Photo / Media to Data URL
  const handleMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        mediaUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Add Hotspot to interactive image
  const handleAddHotspot = (hs: MediaHotspot) => {
    setFormData((prev) => ({
      ...prev,
      mediaHotspots: [...(prev.mediaHotspots || []), hs],
    }));
  };

  // Delete Hotspot
  const handleDeleteHotspot = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      mediaHotspots: (prev.mediaHotspots || []).filter((h) => h.id !== id),
    }));
  };

  // AI Generator Handler (Calling Server Gemini Endpoint)
  const handleGenerateQuestionsAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: aiSelectedMapel,
          topic: aiPromptTopic,
          gradeLevel: '10',
          count: aiQuestionCount,
          difficulty: 'Sedang',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        const targetMapelObj = db.mapel.find((m) => m.namaMapel === aiSelectedMapel) || defaultMapel;
        const newQuestions: BankSoalType[] = data.questions.map((q: any) => ({
          id: dbService.generateId('SOAL'),
          mapelId: targetMapelObj.id,
          mapelNama: targetMapelObj.namaMapel,
          kelas: '10',
          materi: aiPromptTopic,
          kompetensi: 'Asesmen AI Otomatis Disdik Jabar',
          jenisSoal: 'Pilihan Ganda',
          tingkatKesulitan: 'Sedang',
          pertanyaan: q.question,
          mediaTipe: aiIncludeMedia ? 'gambar_interaktif' : 'none',
          mediaUrl: aiIncludeMedia
            ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80'
            : '',
          mediaCaption: aiIncludeMedia ? 'Diagram Asesmen: Perhatikan materi di atas.' : '',
          mediaHotspots: aiIncludeMedia
            ? [
                {
                  id: 'hs-ai-1',
                  x: 35,
                  y: 40,
                  label: 'Titik Konsep Kunci',
                  keterangan: 'Poin esensial yang dianalisis dalam butir soal.',
                },
              ]
            : [],
          pilihanA: q.options?.[0] || 'Opsi A',
          pilihanB: q.options?.[1] || 'Opsi B',
          pilihanC: q.options?.[2] || 'Opsi C',
          pilihanD: q.options?.[3] || 'Opsi D',
          pilihanE: q.options?.[4] || 'Opsi E',
          jawabanBenar: q.correctAnswer || 'A',
          pembahasan: q.explanation || 'Pembahasan kunci jawaban.',
          bobot: 10,
          pembuatId: currentTeacher?.id || 'GURU-000001',
          pembuatNama: `${currentUser.nama} (AI Generator)`,
          status: 'Aktif',
          createdAt: new Date().toISOString().split('T')[0],
        }));

        db.bankSoal = [...newQuestions, ...db.bankSoal];
        dbService.saveToStorage(db);
        setIsAiModalOpen(false);
        success(`Berhasil membuat ${newQuestions.length} butir soal baru dengan bantuan AI Gemini!`, 'AI Generator Sukses');
      } else {
        error('Gagal menghasilkan butir soal otomatis. Silakan periksa koneksi atau coba kembali.', 'Gagal Generate');
      }
    } catch (e) {
      error('Terjadi kendala saat memanggil model AI.', 'Error AI');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
              Asesmen & Bank Soal Digital
            </span>
            {!isSuperOrAdmin && currentTeacher && (
              <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Mapel Diampu: {currentTeacher.mataPelajaranUtama}</span>
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <span>Manajemen Bank Soal & Media Interaktif</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dukung 5 tipe soal, lampiran video pembelajaran (YouTube/MP4), serta gambar interaktif dengan hotspot anotasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportBankSoalPDF}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Cetak PDF Format Landscape F4 (Folio) Presisi"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Cetak PDF (F4 Landscape)</span>
          </button>

          <button
            onClick={handleExportBankSoalExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Ekspor ke Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          {canCreate && (
            <>
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Buat Soal via AI</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="px-4 py-2.5 bg-[#1e293b] hover:bg-black text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Soal Manual</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Switcher Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewTab('folders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeViewTab === 'folders'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <span>Folder Mapel & Tingkat ({(db.folderBankSoal || []).length})</span>
          </button>

          <button
            onClick={() => {
              setActiveViewTab('questions');
              setActiveFolderId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeViewTab === 'questions' && !activeFolderId
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Semua Butir Soal ({db.bankSoal.length})</span>
          </button>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreateFolder}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Buat Folder Baru</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FOLDER MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeViewTab === 'folders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(db.folderBankSoal || []).map((folder) => {
              const questionsInFolder = db.bankSoal.filter(
                (s) =>
                  s.folderId === folder.id ||
                  (s.mapelNama === folder.mapelNama &&
                    (folder.tingkat === 'Semua' || s.kelas === folder.tingkat))
              );

              return (
                <div
                  key={folder.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                        <Folder className="w-5 h-5 fill-amber-400 text-amber-600" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {folder.tingkat === 'Semua' ? 'Semua Kelas' : `Kelas ${folder.tingkat}`}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditFolder(folder)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                            title="Edit Folder"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Hapus Folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {folder.namaFolder}
                      </h4>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                        {folder.mapelNama}
                      </p>
                      {folder.deskripsi && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {folder.deskripsi}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {questionsInFolder.length} Soal
                    </span>
                    <button
                      onClick={() => {
                        setActiveFolderId(folder.id);
                        setActiveViewTab('questions');
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-all cursor-pointer"
                    >
                      <span>Buka Folder</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {(db.folderBankSoal || []).length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
              <FolderTree className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold">Belum ada folder bank soal.</p>
              <p className="text-xs text-slate-500 mt-1">
                Buat folder baru untuk mengelompokkan soal berdasarkan mata pelajaran dan tingkat kelas.
              </p>
              {canCreate && (
                <button
                  onClick={handleOpenCreateFolder}
                  className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Buat Folder Sekarang</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUESTIONS LIST VIEW */}
      {/* ========================================================================= */}
      {activeViewTab === 'questions' && (
        <div className="space-y-4">
          {/* Active Folder Breadcrumb if inside folder */}
          {activeFolderId && currentActiveFolder && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                      Folder Aktif
                    </span>
                    <h3 className="text-xs font-bold text-emerald-950">{currentActiveFolder.namaFolder}</h3>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Mata Pelajaran: <strong>{currentActiveFolder.mapelNama}</strong> • Tingkat:{' '}
                    <strong>{currentActiveFolder.tingkat === 'Semua' ? 'Semua Kelas' : `Kelas ${currentActiveFolder.tingkat}`}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveFolderId(null);
                    setActiveViewTab('folders');
                  }}
                  className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl cursor-pointer shadow-2xs"
                >
                  ← Kembali ke Direktori Folder
                </button>
              </div>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pertanyaan, materi, atau mata pelajaran..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Mapel */}
              <select
                value={filterMapel}
                onChange={(e) => setFilterMapel(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="Semua">Semua Mapel</option>
                {db.mapel.map((m) => (
                  <option key={m.id} value={m.namaMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>

              {/* Filter Tingkat Kesulitan */}
              <select
                value={filterTingkat}
                onChange={(e) => setFilterTingkat(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="Semua">Semua Tingkat</option>
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sukar">Sukar</option>
              </select>

              {/* Filter Jenis Media */}
              <select
                value={filterMedia}
                onChange={(e) => setFilterMedia(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none font-semibold text-emerald-800"
              >
                <option value="Semua">Semua Media</option>
                <option value="Video">📹 Lampiran Video</option>
                <option value="Gambar Interaktif">🖼️ Gambar Interaktif</option>
                <option value="Gambar">📷 Gambar Biasa</option>
                <option value="Tanpa Media">Tanpa Media</option>
              </select>
            </div>
          </div>

      {/* List of Questions */}
      <div className="space-y-4">
        {filteredSoal.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold">Tidak ada butir soal yang sesuai filter pencarian.</p>
          </div>
        ) : (
          filteredSoal.map((soal, index) => {
            const isAssignedToTeacher = isSuperOrAdmin || (currentTeacher && allowedMapelList.some((m) => m.id === soal.mapelId || m.namaMapel === soal.mapelNama));

            return (
              <div
                key={soal.id}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      #{index + 1} {soal.id}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      {soal.mapelNama}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Kelas {soal.kelas}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        soal.tingkatKesulitan === 'Mudah'
                          ? 'bg-blue-50 text-blue-700'
                          : soal.tingkatKesulitan === 'Sedang'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {soal.tingkatKesulitan}
                    </span>
                    {soal.mediaTipe === 'video' && (
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </span>
                    )}
                    {soal.mediaTipe === 'gambar_interaktif' && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>Gambar Interaktif</span>
                      </span>
                    )}
                    {soal.mediaTipe === 'gambar' && (
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>Gambar</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedSoal(soal);
                        setIsDetailModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Lihat Pratinjau Soal"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Pratinjau</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(soal)}
                        disabled={!isAssignedToTeacher}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isAssignedToTeacher
                            ? 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
                            : 'text-slate-300 cursor-not-allowed opacity-50'
                        }`}
                        title={isAssignedToTeacher ? 'Edit Soal' : 'Terkunci: Bukan mapel yang Anda ampu'}
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(soal)}
                        disabled={!isAssignedToTeacher}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isAssignedToTeacher
                            ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-slate-300 cursor-not-allowed opacity-50'
                        }`}
                        title={isAssignedToTeacher ? 'Hapus Soal' : 'Terkunci: Bukan mapel yang Anda ampu'}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                  {soal.pertanyaan}
                </div>

                {/* Media Preview inside card if available */}
                {soal.mediaTipe && soal.mediaTipe !== 'none' && soal.mediaUrl && (
                  <QuestionMediaRenderer
                    mediaTipe={soal.mediaTipe}
                    mediaUrl={soal.mediaUrl}
                    mediaCaption={soal.mediaCaption}
                    mediaHotspots={soal.mediaHotspots}
                  />
                )}

                {/* Choices for Multiple Choice */}
                {soal.jenisSoal === 'Pilihan Ganda' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {[
                      { key: 'A', text: soal.pilihanA },
                      { key: 'B', text: soal.pilihanB },
                      { key: 'C', text: soal.pilihanC },
                      { key: 'D', text: soal.pilihanD },
                      { key: 'E', text: soal.pilihanE },
                    ]
                      .filter((o) => o.text)
                      .map((opt) => (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            soal.jawabanBenar === opt.key
                              ? 'bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              soal.jawabanBenar === opt.key
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Footer details */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
                  <div>
                    Materi: <strong className="text-slate-600">{soal.materi}</strong> • Bobot:{' '}
                    <strong className="text-slate-700">{soal.bobot} Poin</strong>
                  </div>
                  <div>
                    Dibuat oleh: <span className="font-semibold text-slate-600">{soal.pembuatNama}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL QUESTION FORM MODAL (WITH MEDIA ATTACHMENTS & MAPEL RESTRICTION) */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {selectedSoal ? 'Edit Butir Soal & Media' : 'Tambah Butir Soal Baru'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* Subject Lock Notice for Teachers */}
              {!isSuperOrAdmin && currentTeacher && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2 text-blue-900">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                  <p>
                    <strong>Ketentuan Khusus Guru:</strong> Anda hanya dapat menginput soal untuk mata pelajaran yang Anda ampu: <strong>{currentTeacher.mataPelajaranUtama}</strong>.
                  </p>
                </div>
              )}

              {/* Folder Assignment */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl">
                <label className="block font-bold text-amber-900 mb-1">📁 Simpan ke Folder Bank Soal (Opsional)</label>
                <select
                  value={formData.folderId || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, folderId: e.target.value || undefined }))}
                  className="w-full p-2 bg-white border border-amber-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- Tanpa Folder Khusus (Sesuai Mapel & Tingkat) --</option>
                  {(db.folderBankSoal || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.namaFolder} ({f.mapelNama} - Kelas {f.tingkat})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-700 mt-1">Mengelompokkan soal ke folder mempermudah pemilihan soal saat ujian.</p>
              </div>

              {/* Mapel & Kelas Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={formData.mapelId}
                    onChange={(e) => {
                      const sel = db.mapel.find((m) => m.id === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        mapelId: e.target.value,
                        mapelNama: sel?.namaMapel || '',
                      }));
                    }}
                    disabled={!isSuperOrAdmin && allowedMapelList.length === 1}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 disabled:opacity-75 disabled:bg-slate-100"
                  >
                    {allowedMapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.namaMapel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kelas: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="10">Kelas 10 (Fase E)</option>
                    <option value="11">Kelas 11 (Fase F)</option>
                    <option value="12">Kelas 12 (Fase F)</option>
                  </select>
                </div>
              </div>

              {/* Materi & Tingkat Kesulitan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Materi Pokok / Bab</label>
                  <input
                    type="text"
                    required
                    value={formData.materi}
                    onChange={(e) => setFormData((prev) => ({ ...prev, materi: e.target.value }))}
                    placeholder="Contoh: Algoritma Pencarian / Aksara Sunda"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kesulitan</label>
                  <select
                    value={formData.tingkatKesulitan}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tingkatKesulitan: e.target.value as any,
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sukar">Sukar</option>
                  </select>
                </div>
              </div>

              {/* Teks Pertanyaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teks Pertanyaan / Soal</label>
                <textarea
                  rows={3}
                  required
                  value={formData.pertanyaan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pertanyaan: e.target.value }))}
                  placeholder="Tuliskan teks butir soal secara lengkap dan jelas..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* ================================================================= */}
              {/* MEDIA ATTACHMENTS (VIDEO, GAMBAR INTERAKTIF, GAMBAR BIASA) */}
              {/* ================================================================= */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Lampiran Media Soal (Video / Gambar Interaktif)</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'Tanpa Media' },
                    { id: 'gambar', label: 'Gambar / Diagram' },
                    { id: 'gambar_interaktif', label: 'Gambar Interaktif' },
                    { id: 'video', label: 'Video (YouTube/MP4)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, mediaTipe: item.id as any }))}
                      className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        formData.mediaTipe === item.id
                          ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {formData.mediaTipe !== 'none' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {formData.mediaTipe === 'video'
                          ? 'URL Video (Link YouTube / Drive / File Video MP4)'
                          : 'URL Gambar atau Unggah Berkas'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.mediaUrl || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, mediaUrl: e.target.value }))}
                          placeholder={
                            formData.mediaTipe === 'video'
                              ? 'https://www.youtube.com/watch?v=... atau link MP4'
                              : 'https://images.unsplash.com/... atau pilih file'
                          }
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800"
                        />
                        {formData.mediaTipe !== 'video' && (
                          <label className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleMediaFileUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Keterangan / Caption Media</label>
                      <input
                        type="text"
                        value={formData.mediaCaption || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, mediaCaption: e.target.value }))}
                        placeholder="Contoh: Perhatikan gambar diagram organ pernapasan berikut."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800"
                      />
                    </div>

                    {/* Interactive Image Hotspot Visual Editor */}
                    {formData.mediaTipe === 'gambar_interaktif' && formData.mediaUrl && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-emerald-700" />
                            <span>Editor Anotasi Hotspot (Klik langsung pada gambar di bawah untuk menambah titik pin)</span>
                          </p>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                            {formData.mediaHotspots?.length || 0} Titik Terpasang
                          </span>
                        </div>

                        <QuestionMediaRenderer
                          mediaTipe="gambar_interaktif"
                          mediaUrl={formData.mediaUrl}
                          mediaCaption={formData.mediaCaption}
                          mediaHotspots={formData.mediaHotspots}
                          isEditable={true}
                          onAddHotspot={handleAddHotspot}
                          onDeleteHotspot={handleDeleteHotspot}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pilihan Jawaban A, B, C, D, E */}
              {formData.jenisSoal === 'Pilihan Ganda' && (
                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-slate-700">Opsi Pilihan Jawaban</label>
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-200 font-bold flex items-center justify-center text-slate-700 shrink-0">
                        {opt}
                      </span>
                      <input
                        type="text"
                        value={(formData as any)[`pilihan${opt}`] || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [`pilihan${opt}`]: e.target.value,
                          }))
                        }
                        placeholder={`Teks Opsi ${opt}`}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                      />
                      <input
                        type="radio"
                        name="jawabanBenar"
                        checked={formData.jawabanBenar === opt}
                        onChange={() => setFormData((prev) => ({ ...prev, jawabanBenar: opt }))}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Tandai Sebagai Kunci Jawaban Benar"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Pembahasan & Bobot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Pembahasan / Solusi Jawaban</label>
                  <textarea
                    rows={2}
                    value={formData.pembahasan || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pembahasan: e.target.value }))}
                    placeholder="Uraian pembahasan kunci jawaban untuk evaluasi..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bobot Poin Soal</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.bobot || 10}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bobot: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Butir Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI GENERATOR MODAL */}
      {/* ========================================================================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>AI Question Generator (Gemini 3 Pro)</span>
              </h3>
              <button onClick={() => setIsAiModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={aiSelectedMapel}
                  onChange={(e) => setAiSelectedMapel(e.target.value)}
                  disabled={!isSuperOrAdmin && allowedMapelList.length === 1}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                >
                  {allowedMapelList.map((m) => (
                    <option key={m.id} value={m.namaMapel}>
                      {m.namaMapel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Topik Bahasan / Capaian Pembelajaran</label>
                <input
                  type="text"
                  value={aiPromptTopic}
                  onChange={(e) => setAiPromptTopic(e.target.value)}
                  placeholder="Contoh: Algoritma Pencarian Biner / Kaidah Pupuh Asmarandana"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Soal</label>
                  <select
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value={1}>1 Soal</option>
                    <option value={3}>3 Soal</option>
                    <option value={5}>5 Soal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lampiran Media</label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiIncludeMedia}
                      onChange={(e) => setAiIncludeMedia(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-slate-700">Gambar Interaktif</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGenerateQuestionsAI}
                disabled={aiLoading}
                className="px-5 py-2 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menghasilkan Soal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Generate Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAIL & PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedSoal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {selectedSoal.mapelNama}
                </span>
                <span className="font-mono text-slate-400">{selectedSoal.id}</span>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="text-sm font-bold text-slate-900 leading-relaxed">
                {selectedSoal.pertanyaan}
              </div>

              {selectedSoal.mediaTipe && selectedSoal.mediaTipe !== 'none' && selectedSoal.mediaUrl && (
                <QuestionMediaRenderer
                  mediaTipe={selectedSoal.mediaTipe}
                  mediaUrl={selectedSoal.mediaUrl}
                  mediaCaption={selectedSoal.mediaCaption}
                  mediaHotspots={selectedSoal.mediaHotspots}
                />
              )}

              {selectedSoal.pilihanA && (
                <div className="space-y-1.5 pt-2">
                  {[
                    { key: 'A', text: selectedSoal.pilihanA },
                    { key: 'B', text: selectedSoal.pilihanB },
                    { key: 'C', text: selectedSoal.pilihanC },
                    { key: 'D', selectedSoal: selectedSoal.pilihanD, text: selectedSoal.pilihanD },
                    { key: 'E', text: selectedSoal.pilihanE },
                  ]
                    .filter((o) => o.text)
                    .map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          selectedSoal.jawabanBenar === opt.key
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            selectedSoal.jawabanBenar === opt.key
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                        {selectedSoal.jawabanBenar === opt.key && (
                          <span className="ml-auto text-[10px] text-emerald-700 font-bold">Kunci Jawaban</span>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {selectedSoal.pembahasan && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 mt-3">
                  <strong className="text-slate-800">Pembahasan:</strong> {selectedSoal.pembahasan}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-[#1e293b] hover:bg-black text-white font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FOLDER CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Folder className="w-4 h-4 fill-amber-400 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingFolder ? 'Edit Folder Bank Soal' : 'Buat Folder Bank Soal Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="py-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Folder</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Paket Soal Penilaian Harian Genap"
                  value={folderForm.namaFolder}
                  onChange={(e) => setFolderForm((prev) => ({ ...prev, namaFolder: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran Terkait</label>
                <select
                  value={folderForm.mapelNama}
                  onChange={(e) => {
                    const sel = db.mapel.find((m) => m.namaMapel === e.target.value);
                    setFolderForm((prev) => ({
                      ...prev,
                      mapelNama: e.target.value,
                      mapelId: sel?.id,
                    }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                >
                  {db.mapel.map((m) => (
                    <option key={m.id} value={m.namaMapel}>
                      {m.namaMapel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                <select
                  value={folderForm.tingkat}
                  onChange={(e) => setFolderForm((prev) => ({ ...prev, tingkat: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                >
                  <option value="10">Kelas 10 (Fase E)</option>
                  <option value="11">Kelas 11 (Fase F)</option>
                  <option value="12">Kelas 12 (Fase F)</option>
                  <option value="Semua">Semua Tingkat (10, 11, 12)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi / Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan mengenai cakupan soal di folder ini..."
                  value={folderForm.deskripsi}
                  onChange={(e) => setFolderForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingFolder ? 'Perbarui Folder' : 'Simpan Folder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
