// Shared style tokens used across all tab components

export const card = {
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
};

export const tableHeader = {
  padding: '14px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--border-subtle)',
};

export const tableTitle = {
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-primary)',
  letterSpacing: '-0.1px',
};

export const th = {
  padding: '9px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: 'var(--bg-base)',
  borderBottom: '1px solid var(--border-subtle)',
  whiteSpace: 'nowrap',
};

export const td = {
  padding: '11px 16px',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border-subtle)',
  verticalAlign: 'middle',
};

export const tdPrimary = {
  ...td,
  color: 'var(--text-primary)',
  fontWeight: '500',
};

export const emptyState = {
  padding: '56px 24px',
  textAlign: 'center',
  color: 'var(--text-tertiary)',
  fontSize: '13px',
};

export const btnGhost = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  background: 'transparent',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  fontWeight: '500',
  cursor: 'pointer',
  letterSpacing: '0.01em',
  transition: 'border-color 0.15s, color 0.15s',
};

export const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 14px',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  color: '#fff',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  letterSpacing: '0.01em',
};

export const btnDanger = {
  ...btnGhost,
  color: 'var(--red)',
  borderColor: 'var(--red-border)',
};

export const btnSuccess = {
  ...btnGhost,
  color: 'var(--green)',
  borderColor: 'var(--green-border)',
};

export const input = {
  width: '100%',
  padding: '8px 11px',
  background: 'var(--bg-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

export const label = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--text-tertiary)',
  marginBottom: '5px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

// Severity badge styles
export const severityBadge = (sev) => {
  const map = {
    CRITICAL: { color: 'var(--red)',    bg: 'var(--red-subtle)',    border: 'var(--red-border)'    },
    HIGH:     { color: 'var(--orange)', bg: 'var(--orange-subtle)', border: 'var(--orange-border)' },
    MEDIUM:   { color: 'var(--yellow)', bg: 'var(--yellow-subtle)', border: 'var(--yellow-border)' },
    LOW:      { color: 'var(--green)',  bg: 'var(--green-subtle)',  border: 'var(--green-border)'  },
  };
  const c = map[sev] || { color: 'var(--text-tertiary)', bg: 'var(--bg-subtle)', border: 'var(--border-default)' };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 7px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: c.color,
    background: c.bg,
    border: `1px solid ${c.border}`,
  };
};

// Type badge
export const typeBadge = (type) => {
  const map = {
    BRUTE_FORCE:           { color: 'var(--purple)', bg: 'var(--purple-subtle)', border: 'var(--purple-border)' },
    REPEATED_USER_FAILURE: { color: 'var(--blue)',   bg: 'var(--blue-subtle)',   border: 'var(--blue-border)'   },
  };
  const c = map[type] || { color: 'var(--text-tertiary)', bg: 'var(--bg-subtle)', border: 'var(--border-default)' };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 7px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.03em',
    color: c.color,
    background: c.bg,
    border: `1px solid ${c.border}`,
  };
};

// Role badge
export const roleBadge = (role) => {
  const map = {
    admin:   { color: 'var(--purple)', bg: 'var(--purple-subtle)', border: 'var(--purple-border)' },
    analyst: { color: 'var(--blue)',   bg: 'var(--blue-subtle)',   border: 'var(--blue-border)'   },
    viewer:  { color: 'var(--green)',  bg: 'var(--green-subtle)',  border: 'var(--green-border)'  },
  };
  const c = map[role] || { color: 'var(--text-tertiary)', bg: 'var(--bg-subtle)', border: 'var(--border-default)' };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 7px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    textTransform: 'capitalize',
    color: c.color,
    background: c.bg,
    border: `1px solid ${c.border}`,
  };
};
