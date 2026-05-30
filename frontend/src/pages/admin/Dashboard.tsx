import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeDollarSign,
  CalendarRange,
  Download,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { productManagementApi } from '../../api/admin/productManagementApi';
import { AdminProductDetail } from './AdminProductDetail';
import { orderApi } from '../../api/orderApi';
import { useAuthStore } from '../../store/authStore';
import type { OrderStatus } from '../../types/order';

type PeriodKey = '7d' | '30d' | '90d' | 'custom' | 'all';

const periodOptions: Array<{ value: PeriodKey; label: string }> = [
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: '90d', label: '90 ngày qua' },
  { value: 'custom', label: 'Khoảng tùy chỉnh' },
  { value: 'all', label: 'Tất cả thời gian' },
];

const statusLabelMap: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao thành công',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
  DELIVERY_FAILED: 'Giao thất bại',
};

const revenueStatuses = new Set<OrderStatus>(['DELIVERED']);

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return '--';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const withinDateRange = (value: string, fromDate?: string, toDate?: string) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }
  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`);
    if (parsedDate < from) {
      return false;
    }
  }
  if (toDate) {
    const to = new Date(`${toDate}T23:59:59.999`);
    if (parsedDate > to) {
      return false;
    }
  }
  return true;
};

const getPresetRange = (period: PeriodKey, customFrom: string, customTo: string) => {
  if (period === 'custom') {
    return { fromDate: customFrom, toDate: customTo };
  }
  if (period === 'all') {
    return { fromDate: '', toDate: '', };
  }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  return {
    fromDate: formatDateInputValue(start),
    toDate: formatDateInputValue(end),
  };
};

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatMonthYearLabel = (date: Date) => `${new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(date)} ${date.getFullYear()}`;

const parseDateSafe = (value?: string) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const escapeCsvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const downloadTextFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const MetricCard = ({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
  tone: string;
}) => (
  <article className="group relative overflow-hidden rounded-2xl border border-amber-200/50 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-amber-300/70">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">{value}</h3>
        {detail ? <p className="text-xs leading-5 text-slate-500 font-medium">{detail}</p> : null}
      </div>
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${tone}`}>
        {icon}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent transition-all duration-500 group-hover:w-full" />
  </article>
);

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="border-b border-slate-100 pb-4">
    <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl flex items-center gap-2">
      {title}
    </h2>
    {subtitle ? <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p> : null}
  </div>
);

