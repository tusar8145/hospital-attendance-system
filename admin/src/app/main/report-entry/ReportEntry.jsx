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
  LinearProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import { CommonHeader } from '../../shared-components/new/CommonHeader';
import { useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja';

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

  // Validate duty staff
  const dutyStaffPositions = [
    "security",
    "medical_affairs", 
    "medical_affairs_2",
    "security_2",
    "medical_affairs_3",
    "internal_medicine"
  ];
  
  if (!formData.duty_staff || formData.duty_staff.length === 0) {
    errors.duty_staff = '当直スタッフは必須です';
  } else {
    dutyStaffPositions.forEach((position, index) => {
      const staff = formData.duty_staff.find(s => s.position === position);
      if (!staff?.staff_name_1?.trim()) {
        errors[`duty_staff_${position}_1`] = `${position === 'security' ? '保安' : position === 'medical_affairs' ? '医事' : '内科'}の1人目のスタッフ名は必須です`;
      }
      if (!staff?.staff_name_2?.trim()) {
        errors[`duty_staff_${position}_2`] = `${position === 'security' ? '保安' : position === 'medical_affairs' ? '医事' : '内科'}の2人目のスタッフ名は必須です`;
      }
    });
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

function ReportEntry() {
  const { t } = useTranslation('shared-components');
  const { hospital } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));

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
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');
  
  // Ref for form data to avoid stale closures
  const formDataRef = useRef(formData);
  const reportDateRef = useRef(reportDate);

  // Update refs when state changes
  useEffect(() => {
    formDataRef.current = formData;
    reportDateRef.current = reportDate;
  }, [formData, reportDate]);

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

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && formData && !isOffline) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000);

      setAutoSaveTimer(timer);

      return () => {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }
      };
    }
  }, [formData, hasUnsavedChanges, isOffline]);

  useEffect(() => {
  return () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
  };
}, [autoSaveTimer]);

  // Format date for display
  const formatJapaneseDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  // Get current date in Japanese format
  const getCurrentJapaneseDate = () => {
    return formatJapaneseDate(new Date());
  };

  // Load report data for selected date
const loadReportData = useCallback(async (date, forceReload = false) => {
  if (!hospital?.id) {
    showSnackbar('病院が選択されていません', 'warning');
    return;
  }

  setLoadingReport(true);
  try {
    const response = await axios.post(apiConfig.reportGetByDate, {
      date: date.toISOString().split('T')[0],
      hospital_id: hospital.id
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
        
        setFormData(formattedReport);
        setInitialFormData(JSON.parse(JSON.stringify(formattedReport)));
        setReportStatus(report.status);
        setReportId(report.id);
        setHasUnsavedChanges(false);
        
        if (!forceReload) {
          showSnackbar(`${formatJapaneseDate(date)}のレポートを読み込みました`, 'info');
        }
      } else {
        // Only reset form if we don't have unsaved changes
        if (!hasUnsavedChanges || forceReload) {
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
          setReportStatus(null);
          setReportId(null);
          setHasUnsavedChanges(false);
          
          if (!forceReload) {
            showSnackbar('新しいレポートを作成できます', 'info');
          }
        }
      }
      
      setValidationErrors({});
    }
  } catch (error) {
    console.error('Error loading report:', error);
    const errorMessage = error.response?.data?.message || 'レポートの読み込みに失敗しました';
    
    // Only show error if we're not already in error state
    if (!formData || forceReload) {
      showSnackbar(errorMessage, 'error');
      
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
      setReportStatus(null);
      setReportId(null);
    }
  } finally {
    setLoadingReport(false);
    setLoading(false);
  }
}, [hospital?.id]); // Only depend on hospital.id

// Update the useEffect that calls loadReportData
useEffect(() => {
  if (hospital?.id) {
    // Add a check to prevent unnecessary calls
    const currentDateStr = reportDate.toISOString().split('T')[0];
    const shouldLoad = !formData || 
                      (reportDate.getTime() !== new Date(formData.report_date).getTime());

    if (shouldLoad) {
      loadReportData(reportDate);
    }
  } else {
    setLoading(false);
  }
}, [hospital?.id, reportDate, loadReportData]); 

  // Handle date change
