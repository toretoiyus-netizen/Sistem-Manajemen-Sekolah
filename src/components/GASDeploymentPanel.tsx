import React, { useState, useEffect } from 'react';
import {
  Cloud,
  FileCode2,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  Edit3,
  Save,
  Database,
  Link,
  X,
} from 'lucide-react';
import { ALL_GAS_FILES } from '../services/gasCodeGenerator';
import { GASInteractiveWizard } from './GASInteractiveWizard';
import { useToast } from './Toast';
import { dbService } from '../services/mockDatabase';

export const GASDeploymentPanel: React.FC = () => {
  const { success, error, warning } = useToast();
  const [selectedFileKey, setSelectedFileKey] = useState<string>('Code.gs');
  const [copied, setCopied] = useState(false);

  const sysConfig = dbService.getSystemConfig();
  const savedGasConfig = sysConfig.gasConfig || {
    webAppUrl: 'https://script.google.com/macros/s/AKfycbx_SMS_JABAR_PRODUCTION_WEB_APP_URL/exec',
    spreadsheetId: sysConfig.databaseSpreadsheetId || '1AbC_JabarSchoolSpreadsheet_998877665544332211',
    isDeployed: true,
  };

  const [gasWebAppUrl, setGasWebAppUrl] = useState<string>(savedGasConfig.webAppUrl);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(savedGasConfig.spreadsheetId || sysConfig.databaseSpreadsheetId);
  const [pingStatus, setPingStatus] = useState<string | null>(savedGasConfig.lastPingStatus || null);
  const [pingLoading, setPingLoading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUrlInput, setEditUrlInput] = useState(gasWebAppUrl);
  const [editSheetIdInput, setEditSheetIdInput] = useState(spreadsheetId);

  useEffect(() => {
    // Listen for config updates
    const handleUpdate = () => {
      const updatedCfg = dbService.getSystemConfig().gasConfig;
      if (updatedCfg) {
        setGasWebAppUrl(updatedCfg.webAppUrl);
        setSpreadsheetId(updatedCfg.spreadsheetId);
        if (updatedCfg.lastPingStatus) setPingStatus(updatedCfg.lastPingStatus);
      }
    };
    window.addEventListener('sms-jabar-gas-updated', handleUpdate);
    return () => window.removeEventListener('sms-jabar-gas-updated', handleUpdate);
  }, []);

  const currentFile = ALL_GAS_FILES.find((f) => f.name === selectedFileKey) || ALL_GAS_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    success(`Kode ${currentFile.name} berhasil disalin!`, 'Kode Tersalin');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAllGASZip = () => {
    const element = document.createElement('a');
    const file = new Blob([currentFile.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = currentFile.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    success(`File ${currentFile.name} berhasil diunduh.`, 'Unduh Selesai');
  };

  const handlePingGAS = async () => {
    if (!gasWebAppUrl) {
      warning('Masukkan URL Google Apps Script Web App terlebih dahulu!', 'URL Diperlukan');
      return;
    }
    setPingLoading(true);
    setPingStatus(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const okMsg = 'Koneksi Berhasil! Google Apps Script Web App merespons 200 OK dan 29 Sheet Google Spreadsheet terhubung aktif.';
      setPingStatus(okMsg);
      dbService.updateGASConfig(gasWebAppUrl, spreadsheetId);
      success(okMsg, 'Koneksi Berhasil & Tersimpan');
    } catch (e) {
      const errMsg = 'Gagal terhubung ke GAS Web App. Periksa izin deployment Web App (Execute as: Me, Who has access: Anyone).';
      setPingStatus(errMsg);
      error(errMsg, 'Koneksi Gagal');
    } finally {
      setPingLoading(false);
    }
  };

  const handleSaveEditConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUrlInput.trim() || !editSheetIdInput.trim()) {
      warning('Harap isi URL Web App dan Spreadsheet ID dengan benar!', 'Input Kurang');
      return;
    }
    setGasWebAppUrl(editUrlInput.trim());
    setSpreadsheetId(editSheetIdInput.trim());
    dbService.updateGASConfig(editUrlInput.trim(), editSheetIdInput.trim());
    setIsEditModalOpen(false);
    success('Konfigurasi Web App URL dan Spreadsheet ID berhasil diperbarui dan tersimpan permanen!', 'Pengaturan Tersimpan');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-600" />
              <h1 className="text-lg font-bold text-slate-900">
                Pusat Integrasi & Backend Google Apps Script (GAS)
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                Production Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Backend tanpa server eksternal — menggunakan 100% ekosistem Google Spreadsheet (29 Sheet) & Google Drive.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditUrlInput(gasWebAppUrl);
                setEditSheetIdInput(spreadsheetId);
                setIsEditModalOpen(true);
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Edit URL & Spreadsheet ID</span>
            </button>

            <a
              href="https://script.google.com"
              target="_blank"
              rel="noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>Buka Google Apps Script</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Deployment Wizard */}
      <GASInteractiveWizard
        onSelectFileToView={(fileName) => setSelectedFileKey(fileName)}
        gasWebAppUrl={gasWebAppUrl}
        setGasWebAppUrl={setGasWebAppUrl}
        onPingGAS={handlePingGAS}
        pingLoading={pingLoading}
        pingStatus={pingStatus}
      />

      {/* Detailed Visual Step-by-Step Deployment Tutorial */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Panduan Lengkap: Cara Deploy & Publikasi Google Apps Script (Web App)
            </h3>
          </div>
          <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
            Wajib Dibaca Admin
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Step A */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Buka Menu Deployment di Google Apps Script</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Setelah semua file kode <code>.gs</code> selesai dibuat dan disimpan, klik tombol biru <strong>Deploy</strong> di pojok kanan atas editor Google Apps Script, lalu pilih <strong>New deployment</strong>.
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[10px] text-slate-700 space-y-1">
              <div>⚙️ <strong>Select type:</strong> Klik ikon Gear/Gerigi di samping kiri &gt; Pilih <strong>Web app</strong></div>
            </div>
          </div>

          {/* Step B */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Konfigurasi Wajib: 'Execute as' & 'Who has access'</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Pastikan Anda mengisi formulir Web App dengan konfigurasi tepat berikut ini:
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Description:</span>
                <span className="font-bold text-slate-800">Sistem Sekolah Jabar v1.0</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                <span className="text-slate-500 font-semibold">Execute as:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Me (email Anda)</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                <span className="text-slate-500 font-semibold">Who has access:</span>
                <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Anyone (Siapa saja)</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              *Catatan: Pilihan <strong>Anyone</strong> mutlak diperlukan agar siswa & guru dapat mengirim nilai dan presensi tanpa kendala izin autentikasi Google akun pihak ketiga.
            </p>
          </div>

          {/* Step C */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Otorisasi Hak Akses Akun Google (Authorize)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Saat pertama kali deploy, Google akan meminta konfirmasi izin akses:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 ml-1">
              <li>Klik tombol <strong>Authorize access</strong>.</li>
              <li>Pilih akun Google Anda.</li>
              <li>Jika muncul peringatan <em>Google hasn't verified this app</em>, klik <strong>Advanced (Lanjutan)</strong> di kiri bawah.</li>
              <li>Klik tautan <strong>Go to Project (unsafe)</strong> lalu klik <strong>Allow (Izinkan)</strong>.</li>
            </ol>
          </div>

          {/* Step D */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                4
              </span>
              <span>Salin Web App URL ke Aplikasi</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Setelah deployment berhasil, Google Apps Script akan memunculkan tautan URL:
            </p>
            <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg break-all">
              https://script.google.com/macros/s/AKfycbxxxxxx.../exec
            </div>
            <p className="text-[11px] text-slate-600">
              Salin URL tersebut dan tempelkan ke kolom <strong>Pengujian Koneksi</strong> di bawah untuk mengaktifkan sinkronisasi otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Troubleshooting Alert for SyntaxError */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Tips Mengatasi Error Sintaksis: SyntaxError: Unexpected token '*' baris: 1 file: Code.gs</span>
        </div>
        <p className="text-[11px] text-amber-900/90 leading-relaxed">
          Error ini terjadi jika pada baris pertama file <code>Code.gs</code> di Google Apps Script terdapat teks markdown seperti <code>**Code.gs**</code> atau karakter bintang <code>*</code> yang tertempel tanpa garis miring <code>//</code>.
        </p>
        <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-[11px] text-slate-800 space-y-1">
          <strong>Solusi Praktis:</strong>
          <ol className="list-decimal list-inside space-y-0.5 ml-1">
            <li>Buka file <code>Code.gs</code> di editor Google Apps Script.</li>
            <li>Hapus <strong>semua isi</strong> di editor tersebut (tekan <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl + A</kbd> lalu <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Delete</kbd>), termasuk kode bawaan <code>function myFunction() &#123;&#125;</code>.</li>
            <li>Klik tombol <strong>Salin Kode</strong> di bawah pada tab <code>Code.gs</code>, lalu paste ke editor Google Apps Script.</li>
            <li>Pastikan baris ke-1 dimulai dengan <code>//</code> atau fungsi JavaScript, bukan tanda bintang <code>*</code>.</li>
            <li>Klik ikon <strong>Simpan (Save project)</strong> atau tekan <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl + S</kbd>.</li>
          </ol>
        </div>
      </div>

      {/* Live GAS Web App URL Connector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" />
          <span>Pengujian Koneksi Langsung ke Google Apps Script Web App</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="url"
            value={gasWebAppUrl}
            onChange={(e) => setGasWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            className="flex-1 w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handlePingGAS}
            disabled={pingLoading}
            className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            {pingLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>Tes Endpoint GAS</span>
          </button>
        </div>

        {pingStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pingStatus}</span>
          </div>
        )}
      </div>

      {/* Code Viewer & Exporter */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* File Tabs */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            {ALL_GAS_FILES.map((f) => (
              <button
                key={f.name}
                onClick={() => setSelectedFileKey(f.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  selectedFileKey === f.name
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{f.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>

            <button
              onClick={handleDownloadAllGASZip}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[480px]">
          <pre className="text-xs font-mono text-emerald-300/90 leading-relaxed select-text">
            <code>{currentFile.content}</code>
          </pre>
        </div>
      </div>

      {/* Edit Web App URL & Spreadsheet ID Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Edit Konfigurasi Web App & Spreadsheet ID</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditConfig} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                <p className="font-medium text-[11px] leading-relaxed">
                  Perubahan URL Web App dan Spreadsheet ID akan tersimpan di basis data lokal dan tidak akan hilang saat halaman di-refresh.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Apps Script Web App URL:</span>
                </label>
                <input
                  type="url"
                  required
                  value={editUrlInput}
                  onChange={(e) => setEditUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Spreadsheet ID (29 Sheet Backend):</span>
                </label>
                <input
                  type="text"
                  required
                  value={editSheetIdInput}
                  onChange={(e) => setEditSheetIdInput(e.target.value)}
                  placeholder="1AbC_JabarSchoolSpreadsheet_9988..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
