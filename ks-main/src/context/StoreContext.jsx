import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const CART_STORAGE_KEY = "shopping-cart";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  // Estado inicial del carrito desde localStorage o vacío
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Guardar el carrito en localStorage cada vez que cambia
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Añadir producto al carrito
  const addToCart = (item,isSkin,isSeguroRP) => {
    console.log(isSeguroRP)
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem._id === item._id && cartItem.isSeguroRP == isSeguroRP);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { ...item, quantity: 1 ,isSkin,isSeguroRP, itemType: isSkin ? 'Skin':'Item'}];
      }
    });

    toast.success("Producto añadido al carrito", {
      description: item.name || item.NombreSkin,
      position: "bottom-right",
      duration: 2000,
    });
  };

  // Eliminar producto del carrito
  const removeFromCart = (itemId) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item._id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0); // Filtrar productos con cantidad mayor a 0
    });
  };

  // Vaciar el carrito completamente
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  // Calcular el total del carrito (precio total)
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Calcular el total de items en el carrito (cantidad total)
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Proveer funciones y estado del carrito al contexto
  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        getCartTotal,
        getTotalItems,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

// Hook personalizado para usar el contexto del Store
export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore debe ser usado dentro de un StoreProvider");
  }
  return context;
};
