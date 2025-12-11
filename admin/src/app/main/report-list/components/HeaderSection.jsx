// D:\Projects\trans\hospital-attendance-system\admin\src\app\main\report-list\components\HeaderSection.jsx
import React from 'react';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, InputAdornment, TextField, Tooltip } from "@mui/material";

export const HeaderSection = ({ 
  filters, 
  onStatusFilter, 
  onSearch,
  onExport 
}) => {
  const filterButtons = [
    { 
      label: `すべてのレポート`, 
      value: 'all',
      variant: filters.status === 'all' ? "contained" : "outlined", 
      color: "primary" 
    },
    { 
      label: `確認済みレポート`, 
      value: 'approved',
      variant: filters.status === 'approved' ? "contained" : "outlined", 
      color: "primary" 
    },
    { 
      label: `未確認レポート`, 
      value: 'pending',
      variant: filters.status === 'pending' ? "contained" : "outlined", 
      color: "primary" 
    },
  ];

  const handleSearchChange = (event) => {
    const value = event.target.value;
    // Debounce search or call immediately
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && onSearch) {
      onSearch(event.target.value);
    }
  };

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: 'wrap',
        gap: 2,
        px: 2.5,
        py: 2,
        width: "100%",
        bgcolor: "transparent",
        borderBottom: 1,
        borderColor: 'grey.200'
      }}
    >
      <Box sx={{ 
        display: "flex", 
        gap: 1, 
        alignItems: "center",
        flexWrap: 'wrap'
      }}>
        {filterButtons.map((button, index) => (
          <Button
            key={index}
            variant={button.variant}
            color={button.color}
            onClick={() => onStatusFilter && onStatusFilter(button.value)}
            sx={{
              height: 40,
              px: 2,
              py: 1,
              borderRadius: 1,
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: button.variant === "contained" ? 1 : 0,
              bgcolor:
                button.variant === "outlined"
                  ? "rgba(33, 150, 243, 0.08)"
                  : undefined,
              borderColor:
                button.variant === "outlined" ? "transparent" : undefined,
              "&:hover": {
                bgcolor:
                  button.variant === "outlined"
                    ? "rgba(33, 150, 243, 0.12)"
                    : undefined,
                borderColor:
                  button.variant === "outlined" ? "transparent" : undefined,
              },
            }}
          >
            {button.label}
          </Button>
        ))}
      </Box>

      <Box sx={{ 
        display: "flex", 
        gap: 2, 
        alignItems: "center",
        flexWrap: 'wrap',
        justifyContent: { xs: 'flex-start', sm: 'flex-end' }
      }}>
        <TextField
          placeholder="検索 (日付、報告番号)"
          variant="outlined"
          size="small"
          value={filters.search || ''}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          sx={{
            width: { xs: '100%', sm: 198 },
            minWidth: 198,
            "& .MuiOutlinedInput-root": {
              height: 40,
              bgcolor: "white",
              borderRadius: 1,
              "& fieldset": {
                borderColor: "#E0E0E0",
              },
              "&:hover fieldset": {
                borderColor: "#0A6AE3",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{ width: 16, height: 16, color: "text.secondary" }}
                />
              </InputAdornment>
            ),
          }}
        />

        <Tooltip title="CSVエクスポート">
          <Button
            variant="contained"
            onClick={onExport}
            sx={{
              height: 40,
              px: 1.5,
              py: 1,
              bgcolor: "#F5F5F5",
              color: "primary.main",
              borderRadius: 1,
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow: 1,
              minWidth: 100,
              "&:hover": {
                bgcolor: "#EEEEEE",
              },
            }}
            startIcon={<FileDownloadIcon sx={{ width: 16, height: 16 }} />}
          >
            書出
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default HeaderSection;