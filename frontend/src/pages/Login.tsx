import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import type { ApiError } from '../types/api';
import { useAuthStore } from '../store/authStore';

const getPostLoginPath = (role?: string) => {
    const normalizedRole = role?.toUpperCase();

    if (normalizedRole === 'ADMIN' || normalizedRole === 'EMPLOYEE' || normalizedRole === 'EMPOYEE') {
        return '/admin/dashboard';
    }

    return '/';
};


export const Login = () => {
    const { loginMutation, googleLoginMutation } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const errors: Record<string, string> = {};
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

        try {
            await loginMutation.mutateAsync({ email, password });
            const role = useAuthStore.getState().user?.role;
            toast.success('Đăng nhập thành công');
            navigate(getPostLoginPath(role));
        } catch (err) {
            const apiErr = err as ApiError;
            if (apiErr.errors && Object.keys(apiErr.errors).length > 0) {
                setFieldErrors(apiErr.errors);
            } else {
                toast.error(apiErr.message || 'Đăng nhập thất bại');

            }
        }

        
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-form" id="loginForm" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
                <h3 className="auth-modal__title" style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Chào mừng trở lại</h3>
                <p className="auth-modal__subtitle" style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginBottom: '2rem', fontSize: '0.9rem' }}>Đăng nhập để trải nghiệm mua sắm tuyệt vời</p>
                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email</label>
                        <input value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({...prev, email: ''})); }} type="email" className="form-group__input" placeholder="example@email.com" style={{ width: '100%', padding: '10px', border: `1px solid ${fieldErrors.email ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px' }}/>
                        {fieldErrors.email && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.email}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem', position: 'relative' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mật khẩu</label>
                        <input value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({...prev, password: ''})); }} type="password" className="form-group__input" placeholder="••••••••" style={{ width: '100%', padding: '10px', border: `1px solid ${fieldErrors.password ? 'var(--color-error)' : 'var(--color-gray-300)'}`, borderRadius: '4px' }}/>
                        {fieldErrors.password && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.password}</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 'bold' }}>Quên mật khẩu?</Link>
                    </div>
                    <button type="submit" disabled={loginMutation.isPending || googleLoginMutation.isPending} className="btn btn--primary" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-gray-300)' }}></div>
                    <span style={{ padding: '0 10px', color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>Hoặc</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-gray-300)' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <GoogleLogin
                         onSuccess={credentialResponse => {
                            if (credentialResponse.credential) {
                                googleLoginMutation.mutateAsync(credentialResponse.credential)
                                    .then(() => {
                                        const role = useAuthStore.getState().user?.role;
                                        toast.success('Đăng nhập bằng Google thành công');
                                        navigate(getPostLoginPath(role));
                                    })
                                    .catch((err: unknown) => {
                                        const apiErr = err as ApiError;
                                        toast.error(apiErr.message || 'Đăng nhập Google thất bại');
                                    });

                            }
                        }}
                        onError={() => {
                            toast.error('Đăng nhập Google thất bại');
                        }}
                    />
                </div>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                    Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};
