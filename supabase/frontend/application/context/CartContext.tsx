import React, { createContext, useContext, useState, ReactNode } from 'react';

// ─── Chatbot order type (evita dependencia circular con geminiService) ────────
export interface ChatbotOrder {
  negocio: {
    id: string;
    nombre: string;
    whatsapp: string;
    telefono?: string;
    direccion?: string;
  } | null;
  items: { name: string; price: number; quantity: number }[];
  direccionEntrega: string;
  notas: string;
}

export interface CartItem {
  id: string;
  menu_item_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  imagen: string;
  notas?: string;
  personalizaciones?: any;
}

export interface CartRestaurant {
  sucursal_id: string;
  negocio_id: string;
  nombre: string;
  logo: string;
  tiempo_entrega: string;
  items: CartItem[];
}

interface CartContextType {
  cart: CartRestaurant[];
  addItem: (restaurant: Omit<CartRestaurant, 'items'>, item: CartItem) => void;
  removeItem: (sucursal_id: string, item_id: string) => void;
  increaseQuantity: (sucursal_id: string, item_id: string) => void;
  decreaseQuantity: (sucursal_id: string, item_id: string) => void;
  clearCart: () => void;
  clearRestaurant: (sucursal_id: string) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  // Chatbot order
  chatbotOrder: ChatbotOrder | null;
  setChatbotOrder: (order: ChatbotOrder) => void;
  clearChatbotOrder: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartRestaurant[]>([]);
  const [chatbotOrder, setChatbotOrderState] = useState<ChatbotOrder | null>(null);

  const addItem = (restaurant: Omit<CartRestaurant, 'items'>, item: CartItem) => {
    setCart(prev => {
      const existingRestaurant = prev.find(r => r.sucursal_id === restaurant.sucursal_id);

      if (existingRestaurant) {
        // El restaurante ya está en el carrito
        return prev.map(r => {
          if (r.sucursal_id !== restaurant.sucursal_id) return r;
          const existingItem = r.items.find(i => i.id === item.id);
          if (existingItem) {
            // El item ya existe, aumentar cantidad
            return {
              ...r,
              items: r.items.map(i =>
                i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i
              ),
            };
          }
          // Item nuevo en restaurante existente
          return { ...r, items: [...r.items, item] };
        });
      }

      // Restaurante nuevo
      return [...prev, { ...restaurant, items: [item] }];
    });
  };

  const removeItem = (sucursal_id: string, item_id: string) => {
    setCart(prev =>
      prev
        .map(r => {
          if (r.sucursal_id !== sucursal_id) return r;
          return { ...r, items: r.items.filter(i => i.id !== item_id) };
        })
        .filter(r => r.items.length > 0)
    );
  };

  const increaseQuantity = (sucursal_id: string, item_id: string) => {
    setCart(prev =>
      prev.map(r => {
        if (r.sucursal_id !== sucursal_id) return r;
        return {
          ...r,
          items: r.items.map(i =>
            i.id === item_id ? { ...i, cantidad: i.cantidad + 1 } : i
          ),
        };
      })
    );
  };

  const decreaseQuantity = (sucursal_id: string, item_id: string) => {
    setCart(prev =>
      prev
        .map(r => {
          if (r.sucursal_id !== sucursal_id) return r;
          return {
            ...r,
            items: r.items.map(i =>
              i.id === item_id ? { ...i, cantidad: i.cantidad - 1 } : i
            ).filter(i => i.cantidad > 0),
          };
        })
        .filter(r => r.items.length > 0)
    );
  };

  const clearCart = () => setCart([]);

  const clearRestaurant = (sucursal_id: string) => {
    setCart(prev => prev.filter(r => r.sucursal_id !== sucursal_id));
  };

  const getTotalItems = () => {
    return cart.reduce((total, r) => total + r.items.reduce((t, i) => t + i.cantidad, 0), 0);
  };

  const getSubtotal = () => {
    return cart.reduce(
      (total, r) =>
        total + r.items.reduce((t, i) => t + i.precio_unitario * i.cantidad, 0),
      0
    );
  };

  // ─── Chatbot order ────────────────────────────────────────────────────────

  const setChatbotOrder = (order: ChatbotOrder) => {
    setChatbotOrderState(order);
    // Populate cart from chatbot order so CartScreen can display items
    const chatbotCart: CartRestaurant = {
      sucursal_id: order.negocio?.id ?? 'chatbot',
      negocio_id: order.negocio?.id ?? 'chatbot',
      nombre: order.negocio?.nombre ?? 'Restaurante',
      logo: '',
      tiempo_entrega: '30-45',
      items: order.items.map((item, idx) => ({
        id: `chatbot-${idx}-${item.name.replace(/\s/g, '_')}`,
        menu_item_id: item.name,
        nombre: item.name,
        precio_unitario: item.price,
        cantidad: item.quantity,
        imagen: '',
        notas: order.notas || undefined,
      })),
    };
    setCart([chatbotCart]);
  };

  const clearChatbotOrder = () => {
    setChatbotOrderState(null);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      clearRestaurant,
      getTotalItems,
      getSubtotal,
      chatbotOrder,
      setChatbotOrder,
      clearChatbotOrder,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
}