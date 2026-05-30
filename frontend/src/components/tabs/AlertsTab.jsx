import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import * as ui from '../ui';

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

  const ack     = async (id) => { await api.patch(`/api/alerts/${id}/acknowledge`); load(); };
  const resolve = async (id) => { await api.patch(`/api/alerts/${id}/resolve`);     load(); };

  const download = async (format) => {
    try {
      const res = await api.get(`/api/reports/${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `siem-alerts-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`${format.toUpperCase()} download failed:`, err);
    }
  };

  const statItems = [
    { label: 'Open',      value: stats?.open,     accent: 'var(--text-primary)' },
    { label: 'Critical',  value: stats?.critical,  accent: 'var(--red)'    },
    { label: 'High',      value: stats?.high,      accent: 'var(--orange)' },
    { label: 'Medium',    value: stats?.medium,    accent: 'var(--yellow)' },
    { label: 'Last 24 h', value: stats?.last_24h,  accent: 'var(--green)'  },
  ];

  return (
    <div>
      {/* Stats row */}
      <div style={s.statsRow}>
        {statItems.map((item) => (
          <div key={item.label} style={s.statCard}>
            <div style={s.statLabel}>{item.label}</div>
            <div style={{ ...s.statValue, color: item.accent }}>
              {item.value ?? <span style={{ color: 'var(--text-disabled)' }}>—</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={ui.card}>
        <div style={ui.tableHeader}>
          <span style={ui.tableTitle}>Open Alerts</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button style={s.exportBtn} onClick={() => download('csv')}>CSV</button>
            <button style={s.exportBtn} onClick={() => download('pdf')}>PDF</button>
            <button style={ui.btnGhost} onClick={load}>
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={ui.emptyState}>Loading…</div>
        ) : alerts.length === 0 ? (
          <div style={ui.emptyState}>No open alerts</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {['Time', 'Type', 'Severity', 'Source IP', 'Username', 'Description', canAct && 'Actions']
                    .filter(Boolean)
                    .map((h) => <th key={h} style={ui.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} style={s.row}>
                    <td style={ui.td}>{fmtDate(a.detected_at)}</td>
                    <td style={ui.td}>
                      <span style={ui.typeBadge(a.type)}>
                        {a.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={ui.td}>
                      <span style={ui.severityBadge(a.severity)}>{a.severity}</span>
                    </td>
                    <td style={{ ...ui.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {a.source_ip || <Dash />}
                    </td>
                    <td style={ui.td}>{a.username || <Dash />}</td>
                    <td style={{ ...ui.td, maxWidth: '320px' }}>
                      <span style={s.descText}>{a.description}</span>
                    </td>
                    {canAct && (
                      <td style={ui.td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!a.acknowledged && (
                            <button style={s.ackBtn} onClick={() => ack(a.id)}>Ack</button>
                          )}
                          <button style={s.resolveBtn} onClick={() => resolve(a.id)}>Resolve</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

const Dash = () => <span style={{ color: 'var(--text-disabled)' }}>—</span>;
const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 3.5 2.1M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const s = {
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    lineHeight: 1,
  },
  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    background: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  row: {
    transition: 'background 0.1s',
  },
  descText: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '320px',
  },
  ackBtn: {
    padding: '4px 10px',
    background: 'var(--blue-subtle)',
    border: '1px solid var(--blue-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--blue)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  resolveBtn: {
    padding: '4px 10px',
    background: 'var(--green-subtle)',
    border: '1px solid var(--green-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--green)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
};
