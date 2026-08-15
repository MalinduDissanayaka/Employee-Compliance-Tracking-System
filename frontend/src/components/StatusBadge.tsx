import type { ComplianceStatus } from '../types';

// Fixed status palette (never reused for chart series): good / warning / serious / critical.
const DOT_COLOR: Record<ComplianceStatus, string> = {
  ACTIVE: '#0ca30c',
  EXPIRING_SOON: '#fab219',
  EXPIRED: '#d03b3b',
  RENEWED: '#2a78d6',
};

const TEXT_COLOR: Record<ComplianceStatus, string> = {
  ACTIVE: '#0b6b0b',
  EXPIRING_SOON: '#8a5a00',
  EXPIRED: '#a12a2a',
  RENEWED: '#1c5cab',
};

const BG_COLOR: Record<ComplianceStatus, string> = {
  ACTIVE: '#0ca30c1a',
  EXPIRING_SOON: '#fab2191a',
  EXPIRED: '#d03b3b1a',
  RENEWED: '#2a78d61a',
};

const LABELS: Record<ComplianceStatus, string> = {
  ACTIVE: 'Active',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
  RENEWED: 'Renewed',
};

export function StatusBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: BG_COLOR[status], color: TEXT_COLOR[status] }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: DOT_COLOR[status] }}
        aria-hidden="true"
      />
      {LABELS[status]}
    </span>
  );
}
