// src/services/index.js
export { default as api } from './api';
export { default as letterService } from './letterService';
export { default as signatureService } from './signatureService';
export { default as faxService } from './faxService';
export { default as emailService } from './emailService';
export { default as webhookService } from './webhookService';

// سرویس‌های قدیمی (برای سازگاری)
export { default as departmentService } from './letterApi';
export { default as letterApi } from './letterApi';