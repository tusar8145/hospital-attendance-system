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
  Tooltip,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import apiConfig from '../../configs/apiConfig';

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

const DeleteButton = styled(Button)(({ theme }) => ({
  fontWeight: 'bold',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease',
  textTransform: 'none',
  minWidth: '100px',
  backgroundColor: theme.palette.error.main,
  color: '#ffffff',
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    backgroundColor: theme.palette.error.light,
    color: '#ffffff',
    opacity: 0.7,
  },
}));

const HeaderSection = ({
  title,
  subtitle,
  primaryButtonText = '承認する',
  secondaryButtonText = '編集',
  tertiaryButtonText = 'ダウンロード',
  quaternaryButtonText = '削除',
  showSecondaryButton = true,
  showTertiaryButton = false,
  showQuaternaryButton = false,
  primaryButtonColor = 'success',
  secondaryButtonColor = 'warning',
  tertiaryButtonColor = 'info',
  tertiaryButtonIcon = <DownloadIcon />,
  quaternaryButtonIcon = <DeleteIcon />,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  onTertiaryButtonClick,
  onMakeDraft,
  showDate = true,
  customDate,
  variant = 'gradient',
  children,
  loading = false,
  status,
  userRole,
  reportNo,
  approval,
  reportExists = false,
  // Delete-related props
  reportId,
  reportDate,
  hospitalName,
  onDeleteSuccess,
  deleteEndpoint = `${apiConfig.baseURL}/report/delete`,
  redirectPath = '/report-list'
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // Snackbar state for alerts
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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

  // Handle tertiary button click (download/export)
  const handleTertiaryButtonClick = (event) => {
    if (onTertiaryButtonClick) {
      onTertiaryButtonClick(event);
    } else {
      handleMenuClick(event);
    }
  };

  // Handle delete button click - open dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!reportId) {
      setDeleteError('レポートIDが見つかりません');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      
      const response = await axios.delete(deleteEndpoint, {
        data: { report_id: reportId }
      });
      
      if (response.data.success) {
        setDeleteDialogOpen(false);
        
        // Show success message
        setSnackbar({
          open: true,
          message: 'レポートが正常に削除されました',
          severity: 'success'
        });
        
        // Call the success callback if provided
        if (onDeleteSuccess) {
          onDeleteSuccess(response.data);
        }
        
        // Redirect to report list page after 1.5 seconds
        setTimeout(() => {
          navigate(redirectPath);
        }, 1500);
      } else {
        // Show error message in dialog
        setDeleteError(response.data.message || 'レポートの削除に失敗しました');
        
        // Also show snackbar error
        setSnackbar({
          open: true,
          message: response.data.message || 'レポートの削除に失敗しました',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      const errorMessage = error.response?.data?.message || 'レポートの削除に失敗しました';
      setDeleteError(errorMessage);
      
      // Show snackbar error
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    if (!deleteLoading) {
      setDeleteDialogOpen(false);
      setDeleteError(null);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Check if primary button (approval) should be enabled
  const isPrimaryButtonEnabled = status === 'submitted' && onPrimaryButtonClick && !loading;
  
  // Check if draft button should be enabled
  const isDraftButtonEnabled = status === 'submitted' && onMakeDraft && !loading;
  
  // Check if draft button should be visible (not for operators)
  const showMakeDraftOption = userRole !== 'operator' && onMakeDraft;
  
  // Check if delete button should be enabled (only for draft reports)
  const isDeleteButtonEnabled = status === 'draft' && !loading && !deleteLoading;
  
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
  
  // Get primary button icon
  const getPrimaryButtonIcon = () => {
    if (status === 'approved') return <CheckCircleIcon />;
    if (primaryButtonText.includes('承認') || primaryButtonText.includes('Approve')) {
      return <CheckCircleIcon />;
    }
    return <SaveIcon />;
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

  // Get edit button tooltip message
  const getEditButtonTooltip = () => {
    if (status === 'approved') return '承認済みのレポートは編集できません';
    if (loading) return '処理中...';
    return 'レポートを編集する';
  };
  
  // Get delete button tooltip message
  const getDeleteButtonTooltip = () => {
    if (status !== 'draft') return '下書き状態のレポートのみ削除できます';
    if (loading || deleteLoading) return '処理中...';
    return 'レポートを削除する';
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
    <>
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
          
          <Box sx={{ display: 'flex', gap: 2, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Edit Button */}
            {showSecondaryButton && (
              <Tooltip title={getEditButtonTooltip()} arrow>
                <span>
                  <ActionButton
                    variant="contained"
                    color={secondaryButtonColor}
                    onClick={onSecondaryButtonClick}
                    disabled={loading || status === 'approved'}
                    startIcon={<EditIcon />}
                    sx={{ 
                      bgcolor: secondaryButtonColor === 'warning' ? '#FF9800' : undefined,
                      '&:hover': {
                        bgcolor: secondaryButtonColor === 'warning' ? '#F57C00' : undefined,
                      }
                    }}
                  >
                    {secondaryButtonText}
                  </ActionButton>
                </span>
              </Tooltip>
            )}
            
            {/* Delete Button - Only for draft reports */}
            {showQuaternaryButton && (
              <Tooltip title={getDeleteButtonTooltip()} arrow>
                <span>
                  <DeleteButton
                    variant="contained"
                    onClick={handleDeleteClick}
                    disabled={!isDeleteButtonEnabled}
                    startIcon={deleteLoading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : quaternaryButtonIcon}
                  >
                    {deleteLoading ? '削除中...' : quaternaryButtonText}
                  </DeleteButton>
                </span>
              </Tooltip>
            )}
            
            {/* Download/Export Button */}
            {showTertiaryButton && (
              <ActionButton
                variant="contained"
                color={tertiaryButtonColor}
                onClick={handleTertiaryButtonClick}
                disabled={loading}
                startIcon={tertiaryButtonIcon}
                sx={{ 
                  bgcolor: tertiaryButtonColor === 'info' ? '#2196F3' : undefined,
                  '&:hover': {
                    bgcolor: tertiaryButtonColor === 'info' ? '#1976D2' : undefined,
                  }
                }}
              >
                {tertiaryButtonText}
              </ActionButton>
            )}
            
            {/* Approval Button */}
            <Tooltip title={getApprovalButtonTooltip()} arrow>
              <span>
                <ActionButton
                  variant="contained"
                  color={getPrimaryButtonColor()}
                  onClick={onPrimaryButtonClick}
                  disabled={isPrimaryButtonDisabled || approval}
                  startIcon={getPrimaryButtonIcon()}
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

            {/* Three-dot menu for additional options */}
            <IconButton
              aria-label="more"
              aria-controls={open ? 'options-menu' : undefined}
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
              id="options-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              PaperProps={{
                style: {
                  width: '220px',
                },
              }}
            >
              {/* Make Draft Option */}
              {showMakeDraftOption && (
                <Tooltip title={getDraftButtonTooltip()} arrow placement="left">
                  <span>
                    <MenuItem 
                      onClick={handleMakeDraftClick}
                      disabled={!isDraftButtonEnabled || userRole === 'operator'}
                    >
                      <ListItemIcon>
                        <SaveIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>下書き保存</ListItemText>
                    </MenuItem>
                  </span>
                </Tooltip>
              )}
            </Menu>
          </Box>
        </Box>
      </StyledPaper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="delete-dialog-title" sx={{ bgcolor: '#ef5350', color: 'white' }}>
          レポートを削除しますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ mt: 2 }}>
            以下のレポートを削除します。この操作は取り消せません。
            <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>レポート番号:</strong> {reportNo || '---'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>日付:</strong> {reportDate || customDate || getCurrentJapaneseDate()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>医療機関:</strong> {hospitalName || subtitle || '---'}
              </Typography>
            </Box>
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteError}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mt: 2, color: 'error.main' }}>
              注意: この操作は元に戻せません。すべての関連データが削除されます。
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary" disabled={deleteLoading}>
            キャンセル
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            autoFocus
            sx={{ color: '#ffffff' }}
          >
            {deleteLoading ? '削除中...' : '削除する'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

HeaderSection.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  primaryButtonText: PropTypes.string,
  secondaryButtonText: PropTypes.string,
  tertiaryButtonText: PropTypes.string,
  quaternaryButtonText: PropTypes.string,
  showSecondaryButton: PropTypes.bool,
  showTertiaryButton: PropTypes.bool,
  showQuaternaryButton: PropTypes.bool,
  primaryButtonColor: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  secondaryButtonColor: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  tertiaryButtonColor: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  tertiaryButtonIcon: PropTypes.node,
  quaternaryButtonIcon: PropTypes.node,
  onPrimaryButtonClick: PropTypes.func,
  onSecondaryButtonClick: PropTypes.func,
  onTertiaryButtonClick: PropTypes.func,
  onMakeDraft: PropTypes.func,
  showDate: PropTypes.bool,
  customDate: PropTypes.string,
  variant: PropTypes.oneOf(['gradient', 'solid', 'outlined']),
  children: PropTypes.node,
  loading: PropTypes.bool,
  status: PropTypes.string,
  userRole: PropTypes.string,
  reportNo: PropTypes.string,
  approval: PropTypes.bool,
  reportExists: PropTypes.bool,
  // Delete-related props
  reportId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  reportDate: PropTypes.string,
  hospitalName: PropTypes.string,
  onDeleteSuccess: PropTypes.func,
  deleteEndpoint: PropTypes.string,
  redirectPath: PropTypes.string,
};

export default HeaderSection;