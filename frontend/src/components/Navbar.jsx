import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ChangePasswordModal';

const roleColors = {
  admin:   { color: 'var(--purple)', bg: 'var(--purple-subtle)', border: 'var(--purple-border)' },
  analyst: { color: 'var(--blue)',   bg: 'var(--blue-subtle)',   border: 'var(--blue-border)'   },
  viewer:  { color: 'var(--green)',  bg: 'var(--green-subtle)',  border: 'var(--green-border)'  },
};

export default function Navbar() {
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

  const rc = roleColors[user?.role] || roleColors.viewer;

  return (
    <>
      <nav style={s.nav}>
        {/* Left: Logo */}
        <div style={s.logoArea}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
            <rect x="2" y="2" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.9"/>
            <rect x="11" y="2" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.5"/>
            <rect x="2" y="11" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.5"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.25"/>
          </svg>
          <span style={s.logoText}>Sentinel</span>
        </div>

        {/* Right: User info */}
        <div style={s.right}>
          <div style={s.userInfo} ref={menuRef}>
            <button style={s.userBtn} onClick={() => setShowMenu(!showMenu)}>
              <span style={s.username}>{user?.username}</span>
              <span style={{ ...s.rolePill, color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}>
                {user?.role}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showMenu && (
              <div style={s.menu}>
                <div style={s.menuHeader}>
                  <div style={s.menuUsername}>{user?.username}</div>
                  <div style={s.menuRole}>{user?.role}</div>
                </div>
                <div style={s.menuDivider} />
                <button style={s.menuItem} onClick={() => { setShowChangePassword(true); setShowMenu(false); }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1a3 3 0 0 0-3 3v1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm-2 4V4a2 2 0 1 1 4 0v1H5z" fill="currentColor" opacity="0.7"/></svg>
                  Change password
                </button>
                <button style={{ ...s.menuItem, color: 'var(--red)' }} onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {}}
      />
    </>
  );
}

const s = {
  nav: {
    background: 'var(--bg-raised)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '0 24px',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },
  logoText: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.2px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: { position: 'relative' },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: '5px 10px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'border-color 0.15s, background 0.15s',
  },
  username: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  rolePill: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 7px',
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
    borderRadius: 'var(--radius-lg)',
    minWidth: '180px',
    boxShadow: 'var(--shadow-md)',
    zIndex: 100,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: '12px 14px 10px',
  },
  menuUsername: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  menuRole: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    marginTop: '2px',
    textTransform: 'capitalize',
  },
  menuDivider: {
    height: '1px',
    background: 'var(--border-subtle)',
    margin: '0',
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
    gap: '9px',
    transition: 'background 0.1s, color 0.1s',
  },
};
