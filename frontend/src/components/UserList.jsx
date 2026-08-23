import { useState, useEffect } from 'react';
import { Table, Button, Card, Input, Space, Tag, message, Popconfirm, Typography, Tooltip, Row, Col, Select, App, Switch, Avatar, Modal, Form } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, ReloadOutlined, UserOutlined, EditOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

function UserList() {
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت نقش‌ها:', error);
    }
  };

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await api.get(`/users?page=${page}&limit=${pageSize}`);
      setData(res.data.data || []);
      setPagination({ current: page, pageSize, total: res.data.total || 0 });
    } catch (error) {
      message.error('خطا در دریافت کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, [search]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('کاربر حذف شد');
      fetchData();
    } catch (error) {
      message.error('خطا در حذف');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, values);
        message.success('کاربر ویرایش شد');
      } else {
        await api.post('/users', values);
        message.success('کاربر ایجاد شد');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا');
    }
  };

  const columns = [
    { title: 'نام کامل', dataIndex: 'fullName', key: 'fullName' },
    { title: 'نام کاربری', dataIndex: 'username', key: 'username' },
    { title: 'ایمیل', dataIndex: 'email', key: 'email' },
    {
      title: 'نقش',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (role) => <Tag color="blue">{role || 'کاربر'}</Tag>,
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'فعال' : 'غیرفعال'}</Tag>,
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => { setEditingUser(record); form.setFieldsValue(record); setModalVisible(true); }} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>👥 مدیریت کاربران</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); form.resetFields(); setModalVisible(true); }}>
          کاربر جدید
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input placeholder="جستجو..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
          </Col>
          <Col xs={24} md={16}>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()} loading={loading}>بروزرسانی</Button>
          </Col>
        </Row>

        <Table columns={columns} dataSource={data} rowKey="_id" loading={loading} pagination={pagination} onChange={(p) => fetchData(p.current, p.pageSize)} />
      </Card>

      <Modal title={editingUser ? 'ویرایش کاربر' : 'کاربر جدید'} open={modalVisible} onOk={handleModalOk} onCancel={() => { setModalVisible(false); form.resetFields(); setEditingUser(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="نام کاربری" rules={[{ required: true }]}>
            <Input placeholder="نام کاربری" />
          </Form.Item>
          <Form.Item name="fullName" label="نام کامل" rules={[{ required: true }]}>
            <Input placeholder="نام کامل" />
          </Form.Item>
          <Form.Item name="email" label="ایمیل" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="ایمیل" />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="رمز عبور" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="حداقل ۶ کاراکتر" />
            </Form.Item>
          )}
          <Form.Item name="role" label="نقش">
            <Select placeholder="انتخاب نقش">
              {roles.map((r) => <Option key={r._id} value={r._id}>{r.label || r.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="فعال" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UserList;