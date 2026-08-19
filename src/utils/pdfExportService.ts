import { jsPDF } from 'jspdf';
import { PortofolioSiswaRecord, Ujian } from '../types';

export function exportSingleStudentExamPDF(
  record: PortofolioSiswaRecord,
  additionalInfo?: {
    rombel?: string;
    guruNama?: string;
    sekolahNama?: string;
    durasiMenit?: number;
    tokenUjian?: string;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.getPageWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // 1. KOP SURAT PEMPROV JABAR
  doc.setFillColor(11, 60, 109); // Disdik Blue
  doc.rect(margin, 12, 12, 12, 'F');
  doc.setFillColor(0, 135, 90); // Jabar Green
  doc.circle(margin + 6, 18, 3, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH DAERAH PROVINSI JAWA BARAT', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(13);
  doc.text('DINAS PENDIDIKAN', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text('CABANG DINAS PENDIDIKAN WILAYAH XI', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${additionalInfo?.sekolahNama || 'SMA NEGERI 1 PROVINSI JAWA BARAT'} | SISTEM MANAJEMEN SEKOLAH (SMS JABAR)`,
    pageWidth / 2,
    29,
    { align: 'center' }
  );

  // Decorative Lines for Kop Surat
  doc.setDrawColor(11, 60, 109);
  doc.setLineWidth(0.8);
  doc.line(margin, 32, pageWidth - margin, 32);
  doc.setDrawColor(0, 135, 90);
  doc.setLineWidth(0.3);
  doc.line(margin, 33.2, pageWidth - margin, 33.2);

  // 2. DOCUMENT TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 60, 109);
  doc.text('LEMBAR LAPORAN HASIL ASESMEN UJIAN (CAT)', pageWidth / 2, 41, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Dokumen Resmi Penilaian Hasil Belajar Siswa Berbasis Komputer', pageWidth / 2, 45.5, { align: 'center' });

  // 3. STUDENT & EXAM IDENTITY BOX
  const boxTop = 50;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, boxTop, contentWidth, 38, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Left Column
  const col1Left = margin + 5;
  const col1Val = margin + 38;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Peserta', col1Left, boxTop + 7);
  doc.text('NISN', col1Left, boxTop + 14);
  doc.text('Kelas / Rombel', col1Left, boxTop + 21);
  doc.text('Status Ujian', col1Left, boxTop + 28);

  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${record.namaSiswa || '-'}`, col1Val, boxTop + 7);
  doc.text(`:  ${record.nisn || '-'}`, col1Val, boxTop + 14);
  doc.text(`:  ${additionalInfo?.rombel || 'X MIPA 1'}`, col1Val, boxTop + 21);
  doc.text(':  Selesai Dikirim (Verified)', col1Val, boxTop + 28);

  // Right Column
  const col2Left = margin + contentWidth / 2 + 5;
  const col2Val = col2Left + 35;

  doc.setFont('helvetica', 'bold');
  doc.text('Mata Pelajaran', col2Left, boxTop + 7);
  doc.text('Paket Ujian', col2Left, boxTop + 14);
  doc.text('Tanggal Ujian', col2Left, boxTop + 21);
  doc.text('Metode Pelaksanaan', col2Left, boxTop + 28);

  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${record.mapelNama || '-'}`, col2Val, boxTop + 7);
  
  // Truncate long exam titles
  const examTitle = record.namaUjian || '-';
  const truncatedExam = examTitle.length > 26 ? examTitle.substring(0, 24) + '...' : examTitle;
  doc.text(`:  ${truncatedExam}`, col2Val, boxTop + 14);
  doc.text(`:  ${record.tanggalPelaksanaan || '-'}`, col2Val, boxTop + 21);
  doc.text(':  CAT CBT Online Lab', col2Val, boxTop + 28);

  // 4. SCORE BADGE & METRICS SECTION
  const scoreTop = boxTop + 44;

  // Main Score Card
  const isPassed = record.nilai >= record.kkm;
  doc.setFillColor(isPassed ? 236 : 255, isPassed ? 253 : 241, isPassed ? 245 : 242);
  doc.setDrawColor(isPassed ? 167 : 254, isPassed ? 243 : 205, isPassed ? 208 : 211);
  doc.roundedRect(margin, scoreTop, 60, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(isPassed ? 6 : 159, isPassed ? 95 : 18, isPassed ? 70 : 57);
  doc.text('NILAI AKHIR CAT', margin + 30, scoreTop + 7, { align: 'center' });

  doc.setFontSize(26);
  doc.text(`${record.nilai}`, margin + 30, scoreTop + 22, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Standar KKM: ${record.kkm}`, margin + 30, scoreTop + 30, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(isPassed ? '★ TUNTAS' : '⚠ REMEDIAL', margin + 30, scoreTop + 37, { align: 'center' });

  // Breakdown Metrics Table
  const tableLeft = margin + 65;
  const tableWidth = contentWidth - 65;

  doc.setFillColor(241, 245, 249);
  doc.rect(tableLeft, scoreTop, tableWidth, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(tableLeft, scoreTop, tableWidth, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('INDIKATOR EVALUASI', tableLeft + 4, scoreTop + 5.5);
  doc.text('KETERANGAN HASIL', tableLeft + tableWidth - 4, scoreTop + 5.5, { align: 'right' });

  // Row 1: Total Soal
  const rowH = 6.8;
  let curY = scoreTop + 8;
  doc.setFont('helvetica', 'normal');
  doc.rect(tableLeft, curY, tableWidth, rowH, 'S');
  doc.text('Jumlah Butir Soal Terjawab', tableLeft + 4, curY + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${record.totalSoal} Butir`, tableLeft + tableWidth - 4, curY + 4.8, { align: 'right' });

  // Row 2: Jawaban Benar & Salah
  curY += rowH;
  doc.setFont('helvetica', 'normal');
  doc.rect(tableLeft, curY, tableWidth, rowH, 'S');
  doc.text('Akurasi Jawaban (Benar / Salah)', tableLeft + 4, curY + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 135, 90);
  doc.text(`${record.jumlahBenar} Benar `, tableLeft + tableWidth - 25, curY + 4.8, { align: 'right' });
  doc.setTextColor(225, 29, 72);
  doc.text(`/ ${record.jumlahSalah} Salah`, tableLeft + tableWidth - 4, curY + 4.8, { align: 'right' });

  // Row 3: Kategori Capaian
  curY += rowH;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.rect(tableLeft, curY, tableWidth, rowH, 'S');
  doc.text('Predikat & Kategori Capaian', tableLeft + 4, curY + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 60, 109);
  doc.text(`${record.kategoriCapaian || 'Baik'}`, tableLeft + tableWidth - 4, curY + 4.8, { align: 'right' });

  // Row 4: Status Kelulusan
  curY += rowH;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.rect(tableLeft, curY, tableWidth, rowH, 'S');
  doc.text('Status Kelulusan Asesmen', tableLeft + 4, curY + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isPassed ? 0 : 225, isPassed ? 135 : 29, isPassed ? 90 : 72);
  doc.text(`${record.statusKelulusan}`, tableLeft + tableWidth - 4, curY + 4.8, { align: 'right' });

  // 5. EVALUATION NOTES BOX
  const evalTop = scoreTop + 48;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, evalTop, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 60, 109);
  doc.text('CATATAN EVALUASI & TINDAK LANJUT GURU PENGAMPU:', margin + 4, evalTop + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const evalNote = record.catatanEvaluasi || 'Peserta didik telah menyelesaikan seluruh butir soal asesmen dengan tertib dan mematuhi tata tertib ujian CAT.';
  const splitNotes = doc.splitTextToSize(`"${evalNote}"`, contentWidth - 8);
  doc.text(splitNotes, margin + 4, evalTop + 12);

  // 6. SIGNATURE & VERIFICATION SECTION
  const signTop = evalTop + 33;
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Left Sign: Wali Kelas / Guru Pengampu
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Jawa Barat, ${todayStr}`, margin + 8, signTop);
  doc.text('Guru Pengampu Mata Pelajaran,', margin + 8, signTop + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(additionalInfo?.guruNama || 'Dra. Hj. Ceu Nining Ratnaningsih, M.M.', margin + 8, signTop + 26);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197405101999032001', margin + 8, signTop + 30);

  // Right Sign: Kepala Sekolah
  const rightSignX = pageWidth - margin - 60;
  doc.text('Mengetahui,', rightSignX, signTop);
  doc.text('Kepala Sekolah,', rightSignX, signTop + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Dr. H. Bambang Sutrisno, M.Pd.', rightSignX, signTop + 26);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 196803151992031004', rightSignX, signTop + 30);

  // Center QR Simulation Box
  const qrX = pageWidth / 2 - 12;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(qrX, signTop - 2, 24, 24, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('QR VERIFIKASI', qrX + 12, signTop + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('DISDIK JABAR', qrX + 12, signTop + 11, { align: 'center' });
  doc.text('E-DOC VALID', qrX + 12, signTop + 15, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text(record.id, qrX + 12, signTop + 19, { align: 'center' });

  // 7. FOOTER
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen ini dicetak otomatis oleh Sistem Manajemen Sekolah Jawa Barat (SMS JABAR) pada ${new Date().toLocaleString('id-ID')}`,
    margin,
    285
  );
  doc.text('Halaman 1 / 1', pageWidth - margin, 285, { align: 'right' });

  // Save the PDF
  const safeFilename = `Laporan_Nilai_${record.nisn}_${record.namaSiswa.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}

export function exportBatchExamResultsPDF(
  ujian: Ujian,
  portfolios: PortofolioSiswaRecord[],
  sekolahNama?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.getPageWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header
  doc.setFillColor(11, 60, 109);
  doc.rect(margin, 12, 12, 12, 'F');
  doc.setFillColor(0, 135, 90);
  doc.circle(margin + 6, 18, 3, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH DAERAH PROVINSI JAWA BARAT', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(13);
  doc.text('DINAS PENDIDIKAN', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text('REKAPITULASI HASIL ASESMEN BERBASIS KOMPUTER (CAT)', pageWidth / 2, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${sekolahNama || 'SMA NEGERI 1 PROVINSI JAWA BARAT'} | Paket: ${ujian.namaUjian}`,
    pageWidth / 2,
    29,
    { align: 'center' }
  );

  doc.setDrawColor(11, 60, 109);
  doc.setLineWidth(0.8);
  doc.line(margin, 32, pageWidth - margin, 32);
  doc.setDrawColor(0, 135, 90);
  doc.setLineWidth(0.3);
  doc.line(margin, 33.2, pageWidth - margin, 33.2);

  // Exam Info Summary
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Mata Pelajaran: ${ujian.mapelNama}`, margin, 40);
  doc.text(`Tingkat / Kelas: Kelas ${ujian.kelas}`, margin, 45);
  doc.text(`Standar KKM: ${ujian.nilaiMinimum}`, margin + 80, 40);
  doc.text(`Total Peserta Dinilai: ${portfolios.length} Siswa`, margin + 80, 45);

  // Table Headers
  const tableY = 51;
  doc.setFillColor(11, 60, 109);
  doc.rect(margin, tableY, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('NO', margin + 2, tableY + 4.8);
  doc.text('NISN', margin + 12, tableY + 4.8);
  doc.text('NAMA SISWA', margin + 35, tableY + 4.8);
  doc.text('B / S', margin + 105, tableY + 4.8);
  doc.text('NILAI CAT', margin + 125, tableY + 4.8);
  doc.text('STATUS', margin + 148, tableY + 4.8);

  let curY = tableY + 7;
  const rowH = 6.5;

  portfolios.forEach((item, index) => {
    if (curY > 265) {
      doc.addPage();
      curY = 20;
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, curY, contentWidth, rowH, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, curY, contentWidth, rowH, 'S');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    doc.text(`${index + 1}`, margin + 2, curY + 4.5);
    doc.text(`${item.nisn}`, margin + 12, curY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.namaSiswa}`, margin + 35, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`${item.jumlahBenar}B / ${item.jumlahSalah}S`, margin + 105, curY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.nilai >= item.kkm ? 0 : 225, item.nilai >= item.kkm ? 135 : 29, item.nilai >= item.kkm ? 90 : 72);
    doc.text(`${item.nilai}`, margin + 125, curY + 4.5);

    doc.setFontSize(7);
    doc.text(`${item.statusKelulusan}`, margin + 148, curY + 4.5);

    curY += rowH;
  });

  // Footer & Signature
  if (curY < 240) {
    const signY = curY + 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Jawa Barat, ${new Date().toLocaleDateString('id-ID')}`, pageWidth - margin - 50, signY);
    doc.text('Guru Mata Pelajaran / Pengawas,', pageWidth - margin - 50, signY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text('Tim Kurikulum Disdik Jabar', pageWidth - margin - 50, signY + 22);
  }

  doc.save(`Rekap_Hasil_Ujian_${ujian.namaUjian.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
