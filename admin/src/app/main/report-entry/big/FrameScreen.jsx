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
import ShiftNursesSection from './ShiftNursesSection';
import DutyStaffSection from './DutyStaffSection';
import ExternalDoctorsSection from './ExternalDoctorsSection';
import apiConfig from '../../../configs/apiConfig';
import axios from 'axios';

// Helper function to convert full-width numbers to half-width
const normalizeNumberInput = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[０-９]/g, (char) => 
    String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
  );
};

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
  isEditingFromView=false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [date, setDate] = useState(reportDate || new Date());
  const [admissionCount, setAdmissionCount] = useState("0");
  const [dischargeCount, setDischargeCount] = useState("0");
  const [externalDoctors, setExternalDoctors] = useState({
    morning: "0",
    afternoon: "0",
    duty: "0"
  });
  const [externalConsultation, setExternalConsultation] = useState({
    emergencyTransport: "0",
    postTransportAdmission: "0",
    visit: "0"
  });

  const [shiftNurses, setShiftNurses] = useState({
    earlyNight: [{ id: Date.now() + 1, name: "" }],
    lateNight: [{ id: Date.now() + 2, name: "" }]
  });

  const [currentStatus, setCurrentStatus] = useState({
    firstRow: Array(7).fill(""),
    secondRow: Array(7).fill(""),
    thirdRow: Array(7).fill("")
  });
  const [specialNotes, setSpecialNotes] = useState("");
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Track if form data has been loaded
  const [formDataLoaded, setFormDataLoaded] = useState(false);

  // Refs to track form state and prevent flickering
  const isInitialMountRef = useRef(true);
  const previousFormDataRef = useRef(null);
  const loadingRef = useRef(false);
  const externalDoctorsInitializedRef = useRef(false);

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
      externalDoctorsInitializedRef.current = true;
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
      externalDoctorsInitializedRef.current = false;
    }
    
    // Reset formDataLoaded flag when formData becomes null
    if (!formData && formDataLoaded) {
      setFormDataLoaded(false);
      externalDoctorsInitializedRef.current = false;
    }
  }, [formData, loading, reportDate]);

  // Load form data from existing report
  const loadFormData = async (data) => {
    console.log('Loading form data:', data);
    
    // Mark that we've loaded form data
    setFormDataLoaded(true);
    externalDoctorsInitializedRef.current = true;
    
    // Basic stats - always load from form data
    setAdmissionCount(data.admission_count?.toString() || "0");
    setDischargeCount(data.discharge_count?.toString() || "0");
    
    // External doctors - ALWAYS load from form data when we have it
    setExternalDoctors({
      morning: data.external_morning?.toString() || "0",
      afternoon: data.external_afternoon?.toString() || "0",
      duty: data.external_duty?.toString() || "0"
    });
    
    // External consultation (now free text fields)
    setExternalConsultation({
      emergencyTransport: data.emergency_transport?.toString() || "0",
      postTransportAdmission: data.post_transport_admission?.toString() || "0",
      visit: data.visit_count?.toString() || "0"
    });
    
    // Shift nurses - handle both array format and our state format
    let earlyNight = [];
    let lateNight = [];
    
    if (data.shift_nurses && Array.isArray(data.shift_nurses)) {
      // Use proper IDs from data or generate new ones
      earlyNight = data.shift_nurses
        .filter(nurse => nurse.shift_type === 0 || nurse.shift_type === "0")
        .map((nurse, index) => ({ 
          id: nurse.id || Date.now() + index + 1000,
          name: nurse.nurse_name || "" 
        }));
      
      lateNight = data.shift_nurses
        .filter(nurse => nurse.shift_type === 1 || nurse.shift_type === "1")
        .map((nurse, index) => ({ 
          id: nurse.id || Date.now() + index + 2000,
          name: nurse.nurse_name || "" 
        }));
    }
    
    // Ensure at least one field exists
    if (earlyNight.length === 0) {
      earlyNight = [{ id: Date.now() + 1000, name: "" }];
    }
    
    if (lateNight.length === 0) {
      lateNight = [{ id: Date.now() + 2000, name: "" }];
    }
    
    console.log('Setting shift nurses:', { earlyNight, lateNight });
    setShiftNurses({ 
      earlyNight,
      lateNight
    });
    
    // Duty staff - map to field positions dynamically
    if (data.duty_staff && Array.isArray(data.duty_staff) && data.duty_staff.length > 0) {
      // Sort duty staff by position to maintain order
      const sortedDutyStaff = [...data.duty_staff].sort((a, b) => {
        // Extract numbers from position strings like "field_group_1"
        const numA = parseInt(a.position?.replace('field_group_', '') || '0');
        const numB = parseInt(b.position?.replace('field_group_', '') || '0');
        return numA - numB;
      });
      
      // Initialize arrays
      const firstRow = [];
      const secondRow = [];
      const thirdRow = [];
      
      // Fill arrays with duty staff data
      sortedDutyStaff.forEach(staff => {
        firstRow.push(staff.staff_name_1 || "");
        secondRow.push(staff.staff_name_2 || "");
        thirdRow.push(staff.staff_name_3 || "");
      });
      
      console.log('Setting duty staff:', { 
        count: sortedDutyStaff.length,
        firstRow, 
        secondRow, 
        thirdRow 
      });
      
      setCurrentStatus({ firstRow, secondRow, thirdRow });
    } else {
      // Initialize with default fields
      console.log('No duty staff data, initializing with default fields');
      setCurrentStatus({ 
        firstRow: Array(7).fill(""), 
        secondRow: Array(7).fill(""),
        thirdRow: Array(7).fill("")
      });
    }
    
    // Special notes
    setSpecialNotes(data.special_notes || "");
    
    // Consolidated data from report_details
    if (data.report_details && Array.isArray(data.report_details) && data.report_details.length > 0) {
      console.log('Setting consolidated data from form data:', data.report_details.length, 'items');
      setConsolidatedData(data.report_details);
    } else {
      //here call the api and response set this state 
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
    
    // Clear validation errors when loading data
    setValidationErrors({});
    
    console.log('Form data loading complete');
  };

  // Reset form to initial state (complete reset)
  const resetForm = () => {
    console.log('Resetting form completely');
    setAdmissionCount("0");
    setDischargeCount("0");
    
    // Reset external doctors
    setExternalDoctors({
      morning: "0",
      afternoon: "0",
      duty: "0"
    });
    
    setExternalConsultation({ 
      emergencyTransport: "0", 
      postTransportAdmission: "0", 
      visit: "0" 
    });
    
    setShiftNurses({ 
      earlyNight: [{ id: Date.now() + 1, name: "" }],
      lateNight: [{ id: Date.now() + 2, name: "" }]
    });
    
    setCurrentStatus({ 
      firstRow: Array(7).fill(""), 
      secondRow: Array(7).fill(""),
      thirdRow: Array(7).fill("")
    });
    
    setSpecialNotes("");
    
    // Reset consolidated data to empty array
    setConsolidatedData([]);
    
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
    
    if (!admissionCount || isNaN(parseInt(admissionCount))) {
      errors.admissionCount = "有効な入院数が必要です";
    }
    
    if (!dischargeCount || isNaN(parseInt(dischargeCount))) {
      errors.dischargeCount = "有効な退院数が必要です";
    }
    
    // External consultation validation (now free text)
    if (!externalConsultation.emergencyTransport || isNaN(parseInt(externalConsultation.emergencyTransport))) {
      errors.emergencyTransport = "有効な緊急搬送数が必要です";
    }
    
    if (!externalConsultation.postTransportAdmission || isNaN(parseInt(externalConsultation.postTransportAdmission))) {
      errors.postTransportAdmission = "有効な搬送後入院数が必要です";
    }
    
    /*if (!externalConsultation.visit || isNaN(parseInt(externalConsultation.visit))) {
      errors.visit = "有効な訪問数が必要です ";
    }*/
    
    // Validate shift nurses (at least one per shift)
    const hasEarlyNight = shiftNurses.earlyNight.some(nurse => nurse.name.trim() !== "");
    const hasLateNight = shiftNurses.lateNight.some(nurse => nurse.name.trim() !== "");
    
    if (!hasEarlyNight) {
      errors.earlyNight = "早夜勤看護師は少なくとも1人必要です";
    }
    
    if (!hasLateNight) {
      errors.lateNight = "遅夜勤看護師は少なくとも1人必要です";
    }
    
    // Validate duty staff - dynamic validation based on current field count
    const fieldCount = currentStatus.firstRow?.length || 0;
    for (let i = 0; i < fieldCount; i++) {
      const firstRowValue = currentStatus.firstRow?.[i];
      const secondRowValue = currentStatus.secondRow?.[i];
      const thirdRowValue = currentStatus.thirdRow?.[i];
      
      if (firstRowValue !== undefined && typeof firstRowValue !== 'string') {
        errors[`dutyStaff_field_group_${i + 1}_1`] = "当直部署は有効である必要があります";
      }
      if (secondRowValue !== undefined && typeof secondRowValue !== 'string') {
        errors[`dutyStaff_field_group_${i + 1}_2`] = "当直医師1は有効である必要があります";
      }
      if (thirdRowValue !== undefined && typeof thirdRowValue !== 'string') {
        errors[`dutyStaff_field_group_${i + 1}_3`] = "当直医師2は有効である必要があります";
      }
    }
    
    // Validate consolidated data
    if (consolidatedData.length === 0) {
      errors.consolidatedData = "少なくとも1つの診療科エントリが必要です";
    } else {
      consolidatedData.forEach((item, index) => {
        if (!item.department_id) {
          errors[`department_${index}`] = "診療科の選択が必要です";
        }
        if (!item.patient_count && item.patient_count !== 0) {
          errors[`patientCount_${index}`] = "患者数が必要です";
        }
      });
    }
    
    setValidationErrors(errors);
    
    // Scroll to top when there are errors
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    return Object.keys(errors).length === 0;
  };

  const prepareFormData = () => {
    // Prepare shift nurses
    const shiftNursesData = [
      ...shiftNurses.earlyNight
        .filter(nurse => nurse.name.trim() !== "")
        .map(nurse => ({
          shift_type: 0,
          nurse_name: nurse.name.trim()
        })),
      ...shiftNurses.lateNight
        .filter(nurse => nurse.name.trim() !== "")
        .map(nurse => ({
          shift_type: 1,
          nurse_name: nurse.name.trim()
        }))
    ];

    // Get the current number of duty staff fields from the currentStatus
    const fieldCount = currentStatus.firstRow?.length || 0;

    // Prepare duty staff - dynamic fields based on currentStatus length
    const dutyStaffData = Array.from({ length: fieldCount }, (_, index) => ({
      position: `field_group_${index + 1}`,
      staff_name_1: (currentStatus.firstRow?.[index] || "").trim(),
      staff_name_2: (currentStatus.secondRow?.[index] || "").trim(),
      staff_name_3: (currentStatus.thirdRow?.[index] || "").trim()
    }));

    // Filter out completely empty duty staff entries
    const filteredDutyStaffData = dutyStaffData.filter(staff => 
      staff.staff_name_1 || staff.staff_name_2 || staff.staff_name_3
    );

    // Filter out empty consolidated data
    const filteredConsolidatedData = consolidatedData.filter(item => 
      item.department_id && item.patient_count !== undefined
    );

    return {
      admission_count: parseInt(admissionCount) || 0,
      discharge_count: parseInt(dischargeCount) || 0,
      external_morning: parseInt(externalDoctors.morning) || 0,
      external_afternoon: parseInt(externalDoctors.afternoon) || 0,
      external_duty: parseInt(externalDoctors.duty) || 0,
      emergency_transport: parseInt(externalConsultation.emergencyTransport) || 0,
      post_transport_admission: parseInt(externalConsultation.postTransportAdmission) || 0,
      visit_count: parseInt(externalConsultation.visit) || 0,
      special_notes: specialNotes.trim(),
      shift_nurses: shiftNursesData,
      duty_staff: filteredDutyStaffData,
      report_details: filteredConsolidatedData,
      hospital_type: 'large_hospital',
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
  const handleAdmissionChange = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    
    // Now check if it's a valid number (both half-width and normalized full-width will pass)
    if (/^\d*$/.test(normalizedValue)) {
      setAdmissionCount(normalizedValue);
      // Clear error if fixed
      if (validationErrors.admissionCount && normalizedValue && !isNaN(parseInt(normalizedValue))) {
        const newErrors = { ...validationErrors };
        delete newErrors.admissionCount;
        setValidationErrors(newErrors);
      }
    }
  };

  // Handle blur to ensure normalization
  const handleAdmissionBlur = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    if (normalizedValue !== admissionCount) {
      setAdmissionCount(normalizedValue);
    }
  };

  // Handle focus event to select all text
  const handleFocusSelect = (e) => {
    e.target.select();
  };

  const handleDischargeChange = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    
    if (/^\d*$/.test(normalizedValue)) {
      setDischargeCount(normalizedValue);
      // Clear error if fixed
      if (validationErrors.dischargeCount && normalizedValue && !isNaN(parseInt(normalizedValue))) {
        const newErrors = { ...validationErrors };
        delete newErrors.dischargeCount;
        setValidationErrors(newErrors);
      }
    }
  };

  // Handle blur to ensure normalization
  const handleDischargeBlur = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    if (normalizedValue !== dischargeCount) {
      setDischargeCount(normalizedValue);
    }
  };

  // Handle external consultation change (now free text)
  const handleEmergencyTransportChange = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    
    if (/^\d*$/.test(normalizedValue)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        emergencyTransport: normalizedValue 
      }));
      // Clear error if fixed
      if (validationErrors.emergencyTransport && normalizedValue && !isNaN(parseInt(normalizedValue))) {
        const newErrors = { ...validationErrors };
        delete newErrors.emergencyTransport;
        setValidationErrors(newErrors);
      }
    }
  };

  // Handle blur to ensure normalization
  const handleEmergencyTransportBlur = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    if (normalizedValue !== externalConsultation.emergencyTransport) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        emergencyTransport: normalizedValue 
      }));
    }
  };

  const handlePostTransportAdmissionChange = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    
    if (/^\d*$/.test(normalizedValue)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        postTransportAdmission: normalizedValue 
      }));
      // Clear error if fixed
      if (validationErrors.postTransportAdmission && normalizedValue && !isNaN(parseInt(normalizedValue))) {
        const newErrors = { ...validationErrors };
        delete newErrors.postTransportAdmission;
        setValidationErrors(newErrors);
      }
    }
  };

  // Handle blur to ensure normalization
  const handlePostTransportAdmissionBlur = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    if (normalizedValue !== externalConsultation.postTransportAdmission) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        postTransportAdmission: normalizedValue 
      }));
    }
  };

  const handleVisitChange = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    
    if (/^\d*$/.test(normalizedValue)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        visit: normalizedValue 
      }));
      // Clear error if fixed
      if (validationErrors.visit && normalizedValue && !isNaN(parseInt(normalizedValue))) {
        const newErrors = { ...validationErrors };
        delete newErrors.visit;
        setValidationErrors(newErrors);
      }
    }
  };

  // Handle blur to ensure normalization
  const handleVisitBlur = (e) => {
    const normalizedValue = normalizeNumberInput(e.target.value);
    if (normalizedValue !== externalConsultation.visit) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        visit: normalizedValue 
      }));
    }
  };

  // Handle external doctors change from the child component
  const handleExternalDoctorsChange = (newExternalDoctors) => {
    // Convert any full-width numbers to half-width
    const normalizedDoctors = Object.keys(newExternalDoctors).reduce((acc, key) => {
      const value = newExternalDoctors[key];
      if (typeof value === 'string') {
        acc[key] = normalizeNumberInput(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    // Only update if we haven't initialized from form data yet
    if (!externalDoctorsInitializedRef.current) {
      setExternalDoctors(normalizedDoctors);
    }
  };

  // Handle shift nurses change from the child component
  const handleShiftNursesChange = (newShiftNurses) => {
    setShiftNurses(newShiftNurses);
    
    // Clear errors if fixed
    const newErrors = { ...validationErrors };
    const hasEarlyNight = newShiftNurses.earlyNight.some(nurse => nurse.name.trim() !== "");
    const hasLateNight = newShiftNurses.lateNight.some(nurse => nurse.name.trim() !== "");
    
    if (hasEarlyNight && newErrors.earlyNight) {
      delete newErrors.earlyNight;
    }
    if (hasLateNight && newErrors.lateNight) {
      delete newErrors.lateNight;
    }
    
    setValidationErrors(newErrors);
  };

  // Handle current status change from the child component
  const handleCurrentStatusChange = (newStatus) => {
    setCurrentStatus(newStatus);
  };

  const handleSpecialNotesChange = (e) => {
    setSpecialNotes(e.target.value);
  };

  const handleConsolidatedDataChange = (newData) => {
    setConsolidatedData(newData);
    // Clear consolidated data error if data is added
    if (validationErrors.consolidatedData && newData.length > 0) {
      const newErrors = { ...validationErrors };
      delete newErrors.consolidatedData;
      setValidationErrors(newErrors);
    }
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
    admissionCount,
    dischargeCount,
    externalDoctors,
    externalConsultation,
    shiftNurses,
    currentStatus,
    specialNotes,
    consolidatedData
  ]);

  // Expose the save and submit handlers to parent via refs or callbacks
  useEffect(() => {
    // This effect runs when the component mounts and sets up the callback functions
    // that the parent (ReportEntry) can call
    if (onHeaderSaveDraft || onHeaderSubmit) {
      // We're not actually calling them here, just making them available
      // The parent component will handle calling these functions
    }
  }, []);

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

        {/* Emergency Statistics Section */}
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
                入院
              </Typography>
              <Tooltip title={
    <>
      当日の確定した入院人数および退院人数を入力してください。<br />
      こちらに入力した人数は自動的に集計され統計データとして保存されます。
    </>
  }>
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Admission Count */}
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
                    入院数
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={admissionCount}
                    onChange={handleAdmissionChange}
                    onBlur={handleAdmissionBlur}
                    //onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.admissionCount}
                    helperText={validationErrors.admissionCount}
                    disabled={readOnly || reportStatus === 'submitted'} 
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.admissionCount ? "#df1c41" : "#dfe1e7",
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

              {/* Discharge Count */}
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
                    退院数
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={dischargeCount}
                    onChange={handleDischargeChange}
                    onBlur={handleDischargeBlur}
                    //onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.dischargeCount}
                    helperText={validationErrors.dischargeCount}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.dischargeCount ? "#df1c41" : "#dfe1e7",
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

        {/* External Doctors Section - Using New Component */}
        <ExternalDoctorsSection
          externalDoctors={externalDoctors}
          onExternalDoctorsChange={handleExternalDoctorsChange}
          validationErrors={validationErrors}
          textFieldHeight={textFieldHeight}
          fontSize={fontSize}
          isMobile={isMobile}
          isTablet={isTablet}
          sectionPadding={sectionPadding}
          readOnly={readOnly || reportStatus === 'submitted'}
          hospitalId={hospitalId}
          reportDate={date}
          formDataLoaded={formDataLoaded}
        />

        {/* External Consultation Section - NOW FREE TEXT */}
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
                緊急
              </Typography>
              <Tooltip title="救急車等により搬送された患者数を記入します。その後入院に至った数を入力する。
訪問は訪問きた人数を記入します。">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Emergency Transport - FREE TEXT */}
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
                    緊急搬入数
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={externalConsultation.emergencyTransport}
                    onChange={handleEmergencyTransportChange}
                    onBlur={handleEmergencyTransportBlur}
                    //onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.emergencyTransport}
                    helperText={validationErrors.emergencyTransport}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.emergencyTransport ? "#df1c41" : "#dfe1e7",
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

              {/* Post Transport Admission - FREE TEXT */}
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
                    搬入後入院件数
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={externalConsultation.postTransportAdmission}
                    onChange={handlePostTransportAdmissionChange}
                    onBlur={handlePostTransportAdmissionBlur}
                    //onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.postTransportAdmission}
                    helperText={validationErrors.postTransportAdmission}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.postTransportAdmission ? "#df1c41" : "#dfe1e7",
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

              {/* Visit - FREE TEXT */}
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
                    訪問 
                    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                      
                    </Typography>
                  </Typography>
                  <TextField
                    value={externalConsultation.visit}
                    onChange={handleVisitChange}
                    onBlur={handleVisitBlur}
                    //onFocus={handleFocusSelect}
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.visit}
                    helperText={validationErrors.visit}
                    disabled={readOnly || reportStatus === 'submitted'}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        height: textFieldHeight,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationErrors.visit ? "#df1c41" : "#dfe1e7",
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

        {/* Shift Nurses Section - Using New Component */}
        <ShiftNursesSection
          shiftNurses={shiftNurses}
          onShiftNursesChange={handleShiftNursesChange}
          validationErrors={validationErrors}
          textFieldHeight={textFieldHeight}
          fontSize={fontSize}
          isMobile={isMobile}
          isTablet={isTablet}
          sectionPadding={sectionPadding}
          readOnly={readOnly || reportStatus === 'submitted'}
        />

        {/* Duty Staff Section - Separate Component */}
        <DutyStaffSection
          currentStatus={currentStatus}
          onCurrentStatusChange={handleCurrentStatusChange}
          validationErrors={validationErrors}
          textFieldHeight={textFieldHeight}
          fontSize={fontSize}
          isMobile={isMobile}
          isTablet={isTablet}
          readOnly={readOnly || reportStatus === 'submitted'}
          sectionPadding={sectionPadding}
        />

        {/* Consolidated Content Component */}
        <Paper
          elevation={0}
          sx={{
            p: sectionPadding,
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
          }}
        >
          <ConsolidatedContentComponent
            data={consolidatedData}
            departments={departments}
            doctors={doctors}
            hospitalId={hospitalId}
            onDataChange={handleConsolidatedDataChange}
            validationErrors={validationErrors}
            readOnly={readOnly || reportStatus === 'submitted'}
          />
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