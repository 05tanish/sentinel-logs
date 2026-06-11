import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import * as ui from '../ui';

const SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'];

const SEV_COLORS = {
  HIGH:   'var(--orange)',
  MEDIUM: 'var(--yellow)',
  LOW:    'var(--green)',
};

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

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

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
      setUploadResult({
        success: false,
        message: err.response?.data?.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div style={s.root}>
      {/* Upload bar */}
      {canUpload && (
        <div style={s.uploadBar} role="region" aria-label="Log file upload">
          <div style={s.uploadLeft}>
            <UploadIcon />
            <div>
              <div style={s.uploadTitle}>Import log file</div>
              <div style={s.uploadSub}>.log or .txt · max 50 MB</div>
            </div>
          </div>
          <div style={s.uploadRight}>
            {uploadResult && (
              <span
                style={uploadResult.success ? s.uploadOk : s.uploadErr}
                role="status"
                aria-live="polite"
              >
                {uploadResult.success
                  ? `✓ ${uploadResult.processed} lines imported`
                  : `✗ ${uploadResult.message}`}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".log,.txt"
              onChange={handleUpload}
              style={{ display: 'none' }}
              id="logUpload"
              aria-label="Choose log file to upload"
            />
            <label
              htmlFor="logUpload"
              style={{
                ...ui.btnGhost,
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 1,
              }}
            >
              {uploading ? <SpinnerIcon /> : null}
              {uploading ? 'Processing…' : 'Choose file'}
            </label>
          </div>
        </div>
      )}

      {/* Severity filter + table */}
      <div style={ui.card}>
        <div style={ui.tableHeader}>
          {/* Segmented control */}
          <div style={s.segmented} role="group" aria-label="Filter by severity">
            {SEVERITIES.map((sev) => (
              <button
                key={sev}
                style={{ ...s.seg, ...(severity === sev ? s.segActive : {}) }}
                onClick={() => handleSeverityChange(sev)}
                aria-pressed={severity === sev}
              >
                <span
                  style={{ ...s.segDot, background: SEV_COLORS[sev] }}
                  aria-hidden="true"
                />
                {sev}
              </button>
            ))}
          </div>

          <button style={ui.btnGhost} onClick={() => load()} aria-label="Refresh logs">
            <RefreshIcon /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingState />
        ) : logs.length === 0 ? (
          <EmptyState severity={severity} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table aria-label={`${severity} severity logs`}>
              <thead>
                <tr>
                  {['Time', 'Event', 'Severity', 'IP Address', 'Username', 'Source', 'Raw'].map((h) => (
                    <th key={h} style={ui.th} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ ...ui.td, ...s.timeCell }}>{fmtDate(l.created_at)}</td>
                    <td style={ui.tdPrimary}>{l.event_type ?? <Dash />}</td>
                    <td style={ui.td}>
                      <span style={ui.severityBadge(l.severity)}>{l.severity}</span>
                    </td>
                    <td style={ui.tdMono}>{l.ip_address ?? <Dash />}</td>
                    <td style={ui.td}>{l.username ?? <Dash />}</td>
                    <td style={ui.td}>{l.source ?? <Dash />}</td>
                    <td style={{ ...ui.td, maxWidth: '300px' }}>
                      <span style={s.rawText} title={l.raw}>{l.raw}</span>
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

const LoadingState = () => (
  <div style={ui.emptyState} role="status" aria-live="polite">
    <SpinnerIcon size={20} />
    <div style={{ marginTop: '12px' }}>Loading logs…</div>
  </div>
);

const EmptyState = ({ severity }) => (
  <div style={ui.emptyState} role="status">
    <LogIcon />
    <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
      No {severity.toLowerCase()} severity logs
    </div>
    <div style={{ marginTop: '4px', fontSize: '12px' }}>
      Try a different severity filter or refresh
    </div>
  </div>
);

const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
};

const Dash = () => <span style={{ color: 'var(--text-disabled)' }}>—</span>;

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 3.5 2.1M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
    <path d="M8 10.5V4M5 7l3-3 3 3M2.5 13.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SpinnerIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    style={{ animation: 'spinLog 0.8s linear infinite', display: 'block' }} aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="var(--border-strong)" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="7.5" stroke="var(--accent)" strokeWidth="1.5"
      strokeLinecap="round" strokeDasharray="35" strokeDashoffset="25"/>
    <style>{`@keyframes spinLog { to { transform: rotate(360deg); transform-origin: center; } }`}</style>
  </svg>
);

const LogIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="2.5" stroke="var(--text-disabled)" strokeWidth="1.5"/>
    <path d="M8 8h8M8 12h8M8 16h5" stroke="var(--text-disabled)" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  uploadBar: {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-xl)',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  uploadLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  uploadTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  uploadSub: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  uploadRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  uploadOk: {
    fontSize: '12px',
    color: 'var(--green)',
    fontWeight: '500',
  },
  uploadErr: {
    fontSize: '12px',
    color: 'var(--red)',
    fontWeight: '500',
  },
  segmented: {
    display: 'flex',
    gap: '2px',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '3px',
  },
  seg: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '5px',
    color: 'var(--text-tertiary)',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
    userSelect: 'none',
  },
  segActive: {
    background: 'var(--bg-overlay)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  },
  segDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  timeCell: {
    whiteSpace: 'nowrap',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-tertiary)',
  },
  rawText: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    maxWidth: '300px',
  },
};
