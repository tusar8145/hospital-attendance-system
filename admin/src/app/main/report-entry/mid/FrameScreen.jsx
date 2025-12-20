import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Divider, 
  Stack, 
  TextField, 
  Typography,
  useMediaQuery,
  useTheme,
  Grid,
  CircularProgress,
  IconButton,
  Paper,
  Alert,
  Tooltip,
  Snackbar,
  Tabs,
  Tab
} from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja';
import ConsolidatedContentComponent from './ConsolidatedContentComponent';
import ConsolidatedContentComponentCount from './ConsolidatedContentComponentCount';

import apiConfig from '../../../configs/apiConfig';
import axios from 'axios';

const FrameScreen = React.memo(({
  formData = null,
  departments = [],
  doctors = [],
  hospitalId,
  onFormDataChange,
  loading = false,
  reportDate,
  onDateChange,
  onSaveDraft,
  onSubmit,
  onValidate,
  isSubmitting = false,
  isSavingDraft = false,
  reportStatus = null,
  readOnly = false,
  showSnackbar,
  onHeaderSaveDraft,
  onHeaderSubmit,
  isEditingFromView = false,
  hospital_type = 'hospital'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [date, setDate] = useState(reportDate || new Date());
  const [patientsCount, setPatientsCount] = useState("0");
  const [outpatientsCount, setOutpatientsCount] = useState("0");
  const [nightConsultation, setNightConsultation] = useState("0");
  const [externalConsultation, setExternalConsultation] = useState({
    PET: "0",
    MR: "0",
    CT: "0"
  });

  const [currentStatus, setCurrentStatus] = useState({
    firstRow: Array(21).fill(""),
    secondRow: Array(21).fill(""),
    thirdRow: Array(21).fill("")
  });
  const [specialNotes, setSpecialNotes] = useState("");
  
  // Separate states for both components
  const [consolidatedData, setConsolidatedData] = useState([]); // For ConsolidatedContentComponent
  const [consolidatedDataCount, setConsolidatedDataCount] = useState([]); // For ConsolidatedContentComponentCount
  
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  
  // Track if form data has been loaded
  const [formDataLoaded, setFormDataLoaded] = useState(false);

  // Refs to track form state and prevent flickering
  const isInitialMountRef = useRef(true);
  const previousFormDataRef = useRef(null);
  const loadingRef = useRef(false);

  // Local state for snackbar
  const [localSnackbar, setLocalSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatJapaneseDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  // Initialize form when formData changes
  useEffect(() => {
    // Skip if loading
    if (loading) {
      loadingRef.current = true;
      return;
    }
    
    // If we were loading and now we're not, reset the loading flag
    if (loadingRef.current && !loading) {
      loadingRef.current = false;
    }
    
    // Check if formData has actually changed
    const formDataChanged = previousFormDataRef.current !== formData && 
      JSON.stringify(previousFormDataRef.current) !== JSON.stringify(formData);
    
    if (formData && formDataChanged && !loadingRef.current) {
      console.log('Loading form data into FrameScreen');
      loadFormData(formData);
      previousFormDataRef.current = formData;
      setFormDataLoaded(true);
    } else if ((formData === null || Object.keys(formData).length === 0) && formDataLoaded) {
      console.log('No form data, resetting form');
      resetForm();
      setFormDataLoaded(false);
    }
    
    // Reset formDataLoaded flag when formData becomes null
    if (!formData && formDataLoaded) {
      setFormDataLoaded(false);
    }
  }, [formData, loading]);

  // Load form data from existing report
  const loadFormData = async (data) => {
    console.log('Loading form data:', data);
    
    // Mark that we've loaded form data
    setFormDataLoaded(true);
    
    // Basic stats - always load from form data
    setPatientsCount(data.admission_count?.toString() || "0");
    setOutpatientsCount(data.discharge_count?.toString() || "0");
    setNightConsultation(data.external_duty?.toString() || "0");
    
    // External consultation - ALWAYS load from form data when we have it
    setExternalConsultation({
      PET: data.emergency_transport?.toString() || "0",
      MR: data.post_transport_admission?.toString() || "0",
      CT: data.visit_count?.toString() || "0"
    });
    
    // Special notes
    setSpecialNotes(data.special_notes || "");
    
    // Load data for both components
    // For ConsolidatedContentComponent (doctor-based)
    if (data.report_details && Array.isArray(data.report_details) && data.report_details.length > 0) {
      console.log('Setting consolidated data for doctor-based component:', data.report_details.length, 'items');
      setConsolidatedData(data.report_details);
    } else {
      setConsolidatedData([]);
    }
    
    // For ConsolidatedContentComponentCount (patient count-based)
    if (data.report_details_mid && Array.isArray(data.report_details_mid) && data.report_details_mid.length > 0) {
      console.log('Setting consolidated data for count-based component:', data.report_details_mid.length, 'items');
      setConsolidatedDataCount(data.report_details_mid);
    } else {
      setConsolidatedDataCount([]);
    }
    
    // Clear validation errors when loading data
    setValidationErrors({});
    
    console.log('Form data loading complete');
  };

  // Reset form to initial state (complete reset)
  const resetForm = () => {
    console.log('Resetting form completely');
    setPatientsCount("0");
    setOutpatientsCount("0");
    setNightConsultation("0");
    
    // Reset external consultation
    setExternalConsultation({ 
      PET: "0", 
      MR: "0", 
      CT: "0" 
    });
    
    setCurrentStatus({ 
      firstRow: Array(21).fill(""), 
      secondRow: Array(21).fill(""),
      thirdRow: Array(21).fill("")
    });
    
    setSpecialNotes("");
    
    // Reset consolidated data for both components
    setConsolidatedData([]);
    setConsolidatedDataCount([]);
    
    setValidationErrors({});
    
    console.log('Form reset complete');
  };

  // Handle date navigation
  const handlePreviousDay = () => { 
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    
    if (shouldDisableDate(newDate)) {
      showLocalSnackbar('過去の日付に移動できません', 'warning');
      return;
    }
    
    setDate(newDate);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    
    if (shouldDisableDate(newDate)) {
      showLocalSnackbar('未来の日付は選択できません', 'warning');
      return;
    }
    
    setDate(newDate);
    onDateChange(newDate);
  };

  // Handle date picker change
  const handleDatePickerChange = (newDate) => {
    if (!newDate) return;
    
    if (shouldDisableDate(newDate)) {
      showLocalSnackbar('未来の日付は選択できません', 'warning');
      return;
    }
    
    // Check if date is actually changing
    if (newDate.toISOString().split('T')[0] === date.toISOString().split('T')[0]) {
      return;
    }
    
    setDate(newDate);
    onDateChange(newDate);
  };

  // Validate if date should be disabled (future dates)
  const shouldDisableDate = (date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const selectedDate = new Date(date);
    selectedDate.setHours(23, 59, 59, 999);
    
    // Disable dates after today (future dates)
    return selectedDate > today;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!hospitalId) {
      errors.hospital = "病院の選択が必要です";
    }
    
    if (!patientsCount || isNaN(parseInt(patientsCount))) {
      errors.patientsCount = "有効な患者数が必要です";
    }
    
    if (!outpatientsCount || isNaN(parseInt(outpatientsCount))) {
      errors.outpatientsCount = "有効な午後診数が必要です";
    }
    
    if (!nightConsultation || isNaN(parseInt(nightConsultation))) {
      errors.nightConsultation = "有効な夜診数が必要です";
    }
    
    // External consultation validation
    if (!externalConsultation.PET || isNaN(parseInt(externalConsultation.PET))) {
      errors.PET = "有効なPET数が必要です";
    }
    
    if (!externalConsultation.MR || isNaN(parseInt(externalConsultation.MR))) {
      errors.MR = "有効なMR数が必要です";
    }
    
    if (!externalConsultation.CT || isNaN(parseInt(externalConsultation.CT))) {
      errors.CT = "有効なCT数が必要です";
    }

    // Validate consolidated data for both components
    // Both components should have at least one entry
    if (consolidatedData.length === 0 && consolidatedDataCount.length === 0) {
      errors.consolidatedData = "少なくとも1つの診療科エントリが必要です";
    }
    
    // Validate ConsolidatedContentComponent data
   /* consolidatedData.forEach((item, index) => {
      if (!item.department_id) {
        errors[`doctor_dept_${index}`] = "診療科の選択が必要です";
      }
      if (!item.patient_count && item.patient_count !== 0) {
        errors[`doctor_patientCount_${index}`] = "患者数が必要です";
      }
    });*/
    
    // Validate ConsolidatedContentComponentCount data
    /*consolidatedDataCount.forEach((item, index) => {
      if (!item.department_id) {
        errors[`count_dept_${index}`] = "診療科の選択が必要です";
      }
      if (!item.total_patients && item.total_patients !== 0) {
        errors[`count_total_${index}`] = "合計患者数が必要です";
      }
      if (!item.new_patients && item.new_patients !== 0) {
        errors[`count_new_${index}`] = "新規患者数が必要です";
      }
    });*/
    
    setValidationErrors(errors);
    
    // Scroll to top when there are errors
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    return Object.keys(errors).length === 0;
  };

  const prepareFormData = () => {
    // Filter out empty consolidated data for both components
    const filteredConsolidatedData = consolidatedData.filter(item => 
      item.department_id && item.patient_count !== undefined
    );

    const filteredConsolidatedDataCount = consolidatedDataCount.filter(item => 
      item.department_id && (item.total_patients !== undefined || item.new_patients !== undefined)
    );

    return {
      admission_count: parseInt(patientsCount) || 0,
      discharge_count: parseInt(outpatientsCount) || 0,
      external_duty: parseInt(nightConsultation) || 0,
      emergency_transport: parseInt(externalConsultation.PET) || 0,
      post_transport_admission: parseInt(externalConsultation.MR) || 0,
      visit_count: parseInt(externalConsultation.CT) || 0,
      special_notes: specialNotes.trim(),
      report_details: filteredConsolidatedData,
      report_details_mid: filteredConsolidatedDataCount,
      hospital_type: hospital_type,
    };
  };

  // Handle save draft
  const handleSaveDraftClick = () => {
    if (validateForm()) {
      const data = prepareFormData();
      // Call parent's onSaveDraft which will show snackbar
      onSaveDraft(data);
    } else {
      // Show error snackbar using parent's function
      if (showSnackbar) {
        showSnackbar('フォームにエラーがあります。確認してください。', 'error');
      } else {
        showLocalSnackbar('フォームにエラーがあります。確認してください。', 'error');
      }
    }
  };

  // Handle submit
  const handleSubmitClick = () => {
    if (validateForm()) {
      const data = prepareFormData();
      // Call parent's onSubmit which will show snackbar
      onSubmit(data);
    } else {
      // Show error snackbar using parent's function
      if (showSnackbar) {
        showSnackbar('フォームにエラーがあります。確認してください。', 'error');
      } else {
        showLocalSnackbar('フォームにエラーがあります。確認してください。', 'error');
      }
    }
  };

  // Handler functions for form fields with select all on focus
  const handlePatientsChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setPatientsCount(value);
      // Clear error if fixed
      if (validationErrors.patientsCount && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.patientsCount;
        setValidationErrors(newErrors);
      }
    }
  };

  // Handle focus event to select all text
  const handleFocusSelect = (e) => {
    e.target.select();
  };

  const handleOutpatientsChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setOutpatientsCount(value);
      // Clear error if fixed
      if (validationErrors.outpatientsCount && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.outpatientsCount;
        setValidationErrors(newErrors);
      }
    }
  };

  const handleNightConsultationChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setNightConsultation(value);
      // Clear error if fixed
      if (validationErrors.nightConsultation && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.nightConsultation;
        setValidationErrors(newErrors);
      }
    }
  };

  // Handle external consultation change
  const handlePETChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        PET: value 
      }));
      // Clear error if fixed
      if (validationErrors.PET && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.PET;
        setValidationErrors(newErrors);
      }
    }
  };

  const handleMRChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        MR: value 
      }));
      // Clear error if fixed
      if (validationErrors.MR && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.MR;
        setValidationErrors(newErrors);
      }
    }
  };

  const handleCTChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        CT: value 
      }));
      // Clear error if fixed
      if (validationErrors.CT && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.CT;
        setValidationErrors(newErrors);
      }
    }
  };

  const handleSpecialNotesChange = (e) => {
    setSpecialNotes(e.target.value);
  };

  const handleConsolidatedDataChange = (newData) => {
    console.log(newData,'xxxxxx')
    setConsolidatedData(newData);
    // Clear consolidated data error if data is added
    if (validationErrors.consolidatedData && (newData.length > 0 || consolidatedDataCount.length > 0)) {
      const newErrors = { ...validationErrors };
      delete newErrors.consolidatedData;
      setValidationErrors(newErrors);
    }
  };

  const handleConsolidatedDataCountChange = (newData) => {
    setConsolidatedDataCount(newData);
    // Clear consolidated data error if data is added
    if (validationErrors.consolidatedData && (consolidatedData.length > 0 || newData.length > 0)) {
      const newErrors = { ...validationErrors };
      delete newErrors.consolidatedData;
      setValidationErrors(newErrors);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Show local snackbar (for date navigation warnings)
  const showLocalSnackbar = (message, severity = 'success') => {
    setLocalSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Handle local snackbar close
  const handleLocalSnackbarClose = () => {
    setLocalSnackbar({ ...localSnackbar, open: false });
  };

  // Notify parent of form data changes
  useEffect(() => {
    if (onFormDataChange && !loadingRef.current) {
      const currentFormData = prepareFormData();
      onFormDataChange(currentFormData);
    }
  }, [
    patientsCount,
    outpatientsCount,
    nightConsultation,
    externalConsultation,
    currentStatus,
    specialNotes,
    consolidatedData,
    consolidatedDataCount
  ]);

  // Create a function that the parent can call to trigger save draft
  const triggerSaveDraft = useCallback(() => {
    console.log('Header save draft button clicked, triggering form save draft');
    handleSaveDraftClick();
  }, [validateForm, prepareFormData, onSaveDraft, showSnackbar]);

  // Create a function that the parent can call to trigger submit
  const triggerSubmit = useCallback(() => {
    console.log('Header submit button clicked, triggering form submit');
    handleSubmitClick();
  }, [validateForm, prepareFormData, onSubmit, showSnackbar]);

  // Notify parent of the trigger functions when they change
  useEffect(() => {
    if (onHeaderSaveDraft) {
      onHeaderSaveDraft(triggerSaveDraft);
    }
    if (onHeaderSubmit) {
      onHeaderSubmit(triggerSubmit);
    }
  }, [onHeaderSaveDraft, onHeaderSubmit, triggerSaveDraft, triggerSubmit]);

  // Responsive values
  const sectionPadding = isMobile ? 2 : isTablet ? 3 : 4;
  const textFieldHeight = isMobile ? 40 : isTablet ? 44 : 48;
  const fontSize = {
    small: isMobile ? '0.875rem' : isTablet ? '0.9375rem' : '1rem',
    medium: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem',
    large: isMobile ? '1.125rem' : isTablet ? '1.25rem' : '1.5rem',
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      draft: { color: '#ff9800', label: '下書き', bgColor: '#fff3e0' },
      submitted: { color: '#2196f3', label: '提出済み', bgColor: '#e3f2fd' },
      approved: { color: '#4caf50', label: '承認済み', bgColor: '#e8f5e9' },
      rejected: { color: '#f44336', label: '拒否済み', bgColor: '#ffebee' }
    };
    
    const config = statusConfig[status] || { color: '#9e9e9e', label: '未提出', bgColor: '#f5f5f5' };
    
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.5,
          borderRadius: '12px',
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}33`,
          ml: 1
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: config.color,
            mr: 1
          }}
        />
        <Typography
          sx={{
            fontSize: fontSize.small,
            fontWeight: 600,
            color: config.color
          }}
        >
          {config.label}
        </Typography>
      </Box>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography sx={{ color: '#666', fontSize: fontSize.medium }}>
          データを読み込み中...
        </Typography>
      </Box>
    );
  }

  // Error state for missing hospital
  if (!hospitalId) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        textAlign: 'center'
      }}>
        <InfoOutlinedIcon sx={{ fontSize: 48, color: '#ff9800', mb: 1 }} />
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          病院が選択されていません
        </Typography>
        <Typography sx={{ color: '#666', mb: 3 }}>
          レポートを作成するには、まず病院を選択してください。
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 2 : isTablet ? 2.5 : 3,
          pb: 4
        }}
      >
        {/* Local Snackbar (for date warnings only) */}
        <Snackbar
          open={localSnackbar.open}
          autoHideDuration={6000}
          onClose={handleLocalSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleLocalSnackbarClose} 
            severity={localSnackbar.severity}
            sx={{ width: '100%' }}
          >
            {localSnackbar.message}
          </Alert>
        </Snackbar>

        {/* Header with Date Navigation */}
        <Paper
          elevation={0}
          sx={{
            p: sectionPadding,
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={handlePreviousDay}
                disabled={isEditingFromView}
                size="small"
                sx={{ border: '1px solid #e0e0e0' }}
              >
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>
              
              <DatePicker
                value={date}
                onChange={handleDatePickerChange}
                shouldDisableDate={shouldDisableDate}
                disabled={isEditingFromView}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={{
                      width: isMobile ? '160px' : '200px',
                      '& .MuiOutlinedInput-root': {
                        height: textFieldHeight,
                      },
                      '& input': {
                        fontSize: fontSize.small,
                      }
                    }}
                    size="small"
                    error={!!validationErrors.date}
                    helperText={validationErrors.date}
                  />
                )}
                components={{
                  OpenPickerIcon: CalendarTodayOutlinedIcon
                }}
              />
              
              <IconButton 
                onClick={handleNextDay}
                size="small"
                disabled={shouldDisableDate(new Date(date.getTime() + 24 * 60 * 60 * 1000)) || isEditingFromView}
                sx={{ border: '1px solid #e0e0e0' }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ display: isMobile ? 'none' : 'block' }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ 
                fontSize: fontSize.medium, 
                fontWeight: 600,
                color: '#333'
              }}>
                報告日:
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.medium, 
                fontWeight: 600,
                color: '#0A6AE3',
                ml: 1
              }}>
                {formatJapaneseDate(date)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: fontSize.small, color: '#666' }}>
              ステータス:
            </Typography>
            <StatusBadge status={reportStatus || 'draft'} />
          </Box>
        </Paper>

        {/* Validation Errors Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: fontSize.medium }}>
              以下のエラーを修正してください:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {Object.values(validationErrors).map((error, index) => (
                <li key={index} style={{ marginBottom: 4 }}>
                  <Typography sx={{ fontSize: fontSize.small }}>
                    {error}
                  </Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Patients Statistics Section */}
        <Paper
          elevation={0}
          sx={{
            p: sectionPadding,
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
          }}
        >
          <Stack spacing={3}>
            {/* Section Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Typography sx={{ 
                fontWeight: 700, 
                fontSize: fontSize.large,
                color: "#2c3e50",
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{ 
                  width: 4, 
                  height: 20, 
                  backgroundColor: '#3498db',
                  borderRadius: '2px'
                }} />
                患者数
              </Typography>
              <Tooltip title="患者数に関する統計情報">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Patients Count */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    fontSize: fontSize.medium,
                    color: "#36394a",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    患者数
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={patientsCount}
                    onChange={handlePatientsChange}
                    onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.patientsCount}
                    helperText={validationErrors.patientsCount}
                    disabled={readOnly || reportStatus === 'submitted'} 
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.patientsCount ? "#df1c41" : "#dfe1e7",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'right',
                          paddingRight: 2,
                          fontWeight: 500
                        },
                      },
                    }}
                  />
                </Stack>
              </Grid>

              {/* Outpatients Count */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    fontSize: fontSize.medium,
                    color: "#36394a",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    午後診
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={outpatientsCount}
                    onChange={handleOutpatientsChange}
                    onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.outpatientsCount}
                    helperText={validationErrors.outpatientsCount}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.outpatientsCount ? "#df1c41" : "#dfe1e7",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'right',
                          paddingRight: 2,
                          fontWeight: 500
                        },
                      },
                    }}
                  />
                </Stack>
              </Grid>

              {/* Night Consultation */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    fontSize: fontSize.medium,
                    color: "#36394a",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    夜診
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={nightConsultation}
                    onChange={handleNightConsultationChange}
                    onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.nightConsultation}
                    helperText={validationErrors.nightConsultation}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.nightConsultation ? "#df1c41" : "#dfe1e7",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'right',
                          paddingRight: 2,
                          fontWeight: 500
                        },
                      },
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* Emergency Section - Renamed to 患者数 (PET / MR / CT) */}
        <Paper
          elevation={0}
          sx={{
            p: sectionPadding,
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
          }}
        >
          <Stack spacing={3}>
            {/* Section Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Typography sx={{ 
                fontWeight: 700, 
                fontSize: fontSize.large,
                color: "#2c3e50",
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{ 
                  width: 4, 
                  height: 20, 
                  backgroundColor: '#e74c3c',
                  borderRadius: '2px'
                }} />
                患者数 (PET / MR / CT)
              </Typography>
              <Tooltip title="PET/MR/CT検査に関する情報">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* PET */}
              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={1}>
                  <Typography sx={{ 
                    fontSize: fontSize.medium,
                    fontWeight: 600, 
                    color: "#36394a",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    PET
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={externalConsultation.PET}
                    onChange={handlePETChange}
                    onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.PET}
                    helperText={validationErrors.PET}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.PET ? "#df1c41" : "#dfe1e7",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'right',
                          paddingRight: 2,
                          fontWeight: 500,
                          color: "#2c3e50",
                        },
                      },
                    }}
                  />
                </Stack>
              </Grid>

              {/* MR */}
              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={1}>
                  <Typography sx={{ 
                    fontSize: fontSize.medium,
                    fontWeight: 600, 
                    color: "#36394a",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    MR
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={externalConsultation.MR}
                    onChange={handleMRChange}
                    onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.MR}
                    helperText={validationErrors.MR}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.MR ? "#df1c41" : "#dfe1e7",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'right',
                          paddingRight: 2,
                          fontWeight: 500,
                          color: "#2c3e50",
                        },
                      },
                    }}
                  />
                </Stack>
              </Grid>

              {/* CT */}
              <Grid item xs={12} sm={12} md={4}>
                <Stack spacing={1}>
                  <Typography sx={{ 
                    fontSize: fontSize.medium,
                    fontWeight: 600, 
                    color: "#36394a",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    CT
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={externalConsultation.CT}
                    onChange={handleCTChange}
                    onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.CT}
                    helperText={validationErrors.CT}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.CT ? "#df1c41" : "#dfe1e7",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'right',
                          paddingRight: 2,
                          fontWeight: 500,
                          color: "#2c3e50",
                        },
                      },
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* Consolidated Content Section with Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
          }}
        >
 

          {/* Tab Content */}
          <Box sx={{ p: sectionPadding }}>


              <ConsolidatedContentComponentCount
                data={consolidatedDataCount}
                departments={departments}
                hospitalId={hospitalId}
                onDataChange={handleConsolidatedDataCountChange}
                validationErrors={validationErrors}
                readOnly={readOnly || reportStatus === 'submitted'}
              />

              <ConsolidatedContentComponent
                data={consolidatedData}
                departments={departments}
                doctors={doctors}
                hospitalId={hospitalId}
                onDataChange={handleConsolidatedDataChange}
                validationErrors={validationErrors}
                readOnly={readOnly || reportStatus === 'submitted'}
              />



          </Box>
        </Paper>

        {/* Administrative Matters Section */}
        <Paper
          elevation={0}
          sx={{
            p: sectionPadding,
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
          }}
        >
          <Stack spacing={3}>
            {/* Section Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Typography sx={{ 
                fontWeight: 700, 
                fontSize: fontSize.large,
                color: "#2c3e50",
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{ 
                  width: 4, 
                  height: 20, 
                  backgroundColor: '#27ae60',
                  borderRadius: '2px'
                }} />
                管理事項
              </Typography>
              <Tooltip title="特記事項や備考を入力">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Stack spacing={1}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: fontSize.medium,
                  color: "#36394a",
                }}
              >
                特記事項
              </Typography>

              <TextField
                variant="outlined"
                value={specialNotes}
                onChange={handleSpecialNotesChange}
                fullWidth
                multiline
                rows={4}
                placeholder="特記事項があれば入力してください..."
                disabled={readOnly || reportStatus === 'submitted'}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#ffffff",
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: "#dfe1e7",
                    },
                    "& textarea": {
                      fontSize: fontSize.medium,
                      lineHeight: 1.5,
                    },
                  },
                }}
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Action Buttons - Only show if not submitted */}
        {reportStatus !== 'submitted' && !readOnly && (
          <Paper
            elevation={0}
            sx={{
              p: sectionPadding,
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              backgroundColor: '#ffffff',
              position: 'sticky',
              bottom: 0,
              mt: 'auto',
              zIndex: 10
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={isSavingDraft ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveDraftClick}
                disabled={isSavingDraft || isSubmitting || loading}
                size="large"
                sx={{
                  minWidth: isMobile ? '100%' : '140px',
                  py: 1.5,
                  borderRadius: '8px',
                  borderWidth: '2px',
                  fontWeight: 600,
                  fontSize: fontSize.medium
                }}
              >
                {isSavingDraft ? '保存中...' : '下書き保存'}
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSubmitClick}
                disabled={isSubmitting || isSavingDraft || loading}
                size="large"
                sx={{
                  minWidth: isMobile ? '100%' : '160px',
                  py: 1.5,
                  borderRadius: '8px',
                  fontWeight: 600,
                  backgroundColor: '#0A6AE3',
                  fontSize: fontSize.medium,
                  '&:hover': {
                    backgroundColor: '#0856b8'
                  }
                }}
              >
                {isSubmitting ? '提出中...' : 'レポート提出'}
              </Button>
            </Box>
          </Paper>
        )}
        
        {/* Read-only warning for submitted reports */}
        {reportStatus === 'submitted' && (
          <Paper
            elevation={0}
            sx={{
              p: sectionPadding,
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              mt: 'auto'
            }}
          >
            <Alert 
              severity="info" 
              sx={{ 
                alignItems: 'center',
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: fontSize.medium }}>
                このレポートは既に提出済みです。編集はできません。
              </Typography>
              <Typography sx={{ fontSize: fontSize.small, mt: 0.5 }}>
                提出日: {date ? formatJapaneseDate(date) : '不明'}
              </Typography>
            </Alert>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
});

export default FrameScreen;