// backend/src/controllers/letterStatusController.js
const LetterStatusService = require('../services/letterStatusService');
const Letter = require('../models/Letter');

/**
 * کنترلر مدیریت وضعیت‌های نامه
 */
class LetterStatusController {

  // =============================================
  // ثبت نامه
  // =============================================
  static async register(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      
      const result = await LetterStatusService.register(id, req.user.id, comment);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'نامه با موفقیت ثبت شد',
      });
    } catch (error) {
      console.error('❌ خطا در ثبت نامه:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ارسال برای پاراف
  // =============================================
  static async sendForReview(req, res) {
    try {
      const { id } = req.params;
      const { reviewerId, comment } = req.body;
      
      if (!reviewerId) {
        return res.status(400).json({
          success: false,
          error: 'شناسه پاراف‌کننده الزامی است',
        });
      }
      
      const result = await LetterStatusService.sendForReview(
        id,
        req.user.id,
        reviewerId,
        comment
      );
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'نامه برای پاراف ارسال شد',
      });
    } catch (error) {
      console.error('❌ خطا در ارسال برای پاراف:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تأیید پاراف
  // =============================================
  static async approveReview(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      
      const result = await LetterStatusService.approveReview(id, req.user.id, comment);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'پاراف با موفقیت تأیید شد',
      });
    } catch (error) {
      console.error('❌ خطا در تأیید پاراف:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // رد پاراف
  // =============================================
  static async rejectReview(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      
      const result = await LetterStatusService.rejectReview(id, req.user.id, comment);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'پاراف با موفقیت رد شد',
      });
    } catch (error) {
      console.error('❌ خطا در رد پاراف:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ارسال برای امضا
  // =============================================
  static async sendForSign(req, res) {
    try {
      const { id } = req.params;
      const { signerId, comment } = req.body;
      
      if (!signerId) {
        return res.status(400).json({
          success: false,
          error: 'شناسه امضاکننده الزامی است',
        });
      }
      
      const result = await LetterStatusService.sendForSign(
        id,
        req.user.id,
        signerId,
        comment
      );
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'نامه برای امضا ارسال شد',
      });
    } catch (error) {
      console.error('❌ خطا در ارسال برای امضا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تکمیل امضا
  // =============================================
  static async completeSign(req, res) {
    try {
      const { id } = req.params;
      const { signatureData, comment } = req.body;
      
      if (!signatureData) {
        return res.status(400).json({
          success: false,
          error: 'داده‌های امضا الزامی است',
        });
      }
      
      const result = await LetterStatusService.completeSign(
        id,
        req.user.id,
        signatureData,
        comment
      );
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'امضا با موفقیت تکمیل شد',
      });
    } catch (error) {
      console.error('❌ خطا در تکمیل امضا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // بایگانی نامه
  // =============================================
  static async archive(req, res) {
    try {
      const { id } = req.params;
      const { archiveType = 'active', comment } = req.body;
      
      const result = await LetterStatusService.archive(
        id,
        req.user.id,
        archiveType,
        comment
      );
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'نامه با موفقیت بایگانی شد',
      });
    } catch (error) {
      console.error('❌ خطا در بایگانی نامه:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // بازگشت به وضعیت قبلی
  // =============================================
  static async revert(req, res) {
    try {
      const { id } = req.params;
      const { targetStatus, comment } = req.body;
      
      if (!targetStatus) {
        return res.status(400).json({
          success: false,
          error: 'وضعیت هدف الزامی است',
        });
      }
      
      const result = await LetterStatusService.revert(
        id,
        req.user.id,
        targetStatus,
        comment
      );
      
      res.status(200).json({
        success: true,
        data: result,
        message: `نامه به وضعیت ${targetStatus} بازگشت`,
      });
    } catch (error) {
      console.error('❌ خطا در بازگشت به وضعیت قبلی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت کارتابل کاربر
  // =============================================
  static async getDashboard(req, res) {
    try {
      const dashboard = await LetterStatusService.getDashboard(req.user.id);
      
      res.status(200).json({
        success: true,
        data: dashboard,
        message: 'کارتابل با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت کارتابل:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت وضعیت جاری یک نامه
  // =============================================
  static async getStatus(req, res) {
    try {
      const { id } = req.params;
      const letter = await Letter.findById(id)
        .populate('sender', 'fullName username')
        .populate('receiver', 'fullName username')
        .populate('secretariat', 'name code')
        .populate('referrals', 'from to status type dueDate')
        .populate('signatures', 'signer signedAt status');

      if (!letter) {
        return res.status(404).json({
          success: false,
          error: 'نامه یافت نشد',
        });
      }

      // ساخت وضعیت کامل
      const statusInfo = {
        current: letter.status,
        label: letter.getStatusLabel(),
        color: letter.getStatusColor(),
        history: letter.trackingHistory || [],
        nextActions: this.getNextActions(letter),
        referrals: letter.referrals || [],
        signatures: letter.signatures || [],
      };

      res.status(200).json({
        success: true,
        data: {
          letter,
          status: statusInfo,
        },
        message: 'وضعیت نامه با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت وضعیت نامه:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // توابع کمکی
  // =============================================

  static getNextActions(letter) {
    const actions = [];
    
    switch (letter.status) {
      case 'draft':
        actions.push({ action: 'register', label: 'ثبت نامه', icon: '📝' });
        break;
      case 'registered':
        actions.push({ action: 'send_for_review', label: 'ارسال برای پاراف', icon: '📋' });
        break;
      case 'in_review':
        actions.push({ action: 'approve', label: 'تأیید', icon: '✅' });
        actions.push({ action: 'reject', label: 'رد', icon: '❌' });
        break;
      case 'approved':
        actions.push({ action: 'send_for_sign', label: 'ارسال برای امضا', icon: '✍️' });
        break;
      case 'signed':
        actions.push({ action: 'archive', label: 'بایگانی', icon: '📁' });
        break;
    }

    return actions;
  }
}

module.exports = LetterStatusController;