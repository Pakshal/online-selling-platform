"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface Cart {
  storeId: string;
  storeName: string;
  items: CartItem[];
}

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  addItem: (
    storeId: string,
    storeName: string,
    item: Omit<CartItem, "quantity">
  ) => "added" | "store_conflict";
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_PREFIX = "selling_cart_";

/** Returns a user-scoped localStorage key so different users never share a cart. */
function getStorageKey(): string {
  try {
    const email = localStorage.getItem("user_email");
    // Use the email as the key suffix; fall back to "guest" for unauthenticated browsing
    return STORAGE_PREFIX + (email ? email.toLowerCase() : "guest");
  } catch {
    return STORAGE_PREFIX + "guest";
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  // Hydrate from localStorage after mount, using the current user's key
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (raw) setCart(JSON.parse(raw));
      else setCart(null);
    } catch {}
  }, []);

  // Also reset the cart whenever the logged-in user changes (e.g. after login/logout)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user_email") {
        // User switched — reload cart for the new user
        try {
          const raw = localStorage.getItem(getStorageKey());
          setCart(raw ? JSON.parse(raw) : null);
        } catch {
          setCart(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: Cart | null) => {
    setCart(next);
    const key = getStorageKey();
    if (next) {
      localStorage.setItem(key, JSON.stringify(next));
    } else {
      localStorage.removeItem(key);
    }
  }, []);

  const addItem = useCallback(
    (storeId: string, storeName: string, item: Omit<CartItem, "quantity">) => {
      // If cart belongs to a DIFFERENT store — block
      if (cart && cart.storeId !== storeId) return "store_conflict";

      setCart((prev) => {
        const base: Cart = prev ?? { storeId, storeName, items: [] };
        const existing = base.items.find((i) => i.productId === item.productId);
        const items = existing
          ? base.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          : [...base.items, { ...item, quantity: 1 }];
        const next = { ...base, items };
        localStorage.setItem(getStorageKey(), JSON.stringify(next));
        return next;
      });
      return "added";
    },
    [cart]
  );

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => {
      if (!prev) return null;
      const items = prev.items.filter((i) => i.productId !== productId);
      const next = items.length ? { ...prev, items } : null;
      if (next) localStorage.setItem(getStorageKey(), JSON.stringify(next));
      else localStorage.removeItem(getStorageKey());
      return next;
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) => {
      if (!prev) return null;
      const items = prev.items.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i
      );
      const next = { ...prev, items };
      localStorage.setItem(getStorageKey(), JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem(getStorageKey());
    setCart(null);
  }, []);

  const itemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const subtotal = cart?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, addItem, removeItem, updateQty, clearCart, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

const EMPTY_CART: CartContextValue = {
  cart: null,
  itemCount: 0,
  subtotal: 0,
  addItem: () => "added",
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
};

export function useCart() {
  return useContext(CartContext) ?? EMPTY_CART;
}
