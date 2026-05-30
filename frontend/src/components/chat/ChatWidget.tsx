import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ChatExperience } from './ChatExperience';

export const ChatWidget = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    window.addEventListener('chat:close', handleClose);
    return () => window.removeEventListener('chat:close', handleClose);
  }, []);

  const handleToggle = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[1200]">
      {isOpen && (
        <div className="mb-4 h-[90vh] w-[92vw] max-w-[1100px] overflow-hidden rounded-[32px] border border-[#f0e8dc] bg-white/90 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-[#f0e8dc] bg-[#faf6f0] px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.3em] text-[#a68b5b]">Lumiere AI</span>
              <span className="text-lg font-semibold text-[#1a1a1a]">Trợ lý làm đẹp</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-[#e8d5a8] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#6b5438]"
            >
              Đóng
            </button>
          </div>
          <div className="h-[calc(90vh-72px)] p-6">
            <ChatExperience variant="widget" showHeader={false} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] text-[#e8d5a8] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
        aria-label="Mở trò chuyện AI"
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
};
