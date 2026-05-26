import { useState } from 'react';
import api from '../api/axios';
import * as ui from './ui';

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) return setError('Passwords do not match');
    if (form.newPassword.length < 8) return setError('Password must be at least 8 characters');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/.test(form.newPassword))
      return setError('Must include uppercase, lowercase, number, and special character');

    setLoading(true);
    try {
      await api.put('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      const details = err.response?.data?.errors;
      setError(details?.length ? `${msg}: ${details.join(', ')}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <span style={s.title}>Change password</span>
          <button style={s.closeBtn} onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={s.body}>
          {error && (
            <div style={s.errorBanner}>
              <span style={s.errorDot} />
              {error}
            </div>
          )}

          <Field label="Current password">
            <input style={ui.input} type="password" value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
          </Field>
          <Field label="New password" hint="Min 8 chars · uppercase · lowercase · number · special">
            <input style={ui.input} type="password" value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
          </Field>
          <Field label="Confirm new password">
            <input style={ui.input} type="password" value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
          </Field>

          <div style={s.actions}>
            <button type="button" style={ui.btnGhost} onClick={handleClose}>Cancel</button>
            <button type="submit" style={ui.btnPrimary} disabled={loading}>
              {loading ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={ui.label}>{label}</label>
    {children}
    {hint && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>{hint}</div>}
  </div>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '24px',
  },
  modal: {
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: '10px',
    width: '100%', maxWidth: '400px',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 20px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  title: {
    fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'none', border: 'none',
    color: 'var(--text-tertiary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '4px', borderRadius: 'var(--radius-sm)',
  },
  body: { padding: '20px' },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--red-subtle)', border: '1px solid var(--red-border)',
    color: 'var(--red)', padding: '9px 12px',
    borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '16px',
  },
  errorDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--red)', flexShrink: 0,
  },
  actions: {
    display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px',
  },
};
