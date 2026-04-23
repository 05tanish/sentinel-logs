import { useEffect, useState } from 'react';
import api from '../../api/axios';

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
    // refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (agent) => {
    if (agent.status === 'offline') return '#f87171';
    if (agent.seconds_ago > 120) return '#fbbf24'; // warning if > 2 min
    return '#34d399'; // green
  };

  const formatLastSeen = (seconds) => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div>
      <div style={styles.tableWrap}>
        <div style={styles.tableHeader}>
          <h3 style={{ fontSize: 15 }}>Agent Status</h3>
          <button style={styles.refreshBtn} onClick={load}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : agents.length === 0 ? (
          <div style={styles.empty}>No agents registered yet</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Status', 'Source', 'Hostname', 'Platform', 'Last Seen'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.source}>
                  <td style={styles.td}>
                    <span style={{ color: getStatusColor(a), fontWeight: 700 }}>
                      ● {a.status === 'offline' ? 'OFFLINE' : 'Online'}
                    </span>
                  </td>
                  <td style={styles.td}>{a.source}</td>
                  <td style={styles.td}>{a.hostname || '—'}</td>
                  <td style={styles.td}>{a.platform || '—'}</td>
                  <td style={{ ...styles.td, color: getStatusColor(a) }}>
                    {formatLastSeen(a.seconds_ago)}
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
  tableWrap: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d3148' },
  refreshBtn: { background: '#2d3148', border: 'none', color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#0f1117', padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  td: { padding: '12px 16px', fontSize: 13, borderTop: '1px solid #2d3148', color: '#e2e8f0' },
  empty: { padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 },
};
