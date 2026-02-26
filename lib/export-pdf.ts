import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface ExportOptions {
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
}

export async function exportPageToPDF(
  element: HTMLElement,
  filename: string,
  options: ExportOptions = {}
) {
  const { title, subtitle, orientation = 'portrait' } = options;

  // Temporarily mark body as exporting so CSS can hide interactive elements
  document.body.classList.add('exporting-pdf');

  // Wait for any reflows
  await new Promise((r) => setTimeout(r, 300));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  document.body.classList.remove('exporting-pdf');

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const headerHeight = title ? 20 : 0;
  const footerHeight = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2 - headerHeight - footerHeight;

  // Calculate image dimensions to fit page width
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const totalPages = Math.ceil(imgHeight / contentHeight);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    // Header on each page
    if (title) {
      pdf.setFontSize(14);
      pdf.setTextColor(79, 70, 229); // indigo-600
      pdf.text(title, margin, margin + 6);
      if (subtitle) {
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128); // gray-500
        pdf.text(subtitle, margin, margin + 12);
      }
      // Date on right
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      pdf.text(dateStr, pageWidth - margin, margin + 6, { align: 'right' });
    }

    // Clip and draw the appropriate section of the image
    const sourceY = page * contentHeight;
    pdf.addImage(
      imgData,
      'PNG',
      margin,
      margin + headerHeight,
      imgWidth,
      imgHeight,
      undefined,
      'FAST',
      0
    );

    // Mask areas outside the current page's slice using white rectangles
    // Top mask (above current slice)
    if (page > 0) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, margin + headerHeight, 'F');
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      `Page ${page + 1} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - margin / 2,
      { align: 'center' }
    );
  }

  // For multi-page, use a simpler single-image-per-page approach
  // that actually works with jsPDF by splitting the canvas
  if (totalPages > 1) {
    // Re-generate with proper page splitting
    const pdf2 = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const sliceHeightPx = (contentHeight / imgWidth) * canvas.width;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf2.addPage();

      // Header
      if (title) {
        pdf2.setFontSize(14);
        pdf2.setTextColor(79, 70, 229);
        pdf2.text(title, margin, margin + 6);
        if (subtitle) {
          pdf2.setFontSize(9);
          pdf2.setTextColor(107, 114, 128);
          pdf2.text(subtitle, margin, margin + 12);
        }
        pdf2.setFontSize(8);
        pdf2.setTextColor(107, 114, 128);
        const dateStr = new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        pdf2.text(dateStr, pageWidth - margin, margin + 6, { align: 'right' });
      }

      // Create a canvas slice for this page
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      const thisSliceHeight = Math.min(
        sliceHeightPx,
        canvas.height - page * sliceHeightPx
      );
      sliceCanvas.height = thisSliceHeight;
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          page * sliceHeightPx,
          canvas.width,
          thisSliceHeight,
          0,
          0,
          canvas.width,
          thisSliceHeight
        );
      }

      const sliceData = sliceCanvas.toDataURL('image/png');
      const sliceImgHeight = (thisSliceHeight * imgWidth) / canvas.width;
      pdf2.addImage(
        sliceData,
        'PNG',
        margin,
        margin + headerHeight,
        imgWidth,
        sliceImgHeight,
        undefined,
        'FAST'
      );

      // Footer
      pdf2.setFontSize(8);
      pdf2.setTextColor(156, 163, 175);
      pdf2.text(
        `Page ${page + 1} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - margin / 2,
        { align: 'center' }
      );
    }

    pdf2.save(filename);
    return;
  }

  pdf.save(filename);
}
