import { useState } from 'react';

function AdvancedSearch({ onSearch, fields, placeholder, label }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const handleSearch = () => {
    onSearch({ searchTerm, ...filters });
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilters({});
    onSearch({});
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder={placeholder || 'جستجو...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            background: '#f8fafc',
            transition: 'all 0.3s ease'
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

        {/* فیلترهای پویا بر اساس ماژول */}
        {fields && fields.map((field) => (
          <select
            key={field.key}
            value={filters[field.key] || ''}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            style={{
              padding: '10px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              background: '#f8fafc',
              minWidth: '120px',
            }}
          >
            <option value="">{field.label}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ))}

        <button onClick={handleSearch} className="btn btn-primary" style={{ padding: '10px 24px' }}>
          🔍 جستجو
        </button>
        <button onClick={handleClear} className="btn btn-outline" style={{ padding: '10px 24px' }}>
          ✖ پاک کردن
        </button>
      </div>
    </div>
  );
}

export default AdvancedSearch;