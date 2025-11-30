// ForgotPasswordPage.js
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Paper, 
    Typography, 
    TextField, 
    Button, 
    Alert,
    CircularProgress,
    Backdrop
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiConfig from '../../configs/apiConfig';

// Validation schemas
const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address')
});

const resetPasswordSchema = z.object({
    newPassword: z.string()
        .min(6, 'Password must be at least 6 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

/**
 * Forgot Password Page Component
 */
function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
    const [emailSent, setEmailSent] = useState(false);
    const [token, setToken] = useState('');

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setAlert({ show: false, message: '', severity: 'info' });

        try {
            const response = await fetch(apiConfig.forgotPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: data.email })
            });

            const result = await response.json();

            if (result.success) {
                setEmailSent(true);
                setToken(result.token);
                setAlert({
                    show: true,
                    message: 'If your email is already registered, an OTP has been sent to your inbox.',
                    severity: 'success'
                });
            } else {
                setAlert({
                    show: true,
                    message: result.message || 'Failed to send OTP',
                    severity: 'error'
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                message: 'Network error. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-8 relative overflow-hidden">
            {/* Animated Background (same as login page) */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 animate-gradient-x"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/25 rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-300/20 rounded-full blur-2xl animate-pulse"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md">
                <Paper className="p-10 sm:p-12 bg-white/95 backdrop-blur-xl shadow-2xl border border-white/30 rounded-3xl">
                    {/* Logo */}
                    <div className="text-center mb-12">
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                            <img
                                className="w-24 h-24 mx-auto relative z-10 drop-shadow-lg"
                                src="assets/images/logo/logo.svg"
                                alt="logo"
                            />
                        </div>
                        <Typography 
                            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
                            variant="h4"
                        >
                            Forgot Password
                        </Typography>
                        <Typography 
                            className="text-gray-600   text-lg"
                            variant="body1"
                        >
                            {emailSent 
                                ? 'Enter the OTP sent to your email' 
                                : 'Enter your email to receive a password reset OTP'
                            }
                        </Typography><p className='pt-10'></p>
                    </div>

                    {/* Alert */}
                    {alert.show && (
                        <Alert 
                            severity={alert.severity} 
                            className="mb-8"
                            onClose={() => setAlert({ ...alert, show: false })}
                        >
                            {alert.message}
                        </Alert>
                    )}
<br></br>
                    {/* Email Form */}
                    {!emailSent ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <div className="space-y-2 gap-5 ">
                                <Typography 
                                    className="text-lg font-semibold text-gray-700"
                                    variant="subtitle2"
                                >
                                    Email Address
                                </Typography> <p className='pt-10'></p>
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="email"
                                            fullWidth
                                            variant="outlined"
                                            placeholder="Enter your email address"
                                            error={!!errors.email}
                                            helperText={errors.email?.message}
                                            disabled={loading}
                                            size="medium"
                                        />
                                    )}
                                />
                            </div>
<br></br>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{ 
                                    py: 2,
                                    marginTop: '10px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: 'white',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                                    }
                                }}
                            >
                                Send OTP {/*loading ? <CircularProgress size={24} /> : 'Send OTP'*/}
                            </Button>
                        </form>
                    ) : (
                        <OTPVerification 
                            token={token} 
                            email={control._formValues.email}
                            onBack={() => setEmailSent(false)}
                        />
                    )}
<br></br>
                    {/* Back to Login */}
                    <Box className="text-center mt-10">
                        <Link 
                            to="/sign-in" 
                            className="text-base font-medium text-primary-600 hover:text-primary-500 transition-colors"
                        >
                            ← Back to Sign In
                        </Link>
                    </Box>
                </Paper>
            </div>

            {/* Loading Backdrop */}
            <Backdrop open={loading} sx={{ zIndex: 9999 }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </div>
    );
}

/**
 * OTP Verification Component
 */
