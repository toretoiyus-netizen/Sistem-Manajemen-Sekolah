import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  UserCheck,
  CheckCircle,
  X,
  Phone,
  Mail,
  Award,
} from 'lucide-react';
import { Guru, UserAccount } from '../types';
import { dbService } from '../services/mockDatabase';

interface DataGuruProps {
  currentUser: UserAccount;
}

export const DataGuru: React.FC<DataGuruProps> = ({ currentUser }) => {
  const db = dbService.getState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('Semua');
  const [filterTugas, setFilterTugas] = useState<string>('Semua');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Guru>>({
    nip: '',
    nik: '',
    nama: '',
    gelar: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Bandung',
    tanggalLahir: '1985-01-01',
    alamat: '',
    nomorHp: '',
    email: '',
    mataPelajaranUtama: 'Bahasa dan Sastra Sunda',
    statusKepegawaian: 'PNS',
    tugasTambahan: 'Tidak Ada Tugas Tambahan',
    role: 'GURU MAPEL',
    status: 'Aktif',
  });

  const canCreate = dbService.checkPermission(currentUser, 'guru.create');
  const canEdit = dbService.checkPermission(currentUser, 'guru.edit');
  const canDelete = dbService.checkPermission(currentUser, 'guru.delete');

  const filteredGuru = db.guru.filter((g) => {
    const matchSearch =
      g.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nip.includes(searchTerm) ||
      g.mataPelajaranUtama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'Semua' || g.role === filterRole;
    const matchTugas = filterTugas === 'Semua' || g.tugasTambahan === filterTugas;
    return matchSearch && matchRole && matchTugas;
  });

  const handleOpenCreate = () => {
    setSelectedGuru(null);
    setFormData({
      nip: '',
      nik: '',
      nama: '',
      gelar: '',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Bandung',
      tanggalLahir: '1985-01-01',
      alamat: '',
      nomorHp: '',
      email: '',
      mataPelajaranUtama: 'Bahasa dan Sastra Sunda',
      statusKepegawaian: 'PNS',
      tugasTambahan: 'Tidak Ada Tugas Tambahan',
      role: 'GURU MAPEL',
      status: 'Aktif',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (guru: Guru) => {
    setSelectedGuru(guru);
    setFormData(guru);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (guru: Guru) => {
    setSelectedGuru(guru);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (guruId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
      const updatedGuru = db.guru.filter((g) => g.id !== guruId);
      db.guru = updatedGuru;
      dbService.saveToStorage(db);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nip) {
      alert('Mohon lengkapi nama dan NIP guru!');
      return;
    }

    if (selectedGuru) {
      // Edit
      const updated = db.guru.map((g) =>
        g.id === selectedGuru.id ? ({ ...g, ...formData } as Guru) : g
      );
      db.guru = updated;
    } else {
      // Create new
      const newId = dbService.generateId('GURU');
      const newGuru: Guru = {
        ...(formData as Guru),
        id: newId,
        foto:
          formData.jenisKelamin === 'Perempuan'
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      };
      db.guru.push(newGuru);

      // Auto create user account for this teacher if not exists
      const newUserAccount: UserAccount = {
        id: dbService.generateId('USR'),
        username: newGuru.nip,
        nama: newGuru.nama,
        role: newGuru.role,
        email: newGuru.email,
        nomorHp: newGuru.nomorHp,
        referenceId: newGuru.id,
        status: 'Aktif',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUserAccount);
    }

    dbService.saveToStorage(db);
    setIsFormModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span>Data Tenaga Pendidik (Guru & Tendik)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen data induk guru, NIP, NIK, tugas tambahan (Wali Kelas, Guru Wali, Wakasek), dan mata pelajaran utama.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, NIP, atau Mapel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Role</option>
            <option value="KEPALA SEKOLAH">KEPALA SEKOLAH</option>
            <option value="WAKASEK">WAKASEK</option>
            <option value="WALI KELAS">WALI KELAS</option>
            <option value="GURU WALI">GURU WALI</option>
            <option value="GURU MAPEL">GURU MAPEL</option>
          </select>
        </div>

        <div>
          <select
            value={filterTugas}
            onChange={(e) => setFilterTugas(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua">Semua Tugas Tambahan</option>
            <option value="Kepala Sekolah">Kepala Sekolah</option>
            <option value="Wakasek Kurikulum">Wakasek Kurikulum</option>
            <option value="Wali Kelas">Wali Kelas</option>
            <option value="Guru Wali">Guru Wali</option>
            <option value="Tidak Ada Tugas Tambahan">Guru Mapel Murni</option>
          </select>
        </div>
      </div>

      {/* Guru Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Foto</th>
                <th className="p-3.5">Nama & Gelar</th>
                <th className="p-3.5">NIP & NIK</th>
                <th className="p-3.5">Mapel Utama</th>
                <th className="p-3.5">Tugas Tambahan & Beban</th>
                <th className="p-3.5 text-center">Beban 24 Jam</th>
                <th className="p-3.5">Role Sistem</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGuru.map((guru) => {
                const workload = dbService.getTeacherWorkload(guru.id);
                const gwQuota = dbService.getGuruWaliQuota(guru.id);

                return (
                  <tr key={guru.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <img
                        src={guru.foto}
                        alt={guru.nama}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-300 shadow-xs"
                      />
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{guru.nama}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{guru.jenisKelamin}</span>
                        <span>•</span>
                        <span>{guru.statusKepegawaian}</span>
                      </div>
                      {/* Guru Wali Quota Badge & Warning Notification */}
                      {(guru.role === 'GURU WALI' || gwQuota.count > 0) && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${gwQuota.badgeColor}`}>
                            <span>Guru Wali: {gwQuota.count}/20 Siswa</span>
                            {gwQuota.status === 'Kurang' && <span>(Kurang Kuota)</span>}
                            {gwQuota.status === 'Lebih' && <span>(Lebih Kuota)</span>}
                            {gwQuota.status === 'Ideal' && <span>(Ideal)</span>}
                          </span>
                          {gwQuota.status !== 'Ideal' && (
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              {gwQuota.status === 'Kurang' ? '⚠️ Belum 20 siswa (masih bisa lanjut)' : '⚠️ Lebih dari 20 siswa (masih bisa lanjut)'}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">
                      <div>NIP: {guru.nip}</div>
                      <div className="text-slate-400">NIK: {guru.nik}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">{guru.mataPelajaranUtama}</span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          guru.tugasTambahan === 'Kepala Sekolah'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : guru.tugasTambahan.includes('Wakasek')
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : guru.tugasTambahan === 'Wali Kelas'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : guru.tugasTambahan === 'Guru Wali'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {guru.tugasTambahan}
                      </span>
                      {workload.tugasTambahanHours > 0 && (
                        <div className="text-[10px] text-emerald-700 font-bold mt-1">
                          +{workload.tugasTambahanHours} Jam Ekuivalen
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {workload.totalHours} <span className="text-[10px] text-slate-400 font-normal">/ 24 Jam</span>
                      </div>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            workload.totalHours >= 24 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (workload.totalHours / 24) * 100)}%` }}
                        ></div>
                      </div>
                      <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        workload.statusBeban === 'Ideal'
                          ? 'text-emerald-700 bg-emerald-50'
                          : workload.statusBeban === 'Lebih'
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-amber-700 bg-amber-50'
                      }`}>
                        {workload.totalHours >= 24 ? 'Terpenuhi' : `Kurang ${24 - workload.totalHours}J`}
                      </span>

                      {/* Bentrok warning badge */}
                      {workload.hasConflict && (
                        <div className="mt-1 px-1.5 py-0.5 bg-rose-100 border border-rose-300 text-rose-800 rounded text-[9px] font-bold">
                          ⚠️ Bentrok Jadwal
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {guru.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(guru)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
                          title="Lihat Detail Profil & Beban Kerja"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(guru)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            title="Edit Data Guru"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(guru.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 cursor-pointer"
                            title="Hapus Data Guru"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (CREATE / EDIT GURU) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span>{selectedGuru ? 'Edit Data Tenaga Pendidik' : 'Tambah Guru Baru'}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Dr. H. Asep Sunandar, M.Pd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP (Nomor Induk Pegawai) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="18 Digit NIP (Contoh: 19750812...)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK (KTP)</label>
                  <input
                    type="text"
                    value={formData.nik || ''}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="16 Digit NIK"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenisKelamin: e.target.value as 'Laki-laki' | 'Perempuan',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mapel Utama</label>
                  <input
                    type="text"
                    value={formData.mataPelajaranUtama || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, mataPelajaranUtama: e.target.value })
                    }
                    placeholder="Contoh: Matematika Peminatan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tugas Tambahan</label>
                  <select
                    value={formData.tugasTambahan}
                    onChange={(e) =>
                      setFormData({ ...formData, tugasTambahan: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tidak Ada Tugas Tambahan">Tidak Ada Tugas Tambahan</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Wakasek Kurikulum">Wakasek Kurikulum</option>
                    <option value="Wakasek Kesiswaan">Wakasek Kesiswaan</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Guru Wali">Guru Wali</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Akun Sistem</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="GURU MAPEL">GURU MAPEL</option>
                    <option value="WALI KELAS">WALI KELAS</option>
                    <option value="GURU WALI">GURU WALI</option>
                    <option value="WAKASEK">WAKASEK</option>
                    <option value="KEPALA SEKOLAH">KEPALA SEKOLAH</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formData.nomorHp || ''}
                    onChange={(e) => setFormData({ ...formData, nomorHp: e.target.value })}
                    placeholder="0812233..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Email Dinas / Pribadi</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama.guru@sman1bdg.sch.id"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Domisili</label>
                  <textarea
                    rows={2}
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Alamat lengkap tempat tinggal"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md active:scale-95"
                >
                  Simpan Data Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedGuru && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Biodata Lengkap Tenaga Pendidik</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <img
                src={selectedGuru.foto}
                alt={selectedGuru.nama}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedGuru.nama}</h4>
                <div className="text-xs text-emerald-700 font-semibold">{selectedGuru.role}</div>
                <div className="text-[11px] text-slate-500 font-mono">NIP: {selectedGuru.nip}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Mata Pelajaran Utama:</span>
                <span className="font-semibold text-slate-800">{selectedGuru.mataPelajaranUtama}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Tugas Tambahan:</span>
                <span className="font-bold text-emerald-700">{selectedGuru.tugasTambahan}</span>
              </div>

              {/* Workload 24 Hours Details */}
              {(() => {
                const wl = dbService.getTeacherWorkload(selectedGuru.id);
                const gw = dbService.getGuruWaliQuota(selectedGuru.id);
                return (
                  <>
                    <div className="pt-3 pb-1">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">Akumulasi Beban Mengajar</span>
                          <span className="font-extrabold text-slate-900 text-sm">{wl.totalHours} / 24 Jam</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>• Tatap Muka KBM: <strong className="text-slate-800">{wl.kbmHours} Jam</strong></div>
                          <div>• Ekuivalen Tugas: <strong className="text-emerald-700">+{wl.tugasTambahanHours} Jam</strong></div>
                        </div>
                        <div className={`p-2 rounded-lg text-[10px] font-bold border ${wl.badgeColor}`}>
                          {wl.message}
                        </div>
                        {wl.hasConflict && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-900">
                            <strong>Bentrok Jadwal Terdeteksi:</strong>
                            {wl.conflictReasons.map((r, i) => (
                              <div key={i}>• {r}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Guru Wali Quota Details */}
                    {(selectedGuru.role === 'GURU WALI' || gw.count > 0) && (
                      <div className="pt-2">
                        <div className={`p-3 rounded-xl border ${gw.badgeColor} space-y-1.5`}>
                          <div className="flex justify-between items-center">
                            <span className="font-bold">Status Kuota Guru Wali (Maks. 20 Siswa)</span>
                            <span className="font-extrabold text-xs">{gw.count} / 20 Siswa</span>
                          </div>
                          <p className="text-[11px] font-normal leading-relaxed">{gw.message}</p>
                          {gw.siswaList.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                              <span className="font-bold text-[10px] block mb-1">Daftar Siswa Binaan:</span>
                              <div className="max-h-24 overflow-y-auto space-y-0.5 text-[10px]">
                                {gw.siswaList.map((s, idx) => (
                                  <div key={s.id} className="flex justify-between">
                                    <span>{idx + 1}. {s.namaLengkap} ({s.nisn})</span>
                                    <span>{s.rombel}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Status Kepegawaian:</span>
                <span className="font-semibold text-slate-800">{selectedGuru.statusKepegawaian}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Nomor WhatsApp:</span>
                <span className="font-mono text-slate-800">{selectedGuru.nomorHp}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-800">{selectedGuru.email}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Alamat:</span>
                <span className="text-slate-800 text-right max-w-[240px]">{selectedGuru.alamat}</span>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
