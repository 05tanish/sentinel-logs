import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ResetPasswordModal from '../ResetPasswordModal';
import * as ui from '../ui';

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
      const msg = err.response?.data?.message || 'Failed to create user';
      const details = err.response?.data?.errors;
      setFormError(details?.length ? `${msg}: ${details.join(', ')}` : msg);
    }
  };

  const deactivate = async (id) => { await api.patch(`/api/users/${id}/deactivate`); load(); };
  const activate   = async (id) => { await api.patch(`/api/users/${id}/activate`);   load(); };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      <div>
        {/* Grafana link */}
        <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={s.grafanaLink}>
          <GrafanaIcon />
          Open Grafana dashboards
          <ExternalIcon />
        </a>

        {/* Add user form */}
        {isAdmin && (
          <div style={{ ...ui.card, marginBottom: '20px' }}>
            <div style={ui.tableHeader}>
              <span style={ui.tableTitle}>Add user</span>
            </div>
            <div style={s.formBody}>
              {formError && (
                <div style={s.formError}>
                  <span style={s.errorDot} />
                  {formError}
                </div>
              )}
              <form onSubmit={addUser} style={s.formGrid}>
                <div>
                  <label style={ui.label}>Username</label>
                  <input style={ui.input} type="text" placeholder="username" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div>
                  <label style={ui.label}>Password</label>
                  <input style={ui.input} type="password" placeholder="min 8 characters" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div>
                  <label style={ui.label}>Role</label>
                  <select style={ui.input} value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="viewer">Viewer</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={ui.btnPrimary}>Add user</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users table */}
        <div style={ui.card}>
          <div style={ui.tableHeader}>
            <span style={ui.tableTitle}>All users</span>
            <button style={ui.btnGhost} onClick={load}>
              <RefreshIcon /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={ui.emptyState}>Loading…</div>
          ) : users.length === 0 ? (
            <div style={ui.emptyState}>No users found</div>
          ) : (
            <table>
              <thead>
                <tr>
                  {['ID', 'Username', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} style={ui.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ ...ui.td, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.id}</td>
                    <td style={ui.tdPrimary}>
                      {u.username}
                      {u.id === currentUser?.id && <span style={s.youTag}>you</span>}
                    </td>
                    <td style={ui.td}>
                      <span style={ui.roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td style={ui.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ ...s.statusDot, background: u.is_active ? 'var(--green)' : 'var(--text-disabled)' }} />
                        <span style={{ color: u.is_active ? 'var(--green)' : 'var(--text-tertiary)', fontSize: '12px', fontWeight: '500' }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...ui.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={ui.td}>
                      {isAdmin ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {u.is_active ? (
                            <button style={ui.btnDanger} onClick={() => deactivate(u.id)}>Deactivate</button>
                          ) : (
                            <button style={ui.btnSuccess} onClick={() => activate(u.id)}>Activate</button>
                          )}
                          <button style={ui.btnGhost} onClick={() => { setSelectedUser(u); setShowResetPassword(true); }}>
                            Reset password
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-disabled)', fontSize: '12px' }}>—</span>
                      )}
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
        onSuccess={load}
        user={selectedUser}
      />
    </>
  );
}

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 3.5 2.1M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GrafanaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M3 9l2.5-3L8 8l1.5-2L11 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ marginLeft: 'auto' }}>
    <path d="M2 9L9 2M9 2H5M9 2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const s = {
  grafanaLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '20px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  formBody: {
    padding: '16px 20px 20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr auto',
    gap: '12px',
    alignItems: 'start',
  },
  formError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--red-subtle)',
    border: '1px solid var(--red-border)',
    color: 'var(--red)',
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '12px',
    marginBottom: '14px',
  },
  errorDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--red)',
    flexShrink: 0,
  },
  youTag: {
    marginLeft: '7px',
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-default)',
    borderRadius: '3px',
    padding: '1px 5px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    verticalAlign: 'middle',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
};
