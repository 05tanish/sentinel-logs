import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const severityColors = {
  CRITICAL: { bg: '#450a0a', color: '#f87171' },
  HIGH: { bg: '#431407', color: '#fb923c' },
  MEDIUM: { bg: '#422006', color: '#fbbf24' },
  LOW: { bg: '#052e16', color: '#86efac' },
};

const typeColors = {
  BRUTE_FORCE: { bg: '#2d1b69', color: '#c4b5fd' },
  REPEATED_USER_FAILURE: { bg: '#1e3a5f', color: '#93c5fd' },
};

export default function AlertsTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const canAct = user?.role === 'admin' || user?.role === 'analyst';

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        api.get('/api/alerts/stats'),
        api.get('/api/alerts?resolved=false&limit=50'),
      ]);
      setStats(statsRes.data.data);
      setAlerts(alertsRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const ack = async (id) => { await api.patch(`/api/alerts/${id}/acknowledge`); load(); };
  const resolve = async (id) => { await api.patch(`/api/alerts/${id}/resolve`); load(); };

  return (
    <div>
      {/* Stats */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Open Alerts', value: stats?.open, color: '#6366f1' },
          { label: 'Critical', value: stats?.critical, color: '#f87171' },
          { label: 'High', value: stats?.high, color: '#fb923c' },
          { label: 'Medium', value: stats?.medium, color: '#fbbf24' },
          { label: 'Last 24h', value: stats?.last_24h, color: '#34d399' },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <div style={styles.tableHeader}>
          <h3 style={{ fontSize: 15 }}>Recent Alerts</h3>
          <button style={styles.refreshBtn} onClick={load}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : alerts.length === 0 ? (
          <div style={styles.empty}>No open alerts 🎉</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Time', 'Type', 'Severity', 'Source IP', 'Username', 'Description', canAct && 'Actions']
                  .filter(Boolean).map((h) => <th key={h} style={styles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td style={styles.td}>{new Date(a.detected_at).toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(typeColors[a.type] || {}) }}>
                      {a.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(severityColors[a.severity] || {}) }}>
                      {a.severity}
                    </span>
                  </td>
                  <td style={styles.td}>{a.source_ip || '—'}</td>
                  <td style={styles.td}>{a.username || '—'}</td>
                  <td style={styles.td}>{a.description}</td>
                  {canAct && (
                    <td style={styles.td}>
                      {!a.acknowledged && (
                        <button style={{ ...styles.actionBtn, background: '#1e3a5f', color: '#93c5fd' }} onClick={() => ack(a.id)}>Ack</button>
                      )}
                      <button style={{ ...styles.actionBtn, background: '#052e16', color: '#86efac' }} onClick={() => resolve(a.id)}>Resolve</button>
                    </td>
                  )}
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 10, padding: 20 },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 700 },
  tableWrap: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d3148' },
  refreshBtn: { background: '#2d3148', border: 'none', color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#0f1117', padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  td: { padding: '12px 16px', fontSize: 13, borderTop: '1px solid #2d3148' },
  badge: { padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 },
  actionBtn: { padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, marginRight: 4 },
  empty: { padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 },
};
