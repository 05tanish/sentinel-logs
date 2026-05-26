import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AlertsTab from '../components/tabs/AlertsTab';
import LogsTab from '../components/tabs/LogsTab';
import UsersTab from '../components/tabs/UsersTab';
import AgentsTab from '../components/tabs/AgentsTab';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('alerts');

  const tabs = [
    { id: 'alerts',  label: 'Alerts'  },
    { id: 'logs',    label: 'Logs'    },
    ...(user?.role === 'admin' || user?.role === 'analyst' ? [{ id: 'agents', label: 'Agents' }] : []),
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'Users' }] : []),
  ];

  return (
    <div style={s.page}>
      <Navbar />

      {/* Tab bar */}
      <div style={s.tabBar}>
        <div style={s.tabList}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && <span style={s.tabIndicator} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={s.content}>
        {activeTab === 'alerts' && <AlertsTab />}
        {activeTab === 'logs'   && <LogsTab />}
        {activeTab === 'agents' && (user?.role === 'admin' || user?.role === 'analyst') && <AgentsTab />}
        {activeTab === 'users'  && user?.role === 'admin' && <UsersTab />}
      </main>
    </div>
  );
}

const s = {
  page: {
    background: 'var(--bg-base)',
    minHeight: '100vh',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  tabBar: {
    background: 'var(--bg-raised)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '0 24px',
  },
  tabList: {
    display: 'flex',
    gap: '0',
  },
  tab: {
    position: 'relative',
    padding: '13px 16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'color 0.15s',
  },
  tabActive: {
    color: 'var(--text-primary)',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: '-1px',
    left: '16px',
    right: '16px',
    height: '2px',
    background: 'var(--accent)',
    borderRadius: '2px 2px 0 0',
    display: 'block',
  },
  content: {
    padding: '28px 24px',
    flex: 1,
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
  },
};
