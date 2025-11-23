import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import CardContent from '@mui/material/CardContent';
import JwtLoginTab from './tabs/JwtSignInTab';

/**
 * The sign in page.
 */
function SignInPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-16">
			<div className="flex w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-white/70">
				{/* Left Side - Login Form */}
				<Paper className="flex-1 p-8 sm:p-16 md:p-24 bg-transparent shadow-none">
					<div className="flex flex-col items-center justify-center h-full">
						{/* Logo */}
						<div className="mb-32 text-center">
							<div className="relative">
								<div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
								<img
									className="w-48 mx-auto relative z-10"
									src="assets/images/logo/logo.svg"
									alt="logo"
								/>
							</div>
							<Typography 
								className="text-gray-600 mt-16 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text"
								variant="h4"
							>
								Welcome Back
							</Typography>
							<Typography 
								className="mt-8 text-gray-600"
								variant="body1"
							>
								Sign in to your Hospital Attendance Management account
							</Typography>
						</div>

						{/* Login Form Container */}
						<div className="w-full max-w-md">
							<JwtLoginTab />
						</div>

						{/* Footer */}
						<div className="mt-32 text-center">
							<Typography 
								variant="body2" 
								className="text-gray-500"
							>
								© 2025 Hospital Attendance Management. All rights reserved.
							</Typography>
						</div>
					</div>
				</Paper>

				{/* Right Side - Branding */}
				<Box
					className="hidden lg:flex flex-1 flex-col items-center justify-center p-24 relative"
					sx={{ 
						background: 'linear-gradient(135deg, #d6c3e8ff 10%, #481f7187 50%, #102a47b9 100%)',
					}}
				>
					{/* Animated Background Elements */}
					<div className="absolute inset-0 overflow-hidden">
						{/* Floating circles */}
						<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-xl animate-float"></div>
						<div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-300/20 rounded-full blur-lg animate-float-delayed"></div>
						<div className="absolute top-1/2 right-1/3 w-32 h-32 bg-pink-300/15 rounded-full blur-md animate-pulse"></div>
						
						{/* Grid pattern overlay */}
						<div className="absolute inset-0 opacity-10">
							<svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
								<defs>
									<pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
										<path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
									</pattern>
								</defs>
								<rect width="100" height="100" fill="url(#grid)" />
							</svg>
						</div>
					</div>

					{/* Content */}
					<div className="relative z-10 text-center text-white">
						<div className="mb-16">
							<div className="relative inline-block">
								<div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse"></div>
								<img
									className="w-32 h-32 mx-auto mb-16 rounded-full bg-white/10 p-4 backdrop-blur-sm border border-white/20 relative z-10"
									src="assets/images/logo/logo.svg"
									alt="Hospital Attendance Management"
								/>
							</div>
						</div>
						
						<Typography 
							className="text-4xl font-bold mb-8 leading-tight drop-shadow-lg"
							variant="h3"
						>
							Hospital Attendance
							<span className="block text-3xl mt-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
								Management System
							</span>
						</Typography>
						
						<Typography 
							className="text-xl opacity-95 leading-relaxed mb-12 font-light drop-shadow-md"
							variant="h6"
						>
							Secure • Reliable • Efficient
						</Typography>

				 
					</div>
				</Box>
			</div>
		</div>
	);
}

export default SignInPage;