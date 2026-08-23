import { useState, useEffect } from 'react';
import { Card, Table, Button, Input, ColorPicker, Popconfirm, Space, Typography, App, Form } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { COLORS } from '../styles/theme';

const { Title } = Typography;

function DepartmentManager() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // =============================================
  // ✅ استفاده از state ساده به جای useForm
  // =============================================
  const [formValues, setFormValues] = useState({
    id: '',
    label: '',
    color: '#1677ff',
  });

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch (error) {
      message.error('خطا در دریافت دپارتمان‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSave = async () => {
    try {
      // اعتبارسنجی ساده
      if (!formValues.label || formValues.label.trim() === '') {
        message.error('نام دپارتمان الزامی است');
        return;
      }

      let newDepartments = [...departments];
      
      if (editingId) {
        // ویرایش
        newDepartments = newDepartments.map(d => 
          d.id === editingId ? { ...d, ...formValues } : d
        );
      } else {
        // افزودن جدید
        const newId = formValues.id || formValues.label.replace(/\s/g, '');
        if (newDepartments.find(d => d.id === newId)) {
          message.error('این شناسه قبلاً وجود دارد');
          return;
        }
        newDepartments.push({ id: newId, ...formValues });
      }
      
      await api.put('/departments', { departments: newDepartments });
      message.success('دپارتمان‌ها با موفقیت ذخیره شدند');
      
      // reset فرم
      setEditingId(null);
      setFormValues({ id: '', label: '', color: '#1677ff' });
      fetchDepartments();
      
    } catch (error) {
      message.error('خطا در ذخیره دپارتمان‌ها');
    }
  };

  const handleDelete = async (id) => {
    if (id === 'All') {
      message.error('دپارتمان All قابل حذف نیست');
      return;
    }
    try {
      const newDepartments = departments.filter(d => d.id !== id);
      await api.put('/departments', { departments: newDepartments });
      message.success('دپارتمان با موفقیت حذف شد');
      fetchDepartments();
    } catch (error) {
      message.error('خطا در حذف دپارتمان');
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setFormValues({
      id: record.id,
      label: record.label,
      color: record.color || '#1677ff',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormValues({ id: '', label: '', color: '#1677ff' });
  };

  const columns = [
    { 
      title: 'شناسه', 
      dataIndex: 'id', 
      key: 'id',
      render: (id) => <code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>{id}</code>
    },
    { 
      title: 'نام', 
      dataIndex: 'label', 
      key: 'label',
      render: (text, record) => (
        <span>
          <span style={{ 
            display: 'inline-block', 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            background: record.color || '#1677ff',
            marginLeft: 8,
          }} />
          {text}
        </span>
      )
    },
    { 
      title: 'رنگ', 
      dataIndex: 'color', 
      key: 'color',
      render: (color) => (
        <div style={{ width: 30, height: 30, borderRadius: '8px', background: color || '#1677ff' }} />
      ),
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            disabled={record.id === 'All'}
          />
          <Popconfirm 
            title={`آیا از حذف دپارتمان "${record.label}" اطمینان دارید؟`} 
            onConfirm={() => handleDelete(record.id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button danger icon={<DeleteOutlined />} disabled={record.id === 'All'} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* ============================================= */}
        {/* ✅ فرم با state ساده (بدون useForm) */}
        {/* ============================================= */}
        <div 
          style={{ 
            marginBottom: 16, 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>شناسه</label>
            <Input 
              placeholder="مثلاً: IT" 
              disabled={!!editingId} 
              style={{ width: 120 }} 
              value={formValues.id}
              onChange={(e) => setFormValues({ ...formValues, id: e.target.value })}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>نام</label>
            <Input 
              placeholder="نام دپارتمان" 
              style={{ width: 150 }} 
              value={formValues.label}
              onChange={(e) => setFormValues({ ...formValues, label: e.target.value })}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>رنگ</label>
            <ColorPicker 
              value={formValues.color || '#1677ff'}
              onChange={(color) => setFormValues({ ...formValues, color: color.toHex() })}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Button 
              type="primary" 
              icon={editingId ? <SaveOutlined /> : <PlusOutlined />}
              onClick={handleSave}
            >
              {editingId ? 'ویرایش' : 'افزودن'}
            </Button>
            {editingId && (
              <Button onClick={handleCancel}>
                لغو
              </Button>
            )}
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={departments} 
          rowKey="id" 
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'هیچ دپارتمانی تعریف نشده است' }}
        />
      </Card>
    </div>
  );
}

export default DepartmentManager;