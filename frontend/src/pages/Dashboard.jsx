import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AlertsTab from '../components/tabs/AlertsTab';
import LogsTab from '../components/tabs/LogsTab';
import UsersTab from '../components/tabs/UsersTab';
import AgentsTab from '../components/tabs/AgentsTab';

const SIDEBAR_WIDTH = 220;

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('alerts');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const tabs = [
    { id: 'alerts', label: 'Alerts',  icon: 'alerts'  },
    { id: 'logs',   label: 'Logs',    icon: 'logs'    },
    ...(user?.role === 'admin' || user?.role === 'analyst'
      ? [{ id: 'agents', label: 'Agents', icon: 'agents' }]
      : []),
    ...(user?.role === 'admin'
      ? [{ id: 'users', label: 'Users', icon: 'users' }]
      : []),
  ];

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label ?? '';

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        open={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          style={s.mobileOverlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main column */}
      <div style={{ ...s.main, marginLeft: isMobile ? 0 : SIDEBAR_WIDTH }}>
        <Navbar onMenuToggle={isMobile ? () => setSidebarOpen(o => !o) : undefined} />

        {/* Page header */}
        <div style={s.pageHeader}>
          <h2 style={s.pageTitle}>{activeTabLabel}</h2>
        </div>

        {/* Tab content */}
        <main style={s.content} id="main-content" aria-label={`${activeTabLabel} section`}>
          {activeTab === 'alerts' && <AlertsTab />}
          {activeTab === 'logs'   && <LogsTab />}
          {activeTab === 'agents' && (user?.role === 'admin' || user?.role === 'analyst') && <AgentsTab />}
          {activeTab === 'users'  && user?.role === 'admin' && <UsersTab />}
        </main>
      </div>
    </div>
  );
}

const s = {
  root: {
    display: 'flex',
    height: '100vh',
    background: 'var(--bg-app)',
    overflow: 'hidden',
    position: 'relative',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    transition: 'margin-left 200ms ease',
  },
  pageHeader: {
    padding: '18px 28px 16px',
    borderBottom: '1px solid var(--border-faint)',
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.2px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 28px',
  },
  mobileOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 39,
  },
};
