import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, PencilLine, Plus, Power, Search } from 'lucide-react';
import { toast } from 'sonner';
import { accountApi } from '../../api/accountApi';
import { employeeApi } from '../../api/employeeApi';
import { AdminTable } from '../../components/admin/AdminTable';
import { useAuthStore } from '../../store/authStore';
import type {
    AccountStatus,
    CustomerAccountInfo,
    EmployeeAccountInfo,
    EmployeeAccountUpdateRequest,
    EmployeeCreateRequest,
} from '../../types/api';

type TabKey = 'customers' | 'employees';
type EmployeeFormMode = 'create' | 'edit' | null;

type EmployeeFormState = {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
};

const emptyEmployeeForm = (): EmployeeFormState => ({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
});

const phonePattern = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const UserManagement = () => {
    const queryClient = useQueryClient();
    const currentRole = useAuthStore((state) => state.user?.role?.toUpperCase() ?? '');
    const canSeeEmployeeTab = currentRole === 'ADMIN';

    const [activeTab, setActiveTab] = useState<TabKey>('customers');
    const [searchTerm, setSearchTerm] = useState('');
    const [employeeFormMode, setEmployeeFormMode] = useState<EmployeeFormMode>(null);
    const [editingEmployeeAccountId, setEditingEmployeeAccountId] = useState<string | null>(null);
    const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(emptyEmployeeForm());
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!canSeeEmployeeTab && activeTab === 'employees') {
            setActiveTab('customers');
        }
    }, [activeTab, canSeeEmployeeTab]);

    const customersQuery = useQuery({
        queryKey: ['admin', 'accounts', 'customers'],
        queryFn: async () => {
            const response = await accountApi.getCustomerAccounts();
            return response.data;
        },
        staleTime: 60 * 1000,
        retry: false,
    });

    const employeesQuery = useQuery({
        queryKey: ['admin', 'accounts', 'employees'],
        queryFn: async () => {
            const response = await accountApi.getEmployeeAccounts();
            return response.data;
        },
        enabled: canSeeEmployeeTab,
        staleTime: 60 * 1000,
        retry: false,
    });

    const invalidateAccountLists = async () => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
    };

    const toggleAccountMutation = useMutation({
        mutationFn: (accountId: string) => accountApi.toggleAccountStatus(accountId),
        onSuccess: async () => {
            await invalidateAccountLists();
            toast.success('Đã cập nhật trạng thái tài khoản.');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Không thể cập nhật trạng thái tài khoản.'));
        },
    });

    const saveEmployeeMutation = useMutation({
        mutationFn: async (payload: { mode: 'create'; data: EmployeeCreateRequest } | { mode: 'edit'; accountId: string; data: EmployeeAccountUpdateRequest }) => {
            if (payload.mode === 'create') {
                return employeeApi.createEmployee(payload.data);
            }

            return accountApi.updateEmployeeAccount(payload.accountId, payload.data);
        },
        onSuccess: async (_, payload) => {
            await invalidateAccountLists();
            setEmployeeForm(emptyEmployeeForm());
            setEmployeeFormMode(null);
            setEditingEmployeeAccountId(null);
            setFieldErrors({});

            toast.success(payload.mode === 'create' ? 'Đã thêm nhân viên mới.' : 'Đã cập nhật thông tin nhân viên.');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Không thể lưu thông tin nhân viên.'));
        },
    });

    const openCreateEmployeeForm = () => {
        setEmployeeFormMode('create');
        setEditingEmployeeAccountId(null);
        setEmployeeForm(emptyEmployeeForm());
        setFieldErrors({});
    };

    const openEditEmployeeForm = (employee: EmployeeAccountInfo) => {
        setActiveTab('employees');
        setEmployeeFormMode('edit');
        setEditingEmployeeAccountId(employee.accountId);
        setEmployeeForm({
            email: employee.email ?? '',
            password: '',
            fullName: employee.fullName ?? '',
            phoneNumber: employee.phoneNumber ?? '',
        });
        setFieldErrors({});
    };

    const closeEmployeeForm = () => {
        setEmployeeFormMode(null);
        setEditingEmployeeAccountId(null);
        setEmployeeForm(emptyEmployeeForm());
        setFieldErrors({});
    };

    const handleEmployeeSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedEmail = employeeForm.email.trim().toLowerCase();
        const trimmedFullName = employeeForm.fullName.trim();
        const trimmedPhoneNumber = employeeForm.phoneNumber.trim();
        const trimmedPassword = employeeForm.password.trim();

        const errors: Record<string, string> = {};

        if (!trimmedEmail) {
            errors.email = 'Vui lòng nhập email';
        } else if (!emailPattern.test(trimmedEmail)) {
            errors.email = 'Email không hợp lệ';
        }

        if (!trimmedFullName) {
            errors.fullName = 'Vui lòng nhập họ và tên';
        }

        if (!trimmedPhoneNumber) {
            errors.phoneNumber = 'Vui lòng nhập số điện thoại';
        } else if (!phonePattern.test(trimmedPhoneNumber)) {
            errors.phoneNumber = 'Số điện thoại không hợp lệ';
        }

        if (employeeFormMode === 'create') {
            if (!trimmedPassword) {
                errors.password = 'Vui lòng nhập mật khẩu';
            } else if (trimmedPassword.length < 8) {
                errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});

        if (employeeFormMode === 'create') {
            saveEmployeeMutation.mutate({
                mode: 'create',
                data: {
                    email: trimmedEmail,
                    password: trimmedPassword,
                    fullName: trimmedFullName,
                    phoneNumber: trimmedPhoneNumber,
                },
            });
            return;
        }

        if (!editingEmployeeAccountId) {
            toast.error('Không tìm thấy tài khoản nhân viên để cập nhật.');
            return;
        }

        saveEmployeeMutation.mutate({
            mode: 'edit',
            accountId: editingEmployeeAccountId,
            data: {
                email: trimmedEmail,
                fullName: trimmedFullName,
                phoneNumber: trimmedPhoneNumber,
            },
        });
    };

    const customerRows = customersQuery.data ?? [];
    const employeeRows = employeesQuery.data ?? [];

    const filteredCustomerRows = useMemo(() => {
        return filterAccounts(customerRows, searchTerm);
    }, [customerRows, searchTerm]);

    const filteredEmployeeRows = useMemo(() => {
        return filterAccounts(employeeRows, searchTerm);
    }, [employeeRows, searchTerm]);

    const tabs: Array<{ key: TabKey; label: string }> = [
        { key: 'customers', label: `Quản lý khách hàng (${filteredCustomerRows.length})` },
        ...(canSeeEmployeeTab ? [{ key: 'employees' as const, label: `Quản lý nhân viên (${filteredEmployeeRows.length})` }] : []),
    ];

    const renderCustomerTable = () => {
        if (customersQuery.isLoading) {
            return <LoadingCard title="Đang tải khách hàng" description="Hệ thống đang lấy danh sách tài khoản khách hàng." />;
        }

        if (customersQuery.isError) {
            return <ErrorCard message={getErrorMessage(customersQuery.error, 'Không thể tải danh sách khách hàng.')} />;
        }

        return (
            <AdminTable
                title="Danh sách tài khoản khách hàng"
                rows={filteredCustomerRows}
                emptyMessage={searchTerm.trim() ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có tài khoản khách hàng nào'}
                columns={[
                    { header: 'Họ tên', render: (row: CustomerAccountInfo) => renderDisplayName(row.fullName) },
                    { header: 'Email', render: (row: CustomerAccountInfo) => row.email },
                    { header: 'Số điện thoại', render: (row: CustomerAccountInfo) => renderDisplayValue(row.phoneNumber) },
                    { header: 'Trạng thái', render: (row: CustomerAccountInfo) => renderStatusBadge(row.status) },
                    {
                        header: 'Thao tác',
                        render: (row: CustomerAccountInfo) => (
                            <ActionRow>
                                <ActionButton
                                    label={isActiveStatus(row.status) ? 'Khoá' : 'Mở'}
                                    icon={<Power size={16} />}
                                    variant={isActiveStatus(row.status) ? 'danger' : 'success'}
                                    disabled={toggleAccountMutation.isPending}
                                    onClick={() => toggleAccountMutation.mutate(row.accountId)}
                                />
                            </ActionRow>
                        ),
                    },
                ]}
            />
        );
    };

    const renderEmployeeTable = () => {
        if (!canSeeEmployeeTab) {
            return null;
        }

        if (employeesQuery.isLoading) {
            return <LoadingCard title="Đang tải nhân viên" description="Hệ thống đang lấy danh sách tài khoản nhân viên." />;
        }

        if (employeesQuery.isError) {
            return <ErrorCard message={getErrorMessage(employeesQuery.error, 'Không thể tải danh sách nhân viên.')} />;
        }

        return (
            <>
                <div style={panelStyle}>
                    {/* <div style={panelHeaderStyle}>
            
          </div> */}

                    {employeeFormMode ? (
                        <form onSubmit={handleEmployeeSubmit} style={formGridStyle}>
                            <Field
                                label="Email"
                                value={employeeForm.email}
                                error={fieldErrors.email}
                                onChange={(value) => setEmployeeForm((prev) => ({ ...prev, email: value }))}
                                placeholder="nhanvien@shop.com"
                                type="email"
                            />

                            {employeeFormMode === 'create' ? (
                                <Field
                                    label="Mật khẩu"
                                    value={employeeForm.password}
                                    error={fieldErrors.password}
                                    onChange={(value) => setEmployeeForm((prev) => ({ ...prev, password: value }))}
                                    placeholder="Ít nhất 8 ký tự"
                                    type="password"
                                />
                            ) : null}

                            <Field
                                label="Họ và tên"
                                value={employeeForm.fullName}
                                error={fieldErrors.fullName}
                                onChange={(value) => setEmployeeForm((prev) => ({ ...prev, fullName: value }))}
                                placeholder="Nguyễn Văn A"
                            />

                            <Field
                                label="Số điện thoại"
                                value={employeeForm.phoneNumber}
                                error={fieldErrors.phoneNumber}
                                onChange={(value) => setEmployeeForm((prev) => ({ ...prev, phoneNumber: value }))}
                                placeholder="0901234567"
                                type="tel"
                            />

                            <div style={formActionsStyle}>
                                <button type="submit" disabled={saveEmployeeMutation.isPending} style={primaryButtonStyle}>
                                    <BadgeCheck size={16} />
                                    {saveEmployeeMutation.isPending ? 'Đang lưu...' : employeeFormMode === 'create' ? 'Tạo nhân viên' : 'Cập nhật'}
                                </button>
                                <button type="button" onClick={closeEmployeeForm} style={secondaryButtonStyle}>
                                    Huỷ
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button type="button" onClick={openCreateEmployeeForm} style={primaryButtonStyle}>
                            <Plus size={16} /> Thêm nhân viên
                        </button>
                    )}
                </div>

                <AdminTable
                    title="Danh sách tài khoản nhân viên"
                    rows={filteredEmployeeRows}
                    emptyMessage={searchTerm.trim() ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có tài khoản nhân viên nào'}
                    columns={[
                        { header: 'Họ tên', render: (row: EmployeeAccountInfo) => renderDisplayName(row.fullName) },
                        { header: 'Email', render: (row: EmployeeAccountInfo) => row.email },
                        { header: 'Số điện thoại', render: (row: EmployeeAccountInfo) => renderDisplayValue(row.phoneNumber) },
                        { header: 'Mã nhân viên', render: (row: EmployeeAccountInfo) => renderDisplayValue(row.employeeCode) },
                        { header: 'Ngày vào làm', render: (row: EmployeeAccountInfo) => renderDate(row.hireDate) },
                        { header: 'Trạng thái', render: (row: EmployeeAccountInfo) => renderStatusBadge(row.status) },
                        {
                            header: 'Thao tác',
                            render: (row: EmployeeAccountInfo) => (
                                <ActionRow>
                                    <ActionButton
                                        label="Sửa"
                                        icon={<PencilLine size={16} />}
                                        variant="secondary"
                                        disabled={saveEmployeeMutation.isPending}
                                        onClick={() => openEditEmployeeForm(row)}
                                    />
                                    <ActionButton
                                        label={isActiveStatus(row.status) ? 'Khoá' : 'Mở'}
                                        icon={<Power size={16} />}
                                        variant={isActiveStatus(row.status) ? 'danger' : 'success'}
                                        disabled={toggleAccountMutation.isPending}
                                        onClick={() => toggleAccountMutation.mutate(row.accountId)}
                                    />
                                </ActionRow>
                            ),
                        },
                    ]}
                />
            </>
        );
    };

    return (
        <div style={pageStyle}>

            <div style={tabBarStyle}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                ...tabButtonStyle,
                                ...(isActive ? activeTabButtonStyle : {}),
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <label style={searchBarStyle}>
                <Search size={18} color="#64748b" />
                <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    type="text"
                    placeholder="Tìm theo tên, email hoặc số điện thoại"
                    style={searchInputStyle}
                />
            </label>

            {activeTab === 'customers' ? renderCustomerTable() : renderEmployeeTable()}
        </div>
    );

    function filterAccounts<T extends { fullName?: string; email?: string; phoneNumber?: string }>(items: T[], searchValue: string) {
        const normalizedSearchValue = searchValue.trim().toLowerCase();

        if (!normalizedSearchValue) {
            return items;
        }

        return items.filter((item) => [item.fullName, item.email, item.phoneNumber].some((value) => value?.toLowerCase().includes(normalizedSearchValue)));
    }
};

function isActiveStatus(status: AccountStatus) {
    return status === 'ACTIVE';
}

function renderStatusBadge(status: AccountStatus) {
    const styles: Record<AccountStatus, { background: string; color: string; label: string }> = {
        ACTIVE: { background: '#dcfce7', color: '#166534', label: 'Đang mở' },
        DISABLED: { background: '#fee2e2', color: '#991b1b', label: 'Đang khoá' },
        PENDING_VERIFY: { background: '#fef3c7', color: '#92400e', label: 'Chờ xác minh' },
    };

    const config = styles[status] ?? styles.PENDING_VERIFY;

    return (
        <span style={{ ...badgeStyle, background: config.background, color: config.color }}>
            {config.label}
        </span>
    );
}

function renderDate(value?: string) {
    return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : '—';
}

function renderDisplayName(value?: string) {
    return value?.trim() ? value : 'Chưa cập nhật';
}

function renderDisplayValue(value?: string) {
    return value?.trim() ? value : '—';
}

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'object' && error && 'message' in error) {
        const message = (error as { message?: string }).message;
        if (message) {
            return message;
        }
    }

    return fallback;
}

