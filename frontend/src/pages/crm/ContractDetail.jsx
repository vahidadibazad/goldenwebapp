// frontend/src/pages/crm/ContractDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  App,
  Modal,
  Form,
  DatePicker,
  Input,
} from 'antd';
import {
  RollbackOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import crmService from '../../services/crmService';
import { toPersianDate } from '../../utils/dateHelper';
import { toPersianPrice } from '../../utils/numberHelper';
import { COLORS } from '../../styles/theme';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await crmService.getContractById(id);
      setData(res.data.data);
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/crm/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'حذف قرارداد',
      content: 'آیا از حذف این قرارداد اطمینان دارید؟',
      okText: 'بله، حذف کن',
      cancelText: 'انصراف',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await crmService.deleteContract(id);
          message.success('قرارداد با موفقیت حذف شد');
          navigate('/crm/contracts');
        } catch (error) {
          message.error('خطا در حذف');
        }
      },
    });
  };

  const handleActivate = () => {
    modal.confirm({
      title: 'فعال‌سازی قرارداد',
      content: 'آیا از فعال‌سازی این قرارداد اطمینان دارید؟',
      okText: 'بله، فعال کن',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          await crmService.activateContract(id);
          message.success('قرارداد با موفقیت فعال شد');
          fetchData();
        } catch (error) {
          message.error('خطا در فعال‌سازی');
        }
      },
    });
  };

  const handleCancel = () => {
    modal.confirm({
      title: 'لغو قرارداد',
      content: 'آیا از لغو این قرارداد اطمینان دارید؟',
      okText: 'بله، لغو کن',
      cancelText: 'انصراف',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await crmService.cancelContract(id, 'لغو توسط کاربر');
          message.success('قرارداد با موفقیت لغو شد');
          fetchData();
        } catch (error) {
          message.error('خطا در لغو قرارداد');
        }
      },
    });
  };

  const handleRenew = async (values) => {
    try {
      await crmService.renewContract(id, values.newEndDate.toISOString(), values.note);
      message.success('قرارداد با موفقیت تمدید شد');
      setRenewModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('خطا در تمدید قرارداد');
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <Title level={4}>قرارداد یافت نشد</Title>
          <Button onClick={() => navigate('/crm/contracts')}>بازگشت</Button>
        </div>
      </Card>
    );
  }

  const statusInfo = {
    draft: { color: 'default', label: 'پیش‌نویس' },
    active: { color: 'success', label: 'فعال' },
    expired: { color: 'error', label: 'منقضی' },
    cancelled: { color: 'default', label: 'لغو شده' },
    completed: { color: 'green', label: 'تکمیل شده' },
  };

  const canActivate = data.status === 'draft';
  const canCancel = data.status === 'active';
  const canRenew = data.status === 'active' || data.status === 'expired';

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
              📄 {data.name}
            </Title>
            <Space size="middle" style={{ marginTop: 4 }}>
              <Tag color="blue">{data.contractNumber}</Tag>
              <Tag color={statusInfo[data.status]?.color || 'default'}>
                {statusInfo[data.status]?.label || data.status}
              </Tag>
              <Tag color="purple">{data.account?.name}</Tag>
            </Space>
          </div>
          <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/crm/contracts')}>
              بازگشت
            </Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/crm/contracts/edit/${id}`)}>
              ویرایش
            </Button>
            {canActivate && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleActivate}>
                فعال‌سازی
              </Button>
            )}
            {canRenew && (
              <Button icon={<ReloadOutlined />} onClick={() => setRenewModalVisible(true)}>
                تمدید
              </Button>
            )}
            {canCancel && (
              <Button danger icon={<CloseCircleOutlined />} onClick={handleCancel}>
                لغو
              </Button>
            )}
            {(data.status === 'draft' || data.status === 'expired' || data.status === 'cancelled') && (
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                حذف
              </Button>
            )}
          </Space>
        </div>

        {/* اطلاعات اصلی */}
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle">
          <Descriptions.Item label="شماره قرارداد">
            <Tag color="blue">{data.contractNumber}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="شرکت">
            <BankOutlined /> {data.account?.name}
          </Descriptions.Item>
          <Descriptions.Item label="فرصت مرتبط">
            {data.opportunity?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="مبلغ">
            <DollarOutlined /> {toPersianPrice(data.value?.amount)} {data.value?.currency || 'IRR'}
          </Descriptions.Item>
          <Descriptions.Item label="شرایط پرداخت">
            {data.value?.paymentTerms === 'monthly' ? 'ماهانه' :
             data.value?.paymentTerms === 'quarterly' ? 'سه‌ماهه' :
             data.value?.paymentTerms === 'yearly' ? 'ساله' :
             data.value?.paymentTerms === 'one_time' ? 'یک‌باره' : data.value?.paymentTerms}
          </Descriptions.Item>
          <Descriptions.Item label="تمدید خودکار">
            <Tag color={data.autoRenew ? 'green' : 'default'}>
              {data.autoRenew ? '✅ فعال' : 'غیرفعال'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ شروع">
            <CalendarOutlined /> {toPersianDate(data.startDate)}
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ پایان">
            <CalendarOutlined /> {toPersianDate(data.endDate)}
          </Descriptions.Item>
          <Descriptions.Item label="روش صورتحساب">
            {data.billing?.method === 'invoice' ? 'فاکتور' :
             data.billing?.method === 'auto_pay' ? 'پرداخت خودکار' :
             data.billing?.method === 'manual' ? 'دستی' : data.billing?.method}
          </Descriptions.Item>
          <Descriptions.Item label="تناوب صورتحساب" span={2}>
            {data.billing?.frequency === 'monthly' ? 'ماهانه' :
             data.billing?.frequency === 'quarterly' ? 'سه‌ماهه' :
             data.billing?.frequency === 'yearly' ? 'ساله' : data.billing?.frequency}
          </Descriptions.Item>
          <Descriptions.Item label="مالک">
            {data.owner?.fullName || data.owner?.username || '-'}
          </Descriptions.Item>
        </Descriptions>

        {/* توضیحات و یادداشت‌ها */}
        {data.description && (
          <>
            <Divider>📝 توضیحات</Divider>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {data.description}
            </div>
          </>
        )}

        {data.notes && (
          <>
            <Divider>📋 یادداشت‌ها</Divider>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {data.notes}
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
      </Card>

      {/* مودال تمدید قرارداد */}
      <Modal
        title="تمدید قرارداد"
        open={renewModalVisible}
        onCancel={() => {
          setRenewModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="تمدید"
        cancelText="انصراف"
      >
        <Form form={form} onFinish={handleRenew} layout="vertical">
          <Form.Item
            name="newEndDate"
            label="تاریخ پایان جدید"
            rules={[{ required: true, message: 'تاریخ پایان جدید الزامی است' }]}
          >
            <DatePicker
              placeholder="انتخاب تاریخ"
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item name="note" label="توضیحات">
            <Input.TextArea rows={2} placeholder="توضیحات تمدید" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ContractDetail;


