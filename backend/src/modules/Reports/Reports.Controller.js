import PDFDocument from 'pdfkit';
import { pool } from '../../config/db.js';
import { AsyncHandeler } from '../../utilis/Aysnchandler.js';

// ─── Data Fetchers ────────────────────────────────────────

const fetchAlerts = async (from, to) => {
  let query = `SELECT * FROM alerts WHERE 1=1`;
  const params = [];
  if (from) { params.push(from); query += ` AND detected_at >= $${params.length}`; }
  if (to)   { params.push(to);   query += ` AND detected_at <= $${params.length}`; }
  query += ' ORDER BY detected_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
};

const fetchStats = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*)                                          AS total,
      COUNT(*) FILTER (WHERE severity = 'CRITICAL')    AS critical,
      COUNT(*) FILTER (WHERE severity = 'HIGH')        AS high,
      COUNT(*) FILTER (WHERE severity = 'MEDIUM')      AS medium,
      COUNT(*) FILTER (WHERE severity = 'LOW')         AS low,
      COUNT(*) FILTER (WHERE resolved = true)          AS resolved,
      COUNT(*) FILTER (WHERE resolved = false)         AS open,
      COUNT(*) FILTER (WHERE acknowledged = true)      AS acknowledged
    FROM alerts
  `);
  return result.rows[0];
};

const fetchTopIPs = async () => {
  const result = await pool.query(`
    SELECT source_ip, COUNT(*) as count
    FROM alerts
    WHERE source_ip IS NOT NULL
    GROUP BY source_ip
    ORDER BY count DESC
    LIMIT 5
  `);
  return result.rows;
};

// ─── Helpers ──────────────────────────────────────────────

const severityColor = (sev) => ({
  CRITICAL: '#dc2626',
  HIGH:     '#ea580c',
  MEDIUM:   '#d97706',
  LOW:      '#16a34a',
}[sev] || '#374151');

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

// ─── CSV ──────────────────────────────────────────────────

export const downloadCSV = AsyncHandeler(async (req, res) => {
  const { from, to } = req.query;
  const alerts = await fetchAlerts(from, to);
  const stats  = await fetchStats();

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const lines = [];

  // Report header
  lines.push(`"SENTINEL-LOGS — SECURITY ALERT REPORT"`);
  lines.push(`"Generated","${fmtDate(new Date())}"`);
  lines.push(`"Period","${from || 'All time'} to ${to || 'Now'}"`);
  lines.push(`"Total Alerts","${stats.total}"`);
  lines.push('');

  // Summary section
  lines.push('"SUMMARY"');
  lines.push('"Metric","Count"');
  lines.push(`"Open Alerts","${stats.open}"`);
  lines.push(`"Resolved Alerts","${stats.resolved}"`);
  lines.push(`"Acknowledged","${stats.acknowledged}"`);
  lines.push(`"Critical","${stats.critical}"`);
  lines.push(`"High","${stats.high}"`);
  lines.push(`"Medium","${stats.medium}"`);
  lines.push(`"Low","${stats.low}"`);
  lines.push('');

  // Alert details
  lines.push('"ALERT DETAILS"');
  lines.push([
    '"#"',
    '"Detected At"',
    '"Type"',
    '"Severity"',
    '"Source IP"',
    '"Username"',
    '"Description"',
    '"Acknowledged"',
    '"Resolved"',
  ].join(','));

  alerts.forEach((a, i) => {
    lines.push([
      i + 1,
      esc(fmtDate(a.detected_at)),
      esc(a.type),
      esc(a.severity),
      esc(a.source_ip || '—'),
      esc(a.username  || '—'),
      esc(a.description || ''),
      esc(a.acknowledged ? 'Yes' : 'No'),
      esc(a.resolved     ? 'Yes' : 'No'),
    ].join(','));
  });

  const csv = lines.join('\n');
  const filename = `sentinel-report-${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
});

// ─── PDF ──────────────────────────────────────────────────

