// backend/src/services/emailService.js
const nodemailer = require('nodemailer');
const axios = require('axios');
const Letter = require('../models/Letter');
const Fax = require('../models/Fax');
const Notification = require('../models/Notification');
const { sendNotification } = require('../socket');

/**
 * سرویس اتصال به ایمیل
 * پشتیبانی از ارسال و دریافت ایمیل از طریق IMAP/SMTP
 */
class EmailService {

  // =============================================
  // ۱. تنظیمات ترنسپورتر
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
  // ۲. ارسال ایمیل
  // =============================================
  static async sendEmail(data) {
    const {
      to,
      subject,
      html,
      text,
      attachments = [],
      cc = [],
      bcc = [],
      letterId = null,
    } = data;

    try {
      const transporter = this.getTransporter();

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: html || text || '',
        text: text || '',
        cc: cc.length > 0 ? cc.join(', ') : undefined,
        bcc: bcc.length > 0 ? bcc.join(', ') : undefined,
        attachments: attachments.map(att => ({
          filename: att.filename,
          path: att.path,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await transporter.sendMail(mailOptions);

      // اگر نامه مرتبط است، به‌روزرسانی کن
      if (letterId) {
        const letter = await Letter.findById(letterId);
        if (letter) {
          if (!letter.metadata) letter.metadata = {};
          if (!letter.metadata.email) letter.metadata.email = [];
          letter.metadata.email.push({
            to,
            subject,
            sentAt: new Date(),
            messageId: info.messageId,
          });
          await letter.save();
        }
      }

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
  // ۳. دریافت ایمیل‌ها (از IMAP)
  // =============================================
  static async receiveEmails() {
    try {
      const imap = require('imap');
      const { simpleParser } = require('mailparser');

      const connection = new imap({
        user: process.env.IMAP_USER || process.env.SMTP_USER,
        password: process.env.IMAP_PASS || process.env.SMTP_PASS,
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      return new Promise((resolve, reject) => {
        connection.once('ready', () => {
          connection.openBox('INBOX', false, (err, box) => {
            if (err) {
              reject(err);
              return;
            }

            // دریافت ایمیل‌های خوانده‌نشده
            const searchCriteria = ['UNSEEN'];
            connection.search(searchCriteria, (err, results) => {
              if (err) {
                reject(err);
                return;
              }

              if (results.length === 0) {
                connection.end();
                resolve([]);
                return;
              }

              const emails = [];
              const fetch = connection.fetch(results, {
                bodies: '',
                struct: true,
              });

              fetch.on('message', (msg, seqno) => {
                let emailData = {};

                msg.on('body', (stream, info) => {
                  simpleParser(stream, (err, parsed) => {
                    if (err) {
                      console.error('❌ خطا در پردازش ایمیل:', err);
                      return;
                    }

                    emailData = {
                      from: parsed.from?.text || '',
                      subject: parsed.subject || '',
                      text: parsed.text || '',
                      html: parsed.html || '',
                      attachments: parsed.attachments || [],
                      date: parsed.date || new Date(),
                    };
                  });
                });

                msg.once('end', () => {
                  emails.push(emailData);
                });
              });

              fetch.once('error', (err) => {
                reject(err);
              });

              fetch.once('end', async () => {
                connection.end();

                // پردازش ایمیل‌های دریافت شده
                const processedEmails = [];
                for (const email of emails) {
                  const processed = await this._processReceivedEmail(email);
                  processedEmails.push(processed);
                }

                resolve(processedEmails);
              });
            });
          });
        });

        connection.once('error', (err) => {
          reject(err);
        });

        connection.connect();
      });

    } catch (error) {
      console.error('❌ خطا در دریافت ایمیل‌ها:', error);
      return [];
    }
  }

  // =============================================
  // ۴. پردازش ایمیل دریافتی
  // =============================================
  static async _processReceivedEmail(email) {
    try {
      // پیدا کردن کاربر بر اساس ایمیل
      const User = require('../models/User');
      const user = await User.findOne({
        email: email.from,
        isActive: true,
      });

      if (!user) {
        console.log(`⚠️ کاربر با ایمیل ${email.from} یافت نشد`);
        return { ...email, processed: false, reason: 'user_not_found' };
      }

      // ایجاد نامه جدید
      const letter = new Letter({
        subject: email.subject || 'ایمیل دریافتی',
        content: email.text || email.html || '',
        letterType: 'incoming',
        senderName: email.from,
        receiver: user._id,
        letterDate: new Date(),
        secretariat: user.secretariat || null,
        registeredBy: user._id,
        status: 'draft',
        metadata: {
          source: 'email',
          emailFrom: email.from,
          emailSubject: email.subject,
          receivedAt: new Date(),
        },
      });

      await letter.save();

      // اعلان به کاربر
      await this.sendNotification(user._id, {
        title: 'ایمیل جدید دریافت شد',
        message: `ایمیل با موضوع "${letter.subject}" از ${email.from} دریافت شد`,
        link: `/letters/${letter._id}`,
      });

      return {
        ...email,
        processed: true,
        letterId: letter._id,
        userId: user._id,
      };

    } catch (error) {
      console.error('❌ خطا در پردازش ایمیل:', error);
      return { ...email, processed: false, reason: 'error', error: error.message };
    }
  }

  // =============================================
  // ۵. ارسال نامه از طریق ایمیل
  // =============================================
  static async sendLetterByEmail(letterId, emailAddress, options = {}) {
    const letter = await Letter.findById(letterId)
      .populate('sender', 'fullName username')
      .populate('receiver', 'fullName username');

    if (!letter) throw new Error('نامه یافت نشد');

    // ساخت محتوای ایمیل
    const subject = `نامه ${letter.number || ''}: ${letter.subject}`;
    const html = `
      <div dir="rtl">
        <h2>${letter.subject}</h2>
        <p><strong>شماره نامه:</strong> ${letter.number || '---'}</p>
        <p><strong>تاریخ:</strong> ${new Date(letter.letterDate).toLocaleDateString('fa-IR')}</p>
        <p><strong>از:</strong> ${letter.sender?.fullName || letter.senderName || '---'}</p>
        <p><strong>به:</strong> ${letter.receiver?.fullName || letter.receiverName || '---'}</p>
        <hr/>
        <div>${letter.content || 'متن نامه'}</div>
        <hr/>
        <p>این نامه به صورت خودکار از سامانه مدیریت مکاتبات ارسال شده است.</p>
      </div>
    `;

    // دریافت پیوست‌ها
    const Attachment = require('../models/Attachment');
    const attachments = await Attachment.find({ letters: letterId });

    const attachmentList = attachments.map(att => ({
      filename: att.fileName,
      path: att.filePath,
    }));

    // ارسال ایمیل
    const result = await this.sendEmail({
      to: emailAddress,
      subject,
      html,
      attachments: attachmentList,
      letterId,
      ...options,
    });

    // به‌روزرسانی نامه
    if (result.success) {
      if (!letter.metadata) letter.metadata = {};
      if (!letter.metadata.sentEmails) letter.metadata.sentEmails = [];
      letter.metadata.sentEmails.push({
        to: emailAddress,
        sentAt: new Date(),
        messageId: result.messageId,
      });
      await letter.save();
    }

    return result;
  }

  // =============================================
  // ۶. دریافت وضعیت ایمیل
  // =============================================
  static async getEmailStatus(letterId) {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    const emailHistory = letter.metadata?.sentEmails || [];
    const faxHistory = letter.metadata?.fax || [];

    return {
      emails: emailHistory,
      faxes: faxHistory,
      totalEmails: emailHistory.length,
      totalFaxes: faxHistory.length,
    };
  }

  // =============================================
  // ۷. توابع کمکی
  // =============================================
  static async sendNotification(userId, data) {
    try {
      await Notification.create({
        user: userId,
        type: 'email',
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
      });

      sendNotification(userId, {
        type: 'email',
        title: data.title,
        message: data.message,
        link: data.link,
      });
    } catch (error) {
      console.error('❌ خطا در ارسال اعلان:', error);
    }
  }
}

module.exports = EmailService;