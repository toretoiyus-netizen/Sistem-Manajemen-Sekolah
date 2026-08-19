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
    try {
      const { mapel, kelas, materi, jumlah, jenis, tingkatKesulitan, promptExtra } = req.body;
      const ai = getGeminiClient();

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
    "kunciJawaban": "A" (atau "B"/"C"/"D"/"E" atau teks jawaban jika essay/isian),
    "pembahasan": "Penjelasan rinci mengapa jawaban ini benar...",
    "bobot": 10,
    "tingkatKesulitan": "${tingkatKesulitan || 'Sedang'}",
    "kompetensi": "KD Terkait"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Anda adalah Asisten Penyusun Bank Soal Ujian Sekolah Jawa Barat yang profesional, teliti, dan sesuai standar BSNP/Kurikulum Merdeka.',
        },
      });

      const responseText = response.text || '[]';
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        parsed = [];
      }

      res.json({ success: true, questions: parsed });
    } catch (err: any) {
      console.error('Error generating questions with AI:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal menghasilkan soal dengan AI' });
    }
  });

  // AI Diagnostic & Evaluator (Uses High Thinking for deep analysis)
  app.post('/api/ai/deep-analysis', async (req, res) => {
    try {
      const { testTitle, subject, averageScore, highestScore, lowestScore, passCount, totalStudents, scoreDistribution, difficultTopics } = req.body;
      const ai = getGeminiClient();

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah Pengawas Senior & Konsultan Kurikulum Pendidikan Jawa Barat.',
        },
      });

      res.json({ success: true, analysis: response.text });
    } catch (err: any) {
      console.error('Error deep analysis:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal menganalisis data' });
    }
  });

  // AI Announcement Generator / School Letter
  app.post('/api/ai/compose-announcement', async (req, res) => {
    try {
      const { targetAudience, topic, priority, details } = req.body;
      const ai = getGeminiClient();

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, result: parsed });
    } catch (err: any) {
      console.error('Error drafting announcement:', err);
      res.status(500).json({ success: false, error: err.message });
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
