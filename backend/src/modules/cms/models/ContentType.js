// backend/src/modules/cms/models/ContentType.js
const mongoose = require('mongoose');

const ContentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'نام نوع محتوا الزامی است'],
      unique: true,
      trim: true,
    },
    apiName: {
      type: String,
      required: [true, 'نام API الزامی است'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    fields: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: [
            'string', 'number', 'boolean', 'date', 'datetime',
            'media', 'relation', 'json', 'rich_text', 'slug',
          ],
          required: true,
        },
        required: { type: Boolean, default: false },
        unique: { type: Boolean, default: false },
        options: { type: mongoose.Schema.Types.Mixed, default: {} },
        placeholder: { type: String, default: '' },
        helpText: { type: String, default: '' },
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// ایندکس‌ها
ContentTypeSchema.index({ apiName: 1 });
ContentTypeSchema.index({ isActive: 1 });

// متدهای استاتیک
ContentTypeSchema.statics.getSystemTypes = function() {
  return this.find({ isSystem: true, isActive: true }).sort({ name: 1 });
};

ContentTypeSchema.statics.getByApiName = function(apiName) {
  return this.findOne({ apiName, isActive: true });
};

module.exports = mongoose.models.ContentType || mongoose.model('ContentType', ContentTypeSchema);