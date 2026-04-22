import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const roleBadgeColors = {
  admin: { bg: '#4c1d95', color: '#c4b5fd' },
  analyst: { bg: '#1e3a5f', color: '#93c5fd' },
  viewer: { bg: '#1a2e1a', color: '#86efac' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleStyle = roleBadgeColors[user?.role] || {};

  return (
    <nav style={styles.nav}>
      <h1 style={styles.logo}>⚡ SIEM</h1>
      <div style={styles.right}>
        <span style={styles.userBadge}>{user?.username}</span>
        <span style={{ ...styles.roleBadge, background: roleStyle.bg, color: roleStyle.color }}>
          {user?.role}
        </span>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { background: '#1a1d27', borderBottom: '1px solid #2d3148', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 18, color: '#6366f1', letterSpacing: 1 },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  userBadge: { background: '#2d3148', padding: '4px 12px', borderRadius: 20, fontSize: 13, color: '#94a3b8' },
  roleBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' },
  logoutBtn: { background: 'transparent', border: '1px solid #374151', color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};
