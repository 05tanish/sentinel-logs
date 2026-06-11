import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ChangePasswordModal';

const roleColors = {
  admin:   { color: 'var(--purple)', bg: 'var(--purple-subtle)', border: 'var(--purple-border)' },
  analyst: { color: 'var(--blue)',   bg: 'var(--blue-subtle)',   border: 'var(--blue-border)'   },
  viewer:  { color: 'var(--green)',  bg: 'var(--green-subtle)',  border: 'var(--green-border)'  },
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/'); };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const rc = roleColors[user?.role] ?? roleColors.viewer;

  return (
    <>
      <header style={s.header} role="banner">
        {/* Mobile menu toggle */}
        {onMenuToggle && (
          <button
            style={s.menuToggle}
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
          >
            <HamburgerIcon />
          </button>
        )}

        {/* Right section */}
        <div style={s.right}>
          <div style={s.userArea} ref={menuRef}>
            <button
              style={s.userBtn}
              onClick={() => setShowMenu(o => !o)}
              aria-haspopup="menu"
              aria-expanded={showMenu}
              aria-label={`User menu for ${user?.username}`}
            >
              <div style={s.avatar} aria-hidden="true">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div style={s.userText}>
                <span style={s.username}>{user?.username}</span>
                <span
                  style={{ ...s.rolePill, color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}
                  aria-label={`Role: ${user?.role}`}
                >
                  {user?.role}
                </span>
              </div>
              <ChevronIcon />
            </button>

            {showMenu && (
              <div style={s.menu} role="menu" aria-label="User menu">
                <div style={s.menuHeader} role="none">
                  <div style={s.menuUsername}>{user?.username}</div>
                  <div style={s.menuRole} style={{ ...s.menuRole, color: rc.color }}>{user?.role}</div>
                </div>
                <div style={s.menuDivider} role="separator" />
                <button
                  style={s.menuItem}
                  role="menuitem"
                  onClick={() => { setShowChangePassword(true); setShowMenu(false); }}
                >
                  <KeyIcon />
                  Change password
                </button>
                <div style={s.menuDivider} role="separator" />
                <button
                  style={{ ...s.menuItem, ...s.menuItemDanger }}
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogoutIcon />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {}}
      />
    </>
  );
}

const HamburgerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
    style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="5.5" cy="6" r="3" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 7.5L12.5 7.5M10.5 7.5V9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const s = {
  header: {
    background: 'var(--bg-raised)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '0 20px',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    gap: '12px',
  },
  menuToggle: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    background: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    marginRight: 'auto',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  userArea: {
    position: 'relative',
  },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    background: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: '5px 10px 5px 6px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'border-color var(--transition-normal), background var(--transition-normal)',
  },
  avatar: {
    width: '26px',
    height: '26px',
    borderRadius: '5px',
    background: 'var(--accent-subtle)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent)',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userText: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  username: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  rolePill: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-xl)',
    minWidth: '192px',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 100,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: '13px 14px 11px',
  },
  menuUsername: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  menuRole: {
    fontSize: '11px',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  menuDivider: {
    height: '1px',
    background: 'var(--border-faint)',
  },
  menuItem: {
    width: '100%',
    padding: '9px 14px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  },
  menuItemDanger: {
    color: 'var(--red)',
  },
};
