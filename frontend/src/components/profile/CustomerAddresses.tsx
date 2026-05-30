import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Address, AddressCreateRequest } from '../../types/api';
import { userApi } from '../../api/userApi';
import { useAuthStore } from '../../store/authStore';

type ProvinceApiWard = {
  code: number;
  name: string;
};

type ProvinceApiDistrict = {
  code: number;
  name: string;
  wards?: ProvinceApiWard[] | null;
};

type ProvinceApiProvince = {
  code: number;
  name: string;
  districts?: ProvinceApiDistrict[];
};

const PROVINCES_API_BASE = 'https://provinces.open-api.vn/api/v1';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

export const CustomerAddresses = ({ customerId }: { customerId: string | undefined }) => {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressCreateRequest>({
    recipientName: '',
    phone: '',
    streetAddress: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false,
  });

  const provincesQuery = useQuery({
    queryKey: ['province-open-api', 'provinces'],
    queryFn: async () => {
      const response = await fetch(`${PROVINCES_API_BASE}/?depth=2`);
      if (!response.ok) {
        throw new Error('Không tải được danh sách tỉnh/thành phố');
      }

      return (await response.json()) as ProvinceApiProvince[];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const selectedProvince = provincesQuery.data?.find((province) => province.name === form.city);
  const selectedDistrict = selectedProvince?.districts?.find((district) => district.name === form.district);

  const districtQuery = useQuery({
    queryKey: ['province-open-api', 'district', selectedDistrict?.code],
    queryFn: async () => {
      if (!selectedDistrict?.code) return null;

      const response = await fetch(`${PROVINCES_API_BASE}/d/${selectedDistrict.code}?depth=2`);
      if (!response.ok) {
        throw new Error('Không tải được danh sách phường/xã');
      }

      return (await response.json()) as ProvinceApiDistrict;
    },
    enabled: !!selectedDistrict?.code,
  });

  const districtOptions = selectedProvince?.districts ?? [];
  const wardOptions = districtQuery.data?.wards ?? [];

  const addressesQuery = useQuery({
    queryKey: ['profile', 'customer', 'addresses', customerId ?? authUser?.accountId],
    queryFn: async () => {
      if (!customerId) return [] as Address[];
      const res = await userApi.getAddressesByCustomerId(customerId);
      return res.data;
    },
    enabled: !!customerId,
  });

  const addMutation = useMutation({
    mutationFn: (payload: AddressCreateRequest) => userApi.addAddress(customerId!, payload),
    onSuccess: async () => {
      toast.success('Đã thêm địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer', 'addresses'] });
      setIsAdding(false);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Không thể thêm địa chỉ'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddressCreateRequest }) => userApi.updateAddress(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer', 'addresses'] });
      setEditing(null);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Không thể cập nhật địa chỉ')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteAddress(id),
    onSuccess: () => {
      toast.success('Đã xóa địa chỉ');
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer', 'addresses'] });
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Không thể xóa địa chỉ')),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => userApi.setDefaultAddress(id),
    onSuccess: () => {
      toast.success('Đã đặt địa chỉ mặc định');
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer', 'addresses'] });
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Không thể đặt địa chỉ mặc định')),
  });

  if (!customerId) {
    return <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>Không tìm thấy hồ sơ khách hàng.</div>;
  }

  const addresses = addressesQuery.data ?? [];

  function resetForm() {
    setForm({ recipientName: '', phone: '', streetAddress: '', ward: '', district: '', city: '', isDefault: false });
  }

  function handleProvinceChange(value: string) {
    const nextProvince = provincesQuery.data?.find((province) => province.code.toString() === value);

    setForm((current) => ({
      ...current,
      city: nextProvince?.name ?? '',
      district: '',
      ward: '',
    }));
  }

  function handleDistrictChange(value: string) {
    const nextDistrict = selectedProvince?.districts?.find((district) => district.code.toString() === value);

    setForm((current) => ({
      ...current,
      district: nextDistrict?.name ?? '',
      ward: '',
    }));
  }

  function handleWardChange(value: string) {
    const nextWard = wardOptions.find((ward) => ward.code.toString() === value);

    setForm((current) => ({
      ...current,
      ward: nextWard?.name ?? '',
    }));
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 12px 30px rgba(201,169,110,0.12)', padding: 20, border: '1px solid rgba(201,169,110,0.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Địa chỉ giao hàng</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setIsAdding((s) => !s); setEditing(null); resetForm(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: '12px', border: '2px solid #D4AF37', background: '#fff', color: '#B8860B', fontWeight: 700, cursor: 'pointer' }}>
            <PlusCircle size={16} /> Thêm địa chỉ
          </button>
        </div>
      </div>

      {(isAdding || editing) && (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!form.city || !form.district || !form.ward) {
            toast.error('Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện và phường/xã');
            return;
          }

          const payload = form;
          if (editing) {
            if (!editing.id) {
              toast.error('Thiếu mã địa chỉ để cập nhật');
              return;
            }

            updateMutation.mutate({ id: editing.id, payload });
          } else {
            addMutation.mutate(payload);
          }
        }} style={{ marginBottom: 18, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <Input label="Tên người nhận" value={form.recipientName || ''} onChange={(v) => setForm((s) => ({ ...s, recipientName: v }))} />
            <Input label="Số điện thoại" value={form.phone || ''} onChange={(v) => setForm((s) => ({ ...s, phone: v }))} />
            <Input label="Địa chỉ (số nhà, đường)" value={form.streetAddress || ''} onChange={(v) => setForm((s) => ({ ...s, streetAddress: v }))} />
            <SelectField
              label="Tỉnh/Thành phố"
              value={selectedProvince?.code.toString() ?? ''}
              onChange={handleProvinceChange}
              options={provincesQuery.data ?? []}
              placeholder={provincesQuery.isLoading ? 'Đang tải danh sách tỉnh/thành...' : 'Chọn tỉnh/thành phố'}
            />
            <SelectField
              label="Quận/Huyện"
              value={selectedDistrict?.code.toString() ?? ''}
              onChange={handleDistrictChange}
              options={districtOptions}
              placeholder={!selectedProvince ? 'Chọn tỉnh/thành phố trước' : 'Chọn quận/huyện'}
              disabled={!selectedProvince || provincesQuery.isLoading}
            />
            <SelectField
              label="Phường/Xã"
              value={districtQuery.data?.wards?.find((ward) => ward.name === form.ward)?.code.toString() ?? ''}
              onChange={handleWardChange}
              options={wardOptions}
              placeholder={!selectedDistrict ? 'Chọn quận/huyện trước' : districtQuery.isLoading ? 'Đang tải phường/xã...' : 'Chọn phường/xã'}
              disabled={!selectedDistrict || districtQuery.isLoading}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" disabled={addMutation.isPending || updateMutation.isPending}
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
              }}>
              {editing ? 'Lưu' : 'Thêm'}
            </button>
            <button type="button" onClick={() => { setIsAdding(false); setEditing(null); resetForm(); }}
              style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              Huỷ
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {addresses.length === 0 && <div style={{ color: 'var(--color-gray-600)' }}>Chưa có địa chỉ nào.</div>}
        {addresses.map((a) => (
          <div key={a.id} style={{ border: '1px solid #f3f1ea', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{a.recipientName} {a.isDefault ? <span style={{ marginLeft: 8, fontSize: 12, background: 'green', color: '#fff', padding: '4px 8px', borderRadius: 8 }}>Mặc định</span> : null}</div>
              <div style={{ color: 'var(--color-gray-600)' }}>{a.phone}</div>
              <div style={{ marginTop: 6 }}>{a.streetAddress}, {a.ward}, {a.district}, {a.city}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!a.isDefault && (
                <button onClick={() => setDefaultMutation.mutate(a.id ?? '')} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid green', background: 'transparent', color: 'green', cursor: 'pointer' }}>Đặt mặc định</button>
              )}
              <button onClick={() => { setEditing(a); setIsAdding(false); setForm({ recipientName: a.recipientName || '', phone: a.phone || '', streetAddress: a.streetAddress || '', ward: a.ward || '', district: a.district || '', city: a.city || '', isDefault: !!a.isDefault }); }} style={{ padding: '8px 10px', borderRadius: '8px', border: 'none', background: '#f3f4f6', cursor: 'pointer' }}>
                <Edit3 size={14} color='#fa893e'/>
              </button>
              <button onClick={() => {
                if (!a.id) {
                  toast.error('Thiếu mã địa chỉ');
                  return;
                }

                deleteMutation.mutate(a.id);
              }} style={{ padding: '8px 10px', borderRadius: '8px', border: 'none', background: '#f3f4f6', cursor: 'pointer' }}>
                <Trash2 size={14} color='#fa3e3e'/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          background: '#fff',
          color: '#111827',
          outline: 'none',
          transition: 'border-color 0.2s ease',
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      />
    </div>
  );
}

function SelectField<T extends { code: number; name: string }>({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: T[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          background: disabled ? '#f9fafb' : '#fff',
          color: '#111827',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          minHeight: '44px',
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
