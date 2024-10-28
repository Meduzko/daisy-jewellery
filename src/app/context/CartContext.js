"use client";

import { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Add item to cart
  // const addToCart = (product) => {
  //   setCartItems((prevItems) => {
  //     const itemExists = prevItems.find((item) => item.id === product.id);
  //     if (itemExists) {
  //       // Increase quantity
  //       return prevItems.map((item) =>
  //         item.id === product.id
  //           ? { ...item, quantity: item.quantity + 1 }
  //           : item
  //       );
  //     } else {
  //       // Add new item
  //       return [...prevItems, { ...product, quantity: 1 }];
  //     }
  //   });
  // };

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const itemExists = prevItems.find((item) => item.id === product.id);
      if (itemExists) {
        // Increase quantity by the specified amount
        return prevItems.map((item) =>
          item.id === product.id
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
      const itemExists = prevItems.find((item) => item.id === product.id);
      if (itemExists) {
        return prevItems.map((item) =>
          item.id === product.id
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
      prevItems.filter((item) => item.id !== productId)
    );
  };

  // Clear the cart
  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    const total = cartItems.reduce(
      (accumulator, item) => accumulator + item.price * item.quantity,
      0
    );

    return total;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
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
