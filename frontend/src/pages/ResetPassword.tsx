import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { ApiError } from '../types/api';

export const ResetPassword = () => {
    const { resetPasswordMutation } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy email từ state nếu được redirect từ trang ForgotPassword
    const initialEmail = location.state?.email || '';

    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Nếu không có email từ state, có thể cảnh báo hoặc kệ cho họ tự nhập
    useEffect(() => {
        if (!initialEmail) {
            toast.info('Vui lòng nhập đầy đủ thông tin để đặt lại mật khẩu.');
        }
    }, [initialEmail]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Client validation
        const errors: Record<string, string> = {};
        if (!email.trim()) {
            errors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Email không hợp lệ';
        }

        if (!otp.trim()) {
            errors.otp = 'Vui lòng nhập mã OTP';
        } else if (otp.trim().length !== 6) {
            errors.otp = 'Mã OTP phải gồm 6 ký tự';
        }

        if (!newPassword) {
            errors.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (newPassword.length < 8) {
            errors.newPassword = 'Mật khẩu phải từ 8 ký tự';
        }

        if (!confirmPassword) {
            errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        } else if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp!';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});

        resetPasswordMutation.mutate({ email, otp, newPassword }, {
            onSuccess: () => {
                toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
                navigate('/login');
            },
            onError: (err: unknown) => {
                const apiErr = err as ApiError;
                if (apiErr.errors && Object.keys(apiErr.errors).length > 0) {
                    setFieldErrors(apiErr.errors);
                } else {
                    toast.error(apiErr.message || 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng kiểm tra lại mã OTP.');
                }
            }
        });
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
            <div className="auth-form" style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
                <h3 className="auth-modal__title" style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Đặt lại mật khẩu</h3>
                <p className="auth-modal__subtitle" style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Vui lòng kiểm tra email và nhập mã xác nhận (OTP) để tạo mật khẩu mới.
                </p>

                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email</label>
                        <input
                            value={email}
                            onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({...prev, email: ''})); }}
                            type="email"
                            className="form-group__input"
                            placeholder="example@email.com"
                            readOnly={!!initialEmail}
                            style={{ width: '100%', padding: '12px 10px', border: `1px solid ${fieldErrors.email ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px', backgroundColor: initialEmail ? '#f5f5f5' : '#fff' }}
                        />
                        {fieldErrors.email && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.email}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mã xác nhận (OTP)</label>
                        <input
                            value={otp}
                            onChange={e => { setOtp(e.target.value); setFieldErrors(prev => ({...prev, otp: ''})); }}
                            type="text"
                            className="form-group__input"
                            placeholder="Nhập 6 số từ email"
                            style={{ width: '100%', padding: '12px 10px', border: `1px solid ${fieldErrors.otp ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px', letterSpacing: '2px' }}
                        />
                        {fieldErrors.otp && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.otp}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mật khẩu mới</label>
                        <input
                            value={newPassword}
                            onChange={e => { setNewPassword(e.target.value); setFieldErrors(prev => ({...prev, newPassword: ''})); }}
                            type="password"
                            className="form-group__input"
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '12px 10px', border: `1px solid ${fieldErrors.newPassword ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px' }}
                        />
                        {fieldErrors.newPassword && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.newPassword}</span>}
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Xác nhận mật khẩu mới</label>
                        <input
                            value={confirmPassword}
                            onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({...prev, confirmPassword: ''})); }}
                            type="password"
                            className="form-group__input"
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '12px 10px', border: `1px solid ${fieldErrors.confirmPassword ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px' }}
                        />
                        {fieldErrors.confirmPassword && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.confirmPassword}</span>}
                    </div>

                    <button
                        type="submit"
                        disabled={resetPasswordMutation.isPending || !email || !otp || !newPassword}
                        className="btn btn--primary"
                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {resetPasswordMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                    <Link to="/forgot-password" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>Chưa nhận được mã?</Link>
                </p>
            </div>
        </div>
    );
};