const handleDateChange = async (newDate) => {
  // Check if date is actually changing
  if (newDate.getTime() === reportDate.getTime()) {
    return;
  }

  if (hasUnsavedChanges) {
    setConfirmDialog({
      open: true,
      title: '未保存の変更があります',
      message: '日付を変更すると現在の変更が失われます。続行しますか？',
      action: () => {
        setReportDate(newDate);
        loadReportData(newDate, true);
      },
      actionType: 'dateChange'
    });
  } else {
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

  // Auto-save draft
  const handleAutoSave = async () => {
    if (!formDataRef.current || !hospital?.id || isOffline) return;

    try {
      const response = await axios.post(apiConfig.reportSubmit, {
        ...formDataRef.current,
        hospital_id: hospital.id,
        report_date: reportDateRef.current.toISOString().split('T')[0],
        is_draft: true
      });

      if (response.data.success) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        if (response.data.is_new) {
          setReportExists(true);
          setReportId(response.data.report?.id);
        }
        setReportStatus('draft');
        
        if (process.env.NODE_ENV === 'development') {
          showSnackbar('下書きを自動保存しました', 'info');
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Save as draft
  const handleSaveDraft = async (data) => {
    if (!hospital?.id) {
      showSnackbar('病院が選択されていません', 'error');
      return;
    }

    setSavingDraft(true);
    try {
      const response = await axios.post(apiConfig.reportSubmit, {
        ...data,
        hospital_id: hospital.id,
        report_date: reportDate.toISOString().split('T')[0],
        is_draft: true
      });

      if (response.data.success) {
        setReportStatus('draft');
        setReportExists(true);
        setReportId(response.data.report?.id);
        setInitialFormData(JSON.parse(JSON.stringify(data)));
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        
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

  // Submit report
  const handleSubmit = async (data) => {
    if (!hospital?.id) {
      showSnackbar('病院が選択されていません', 'error');
      return;
    }

    // Validate form data
    const validation = validateReportData(data);
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
        await performSubmit(data);
      },
      actionType: 'submit'
    });
  };

  // Perform actual submission
  const performSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await axios.post(apiConfig.reportSubmit, {
        ...data,
        hospital_id: hospital.id,
        report_date: reportDate.toISOString().split('T')[0],
        is_draft: false
      });

      if (response.data.success) {
        setReportStatus('submitted');
        setReportExists(true);
        setReportId(response.data.report?.id);
        setInitialFormData(JSON.parse(JSON.stringify(data)));
        setHasUnsavedChanges(false);
        setValidationErrors({});
        
        showSnackbar('レポートを提出しました', 'success');
        
        // Close confirmation dialog
        setConfirmDialog({ ...confirmDialog, open: false });
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
  // Add a deep comparison to prevent unnecessary updates
  const currentData = formDataRef.current;
  const hasChanges = currentData ? JSON.stringify(newData) !== JSON.stringify(currentData) : true;
  
  if (hasChanges) {
    setFormData(newData);
    
    // Update ref immediately
    formDataRef.current = newData;
    setFormData(newData);
    // Check if there are changes from initial data
    if (initialFormData) {
      const changesFromInitial = JSON.stringify(newData) !== JSON.stringify(initialFormData);
      setHasUnsavedChanges(changesFromInitial);
    } else {
      setHasUnsavedChanges(true);
    }
  }
}, [initialFormData]);

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
  if (hasUnsavedChanges) {
    setConfirmDialog({
      open: true,
      title: '未保存の変更があります',
      message: '更新すると現在の変更が失われます。続行しますか？',
      action: () => loadReportData(reportDate, true),
      actionType: 'refresh'
    });
  } else {
    loadReportData(reportDate, true);
  }
};

  // Sync offline data
  const handleSync = async () => {
    if (isOffline) {
      showSnackbar('オフライン状態です。ネットワーク接続を確認してください。', 'warning');
      return;
    }

    setSyncStatus('syncing');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSyncStatus('success');
      showSnackbar('データの同期が完了しました', 'success');
    } catch (error) {
      setSyncStatus('error');
      showSnackbar('データの同期に失敗しました', 'error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Load initial data
  useEffect(() => {
    if (hospital?.id) {
      loadReportData(reportDate);
    } else {
      setLoading(false);
    }
  }, [hospital?.id, loadReportData]);

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
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.5,
          borderRadius: '16px',
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}33`,
          gap: 1
        }}
      >
        {React.cloneElement(config.icon, { 
          sx: { 
            fontSize: 14,
            color: config.color 
          } 
        })}
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: config.color
          }}
        >
          {config.label}
        </Typography>
      </Box>
    );
  };

  // Approval button handler (placeholder)
  const handleApproval = () => {
    showSnackbar('承認機能は近日実装予定です', 'info');
  };

  // Additional header buttons
  const additionalButtons = (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      flexWrap: 'wrap'
    }}>
      {/* Date Navigation */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 0.5,
        mr: 2
      }}>
<Tooltip title="前日">
  <span> {/* Add span wrapper */}
    <IconButton 
      size="small" 
      onClick={handlePreviousDay}
      disabled={loadingReport}
    >
      <ArrowBackIcon fontSize="small" />
    </IconButton>
  </span>
</Tooltip>
        
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <DatePicker
            value={reportDate}
            onChange={handleDateChange}
            renderInput={(params) => (
              <Box sx={{ width: isMobile ? 140 : 160 }}>
                <TextField
                  {...params}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: 32,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Box>
            )}
            components={{
              OpenPickerIcon: CalendarTodayIcon
            }}
          />
        </LocalizationProvider>
        
<Tooltip title="翌日">
  <span> {/* Add span wrapper */}
    <IconButton 
      size="small" 
      onClick={handleNextDay}
      disabled={loadingReport}
    >
      <ArrowForwardIcon fontSize="small" />
    </IconButton>
  </span>
</Tooltip>
        
<Tooltip title="今日">
  <span> {/* Add span wrapper */}
    <IconButton 
      size="small" 
      onClick={handleToday}
      disabled={loadingReport}
      sx={{ ml: 0.5 }}
    >
      <TodayIcon fontSize="small" />
    </IconButton>
  </span>
</Tooltip>
      </Box>
      
      {/* Status and Actions */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        borderLeft: '1px solid #e0e0e0',
        pl: 2
      }}>
        {reportStatus && (
          <>
            <Typography variant="body2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>
              ステータス:
            </Typography>
            <StatusBadge status={reportStatus} />
          </>
        )}
        
<Tooltip title="更新">
  <span> {/* Add span wrapper */}
    <IconButton 
      size="small" 
      onClick={handleRefresh}
      disabled={loadingReport}
    >
      <RefreshIcon fontSize="small" />
    </IconButton>
  </span>
</Tooltip>
      </Box>
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Root
        header={
          <CommonHeader
            title={`レポート - ${formatJapaneseDate(reportDate)}`}
            onCreate={handleApproval}
            createButtonText="承認する"
            showFilter={false}
            additionalButtons={additionalButtons}
            sx={{
              px: isMobile ? 2 : 3,
              py: 2
            }}
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
            {/* Loading Overlay */}
            {(loading || loadingReport) && (
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
                  データを読み込み中...
                </Typography>
              </Box>
            )}
            
            {/* Status Bar */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 0,
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {/* Hospital Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                    病院:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0A6AE3' }}>
                    {hospital?.name || '選択されていません'}
                  </Typography>
                </Box>
                
                {/* Report Info */}
                {reportExists && reportId && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                      レポートID:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50' }}>
                      #{reportId}
                    </Typography>
                  </Box>
                )}
                
                {/* Last Saved */}
                {lastSaved && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                      最終保存:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: hasUnsavedChanges ? '#ff9800' : '#4caf50' }}>
                      {formatLastSavedTime()}
                      {hasUnsavedChanges && ' (未保存の変更あり)'}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Sync Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isOffline && (
                  <Tooltip title="オフライン状態です">
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: '12px',
                      backgroundColor: '#fff3e0',
                      border: '1px solid #ff9800'
                    }}>
                      <ErrorOutlineIcon sx={{ fontSize: 14, color: '#ff9800' }} />
                      <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 500 }}>
                        オフライン
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
                
                {syncStatus === 'syncing' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      同期中...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
            
            {/* Main Content */}
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              p: isMobile ? 1 : isTablet ? 2 : 3,
              position: 'relative'
            }}>
              {!hospital?.id ? (
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
                    レポートを作成するには、サイドバーまたは上部のメニューから病院を選択してください。
                  </Typography>
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
                    レポートデータを読み込み中...
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
                  <FrameScreen
                    formData={formData}
                    departments={departments}
                    doctors={doctors}
                    hospitalId={hospital.id}
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

export default ReportEntry;