import { create } from 'zustand';
import { wishlistApi } from '../api/wishlistApi';
import type { WishItem } from '../types/api';

interface WishlistState {
  items: WishItem[];
  loading: boolean;
  initialized: boolean;
  fetchWishlist: (customerId: string) => Promise<void>;
  addItem: (customerId: string, productId: string) => Promise<void>;
  removeItem: (customerId: string, productId: string) => Promise<void>;
  toggleItem: (customerId: string, productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  initialized: false,

  fetchWishlist: async (customerId) => {
    // Tránh fetch lại nếu đang loading hoặc đã có dữ liệu (trừ khi cần refresh)
    if (get().loading) return;
    
    set({ loading: true });
    try {
      const res = await wishlistApi.getWishlist(customerId);
      set({ items: res.data || [], initialized: true });
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (customerId, productId) => {
    try {
      const res = await wishlistApi.addToWishlist(customerId, productId);
      set({ items: [...get().items, res.data] });
    } catch (err) {
      console.error('Failed to add to wishlist', err);
      throw err;
    }
  },

  removeItem: async (customerId, productId) => {
    try {
      await wishlistApi.removeFromWishlist(customerId, productId);
      set({ items: get().items.filter(i => i.productId !== productId) });
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
      throw err;
    }
  },

  toggleItem: async (customerId, productId) => {
    const isFav = get().isFavorite(productId);
    if (isFav) {
      await get().removeItem(customerId, productId);
    } else {
      await get().addItem(customerId, productId);
    }
  },

  isFavorite: (productId) => {
    return get().items.some(i => i.productId === productId);
  },

  reset: () => {
    set({ items: [], initialized: false, loading: false });
  }
}));
