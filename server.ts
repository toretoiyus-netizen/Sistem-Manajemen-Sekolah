import express from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper: Call Gemini with exponential backoff on 503 / high-demand / transient errors
async function callGeminiWithRetry(params: {
  contents: any;
  config?: any;
  model?: string;
  maxRetries?: number;
}) {
  const ai = getGeminiClient();
  const model = params.model || 'gemini-3.7-flash';
  const maxRetries = params.maxRetries ?? 2;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 'UNAVAILABLE' ||
        err?.status === 503 ||
        err?.code === 503 ||
        err?.status === 429 ||
        err?.code === 429 ||
        (err?.message && (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('overloaded') || err.message.includes('rate')));

      if (isTransient && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 800 + Math.random() * 400;
        console.warn(`[Gemini AI] Model ${model} is experiencing high demand (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delayMs)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      break;
    }
  }

  throw lastError;
}

// Fallback Generators for High Availability
function generateFallbackDashboardSummary({
  schoolName,
  academicYear,
  semester,
  totalSiswa,
  totalGuru,
  attendanceRate,
  totalQuestions,
  totalExams,
}: any) {
  const rate = attendanceRate ?? 94;
  const isOptimal = rate >= 90;

  return {
    statusKesehatanSekolah: isOptimal ? 'Sangat Baik' : 'Perlu Perhatian',
    skorEfektivitas: Math.min(98, Math.max(75, Math.round(rate * 0.95 + 6))),
    ringkasanEksekutif: `Operasional akademik ${schoolName || 'SMAN 1 Kota Bandung'} pada Tahun Pelajaran ${academicYear || '2024/2025'} (Semester ${semester || 'Ganjil'}) berjalan dalam status ${isOptimal ? 'stabil dan kondusif' : 'memerlukan supervisi presensi'} dengan tingkat partisipasi ${rate}%. Tersedia ${totalQuestions || 0} butir bank soal dan ${totalExams || 0} paket asesmen aktif yang dikelola oleh ${totalGuru || 0} guru & tenaga kependidikan.`,
    trenAbsensi: `Tingkat kehadiran tercatat ${rate}% hari ini. Disiplin presensi terpantau konsisten dengan mayoritas pencatatan tepat waktu melalui validasi radius GPS dan QR Code Presensi.`,
    peringatanDini: [
      rate < 90
        ? `Tingkat kehadiran hari ini (${rate}%) berada di bawah target optimal 90%, perlu verifikasi alpa oleh Wali Kelas.`
        : `Pertahankan stabilitas presensi dan lakukan verifikasi berkala terhadap siswa dengan surat izin/sakit.`,
      `Pastikan distribusi kisi-kisi dan rubrik penilaian untuk ${totalExams || 0} paket asesmen CAT telah tersinkronisasi ke portal siswa.`,
    ],
    rekomendasiTindakan: [
      'Wakasek Kurikulum: Pantau pemetaan beban kerja 24 jam tatap muka guru dan jadwal pelaksanaan asesmen CAT.',
      'Wali Kelas: Lakukan koordinasi dan pemanggilan orang tua untuk siswa dengan akumulasi absensi alpa.',
      'Tim IT / Admin: Lakukan pencadangan (backup) struktur data Spreadsheet ke Google Drive secara berkala.',
    ],
    pemberitahuanKunci: 'Prioritas Disdik Jabar: Percepatan Transformasi Digital, Disiplin Positif, dan Sekolah Ramah Anak.',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Sistem Manajemen Sekolah Jawa Barat (SMS JABAR) API',
      timestamp: new Date().toISOString(),
    });
  });

  // AI Bank Soal Generator (West Java Curriculum)
  app.post('/api/ai/generate-questions', async (req, res) => {
    const { mapel, kelas, materi, jumlah, jenis, tingkatKesulitan, promptExtra } = req.body;
    try {
      const prompt = `Anda adalah pakar kurikulum dan guru ahli di Dinas Pendidikan Provinsi Jawa Barat.
Buatkan ${jumlah || 3} butir soal ${jenis || 'Pilihan Ganda'} untuk:
- Mata Pelajaran: ${mapel || 'Bahasa Sunda / Umum'}
- Tingkat/Kelas: ${kelas || 'Kelas 10 SMA/SMK'}
- Materi: ${materi || 'Kompetensi Dasar Standar Jabar'}
- Tingkat Kesulitan: ${tingkatKesulitan || 'Sedang'}
- Instruksi Khusus: ${promptExtra || 'Gunakan konteks kearifan lokal Jawa Barat atau standar akademik nasional jika mapel umum.'}

Kembalikan dalam format JSON murni dengan schema array soal:
[
  {
    "pertanyaan": "Teks soal pertanyaan...",
    "pilihanA": "Opsi A",
    "pilihanB": "Opsi B",
    "pilihanC": "Opsi C",
    "pilihanD": "Opsi D",
    "pilihanE": "Opsi E",
    "kunciJawaban": "A",
    "pembahasan": "Penjelasan rinci mengapa jawaban ini benar...",
    "bobot": 10,
    "tingkatKesulitan": "${tingkatKesulitan || 'Sedang'}",
    "kompetensi": "KD Terkait"
  }
]`;

      const response = await callGeminiWithRetry({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Anda adalah Asisten Penyusun Bank Soal Ujian Sekolah Jawa Barat yang profesional, teliti, dan sesuai standar BSNP/Kurikulum Merdeka.',
        },
      });

      const responseText = response.text || '[]';
      let parsed = JSON.parse(responseText);
      res.json({ success: true, questions: parsed });
    } catch (err: any) {
      console.warn('AI Question generator fallback triggered:', err.message);
      // Resilient fallback question set
      const count = Number(jumlah) || 3;
      const fallbackQuestions = Array.from({ length: count }, (_, i) => ({
        pertanyaan: `[Soal Terstandar ${i + 1}] Berdasarkan materi ${materi || 'Kurikulum Merdeka'}, manakah pernyataan berikut yang paling tepat sesuai dengan prinsip pembelajaran aktif di Jawa Barat?`,
        pilihanA: 'Menerapkan integrasi profil pelajar Pancasila dan kearifan budaya lokal',
        pilihanB: 'Hanya berfokus pada hafalan teori tanpa studi kasus kontekstual',
        pilihanC: 'Mengabaikan evaluasi formatif berkelanjutan',
        pilihanD: 'Membatasi kolaborasi antar peserta didik di kelas',
        pilihanE: 'Mengabaikan refleksi pembelajaran di akhir sesi',
        kunciJawaban: 'A',
        pembahasan: 'Pendekatan Kurikulum Merdeka di Jawa Barat mengedepankan integrasi nilai Profil Pelajar Pancasila yang dikombinasikan dengan pemahaman budaya lokal serta pembelajaran berbasis inkuiri.',
        bobot: 10,
        tingkatKesulitan: tingkatKesulitan || 'Sedang',
        kompetensi: `Kompetensi Dasar - ${materi || mapel || 'Umum'}`,
      }));

      res.json({ success: true, questions: fallbackQuestions, isFallback: true });
    }
  });

  // AI Diagnostic & Evaluator (Uses Deep Analysis)
  app.post('/api/ai/deep-analysis', async (req, res) => {
    const { testTitle, subject, averageScore, highestScore, lowestScore, passCount, totalStudents, scoreDistribution, difficultTopics } = req.body;
    try {
      const prompt = `Lakukan analisis mendalam (Deep Diagnostic Analytics) terhadap hasil asesmen/ujian berikut untuk dilaporkan kepada Kepala Sekolah & Pengawas Pembina Jawa Barat:
- Ujian: ${testTitle}
- Mata Pelajaran: ${subject}
- Total Peserta: ${totalStudents} siswa
- Rata-rata Nilai: ${averageScore}
- Nilai Tertinggi: ${highestScore} | Terendah: ${lowestScore}
- Tingkat Kelulusan: ${passCount}/${totalStudents} siswa (${Math.round((passCount / (totalStudents || 1)) * 100)}%)
- Topik/Materi Sulit: ${difficultTopics || 'Analisis teks dan pemecahan masalah'}
- Data Distribusi: ${JSON.stringify(scoreDistribution || {})}

Berikan evaluasi pedagogik terstruktur:
1. Diagnosis Penguasaan Materi (Kekuatan & Kelemahan Siswa)
2. Rekomendasi Remedial & Pengayaan Spesifik
3. Saran Peningkatan Mutu KBM Guru Mapel
4. Ringkasan Eksekutif untuk Kepala Sekolah / Wakasek Kurikulum`;

      const response = await callGeminiWithRetry({
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah Pengawas Senior & Konsultan Kurikulum Pendidikan Jawa Barat.',
        },
      });

      res.json({ success: true, analysis: response.text });
    } catch (err: any) {
      console.warn('AI Deep Analysis fallback triggered:', err.message);
      const fallbackAnalysis = `### Laporan Diagnostik Hasil Asesmen: ${testTitle || 'Ujian Semester'}
**Mata Pelajaran:** ${subject || 'Akademik Umum'} | **Total Peserta:** ${totalStudents || 0} Siswa | **Rata-rata:** ${averageScore || 80}

#### 1. Diagnosis Penguasaan Materi
- Tingkat kelulusan mencapai ${Math.round(((passCount || 0) / (totalStudents || 1)) * 100)}% (${passCount || 0} dari ${totalStudents || 0} siswa).
- Siswa menunjukkan pemahaman yang kuat pada konsep dasar faktual, namun memerlukan penguatan pada kemampuan penalaran analitis (HOTS).

#### 2. Rekomendasi Remedial & Pengayaan
- **Siswa Remedial (< KKM):** Berikan penugasan berbasis bimbingan sebaya (*peer tutoring*) dengan fokus pada topik ${difficultTopics || 'studi kasus'}.
- **Siswa Pengayaan:** Berikan proyek pengayaan terapan berbasis kearifan lokal Jawa Barat.

#### 3. Rekomendasi untuk Guru Mapel & Kurikulum
- Tingkatkan variasi stimulasi asesmen berbasis numerasi dan literasi digital CAT.
- Sinkronkan bank soal secara berkala dengan kisi-kisi standar Disdik Provinsi Jawa Barat.`;

      res.json({ success: true, analysis: fallbackAnalysis, isFallback: true });
    }
  });

  // AI Announcement Generator / School Letter
  app.post('/api/ai/compose-announcement', async (req, res) => {
    const { targetAudience, topic, priority, details } = req.body;
    try {
      const prompt = `Buatkan draf Pengumuman Resmi Sekolah Jawa Barat untuk target: ${targetAudience}
Topik: ${topic}
Prioritas: ${priority}
Poin-poin penting: ${details}

Format keluaran JSON:
{
  "judul": "Judul resmi yang jelas dan berwibawa",
  "isi": "Isi pengumuman lengkap dengan salam pembuka, rincian, dan penutup formal ramah tamah khas Jawa Barat",
  "kategori": "Akademik / Kedisiplinan / Libur / Kegiatan",
  "rekomendasiTindakan": "Apa yang harus segera dilakukan penerima"
}`;

      const response = await callGeminiWithRetry({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, result: parsed });
    } catch (err: any) {
      console.warn('AI Announcement generator fallback triggered:', err.message);
      const fallbackResult = {
        judul: `Pengumuman Resmi: ${topic || 'Agenda Sekolah'}`,
        isi: `Sampurasun,\n\nDiberitahukan kepada seluruh ${targetAudience || 'Warga Sekolah'}, sehubungan dengan ${topic || 'agenda kegiatan pembelajaran'}, berikut rincian informasi penting yang perlu diperhatikan:\n\n${details || 'Mohon seluruh pihak mematuhi tata tertib dan jadwal yang telah ditetapkan oleh pihak sekolah.'}\n\nDemikian pemberitahuan ini disampaikan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.\n\nHatur nuhun,\nKepala Sekolah & Manajemen SMS Jabar`,
        kategori: 'Akademik',
        rekomendasiTindakan: 'Harap membaca dan melaksanakan seluruh poin pengumuman tepat waktu.',
      };
      res.json({ success: true, result: fallbackResult, isFallback: true });
    }
  });

  // AI Smart School Dashboard Summary (Ringkasan Cerdas)
  app.post('/api/ai/dashboard-summary', async (req, res) => {
    const {
      schoolName,
      totalSiswa,
      totalGuru,
      attendanceRate,
      totalExams,
      totalQuestions,
      recentAnnouncements,
      academicYear,
      semester,
    } = req.body;

    try {
      const prompt = `Anda adalah Asisten Analitik AI Cerdas Dinas Pendidikan Jawa Barat.
Berikan ringkasan eksekutif cerdas (Smart Insight Dashboard) berdasarkan parameter real-time data sekolah berikut:
- Nama Sekolah: ${schoolName || 'SMAN 1 Kota Bandung'}
- Tahun Pelajaran: ${academicYear || '2024/2025'} (Semester ${semester || 'Ganjil'})
- Total Siswa: ${totalSiswa || 0} orang
- Total Guru & Tendik: ${totalGuru || 0} orang
- Tingkat Kehadiran Hari Ini: ${attendanceRate || 0}%
- Jumlah Bank Soal Tersedia: ${totalQuestions || 0} butir
- Jumlah Paket Ujian Aktif: ${totalExams || 0} ujian
- Pengumuman Terbaru: ${JSON.stringify(recentAnnouncements || [])}

Buatkan evaluasi ringkas dan actionable dalam format JSON dengan skema persis berikut:
{
  "statusKesehatanSekolah": "Sangat Baik" (atau "Baik" / "Perlu Perhatian" / "Waspada"),
  "skorEfektivitas": 92,
  "ringkasanEksekutif": "Paragraf ringkas (2-3 kalimat) mengenai kondisi operasional dan akademik sekolah saat ini...",
  "trenAbsensi": "Analisis tren presensi dan tingkat kedisiplinan guru & siswa...",
  "peringatanDini": [
    "Poin peringatan 1 jika ada risiko (contoh: persentase absensi alfa, ketersediaan soal ujian, dsb)",
    "Poin peringatan 2..."
  ],
  "rekomendasiTindakan": [
    "Tindakan strategis 1 untuk Kepala Sekolah/Wakasek Kurikulum",
    "Tindakan strategis 2 untuk Guru Mapel & Wali Kelas",
    "Tindakan strategis 3 untuk Tim IT/Admin"
  ],
  "pemberitahuanKunci": "Catatan singkat motivasional / kebijakan prioritas Disdik Jabar minggu ini"
}`;

      const response = await callGeminiWithRetry({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Anda adalah Pengawas & Konsultan Transformasi Digital Pendidikan Jawa Barat yang berfokus pada data-driven decision making.',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, summary: parsed });
    } catch (err: any) {
      console.warn('Dashboard summary AI experiencing spike/error, serving intelligent analytical fallback:', err.message);
      const fallback = generateFallbackDashboardSummary({
        schoolName,
        academicYear,
        semester,
        totalSiswa,
        totalGuru,
        attendanceRate,
        totalQuestions,
        totalExams,
      });
      res.json({ success: true, summary: fallback, isFallback: true });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SMS JABAR] Server aktif pada http://localhost:${PORT}`);
  });
}

startServer();

