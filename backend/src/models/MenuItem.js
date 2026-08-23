const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  icon: { type: String, default: '' },
  path: { type: String, default: '' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false },
  showInSidebar: { type: Boolean, default: true },
  permissions: [{ type: String }],
  roles: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);