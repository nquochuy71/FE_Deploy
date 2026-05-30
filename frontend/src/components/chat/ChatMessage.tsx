import type { ChatMessage as ChatMessageType } from '../../types/ai';

import { SuggestedProducts } from './SuggestedProducts';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  if (!message) {
    return null;
  }
  const isUser = message.role === 'USER';

  const parseAssistantReply = (content: string) => {
    const lines = content.split('\n');
    const headingIndex = lines.findIndex((line) =>
      line.trim().toLowerCase().startsWith('gợi ý sản phẩm')
    );
    if (headingIndex === -1) {
      return null;
    }

    const listItems: string[] = [];
    const bodyLines: string[] = [];

    for (let i = headingIndex + 1; i < lines.length; i += 1) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) {
        bodyLines.push('');
        continue;
      }
      const match = line.match(/^\d+\.\s+(.*)$/);
      if (match) {
        listItems.push(match[1]);
        continue;
      }
      bodyLines.push(rawLine);
    }

    return {
      heading: lines[headingIndex].trim(),
      listItems,
      body: bodyLines.join('\n').trim(),
    };
  };

  const assistantReply = !isUser ? parseAssistantReply(message.content) : null;
  const hasProducts = message.suggestedProducts && message.suggestedProducts.length > 0;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'bg-gradient-to-r from-[#c9a96e] to-[#a68b5b] text-white'
            : 'bg-white text-[#2d2d2d] shadow-[0_12px_30px_-22px_rgba(0,0,0,0.4)]'
        }`}
      >
        {assistantReply ? (
          <div className="space-y-3">
            {assistantReply.body && (
              <p className="whitespace-pre-wrap leading-relaxed text-[#2d2d2d]">
                {assistantReply.body}
              </p>
            )}
            {!hasProducts && (
              <div className="rounded-2xl border border-[#f0e8dc] bg-[#faf6f0] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#a68b5b]">Gợi ý từ Lumiere</p>
                {assistantReply.listItems.length > 0 && (
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-[#2d2d2d]">
                    {assistantReply.listItems.map((item, index) => (
                      <li key={`${item}-${index}`} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
        
        {hasProducts && !isUser && (
          <SuggestedProducts products={message.suggestedProducts!} variant="inline" />
        )}
        <p className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${isUser ? 'text-white/70' : 'text-[#888]'}`}>
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}
        </p>
      </div>
    </div>
  );
};
