// backend/src/services/authService.js
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('./emailService');
const { sendSMS } = require('./smsService');
const logger = require('../utils/logger');

class AuthService {

  // =============================================
  // ثبت‌نام کاربر جدید
  // =============================================

  static async register(userData) {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      bio,
      website,
    } = userData;

    // بررسی تکراری بودن
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      throw new Error('نام کاربری یا ایمیل قبلاً ثبت شده است');
    }

    // دریافت نقش پیش‌فرض (subscriber)
    const defaultRole = await Role.findOne({ name: 'user' });

    // ایجاد کاربر
    const user = new User({
      username,
      email,
      password,
      fullName,
      phone: phone || '',
      publicProfile: {
        bio: bio || '',
        website: website || '',
      },
      role: defaultRole?._id || null,
      status: 'pending',
      registeredAt: new Date(),
      isActive: true,
    });

    // تولید توکن تأیید ایمیل
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // ارسال ایمیل تأیید
    try {
      await this._sendVerificationEmail(user, verificationToken);
    } catch (error) {
      logger.error('❌ خطا در ارسال ایمیل تأیید:', error.message);
    }

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
      },
      message: 'ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را تأیید کنید.',
    };
  }

  // =============================================
  // ورود کاربر
  // =============================================

  static async login(credentials) {
    const { username, email, password } = credentials;

    // پیدا کردن کاربر
    const user = await User.findOne({
      $or: [{ username }, { email }],
    }).populate('role', 'name label permissions');

    if (!user) {
      throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }

    // بررسی فعال بودن
    if (!user.isActive) {
      throw new Error('حساب کاربری شما غیرفعال شده است');
    }

    // بررسی تأیید ایمیل
    if (!user.isEmailVerified) {
      throw new Error('لطفاً ابتدا ایمیل خود را تأیید کنید');
    }

    // بررسی رمز عبور
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }

    // به‌روزرسانی آخرین فعالیت
    await user.updateLogin();

    // تولید توکن
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role?.name || 'user',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        publicProfile: user.publicProfile,
        settings: user.settings,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
      },
    };
  }

  // =============================================
  // تأیید ایمیل
  // =============================================

  static async verifyEmail(token) {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error('توکن نامعتبر یا منقضی شده است');
    }

    await user.verifyEmail();

    return { message: 'ایمیل با موفقیت تأیید شد' };
  }

  // =============================================
  // ارسال مجدد ایمیل تأیید
  // =============================================

  static async resendVerificationEmail(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    if (user.isEmailVerified) {
      throw new Error('ایمیل قبلاً تأیید شده است');
    }

    const token = user.generateEmailVerificationToken();
    await user.save();

    try {
      await this._sendVerificationEmail(user, token);
    } catch (error) {
      logger.error('❌ خطا در ارسال ایمیل تأیید:', error.message);
      throw new Error('خطا در ارسال ایمیل');
    }

    return { message: 'ایمیل تأیید مجدداً ارسال شد' };
  }

  // =============================================
  // بازنشانی رمز عبور - درخواست
  // =============================================

  static async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('کاربری با این ایمیل یافت نشد');
    }

    const token = user.generateResetPasswordToken();
    await user.save();

    try {
      await this._sendResetPasswordEmail(user, token);
    } catch (error) {
      logger.error('❌ خطا در ارسال ایمیل بازنشانی:', error.message);
      throw new Error('خطا در ارسال ایمیل');
    }

    return { message: 'ایمیل بازنشانی رمز عبور ارسال شد' };
  }

  // =============================================
  // بازنشانی رمز عبور - اجرا
  // =============================================

  static async resetPassword(token, newPassword) {
    if (newPassword.length < 6) {
      throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد');
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error('توکن نامعتبر یا منقضی شده است');
    }

    user.password = newPassword;
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    await user.save();

    return { message: 'رمز عبور با موفقیت تغییر کرد' };
  }

  // =============================================
  // دریافت اطلاعات کاربر
  // =============================================

  static async getProfile(userId) {
    const user = await User.findById(userId)
      .select('-password -__v')
      .populate('role', 'name label description')
      .populate('extraPermissions', 'name label');

    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    return user;
  }

  // =============================================
  // به‌روزرسانی پروفایل
  // =============================================

  static async updateProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    const { fullName, phone, bio, website, socialMedia, settings } = data;

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (bio) user.publicProfile.bio = bio;
    if (website) user.publicProfile.website = website;
    if (socialMedia) {
      user.publicProfile.socialMedia = {
        ...user.publicProfile.socialMedia,
        ...socialMedia,
      };
    }
    if (settings) {
      user.settings = {
        ...user.settings,
        ...settings,
      };
    }

    await user.save();

    return user;
  }

  // =============================================
  // تغییر رمز عبور
  // =============================================

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('رمز عبور فعلی اشتباه است');
    }

    if (newPassword.length < 6) {
      throw new Error('رمز عبور جدید باید حداقل ۶ کاراکتر باشد');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'رمز عبور با موفقیت تغییر کرد' };
  }

  // =============================================
  // خروج از سیستم
  // =============================================

  static async logout(userId) {
    // در صورت استفاده از Redis یا Blacklist، توکن را غیرفعال کن
    return { message: 'خروج با موفقیت انجام شد' };
  }

  // =============================================
  // توابع خصوصی (ارسال ایمیل)
  // =============================================

  static async _sendVerificationEmail(user, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    
    const html = `
      <div dir="rtl" style="font-family: Vazirmatn, Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #1677ff; font-size: 24px; margin: 0;">✅ تأیید ایمیل</h1>
        </div>
        
        <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
            سلام <strong>${user.fullName || user.username}</strong>،
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
            برای تکمیل ثبت‌نام خود، لطفاً روی دکمه زیر کلیک کنید:
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 14px 32px; background: #1677ff; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              تأیید ایمیل
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            اگر روی دکمه کار نمی‌کند، لینک زیر را در مرورگر خود باز کنید:
          </p>
          <p style="color: #1677ff; font-size: 12px; word-break: break-all; background: #f0f5ff; padding: 8px 12px; border-radius: 4px;">
            ${verificationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 16px 0;" />
          
          <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
            ⏰ این لینک تا <strong>۲۴ ساعت</strong> معتبر است.
            <br />
            اگر ثبت‌نامی انجام نداده‌اید، این ایمیل را نادیده بگیرید.
          </p>
        </div>
        
        <div style="text-align: center; padding: 16px 0 0 0; color: #999; font-size: 12px;">
          سامانه مدیریت محتوا
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'تأیید ایمیل - سامانه مدیریت محتوا',
      html,
    });
  }

  static async _sendResetPasswordEmail(user, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    
    const html = `
      <div dir="rtl" style="font-family: Vazirmatn, Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #ff4d4f; font-size: 24px; margin: 0;">🔑 بازنشانی رمز عبور</h1>
        </div>
        
        <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
            سلام <strong>${user.fullName || user.username}</strong>،
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
            درخواست بازنشانی رمز عبور برای حساب کاربری شما ثبت شده است.
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
            برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 14px 32px; background: #ff4d4f; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              بازنشانی رمز عبور
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            اگر روی دکمه کار نمی‌کند، لینک زیر را در مرورگر خود باز کنید:
          </p>
          <p style="color: #ff4d4f; font-size: 12px; word-break: break-all; background: #fff1f0; padding: 8px 12px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 16px 0;" />
          
          <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
            ⏰ این لینک تا <strong>۱ ساعت</strong> معتبر است.
            <br />
            اگر درخواستی برای بازنشانی رمز عبور نداده‌اید، این ایمیل را نادیده بگیرید.
          </p>
        </div>
        
        <div style="text-align: center; padding: 16px 0 0 0; color: #999; font-size: 12px;">
          سامانه مدیریت محتوا
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'بازنشانی رمز عبور - سامانه مدیریت محتوا',
      html,
    });
  }
}

module.exports = AuthService;