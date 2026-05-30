import { useMemo, useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { BadgeDollarSign, BadgePercent, CalendarRange, Check, Copy, Eye, FileText, Filter, Gift, Hash, Pencil, Plus, Search, Ticket, TicketPercent, Truck, UserRound } from 'lucide-react';
import { VoucherFormModal } from './voucher-management/components/VoucherFormModal';
import { emptyVoucherForm, initialVouchers, statusOptions, statusToneMap, voucherTypeLabels } from './voucher-management/voucherData';
import type { ModalMode, StatusFilter, Voucher, VoucherFormState, VoucherStatus, VoucherType } from './voucher-management/types';
import { voucherApi } from '../../api/admin/voucherApi';

type DetailDialogState = {
  voucherId: string;
} | null;

const formatDateTimeInput = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDateTable = (value: string) => {
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

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '--';
  }

  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)} đ`;
};

const voucherTypeIconMap = {
  PERCENT: BadgePercent,
  AMOUNT: BadgeDollarSign,
  FREE_SHIPPING: Truck,
} as const;

const voucherTypeLabelMap = {
  PERCENT: 'Giảm theo phần trăm',
  AMOUNT: 'Giảm theo số tiền',
  FREE_SHIPPING: 'Miễn phí vận chuyển',
} as const;

const getDiscountLabel = (voucher: Voucher) => {
  if (voucher.type === 'PERCENT') {
    const maxDiscount = voucher.maxDiscountAmount ? ` (tối đa ${formatCurrency(voucher.maxDiscountAmount)})` : '';
    return `${voucher.discountValue}%${maxDiscount}`;
  }

  if (voucher.type === 'FREE_SHIPPING') {
    return `Miễn ship ${formatCurrency(voucher.maxDiscountAmount ?? voucher.discountValue)}`;
  }

  return formatCurrency(voucher.discountValue);
};

const getStatusWhenEnable = (voucher: Voucher): VoucherStatus => {
  const now = new Date();
  const start = new Date(voucher.startDate);
  const end = new Date(voucher.endDate);

  if (!Number.isNaN(start.getTime()) && now < start) {
    return 'UPCOMING';
  }

  if (!Number.isNaN(end.getTime()) && now > end) {
    return 'EXPIRED';
  }

  return 'ACTIVE';
};

const copyTextToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
  }
};

const generateVoucherId = () => `voucher-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;

const parseFormErrors = (form: VoucherFormState) => {
  const errors: Record<string, string> = {};

  if (!form.code.trim()) {
    errors.code = 'Vui lòng nhập mã voucher';
  } else if (!/^[A-Z0-9_-]+$/.test(form.code.trim().toUpperCase())) {
    errors.code = 'Mã voucher chỉ gồm chữ in hoa, số, _ và -';
  }

  if (!form.name.trim()) {
    errors.name = 'Vui lòng nhập tên voucher';
  }

  if (!form.type) {
    errors.type = 'Vui lòng chọn loại voucher';
  }

  if (!form.discountValue.trim() || Number(form.discountValue) <= 0) {
    errors.discountValue = 'Giá trị giảm phải lớn hơn 0';
  }

  if (form.maxDiscountAmount.trim() !== '' && Number(form.maxDiscountAmount) < 0) {
    errors.maxDiscountAmount = 'Mức giảm tối đa phải >= 0';
  }

  if (!form.minOrderAmount.trim() || Number(form.minOrderAmount) < 0) {
    errors.minOrderAmount = 'Giá trị đơn hàng tối thiểu phải >= 0';
  }

  if (!form.quantity.trim() || Number(form.quantity) <= 0) {
    errors.quantity = 'Số lượng phải lớn hơn 0';
  }

  if (form.maxUsagePerUser.trim() !== '' && Number(form.maxUsagePerUser) <= 0) {
    errors.maxUsagePerUser = 'Giới hạn lượt dùng phải lớn hơn 0';
  }

  if (!form.status) {
    errors.status = 'Vui lòng chọn trạng thái';
  }

  if (!form.startDate) {
    errors.startDate = 'Vui lòng chọn ngày bắt đầu';
  }

  if (!form.endDate) {
    errors.endDate = 'Vui lòng chọn ngày kết thúc';
  }

  if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
    errors.endDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu';
  }

  return errors;
};