function LoadingCard({ title, description }: { title: string; description: string }) {
    return (
        <div style={supportCardStyle}>
            <div style={loadingSpinnerStyle} />
            <div>
                <div style={supportTitleStyle}>{title}</div>
                <div style={supportDescriptionStyle}>{description}</div>
            </div>
        </div>
    );
}

function ErrorCard({ message }: { message: string }) {
    return (
        <div style={errorCardStyle}>
            <div style={supportTitleStyle}>Đã xảy ra lỗi</div>
            <div style={supportDescriptionStyle}>{message}</div>
        </div>
    );
}

function ActionRow({ children }: { children: ReactNode }) {
    return <div style={actionRowStyle}>{children}</div>;
}

function ActionButton({
    label,
    icon,
    variant,
    disabled,
    onClick,
}: {
    label: string;
    icon: ReactNode;
    variant: 'secondary' | 'danger' | 'success';
    disabled?: boolean;
    onClick: () => void;
}) {
    const stylesByVariant = {
        secondary: actionSecondaryButtonStyle,
        danger: actionDangerButtonStyle,
        success: actionSuccessButtonStyle,
    };

    return (
        <button type="button" onClick={onClick} disabled={disabled} style={stylesByVariant[variant]}>
            {icon}
            {label}
        </button>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    placeholder?: string;
}) {
    return (
        <label style={fieldLabelStyle}>
            <span style={fieldTitleStyle}>{label}</span>
            <input
                value={value}
                type={type}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                style={{
                    ...inputStyle,
                    borderColor: error ? '#fca5a5' : inputStyle.borderColor,
                }}
            />
            {error ? <span style={fieldErrorStyle}>{error}</span> : null}
        </label>
    );
}

