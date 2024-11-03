"use client";
import React, { useState } from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import styles from './styles.module.css';

const SizeSelector = ({ sizes }) => {
  const [selectedSize, setSelectedSize] = useState(null);

  const handleSizeChange = (event, newSize) => {
    if (newSize !== null) {
      setSelectedSize(newSize);
      console.log('Selected size:', newSize);
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
