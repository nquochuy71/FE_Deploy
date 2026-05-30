import { useState } from 'react';
import { X } from 'lucide-react';

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const CANCEL_REASONS = [
    'Tôi không còn nhu cầu mua nữa',
    'Tôi đặt nhầm sản phẩm',
    'Tôi muốn đổi sản phẩm',
    'Giao hàng quá lâu',
    'Thanh toán gặp lỗi',
    'Lý do khác'
];

export const CancelOrderModal = ({ isOpen, onClose, onConfirm }: CancelOrderModalProps) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [otherReason, setOtherReason] = useState<string>('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        const finalReason = selectedReason === 'Lý do khác' ? otherReason : selectedReason;
        if (!finalReason.trim()) {
            return;
        }
        onConfirm(finalReason);
        // Reset state
        setSelectedReason('');
        setOtherReason('');
    };

    const handleClose = () => {
        setSelectedReason('');
        setOtherReason('');
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                <button 
                    onClick={handleClose}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                    <X size={20} />
                </button>
                
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#111827' }}>Bạn muốn hủy đơn hàng này?</h2>
                <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>Vui lòng chọn lý do:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {CANCEL_REASONS.map((reason) => (
                        <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input 
                                type="radio" 
                                name="cancelReason" 
                                value={reason} 
                                checked={selectedReason === reason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                style={{ cursor: 'pointer', accentColor: 'var(--color-gold)' }}
                            />
                            <span style={{ fontSize: '0.95rem', color: '#374151' }}>{reason}</span>
                        </label>
                    ))}
                </div>

                {selectedReason === 'Lý do khác' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <textarea
                            value={otherReason}
                            onChange={(e) => setOtherReason(e.target.value)}
                            placeholder="Nhập lý do của bạn..."
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                minHeight: '80px',
                                resize: 'vertical',
                                fontSize: '0.95rem',
                                outline: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        onClick={handleClose}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedReason || (selectedReason === 'Lý do khác' && !otherReason.trim())}
                        style={{ 
                            padding: '8px 16px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            background: (!selectedReason || (selectedReason === 'Lý do khác' && !otherReason.trim())) ? '#fca5a5' : '#ef4444', 
                            color: '#fff', 
                            cursor: (!selectedReason || (selectedReason === 'Lý do khác' && !otherReason.trim())) ? 'not-allowed' : 'pointer', 
                            fontWeight: 500 
                        }}
                    >
                        Xác nhận hủy
                    </button>
                </div>
            </div>
        </div>
    );
};
