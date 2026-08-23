const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  module: {
    type: String,
    enum: ['hardware', 'credential', 'document', 'ticket', 'user', 'category', 'audit', 'role', 'permission'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);