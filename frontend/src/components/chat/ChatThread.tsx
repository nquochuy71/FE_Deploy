import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/ai';
import { ChatMessage as ChatMessageItem } from './ChatMessage';

interface ChatThreadProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  autoScroll?: boolean;
}

export const ChatThread = ({
  messages,
  isLoading,
  error,
  autoScroll = true,
}: ChatThreadProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !autoScroll) {
      return;
    }
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages.length, autoScroll]);

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-white/50 bg-white/80 p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#1a1a1a]">Chat AI</h2>
        </div>
      </div>

      <div ref={containerRef} className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
        {isLoading && !messages.length && (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 rounded-2xl bg-[#f0e8dc] animate-pulse"
              />
            ))}
          </div>
        )}
        {messages.filter(Boolean).map((message) => (
          <ChatMessageItem key={message.id} message={message} />
        ))}

        {!messages.length && !isLoading && (
          <div className="rounded-2xl border border-dashed border-[#c9a96e]/50 bg-[#faf6f0] p-6 text-center text-sm text-[#6b5438]">
            Hãy chia sẻ mục tiêu làm đẹp, chúng tôi sẽ gợi ý phần còn lại.
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200/50 bg-rose-50 p-3 text-xs text-rose-600">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 text-xs uppercase tracking-[0.3em] text-[#888]">
          Đang tải tin nhắn...
        </div>
      )}
    </section>
  );
};
