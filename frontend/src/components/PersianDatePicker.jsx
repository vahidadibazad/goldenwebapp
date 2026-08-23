import React from 'react';

function PersianDatePicker({ value, onChange, placeholder, label }) {
  const handleChange = (e) => {
    // فقط اعداد و / را قبول کن
    const val = e.target.value;
    const cleaned = val.replace(/[^0-9/]/g, '');
    onChange(cleaned);
  };

  return (
    <div className="input-group">
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder || 'مثلاً 1403/05/01'}
        value={value || ''}
        onChange={handleChange}
        maxLength={10}
        className="persian-date-input"
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '2px solid #e2e8f0',
          borderRadius: '10px',
          fontSize: '14px',
          transition: 'all 0.3s ease',
          background: '#f8fafc',
          fontFamily: 'Vazirmatn, Tahoma, sans-serif',
          direction: 'ltr',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#2563eb';
          e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
          e.target.style.background = 'white';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e2e8f0';
          e.target.style.boxShadow = 'none';
          e.target.style.background = '#f8fafc';
        }}
      />
      <small style={{ display: 'block', color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
        📅 فرمت: سال/ماه/روز (مثال: 1403/05/01)
      </small>
    </div>
  );
}

export default PersianDatePicker;