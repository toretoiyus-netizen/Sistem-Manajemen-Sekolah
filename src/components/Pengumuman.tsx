import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Search,
  Filter,
  Megaphone,
  Pin,
  Calendar,
  User,
  Paperclip,
  CheckCircle,
  X,
  Tag,
  Trash2,
} from 'lucide-react';
import { Pengumuman as PengumumanType, UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';

interface PengumumanProps {
  currentUser: UserAccount;
}

export const Pengumuman: React.FC<PengumumanProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PengumumanType>>({
    judul: '',
    konten: '',
    kategori: 'Akademik',
    target: 'SEMUA',
    isPinned: false,
    status: 'Published',
  });

  const canCreate = dbService.checkPermission(currentUser, 'pengumuman.create');
  const canDelete = dbService.checkPermission(currentUser, 'pengumuman.delete');

  // Role-based visibility
  const allPengumuman = db.pengumuman || db.pengumumanList || [];
  const visiblePengumuman = allPengumuman.filter((p) => {
    const role = currentUser.role;
    if (role === 'SUPER ADMIN' || role === 'ADMIN' || role === 'KEPALA SEKOLAH') return true;
    if (p.target === 'SEMUA' || p.target === 'Semua Akun') return true;
    if ((p.target === 'GURU' || p.target === 'Semua Guru') && (role === 'GURU MAPEL' || role === 'GURU WALI' || role === 'WALI KELAS' || role === 'WAKASEK')) return true;
    if ((p.target === 'SISWA' || p.target === 'Semua Siswa') && role === 'SISWA') return true;
    return true;
  });

  const filteredList = visiblePengumuman.filter((p) => {
    const titleText = p.judul || '';
    const contentText = p.konten || p.isi || '';
    const matchSearch =
      titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contentText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterKategori === 'Semua' || p.kategori === filterKategori;
    return matchSearch && matchCat;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.konten) {
      alert('Mohon isi judul dan konten pengumuman!');
      return;
    }

    const newId = dbService.generateId('ANN');
    const newAnn: PengumumanType = {
      ...(formData as PengumumanType),
      id: newId,
      penulisId: currentUser.id,
      penulisNama: currentUser.nama,
      tanggal: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    db.pengumuman.unshift(newAnn);
    dbService.saveToStorage(db);
    setIsCreateModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus pengumuman ini?')) {
      db.pengumuman = db.pengumuman.filter((p) => p.id !== id);
      dbService.saveToStorage(db);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-600" />
            <span>Pusat Pengumuman & Edaran Sekolah</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi resmi kedinasan, agenda sekolah, dan edaran terarah sesuai hak akses pengguna.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setFormData({
                judul: '',
                konten: '',
                kategori: 'Akademik',
                target: 'SEMUA',
                isPinned: false,
                status: 'Published',
              });
              setIsCreateModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pengumuman</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Akademik">Akademik</option>
            <option value="Kegiatan">Kegiatan</option>
            <option value="Darurat">Darurat</option>
            <option value="Tata Tertib">Tata Tertib</option>
          </select>
        </div>
      </div>

      {/* Announcement List */}
      <div className="space-y-4">
        {filteredList.map((ann) => (
          <div
            key={ann.id}
            className={`bg-white p-5 rounded-2xl border transition-all shadow-xs ${
              ann.isPinned ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {ann.isPinned && (
                    <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                      <Pin className="w-3 h-3 fill-amber-700" />
                      <span>Dipasangi Pin</span>
                    </span>
                  )}
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      ann.kategori === 'Darurat'
                        ? 'bg-rose-100 text-rose-800'
                        : ann.kategori === 'Akademik'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {ann.kategori}
                  </span>
                  <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                    Target: {ann.target}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1">{ann.judul}</h3>
              </div>

              {canDelete && (
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                  title="Hapus Pengumuman"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {ann.konten}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Oleh: <strong className="text-slate-700">{ann.penulisNama}</strong></span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{ann.tanggal}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-600" />
                <span>Buat Pengumuman Baru</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  value={formData.judul || ''}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Jadwal Pelaksanaan PTS Semester Ganjil 2024/2025"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Akademik">Akademik</option>
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Darurat">Darurat</option>
                    <option value="Tata Tertib">Tata Tertib</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Sasaran</label>
                  <select
                    value={formData.target}
                    onChange={(e) =>
                      setFormData({ ...formData, target: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="SEMUA">Semua Warga Sekolah</option>
                    <option value="GURU">Hanya Dewan Guru</option>
                    <option value="SISWA">Hanya Peserta Didik</option>
                    <option value="WALI KELAS">Hanya Wali Kelas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Isi Pesan / Edaran *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.konten || ''}
                  onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                  placeholder="Tuliskan isi pengumuman lengkap..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned || false}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Pasang Pin di Bagian Atas</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Terbitkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
