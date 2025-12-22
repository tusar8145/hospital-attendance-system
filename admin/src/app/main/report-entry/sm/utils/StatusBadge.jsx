import React from 'react';
import { Box, Typography } from "@mui/material";
import { getStatusConfig } from './frameScreenUtils';

const StatusBadge = ({ status, fontSize }) => {
  const config = getStatusConfig(status);
  
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: '12px',
        backgroundColor: config.bgColor,
        border: `1px solid ${config.color}33`,
        ml: 1
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: config.color,
          mr: 1
        }}
      />
      <Typography
        sx={{
          fontSize: fontSize.small || '0.875rem',
          fontWeight: 600,
          color: config.color
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
};

export default StatusBadge;