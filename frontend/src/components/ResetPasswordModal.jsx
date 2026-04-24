import { useState } from 'react';
import api from '../api/axios';

export default function ResetPasswordModal({ isOpen, onClose, onSuccess, user }) {
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/auth/reset-password', {
        userId: user.id,
        newPassword: form.newPassword
      });
      
      setForm({ newPassword: '', confirmPassword: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ newPassword: '', confirmPassword: '' });
    setError('');
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Reset Password for {user.username}</h3>
          <button style={styles.closeBtn} onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.warning}>
            You are about to reset the password for user <strong>{user.username}</strong>. 
            They will need to use the new password to log in.
          </div>

          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
            <div style={styles.hint}>
              Must be at least 8 characters with uppercase, lowercase, and number
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              style={styles.input}
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#1a1d27',
    border: '1px solid #2d3148',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    margin: 20
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #2d3148'
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e2e8f0',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 24,
    cursor: 'pointer',
    padding: 0,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  form: {
    padding: 24
  },
  warning: {
    background: '#2d1f1b',
    border: '1px solid #7c2d12',
    color: '#fed7aa',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 20
  },
  field: {
    marginBottom: 20
  },
  label: {
    display: 'block',
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 8,
    fontWeight: 500
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: '#0f1117',
    border: '1px solid #2d3148',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box'
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6
  },
  error: {
    background: '#2d1b1b',
    border: '1px solid #7f1d1d',
    color: '#fca5a5',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 20
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24
  },
  cancelBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #2d3148',
    color: '#94a3b8',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#dc2626',
    border: 'none',
    color: 'white',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500
  }
};