function OTPVerification({ token, email, onBack }) {
    const navigate = useNavigate();
    const [step, setStep] = useState('verify'); // 'verify' or 'reset'
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
    const [resetToken, setResetToken] = useState('');

    // OTP Verification Form
    const otpForm = useForm({
        defaultValues: { otp: '' }
    });

    // Reset Password Form
    const resetForm = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { 
            newPassword: '',
            confirmPassword: '' 
        }
    });

    const verifyOTP = async (data) => {
        setLoading(true);
        setAlert({ show: false, message: '', severity: 'info' });

        try {
            const response = await fetch(apiConfig.verifyOTP, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    otp: data.otp
                })
            });

            const result = await response.json();

            if (result.success) {
                setResetToken(result.reset_token);
                setStep('reset');
                setAlert({
                    show: true,
                    message: 'OTP verified successfully. Please set your new password.',
                    severity: 'success'
                });
            } else {
                setAlert({
                    show: true,
                    message: result.message || 'Invalid OTP',
                    severity: 'error'
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                message: 'Network error. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async () => {
        setLoading(true);
        setAlert({ show: false, message: '', severity: 'info' });

        try {
            const response = await fetch(apiConfig.resendOTP, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
            });

            const result = await response.json();

            if (result.success) {
                setAlert({
                    show: true,
                    message: 'New OTP sent to your email',
                    severity: 'success'
                });
            } else {
                setAlert({
                    show: true,
                    message: result.message || 'Failed to resend OTP',
                    severity: 'error'
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                message: 'Network error. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (data) => {
        setLoading(true);
        setAlert({ show: false, message: '', severity: 'info' });

        try {
            const response = await fetch(apiConfig.resetPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reset_token: resetToken,
                    new_password: data.newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                setAlert({
                    show: true,
                    message: 'Password reset successfully! Redirecting to login...',
                    severity: 'success'
                });
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate('/sign-in');
                }, 2000);
            } else {
                setAlert({
                    show: true,
                    message: result.message || 'Failed to reset password',
                    severity: 'error'
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                message: 'Network error. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Alert */}
            {alert.show && (
                <Alert 
                    severity={alert.severity} 
                    className="mb-6"
                    onClose={() => setAlert({ ...alert, show: false })}
                >
                    {alert.message}
                </Alert>
            )}

            {/* OTP Verification Step */}
            {step === 'verify' && (
                <>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Typography 
                                className="text-lg font-semibold text-gray-700"
                                variant="subtitle2"
                            >
                                One-Time Password (OTP)
                            </Typography><p className='pt-8'></p>
                            <form onSubmit={otpForm.handleSubmit(verifyOTP)} className="space-y-6 pt-5">
                                <Controller
                                    name="otp"
                                    control={otpForm.control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="text"
                                            fullWidth
                                            variant="outlined"
                                            placeholder="Enter 6-digit OTP"
                                            inputProps={{ 
                                                maxLength: 6,
                                                style: { 
                                                    textAlign: 'center',
                                                    fontSize: '18px',
                                                    letterSpacing: '8px',
                                                }
                                            }}
                                            disabled={loading}
                                            size="medium"
                                        />
                                    )}
                                />
                                <p></p>
                                <br></br>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    disabled={loading}
                                    sx={{ 
                                        py: 2,
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    <Box className="text-center space-y-4 pt-4">
                        <Button
                            onClick={resendOTP}
                            disabled={loading}
                            className="text-base font-medium text-primary-600 hover:text-primary-500"
                            sx={{ fontSize: '14px' }}
                        >
                            Resend OTP
                        </Button>
                        <div>
                            <Button
                                onClick={onBack}
                                className="text-base font-medium text-gray-600 hover:text-gray-500"
                                sx={{ fontSize: '14px' }}
                            >
                                ← Use different email
                            </Button>
                        </div>
                    </Box>
                </>
            )}

            {/* Reset Password Step */}
            {step === 'reset' && (
                <form onSubmit={resetForm.handleSubmit(resetPassword)} className="space-y-6 pt-20">
                    <div className="space-y-2">
                        <Typography 
                            className="text-lg font-semibold text-gray-700"
                            variant="subtitle2"
                        >
                            New Password
                        </Typography>
                        <Controller
                            name="newPassword"
                            control={resetForm.control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="password"
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter your new password"
                                    error={!!resetForm.formState.errors.newPassword}
                                    helperText={resetForm.formState.errors.newPassword?.message}
                                    disabled={loading}
                                    size="medium"
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2 pt-10">
                        <Typography 
                            className="text-lg font-semibold text-gray-700"
                            variant="subtitle2"
                        >
                            Confirm New Password
                        </Typography>
                        <Controller
                            name="confirmPassword"
                            control={resetForm.control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="password"
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Confirm your new password"
                                    error={!!resetForm.formState.errors.confirmPassword}
                                    helperText={resetForm.formState.errors.confirmPassword?.message}
                                    disabled={loading}
                                    size="medium"
                                />
                            )}
                        />
                    </div>

                    <Box className="pt-20">
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading}
                            sx={{ 
                                py: 2,
                                fontSize: '16px',
                                fontWeight: '600'
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                        </Button>
                    </Box>
                </form>
            )}
        </div>
    );
}

export default ForgotPasswordPage;