// frontend/src/context/CrmContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import crmService from '../modules/crm/services/crmService';
import { useAuth } from './AuthContext';

const CrmContext = createContext();

export const CrmProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [leads, setLeads] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // =============================================
  // دریافت داشبورد
  // =============================================
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await crmService.getDashboard();
      setDashboard(res.data.data);
      return res.data.data;
    } catch (error) {
      console.error('❌ خطا در دریافت داشبورد CRM:', error);
      return null;
    }
  }, []);

  // =============================================
  // دریافت سرنخ‌ها
  // =============================================
  const fetchLeads = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await crmService.getLeads(params);
      setLeads(res.data.data || []);
      return res.data;
    } catch (error) {
      console.error('❌ خطا در دریافت سرنخ‌ها:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // دریافت شرکت‌ها
  // =============================================
  const fetchAccounts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await crmService.getAccounts(params);
      setAccounts(res.data.data || []);
      return res.data;
    } catch (error) {
      console.error('❌ خطا در دریافت شرکت‌ها:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // دریافت فرصت‌ها
  // =============================================
  const fetchOpportunities = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await crmService.getOpportunities(params);
      setOpportunities(res.data.data || []);
      return res.data;
    } catch (error) {
      console.error('❌ خطا در دریافت فرصت‌ها:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // دریافت قراردادها
  // =============================================
  const fetchContracts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await crmService.getContracts(params);
      setContracts(res.data.data || []);
      return res.data;
    } catch (error) {
      console.error('❌ خطا در دریافت قراردادها:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // دریافت آمار
  // =============================================
  const fetchStats = useCallback(async () => {
    try {
      const [leadStats, accountStats, opportunityStats, contractStats] = await Promise.all([
        crmService.getLeadStats(),
        crmService.getAccountStats(),
        crmService.getOpportunityStats(),
        crmService.getContractStats(),
      ]);

      setStats({
        leads: leadStats.data.data,
        accounts: accountStats.data.data,
        opportunities: opportunityStats.data.data,
        contracts: contractStats.data.data,
      });

      return stats;
    } catch (error) {
      console.error('❌ خطا در دریافت آمار:', error);
      return null;
    }
  }, []);

  // =============================================
  // مقداردهی اولیه
  // =============================================
  useEffect(() => {
    if (user) {
      fetchDashboard();
      fetchStats();
    }
  }, [user, fetchDashboard, fetchStats]);

  const value = {
    loading,
    dashboard,
    leads,
    accounts,
    opportunities,
    contracts,
    stats,
    selectedLead,
    selectedAccount,
    selectedOpportunity,
    setSelectedLead,
    setSelectedAccount,
    setSelectedOpportunity,
    fetchDashboard,
    fetchLeads,
    fetchAccounts,
    fetchOpportunities,
    fetchContracts,
    fetchStats,
    crmService,
  };

  return (
    <CrmContext.Provider value={value}>
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};

export default CrmContext;