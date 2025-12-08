// HeaderSection.jsx
import React from 'react';
import PropTypes from 'prop-types'; // Add this import
import { Paper, Typography, Button, Stack, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

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
}) => {
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

  return (
    <StyledPaper elevation={2} sx={getPaperStyle()}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Stack spacing={1}>
            <StyledTitle variant="h4">
              {title}
            </StyledTitle>
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
        
        <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {showSecondaryButton && (
            <ActionButton
              variant="contained"
              color={secondaryButtonColor}
              onClick={onSecondaryButtonClick}
              sx={{ 
                bgcolor: secondaryButtonColor === 'primary' ? '#2196F3' : undefined,
                '&:hover': {
                  bgcolor: secondaryButtonColor === 'primary' ? '#1976D2' : undefined,
                }
              }}
            >
              {secondaryButtonText}
            </ActionButton>
          )}
          
          <ActionButton
            variant="contained"
            color={primaryButtonColor}
            onClick={onPrimaryButtonClick}
            sx={{ 
              bgcolor: primaryButtonColor === 'success' ? '#4CAF50' : undefined,
              '&:hover': {
                bgcolor: primaryButtonColor === 'success' ? '#388E3C' : undefined,
              }
            }}
          >
            {primaryButtonText}
          </ActionButton>
        </Box>
      </Box>
    </StyledPaper>
  );
};

// Prop Types for better documentation
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
  showDate: PropTypes.bool,
  customDate: PropTypes.string,
  variant: PropTypes.oneOf(['gradient', 'solid', 'outlined']),
  children: PropTypes.node,
};

export default HeaderSection;