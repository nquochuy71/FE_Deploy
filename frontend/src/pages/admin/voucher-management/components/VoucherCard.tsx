import { useMemo, useRef } from 'react';
import { BadgeDollarSign, Copy, MoreVertical, Percent, Sparkles, Truck } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import type { Voucher } from '../types';
import { typeToneMap } from '../voucherData';
import { VoucherActionMenu } from './VoucherActionMenu';
import { VoucherStatusBadge } from './VoucherStatusBadge';

const formatCompactCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '--';
  }

  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)}đ`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const typeIconMap = {
  PERCENT: Percent,
  AMOUNT: BadgeDollarSign,
  FREE_SHIPPING: Truck,
} as const;

export const VoucherCard = ({
  voucher,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onChangeStatus,
  onDisable,
  onCopyCode,
}: {
  voucher: Voucher;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onChangeStatus: () => void;
  onDisable: () => void;
  onCopyCode: (code: string) => void;
}) => {
  const actionRootRef = useRef<HTMLDivElement>(null);
  useClickOutside(actionRootRef, onToggleMenu, isMenuOpen);

  const typeTone = typeToneMap[voucher.type];
  const DiscountIcon = typeIconMap[voucher.type] ?? Sparkles;
  const isMuted = voucher.status === 'EXPIRED' || voucher.status === 'DISABLED';

  const titleText = useMemo(() => {
    if (voucher.type === 'PERCENT') {
      return `${voucher.discountValue}% OFF`;
    }

    if (voucher.type === 'AMOUNT') {
      return `${formatCompactCurrency(voucher.discountValue)} OFF`;
    }

    return 'FREE SHIP';
  }, [voucher.discountValue, voucher.type]);

  const quantityText = voucher.maxUsagePerUser ? `${voucher.quantity} lượt / ${voucher.maxUsagePerUser} lần mỗi user` : `${voucher.quantity} voucher còn lại`;

  return (
    <article className={`group relative overflow-hidden rounded-[24px] border border-[#E0D7CD] ${isMuted ? 'bg-[#F5F5F5]' : typeTone.cardClass} p-5 shadow-[0_10px_28px_rgba(30,30,30,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D4B785] hover:shadow-[0_22px_40px_rgba(30,30,30,0.10)]`}>
      <div className={`space-y-5 ${isMuted ? 'opacity-70' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`grid h-11 w-11 place-items-center rounded-2xl border border-white/55 bg-white/55 shadow-sm ${typeTone.iconClass}`}>
              <DiscountIcon size={20} />
            </div>
            <div>
              <p className={`text-3xl font-semibold tracking-tight md:text-[2rem] ${typeTone.titleClass}`}>{titleText}</p>
              
            </div>
          </div>

          <div className="flex items-start gap-2">
            <VoucherStatusBadge status={voucher.status} />

            <div ref={actionRootRef} className="relative">
              <button
                type="button"
                aria-label={`Mở menu thao tác ${voucher.code}`}
                onClick={onToggleMenu}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/70 text-[#1E1E1E] shadow-sm transition hover:bg-white"
              >
                <MoreVertical size={16} />
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-11 z-[80]">
                  <VoucherActionMenu onEdit={onEdit} onChangeStatus={onChangeStatus} onDisable={onDisable} />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => onCopyCode(voucher.code)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E0D7CD] bg-[#F5EFE6] px-3 py-2 text-left text-sm font-mono tracking-[0.12em] text-[#1E1E1E] transition hover:border-[#D4B785]"
          >
            <Copy size={14} className="shrink-0 text-[#C5A872]" />
            <span className="truncate text-lg">{voucher.code}</span>
          </button>

          <div>
            <h3 className={`text-lg font-semibold ${typeTone.titleClass}`}>{voucher.name}</h3>
            <p className={`mt-1 line-clamp-2 text-sm leading-6 ${typeTone.accentClass}`}>{voucher.description || 'Chưa có mô tả cho voucher này.'}</p>
          </div>

          <div className={`grid gap-3 rounded-2xl border border-white/55 bg-white/55 p-4 text-sm text-[#1E1E1E] shadow-sm backdrop-blur-sm ${isMuted ? 'bg-white/65' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Số lượng</span>
              <span className="font-semibold">{quantityText}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Thời hạn</span>
              <span className="font-semibold">
                {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Điều kiện</span>
              <span className="font-semibold">Tối thiểu {formatCompactCurrency(voucher.minOrderAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {isMuted ? <div className="pointer-events-none absolute inset-0 bg-white/35" /> : null}
    </article>
  );
};
