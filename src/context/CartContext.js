"use client";

import { createContext, useEffect, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [itemSize, setItemSize] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCartItems = sessionStorage.getItem('cartItems');
      const storedItemSizes = sessionStorage.getItem('itemSize');

      if (storedCartItems) {
        setCartItems(JSON.parse(storedCartItems));
      }
      if (storedItemSizes) {
        setItemSize(JSON.parse(storedItemSizes));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && cartItems?.length) {
      sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  useEffect(() => {
    if (typeof window !== 'undefined' && itemSize?.length) {
      sessionStorage.setItem('itemSize', JSON.stringify(itemSize));
    }
  }, [itemSize]);

  const addToCart = (product, quantity = 1) => {
    const { pices, ...restOfProduct } = product;

    setCartItems((prevItems) => {
      const itemExists = prevItems.find(
        (item) => item.product_id === product.product_id
      );
      if (itemExists) {
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { ...restOfProduct, quantity }];
      }
    });
  };

  const addToItemSize = (product, size) => {
    const { pices, ...restOfProduct } = product;

    setItemSize((prevItems) => {
      const itemExists = prevItems.find(
        (item) => item.product_id === product.product_id
      );
      if (itemExists) {
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, size }
            : item
        );
      }

      return [...prevItems, { ...restOfProduct, size }];
    });
  };

  const changeItemQuantity = (product, quantity) => {
    setCartItems((prevItems) => {
      const itemExists = prevItems.find(
        (item) => item.product_id === product.product_id
      );
      if (itemExists) {
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity }
            : item
        );
      } else {
        const { pices, ...restOfProduct } = product;
        return [...prevItems, { ...restOfProduct, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_id !== productId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setItemSize([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cartItems');
      sessionStorage.removeItem('itemSize');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((acc, item) => {
      return acc + Number(item.price) * item.quantity;
    }, 0);
  };

  const getItemSize = (item) => {
    return itemSize?.find(
      (contextItem) => contextItem?.product_id === item?.product_id
    )?.size;
  };

  const handleOrderSuccess = () => {
    clearCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        itemSize,
        addToItemSize,
        getItemSize,
        changeItemQuantity,
        removeFromCart,
        clearCart,
        cartOpen,
        setCartOpen,
        getTotalPrice,
        handleOrderSuccess,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
