// components/PopupManager.js
"use client";

import { useContext, useEffect, useState } from "react";
import { CartContext } from "../../context/CartContext";
import SuccessfulOrderPopup from "./SuccessfulOrderPopup/SuccessfulOrderPopup";

export default function PopupManager() {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const { orderSuccess, setOrderSuccess } = useContext(CartContext);

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    setOrderSuccess(false);
    window.location.href = '/';
  };


  useEffect(() => {
    if (orderSuccess) {
      setShowSuccessPopup(true);
    }
  }, [orderSuccess, setShowSuccessPopup]);

  return (
    <>
      {/* If you have more popups, you can place them here too */}
      <SuccessfulOrderPopup
        open={showSuccessPopup}
        onClose={handleCloseSuccessPopup}
      />
    </>
  );
}
