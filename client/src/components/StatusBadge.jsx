import { statusLabel } from '../utils/format';

const VARIANTS = {
  CONFIRMED: 'success',
  PENDING_PAYMENT: 'warning',
  CANCELLED: 'danger',
  EXPIRED: 'secondary',
  PAID: 'success',
  UNPAID: 'warning',
  FAILED: 'danger',
  REFUNDED: 'info',
  SUCCESS: 'success',
  INITIATED: 'warning',
  NOW_SHOWING: 'success',
  UPCOMING: 'info',
};

export default function StatusBadge({ status }) {
  return <span className={`badge text-bg-${VARIANTS[status] || 'secondary'}`}>{statusLabel(status)}</span>;
}
