import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { useAppSelector } from 'app/store/hooks';
import { selectUserRole, selectUser } from '../../auth/user/store/userSlice';
import apiConfig from '../../configs/apiConfig';
import TextField from '@mui/material/TextField';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';
import { useAppDispatch } from 'app/store/hooks';
import axios from 'axios';

/**
 * The password tab component.
 */
function PasswordTab() {
    const { t } = useTranslation('shared-components');
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);

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

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle input changes
    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };

        let isValid = true;

        // Current password validation
        if (!formData.currentPassword.trim()) {
            newErrors.currentPassword = t('This field is required');
            isValid = false;
        }

        // New password validation
        if (!formData.newPassword.trim()) {
            newErrors.newPassword = t('This field is required');
            isValid = false;
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = t('Password must be at least 6 characters');
            isValid = false;
        }

        // Confirm password validation
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

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

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
                // Reset form on success
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
            setIsSubmitting(false);
        }
    };

    const container = {
        show: {
            transition: {
                staggerChildren: 0.04
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 40 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full"
        >
            <div className="md:flex">
                <div className="flex flex-col flex-1 md:ltr:pr-32 md:rtl:pl-32">
                    <Card
                        component={motion.div}
                        variants={item}
                        className="w-full mb-32"
                    >
                        <div className="px-32 pt-24">
                            <Typography className="text-2xl font-semibold leading-tight">
                                {t('Update Password')}
                            </Typography>
                        </div>

                        <CardContent className="px-32 py-24">
                            <form onSubmit={handleSubmit}>
                                {/* Current Password Field */}
                                <div className="mb-24">
                                    <TextField
                                        fullWidth
                                        className="mt-20"
                                        type="password"
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleInputChange('currentPassword')}
                                        label={`${t("Current Password")}*`}
                                        error={!!errors.currentPassword}
                                        disabled={isSubmitting}
                                    />
                                    {errors.currentPassword && (
                                        <p style={{ color: "red", marginTop: "4px", marginBottom: "8px" }}>
                                            {errors.currentPassword}
                                        </p>
                                    )}
                                </div>

                                {/* New Password Field */}
                                <div className="mb-24">
                                    <TextField
                                        fullWidth
                                        className="mt-20"
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleInputChange('newPassword')}
                                        label={`${t("New Password")}*`}
                                        error={!!errors.newPassword}
                                        disabled={isSubmitting}
                                        helperText={t("Password must be at least 6 characters")}
                                    />
                                    {errors.newPassword && (
                                        <p style={{ color: "red", marginTop: "4px", marginBottom: "8px" }}>
                                            {errors.newPassword}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div className="mb-24">
                                    <TextField
                                        fullWidth
                                        className="mt-20"
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange('confirmPassword')}
                                        label={`${t("Confirm New Password")}*`}
                                        error={!!errors.confirmPassword}
                                        disabled={isSubmitting}
                                    />
                                    {errors.confirmPassword && (
                                        <p style={{ color: "red", marginTop: "4px", marginBottom: "8px" }}>
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="mb-24">
                                    <Button
                                        type="submit"
                                        color="secondary"
                                        variant="contained"
                                        disabled={isSubmitting}
                                        style={{ marginTop: "12px" }}
                                    >
                                        {isSubmitting ? t("Updating...") : t("Update Password")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}

export default PasswordTab;