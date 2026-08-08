import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Genera reportes PDF con encabezado de marca Emcoex, ya sea de una
// sola sección (cierres/despachos/proveedores) o el reporte general
// consolidado (todas las secciones en un solo documento).

const NAVY = [15, 30, 48];
const AMBER = [217, 155, 41];
const TEAL = [22, 128, 122];

function drawHeader(doc, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('EMCOEX', 14, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(217, 155, 41);
  doc.text('Agenda ejecutiva de presidencia', 14, 21);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth - 14, 15, { align: 'right' });
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(subtitle, pageWidth - 14, 21, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);
  return 40;
}

function drawFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(`Generado el ${new Date().toLocaleString('es-VE')}`, 14, pageHeight - 8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

function sectionTable(doc, startY, sectionLabel, columns, rows, accent) {
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text(sectionLabel, 14, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: accent, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  return doc.lastAutoTable.finalY + 12;
}

const SECTION_BUILDERS = {
  cierres: (rows) => ({
    columns: ['Mes', 'Ingresos', 'Costos', 'Margen', 'Despachos'],
    rows: rows.map((r) => {
      const margen = r.ingresos ? (((r.ingresos - r.costos) / r.ingresos) * 100).toFixed(1) + '%' : '—';
      return [r.mes, `$${Number(r.ingresos || 0).toLocaleString('es-VE')}`, `$${Number(r.costos || 0).toLocaleString('es-VE')}`, margen, r.despachos_cerrados ?? '—'];
    }),
  }),
  despachos: (rows) => ({
    columns: ['Proveedor', 'Incoterm', 'Estado', 'Fecha', 'Monto'],
    rows: rows.map((r) => [r.proveedor, r.incoterm, r.estado, r.fecha, `$${Number(r.monto || 0).toLocaleString('es-VE')}`]),
  }),
  proveedores: (rows) => ({
    columns: ['Nombre', 'Municipio', 'Rubro', 'Capacidad', 'Contacto'],
    rows: rows.map((r) => [r.nombre, r.municipio || '—', r.rubro || '—', r.capacidad_mensual || '—', r.contacto || '—']),
  }),
};

export function exportSectionPdf(sectionKey, sectionLabel, records) {
  const doc = new jsPDF();
  let y = drawHeader(doc, sectionLabel, `${records.length} registro(s)`);
  const builder = SECTION_BUILDERS[sectionKey];
  const { columns, rows } = builder(records);
  if (rows.length) {
    sectionTable(doc, y, sectionLabel, columns, rows, AMBER);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No hay registros capturados todavía en esta sección.', 14, y);
  }
  drawFooter(doc);
  doc.save(`emcoex-${sectionKey}-${Date.now()}.pdf`);
}

export function exportGeneralPdf(dataBySection) {
  const doc = new jsPDF();
  let y = drawHeader(doc, 'Reporte general', new Date().toLocaleDateString('es-VE'));

  const order = [
    ['cierres', 'Cierres mensuales', AMBER],
    ['despachos', 'Despachos', TEAL],
    ['proveedores', 'Proveedores', NAVY],
  ];

  order.forEach(([key, label, color], idx) => {
    const records = dataBySection[key] || [];
    if (idx > 0 && y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = drawHeader(doc, 'Reporte general', new Date().toLocaleDateString('es-VE'));
    }
    if (records.length) {
      const { columns, rows } = SECTION_BUILDERS[key](records);
      y = sectionTable(doc, y, label, columns, rows, color);
    } else {
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text('Sin registros.', 14, y + 6);
      y += 16;
    }
  });

  drawFooter(doc);
  doc.save(`emcoex-reporte-general-${Date.now()}.pdf`);
}
