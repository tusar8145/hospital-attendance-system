// D:\Projects\trans\hospital-attendance-system\admin\src\app\main\report-list\ReportList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';

// Import components
import Header from './components/Header';
import Overview from './components/Overview';
import ContentScreen from './components/ContentScreen';
import { CommonHeader } from '../../shared-components/new/CommonHeader';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider
  },
  '& .FusePageSimple-content': {
    backgroundColor: '#f8f9fa',
  },
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {}
}));

function ReportList() {
  const { t } = useTranslation('shared-components');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { hospital } = useAppTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [statistics, setStatistics] = useState({
    submitted: 0,
    draft: 0,
    approved: 0,
    rejected: 0,
    unsubmitted: 0,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: null,
    endDate: null,
    search: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch reports with pagination
  const fetchReports = useCallback(async (page = 1) => {
    if (!hospital?.id) return;

    setLoading(true);
    try {
      const response = await axios.post(apiConfig.reportList, {
        hospital_id: hospital.id,
        page: page,
        limit: pagination.itemsPerPage,
        status: filters.status !== 'all' ? filters.status : undefined,
        start_date: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
        end_date: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined,
        search: filters.search || undefined
      });

      if (response.data.success) {
        const { reports: reportsData, pagination: paginationData, statistics: statsData } = response.data.data;
        setReports(reportsData);
        setPagination(paginationData);
        setStatistics(statsData);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showSnackbar('レポート一覧の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [hospital?.id, filters, pagination.itemsPerPage]);

  // Fetch statistics only (for Overview component)
  const fetchStatistics = useCallback(async () => {
    if (!hospital?.id) return;

    setLoadingStats(true);
    try {
      const response = await axios.post(apiConfig.reportList, {
        hospital_id: hospital.id,
        page: 1,
        limit: 1 // Just to get statistics
      });

      if (response.data.success) {
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [hospital?.id]);

  // Initial load
  useEffect(() => {
    if (hospital?.id) {
      fetchReports();
      fetchStatistics();
    }
  }, [hospital?.id, fetchReports, fetchStatistics]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setTimeout(() => fetchReports(1), 100);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchReports(page);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    handleFilterChange({ status });
  };

  // Handle search
  const handleSearch = (searchTerm) => {
    handleFilterChange({ search: searchTerm });
  };

  // Handle date range filter
  const handleDateRangeChange = (startDate, endDate) => {
    handleFilterChange({ startDate, endDate });
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Implement export functionality here
      showSnackbar('エクスポート機能は近日実装予定です', 'info');
    } catch (error) {
      showSnackbar('エクスポートに失敗しました', 'error');
    }
  };

  // Handle report action (view/submit)
  const handleReportAction = (reportId, action, reportData) => {
    if (action === 'view') {
      // Navigate to view report page
      window.location.href = `/main/report-entry?reportId=${reportId}`;
    } else if (action === 'submit') {
      // Navigate to submit report page for that date
      const reportDate = reportData.report_date;
      window.location.href = `/main/report-entry?date=${reportDate}`;
    }
  };

  // Snackbar helper
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Format statistics for Overview component
  const overviewCards = [
    {
      bgColor: "#2eae63",
      icon: "NoteDone", // You'll need to create/import these icons
      label: "今月提出済 レポート",
      value: statistics.submitted.toString(),
      onClick: () => handleStatusFilter('submitted')
    },
    {
      bgColor: "#f26b38",
      icon: "Alert01",
      label: "未提出 レポート",
      value: statistics.unsubmitted.toString(),
      onClick: () => handleStatusFilter('unsubmitted')
    },
    {
      bgColor: "#0077b6",
      icon: "PropertyView",
      label: "確認済 レポート",
      value: statistics.approved.toString(),
      onClick: () => handleStatusFilter('approved')
    },
    {
      bgColor: "#f9b934",
      icon: "Loading",
      label: "未確認 レポート",
      value: (statistics.draft + statistics.submitted).toString(),
      onClick: () => handleStatusFilter('pending') // draft + submitted
    },
  ];

  // Get current date for header
  const getCurrentJapaneseDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日`;
  };

  // Empty function for approval button
  const handleApproval = () => {
    showSnackbar('承認機能は近日実装予定です', 'info');
  };

  if (!hospital?.id) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        p: 3,
        textAlign: 'center',
        gap: 2
      }}>
        <Alert severity="warning" sx={{ width: '100%', maxWidth: 400 }}>
          レポート一覧を表示するには、まず病院を選択してください。
        </Alert>
      </Box>
    );
  }

  return (
    <Root
      header={
        <CommonHeader
          title={`レポート - ${getCurrentJapaneseDate()}`}
          onCreate={handleApproval}
          createButtonText="承認する"
          showFilter={false}
        />
      }
      content={
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
          {/* Stats Overview */}
          <Overview 
            cards={overviewCards}
            loading={loadingStats}
          />

          {/* Main Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Header 
              filters={filters}
              onFilterChange={handleFilterChange}
              onDateRangeChange={handleDateRangeChange}
              onSearch={handleSearch}
              onExport={handleExport}
            />
            
            <ContentScreen
              reports={reports}
              loading={loading}
              pagination={pagination}
              filters={filters}
              onPageChange={handlePageChange}
              onStatusFilter={handleStatusFilter}
              onReportAction={handleReportAction}
            />
          </Box>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              onClose={handleSnackbarClose} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      }
    />
  );
}

export default ReportList;