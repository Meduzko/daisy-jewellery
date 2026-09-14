"use client";

import React, { useContext } from 'react';
import { CartContext } from '../../../context/CartContext';
import ProductBuyButton from '../../Buttons/ProductBuy/ProductBuy';
import { trackFacebookEvent } from '../../../helpers/fbpixel';
import { applyProductDiscount } from '../../../helpers/productPricing';

const CounterWithSubmit = ({ product }) => {
  const { cartItems, addToCart, setCartOpen } = useContext(CartContext);
  const cartItem = cartItems.find((item) => item.product_id === product.product_id);

  const handleButtonClick = () => {
    setCartOpen(true);

    if (!cartItem) {
      const pricedProduct = applyProductDiscount(product);
      addToCart(pricedProduct, 1);
      try {
        trackFacebookEvent('AddToCart', {
          content_ids: [pricedProduct.sku || pricedProduct.code || pricedProduct.product_id].filter(Boolean),
          content_type: 'product',
          content_name: pricedProduct.title,
          value: Number(pricedProduct.price) || 0,
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
