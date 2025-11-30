import { PrismaClient } from '@prisma/client';
import { Mail } from './Mail.js'; // Your existing Mail class
import jwt from "jsonwebtoken";
import md5 from "md5";
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

export class AuthController {
  
  /**
   * Generate OTP
   * @returns {string}
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate random token
   * @returns {string}
   */
  generateToken() {
    return jwt.sign({ timestamp: Date.now() }, process.env.JWT_SECRET + Math.random());
  }

  /**
   * Send OTP email
   * @param {string} email 
   * @param {string} otp 
   */
// Update the sendOTPEmail method in your AuthController
async sendOTPEmail(email, otp) {
  try {
    console.log('callllllllll', otp)
    const mail = new Mail();
    
    const htmlTemplate = `
      <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
      <html>
      <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <title>Hospital Attendance System</title>
          <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
          <style type="text/css">
              body { margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: #ffffff; padding: 40px 20px 20px; text-align: center; }
              .content { padding: 20px 40px; }
              .otp-code { font-size: 42px; font-weight: bold; text-align: center; color: #007bff; margin: 30px 0; letter-spacing: 8px; }
              .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef; }
              .expiry-note { color: #666; font-size: 14px; text-align: center; margin-top: 10px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1 style="color: #007bff; margin: 0; font-size: 28px;">Hospital Attendance System</h1>
              </div>
              <div class="content">
                  <p style="font-size: 16px; line-height: 1.5; color: #333;">Hello,</p>
                  <p style="font-size: 16px; line-height: 1.5; color: #333;">
                      You requested to reset your password for the Hospital Attendance System. 
                      Use the following One-Time Password (OTP) to verify your identity:
                  </p>
                  <div class="otp-code">${otp}</div>
                  <div class="expiry-note">This OTP will expire in 5 minutes.</div>
                  <p style="font-size: 14px; line-height: 1.5; color: #666;">
                      If you didn't request this password reset, please ignore this email. 
                      Your account security is important to us.
                  </p>
              </div>
              <div class="footer">
                  <p style="margin: 0; color: #666; font-size: 14px;">Hospital Attendance Management System</p>
                  <p style="margin: 5px 0 0; color: #999; font-size: 12px;">Secure • Reliable • Efficient</p>
                  <p style="margin: 10px 0 0; color: #999; font-size: 12px;">&copy; 2025 Hospital Attendance System. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    /*await mail.send(email, {
      subject: 'Password Reset OTP - Hospital Attendance System',
      message: htmlTemplate
    });*/

          await mail.send(email, {
        subject: 'Password Reset OTP',
        view: {
          path: './controllers/otp.html', // Optional: you can create a template file
          data: {
            otp: otp,
            app_name: 'Hospital Attendance',
            year: new Date().getFullYear()
          }
        },
        message: htmlTemplate // Fallback to direct HTML
      });


    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

  /**
   * Forgot Password - Send OTP
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }

      // Check if user exists
      const user = await prisma.admins.findUnique({
        where: { email: email }
      });

      if (!user) {
        // For security reasons, don't reveal if email exists or not
        return res.status(200).json({
          success: true,
          message: "If the email exists, an OTP has been sent"
        });
      }

      // Check if there's a recent OTP request (within 1 minute)
      const recentOTP = await prisma.password_reset_otps.findFirst({
        where: {
          email: email,
          created_at: {
            gte: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
          },
          used: false
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      if (recentOTP) {
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting another OTP"
        });
      }

      // Generate OTP and token
      const otp = this.generateOTP();
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Save OTP to database
      await prisma.password_reset_otps.create({
        data: {
          email: email,
          otp: otp,
          token: token,
          expires_at: expiresAt
        }
      });

      // Send OTP email
      const emailSent = await this.sendOTPEmail(email, otp);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email"
        });
      }

      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        token: token, // Send token for verification in next step
        expires_in: 300 // 5 minutes in seconds
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      response.error(error, res, next);
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(req, res, next) {
    try {
      const { token, otp } = req.body;

      if (!token || !otp) {
        return res.status(400).json({
          success: false,
          message: "Token and OTP are required"
        });
      }

      // Find valid OTP record
      const otpRecord = await prisma.password_reset_otps.findFirst({
        where: {
          token: token,
          otp: otp,
          used: false,
          expires_at: {
            gt: new Date() // Not expired
          }
        }
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP"
        });
      }

      // Mark OTP as used
      await prisma.password_reset_otps.update({
        where: { id: otpRecord.id },
        data: { used: true }
      });

      // Generate reset token (valid for 10 minutes)
      const resetToken = jwt.sign(
        { 
          email: otpRecord.email,
          purpose: 'password_reset'
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        reset_token: resetToken
      });

    } catch (error) {
      console.error('Verify OTP error:', error);
      response.error(error, res, next);
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is required"
        });
      }

      // Find the original OTP request
      const originalOTP = await prisma.password_reset_otps.findFirst({
        where: {
          token: token,
          created_at: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Within last 10 minutes
          }
        }
      });

      if (!originalOTP) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token"
        });
      }

      // Check if OTP was already used
      if (originalOTP.used) {
        return res.status(400).json({
          success: false,
          message: "OTP already used"
        });
      }

      // Check if we've resent recently (within 1 minute)
      const recentResend = await prisma.password_reset_otps.findFirst({
        where: {
          email: originalOTP.email,
          created_at: {
            gte: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      if (recentResend && recentResend.id !== originalOTP.id) {
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting another OTP"
        });
      }

      // Generate new OTP and token
      const newOTP = this.generateOTP();
      const newToken = this.generateToken();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Save new OTP to database
      await prisma.password_reset_otps.create({
        data: {
          email: originalOTP.email,
          otp: newOTP,
          token: newToken,
          expires_at: expiresAt
        }
      });

      // Send new OTP email
      const emailSent = await this.sendOTPEmail(originalOTP.email, newOTP);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email"
        });
      }

      res.status(200).json({
        success: true,
        message: "OTP resent successfully",
        token: newToken,
        expires_in: 300 // 5 minutes in seconds
      });

    } catch (error) {
      console.error('Resend OTP error:', error);
      response.error(error, res, next);
    }
  }

  /**
   * Reset Password
   */
  async resetPassword(req, res, next) {
    try {
      const { reset_token, new_password } = req.body;

      if (!reset_token || !new_password) {
        return res.status(400).json({
          success: false,
          message: "Reset token and new password are required"
        });
      }

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token"
        });
      }

      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({
          success: false,
          message: "Invalid token purpose"
        });
      }

      // Update password
      const updatedUser = await prisma.admins.update({
        where: { email: decoded.email },
        data: { 
          password: md5(new_password),
          updated_at: new Date()
        }
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Password reset successfully"
      });

    } catch (error) {
      console.error('Reset password error:', error);
      response.error(error, res, next);
    }
  }

  /**
   * Clean up expired OTPs (can be called via cron job)
   */
  async cleanupExpiredOTPs() {
    try {
      const result = await prisma.password_reset_otps.deleteMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { created_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Older than 24 hours
          ]
        }
      });
      
      console.log(`Cleaned up ${result.count} expired OTPs`);
      return result.count;
    } catch (error) {
      console.error('Cleanup OTPs error:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const authController = new AuthController();

// Export individual methods for convenience
export const forgotPassword = (req, res, next) => authController.forgotPassword(req, res, next);
export const verifyOTP = (req, res, next) => authController.verifyOTP(req, res, next);
export const resendOTP = (req, res, next) => authController.resendOTP(req, res, next);
export const resetPassword = (req, res, next) => authController.resetPassword(req, res, next);