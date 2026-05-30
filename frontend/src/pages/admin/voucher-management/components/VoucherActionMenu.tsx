import { PencilLine, Power, ToggleLeft } from 'lucide-react';
import type { ReactNode } from 'react';

const MenuAction = ({
  label,
  onClick,
  dangerous = false,
  icon,
}: {
  label: string;
  onClick: () => void;
  dangerous?: boolean;
  icon: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[#FAF6F1] ${dangerous ? 'text-[#C5221F]' : 'text-[#1E1E1E]'}`}
  >
    <span className={dangerous ? 'text-[#C5221F]' : 'text-[#C5A872]'}>{icon}</span>
    {label}
  </button>
);

export const VoucherActionMenu = ({
  onEdit,
  onChangeStatus,
  onDisable,
}: {
  onEdit: () => void;
  onChangeStatus: () => void;
  onDisable: () => void;
}) => {
  return (
    <div className="w-44 overflow-hidden rounded-2xl border border-[#E0D7CD] bg-white shadow-[0_24px_50px_rgba(30,30,30,0.18)]">
      <MenuAction label="Sửa" icon={<PencilLine size={16} />} onClick={onEdit} />
      <MenuAction label="Đổi trạng thái" icon={<ToggleLeft size={16} />} onClick={onChangeStatus} />
      <MenuAction label="Vô hiệu hóa" icon={<Power size={16} />} onClick={onDisable} dangerous />
    </div>
  );
};
