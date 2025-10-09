"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CartContext } from '../../context/CartContext';

export default function RedirectIfCartEmpty({ lang }) {
  const { cartItems } = useContext(CartContext);
  const router = useRouter();

  useEffect(() => {
    if (cartItems.length === 0) {
      const targetLang = lang === 'ru' ? 'ru' : 'uk';
      router.replace(`/${targetLang}`);
    }
  }, [cartItems, router]);

  return null;
}


