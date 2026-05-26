import { useEffect, useState } from 'react';
import api from '../../api/axios';
import * as ui from '../ui';

export default function AgentsTab() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/agent/status');
      setAgents(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusInfo = (agent) => {
    if (agent.status === 'offline') return { label: 'Offline', color: 'var(--red)',    dot: 'var(--red)'    };
    if (agent.seconds_ago > 120)   return { label: 'Stale',   color: 'var(--yellow)', dot: 'var(--yellow)' };
    return                                 { label: 'Online',  color: 'var(--green)',  dot: 'var(--green)'  };
  };

  const fmtLastSeen = (sec) => {
    if (sec < 60)   return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  };

  return (
    <div>
      <div style={ui.card}>
        <div style={ui.tableHeader}>
          <span style={ui.tableTitle}>Agents</span>
          <button style={ui.btnGhost} onClick={load}>
            <RefreshIcon /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={ui.emptyState}>Loading…</div>
        ) : agents.length === 0 ? (
          <div style={ui.emptyState}>No agents registered</div>
        ) : (
          <table>
            <thead>
              <tr>
                {['Status', 'Source', 'Hostname', 'Platform', 'Last seen'].map((h) => (
                  <th key={h} style={ui.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => {
                const st = statusInfo(a);
                return (
                  <tr key={a.source}>
                    <td style={ui.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ ...s.dot, background: st.dot }} />
                        <span style={{ color: st.color, fontSize: '12px', fontWeight: '600' }}>
                          {st.label}
                        </span>
                      </div>
                    </td>
                    <td style={ui.tdPrimary}>{a.source}</td>
                    <td style={ui.td}>{a.hostname || <Dash />}</td>
                    <td style={ui.td}>{a.platform || <Dash />}</td>
                    <td style={{ ...ui.td, color: st.color, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
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

const Dash = () => <span style={{ color: 'var(--text-disabled)' }}>—</span>;

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 3.5 2.1M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const s = {
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
  },
};
