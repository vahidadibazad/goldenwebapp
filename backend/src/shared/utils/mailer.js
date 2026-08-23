const nodemailer = require('nodemailer');

class Mailer {

  // =============================================
  // دریافت ترنسپورتر
  // =============================================
  static getTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  // =============================================
  // ارسال ایمیل
  // =============================================
  static async sendEmail(options) {
    const { to, subject, html, text, attachments = [], cc, bcc } = options;

    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: html || text || '',
        text: text || '',
        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
        attachments: attachments.map(att => ({
          filename: att.filename,
          path: att.path,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };

    } catch (error) {
      console.error('❌ خطا در ارسال ایمیل:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // =============================================
  // ارسال ایمیل تایید
  // =============================================
  static async sendVerificationEmail(email, name, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
      <div dir="rtl" style="font-family: Vazirmatn, Tahoma, sans-serif;">
        <h2>✅ تأیید ایمیل</h2>
        <p>سلام <strong>${name}</strong>،</p>
        <p>برای تکمیل ثبت‌نام خود، لطفاً روی دکمه زیر کلیک کنید:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #1677ff; color: white; text-decoration: none; border-radius: 8px;">
          تأیید ایمیل
        </a>
        <p>اگر روی دکمه کار نمی‌کند، لینک زیر را در مرورگر خود باز کنید:</p>
        <p style="color: #1677ff;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px;">⏰ این لینک تا ۲۴ ساعت معتبر است.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'تأیید ایمیل - سامانه مدیریت',
      html,
    });
  }

  // =============================================
  // ارسال ایمیل بازنشانی رمز
  // =============================================
  static async sendResetPasswordEmail(email, name, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <div dir="rtl" style="font-family: Vazirmatn, Tahoma, sans-serif;">
        <h2>🔑 بازنشانی رمز عبور</h2>
        <p>سلام <strong>${name}</strong>،</p>
        <p>درخواست بازنشانی رمز عبور برای حساب کاربری شما ثبت شده است.</p>
        <p>برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #ff4d4f; color: white; text-decoration: none; border-radius: 8px;">
          بازنشانی رمز عبور
        </a>
        <p>اگر روی دکمه کار نمی‌کند، لینک زیر را در مرورگر خود باز کنید:</p>
        <p style="color: #ff4d4f;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px;">⏰ این لینک تا ۱ ساعت معتبر است.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'بازنشانی رمز عبور - سامانه مدیریت',
      html,
    });
  }

  // =============================================
  // ارسال ایمیل اعلان
  // =============================================
  static async sendNotificationEmail(email, name, title, message, link = '') {
    const html = `
      <div dir="rtl" style="font-family: Vazirmatn, Tahoma, sans-serif;">
        <h3>${title}</h3>
        <p>سلام <strong>${name}</strong>،</p>
        <p>${message}</p>
        ${link ? `<a href="${link}" style="display: inline-block; padding: 10px 20px; background: #1677ff; color: white; text-decoration: none; border-radius: 8px;">مشاهده</a>` : ''}
        <p style="color: #999; font-size: 12px;">این ایمیل به صورت خودکار از سامانه مدیریت ارسال شده است.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: title,
      html,
    });
  }
}

module.exports = Mailer;