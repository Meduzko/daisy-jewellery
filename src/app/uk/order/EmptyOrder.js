"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CartContext } from '../../../context/CartContext';

export default function RedirectIfCartEmpty() {
  const { cartItems } = useContext(CartContext);
  const router = useRouter();

  useEffect(() => {
    if (cartItems.length === 0) {
      router.replace('/');
    }
  }, [cartItems, router]);

  return null; // This component doesn't render anything visually
}
