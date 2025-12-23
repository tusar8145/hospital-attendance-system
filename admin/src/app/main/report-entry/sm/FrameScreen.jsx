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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress
} from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import SettingsIcon from '@mui/icons-material/Settings';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';

import StatusBadge from './utils/StatusBadge'; 
import {
  formatDateForAPI,
  formatJapaneseDate,
  shouldDisableDate
} from './utils/frameScreenUtils';

// Import User context/helper
import { useAppSelector } from 'app/store/hooks';
import { selectUser } from 'src/app/auth/user/store/userSlice';

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
  hospital_type = 'welfare'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Get user data from Redux
  const user = useAppSelector(selectUser);
  const userRole = user?.role || '';
  
  // Check if user can edit capacities (not operator)
  const canEditCapacities = userRole !== 'operator';

  // State management
  const [date, setDate] = useState(reportDate || new Date());
  
  // Welfare data state - all writable fields
  const [welfareData, setWelfareData] = useState({
    // New fields after date and before section 1
    conference_events: "",
    special_notes_section: "",
    
    // Section 1: 入所 (Long-term care) - 6 writeable fields
    section1_admission_count: "0",
    section1_discharge_count: "0",
    section1_outside_hospital: "0",
    section1_admission_treated: "0",
    section1_hospitalization_count: "0",
    section1_discharge_treated: "0",
    
    // Section 2: 短期入所 (Short-term care) - 4 writeable fields (NOT 6)
    section2_admission_count: "0",
    section2_discharge_count: "0",
    section2_outside_hospital: "0",
    section2_hospitalization_count: "0",
    // Note: section2_admission_treated and section2_discharge_treated are NOT in section 2
    
    // Section 3: ケアハウス (Care house) - 4 writeable fields
    section3_admission_count: "0",
    section3_discharge_count: "0",
    section3_outside_hospital: "0",
    section3_hospitalization_count: "0",
    
    // Sections 4-7: ABCD sections - 1 writeable field each
    section4_daily_users: "0",
    section5_daily_users: "0",
    section6_daily_users: "0",
    section7_daily_users: "0",
    
    // New fields before 管理事項
    vacant_bed_notes: "",
    response_notes: "",
    
    // Capacity fields (stored in DB)
    section1_capacity: "0",
    section2_capacity: "0",
    section3_capacity: "0",
    section4_capacity: "0",
    section5_capacity: "0",
    section6_capacity: "0",
    section7_capacity: "0"
  });

  // Calculated fields state (readonly, calculated at runtime)
  const [calculatedFields, setCalculatedFields] = useState({
    // Section 1 calculated fields
    section1_end_users: "0", // 前日入所者数
    section1_today_end_users: "0", // 当日末入所者数
    section1_monthly_admission: "0", // 当月入所者数
    section1_monthly_avg: "0", // 当月平均入所者数
    section1_monthly_utilization: "0", // 当月稼働率
    
    // Section 2 calculated fields
    section2_end_users: "0", // 前日入所者数
    section2_today_end_users: "0", // 当日末入所者数
    section2_monthly_admission: "0", // 当月入所者数
    section2_monthly_avg: "0", // 当月平均入所者数
    section2_monthly_utilization: "0", // 当月稼働率
    
    // Section 3 calculated fields
    section3_end_users: "0", // 前日入所者数
    section3_today_end_users: "0", // 当日末入所者数
    section3_monthly_admission: "0", // 当月入所者数
    section3_monthly_avg: "0", // 当月平均入所者数
    section3_monthly_utilization: "0", // 当月稼働率
    
    // Sections 4-7 calculated fields
    section4_monthly_users: "0", // 当月利用者数
    section4_monthly_users_cumulative: "0", // 当月利用者数累計
    section4_monthly_avg: "0", // 当月平均利用者数
    section4_monthly_utilization: "0", // 当月稼働率
    section5_monthly_users: "0",
    section5_monthly_users_cumulative: "0",
    section5_monthly_avg: "0",
    section5_monthly_utilization: "0",
    section6_monthly_users: "0",
    section6_monthly_users_cumulative: "0",
    section6_monthly_avg: "0",
    section6_monthly_utilization: "0",
    section7_monthly_users: "0",
    section7_monthly_users_cumulative: "0",
    section7_monthly_avg: "0",
    section7_monthly_utilization: "0",
    
    // Annual calculated fields (年度)
    section1_annual_users: "0", // 年度延入所者数
    section1_annual_avg: "0", // 年度平均入所者数
    section1_annual_utilization: "0", // 年度稼働率
    section2_annual_users: "0",
    section2_annual_avg: "0",
    section2_annual_utilization: "0",
    section3_annual_users: "0",
    section3_annual_avg: "0",
    section3_annual_utilization: "0",
    section4_annual_users: "0",
    section4_annual_avg: "0",
    section4_annual_utilization: "0",
    section5_annual_users: "0",
    section5_annual_avg: "0",
    section5_annual_utilization: "0",
    section6_annual_users: "0",
    section6_annual_avg: "0",
    section6_annual_utilization: "0",
    section7_annual_users: "0",
    section7_annual_avg: "0",
    section7_annual_utilization: "0"
  });

  // Section names state
  const [sectionNames, setSectionNames] = useState({
    section4: '〇〇〇〇1',
    section5: '〇〇〇〇2',
    section6: '〇〇〇〇3',
    section7: '〇〇〇〇4'
  });

  // Special notes (in 管理事項 section)
  const [specialNotes, setSpecialNotes] = useState("");

  // Edit dialogs
  const [editDialog, setEditDialog] = useState({
    open: false,
    type: '', // 'sectionName' or 'capacity'
    section: null,
    name: '',
    capacity: ''
  });

  // Loading states
  const [loadingSectionNames, setLoadingSectionNames] = useState(false);
  const [loadingCapacities, setLoadingCapacities] = useState(false);
  const [savingDialog, setSavingDialog] = useState(false);

  const [validationErrors, setValidationErrors] = useState({});
  const [formDataLoaded, setFormDataLoaded] = useState(false);

  // Refs for text fields to auto-select content
  const textFieldRefs = useRef({});

  // Local snackbar
  const [localSnackbar, setLocalSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Responsive values with increased font sizes
  const sectionPadding = isMobile ? 2 : isTablet ? 3 : 4;
  const textFieldHeight = isMobile ? 44 : isTablet ? 48 : 52;
  const fontSize = {
    small: isMobile ? '0.9375rem' : isTablet ? '1rem' : '1.0625rem',
    medium: isMobile ? '1.0625rem' : isTablet ? '1.125rem' : '1.25rem',
    large: isMobile ? '1.25rem' : isTablet ? '1.375rem' : '1.5rem',
    xlarge: isMobile ? '1.375rem' : isTablet ? '1.5rem' : '1.625rem',
  };

  // Initialize welfare data when formData changes
  useEffect(() => {
    console.log('FormData received:', formData);
    console.log('Welfare data from formData:', formData?.welfare_data);
    
    if (hospital_type === 'welfare' && formData?.welfare_data) {
      const data = formData.welfare_data;
      
      // Extract writable fields
      const newWelfareData = {
        // Initialize all fields with defaults
        conference_events: "",
        special_notes_section: "",
        
        // Section 1: 入所 - 6 writeable fields
        section1_admission_count: "0",
        section1_discharge_count: "0",
        section1_outside_hospital: "0",
        section1_admission_treated: "0",
        section1_hospitalization_count: "0",
        section1_discharge_treated: "0",
        
        // Section 2: 短期入所 - 4 writeable fields (NOT 6)
        section2_admission_count: "0",
        section2_discharge_count: "0",
        section2_outside_hospital: "0",
        section2_hospitalization_count: "0",
        // Note: section2_admission_treated and section2_discharge_treated are NOT in section 2
        
        // Section 3: ケアハウス - 4 writeable fields
        section3_admission_count: "0",
        section3_discharge_count: "0",
        section3_outside_hospital: "0",
        section3_hospitalization_count: "0",
        
        // Sections 4-7 - 1 writeable field each
        section4_daily_users: "0",
        section5_daily_users: "0",
        section6_daily_users: "0",
        section7_daily_users: "0",
        
        // New fields before 管理事項
        vacant_bed_notes: "",
        response_notes: "",
        
        // Capacity fields
        section1_capacity: "0",
        section2_capacity: "0",
        section3_capacity: "0",
        section4_capacity: "0",
        section5_capacity: "0",
        section6_capacity: "0",
        section7_capacity: "0"
      };
      
      // Update with actual data from backend
      Object.keys(newWelfareData).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          if (typeof data[key] === 'number') {
            newWelfareData[key] = data[key].toString();
          } else if (typeof data[key] === 'string') {
            newWelfareData[key] = data[key];
          }
        }
      });
      
      console.log('Setting welfare data:', newWelfareData);
      setWelfareData(newWelfareData);
      
      // Extract calculated fields
      const calcFields = {};
      const calcFieldNames = [
        // Section 1 calculated
        'section1_end_users', 'section1_today_end_users', 'section1_monthly_admission', 'section1_monthly_avg', 'section1_monthly_utilization',
        // Section 2 calculated
        'section2_end_users', 'section2_today_end_users', 'section2_monthly_admission', 'section2_monthly_avg', 'section2_monthly_utilization',
        // Section 3 calculated
        'section3_end_users', 'section3_today_end_users', 'section3_monthly_admission', 'section3_monthly_avg', 'section3_monthly_utilization',
        // Sections 4-7 calculated
        'section4_monthly_users', 'section4_monthly_users_cumulative', 'section4_monthly_avg', 'section4_monthly_utilization',
        'section5_monthly_users', 'section5_monthly_users_cumulative', 'section5_monthly_avg', 'section5_monthly_utilization',
        'section6_monthly_users', 'section6_monthly_users_cumulative', 'section6_monthly_avg', 'section6_monthly_utilization',
        'section7_monthly_users', 'section7_monthly_users_cumulative', 'section7_monthly_avg', 'section7_monthly_utilization',
        // Annual calculated
        'section1_annual_users', 'section1_annual_avg', 'section1_annual_utilization',
        'section2_annual_users', 'section2_annual_avg', 'section2_annual_utilization',
        'section3_annual_users', 'section3_annual_avg', 'section3_annual_utilization',
        'section4_annual_users', 'section4_annual_avg', 'section4_annual_utilization',
        'section5_annual_users', 'section5_annual_avg', 'section5_annual_utilization',
        'section6_annual_users', 'section6_annual_avg', 'section6_annual_utilization',
        'section7_annual_users', 'section7_annual_avg', 'section7_annual_utilization'
      ];
      
      calcFieldNames.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          calcFields[field] = data[field].toString();
        } else {
          calcFields[field] = "0";
        }
      });
      
      setCalculatedFields(calcFields);
      
      // Set section names from form data or load from API
      if (formData.section_names) {
        setSectionNames(formData.section_names);
      } else {
        loadSectionNames();
      }
      
      // Set special notes from report
      if (formData.special_notes) {
        setSpecialNotes(formData.special_notes);
      }
      
      setFormDataLoaded(true);
    } else if (hospital_type === 'welfare') {
      // Initialize empty form for new welfare report
      console.log('Initializing empty form for new report');
      loadSectionNames();
      loadCapacities();
      setFormDataLoaded(true);
    }
  }, [formData, hospital_type, hospitalId]);

  // Load section names from API
  const loadSectionNames = useCallback(async () => {
    if (!hospitalId) return;
    
    setLoadingSectionNames(true);
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report-welfare/section-names`, {
        hospital_id: hospitalId
      });
      
      if (response.data.success !== false) {
        setSectionNames(response.data.data || {
          section4: '〇〇〇〇1',
          section5: '〇〇〇〇2',
          section6: '〇〇〇〇3',
          section7: '〇〇〇〇4'
        });
      }
    } catch (error) {
      console.error('Error loading section names:', error);
      // Keep default names
    } finally {
      setLoadingSectionNames(false);
    }
  }, [hospitalId]);

  // Load capacities from API
  const loadCapacities = useCallback(async () => {
    if (!hospitalId) return;
    
    setLoadingCapacities(true);
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report-welfare/capacities`, {
        hospital_id: hospitalId
      });
      
      if (response.data.success !== false) {
        const capacities = response.data.data || {};
        setWelfareData(prev => ({
          ...prev,
          section1_capacity: (capacities.section1 || 0).toString(),
          section2_capacity: (capacities.section2 || 0).toString(),
          section3_capacity: (capacities.section3 || 0).toString(),
          section4_capacity: (capacities.section4 || 0).toString(),
          section5_capacity: (capacities.section5 || 0).toString(),
          section6_capacity: (capacities.section6 || 0).toString(),
          section7_capacity: (capacities.section7 || 0).toString()
        }));
      }
    } catch (error) {
      console.error('Error loading capacities:', error);
      // Keep default capacities
    } finally {
      setLoadingCapacities(false);
    }
  }, [hospitalId]);

  // Handle welfare data changes
  const handleWelfareDataChange = (field, value) => {
    console.log(`Changing field ${field} to:`, value);
    setWelfareData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error if fixed
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  // Handle special notes change (in 管理事項 section)
  const handleSpecialNotesChange = (e) => {
    setSpecialNotes(e.target.value);
  };

  // Auto-select text field content on focus
  const handleTextFieldFocus = (fieldId) => (event) => {
    event.target.select();
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Validate required numeric fields
    const requiredNumericFields = [
      { key: 'section1_admission_count', label: '入所 - 当日入所者数' },
      { key: 'section1_discharge_count', label: '入所 - 当日退所者数' },
      { key: 'section2_admission_count', label: '短期入所 - 当日入所者数' },
      { key: 'section2_discharge_count', label: '短期入所 - 当日退所者数' },
      { key: 'section3_admission_count', label: 'ケアハウス - 当日入所者数' },
      { key: 'section3_discharge_count', label: 'ケアハウス - 当日退所者数' },
      { key: 'section4_daily_users', label: `${sectionNames.section4} - 当日利用者数` },
      { key: 'section5_daily_users', label: `${sectionNames.section5} - 当日利用者数` },
      { key: 'section6_daily_users', label: `${sectionNames.section6} - 当日利用者数` },
      { key: 'section7_daily_users', label: `${sectionNames.section7} - 当日利用者数` }
    ];
    
    requiredNumericFields.forEach(({ key, label }) => {
      const value = welfareData[key];
      if (!value || value === "" || isNaN(parseInt(value)) || parseInt(value) < 0) {
        errors[key] = `${label}は0以上の数値を入力してください`;
      }
    });
    
    // Validate capacities (readonly for operator)
    if (canEditCapacities) {
      for (let i = 1; i <= 7; i++) {
        const capacity = welfareData[`section${i}_capacity`];
        if (!capacity || capacity === "" || isNaN(parseInt(capacity)) || parseInt(capacity) < 0) {
          errors[`section${i}_capacity`] = `セクション${i}の定員は0以上の数値を入力してください`;
        }
      }
    }
    
    setValidationErrors(errors);
    
    // Scroll to top when there are errors
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    return Object.keys(errors).length === 0;
  };

  // Prepare form data for submission
  const prepareFormData = () => {
    const data = {
      admission_count: 0,
      discharge_count: 0,
      external_duty: 0,
      emergency_transport: 0,
      post_transport_admission: 0,
      visit_count: 0,
      special_notes: specialNotes.trim(),
      report_details: [],
      report_details_mid: [],
      external_consultation_details: null,
      hospital_type: 'welfare',
      welfare_data: {
        ...welfareData,
        // Convert string values to integers for numeric fields
        section1_admission_count: parseInt(welfareData.section1_admission_count) || 0,
        section1_discharge_count: parseInt(welfareData.section1_discharge_count) || 0,
        section1_outside_hospital: parseInt(welfareData.section1_outside_hospital) || 0,
        section1_admission_treated: parseInt(welfareData.section1_admission_treated) || 0,
        section1_hospitalization_count: parseInt(welfareData.section1_hospitalization_count) || 0,
        section1_discharge_treated: parseInt(welfareData.section1_discharge_treated) || 0,
        section2_admission_count: parseInt(welfareData.section2_admission_count) || 0,
        section2_discharge_count: parseInt(welfareData.section2_discharge_count) || 0,
        section2_outside_hospital: parseInt(welfareData.section2_outside_hospital) || 0,
        section2_hospitalization_count: parseInt(welfareData.section2_hospitalization_count) || 0,
        section3_admission_count: parseInt(welfareData.section3_admission_count) || 0,
        section3_discharge_count: parseInt(welfareData.section3_discharge_count) || 0,
        section3_outside_hospital: parseInt(welfareData.section3_outside_hospital) || 0,
        section3_hospitalization_count: parseInt(welfareData.section3_hospitalization_count) || 0,
        section4_daily_users: parseInt(welfareData.section4_daily_users) || 0,
        section5_daily_users: parseInt(welfareData.section5_daily_users) || 0,
        section6_daily_users: parseInt(welfareData.section6_daily_users) || 0,
        section7_daily_users: parseInt(welfareData.section7_daily_users) || 0,
        section1_capacity: parseInt(welfareData.section1_capacity) || 0,
        section2_capacity: parseInt(welfareData.section2_capacity) || 0,
        section3_capacity: parseInt(welfareData.section3_capacity) || 0,
        section4_capacity: parseInt(welfareData.section4_capacity) || 0,
        section5_capacity: parseInt(welfareData.section5_capacity) || 0,
        section6_capacity: parseInt(welfareData.section6_capacity) || 0,
        section7_capacity: parseInt(welfareData.section7_capacity) || 0
      },
      section_names: sectionNames
    };
    
    console.log('Prepared form data for submission:', data);
    return data;
  };

  // Handle save draft
  const handleSaveDraftClick = () => {
    if (validateForm()) {
      const data = prepareFormData();
      onSaveDraft(data);
    } else {
      showSnackbar('フォームにエラーがあります。確認してください。', 'error');
    }
  };

  // Handle submit
  const handleSubmitClick = () => {
    if (validateForm()) {
      const data = prepareFormData();
      onSubmit(data);
    } else {
      showSnackbar('フォームにエラーがあります。確認してください。', 'error');
    }
  };

  // Handle edit section name
  const handleEditSectionName = (section) => {
    setEditDialog({
      open: true,
      type: 'sectionName',
      section,
      name: sectionNames[section] || '',
      capacity: ''
    });
  };

  // Handle edit capacity (only for non-operator users)
  const handleEditCapacity = (section) => {
    if (!canEditCapacities) return;
    
    const sectionNumber = section.replace('section', '');
    const capacityKey = `section${sectionNumber}_capacity`;
    setEditDialog({
      open: true,
      type: 'capacity',
      section,
      name: '',
      capacity: welfareData[capacityKey] || '0'
    });
  };

  const handleSaveDialog = async () => {
    const { type, section, name, capacity } = editDialog;
    
    if (type === 'sectionName') {
      if (!name.trim()) {
        showLocalSnackbar('セクション名を入力してください', 'error');
        return;
      }
      
      if (!hospitalId) {
        showLocalSnackbar('病院IDが見つかりません', 'error');
        return;
      }
      
      setSavingDialog(true);
      try {
        // Update section name via API
        const response = await axios.post(`${apiConfig.baseURL}/report-welfare/update-section-names`, {
          hospital_id: hospitalId,
          section_names: {
            [section]: name.trim()
          }
        });
        
        if (response.data.success) {
          // Update local state
          setSectionNames(prev => ({
            ...prev,
            [section]: name.trim()
          }));
          
          setEditDialog({ open: false, type: '', section: null, name: '', capacity: '' });
          showLocalSnackbar('セクション名を更新しました', 'success');
        } else {
          showLocalSnackbar(response.data.message || 'セクション名の更新に失敗しました', 'error');
        }
      } catch (error) {
        console.error('Error updating section name:', error);
        const errorMessage = error.response?.data?.message || 'セクション名の更新に失敗しました';
        showLocalSnackbar(errorMessage, 'error');
      } finally {
        setSavingDialog(false);
      }
    } else if (type === 'capacity') {
      if (!capacity || capacity === "" || isNaN(parseInt(capacity)) || parseInt(capacity) < 0) {
        showLocalSnackbar('定員は0以上の数値を入力してください', 'error');
        return;
      }
      
      const sectionNumber = section.replace('section', '');
      const capacityKey = `section${sectionNumber}_capacity`;
      
      // Update local state immediately
      handleWelfareDataChange(capacityKey, capacity);
      
      // Also update in medical_center table via API
      setSavingDialog(true);
      try {
        const response = await axios.post(`${apiConfig.baseURL}/report-welfare/update-capacities`, {
          hospital_id: hospitalId,
          capacities: {
            [sectionNumber]: parseInt(capacity) || 0
          }
        });
        
        if (response.data.success) {
          setEditDialog({ open: false, type: '', section: null, name: '', capacity: '' });
          showLocalSnackbar('定員を更新しました', 'success');
        } else {
          showLocalSnackbar(response.data.message || '定員の更新に失敗しました', 'error');
        }
      } catch (error) {
        console.error('Error updating capacity:', error);
        const errorMessage = error.response?.data?.message || '定員の更新に失敗しました';
        showLocalSnackbar(errorMessage, 'error');
      } finally {
        setSavingDialog(false);
      }
    }
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

  // Show local snackbar
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
    if (onFormDataChange && formDataLoaded && !loading) {
      const currentFormData = prepareFormData();
      console.log('Notifying parent of form data changes:', currentFormData);
      onFormDataChange(currentFormData);
    }
  }, [welfareData, specialNotes, sectionNames, formDataLoaded, onFormDataChange, loading]);

  // Create functions for header buttons
  const triggerSaveDraft = useCallback(() => {
    handleSaveDraftClick();
  }, [validateForm, prepareFormData, onSaveDraft, showSnackbar]);

  const triggerSubmit = useCallback(() => {
    handleSubmitClick();
  }, [validateForm, prepareFormData, onSubmit, showSnackbar]);

  // Notify parent of the trigger functions
  useEffect(() => {
    if (onHeaderSaveDraft) {
      onHeaderSaveDraft(triggerSaveDraft);
    }
    if (onHeaderSubmit) {
      onHeaderSubmit(triggerSubmit);
    }
  }, [onHeaderSaveDraft, onHeaderSubmit, triggerSaveDraft, triggerSubmit]);

  // Render field component with auto-select on focus
  const renderField = (field, label, required = false, editable = true, isCapacity = false, isTextArea = false, rows = 1) => {
    const value = editable ? 
      welfareData[field] : 
      calculatedFields[field];
    
    const error = validationErrors[field];
    const helperText = error || (editable ? `${label}を入力してください` : '自動計算されます');
    
    return (
      <Grid item xs={12} sm={isTextArea ? 12 : 6} md={isTextArea ? 12 : 3} key={field}>
        <Stack spacing={1}>
          <Typography sx={{ 
            fontWeight: 600, 
            fontSize: fontSize.small,
            color: "#36394a",
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            {label}
            {required && (
              <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                *
              </Typography>
            )}
          </Typography>
          {isTextArea ? (
            <TextField
              value={value || ""}
              onChange={(e) => handleWelfareDataChange(field, e.target.value)}
              variant="outlined"
              fullWidth
              multiline
              rows={rows}
              size="small"
              error={!!error}
              helperText={helperText}
              disabled={readOnly || reportStatus === 'submitted' || !editable}
              onFocus={handleTextFieldFocus(field)}
              InputProps={{
                sx: {
                  borderRadius: "8px",
                  bgcolor: editable ? "#ffffff" : "#f5f5f5",
                  fontSize: fontSize.small,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: error ? "#df1c41" : "#bdbdbd",
                  },
                  "& textarea": {
                    fontSize: fontSize.small,
                    fontWeight: editable ? 500 : 400,
                    color: editable ? "#2c3e50" : "#666",
                    '&::placeholder': {
                      fontSize: fontSize.small,
                    }
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#f5f5f5",
                    "& textarea": {
                      color: "#666",
                    }
                  }
                },
              }}
            />
          ) : (
            <TextField
              value={value || "0"}
              onChange={(e) => handleWelfareDataChange(field, e.target.value)}
              variant="outlined"
              fullWidth
              size="small"
              error={!!error}
              helperText={helperText}
              disabled={readOnly || reportStatus === 'submitted' || !editable}
              onFocus={handleTextFieldFocus(field)}
              InputProps={{
                sx: {
                  borderRadius: "8px",
                  bgcolor: editable ? "#ffffff" : "#f5f5f5",
                  height: textFieldHeight,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: error ? "#df1c41" : "#bdbdbd",
                  },
                  "& input": {
                    fontSize: fontSize.small,
                    textAlign: 'right',
                    paddingRight: 2,
                    fontWeight: 500,
                    color: editable ? "#2c3e50" : "#666",
                    '&::placeholder': {
                      fontSize: fontSize.small,
                    }
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#f5f5f5",
                    "& input": {
                      color: "#666",
                    }
                  }
                },
              }}
            />
          )}
        </Stack>
      </Grid>
    );
  };

  // Render capacity field (ALWAYS readonly - can only be changed via dialog)
  const renderCapacityField = (sectionNumber) => {
    const field = `section${sectionNumber}_capacity`;
    const label = `定員`;
    const value = welfareData[field] || "0";
    const error = validationErrors[field];
    
    return (
      <Grid item xs={12} sm={6} md={3} key={field}>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ 
              fontWeight: 600, 
              fontSize: fontSize.small,
              color: "#36394a",
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              {label}
              <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                *
              </Typography>
            </Typography>
            {canEditCapacities && !readOnly && reportStatus !== 'submitted' && (
              <Tooltip title="定員を編集">
                <IconButton 
                  size="small" 
                  onClick={() => handleEditCapacity(`section${sectionNumber}`)}
                  sx={{ color: '#666' }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <TextField
            value={value}
            variant="outlined"
            fullWidth
            size="small"
            error={!!error}
            helperText={error || '定員を編集するには設定アイコンをクリックしてください'}
            disabled={true} // ALWAYS disabled - can only be changed via dialog
            InputProps={{
              readOnly: true, // Explicitly make it readonly
              sx: {
                borderRadius: "8px",
                bgcolor: "#f5f5f5",
                height: textFieldHeight,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: error ? "#df1c41" : "#bdbdbd",
                },
                "& input": {
                  fontSize: fontSize.small,
                  textAlign: 'right',
                  paddingRight: 2,
                  fontWeight: 500,
                  color: "#666",
                  cursor: 'default',
                  '&::placeholder': {
                    fontSize: fontSize.small,
                  }
                },
                "&.Mui-disabled": {
                  bgcolor: "#f5f5f5",
                  "& input": {
                    color: "#666",
                    WebkitTextFillColor: "#666" // Ensure color stays gray in disabled state
                  }
                }
              },
            }}
          />
        </Stack>
      </Grid>
    );
  };

  // Render text area component for new fields
  const renderTextArea = (field, label, rows = 3, required = false) => {
    const value = welfareData[field] || "";
    
    return (
      <Grid item xs={12} key={field}>
        <Stack spacing={1}>
          <Typography sx={{ 
            fontWeight: 600, 
            fontSize: fontSize.small,
            color: "#36394a",
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            {label}
            {required && (
              <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
                *
              </Typography>
            )}
          </Typography>
          <TextField
            value={value}
            onChange={(e) => handleWelfareDataChange(field, e.target.value)}
            variant="outlined"
            fullWidth
            multiline
            rows={rows}
            size="small"
            disabled={readOnly || reportStatus === 'submitted'}
            onFocus={handleTextFieldFocus(field)}
            InputProps={{
              sx: {
                borderRadius: "8px",
                bgcolor: "#ffffff",
                fontSize: fontSize.small,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#bdbdbd",
                },
                "& textarea": {
                  fontSize: fontSize.small,
                  fontWeight: 500,
                  color: "#2c3e50",
                  '&::placeholder': {
                    fontSize: fontSize.small,
                  }
                },
                "&.Mui-disabled": {
                  bgcolor: "#f5f5f5",
                  "& textarea": {
                    color: "#666",
                  }
                }
              },
            }}
          />
        </Stack>
      </Grid>
    );
  };

  // Render a section
  const renderSection = (sectionNumber, sectionTitle, fields, showAnnual = false) => {
    const isABCDSection = sectionNumber >= 4;
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: sectionPadding,
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          mb: 3
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ 
                fontWeight: 700, 
                fontSize: fontSize.xlarge,
                color: "#2c3e50",
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{ 
                  width: 4, 
                  height: 24, 
                  backgroundColor: '#3498db',
                  borderRadius: '2px'
                }} />
                {isABCDSection ? sectionNames[`section${sectionNumber}`] : sectionTitle}
              </Typography>
              
              {isABCDSection && !readOnly && reportStatus !== 'submitted' && (
                <Tooltip title="セクション名を編集">
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditSectionName(`section${sectionNumber}`)}
                    sx={{ color: '#666' }}
                    disabled={loadingSectionNames}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            {loadingSectionNames && isABCDSection && (
              <CircularProgress size={20} />
            )}
          </Box>

          {/* Capacity field for each section - ALWAYS readonly */}
          <Grid container spacing={isMobile ? 2 : 3}>
            {renderCapacityField(sectionNumber)}
          </Grid>

          {/* Fields Grid */}
          <Grid container spacing={isMobile ? 2 : 3}>
            {fields.map((field, index) => (
              <React.Fragment key={index}>
                {renderField(
                  field.key, 
                  field.label, 
                  field.required, 
                  field.editable,
                  false,
                  field.isTextArea || false,
                  field.rows || 1
                )}
              </React.Fragment>
            ))}
          </Grid>

          {/* Annual statistics (only for sections 1-3) */}
          {showAnnual && !isABCDSection && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <Typography sx={{ 
                fontWeight: 600, 
                fontSize: fontSize.medium,
                color: "#2c3e50",
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 2
              }}>
                <Box component="span" sx={{ 
                  width: 4, 
                  height: 20, 
                  backgroundColor: '#27ae60',
                  borderRadius: '2px'
                }} />
                年度統計
              </Typography>
              
              <Grid container spacing={isMobile ? 2 : 3}>
                {renderField(`section${sectionNumber}_annual_users`, '年度延入所者数', false, false)}
                {renderField(`section${sectionNumber}_annual_avg`, '年度平均入所者数', false, false)}
                {renderField(`section${sectionNumber}_annual_utilization`, '年度稼働率', false, false)}
              </Grid>
            </>
          )}

          {/* Annual statistics for ABCD sections */}
          {isABCDSection && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <Typography sx={{ 
                fontWeight: 600, 
                fontSize: fontSize.medium,
                color: "#2c3e50",
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 2
              }}>
                <Box component="span" sx={{ 
                  width: 4, 
                  height: 20, 
                  backgroundColor: '#27ae60',
                  borderRadius: '2px'
                }} />
                年度統計
              </Typography>
              
              <Grid container spacing={isMobile ? 2 : 3}>
                {renderField(`section${sectionNumber}_annual_users`, '年度利用者数', false, false)}
                {renderField(`section${sectionNumber}_annual_avg`, '年度平均利用者数', false, false)}
                {renderField(`section${sectionNumber}_annual_utilization`, '年度稼働率', false, false)}
              </Grid>
            </>
          )}
        </Stack>
      </Paper>
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
        <WarningIcon sx={{ fontSize: 48, color: '#ff9800', mb: 1 }} />
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          病院が選択されていません
        </Typography>
        <Typography sx={{ color: '#666', mb: 3 }}>
          福祉施設レポートを作成するには、まず病院を選択してください。
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
        {/* Local Snackbar */}
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
              {Object.entries(validationErrors).map(([key, error], index) => (
                <li key={index} style={{ marginBottom: 4 }}>
                  <Typography sx={{ fontSize: fontSize.small }}>
                    {error}
                  </Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Loading indicator for form data */}
        {!formDataLoaded && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
            <CircularProgress size={24} />
            <Typography sx={{ fontSize: fontSize.small, color: '#666' }}>
              フォームデータを読み込み中...
            </Typography>
          </Box>
        )}

 

        {/* Welfare Report Sections */}
        {formDataLoaded && (
          <>
            {/* New Section: 会議・行事等 and 特記事項 */}
            <Paper
              elevation={0}
              sx={{
                p: sectionPadding,
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#ffffff',
                mb: 3
              }}
            >
              <Stack spacing={3}>
                <Typography sx={{ 
                  fontWeight: 700, 
                  fontSize: fontSize.xlarge,
                  color: "#2c3e50",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box component="span" sx={{ 
                    width: 4, 
                    height: 24, 
                    backgroundColor: '#9b59b6',
                    borderRadius: '2px'
                  }} />
                  会議・行事等・特記事項
                </Typography>
                
                <Grid container spacing={isMobile ? 2 : 3}>
                  {renderTextArea('conference_events', '会議・行事等', 3)}
                  {renderTextArea('special_notes_section', '特記事項', 3)}
                </Grid>
              </Stack>
            </Paper>

            {/* Section 1: 入所 - 6 writeable fields */}
            {renderSection(1, '入所', [
              { key: 'section1_admission_count', label: '当日入所者数', required: true, editable: true },
              { key: 'section1_discharge_count', label: '当日退所者数', required: true, editable: true },
              { key: 'section1_outside_hospital', label: '外泊・入院者数', required: false, editable: true },
              { key: 'section1_admission_treated', label: '入所扱', required: false, editable: true },
              { key: 'section1_hospitalization_count', label: '入院者数', required: false, editable: true },
              { key: 'section1_discharge_treated', label: '退所扱', required: false, editable: true },
              { key: 'section1_end_users', label: '前日入所者数', required: false, editable: false },
              { key: 'section1_today_end_users', label: '当日末入所者数', required: false, editable: false },
              { key: 'section1_monthly_admission', label: '当月入所者数', required: false, editable: false },
              { key: 'section1_monthly_avg', label: '当月平均入所者数', required: false, editable: false },
              { key: 'section1_monthly_utilization', label: '当月稼働率', required: false, editable: false }
            ], true)}

            {/* Section 2: 短期入所 - 4 writeable fields (NOT 6) */}
            {renderSection(2, '短期入所', [
              { key: 'section2_admission_count', label: '当日入所者数', required: true, editable: true },
              { key: 'section2_discharge_count', label: '当日退所者数', required: true, editable: true },
              { key: 'section2_outside_hospital', label: '外泊・入院者数', required: false, editable: true },
              { key: 'section2_hospitalization_count', label: '入院者数', required: false, editable: true },
              // Note: section2_admission_treated and section2_discharge_treated are NOT in section 2
              { key: 'section2_end_users', label: '前日入所者数', required: false, editable: false },
              { key: 'section2_today_end_users', label: '当日末入所者数', required: false, editable: false },
              { key: 'section2_monthly_admission', label: '当月入所者数', required: false, editable: false },
              { key: 'section2_monthly_avg', label: '当月平均入所者数', required: false, editable: false },
              { key: 'section2_monthly_utilization', label: '当月稼働率', required: false, editable: false }
            ], true)}

            {/* Section 3: ケアハウス - 4 writeable fields */}
            {renderSection(3, 'ケアハウス', [
              { key: 'section3_admission_count', label: '当日入所者数', required: true, editable: true },
              { key: 'section3_discharge_count', label: '当日退所者数', required: true, editable: true },
              { key: 'section3_outside_hospital', label: '外泊・入院者数', required: false, editable: true },
              { key: 'section3_hospitalization_count', label: '入院者数', required: false, editable: true },
              { key: 'section3_end_users', label: '前日入所者数', required: false, editable: false },
              { key: 'section3_today_end_users', label: '当日末入所者数', required: false, editable: false },
              { key: 'section3_monthly_admission', label: '当月入所者数', required: false, editable: false },
              { key: 'section3_monthly_avg', label: '当月平均入所者数', required: false, editable: false },
              { key: 'section3_monthly_utilization', label: '当月稼働率', required: false, editable: false }
            ], true)}

            {/* Sections 4-7: ABCD Sections - 1 writeable field each */}
            {[4, 5, 6, 7].map(sectionNum => (
              renderSection(sectionNum, '', [
                { key: `section${sectionNum}_daily_users`, label: '当日利用者数', required: true, editable: true },
                { key: `section${sectionNum}_monthly_users`, label: '当月利用者数', required: false, editable: false },
                { key: `section${sectionNum}_monthly_users_cumulative`, label: '当月利用者数累計', required: false, editable: false },
                { key: `section${sectionNum}_monthly_avg`, label: '当月平均利用者数', required: false, editable: false },
                { key: `section${sectionNum}_monthly_utilization`, label: '当月稼働率', required: false, editable: false }
              ], true)
            ))}

            {/* New Section: コメント - 空床発生自由・対応 */}
            <Paper
              elevation={0}
              sx={{
                p: sectionPadding,
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#ffffff',
                mb: 3
              }}
            >
              <Stack spacing={3}>
                <Typography sx={{ 
                  fontWeight: 700, 
                  fontSize: fontSize.xlarge,
                  color: "#2c3e50",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Box component="span" sx={{ 
                    width: 4, 
                    height: 24, 
                    backgroundColor: '#e74c3c',
                    borderRadius: '2px'
                  }} />
                  コメント
                </Typography>
                
                <Grid container spacing={isMobile ? 2 : 3}>
                  {renderTextArea('vacant_bed_notes', '空床発生自由', 3)}
                  {renderTextArea('response_notes', '対応', 3)}
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
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 2
                }}>
                  <Typography sx={{ 
                    fontWeight: 700, 
                    fontSize: fontSize.xlarge,
                    color: "#2c3e50",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Box component="span" sx={{ 
                      width: 4, 
                      height: 24, 
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
                    onFocus={(e) => e.target.select()}
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
                          '&::placeholder': {
                            fontSize: fontSize.medium,
                          }
                        },
                      },
                    }}
                  />
                </Stack>
              </Stack>
            </Paper>
          </>
        )}

        {/* Action Buttons - Only show if not submitted */}
        {reportStatus !== 'submitted' && !readOnly && formDataLoaded && (
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

        {/* Edit Dialog for Section Name or Capacity */}
        <Dialog
          open={editDialog.open}
          onClose={() => !savingDialog && setEditDialog({ open: false, type: '', section: null, name: '', capacity: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editDialog.type === 'sectionName' ? 'セクション名を編集' : '定員を編集'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            {editDialog.type === 'sectionName' ? (
              <TextField
                autoFocus
                margin="dense"
                label="セクション名"
                fullWidth
                value={editDialog.name}
                onChange={(e) => setEditDialog(prev => ({ ...prev, name: e.target.value }))}
                disabled={savingDialog}
                onFocus={(e) => e.target.select()}
                inputProps={{
                  style: { fontSize: fontSize.medium }
                }}
              />
            ) : (
              <TextField
                autoFocus
                margin="dense"
                label="定員"
                fullWidth
                type="number"
                value={editDialog.capacity}
                onChange={(e) => setEditDialog(prev => ({ ...prev, capacity: e.target.value }))}
                disabled={savingDialog}
                onFocus={(e) => e.target.select()}
                inputProps={{
                  style: { fontSize: fontSize.medium },
                  min: 0
                }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setEditDialog({ open: false, type: '', section: null, name: '', capacity: '' })}
              disabled={savingDialog}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSaveDialog} 
              variant="contained"
              disabled={savingDialog || 
                (editDialog.type === 'sectionName' && !editDialog.name.trim()) ||
                (editDialog.type === 'capacity' && (!editDialog.capacity || isNaN(parseInt(editDialog.capacity)) || parseInt(editDialog.capacity) < 0))
              }
              startIcon={savingDialog ? <CircularProgress size={20} /> : null}
            >
              {savingDialog ? '保存中...' : '保存'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
});

export default FrameScreen;