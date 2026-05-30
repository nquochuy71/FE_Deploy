import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Camera, Calendar, CheckCircle, Edit3, Mail, Phone, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EmployeeProfileInfo, EmployeeUpdateRequest, UserProfileInfo } from '../../types/api';

type EmployeeProfileProps = {
  user: UserProfileInfo;
  employee: EmployeeProfileInfo;
  onSave: (data: EmployeeUpdateRequest) => Promise<void>;
  onEditAvatar?: () => void;
};

export const EmployeeProfile = ({ user, employee, onSave, onEditAvatar }: EmployeeProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? '');

  useEffect(() => {
    setFullName(user.fullName ?? '');
    setPhoneNumber(user.phoneNumber ?? '');
    setFieldErrors({});
  }, [user]);

  const hasChanges = useMemo(() => {
    return (
      fullName.trim() !== (user.fullName ?? '') ||
      phoneNumber.trim() !== (user.phoneNumber ?? '')
    );
  }, [fullName, phoneNumber, user]);

  const handleCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
    setFullName(user.fullName ?? '');
    setPhoneNumber(user.phoneNumber ?? '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    const trimmedFullName = fullName.trim();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!trimmedFullName) {
      errors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!trimmedPhoneNumber) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(trimmedPhoneNumber)) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    setFieldErrors({});

    try {
      await onSave({
        fullName: trimmedFullName,
        phoneNumber: trimmedPhoneNumber,
      });

      toast.success('Cập nhật thông tin thành công.');
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật thông tin.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      background: '#fff',
      boxShadow: '0 12px 30px rgba(201,169,110,0.12)',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '2rem',
      border: '1px solid rgba(201,169,110,0.18)',
    }}>

      <div style={{ padding: '0 2.5rem', marginTop: '40px', display: 'flex', alignItems: 'flex-end', gap: '2rem', marginBottom: '2.5rem', position: 'relative', zIndex: 10 }}>
        {/* Avatar với viền Gold dày */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: '#fff',
          padding: '5px',
          boxShadow: '0 8px 20px rgba(184, 134, 11, 0.2)',
          border: '3px solid #D4AF37', // Màu vàng Gold mã chuẩn
          flexShrink: 0,
          position: 'relative'
        }}>
          {onEditAvatar ? (
            <button
              type="button"
              onClick={onEditAvatar}
              aria-label="Đổi ảnh đại diện"
              style={{ position: 'absolute', top: 'auto', bottom: '-4px', right: '-4px', width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #fff', background: 'linear-gradient(135deg, #D4AF37, #B8860B)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(184, 134, 11, 0.28)', cursor: 'pointer' }}
            >
              <Camera size={16} />
            </button>
          ) : null}
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f9f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
              <User size={48} />
            </div>
          )}
        </div>

        <div style={{ paddingBottom: '15px' }}>
          <h3 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0, color: '#1a1a1a', letterSpacing: '-0.5px' }}>
            {user.fullName || 'Nhân viên'}
          </h3>
          <span style={{
            background: 'linear-gradient(to right, #fef3c7, #fde68a)',
            color: '#92400e',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-block',
            marginTop: '8px',
            textTransform: 'uppercase'
          }}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Phần thông tin hiển thị */}
      <div style={{ padding: '0 2.5rem 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            <ProfileRow icon={<Mail size={18} color="#D4AF37" />} label="Email" value={user.email} verified={user.emailVerified} />
            <ProfileRow icon={<Phone size={18} color="#D4AF37" />} label="Số điện thoại" value={user.phoneNumber} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            <ProfileRow icon={<Calendar size={18} color="#D4AF37" />} label="Mã nhân viên" value={user.employeeCode} />
            <ProfileRow icon={<Calendar size={18} color="#D4AF37" />} label="Ngày vào làm" value={formatDate(user.hireDate)} />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '2rem 2.5rem', background: '#fafafa' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#B8860B', fontWeight: 600 }}>Thông tin cơ bản</h4>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9rem' }}>Bạn có thể cập nhật thông tin định danh tại đây.</p>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: '2px solid #D4AF37',
                background: '#fff',
                color: '#B8860B',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <Edit3 size={18} /> CHỈNH SỬA
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <TextField
                label="Họ và tên"
                value={fullName}
                error={fieldErrors.fullName}
                onChange={(value) => {
                  setFullName(value);
                  setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="Nhập họ và tên"
              />

              <TextField
                label="Số điện thoại"
                value={phoneNumber}
                error={fieldErrors.phoneNumber}
                onChange={(value) => {
                  setPhoneNumber(value);
                  setFieldErrors((prev) => ({ ...prev, phoneNumber: '' }));
                }}
                placeholder="0901234567"
                type="tel"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="btn btn--primary"
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #D4AF37, #B8860B)', // Nút vàng gradient
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(184, 134, 11, 0.3)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn"
                style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Huỷ
              </button>
            </div>
          </form>
        ) : (
          <div style={{ color: '#6b7280', fontSize: '0.95rem' }}>
            {employee.id ? 'Bấm Chỉnh sửa để cập nhật thông tin.' : 'Không tìm thấy mã nhân viên để chỉnh sửa.'}
          </div>
        )}
      </div>
    </div>
  );
};

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          background: '#fff',
          color: '#111827',
          outline: 'none',
        }}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  verified,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  verified?: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem', marginBottom: '4px' }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ wordBreak: 'break-all' }}>{value || 'Chưa cập nhật'}</span>
        {typeof verified === 'boolean' && (
          verified ? <span title="Đã xác thực" style={{ color: '#10b981', display: 'flex', flexShrink: 0 }}><CheckCircle size={16} /></span> : <span title="Chưa xác thực" style={{ color: '#f59e0b', display: 'flex', flexShrink: 0 }}><XCircle size={16} /></span>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return 'Chưa có thông tin';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}