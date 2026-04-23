import PDFDocument from 'pdfkit';
import { pool } from '../../config/db.js';
import { AsyncHandeler } from '../../utilis/Aysnchandler.js';

// helper — fetch alerts with optional date range
const fetchAlerts = async (from, to) => {
  let query = `SELECT * FROM alerts WHERE 1=1`;
  const params = [];

  if (from) { params.push(from); query += ` AND detected_at >= $${params.length}`; }
  if (to)   { params.push(to);   query += ` AND detected_at <= $${params.length}`; }

  query += ' ORDER BY detected_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
};

// fetch summary stats
const fetchStats = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE severity = 'CRITICAL') AS critical,
      COUNT(*) FILTER (WHERE severity = 'HIGH') AS high,
      COUNT(*) FILTER (WHERE severity = 'MEDIUM') AS medium,
      COUNT(*) FILTER (WHERE resolved = true) AS resolved,
      COUNT(*) FILTER (WHERE resolved = false) AS open
    FROM alerts
  `);
  return result.rows[0];
};

// ─── CSV Download ─────────────────────────────────────────
// GET /api/reports/csv?from=2026-01-01&to=2026-12-31
export const downloadCSV = AsyncHandeler(async (req, res) => {
  const { from, to } = req.query;
  const alerts = await fetchAlerts(from, to);

  const headers = ['ID', 'Type', 'Severity', 'Source IP', 'Username', 'Description', 'Acknowledged', 'Resolved', 'Detected At'];

  const rows = alerts.map((a) => [
    a.id,
    a.type,
    a.severity,
    a.source_ip || '',
    a.username || '',
    `"${(a.description || '').replace(/"/g, '""')}"`, // escape quotes in CSV
    a.acknowledged,
    a.resolved,
    new Date(a.detected_at).toISOString(),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const filename = `siem-alerts-${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// ─── PDF Download ─────────────────────────────────────────
// GET /api/reports/pdf?from=2026-01-01&to=2026-12-31
export const downloadPDF = AsyncHandeler(async (req, res) => {
  const { from, to } = req.query;
  const [alerts, stats] = await Promise.all([fetchAlerts(from, to), fetchStats()]);

  const filename = `siem-report-${new Date().toISOString().split('T')[0]}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res); // stream PDF directly to response

  // ── Title ──
  doc.fontSize(20).fillColor('#1a1a2e').text('SIEM Security Report', { align: 'center' });
  doc.fontSize(11).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  if (from || to) {
    doc.text(`Period: ${from || 'All time'} to ${to || 'Now'}`, { align: 'center' });
  }
  doc.moveDown(1.5);

  // ── Summary Stats ──
  doc.fontSize(14).fillColor('#000').text('Summary', { underline: true });
  doc.moveDown(0.5);

  const statItems = [
    ['Total Alerts', stats.total],
    ['Open Alerts', stats.open],
    ['Resolved Alerts', stats.resolved],
    ['Critical', stats.critical],
    ['High', stats.high],
    ['Medium', stats.medium],
  ];

  statItems.forEach(([label, value]) => {
    doc.fontSize(11).fillColor('#333').text(`${label}: `, { continued: true }).fillColor('#000').text(String(value));
  });

  doc.moveDown(1.5);

  // ── Alerts Table ──
  doc.fontSize(14).fillColor('#000').text('Alert Details', { underline: true });
  doc.moveDown(0.5);

  if (alerts.length === 0) {
    doc.fontSize(11).fillColor('#666').text('No alerts found for this period.');
  } else {
    alerts.slice(0, 100).forEach((a, i) => { // limit to 100 for PDF size
      const severityColor = {
        CRITICAL: '#dc2626',
        HIGH: '#ea580c',
        MEDIUM: '#d97706',
        LOW: '#16a34a',
      }[a.severity] || '#000';

      doc.fontSize(10)
        .fillColor('#000').text(`${i + 1}. `, { continued: true })
        .fillColor(severityColor).text(`[${a.severity}] `, { continued: true })
        .fillColor('#000').text(`${a.type}`, { continued: true })
        .fillColor('#666').text(` — ${new Date(a.detected_at).toLocaleString()}`);

      doc.fontSize(9).fillColor('#444')
        .text(`   IP: ${a.source_ip || 'N/A'} | User: ${a.username || 'N/A'} | ${a.description || ''}`);

      doc.moveDown(0.3);

      // add new page if near bottom
      if (doc.y > 750) doc.addPage();
    });

    if (alerts.length > 100) {
      doc.moveDown().fontSize(10).fillColor('#666')
        .text(`... and ${alerts.length - 100} more alerts. Download CSV for full data.`);
    }
  }

  doc.end(); // finalize PDF
});
