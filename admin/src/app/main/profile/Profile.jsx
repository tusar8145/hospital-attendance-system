import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/store/hooks';
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  IconButton,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Paper,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import { motion } from 'framer-motion';
import { selectUser } from '../../auth/user/store/userSlice';

function Profile() {
  const { t } = useTranslation('shared-components');
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const user = useAppSelector(selectUser);
  
  // Refs
  const profileFileInputRef = useRef(null);
  
  // States
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Password states
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get full image URL
  const getImageUrl = (filename) => {
    if (!filename) return '/assets/images/avatars/default.jpg';
    if (filename.startsWith('http')) return filename;
    return `${apiConfig.baseUrl}/uploads/${filename}`;
  };

  // Profile Image Functions
  const handleProfileEditClick = () => {
    setProfileDialogOpen(true);
  };

  const handleProfileFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!validateImageFile(file)) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpload = async () => {
    if (!profileFileInputRef.current?.files[0]) {
      dispatch(showMessage({
        message: t('Please select an image first'),
        variant: 'warning',
        autoHideDuration: 3000
      }));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('profileImage', profileFileInputRef.current.files[0]);

    try {
      const response = await axios.post(
        `${apiConfig.hospitalStaffManageLogo}?id=${user.uid}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        dispatch(showMessage({
          message: t('Profile image updated successfully'),
          variant: 'success',
          autoHideDuration: 2000
        }));

        setProfileDialogOpen(false);
        setPreviewUrl(null);
        profileFileInputRef.current.value = '';
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      dispatch(showMessage({
        message: t(error.response?.data?.message || 'Failed to update profile image'),
        variant: 'error',
        autoHideDuration: 5000
      }));
    } finally {
      setUploading(false);
    }
  };

  // Common validation function
  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      dispatch(showMessage({
        message: t('Please select a valid image file (JPEG, PNG, GIF)'),
        variant: 'error',
        autoHideDuration: 3000
      }));
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      dispatch(showMessage({
        message: t('Image size should be less than 5MB'),
        variant: 'error',
        autoHideDuration: 3000
      }));
      return false;
    }

    return true;
  };

  // Password Functions
  const handlePasswordChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    let isValid = true;

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = t('This field is required');
      isValid = false;
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = t('This field is required');
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = t('Password must be at least 6 characters');
      isValid = false;
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('This field is required');
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('Passwords do not match');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setUploading(true);

    try {
      const response = await axios.post(apiConfig.updatePassword, {
        id: user.uid,
        old_password: formData.currentPassword,
        password: formData.newPassword
      });

      dispatch(showMessage({
        message: t(response.data.message),
        autoHideDuration: 2000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right'
        },
        variant: response.data.success === 'success' ? 'success' : 'error'
      }));

      if (response.data.success === 'success') {
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordDialogOpen(false);
      }
    } catch (error) {
      console.error('Password update error:', error);
      dispatch(showMessage({
        message: t('An error occurred while updating password'),
        autoHideDuration: 2000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right'
        },
        variant: 'error'
      }));
    } finally {
      setUploading(false);
    }
  };

  // Dialog close handlers
  const handleCloseProfileDialog = () => {
    setProfileDialogOpen(false);
    setPreviewUrl(null);
    if (profileFileInputRef.current) {
      profileFileInputRef.current.value = '';
    }
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Role translation mapping
  const roleTranslations = {
    'superAdmin': t('Super Admin'),
    'admin': t('Admin'),
    'manager': t('Manager'),
    'staff': t('Staff'),
    'user': t('User')
  };

  const getUserRoleText = (role) => {
    return roleTranslations[role] || role;
  };

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      {/* Header Section - Clean Design */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ 
          mb: 4, 
          background: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <CardContent sx={{ p: 4, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={previewUrl || getImageUrl(user?.data?.photoURL)}
                sx={{
                  width: 120,
                  height: 120,
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark
                  },
                  width: 36,
                  height: 36
                }}
                onClick={handleProfileEditClick}
                size="small"
              >
                <PhotoCameraIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                {user?.data?.displayName || t('User Name')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <SecurityIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 500 }}>
                  {getUserRoleText(user?.role)}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ fontSize: 18 }} />
                {user?.data?.email || t('No email provided')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <Grid container spacing={4}>
        {/* Personal Information Card */}
        <Grid item xs={12} md={8}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 600, 
                mb: 4, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                color: 'text.primary',
                pb: 2,
                borderBottom: `2px solid ${theme.palette.primary.main}`
              }}>
                <PersonIcon color="primary" />
                {t('Personal Information')}
              </Typography>
              
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <BadgeIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('User ID')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {user?.uid || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <PersonIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('Full Name')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {user?.data?.displayName || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <EmailIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('Email Address')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {user?.data?.email || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <PhoneIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('Phone Number')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {user?.data?.phone || t('Not provided')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <SecurityIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('Role')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', textTransform: 'capitalize' }}>
                        {getUserRoleText(user?.role)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions Card */}
        <Grid item xs={12} md={4}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600, 
                mb: 3,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {t('Quick Actions')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PhotoCameraIcon />}
                  onClick={handleProfileEditClick}
                  fullWidth
                  sx={{ 
                    justifyContent: 'flex-start', 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                >
                  {t('Change Profile Photo')}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<LockIcon />}
                  onClick={() => setPasswordDialogOpen(true)}
                  fullWidth
                  sx={{ 
                    justifyContent: 'flex-start', 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.light'
                    }
                  }}
                >
                  {t('Change Password')}
                </Button>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ textAlign: 'center', color: 'text.secondary', p: 2 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  {t('Member since')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  {new Date().toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Profile Image Change Dialog */}
      <Dialog open={profileDialogOpen} onClose={handleCloseProfileDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('Change Profile Image')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
            <Avatar
              src={previewUrl || getImageUrl(user?.data?.photoURL)}
              sx={{ width: 150, height: 150 }}
            />
            
            <Button
              variant="outlined"
              component="label"
              disabled={uploading}
              startIcon={<PhotoCameraIcon />}
              sx={{ borderRadius: 2 }}
            >
              {t('Select Image')}
              <input
                type="file"
                ref={profileFileInputRef}
                onChange={handleProfileFileSelect}
                accept="image/jpeg,image/jpg,image/png,image/gif"
                hidden
              />
            </Button>
            
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="caption" display="block">
                {t('Supported formats: JPEG, PNG, GIF')}
              </Typography>
              <Typography variant="caption" display="block">
                {t('Max file size: 1MB')}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseProfileDialog} disabled={uploading} sx={{ borderRadius: 2 }}>
            {t('Cancel')}
          </Button>
          <Button 
            onClick={handleProfileUpload} 
            variant="contained" 
            disabled={uploading || !profileFileInputRef.current?.files[0]}
            startIcon={uploading ? <CircularProgress size={16} /> : null}
            sx={{ borderRadius: 2 }}
          >
            {uploading ? t('Uploading...') : t('Update Image')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LockIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('Change Password')}
            </Typography>
          </Box>
        </DialogTitle>
        <form onSubmit={handlePasswordSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
              <TextField
                fullWidth
                type="password"
                label={t("Current Password") + "*"}
                value={formData.currentPassword}
                onChange={handlePasswordChange('currentPassword')}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword}
                disabled={uploading}
                sx={{ borderRadius: 2 }}
              />
              
              <TextField
                fullWidth
                type="password"
                label={t("New Password") + "*"}
                value={formData.newPassword}
                onChange={handlePasswordChange('newPassword')}
                error={!!errors.newPassword}
                helperText={errors.newPassword || t("Password must be at least 6 characters")}
                disabled={uploading}
                sx={{ borderRadius: 2 }}
              />
              
              <TextField
                fullWidth
                type="password"
                label={t("Confirm New Password") + "*"}
                value={formData.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={uploading}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleClosePasswordDialog} disabled={uploading} sx={{ borderRadius: 2 }}>
              {t('Cancel')}
            </Button>
            <Button 
              type="submit"
              variant="contained" 
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} /> : null}
              sx={{ borderRadius: 2 }}
            >
              {uploading ? t('Updating...') : t('Update Password')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Profile;