import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const AdminNotFound = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-[#E0D7CD] bg-white p-6 shadow-sm">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#F8E8E8] text-[#B4534A]">
          <ShieldAlert size={30} />
        </div>

        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-[#B4534A]">Not found</p>
        <h1 className="mt-3 text-3xl font-bold text-[#1E1E1E]">Trang này không tồn tại hoặc bạn không có quyền truy cập</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Voucher là khu vực chỉ dành cho quản trị viên. Nếu bạn cần quay lại trang phù hợp, hãy trở về dashboard nội bộ.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-[#1A73E8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1765CA]"
          >
            <ArrowLeft size={16} />
            Quay lại dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};