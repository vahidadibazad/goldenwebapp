import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Tooltip,
  Row,
  Col,
  Select,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
  LockOutlined,
  UserOutlined,
  FilterOutlined,
  ClearOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toPersianDate } from "../utils/dateHelper";
import { COLORS } from "../styles/theme";

const { Title, Text } = Typography;
const { Option } = Select;

function CredentialList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({ accessLevel: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // =============================================
  // ✅ دریافت سطوح دسترسی از دیتابیس
  // =============================================
  const [accessLevelOptions, setAccessLevelOptions] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAccessLevelOptions = async () => {
    try {
      const res = await api.get('/enums/credential_level');
      setAccessLevelOptions(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت سطوح دسترسی:', error);
    }
  };

  useEffect(() => {
    fetchAccessLevelOptions();
  }, []);

  const getAccessLevelInfo = (levelKey) => {
    const found = accessLevelOptions.find(item => item.key === levelKey);
    if (found) {
      return {
        color: found.color || COLORS.gray[500],
        label: found.label || levelKey,
        icon: found.icon || '🔐',
      };
    }
    return {
      color: COLORS.gray[500],
      label: levelKey || 'همه',
      icon: '🔐',
    };
  };

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.accessLevel) params.append("accessLevel", filters.accessLevel);
      params.append("page", page);
      params.append("limit", pageSize);
      const res = await api.get(`/credentials?${params.toString()}`);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.total || res.data.data?.length || 0,
      });
    } catch (error) {
      message.error("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filters]);

  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/credentials/${id}`);
      message.success("رمز با موفقیت حذف شد");
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("خطا در حذف");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.delete(`/credentials/${id}`))
      );
      message.success(`${selectedRowKeys.length} آیتم با موفقیت حذف شد`);
      setSelectedRowKeys([]);
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("خطا در حذف");
    }
  };

  const clearFilters = () => {
    setFilters({ accessLevel: "" });
    setSearch("");
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const columns = [
    {
      title: "سیستم",
      dataIndex: "systemName",
      key: "systemName",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: COLORS.warning,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
            }}
          >
            <KeyOutlined />
          </div>
          <div>
            <strong
              style={{
                fontSize: isPhone ? "13px" : "14px",
                color: "var(--text-primary)",
              }}
            >
              {text}
            </strong>
            {record.description && !isPhone && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {record.description}
              </div>
            )}
          </div>
        </div>
      ),
      sorter: (a, b) => a.systemName.localeCompare(b.systemName),
    },
    {
      title: "نام کاربری",
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: isPhone ? "10px" : "13px" }}>
          <UserOutlined style={{ color: "var(--text-muted)" }} />
          <span style={{ fontFamily: "monospace" }}>{text}</span>
        </span>
      ),
    },
    {
      title: "رمز عبور",
      dataIndex: "password",
      key: "password",
      render: (password, record) => (
        <Space size={isPhone ? 2 : 4}>
          <span
            style={{
              fontFamily: "monospace",
              direction: "ltr",
              background: "var(--bg-secondary)",
              padding: "2px 10px",
              borderRadius: "4px",
              fontSize: isPhone ? "11px" : "13px",
            }}
          >
            {visiblePasswords[record._id] ? password : "••••••••"}
          </span>
          <Button
            type="text"
            icon={
              visiblePasswords[record._id] ? (
                <EyeInvisibleOutlined />
              ) : (
                <EyeOutlined />
              )
            }
            onClick={() => togglePasswordVisibility(record._id)}
            size="small"
            style={{ color: COLORS.primary }}
          />
        </Space>
      ),
    },
    {
      title: "سطح دسترسی",
      dataIndex: "accessLevel",
      key: "accessLevel",
      render: (level) => {
        const info = getAccessLevelInfo(level);
        return (
          <Tag
            color={info.color}
            style={{
              padding: isPhone ? "2px 8px" : "4px 12px",
              borderRadius: "20px",
              fontSize: isPhone ? "10px" : "13px",
            }}
          >
            {info.icon} {info.label}
          </Tag>
        );
      },
      filters: accessLevelOptions.map(opt => ({ text: opt.label, value: opt.key })),
      onFilter: (value, record) => record.accessLevel === value,
    },
    {
      title: "سخت‌افزار مرتبط",
      dataIndex: "hardware",
      key: "hardware",
      className: isPhone ? "hide-mobile" : "",
      render: (hardware) => {
        if (!hardware) return <span style={{ color: "var(--text-muted)" }}>—</span>;
        const hardwareName = typeof hardware === 'object' ? hardware.name : hardware;
        return (
          <Tag color="blue" style={{ borderRadius: "6px", fontSize: isPhone ? "10px" : "13px" }}>
            {hardwareName}
          </Tag>
        );
      },
    },
    {
      title: "تاریخ ثبت",
      dataIndex: "createdAt",
      key: "createdAt",
      className: isPhone ? "hide-mobile" : "",
      render: (date) => (
        <span
          style={{
            direction: "ltr",
            display: "inline-block",
            fontFamily: "monospace",
            fontSize: isPhone ? "10px" : "13px",
          }}
        >
          {toPersianDate(date)}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "عملیات",
      key: "action",
      fixed: "right",
      width: isPhone ? 70 : isMobile ? 80 : 140,
      render: (_, record) => (
        <Space size={isPhone ? 2 : 4}>
          <Tooltip title="مشاهده" placement="top">
            <Link to={`/credentials/${record._id}`}>
              <Button
                type="text"
                icon={<EyeOutlined />}
                size={isPhone ? "small" : "middle"}
                style={{ color: COLORS.primary }}
                className="action-btn"
              />
            </Link>
          </Tooltip>
          <Tooltip title="ویرایش" placement="top">
            <Link to={`/credentials/edit/${record._id}`}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size={isPhone ? "small" : "middle"}
                style={{ color: COLORS.warning }}
                className="action-btn"
              />
            </Link>
          </Tooltip>
          <Tooltip title="حذف" placement="top">
            <Popconfirm
              title="آیا از حذف این رمز اطمینان دارید؟"
              onConfirm={() => handleDelete(record._id)}
              okText="بله"
              cancelText="خیر"
              placement="left"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size={isPhone ? "small" : "middle"}
                style={{ color: COLORS.danger }}
                className="action-btn"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
    selections: !isPhone
      ? [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE]
      : undefined,
  };

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <Title
            level={isPhone ? 4 : isMobile ? 3 : 2}
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: isPhone ? "6px" : "12px",
            }}
          >
            🔐 مدیریت رمزها
            <Tag
              color="orange"
              style={{
                fontSize: isPhone ? "10px" : isMobile ? "12px" : "14px",
                padding: isPhone ? "0 6px" : "2px 8px",
              }}
            >
              {data.length}
            </Tag>
          </Title>
        </div>
        <Space wrap size={[4, 4]}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={loading}
            size={isPhone ? "small" : isMobile ? "middle" : "middle"}
          >
            {!isPhone && "بروزرسانی"}
          </Button>
          <Link to="/credentials/new">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size={isPhone ? "small" : isMobile ? "middle" : "large"}
            >
              {isPhone ? "جدید" : isMobile ? "افزودن" : "ثبت رمز جدید"}
            </Button>
          </Link>
        </Space>
      </div>

      <Card
        style={{
          borderRadius: "var(--radius)",
          padding: isPhone ? "2px 0" : "4px 0",
        }}
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 12, padding: "0 4px" }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder={
                isPhone ? "🔍 جستجو..." : "🔍 جستجو بر اساس نام سیستم..."
              }
              prefix={
                <SearchOutlined
                  style={{
                    color: "var(--text-muted)",
                    fontSize: isPhone ? "12px" : "14px",
                  }}
                />
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size={isPhone ? "small" : isMobile ? "middle" : "large"}
              allowClear
              style={{ borderRadius: "10px" }}
            />
          </Col>
          <Col xs={24} md={12} lg={16}>
            <Space wrap style={{ gap: "4px" }}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? "primary" : "default"}
                size={isPhone ? "small" : isMobile ? "middle" : "middle"}
              >
                {!isPhone && "فیلترها"}
              </Button>
              {selectedRowKeys.length > 0 && !isPhone && (
                <Popconfirm
                  title={`حذف ${selectedRowKeys.length} آیتم؟`}
                  onConfirm={handleBulkDelete}
                  okText="بله"
                  cancelText="خیر"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size={isMobile ? "small" : "middle"}
                  >
                    {isMobile
                      ? `(${selectedRowKeys.length})`
                      : `حذف انتخاب‌شده‌ها (${selectedRowKeys.length})`}
                  </Button>
                </Popconfirm>
              )}
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                size={isPhone ? "small" : isMobile ? "middle" : "middle"}
              >
                {!isPhone && "پاک کردن"}
              </Button>
            </Space>
          </Col>
        </Row>

        {showFilters && (
          <div
            style={{
              padding: isPhone ? "8px" : "12px",
              background: "var(--bg-secondary)",
              borderRadius: "10px",
              marginBottom: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              alignItems: "center",
            }}
          >
            <Text strong style={{ fontSize: isPhone ? "11px" : "13px" }}>
              فیلتر:
            </Text>
            <Select
              value={filters.accessLevel}
              onChange={(value) => setFilters({ ...filters, accessLevel: value })}
              placeholder="سطح دسترسی"
              style={{ width: isPhone ? "90px" : isMobile ? "110px" : "150px" }}
              allowClear
              size={isPhone ? "small" : "middle"}
            >
              {accessLevelOptions.map(opt => (
                <Option key={opt.key} value={opt.key}>
                  {opt.icon} {opt.label}
                </Option>
              ))}
            </Select>
            {filters.accessLevel && (
              <Button
                size="small"
                onClick={() => setFilters({ accessLevel: "" })}
                type="text"
                style={{
                  color: COLORS.danger,
                  fontSize: isPhone ? "10px" : "12px",
                }}
              >
                ✖
              </Button>
            )}
          </div>
        )}

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          rowSelection={rowSelection}
          className="custom-table"
          pagination={{
            ...pagination,
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => isPhone ? `${total}` : `تعداد ${total} آیتم`,
            pageSizeOptions: ["10", "20", "50", "100"],
            placement: "bottom",
            style: { marginTop: 12 },
            size: isPhone ? "small" : "default",
            itemRender: (current, type, originalElement) => {
              if (type === "prev")
                return <Button size={isPhone ? "small" : "middle"}>‹</Button>;
              if (type === "next")
                return <Button size={isPhone ? "small" : "middle"}>›</Button>;
              return originalElement;
            },
          }}
          onChange={handleTableChange}
          scroll={{ x: isPhone ? 320 : isMobile ? 500 : 1000 }}
          style={{ borderRadius: "var(--radius)" }}
          size={isPhone ? "small" : "middle"}
          locale={{
            emptyText: (
              <div style={{ padding: isPhone ? "30px 0" : "60px 0" }}>
                <div
                  style={{
                    fontSize: isPhone ? "32px" : "64px",
                    marginBottom: "8px",
                  }}
                >
                  🔐
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: isPhone ? "13px" : "16px" }}
                >
                  هیچ رمز عبوری ثبت نشده است
                </Text>
                <br />
                <Link to="/credentials/new">
                  <Button
                    type="primary"
                    style={{ marginTop: isPhone ? "12px" : "20px" }}
                    icon={<PlusOutlined />}
                    size={isPhone ? "small" : "large"}
                  >
                    {isPhone ? "اولین رمز" : "ثبت اولین رمز"}
                  </Button>
                </Link>
              </div>
            ),
          }}
        />
      </Card>

      <style>{`
        .action-btn { transition: all 0.3s ease !important; border-radius: 8px !important; }
        .action-btn:hover { transform: scale(1.15) !important; background: var(--bg-secondary) !important; }
        .ant-table-cell { vertical-align: middle !important; }
        @media (max-width: 768px) { .ant-table { font-size: 12px !important; } .ant-table-thead > tr > th, .ant-table-tbody > tr > td { padding: 6px 8px !important; } }
        @media (max-width: 480px) { .ant-table { font-size: 11px !important; } .ant-table-thead > tr > th, .ant-table-tbody > tr > td { padding: 4px 6px !important; } .ant-pagination-item { min-width: 24px !important; height: 24px !important; line-height: 22px !important; font-size: 11px !important; } .ant-pagination-prev .ant-pagination-item-link, .ant-pagination-next .ant-pagination-item-link { font-size: 11px !important; padding: 0 4px !important; } }
      `}</style>
    </div>
  );
}

export default CredentialList;