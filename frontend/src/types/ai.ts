export type ChatMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface SuggestedProduct {
  id?: string;
  productId?: string;
  name: string;
  imageUrl?: string;
  price?: number;
  productUrl?: string;
  reason?: string;
  score?: number;
  slug?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt?: string;
  suggestedProducts?: SuggestedProduct[];
  metadata?: Record<string, unknown>;
}

export interface ChatSessionSummary {
  id: string;
  title?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt?: string;
}

export interface ChatSessionListResponse {
  items: ChatSessionSummary[];
  nextCursor?: string | null;
}

export interface ChatMessageListResponse {
  items: ChatMessage[];
  nextCursor?: string | null;
}

export interface SendChatRequest {
  customerId: string;
  sessionId?: string;
  message: string;
}

export interface SendChatResponse {
  sessionId: string;
  reply: string;
  suggestedProducts?: SuggestedProduct[];
}

export type ProductViewSource = 
  | 'HOME'
  | 'CATEGORY_LIST'
  | 'SEARCH'
  | 'RECOMMENDATION_ENGINE'
  | 'AI_CHAT'
  | 'CART'
  | 'ORDER_HISTORY'
  | 'DIRECT';

export type BehaviorEventType = 'VIEW' | 'ADD_TO_CART' | 'PURCHASE' | 'RECOMMENDATION_CLICK';

export interface ViewLogRequest {
  productId: string;
  source?: ProductViewSource;
  customerId?: string;
  durationSeconds?: number;
}

export interface BehaviorEventRequest {
  productId: string;
  eventType: BehaviorEventType;
  source?: ProductViewSource;
  customerId?: string;
}

export interface RecommendationResponse {
  id: string;
  customerId: string;
  productId: string;
  score: number;
  reason?: string;
  type?: string;
  isClicked: boolean;
  product?: SuggestedProduct; // Or CatalogProductResponse
}
