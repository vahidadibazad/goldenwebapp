// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import faIR from 'antd/locale/fa_IR';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationToast from './components/NotificationToast';

// =============================================
// Context Providers
// =============================================
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { CrmProvider } from './context/CrmContext';

// =============================================
// صفحات اصلی (داشبورد و احراز هویت)
// =============================================
import Dashboard from './components/Dashboard';
import Login from './components/Login';

// =============================================
// صفحات مدیریت اموال
// =============================================
import HardwareList from './components/HardwareList';
import HardwareForm from './components/HardwareForm';
import HardwareDetail from './components/HardwareDetail';

// =============================================
// صفحات مدیریت رمزها
// =============================================
import CredentialList from './components/CredentialList';
import CredentialForm from './components/CredentialForm';
import CredentialDetail from './components/CredentialDetail';

// =============================================
// صفحات مدیریت اسناد
// =============================================
import DocumentList from './components/DocumentList';
import DocumentUpload from './components/DocumentUpload';

// =============================================
// صفحات مدیریت تیکت‌ها
// =============================================
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';
import TicketDetail from './components/TicketDetail';

// =============================================
// صفحات مدیریت کاربران
// =============================================
import UserList from './components/UserList';
import UserForm from './components/UserForm';

// =============================================
// صفحات مدیریت سیستم
// =============================================
import Profile from './components/Profile';
import SystemSettings from './components/SystemSettings';
import CategoryManager from './components/CategoryManager';
import RoleList from './components/RoleList';
import RoleForm from './components/RoleForm';
import AuditLog from './components/AuditLog';
import ChangePassword from './components/ChangePassword';
import DepartmentManager from './components/DepartmentManager';

// =============================================
// صفحات مدیریت واحدها
// =============================================
import DepartmentList from './components/departments/DepartmentList';

// =============================================
// صفحات مدیریت نامه‌ها (Letters)
// =============================================
import {
  LetterDashboard,
  LetterInbox,
  LetterOutbox,
  LetterPending,
  LetterForm,
  LetterDetail,
} from './components/letters';

// =============================================
// صفحات مدیریت گردش کار (Workflow)
// =============================================
import WorkflowList from './components/workflow/WorkflowList';
import WorkflowBuilder from './components/workflow/WorkflowBuilder';

// =============================================
// صفحات مدیریت امضا (Signature)
// =============================================
import SignatureList from './components/signatures/SignatureList';
import SignaturePad from './components/signatures/SignaturePad';

// =============================================
// صفحات سیستم مکاتبات
// =============================================
import SecretariatList from './components/SecretariatList';
import CorrespondenceList from './components/CorrespondenceList';
import ArchiveList from './components/ArchiveList';
import ReportList from './components/ReportList';
import ReportForm from './components/ReportForm';

// =============================================
// صفحات فکس
// =============================================
import { FaxList, FaxDetail } from './components/fax';

// =============================================
// صفحات وب‌هوک
// =============================================
import WebhookList from './components/webhooks/WebhookList';
import WebhookForm from './components/webhooks/WebhookForm';

// =============================================
// صفحات ایمیل
// =============================================
import EmailSettings from './components/email/EmailSettings';
import EmailInbox from './components/email/EmailInbox';

// =============================================
// صفحات جدید
// =============================================
import LetterNumberingList from './components/LetterNumberingList';
import OCRSearch from './components/OCRSearch';
import DelegationManager from './components/DelegationManager';
import ReferralList from './components/ReferralList';
import ReferralDetail from './components/ReferralDetail';
import SecretariatForm from './components/SecretariatForm';
import SecretariatDetail from './components/SecretariatDetail';
import ArchiveForm from './components/ArchiveForm';
import ArchiveDetail from './components/ArchiveDetail';
import ArchiveSearch from './components/ArchiveSearch';
import OrganizationDashboard from './components/OrganizationDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdvancedSearch from './components/AdvancedSearch';

// =============================================
// مسیرهای CMS
// =============================================
import PagesList from './components/cms/PagesList';
import PageForm from './components/cms/PageForm';
import PostsList from './components/cms/PostsList';
import PostForm from './components/cms/PostForm';
import CategoriesList from './components/cms/CategoriesList';
import TagsList from './components/cms/TagsList';
import CommentsList from './components/cms/CommentsList';
import PublicPage from './pages/cms/PublicPage';
import PostDetail from './pages/cms/PostDetail';
import ProductsList from './pages/cms/ProductsList';
import ProductDetail from './pages/cms/ProductDetail';

// =============================================
// صفحات CRM
// =============================================
import CrmDashboard from './pages/crm/Dashboard';
import LeadsList from './pages/crm/LeadsList';
import LeadForm from './pages/crm/LeadForm';
import LeadDetail from './pages/crm/LeadDetail';
import AccountsList from './pages/crm/AccountsList';
import AccountForm from './pages/crm/AccountForm';
import OpportunitiesList from './pages/crm/OpportunitiesList';
import OpportunityForm from './pages/crm/OpportunityForm';
import ContractsList from './pages/crm/ContractsList';
import ContractForm from './pages/crm/ContractForm';
import ContractDetail from './pages/crm/ContractDetail';

