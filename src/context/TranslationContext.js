"use client";

import React, { createContext, useContext } from 'react';

const TranslationContext = createContext();

export const useTranslation = () => {
  return useContext(TranslationContext);
};

export const TranslationProvider = ({ children, dictionary }) => {
  return (
    <TranslationContext.Provider value={dictionary}>
      {children}
    </TranslationContext.Provider>
  );
};
