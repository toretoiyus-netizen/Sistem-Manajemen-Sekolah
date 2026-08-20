import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  Camera,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { PresensiRecord } from '../types';
import { dbService } from '../services/mockDatabase';
import { useToast } from './Toast';

export const LogAuditPresensiWidget: React.FC = () => {
  const db = dbService.getState();
  const { success, warning } = useToast();
  const [filterType, setFilterType] = useState<'all' | 'anomaly' | 'valid'>('all');
  const [selectedRecord, setSelectedRecord] = useState<PresensiRecord | null>(null);

  const presensiItems: PresensiRecord[] = (db.presensiList || db.presensi || []).slice(0, 50);

  // Helper to determine if a record is suspicious
  const isSuspicious = (p: PresensiRecord): { suspicious: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    if (p.lokasi && !p.lokasi.isWithinSchoolRadius) {
      reasons.push('Luar Radius Sekolah (>100m)');
    }
    if (p.lokasi && (p.lokasi.accuracy || 0) > 50) {
      reasons.push(`Akurasi GPS Rendah (±${p.lokasi.accuracy}m)`);
    }
    if ((p.metode === 'Selfie' || (p.metode as string) === 'GPS + Selfie') && !p.fotoSelfie) {
      reasons.push('Tanpa Foto Selfie Bukti');
    }
    if (p.jamMasuk && (p.jamMasuk > '08:00' || p.jamMasuk < '06:00')) {
      reasons.push('Waktu Presensi di Luar Jam Reguler');
    }
    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  };

  const filteredLogs = presensiItems.filter((p) => {
    const check = isSuspicious(p);
    if (filterType === 'anomaly') return check.suspicious;
    if (filterType === 'valid') return !check.suspicious;
    return true;
  });

  const totalSuspicious = presensiItems.filter((p) => isSuspicious(p).suspicious).length;
  const totalValid = presensiItems.length - totalSuspicious;

  const handleVerify = (id: string) => {
    success(`Presensi ${id} berhasil diverifikasi manual oleh Administrator/Wali Kelas.`, 'Audit Presensi');
  };

  const handleFlagAnomaly = (id: string) => {
    warning(`Presensi ${id} telah ditandai sebagai Anomali & diminta verifikasi ulang.`, 'Peringatan Audit');
  };

  return (
    <div id="log-audit-presensi-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-sm">Log Audit & Keamanan Presensi Real-Time</h3>
            <span className="bg-purple-100 text-purple-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
              Anti-Fake GPS
            </span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Mendeteksi pelanggaran geofencing radius sekolah, manipulasi koordinat GPS, dan log waktu presensi siswa.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({presensiItems.length})
          </button>
          <button
            onClick={() => setFilterType('anomaly')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              filterType === 'anomaly'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Anomali ({totalSuspicious})</span>
          </button>
          <button
            onClick={() => setFilterType('valid')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'valid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Valid ({totalValid})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Radius Sekolah (Geofence)</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">Maks. 100 Meter</div>
            <div className="text-[10px] text-slate-400 font-mono">-6.914744, 107.609810</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-700">Tingkat Integritas Valid</div>
            <div className="text-sm font-black text-emerald-800 mt-0.5">
              {presensiItems.length > 0 ? Math.round((totalValid / presensiItems.length) * 100) : 100}% Sesuai Lokasi
            </div>
            <div className="text-[10px] text-emerald-600">{totalValid} Siswa dalam batas aman</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-rose-700">Perlu Verifikasi / Review</div>
            <div className="text-sm font-black text-rose-800 mt-0.5">{totalSuspicious} Aktivitas Mencurigakan</div>
            <div className="text-[10px] text-rose-600">Pelanggaran GPS / Luar Sekolah</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Table of Attendance Audits */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Siswa & Kelas</th>
              <th className="p-3">Waktu & Metode</th>
              <th className="p-3">Koordinat & Lokasi GPS</th>
              <th className="p-3">Status Audit</th>
              <th className="p-3 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  Tidak ada data log presensi yang sesuai dengan filter ini.
                </td>
              </tr>
            ) : (
              filteredLogs.map((p) => {
                const check = isSuspicious(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.namaSiswa}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        NISN: {p.nisn} • {p.rombelNama}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{p.jamMasuk || p.waktuPresensi || '07:15 WIB'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{p.metode}</div>
                    </td>
                    <td className="p-3">
                      {p.lokasi ? (
                        <div>
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
                            <MapPin className="w-3 h-3 text-purple-600" />
                            <span>
                              {p.lokasi.latitude.toFixed(6)}, {p.lokasi.longitude.toFixed(6)}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">
                            {p.lokasi.address || 'Bandung, Jawa Barat (± 15m radius)'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Data GPS tidak tersedia</span>
                      )}
                    </td>
                    <td className="p-3">
                      {check.suspicious ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>MENCURIGAKAN</span>
                          </span>
                          <div className="text-[10px] text-rose-700 font-medium">
                            {check.reasons.join(', ')}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>VALID (Radius Aman)</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(p)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Lihat Detail Audit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {check.suspicious ? (
                          <button
                            onClick={() => handleVerify(p.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Verifikasi
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFlagAnomaly(p.id)}
                            className="px-2 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Flag
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Audit */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-slate-900 text-sm">Detail Forensik Presensi</h4>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="text-slate-500 text-[10px]">Informasi Siswa</div>
                <div className="font-bold text-slate-900 text-sm">{selectedRecord.namaSiswa}</div>
                <div className="text-slate-600 font-mono text-[11px]">
                  NISN: {selectedRecord.nisn} • {selectedRecord.rombelNama}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-500">Status Kehadiran</div>
                  <div className="font-bold text-emerald-700">{selectedRecord.status}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] text-slate-500">Metode Presensi</div>
                  <div className="font-bold text-slate-800">{selectedRecord.metode}</div>
                </div>
              </div>

              {selectedRecord.lokasi && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-purple-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Audit Geofencing GPS</span>
                  </div>
                  <div className="text-slate-700 font-mono text-[11px]">
                    Latitude: {selectedRecord.lokasi.latitude}
                    <br />
                    Longitude: {selectedRecord.lokasi.longitude}
                    <br />
                    Radius Valid: {selectedRecord.lokasi.isWithinSchoolRadius ? 'Ya (Dalam Sekolah)' : 'Tidak (Di Luar)'}
                  </div>
                </div>
              )}

              {selectedRecord.fotoSelfie ? (
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>Foto Bukti Kehadiran</span>
                  </div>
                  <img
                    src={selectedRecord.fotoSelfie}
                    alt="Selfie"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                  Tidak ada foto selfie yang dilampirkan dalam presensi ini.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
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