// =============================================
// کامپوننت اصلی App
// =============================================
function App() {
  return (
    <ConfigProvider
      locale={faIR}
      direction="rtl"
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 10,
          fontFamily: 'Vazirmatn, Tahoma, sans-serif',
        },
        components: {
          Table: {
            headerBg: '#fafafa',
          },
          Card: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          },
        },
      }}
    >
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <CrmProvider>
                <AntApp>
                  <Toaster position="top-center" />
                  <NotificationToast />
                  <Routes>
                    {/* صفحه لاگین */}
                    <Route path="/login" element={<Login />} />

                    {/* صفحات محافظت‌شده */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Dashboard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* اموال */}
                    <Route
                      path="/hardware"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <HardwareList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/hardware/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <HardwareForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/hardware/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <HardwareDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/hardware/edit/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <HardwareForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* رمزها */}
                    <Route
                      path="/credentials"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <CredentialList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/credentials/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <CredentialForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/credentials/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <CredentialDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/credentials/edit/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <CredentialForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* اسناد */}
                    <Route
                      path="/documents"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <DocumentList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/documents/upload"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <DocumentUpload />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* تیکت‌ها */}
                    <Route
                      path="/tickets"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <TicketList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tickets/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <TicketForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tickets/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <TicketDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tickets/edit/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <TicketForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* کاربران */}
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <UserList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <UserForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users/edit/:id"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <UserForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* دسته‌بندی‌ها */}
                    <Route
                      path="/categories/:module"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <CategoryManager />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* نقش‌ها */}
                    <Route
                      path="/roles"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <RoleList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/roles/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <RoleForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/roles/edit/:id"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <RoleForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* واحدها */}
                    <Route
                      path="/departments"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <DepartmentList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* نامه‌ها */}
                    <Route
                      path="/letters/dashboard"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LetterDashboard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/letters/inbox"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LetterInbox />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/letters/outbox"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LetterOutbox />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/letters/pending"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LetterPending />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/letters/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LetterForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/letters/edit/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LetterForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/letters/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LetterDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* گردش کار */}
                    <Route
                      path="/workflow"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <WorkflowList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/workflow/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <WorkflowBuilder />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/workflow/edit/:id"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <WorkflowBuilder />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* امضاها */}
                    <Route
                      path="/signatures"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <SignatureList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/signatures/pad/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <SignaturePad />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* دبیرخانه و مکاتبات */}
                    <Route
                      path="/secretariats"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <SecretariatList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/secretariats/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <SecretariatForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/secretariats/edit/:id"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <SecretariatForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/secretariats/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <SecretariatDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/correspondence"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <CorrespondenceList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* بایگانی */}
                    <Route
                      path="/archive"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ArchiveList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/archive/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <ArchiveForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/archive/edit/:id"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <ArchiveForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/archive/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ArchiveDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/archive/search"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ArchiveSearch />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* گزارشات */}
                    <Route
                      path="/reports"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <ReportList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <ReportForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* فکس */}
                    <Route
                      path="/fax"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <FaxList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fax/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <FaxList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fax/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <FaxDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* وب‌هوک */}
                    <Route
                      path="/webhooks"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <WebhookList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/webhooks/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <WebhookForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/webhooks/edit/:id"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <WebhookForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* ایمیل */}
                    <Route
                      path="/email/settings"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <EmailSettings />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/email/inbox"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <EmailInbox />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* صفحات جدید */}
                    <Route
                      path="/letter-numbering"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <LetterNumberingList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ocr-search"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <OCRSearch />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/delegation"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <DelegationManager />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/referrals"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ReferralList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/referrals/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ReferralDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/organization"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <OrganizationDashboard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <AnalyticsDashboard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/advanced-search"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <AdvancedSearch />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* CMS - مدیریت */}
                    <Route
                      path="/cms/pages"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <PagesList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cms/pages/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <PageForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cms/pages/edit/:id"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <PageForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cms/posts"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <PostsList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cms/posts/new"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <PostForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cms/posts/edit/:id"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <PostForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cms/categories"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <CategoriesList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cms/tags"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <TagsList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cms/comments"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <CommentsList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* CMS - عمومی */}
                    <Route path="/page/:slug" element={<PublicPage />} />
                    <Route path="/post/:slug" element={<PostDetail />} />
                    <Route path="/products" element={<ProductsList />} />
                    <Route path="/products/:slug" element={<ProductDetail />} />

                    {/* CRM */}
                    <Route
                      path="/crm/dashboard"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <CrmDashboard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/leads"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LeadsList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/leads/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LeadForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/leads/edit/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LeadForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/leads/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <LeadDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/accounts"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <AccountsList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/accounts/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <AccountForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/accounts/edit/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <AccountForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/opportunities"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <OpportunitiesList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/opportunities/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <OpportunityForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/opportunities/edit/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <OpportunityForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/contracts"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ContractsList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/contracts/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ContractForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/contracts/edit/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ContractForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/contracts/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ContractDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* سایر صفحات */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Profile />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/change-password"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ChangePassword />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <SystemSettings />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/audit"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <Layout>
                            <AuditLog />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </AntApp>
              </CrmProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;