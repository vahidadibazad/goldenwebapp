// src/components/signatures/SignaturePad.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Typography,
  Button,
  message,
  Spin,
  Space,
  Input,
  Row,
  Col,
  Divider,
  Tag,
  Alert,
  Steps,
  App,
  Modal,
  Upload,
  Avatar,
  Tooltip,
} from 'antd';
import {
  RollbackOutlined,
  CheckOutlined,
  CloseOutlined,
  UploadOutlined,
  CameraOutlined,
  QrcodeOutlined,
  SafetyOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import signatureService from '../../services/signatureService';
import letterService from '../../services/letterService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';
import LetterStatusBadge from '../letters/LetterStatusBadge';

const { Title, Text } = Typography;

// =============================================
// وضعیت‌های امضا
// =============================================
const STEPS = [
  { title: 'تایید هویت', description: 'ارسال و تایید OTP', icon: <SafetyOutlined /> },
  { title: 'امضای تصویری', description: 'آپلود یا رسم امضا', icon: <CameraOutlined /> },
  { title: 'تکمیل', description: 'امضا ثبت شد', icon: <CheckOutlined /> },
];

function SignaturePad() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState(null);
  const [letter, setLetter] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [countdown, setCountdown] = useState(0);
  const [signatureStatus, setSignatureStatus] = useState('pending');
  const canvasRef = useRef(null);

  // =============================================
  // دریافت اطلاعات
  // =============================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sigRes, letterRes] = await Promise.all([
        signatureService.getStatus(id),
        signatureService.getById(id).catch(() => ({ data: { data: null } })),
      ]);

      const sigData = sigRes.data.data;
      setSignature(sigData);
      setSignatureStatus(sigData.status);

      // دریافت نامه
      if (sigData.letter) {
        const letterData = await letterService.getById(sigData.letter);
        setLetter(letterData.data.data);
      }

      // تنظیم مرحله بر اساس وضعیت
      const status = sigData.status;
      if (status === 'signed' || status === 'verified') {
        setCurrentStep(2);
        setOtpVerified(true);
        setImageUploaded(true);
        if (sigData.imageSignature?.url) {
          setImageUrl(sigData.imageSignature.url);
        }
      } else if (status === 'otp_verified') {
        setCurrentStep(1);
        setOtpVerified(true);
        setOtpSent(true);
      } else if (status === 'otp_sent') {
        setCurrentStep(0);
        setOtpSent(true);
      }
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/signatures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // =============================================
  // تایمر شمارش معکوس
  // =============================================
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // =============================================
  // ارسال OTP
  // =============================================
  const handleSendOTP = async () => {
    setSubmitting(true);
    try {
      await signatureService.start(id);
      setOtpSent(true);
      setCountdown(120);
      setCurrentStep(0);
      message.success('کد تایید به شماره موبایل شما ارسال شد');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ارسال کد');
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // تایید OTP
  // =============================================
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      message.error('کد ۶ رقمی را وارد کنید');
      return;
    }
    setSubmitting(true);
    try {
      const res = await signatureService.verifyOTP(id, otpCode);
      setOtpVerified(true);
      setCurrentStep(1);
      message.success('کد با موفقیت تایید شد');

      // اگر نوع امضا فقط OTP است، امضا کامل می‌شود
      if (signature?.type === 'otp') {
        setCurrentStep(2);
        setSignatureStatus('signed');
        message.success('امضا با موفقیت تکمیل شد');
        setTimeout(() => navigate('/signatures'), 2000);
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'کد اشتباه است');
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // آپلود امضای تصویری
  // =============================================
  const handleImageUpload = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('لطفاً یک تصویر انتخاب کنید');
      return false;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setImageUrl(dataUrl);
      setImageUploaded(true);

      try {
        await signatureService.sign(id, { imageUrl: dataUrl });
        setCurrentStep(2);
        setSignatureStatus('signed');
        message.success('امضای تصویری با موفقیت آپلود شد');
        setTimeout(() => navigate('/signatures'), 2000);
      } catch (error) {
        message.error('خطا در آپلود امضا');
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  // =============================================
  // رسم امضا روی کانواس
  // =============================================
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setImageUrl('');
    setImageUploaded(false);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setImageUrl(dataUrl);
    setImageUploaded(true);
    signatureService.sign(id, { imageUrl: dataUrl });
    setCurrentStep(2);
    setSignatureStatus('signed');
    message.success('امضا با موفقیت ثبت شد');
  };

  // =============================================
  // تکمیل امضا
  // =============================================
  const handleCompleteSignature = async () => {
    setSubmitting(true);
    try {
      await signatureService.sign(id, { imageUrl });
      setCurrentStep(2);
      setSignatureStatus('signed');
      message.success('امضا با موفقیت تکمیل شد');
      setTimeout(() => navigate('/signatures'), 2000);
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در تکمیل امضا');
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // رد امضا
  // =============================================
  const handleReject = async () => {
    Modal.confirm({
      title: 'رد امضا',
      content: 'آیا از رد این امضا اطمینان دارید؟',
      okText: 'بله، رد کن',
      cancelText: 'انصراف',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSubmitting(true);
        try {
          await signatureService.reject(id, 'رد توسط کاربر');
          message.success('امضا با موفقیت رد شد');
          navigate('/signatures');
        } catch (error) {
          message.error('خطا در رد امضا');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // =============================================
  // بارگذاری
  // =============================================
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  if (!signature) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <Title level={4}>امضا یافت نشد</Title>
          <Button onClick={() => navigate('/signatures')}>بازگشت</Button>
        </div>
      </Card>
    );
  }

  const isCompleted = signatureStatus === 'signed' || signatureStatus === 'verified';
  const isRejected = signatureStatus === 'rejected';

  // =============================================
  // صفحه تکمیل شده
  // =============================================
  if (isCompleted) {
    return (
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <Title level={2}>امضا تکمیل شد</Title>
          <Text type="secondary">این امضا با موفقیت تکمیل شده است</Text>
          <br />
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/signatures')}
          >
            بازگشت
          </Button>
        </div>
      </Card>
    );
  }

  // =============================================
  // صفحه رد شده
  // =============================================
  if (isRejected) {
    return (
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <Title level={2}>امضا رد شد</Title>
          <Text type="secondary">این امضا توسط کاربر رد شده است</Text>
          <br />
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/signatures')}
          >
            بازگشت
          </Button>
        </div>
      </Card>
    );
  }

  // =============================================
  // پنل امضا
  // =============================================
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
          <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
            ✍️ پنل امضا
          </Title>
          <Button icon={<RollbackOutlined />} onClick={() => navigate('/signatures')}>
            بازگشت
          </Button>
        </div>

        {/* اطلاعات نامه */}
        {letter && (
          <Card
            size="small"
            style={{ marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}
          >
            <Row gutter={[16, 8]}>
              <Col xs={24} md={8}>
                <Text type="secondary">نامه:</Text>
                <div>
                  <strong>{letter.subject}</strong>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Text type="secondary">شماره:</Text>
                <div>{letter.number || '-'}</div>
              </Col>
              <Col xs={24} md={8}>
                <Text type="secondary">وضعیت نامه:</Text>
                <div>
                  <LetterStatusBadge status={letter.status} size="small" />
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* اطلاعیه */}
        <Alert
          message="امضای دیجیتال"
          description="لطفاً مراحل زیر را به ترتیب انجام دهید تا امضای خود را تکمیل کنید."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* مراحل */}
        <Steps
          current={currentStep}
          style={{ marginBottom: 24 }}
          size={isMobile ? 'small' : 'default'}
          items={STEPS.map((step, index) => ({
            title: step.title,
            description: step.description,
            icon: step.icon,
            status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait',
          }))}
        />

        {/* ============================================= */}
        {/* مرحله ۱: OTP */}
        {/* ============================================= */}
        <div style={{ marginBottom: 24 }}>
          <Card
            size="small"
            title="🔐 تایید هویت"
            style={{ background: 'var(--bg-secondary)', borderRadius: 12 }}
          >
            {!otpSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
                <Text>برای شروع امضا، کد تایید به شماره موبایل شما ارسال می‌شود.</Text>
                <br />
                <Button
                  type="primary"
                  onClick={handleSendOTP}
                  loading={submitting}
                  style={{ marginTop: 16 }}
                  icon={<SendOutlined />}
                >
                  ارسال کد تایید
                </Button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Input
                    placeholder="کد ۶ رقمی را وارد کنید"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    style={{ width: isPhone ? '100%' : 200 }}
                    size="large"
                    prefix={<SafetyOutlined />}
                  />
                  <Button
                    type="primary"
                    onClick={handleVerifyOTP}
                    loading={submitting}
                    disabled={!otpCode || otpCode.length !== 6}
                  >
                    تایید
                  </Button>
                  {countdown > 0 && (
                    <Tag color="processing" style={{ fontSize: 14 }}>
                      <ClockCircleOutlined /> {countdown} ثانیه
                    </Tag>
                  )}
                  {otpVerified && (
                    <Tag color="success" icon={<CheckOutlined />} style={{ fontSize: 14 }}>
                      تأیید شد
                    </Tag>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                  کد تایید به شماره موبایل شما ارسال شد. در صورت عدم دریافت، دوباره امتحان کنید.
                </Text>
              </div>
            )}
          </Card>
        </div>

        {/* ============================================= */}
        {/* مرحله ۲: امضای تصویری */}
        {/* ============================================= */}
        <div style={{ marginBottom: 24 }}>
          <Card
            size="small"
            title="🖼️ امضای تصویری"
            style={{ background: 'var(--bg-secondary)', borderRadius: 12 }}
          >
            {signature?.type === 'otp' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary">این امضا فقط با کد OTP انجام می‌شود.</Text>
                <br />
                {otpVerified && (
                  <Tag color="success" style={{ marginTop: 8 }}>
                    ✅ هویت تایید شد
                  </Tag>
                )}
              </div>
            ) : (
              <div>
                {!imageUploaded ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
                    <Text>امضای تصویری خود را آپلود کنید یا در بوم زیر رسم کنید.</Text>
                    <br />
                    <Space style={{ marginTop: 16 }} wrap>
                      <Upload
                        accept="image/*"
                        beforeUpload={handleImageUpload}
                        showUploadList={false}
                      >
                        <Button icon={<UploadOutlined />} size="large">
                          آپلود تصویر امضا
                        </Button>
                      </Upload>
                    </Space>

                    {/* کانواس برای رسم امضا */}
                    <div style={{ marginTop: 16 }}>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={150}
                        style={{
                          border: '2px solid var(--border-color)',
                          borderRadius: 8,
                          width: '100%',
                          maxWidth: 400,
                          background: 'white',
                          cursor: 'crosshair',
                          touchAction: 'none',
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <br />
                      <Space style={{ marginTop: 8 }}>
                        <Button size="small" onClick={clearCanvas}>
                          🗑️ پاک کردن
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          onClick={saveCanvas}
                          disabled={!isDrawing}
                        >
                          ✅ ثبت امضا
                        </Button>
                      </Space>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <Tag color="success" icon={<CheckOutlined />} style={{ fontSize: 14 }}>
                      امضا آپلود شد
                    </Tag>
                    <br />
                    <img
                      src={imageUrl}
                      alt="امضای کاربر"
                      style={{
                        maxWidth: 300,
                        maxHeight: 100,
                        marginTop: 8,
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ============================================= */}
        {/* دکمه‌های اقدام */}
        {/* ============================================= */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border-color)',
            paddingTop: 16,
          }}
        >
          {signature?.type === 'both' && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleCompleteSignature}
              loading={submitting}
              disabled={!otpVerified || !imageUploaded}
              size="large"
            >
              تکمیل امضا
            </Button>
          )}
          {signature?.type === 'otp' && otpVerified && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled
              size="large"
              style={{ background: COLORS.success }}
            >
              ✅ امضا تکمیل شد
            </Button>
          )}
          {signature?.type === 'image' && imageUploaded && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled
              size="large"
              style={{ background: COLORS.success }}
            >
              ✅ امضا تکمیل شد
            </Button>
          )}
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={handleReject}
            loading={submitting}
            size="large"
          >
            رد امضا
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default SignaturePad;