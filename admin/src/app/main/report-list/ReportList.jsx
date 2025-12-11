import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Chip,
  IconButton
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

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
  const navigate = useNavigate();
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
    pending: 0, // draft + submitted
    total: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    search: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Hospital type mapping to numeric values
  const hospitalTypeMap = {
    'large_hospital': 1,
    'hospital': 2,
    'welfare': 3
  };

  // Months for dropdown
  const months = [
    { value: 1, label: '1月' },
    { value: 2, label: '2月' },
    { value: 3, label: '3月' },
    { value: 4, label: '4月' },
    { value: 5, label: '5月' },
    { value: 6, label: '6月' },
    { value: 7, label: '7月' },
    { value: 8, label: '8月' },
    { value: 9, label: '9月' },
    { value: 10, label: '10月' },
    { value: 11, label: '11月' },
    { value: 12, label: '12月' }
  ];

  // Years for dropdown (last 5 years + current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Fetch reports with pagination
  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const payload = {
        page: page,
        limit: pagination.itemsPerPage,
        month: filters.month,
        year: filters.year,
        search: filters.search || undefined
      };

      // Only add status if not 'all'
      if (filters.status !== 'all') {
        payload.status = filters.status;
      }

      // Only add hospital_id if it exists
      if (hospital?.id) {
        payload.hospital_id = hospital.id;
      }

      const response = await axios.post(apiConfig.reportList, payload);

      if (response.data.success) {
        const { reports: reportsData, pagination: paginationData } = response.data.data;
        setReports(reportsData);
        setPagination(paginationData);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showSnackbar('レポート一覧の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.itemsPerPage, hospital?.id]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    setLoadingStats(true);
    try {
      const payload = {
        month: filters.month,
        year: filters.year
      };

      // Only add hospital_id if it exists
      if (hospital?.id) {
        payload.hospital_id = hospital.id;
      }

      const response = await axios.post(apiConfig.reportStatistics, payload);

      if (response.data.success) {
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [filters.month, filters.year, hospital?.id]);

  // Initial load
  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, []);

  // Fetch data when hospital changes
  useEffect(() => {
    if (hospital !== undefined) { // Check if hospital is defined (could be null)
      fetchReports();
      fetchStatistics();
    }
  }, [hospital?.id]); // Only run when hospital.id changes

  // Fetch data when filters change
  useEffect(() => {
    fetchReports();
    // Only fetch statistics when month/year changes, not when status changes
  }, [filters.month, filters.year, filters.status]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchReports(page);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    handleFilterChange({ status });
  };

  // Clear status filter
  const clearStatusFilter = () => {
    handleFilterChange({ status: 'all' });
  };

  // Handle month change
  const handleMonthChange = (month) => {
    handleFilterChange({ month });
  };

  // Handle year change
  const handleYearChange = (year) => {
    handleFilterChange({ year });
  };

  // Handle export
  const handleExport = async () => {
    try {
      const payload = {
        status: filters.status !== 'all' ? filters.status : undefined,
        month: filters.month,
        year: filters.year,
        search: filters.search || undefined
      };

      // Only add hospital_id if it exists
      if (hospital?.id) {
        payload.hospital_id = hospital.id;
      }

      const response = await axios.post(apiConfig.reportExport, payload, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports_${filters.year}_${filters.month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSnackbar('エクスポートが完了しました', 'success');
    } catch (error) {
      console.error('Error exporting reports:', error);
      showSnackbar('エクスポートに失敗しました', 'error');
    }
  };

  // Handle report action (view)
  const handleReportAction = (report) => {
    // Get hospital type from report data or current hospital context
    const reportHospitalType = report.medical_center_type || (hospital?.type || 'hospital');
    const typeValue = hospitalTypeMap[reportHospitalType] || 2; // Default to 2 (hospital)
    
    navigate(`/report-view?id=${report.id}&type=${typeValue}`);
  };

  // Handle add new report
  const handleAddReport = () => {
    // Pass hospital type when navigating to report entry
    if (hospital?.type) {
      const typeValue = hospitalTypeMap[hospital.type] || 2;
      navigate(`/report-entry?type=${typeValue}`);
    } else {
      navigate('/report-entry');
    }
  };

  // Snackbar helper
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch(status) {
      case 'draft': return '下書き';
      case 'submitted': return '提出済み';
      case 'approved': return '確認済み';
      case 'rejected': return '拒否済み';
      case 'pending': return '未確認';
      default: return 'すべて';
    }
  };

  // Get hospital type label
  const getHospitalTypeLabel = (type) => {
    switch(type) {
      case 'large_hospital': return '大病院';
      case 'hospital': return '病院';
      case 'welfare': return '福祉施設';
      default: return '病院';
    }
  };

  // Format statistics for Overview component
  const overviewCards = [
    {
      bgColor: "#f9b934",
      icon: "Loading",
      label: "今月のレポート草稿",
      value: statistics.draft.toString(),
      onClick: () => handleStatusFilter('draft')
    },
    {
      bgColor: "#2eae63",
      icon: "NoteDone",
      label: "今月提出済 レポート",
      value: statistics.submitted.toString(),
      onClick: () => handleStatusFilter('submitted')
    },
    {
      bgColor: "#0077b6",
      icon: "PropertyView",
      label: "確定レポート",
      value: statistics.approved.toString(),
      onClick: () => handleStatusFilter('approved')
    },
    {
      bgColor: "#f26b38",
      icon: "Alert01",
      label: "未確認 レポート",
      value: statistics.pending.toString(),
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

  // Get hospital display info
  const getHospitalDisplayInfo = () => {
    if (hospital?.id) {
      return {
        name: hospital.name || '医療機関名なし',
        type: getHospitalTypeLabel(hospital.type),
        typeValue: hospitalTypeMap[hospital.type] || 2
      };
    }
    return null;
  };

  const hospitalInfo = getHospitalDisplayInfo();

  return (
    <Root
      header={
        <CommonHeader
          title={`レポート一覧 - ${getCurrentJapaneseDate()}`}
          onCreate={handleAddReport}
          createButtonText="レポート追加"
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
          {/* Month/Year Selector and Status Filter */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>月を選択</InputLabel>
                <Select
                  value={filters.month}
                  label="月を選択"
                  onChange={(e) => handleMonthChange(e.target.value)}
                >
                  {months.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>年を選択</InputLabel>
                <Select
                  value={filters.year}
                  label="年を選択"
                  onChange={(e) => handleYearChange(e.target.value)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}年
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Current Hospital and Status Filter */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Hospital Info */}
              {hospitalInfo ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-end'
                }}>
                  <Typography variant="body1" fontWeight={600}>
                    {hospitalInfo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hospitalInfo.type} 
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  全医療機関を表示中
                </Typography>
              )}

              {/* Status Filter Chip */}
              {filters.status !== 'all' && (
                <Chip
                  label={`ステータス: ${getStatusLabel(filters.status)}`}
                  onDelete={clearStatusFilter}
                  deleteIcon={<CloseIcon />}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {/* Stats Overview */}
          <Overview 
            cards={overviewCards}
            loading={loadingStats}
          />

          {/* Main Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ContentScreen
              reports={reports}
              loading={loading}
              pagination={pagination}
              filters={filters}
              onPageChange={handlePageChange}
              onStatusFilter={handleStatusFilter}
              onReportAction={handleReportAction}
              onExport={handleExport}
              onClearStatusFilter={clearStatusFilter}
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