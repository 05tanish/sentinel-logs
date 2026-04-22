import { useEffect, useState } from 'react';
import api from '../../api/axios';

const severityColors = {
  HIGH: { bg: '#431407', color: '#fb923c' },
  MEDIUM: { bg: '#422006', color: '#fbbf24' },
  LOW: { bg: '#052e16', color: '#86efac' },
};

export default function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [severity, setSeverity] = useState('HIGH');
  const [loading, setLoading] = useState(true);

  const load = async (sev = severity) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/logs/severity/${sev}`);
      setLogs(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSeverityChange = (sev) => {
    setSeverity(sev);
    load(sev);
  };

  return (
    <div>
      <div style={styles.filters}>
        {['HIGH', 'MEDIUM', 'LOW'].map((s) => (
          <button
            key={s}
            style={{ ...styles.filterBtn, ...(severity === s ? styles.filterActive : {}) }}
            onClick={() => handleSeverityChange(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={styles.tableWrap}>
        <div style={styles.tableHeader}>
          <h3 style={{ fontSize: 15 }}>{severity} Severity Logs</h3>
          <button style={styles.refreshBtn} onClick={() => load()}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={styles.empty}>No {severity} logs found</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Time', 'Event Type', 'Severity', 'IP Address', 'Username', 'Source', 'Raw Log'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={styles.td}>{new Date(l.created_at).toLocaleString()}</td>
                  <td style={styles.td}>{l.event_type}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(severityColors[l.severity] || {}) }}>
                      {l.severity}
                    </span>
                  </td>
                  <td style={styles.td}>{l.ip_address || '—'}</td>
                  <td style={styles.td}>{l.username || '—'}</td>
                  <td style={styles.td}>{l.source || '—'}</td>
                  <td style={{ ...styles.td, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.raw}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  filters: { display: 'flex', gap: 8, marginBottom: 16 },
  filterBtn: { padding: '6px 16px', background: '#1a1d27', border: '1px solid #2d3148', color: '#64748b', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  filterActive: { background: '#2d3148', color: '#e2e8f0', borderColor: '#6366f1' },
  tableWrap: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d3148' },
  refreshBtn: { background: '#2d3148', border: 'none', color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#0f1117', padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  td: { padding: '12px 16px', fontSize: 13, borderTop: '1px solid #2d3148', color: '#e2e8f0' },
  badge: { padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 },
  empty: { padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 },
};
