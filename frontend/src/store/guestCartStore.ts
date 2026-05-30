import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface GuestCartItem {
  productVariantId: string;
  quantity: number;
  unitPrice: number;
  variantName: string;
  productName: string;
  imageUrl: string;
}

interface GuestCartState {
  items: GuestCartItem[];

  addItem: (item: GuestCartItem) => void;
  removeItem: (productVariantId: string) => void;
  updateQuantity: (productVariantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productVariantId === newItem.productVariantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productVariantId === newItem.productVariantId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        });
        window.dispatchEvent(new CustomEvent('cart:updated'));
      },

      removeItem: (productVariantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productVariantId !== productVariantId),
        }));
        window.dispatchEvent(new CustomEvent('cart:updated'));
      },

      updateQuantity: (productVariantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productVariantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productVariantId === productVariantId ? { ...i, quantity } : i
          ),
        }));
        window.dispatchEvent(new CustomEvent('cart:updated'));
      },

      clearCart: () => {
        set({ items: [] });
        window.dispatchEvent(new CustomEvent('cart:updated'));
      },

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'guest-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
