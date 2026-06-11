import { useAuth } from '../context/AuthContext';

const NAV_ICONS = {
  alerts: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L13.5 12H2.5L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M8 6V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="8" cy="10.5" r="0.65" fill="currentColor"/>
    </svg>
  ),
  logs: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 6h6M5 8.5h4.5M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  agents: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="4.5" width="5" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9.5" y="4.5" width="5" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6.5 8H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2.5 13c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
};

export default function Sidebar({ tabs, activeTab, onTabChange, open, isMobile }) {
  const style = {
    ...s.sidebar,
    ...(isMobile ? s.sidebarMobile : {}),
    ...(isMobile && open ? s.sidebarMobileOpen : {}),
    ...(isMobile && !open ? s.sidebarMobileClosed : {}),
  };

  return (
    <aside style={style} aria-label="Main navigation">
      {/* Logo */}
      <div style={s.logoArea}>
        <div style={s.logoMark} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.95"/>
            <rect x="11" y="2" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.55"/>
            <rect x="2" y="11" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.55"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.25"/>
          </svg>
        </div>
        <span style={s.logoText}>Sentinel</span>
      </div>

      {/* Section label */}
      <div style={s.sectionLabel} aria-hidden="true">Menu</div>

      {/* Navigation */}
      <nav style={s.nav} role="navigation" aria-label="Main navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              style={{ ...s.navItem, ...(isActive ? s.navItemActive : {}) }}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && <span style={s.activeBar} aria-hidden="true" />}
              <span style={{ ...s.navIcon, ...(isActive ? s.navIconActive : {}) }}>
                {NAV_ICONS[tab.icon]}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom user info */}
      <div style={s.bottomArea}>
        <div style={s.bottomDivider} />
        <SidebarUser />
      </div>
    </aside>
  );
}

function SidebarUser() {
  const { user } = useAuth();

  return (
    <div style={s.userInfo} aria-label={`Signed in as ${user?.username}`}>
      <div style={s.avatar} aria-hidden="true">
        {user?.username?.[0]?.toUpperCase() ?? 'U'}
      </div>
      <div style={s.userMeta}>
        <div style={s.userName}>{user?.username}</div>
        <div style={s.userRole}>{user?.role}</div>
      </div>
    </div>
  );
}

const s = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 220,
    background: 'var(--bg-raised)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 40,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sidebarMobile: {
    transform: 'translateX(-100%)',
    transition: 'transform 200ms ease',
    boxShadow: 'var(--shadow-xl)',
  },
  sidebarMobileOpen: {
    transform: 'translateX(0)',
  },
  sidebarMobileClosed: {
    transform: 'translateX(-100%)',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '18px 16px 12px',
    borderBottom: '1px solid var(--border-faint)',
    marginBottom: '4px',
    flexShrink: 0,
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--text-disabled)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '10px 18px 4px',
    userSelect: 'none',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px 8px 8px',
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px 8px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-tertiary)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
    letterSpacing: '0.01em',
    overflow: 'hidden',
  },
  navItemActive: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'var(--text-tertiary)',
    transition: 'color var(--transition-fast)',
  },
  navIconActive: {
    color: 'var(--accent)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '18px',
    background: 'var(--accent)',
    borderRadius: '0 2px 2px 0',
  },
  bottomArea: {
    padding: '0 8px 12px',
    flexShrink: 0,
  },
  bottomDivider: {
    height: '1px',
    background: 'var(--border-faint)',
    margin: '8px 8px 10px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-app)',
    border: '1px solid var(--border-faint)',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'var(--accent-subtle)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent)',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    letterSpacing: '0.02em',
  },
  userMeta: {
    minWidth: 0,
    flex: 1,
  },
  userName: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    textTransform: 'capitalize',
    marginTop: '1px',
  },
};
