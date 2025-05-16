import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const CART_STORAGE_KEY = "shopping-cart";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, isSkin = false, isSeguroRP = true, isUnranked = false) => {
    // Determinar el tipo de item y la descripción
    let itemType = 'Item';
    let itemDescription = item.name;
    
    if (isSkin) {
      itemType = 'Skin';
      itemDescription = item.NombreSkin;
    } else if (isUnranked) {
      itemType = 'Unranked';
      itemDescription = `Cuenta ${item.region} - Nivel ${item.nivel}`;
      
      // Verificar el stock para unrankeds
      if (item.stock !== undefined) {
        // Verificar si hay stock disponible
        if (item.stock <= 0) {
          toast.error("No hay stock disponible", {
            description: "Esta cuenta no tiene stock disponible",
            position: "bottom-right",
            duration: 3000,
          });
          return; // Salir de la función si no hay stock
        }
        
        // Verificar si ya hay unidades en el carrito y si exceden el stock disponible
        const currentCartItem = cart.find(cartItem => 
          cartItem._id === item._id && 
          cartItem.isUnranked === true
        );
        
        if (currentCartItem) {
          const currentQuantity = currentCartItem.quantity || 0;
          if (currentQuantity >= item.stock) {
            toast.error("Stock insuficiente", {
              description: `Solo hay ${item.stock} unidades disponibles de esta cuenta`,
              position: "bottom-right",
              duration: 3000,
            });
            return; // Salir de la función si ya se alcanzó el stock máximo
          }
        }
      }
    }

    setCart((prev) => {
      // Buscar el item existente considerando todos los parámetros
      const existingItem = prev.find(
        (cartItem) => 
          cartItem._id === item._id && 
          cartItem.isSeguroRP === isSeguroRP &&
          cartItem.isUnranked === isUnranked
      );

      if (existingItem) {
        // Verificar stock antes de incrementar para unrankeds
        if (isUnranked && item.stock !== undefined) {
          // Si la cantidad actual más 1 supera el stock, no permitir la adición
          if (existingItem.quantity + 1 > item.stock) {
            return prev; // Mantener el carrito sin cambios
          }
        }
        
        fbq('track', 'AddToCart', {content_ids: existingItem._id, content_type: itemType ,contents:existingItem});
        return prev.map((cartItem) =>
          cartItem._id === item._id && cartItem.isSeguroRP === isSeguroRP && cartItem.isUnranked === isUnranked
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      fbq('track', 'AddToCart', {content_ids: item._id, content_type: itemType ,contents:item});
      // Si es un nuevo item, añadirlo con sus propiedades
      return [...prev, { 
        ...item, 
        quantity: 1,
        isSkin,
        isSeguroRP,
        isUnranked,
        itemType,
        ...(isUnranked && {
          itemDetails: {
            region: item.region,
            nivel: item.nivel,
            escencia: item.escencia,
            escenciaNaranja: item.escenciaNaranja,
            rpAmount: item.rpAmount,
            handUpgrade: item.handUpgrade
          }
        })
      }];
    });

    toast.success("Producto añadido al carrito", {
      description: itemDescription,
      position: "bottom-right",
      duration: 2000,
    });
  };

  const removeFromCart = (itemId, isSeguroRP) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item._id === itemId && item.isSeguroRP === isSeguroRP
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
};

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const getCartTotal = (selectedCurrency) => {
    return cart.reduce((total, item) => {
      if (!selectedCurrency?.symbol) return total;
      const price = parseFloat(item.price) || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

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

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore debe ser usado dentro de un StoreProvider");
  }
  return context;
};