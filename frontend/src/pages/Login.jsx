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
      setError(err.response?.data?.message || 'Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Background grid pattern */}
      <div style={s.bgPattern} aria-hidden="true" />

      <div style={s.container}>
        {/* Logo */}
        <div style={s.logoArea}>
          <div style={s.logoMark} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.95"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.55"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.55"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="var(--accent)" opacity="0.25"/>
            </svg>
          </div>
          <span style={s.logoText}>Sentinel</span>
        </div>

        {/* Card */}
        <div style={s.card} role="main">
          <div style={s.cardHeader}>
            <h1 style={s.heading}>Sign in to your account</h1>
            <p style={s.subheading}>Security Information &amp; Event Management</p>
          </div>

          {error && (
            <div style={s.errorBanner} role="alert" aria-live="polite">
              <AlertIcon />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form} noValidate>
            <div style={s.field}>
              <label style={s.label} htmlFor="login-username">Username</label>
              <input
                id="login-username"
                style={s.input}
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                autoFocus
                required
                aria-required="true"
              />
            </div>

            <div style={s.field}>
              <label style={s.label} htmlFor="login-password">Password</label>
              <input
                id="login-password"
                style={s.input}
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
                aria-required="true"
              />
            </div>

            <button
              style={loading ? s.btnLoading : s.btn}
              disabled={loading}
              type="submit"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p style={s.footer}>
          Authorized personnel only. All activity is monitored and logged.
        </p>
      </div>
    </div>
  );
}

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
    <path d="M7 1.5L12.5 11H1.5L7 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="7" cy="9.5" r="0.6" fill="currentColor"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeDasharray="26" strokeDashoffset="18" opacity="0.85"/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const s = {
  page: {
    background: 'var(--bg-app)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(var(--border-faint) 1px, transparent 1px),
      linear-gradient(90deg, var(--border-faint) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
    opacity: 0.5,
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    position: 'relative',
    zIndex: 1,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '19px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.4px',
  },
  card: {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-2xl)',
    padding: '32px',
    width: '100%',
    boxShadow: 'var(--shadow-xl)',
  },
  cardHeader: {
    marginBottom: '28px',
  },
  heading: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
    marginBottom: '5px',
  },
  subheading: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    lineHeight: '1.4',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '9px',
    background: 'var(--red-subtle)',
    border: '1px solid var(--red-border)',
    color: 'var(--red-bright)',
    padding: '10px 13px',
    borderRadius: 'var(--radius-lg)',
    fontSize: '13px',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: '7px',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color var(--transition-normal)',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '10px',
    background: 'var(--accent)',
    color: '#fff',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-lg)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
    letterSpacing: '0.01em',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  btnLoading: {
    width: '100%',
    padding: '10px',
    background: 'var(--bg-elevated)',
    color: 'var(--text-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'not-allowed',
    marginTop: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  footer: {
    fontSize: '11px',
    color: 'var(--text-disabled)',
    textAlign: 'center',
    lineHeight: '1.5',
  },
};
