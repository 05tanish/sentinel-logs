import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ResetPasswordModal from '../ResetPasswordModal';

const roleBadgeColors = {
  admin: { bg: '#4c1d95', color: '#c4b5fd' },
  analyst: { bg: '#1e3a5f', color: '#93c5fd' },
  viewer: { bg: '#1a2e1a', color: '#86efac' },
};

export default function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'viewer' });
  const [formError, setFormError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addUser = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/api/users', form);
      setForm({ username: '', password: '', role: 'viewer' });
      load();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create user';
      const errorDetails = err.response?.data?.errors;
      
      if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
        setFormError(`${errorMessage}: ${errorDetails.join(', ')}`);
      } else {
        setFormError(errorMessage);
      }
    }
  };

  const deactivate = async (id) => { await api.patch(`/api/users/${id}/deactivate`); load(); };
  const activate = async (id) => { await api.patch(`/api/users/${id}/activate`); load(); };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPassword(true);
  };

  const handleResetPasswordSuccess = () => {
    load();
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      <div>
        {/* Grafana link */}
        <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={styles.grafanaLink}>
          📊 Open Grafana Advanced Dashboards →
        </a>

        {/* Add user form - only for admins */}
        {isAdmin && (
          <div style={styles.formWrap}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Add New User</h3>
            {formError && <div style={styles.error}>{formError}</div>}
            <form onSubmit={addUser} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <select
                  style={styles.input}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" style={styles.addBtn}>+ Add User</button>
            </form>
          </div>
        )}

        {/* Users table */}
        <div style={styles.tableWrap}>
          <div style={styles.tableHeader}>
            <h3 style={{ fontSize: 15 }}>All Users</h3>
            <button style={styles.refreshBtn} onClick={load}>↻ Refresh</button>
          </div>

          {loading ? (
            <div style={styles.empty}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={styles.empty}>No users found</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {['ID', 'Username', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={styles.td}>{u.id}</td>
                    <td style={styles.td}>{u.username}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(roleBadgeColors[u.role] || {}) }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={styles.td}>{u.is_active ? '✅ Active' : '🔴 Inactive'}</td>
                    <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        {isAdmin && (
                          <>
                            {u.is_active ? (
                              <button
                                style={{ ...styles.actionBtn, background: '#2d1b1b', color: '#f87171' }}
                                onClick={() => deactivate(u.id)}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                style={{ ...styles.actionBtn, background: '#052e16', color: '#86efac' }}
                                onClick={() => activate(u.id)}
                              >
                                Activate
                              </button>
                            )}
                            <button
                              style={{ ...styles.actionBtn, background: '#1e3a8a', color: '#93c5fd' }}
                              onClick={() => handleResetPassword(u)}
                            >
                              Reset Password
                            </button>
                          </>
                        )}
                        {!isAdmin && u.id === currentUser?.id && (
                          <span style={styles.currentUserLabel}>You</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        onSuccess={handleResetPasswordSuccess}
        user={selectedUser}
      />
    </>
  );
}

const styles = {
  grafanaLink: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a1d27', border: '1px solid #2d3148', color: '#f97316', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, marginBottom: 24 },
  formWrap: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 10, padding: 20, marginBottom: 24 },
  form: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' },
  field: {},
  label: { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 },
  input: { width: '100%', padding: '8px 12px', background: '#0f1117', border: '1px solid #2d3148', borderRadius: 6, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  addBtn: { padding: '8px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  error: { background: '#2d1b1b', border: '1px solid #7f1d1d', color: '#fca5a5', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 },
  tableWrap: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d3148' },
  refreshBtn: { background: '#2d3148', border: 'none', color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#0f1117', padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  td: { padding: '12px 16px', fontSize: 13, borderTop: '1px solid #2d3148', color: '#e2e8f0' },
  badge: { padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 },
  actionButtons: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  actionBtn: { padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12 },
  currentUserLabel: { color: '#64748b', fontSize: 12, fontStyle: 'italic' },
  empty: { padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 },
};
