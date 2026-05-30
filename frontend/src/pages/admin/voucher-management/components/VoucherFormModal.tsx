import { CalendarRange, CheckCircle2, FileText, Hash, Info, Percent, Ticket, Truck, UserRound, WalletCards, X } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import type { VoucherFormState, VoucherStatus } from '../types';

type FieldTooltip = {
  label: string;
  content: ReactNode;
};

type FieldIcon = ReactNode;

type SegmentMeta = {
  title: string;
  description: string;
  icon: ReactNode;
};

const fieldTooltipMap: Record<string, FieldTooltip> = {
  code: {
    label: 'Mã giảm giá',
    content: 'Mã giảm giá viết liền, không dấu, dùng để người dùng nhập lúc thanh toán.',
  },
  name: {
    label: 'Tên voucher',
    content: 'Tên hiển thị của chương trình khuyến mãi.',
  },
  description: {
    label: 'Mô tả',
    content: 'Nội dung chi tiết về điều kiện hoặc thông tin thêm của voucher để hiển thị cho khách hàng.',
  },
  discountValue: {
    label: 'Nhập giá trị giảm giá',
    content: (
      <div className="space-y-2">
        <p>
          Nếu chọn "Giảm theo %": Nhập số từ 1 đến 100 (Ví dụ: 10 nghĩa là giảm 10%).
        </p>
        <p>
          Nếu chọn "Giảm theo số tiền": Nhập số tiền hệ thống sẽ trừ trực tiếp (Ví dụ: 50000 nghĩa là giảm 50.000đ).
        </p>
        <p>Nếu chọn "Miễn phí vận chuyển": Trường này sẽ là giá trị giảm giá vận chuyển.</p>
      </div>
    ),
  },
  maxDiscountAmount: {
    label: 'Mức giảm tối đa',
    content:
      'Số tiền được giảm tối đa cho một đơn hàng khi áp dụng giảm giá theo % (Ví dụ: Giảm 10% nhưng tối đa không quá 50.000đ). Để trống nếu không giới hạn.',
  },
  minOrderAmount: {
    label: 'Đơn hàng tối thiểu',
    content: 'Giá trị đơn hàng thấp nhất phải đạt được để có thể sử dụng voucher này (Ví dụ: Đơn hàng từ 100.000đ trở lên).',
  },
  quantity: {
    label: 'Số lượng',
    content: 'Tổng số lượt voucher được phát hành ra toàn hệ thống.',
  },
  maxUsagePerUser: {
    label: 'Lượt dùng / user',
    content: 'Số lần tối đa mà MỘT tài khoản khách hàng được phép sử dụng mã giảm giá này.',
  },
  startDate: {
    label: 'Ngày bắt đầu',
    content: 'Thời gian (ngày và giờ) voucher bắt đầu có hiệu lực trên hệ thống.',
  },
  endDate: {
    label: 'Ngày kết thúc',
    content: 'Thời gian (ngày và giờ) voucher hết hạn và không thể sử dụng được nữa.',
  },
};

const fieldIconMap: Record<string, FieldIcon> = {
  code: <Ticket size={16} />,
  name: <Ticket size={16} />,
  description: <FileText size={16} />,
  discountValue: <Percent size={16} />,
  maxDiscountAmount: <WalletCards size={16} />,
  minOrderAmount: <WalletCards size={16} />,
  quantity: <Hash size={16} />,
  maxUsagePerUser: <UserRound size={16} />,
  startDate: <CalendarRange size={16} />,
  endDate: <CalendarRange size={16} />,
};

const segmentMetaMap: Record<'PERCENT' | 'AMOUNT' | 'FREE_SHIPPING', SegmentMeta> = {
  PERCENT: {
    title: 'Giảm theo %',
    description: 'Giảm giá theo phần trăm',
    icon: <Percent size={28} />,
  },
  AMOUNT: {
    title: 'Giảm theo số tiền',
    description: 'Giảm giá theo số tiền cố định',
    icon: <WalletCards size={28} />,
  },
  FREE_SHIPPING: {
    title: 'Miễn phí vận chuyển',
    description: 'Miễn phí vận chuyển',
    icon: <Truck size={28} />,
  },
};

