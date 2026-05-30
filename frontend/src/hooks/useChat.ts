import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage, SendChatRequest, SendChatResponse } from '../types/ai';

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message);
  }
  return 'Unexpected error. Please try again.';
};

export const useChat = () => {
  const {
    currentSessionId,
    setCurrentSessionId,
    appendMessages,
    appendOptimisticMessage,
    removeMessage,
    setMessagesError,
  } = useChatStore();

  const sendMessageMutation = useMutation({
    mutationFn: (data: { customerId: string; message: string }) => 
      aiApi.sendMessage({
        customerId: data.customerId,
        message: data.message,
        sessionId: currentSessionId || undefined,
      }),
    onMutate: async (variables) => {
      const tempMessageId = appendOptimisticMessage(variables.message);
      return { tempMessageId };
    },
    onSuccess: (res, variables, context) => {
      const payload: SendChatResponse = res.data;
      if (!payload.reply) {
        setMessagesError('Phản hồi chat không hợp lệ. Vui lòng thử lại.');
        return;
      }
      
      // Lưu lại sessionId để các tin nhắn sau gửi lên cùng 1 phiên
      if (payload.sessionId) {
        setCurrentSessionId(payload.sessionId);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sessionId: payload.sessionId || 'single',
        role: 'ASSISTANT',
        content: payload.reply,
        createdAt: new Date().toISOString(),
        suggestedProducts: payload.suggestedProducts,
      };
      appendMessages([assistantMessage]);
    },
    onError: (error, variables, context) => {
      if (context?.tempMessageId) {
        removeMessage(context.tempMessageId);
      }
      setMessagesError(getErrorMessage(error));
    },
  });

  return {
    sendMessageMutation,
  };
};
