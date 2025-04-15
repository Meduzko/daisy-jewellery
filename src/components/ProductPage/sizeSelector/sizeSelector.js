"use client";

import React, { useState, useContext, useEffect } from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { CartContext } from '../../../context/CartContext';
import styles from './styles.module.css';

const SizeSelector = ({ item, sizes }) => {
  const { addToItemSize, itemSize } = useContext(CartContext);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  useEffect(() => {
    addToItemSize(item, sizes[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSizeChange = (event, newSize) => {
    if (newSize !== null) {
      setSelectedSize(newSize);
      addToItemSize(item, newSize);
    }
  };

  return (
    <ToggleButtonGroup
      value={selectedSize}
      exclusive
      onChange={handleSizeChange}
      aria-label="Size Selector"
      className={styles.toggleButtonGroup}
    >
      {sizes.map((size) => (
        <ToggleButton
          key={size}
          value={size}
          aria-label={`Size ${size}`}
          classes={{
            root: styles.toggleButton,
            selected: styles.selected,
          }}
        >
          {size}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default SizeSelector;
