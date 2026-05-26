import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      login(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoArea}>
          <div style={s.logoMark}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.9"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.5"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.5"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.25"/>
            </svg>
          </div>
          <h1 style={s.logoText}>Sentinel</h1>
        </div>

        <p style={s.subtitle}>Security Information & Event Management</p>

        {error && (
          <div style={s.errorBanner}>
            <span style={s.errorDot} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Username</label>
            <input
              style={s.input}
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>
          <button style={loading ? s.btnLoading : s.btn} disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    background: 'var(--bg-base)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: '10px',
    padding: '40px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: 'var(--shadow-lg)',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginBottom: '32px',
    lineHeight: '1.4',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--red-subtle)',
    border: '1px solid var(--red-border)',
    color: 'var(--red)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    marginBottom: '20px',
  },
  errorDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--red)',
    flexShrink: 0,
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0' },
  field: { marginBottom: '18px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%',
    padding: '10px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
    letterSpacing: '0.01em',
  },
  btnLoading: {
    width: '100%',
    padding: '10px',
    background: 'var(--bg-subtle)',
    color: 'var(--text-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'not-allowed',
    marginTop: '8px',
  },
};
