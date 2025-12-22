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
  Snackbar
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
import StatusBadge from './utils/StatusBadge'; 
import {
  formatDateForAPI,
  formatJapaneseDate,
  shouldDisableDate,
  prepareFormData as prepareFormDataUtil,
  validateForm as validateFormUtil
} from './utils/frameScreenUtils';
  

import DailyAdmissionReportSm from './DailyAdmissionReportSm'; 
import CareHouseDashboard from './CareHouseDashboard'; 
import MonthlyUsageSummarySm from './MonthlyUsageSummarySm'; 


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
  const [allow, setallow] = useState(false);
  const [date, setDate] = useState(reportDate || new Date());
  
  // Patient counts - now editable
  const [patientsCount, setPatientsCount] = useState("0");
  const [outpatientsCount, setOutpatientsCount] = useState("0");
  
  // Special notes
  const [specialNotes, setSpecialNotes] = useState("");
  
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  
  // Track if form data has been loaded
  const [formDataLoaded, setFormDataLoaded] = useState(false);

  // Refs to track form state and prevent flickering
  const isInitialMountRef = useRef(true);
  const previousFormDataRef = useRef(null);
  const loadingRef = useRef(false);
  const dataInitializedRef = useRef(false);

  // Local state for snackbar
  const [localSnackbar, setLocalSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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
    
    // Reset the initialization flag
    dataInitializedRef.current = false;
    
    // Mark that we've loaded form data
    setFormDataLoaded(true);
    
    // Load patient counts from API response
    setPatientsCount(data.admission_count?.toString() || "0");
    setOutpatientsCount(data.discharge_count?.toString() || "0");
    
    // Special notes
    setSpecialNotes(data.special_notes || "");
    
    // Clear validation errors when loading data
    setValidationErrors({});
    
    console.log('Form data loading complete');
  };

  // Reset form to initial state (complete reset)
  const resetForm = () => {
    console.log('Resetting form completely');
    
    // Reset patient counts
    setPatientsCount("0");
    setOutpatientsCount("0");
    
    // Reset special notes
    setSpecialNotes("");
    
    setFormDataLoaded(false);
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

  // Handle patient count changes
  const handlePatientsCountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPatientsCount(value);
      // Clear error if fixed
      if (validationErrors.patientsCount) {
        const newErrors = { ...validationErrors };
        delete newErrors.patientsCount;
        setValidationErrors(newErrors);
      }
    }
  };

  const handleOutpatientsCountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setOutpatientsCount(value);
      // Clear error if fixed
      if (validationErrors.outpatientsCount) {
        const newErrors = { ...validationErrors };
        delete newErrors.outpatientsCount;
        setValidationErrors(newErrors);
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = validateFormUtil(
      hospitalId,
      patientsCount,
      outpatientsCount
    );
    
    setValidationErrors(errors);
    
    // Scroll to top when there are errors
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    return Object.keys(errors).length === 0;
  };

  const prepareFormData = () => {
    return {
      admission_count: patientsCount || "0",
      discharge_count: outpatientsCount || "0",
      external_duty: "0", // Always 0 since night consultation is removed
      emergency_transport: "0", // PET removed
      post_transport_admission: "0", // MR removed
      visit_count: "0", // CT removed
      special_notes: specialNotes || "",
      report_details: [], // Empty array since component is removed
      report_details_mid: [], // Empty array
      external_consultation_details: null, // External consultation removed
      hospital_type: hospital_type // Keep hospital_type for backend
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

  const handleSpecialNotesChange = (e) => {
    setSpecialNotes(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Show local snackbar (for date warnings only)
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

  // Notify parent of form data changes - with debouncing
  useEffect(() => {
    if (onFormDataChange && !loadingRef.current) {
      // Use a timeout to debounce rapid updates
      const timeoutId = setTimeout(() => {
        const currentFormData = prepareFormData();
        onFormDataChange(currentFormData);
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    patientsCount,
    outpatientsCount,
    specialNotes
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
            <StatusBadge status={reportStatus || 'draft'} fontSize={fontSize} />
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

        {/* Patients Statistics Section - Now editable */}
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
              {/* Patients Count - Now editable */}
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
                    午前診
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={patientsCount}
                    onChange={handlePatientsCountChange}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.patientsCount}
                    helperText={validationErrors.patientsCount || "午前診の患者数を入力してください"}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.patientsCount ? "#df1c41" : "#bdbdbd",
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

              {/* Outpatients Count - Now editable */}
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
                    onChange={handleOutpatientsCountChange}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.outpatientsCount}
                    helperText={validationErrors.outpatientsCount || "午後診の患者数を入力してください"}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.outpatientsCount ? "#df1c41" : "#bdbdbd",
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


                {/* Patients Statistics Section - Now editable */}
      
      
      
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
               入所
              </Typography>
              <Tooltip title="">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Patients Count - Now editable */}
              <Grid item xs={12} sm={12}>
                <Stack spacing={1}>
                    <DailyAdmissionReportSm/>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      
      
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
              ケアハウス
              </Typography>
              <Tooltip title="">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Patients Count - Now editable */}
              <Grid item xs={12} sm={12}>
                <Stack spacing={1}>
                    <CareHouseDashboard/>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Paper>



      
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
                ABCD
              </Typography>
              <Tooltip title="患者数に関する統計情報">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Patients Count - Now editable */}
              <Grid item xs={12} sm={12}>
                <Stack spacing={1}>
                      <MonthlyUsageSummarySm/>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
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