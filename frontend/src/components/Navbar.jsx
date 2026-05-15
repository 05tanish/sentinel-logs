import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ChangePasswordModal';

const roleBadgeColors = {
  admin: { bg: '#4c1d95', color: '#c4b5fd' },
  analyst: { bg: '#1e3a5f', color: '#93c5fd' },
  viewer: { bg: '#1a2e1a', color: '#86efac' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePasswordChangeSuccess = () => {
    // Password changed successfully
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleStyle = roleBadgeColors[user?.role] || {};

  return (
    <>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>⚡ SIEM</h1>
        <div style={styles.right}>
          <span style={styles.userBadge}>{user?.username}</span>
          <span style={{ ...styles.roleBadge, background: roleStyle.bg, color: roleStyle.color }}>
            {user?.role}
          </span>
          
          <div style={styles.userMenuContainer} ref={menuRef}>
            <button 
              style={styles.userMenuBtn} 
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              ⚙️
            </button>
            
            {showUserMenu && (
              <div style={styles.userMenu}>
                <button 
                  style={styles.menuItem}
                  onClick={() => {
                    setShowChangePassword(true);
                    setShowUserMenu(false);
                  }}
                >
                  🔑 Change Password
                </button>
                <button 
                  style={styles.menuItem}
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
}

const styles = {
  nav: { background: '#1a1d27', borderBottom: '1px solid #2d3148', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 18, color: '#6366f1', letterSpacing: 1 },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  userBadge: { background: '#2d3148', padding: '4px 12px', borderRadius: 20, fontSize: 13, color: '#94a3b8' },
  roleBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' },
  userMenuContainer: { position: 'relative' },
  userMenuBtn: { 
    background: 'transparent', 
    border: '1px solid #374151', 
    color: '#94a3b8', 
    padding: '6px 10px', 
    borderRadius: 6, 
    cursor: 'pointer', 
    fontSize: 16 
  },
  userMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    background: '#1a1d27',
    border: '1px solid #2d3148',
    borderRadius: 8,
    minWidth: 160,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 100
  },
  menuItem: {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    color: '#e2e8f0',
    fontSize: 14,
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 0
  }
};
