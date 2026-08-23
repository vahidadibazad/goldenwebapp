// frontend/src/components/DocumentList.jsx
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
  App,
  Badge,
  Modal,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  FilterOutlined,
  ClearOutlined,
  TeamOutlined,
  UserOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { toPersianDate } from "../utils/dateHelper";
import { toPersianNumber } from "../utils/numberHelper";
import { COLORS } from "../styles/theme";

const { Title, Text } = Typography;
const { Option } = Select;

function DocumentList() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    fileType: "",
    accessLevel: "",
    department: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // =============================================
  // ✅ دریافت EnumValueها از دیتابیس
  // =============================================
  const [fileTypeOptions, setFileTypeOptions] = useState([]);
  const [accessLevelOptions, setAccessLevelOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);

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
      const [fileTypes, accessLevels, departments] = await Promise.all([
        api.get('/enums/file_type'),
        api.get('/enums/access_level'),
        api.get('/departments?active=true'),
      ]);
      setFileTypeOptions(fileTypes.data.data || []);
      setAccessLevelOptions(accessLevels.data.data || []);
      setDepartmentOptions(departments.data.data || []);
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
  const getFileTypeInfo = (typeKey) => {
    const found = fileTypeOptions.find(item => item.key === typeKey);
    if (found) {
      return {
        color: found.color || COLORS.gray[500],
        label: found.label || typeKey || 'سایر',
        icon: found.icon || '📄',
      };
    }
    return { color: COLORS.gray[500], label: typeKey || 'سایر', icon: '📄' };
  };

  const getAccessLevelInfo = (levelKey) => {
    const found = accessLevelOptions.find(item => item.key === levelKey);
    if (found) {
      return {
        color: found.color || COLORS.gray[500],
        label: found.label || levelKey || 'عمومی',
      };
    }
    return { color: COLORS.gray[500], label: levelKey || 'عمومی' };
  };

  const getDepartmentName = (deptId) => {
    const found = departmentOptions.find(item => item._id === deptId || item.id === deptId);
    return found?.name || found?.label || deptId || 'همه';
  };

  const getDepartmentColor = (deptId) => {
    const found = departmentOptions.find(item => item._id === deptId || item.id === deptId);
    return found?.color || 'default';
  };

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.fileType) params.append("fileType", filters.fileType);
      if (filters.accessLevel)
        params.append("accessLevel", filters.accessLevel);
      if (filters.department) params.append("department", filters.department);
      params.append("page", page);
      params.append("limit", pageSize);
      const res = await api.get(`/documents?${params.toString()}`);
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
      await api.delete(`/documents/${id}`);
      message.success("سند با موفقیت حذف شد");
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("خطا در حذف");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await api.post("/documents/bulk", { ids: selectedRowKeys });
      message.success(`${selectedRowKeys.length} آیتم با موفقیت حذف شد`);
      setSelectedRowKeys([]);
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("خطا در حذف");
    }
  };

  const clearFilters = () => {
    setFilters({ fileType: "", accessLevel: "", department: "" });
    setSearch("");
  };

  const handleDownload = async (id, title) => {
    try {
      message.loading({ content: "در حال دانلود...", key: "download" });
      const response = await api.get(`/documents/download/${id}`, {
        responseType: "blob",
        timeout: 60000,
      });
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `${title || "سند"}`;
      if (contentDisposition) {
        let match = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/);
        if (match) fileName = decodeURIComponent(match[1]);
        else {
          match = contentDisposition.match(/filename="([^"]+)"/);
          if (match) fileName = match[1];
        }
      }
      if (!fileName.includes(".")) {
        const contentType = response.headers["content-type"] || "";
        const extMap = {
          "application/pdf": ".pdf",
          "application/msword": ".doc",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            ".docx",
          "application/vnd.ms-excel": ".xls",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            ".xlsx",
          "application/vnd.ms-powerpoint": ".ppt",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            ".pptx",
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/gif": ".gif",
          "video/mp4": ".mp4",
          "audio/mpeg": ".mp3",
          "text/plain": ".txt",
        };
        const ext = extMap[contentType] || ".bin";
        fileName = `${fileName}${ext}`;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({
        content: "دانلود با موفقیت انجام شد",
        key: "download",
      });
    } catch (error) {
      console.error("❌ خطا در دانلود:", error);
      message.error({ content: "خطا در دانلود فایل", key: "download" });
    }
  };

  const handlePreview = async (record) => {
    try {
      setPreviewLoading(true);
      setPreviewFile(null);
      
      const response = await api.get(`/documents/download/${record._id}`, {
        responseType: "blob",
        timeout: 60000,
      });
      
      const contentType = response.headers["content-type"] || "";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      const fileInfo = {
        url,
        type: contentType,
        name: record.title,
        fileType: record.fileType,
        blob,
      };
      
      if (contentType.startsWith("image/")) {
        setPreviewFile({ ...fileInfo, isImage: true });
        setPreviewVisible(true);
        setPreviewLoading(false);
        return;
      }
      
      if (contentType === "application/pdf") {
        setPreviewFile({ ...fileInfo, isPdf: true });
        setPreviewVisible(true);
        setPreviewLoading(false);
        return;
      }
      
      window.open(url, "_blank");
      setPreviewLoading(false);
      
    } catch (error) {
      console.error("❌ خطا در پیش‌نمایش:", error);
      message.error("خطا در نمایش فایل");
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewFile?.url) {
      window.URL.revokeObjectURL(previewFile.url);
    }
    setPreviewVisible(false);
    setPreviewFile(null);
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const columns = [
    {
      title: "عنوان سند",
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
                getFileTypeInfo(record.fileType).color || COLORS.gray[400],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "16px",
            }}
          >
            <FileTextOutlined />
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
            {record.description && !isPhone && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {record.description}
              </div>
            )}
          </div>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "نوع فایل",
      dataIndex: "fileType",
      key: "fileType",
      render: (type) => {
        const info = getFileTypeInfo(type);
        return (
          <Tag
            color={info.color}
            style={{ padding: "4px 12px", borderRadius: "20px", fontSize: isPhone ? "10px" : "13px" }}
          >
            {info.icon} {info.label}
          </Tag>
        );
      },
      filters: fileTypeOptions.map(opt => ({ text: opt.label, value: opt.key })),
      onFilter: (value, record) => record.fileType === value,
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
            style={{ padding: "4px 12px", borderRadius: "20px", fontSize: isPhone ? "10px" : "13px" }}
          >
            {info.label}
          </Tag>
        );
      },
      filters: accessLevelOptions.map(opt => ({ text: opt.label, value: opt.key })),
      onFilter: (value, record) => record.accessLevel === value,
    },
    {
      title: "دپارتمان",
      dataIndex: "department",
      key: "department",
      className: isPhone ? "hide-mobile" : "",
      render: (dept) => {
        const name = getDepartmentName(dept);
        const color = getDepartmentColor(dept);
        return (
          <Tag
            icon={<TeamOutlined />}
            color={color}
            style={{ borderRadius: "12px", fontSize: isPhone ? "10px" : "13px" }}
          >
            {name}
          </Tag>
        );
      },
      filters: departmentOptions.map(opt => ({ text: opt.name || opt.label, value: opt._id || opt.id })),
      onFilter: (value, record) => record.department === value,
    },
    {
      title: "انقضای دسترسی",
      dataIndex: "accessExpiry",
      key: "accessExpiry",
      className: isPhone ? "hide-mobile" : "",
      render: (date) => {
        if (!date) return <Tag color="default" style={{ fontSize: isPhone ? "10px" : "13px" }}>نامحدود</Tag>;
        const now = new Date();
        const expiry = new Date(date);
        const isExpired = expiry < now;
        return (
          <Tag color={isExpired ? "red" : "green"} style={{ fontSize: isPhone ? "10px" : "13px" }}>
            {isExpired ? "⚠️ منقضی شده" : toPersianDate(date)}
          </Tag>
        );
      },
    },
    {
      title: "👁️ بازدید",
      dataIndex: "viewLogs",
      key: "viewLogs",
      className: isPhone ? "hide-mobile" : "",
      render: (logs) => {
        const count = logs?.length || 0;
        return (
          <Badge
            count={count}
            style={{ background: COLORS.primary }}
            title={`${count} بار مشاهده شده`}
          />
        );
      },
    },
    {
      title: "تاریخ آپلود",
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
      width: isPhone ? 70 : isMobile ? 80 : 160,
      render: (_, record) => (
        <Space size={isPhone ? 2 : 4}>
          <Tooltip title="مشاهده" placement="top">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size={isPhone ? "small" : "middle"}
              style={{ color: COLORS.primary }}
              onClick={() => handlePreview(record)}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="دانلود" placement="top">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              size={isPhone ? "small" : "middle"}
              style={{ color: COLORS.success }}
              onClick={() => handleDownload(record._id, record.title)}
              className="action-btn"
            />
          </Tooltip>
          {record.accessLevel !== "public" && !isPhone && (
            <Tooltip title="درخواست دسترسی" placement="top">
              <Button
                type="text"
                icon={<UserOutlined />}
                size={isPhone ? "small" : "middle"}
                style={{ color: COLORS.warning }}
                className="action-btn"
              />
            </Tooltip>
          )}
          <Tooltip title="حذف" placement="top">
            <Popconfirm
              title="آیا از حذف این سند اطمینان دارید؟"
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
            📄 مدیریت اسناد
            <Tag
              color="green"
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
          {/* ✅ دکمه جدید: جستجوی OCR */}
          <Button
            icon={<ScanOutlined />}
            onClick={() => navigate('/ocr-search')}
            size={isPhone ? "small" : isMobile ? "middle" : "middle"}
          >
            {isPhone ? 'OCR' : isMobile ? 'جستجوی OCR' : 'جستجوی OCR'}
          </Button>
          <Link to="/documents/upload">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size={isPhone ? "small" : isMobile ? "middle" : "large"}
            >
              {isPhone ? "جدید" : isMobile ? "آپلود" : "آپلود سند جدید"}
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
                isPhone ? "🔍 جستجو..." : "🔍 جستجو بر اساس عنوان، برچسب..."
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
              value={filters.fileType}
              onChange={(value) => setFilters({ ...filters, fileType: value })}
              placeholder="نوع فایل"
              style={{ width: isPhone ? "90px" : isMobile ? "110px" : "150px" }}
              allowClear
              size={isPhone ? "small" : "middle"}
            >
              {fileTypeOptions.map(opt => (
                <Option key={opt.key} value={opt.key}>
                  {opt.icon} {opt.label}
                </Option>
              ))}
            </Select>
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
                  {opt.label}
                </Option>
              ))}
            </Select>
            <Select
              value={filters.department}
              onChange={(value) => setFilters({ ...filters, department: value })}
              placeholder="دپارتمان"
              style={{ width: isPhone ? "90px" : isMobile ? "110px" : "150px" }}
              allowClear
              size={isPhone ? "small" : "middle"}
            >
              {departmentOptions.map(opt => (
                <Option key={opt._id || opt.id} value={opt._id || opt.id}>
                  {opt.name || opt.label}
                </Option>
              ))}
            </Select>
            {(filters.fileType || filters.accessLevel || filters.department) && (
              <Button
                size="small"
                onClick={() =>
                  setFilters({ fileType: "", accessLevel: "", department: "" })
                }
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
                  📭
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: isPhone ? "13px" : "16px" }}
                >
                  هیچ سندی آپلود نشده است
                </Text>
                <br />
                <Link to="/documents/upload">
                  <Button
                    type="primary"
                    style={{ marginTop: isPhone ? "12px" : "20px" }}
                    icon={<PlusOutlined />}
                    size={isPhone ? "small" : "large"}
                  >
                    {isPhone ? "اولین سند" : "آپلود اولین سند"}
                  </Button>
                </Link>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        open={previewVisible}
        title={`پیش‌نمایش: ${previewFile?.name || ""}`}
        onCancel={closePreview}
        footer={[
          <Button key="download" type="primary" onClick={() => {
            if (previewFile?.url) {
              const link = document.createElement("a");
              link.href = previewFile.url;
              link.download = previewFile.name || "سند";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}>
            دانلود
          </Button>,
          <Button key="close" onClick={closePreview}>
            بستن
          </Button>,
        ]}
        width={previewFile?.isImage ? "80%" : "90%"}
        className={isPhone ? "ant-modal-fullscreen-mobile" : ""}
        styles={{
          body: {
            padding: isPhone ? "8px" : "0",
            maxHeight: isPhone ? "calc(100vh - 140px)" : "70vh",
            overflow: "auto",
          },
        }}
        centered
        destroyOnHidden
      >
        {previewLoading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
            <Text>در حال بارگذاری فایل...</Text>
          </div>
        )}
        {previewFile && !previewLoading && (
          <div style={{ textAlign: "center", padding: "16px" }}>
            {previewFile.isImage ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            ) : previewFile.isPdf ? (
              <iframe
                src={previewFile.url}
                style={{
                  width: "100%",
                  height: "70vh",
                  border: "none",
                  borderRadius: "8px",
                }}
                title={previewFile.name}
              />
            ) : (
              <div style={{ padding: "40px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                <Text strong>پیش‌نمایش این نوع فایل پشتیبانی نمی‌شود</Text>
                <br />
                <Text type="secondary">
                  لطفاً فایل را دانلود کنید تا در برنامه مناسب باز شود.
                </Text>
                <br />
                <Button
                  type="primary"
                  style={{ marginTop: "16px" }}
                  onClick={() => {
                    if (previewFile?.url) {
                      const link = document.createElement("a");
                      link.href = previewFile.url;
                      link.download = previewFile.name || "سند";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  دانلود فایل
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .action-btn { transition: all 0.3s ease !important; border-radius: 8px !important; }
        .action-btn:hover { transform: scale(1.15) !important; background: var(--bg-secondary) !important; }
        .ant-table-cell { vertical-align: middle !important; }
        .hide-mobile { display: table-cell !important; }
        .hide-phone { display: table-cell !important; }
        @media (max-width: 768px) { .hide-mobile { display: none !important; } .ant-table { font-size: 12px !important; } .ant-table-thead > tr > th, .ant-table-tbody > tr > td { padding: 6px 8px !important; } }
        @media (max-width: 480px) { .hide-phone { display: none !important; } .ant-table { font-size: 11px !important; } .ant-table-thead > tr > th, .ant-table-tbody > tr > td { padding: 4px 6px !important; } .ant-pagination-item { min-width: 24px !important; height: 24px !important; line-height: 22px !important; font-size: 11px !important; } .ant-pagination-prev .ant-pagination-item-link, .ant-pagination-next .ant-pagination-item-link { font-size: 11px !important; padding: 0 4px !important; } }
      `}</style>
    </div>
  );
}

export default DocumentList;