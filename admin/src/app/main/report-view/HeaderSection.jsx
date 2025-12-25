// HeaderSection.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Paper, 
  Typography, 
  Button, 
  Stack, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));

const StyledSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const ActionButton = styled(Button)(({ theme, buttoncolor = 'primary' }) => ({
  fontWeight: 'bold',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease',
  textTransform: 'none',
  minWidth: '100px',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
}));

const HeaderSection = ({
  title,
  subtitle,
  primaryButtonText = '承認する',
  secondaryButtonText = 'コメント追加',
  showSecondaryButton = true,
  primaryButtonColor = 'success',
  secondaryButtonColor = 'primary',
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  showDate = true,
  customDate,
  variant = 'gradient', // 'gradient', 'solid', 'outlined'
  children,
  loading = false,
  status,
  userRole,
  reportNo,
  approval,
  // New props for draft functionality
  onMakeDraft,
  reportExists = false
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const getCurrentJapaneseDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const day = days[now.getDay()];
    return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日（${day}）`;
  };

  // Determine styling based on variant
  const getPaperStyle = () => {
    switch (variant) {
      case 'solid':
        return {
          background: 'white',
          border: '2px solid #e0e0e0',
        };
      case 'outlined':
        return {
          background: 'transparent',
          border: '2px solid #2196F3',
        };
      case 'gradient':
      default:
        return {
          background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
        };
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMakeDraftClick = () => {
    handleMenuClose();
    if (onMakeDraft) {
      onMakeDraft();
    }
  };

  // Check if primary button (approval) should be enabled
  const isPrimaryButtonEnabled = status === 'submitted' && onPrimaryButtonClick && !loading;
  
  // Check if draft button should be enabled
  const isDraftButtonEnabled = status === 'submitted' && onMakeDraft && !loading;
  
  // Check if draft button should be visible (not for operators)
  const showMakeDraftOption = userRole !== 'operator' && onMakeDraft;
  
  // Check if primary button should show as disabled/approved
  const isPrimaryButtonDisabled = loading || !isPrimaryButtonEnabled || status === 'approved';
  
  // Get primary button text based on status
  const getPrimaryButtonText = () => {
    if (loading) return '処理中...';
    if (status === 'approved') return '承認済み';
    if (status === 'draft') return '提出して承認';
    return primaryButtonText;
  };
  
  // Get primary button color based on status
  const getPrimaryButtonColor = () => {
    if (status === 'approved') return 'secondary';
    if (status === 'draft') return 'success';
    return primaryButtonColor;
  };
  
  // Get draft button tooltip message
  const getDraftButtonTooltip = () => {
    if (userRole === 'operator') return 'オペレーターは下書き保存できません';
    if (status !== 'submitted') return `下書き保存は「提出済み」ステータスのみ可能です (現在: ${getStatusText(status)})`;
    return '';
  };
  
  // Get approval button tooltip message
  const getApprovalButtonTooltip = () => {
    if (status === 'approved') return '既に承認済みです';
    if (status !== 'submitted') return `承認は「提出済み」ステータスのみ可能です (現在: ${getStatusText(status)})`;
    return '';
  };
  
  // Helper function to get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'draft': return '下書き';
      case 'submitted': return '提出済み';
      case 'approved': return '承認済み';
      case 'rejected': return '却下済み';
      default: return status || '不明';
    }
  };

  return (
    <StyledPaper elevation={2} sx={getPaperStyle()}> 
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StyledTitle variant="h4">
                {title}
              </StyledTitle>
            </Box>
            {subtitle && (
              <StyledSubtitle variant="body1">
                {subtitle}
              </StyledSubtitle>
            )}
            {showDate && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {customDate || getCurrentJapaneseDate()}
              </Typography>
            )}
            {children && (
              <Box sx={{ mt: 2 }}>
                {children}
              </Box>
            )}
          </Stack>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexShrink: 0, alignItems: 'center' }}>
          {showSecondaryButton && (
            <ActionButton
              variant="contained"
              color={secondaryButtonColor}
              onClick={onSecondaryButtonClick}
              disabled={loading}
              sx={{ 
                bgcolor: secondaryButtonColor === 'primary' ? '#2196F3' : 
                        secondaryButtonColor === 'warning' ? '#FF9800' : undefined,
                '&:hover': {
                  bgcolor: secondaryButtonColor === 'primary' ? '#1976D2' : 
                          secondaryButtonColor === 'warning' ? '#F57C00' : undefined,
                }
              }}
            >
              {secondaryButtonText}
            </ActionButton>
          )}
          
          <Tooltip title={getApprovalButtonTooltip()} arrow>
            <span>
              <ActionButton
                variant="contained"
                color={getPrimaryButtonColor()}
                onClick={onPrimaryButtonClick}
                disabled={isPrimaryButtonDisabled || approval}
                sx={{ 
                  bgcolor: getPrimaryButtonColor() === 'success' ? '#4CAF50' : 
                          getPrimaryButtonColor() === 'secondary' ? '#9E9E9E' : undefined,
                  '&:hover': {
                    bgcolor: getPrimaryButtonColor() === 'success' ? '#388E3C' : 
                            getPrimaryButtonColor() === 'secondary' ? '#757575' : undefined,
                  }
                }}
              >
                {getPrimaryButtonText()}
              </ActionButton>
            </span>
          </Tooltip>

          {/* Three-dot menu */}
          <IconButton
            aria-label="more"
            aria-controls={open ? 'long-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleMenuClick}
            disabled={loading}
            sx={{ 
              border: '1px solid #e0e0e0',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            PaperProps={{
              style: {
                width: '200px',
              },
            }}
          >
            {showMakeDraftOption && (
              <Tooltip title={getDraftButtonTooltip()} arrow placement="left">
                <span>
                  <MenuItem 
                    onClick={handleMakeDraftClick}
                    disabled={!isDraftButtonEnabled || userRole === 'operator'}
                  >
                    下書き保存
                  </MenuItem>
                </span>
              </Tooltip>
            )}
            {/* Add more menu items here if needed */}
          </Menu>
        </Box>
      </Box>
    </StyledPaper>
  );
};

// Update Prop Types
HeaderSection.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  primaryButtonText: PropTypes.string,
  secondaryButtonText: PropTypes.string,
  showSecondaryButton: PropTypes.bool,
  primaryButtonColor: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  secondaryButtonColor: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  onPrimaryButtonClick: PropTypes.func,
  onSecondaryButtonClick: PropTypes.func,
  onMakeDraft: PropTypes.func, // New prop for draft functionality
  showDate: PropTypes.bool,
  customDate: PropTypes.string,
  variant: PropTypes.oneOf(['gradient', 'solid', 'outlined']),
  children: PropTypes.node,
  loading: PropTypes.bool,
  status: PropTypes.string,
  userRole: PropTypes.string,
  reportNo: PropTypes.string,
  reportExists: PropTypes.bool,
};

export default HeaderSection;