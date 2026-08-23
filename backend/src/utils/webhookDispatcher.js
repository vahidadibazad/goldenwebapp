// backend/src/utils/webhookDispatcher.js
const WebhookService = require('../services/webhookService');

/**
 * دیسپچر رویدادهای وب‌هوک
 * برای ارسال خودکار رویدادها به وب‌هوک‌های ثبت‌شده
 */
class WebhookDispatcher {

  // =============================================
  // نامه
  // =============================================
  static async letterCreated(letter) {
    await WebhookService.dispatchEvent('letter.created', {
      id: letter._id,
      number: letter.number,
      subject: letter.subject,
      letterType: letter.letterType,
      status: letter.status,
      registeredBy: letter.registeredBy,
      createdAt: letter.createdAt,
    });
  }

  static async letterUpdated(letter, changes) {
    await WebhookService.dispatchEvent('letter.updated', {
      id: letter._id,
      number: letter.number,
      subject: letter.subject,
      changes,
      updatedAt: letter.updatedAt,
    });
  }

  static async letterRegistered(letter) {
    await WebhookService.dispatchEvent('letter.registered', {
      id: letter._id,
      number: letter.number,
      subject: letter.subject,
      registeredBy: letter.registeredBy,
      registeredAt: new Date(),
    });
  }

  static async letterApproved(letter, approvedBy) {
    await WebhookService.dispatchEvent('letter.approved', {
      id: letter._id,
      number: letter.number,
      subject: letter.subject,
      approvedBy,
      approvedAt: new Date(),
    });
  }

  static async letterRejected(letter, rejectedBy, reason) {
    await WebhookService.dispatchEvent('letter.rejected', {
      id: letter._id,
      number: letter.number,
      subject: letter.subject,
      rejectedBy,
      reason,
      rejectedAt: new Date(),
    });
  }

  static async letterSigned(letter, signedBy) {
    await WebhookService.dispatchEvent('letter.signed', {
      id: letter._id,
      number: letter.number,
      subject: letter.subject,
      signedBy,
      signedAt: new Date(),
    });
  }

  static async letterArchived(letter, archivedBy) {
    await WebhookService.dispatchEvent('letter.archived', {
      id: letter._id,
      number: letter.number,
      subject: letter.subject,
      archivedBy,
      archivedAt: new Date(),
    });
  }

  // =============================================
  // ارجاع
  // =============================================
  static async referralCreated(referral) {
    await WebhookService.dispatchEvent('referral.created', {
      id: referral._id,
      letter: referral.letter,
      from: referral.from,
      to: referral.to,
      type: referral.type,
      dueDate: referral.dueDate,
      createdAt: referral.createdAt,
    });
  }

  static async referralActioned(referral, action) {
    await WebhookService.dispatchEvent('referral.actioned', {
      id: referral._id,
      letter: referral.letter,
      action,
      user: referral.to,
      comment: referral.comment,
      actionedAt: referral.actionedAt,
    });
  }

  // =============================================
  // امضا
  // =============================================
  static async signatureCreated(signature) {
    await WebhookService.dispatchEvent('signature.created', {
      id: signature._id,
      letter: signature.letter,
      signer: signature.signer,
      status: signature.status,
      createdAt: signature.createdAt,
    });
  }

  static async signatureVerified(signature, verifier) {
    await WebhookService.dispatchEvent('signature.verified', {
      id: signature._id,
      letter: signature.letter,
      signer: signature.signer,
      verifier,
      verifiedAt: new Date(),
      verificationCode: signature.verification?.verificationCode,
    });
  }

  // =============================================
  // فکس
  // =============================================
  static async faxReceived(fax) {
    await WebhookService.dispatchEvent('fax.received', {
      id: fax._id,
      faxNumber: fax.faxNumber,
      senderNumber: fax.senderNumber,
      letter: fax.letter,
      receivedAt: fax.receivedAt,
    });
  }

  static async faxSent(fax) {
    await WebhookService.dispatchEvent('fax.sent', {
      id: fax._id,
      faxNumber: fax.faxNumber,
      senderNumber: fax.senderNumber,
      letter: fax.letter,
      sentAt: fax.sentAt,
    });
  }

  // =============================================
  // ایمیل
  // =============================================
  static async emailReceived(email) {
    await WebhookService.dispatchEvent('email.received', {
      id: email._id,
      from: email.from,
      subject: email.subject,
      letter: email.letter,
      receivedAt: email.receivedAt,
    });
  }

  static async emailSent(email) {
    await WebhookService.dispatchEvent('email.sent', {
      id: email._id,
      to: email.to,
      subject: email.subject,
      letter: email.letter,
      sentAt: email.sentAt,
    });
  }

  // =============================================
  // گزارش
  // =============================================
  static async reportGenerated(report) {
    await WebhookService.dispatchEvent('report.generated', {
      id: report._id,
      name: report.name,
      type: report.type,
      generatedBy: report.generatedBy,
      generatedAt: report.generatedAt,
    });
  }

  // =============================================
  // سیستم
  // =============================================
  static async userCreated(user) {
    await WebhookService.dispatchEvent('user.created', {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    });
  }

  static async userUpdated(user, changes) {
    await WebhookService.dispatchEvent('user.updated', {
      id: user._id,
      username: user.username,
      changes,
      updatedAt: user.updatedAt,
    });
  }

  static async systemError(error) {
    await WebhookService.dispatchEvent('system.error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
    });
  }

  static async systemBackup(backupInfo) {
    await WebhookService.dispatchEvent('system.backup', {
      path: backupInfo.path,
      size: backupInfo.size,
      collections: backupInfo.collections,
      timestamp: backupInfo.timestamp,
    });
  }
}

module.exports = WebhookDispatcher;