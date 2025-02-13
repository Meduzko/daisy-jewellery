"use client";

import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

const RemainingPriceProgressBar = ({ price, maxPrice }) => {
  const remaining = Math.max(maxPrice - price, 0);
  const normalizedValue = maxPrice > 0 ? (price / maxPrice) * 100 : 0;
  const value = Math.min(normalizedValue, 100);

  if (normalizedValue >= 100) {
    return null;
  }

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="span" gutterBottom align="left">
          До безкоштовної доставки залишилося:
        </Typography>
        <Typography variant="span" gutterBottom sx={{ ml: 1 }}>
          {`${remaining} грн`}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
            height: 10,
            // Background (unfilled portion)
            backgroundColor: "#ccc",
            // Filled portion
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#000",
              // Remove or customize transition
              transition: "none",
            },
          }}
      />
    </Box>
  );
};

export default RemainingPriceProgressBar;
