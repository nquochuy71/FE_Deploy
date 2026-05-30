import { axiosClient } from './axiosClient';
import type { ApiResponse } from '../types/api';
import type {
  ChatSessionListResponse,
  ChatMessageListResponse,
  SendChatRequest,
  SendChatResponse,
  ViewLogRequest,
  BehaviorEventRequest,
  RecommendationResponse
} from '../types/ai';

export const aiApi = {
  listSessions: (params: { customerId: string; cursor?: string; limit?: number }) => {
    const { customerId, ...rest } = params;
    return axiosClient.get<unknown, ApiResponse<ChatSessionListResponse>>(`/ai/sessions?customerId=${customerId}`, { params: rest });
  },

  listMessages: (sessionId: string, params: { customerId: string; cursor?: string; limit?: number }) => {
    const { customerId, ...rest } = params;
    return axiosClient.get<unknown, ApiResponse<ChatMessageListResponse>>(`/ai/sessions/${sessionId}/messages?customerId=${customerId}`, { 
      params: rest 
    });
  },

  sendMessage: (data: SendChatRequest) => {
    return axiosClient.post<unknown, ApiResponse<SendChatResponse>>('/ai/chat', data);
  },

  trackView: (data: ViewLogRequest) => {
    return axiosClient.post<unknown, ApiResponse<unknown>>('/ai/view-log', data);
  },

  trackBehavior: (data: BehaviorEventRequest) => {
    return axiosClient.post<unknown, ApiResponse<unknown>>('/ai/behavior', data);
  },

  getRecommendations: (limit?: number) => {
    return axiosClient.get<unknown, ApiResponse<RecommendationResponse[]>>('/ai/recommendations', {
      params: limit !== undefined ? { limit } : undefined
    });
  },
};
