// frontend/src/pages/crm/LeadDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Typography,
  Descriptions,
  Spin,
  Button,
  Tag,
  message,
  Space,
  Row,
  Col,
  Divider,
  Avatar,
  App,
  Modal,
  Form,
  Select,
  Timeline,
} from 'antd';
import {
  RollbackOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  CheckOutlined,
  CloseOutlined,
  UserAddOutlined,
  MoreOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import crmService from '../../services/crmService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;

function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchData();
  }, [id]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت کاربران:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await crmService.getLeadById(id);
      setData(res.data.data);
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/crm/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'حذف سرنخ',
      content: 'آیا از حذف این سرنخ اطمینان دارید؟',
      okText: 'بله، حذف کن',
      cancelText: 'انصراف',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await crmService.deleteLead(id);
          message.success('سرنخ با موفقیت حذف شد');
          navigate('/crm/leads');
        } catch (error) {
          message.error('خطا در حذف');
        }
      },
    });
  };

  const handleConvert = () => {
    modal.confirm({
      title: 'تبدیل سرنخ به مشتری',
      content: 'آیا از تبدیل این سرنخ به مشتری اطمینان دارید؟',
      okText: 'بله، تبدیل کن',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          await crmService.convertLead(id, {
            name: data.company || `${data.firstName} ${data.lastName}`,
            industry: data.industry || 'سایر',
          });
          message.success('سرنخ با موفقیت به مشتری تبدیل شد');
          fetchData();
        } catch (error) {
          message.error('خطا در تبدیل سرنخ');
        }
      },
    });
  };

  const handleAssign = async (values) => {
    try {
      await crmService.assignLead(id, values.userId);
      message.success('سرنخ با موفقیت تخصیص داده شد');
      setAssignModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('خطا در تخصیص سرنخ');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
          <Title level={4}>سرنخ یافت نشد</Title>
          <Button onClick={() => navigate('/crm/leads')}>بازگشت</Button>
        </div>
      </Card>
    );
  }

  const statusInfo = {
    new: { color: 'blue', label: 'جدید' },
    contacted: { color: 'orange', label: 'تماس گرفته شده' },
    working: { color: 'purple', label: 'در حال پیگیری' },
    qualified: { color: 'green', label: 'واجد شرایط' },
    converted: { color: 'cyan', label: 'تبدیل شده' },
    lost: { color: 'red', label: 'از دست رفته' },
  };

  const ratingInfo = {
    hot: { color: 'red', label: '🔥 داغ' },
    warm: { color: 'orange', label: '🌤️ گرم' },
    cold: { color: 'blue', label: '❄️ سرد' },
  };

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* هدر */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              👤 {data.firstName} {data.lastName}
            </Title>
            <Space size="middle" style={{ marginTop: 4 }}>
              <Tag color={statusInfo[data.leadStatus]?.color || 'default'}>
                {statusInfo[data.leadStatus]?.label || data.leadStatus}
              </Tag>
              <Tag color={ratingInfo[data.rating]?.color || 'default'}>
                {ratingInfo[data.rating]?.label || data.rating}
              </Tag>
              {data.company && <Tag color="blue">{data.company}</Tag>}
            </Space>
          </div>
          <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/crm/leads')}>
              بازگشت
            </Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/crm/leads/edit/${id}`)}>
              ویرایش
            </Button>
            {data.leadStatus !== 'converted' && (
              <Button type="primary" icon={<CheckOutlined />} onClick={handleConvert}>
                تبدیل به مشتری
              </Button>
            )}
            <Button icon={<UserAddOutlined />} onClick={() => setAssignModalVisible(true)}>
              تخصیص
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              حذف
            </Button>
          </Space>
        </div>

        {/* اطلاعات اصلی */}
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle">
          <Descriptions.Item label="نام کامل">
            {data.firstName} {data.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="ایمیل">
            <MailOutlined /> {data.email}
          </Descriptions.Item>
          <Descriptions.Item label="تلفن">
            <PhoneOutlined /> {data.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="موبایل">
            <PhoneOutlined /> {data.mobile || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="شرکت">
            <BankOutlined /> {data.company || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="عنوان شغلی">
            {data.jobTitle || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="صنعت">{data.industry || '-'}</Descriptions.Item>
          <Descriptions.Item label="درآمد سالانه">
            {data.annualRevenue ? new Intl.NumberFormat('fa-IR').format(data.annualRevenue) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="تعداد کارمندان">
            {data.employeeCount || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="منبع سرنخ">
            {data.leadSource || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="تخصیص به">
            {data.assignedTo?.fullName || data.assignedTo?.username || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ ایجاد">
            {toPersianDate(data.createdAt)}
          </Descriptions.Item>
        </Descriptions>

        {/* توضیحات */}
        {data.description && (
          <>
            <Divider>📝 توضیحات</Divider>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {data.description}
            </div>
          </>
        )}

        {/* برچسب‌ها */}
        {data.tags && data.tags.length > 0 && (
          <>
            <Divider>🏷️ برچسب‌ها</Divider>
            <Space size={[4, 4]} wrap>
              {data.tags.map((tag, index) => (
                <Tag key={index} color="blue">{tag}</Tag>
              ))}
            </Space>
          </>
        )}

        {/* تاریخچه فعالیت‌ها */}
        <Divider>📋 تاریخچه فعالیت‌ها</Divider>
        <Timeline
          items={[
            {
              color: 'blue',
              children: (
                <div>
                  <Text strong>سرنخ ایجاد شد</Text>
                  <br />
                  <Text type="secondary">{toPersianDate(data.createdAt)}</Text>
                </div>
              ),
            },
            ...(data.assignedAt ? [{
              color: 'green',
              children: (
                <div>
                  <Text strong>تخصیص به {data.assignedTo?.fullName || data.assignedTo?.username}</Text>
                  <br />
                  <Text type="secondary">{toPersianDate(data.assignedAt)}</Text>
                </div>
              ),
            }] : []),
            ...(data.convertedAt ? [{
              color: 'gold',
              children: (
                <div>
                  <Text strong>✅ تبدیل به مشتری</Text>
                  <br />
                  <Text type="secondary">{toPersianDate(data.convertedAt)}</Text>
                </div>
              ),
            }] : []),
          ]}
        />
      </Card>

      {/* مودال تخصیص */}
      <Modal
        title="تخصیص سرنخ به کاربر"
        open={assignModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setAssignModalVisible(false);
          form.resetFields();
        }}
        okText="تخصیص"
        cancelText="انصراف"
      >
        <Form form={form} onFinish={handleAssign} layout="vertical">
          <Form.Item
            name="userId"
            label="کاربر"
            rules={[{ required: true, message: 'کاربر را انتخاب کنید' }]}
          >
            <Select placeholder="انتخاب کاربر" showSearch optionFilterProp="children">
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LeadDetail;


