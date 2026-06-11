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
  const [formSuccess, setFormSuccess] = useState('');
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

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const addUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      await api.post('/api/users', form);
      setForm({ username: '', password: '', role: 'viewer' });
      setFormSuccess(`User "${form.username}" created successfully.`);
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
      <div style={s.root}>
        {/* Grafana link */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          style={s.grafanaLink}
          aria-label="Open Grafana dashboards (opens in new tab)"
        >
          <GrafanaIcon />
          <span>Open Grafana dashboards</span>
          <ExternalIcon />
        </a>

        {/* Add user form */}
        {isAdmin && (
          <div style={{ ...ui.card, marginBottom: '0' }}>
            <div style={ui.tableHeader}>
              <span style={ui.tableTitle}>Add user</span>
            </div>
            <div style={s.formBody}>
              {formError && (
                <div style={ui.errorBanner} role="alert">
                  <ErrorIcon />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div style={s.successBanner} role="status" aria-live="polite">
                  <SuccessIcon />
                  <span>{formSuccess}</span>
                </div>
              )}
              <form onSubmit={addUser} style={s.formGrid} aria-label="Add new user">
                <div>
                  <label style={ui.label} htmlFor="new-username">Username</label>
                  <input
                    id="new-username"
                    style={ui.input}
                    type="text"
                    placeholder="e.g. jdoe"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    autoComplete="off"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label style={ui.label} htmlFor="new-password">Password</label>
                  <input
                    id="new-password"
                    style={ui.input}
                    type="password"
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="new-password"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label style={ui.label} htmlFor="new-role">Role</label>
                  <select
                    id="new-role"
                    style={ui.select}
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    aria-label="Select user role"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={s.formSubmit}>
                  <button type="submit" style={ui.btnPrimary}>
                    <PlusIcon /> Add user
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users table */}
        <div style={ui.card}>
          <div style={ui.tableHeader}>
            <div>
              <span style={ui.tableTitle}>All users</span>
              {!loading && users.length > 0 && (
                <span style={s.countPill}>{users.length}</span>
              )}
            </div>
            <button style={ui.btnGhost} onClick={load} aria-label="Refresh users list">
              <RefreshIcon /> Refresh
            </button>
          </div>

          {loading ? (
            <LoadingState />
          ) : users.length === 0 ? (
            <EmptyState />
          ) : (
            <table aria-label="Users table">
              <thead>
                <tr>
                  {['Username', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} style={ui.th} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={ui.tdPrimary}>
                      <div style={s.userCell}>
                        <div style={s.userAvatar} aria-hidden="true">
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={s.usernameText}>
                            {u.username}
                            {u.id === currentUser?.id && (
                              <span style={s.youTag} aria-label="This is your account">you</span>
                            )}
                          </div>
                          <div style={s.userIdText}>#{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={ui.td}>
                      <span style={ui.roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td style={ui.td}>
                      <div style={s.statusCell} aria-label={`Status: ${u.is_active ? 'Active' : 'Inactive'}`}>
                        <span
                          style={{ ...s.statusDot, background: u.is_active ? 'var(--green)' : 'var(--text-disabled)' }}
                          aria-hidden="true"
                        />
                        <span style={{ color: u.is_active ? 'var(--green)' : 'var(--text-tertiary)', fontSize: '12px', fontWeight: '500' }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...ui.td, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td style={ui.td}>
                      {isAdmin ? (
                        <div style={s.rowActions}>
                          {u.is_active ? (
                            <button
                              style={ui.btnDanger}
                              onClick={() => deactivate(u.id)}
                              aria-label={`Deactivate ${u.username}`}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              style={ui.btnSuccess}
                              onClick={() => activate(u.id)}
                              aria-label={`Activate ${u.username}`}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            style={ui.btnGhost}
                            onClick={() => { setSelectedUser(u); setShowResetPassword(true); }}
                            aria-label={`Reset password for ${u.username}`}
                          >
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

const LoadingState = () => (
  <div style={ui.emptyState} role="status" aria-live="polite">
    <SpinnerIcon />
    <div style={{ marginTop: '12px' }}>Loading users…</div>
  </div>
);

const EmptyState = () => (
  <div style={ui.emptyState} role="status">
    <UsersIcon />
    <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>No users found</div>
  </div>
);

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 3.5 2.1M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 4.5V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="7" cy="9" r="0.65" fill="currentColor"/>
  </svg>
);

const SuccessIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4.5 7L6.5 9L9.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
    style={{ animation: 'spinUsers 0.8s linear infinite' }} aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="var(--border-strong)" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="7.5" stroke="var(--accent)" strokeWidth="1.5"
      strokeLinecap="round" strokeDasharray="35" strokeDashoffset="25"/>
    <style>{`@keyframes spinUsers { to { transform: rotate(360deg); transform-origin: center; } }`}</style>
  </svg>
);

const UsersIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="7" r="3" stroke="var(--text-disabled)" strokeWidth="1.5"/>
    <path d="M3 19c0-3.314 2.686-6 6-6" stroke="var(--text-disabled)" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="16" cy="8" r="2.5" stroke="var(--text-disabled)" strokeWidth="1.3"/>
    <path d="M13 19c0-2.762 1.343-5 3-5s3 2.238 3 5" stroke="var(--text-disabled)" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const GrafanaIcon = () => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M3 9l2.5-3L8 8l1.5-2L11 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ marginLeft: 'auto' }} aria-hidden="true">
    <path d="M2 9L9 2M9 2H5M9 2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  grafanaLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)',
    padding: '9px 14px',
    borderRadius: 'var(--radius-lg)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'border-color var(--transition-normal), color var(--transition-normal)',
    alignSelf: 'flex-start',
  },
  formBody: {
    padding: '18px 20px 20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr auto',
    gap: '12px',
    alignItems: 'start',
  },
  formSubmit: {
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: '0',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '9px',
    background: 'var(--green-subtle)',
    border: '1px solid var(--green-border)',
    color: 'var(--green)',
    padding: '10px 13px',
    borderRadius: 'var(--radius-lg)',
    fontSize: '13px',
    lineHeight: '1.5',
    marginBottom: '14px',
  },
  countPill: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-tertiary)',
    fontSize: '11px',
    fontWeight: '600',
    padding: '1px 7px',
    borderRadius: '20px',
    marginLeft: '8px',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  usernameText: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  userIdText: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    marginTop: '1px',
  },
  youTag: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--accent)',
    background: 'var(--accent-subtle)',
    border: '1px solid var(--accent-border)',
    borderRadius: '3px',
    padding: '1px 5px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  rowActions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
};
