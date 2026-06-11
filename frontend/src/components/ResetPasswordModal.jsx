import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import * as ui from './ui';

export default function ResetPasswordModal({ isOpen, onClose, onSuccess, user }) {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef(null);

  const handleClose = () => {
    setForm({ newPassword: '', confirmPassword: '' });
    setError('');
    onClose();
  };

  // Focus management
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  // Trap escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.newPassword.length < 8) return setError('Password must be at least 8 characters.');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?])/.test(form.newPassword))
      return setError('Must include uppercase, lowercase, number, and special character.');

    setLoading(true);
    try {
      await api.put('/api/auth/reset-password', { userId: user.id, newPassword: form.newPassword });
      setForm({ newPassword: '', confirmPassword: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      const details = err.response?.data?.errors;
      setError(details?.length ? `${msg}: ${details.join(', ')}` : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div
      style={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-pw-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={s.modal}>
        <div style={s.header}>
          <div>
            <div style={s.title} id="reset-pw-title">Reset password</div>
            <div style={s.subtitle}>
              For <strong style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user.username}</strong>
            </div>
          </div>
          <button style={s.closeBtn} onClick={handleClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={s.body} noValidate>
          {error && (
            <div style={ui.errorBanner} role="alert" aria-live="polite">
              <ErrorIcon />
              <span>{error}</span>
            </div>
          )}

          <div style={ui.warningBanner} role="note">
            <WarningIcon />
            <span>
              The user will need to use this new password on their next login.
            </span>
          </div>

          <Field label="New password" htmlFor="rp-new" hint="Min 8 chars · uppercase · lowercase · number · special">
            <input
              ref={firstInputRef}
              id="rp-new"
              style={ui.input}
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              autoComplete="new-password"
              required
              aria-required="true"
              aria-describedby="rp-new-hint"
            />
          </Field>

          <Field label="Confirm new password" htmlFor="rp-confirm">
            <input
              id="rp-confirm"
              style={ui.input}
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              autoComplete="new-password"
              required
              aria-required="true"
            />
          </Field>

          <div style={s.actions}>
            <button type="button" style={ui.btnGhost} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" style={s.dangerBtn} disabled={loading} aria-busy={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Field = ({ label, htmlFor, hint, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={ui.label} htmlFor={htmlFor}>{label}</label>
    {children}
    {hint && (
      <div id={`${htmlFor}-hint`} style={s.hint}>{hint}</div>
    )}
  </div>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 4.5V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="7" cy="9" r="0.65" fill="currentColor"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px', color: 'var(--orange)' }} aria-hidden="true">
    <path d="M7 1.5L12.5 11H1.5L7 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="7" cy="9.5" r="0.6" fill="currentColor"/>
  </svg>
);

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },
  modal: {
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-2xl)',
    width: '100%',
    maxWidth: '420px',
    boxShadow: 'var(--shadow-xl)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '20px 20px 16px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '-0.1px',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    marginTop: '2px',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid transparent',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px',
    borderRadius: 'var(--radius-md)',
    flexShrink: 0,
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  },
  body: {
    padding: '20px',
  },
  hint: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    marginTop: '5px',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  dangerBtn: {
    ...ui.btnPrimary,
    background: 'var(--red)',
  },
};
