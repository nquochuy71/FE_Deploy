import type { ChatSessionSummary } from '../../types/ai';

interface ChatSidebarProps {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onSelectSession: (sessionId: string) => void;
  onLoadMore: () => void;
}

export const ChatSidebar = ({
  sessions,
  activeSessionId,
  isLoading,
  error,
  hasMore,
  onSelectSession,
  onLoadMore,
}: ChatSidebarProps) => {
  return (
    <aside className="flex h-full flex-col rounded-3xl border border-white/30 bg-gradient-to-b from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] p-6 text-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.6)]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-[#e8d5a8]">Lumiere</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Phiên trò chuyện</h2>
        <p className="mt-1 text-sm text-white/60">Tiếp tục hoặc bắt đầu cuộc trò chuyện mới.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {isLoading && !sessions.length && (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectSession(session.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-[#c9a96e] bg-white/10 shadow-[0_10px_30px_-20px_rgba(201,169,110,0.6)]'
                  : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              <p className="text-sm font-semibold text-white">
                {session.title || 'Phiên chưa đặt tên'}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-white/60">
                {session.lastMessage || 'Chưa có tin nhắn.'}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                {session.lastMessageAt ? new Date(session.lastMessageAt).toLocaleString() : 'Mới'}
              </p>
            </button>
          );
        })}

        {!sessions.length && !isLoading && (
          <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/60">
            Chưa có phiên nào. Hãy gửi tin nhắn để bắt đầu.
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200/20 bg-rose-400/10 p-3 text-xs text-rose-100">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-white/50">
          {isLoading ? 'Đang tải phiên...' : hasMore ? 'Còn phiên khác' : 'Đã cập nhật'}
        </span>
        <button
          type="button"
          onClick={onLoadMore}
          disabled={!hasMore || isLoading}
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-50"
        >
          Tải thêm
        </button>
      </div>
    </aside>
  );
};
