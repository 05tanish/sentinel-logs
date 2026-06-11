import { useEffect, useState } from 'react';
import api from '../../api/axios';
import * as ui from '../ui';

export default function AgentsTab() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/agent/status');
      setAgents(res.data.data || []);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusInfo = (agent) => {
    if (agent.status === 'offline') {
      return { label: 'Offline', color: 'var(--red)',    dot: 'var(--red)'    };
    }
    if (agent.seconds_ago > 120) {
      return { label: 'Stale',   color: 'var(--yellow)', dot: 'var(--yellow)' };
    }
    return { label: 'Online', color: 'var(--green)', dot: 'var(--green)' };
  };

  const fmtLastSeen = (sec) => {
    if (sec < 60)   return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  };

  const onlineCount  = agents.filter(a => a.status !== 'offline' && a.seconds_ago <= 120).length;
  const staleCount   = agents.filter(a => a.status !== 'offline' && a.seconds_ago > 120).length;
  const offlineCount = agents.filter(a => a.status === 'offline').length;

  return (
    <div style={s.root}>
      {/* Summary row */}
      {agents.length > 0 && (
        <div style={s.summaryRow} role="list" aria-label="Agent status summary">
          <SummaryCard label="Online" value={onlineCount} color="var(--green)" bg="var(--green-subtle)" border="var(--green-border)" />
          <SummaryCard label="Stale"  value={staleCount}  color="var(--yellow)" bg="var(--yellow-subtle)" border="var(--yellow-border)" />
          <SummaryCard label="Offline" value={offlineCount} color="var(--red)" bg="var(--red-subtle)" border="var(--red-border)" />
        </div>
      )}

      {/* Agents table */}
      <div style={ui.card}>
        <div style={ui.tableHeader}>
          <div>
            <span style={ui.tableTitle}>Registered Agents</span>
            {!loading && agents.length > 0 && (
              <span style={s.countPill}>{agents.length} total</span>
            )}
          </div>
          <div style={s.headerRight}>
            {lastRefresh && (
              <span style={s.refreshTime} aria-label={`Last refreshed at ${lastRefresh.toLocaleTimeString()}`}>
                Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            )}
            <button style={ui.btnGhost} onClick={load} aria-label="Refresh agent status">
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : agents.length === 0 ? (
          <EmptyState />
        ) : (
          <table aria-label="Registered agents table">
            <thead>
              <tr>
                {['Status', 'Source', 'Hostname', 'Platform', 'Last seen'].map((h) => (
                  <th key={h} style={ui.th} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => {
                const st = statusInfo(a);
                return (
                  <tr key={a.source}>
                    <td style={ui.td}>
                      <div style={s.statusCell}>
                        <span style={{ ...s.statusDot, background: st.dot }} aria-hidden="true" />
                        <span style={{ color: st.color, fontSize: '12px', fontWeight: '600' }}>
                          {st.label}
                        </span>
                      </div>
                    </td>
                    <td style={ui.tdPrimary}>{a.source}</td>
                    <td style={ui.td}>{a.hostname ?? <Dash />}</td>
                    <td style={ui.td}>{a.platform ?? <Dash />}</td>
                    <td style={{ ...ui.td, fontFamily: 'var(--font-mono)', fontSize: '12px', color: st.color }}>
                      {fmtLastSeen(a.seconds_ago)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const SummaryCard = ({ label, value, color, bg, border }) => (
  <div
    style={{ ...s.summaryCard, background: bg, borderColor: border }}
    role="listitem"
    aria-label={`${value} agents ${label.toLowerCase()}`}
  >
    <div style={{ ...s.summaryValue, color }}>{value}</div>
    <div style={{ ...s.summaryLabel, color }}>{label}</div>
  </div>
);

const LoadingState = () => (
  <div style={ui.emptyState} role="status" aria-live="polite">
    <SpinnerIcon />
    <div style={{ marginTop: '12px' }}>Loading agents…</div>
  </div>
);

const EmptyState = () => (
  <div style={ui.emptyState} role="status">
    <AgentIcon />
    <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
      No agents registered
    </div>
    <div style={{ marginTop: '4px', fontSize: '12px' }}>
      Install the Sentinel agent on your monitored hosts
    </div>
  </div>
);

const Dash = () => <span style={{ color: 'var(--text-disabled)' }}>—</span>;

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 3.5 2.1M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
    style={{ animation: 'spinAgent 0.8s linear infinite' }} aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="var(--border-strong)" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="7.5" stroke="var(--accent)" strokeWidth="1.5"
      strokeLinecap="round" strokeDasharray="35" strokeDashoffset="25"/>
    <style>{`@keyframes spinAgent { to { transform: rotate(360deg); transform-origin: center; } }`}</style>
  </svg>
);

const AgentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="7" width="7" height="10" rx="2" stroke="var(--text-disabled)" strokeWidth="1.5"/>
    <rect x="14" y="7" width="7" height="10" rx="2" stroke="var(--text-disabled)" strokeWidth="1.5"/>
    <path d="M10 12h4" stroke="var(--text-disabled)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryRow: {
    display: 'flex',
    gap: '12px',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    border: '1px solid',
    borderRadius: 'var(--radius-xl)',
    minWidth: '120px',
  },
  summaryValue: {
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.4px',
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  countPill: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-tertiary)',
    fontSize: '11px',
    fontWeight: '500',
    padding: '1px 7px',
    borderRadius: '20px',
    marginLeft: '8px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  refreshTime: {
    fontSize: '11px',
    color: 'var(--text-disabled)',
    fontFamily: 'var(--font-mono)',
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
  },
};
