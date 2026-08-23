// backend/src/models/Ticket.js
const mongoose = require('mongoose');
const EnumValue = require('./EnumValue');

const TicketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // =============================================
  // ✅ تغییر: status از EnumValue استفاده می‌کند
  // =============================================
  status: {
    type: String,
    ref: 'EnumValue',
    default: null,
  },
  
  // =============================================
  // ✅ تغییر: priority از EnumValue استفاده می‌کند
  // =============================================
  priority: {
    type: String,
    ref: 'EnumValue',
    default: null,
  },
  
  relatedHardware: { type: mongoose.Schema.Types.ObjectId, ref: 'Hardware', default: null },
  relatedDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// =============================================
// ✅ متدهای کمکی
// =============================================
TicketSchema.methods.getStatusLabel = async function() {
  if (!this.status) return null;
  const enumValue = await EnumValue.findOne({ 
    group: 'ticket_status', 
    key: this.status 
  });
  return enumValue ? enumValue.label : this.status;
};

TicketSchema.methods.getPriorityLabel = async function() {
  if (!this.priority) return null;
  const enumValue = await EnumValue.findOne({ 
    group: 'ticket_priority', 
    key: this.priority 
  });
  return enumValue ? enumValue.label : this.priority;
};

TicketSchema.statics.getStatusOptions = async function() {
  const enumValues = await EnumValue.find({ 
    group: 'ticket_status', 
    isActive: true 
  }).sort({ order: 1 });
  return enumValues.map(ev => ({
    value: ev.key,
    label: ev.label,
    color: ev.color,
  }));
};

TicketSchema.statics.getPriorityOptions = async function() {
  const enumValues = await EnumValue.find({ 
    group: 'ticket_priority', 
    isActive: true 
  }).sort({ order: 1 });
  return enumValues.map(ev => ({
    value: ev.key,
    label: ev.label,
    color: ev.color,
  }));
};

module.exports = mongoose.model('Ticket', TicketSchema);