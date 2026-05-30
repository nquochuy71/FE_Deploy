import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type VerifyStatus = 'loading' | 'success' | 'error' | 'no-token';

export const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<VerifyStatus>(token ? 'loading' : 'no-token');
    const hasAttempted = useRef(false);

    useEffect(() => {
        if (!token) {
            return;
        }

        // Prevent double-call in React Strict Mode dev environment
        if (hasAttempted.current) return;
        hasAttempted.current = true;

        authApi.verifyEmail(token)
            .then(() => {
                setStatus('success');
                toast.success('Xác thực email thành công!');
            })
            .catch((err: Error) => {
                setStatus('error');
                toast.error(err.message || 'Xác thực email thất bại.');
            });
    }, [token]); // Only depends on token (stable string), NOT a mutation object

    const btnStyle: React.CSSProperties = {
        display: 'inline-block',
        width: '100%',
        padding: '12px',
        background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        border: 'none',
        fontSize: '1rem',
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
            <div style={{ background: '#fff', padding: '3rem 2rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>

                {status === 'loading' && (
                    <div>
                        <Loader2 size={64} color="var(--color-gold)" style={{ margin: '0 auto 1.5rem', animation: 'spin 1.5s linear infinite' }} />
                        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', fontSize: '1.5rem' }}>Đang xác thực...</h3>
                        <p style={{ color: 'var(--color-gray-500)' }}>Vui lòng đợi trong giây lát.</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', fontSize: '1.5rem' }}>Xác thực thành công!</h3>
                        <p style={{ color: 'var(--color-gray-500)', marginBottom: '2rem' }}>Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.</p>
                        <Link to="/login" style={btnStyle}>Đăng nhập ngay</Link>
                    </div>
                )}

                {(status === 'error' || status === 'no-token') && (
                    <div>
                        <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', fontSize: '1.5rem' }}>
                            {status === 'no-token' ? 'Đường dẫn không hợp lệ' : 'Xác thực thất bại'}
                        </h3>
                        <p style={{ color: 'var(--color-gray-500)', marginBottom: '2rem' }}>
                            {status === 'no-token'
                                ? 'Không tìm thấy mã xác thực trong đường dẫn.'
                                : 'Mã xác thực không hợp lệ hoặc đã hết hạn (24 giờ). Vui lòng đăng ký lại.'}
                        </p>
                        <Link to="/login" style={btnStyle}>Về trang đăng nhập</Link>
                    </div>
                )}
            </div>
        </div>
    );
};
