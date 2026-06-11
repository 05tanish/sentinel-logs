// ─────────────────────────────────────────────────────────────────────────────
// Shared style tokens — Sentinel Design System
// ─────────────────────────────────────────────────────────────────────────────

// ── Cards ────────────────────────────────────────────────────────────────────

export const card = {
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-xl)',
  overflow: 'hidden',
};

export const cardFlat = {
  ...card,
  borderRadius: 'var(--radius-lg)',
};

// ── Table chrome ─────────────────────────────────────────────────────────────

export const tableHeader = {
  padding: '14px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--border-subtle)',
  minHeight: '52px',
};

export const tableTitle = {
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-primary)',
  letterSpacing: '-0.1px',
};

export const tableTitleSub = {
  fontSize: '12px',
  color: 'var(--text-tertiary)',
  fontWeight: '400',
  marginLeft: '8px',
};

export const th = {
  padding: '9px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  background: 'var(--bg-base)',
  borderBottom: '1px solid var(--border-subtle)',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

export const td = {
  padding: '11px 16px',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border-faint)',
  verticalAlign: 'middle',
};

export const tdPrimary = {
  ...td,
  color: 'var(--text-primary)',
  fontWeight: '500',
};

export const tdMono = {
  ...td,
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: 'var(--text-tertiary)',
};

// ── Empty / loading states ────────────────────────────────────────────────────

export const emptyState = {
  padding: '64px 24px',
  textAlign: 'center',
  color: 'var(--text-tertiary)',
  fontSize: '13px',
  lineHeight: '1.6',
};

export const loadingState = {
  padding: '64px 24px',
  textAlign: 'center',
  color: 'var(--text-tertiary)',
  fontSize: '13px',
};

// ── Buttons ──────────────────────────────────────────────────────────────────

export const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '7px 14px',
  background: 'var(--accent)',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

export const btnGhost = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  whiteSpace: 'nowrap',
};

export const btnDanger = {
  ...btnGhost,
  color: 'var(--red)',
  borderColor: 'var(--red-border)',
  background: 'var(--red-subtle)',
};

export const btnSuccess = {
  ...btnGhost,
  color: 'var(--green)',
  borderColor: 'var(--green-border)',
  background: 'var(--green-subtle)',
};

export const btnSubtle = {
  ...btnGhost,
  background: 'var(--bg-elevated)',
  borderColor: 'var(--border-strong)',
};

// ── Form elements ─────────────────────────────────────────────────────────────

export const input = {
  width: '100%',
  padding: '8px 11px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--transition-normal)',
};

export const select = {
  ...input,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%2352586e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: '30px',
};

export const label = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--text-tertiary)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  userSelect: 'none',
};

// ── Banners ───────────────────────────────────────────────────────────────────

export const errorBanner = {
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
  marginBottom: '16px',
};

export const warningBanner = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '9px',
  background: 'var(--orange-subtle)',
  border: '1px solid var(--orange-border)',
  color: 'var(--text-secondary)',
  padding: '10px 13px',
  borderRadius: 'var(--radius-lg)',
  fontSize: '13px',
  lineHeight: '1.5',
  marginBottom: '16px',
};

// ── Dividers ──────────────────────────────────────────────────────────────────

export const divider = {
  height: '1px',
  background: 'var(--border-subtle)',
  border: 'none',
  margin: '0',
};

// ─────────────────────────────────────────────────────────────────────────────
// Badge factories
// ─────────────────────────────────────────────────────────────────────────────

const badge = (color, bg, border) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 7px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color,
  background: bg,
  border: `1px solid ${border}`,
  whiteSpace: 'nowrap',
});

export const severityBadge = (sev) => {
  const map = {
    CRITICAL: badge('var(--red)',    'var(--red-subtle)',    'var(--red-border)'),
    HIGH:     badge('var(--orange)', 'var(--orange-subtle)', 'var(--orange-border)'),
    MEDIUM:   badge('var(--yellow)', 'var(--yellow-subtle)', 'var(--yellow-border)'),
    LOW:      badge('var(--green)',  'var(--green-subtle)',  'var(--green-border)'),
  };
  return map[sev] || badge('var(--text-tertiary)', 'var(--bg-subtle)', 'var(--border-default)');
};

export const typeBadge = (type) => {
  const map = {
    BRUTE_FORCE:           badge('var(--red)',    'var(--red-subtle)',    'var(--red-border)'),
    REPEATED_USER_FAILURE: badge('var(--purple)', 'var(--purple-subtle)', 'var(--purple-border)'),
    ANOMALY:               badge('var(--orange)', 'var(--orange-subtle)', 'var(--orange-border)'),
    INTRUSION:             badge('var(--yellow)', 'var(--yellow-subtle)', 'var(--yellow-border)'),
  };
  return map[type] || badge('var(--text-tertiary)', 'var(--bg-subtle)', 'var(--border-default)');
};

export const roleBadge = (role) => {
  const map = {
    admin:   badge('var(--purple)', 'var(--purple-subtle)', 'var(--purple-border)'),
    analyst: badge('var(--blue)',   'var(--blue-subtle)',   'var(--blue-border)'),
    viewer:  badge('var(--green)',  'var(--green-subtle)',  'var(--green-border)'),
  };
  return {
    ...(map[role] || badge('var(--text-tertiary)', 'var(--bg-subtle)', 'var(--border-default)')),
    textTransform: 'capitalize',
    letterSpacing: '0.02em',
  };
};
