export interface GasFileItem {
  fileName: string;
  type: 'server' | 'html' | 'json';
  description: string;
  content: string;
}

export function generateAllGasFiles(): GasFileItem[] {
  return [

    {
      fileName: 'Code.gs',
      type: 'server',
      description: 'Entry point Google Apps Script Web App & routing controller',
      content: `// =========================================================================
// SISTEM MANAJEMEN SEKOLAH JAWA BARAT (SMS JABAR)
// Google Apps Script Web App Backend Controller
// =========================================================================

function doGet(e) {
  try {
    var path = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'index';
    var examId = (e && e.parameter && e.parameter.ujianId) ? e.parameter.ujianId : '';
    
    // Support JSON API Ping / Health-Check via GET
    if (e && e.parameter && e.parameter.action) {
      var result = apiDispatcher(e.parameter.action, e.parameter, e.parameter.token || '');
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var fileName = (path === 'cat' || examId) ? 'CAT' : 'Index';
    var template;
    try {
      template = HtmlService.createTemplateFromFile(fileName);
      if (fileName === 'CAT') template.examId = examId;
      return template.evaluate()
        .setTitle('Sistem Manajemen Sekolah Jawa Barat')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (htmlErr) {
      // Fallback HTML page if Index.html / CAT.html is not created yet
      var props = PropertiesService.getScriptProperties();
      var dbId = props.getProperty("DATABASE_ID") || "Belum diinisialisasi (Jalankan initializeDatabase di Database.gs)";
      var statusHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SMS JABAR - Backend API GAS</title>' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<style>body{font-family:system-ui,-apple-system,sans-serif;padding:30px 16px;background:#f8fafc;color:#0f172a;max-width:680px;margin:0 auto;line-height:1.5}' +
        '.card{background:#ffffff;padding:28px;border-radius:16px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);border:1px solid #e2e8f0}' +
        'h2{color:#059669;margin-top:0;font-size:20px;display:flex;align-items:center;gap:8px}' +
        '.badge{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.05em;display:inline-block}' +
        'code{background:#f1f5f9;padding:3px 8px;border-radius:6px;font-size:12px;color:#0f172a;word-break:break-all;font-family:monospace}' +
        '.info-box{background:#f8fafc;padding:14px;border-radius:10px;border-left:4px solid #059669;margin:16px 0}' +
        '</style></head><body>' +
        '<div class="card">' +
        '<h2><span style="font-size:22px">&#10004;</span> Google Apps Script Backend Online</h2>' +
        '<p><span class="badge">API READY</span> Endpoint Web App aktif dan siap melayani permintaan REST / RPC dari aplikasi frontend.</p>' +
        '<div class="info-box">' +
        '<strong>Spreadsheet Database ID:</strong><br><code>' + dbId + '</code>' +
        '</div>' +
        '<p style="font-size:13px;color:#64748b">Aplikasi frontend React terhubung langsung ke URL Web App ini untuk sinkronisasi 29 sheet Google Spreadsheet.</p>' +
        '</div></body></html>';
      return HtmlService.createHtmlOutput(statusHtml)
        .setTitle('Sistem Manajemen Sekolah Jawa Barat - Backend Online')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var rawData = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var parsed = {};
    try {
      parsed = JSON.parse(rawData);
    } catch (pe) {
      parsed = (e && e.parameter) ? e.parameter : {};
    }
    
    var action = parsed.action || '';
    var payload = parsed.payload || parsed;
    var token = parsed.sessionToken || parsed.token || '';
    
    var result = apiDispatcher(action, payload, token);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (e) {
    return '<!-- include ' + filename + ' not found -->';
  }
}

// Global API Dispatcher for frontend RPC calls
function apiDispatcher(action, payload, sessionToken) {
  try {
    if (!action) {
      return { success: false, error: 'Parameter action tidak boleh kosong.' };
    }
    payload = payload || {};
    
    // 1. Session verification for authenticated endpoints
    var publicActions = ['login', 'verifyExamToken', 'submitCATResponseDirect', 'getSystemPublicConfig', 'ping'];
    var userSession = null;
    
    if (action === 'ping') {
      return { success: true, message: 'Google Apps Script Backend SMS JABAR 200 OK', timestamp: new Date().toISOString() };
    }
    
    if (publicActions.indexOf(action) === -1) {
      userSession = verifyUserSession(sessionToken);
      if (!userSession || !userSession.valid) {
        return { success: false, error: 'Sesi login tidak valid atau telah berakhir. Silakan login kembali.' };
      }
    }
    
    // 2. Route action to appropriate Service
    switch (action) {
      // Auth
      case 'login': return handleLogin(payload.username, payload.password);
      case 'changePassword': return handleChangePassword((userSession && userSession.user) ? userSession.user.id : '', payload.oldPassword, payload.newPassword);
      case 'resetStudentPassword': return handleResetStudentPassword((userSession && userSession.user), payload.siswaId);
      
      // Dashboard & Overview
      case 'getDashboardStats': return getDashboardStats(userSession ? userSession.user : null);
      
      // Data Guru
      case 'getGuruList': return getGuruList(userSession ? userSession.user : null, payload);
      case 'saveGuru': return saveGuru(userSession ? userSession.user : null, payload.data || payload);
      case 'deleteGuru': return deleteGuru(userSession ? userSession.user : null, payload.guruId);
      
      // Data Siswa
      case 'getSiswaList': return getSiswaList(userSession ? userSession.user : null, payload);
      case 'saveSiswa': return saveSiswa(userSession ? userSession.user : null, payload.data || payload);
      case 'deleteSiswa': return deleteSiswa(userSession ? userSession.user : null, payload.siswaId);
      
      // Data KBM
      case 'getKBMData': return getKBMData(userSession ? userSession.user : null);
      case 'saveSchedule': return saveKBMSchedule(userSession ? userSession.user : null, payload.data || payload);
      
      // Bank Soal
      case 'getBankSoal': return getBankSoalList(userSession ? userSession.user : null, payload);
      case 'saveSoal': return saveSoal(userSession ? userSession.user : null, payload.data || payload);
      case 'deleteSoal': return deleteSoal(userSession ? userSession.user : null, payload.soalId);
      
      // Ujian & CAT
      case 'getUjianList': return getUjianList(userSession ? userSession.user : null);
      case 'saveUjian': return saveUjian(userSession ? userSession.user : null, payload.data || payload);
      case 'publishUjian': return publishUjian(userSession ? userSession.user : null, payload.ujianId);
      case 'verifyExamToken': return verifyExamTokenAndGetQuestions(payload.nisn, payload.token, payload.ujianId);
      case 'submitExamAnswers': return submitExamAnswers(payload);
      case 'getExamResults': return getExamResults(userSession ? userSession.user : null, payload.ujianId);
      
      // Presensi
      case 'recordPresensi': return recordPresensi(userSession ? userSession.user : null, payload);
      case 'getPresensiRecap': return getPresensiRecap(userSession ? userSession.user : null, payload);
      case 'submitIzinSakit': return submitIzinSakit(userSession ? userSession.user : null, payload);
      
      // Pengumuman
      case 'getPengumuman': return getPengumumanForUser(userSession ? userSession.user : null);
      case 'createPengumuman': return createPengumuman(userSession ? userSession.user : null, payload.data || payload);
      
      // System Config & Role
      case 'getRolesAndPermissions': return getRolesAndPermissions(userSession ? userSession.user : null);
      case 'updateRolePermissions': return updateRolePermissions(userSession ? userSession.user : null, payload.role, payload.permissions);
      case 'getSystemConfig': return getSystemConfig();
      
      default:
        return { success: false, error: 'Aksi API tidak dikenali: ' + action };
    }
  } catch (err) {
    Logger.log('API Error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}`
    },
    {
      fileName: 'Database.gs',
      type: 'server',
      description: 'Inisialisasi otomatis Google Spreadsheet database dan folder Google Drive',
      content: `// =========================================================================
// DATABASE INITIALIZATION & SPREADSHEET MANAGER
// Otomatisasi pembuatan 29 sheet dan struktur folder Google Drive
// =========================================================================

var SHEET_NAMES = [
  "USERS", "ROLES", "PERMISSIONS", "USER_PERMISSIONS", "GURU", "TENDIK",
  "SISWA", "ROMBEL", "PESERTA_ROMBEL", "GURU_WALI", "WALI_KELAS", "MAPEL",
  "KBM", "JAM_PELAJARAN", "BANK_SOAL", "PILIHAN_SOAL", "UJIAN", "PESERTA_UJIAN",
  "TOKEN_UJIAN", "JAWABAN_UJIAN", "NILAI_UJIAN", "PRESENSI", "IZIN_SAKIT",
  "PENGUMUMAN", "TARGET_PENGUMUMAN", "PROFIL", "DOKUMEN", "KONFIGURASI", "TAHUN_PELAJARAN"
];

function initializeDatabase() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  
  try {
    // 1. Buat Root Folder di Google Drive
    var rootFolder = DriveApp.createFolder("DATABASE SEKOLAH");
    var rootFolderId = rootFolder.getId();
    
    // Sub-folder standard
    var folders = ["DATABASE", "SUPER ADMIN", "ADMIN", "KEPALA SEKOLAH", "WAKASEK", "WALI KELAS", "GURU WALI", "GURU MAPEL", "SISWA", "DOKUMEN", "FOTO", "UJIAN", "BANK SOAL"];
    var folderMap = {};
    for (var i = 0; i < folders.length; i++) {
      var sub = rootFolder.createFolder(folders[i]);
      folderMap[folders[i]] = sub.getId();
    }
    
    // Buat sub-folder kelas di dalam folder SISWA
    var siswaFolder = DriveApp.getFolderById(folderMap["SISWA"]);
    siswaFolder.createFolder("KELAS 10");
    siswaFolder.createFolder("KELAS 11");
    siswaFolder.createFolder("KELAS 12");
    
    // 2. Buat Spreadsheet Database Utama di dalam folder DATABASE
    var dbFolder = DriveApp.getFolderById(folderMap["DATABASE"]);
    var ss = SpreadsheetApp.create("DATABASE SISTEM MANAJEMEN SEKOLAH");
    var ssFile = DriveApp.getFileById(ss.getId());
    ssFile.moveTo(dbFolder);
    var spreadsheetId = ss.getId();
    
    // 3. Buat seluruh Sheet dan Header
    setupSheetHeaders(ss);
    
    // 4. Generate Random Temporary Password untuk Super Admin
    var tempPassword = generateSecurePIN(8);
    var hashedPassword = hashPassword(tempPassword);
    
    // 5. Masukkan data Akun Super Admin Pertama
    var userSheet = ss.getSheetByName("USERS");
    if (userSheet) {
      userSheet.appendRow([
        "USR-000001",
        "superadmin",
        hashedPassword,
        "SUPER ADMIN",
        "Super Administrator Jawa Barat",
        "superadmin@disdik.jabarprov.go.id",
        "081100000001",
        "Aktif",
        new Date().toISOString(),
        true, // WAJIB GANTI PASSWORD
        new Date().toISOString()
      ]);
    }
    
    // 6. Simpan konfigurasi ke PropertiesService
    var props = PropertiesService.getScriptProperties();
    props.setProperties({
      "DATABASE_ID": spreadsheetId,
      "ROOT_FOLDER_ID": rootFolderId,
      "CONFIG_VERSION": "1.0.0-JABAR",
      "SCHOOL_NAME": "SISTEM MANAJEMEN SEKOLAH JAWA BARAT"
    });
    
    Logger.log("==========================================================");
    Logger.log("DATABASE BERHASIL DIINISIALISASI!");
    Logger.log("Spreadsheet ID: " + spreadsheetId);
    Logger.log("Root Folder ID: " + rootFolderId);
    Logger.log("AKUN SUPER ADMIN PERTAMA:");
    Logger.log("Username: superadmin");
    Logger.log("Password Sementara: " + tempPassword);
    Logger.log("(Catat password ini! Anda wajib mengganti password saat login pertama)");
    Logger.log("==========================================================");
    
    return {
      success: true,
      spreadsheetId: spreadsheetId,
      rootFolderId: rootFolderId,
      tempSuperAdminPassword: tempPassword
    };
  } finally {
    lock.releaseLock();
  }
}

function setupSheetHeaders(ss) {
  if (!ss) {
    try {
      ss = getDatabaseSpreadsheet();
    } catch (e) {
      Logger.log("Info: setupSheetHeaders dijalankan tanpa objek Spreadsheet aktif.");
      return;
    }
  }
  if (!ss) return;
  
  var headersMap = {
    "USERS": ["ID", "Username", "PasswordHash", "Role", "Nama", "Email", "NomorHP", "Status", "LastLogin", "MustChangePassword", "CreatedAt"],
    "GURU": ["ID", "NIP", "NIK", "Nama", "Gelar", "JenisKelamin", "TempatLahir", "TanggalLahir", "Alamat", "NomorHP", "Email", "MapelUtama", "StatusKepegawaian", "TugasTambahan", "Role", "FotoURL", "Status"],
    "SISWA": ["ID", "NIS", "NISN", "NIK", "NamaLengkap", "JenisKelamin", "TempatLahir", "TanggalLahir", "Alamat", "NomorHP", "Email", "NamaOrtu", "NamaIbu", "NomorHPOrtu", "Kelas", "Rombel", "GuruWaliID", "WaliKelasID", "FotoURL", "Status"],
    "ROMBEL": ["ID", "NamaRombel", "Tingkat", "Jurusan", "TahunPelajaran", "WaliKelasID", "Status"],
    "MAPEL": ["ID", "KodeMapel", "NamaMapel", "Kelompok", "Status"],
    "KBM": ["ID", "Hari", "JamKe", "JamMulai", "JamSelesai", "RombelID", "MapelID", "GuruID", "Ruang", "Keterangan"],
    "BANK_SOAL": ["ID", "MapelID", "Kelas", "Materi", "Kompetensi", "JenisSoal", "TingkatKesulitan", "Pertanyaan", "PilihanA", "PilihanB", "PilihanC", "PilihanD", "PilihanE", "KunciJawaban", "Pembahasan", "Bobot", "PembuatID", "Status"],
    "UJIAN": ["ID", "NamaUjian", "Jenis", "MapelID", "Kelas", "RombelIDs", "PembuatID", "DurasiMenit", "TglMulai", "TglSelesai", "SoalIDs", "NilaiMinimum", "AcakSoal", "AcakJawaban", "TokenRequired", "CurrentToken", "Status"],
    "PRESENSI": ["ID", "Tanggal", "SiswaID", "NISN", "NamaSiswa", "RombelID", "Status", "Metode", "JamMasuk", "LokasiData", "FotoSelfieURL", "Keterangan"],
    "PENGUMUMAN": ["ID", "Judul", "Isi", "LampiranURL", "PembuatID", "Target", "TglMulai", "TglSelesai", "Status", "Prioritas"]
  };
  
  for (var i = 0; i < SHEET_NAMES.length; i++) {
    var name = SHEET_NAMES[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    sheet.clear();
    var headers = headersMap[name] || ["ID", "DataJSON", "CreatedAt", "UpdatedAt"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#00875A").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  
  // Hapus Sheet1 default jika ada
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }
}

function getDatabaseSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var dbId = props.getProperty("DATABASE_ID");
  if (!dbId) {
    throw new Error("Database belum diinisialisasi. Silakan jalankan initializeDatabase() terlebih dahulu.");
  }
  return SpreadsheetApp.openById(dbId);
}`
    },
    {
      fileName: 'Auth.gs',
      type: 'server',
      description: 'Layanan autentikasi, session hashing, dan keamanan hak akses',
      content: `// =========================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// =========================================================================

function handleLogin(username, password) {
  if (!username || password === undefined || password === null || String(password).trim() === '') {
    return { success: false, error: 'Username dan Password wajib diisi.' };
  }
  
  var ss = getDatabaseSpreadsheet();
  var sheet = ss.getSheetByName("USERS");
  if (!sheet) {
    return { success: false, error: 'Sheet USERS belum tersedia. Jalankan initializeDatabase().' };
  }
  
  var data = sheet.getDataRange().getValues();
  var cleanUsername = String(username).trim();
  var inputHash = hashPassword(String(password));
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var dbUsername = String(row[1]).trim();
    var dbPasswordHash = String(row[2]);
    var status = row[7];
    
    if (dbUsername.toLowerCase() === cleanUsername.toLowerCase()) {
      if (status !== 'Aktif') {
        return { success: false, error: 'Akun Anda sedang dinonaktifkan. Hubungi Administrator.' };
      }
      
      if (dbPasswordHash !== inputHash) {
        return { success: false, error: 'Username atau Password salah.' };
      }
      
      // Generate Session Token
      var sessionToken = generateSecureToken(32);
      var user = {
        id: row[0],
        username: row[1],
        role: row[3],
        nama: row[4],
        email: row[5],
        nomorHp: row[6],
        mustChangePassword: row[9] === true || String(row[9]).toLowerCase() === 'true'
      };
      
      // Simpan session di CacheService (berlaku 6 jam)
      var cache = CacheService.getScriptCache();
      cache.put("SESSION_" + sessionToken, JSON.stringify(user), 21600);
      
      // Update last login di sheet
      sheet.getRange(i + 1, 9).setValue(new Date().toISOString());
      
      return {
        success: true,
        sessionToken: sessionToken,
        user: user
      };
    }
  }
  
  return { success: false, error: 'Akun tidak ditemukan.' };
}

function verifyUserSession(sessionToken) {
  if (!sessionToken) return { valid: false };
  var cache = CacheService.getScriptCache();
  var sessionStr = cache.get("SESSION_" + sessionToken);
  if (!sessionStr) return { valid: false };
  
  try {
    var user = JSON.parse(sessionStr);
    return { valid: true, user: user };
  } catch (e) {
    return { valid: false };
  }
}

function hashPassword(password) {
  if (password === undefined || password === null) {
    password = '';
  }
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password), Utilities.Charset.UTF_8);
  var hashStr = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length == 1) byteHex = "0" + byteHex;
    hashStr += byteHex;
  }
  return hashStr;
}

function generateSecurePIN(len) {
  var length = len || 8;
  var chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  var res = "";
  for (var i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function generateSecureToken(len) {
  var length = len || 32;
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var res = "";
  for (var i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}`
    },
    {
      fileName: 'PermissionService.gs',
      type: 'server',
      description: 'Pemeriksaan hak akses server-side granular dan validasi kepemilikan data',
      content: `// =========================================================================
// PERMISSION & ROLE ACCESS CONTROL
// =========================================================================

function checkPermission(user, permissionCode) {
  if (!user) return false;
  if (user.role === 'SUPER ADMIN') return true;
  
  var rolePermissions = getRolePermissionsMap();
  var allowed = rolePermissions[user.role] || [];
  return allowed.indexOf(permissionCode) !== -1;
}

function checkOwnership(user, dataType, dataId) {
  if (!user) return false;
  if (user.role === 'SUPER ADMIN' || user.role === 'ADMIN' || user.role === 'KEPALA SEKOLAH') return true;
  
  try {
    var ss = getDatabaseSpreadsheet();
    if (dataType === 'siswa') {
      var sheet = ss.getSheetByName("SISWA");
      if (!sheet) return false;
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === dataId) {
          var waliKelasId = data[i][17];
          var guruWaliId = data[i][16];
          if (user.role === 'WALI KELAS' && user.id === waliKelasId) return true;
          if (user.role === 'GURU WALI' && user.id === guruWaliId) return true;
          break;
        }
      }
      return false;
    }
  } catch (e) {
    return false;
  }
  
  return true;
}

function getRolePermissionsMap() {
  return {
    "SUPER ADMIN": ["*"],
    "ADMIN": ["dashboard.view", "guru.view", "guru.create", "guru.edit", "guru.delete", "siswa.view", "siswa.create", "siswa.edit", "siswa.delete", "kbm.view", "kbm.create", "presensi.view", "pengumuman.view", "pengumuman.create"],
    "KEPALA SEKOLAH": ["dashboard.view", "guru.view", "siswa.view", "kbm.view", "ujian.result", "presensi.view", "pengumuman.view"],
    "WAKASEK": ["dashboard.view", "guru.view", "siswa.view", "kbm.view", "kbm.create", "kbm.edit", "ujian.view", "ujian.create", "ujian.publish", "presensi.view"],
    "WALI KELAS": ["dashboard.view", "siswa.view", "kbm.view", "presensi.view", "presensi.manage", "akun.reset_password", "pengumuman.view"],
    "GURU WALI": ["dashboard.view", "siswa.view", "presensi.view", "akun.reset_password", "pengumuman.view"],
    "GURU MAPEL": ["dashboard.view", "kbm.view", "banksoal.view", "banksoal.create", "banksoal.edit", "ujian.view", "ujian.create", "ujian.publish", "ujian.result"],
    "SISWA": ["dashboard.view", "kbm.view", "ujian.view", "presensi.view", "pengumuman.view"]
  };
}`
    },
    {
      fileName: 'UjianService.gs',
      type: 'server',
      description: 'Modul manajemen ujian CAT, pembuatan token acak, autosave, dan penilaian otomatis',
      content: `// =========================================================================
// UJIAN & COMPUTER ASSISTED TEST (CAT) ENGINE
// =========================================================================

function generateExamToken(prefix) {
  var pref = prefix || 'JBR';
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pref + '-' + code;
}

function verifyExamTokenAndGetQuestions(nisn, token, ujianId) {
  try {
    var ss = getDatabaseSpreadsheet();
    var sheet = ss.getSheetByName("UJIAN");
    if (!sheet) return { success: false, error: 'Sheet UJIAN belum tersedia.' };
    
    var data = sheet.getDataRange().getValues();
    var targetExam = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === ujianId || String(data[i][15]).toUpperCase() === String(token || '').toUpperCase()) {
        var rawSoal = "[]";
        try { rawSoal = JSON.parse(data[i][10] || "[]"); } catch (e) { rawSoal = []; }
        targetExam = {
          id: data[i][0],
          namaUjian: data[i][1],
          jenis: data[i][2],
          durasiMenit: data[i][7],
          soalIds: rawSoal,
          acakSoal: data[i][12],
          acakJawaban: data[i][13],
          status: data[i][16]
        };
        break;
      }
    }
    
    if (!targetExam) {
      return { success: false, error: 'Token Ujian tidak valid atau ujian tidak ditemukan.' };
    }
    
    if (targetExam.status !== 'Published') {
      return { success: false, error: 'Ujian ini belum dipublikasikan atau sudah ditutup.' };
    }
    
    // Ambil butir soal
    var soalSheet = ss.getSheetByName("BANK_SOAL");
    var questions = [];
    if (soalSheet) {
      var soalData = soalSheet.getDataRange().getValues();
      for (var j = 1; j < soalData.length; j++) {
        if (targetExam.soalIds.indexOf(soalData[j][0]) !== -1) {
          questions.push({
            id: soalData[j][0],
            jenisSoal: soalData[j][5],
            pertanyaan: soalData[j][7],
            pilihanA: soalData[j][8],
            pilihanB: soalData[j][9],
            pilihanC: soalData[j][10],
            pilihanD: soalData[j][11],
            pilihanE: soalData[j][12],
            bobot: soalData[j][15]
          });
        }
      }
    }
    
    return {
      success: true,
      exam: targetExam,
      questions: questions,
      serverTime: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}`
    },
    {
      fileName: 'PresensiService.gs',
      type: 'server',
      description: 'Pencatatan presensi siswa via GPS, Selfie, QR, dan RFID',
      content: `// =========================================================================
// PRESENSI SISWA SERVICE (GPS, SELFIE, QR CODE, RFID)
// =========================================================================

function recordPresensi(user, payload) {
  if (!user || !user.id) {
    return { success: false, error: 'Sesi pengguna tidak valid untuk presensi.' };
  }
  payload = payload || {};
  
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  
  try {
    var ss = getDatabaseSpreadsheet();
    var sheet = ss.getSheetByName("PRESENSI");
    if (!sheet) {
      return { success: false, error: 'Sheet PRESENSI belum tersedia. Jalankan initializeDatabase().' };
    }
    
    var presensiId = "PRE-" + Math.floor(100000 + Math.random() * 900000);
    var todayStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    var jamMasuk = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm:ss") + " WIB";
    
    sheet.appendRow([
      presensiId,
      todayStr,
      user.id || '',
      user.username || '',
      user.nama || '',
      payload.rombelId || "X MIPA 1",
      payload.status || "Hadir",
      payload.metode || "GPS",
      jamMasuk,
      JSON.stringify(payload.lokasi || {}),
      payload.fotoSelfieUrl || "",
      payload.keterangan || "Presensi Mandiri"
    ]);
    
    return {
      success: true,
      presensiId: presensiId,
      jamMasuk: jamMasuk,
      message: "Presensi berhasil dicatat pada " + jamMasuk
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}`
    },
    {
      fileName: 'Index.html',
      type: 'html',
      description: 'Template HTML Utama untuk Google Apps Script Web App (Login SSO & Portal)',
      content: `<!DOCTYPE html>
<html lang="id">
<head>
  <base target="_top">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sistem Manajemen Sekolah Jawa Barat</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    body {
      background-color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 1rem;
    }
    #login-section {
      width: 100%;
      max-width: 900px;
    }
    .login-container-box {
      background: #ffffff;
      border-radius: 1.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-wrap: wrap;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .login-left-side {
      flex: 1 1 350px;
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .login-right-side {
      flex: 1 1 350px;
      background: linear-gradient(135deg, #0b3c6d 0%, #0d47a1 50%, #01579b 100%);
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .logo-left-img {
      max-height: 70px;
      margin-bottom: 0.75rem;
    }
    .illustration-right-img {
      max-width: 260px;
      margin-bottom: 1.5rem;
    }
    .btn-login-custom {
      background: linear-gradient(to right, #00875a, #006644);
      color: #ffffff;
      font-weight: 700;
      letter-spacing: 0.05em;
      border-radius: 0.75rem;
      border: none;
      transition: all 0.2s ease;
    }
    .btn-login-custom:hover {
      background: linear-gradient(to right, #006644, #004d33);
      color: #ffffff;
    }
    .form-control-custom {
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
    }
    .form-control-custom:focus {
      background-color: #ffffff;
      border-color: #00875a;
      box-shadow: 0 0 0 0.25rem rgba(0, 135, 90, 0.15);
    }
  </style>
</head>
<body>
  <!-- LOGIN SECTION -->
  <section id="login-section">
    <div class="login-container-box">
      <div class="login-left-side">
        <div class="text-center mb-3">
          <img
            class="logo-left-img"
            src="https://deskdik.jabarprov.go.id/assets/img/new-disdikjabar.png"
            onerror="
              this.src =
                'https://placehold.co/200x80/ffffff/0a3f70?text=Disdik+Jabar'
            "
            alt="Logo Disdik Jabar"
          />
          <h5 class="fw-bold text-dark mb-1" style="font-size: 18px">
            Sistem Manajemen Sekolah Jawa Barat
          </h5>
          <p class="text-primary small fw-bold text-uppercase mb-4">
           Cabangg Dinas Pendidikan Wilayah XI
          </p>
        </div>

        <form id="form-login" onsubmit="handleLogin(event)">
          <div class="mb-3">
            <label class="form-label text-dark fw-bold small mb-1"
              >NPSN / Username</label
            >
            <input
              type="text"
              class="form-control form-control-custom"
              id="username"
              required
              placeholder="Masukkan NIP/NISN/Username"
            />
          </div>

          <div class="mb-4">
            <label class="form-label text-dark fw-bold small mb-1"
              >Password</label
            >
            <div class="input-group">
              <input
                type="password"
                class="form-control form-control-custom"
                id="password"
                required
                placeholder="Masukkan Password"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                onclick="togglePasswordVisibility()"
              >
                <i class="bi bi-eye-slash" id="toggle-pwd-icon"></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-login-custom w-100 text-uppercase py-3 mb-3"
          >
            Sign In
          </button>
        </form>
      </div>

      <div class="login-right-side text-center text-white">
        <img
          class="illustration-right-img"
          src="https://deskdik.jabarprov.go.id/assets/img/vector-sso.png"
          onerror="
            this.src =
              'https://placehold.co/380x300/1e62d0/ffffff?text=Disdik+SSO+Illustration'
          "
          alt="SSO Vector"
        />
        <h5 class="fw-bold mb-1">Cabang Dinas Pendidikan Wilayah XI</h5>
        <p class="mb-0 text-white-50 fw-bold">Provinsi Jawa Barat</p>
      </div>
    </div>
  </section>

  <script>
    function togglePasswordVisibility() {
      var pwdInput = document.getElementById('password');
      var icon = document.getElementById('toggle-pwd-icon');
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        icon.className = 'bi bi-eye';
      } else {
        pwdInput.type = 'password';
        icon.className = 'bi bi-eye-slash';
      }
    }

    function handleLogin(e) {
      e.preventDefault();
      var u = document.getElementById('username').value;
      var p = document.getElementById('password').value;
      alert('Memproses login untuk: ' + u);
    }
  </script>
</body>
</html>`
    },
    {
      fileName: 'CAT.html',
      type: 'html',
      description: 'Template Portal Ujian Berbasis Komputer (CAT) Standalone untuk Siswa',
      content: `<!DOCTYPE html>
<html lang="id">
<head>
  <base target="_top">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Ujian CAT - Sistem Manajemen Sekolah</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-4">
    <h2 class="text-lg font-bold text-emerald-400">Portal Ujian CAT</h2>
    <p class="text-xs text-slate-400">Masukkan Token Ujian Resmi dari Pengawas</p>
    <input type="text" placeholder="Contoh: JBR-ABCD" class="w-full text-center tracking-widest text-lg font-mono font-bold bg-slate-900 border border-slate-600 rounded-xl p-3 text-white uppercase focus:ring-2 focus:ring-emerald-500" />
    <button class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-sm rounded-xl transition-all">Mulai Ujian</button>
  </div>
</body>
</html>`
    },
    {
      fileName: 'appsscript.json',
      type: 'json',
      description: 'Manifest project Google Apps Script dan konfigurasi Web App',
      content: `{
  "timeZone": "Asia/Jakarta",
  "dependencies": {},
  "webapp": {
    "access": "ANYONE",
    "executeAs": "USER_DEPLOYING"
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.scriptapp"
  ]
}`
    }
  ];
}

export const ALL_GAS_FILES = generateAllGasFiles().map((f) => ({
  name: f.fileName,
  content: f.content,
  description: f.description,
  type: f.type,
}));

