import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Camera, Calendar, CheckCircle, Edit3, Mail, Phone, Sparkles, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerProfileInfo, CustomerUpdateRequest, UserProfileInfo } from '../../types/api';

type CustomerProfileProps = {
  user: UserProfileInfo;
  customer: CustomerProfileInfo;
  onSave: (data: CustomerUpdateRequest) => Promise<void>;
  onEditAvatar?: () => void;
};

const genderOptions = [
  { label: 'Nam', value: 'MALE' },
  { label: 'Nữ', value: 'FEMALE' },
  { label: 'Khác', value: 'OTHER' },
];

const skinTypeOptions = [
  { label: 'Khô', value: 'DRY' },
  { label: 'Dầu', value: 'OILY' },
  { label: 'Hỗn hợp', value: 'COMBINATION' },
  { label: 'Nhạy cảm', value: 'SENSITIVE' },
];

const skinConcernOptions = [
  { label: 'Mụn', value: 'Mụn' },
  { label: 'Nám', value: 'Nám' },
  { label: 'Lão hoá', value: 'Lão hoá' },
];

const phoneNumberPattern = /^(03|05|07|08|09)\d{8}$/;

export const CustomerProfile = ({ user, customer, onSave, onEditAvatar }: CustomerProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(formatDateInput(user.dateOfBirth));
  const [gender, setGender] = useState(user.gender ?? '');
  const [skinType, setSkinType] = useState(normalizeSkinTypeValue(user.skinType));
  const [skinConcerns, setSkinConcerns] = useState(normalizeSkinConcernValues(user.skinConcerns));

  // Populate form values when user opens edit mode instead of on every user change

  const hasChanges = useMemo(() => {
    return (
      fullName.trim() !== (user.fullName ?? '') ||
      phoneNumber.trim() !== (user.phoneNumber ?? '') ||
      dateOfBirth !== formatDateInput(user.dateOfBirth) ||
      gender !== (user.gender ?? '') ||
      skinType !== normalizeSkinTypeValue(user.skinType) ||
      !areStringArraysEqual(skinConcerns, normalizeSkinConcernValues(user.skinConcerns))
    );
  }, [dateOfBirth, gender, fullName, phoneNumber, skinConcerns, skinType, user]);

  const handleCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
    setFullName(user.fullName ?? '');
    setPhoneNumber(user.phoneNumber ?? '');
    setDateOfBirth(formatDateInput(user.dateOfBirth));
    setGender(user.gender ?? '');
    setSkinType(normalizeSkinTypeValue(user.skinType));
    setSkinConcerns(normalizeSkinConcernValues(user.skinConcerns));
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
    } else if (!phoneNumberPattern.test(trimmedPhoneNumber)) {
      errors.phoneNumber = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09';
    }

    if (dateOfBirth && Number.isNaN(new Date(`${dateOfBirth}T00:00:00`).getTime())) {
      errors.dateOfBirth = 'Ngày sinh không hợp lệ';
    } else if (dateOfBirth && isFutureDate(dateOfBirth)) {
      errors.dateOfBirth = 'Ngày sinh không được là tương lai';
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
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        skinType: skinType || undefined,
        skinConcerns,
      });

      toast.success('Cập nhật thông tin cá nhân thành công.');
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật thông tin cá nhân.';
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

      <div style={{ padding: '0 2.5rem', marginTop: '40px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#fff', padding: '5px', boxShadow: '0 8px 20px rgba(184, 134, 11, 0.2)', border: '3px solid #D4AF37', flexShrink: 0, position: 'relative' }}>
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
        <div style={{ paddingBottom: '10px' }}>
          <h3 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0, color: '#1a1a1a', letterSpacing: '-0.5px' }}>{user.fullName || 'Khách hàng'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: 'linear-gradient(to right, #fef3c7, #fde68a)', color: '#92400e', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-block', textTransform: 'uppercase' }}>
              CUSTOMER
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 2rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileRow icon={<Mail size={16} color="#D4AF37" />} label="Email" value={user.email} verified={user.emailVerified} />
            <ProfileRow icon={<Phone size={16} color="#D4AF37" />} label="Số điện thoại" value={user.phoneNumber || 'Chưa cập nhật'} />
            <ProfileRow icon={<Sparkles size={18} color="#D4AF37" />} label="Giới tính" value={formatGenderLabel(user.gender)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileRow icon={<Calendar size={16} color="#D4AF37" />} label="Ngày sinh" value={formatDate(user.dateOfBirth)} />
            <ProfileRow icon={<Calendar size={16} color="#D4AF37" />} label="Ngày tham gia" value={formatDate(user.createdAt)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileRow icon={<Sparkles size={16} color="#D4AF37" />} label="Loại da" value={formatSkinTypeLabel(user.skinType)} />
            <ProfileRow icon={<Sparkles size={16} color="#D4AF37" />} label="Vấn đề da quan tâm" value={formatSkinConcernsLabel(user.skinConcerns)} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', padding: '2rem 2.5rem', background: '#fafafa' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#B8860B', fontWeight: 600 }}>Thông tin cơ bản</h4>
          </div>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setFullName(user.fullName ?? '');
                setPhoneNumber(user.phoneNumber ?? '');
                setDateOfBirth(formatDateInput(user.dateOfBirth));
                setGender(user.gender ?? '');
                setSkinType(normalizeSkinTypeValue(user.skinType));
                setSkinConcerns(normalizeSkinConcernValues(user.skinConcerns));
                setFieldErrors({});
                setIsEditing(true);
              }}
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
          ) : null}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
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

              <TextField
                label="Ngày sinh"
                value={dateOfBirth}
                error={fieldErrors.dateOfBirth}
                onChange={(value) => {
                  setDateOfBirth(value);
                  setFieldErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                }}
                type="date"
              />

              <SelectField
                label="Giới tính"
                value={gender}
                onChange={setGender}
                options={genderOptions}
              />

              <SelectField
                label="Loại da"
                value={skinType}
                onChange={setSkinType}
                options={skinTypeOptions}
              />

              <MultiSelectField
                label="Vấn đề da quan tâm (Có thể chọn nhiều mục)"
                value={skinConcerns}
                onChange={setSkinConcerns}
                options={skinConcernOptions}
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
            {customer.id ? 'Bấm Chỉnh sửa để cập nhật thông tin cá nhân.' : 'Không tìm thấy mã hồ sơ khách hàng để chỉnh sửa.'}
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
          fontSize: '1rem',
          lineHeight: 1.4,
        }}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          background: '#fff',
          color: '#111827',
          outline: 'none',
          minHeight: '44px',
          fontSize: '1rem',
          lineHeight: 1.4,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function MultiSelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ label: string; value: string }>;
  hint?: string;
}) {
  const toggleOption = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );
  };

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>{label}</label>
      {hint ? <div style={{ marginBottom: '0.75rem', color: '#6b7280', fontSize: '0.85rem' }}>{hint}</div> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '999px',
                border: selected ? '1px solid #D4AF37' : '1px solid #d1d5db',
                background: selected ? 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08))' : '#fff',
                color: selected ? '#7c5a00' : '#374151',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
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

