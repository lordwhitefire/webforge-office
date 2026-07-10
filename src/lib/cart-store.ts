"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem { id: string; slug: string; name: string; price: number; image: string; quantity: number }

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  getTotal: () => number
  getCount: () => number
}

export const useCart = create<CartState>()(persist((set, get) => ({
  items: [],
  addItem: (item, qty = 1) => {
    const existing = get().items.find(i => i.id === item.id)
    if (existing) {
      set({ items: get().items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i) })
    } else {
      set({ items: [...get().items, { ...item, quantity: qty }] })
    }
  },
  removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
  updateQuantity: (id, qty) => {
    if (qty <= 0) { get().removeItem(id); return }
    set({ items: get().items.map(i => i.id === id ? { ...i, quantity: qty } : i) })
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  getCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}), { name: "mp-cart" }))
