// backend/src/models/Department.js
const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه واحد
    // =============================================
    name: {
      type: String,
      required: [true, 'نام واحد الزامی است'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'کد واحد الزامی است'],
      trim: true,
      uppercase: true,
    },
    nameEn: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },

    // =============================================
    // ساختار سازمانی
    // =============================================
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
    },
    path: {
      type: String,
      default: '',
    },

    // =============================================
    // مدیریت واحد
    // =============================================
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deputy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // =============================================
    // تنظیمات واحد
    // =============================================
    color: {
      type: String,
      default: '#1677ff',
    },
    icon: {
      type: String,
      default: '🏢',
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // =============================================
    // تنظیمات گردش کار مختص واحد
    // =============================================
    defaultWorkflows: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workflow',
      },
    ],
    signingLimit: {
      type: Number,
      default: 0,
    },
    reminderSettings: {
      daysBefore: {
        type: [Number],
        default: [5, 3, 1, 0],
      },
      methods: {
        sms: { type: Boolean, default: false },
        email: { type: Boolean, default: false },
        system: { type: Boolean, default: true },
      },
    },

    // =============================================
    // اطلاعات آماری (به‌روزرسانی خودکار)
    // =============================================
    stats: {
      userCount: { type: Number, default: 0 },
      letterCount: { type: Number, default: 0 },
      pendingLetters: { type: Number, default: 0 },
      lastActivity: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =============================================
// ✅ ایندکس‌ها (بدون تکراری)
// =============================================
DepartmentSchema.index({ code: 1 }, { unique: true });
DepartmentSchema.index({ parent: 1, level: 1 });
DepartmentSchema.index({ path: 1 });
DepartmentSchema.index({ manager: 1 });
DepartmentSchema.index({ name: 'text', code: 'text', description: 'text' });

// =============================================
// ✅ ویرچوال‌ها (فیلدهای مجازی)
// =============================================
DepartmentSchema.virtual('children', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parent',
});

DepartmentSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'departmentId',
});

// =============================================
// ✅ میدلور (Middleware)
// =============================================
DepartmentSchema.pre('save', async function (next) {
  if (this.parent) {
    const parentDept = await mongoose.model('Department').findById(this.parent);
    if (parentDept) {
      this.level = parentDept.level + 1;
      this.path = parentDept.path ? `${parentDept.path}/${this._id}` : `${this._id}`;
    }
  } else {
    this.level = 0;
    this.path = `${this._id}`;
  }
  next();
});

DepartmentSchema.pre('remove', async function (next) {
  await mongoose.model('User').updateMany(
    { departmentId: this._id },
    { departmentId: null }
  );
  next();
});

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

DepartmentSchema.methods.getAllChildren = async function () {
  const children = await mongoose.model('Department').find({ parent: this._id });
  let allChildren = [...children];

  for (const child of children) {
    const grandChildren = await child.getAllChildren();
    allChildren = allChildren.concat(grandChildren);
  }

  return allChildren;
};

DepartmentSchema.methods.getTree = async function () {
  const children = await mongoose.model('Department').find({ parent: this._id });

  const tree = {
    ...this.toObject(),
    children: [],
  };

  for (const child of children) {
    const childTree = await child.getTree();
    tree.children.push(childTree);
  }

  return tree;
};

DepartmentSchema.methods.getStats = async function () {
  const User = mongoose.model('User');
  const Document = mongoose.model('Document');

  const [userCount, letterCount, pendingLetters] = await Promise.all([
    User.countDocuments({ departmentId: this._id, isActive: true }),
    Document.countDocuments({
      documentType: 'letter',
      $or: [{ senderDepartment: this._id }, { receiverDepartment: this._id }, { department: this._id }],
    }),
    Document.countDocuments({
      documentType: 'letter',
      workflowStatus: 'pending',
      $or: [{ senderDepartment: this._id }, { receiverDepartment: this._id }],
    }),
  ]);

  this.stats = { userCount, letterCount, pendingLetters, lastActivity: new Date() };
  await this.save();

  return this.stats;
};

// =============================================
// ✅ استاتیک‌ها (Static Methods)
// =============================================

DepartmentSchema.statics.getOrganizationTree = async function () {
  const roots = await this.find({ parent: null }).sort({ name: 1 });
  const tree = [];

  for (const root of roots) {
    const rootTree = await root.getTree();
    tree.push(rootTree);
  }

  return tree;
};

DepartmentSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

DepartmentSchema.statics.getByLevel = function (level) {
  return this.find({ level, isActive: true }).sort({ name: 1 });
};

DepartmentSchema.statics.getActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

DepartmentSchema.statics.getSubDepartments = function (parentId) {
  return this.find({ parent: parentId, isActive: true }).sort({ name: 1 });
};

DepartmentSchema.statics.search = function (query) {
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
  }).sort({ name: 1 });
};

// =============================================
// ✅ مدل نهایی
// =============================================
module.exports = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);