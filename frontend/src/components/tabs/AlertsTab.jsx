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

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const ack     = async (id) => { await api.patch(`/api/alerts/${id}/acknowledge`); load(); };
  const resolve = async (id) => { await api.patch(`/api/alerts/${id}/resolve`);     load(); };

  const download = async (format) => {
    try {
      const res = await api.get(`/api/reports/${format}`, { responseType: 'blob' });
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
    {
      label: 'Open',
      value: stats?.open,
      accent: 'var(--text-primary)',
      sub: 'Total unresolved',
    },
    {
      label: 'Critical',
      value: stats?.critical,
      accent: 'var(--red)',
      sub: 'Immediate action',
    },
    {
      label: 'High',
      value: stats?.high,
      accent: 'var(--orange)',
      sub: 'Needs attention',
    },
    {
      label: 'Medium',
      value: stats?.medium,
      accent: 'var(--yellow)',
      sub: 'Review soon',
    },
    {
      label: 'Last 24h',
      value: stats?.last_24h,
      accent: 'var(--blue)',
      sub: 'Recent activity',
    },
  ];

  const columns = ['Time', 'Type', 'Severity', 'Source IP', 'Username', 'Description'];
  if (canAct) columns.push('Actions');

  return (
    <div style={s.root}>
      {/* Stats row */}
      <div style={s.statsGrid} role="list" aria-label="Alert statistics">
        {statItems.map((item) => (
          <div key={item.label} style={s.statCard} role="listitem">
            <div style={s.statHeader}>
              <span style={s.statLabel}>{item.label}</span>
              <span style={s.statSub}>{item.sub}</span>
            </div>
            <div style={{ ...s.statValue, color: item.accent }}>
              {item.value != null
                ? item.value.toLocaleString()
                : <span style={{ color: 'var(--text-disabled)', fontSize: '20px' }}>—</span>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Alerts table */}
      <div style={ui.card}>
        <div style={ui.tableHeader}>
          <div>
            <span style={ui.tableTitle}>Open Alerts</span>
            {!loading && alerts.length > 0 && (
              <span style={s.countPill}>{alerts.length}</span>
            )}
          </div>
          <div style={s.actions}>
            <button style={s.exportBtn} onClick={() => download('csv')} aria-label="Export as CSV">
              <DownloadIcon /> CSV
            </button>
            <button style={s.exportBtn} onClick={() => download('pdf')} aria-label="Export as PDF">
              <DownloadIcon /> PDF
            </button>
            <button style={ui.btnGhost} onClick={load} aria-label="Refresh alerts">
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : alerts.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table aria-label="Open alerts table">
              <thead>
                <tr>
                  {columns.map((h) => (
                    <th key={h} style={ui.th} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ ...ui.td, ...s.timeCell }}>
                      {fmtDate(a.detected_at)}
                    </td>
                    <td style={ui.td}>
                      <span style={ui.typeBadge(a.type)}>
                        {a.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={ui.td}>
                      <span style={ui.severityBadge(a.severity)}>{a.severity}</span>
                    </td>
                    <td style={{ ...ui.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {a.source_ip ?? <Dash />}
                    </td>
                    <td style={ui.td}>{a.username ?? <Dash />}</td>
                    <td style={{ ...ui.td, maxWidth: '320px' }}>
                      <span style={s.descText} title={a.description}>{a.description}</span>
                    </td>
                    {canAct && (
                      <td style={{ ...ui.td, whiteSpace: 'nowrap' }}>
                        <div style={s.rowActions}>
                          {!a.acknowledged && (
                            <button
                              style={s.ackBtn}
                              onClick={() => ack(a.id)}
                              aria-label={`Acknowledge alert ${a.id}`}
                            >
                              Ack
                            </button>
                          )}
                          <button
                            style={s.resolveBtn}
                            onClick={() => resolve(a.id)}
                            aria-label={`Resolve alert ${a.id}`}
                          >
                            Resolve
                          </button>
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

const LoadingState = () => (
  <div style={ui.emptyState} role="status" aria-live="polite">
    <SpinnerIcon />
    <div style={{ marginTop: '12px' }}>Loading alerts…</div>
  </div>
);

const EmptyState = () => (
  <div style={ui.emptyState} role="status">
    <CheckCircleIcon />
    <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>All clear</div>
    <div style={{ marginTop: '4px', fontSize: '12px' }}>No open alerts at this time</div>
  </div>
);

const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
};

const Dash = () => <span style={{ color: 'var(--text-disabled)' }}>—</span>;

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 3.5 2.1M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 2v6M3.5 5.5L6 8l2.5-2.5M2 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="var(--border-strong)" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="7.5" stroke="var(--accent)" strokeWidth="1.5"
      strokeLinecap="round" strokeDasharray="35" strokeDashoffset="25"/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); transform-origin: center; } }`}</style>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="var(--green)" strokeWidth="1.5" opacity="0.4"/>
    <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
  },
  statCard: {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-xl)',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    userSelect: 'none',
  },
  statSub: {
    fontSize: '11px',
    color: 'var(--text-disabled)',
    letterSpacing: '0.01em',
  },
  statValue: {
    fontSize: '30px',
    fontWeight: '700',
    letterSpacing: '-0.6px',
    lineHeight: 1,
  },
  countPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-tertiary)',
    fontSize: '11px',
    fontWeight: '600',
    padding: '1px 7px',
    borderRadius: '20px',
    marginLeft: '8px',
    letterSpacing: '0.02em',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
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
  timeCell: {
    whiteSpace: 'nowrap',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-tertiary)',
  },
  descText: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '320px',
  },
  rowActions: {
    display: 'flex',
    gap: '6px',
  },
  ackBtn: {
    padding: '3px 10px',
    background: 'var(--blue-subtle)',
    border: '1px solid var(--blue-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--blue)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  resolveBtn: {
    padding: '3px 10px',
    background: 'var(--green-subtle)',
    border: '1px solid var(--green-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--green)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
};
