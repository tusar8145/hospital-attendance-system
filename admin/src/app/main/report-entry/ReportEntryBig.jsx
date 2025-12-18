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

// Lazy load the main report component
const FrameScreen = React.lazy(() => import('./big/FrameScreen'));

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
const ReportEntryHeader = ({ 
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
                {hospitalName}
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

// Validation helper function
const validateReportData = (formData) => {
  const errors = {};
  
  if (!formData || Object.keys(formData).length === 0) {
    errors.general = 'フォームデータが空です';
    return { isValid: false, errors };
  }

  // Validate admission and discharge counts
  if (!formData.admission_count && formData.admission_count !== 0) {
    errors.admission_count = '入院数は必須です';
  } else if (isNaN(parseInt(formData.admission_count))) {
    errors.admission_count = '有効な数値を入力してください';
  }

  if (!formData.discharge_count && formData.discharge_count !== 0) {
    errors.discharge_count = '退院数は必須です';
  } else if (isNaN(parseInt(formData.discharge_count))) {
    errors.discharge_count = '有効な数値を入力してください';
  }

  // Validate emergency transport counts
  if (!formData.emergency_transport && formData.emergency_transport !== 0) {
    errors.emergency_transport = '緊急搬入数は必須です';
  } else if (isNaN(parseInt(formData.emergency_transport))) {
    errors.emergency_transport = '有効な数値を入力してください';
  }

  if (!formData.post_transport_admission && formData.post_transport_admission !== 0) {
    errors.post_transport_admission = '搬入後入院件数は必須です';
  } else if (isNaN(parseInt(formData.post_transport_admission))) {
    errors.post_transport_admission = '有効な数値を入力してください';
  }

  // Validate shift nurses
  if (!formData.shift_nurses || formData.shift_nurses.length === 0) {
    errors.shift_nurses = '外来看護師は必須です';
  } else {
    const hasEarlyNight = formData.shift_nurses.some(nurse => nurse.shift_type === 0 && nurse.nurse_name?.trim());
    const hasLateNight = formData.shift_nurses.some(nurse => nurse.shift_type === 1 && nurse.nurse_name?.trim());
    
    if (!hasEarlyNight) {
      errors.shift_nurses = '準夜勤の看護師が少なくとも1名必要です';
    }
    if (!hasLateNight) {
      errors.shift_nurses = errors.shift_nurses 
        ? errors.shift_nurses + '、深夜勤の看護師が少なくとも1名必要です'
        : '深夜勤の看護師が少なくとも1名必要です';
    }
  } 

  // Validate consolidated data
  if (!formData.report_details || formData.report_details.length === 0) {
    errors.report_details = '診療部門データは必須です';
  } else {
    formData.report_details.forEach((detail, index) => {
      if (!detail.department_id) {
        errors[`report_details_${index}_department`] = '診療区の選択は必須です';
      }
      if (!detail.patient_count && detail.patient_count !== 0) {
        errors[`report_details_${index}_patient_count`] = '患者数は必須です';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
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

// Helper function to determine hospital priority
const getCurrentHospital = (hospitalFromContext, urlParams, hasHospitalChangedFromContext) => {
  // If user has changed hospital from context, use context
  if (hasHospitalChangedFromContext && hospitalFromContext?.id) {
    return {
      id: hospitalFromContext.id,
      name: hospitalFromContext.name,
      type: hospitalFromContext.type
    };
  }
  
  // Otherwise, use URL parameter (initial load)
  if (urlParams.hospitalId) {
    return {
      id: parseInt(urlParams.hospitalId, 10), // Ensure it's a number
      name: hospitalFromContext?.name || `Hospital ID: ${urlParams.hospitalId}`,
      type: hospitalFromContext?.type || urlParams.type
    };
  }
  
  // Fallback to context
  return hospitalFromContext ? {
    id: hospitalFromContext.id,
    name: hospitalFromContext.name,
    type: hospitalFromContext.type
  } : null;
};

// Function to check if form data has actual changes (ignores empty strings vs null)
const hasFormDataChanged = (currentData, initialData) => {
  if (!currentData || !initialData) {
    return true;
  }
  
  // Compare key fields that matter
  const fieldsToCompare = [
    'admission_count',
    'discharge_count',
    'external_morning',
    'external_afternoon',
    'external_duty',
    'emergency_transport',
    'post_transport_admission',
    'visit_count',
    'special_notes',
    'shift_nurses',
    'duty_staff',
    'report_details'
  ];
  
  for (const field of fieldsToCompare) {
    const current = currentData[field];
    const initial = initialData[field];
    
    // Handle arrays
    if (Array.isArray(current) && Array.isArray(initial)) {
      if (field === 'shift_nurses') {
        // For shift nurses, compare cleaned data
        const currentClean = current
          .filter(n => n.nurse_name?.trim())
          .map(n => ({ ...n, nurse_name: n.nurse_name?.trim() }));
        const initialClean = initial
          .filter(n => n.nurse_name?.trim())
          .map(n => ({ ...n, nurse_name: n.nurse_name?.trim() }));
        
        if (JSON.stringify(currentClean) !== JSON.stringify(initialClean)) {
          return true;
        }
      } else if (field === 'report_details') {
        // For report details, compare cleaned data
        const currentClean = current
          .filter(item => item.department_id && (item.patient_count || item.patient_count === 0))
          .map(item => ({
            department_id: item.department_id,
            patient_count: item.patient_count || 0
          }));
        const initialClean = initial
          .filter(item => item.department_id && (item.patient_count || item.patient_count === 0))
          .map(item => ({
            department_id: item.department_id,
            patient_count: item.patient_count || 0
          }));
        
        if (JSON.stringify(currentClean) !== JSON.stringify(initialClean)) {
          return true;
        }
      } else if (JSON.stringify(current) !== JSON.stringify(initial)) {
        return true;
      }
    } 
    // Handle numbers (including 0)
    else if ((field.includes('_count') || field.includes('transport') || field.includes('visit')) && 
             (current || current === 0) && (initial || initial === 0)) {
      if (parseInt(current) !== parseInt(initial)) {
        return true;
      }
    }
    // Handle strings (ignore empty vs null/undefined)
    else if (field === 'special_notes') {
      const currentTrimmed = (current || '').trim();
      const initialTrimmed = (initial || '').trim();
      if (currentTrimmed !== initialTrimmed) {
        return true;
      }
    }
    // Handle other fields
    else if (current !== initial) {
      return true;
    }
  } 
  
  return false;
};

function ReportEntryBig({newHospital}) {
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
  
  // Track if hospital has been changed from context
  const [hasHospitalChangedFromContext, setHasHospitalChangedFromContext] = useState(false);
  
  // Current hospital state - determines priority
  const [currentHospital, setCurrentHospital] = useState(() => 
    getCurrentHospital(hospitalFromContext, urlParams, false)
  );

  // State management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [formData, setFormData] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reportDate, setReportDate] = useState(new Date());
  const [reportStatus, setReportStatus] = useState(null);
  const [reportExists, setReportExists] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [hospital_type, sethospital_type] = useState(null);
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
  
  // Refs for form data to avoid stale closures
  const formDataRef = useRef(formData);
  const reportDateRef = useRef(reportDate);
  const currentHospitalRef = useRef(currentHospital);
  const initialFormDataRef = useRef(null);
  
  // Track if we're currently loading data to prevent flickering
  const isLoadingDataRef = useRef(false);
  
  // Track if we've already loaded data for current state
  const hasLoadedDataRef = useRef(false);
  
  // Add a ref to track initial load
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

  const { hospital, toggleHospital } = useTheme();

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

  // Load report data by ID when coming from view mode - FIXED: useCallback with proper dependencies
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
      const response = await axios.post(`${apiConfig.baseURL}/report/get-by-id`, {
        report_id: reportIdToLoad
      });

      const { data } = response.data;
      
      if (data && data.success !== false) {
        const { report, departments: depts, doctors: docs } = data;
        
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
            admission_count: report.admission_count || 0,
            discharge_count: report.discharge_count || 0,
            external_morning: report.external_morning || 0,
            external_afternoon: report.external_afternoon || 0,
            external_duty: report.external_duty || 0,
            emergency_transport: report.emergency_transport || 0,
            post_transport_admission: report.post_transport_admission || 0,
            visit_count: report.visit_count || 0,
            shift_nurses: report.shift_nurses || [],
            duty_staff: report.duty_staff || [],
            report_details: report.report_details || []
          };
          sethospital_type(report.hospital_type)
          setFormData(formattedReport);
          setInitialFormData(JSON.parse(JSON.stringify(formattedReport)));
          initialFormDataRef.current = JSON.parse(JSON.stringify(formattedReport));
          setReportStatus(report.status);
          setReportId(report.id);
          setHasUnsavedChanges(false);
          
          showSnackbar(`${formatJapaneseDate(new Date(report.report_date))}のレポートを読み込みました`, 'info');
        } else {
          sethospital_type(null)
        }
        
        setValidationErrors({});
      }
    } catch (error) {
      console.error('Error loading report by ID:', error);
      const errorMessage = error.response?.data?.message || 'レポートの読み込みに失敗しました';
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

  // Load report data for selected date (normal flow) - FIXED: useCallback with proper dependencies
  const loadReportData = useCallback(async (date, forceReload = false) => {

    const hospitalId = currentHospitalRef.current?.id;
        
    console.log(newHospital,'<<<<<<<<reportIdToLoad',hospital)

    if (!hospitalId) {
      showSnackbar('病院が選択されていません', 'warning');
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
      const response = await axios.post(`${apiConfig.baseURL}/report/get-by-date-table`, {
        date: formatDateForAPI(date),
        hospital_id: hospitalId
      });

      const { data } = response.data;
      
      if (data && data.success !== false) {
        const { report, departments: depts, doctors: docs, exists } = data;
        
        // Always update departments and doctors
        setDepartments(depts || []);
        setDoctors(docs || []);
        setReportExists(exists);
        
        if (exists && report) {
          // Format the report data for the form
          const formattedReport = {
            id: report.id,
            report_no: report.report_no,
            status: report.status,
            special_notes: report.special_notes || '',
            admission_count: report.admission_count || 0,
            discharge_count: report.discharge_count || 0,
            external_morning: report.external_morning || 0,
            external_afternoon: report.external_afternoon || 0,
            external_duty: report.external_duty || 0,
            emergency_transport: report.emergency_transport || 0,
            post_transport_admission: report.post_transport_admission || 0,
            visit_count: report.visit_count || 0,
            shift_nurses: report.shift_nurses || [],
            duty_staff: report.duty_staff || [],
            report_details: report.report_details || []
          };
          sethospital_type(report.hospital_type)
          setFormData(formattedReport);
          setInitialFormData(JSON.parse(JSON.stringify(formattedReport)));
          initialFormDataRef.current = JSON.parse(JSON.stringify(formattedReport));
          setReportStatus(report.status);
          setReportId(report.id);
          setHasUnsavedChanges(false);
          
          if (!forceReload) {
            showSnackbar(`${formatJapaneseDate(date)}のレポートを読み込みました`, 'info');
          }
        } else {
          sethospital_type(null)
          // Initialize empty form
          const emptyForm = {
            admission_count: 0,
            discharge_count: 0,
            external_morning: 0,
            external_afternoon: 0,
            external_duty: 0,
            emergency_transport: 0,
            post_transport_admission: 0,
            visit_count: 0,
            special_notes: '',
            shift_nurses: [],
            duty_staff: [],
            report_details: []
          };
          
          setFormData(emptyForm);
          setInitialFormData(JSON.parse(JSON.stringify(emptyForm)));
          initialFormDataRef.current = JSON.parse(JSON.stringify(emptyForm));
          setReportStatus(null);
          setReportId(null);
          setReportExists(false);
          setHasUnsavedChanges(false);
          
          if (!forceReload) {
            showSnackbar('新しいレポートを作成できます', 'info');
          }
        }
        
        setValidationErrors({});
      }
    } catch (error) {
      console.error('Error loading report:', error);
      const errorMessage = error.response?.data?.message || 'レポートの読み込みに失敗しました';
      
      // Initialize empty form on error
      const emptyForm = {
        admission_count: 0,
        discharge_count: 0,
        external_morning: 0,
        external_afternoon: 0,
        external_duty: 0,
        emergency_transport: 0,
        post_transport_admission: 0,
        visit_count: 0,
        special_notes: '',
        shift_nurses: [],
        duty_staff: [],
        report_details: []
      };
      setFormData(emptyForm);
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
  }, [hospital,newHospital]);

  // Handle date change
  const handleDateChange = async (newDate) => {
    // Check if date is actually changing
    if (newDate.getTime() === reportDate.getTime()) {
      return;
    }

    // Check if there are actual unsaved changes
    const currentData = formDataRef.current;
    const initialData = initialFormDataRef.current;
    
    // Use the improved comparison function
    const hasActualChanges = currentData && initialData ? 
      hasFormDataChanged(currentData, initialData) : false;

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
        // Same date, normal reload - only warn if there are actual changes
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

  // Save as draft - this is the parent's version, FrameScreen will have its own
  const handleSaveDraft = async () => {
    const hospitalId = currentHospitalRef.current?.id;
    
    if (!hospitalId) {
      showSnackbar('病院が選択されていません', 'error');
      return;
    }

    if (!formData) {
      showSnackbar('保存するデータがありません', 'error');
      return;
    }

    setSavingDraft(true);
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report/submit`, {
        ...formData,
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
        
        showSnackbar('下書きを保存しました', 'success');
      } else {
        showSnackbar(response.data.message || '下書きの保存に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      const errorMessage = error.response?.data?.message || '下書きの保存に失敗しました';
      showSnackbar(errorMessage, 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit report - this is the parent's version, FrameScreen will have its own
  const handleSubmit = async () => {
    const hospitalId = currentHospitalRef.current?.id;
    
    if (!hospitalId) {
      showSnackbar('病院が選択されていません', 'error');
      return;
    }

    if (!formData) {
      showSnackbar('提出するデータがありません', 'error');
      return;
    }

    // Validate form data
    const validation = validateReportData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showSnackbar('フォームにエラーがあります。確認してください。', 'error');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'レポートを提出しますか？',
      message: reportExists 
        ? '既存のレポートを更新して提出します。この操作は取り消せません。'
        : '新しいレポートを提出します。この操作は取り消せません。',
      action: async () => {
        await performSubmit(formData);
      },
      actionType: 'submit'
    });
  };

  // Perform actual submission
  const performSubmit = async (data) => {
    const hospitalId = currentHospitalRef.current?.id;
    
    setSubmitting(true);
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report/submit`, {
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
        
        showSnackbar('レポートを提出しました', 'success');
        
        // Close confirmation dialog
        setConfirmDialog({ ...confirmDialog, open: false });
        
        // If editing from view mode, redirect back to view page
        if (isEditingFromView && response.data.report?.id) {
          // Get type from URL params
          const params = getUrlParams();
          const type = params.type || '1';
          
          // Redirect to view page after submission
          setTimeout(() => {
            navigate(`/report-view?id=${response.data.report.id}&type=${type}`);
          }, 1500);
        }
      } else {
        showSnackbar(response.data.message || 'レポートの提出に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
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
    
    setFormData(newData);
    formDataRef.current = newData;
    
    // Check if there are changes from initial data
    const initialData = initialFormDataRef.current;
    if (initialData) {
      const hasActualChanges = hasFormDataChanged(newData, initialData);
      setHasUnsavedChanges(hasActualChanges);
    } else {
      setHasUnsavedChanges(true);
    }
  }, []);

  // Handle form validation request
  const handleValidate = () => {
    if (!formData) return { isValid: false, errors: {} };
    
    const validation = validateReportData(formData);
    setValidationErrors(validation.errors);
    return validation;
  };

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
    const currentData = formDataRef.current;
    const initialData = initialFormDataRef.current;
    const hasActualChanges = currentData && initialData ? 
      hasFormDataChanged(currentData, initialData) : false;

    if (hasActualChanges) {
      setConfirmDialog({
        open: true,
        title: '未保存の変更があります',
        message: '更新すると現在の変更が失われます。続行しますか？',
        action: () => {
          // If we have reportId from URL, load by ID, otherwise load by date
          if (reportIdFromUrl) {
            loadReportById(reportIdFromUrl);
          } else {
            loadReportData(reportDate, true);
          }
        },
        actionType: 'refresh'
      });
    } else {
      if (reportIdFromUrl) {
        loadReportById(reportIdFromUrl);
      } else {
        loadReportData(reportDate, true);
      }
    }
  };

  // Handle back to report list or view
  const handleBack = () => {
    const currentData = formDataRef.current;
    const initialData = initialFormDataRef.current;
    const hasActualChanges = currentData && initialData ? 
      hasFormDataChanged(currentData, initialData) : false;

    if (isEditingFromView && reportIdFromUrl) {
      // If editing from view mode and we have a report ID, go back to view
      const params = getUrlParams();
      const type = params.type || '1';
      navigate(`/report-view?id=${reportIdFromUrl}&type=${type}`);
    } else if (hasActualChanges) {
      // Show confirmation for unsaved changes
      setConfirmDialog({
        open: true,
        title: '未保存の変更があります',
        message: '戻ると現在の変更が失われます。保存せずに戻りますか？',
        action: () => navigate('/report-list'),
        actionType: 'back'
      });
    } else {
      navigate('/report-list');
    }
  };

  // Load initial data - FIXED with better tracking
  useEffect(() => {
    // Only load data once when component mounts or when key dependencies change
    const shouldLoadData = currentHospital?.id && !initialLoadRef.current;
    
    if (shouldLoadData) {
      initialLoadRef.current = true;
      
      // If we have reportId in URL (coming from view mode), load by ID
      if (reportIdFromUrl) {
        console.log('Loading by report ID:', reportIdFromUrl);
        loadReportById(reportIdFromUrl);
      } else {
        // Otherwise, load by date as normal
        console.log('Loading by date:', reportDate, 'hospital:', currentHospital.id);
        loadReportData(reportDate);
      }
    } else if (!currentHospital?.id) {
      setLoading(false);
    }
  }, [currentHospital?.id, reportDate, loadReportData, loadReportById, reportIdFromUrl]);



useEffect(() => {
  console.log('?????????????????????', newHospital);
  
  if (newHospital && newHospital.id) {
    // Update the current hospital with the new hospital data
    setCurrentHospital({
      id: newHospital.id,
      name: newHospital.name,
      type: newHospital.type
    });
    
    // Set flag to indicate hospital has been changed from context
    setHasHospitalChangedFromContext(true);
    
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
    setInitialFormData(null);
    setReportStatus(null);
    setReportId(null);
    setReportExists(false);
    sethospital_type(null);
    setHasUnsavedChanges(false);
    setValidationErrors({});
    
    // If we have a reportId from URL (edit mode), reload by ID
    if (reportIdFromUrl) {
      console.log('Reloading report by ID with new hospital:', newHospital.id);
      loadReportById(reportIdFromUrl);
    } else {
      // Otherwise reload by date with new hospital
      console.log('Reloading report by date with new hospital:', newHospital.id);
      loadReportData(reportDate, true);
    }
  }
}, [newHospital]);

  



  // Effect to handle when hospital context changes
  useEffect(() => {
    if (hospitalFromContext?.id && !hasHospitalChangedFromContext) {
      setCurrentHospital({
        id: hospitalFromContext.id,
        name: hospitalFromContext.name,
        type: hospitalFromContext.type
      });
    }
  }, [hospitalFromContext, hasHospitalChangedFromContext]);

  // Format time for last saved display
  const formatLastSavedTime = () => {
    if (!lastSaved) return 'まだ保存されていません';
    
    const now = new Date();
    const diffMs = now - lastSaved;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
  };

  // Check if form is read-only (not draft status)
  const isReadOnly = reportStatus && reportStatus !== 'draft';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Root
        header={
          <ReportEntryHeader
            title={`レポート - ${formatJapaneseDate(reportDate)}`}
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
                  {reportIdFromUrl ? 'レポートを読み込み中...' : 'データを読み込み中...'}
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
                  {reportIdFromUrl ? 'レポート編集モードです。' : '編集モードです。'}
                  日付と病院を変更することはできません
                  {originalReportDate && reportDate.getTime() !== originalReportDate.getTime() && (
                    <strong> （日付と病院を変更することはできません）</strong>
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
                    病院が選択されていません
                  </Typography>
                  <Typography sx={{ color: '#666', maxWidth: '400px' }}>
                    レポートを作成するには、まず病院を選択してください。
                    レポート一覧から「レポート追加」をクリックして病院を選択してください。
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
                    {reportIdFromUrl ? 'レポートデータを読み込み中...' : 'データを読み込み中...'}
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
                      フォームを読み込み中...
                    </Typography>
                  </Box>
                }>
                  {hospital_type === 'large_hospital' ? (
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
                      onValidate={handleValidate}
                      isSubmitting={submitting}
                      isSavingDraft={savingDraft}
                      reportStatus={reportStatus}
                      readOnly={isReadOnly}
                      showSnackbar={showSnackbar}
                      onHeaderSaveDraft={setFrameScreenSaveDraft}
                      onHeaderSubmit={setFrameScreenSubmit}
                      isEditingFromView={isEditingFromView}
                    />
                  ) : hospital_type === 'hospital' ? (
                    <Alert severity="warning">Hospital</Alert>
                  ) : hospital_type === 'welfare' ? (
                    <Alert severity="warning">Welfare</Alert>
                  ) : hospital?.type === 'large_hospital' ? (
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
                      onValidate={handleValidate}
                      isSubmitting={submitting}
                      isSavingDraft={savingDraft}
                      reportStatus={reportStatus}
                      readOnly={isReadOnly}
                      showSnackbar={showSnackbar}
                      onHeaderSaveDraft={setFrameScreenSaveDraft}
                      onHeaderSubmit={setFrameScreenSubmit}
                      isEditingFromView={isEditingFromView}
                    />
                  ) : hospital?.type === 'hospital' ? (
                    <Alert severity="warning">Hospital</Alert>
                  ) : hospital?.type === 'welfare' ? (
                    <Alert severity="warning">Welfare</Alert>
                  ) : (
                    <Alert severity="warning">医療機関タイプが指定されていません</Alert>
                  )}
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

export default ReportEntryBig;