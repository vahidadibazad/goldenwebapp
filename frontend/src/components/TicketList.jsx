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
  Badge,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
  UserOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toPersianDate } from "../utils/dateHelper";
import { COLORS } from "../styles/theme";

const { Title, Text } = Typography;
const { Option } = Select;

function TicketList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // =============================================
  // ✅ دریافت EnumValueها از دیتابیس
  // =============================================
  const [statusOptions, setStatusOptions] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // =============================================
  // ✅ دریافت EnumValueها
  // =============================================
  const fetchEnumOptions = async () => {
    try {
      const [statusRes, priorityRes] = await Promise.all([
        api.get('/enums/ticket_status'),
        api.get('/enums/ticket_priority'),
      ]);
      setStatusOptions(statusRes.data.data || []);
      setPriorityOptions(priorityRes.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت Enumها:', error);
    }
  };

  useEffect(() => {
    fetchEnumOptions();
  }, []);

  // =============================================
  // ✅ توابع کمکی
  // =============================================
  const getStatusInfo = (statusKey) => {
    const found = statusOptions.find(item => item.key === statusKey);
    if (found) {
      return {
        color: found.color || COLORS.gray[500],
        label: found.label || statusKey || 'باز',
        icon: found.icon || '📌',
      };
    }
    return { color: COLORS.gray[500], label: statusKey || 'باز', icon: '📌' };
  };

  const getPriorityInfo = (priorityKey) => {
    const found = priorityOptions.find(item => item.key === priorityKey);
    if (found) {
      return {
        color: found.color || COLORS.gray[500],
        label: found.label || priorityKey || 'متوسط',
        icon: found.icon || '📌',
      };
    }
    return { color: COLORS.gray[500], label: priorityKey || 'متوسط', icon: '📌' };
  };

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);
      params.append("page", page);
      params.append("limit", pageSize);
      const res = await api.get(`/tickets?${params.toString()}`);
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
      await api.delete(`/tickets/${id}`);
      message.success("تیکت با موفقیت حذف شد");
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("خطا در حذف");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.delete(`/tickets/${id}`))
      );
      message.success(`${selectedRowKeys.length} آیتم با موفقیت حذف شد`);
      setSelectedRowKeys([]);
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("خطا در حذف");
    }
  };

  const clearFilters = () => {
    setFilters({ status: "", priority: "" });
    setSearch("");
  };

  const columns = [
    {
      title: "عنوان",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background:
                getPriorityInfo(record.priority).color || COLORS.gray[400],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
            }}
          >
            <FlagOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                fontSize: isPhone ? "13px" : "14px",
                color: "var(--text-primary)",
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: isPhone ? "80px" : isMobile ? "120px" : "200px",
              }}
            >
              {text}
            </strong>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {record.requester?.fullName ||
                record.requester?.username ||
                "نامشخص"}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const info = getStatusInfo(status);
        return (
          <Tag
            color={info.color}
            style={{
              padding: isPhone ? "2px 8px" : "4px 14px",
              borderRadius: "20px",
              fontSize: isPhone ? "10px" : "13px",
            }}
          >
            {info.icon} {info.label}
          </Tag>
        );
      },
      filters: statusOptions.map(opt => ({ text: opt.label, value: opt.key })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "اولویت",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const info = getPriorityInfo(priority);
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
      filters: priorityOptions.map(opt => ({ text: opt.label, value: opt.key })),
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: "درخواست‌دهنده",
      dataIndex: "requester",
      key: "requester",
      className: isPhone ? "hide-mobile" : "",
      render: (requester) => (
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: isPhone ? "10px" : "13px" }}>
          <UserOutlined style={{ color: "var(--text-muted)" }} />
          {requester?.fullName || requester?.username || "-"}
        </span>
      ),
    },
    {
      title: "مسئول",
      dataIndex: "assignedTo",
      key: "assignedTo",
      className: isPhone ? "hide-mobile" : "",
      render: (assignedTo) => {
        if (!assignedTo) return <span style={{ color: "var(--text-muted)" }}>—</span>;
        const assignedName = typeof assignedTo === 'object' ? (assignedTo.fullName || assignedTo.username) : assignedTo;
        return (
          <Tag color="blue" style={{ borderRadius: "6px", fontSize: isPhone ? "10px" : "13px" }}>
            {assignedName}
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
            <Link to={`/tickets/${record._id}`}>
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
            <Link to={`/tickets/edit/${record._id}`}>
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
              title="آیا از حذف این تیکت اطمینان دارید؟"
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

  const openCount = data.filter((t) => t.status === "open").length;
  const inProgressCount = data.filter((t) => t.status === "in_progress").length;
  const resolvedCount = data.filter((t) => t.status === "resolved").length;
  const urgentCount = data.filter((t) => t.priority === "urgent").length;

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
            🎫 مدیریت تیکت‌ها
            <Tag
              color="blue"
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
          <Link to="/tickets/new">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size={isPhone ? "small" : isMobile ? "middle" : "large"}
            >
              {isPhone ? "جدید" : isMobile ? "افزودن" : "ثبت تیکت جدید"}
            </Button>
          </Link>
        </Space>
      </div>

      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderRight: `3px solid ${COLORS.warning}` }}
            styles={{ body: { padding: isPhone ? "4px 8px" : "12px" } }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                type="secondary"
                style={{ fontSize: isPhone ? "10px" : "13px" }}
              >
                باز
              </Text>
              <Badge count={openCount} style={{ background: COLORS.warning }} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderRight: `3px solid ${COLORS.primary}` }}
            styles={{ body: { padding: isPhone ? "4px 8px" : "12px" } }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                type="secondary"
                style={{ fontSize: isPhone ? "10px" : "13px" }}
              >
                در حال بررسی
              </Text>
              <Badge
                count={inProgressCount}
                style={{ background: COLORS.primary }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderRight: `3px solid ${COLORS.success}` }}
            styles={{ body: { padding: isPhone ? "4px 8px" : "12px" } }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                type="secondary"
                style={{ fontSize: isPhone ? "10px" : "13px" }}
              >
                حل شده
              </Text>
              <Badge
                count={resolvedCount}
                style={{ background: COLORS.success }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderRight: `3px solid ${COLORS.danger}` }}
            styles={{ body: { padding: isPhone ? "4px 8px" : "12px" } }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                type="secondary"
                style={{ fontSize: isPhone ? "10px" : "13px" }}
              >
                فوری
              </Text>
              <Badge
                count={urgentCount}
                style={{ background: COLORS.danger }}
              />
            </div>
          </Card>
        </Col>
      </Row>

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
                isPhone ? "🔍 جستجو..." : "🔍 جستجو بر اساس عنوان..."
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
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              placeholder="وضعیت"
              style={{ width: isPhone ? "90px" : isMobile ? "110px" : "150px" }}
              allowClear
              size={isPhone ? "small" : "middle"}
            >
              {statusOptions.map(opt => (
                <Option key={opt.key} value={opt.key}>
                  {opt.icon} {opt.label}
                </Option>
              ))}
            </Select>
            <Select
              value={filters.priority}
              onChange={(value) => setFilters({ ...filters, priority: value })}
              placeholder="اولویت"
              style={{ width: isPhone ? "90px" : isMobile ? "110px" : "150px" }}
              allowClear
              size={isPhone ? "small" : "middle"}
            >
              {priorityOptions.map(opt => (
                <Option key={opt.key} value={opt.key}>
                  {opt.icon} {opt.label}
                </Option>
              ))}
            </Select>
            {(filters.status || filters.priority) && (
              <Button
                size="small"
                onClick={() => setFilters({ status: "", priority: "" })}
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
          rowClassName={(record) => `table-row-${record.status}`}
          className="custom-table"
          pagination={{
            ...pagination,
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) =>
              isPhone ? `${total}` : `تعداد ${total} آیتم`,
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
                  🎫
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: isPhone ? "13px" : "16px" }}
                >
                  هیچ تیکتی ثبت نشده است
                </Text>
                <br />
                <Link to="/tickets/new">
                  <Button
                    type="primary"
                    style={{ marginTop: isPhone ? "12px" : "20px" }}
                    icon={<PlusOutlined />}
                    size={isPhone ? "small" : "large"}
                  >
                    {isPhone ? "اولین تیکت" : "ثبت اولین تیکت"}
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

export default TicketList;