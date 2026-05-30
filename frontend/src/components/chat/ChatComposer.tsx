import { useState } from 'react';

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isSending?: boolean;
}

export const ChatComposer = ({ onSend, disabled, isSending }: ChatComposerProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setMessage('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-[0_16px_40px_-30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col">
        <label className="text-[11px] uppercase tracking-[0.25em] text-[#a68b5b]">
          Hỏi Lumiere AI
        </label>
        <div className="flex items-center gap-3 mt-2">
          <textarea
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Chia sẻ mục tiêu da, vấn đề bạn lo lắng, hoặc câu hỏi về sản phẩm..."
            className="flex-1 resize-none rounded-2xl border border-[#e8d5a8] bg-[#faf6f0] px-4 py-2 text-sm text-[#2d2d2d] shadow-inner focus:border-[#c9a96e]"
            disabled={disabled || isSending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || isSending}
            className="h-fit rounded-full bg-gradient-to-r from-[#c9a96e] to-[#a68b5b] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white shadow-[0_12px_30px_-20px_rgba(201,169,110,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(201,169,110,0.75)] disabled:opacity-50"
          >
            {isSending ? 'Đang gửi' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  );
};
