import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clampNumber } from '../utils/security';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const qty = clampNumber(quantity, 1, 99);
        const existing = get().items.find((i) => i.id === product.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === product.id
                ? { ...i, quantity: clampNumber(i.quantity + qty, 1, 99) }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...product, quantity: qty }] });
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, quantity) => {
        const qty = clampNumber(quantity, 1, 99);
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      get total() {
        return get().items.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );
      },

      get count() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    { name: 'ward4u-cart' }
  )
);