const createVoucherFromForm = (form: VoucherFormState, id?: string): Voucher => ({
  id: id ?? generateVoucherId(),
  code: form.code.trim().toUpperCase(),
  name: form.name.trim(),
  description: form.description.trim(),
  type: form.type as VoucherType,
  discountValue: Number(form.discountValue),
  maxDiscountAmount: form.maxDiscountAmount.trim() === '' ? null : Number(form.maxDiscountAmount),
  minOrderAmount: Number(form.minOrderAmount),
  quantity: Number(form.quantity),
  maxUsagePerUser: form.maxUsagePerUser.trim() === '' ? null : Number(form.maxUsagePerUser),
  status: form.status as VoucherStatus,
  startDate: new Date(form.startDate).toISOString(),
  endDate: new Date(form.endDate).toISOString(),
  createdAt: new Date().toISOString(),
});

const mapVoucherToForm = (voucher: Voucher): VoucherFormState => ({
  code: voucher.code,
  name: voucher.name,
  description: voucher.description ?? '',
  type: voucher.type,
  discountValue: String(voucher.discountValue),
  maxDiscountAmount: voucher.maxDiscountAmount === null || voucher.maxDiscountAmount === undefined ? '' : String(voucher.maxDiscountAmount),
  minOrderAmount: String(voucher.minOrderAmount),
  quantity: String(voucher.quantity),
  maxUsagePerUser: voucher.maxUsagePerUser === null || voucher.maxUsagePerUser === undefined ? '' : String(voucher.maxUsagePerUser),
  status: voucher.status,
  startDate: formatDateTimeInput(voucher.startDate),
  endDate: formatDateTimeInput(voucher.endDate),
});