const pageStyle: React.CSSProperties = {
    display: 'grid',
    gap: '1.25rem',
};

const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
};

const searchBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.9rem 1rem',
    borderRadius: '16px',
    background: '#fff',
    border: '1px solid #dbe4f0',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
};

const searchInputStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#0f172a',
    fontSize: '0.95rem',
};

const tabButtonStyle: React.CSSProperties = {
    border: '1px solid #dbe4f0',
    background: '#fff',
    color: '#334155',
    borderRadius: '999px',
    padding: '0.8rem 1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
};

const activeTabButtonStyle: React.CSSProperties = {
    background: '#0f172a',
    color: '#fff',
    borderColor: '#0f172a',
};

const panelStyle: React.CSSProperties = {
    display: 'grid',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '20px',
    background: '#fff',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
};

const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
};

const formActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    gridColumn: '1 / -1',
};

const supportCardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    padding: '1rem',
    borderRadius: '18px',
    background: '#fff',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
};

const loadingSpinnerStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    borderRadius: '999px',
    border: '2px solid #cbd5e1',
    borderTopColor: '#0f172a',
    animation: 'spin 0.8s linear infinite',
};

const supportTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    color: '#0f172a',
};

const supportDescriptionStyle: React.CSSProperties = {
    color: '#64748b',
    marginTop: '0.15rem',
};

