// backend/src/controllers/digitalSignatureController.js
const DigitalSignatureService = require('../services/digitalSignatureService');

class DigitalSignatureController {

  // =============================================
  // ایجاد درخواست امضا
  // =============================================
  static async createRequest(req, res) {
    try {
      const { letterId, signerId, message, expiresAt } = req.body;

      if (!letterId || !signerId) {
        return res.status(400).json({
          success: false,
          error: 'شناسه نامه و امضاکننده الزامی است',
        });
      }

      const signature = await DigitalSignatureService.createSignatureRequest(
        letterId,
        signerId,
        req.user.id,
        { message, expiresAt }
      );

      res.status(201).json({
        success: true,
        data: signature,
        message: 'درخواست امضا با موفقیت ثبت شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد درخواست امضا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // شروع امضا (ارسال OTP)
  // =============================================
  static async startSignature(req, res) {
    try {
      const { id } = req.params;

      const signature = await DigitalSignatureService.startSignature(id, req.user.id);

      res.status(200).json({
        success: true,
        data: {
          id: signature._id,
          status: signature.status,
          otpSentAt: signature.otp.sentAt,
          expiresAt: signature.otp.expiresAt,
        },
        message: 'کد OTP با موفقیت ارسال شد',
      });
    } catch (error) {
      console.error('❌ خطا در شروع امضا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تأیید OTP
  // =============================================
  static async verifyOTP(req, res) {
    try {
      const { id } = req.params;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'کد OTP الزامی است',
        });
      }

      const signature = await DigitalSignatureService.verifyOTP(id, req.user.id, code);

      res.status(200).json({
        success: true,
        data: {
          id: signature._id,
          status: signature.status,
        },
        message: 'OTP با موفقیت تأیید شد',
      });
    } catch (error) {
      console.error('❌ خطا در تأیید OTP:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // امضای دیجیتال
  // =============================================
  static async sign(req, res) {
    try {
      const { id } = req.params;
      const { imageUrl, thumbnail, position, signatureData } = req.body;

      const result = await DigitalSignatureService.sign(
        id,
        req.user.id,
        {
          imageUrl,
          thumbnail,
          position,
          signatureData,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
          userAgent: req.headers['user-agent'] || '',
        }
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'امضا با موفقیت انجام شد',
      });
    } catch (error) {
      console.error('❌ خطا در امضا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تأیید امضا
  // =============================================
  static async verifySignature(req, res) {
    try {
      const { id } = req.params;

      const result = await DigitalSignatureService.verifySignature(id, req.user.id);

      res.status(200).json({
        success: true,
        data: result,
        message: result.result.valid ? 'امضا با موفقیت تأیید شد' : 'امضا معتبر نیست',
      });
    } catch (error) {
      console.error('❌ خطا در تأیید امضا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // رد امضا
  // =============================================
  static async rejectSignature(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const signature = await DigitalSignatureService.rejectSignature(id, req.user.id, reason);

      res.status(200).json({
        success: true,
        data: signature,
        message: 'امضا با موفقیت رد شد',
      });
    } catch (error) {
      console.error('❌ خطا در رد امضا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت وضعیت امضا
  // =============================================
  static async getStatus(req, res) {
    try {
      const { id } = req.params;

      const status = await DigitalSignatureService.getSignatureStatus(id);

      res.status(200).json({
        success: true,
        data: status,
        message: 'وضعیت امضا با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت وضعیت امضا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت امضاهای یک نامه
  // =============================================
  static async getLetterSignatures(req, res) {
    try {
      const { letterId } = req.params;

      const signatures = await DigitalSignatureService.getLetterSignatures(letterId);

      res.status(200).json({
        success: true,
        data: signatures,
        message: 'امضاهای نامه با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت امضاهای نامه:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت امضاهای در انتظار کاربر
  // =============================================
  static async getPending(req, res) {
    try {
      const signatures = await DigitalSignatureService.getPendingSignatures(req.user.id);

      res.status(200).json({
        success: true,
        data: signatures,
        message: 'امضاهای در انتظار با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت امضاهای در انتظار:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت امضاهای معتبر یک نامه
  // =============================================
  static async getValidSignatures(req, res) {
    try {
      const { letterId } = req.params;

      const signatures = await DigitalSignatureService.getValidSignatures(letterId);

      res.status(200).json({
        success: true,
        data: signatures,
        message: 'امضاهای معتبر با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت امضاهای معتبر:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = DigitalSignatureController;