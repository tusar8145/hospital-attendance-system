import React, { useState } from 'react';
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Button, Stack, Typography, Box, Menu, MenuItem } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja';

export const Header = ({ 
  filters, 
  onDateRangeChange, 
  onExport 
}) => {
  const [dateMenuAnchor, setDateMenuAnchor] = useState(null);
  const [customDateRange, setCustomDateRange] = useState({
    start: filters.startDate,
    end: filters.endDate
  });

  const handleDateMenuClick = (event) => {
    setDateMenuAnchor(event.currentTarget);
  };

  const handleDateMenuClose = () => {
    setDateMenuAnchor(null);
  };

  const handleQuickDateSelect = (range) => {
    const end = new Date();
    let start = new Date();
    
    switch(range) {
      case 'today':
        start = new Date();
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        return;
    }
    
    onDateRangeChange(start, end);
    handleDateMenuClose();
  };

  const handleCustomDateApply = () => {
    if (customDateRange.start && customDateRange.end) {
      onDateRangeChange(customDateRange.start, customDateRange.end);
      handleDateMenuClose();
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!filters.startDate || !filters.endDate) {
      return '日付を選択';
    }
    
    const format = (date) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    };
    
    return `${format(filters.startDate)} 〜 ${format(filters.endDate)}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography
            variant="h4"
            sx={{
              color: "grey.900",
              fontWeight: 600,
            }}
          >
            レポート一覧
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleDateMenuClick}
            sx={{
              height: 40,
              px: 2,
              py: 1,
              backgroundColor: "rgba(10, 106, 227, 0.08)",
              borderColor: "#0A6AE3",
              borderRadius: 1,
              color: "#0A6AE3",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
              "&:hover": {
                backgroundColor: "rgba(10, 106, 227, 0.12)",
                borderColor: "#0A6AE3",
              },
              minWidth: 200
            }}
          >
            {formatDateRange()}
          </Button>

          <Menu
            anchorEl={dateMenuAnchor}
            open={Boolean(dateMenuAnchor)}
            onClose={handleDateMenuClose}
            PaperProps={{
              sx: {
                p: 2,
                minWidth: 300
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              クイック選択
            </Typography>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Button 
                size="small" 
                onClick={() => handleQuickDateSelect('today')}
                sx={{ justifyContent: 'flex-start' }}
              >
                今日
              </Button>
              <Button 
                size="small" 
                onClick={() => handleQuickDateSelect('week')}
                sx={{ justifyContent: 'flex-start' }}
              >
                過去7日間
              </Button>
              <Button 
                size="small" 
                onClick={() => handleQuickDateSelect('month')}
                sx={{ justifyContent: 'flex-start' }}
              >
                過去1ヶ月
              </Button>
              <Button 
                size="small" 
                onClick={() => handleQuickDateSelect('year')}
                sx={{ justifyContent: 'flex-start' }}
              >
                過去1年
              </Button>
            </Stack>

            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              カスタム範囲
            </Typography>
            <Stack spacing={2}>
              <DatePicker
                label="開始日"
                value={customDateRange.start}
                onChange={(newValue) => setCustomDateRange(prev => ({ ...prev, start: newValue }))}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <DatePicker
                label="終了日"
                value={customDateRange.end}
                onChange={(newValue) => setCustomDateRange(prev => ({ ...prev, end: newValue }))}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <Button 
                variant="contained" 
                size="small" 
                onClick={handleCustomDateApply}
                disabled={!customDateRange.start || !customDateRange.end}
              >
                適用
              </Button>
            </Stack>
          </Menu>
        </Stack>
      </Stack>
    </LocalizationProvider>
  );
};

export default Header;