const errorCardStyle: React.CSSProperties = {
    padding: '1rem',
    borderRadius: '18px',
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    color: '#9f1239',
};

const actionRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
};

const actionBaseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    borderRadius: '12px',
    padding: '0.6rem 0.85rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
};

const actionSecondaryButtonStyle: React.CSSProperties = {
    ...actionBaseStyle,
    background: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
};

const actionDangerButtonStyle: React.CSSProperties = {
    ...actionBaseStyle,
    background: '#fee2e2',
    color: '#991b1b',
};

const actionSuccessButtonStyle: React.CSSProperties = {
    ...actionBaseStyle,
    background: '#dcfce7',
    color: '#166534',
};

const primaryButtonStyle: React.CSSProperties = {
    ...actionBaseStyle,
    background: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
    color: '#fff',
    boxShadow: '0 10px 24px rgba(29, 78, 216, 0.2)',
    justifyContent: 'center',
};

const secondaryButtonStyle: React.CSSProperties = {
    ...actionBaseStyle,
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
};

const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.35rem 0.7rem',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 700,
    minWidth: '96px',
};

const fieldLabelStyle: React.CSSProperties = {
    display: 'grid',
    gap: '0.45rem',
};

const fieldTitleStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#334155',
};

const inputStyle: React.CSSProperties = {
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    padding: '0.85rem 0.95rem',
    color: '#0f172a',
    outline: 'none',
};

const fieldErrorStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: '#b91c1c',
};
