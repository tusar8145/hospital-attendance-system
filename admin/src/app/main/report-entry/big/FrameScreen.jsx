import React, { useState, useEffect } from 'react';
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
    firstRow: Array(6).fill(""),
    secondRow: Array(6).fill("")
  });
  const [specialNotes, setSpecialNotes] = useState("");
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Field configuration for duty staff section
  const fieldData = [
    { 
      label: "保安", 
      position: "security", 
      required: true,
      description: "Security staff on duty"
    },
    { 
      label: "医事", 
      position: "medical_affairs", 
      required: true,
      description: "Medical affairs staff (primary)"
    },
    { 
      label: "医事", 
      position: "medical_affairs_2", 
      required: true,
      description: "Medical affairs staff (secondary)"
    },
    { 
      label: "保安", 
      position: "security_2", 
      required: true,
      description: "Additional security staff"
    },
    { 
      label: "医事", 
      position: "medical_affairs_3", 
      required: true,
      description: "Additional medical affairs staff"
    },
    { 
      label: "内科", 
      position: "internal_medicine", 
      required: true,
      description: "Internal medicine duty staff"
    },
  ];

  // Initialize form when formData changes
  useEffect(() => {
    if (formData) {
      loadFormData(formData);
    } else {
      resetForm();
    }
  }, [formData]);

  // Load form data from existing report
  const loadFormData = (data) => {
    // Basic stats
    setAdmissionCount(data.admission_count?.toString() || "0");
    setDischargeCount(data.discharge_count?.toString() || "0");
    
    // External doctors
    setExternalDoctors({
      morning: data.external_morning?.toString() || "0",
      afternoon: data.external_afternoon?.toString() || "0",
      duty: data.external_duty?.toString() || "0"
    });
    
    // External consultation
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
          id: nurse.id || Date.now() + Math.random(),
          name: nurse.nurse_name || "" 
        }));
      
      lateNight = data.shift_nurses
        .filter(nurse => nurse.shift_type === 1 || nurse.shift_type === "1")
        .map((nurse, index) => ({ 
          id: nurse.id || Date.now() + Math.random(),
          name: nurse.nurse_name || "" 
        }));
    }
    
    // Ensure at least one field exists
    if (earlyNight.length === 0) {
      earlyNight = [{ id: Date.now() + Math.random(), name: "" }];
    }
    
    if (lateNight.length === 0) {
      lateNight = [{ id: Date.now() + Math.random(), name: "" }];
    }
    
    setShiftNurses({ 
      earlyNight,
      lateNight
    });
    
    // Duty staff - map to fieldData positions
    if (data.duty_staff && Array.isArray(data.duty_staff)) {
      const firstRow = [];
      const secondRow = [];
      
      fieldData.forEach((field, index) => {
        const staff = data.duty_staff.find(s => s.position === field.position);
        firstRow[index] = staff?.staff_name_1 || "";
        secondRow[index] = staff?.staff_name_2 || "";
      });
      
      setCurrentStatus({ firstRow, secondRow });
    }
    
    // Special notes
    setSpecialNotes(data.special_notes || "");
    
    // Consolidated data from report_details
    if (data.report_details && Array.isArray(data.report_details)) {
      const consolidated = [];
      data.report_details.forEach(detail => {
        consolidated.push({
          sequence_no: detail.sequence_no,
          department_id: detail.department_id,
          department_name: detail.department?.name,
          consultation_type: detail.consultation_type,
          doctor_id_1: detail.doctor_id_1,
          doctor_id_2: detail.doctor_id_2,
          doctor_id_3: detail.doctor_id_3,
          patient_count: detail.patient_count
        });
      });
      setConsolidatedData(consolidated);
    }
    
    // Clear validation errors when loading data
    setValidationErrors({});
  };

  // Reset form to initial state
  const resetForm = () => {
    setAdmissionCount("0");
    setDischargeCount("0");
    setExternalDoctors({ morning: "0", afternoon: "0", duty: "0" });
    setExternalConsultation({ emergencyTransport: "0", postTransportAdmission: "0", visit: "0" });
    setShiftNurses({ 
      earlyNight: [{ id: Date.now() + Math.random(), name: "" }],
      lateNight: [{ id: Date.now() + Math.random(), name: "" }]
    });
    setCurrentStatus({ firstRow: Array(6).fill(""), secondRow: Array(6).fill("") });
    setSpecialNotes("");
    setConsolidatedData([]);
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
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    setDate(newDate);
    onDateChange(newDate);
  };

  // Handle date picker change
  const handleDatePickerChange = (newDate) => {
    setDate(newDate);
    onDateChange(newDate);
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
    
    if (!externalConsultation.emergencyTransport || isNaN(parseInt(externalConsultation.emergencyTransport))) {
      errors.emergencyTransport = "Valid emergency transport count is required";
    }
    
    if (!externalConsultation.postTransportAdmission || isNaN(parseInt(externalConsultation.postTransportAdmission))) {
      errors.postTransportAdmission = "Valid post-transport admission count is required";
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
    
    // Validate duty staff
    fieldData.forEach((field, index) => {
      if (field.required) {
        if (!currentStatus.firstRow[index]?.trim()) {
          errors[`dutyStaff_${field.position}_1`] = `${field.label} (first name) is required`;
        }
        if (!currentStatus.secondRow[index]?.trim()) {
          errors[`dutyStaff_${field.position}_2`] = `${field.label} (second name) is required`;
        }
      }
    });
    
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

    // Prepare duty staff
    const dutyStaffData = fieldData.map((field, index) => ({
      position: field.position,
      staff_name_1: (currentStatus.firstRow[index] || "").trim(),
      staff_name_2: (currentStatus.secondRow[index] || "").trim()
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
      report_details: filteredConsolidatedData
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

  // Handler functions for form fields
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

  const handleEmergencyTransportChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setExternalConsultation(prev => ({ ...prev, emergencyTransport: value }));
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
      setExternalConsultation(prev => ({ ...prev, postTransportAdmission: value }));
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
      setExternalConsultation(prev => ({ ...prev, visit: value }));
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

  const handleCurrentStatusChange = (row, index, value) => {
    const field = fieldData[index];
    const errorKey1 = `dutyStaff_${field.position}_1`;
    const errorKey2 = `dutyStaff_${field.position}_2`;
    
    setCurrentStatus(prev => ({
      ...prev,
      [row]: prev[row].map((item, i) => i === index ? value : item)
    }));
    
    // Clear errors if fixed
    const newErrors = { ...validationErrors };
    if (row === 'firstRow' && validationErrors[errorKey1] && value.trim() !== "") {
      delete newErrors[errorKey1];
    }
    if (row === 'secondRow' && validationErrors[errorKey2] && value.trim() !== "") {
      delete newErrors[errorKey2];
    }
    setValidationErrors(newErrors);
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

  // Notify parent of form data changes
  useEffect(() => {
    if (onFormDataChange) {
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

  // Responsive values - INCREASED FONT SIZES
  const sectionPadding = isMobile ? 2 : isTablet ? 3 : 4;
  const textFieldHeight = isMobile ? 44 : isTablet ? 48 : 52;
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
                緊急統計
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
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.admissionCount}
                    helperText={validationErrors.admissionCount}
                    disabled={readOnly} 
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
                    variant="outlined"
                    fullWidth
                    size="small"
                    error={!!validationErrors.dischargeCount}
                    helperText={validationErrors.dischargeCount}
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

        {/* External Doctors Section */}
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
                外来診療
              </Typography>
              <Tooltip title="外来診療の患者数">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {[
                { field: 'morning', label: '午前診', color: '#3498db' },
                { field: 'afternoon', label: '午後診', color: '#9b59b6' },
                { field: 'duty', label: '当直', color: '#e74c3c' }
              ].map((item, index) => (
                <Grid item xs={12} sm={4} key={item.field}>
                  <Stack spacing={1}>
                    <Typography sx={{ 
                      fontWeight: 600, 
                      fontSize: fontSize.medium,
                      color: "#6b7280",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }} />
                      {item.label}
                    </Typography>
                    <TextField
                      value={externalDoctors[item.field]}
                      onChange={(e) => handleExternalDoctorChange(item.field, e.target.value)}
                      variant="outlined"
                      fullWidth
                      size="small"
                      InputProps={{
                        sx: {
                          borderRadius: "8px",
                          bgcolor: "#f8f9fa",
                          height: textFieldHeight,
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#dfe1e7",
                          },
                          "& input": {
                            fontSize: fontSize.medium,
                            textAlign: 'right',
                            paddingRight: 2,
                            fontWeight: 600,
                            color: "#2c3e50"
                          },
                        },
                      }}
                    />
                  </Stack>
                </Grid>
              ))}
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
                緊急・訪問診療
              </Typography>
              <Tooltip title="緊急搬入・訪問診療に関する情報">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Emergency Transport */}
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
                    fullWidth
                    value={externalConsultation.emergencyTransport}
                    onChange={handleEmergencyTransportChange}
                    variant="outlined"
                    size="small"
                    error={!!validationErrors.emergencyTransport}
                    helperText={validationErrors.emergencyTransport}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#ffffff",
                        borderRadius: "8px",
                        height: textFieldHeight,
                        "& fieldset": { 
                          borderColor: validationErrors.emergencyTransport ? "#df1c41" : "#dfe1e7" 
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

              {/* Post Transport Admission */}
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
                    fullWidth
                    value={externalConsultation.postTransportAdmission}
                    onChange={handlePostTransportAdmissionChange}
                    variant="outlined"
                    size="small"
                    error={!!validationErrors.postTransportAdmission}
                    helperText={validationErrors.postTransportAdmission}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#ffffff",
                        borderRadius: "8px",
                        height: textFieldHeight,
                        "& fieldset": { 
                          borderColor: validationErrors.postTransportAdmission ? "#df1c41" : "#dfe1e7" 
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

              {/* Visit */}
              <Grid item xs={12} sm={12} md={4}>
                <Stack spacing={1}>
                  <Typography sx={{ 
                    fontSize: fontSize.medium,
                    fontWeight: 600, 
                    color: "#6b6f82"
                  }}>
                    訪問診療
                  </Typography>
                  <TextField
                    fullWidth
                    value={externalConsultation.visit}
                    onChange={handleVisitChange}
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#ffffff",
                        borderRadius: "8px",
                        height: textFieldHeight,
                        "& fieldset": { borderColor: "#dfe1e7" },
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
        />

        {/* Duty Staff Section */}
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
                当直スタッフ
              </Typography>
              <Tooltip title="部署別の当直スタッフ配置">
                <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
              </Tooltip>
            </Box>

            {validationErrors.consolidatedData && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationErrors.consolidatedData}
              </Alert>
            )}

            <Box sx={{ overflowX: 'auto', pb: 1 }}>
              <Box sx={{ minWidth: isMobile ? "600px" : "800px" }}>
                <Grid container spacing={1.5}>
                  {fieldData.map((field, index) => {
                    const errorKey1 = `dutyStaff_${field.position}_1`;
                    const errorKey2 = `dutyStaff_${field.position}_2`;
                    
                    return (
                      <Grid item xs={6} sm={4} md={2} key={index}>
                        <Box sx={{ 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          p: 2,
                          textAlign: 'center',
                          bgcolor: '#fafafa',
                          height: '100%'
                        }}>
                          <Typography sx={{ 
                            fontSize: fontSize.medium,
                            fontWeight: 600, 
                            color: "#36394a",
                            mb: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5
                          }}>
                            {field.label}
                            {field.required && (
                              <Typography component="span" sx={{ color: "#df1c41", fontSize: fontSize.small, fontWeight: 600 }}>
                                *
                              </Typography>
                            )}
                            <Tooltip title={field.description}>
                              <InfoOutlinedIcon sx={{ 
                                color: '#7f8c8d', 
                                fontSize: 14,
                                cursor: 'help'
                              }} />
                            </Tooltip>
                          </Typography>
                          
                          <Stack spacing={1.5}>
                            <Box>
                              <TextField
                                placeholder="氏名（1人目）"
                                value={currentStatus.firstRow[index]}
                                onChange={(e) => handleCurrentStatusChange('firstRow', index, e.target.value)}
                                variant="outlined"
                                size="small"
                                fullWidth
                                error={!!validationErrors[errorKey1]}
                                helperText={validationErrors[errorKey1]}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    height: textFieldHeight,
                                    bgcolor: "#ffffff",
                                    borderRadius: "6px",
                                    "& fieldset": { 
                                      borderColor: validationErrors[errorKey1] ? "#df1c41" : "#dfe1e7" 
                                    },
                                    "& input": {
                                      fontSize: fontSize.medium,
                                      fontWeight: 500,
                                      color: "#2c3e50",
                                      textAlign: 'center'
                                    },
                                  },
                                }}
                              />
                            </Box>
                            
                            <Box>
                              <TextField
                                placeholder="氏名（2人目）"
                                value={currentStatus.secondRow[index]}
                                onChange={(e) => handleCurrentStatusChange('secondRow', index, e.target.value)}
                                variant="outlined"
                                size="small"
                                fullWidth
                                error={!!validationErrors[errorKey2]}
                                helperText={validationErrors[errorKey2]}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    height: textFieldHeight,
                                    bgcolor: "#ffffff",
                                    borderRadius: "6px",
                                    "& fieldset": { 
                                      borderColor: validationErrors[errorKey2] ? "#df1c41" : "#dfe1e7" 
                                    },
                                    "& input": {
                                      fontSize: fontSize.medium,
                                      fontWeight: 500,
                                      color: "#2c3e50",
                                      textAlign: 'center'
                                    },
                                  },
                                }}
                              />
                            </Box>
                          </Stack>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Box>
          </Stack>
        </Paper>

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

        {/* Action Buttons */}
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
        >{!readOnly && (
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
          </Box>)}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
});

export default FrameScreen;