'use client';
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { CartContext } from '../../../context/CartContext';
import styles from './styles.module.css';

const SizeSelector = ({ item, sizes }) => {
  const { addToItemSize, itemSize } = useContext(CartContext);
  const sortedSizes = useMemo(() => {
    return [...new Set(sizes)].sort((a, b) => a - b);
  }, [sizes]);
  const [selectedSize, setSelectedSize] = useState(sortedSizes[0]);

  useEffect(() => {
    addToItemSize(item, sortedSizes[0]);
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