export const downloadPDF = AsyncHandeler(async (req, res) => {
  const { from, to } = req.query;
  const [alerts, stats, topIPs] = await Promise.all([
    fetchAlerts(from, to),
    fetchStats(),
    fetchTopIPs(),
  ]);

  const filename = `sentinel-report-${new Date().toISOString().split('T')[0]}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 48, size: 'A4', bufferPages: true });
  doc.pipe(res);

  const W      = doc.page.width - 96;  // usable width
  const LEFT   = 48;
  const COLORS = {
    bg:        '#0d0e11',
    accent:    '#5b6af0',
    text:      '#1a1a2a',
    muted:     '#6b7280',
    border:    '#e5e7eb',
    rowAlt:    '#f9fafb',
    critical:  '#dc2626',
    high:      '#ea580c',
    medium:    '#d97706',
    low:       '#16a34a',
    white:     '#ffffff',
  };

  // ── Header bar ──────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 72).fill(COLORS.bg);

  doc.fontSize(20).fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('Sentinel-Logs', LEFT, 18, { continued: true })
     .font('Helvetica')
     .fontSize(13)
     .fillColor('#9ca3af')
     .text('  Security Alert Report');

  doc.fontSize(9).fillColor('#6b7280')
     .text(`Generated: ${fmtDate(new Date())}   |   Period: ${from || 'All time'} → ${to || 'Now'}`, LEFT, 50);

  doc.y = 90;

  // ── Section helper ──────────────────────────────────────
  const sectionTitle = (title) => {
    doc.moveDown(0.8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.accent).text(title.toUpperCase(), LEFT, doc.y);
    doc.moveDown(0.2);
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(COLORS.accent).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica').fillColor(COLORS.text);
  };

  // ── Summary stat cards (2 rows × 4 cols) ────────────────
  sectionTitle('Summary');

  const statItems = [
    { label: 'Total',       value: stats.total,       color: COLORS.accent   },
    { label: 'Open',        value: stats.open,         color: COLORS.critical },
    { label: 'Resolved',    value: stats.resolved,     color: COLORS.low      },
    { label: 'Acknowledged',value: stats.acknowledged, color: COLORS.medium   },
    { label: 'Critical',    value: stats.critical,     color: COLORS.critical },
    { label: 'High',        value: stats.high,         color: COLORS.high     },
    { label: 'Medium',      value: stats.medium,       color: COLORS.medium   },
    { label: 'Low',         value: stats.low,          color: COLORS.low      },
  ];

  const cardW = (W - 18) / 4;
  const cardH = 52;
  let cardX = LEFT;
  let cardY = doc.y;

  statItems.forEach((item, i) => {
    if (i === 4) { cardX = LEFT; cardY += cardH + 6; }
    const cx = cardX + (i % 4) * (cardW + 6);

    // card background
    doc.roundedRect(cx, cardY, cardW, cardH, 4).fillAndStroke(COLORS.rowAlt, COLORS.border);

    // accent left bar
    doc.rect(cx, cardY, 3, cardH).fill(item.color);

    // value
    doc.fontSize(20).font('Helvetica-Bold').fillColor(item.color)
       .text(String(item.value), cx + 10, cardY + 8, { width: cardW - 14, align: 'left' });

    // label
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
       .text(item.label.toUpperCase(), cx + 10, cardY + 34, { width: cardW - 14 });
  });

  doc.y = cardY + cardH + 16;

  // ── Top Source IPs ───────────────────────────────────────
  if (topIPs.length > 0) {
    sectionTitle('Top Source IPs');

    const ipColW = [W * 0.6, W * 0.4];
    const rowH = 20;

    // header row
    doc.rect(LEFT, doc.y, W, rowH).fill(COLORS.bg);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white);
    const ipHeaderTop = doc.y + 6;
    doc.text('IP ADDRESS',   LEFT + 8,             ipHeaderTop, { width: ipColW[0] });
    doc.text('ALERT COUNT',  LEFT + ipColW[0] + 8, ipHeaderTop, { width: ipColW[1] });
    doc.y += rowH;

    topIPs.forEach((row, i) => {
      const bg = i % 2 === 0 ? COLORS.white : COLORS.rowAlt;
      doc.rect(LEFT, doc.y, W, rowH).fill(bg);
      doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(COLORS.border).lineWidth(0.5).stroke();

      const ipRowTop = doc.y + 5;
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.text);
      doc.text(row.source_ip,    LEFT + 8,             ipRowTop, { width: ipColW[0] });
      doc.text(String(row.count),LEFT + ipColW[0] + 8, ipRowTop, { width: ipColW[1] });
      doc.y += rowH;
    });

    // bottom border
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.moveDown(0.8);
  }

  // ── Alert Details Table ──────────────────────────────────
  sectionTitle(`Alert Details (${Math.min(alerts.length, 100)} of ${alerts.length})`);

  const cols = [
    { label: '#',          w: W * 0.04 },
    { label: 'TIME',       w: W * 0.17 },
    { label: 'TYPE',       w: W * 0.20 },
    { label: 'SEV',        w: W * 0.09 },
    { label: 'SOURCE IP',  w: W * 0.14 },
    { label: 'USER',       w: W * 0.12 },
    { label: 'DESCRIPTION',w: W * 0.24 },
  ];

  const rowH = 22;

  // table header
  doc.rect(LEFT, doc.y, W, rowH).fill(COLORS.bg);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(COLORS.white);
  let cx = LEFT + 6;
  const headerTop = doc.y + 7;
  cols.forEach((col) => {
    doc.text(col.label, cx, headerTop, { width: col.w - 4, ellipsis: true });
    cx += col.w;
  });
  doc.y += rowH;

  // table rows
  alerts.slice(0, 100).forEach((a, i) => {
    if (doc.y + rowH > doc.page.height - 60) {
      doc.addPage();
      doc.y = 48;
    }

    const bg = i % 2 === 0 ? COLORS.white : COLORS.rowAlt;
    doc.rect(LEFT, doc.y, W, rowH).fill(bg);
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(COLORS.border).lineWidth(0.3).stroke();

    const rowTop = doc.y + 6;
    cx = LEFT + 6;

    doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted);
    doc.text(String(i + 1), cx, rowTop, { width: cols[0].w - 4 });
    cx += cols[0].w;

    doc.fillColor(COLORS.text);
    doc.text(fmtDate(a.detected_at), cx, rowTop, { width: cols[1].w - 4, ellipsis: true });
    cx += cols[1].w;

    doc.text((a.type || '').replace(/_/g, ' '), cx, rowTop, { width: cols[2].w - 4, ellipsis: true });
    cx += cols[2].w;

    // severity badge
    const sc = severityColor(a.severity);
    doc.fontSize(7).font('Helvetica-Bold').fillColor(sc)
       .text(a.severity || '', cx, rowTop, { width: cols[3].w - 4 });
    cx += cols[3].w;

    doc.fontSize(8).font('Helvetica').fillColor(COLORS.text);
    doc.text(a.source_ip || '—', cx, rowTop, { width: cols[4].w - 4, ellipsis: true });
    cx += cols[4].w;

    doc.text(a.username || '—', cx, rowTop, { width: cols[5].w - 4, ellipsis: true });
    cx += cols[5].w;

    doc.fillColor(COLORS.muted);
    doc.text(a.description || '', cx, rowTop, { width: cols[6].w - 4, ellipsis: true });

    doc.y += rowH;
  });

  // bottom border
  doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(COLORS.border).lineWidth(0.5).stroke();

  if (alerts.length > 100) {
    doc.moveDown(0.5).fontSize(9).fillColor(COLORS.muted)
       .text(`+ ${alerts.length - 100} more alerts not shown. Download CSV for complete data.`, LEFT);
  }

  // ── Footer on every page ─────────────────────────────────
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.rect(0, doc.page.height - 32, doc.page.width, 32).fill(COLORS.bg);
    doc.fontSize(8).fillColor('#6b7280')
       .text(
         `Sentinel-Logs Security Report   |   Page ${i + 1} of ${pages.count}   |   Confidential`,
         LEFT, doc.page.height - 20,
         { width: W, align: 'center' }
       );
  }

  doc.end();
});
