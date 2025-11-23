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
		<div className="flex min-h-screen items-center justify-center p-8 relative overflow-hidden">
			{/* Animated Colorful Background */}
			<div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 animate-gradient-x"></div>
			
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				{/* Floating bubbles */}
				<div className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-float"></div>
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/25 rounded-full blur-3xl animate-float-delayed"></div>
				<div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-300/20 rounded-full blur-2xl animate-pulse"></div>
				<div className="absolute top-3/4 left-1/3 w-72 h-72 bg-purple-400/15 rounded-full blur-3xl animate-float-slow"></div>
				<div className="absolute bottom-1/3 left-1/5 w-56 h-56 bg-indigo-300/25 rounded-full blur-2xl animate-float"></div>
				
				{/* Grid overlay */}
				<div className="absolute inset-0 opacity-[0.03]">
					<svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
						<defs>
							<pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
								<path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5"/>
							</pattern>
						</defs>
						<rect width="100" height="100" fill="url(#grid)" />
					</svg>
				</div>
			</div>

			{/* Main Content Container */}
			<div className="relative z-10 flex w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md bg-white/10 border border-white/20">
				{/* Left Side - Login Form */}
				<Paper className="flex-1 p-8 sm:p-12 md:p-16 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/30">
					<div className="flex flex-col items-center justify-center h-full">
						{/* Logo */}
						<div className="mb-20 text-center">
							<div className="relative">
								<div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
								<img
									className="w-36 mx-auto relative z-10 drop-shadow-lg"
									src="assets/images/logo/logo.svg"
									alt="logo"
								/>
							</div>
							<Typography 
								className="text-gray-800 mt-10 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text drop-shadow-sm"
								variant="h4"
							>
								Welcome Back
							</Typography>
							<Typography 
								className="mt-4 text-gray-600 text-sm font-medium"
								variant="body1"
							>
								Sign in to your Hospital Attendance Management account
							</Typography>
						</div>

						{/* Login Form Container */}
						<div className="w-full max-w-sm p-6 bg-white/80 rounded-2xl       ">
							<JwtLoginTab />
						</div>

						{/* Footer */}
						<div className="mt-20 text-center">
							<Typography 
								variant="body2" 
								className="text-gray-600 text-xs font-medium"
							>
								© 2025 Hospital Attendance Management. All rights reserved.
							</Typography>
						</div>
					</div>
				</Paper>

				{/* Right Side - Branding */}
				<Box
					className="hidden lg:flex flex-1 flex-col items-center justify-center p-16 relative"
					sx={{ 
						background: 'linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(59,130,246,0.85) 50%, rgba(16,185,129,0.8) 100%)',
						backdropFilter: 'blur(10px)',
					}}
				>
					{/* Additional Background Elements */}
					<div className="absolute inset-0 overflow-hidden">
						<div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-xl animate-float"></div>
						<div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-white/15 rounded-full blur-lg animate-float-delayed"></div>
						<div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/20 rounded-full blur-md animate-pulse"></div>
					</div>

					{/* Heartbeat ECG Wave Frame Around Title */}
					<div className="absolute inset-8 pointer-events-none">
 
						
						{/* Bottom ECG Wave */}
						<div className="absolute bottom-60 left-8 right-8 h-25 opacity-10">
							<svg viewBox="0 0 400 40" className="w-full h-full text-white">
								<path 
									d="M10,20 L30,20 L35,8 L45,32 L55,20 L75,20 L80,12 L90,28 L95,20 L115,20 L120,15 L130,25 L135,20 L155,20 L160,10 L170,30 L175,20 L195,20 L200,18 L210,22 L215,20 L235,20 L240,5 L250,35 L255,20 L275,20 L280,14 L290,26 L295,20 L315,20 L320,16 L330,24 L335,20 L355,20 L360,12 L370,28 L375,20 L390,20"
									fill="none" 
									stroke="currentColor" 
									strokeWidth="2"
									strokeLinecap="round"
									className="animate-ecg-scan-delayed"
								/>
							</svg>
						</div>
						
 

						 
					</div>

					{/* Content */}
					<div className="relative z-10 text-center text-white">
						<div className="mb-14">
							<div className="relative inline-block">
								<div className="absolute inset-0 bg-white/30 rounded-full blur-lg animate-pulse"></div>
								<img
									className="w-24 h-24 mx-auto mb-10 rounded-full bg-white/20 p-3 backdrop-blur-sm border border-white/30 relative z-10 shadow-lg"
									src="assets/images/logo/logo.svg"
									alt="Hospital Attendance Management"
								/>
							</div>
						</div>
						
						<div className="relative">
							<Typography 
								className="text-3xl font-bold mb-6 leading-tight drop-shadow-2xl relative z-20"
								variant="h3"
							>
								Hospital Attendance
								<span className="block text-2xl mt-3 bg-gradient-to-r from-white to-cyan-100 bg-clip-text font-semibold">
									Management System
								</span>
							</Typography>
							
							{/* Floating medical icons around title */}
							<div className="absolute -top-4 -left-8 w-8 h-8 opacity-20 animate-float">
								<svg viewBox="0 0 100 100" className="w-full h-full text-white">
									<path d="M50 25V75M25 50H75" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
								</svg>
							</div>
							<div className="absolute -bottom-4 -right-8 w-8 h-8 opacity-20 animate-float-delayed">
								<svg viewBox="0 0 100 90" className="w-full h-full text-white">
									<path 
										d="M50,80 C35,65 15,45 25,25 C35,5 50,15 50,25 C50,15 65,5 75,25 C85,45 65,65 50,80 Z" 
										fill="none" 
										stroke="currentColor" 
										strokeWidth="2"
									/>
								</svg>
							</div>
						</div>
						
						<Typography 
							className="text-lg opacity-95 leading-relaxed mb-14 font-light drop-shadow-lg tracking-wide"
							variant="h6"
						>
							Secure • Reliable • Efficient
						</Typography>

 
					</div>
				</Box>
			</div>

			{/* CSS for animations */}
			<style jsx>{`
				@keyframes gradient-x {
					0%, 100% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
				}
				.animate-gradient-x {
					animation: gradient-x 15s ease infinite;
					background-size: 200% 200%;
				}
				@keyframes float {
					0%, 100% { transform: translateY(0px) scale(1); }
					50% { transform: translateY(-20px) scale(1.05); }
				}
				.animate-float {
					animation: float 6s ease-in-out infinite;
				}
				.animate-float-delayed {
					animation: float 8s ease-in-out infinite;
					animation-delay: 1s;
				}
				.animate-float-slow {
					animation: float 10s ease-in-out infinite;
					animation-delay: 2s;
				}
				@keyframes ecg-scan {
					0% { stroke-dasharray: 0 400; }
					100% { stroke-dasharray: 400 0; }
				}
				.animate-ecg-scan {
					animation: ecg-scan 3s linear infinite;
				}
				.animate-ecg-scan-delayed {
					animation: ecg-scan 3s linear infinite;
					animation-delay: 1.5s;
				}
				@keyframes ecg-vertical {
					0% { stroke-dasharray: 0 300; }
					100% { stroke-dasharray: 300 0; }
				}
				.animate-ecg-vertical {
					animation: ecg-vertical 4s linear infinite;
				}
				.animate-ecg-vertical-delayed {
					animation: ecg-vertical 4s linear infinite;
					animation-delay: 2s;
				}
			`}</style>
		</div>
	);
}

export default SignInPage;