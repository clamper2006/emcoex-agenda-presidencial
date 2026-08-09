import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { computeKpis } from '../data/agendaConfig.js';

// Genera reportes PDF con encabezado de marca Emcoex (isotipo real, no solo
// texto), una portada simple y — cuando hay datos de cierres mensuales de
// por medio — un resumen visual de KPIs antes de la tabla de detalle.
// Puede ser de una sola sección (cierres/despachos/proveedores) o el
// reporte general consolidado (todas las secciones en un solo documento).
//
// Iteración (rediseño de PDF): antes esto era una tabla genérica con un
// encabezado de solo texto ("EMCOEX" dibujado con doc.text). Ahora:
//  1. El isotipo real (public/brand/emcoex-isotipo.png) se embebe como
//     imagen en el encabezado de cada página y en la portada.
//  2. Cada export abre con una portada simple: isotipo grande, nombre del
//     reporte y fecha de generación.
//  3. exportGeneralPdf, y exportSectionPdf cuando la sección es "cierres",
//     dibujan un resumen visual de KPIs (tarjetas, no una tabla) antes de
//     la tabla de detalle — los mismos 4 KPIs que ya calcula
//     computeKpis() para el Dashboard. despachos/proveedores no tienen un
//     cálculo de KPIs definido en agendaConfig.js, así que ahí se pasa
//     directo de la portada a la tabla en vez de inventar métricas.

const NAVY = [15, 30, 48];
const AMBER = [217, 155, 41];
const TEAL = [22, 128, 122];
const GRAY = [120, 120, 120];

const LOGO_URL = `${import.meta.env.BASE_URL}brand/emcoex-isotipo.png`;

// El isotipo es un PNG estático servido desde public/, fuera del grafo de
// módulos de Vite (no se puede `import` directo). Se trae por fetch y se
// convierte a data URL en base64, que es el formato que espera
// doc.addImage(). Si falla (sin red, asset movido, etc.) se devuelve null
// y el resto del PDF sigue funcionando con el wordmark de texto solo,
// igual que antes de esta iteración — nunca bloquea la generación del PDF.
async function loadIsotipoBase64() {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el isotipo'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawHeader(doc, logo, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 32, 'F');

  let textX = 14;
  if (logo) {
    doc.addImage(logo, 'PNG', 14, 7, 10, 10);
    textX = 27;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('EMCOEX', textX, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...AMBER);
  doc.text('Agenda ejecutiva de presidencia', textX, 20);

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

// Portada simple: isotipo, nombre del reporte y fecha de generación. Ocupa
// la página 1 completa (que jsPDF crea automáticamente con `new jsPDF()`);
// el contenido real (encabezado + tablas) arranca en la página 2 con
// doc.addPage(). A propósito minimalista — el pedido fue "portada simple",
// no una portada con fondo ilustrado ni texto largo.
function drawCoverPage(doc, logo, reportTitle) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  if (logo) {
    doc.addImage(logo, 'PNG', centerX - 18, 70, 36, 36);
  }

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('EMCOEX', centerX, logo ? 122 : 90, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...AMBER);
  doc.text('Agenda ejecutiva de presidencia', centerX, logo ? 130 : 98, { align: 'center' });

  // Línea de acento naranja -> verde, misma paleta de marca que el resto
  // de la app (--accent / --accent-2 en themes.css).
  const ruleY = (logo ? 130 : 98) + 8;
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(1);
  doc.line(centerX - 20, ruleY, centerX, ruleY);
  doc.setDrawColor(...TEAL);
  doc.line(centerX, ruleY, centerX + 20, ruleY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text(reportTitle, centerX, ruleY + 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  const fecha = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Generado el ${fecha}`, centerX, ruleY + 30, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(160, 160, 160);
  doc.text('EMCOEX Lara — Empresa de Comercio Exterior del Estado Lara', centerX, pageHeight - 18, { align: 'center' });
}

// Resumen visual de KPIs: 4 tarjetas en grilla 2x2 (mismos datos que
// KpiGrid.jsx en el Dashboard), no una tabla — para que se lea de un
// vistazo antes de llegar al detalle fila por fila.
function drawKpiSummary(doc, startY, kpis) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('Resumen', 14, startY);

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const gap = 5;
  const cardW = (pageWidth - marginX * 2 - gap) / 2;
  const cardH = 22;
  const cardY = startY + 5;
  const accentByIndex = [AMBER, TEAL, AMBER, TEAL];

  kpis.forEach((kpi, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = marginX + col * (cardW + gap);
    const y = cardY + row * (cardH + gap);
    const accent = accentByIndex[i % accentByIndex.length];

    doc.setDrawColor(225, 225, 225);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
    doc.setFillColor(...accent);
    doc.rect(x, y, 1.4, cardH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(String(kpi.value), x + 6, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(kpi.label, x + 6, y + 17);
  });

  return cardY + Math.ceil(kpis.length / 2) * (cardH + gap) + 6;
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

export async function exportSectionPdf(sectionKey, sectionLabel, records) {
  const logo = await loadIsotipoBase64();
  const doc = new jsPDF();

  drawCoverPage(doc, logo, sectionLabel);
  doc.addPage();
  let y = drawHeader(doc, logo, sectionLabel, `${records.length} registro(s)`);

  // Solo "cierres" tiene un cálculo de KPIs definido en agendaConfig.js
  // (ingresos/costos/margen/despachos). despachos y proveedores pasan
  // directo a su tabla: mostrar tarjetas de KPI ahí implicaría inventar
  // métricas que la app no calcula en ningún otro lugar.
  if (sectionKey === 'cierres' && records.length) {
    y = drawKpiSummary(doc, y, computeKpis(records));
  }

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

export async function exportGeneralPdf(dataBySection) {
  const logo = await loadIsotipoBase64();
  const doc = new jsPDF();

  drawCoverPage(doc, logo, 'Reporte general');
  doc.addPage();
  let y = drawHeader(doc, logo, 'Reporte general', new Date().toLocaleDateString('es-VE'));
  y = drawKpiSummary(doc, y, computeKpis(dataBySection.cierres || []));

  const order = [
    ['cierres', 'Cierres mensuales', AMBER],
    ['despachos', 'Despachos', TEAL],
    ['proveedores', 'Proveedores', NAVY],
  ];

  order.forEach(([key, label, color], idx) => {
    const records = dataBySection[key] || [];
    if (idx > 0 && y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = drawHeader(doc, logo, 'Reporte general', new Date().toLocaleDateString('es-VE'));
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