function isFutureDate(dateString: string) {
  const inputDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate.getTime() > today.getTime();
}

function formatGenderLabel(gender?: string) {
  if (!gender) return 'Chưa có thông tin';

  switch (gender) {
    case 'MALE':
      return 'Nam';
    case 'FEMALE':
      return 'Nữ';
    case 'OTHER':
      return 'Khác';
    default:
      return gender;
  }
}

function formatSkinTypeLabel(skinType?: string) {
  if (!skinType) return 'Chưa có thông tin';

  switch (skinType) {
    case 'DRY':
    case 'Khô':
      return 'Khô';
    case 'OILY':
    case 'Dầu':
      return 'Dầu';
    case 'COMBINATION':
    case 'Hỗn hợp':
      return 'Hỗn hợp';
    case 'SENSITIVE':
    case 'Nhạy cảm':
      return 'Nhạy cảm';
    default:
      return skinType;
  }
}

function formatSkinConcernsLabel(skinConcerns?: string[]) {
  if (!skinConcerns || skinConcerns.length === 0) return 'Chưa có thông tin';
  return skinConcerns.join(', ');
}

function normalizeSkinConcernValues(skinConcerns?: string[]) {
  if (!skinConcerns) return [];
  return skinConcernOptions.map((option) => option.value).filter((value) => skinConcerns.includes(value));
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function normalizeSkinTypeValue(skinType?: string) {
  if (!skinType) return '';

  switch (skinType) {
    case 'DRY':
    case 'Khô':
      return 'DRY';
    case 'OILY':
    case 'Dầu':
      return 'OILY';
    case 'COMBINATION':
    case 'Hỗn hợp':
      return 'COMBINATION';
    case 'SENSITIVE':
    case 'Nhạy cảm':
      return 'SENSITIVE';
    default:
      return skinType;
  }
}

function formatDateInput(dateString?: string) {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}