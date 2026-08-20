import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  FileCode2,
  PlayCircle,
  Settings2,
  Link2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ALL_GAS_FILES } from '../services/gasCodeGenerator';
import { useToast } from './Toast';
import { dbService } from '../services/mockDatabase';

interface GASInteractiveWizardProps {
  onSelectFileToView: (fileName: string) => void;
  gasWebAppUrl: string;
  setGasWebAppUrl: (url: string) => void;
  onPingGAS: () => void;
  pingLoading: boolean;
  pingStatus: string | null;
}

export const GASInteractiveWizard: React.FC<GASInteractiveWizardProps> = ({
  onSelectFileToView,
  gasWebAppUrl,
  setGasWebAppUrl,
  onPingGAS,
  pingLoading,
  pingStatus,
}) => {
  const { success, info } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const initialCfg = dbService.getSystemConfig();
  const [spreadsheetId, setSpreadsheetId] = useState(
    initialCfg.gasConfig?.spreadsheetId || initialCfg.databaseSpreadsheetId || '1AbC_JabarSchoolSpreadsheet_998877665544332211'
  );
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Checklists for Step 2
  const [completedFiles, setCompletedFiles] = useState<Record<string, boolean>>({});

  // Checklist states for Step 3 & 4
  const [initExecuted, setInitExecuted] = useState(false);
  const [deployExecuted, setDeployExecuted] = useState(false);

  const handleCopyFile = (fileName: string, content: string) => {
    let finalContent = content;
    if (fileName === 'Database.gs' && spreadsheetId.trim()) {
      finalContent = content.replace(
        /const SPREADSHEET_ID = '.*';/,
        `const SPREADSHEET_ID = '${spreadsheetId.trim()}';`
      );
    }

    navigator.clipboard.writeText(finalContent);
    setCopiedFile(fileName);
    setCompletedFiles((prev) => ({ ...prev, [fileName]: true }));
    success(`Kode file ${fileName} berhasil disalin ke clipboard!`, 'Kode Disalin');
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const steps = [
    { number: 1, title: 'Spreadsheet ID', icon: Settings2 },
    { number: 2, title: 'Salin File .gs', icon: FileCode2 },
    { number: 3, title: 'Inisialisasi', icon: PlayCircle },
    { number: 4, title: 'Deploy Web App', icon: ShieldCheck },
    { number: 5, title: 'Uji Koneksi', icon: Link2 },
  ];

  const totalSteps = steps.length;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div id="gas-interactive-wizard" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with Progress Bar */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/30">
                Panduan Interaktif
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Wizard Deployment Google Apps Script
              </h2>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Ikuti 5 langkah mudah berikut untuk menghubungkan spreadsheet Anda ke aplikasi web sekolah.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-300">
              Langkah {currentStep} dari {totalSteps}
            </span>
            <div className="text-emerald-400 font-black text-xs">{progressPercent}% Selesai</div>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-700/60 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Step Tabs Navigation */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-4 pt-1">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <button
                key={step.number}
                onClick={() => setCurrentStep(step.number)}
                className={`py-2 px-1 sm:px-2 rounded-xl text-left transition-all cursor-pointer flex flex-col sm:flex-row items-center sm:items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isCompleted
                    ? 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                    : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isActive
                      ? 'bg-white text-emerald-800'
                      : isCompleted
                      ? 'bg-emerald-400 text-slate-900'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.number}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold truncate hidden sm:inline">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <div className="p-5 sm:p-6 text-slate-800">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Settings2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Langkah 1: Siapkan Google Spreadsheet & Masukkan Spreadsheet ID
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aplikasi membutuhkan 1 Google Spreadsheet kosong di Google Drive akun Anda.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                <li>
                  Buka{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 font-bold underline inline-flex items-center gap-1"
                  >
                    sheets.new <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  untuk membuat Spreadsheet baru, beri nama <strong>"Database_Sekolah_Jabar"</strong>.
                </li>
                <li>Salin ID Spreadsheet dari tautan browser Anda.</li>
              </ol>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 text-[11px] block">
                  Tempelkan Spreadsheet ID Anda di sini:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {spreadsheetId && (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ID Spreadsheet tersimpan! Saat Anda menyalin <code>Database.gs</code> di langkah berikutnya, ID ini akan otomatis disisipkan.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileCode2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Langkah 2: Salin File Kode Skrip ke Google Apps Script
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buka editor Google Apps Script melalui menu <strong>Extensions &gt; Apps Script</strong> pada spreadsheet Anda.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <p className="text-slate-600">
                Buat file skrip sesuai daftar berikut, lalu klik tombol <strong>Salin</strong> untuk menempelkan kodenya ke editor Apps Script:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_GAS_FILES.map((file) => {
                  const isDone = completedFiles[file.name];
                  const isJustCopied = copiedFile === file.name;

                  return (
                    <div
                      key={file.name}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isDone
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-mono text-xs font-bold">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300" />
                        )}
                        <span>{file.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectFileToView(file.name);
                            info(`Membuka kode ${file.name} pada panel preview di bawah.`);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-md cursor-pointer"
                        >
                          Lihat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyFile(file.name, file.content)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                            isJustCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-black text-white'
                          }`}
                        >
                          {isJustCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{isJustCopied ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Penting:</strong> Pada file bawaan <code>Code.gs</code> di Apps Script, hapus semua kode bawaan <code>function myFunction() &#123;&#125;</code> sebelum menempelkan kode baru agar tidak terjadi bentrok fungsi.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <PlayCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Langkah 3: Jalankan Inisialisasi Database (Membuat 29 Sheet Otomatis)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fungsi inisialisasi ini hanya perlu dijalankan 1 kali saja untuk membuat seluruh tabel dan header kolom.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>
                  Pada editor Google Apps Script, di menu dropdown fungsi di toolbar atas, pilih fungsi <strong><code>initializeDatabase</code></strong>.
                </li>
                <li>
                  Klik tombol <strong>Run (Jalankan)</strong>.
                </li>
                <li>
                  Saat muncul konfirmasi <strong>Authorization Required</strong>:
                  <div className="ml-5 mt-1.5 p-3 bg-white rounded-lg border border-slate-200 space-y-1 text-[11px]">
                    <div>a. Klik tombol <strong>Review Permissions</strong> dan pilih akun Google Anda.</div>
                    <div>b. Jika muncul layar peringatan <em>Google hasn't verified this app</em>, klik <strong>Advanced (Lanjutan)</strong> di kiri bawah.</div>
                    <div>c. Klik tautan <strong>Go to Backend_Sekolah_Jabar (unsafe)</strong> lalu klik tombol <strong>Allow (Izinkan)</strong>.</div>
                  </div>
                </li>
                <li>
                  Tunggu 5–10 detik hingga muncul status <em>Execution completed</em> di log editor.
                </li>
              </ol>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInitExecuted(!initExecuted);
                    if (!initExecuted) {
                      success('Inisialisasi 29 sheet ditandai selesai!', 'Database Siap');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    initExecuted
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${initExecuted ? 'text-white' : 'text-slate-400'}`} />
                  <span>{initExecuted ? 'Sudah Dijalankan (29 Sheet Terbuat)' : 'Tandai Selesai Dijalankan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Langkah 4: Deploy sebagai Web App (Konfigurasi Hak Akses)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publikasikan skrip backend Anda agar dapat menerima request data nilai, presensi, dan ujian dari aplikasi.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                <li>Klik tombol biru <strong>Deploy</strong> di pojok kanan atas editor Apps Script &gt; pilih <strong>New deployment</strong>.</li>
                <li>Klik ikon gir ⚙️ di samping <em>Select type</em> &gt; pilih <strong>Web app</strong>.</li>
              </ol>

              <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2 text-xs">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Setelan Formulir Web App yang Wajib Diatur:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Description:</div>
                    <div className="font-bold text-slate-800 mt-0.5">Sistem Sekolah Jabar v1.0</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-[10px] text-emerald-800 font-semibold">Execute as: (Wajib)</div>
                    <div className="font-bold text-emerald-900 mt-0.5">Me (email Anda)</div>
                  </div>
                  <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-[10px] text-purple-800 font-semibold">Who has access: (Wajib)</div>
                    <div className="font-bold text-purple-900 mt-0.5">Anyone (Siapa saja)</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeployExecuted(!deployExecuted);
                    if (!deployExecuted) {
                      success('Deployment Web App berhasil dikonfigurasi!', 'Siap Sambungkan');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    deployExecuted
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${deployExecuted ? 'text-white' : 'text-slate-400'}`} />
                  <span>{deployExecuted ? 'Deployment Web App Berhasil Dibuat' : 'Tandai Deployment Selesai'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Langkah 5: Salin URL Web App & Uji Koneksi Langsung
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tempelkan URL Web App yang Anda dapatkan setelah proses deployment untuk mengaktifkan sinkronisasi real-time.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 text-xs block">
                  URL Web App Google Apps Script:
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="url"
                    value={gasWebAppUrl}
                    onChange={(e) => setGasWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbxxxxxx.../exec"
                    className="flex-1 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={onPingGAS}
                    disabled={pingLoading || !gasWebAppUrl.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    {pingLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>Uji Koneksi Backend</span>
                  </button>
                </div>
              </div>

              {pingStatus && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5 font-medium animate-in fade-in duration-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{pingStatus}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Langkah Berikutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  success('Seluruh langkah konfigurasi deployment telah selesai!', 'Konfigurasi Lengkap');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Selesai & Siap Digunakan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
