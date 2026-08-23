import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  message,
  Spin,
  App,
} from "antd";
import { SaveOutlined, RollbackOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const { Title } = Typography;
const { Option } = Select;

function HardwareForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    api
      .get("/categories/hardware")
      .then((res) => setCategories(res.data.data || []))
      .catch(() => message.error("خطا در دریافت دسته‌بندی‌ها"));

    api
      .get("/auth/users")
      .then((res) => setUsers(res.data.data || []))
      .catch(() => console.error("خطا در دریافت کاربران"));

    if (id) {
      setLoading(true);
      api
        .get(`/hardware/${id}`)
        .then((res) => {
          const data = res.data.data;
          form.setFieldsValue({
            name: data.name,
            category: data.category?._id || data.category,
            serialNumber: data.serialNumber,
            purchaseDate: data.purchaseDate,
            warrantyExpire: data.warrantyExpire,
            price: data.price,
            status: data.status || "in_stock",
            assignedTo: data.assignedTo?._id || data.assignedTo || null,
            description: data.description || "",
          });
        })
        .catch(() => message.error("خطا در دریافت اطلاعات"))
        .finally(() => setLoading(false));
    }
  }, [id, form, message]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (id) {
        await api.put(`/hardware/${id}`, values);
        message.success("سخت‌افزار با موفقیت ویرایش شد");
      } else {
        await api.post("/hardware", values);
        message.success("سخت‌افزار با موفقیت ثبت شد");
      }
      navigate("/hardware");
    } catch (error) {
      message.error(error.response?.data?.error || "خطا در ثبت");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>در حال بارگذاری...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: "var(--radius)" }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          {id ? "✏️ ویرایش سخت‌افزار" : "➕ ثبت سخت‌افزار جدید"}
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 8 : 16,
            }}
          >
            {/* ============================================= */}
            {/* ✅ اصلاح: نام دستگاه */}
            {/* ============================================= */}
            <Form.Item
              name="name"
              label="نام دستگاه"
              rules={[{ required: true, message: "نام دستگاه را وارد کنید" }]}
            >
              <Input
                placeholder="نام دستگاه"
                size={isMobile ? "small" : "middle"}
              />
            </Form.Item>

            {/* ============================================= */}
            {/* ✅ اصلاح: دسته‌بندی - با Option ساده */}
            {/* ============================================= */}
            <Form.Item
              name="category"
              label="دسته‌بندی"
              rules={[{ required: true, message: "دسته‌بندی را انتخاب کنید" }]}
            >
              <Select
                placeholder="انتخاب دسته‌بندی"
                size={isMobile ? "small" : "middle"}
                allowClear
              >
                {categories.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* ============================================= */}
          {/* ✅ اصلاح: شماره سریال */}
          {/* ============================================= */}
          <Form.Item
            name="serialNumber"
            label="شماره سریال"
            rules={[{ required: true, message: "شماره سریال را وارد کنید" }]}
          >
            <Input
              placeholder="شماره سریال"
              size={isMobile ? "small" : "middle"}
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 8 : 16,
            }}
          >
            {/* ============================================= */}
            {/* ✅ اصلاح: تاریخ خرید */}
            {/* ============================================= */}
            <Form.Item
              name="purchaseDate"
              label="تاریخ خرید"
              rules={[{ required: true, message: "تاریخ خرید را وارد کنید" }]}
              extra="فرمت: سال/ماه/روز"
            >
              <Input
                placeholder="مثال: 1403/05/01"
                size={isMobile ? "small" : "middle"}
              />
            </Form.Item>

            {/* ============================================= */}
            {/* ✅ اصلاح: تاریخ انقضای گارانتی */}
            {/* ============================================= */}
            <Form.Item
              name="warrantyExpire"
              label="تاریخ انقضای گارانتی"
              rules={[{ required: true, message: "تاریخ انقضا را وارد کنید" }]}
              extra="فرمت: سال/ماه/روز"
            >
              <Input
                placeholder="مثال: 1405/05/01"
                size={isMobile ? "small" : "middle"}
              />
            </Form.Item>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 8 : 16,
            }}
          >
            {/* ============================================= */}
            {/* ✅ اصلاح: قیمت */}
            {/* ============================================= */}
            <Form.Item
              name="price"
              label="قیمت (تومان)"
              rules={[{ required: true, message: "قیمت را وارد کنید" }]}
            >
              <Input
                type="number"
                placeholder="قیمت"
                size={isMobile ? "small" : "middle"}
              />
            </Form.Item>

            {/* ============================================= */}
            {/* ✅ اصلاح: وضعیت */}
            {/* ============================================= */}
            <Form.Item
              name="status"
              label="وضعیت"
              rules={[{ required: true, message: "وضعیت را انتخاب کنید" }]}
            >
              <Select
                placeholder="انتخاب وضعیت"
                size={isMobile ? "small" : "middle"}
              >
                <Option value="active">فعال</Option>
                <Option value="in_stock">در انبار</Option>
                <Option value="repair">در تعمیر</Option>
                <Option value="archived">بایگانی</Option>
                <Option value="disposed">اسقاط</Option>
              </Select>
            </Form.Item>
          </div>

          {/* ============================================= */}
          {/* ✅ اصلاح: تخصیص به کاربر */}
          {/* ============================================= */}
          <Form.Item name="assignedTo" label="تخصیص به کاربر">
            <Select
              placeholder="انتخاب کاربر (اختیاری)"
              size={isMobile ? "small" : "middle"}
              allowClear
            >
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea
              rows={3}
              placeholder="توضیحات اختیاری"
              size={isMobile ? "small" : "middle"}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                size={isMobile ? "small" : "middle"}
              >
                {id ? "ویرایش" : "ثبت"}
              </Button>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate("/hardware")}
                size={isMobile ? "small" : "middle"}
              >
                بازگشت
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default HardwareForm;