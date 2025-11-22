import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const ConfirmationDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  confirmColor = "error"
}) => {
  const { t } = useTranslation('shared-components');
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          p: 4,
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle className="text-center bg-gradient-to-r from-blue-50 to-purple-50 py-8 px-6">
        <Typography variant="h6" className="font-semibold">
          {t(title)}
        </Typography>
      </DialogTitle>

      <DialogContent className="py-10 text-center px-8">
        <Typography variant="body1" className="text-gray-600">
          {t(message)}
        </Typography>
      </DialogContent>

      <DialogActions className="justify-center gap-8 pb-10 px-8">
        <Button
          onClick={onClose}
          variant="outlined"
          className="px-10 py-2"
        >
          {t(cancelText)}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          className="px-10 py-2"
        >
          {t(confirmText)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};