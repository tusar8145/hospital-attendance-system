import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  Tooltip,
  IconButton,
  LinearProgress,
  AppBar,
  Toolbar,
  Divider,
  TextField,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import { useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TodayIcon from '@mui/icons-material/Today';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import HomeIcon from '@mui/icons-material/Home';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja';
import { useAppSelector } from 'app/store/hooks';
import { selectUser } from 'src/app/auth/user/store/userSlice';

// Lazy load the welfare report component
const FrameScreen = React.lazy(() => import('./sm/FrameScreen'));

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
  },
  '& .FusePageSimple-content': {
    backgroundColor: '#f8f9fa',
  },
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {}
}));

// Custom Header Component
const WelfareReportHeader = ({ 
  title, 
  reportDate, 
  reportStatus, 
  loadingReport,
  onDateChange,
  onPreviousDay,
  onNextDay,
  onToday,
  onRefresh,
  onBack,
  onSaveDraft,
  onSubmit,
  hasUnsavedChanges,
  isSubmitting,
  isSavingDraft,
  hospitalName,
  readOnly = false,
  isEditingFromView = false
}) => {
  const navigate = useNavigate();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get user data from Redux
  const user = useAppSelector(selectUser);
  const userRole = user?.role || '';

  // Format date for display
  const formatJapaneseDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      draft: { 
        color: '#ff9800', 
        label: '下書き', 
        bgColor: '#fff3e0',
        icon: <SaveIcon fontSize="small" />
      },
      submitted: { 
        color: '#2196f3', 
        label: '提出済み', 
        bgColor: '#e3f2fd',
        icon: <SendIcon fontSize="small" />
      },
      approved: { 
        color: '#4caf50', 
        label: '承認済み', 
        bgColor: '#e8f5e9',
        icon: <CheckCircleOutlineIcon fontSize="small" />
      },
      rejected: { 
        color: '#f44336', 
        label: '拒否済み', 
        bgColor: '#ffebee',
        icon: <ErrorOutlineIcon fontSize="small" />
      }
    };
    
    const config = statusConfig[status] || { 
      color: '#9e9e9e', 
      label: '未作成', 
      bgColor: '#f5f5f5',
      icon: <InfoOutlinedIcon fontSize="small" />
    };
    
    return (
      <Chip
        icon={React.cloneElement(config.icon, { 
          sx: { 
            fontSize: 14,
            color: config.color 
          } 
        })}
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.color}33`,
          '& .MuiChip-icon': {
            marginLeft: 0.5
          }
        }}
      />
    );
  };

  // Handle back to report list
  const handleBack = () => {
    onBack();
  };

  // Get user role display name
  const getUserRoleDisplay = () => {
    const roleMap = {
      'superAdmin': 'System Administrator',
      'admin': 'Chief Executive',
      'hospitalAssistant': 'Head Manager',
      'staff': 'Manager',
      'operator': 'Data Input Person'
    };
    return roleMap[userRole] || userRole || 'Guest';
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: 56, sm: 64 },
        px: { xs: 1, sm: 2 },
        py: 1
      }}>
        {/* Left Section: Back button and Title */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flex: 1,
          minWidth: 0
        }}>
          {/* Back Button */}
          <Tooltip title="レポート一覧に戻る">
            <IconButton 
              size="medium"
              onClick={handleBack}
              sx={{
                color: '#0A6AE3',
                '&:hover': {
                  backgroundColor: '#e8f0fe'
                }
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Title and Hospital Info */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            minWidth: 0,
            flex: 1
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: '#2c3e50',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
              {isEditingFromView && (
                <Chip 
                  label="編集モード" 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1, fontSize: '0.75rem', height: 20 }}
                />
              )}
            </Typography>
            {hospitalName && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#666',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {hospitalName} (福祉施設)
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Right Section: Actions and User Info */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 },
          flex: 1,
          justifyContent: 'flex-end'
        }}>
          {/* User Role Info - Desktop only */}
          {!isMobile && userRole && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-end',
              mr: 1
            }}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                ロール:
              </Typography>
              <Typography variant="caption" sx={{ 
                fontWeight: 600, 
                color: '#0A6AE3',
                fontSize: '0.75rem'
              }}>
                {getUserRoleDisplay()}
              </Typography>
            </Box>
          )}
          
          {/* Refresh Button */}
          <Tooltip title="更新">
            <IconButton 
              size="small" 
              onClick={onRefresh}
              disabled={loadingReport}
              sx={{ 
                color: '#666',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Mobile Date and Status (collapsed) */}
          {isMobile && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 1,
              py: 0.5,
              borderRadius: '6px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0'
            }}>
              <CalendarTodayIcon fontSize="small" sx={{ color: '#666' }} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {formatJapaneseDate(reportDate).split('年')[1]}
              </Typography>
              <StatusBadge status={reportStatus} />
            </Box>
          )}
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {/* Action Buttons - Only show for draft status or new report */}
          {!readOnly && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={onSaveDraft}
                disabled={isSavingDraft || isSubmitting || loadingReport}
                startIcon={isSavingDraft ? <CircularProgress size={16} /> : <SaveIcon />}
                sx={{
                  borderColor: '#ff9800',
                  color: '#ff9800',
                  minWidth: isMobile ? 40 : 'auto',
                  '&:hover': {
                    borderColor: '#f57c00',
                    backgroundColor: '#fff3e0'
                  },
                  px: isMobile ? 0.5 : 1.5
                }}
              >
                {!isMobile && (isSavingDraft ? '保存中...' : '下書き保存')}
              </Button>

              <Button
                variant="contained"
                size="small"
                onClick={onSubmit}
                disabled={isSubmitting || isSavingDraft || loadingReport}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
                sx={{
                  backgroundColor: '#0A6AE3',
                  minWidth: isMobile ? 40 : 'auto',
                  '&:hover': {
                    backgroundColor: '#0958c5'
                  },
                  px: isMobile ? 0.5 : 1.5
                }}
              >
                {!isMobile && (isSubmitting ? '提出中...' : '提出する')}
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

// Helper function to parse URL parameters
const getUrlParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
};

function ReportEntrySm({ newHospital }) {
  const { t } = useTranslation('shared-components');
  const { hospital: hospitalFromContext } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user data from Redux
  const user = useAppSelector(selectUser);
  const userRole = user?.role || '';
  const userId = user?.id || null;
  
  // Get initial URL parameters
  const [urlParams, setUrlParams] = useState(() => getUrlParams());
  
  // Current hospital state
  const [currentHospital, setCurrentHospital] = useState(() => {
    if (newHospital && newHospital.id) {
      return {
        id: newHospital.id,
        name: newHospital.name,
        type: newHospital.type
      };
    }
    
    if (hospitalFromContext?.id) {
      return {
        id: hospitalFromContext.id,
        name: hospitalFromContext.name,
        type: hospitalFromContext.type
      };
    }
    
    if (urlParams.hospitalId) {
      return {
        id: parseInt(urlParams.hospitalId, 10),
        name: hospitalFromContext?.name || `Hospital ID: ${urlParams.hospitalId}`,
        type: hospitalFromContext?.type || urlParams.type || 'welfare'
      };
    }
    
    return null;
  });

  // State management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const [formData, setFormData] = useState(null);
  const [formDataSubmit, setFormDataSubmit] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [reportDate, setReportDate] = useState(new Date());
  const [reportStatus, setReportStatus] = useState(null);
  const [reportExists, setReportExists] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [hospital_type, setHospitalType] = useState('welfare');
  
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success',
    duration: 6000 
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
    actionType: ''
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isEditingFromView, setIsEditingFromView] = useState(false);
  const [originalReportDate, setOriginalReportDate] = useState(null);
  
  // Refs
  const formDataRef = useRef(formData);
  const reportDateRef = useRef(reportDate);
  const currentHospitalRef = useRef(currentHospital);
  const initialFormDataRef = useRef(null);
  const isLoadingDataRef = useRef(false);
  const hasLoadedDataRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Get reportId from URL params
  const reportIdFromUrl = urlParams.reportId ? parseInt(urlParams.reportId, 10) : null;

  // Refs to store the FrameScreen's trigger functions
  const frameScreenSaveDraftRef = useRef(null);
  const frameScreenSubmitRef = useRef(null);

  // Update refs when state changes
  useEffect(() => {
    formDataRef.current = formData;
    reportDateRef.current = reportDate;
    currentHospitalRef.current = currentHospital;
  }, [formData, reportDate, currentHospital]);

  // Check if we're coming from view mode
  useEffect(() => {
    const params = getUrlParams();
    if (params.date) {
      // Parse date from URL
      const [year, month, day] = params.date.split('-');
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        setReportDate(parsedDate);
        setOriginalReportDate(parsedDate);
      }
    }
    
    // Check if we're editing from view mode
    if (params.fromView === 'true' || params.reportId) {
      setIsEditingFromView(true);
    }
  }, []);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format date for display
  const formatJapaneseDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Callback functions to set FrameScreen's trigger functions
  const setFrameScreenSaveDraft = useCallback((saveDraftFn) => {
    frameScreenSaveDraftRef.current = saveDraftFn;
  }, []);

  const setFrameScreenSubmit = useCallback((submitFn) => {
    frameScreenSubmitRef.current = submitFn;
  }, []);

  // Header button handlers that trigger FrameScreen functions
  const handleHeaderSaveDraft = () => {
    if (frameScreenSaveDraftRef.current) {
      console.log('Header save draft clicked, calling FrameScreen save draft');
      frameScreenSaveDraftRef.current();
    } else {
      console.log('FrameScreen save draft function not available yet, using parent handler');
      handleSaveDraft();
    }
  };

  const handleHeaderSubmit = () => {
    if (frameScreenSubmitRef.current) {
      console.log('Header submit clicked, calling FrameScreen submit');
      frameScreenSubmitRef.current();
    } else {
      console.log('FrameScreen submit function not available yet, using parent handler');
      handleSubmit();
    }
  };

  // Load report data by ID when coming from view mode
  const loadReportById = useCallback(async (reportIdToLoad) => {
    if (!reportIdToLoad) {
      showSnackbar('レポートIDが指定されていません', 'warning');
      return;
    }

    // Prevent duplicate calls
    if (isLoadingDataRef.current) {
      console.log('Skipping loadReportById - already loading');
      return;
    }

    setLoadingReport(true);
    isLoadingDataRef.current = true;
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report-welfare/get-by-id`, {
        report_id: reportIdToLoad
      });

      const { data } = response.data;
      
      if (data && data.success !== false) {
        const { report, welfare_data, departments: depts, doctors: docs } = data;
        
        // Update departments and doctors
        setDepartments(depts || []);
        setDoctors(docs || []);
        setReportExists(true);
        
        if (report) {
          // Set report date from the report data
          if (report.report_date) {
            const reportDateObj = new Date(report.report_date);
            setReportDate(reportDateObj);
            setOriginalReportDate(reportDateObj);
          }
          
          // Format the report data for the form
          const formattedReport = {
            id: report.id,
            report_no: report.report_no,
            status: report.status,
            special_notes: report.special_notes || '',
            welfare_data: welfare_data || {},
            hospital_type: report.hospital_type || 'welfare'
          };
          
          setHospitalType(report.hospital_type || 'welfare');
          setFormData(formattedReport);
          setFormDataSubmit(formattedReport);
          setInitialFormData(JSON.parse(JSON.stringify(formattedReport)));
          initialFormDataRef.current = JSON.parse(JSON.stringify(formattedReport));
          setReportStatus(report.status);
          setReportId(report.id);
          setHasUnsavedChanges(false);
          
          showSnackbar(`${formatJapaneseDate(new Date(report.report_date))}の福祉施設レポートを読み込みました`, 'info');
        } else {
          setHospitalType('welfare');
        }
        
        setValidationErrors({});
      }
    } catch (error) {
      console.error('Error loading welfare report by ID:', error);
      const errorMessage = error.response?.data?.message || '福祉施設レポートの読み込みに失敗しました';
      showSnackbar(errorMessage, 'error');
      
      // Fall back to loading by date if we have hospital ID
      if (currentHospitalRef.current?.id) {
        loadReportData(reportDateRef.current);
      }
    } finally {
      setLoadingReport(false);
      setLoading(false);
      isLoadingDataRef.current = false;
      hasLoadedDataRef.current = true;
    }
  }, []);

  // Load report data for selected date (normal flow)
  const loadReportData = useCallback(async (date, forceReload = false) => {
    const hospitalId = currentHospitalRef.current?.id;
    if (!hospitalId) {
      showSnackbar('福祉施設が選択されていません', 'warning');
      setLoading(false);
      return;
    }

    // Prevent duplicate calls
    if (isLoadingDataRef.current && !forceReload) {
      console.log('Skipping loadReportData - already loading');
      return;
    }

    setLoadingReport(true);
    isLoadingDataRef.current = true;
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report-welfare/get-by-date`, {
        date: formatDateForAPI(date),
        hospital_id: hospitalId
      });

      const { data } = response.data;
      
      if (data && data.success !== false) {
        const { report, welfare_data, departments: depts, doctors: docs, exists, hospital_type: hospType } = data;
        
        // Always update departments and doctors
        setDepartments(depts || []);
        setDoctors(docs || []);
        setReportExists(exists);
        setHospitalType(hospType || 'welfare');
        
        if (exists && report) {
          // Format the report data for the form
          const formattedReport = {
            id: report.id,
            report_no: report.report_no,
            status: report.status,
            special_notes: report.special_notes || '',
            welfare_data: welfare_data || {},
            hospital_type: hospType || 'welfare'
          };
          
          setFormData(formattedReport);
          setFormDataSubmit(formattedReport);
          setInitialFormData(JSON.parse(JSON.stringify(formattedReport)));
          initialFormDataRef.current = JSON.parse(JSON.stringify(formattedReport));
          setReportStatus(report.status);
          setReportId(report.id);
          setHasUnsavedChanges(false);
          
          if (!forceReload) {
            showSnackbar(`${formatJapaneseDate(date)}の福祉施設レポートを読み込みました`, 'info');
          }
        } else {
          // Initialize empty form for welfare
          const emptyForm = {
            special_notes: '',
            welfare_data: welfare_data || {
              capacity: 0,
              section1_admission_count: 0,
              section1_discharge_count: 0,
              section1_outside_hospital: 0,
              section1_admission_treated: 0,
              section1_hospitalization_count: 0,
              section1_discharge_treated: 0,
              section2_admission_count: 0,
              section2_discharge_count: 0,
              section2_outside_hospital: 0,
              section2_admission_treated: 0,
              section2_hospitalization_count: 0,
              section2_discharge_treated: 0,
              section3_admission_count: 0,
              section3_discharge_count: 0,
              section3_outside_hospital: 0,
              section3_hospitalization_count: 0,
              section4_daily_users: 0,
              section5_daily_users: 0,
              section6_daily_users: 0,
              section7_daily_users: 0,
              section_names: {
                section4: 'ABCD1',
                section5: 'ABCD2',
                section6: 'ABCD3',
                section7: 'ABCD4'
              }
            },
            hospital_type: 'welfare'
          };
          
          setFormData(emptyForm);
          setFormDataSubmit(emptyForm);
          setInitialFormData(JSON.parse(JSON.stringify(emptyForm)));
          initialFormDataRef.current = JSON.parse(JSON.stringify(emptyForm));
          setReportStatus(null);
          setReportId(null);
          setReportExists(false);
          setHasUnsavedChanges(false);
          
          if (!forceReload) {
            showSnackbar('新しい福祉施設レポートを作成できます', 'info');
          }
        }
        
        setValidationErrors({});
      }
    } catch (error) {
      console.error('Error loading welfare report:', error);
      const errorMessage = error.response?.data?.message || '福祉施設レポートの読み込みに失敗しました';
      
      // Initialize empty form on error
      const emptyForm = {
        special_notes: '',
        welfare_data: {
          capacity: 0,
          section1_admission_count: 0,
          section1_discharge_count: 0,
          section1_outside_hospital: 0,
          section1_admission_treated: 0,
          section1_hospitalization_count: 0,
          section1_discharge_treated: 0,
          section2_admission_count: 0,
          section2_discharge_count: 0,
          section2_outside_hospital: 0,
          section2_admission_treated: 0,
          section2_hospitalization_count: 0,
          section2_discharge_treated: 0,
          section3_admission_count: 0,
          section3_discharge_count: 0,
          section3_outside_hospital: 0,
          section3_hospitalization_count: 0,
          section4_daily_users: 0,
          section5_daily_users: 0,
          section6_daily_users: 0,
          section7_daily_users: 0,
          section_names: {
            section4: 'ABCD1',
            section5: 'ABCD2',
            section6: 'ABCD3',
            section7: 'ABCD4'
          }
        },
        hospital_type: 'welfare'
      };
      
      setFormData(emptyForm);
      setFormDataSubmit(emptyForm);
      setInitialFormData(JSON.parse(JSON.stringify(emptyForm)));
      initialFormDataRef.current = JSON.parse(JSON.stringify(emptyForm));
      setReportStatus(null);
      setReportId(null);
      setReportExists(false);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoadingReport(false);
      setLoading(false);
      isLoadingDataRef.current = false;
      hasLoadedDataRef.current = true;
    }
  }, []);

  // Handle date change
  const handleDateChange = async (newDate) => {
    // Check if date is actually changing
    if (newDate.getTime() === reportDate.getTime()) {
      return;
    }

    if (isEditingFromView && originalReportDate) {
      // When editing from view mode, check if date is different from original
      const isDateChanged = newDate.getTime() !== originalReportDate.getTime();
      
      if (isDateChanged) {
        // Warn user that changing date will create a new report
        setConfirmDialog({
          open: true,
          title: 'レポート日付変更',
          message: '日付を変更すると、新しいレポートの作成になります。現在のレポートデータは新しい日付のレポートとして保存されます。続行しますか？',
          action: () => {
            setReportDate(newDate);
            loadReportData(newDate, true);
          },
          actionType: 'dateChangeFromView'
        });
      } else {
        // Same date, normal reload
        setReportDate(newDate);
        if (reportIdFromUrl) {
          loadReportById(reportIdFromUrl);
        } else {
          loadReportData(newDate, true);
        }
      }
    } else {
      // Normal date change logic
      setReportDate(newDate);
      loadReportData(newDate, true);
    }
  };

  // Navigate to previous day
  const handlePreviousDay = () => {
    const newDate = new Date(reportDate);
    newDate.setDate(newDate.getDate() - 1);
    handleDateChange(newDate);
  };

  // Navigate to next day
  const handleNextDay = () => {
    const newDate = new Date(reportDate);
    newDate.setDate(newDate.getDate() + 1);
    handleDateChange(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    handleDateChange(new Date());
  };

  // Save as draft
  const handleSaveDraft = async () => {
    const hospitalId = currentHospitalRef.current?.id;
    
    if (!hospitalId) {
      showSnackbar('福祉施設が選択されていません', 'error');
      return;
    }

    if (!formDataSubmit) {
      showSnackbar('保存するデータがありません', 'error');
      return;
    }

    setSavingDraft(true);
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report-welfare/submit`, {
        ...formDataSubmit,
        hospital_id: hospitalId,
        report_date: formatDateForAPI(reportDate),
        is_draft: true
      });

      if (response.data.success) {
        setReportStatus('draft');
        setReportExists(true);
        setReportId(response.data.report?.id);
        setInitialFormData(JSON.parse(JSON.stringify(formData)));
        initialFormDataRef.current = JSON.parse(JSON.stringify(formData));
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        
        // If editing from view with changed date, update original date
        if (isEditingFromView && originalReportDate && 
            reportDate.getTime() !== originalReportDate.getTime()) {
          setOriginalReportDate(reportDate);
        }
        
        showSnackbar('福祉施設レポートを下書き保存しました', 'success');
      } else {
        showSnackbar(response.data.message || '下書きの保存に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error saving welfare draft:', error);
      const errorMessage = error.response?.data?.message || '下書きの保存に失敗しました';
      showSnackbar(errorMessage, 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit report
  const handleSubmit = async () => {
    const hospitalId = currentHospitalRef.current?.id;
    
    if (!hospitalId) {
      showSnackbar('福祉施設が選択されていません', 'error');
      return;
    }

    if (!formDataSubmit) {
      showSnackbar('提出するデータがありません', 'error');
      return;
    }

    setConfirmDialog({
      open: true,
      title: '福祉施設レポートを提出しますか？',
      message: reportExists 
        ? '既存のレポートを更新して提出します。この操作は取り消せません。'
        : '新しいレポートを提出します。この操作は取り消せません。',
      action: async () => {
        await performSubmit(formDataSubmit);
      },
      actionType: 'submit'
    });
  };

  // Perform actual submission
  const performSubmit = async (data) => {
    const hospitalId = currentHospitalRef.current?.id;
    
    setSubmitting(true);
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report-welfare/submit`, {
        ...data,
        hospital_id: hospitalId,
        report_date: formatDateForAPI(reportDate),
        is_draft: false
      });

      if (response.data.success) {
        setReportStatus('submitted');
        setReportExists(true);
        setReportId(response.data.report?.id);
        setInitialFormData(JSON.parse(JSON.stringify(data)));
        initialFormDataRef.current = JSON.parse(JSON.stringify(data));
        setHasUnsavedChanges(false);
        setValidationErrors({});
        
        // If editing from view with changed date, update original date
        if (isEditingFromView && originalReportDate && 
            reportDate.getTime() !== originalReportDate.getTime()) {
          setOriginalReportDate(reportDate);
        }
        
        showSnackbar('福祉施設レポートを提出しました', 'success');
        
        // Close confirmation dialog
        setConfirmDialog({ ...confirmDialog, open: false });
        
        // If editing from view mode, redirect back to view page
        if (isEditingFromView && response.data.report?.id) {
          // Redirect to view page after submission
          setTimeout(() => {
            navigate(`/report-view?id=${response.data.report.id}&type=welfare`);
          }, 1500);
        }
      } else {
        showSnackbar(response.data.message || 'レポートの提出に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error submitting welfare report:', error);
      const errorMessage = error.response?.data?.message || 'レポートの提出に失敗しました';
      showSnackbar(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form data change
  const handleFormDataChange = useCallback((newData) => {
    // Don't update if we're currently loading data
    if (isLoadingDataRef.current) {
      return;
    }

    const currentData = formDataRef.current;
    
    // Check if data has actually changed
    if (currentData && JSON.stringify(newData) === JSON.stringify(currentData)) {
      return;
    }
    
    console.log('Form data changed:', newData);
    setFormDataSubmit(newData);
    formDataRef.current = newData;
    
    // Check if there are changes from initial data
    const initialData = initialFormDataRef.current;
    if (initialData) {
      const hasActualChanges = JSON.stringify(newData) !== JSON.stringify(initialData);
      setHasUnsavedChanges(hasActualChanges);
    } else {
      setHasUnsavedChanges(true);
    }
  }, []);

  // Snackbar helper
  const showSnackbar = (message, severity = 'success', duration = 6000) => {
    setSnackbar({ 
      open: true, 
      message, 
      severity,
      duration 
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle confirmation dialog actions
  const handleConfirmAction = () => {
    if (confirmDialog.action) {
      confirmDialog.action();
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleCancelAction = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // Refresh current report
  const handleRefresh = () => {
    if (reportIdFromUrl) {
      loadReportById(reportIdFromUrl);
    } else {
      loadReportData(reportDate, true);
    }
  };

  // Handle back to report list or view
const handleBack = () => {
  if (isEditingFromView && reportIdFromUrl) {
    // If editing from view mode and we have a report ID, go back to view
    navigate(`/report-view?id=${reportIdFromUrl}&type=welfare`);
  } else {
    // Always go directly back to report list without confirmation
    navigate('/report-list');
  }
};

  // Load initial data
  useEffect(() => {
    // Only load data once when component mounts or when key dependencies change
    const shouldLoadData = currentHospital?.id && !initialLoadRef.current;
    
    if (shouldLoadData) {
      initialLoadRef.current = true;
      
      // If we have reportId in URL (coming from view mode), load by ID
      if (reportIdFromUrl) {
        console.log('Loading welfare report by ID:', reportIdFromUrl);
        loadReportById(reportIdFromUrl);
      } else {
        // Otherwise, load by date as normal
        console.log('Loading welfare report by date:', reportDate, 'hospital:', currentHospital.id);
        loadReportData(reportDate);
      }
    } else if (!currentHospital?.id) {
      setLoading(false);
    }
  }, [currentHospital?.id, reportDate, loadReportData, loadReportById, reportIdFromUrl]);

  // Handle new hospital prop
  useEffect(() => {
    if (newHospital && newHospital.id) {
      // Update the current hospital with the new hospital data
      setCurrentHospital({
        id: newHospital.id,
        name: newHospital.name,
        type: newHospital.type
      });
      
      // Reset loading states
      setLoading(true);
      setLoadingReport(true);
      
      // Update the ref immediately
      currentHospitalRef.current = {
        id: newHospital.id,
        name: newHospital.name,
        type: newHospital.type
      };
      
      // Clear existing data
      setFormData(null);
      setFormDataSubmit(null);
      setInitialFormData(null);
      setReportStatus(null);
      setReportId(null);
      setReportExists(false);
      setHospitalType('welfare');
      setHasUnsavedChanges(false);
      setValidationErrors({});
      
      // If we have a reportId from URL (edit mode), reload by ID
      if (reportIdFromUrl) {
        console.log('Reloading welfare report by ID with new hospital:', newHospital.id);
        loadReportById(reportIdFromUrl);
      } else {
        // Otherwise reload by date with new hospital
        console.log('Reloading welfare report by date with new hospital:', newHospital.id);
        loadReportData(reportDate, true);
      }
    }
  }, [newHospital]);

  // Check if form is read-only (not draft status)
  const isReadOnly = reportStatus && reportStatus !== 'draft';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Root
        header={
          <WelfareReportHeader
            title={`福祉施設レポート - ${formatJapaneseDate(reportDate)}`}
            reportDate={reportDate}
            reportStatus={reportStatus}
            loadingReport={loadingReport}
            onDateChange={handleDateChange}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
            onToday={handleToday}
            onRefresh={handleRefresh}
            onBack={handleBack}
            onSaveDraft={handleHeaderSaveDraft}
            onSubmit={handleHeaderSubmit}
            hasUnsavedChanges={hasUnsavedChanges}
            isSubmitting={submitting}
            isSavingDraft={savingDraft}
            hospitalName={currentHospital?.name}
            readOnly={isReadOnly}
            isEditingFromView={isEditingFromView}
          />
        }
        content={
          <Container 
            maxWidth={false} 
            disableGutters={isMobile}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          > 
            {/* Loading Overlay - only show during initial load */}
            {loading && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}>
                <CircularProgress size={60} thickness={4} />
                <Typography sx={{ mt: 2, color: '#666', fontSize: '0.875rem' }}>
                  {reportIdFromUrl ? '福祉施設レポートを読み込み中...' : 'データを読み込み中...'}
                </Typography>
              </Box>
            )}
            
            {/* Offline Status */}
            {isOffline && (
              <Alert 
                severity="warning" 
                sx={{ 
                  m: 2, 
                  borderRadius: '8px',
                  alignItems: 'center'
                }}
              >
                オフラインモードです。接続回復後に変更が同期されます。
              </Alert>
            )}
            
            {/* Edit Mode Warning */}
            {isEditingFromView && (
              <Alert 
                severity="info" 
                sx={{ 
                  m: 2, 
                  borderRadius: '8px',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2">
                  {reportIdFromUrl ? '福祉施設レポート編集モードです。' : '編集モードです。'}
                  日付と福祉施設を変更することはできません
                  {originalReportDate && reportDate.getTime() !== originalReportDate.getTime() && (
                    <strong> （日付を変更すると新しいレポートになります）</strong>
                  )}
                </Typography>
              </Alert>
            )}
            
            {/* Main Content */}
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              p: isMobile ? 1 : 3,
              position: 'relative',
              opacity: loading ? 0.5 : 1,
              pointerEvents: loading ? 'none' : 'auto'
            }}>
              {!currentHospital?.id ? (
                // No hospital selected state
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
                  <ErrorOutlineIcon sx={{ fontSize: 64, color: '#ff9800' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    福祉施設が選択されていません
                  </Typography>
                  <Typography sx={{ color: '#666', maxWidth: '400px' }}>
                    福祉施設レポートを作成するには、まず福祉施設を選択してください。
                    レポート一覧から「レポート追加」をクリックして福祉施設を選択してください。
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    sx={{ mt: 2 }}
                  >
                    レポート一覧に戻る
                  </Button>
                </Box>
              ) : loading ? (
                // Initial loading state
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  gap: 2
                }}>
                  <CircularProgress />
                  <Typography sx={{ color: '#666' }}>
                    {reportIdFromUrl ? '福祉施設レポートデータを読み込み中...' : 'データを読み込み中...'}
                  </Typography>
                </Box>
              ) : (
                // Main form
                <React.Suspense fallback={
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    gap: 2
                  }}>
                    <CircularProgress />
                    <Typography sx={{ color: '#666' }}>
                      福祉施設フォームを読み込み中...
                    </Typography>
                  </Box>
                }>
                  <FrameScreen
                    formData={formData}
                    departments={departments}
                    doctors={doctors}
                    hospitalId={currentHospital?.id}
                    onFormDataChange={handleFormDataChange}
                    loading={loadingReport}
                    reportDate={reportDate}
                    onDateChange={handleDateChange}
                    onSaveDraft={handleSaveDraft}
                    onSubmit={handleSubmit}
                    onValidate={() => {}}
                    isSubmitting={submitting}
                    isSavingDraft={savingDraft}
                    reportStatus={reportStatus}
                    readOnly={isReadOnly}
                    showSnackbar={showSnackbar}
                    onHeaderSaveDraft={setFrameScreenSaveDraft}
                    onHeaderSubmit={setFrameScreenSubmit}
                    isEditingFromView={isEditingFromView}
                    hospital_type={hospital_type}
                  />
                </React.Suspense>
              )}
            </Box>
            
            {/* Sync Progress */}
            {syncStatus === 'syncing' && (
              <LinearProgress 
                sx={{ 
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3
                }} 
              />
            )}
          </Container>
        }
      />
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelAction}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #e0e0e0',
          pb: 2,
          fontWeight: 600
        }}>
          {confirmDialog.title}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button 
            onClick={handleCancelAction}
            variant="outlined"
            disabled={submitting || savingDraft}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.actionType === 'submit' ? 'primary' : 'warning'}
            disabled={submitting || savingDraft}
            startIcon={
              (submitting || savingDraft) ? 
              <CircularProgress size={20} /> : 
              null
            }
          >
            {confirmDialog.actionType === 'submit' ? '提出する' : '続行する'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default ReportEntrySm;