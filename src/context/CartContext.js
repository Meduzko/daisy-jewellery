"use client";

import { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [itemSize, setItemSize] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToItemSize = (product, size) => {
    setItemSize((prevItems) => {
      const itemExists = prevItems.find((item) => item.product_id === product.product_id);
      if (itemExists) {
        // Increase quantity by the specified amount
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, size }
            : item
        );
      } else {
        // Add new item with the specified quantity
        return [...prevItems, { ...product, size }];
      }
    });
  };

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const itemExists = prevItems.find((item) => item.product_id === product.product_id);
      if (itemExists) {
        // Increase quantity by the specified amount
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item with the specified quantity
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const changeItemQuantity = (product, quantity) => {
    setCartItems((prevItems) => {
      const itemExists = prevItems.find((item) => item.product_id === product.product_id);
      if (itemExists) {
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: quantity }
            : item
        );
      } else {
        // Add new item with the specified quantity
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_id !== productId)
    );
  };

  // Clear the cart
  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    const total = cartItems.reduce(
      (accumulator, item) => Number(accumulator) + Number(item.price) * item.quantity,
      0
    );

    return total;
  };

  const getItemSize = item => {
    const res = itemSize?.find((contextItem) => contextItem?.product_id === item?.product_id)?.size;

    return res;
  };

  return (
    <CartContext.Provider
      value={{
        // Cart items
        cartItems,
        addToCart,
        // Size
        itemSize,
        addToItemSize,
        getItemSize,
        // Quantity
        changeItemQuantity,
        removeFromCart,
        clearCart,
        cartOpen,
        setCartOpen,
        getTotalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
