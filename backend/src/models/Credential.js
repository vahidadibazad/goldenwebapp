// backend/src/models/Credential.js
const mongoose = require('mongoose');
const EnumValue = require('./EnumValue');

const CredentialSchema = new mongoose.Schema({
  systemName: { type: String, required: true },
  hardware: { type: mongoose.Schema.Types.ObjectId, ref: 'Hardware', default: null },
  username: { type: String, required: true },
  password: { type: String, required: true },
  link: { type: String, default: '' },
  
  // =============================================
  // ✅ تغییر: accessLevel از EnumValue استفاده می‌کند
  // =============================================
  accessLevel: {
    type: String,
    ref: 'EnumValue',
    default: null,
  },
  
  description: { type: String, default: '' },
}, { timestamps: true });

// =============================================
// ✅ متدهای کمکی
// =============================================
CredentialSchema.methods.getAccessLevelLabel = async function() {
  if (!this.accessLevel) return null;
  const enumValue = await EnumValue.findOne({ 
    group: 'credential_level', 
    key: this.accessLevel 
  });
  return enumValue ? enumValue.label : this.accessLevel;
};

CredentialSchema.statics.getAccessLevelOptions = async function() {
  const enumValues = await EnumValue.find({ 
    group: 'credential_level', 
    isActive: true 
  }).sort({ order: 1 });
  return enumValues.map(ev => ({
    value: ev.key,
    label: ev.label,
    color: ev.color,
  }));
};

// =============================================
// ایندکس‌ها
// =============================================
CredentialSchema.index(
  { systemName: 'text', username: 'text', description: 'text' },
  {
    weights: {
      systemName: 10,
      username: 8,
      description: 3,
    },
    name: 'credential_text_index',
  }
);

module.exports = mongoose.models.Credential || mongoose.model('Credential', CredentialSchema);