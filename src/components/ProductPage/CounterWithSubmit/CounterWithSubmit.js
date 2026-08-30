"use client";

import React, { useContext } from 'react';
import { CartContext } from '../../../context/CartContext';
import ProductBuyButton from '../../Buttons/ProductBuy/ProductBuy';
import { trackFacebookEvent } from '../../../helpers/fbpixel';

const CounterWithSubmit = ({ product }) => {
  const { cartItems, addToCart, setCartOpen } = useContext(CartContext);
  const cartItem = cartItems.find((item) => item.product_id === product.product_id);

  const handleButtonClick = () => {
    setCartOpen(true);

    if (!cartItem) {
      addToCart(product, 1);
      try {
        trackFacebookEvent('AddToCart', {
          content_ids: [product.sku || product.code || product.product_id].filter(Boolean),
          content_type: 'product',
          content_name: product.title,
          value: Number(product.price) || 0,
          currency: 'UAH'
        });
      } catch (e) {}
    }
  };

  return (
    <ProductBuyButton
      onClick={handleButtonClick}
    />
  );
};

export default CounterWithSubmit;
