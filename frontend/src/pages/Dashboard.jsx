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
    { id: 'alerts', label: 'Alerts' },
    { id: 'logs', label: 'Logs' },
    ...(user?.role === 'admin' || user?.role === 'analyst' ? [{ id: 'agents', label: 'Agents' }] : []),
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'Users' }] : []),
  ];

  return (
    <div style={{ background: '#0f1117', minHeight: '100vh', color: '#e2e8f0' }}>
      <Navbar />

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'alerts' && <AlertsTab />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'agents' && (user?.role === 'admin' || user?.role === 'analyst') && <AgentsTab />}
        {activeTab === 'users' && user?.role === 'admin' && <UsersTab />}
      </div>
    </div>
  );
}

const styles = {
  tabs: { display: 'flex', gap: 4, padding: '16px 24px 0', borderBottom: '1px solid #2d3148', background: '#1a1d27' },
  tab: { padding: '10px 20px', cursor: 'pointer', fontSize: 14, color: '#64748b', borderBottom: '2px solid transparent' },
  tabActive: { color: '#6366f1', borderBottom: '2px solid #6366f1' },
  content: { padding: 24 },
};
