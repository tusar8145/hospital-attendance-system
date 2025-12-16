import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Divider, 
  Stack, 
  TextField, 
  Typography,
  Container,
  useMediaQuery,
  useTheme,
  Grid,
  CircularProgress,
  IconButton,
  Paper,
  Alert,
  Tooltip
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
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';

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
  readOnly = false
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
    firstRow: Array(21).fill(""),   // 1人目
    secondRow: Array(21).fill(""),  // 2人目
    thirdRow: Array(21).fill("")    // 3人目
  });
  const [specialNotes, setSpecialNotes] = useState("");
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  
  // New states for read-only stats (for morning, afternoon, duty)
  const [monthlyCumulativeStats, setMonthlyCumulativeStats] = useState({
    morningClinic: 0,
    afternoonClinic: 0,
    onDuty: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // NEW: Refs to track loading states and prevent flickering
  const formDataLoadedRef = useRef(false);
  const statsLoadedRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch read-only statistics from API - ONLY when there's no existing form data
  const fetchReadOnlyStats = async () => {
    if (!hospitalId) return;
    
    // Don't fetch stats if we already have form data loaded
    if (formDataLoadedRef.current) {
      console.log('Skipping stats fetch - form data already loaded');
      return;
    }
    
    setStatsLoading(true);
    setStatsError(null);
    
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report/read-only-stats`, {
        date: formatDateForAPI(date),
        hospital_id: hospitalId
      });

      if (response.data.success) {
        const { monthlyCumulative } = response.data.data;
        
        // Update the read-only fields with monthly cumulative values
        setMonthlyCumulativeStats({
          morningClinic: monthlyCumulative.morningClinic || 0,
          afternoonClinic: monthlyCumulative.afternoonClinic || 0,
          onDuty: monthlyCumulative.onDuty || 0
        });
        
        // Only set external doctors if we haven't loaded form data yet
        if (!formDataLoadedRef.current) {
          setExternalDoctors({
            morning: monthlyCumulative.morningClinic?.toString() || "0",
            afternoon: monthlyCumulative.afternoonClinic?.toString() || "0",
            duty: monthlyCumulative.onDuty?.toString() || "0"
          });
        }
        
        statsLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Error fetching read-only stats:', error);
      setStatsError('統計データの取得に失敗しました');
      
      // Only reset to 0 if we don't have form data
      if (!formDataLoadedRef.current) {
        setExternalDoctors({
          morning: "0",
          afternoon: "0",
          duty: "0"
        });
        
        setMonthlyCumulativeStats({
          morningClinic: 0,
          afternoonClinic: 0,
          onDuty: 0
        });
      }
    } finally {
      setStatsLoading(false);
    } 
  };

  // Initialize form when formData changes - FIXED VERSION
  useEffect(() => {
    console.log('FrameScreen: formData changed', formData, 'loading:', loading);
    
    if (formData && Object.keys(formData).length > 0 && !initialLoadCompleteRef.current) {
      console.log('Loading form data into FrameScreen');
      loadFormData(formData);
      formDataLoadedRef.current = true;
      initialLoadCompleteRef.current = true;
    } else if (!formData && !initialLoadCompleteRef.current) {
      console.log('No form data, initializing empty form');
      resetForm();
      initialLoadCompleteRef.current = true;
    }
  }, [formData, loading]);

  // Fetch stats on mount - but only if we don't have form data
  useEffect(() => {
    if (hospitalId && date && !formDataLoadedRef.current) {
      console.log('Fetching read-only stats (no form data yet)');
      fetchReadOnlyStats();
    }
  }, [hospitalId, date]);

  // Load form data from existing report - COMPLETE VERSION
  const loadFormData = (data) => {
    console.log('Loading form data:', data);
    
    // Mark that we've loaded form data
    formDataLoadedRef.current = true;
    
    // Basic stats - always load from form data
    setAdmissionCount(data.admission_count?.toString() || "0");
    setDischargeCount(data.discharge_count?.toString() || "0");
    
    // External doctors - ALWAYS load from form data when we have it
    // This overrides any stats data
    setExternalDoctors({
      morning: data.external_morning?.toString() || "0",
      afternoon: data.external_afternoon?.toString() || "0",
      duty: data.external_duty?.toString() || "0"
    });
    
    // Update monthly stats display (read-only info)
    setMonthlyCumulativeStats({
      morningClinic: data.external_morning || 0,
      afternoonClinic: data.external_afternoon || 0,
      onDuty: data.external_duty || 0
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
    
    // Duty staff - map to field positions
    const fieldData = [
      { position: "field_group_1" },
      { position: "field_group_2" },
      { position: "field_group_3" },
      { position: "field_group_4" },
      { position: "field_group_5" },
      { position: "field_group_6" },
      { position: "field_group_7" },
    ];
    
    if (data.duty_staff && Array.isArray(data.duty_staff)) {
      const firstRow = Array(21).fill("");
      const secondRow = Array(21).fill("");
      const thirdRow = Array(21).fill("");
      
      fieldData.forEach((field, index) => {
        const staff = data.duty_staff.find(s => s.position === field.position);
        if (staff) {
          firstRow[index] = staff.staff_name_1 || "";
          secondRow[index] = staff.staff_name_2 || "";
          thirdRow[index] = staff.staff_name_3 || "";
        }
      });
      
      console.log('Setting duty staff:', { firstRow, secondRow, thirdRow });
      setCurrentStatus({ firstRow, secondRow, thirdRow });
    } else {
      // Initialize with empty arrays if no data
      console.log('No duty staff data, initializing empty');
      setCurrentStatus({ 
        firstRow: Array(21).fill(""), 
        secondRow: Array(21).fill(""),
        thirdRow: Array(21).fill("")
      });
    }
    
    // Special notes
    setSpecialNotes(data.special_notes || "");
    
    // Consolidated data from report_details
    // IMPORTANT: Only update if we have data, otherwise keep existing
    if (data.report_details && Array.isArray(data.report_details) && data.report_details.length > 0) {
      console.log('Setting consolidated data:', data.report_details);
      setConsolidatedData(data.report_details);
    } else {
      console.log('No consolidated data in form data');
      // Keep existing consolidated data
    }
    
    // Clear validation errors when loading data
    setValidationErrors({});
    
    console.log('Form data loading complete');
  };

  // Reset form to initial state (only basic fields, not consolidated data)
  const resetForm = () => {
    console.log('Resetting form');
    setAdmissionCount("0");
    setDischargeCount("0");
    // External doctors will be set by stats fetch
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
      firstRow: Array(21).fill(""), 
      secondRow: Array(21).fill(""),
      thirdRow: Array(21).fill("")
    });
    setSpecialNotes("");
    // IMPORTANT: DO NOT reset consolidatedData here
    setValidationErrors({});
  };

  // Format date for display
  const formatJapaneseDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  // Handle date navigation
  const handlePreviousDay = () => { 
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    setDate(newDate);
    onDateChange(newDate);
    
    // Reset refs for new date
    formDataLoadedRef.current = false;
    statsLoadedRef.current = false;
    initialLoadCompleteRef.current = false;
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    setDate(newDate);
    onDateChange(newDate);
    
    // Reset refs for new date
    formDataLoadedRef.current = false;
    statsLoadedRef.current = false;
    initialLoadCompleteRef.current = false;
  };


  // In handleDatePickerChange function, add validation
const handleDatePickerChange = (newDate) => {
  if (shouldDisableDate(newDate)) {
    // Show error or prevent change
    showSnackbar('未来の日付は選択できません', 'warning');
    return;
  }
  
  setDate(newDate);
  onDateChange(newDate);
  
  // Reset refs for new date
  formDataLoadedRef.current = false;
  statsLoadedRef.current = false;
  initialLoadCompleteRef.current = false;
};

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!hospitalId) {
      errors.hospital = "Hospital selection is required";
    }
    
    if (!admissionCount || isNaN(parseInt(admissionCount))) {
      errors.admissionCount = "Valid admission count is required";
    }
    
    if (!dischargeCount || isNaN(parseInt(dischargeCount))) {
      errors.dischargeCount = "Valid discharge count is required";
    }
    
    // External consultation validation (now free text)
    if (!externalConsultation.emergencyTransport || isNaN(parseInt(externalConsultation.emergencyTransport))) {
      errors.emergencyTransport = "Valid emergency transport count is required";
    }
    
    if (!externalConsultation.postTransportAdmission || isNaN(parseInt(externalConsultation.postTransportAdmission))) {
      errors.postTransportAdmission = "Valid post transport admission count is required";
    }
    
    if (!externalConsultation.visit || isNaN(parseInt(externalConsultation.visit))) {
      errors.visit = "Valid visit count is required";
    }
    
    // Validate shift nurses (at least one per shift)
    const hasEarlyNight = shiftNurses.earlyNight.some(nurse => nurse.name.trim() !== "");
    const hasLateNight = shiftNurses.lateNight.some(nurse => nurse.name.trim() !== "");
    
    if (!hasEarlyNight) {
      errors.earlyNight = "At least one early night nurse is required";
    }
    
    if (!hasLateNight) {
      errors.lateNight = "At least one late night nurse is required";
    }
    
    // Validate duty staff - 21 fields are now OPTIONAL
    // Only validate if fields exist, they are strings
    for (let i = 0; i < 21; i++) {
      const firstRowValue = currentStatus.firstRow[i];
      const secondRowValue = currentStatus.secondRow[i];
      const thirdRowValue = currentStatus.thirdRow[i];
      
      if (firstRowValue !== undefined && typeof firstRowValue !== 'string') {
        errors[`dutyStaff_field_group_${i + 1}_1`] = "1人目は文字列である必要があります";
      }
      if (secondRowValue !== undefined && typeof secondRowValue !== 'string') {
        errors[`dutyStaff_field_group_${i + 1}_2`] = "2人目は文字列である必要があります";
      }
      if (thirdRowValue !== undefined && typeof thirdRowValue !== 'string') {
        errors[`dutyStaff_field_group_${i + 1}_3`] = "3人目は文字列である必要があります";
      }
    }
    
    // Validate consolidated data
    if (consolidatedData.length === 0) {
      errors.consolidatedData = "At least one department entry is required";
    } else {
      consolidatedData.forEach((item, index) => {
        if (!item.department_id) {
          errors[`department_${index}`] = "Department selection is required";
        }
        if (!item.patient_count && item.patient_count !== 0) {
          errors[`patientCount_${index}`] = "Patient count is required";
        }
      });
    }
    
    setValidationErrors(errors);
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

    // Field configuration for duty staff section - 21 fields total
    const fieldData = [
      { position: "field_group_1", label: "保安" },
      { position: "field_group_2", label: "医事" },
      { position: "field_group_3", label: "医事" },
      { position: "field_group_4", label: "保安" },
      { position: "field_group_5", label: "医事" },
      { position: "field_group_6", label: "内科" },
      { position: "field_group_7", label: "外科" },
    ];

    // Prepare duty staff - all 21 fields with 3 people each
    const dutyStaffData = fieldData.map((field, index) => ({
      position: field.position,
      staff_name_1: (currentStatus.firstRow[index] || "").trim(),
      staff_name_2: (currentStatus.secondRow[index] || "").trim(),
      staff_name_3: (currentStatus.thirdRow[index] || "").trim()
    }));

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
      duty_staff: dutyStaffData,
      report_details: filteredConsolidatedData,
      hospital_type: 'large_hospital',
    };
  };

  // Handle save draft
  const handleSaveDraftClick = () => {
    if (validateForm()) {
      const data = prepareFormData();
      onSaveDraft(data);
    }
  };

  // Handle submit
  const handleSubmitClick = () => {
    if (validateForm()) {
      const data = prepareFormData();
      onSubmit(data);
    }
  };

  // Handler functions for form fields with select all on focus
  const handleAdmissionChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setAdmissionCount(value);
      // Clear error if fixed
      if (validationErrors.admissionCount && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.admissionCount;
        setValidationErrors(newErrors);
      }
    }
  };

const shouldDisableDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  // Disable dates after today (future dates)
  return selectedDate > today;
};


  // Handle focus event to select all text
  const handleFocusSelect = (e) => {
    e.target.select();
  };

  const handleDischargeChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setDischargeCount(value);
      // Clear error if fixed
      if (validationErrors.dischargeCount && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.dischargeCount;
        setValidationErrors(newErrors);
      }
    }
  };

  const handleExternalDoctorChange = (field, value) => {
    if (/^\d*$/.test(value)) {
      setExternalDoctors(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle external consultation change (now free text)
  const handleEmergencyTransportChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        emergencyTransport: value 
      }));
      // Clear error if fixed
      if (validationErrors.emergencyTransport && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.emergencyTransport;
        setValidationErrors(newErrors);
      }
    }
  };

  const handlePostTransportAdmissionChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        postTransportAdmission: value 
      }));
      // Clear error if fixed
      if (validationErrors.postTransportAdmission && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.postTransportAdmission;
        setValidationErrors(newErrors);
      }
    }
  };

  const handleVisitChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setExternalConsultation(prev => ({ 
        ...prev, 
        visit: value 
      }));
      // Clear error if fixed
      if (validationErrors.visit && value && !isNaN(parseInt(value))) {
        const newErrors = { ...validationErrors };
        delete newErrors.visit;
        setValidationErrors(newErrors);
      }
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

  // Notify parent of form data changes - but only after initial load
  useEffect(() => {
    if (onFormDataChange && initialLoadCompleteRef.current) {
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
                size="small"
                sx={{ border: '1px solid #e0e0e0' }}
              >
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>
              
              <DatePicker
                value={date}
                onChange={handleDatePickerChange}
                 shouldDisableDate={shouldDisableDate} // Add this line
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
                disabled={shouldDisableDate(new Date(date.getTime() + 24 * 60 * 60 * 1000))} 
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

        {/* Stats Loading Indicator */}
        {statsLoading && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography sx={{ fontSize: fontSize.small }}>
                統計データを読み込み中...
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Stats Error */}
        {statsError && !statsLoading && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography sx={{ fontSize: fontSize.small }}>
              {statsError}
            </Typography>
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
              <Tooltip title="入院・退院に関する統計情報">
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
                    onFocus={handleFocusSelect}
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
                    onFocus={handleFocusSelect}
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

        {/* External Doctors Section - NOW READ-ONLY */}
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
                  backgroundColor: '#2ecc71',
                  borderRadius: '2px'
                }} />
                外来
              </Typography>
              <Tooltip title="外来診療の患者数（月間累積・読み取り専用）">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {[
                { field: 'morning', label: '午前診', color: '#3498db', apiField: 'morningClinic' },
                { field: 'afternoon', label: '午後診', color: '#9b59b6', apiField: 'afternoonClinic' },
                { field: 'duty', label: '当直', color: '#e74c3c', apiField: 'onDuty' }
              ].map((item, index) => (
                <Grid item xs={12} sm={4} key={item.field}>
                  <Stack spacing={1}>
                    <Typography sx={{ 
                      fontWeight: 600, 
                      fontSize: fontSize.medium,
                      color: "#6b7280",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }} />
                      {item.label}
                      <Typography component="span" sx={{ color: "#666", fontSize: fontSize.small, fontWeight: 400 }}>
                        (月間累積)
                      </Typography>
                    </Typography>
                    <TextField
                      value={externalDoctors[item.field]}
                      variant="outlined"
                      fullWidth
                      size="small"
                      disabled
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "#f5f5f5",
                          height: textFieldHeight,
                          "& fieldset": { 
                            borderColor: "#e0e0e0",
                          },
                          "& input": {
                            fontSize: fontSize.medium,
                            textAlign: 'right',
                            paddingRight: 2,
                            fontWeight: 600,
                            color: "#2c3e50",
                          },
                          "&.Mui-disabled": {
                            "& input": {
                              color: "#2c3e50",
                              WebkitTextFillColor: "#2c3e50",
                            }
                          }
                        },
                      }}
                    />
                    {statsLoading ? (
                      <Typography sx={{ fontSize: fontSize.small, color: '#666', fontStyle: 'italic' }}>
                        データ読み込み中...
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: fontSize.small, color: '#666', fontStyle: 'italic' }}>
                        月間累積: {monthlyCumulativeStats[item.apiField] || 0}件
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Paper>

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
              <Tooltip title="緊急搬入・訪問診療に関する情報">
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
                    onFocus={handleFocusSelect}
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
                    onFocus={handleFocusSelect}
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
                      *
                    </Typography>
                  </Typography>
                  <TextField
                    value={externalConsultation.visit}
                    onChange={handleVisitChange}
                    onFocus={handleFocusSelect}
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
                disabled={isSavingDraft || isSubmitting || loading || statsLoading}
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
                disabled={isSubmitting || isSavingDraft || loading || statsLoading}
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
                提出日: {reportDate ? formatJapaneseDate(reportDate) : '不明'}
              </Typography>
            </Alert>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
});

export default FrameScreen;