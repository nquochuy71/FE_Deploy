import type { VoucherStatus } from '../types';
import { statusToneMap } from '../voucherData';

export const VoucherStatusBadge = ({ status }: { status: VoucherStatus }) => {
  const tone = statusToneMap[status];

  return (
      <span className={`inline-flex items-center justify-center rounded-lg px-4 py-1 text-xs font-semibold ${tone.badgeClass}`}>
      {tone.label}
    </span>
  );
};
