import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export const CommonDialog = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = "md",
  fullWidth = true,
  showHeader = true,
  showActions = true,
  contentPadding = { px: 2, py: 1 },
  actionsPadding = { p: '3rem' },
  paperProps = {
    sx: {
      p: 1,
      borderRadius: 3,
      overflow: 'visible',
    }
  }
}) => {
  const { t } = useTranslation('shared-components');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={paperProps}
    >
      {showHeader && (
        <DialogTitle className="text-center py-10">
          <Typography variant="h5" className="font-semibold">
            {t(title)}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary" className="mt-2">
              {t(subtitle)}
            </Typography>
          )}
        </DialogTitle>
      )}

      <DialogContent sx={contentPadding}>
        {children}
      </DialogContent>

      {showActions && actions && (
        <DialogActions sx={actionsPadding}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};