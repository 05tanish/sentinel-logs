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
    <div style={styles.page}>
      <div style={styles.box}>
        <div style={styles.logo}>
          <h1 style={styles.logoTitle}>⚡ SIEM</h1>
          <p style={styles.logoSub}>Security Information & Event Management</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter username"
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
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#0f1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  box: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400 },
  logo: { textAlign: 'center', marginBottom: 32 },
  logoTitle: { fontSize: 24, color: '#6366f1', letterSpacing: 2 },
  logoSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  error: { background: '#2d1b1b', border: '1px solid #7f1d1d', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 20 },
  label: { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', background: '#0f1117', border: '1px solid #2d3148', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: 12, background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  btnDisabled: { width: '100%', padding: 12, background: '#374151', color: '#9ca3af', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'not-allowed' },
};
