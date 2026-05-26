import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import * as ui from '../ui';

const SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'];

export default function LogsTab() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [severity, setSeverity] = useState('HIGH');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileRef = useRef();

  const canUpload = user?.role === 'admin' || user?.role === 'analyst';

  const load = async (sev = severity) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/logs/severity/${sev}`);
      setLogs(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSeverityChange = (sev) => { setSeverity(sev); load(sev); };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append('logfile', file);
    formData.append('source', `usb-upload:${file.name}`);
    try {
      const res = await api.post('/api/logs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult({ success: true, ...res.data.data });
      load(severity);
    } catch (err) {
      setUploadResult({ success: false, message: err.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  return (
    <div>
      {/* Upload bar */}
      {canUpload && (
        <div style={s.uploadBar}>
          <div>
            <div style={s.uploadTitle}>Upload log file</div>
            <div style={s.uploadSub}>.log or .txt · max 50 MB</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {uploadResult && (
              <span style={uploadResult.success ? s.uploadOk : s.uploadErr}>
                {uploadResult.success
                  ? `${uploadResult.processed} lines imported`
                  : uploadResult.message}
              </span>
            )}
            <input ref={fileRef} type="file" accept=".log,.txt" onChange={handleUpload} style={{ display: 'none' }} id="logUpload" />
            <label htmlFor="logUpload" style={{ ...ui.btnGhost, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
              <UploadIcon />
              {uploading ? 'Processing…' : 'Choose file'}
            </label>
          </div>
        </div>
      )}

      {/* Severity filter + table */}
      <div style={ui.card}>
        <div style={ui.tableHeader}>
          {/* Segmented control */}
          <div style={s.segmented}>
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                style={{ ...s.seg, ...(severity === sev ? s.segActive : {}) }}
                onClick={() => handleSeverityChange(sev)}
              >
                <span style={{ ...s.segDot, background: severityDotColor(sev) }} />
                {sev}
              </button>
            ))}
          </div>
          <button style={ui.btnGhost} onClick={() => load()}>
            <RefreshIcon /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={ui.emptyState}>Loading…</div>
        ) : logs.length === 0 ? (
          <div style={ui.emptyState}>No {severity.toLowerCase()} severity logs</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {['Time', 'Event', 'Severity', 'IP Address', 'Username', 'Source', 'Raw'].map((h) => (
                    <th key={h} style={ui.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ ...ui.td, whiteSpace: 'nowrap', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      {fmtDate(l.created_at)}
                    </td>
                    <td style={ui.tdPrimary}>{l.event_type || <Dash />}</td>
                    <td style={ui.td}>
                      <span style={ui.severityBadge(l.severity)}>{l.severity}</span>
                    </td>
                    <td style={{ ...ui.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {l.ip_address || <Dash />}
                    </td>
                    <td style={ui.td}>{l.username || <Dash />}</td>
                    <td style={ui.td}>{l.source || <Dash />}</td>
                    <td style={{ ...ui.td, maxWidth: '280px' }}>
                      <span style={s.rawText}>{l.raw}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

const severityDotColor = (sev) => ({
  HIGH:   'var(--orange)',
  MEDIUM: 'var(--yellow)',
  LOW:    'var(--green)',
}[sev] || 'var(--text-tertiary)');

const Dash = () => <span style={{ color: 'var(--text-disabled)' }}>—</span>;

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 3.5 2.1M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 8V2M3 5l3-3 3 3M2 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const s = {
  uploadBar: {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: '14px 20px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  uploadTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  uploadSub: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  uploadOk: {
    fontSize: '12px',
    color: 'var(--green)',
  },
  uploadErr: {
    fontSize: '12px',
    color: 'var(--red)',
  },
  segmented: {
    display: 'flex',
    gap: '2px',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: '3px',
  },
  seg: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: 'var(--text-tertiary)',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'background 0.15s, color 0.15s',
  },
  segActive: {
    background: 'var(--bg-overlay)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  segDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  rawText: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    maxWidth: '280px',
  },
};