const typeSegmentClass = (active: boolean) =>
  active
    ? 'border-[#D4B785] bg-[#1E1E1E] text-[#FAF6F1] shadow-[0_14px_30px_rgba(30,30,30,0.12)]'
    : 'border-[#E0D7CD] bg-white text-[#1E1E1E] hover:border-[#D4B785] hover:bg-[#FAF6F1]';

const statusLabelMap: Record<Exclude<VoucherStatus, ''>, string> = {
  ACTIVE: 'Đang hoạt động',
  UPCOMING: 'Sắp có hiệu lực',
  EXPIRED: 'Hết hạn',
  DISABLED: 'Vô hiệu hóa',
};

const getVoucherEditPolicy = (modalMode: 'create' | 'edit' | null, status: VoucherStatus | '') => {
  if (modalMode !== 'edit') {
    return {
      canEditAll: true,
      canEditOnlyQuantityAndEndDate: false,
      isLocked: false,
      statusLabel: null,
    };
  }

  if (status === 'UPCOMING') {
    return {
      canEditAll: true,
      canEditOnlyQuantityAndEndDate: false,
      isLocked: false,
      statusLabel: statusLabelMap.UPCOMING,
    };
  }

  if (status === 'ACTIVE') {
    return {
      canEditAll: false,
      canEditOnlyQuantityAndEndDate: true,
      isLocked: false,
      statusLabel: statusLabelMap.ACTIVE,
    };
  }

  return {
    canEditAll: false,
    canEditOnlyQuantityAndEndDate: false,
    isLocked: true,
    statusLabel: status ? statusLabelMap[status as Exclude<VoucherStatus, ''>] : null,
  };
};

