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
import ConsolidatedContentComponent from './ConsolidatedContentComponent';
import ConsolidatedContentComponentCount from './ConsolidatedContentComponentCount';
import ExternalConsultationToggle from './ExternalConsultationToggle';
import StatusBadge from './utils/StatusBadge';
import {
  formatDateForAPI,
  formatJapaneseDate,
  shouldDisableDate,
  prepareFormData as prepareFormDataUtil,
  validateForm as validateFormUtil
} from './utils/frameScreenUtils';

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
  const [allow, setallow] = useState(false);
  const [date, setDate] = useState(reportDate || new Date());
  
  // Initial values from API response
  const [initialMorning, setInitialMorning] = useState("0");
  const [initialAfternoon, setInitialAfternoon] = useState("0");
  const [initialNight, setInitialNight] = useState("0");
  
  // Calculated fields for runtime updates
  const [calculatedMorning, setCalculatedMorning] = useState(0);
  const [calculatedAfternoon, setCalculatedAfternoon] = useState(0);
  const [calculatedNight, setCalculatedNight] = useState(0);
  
  // Timer for 3 second hold
  const [timerActive, setTimerActive] = useState(true);
  
  // External consultation data - initialize with empty values
  const [externalConsultationData, setExternalConsultationData] = useState({
    summary: {
      PET: "",
      MR: "",
      CT: ""
    },
    details: null,
    totals: {
      PET: 0,
      MR: 0,
      CT: 0,
      grandTotal: 0
    }
  });

  const [currentStatus, setCurrentStatus] = useState({
    firstRow: Array(21).fill(""),
    secondRow: Array(21).fill(""),
    thirdRow: Array(21).fill("")
  });
  const [specialNotes, setSpecialNotes] = useState("");
  
  // Separate states for both components
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [consolidatedDataCount, setConsolidatedDataCount] = useState([]);
  
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

  // Start 3 second timer when component mounts or when formData is loaded
  useEffect(() => {
    if (formDataLoaded) {
      setTimerActive(true);
      const timer = setTimeout(() => {
        setTimerActive(false);
        console.log('3 second timer completed, switching to calculated values');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [formDataLoaded]);

  // Calculate sums whenever consolidatedDataCount changes (but only if timer is not active)
  useEffect(() => {
    if (!timerActive && consolidatedDataCount && consolidatedDataCount.length > 0) {
      let morningSum = 0;
      let afternoonSum = 0;
      let nightSum = 0;
      
      consolidatedDataCount.forEach(item => {
        const totalPatients = parseInt(item.total_patients) || 0;
        
        switch (item.consultation_type) {
          case 'morning':
            morningSum += totalPatients;
            break;
          case 'afternoon':
            afternoonSum += totalPatients;
            break;
          case 'night':
            nightSum += totalPatients;
            break;
          default:
            break;
        }
      });
      
      setCalculatedMorning(morningSum);
      setCalculatedAfternoon(afternoonSum);
      setCalculatedNight(nightSum);
    } else if (!timerActive) {
      // Reset to 0 if no data and timer is not active
      setCalculatedMorning(0);
      setCalculatedAfternoon(0);
      setCalculatedNight(0);
    }
  }, [consolidatedDataCount, timerActive]);

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
    } 
    else if(formData && reportDate){
      console.log('vvvvvvvvvvvvvvvv','11111111111111');
      loadFormData(formData);
      previousFormDataRef.current = formData;
      setFormDataLoaded(true);

    }
    
    else if ((formData === null || Object.keys(formData).length === 0) && formDataLoaded) {
      console.log('No form data, resetting form');
      resetForm();
      setFormDataLoaded(false);
    }
    
    // Reset formDataLoaded flag when formData becomes null
    if (!formData && formDataLoaded) {
      setFormDataLoaded(false);
    }
  }, [formData, loading, reportDate]);






  // Load form data from existing report
  const loadFormData = async (data) => {
    console.log('Loading form data:', data);
    
    // Reset the initialization flag
    dataInitializedRef.current = false;
    
    // Mark that we've loaded form data
    setFormDataLoaded(true);
    
    // Load initial values from API response
    setInitialMorning(data.admission_count?.toString() || "0");
    setInitialAfternoon(data.discharge_count?.toString() || "0");
    setInitialNight(data.external_duty?.toString() || "0");
    
    // Also set calculated values to initial values initially
    setCalculatedMorning(parseInt(data.admission_count) || 0);
    setCalculatedAfternoon(parseInt(data.discharge_count) || 0);
    setCalculatedNight(parseInt(data.external_duty) || 0);
    
    // Calculate totals from external_consultation_details if available
    let petTotal = 0;
    let mrTotal = 0;
    let ctTotal = 0;
    
    // If we have detailed data, calculate totals from it
    if (data.external_consultation_details) {
      console.log('Calculating totals from external_consultation_details:', data.external_consultation_details);
      
      // Calculate PET total
      if (data.external_consultation_details.PET) {
        const petDetails = data.external_consultation_details.PET;
        petTotal = Object.values(petDetails).reduce((sum, field) => {
          if (field && field.enabled) {
            return sum + (parseInt(field.value) || 0);
          }
          return sum;
        }, 0);
      }
      
      // Calculate MR total
      if (data.external_consultation_details.MR) {
        const mrDetails = data.external_consultation_details.MR;
        mrTotal = Object.values(mrDetails).reduce((sum, field) => {
          if (field && field.enabled) {
            return sum + (parseInt(field.value) || 0);
          }
          return sum;
        }, 0);
      }
      
      // Calculate CT total
      if (data.external_consultation_details.CT) {
        const ctDetails = data.external_consultation_details.CT;
        ctTotal = Object.values(ctDetails).reduce((sum, field) => {
          if (field && field.enabled) {
            return sum + (parseInt(field.value) || 0);
          }
          return sum;
        }, 0);
      }
    } else {
      // Fallback to the old fields if no detailed data
      petTotal = parseInt(data.emergency_transport) || 0;
      mrTotal = parseInt(data.post_transport_admission) || 0;
      ctTotal = parseInt(data.visit_count) || 0;
    }
    
    // Set initial external consultation data
    const initialExternalData = {
      summary: {
        PET: petTotal.toString(),
        MR: mrTotal.toString(),
        CT: ctTotal.toString()
      },
      details: data.external_consultation_details || null,
      totals: {
        PET: petTotal,
        MR: mrTotal,
        CT: ctTotal,
        grandTotal: petTotal + mrTotal + ctTotal
      }
    };
    
    console.log('Setting externalConsultationData:', initialExternalData);
    setExternalConsultationData(initialExternalData);
    
    // Special notes
    setSpecialNotes(data.special_notes || "");
    
    // Load data for both components
    // For ConsolidatedContentComponent (doctor-based)
    if (data.report_details && Array.isArray(data.report_details) && data.report_details.length > 0) {
      console.log('Setting consolidated data for doctor-based component:', data.report_details.length, 'items');
      setConsolidatedData(data.report_details);
    } else {
      // CRITICAL: Reset to empty array when no data exists
      console.log('Resetting consolidatedData to empty array');


      try {
          if (hospitalId) {
            const response = await axios.post(apiConfig.reportHospitalDepartmentsDoctors, {
              hospital_id: hospitalId,
              report_date: date
            });

            if (response.data.success && response.data.data) {
              const departmentsData = response.data.data;

              // Create a new array with patient_count set to 0
              const modifiedData = departmentsData.map(item => ({
                ...item,
                patient_count: 0
              }));
              setConsolidatedData(modifiedData);
            }else{
                      setConsolidatedData([]);
            }
          }        
      } catch (error) {
        setConsolidatedData([]);
      }

    }
    
    // For ConsolidatedContentComponentCount (patient count-based)
    if (data.report_details_mid && Array.isArray(data.report_details_mid) && data.report_details_mid.length > 0) {
      console.log('Setting consolidated data for count-based component:', data.report_details_mid, 'items');
      setConsolidatedDataCount(data.report_details_mid);
    } else {
      // CRITICAL: Reset to empty array when no data exists
      console.log('Resetting consolidatedDataCount to empty array');
      setConsolidatedDataCount([]);
    }
    
    // Clear validation errors when loading data
    setValidationErrors({});
    
    console.log('Form data loading complete');
  };

  // Reset form to initial state (complete reset)
  const resetForm = () => {
    console.log('Resetting form completely');
    
    // Reset initial values
    setInitialMorning("0");
    setInitialAfternoon("0");
    setInitialNight("0");
    
    // Reset calculated fields
    setCalculatedMorning(0);
    setCalculatedAfternoon(0);
    setCalculatedNight(0);
    
    // Reset timer
    setTimerActive(true);
    
    // Reset external consultation data - with empty strings
    setExternalConsultationData({
      summary: { 
        PET: "", 
        MR: "", 
        CT: "" 
      },
      details: null,
      totals: {
        PET: 0,
        MR: 0,
        CT: 0,
        grandTotal: 0
      }
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
    
    setFormDataLoaded(false);
    
    setValidationErrors({});
    
    console.log('Form reset complete');
  };

  // Get the current display value based on timer status
  const getDisplayMorning = () => {
    return timerActive ? initialMorning : calculatedMorning;
  };

  const getDisplayAfternoon = () => {
    return timerActive ? initialAfternoon : calculatedAfternoon;
  };

  const getDisplayNight = () => {
    return timerActive ? initialNight : calculatedNight;
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

  // Validate form
  const validateForm = () => {
    const errors = validateFormUtil(
      hospitalId,
      getDisplayMorning,
      getDisplayAfternoon,
      getDisplayNight,
      externalConsultationData,
      consolidatedData,
      consolidatedDataCount
    );
    
    setValidationErrors(errors);
    
    // Scroll to top when there are errors
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    return Object.keys(errors).length === 0;
  };

  const prepareFormData = () => {
    return prepareFormDataUtil(
      getDisplayMorning,
      getDisplayAfternoon,
      getDisplayNight,
      externalConsultationData,
      specialNotes,
      consolidatedData,
      consolidatedDataCount,
      hospital_type
    );
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

  // Handle external consultation data change from child component
  const handleExternalConsultationChange = useCallback((newData) => {
    console.log('External consultation data updated in parent:', newData);
    
    setExternalConsultationData(newData);
    
    // Clear errors if fixed
    const newErrors = { ...validationErrors };
    if (newData.summary.PET && !isNaN(parseInt(newData.summary.PET))) {
      delete newErrors.PET;
    }
    if (newData.summary.MR && !isNaN(parseInt(newData.summary.MR))) {
      delete newErrors.MR;
    }
    if (newData.summary.CT && !isNaN(parseInt(newData.summary.CT))) {
      delete newErrors.CT;
    }
    setValidationErrors(newErrors);
  }, [validationErrors]);

  const handleSpecialNotesChange = (e) => {
    setSpecialNotes(e.target.value);
  };

  const handleConsolidatedDataChange = (newData) => {
    setConsolidatedData(newData);
    // Clear consolidated data error if data is added
    if (validationErrors.consolidatedData && (newData.length > 0 || consolidatedDataCount.length > 0)) {
      const newErrors = { ...validationErrors };
      delete newErrors.consolidatedData;
      setValidationErrors(newErrors);
    }
  };

  const handleConsolidatedDataCountChange = (newData) => {
    console.log(newData,'newDatanewDataccccccc')
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
    initialMorning,
    initialAfternoon,
    initialNight,
    calculatedMorning,
    calculatedAfternoon,
    calculatedNight,
    timerActive,
    externalConsultationData,
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
<Tooltip
  title={
    timerActive
      ? "患者数に関する統計情報（初期値、3秒間保持）"
      : (
        <>
          午前診・午後診・当直に診療を行った患者数が自動で計算されて表示されます。<br />
          こちらに表示される人数は、当日の集計された患者数が表示されます。<br />
          当日の合計人数が表示されます。<br />
          こちらは自動計算されて表示されますので入力不要項目です。
        </>
      )
  }
>
  <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
</Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Patients Count */}
              <Grid item xs={12} sm={4}>
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
                  </Typography>
                  <TextField
                    value={timerActive ? initialMorning : calculatedMorning}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.patientsCount}
                    helperText={timerActive ? 
                      "初期値（3秒間保持）" : 
                      "朝診の合計患者数（自動計算）"}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#f5f5f5",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.patientsCount ? "#df1c41" : "#bdbdbd",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'left',
                          paddingLeft: 2,
                          fontWeight: 500,
                          color: "#666",
                        },
                      },
                    }}
                  />
                  {timerActive && (
                    <Typography sx={{ 
                      fontSize: fontSize.small, 
                      color: '#ff9800',
                      fontStyle: 'italic',
                      textAlign: 'center'
                    }}>
                      ⏱️ 3秒後に自動計算に切り替わります
                    </Typography>
                  )}
                </Stack>
              </Grid>

              {/* Outpatients Count */}
              <Grid item xs={12} sm={4}>
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
                  </Typography>
                  <TextField
                    value={timerActive ? initialAfternoon : calculatedAfternoon}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.outpatientsCount}
                    helperText={timerActive ? 
                      "初期値（3秒間保持）" : 
                      "午後診の合計患者数（自動計算）"}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#f5f5f5",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.outpatientsCount ? "#df1c41" : "#bdbdbd",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'left',
                          paddingLeft: 2,
                          fontWeight: 500,
                          color: "#666",
                        },
                      },
                    }}
                  />
                </Stack>
              </Grid>

              {/* Night Consultation */}
              <Grid item xs={12} sm={4}>
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
                  </Typography>
                  <TextField
                    value={timerActive ? initialNight : calculatedNight}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.nightConsultation}
                    helperText={timerActive ? 
                      "初期値（3秒間保持）" : 
                      "夜診の合計患者数（自動計算）"}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#f5f5f5",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.nightConsultation ? "#df1c41" : "#bdbdbd",
                        },
                        "& input": {
                          fontSize: fontSize.medium,
                          textAlign: 'left',
                          paddingLeft: 2,
                          fontWeight: 500,
                          color: "#666",
                        },
                      },
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* External Consultation Section */}
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
              <Tooltip title={
    <>
      本日実施した検査人数を入力してください。<br />
      こちらに入力した人数は自動的に収集されます。
    </>
  }>
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            {/* Simple summary fields (for backward compatibility) */}
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
                    value={externalConsultationData.summary.PET || "0"}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.PET}
                    helperText={validationErrors.PET || "合計値（詳細設定から変更可能）"}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#f5f5f5",
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
                    value={externalConsultationData.summary.MR || "0"}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.MR}
                    helperText={validationErrors.MR || "合計値（詳細設定から変更可能）"}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#f5f5f5",
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
                    value={externalConsultationData.summary.CT || "0"}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.CT}
                    helperText={validationErrors.CT || "合計値（詳細設定から変更可能）"}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#f5f5f5",
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

 
            {/* Detailed Toggle Component */}

            <Box sx={{ mt: 3 }}>   
              <ExternalConsultationToggle
                initialValues={{
                  summary: externalConsultationData.summary,
                  details: externalConsultationData.details,
                  totals: externalConsultationData.totals
                }}
                onValuesChange={handleExternalConsultationChange}
                readOnly={readOnly || reportStatus === 'submitted'}
                reportStatus={reportStatus}
              />
            </Box> 
 



          </Stack>
        </Paper>
        {/* Consolidated Content Section */}
        <ConsolidatedContentComponentCount
          data={consolidatedDataCount}
          departments={departments}
          hospitalId={hospitalId}
          onDataChange={handleConsolidatedDataCountChange}
          validationErrors={validationErrors}
          readOnly={readOnly || reportStatus === 'submitted'}
          loading={loading}
        />

        {/* Consolidated Content Section */}
        <ConsolidatedContentComponent
          data={consolidatedData}
          departments={departments}
          doctors={doctors}
          hospitalId={hospitalId}
          onDataChange={handleConsolidatedDataChange}
          validationErrors={validationErrors}
          readOnly={readOnly || reportStatus === 'submitted'}
          loading={loading}
        />

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
              <Tooltip title="当日の業務に関する特記事項を記入する欄になります。
フリーでテキスト入力ができます。">
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