export const VoucherManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [voucherRows, setVoucherRows] = useState<Voucher[]>(initialVouchers);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [formState, setFormState] = useState<VoucherFormState>(emptyVoucherForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>(null);
  const [pendingToggleVoucherId, setPendingToggleVoucherId] = useState<string | null>(null);

  const filteredVouchers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return voucherRows.filter((voucher) => {
      const matchesSearch =
        !query ||
        voucher.code.toLowerCase().includes(query) ||
        voucher.name.toLowerCase().includes(query) ||
        voucher.id.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || voucher.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, voucherRows]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingVoucherId(null);
    setFormState(emptyVoucherForm());
    setFormErrors({});
  };

  const openEditModal = (voucher: Voucher) => {
    setModalMode('edit');
    setEditingVoucherId(voucher.id);
    setFormState(mapVoucherToForm(voucher));
    setFormErrors({});
  };

  const openEditFromDetail = () => {
    if (!selectedVoucher) {
      return;
    }

    setDetailDialog(null);
    openEditModal(selectedVoucher);
  };

  const openDetailDialog = (voucher: Voucher) => {
    setDetailDialog({ voucherId: voucher.id });
  };

  useEffect(() => {
    let mounted = true;
    voucherApi
      .getVouchers()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setVoucherRows(data);
        }
      })
      .catch(() => {
        toast.error('Không thể tải danh sách voucher');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setModalMode(null);
    setEditingVoucherId(null);
    setFormState(emptyVoucherForm());
    setFormErrors({});
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = parseFormErrors(formState);
    const normalizedCode = formState.code.trim().toUpperCase();

    if (voucherRows.some((voucher) => voucher.code === normalizedCode && voucher.id !== editingVoucherId)) {
      errors.code = 'Mã voucher đã tồn tại';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const voucherPayload = createVoucherFromForm(formState, editingVoucherId ?? undefined);

    try {
      if (modalMode === 'edit' && editingVoucherId) {
        const updated = await voucherApi.updateVoucher(editingVoucherId, voucherPayload);
        setVoucherRows((currentRows) => currentRows.map((voucher) => (voucher.id === editingVoucherId ? updated : voucher)));
        toast.success('Đã cập nhật voucher.');
      } else {
        const created = await voucherApi.createVoucher(voucherPayload);
        setVoucherRows((currentRows) => [created, ...currentRows]);
        toast.success('Đã tạo voucher mới.');
      }
      resetForm();
    } catch {
      toast.error('Lỗi khi lưu voucher');
    }
  };

  const toggleVoucherStatus = (voucher: Voucher) => {
    if (pendingToggleVoucherId === voucher.id) {
      return;
    }

    const nextStatus: VoucherStatus = voucher.status === 'DISABLED' ? getStatusWhenEnable(voucher) : 'DISABLED';
    setPendingToggleVoucherId(voucher.id);

    voucherApi
      .changeStatus(voucher.id, nextStatus)
      .then((updated) => {
        setVoucherRows((currentRows) => currentRows.map((row) => (row.id === voucher.id ? updated : row)));
        if (nextStatus === 'DISABLED') {
          toast.success('Đã vô hiệu hóa voucher.');
        } else {
          toast.success(`Đã bật lại voucher với trạng thái ${nextStatus}.`);
        }
      })
      .catch(() => {
        toast.error('Không thể cập nhật trạng thái voucher');
      })
      .finally(() => {
        setPendingToggleVoucherId(null);
      });
  };

  const selectedVoucher = useMemo(() => {
    if (!detailDialog) {
      return null;
    }
    return voucherRows.find((voucher) => voucher.id === detailDialog.voucherId) ?? null;
  }, [detailDialog, voucherRows]);

  const canEditSelectedVoucher = selectedVoucher
    ? selectedVoucher.status === 'ACTIVE' || selectedVoucher.status === 'UPCOMING'
    : false;

  return (
    <div className="space-y-5 font-['Arial'] text-[#1E1E1E]">
      <section className="rounded-3xl border border-[#E0D7CD] bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1E1E1E] text-[#D4B785]">
                <Ticket size={18} />
              </div>
              <div>
                <h1 className="text-2xl font-bold lg:text-3xl">Quản lý voucher</h1>
                <p className="mt-1 text-sm text-slate-500">Quản lý danh sách voucher theo dạng bảng, đồng bộ thao tác với API.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#BDD1EA] bg-[#EAF3FF] px-4 py-3 text-sm leading-6 text-[#234B78]">
              Voucher dùng để giảm trừ chi phí đơn hàng. Bạn có thể tạo voucher mới, tìm kiếm theo mã hoặc tên, và thao tác nhanh trên từng dòng.
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1A73E8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1765CA]"
          >
            <Plus size={16} />
            Tạo voucher
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[#E0D7CD] bg-white p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
         
          <div className="grid gap-3 md:grid-cols-[220px_300px]">
            <label className="flex items-center gap-2 rounded-md border border-[#D0D7E2] bg-white px-3 py-2 text-slate-500 transition focus-within:border-[#1A73E8]">
              <Filter size={16} className="shrink-0 text-[#5F6368]" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full bg-transparent text-sm text-[#1E1E1E] focus:outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-md border border-[#D0D7E2] bg-white px-3 py-2 text-slate-500 transition focus-within:border-[#1A73E8]">
              <Search size={16} className="shrink-0 text-[#5F6368]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo mã hoặc tên voucher"
                className="w-full bg-transparent text-sm text-[#1E1E1E] placeholder:text-slate-400 focus:outline-none"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#E0D7CD] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-[#F6F8FB] text-xs uppercase tracking-wide text-[#5F6368]">
              <tr>
                <th className="w-[12%] px-4 py-3 text-left">CODE</th>
                <th className="w-[12%] px-4 py-3 text-left">Loại voucher</th>
                <th className="w-[18%] px-4 py-3 text-left">Giá trị giảm</th>
                <th className="w-[8%] px-3 py-3 text-center">Số lượng</th>
                <th className="w-[10%] px-3 py-3 text-center">Giới hạn/user</th>
                <th className="w-[12%] px-4 py-3 text-left">Trạng thái</th>
                <th className="w-[16%] px-4 py-3 text-left">Thời gian áp dụng</th>
                <th className="w-[12%] px-4 py-3 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map((voucher) => {
                const tone = statusToneMap[voucher.status];
                const isEnabled = voucher.status !== 'DISABLED';
                const isTogglePending = pendingToggleVoucherId === voucher.id;

                return (
                  <tr key={voucher.id} className="border-t border-[#E7EBF0] text-[#1E1E1E] transition hover:bg-[#FAFCFF]">
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-[#1E1E1E]">{voucher.code}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-[#3A3224]">
                      {(() => {
                        const TypeIcon = voucherTypeIconMap[voucher.type];
                        const label = voucherTypeLabelMap[voucher.type];

                        return (
                          <span
                            title={label}
                            aria-label={label}
                            className="inline-flex h-8 w-8 items-center justify-center  text-[#3A3224]"
                          >
                            <TypeIcon size={16} />
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 align-top">{getDiscountLabel(voucher)}</td>
                    <td className="px-3 py-3 text-center align-top whitespace-nowrap">{voucher.quantity}</td>
                    <td className="px-3 py-3 text-center align-top whitespace-nowrap">{voucher.maxUsagePerUser ?? '--'}</td>
                    <td className="px-4 py-3 align-top">
                        <span className={`inline-flex items-center justify-center rounded-lg px-1 py-1 text-xs font-semibold ${tone.badgeClass}`}>
                        {tone.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
                      <p className="font-semibold text-[#0e6f38]">Từ: {formatDateTable(voucher.startDate)}</p>
                      <p className="mt-1 font-semibold text-[#941c1a]">Đến: {formatDateTable(voucher.endDate)}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetailDialog(voucher)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D0D7E2] text-[#1A73E8] transition hover:border-[#1A73E8] hover:bg-[#EAF3FF]"
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết voucher ${voucher.code}`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVoucherStatus(voucher)}
                          className={`relative inline-flex h-6 w-10 items-center rounded-full border transition ${isEnabled ? 'border-[#16A34A] bg-[#22C55E]' : 'border-[#CBD5E1] bg-[#E2E8F0]'} ${isTogglePending ? 'cursor-wait opacity-70' : 'hover:brightness-95'}`}
                          disabled={isTogglePending}
                          title={isEnabled ? 'Tắt voucher' : 'Bật lại voucher'}
                          aria-label={`${isEnabled ? 'Tắt' : 'Bật lại'} voucher ${voucher.code}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${isEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredVouchers.length === 0 ? (
                <tr className="border-t border-[#E7EBF0]">
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={8}>
                    Không tìm thấy voucher phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#E7EBF0] bg-[#F9FBFF] px-4 py-3 text-xs text-slate-500">
          <span>Tổng số bản ghi: {filteredVouchers.length}</span>
          <span>Số dòng mỗi trang: 10</span>
        </div>
      </section>

      {modalMode ? (
        <VoucherFormModal
          title={modalMode === 'edit' ? 'Chỉnh sửa voucher' : 'Tạo Voucher mới'}
          formState={formState}
          formErrors={formErrors}
          modalMode={modalMode}
          onClose={resetForm}
          onSubmit={handleFormSubmit}
          onChange={(patch) => setFormState((current) => ({ ...current, ...patch }))}
        />
      ) : null}

      {detailDialog && selectedVoucher ? (
        <ModalShell title="Chi tiết voucher" onClose={() => setDetailDialog(null)}>
          <div className="grid gap-4">
            <section className="grid gap-4 rounded-[22px] border border-[#E8DED3] bg-[linear-gradient(135deg,#FFF7EC_0%,#FBF6EF_45%,#FFFFFF_100%)] p-5 lg:grid-cols-[1.35fr_0.9fr] lg:items-stretch">
              <div className="flex items-center gap-4">
                <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#F6C66B_0%,#E8A94E_100%)] text-white shadow-[0_10px_24px_rgba(232,169,78,0.28)]">
                  <TicketPercent size={46} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-800">Mã voucher</p>
                  <div className="mt-1 flex items-center gap-2">
                    <h3 className="text-4xl font-bold tracking-tight text-[#1E1E1E]">{selectedVoucher.code}</h3>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await copyTextToClipboard(selectedVoucher.code);
                          toast.success('Đã sao chép mã voucher.', { duration: 500 });
                        } catch {
                          toast.error('Không thể sao chép mã voucher.');
                        }
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E0D7CD] text-[#7A6A59] transition hover:border-[#D4B785] hover:bg-white"
                      aria-label={`Sao chép mã voucher ${selectedVoucher.code}`}
                      title="Sao chép mã"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-[#6B6258]">{getDiscountLabel(selectedVoucher)}</p>
                </div>
              </div>

              <div className="flex items-center rounded-[18px] border border-white/80 bg-white/85 p-4 shadow-[0_8px_22px_rgba(30,30,30,0.06)]">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#FAF6F1] text-[#8B7A68]">
                  <Ticket size={22} />
                </div>
                <div className="ml-4 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-800">Loại</p>
                  <p className="mt-1 text-2xl font-bold text-[#1E1E1E]">{voucherTypeLabels[selectedVoucher.type]}</p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <DetailCard icon={<Gift size={22} />} title="Giá trị giảm" value={getDiscountLabel(selectedVoucher)} iconTone="violet" valueClassName="text-[#5E2EC0]" />
              <DetailCard icon={<Hash size={22} />} title="Số lượng" value={String(selectedVoucher.quantity)} iconTone="blue" valueClassName="text-[#2A67D4]" />
              <DetailCard icon={<UserRound size={22} />} title="Giới hạn / user" value={String(selectedVoucher.maxUsagePerUser ?? '--')} iconTone="green" valueClassName="text-[#12A76A]" />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <DetailCard
                icon={<Check size={22} />}
                title="Trạng thái"
                value={statusToneMap[selectedVoucher.status].label}
                iconTone="rose"
                valueClassName="inline-flex rounded-full bg-[#DCF4E1] px-3 py-1 text-sm font-semibold text-[#118A32]"
              />
              <DetailCard
                icon={<CalendarRange size={22} />}
                title="Hiệu lực"
                value={`${formatDateTable(selectedVoucher.startDate)}  →  ${formatDateTable(selectedVoucher.endDate)}`}
                iconTone="violet"
                valueClassName="text-[#1E1E1E]"
              />
            </section>

            <section className="rounded-[18px] border border-[#E8DED3] bg-white p-4 lg:p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#FFF2D9] text-[#D28B18]">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-800">Mô tả</p>
                  <p className="mt-2 text-sm leading-6 text-[#1E1E1E]">{selectedVoucher.description || 'Chưa có mô tả'}</p>
                </div>
              </div>
            </section>

            {!canEditSelectedVoucher ? (
              <div className="rounded-[18px] border border-[#F2C7C7] bg-[#FFF4F4] px-4 py-3 text-sm text-[#9A2C2C]">
                Voucher ở trạng thái {statusToneMap[selectedVoucher.status].label.toLowerCase()} không thể chỉnh sửa.
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDetailDialog(null)}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#E0D7CD] bg-white px-5 text-sm font-semibold text-[#1E1E1E] transition hover:border-[#D4B785] hover:bg-[#FAF6F1]"
              >
                Đóng
              </button>
              {canEditSelectedVoucher ? (
                <button
                  type="button"
                  onClick={openEditFromDetail}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1E1E1E] px-5 text-sm font-semibold text-[#FAF6F1] transition hover:bg-[#111111]"
                >
                  <Pencil size={16} />
                  Chỉnh sửa voucher
                </button>
              ) : null}
            </div>
          </div>
        </ModalShell>
      ) : null}


    </div>
  );
};

const ModalShell = ({ title, children, onClose, narrow = false }: { title: string; children: ReactNode; onClose: () => void; narrow?: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
    <div
      className={`relative w-full ${narrow ? 'max-w-2xl' : 'max-w-4xl'} overflow-hidden rounded-[30px] border border-[#E0D7CD] bg-white shadow-[0_40px_100px_rgba(30,30,30,0.24)]`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-[#EFE5DA] px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#C5A872]">Lumiere</p>
          <h2 className="mt-1 text-xl font-semibold text-[#1E1E1E]">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-[#E0D7CD] text-[#1E1E1E] transition hover:bg-[#FAF6F1]">
          x
        </button>
      </div>
      <div className="max-h-[82vh] overflow-auto p-6">{children}</div>
    </div>
  </div>
);

const DetailCard = ({
  icon,
  title,
  value,
  iconTone,
  valueClassName,
}: {
  icon: ReactNode;
  title: string;
  value: ReactNode;
  iconTone: 'violet' | 'blue' | 'green' | 'rose';
  valueClassName?: string;
}) => {
  const iconToneClassMap = {
    violet: 'bg-[#F1E9FF] text-[#6B2CD6]',
    blue: 'bg-[#E9F0FF] text-[#2A67D4]',
    green: 'bg-[#E7F7EF] text-[#12A76A]',
    rose: 'bg-[#FCE9EA] text-[#EA4335]',
  } as const;

  return (
    <div className="rounded-[22px] border border-[#E8DED3] bg-white p-4 shadow-[0_8px_22px_rgba(30,30,30,0.04)]">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${iconToneClassMap[iconTone]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-800">{title}</p>
          <div className={`mt-1 text-lg font-semibold leading-7 ${valueClassName ?? 'text-[#1E1E1E]'}`}>{value}</div>
        </div>
      </div>
    </div>
  );
};