const RevenueChart = ({ series }: { series: Array<{ label: string; value: number }> }) => {
  const width = 760;
  const height = 240;
  const padding = 32;
  const maxValue = Math.max(...series.map((item) => item.value), 1);

  const points = series.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
    const y = height - padding - (item.value / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

  return (
    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full overflow-visible">
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.00" />
          </linearGradient>
          <linearGradient id="revenueLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#ea580c" floodOpacity="0.15" />
          </filter>
        </defs>

        {[0, 1, 2, 3].map((row) => {
          const y = padding + ((height - padding * 2) * row) / 3;
          return <line key={row} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />;
        })}

        <polygon points={areaPoints} fill="url(#revenueArea)" />
        <polyline points={polylinePoints} fill="none" stroke="url(#revenueLine)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)" />

        {points.map((point) => (
          <g key={point.label} className="group/node cursor-pointer">
            <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke="#ea580c" strokeWidth="3" />
            <circle cx={point.x} cy={point.y} r="10" fill="#ea580c" fillOpacity="0" className="transition-all duration-200 group-hover/node:fill-opacity-15" />
          </g>
        ))}
      </svg>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {series.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm transition-all hover:border-slate-300">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
            <p className="mt-1 text-sm font-extrabold text-slate-900">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const pieColors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#475569', '#0d9488', '#e11d48'];

const PieStatusChart = ({ data }: { data: Array<{ label: string; value: number }> }) => {
  const size = 240;
  const radius = 80;
  const strokeWidth = 28;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-400">Chưa có đơn hàng trong bộ lọc này.</p>
      </div>
    );
  }

  let cumulative = 0;
  const arcs = data.map((item, index) => {
    const fraction = item.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    return {
      key: item.label,
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      color: pieColors[index % pieColors.length],
      value: item.value,
      label: item.label,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around lg:flex-col lg:justify-start xl:flex-row xl:justify-around">
      <div className="relative shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-[220px] w-[220px] overflow-visible drop-shadow-sm">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {arcs.map((arc) => (
            <path key={arc.key} d={arc.path} fill="none" stroke={arc.color} strokeWidth={strokeWidth} strokeLinecap="butt" className="transition-all duration-300 hover:opacity-90" />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tổng số đơn</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{total}</p>
        </div>
      </div>

      <div className="w-full space-y-2 max-w-[260px]">
        {arcs.map((arc) => (
          <div key={arc.key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs transition-all hover:bg-slate-50">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: arc.color }} />
              <span className="font-semibold text-slate-600 truncate">{arc.label}</span>
            </div>
            <span className="font-bold text-slate-900 ml-2">{arc.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const currentUser = useAuthStore((state) => state.user);
  const currentRole = currentUser?.role?.toUpperCase() ?? '';
  const currentEmployeeName = currentUser?.fullName?.trim() || currentUser?.email || 'UNKNOWN';
  const [selectedProduct, setSelectedProduct] = useState<{ slug: string; productId: string } | null>(null);

  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const ordersQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'orders'],
    queryFn: async () => orderApi.getAllOrders(),
    staleTime: 60 * 1000,
    retry: false,
  });

  const bestSellingQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'best-selling'],
    queryFn: async () => productManagementApi.getBestSellingProducts({ page: 0, size: 8 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const topRatedQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'top-rated'],
    queryFn: async () => productManagementApi.getTopRatedProducts({ page: 0, size: 6 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const productCountQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'product-count'],
    queryFn: async () => productManagementApi.getProducts({ page: 0, size: 1 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const orders = ordersQuery.data ?? [];
  const bestSellingProducts = bestSellingQuery.data?.content ?? [];
  const topRatedProducts = topRatedQuery.data?.content ?? [];
  const totalProducts = productCountQuery.data?.totalElements ?? 0;

  const range = getPresetRange(period, customFrom, customTo);

  const filteredOrders = useMemo(() => {
    return [...orders]
      .filter((order) => (range.fromDate || range.toDate ? withinDateRange(order.orderDate, range.fromDate, range.toDate) : true))
      .sort((left, right) => new Date(right.orderDate).getTime() - new Date(left.orderDate).getTime());
  }, [orders, range.fromDate, range.toDate]);

  const summary = useMemo(() => {
    const completedOrders = filteredOrders.filter((order) => revenueStatuses.has(order.status));
    const totalRevenue = completedOrders.reduce((total, order) => total + (order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const refundedOrders = filteredOrders.filter((order) => order.status === 'REFUNDED').length;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      refundedOrders,
      completedOrders: completedOrders.length,
    };
  }, [filteredOrders]);

  const revenueByMonth = useMemo(() => {
    const labels: Record<string, string> = {};
    const series = new Map<string, number>();
    const months = 6;
    const current = new Date();

    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const cursor = new Date(current.getFullYear(), current.getMonth() - offset, 1);
      const key = monthKey(cursor);
      labels[key] = formatMonthYearLabel(cursor);
      series.set(key, 0);
    }

    filteredOrders.forEach((order) => {
      const parsed = parseDateSafe(order.orderDate);
      if (!parsed) return;
      if (!revenueStatuses.has(order.status)) return;

      const key = monthKey(parsed);
      if (series.has(key)) {
        series.set(key, (series.get(key) ?? 0) + (order.total || 0));
      }
    });

    return Array.from(series.entries()).map(([key, value]) => ({ label: labels[key], value }));
  }, [filteredOrders]);

  const statusBreakdown = useMemo(() => {
    const counts = new Map<OrderStatus, number>();
    filteredOrders.forEach((order) => {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    });

    return Object.keys(statusLabelMap)
      .map((status) => ({
        status: status as OrderStatus,
        label: statusLabelMap[status as OrderStatus],
        value: counts.get(status as OrderStatus) ?? 0,
      }))
      .filter((item) => item.value > 0);
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    return bestSellingProducts.map((product) => ({
      ...product,
      sold: product.totalSold ?? product.variants?.reduce((sum, variant) => sum + (variant.sold ?? 0), 0) ?? 0,
    }));
  }, [bestSellingProducts]);

  const maxProductSold = Math.max(...topProducts.map((product) => product.sold ?? 0), 1);

  const exportReport = () => {
    const fileName = `bao-cao-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    const rows: string[][] = [];

    rows.push(['BÁO CÁO HỆ THỐNG DASHBOARD']);
    rows.push(['Thời gian xuất', new Date().toLocaleString('vi-VN')]);
    rows.push(['Tên nhân viên', currentEmployeeName]);
    rows.push(['Vai trò tài khoản', currentRole || 'UNKNOWN']);
    rows.push(['Khoảng bộ lọc', `${range.fromDate || 'Tất cả'} -> ${range.toDate || 'Tất cả'}`]);
    rows.push([]);
    rows.push(['THÔNG SỐ TỔNG QUAN']);
    rows.push(['Tổng doanh thu thực tế', String(summary.totalRevenue)]);
    rows.push(['Tổng lượng đơn hàng', String(summary.totalOrders)]);
    rows.push(['Số đơn hoàn tiền', String(summary.refundedOrders)]);
    rows.push(['Số đơn ghi nhận doanh thu', String(summary.completedOrders)]);
    rows.push(['Tổng số SKU sản phẩm', String(totalProducts)]);

    rows.push([]);
    rows.push(['DOANH THU THEO PHÂN ĐOẠN THÁNG']);
    rows.push(['Tháng cấu hình', 'Doanh thu']);
    revenueByMonth.forEach((item) => rows.push([item.label, String(item.value)]));

    const csv = `\uFEFF${rows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n')}`;

    downloadTextFile(fileName, csv);
  };

  if (ordersQuery.isError || bestSellingQuery.isError || topRatedQuery.isError || productCountQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-6 text-center text-red-800 backdrop-blur-sm shadow-sm max-w-xl mx-auto mt-12">
        <p className="text-base font-bold">⚠️ Không thể đồng bộ dữ liệu Dashboard.</p>
        <p className="mt-1 text-xs text-red-600">Vui lòng tải lại trang hoặc kiểm tra trạng thái hoạt động của hệ thống API Gateway.</p>
      </div>
    );
  }

  if (ordersQuery.isLoading || bestSellingQuery.isLoading || topRatedQuery.isLoading || productCountQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-3xl bg-slate-200/80" />
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (selectedProduct) {
    return (
      <AdminProductDetail
        slug={selectedProduct.slug}
        productId={selectedProduct.productId}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div className="space-y-6 p-1 pb-12 text-slate-600 antialiased">
      {/* Thanh công cụ lọc dữ liệu */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarRange size={16} className="text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bộ lọc kỳ:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as PeriodKey)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-inner transition focus:border-slate-400 focus:bg-white"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {period === 'custom' && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-slate-400"
                />
                <span className="text-xs font-bold text-slate-300">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-slate-400"
                />
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={exportReport}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 shrink-0"
        >
          <Download size={12} />
          Xuất báo cáo (.CSV)
        </button>
      </section>

      {/* Grid chứa 4 Thẻ chỉ số tổng quan */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Doanh thu thực nhận"
          value={formatCurrency(summary.totalRevenue)}
          detail={`${summary.completedOrders} đơn đã giao thành công`}
          icon={<BadgeDollarSign size={20} />}
          tone="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Tổng đơn phát sinh"
          value={String(summary.totalOrders)}
          detail="Tính trên tất cả đơn hàng có trong bộ lọc"
          icon={<ShoppingBag size={20} />}
          tone="bg-sky-50 text-sky-600"
        />
        <MetricCard
          label="AOV (Giá trị đơn mẫu)"
          value={formatCurrency(summary.averageOrderValue)}
          detail="Tính trên tập đơn có doanh thu"
          icon={<TrendingUp size={20} />}
          tone="bg-amber-50 text-amber-600"
        />
        <MetricCard
          label="Tổng SKU hệ thống"
          value={String(totalProducts)}
          detail="Số lượng mã sản phẩm trong kho"
          icon={<Package size={20} />}
          tone="bg-violet-50 text-violet-600"
        />
      </section>

      {/* Biểu đồ doanh thu và trạng thái */}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <SectionTitle title="Phát triển doanh thu 6 tháng" subtitle="Giá trị tích lũy định kỳ dựa trên các đơn giao nhận và thanh toán hợp lệ." />
          <RevenueChart series={revenueByMonth} />
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <SectionTitle title="Cấu trúc trạng thái đơn" subtitle="Biểu đồ phân bổ cơ cấu đầu đơn trong khoảng thời gian áp dụng bộ lọc." />
          <div className="mt-6">
            <PieStatusChart data={statusBreakdown.map((item) => ({ label: item.label, value: item.value }))} />
          </div>
        </article>
      </section>

      {/* Bảng xếp hạng sản phẩm */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Top bán chạy */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <SectionTitle title="Sản phẩm bán chạy nhất"/>
          <div className="mt-5 space-y-3.5">
            {topProducts.slice(0, 5).map((product) => {
              const percent = `${Math.max(((product.sold ?? 0) / maxProductSold) * 100, 8)}%`;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProduct({ slug: product.slug, productId: product.id })}
                  className="group/item relative w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 text-left transition-all hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                >
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover/item:text-orange-700 transition-colors">{product.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400 font-medium">
                        {product.brandName || 'Thương hiệu lẻ'} · {product.categoryName || 'Mỹ phẩm'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đã bán</p>
                      <p className="text-base font-black text-slate-800">{product.sold ?? 0}</p>
                    </div>
                  </div>
                  
                  {/* Thanh biểu đồ tỷ lệ thanh lịch */}
                  <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500" style={{ width: percent }} />
                  </div>
                  
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-100 px-2 py-0.5 text-slate-600 shadow-2xs">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      {typeof product.averageRating === 'number' ? product.averageRating.toFixed(1) : '--'}
                    </span>
                    <span>{product.totalReviews ?? 0} lượt review</span>
                  </div>
                </button>
              );
            })}
            {topProducts.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Chưa có dữ liệu sản phẩm.</p>}
          </div>
        </article>

        {/* Top đánh giá cao */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <SectionTitle title="Sản phẩm được đánh giá cao"/>
          <div className="mt-5 space-y-3">
            {topRatedProducts.slice(0, 5).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedProduct({ slug: product.slug, productId: product.id })}
                className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 text-left transition-all hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400 font-medium">{product.brandName || 'Nhãn hàng nội địa'} · <span className="text-slate-500 font-semibold">{formatCurrency(product.minPrice ?? product.maxPrice)}</span></p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-black text-amber-700 shadow-3xs">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    {typeof product.averageRating === 'number' ? product.averageRating.toFixed(1) : '--'}
                  </span>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </button>
            ))}
            {topRatedProducts.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Chưa có dữ liệu đánh giá.</p>}
          </div>
        </article>
      </section>
    </div>
  );
};