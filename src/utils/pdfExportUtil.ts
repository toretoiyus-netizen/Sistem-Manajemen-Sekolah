import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  metaInfo?: { label: string; value: string }[];
  fileName?: string;
  head: string[][];
  body: (string | number)[][];
  signatureRole?: string;
  signatureName?: string;
  signatureNip?: string;
  columnStyles?: Record<number, { cellWidth?: number | 'auto' | 'wrap'; halign?: 'left' | 'center' | 'right' }>;
}

/**
 * Generates and downloads a precise, landscape F4 (215 x 330 mm) PDF document
 * with official Disdik Jabar Kop Surat and auto-calculated table columns.
 */
export function exportToF4LandscapePDF(options: PDFExportOptions): void {
  const {
    title,
    subtitle = 'SISTEM MANAJEMEN SEKOLAH & ASESMEN TERPADU DISDIK JABAR',
    metaInfo = [],
    fileName = 'Dokumen_Resmi_Sekolah_Jabar.pdf',
    head,
    body,
    signatureRole = 'Kepala Sekolah / Pengelola Data',
    signatureName = 'Drs. H. Hendra Sukmana, M.Pd.',
    signatureNip = '197508122002121004',
    columnStyles = {},
  } = options;

  // Standard F4 Landscape: 330mm width x 215mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [330, 215],
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 330 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 215 mm

  // Header / Kop Surat Renderer
  const drawKopSurat = () => {
    // Logo text & Kop Surat
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 30, 50);
    doc.text('PEMERINTAH DAERAH PROVINSI JAWA BARAT', pageWidth / 2, 12, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(11, 60, 109);
    doc.text('DINAS PENDIDIKAN', pageWidth / 2, 17, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(40, 50, 70);
    doc.text('CABANG DINAS PENDIDIKAN WILAYAH XI', pageWidth / 2, 22, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 120);
    doc.text(
      'Jl. Dr. Rajiman No. 6, Pasir Kaliki, Kec. Cicendo, Kota Bandung, Jawa Barat 40171 | Laman: disdik.jabarprov.go.id',
      pageWidth / 2,
      26.5,
      { align: 'center' }
    );

    // Double Divider Lines
    doc.setDrawColor(15, 76, 129);
    doc.setLineWidth(0.8);
    doc.line(12, 29, pageWidth - 12, 29);

    doc.setLineWidth(0.3);
    doc.line(12, 30, pageWidth - 12, 30);
  };

  // Draw initial Kop
  drawKopSurat();

  // Document Title
  let currentY = 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

  if (subtitle) {
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
  }

  // Meta information line (e.g. Kelas, Rombel, Tahun Ajaran, Tanggal Cetak)
  currentY += 4;
  if (metaInfo.length > 0) {
    currentY += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const metaString = metaInfo.map((m) => `${m.label}: ${m.value}`).join('  |  ');
    doc.text(metaString, pageWidth / 2, currentY, { align: 'center' });
  }

  const tableStartY = currentY + 4;

  // AutoTable options for Landscape F4 Precision
  autoTable(doc, {
    head: head,
    body: body,
    startY: tableStartY,
    margin: { left: 12, right: 12, top: 34, bottom: 35 },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'left',
      valign: 'middle',
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      textColor: [30, 41, 59],
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [11, 60, 109], // Official Jabar Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: columnStyles,
    didDrawPage: (data) => {
      // Header for pages > 1
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${title} (Lanjutan Halaman ${data.pageNumber})`, 12, 10);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(12, 12, pageWidth - 12, 12);
      }

      // Footer with Page Count and Security Hash
      const printDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);

      // Left footer: Print timestamp
      doc.text(`Dicetak melalui Sistem Informasi Sekolah Jabar • ${printDate} WIB`, 12, pageHeight - 10);

      // Right footer: Page number
      const pageText = `Halaman ${data.pageNumber}`;
      doc.text(pageText, pageWidth - 12, pageHeight - 10, { align: 'right' });
    },
  });

  // Calculate position for Signature block on the last page
  // @ts-ignore
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : tableStartY + 50;

  let signatureY = finalY + 8;
  // If signature exceeds page height, add a new page
  if (signatureY + 28 > pageHeight - 15) {
    doc.addPage();
    signatureY = 25;
  }

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Signature Block (Right aligned)
  const signX = pageWidth - 65;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text(`Bandung, ${currentDateFormatted}`, signX, signatureY, { align: 'center' });
  doc.text(signatureRole, signX, signatureY + 4, { align: 'center' });

  // Signature line & Name
  doc.setFont('helvetica', 'bold');
  doc.text(signatureName, signX, signatureY + 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NIP. ${signatureNip}`, signX, signatureY + 24, { align: 'center' });

  // Save the PDF
  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}
