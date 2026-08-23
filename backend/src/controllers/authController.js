// backend/src/controllers/authController.js
const AuthService = require('../services/authService');
const logAudit = require('../utils/auditLogger');
const logger = require('../utils/logger');

class AuthController {

  // =============================================
  // ثبت‌نام کاربر جدید
  // =============================================

  static async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      await logAudit(req, 'CREATE', 'USER', {
        userId: result.user.id,
        username: result.user.username,
      });
      res.status(201).json({
        success: true,
        data: result.user,
        message: result.message,
      });
    } catch (error) {
      logger.error('❌ خطا در ثبت‌نام:', error.message);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ورود کاربر
  // =============================================

  static async login(req, res) {
    try {
      const result = await AuthService.login(req.body);
      await logAudit(req, 'LOGIN', 'AUTH', {
        userId: result.user.id,
        username: result.user.username,
      });
      res.json({
        success: true,
        data: result,
        message: 'ورود با موفقیت انجام شد',
      });
    } catch (error) {
      logger.error('❌ خطا در ورود:', error.message);
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تأیید ایمیل
  // =============================================

  static async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'توکن تأیید ایمیل الزامی است',
        });
      }
      const result = await AuthService.verifyEmail(token);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('❌ خطا در تأیید ایمیل:', error.message);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ارسال مجدد ایمیل تأیید
  // =============================================

  static async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'ایمیل الزامی است',
        });
      }
      const result = await AuthService.resendVerificationEmail(email);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('❌ خطا در ارسال مجدد ایمیل تأیید:', error.message);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // درخواست بازنشانی رمز عبور
  // =============================================

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'ایمیل الزامی است',
        });
      }
      const result = await AuthService.forgotPassword(email);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('❌ خطا در درخواست بازنشانی رمز:', error.message);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // اجرای بازنشانی رمز عبور
  // =============================================

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'توکن و رمز عبور جدید الزامی است',
        });
      }
      const result = await AuthService.resetPassword(token, newPassword);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('❌ خطا در بازنشانی رمز:', error.message);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت پروفایل کاربر
  // =============================================

  static async getProfile(req, res) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('❌ خطا در دریافت پروفایل:', error.message);
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // به‌روزرسانی پروفایل
  // =============================================

  static async updateProfile(req, res) {
    try {
      const user = await AuthService.updateProfile(req.user.id, req.body);
      await logAudit(req, 'UPDATE', 'USER', {
        userId: user._id,
        username: user.username,
      });
      res.json({
        success: true,
        data: user,
        message: 'پروفایل با موفقیت به‌روزرسانی شد',
      });
    } catch (error) {
      logger.error('❌ خطا در به‌روزرسانی پروفایل:', error.message);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تغییر رمز عبور
  // =============================================

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'رمز عبور فعلی و جدید الزامی است',
        });
      }
      const result = await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );
      await logAudit(req, 'UPDATE', 'USER', {
        userId: req.user.id,
        username: req.user.username,
        action: 'change_password',
      });
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('❌ خطا در تغییر رمز عبور:', error.message);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // خروج از سیستم
  // =============================================

  static async logout(req, res) {
    try {
      const result = await AuthService.logout(req.user.id);
      await logAudit(req, 'LOGOUT', 'AUTH', {
        userId: req.user.id,
        username: req.user.username,
      });
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('❌ خطا در خروج:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;