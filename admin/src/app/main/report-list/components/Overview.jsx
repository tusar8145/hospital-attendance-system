// D:\Projects\trans\hospital-attendance-system\admin\src\app\main\report-list\components\Overview.jsx
import React from 'react';
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Warning from "@mui/icons-material/Warning";
import Visibility from "@mui/icons-material/Visibility";
import HourglassEmpty from "@mui/icons-material/HourglassEmpty";
import { Box, Paper, Stack, Typography, CircularProgress } from "@mui/material";

const Overview = ({ cards, loading = false }) => {
  const iconComponents = {
    NoteDone: CheckCircle,
    Alert01: Warning,
    PropertyView: Visibility,
    Loading: HourglassEmpty
  };

  if (loading) {
    return (
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', py: 1 }}>
        {[1, 2, 3, 4].map((index) => (
          <Paper
            key={index}
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'grey.200',
              padding: 2,
              width: 299,
              minWidth: 299,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 84
            }}
          >
            <CircularProgress size={24} />
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <Stack 
      direction="row" 
      spacing={2} 
      sx={{ 
        overflowX: 'auto',
        py: 1,
        '&::-webkit-scrollbar': {
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '3px',
        },
      }}
    >
      {cards.map((card, index) => {
        const IconComponent = iconComponents[card.icon] || ArrowForward;
        
        return (
          <Paper
            key={index}
            onClick={card.onClick}
            sx={{
              backgroundColor: card.bgColor,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "grey.50",
              boxShadow: "0px 2px 4px -1px rgba(13, 13, 18, 0.06)",
              padding: 2,
              width: 284,
              minWidth: 284,
              cursor: "pointer",
              transition: 'all 0.2s ease',
              "&:hover": {
                opacity: 0.95,
                transform: 'translateY(-2px)',
                boxShadow: "0px 4px 8px -1px rgba(13, 13, 18, 0.1)",
              },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "inset 0px -4px 6px rgba(255, 255, 255, 0.5), 0px 1px 2px rgba(13, 13, 18, 0.1)",
                }}
              >
                <IconComponent sx={{ fontSize: 24, color: card.bgColor }} />
              </Box>

              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    color: "rgba(255, 255, 255, 0.95)",
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {card.label}
                </Typography>
                <Typography
                  sx={{
                    color: "white",
                    fontSize: "24px",
                    fontWeight: 700,
                    lineHeight: 1.33,
                    letterSpacing: '0.5px',
                  }}
                >
                  {card.value}
                </Typography>
              </Stack>

              <ArrowForward sx={{ 
                fontSize: 24, 
                color: "rgba(255, 255, 255, 0.9)",
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'translateX(2px)'
                }
              }} />
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default Overview;