const Field = ({
  label,
  error,
  tooltip,
  icon,
  suffix,
  disabled,
  children,
}: {
  label: string;
  error?: string;
  tooltip?: FieldTooltip;
  icon?: FieldIcon;
  suffix?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <label className="block space-y-2">
    <span className={`inline-flex items-start gap-1 text-xs font-bold uppercase tracking-[0.2em] ${disabled ? 'text-slate-400' : 'text-[#1E1E1E]'}`}>
      <span>{label}</span>
      {tooltip ? (
        <span className="group/icon relative inline-flex align-middle">
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Hướng dẫn cho ${tooltip.label}`}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#1A73E8] transition hover:bg-[#EAF3FF] hover:text-[#1765CA] focus:outline-none"
          >
            <Info size={12} aria-hidden="true" />
          </button>
          <span className="pointer-events-none absolute left-full top-1/2 z-30 mr-2 w-80 -translate-y-1/2 rounded-2xl border border-[#D7E3F3] bg-white px-3 py-2 text-left text-[11px] font-medium normal-case tracking-normal text-[#1E1E1E] opacity-0 shadow-[0_16px_40px_rgba(30,30,30,0.16)] transition duration-150 group-hover/icon:opacity-100 group-hover/icon:-translate-x-0.5">
            {tooltip.content}
          </span>
        </span>
      ) : null}
    </span>
    <div className="overflow-hidden rounded-2xl border border-[#E0D7CD] bg-[#FAF6F1] transition focus-within:border-[#D4B785]">
      <div className="flex items-stretch">
        {icon ? (
          <div className={`grid w-12 shrink-0 place-items-center border-r border-[#E8DDD1] ${disabled ? 'text-slate-300' : 'text-[#8D7B69]'}`}>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
        {suffix ? (
          <div className={`grid min-w-[44px] shrink-0 place-items-center border-l border-[#E8DDD1] px-3 text-sm font-semibold ${disabled ? 'bg-[#F7F7F7] text-slate-400' : 'bg-[#F1E9DE] text-[#6B6258]'}`}>
            {suffix}
          </div>
        ) : null}
      </div>
    </div>
    {error ? <span className="block text-xs font-medium text-[#C5221F]">{error}</span> : null}
  </label>
);

const Segment = ({
  active,
  label,
  description,
  icon,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex min-h-[96px] items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${typeSegmentClass(active)} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
  >
    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${active ? 'bg-white/12' : 'bg-[#F2EBE0]'} ${active ? 'text-current' : 'text-[#8D7B69]'}`}>
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold leading-5">{label}</span>
      <span className={`mt-1 block text-xs leading-5 ${active ? 'text-white/75' : 'text-[#7E7469]'}`}>{description}</span>
    </span>
  </button>
);

const ModalShell = ({ title, children, onClose, narrow = false }: { title: string; children: ReactNode; onClose: () => void; narrow?: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-[2px]">
    <div
      className={`relative w-full ${narrow ? 'max-w-2xl' : 'max-w-5xl'} overflow-hidden rounded-[22px] border border-[#ECE5DB] bg-[#FFFFFF] shadow-[0_24px_80px_rgba(30,30,30,0.16)]`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between px-6 pb-4 pt-5 sm:px-7">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.38em] text-[#D4B785]">Lumière</p>
          <p className="mt-2 text-[22px] font-semibold leading-tight text-[#1E1E1E]">{title}</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-[#1E1E1E] transition hover:bg-[#F6F1EA]">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[82vh] overflow-auto px-6 pb-6 sm:px-7">{children}</div>
    </div>
  </div>
);

export const VoucherFormModal = ({
  title,
  formState,
  formErrors,
  modalMode,
  onClose,
  onSubmit,
  onChange,
}: {
  title: string;
  formState: VoucherFormState;
  formErrors: Record<string, string>;
  modalMode: 'create' | 'edit' | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (patch: Partial<VoucherFormState>) => void;
}) => {
  const typeValue = formState.type;
  const discountValueLabel =
    typeValue === 'PERCENT'
      ? 'Nhập phần trăm giảm giá'
      : 'Nhập giá trị giảm giá';
  const editPolicy = getVoucherEditPolicy(modalMode, formState.status);
  const isCreateMode = modalMode === 'create';
  const lockAllFields = editPolicy.isLocked;
  const lockExceptQuantityAndEndDate = modalMode === 'edit' && editPolicy.canEditOnlyQuantityAndEndDate;

  return (
    <ModalShell title={title} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        {editPolicy.statusLabel ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${lockAllFields ? 'border-[#F2C7C7] bg-[#FFF4F4] text-[#9A2C2C]' : 'border-[#D9E7F6] bg-[#F3F8FE] text-[#214F7B]'}`}>
            {lockAllFields
              ? `Không thể chỉnh sửa thông tin voucher ở trạng thái ${editPolicy.statusLabel}.`
              : editPolicy.canEditOnlyQuantityAndEndDate
                ? `Chỉ cho phép thay đổi Số lượng và Ngày kết thúc đối với voucher ở trạng thái ${editPolicy.statusLabel}.`
                : `Voucher ở trạng thái ${editPolicy.statusLabel}.`}
          </div>
        ) : null}

        <section className="rounded-[18px] border border-[#ECE5DB] bg-white p-4 shadow-[0_1px_0_rgba(30,30,30,0.02)]">
          <div className="grid gap-4 md:grid-cols-2">
          <Field label="Code *" error={formErrors.code} tooltip={fieldTooltipMap.code} disabled={!isCreateMode && !editPolicy.canEditAll}>
            <input
              value={formState.code}
              onChange={(event) => onChange({ code: event.target.value.toUpperCase() })}
              disabled={!isCreateMode && !editPolicy.canEditAll}
              className="h-12 w-full bg-transparent px-4 text-sm font-mono tracking-[0.12em] text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              placeholder="SUMMER10"
            />
          </Field>

          <Field label="Tên voucher *" error={formErrors.name} tooltip={fieldTooltipMap.name} disabled={!isCreateMode && !editPolicy.canEditAll}>
            <input
              value={formState.name}
              onChange={(event) => onChange({ name: event.target.value })}
              disabled={!isCreateMode && !editPolicy.canEditAll}
              className="h-12 w-full px-4 text-sm text-[#151515] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              placeholder="Giảm giá mùa hè 10%"
            />
          </Field>
          </div>

          <div className="mt-4">
            <Field label="Mô tả" tooltip={fieldTooltipMap.description} disabled={!isCreateMode && !editPolicy.canEditAll}>
              <textarea
                rows={3}
                value={formState.description}
                onChange={(event) => onChange({ description: event.target.value })}
                disabled={!isCreateMode && !editPolicy.canEditAll}
                className="min-h-[96px] w-full resize-none bg-transparent px-4 py-3 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                placeholder="Áp dụng cho đơn hàng từ 100.000đ"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#ECE5DB] bg-white p-4 shadow-[0_1px_0_rgba(30,30,30,0.02)]">
          <Field label="Loại voucher *" error={formErrors.type} disabled={!isCreateMode && !editPolicy.canEditAll}>
            <div className="grid gap-3 md:grid-cols-3">
              <Segment
                active={typeValue === 'PERCENT'}
                label={segmentMetaMap.PERCENT.title}
                description={segmentMetaMap.PERCENT.description}
                icon={segmentMetaMap.PERCENT.icon}
                disabled={!isCreateMode && !editPolicy.canEditAll}
                onClick={() => onChange({ type: 'PERCENT' })}
              />
              <Segment
                active={typeValue === 'AMOUNT'}
                label={segmentMetaMap.AMOUNT.title}
                description={segmentMetaMap.AMOUNT.description}
                icon={segmentMetaMap.AMOUNT.icon}
                disabled={!isCreateMode && !editPolicy.canEditAll}
                onClick={() => onChange({ type: 'AMOUNT' })}
              />
              <Segment
                active={typeValue === 'FREE_SHIPPING'}
                label={segmentMetaMap.FREE_SHIPPING.title}
                description={segmentMetaMap.FREE_SHIPPING.description}
                icon={segmentMetaMap.FREE_SHIPPING.icon}
                disabled={!isCreateMode && !editPolicy.canEditAll}
                onClick={() => onChange({ type: 'FREE_SHIPPING' })}
              />
            </div>
          </Field>
        </section>

        <section className="rounded-[18px] border border-[#ECE5DB] bg-white p-4 shadow-[0_1px_0_rgba(30,30,30,0.02)]">
          <div className="grid gap-4 md:grid-cols-3">
          <Field
            label={`${discountValueLabel} *`}
            error={formErrors.discountValue}
            tooltip={fieldTooltipMap.discountValue}
            disabled={!isCreateMode && lockExceptQuantityAndEndDate}
            suffix={typeValue === 'PERCENT' ? '%' : typeValue === 'FREE_SHIPPING' ? 'đ' : 'đ'}
          >
            <input
              type="number"
              min="0"
              value={formState.discountValue}
              onChange={(event) => onChange({ discountValue: event.target.value })}
              disabled={!isCreateMode && lockExceptQuantityAndEndDate}
              className="h-12 w-full bg-transparent px-4 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              placeholder="10"
            />
          </Field>

          <Field
            label="Mức giảm tối đa"
            error={formErrors.maxDiscountAmount}
            tooltip={fieldTooltipMap.maxDiscountAmount}
            disabled={!isCreateMode && lockExceptQuantityAndEndDate}
            suffix="đ"
          >
            <input
              type="number"
              min="0"
              value={formState.maxDiscountAmount}
              onChange={(event) => onChange({ maxDiscountAmount: event.target.value })}
              disabled={!isCreateMode && lockExceptQuantityAndEndDate}
              className="h-12 w-full bg-transparent px-4 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              placeholder="50000"
            />
          </Field>

          <Field
            label="Đơn hàng tối thiểu *"
            error={formErrors.minOrderAmount}
            tooltip={fieldTooltipMap.minOrderAmount}
            disabled={!isCreateMode && lockExceptQuantityAndEndDate}
            suffix="đ"
          >
            <input
              type="number"
              min="0"
              value={formState.minOrderAmount}
              onChange={(event) => onChange({ minOrderAmount: event.target.value })}
              disabled={!isCreateMode && lockExceptQuantityAndEndDate}
              className="h-12 w-full bg-transparent px-4 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              placeholder="100000"
            />
          </Field>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#ECE5DB] bg-white p-4 shadow-[0_1px_0_rgba(30,30,30,0.02)]">
          <div className="grid gap-4 md:grid-cols-3">
          <Field label="Số lượng *" error={formErrors.quantity} tooltip={fieldTooltipMap.quantity} disabled={!isCreateMode && lockAllFields}>
            <input
              type="number"
              min="1"
              value={formState.quantity}
              onChange={(event) => onChange({ quantity: event.target.value })}
              disabled={!isCreateMode && lockAllFields}
              className="h-12 w-full bg-transparent px-4 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              placeholder="100"
            />
          </Field>

          <Field label="Lượt dùng / user" error={formErrors.maxUsagePerUser} tooltip={fieldTooltipMap.maxUsagePerUser} disabled={!isCreateMode && !editPolicy.canEditAll}>
            <input
              type="number"
              min="1"
              value={formState.maxUsagePerUser}
              onChange={(event) => onChange({ maxUsagePerUser: event.target.value })}
              disabled={!isCreateMode && !editPolicy.canEditAll}
              className="h-12 w-full bg-transparent px-4 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              placeholder="1"
            />
          </Field>

          <Field label="Trạng thái *" error={formErrors.status} disabled={!isCreateMode && !editPolicy.canEditAll}>
            <select
              value={formState.status}
              onChange={(event) => onChange({ status: event.target.value as VoucherStatus })}
              disabled={!isCreateMode && !editPolicy.canEditAll}
              className="h-12 w-full bg-transparent px-4 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <option value="">Chọn trạng thái</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </Field>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#ECE5DB] bg-white p-4 shadow-[0_1px_0_rgba(30,30,30,0.02)]">
          <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ngày bắt đầu *" error={formErrors.startDate} tooltip={fieldTooltipMap.startDate} icon={fieldIconMap.startDate} disabled={!isCreateMode && !editPolicy.canEditAll}>
            <input
              type="datetime-local"
              value={formState.startDate}
              onChange={(event) => onChange({ startDate: event.target.value })}
              disabled={!isCreateMode && !editPolicy.canEditAll}
              className="h-12 w-full bg-transparent px-4 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
            />
          </Field>

          <Field label="Ngày kết thúc *" error={formErrors.endDate} tooltip={fieldTooltipMap.endDate} icon={fieldIconMap.endDate} disabled={lockAllFields}>
            <input
              type="datetime-local"
              value={formState.endDate}
              onChange={(event) => onChange({ endDate: event.target.value })}
              disabled={lockAllFields}
              className="h-12 w-full bg-transparent px-4 text-sm text-[#1E1E1E] outline-none disabled:cursor-not-allowed disabled:text-slate-400"
            />
          </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[#E0D7CD] bg-white px-6 text-sm font-semibold text-[#1E1E1E] transition hover:border-[#D4B785] hover:bg-[#FAF6F1]"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={lockAllFields}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1E1E1E] px-6 text-sm font-semibold text-[#FAF6F1] transition hover:bg-[#111111] disabled:cursor-not-allowed disabled:bg-[#B9B9B9]"
          >
            <CheckCircle2 size={16} />
            {modalMode === 'edit' ? (lockAllFields ? 'Không thể chỉnh sửa' : 'Lưu thay đổi') : 'Tạo voucher'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
