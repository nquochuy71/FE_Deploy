import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import type { ApiError } from '../types/api';

export const Register = () => {
    const { registerMutation, googleLoginMutation } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const errors: Record<string, string> = {};
        if (!fullName.trim()) {
            errors.fullName = 'Vui lòng nhập họ và tên';
        }
        if (!phoneNumber.trim()) {
            errors.phoneNumber = 'Vui lòng nhập số điện thoại';
        } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phoneNumber)) {
            errors.phoneNumber = 'Số điện thoại không hợp lệ';
        }
        if (!email.trim()) {
            errors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Email không hợp lệ';
        }
        if (!password) {
            errors.password = 'Vui lòng nhập mật khẩu';
        } else if (password.length < 8) {
            errors.password = 'Mật khẩu phải từ 8 ký tự';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        registerMutation.mutate({ email, password, fullName, phoneNumber }, {
            onSuccess: () => {
                toast.success('Đã tạo yêu cầu đăng ký. Vui lòng kiểm tra email để xác thực tài khoản và hoàn tất đăng ký.', {
                    duration: 6000,
                });
                navigate('/login');
            },
            onError: (err: unknown) => {
                const apiErr = err as ApiError;
                if (apiErr.errors && Object.keys(apiErr.errors).length > 0) {
                    setFieldErrors(apiErr.errors);
                } else {
                    toast.error(apiErr.message || 'Đăng ký thất bại');
                }
            }
        });
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
            <div className="auth-form" id="registerForm" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
                <h3 className="auth-modal__title" style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Tạo tài khoản</h3>
                <p className="auth-modal__subtitle" style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginBottom: '2rem', fontSize: '0.9rem' }}>Trở thành thành viên của Lumière</p>
                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Họ và tên</label>
                        <input value={fullName} onChange={e => { setFullName(e.target.value); setFieldErrors(prev => ({...prev, fullName: ''})); }} type="text" className="form-group__input" placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '10px', border: `1px solid ${fieldErrors.fullName ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px' }}/>
                        {fieldErrors.fullName && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.fullName}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Số điện thoại</label>
                        <input value={phoneNumber} onChange={e => { setPhoneNumber(e.target.value); setFieldErrors(prev => ({...prev, phoneNumber: ''})); }} type="tel" className="form-group__input" placeholder="0901234567" style={{ width: '100%', padding: '10px', border: `1px solid ${fieldErrors.phoneNumber ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px' }}/>
                        {fieldErrors.phoneNumber && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.phoneNumber}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email</label>
                        <input value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({...prev, email: ''})); }} type="email" className="form-group__input" placeholder="example@email.com" style={{ width: '100%', padding: '10px', border: `1px solid ${fieldErrors.email ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px' }}/>
                        {fieldErrors.email && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.email}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mật khẩu</label>
                        <input value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({...prev, password: ''})); }} type="password" className="form-group__input" placeholder="••••••••" style={{ width: '100%', padding: '10px', border: `1px solid ${fieldErrors.password ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px' }}/>
                        {fieldErrors.password && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.password}</span>}
                    </div>
                    <button type="submit" disabled={registerMutation.isPending || googleLoginMutation?.isPending} className="btn btn--primary" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-gray-300)' }}></div>
                    <span style={{ padding: '0 10px', color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>Hoặc</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-gray-300)' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <GoogleLogin
                        text="signup_with"
                        onSuccess={credentialResponse => {
                            if (credentialResponse.credential) {
                                googleLoginMutation.mutate(credentialResponse.credential, {
                                    onSuccess: () => {
                                        toast.success('Đăng nhập bằng Google thành công');
                                        navigate('/');
                                    },
                                    onError: (err: unknown) => {
                                        const apiErr = err as ApiError;
                                        toast.error(apiErr.message || 'Đăng ký Google thất bại');
                                    }
                                });
                            }
                        }}
                        onError={() => {
                            toast.error('Đăng ký Google thất bại');
                        }}
                    />
                </div>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
};
