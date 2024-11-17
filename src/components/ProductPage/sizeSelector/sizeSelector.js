"use client";
import React, { useState, useMemo, useContext } from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { CartContext } from '../../../context/CartContext';
import styles from './styles.module.css';

const SizeSelector = ({ item, sizes }) => {
  const { addToItemSize } = useContext(CartContext);
  const sortedSizes = useMemo(() => sizes.slice().sort((a, b) => a - b), [sizes]);
  const [selectedSize, setSelectedSize] = useState(sortedSizes[0]);


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
      {sortedSizes.map((size) => (
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
