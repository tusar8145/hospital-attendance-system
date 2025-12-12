import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Validation helper function for big hospitals
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

function ReportEntryBig({
  formData,
  departments,
  doctors,
  hospitalId,
  onFormDataChange,
  loading,
  reportDate,
  onDateChange,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  isSavingDraft,
  reportStatus,
  readOnly = false
}) {
  const [validationErrors, setValidationErrors] = useState({});
  const [localFormData, setLocalFormData] = useState(formData || {});

  // Update local form data when prop changes
  useEffect(() => {
    if (formData) {
      setLocalFormData(formData);
    }
  }, [formData]);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    const newData = { ...localFormData, [field]: value };
    setLocalFormData(newData);
    onFormDataChange(newData);
  }, [localFormData, onFormDataChange]);

  // Handle shift nurse changes
  const handleShiftNurseChange = useCallback((index, field, value) => {
    const newShiftNurses = [...(localFormData.shift_nurses || [])];
    if (!newShiftNurses[index]) {
      newShiftNurses[index] = { shift_type: 0, nurse_name: '', note: '' };
    }
    newShiftNurses[index][field] = value;
    handleInputChange('shift_nurses', newShiftNurses);
  }, [localFormData, handleInputChange]);

  const addShiftNurse = useCallback(() => {
    const newShiftNurses = [...(localFormData.shift_nurses || [])];
    newShiftNurses.push({ shift_type: 0, nurse_name: '', note: '' });
    handleInputChange('shift_nurses', newShiftNurses);
  }, [localFormData, handleInputChange]);

  const removeShiftNurse = useCallback((index) => {
    const newShiftNurses = [...(localFormData.shift_nurses || [])];
    newShiftNurses.splice(index, 1);
    handleInputChange('shift_nurses', newShiftNurses);
  }, [localFormData, handleInputChange]);

  // Handle duty staff changes
  const handleDutyStaffChange = useCallback((position, field, value) => {
    const newDutyStaff = [...(localFormData.duty_staff || [])];
    const existingIndex = newDutyStaff.findIndex(staff => staff.position === position);
    
    if (existingIndex >= 0) {
      newDutyStaff[existingIndex][field] = value;
    } else {
      newDutyStaff.push({ position, [field]: value });
    }
    
    handleInputChange('duty_staff', newDutyStaff);
  }, [localFormData, handleInputChange]);

  // Handle report details changes
  const handleReportDetailChange = useCallback((index, field, value) => {
    const newDetails = [...(localFormData.report_details || [])];
    if (!newDetails[index]) {
      newDetails[index] = { department_id: '', patient_count: 0, note: '' };
    }
    newDetails[index][field] = value;
    handleInputChange('report_details', newDetails);
  }, [localFormData, handleInputChange]);

  const addReportDetail = useCallback(() => {
    const newDetails = [...(localFormData.report_details || [])];
    newDetails.push({ department_id: '', patient_count: 0, note: '' });
    handleInputChange('report_details', newDetails);
  }, [localFormData, handleInputChange]);

  const removeReportDetail = useCallback((index) => {
    const newDetails = [...(localFormData.report_details || [])];
    newDetails.splice(index, 1);
    handleInputChange('report_details', newDetails);
  }, [localFormData, handleInputChange]);

  // Handle save draft
  const handleSaveDraftClick = async () => {
    const validation = validateReportData(localFormData);
    setValidationErrors(validation.errors);
    
    if (validation.isValid) {
      const result = await onSaveDraft(localFormData);
      if (result.success) {
        setValidationErrors({});
      }
    }
  };

  // Handle submit
  const handleSubmitClick = async () => {
    const validation = validateReportData(localFormData);
    setValidationErrors(validation.errors);
    
    if (validation.isValid) {
      await onSubmit(localFormData);
    }
  };

  // Handle validate
  const handleValidate = () => {
    const validation = validateReportData(localFormData);
    setValidationErrors(validation.errors);
    return validation;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Basic Information Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2c3e50' }}>
            基本情報
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="入院数"
                type="number"
                value={localFormData.admission_count || 0}
                onChange={(e) => handleInputChange('admission_count', parseInt(e.target.value) || 0)}
                error={!!validationErrors.admission_count}
                helperText={validationErrors.admission_count}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="退院数"
                type="number"
                value={localFormData.discharge_count || 0}
                onChange={(e) => handleInputChange('discharge_count', parseInt(e.target.value) || 0)}
                error={!!validationErrors.discharge_count}
                helperText={validationErrors.discharge_count}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="緊急搬入数"
                type="number"
                value={localFormData.emergency_transport || 0}
                onChange={(e) => handleInputChange('emergency_transport', parseInt(e.target.value) || 0)}
                error={!!validationErrors.emergency_transport}
                helperText={validationErrors.emergency_transport}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="搬入後入院件数"
                type="number"
                value={localFormData.post_transport_admission || 0}
                onChange={(e) => handleInputChange('post_transport_admission', parseInt(e.target.value) || 0)}
                error={!!validationErrors.post_transport_admission}
                helperText={validationErrors.post_transport_admission}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="特記事項"
                multiline
                rows={3}
                value={localFormData.special_notes || ''}
                onChange={(e) => handleInputChange('special_notes', e.target.value)}
                disabled={readOnly}
                placeholder="特記事項があれば入力してください"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Shift Nurses Section */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              外来看護師
            </Typography>
            {!readOnly && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addShiftNurse}
                size="small"
              >
                看護師追加
              </Button>
            )}
          </Box>
          
          {validationErrors.shift_nurses && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors.shift_nurses}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>勤務区分</TableCell>
                  <TableCell>氏名</TableCell>
                  <TableCell>備考</TableCell>
                  {!readOnly && <TableCell>操作</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(localFormData.shift_nurses || []).map((nurse, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          value={nurse.shift_type || 0}
                          onChange={(e) => handleShiftNurseChange(index, 'shift_type', e.target.value)}
                          disabled={readOnly}
                        >
                          <MenuItem value={0}>準夜勤</MenuItem>
                          <MenuItem value={1}>深夜勤</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={nurse.nurse_name || ''}
                        onChange={(e) => handleShiftNurseChange(index, 'nurse_name', e.target.value)}
                        disabled={readOnly}
                        placeholder="氏名を入力"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={nurse.note || ''}
                        onChange={(e) => handleShiftNurseChange(index, 'note', e.target.value)}
                        disabled={readOnly}
                        placeholder="備考を入力"
                      />
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <IconButton onClick={() => removeShiftNurse(index)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(localFormData.shift_nurses || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={readOnly ? 3 : 4} align="center">
                      <Typography color="textSecondary">
                        看護師が登録されていません
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Duty Staff Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2c3e50' }}>
            当直スタッフ
          </Typography>
          
          {validationErrors.duty_staff && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors.duty_staff}
            </Alert>
          )}

          <Grid container spacing={3}>
            {[
              { position: 'security', label: '保安' },
              { position: 'medical_affairs', label: '医事' },
              { position: 'medical_affairs_2', label: '医事2' },
              { position: 'security_2', label: '保安2' },
              { position: 'medical_affairs_3', label: '医事3' },
              { position: 'internal_medicine', label: '内科' }
            ].map((staffType) => {
              const staff = (localFormData.duty_staff || []).find(s => s.position === staffType.position);
              
              return (
                <React.Fragment key={staffType.position}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={`${staffType.label} 1人目`}
                      value={staff?.staff_name_1 || ''}
                      onChange={(e) => handleDutyStaffChange(staffType.position, 'staff_name_1', e.target.value)}
                      error={!!validationErrors[`duty_staff_${staffType.position}_1`]}
                      helperText={validationErrors[`duty_staff_${staffType.position}_1`]}
                      disabled={readOnly}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={`${staffType.label} 2人目`}
                      value={staff?.staff_name_2 || ''}
                      onChange={(e) => handleDutyStaffChange(staffType.position, 'staff_name_2', e.target.value)}
                      error={!!validationErrors[`duty_staff_${staffType.position}_2`]}
                      helperText={validationErrors[`duty_staff_${staffType.position}_2`]}
                      disabled={readOnly}
                    />
                  </Grid>
                </React.Fragment>
              );
            })}
          </Grid>
        </Paper>

        {/* Report Details Section */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              診療部門データ
            </Typography>
            {!readOnly && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addReportDetail}
                size="small"
              >
                部門追加
              </Button>
            )}
          </Box>
          
          {validationErrors.report_details && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors.report_details}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>診療区</TableCell>
                  <TableCell>患者数</TableCell>
                  <TableCell>備考</TableCell>
                  {!readOnly && <TableCell>操作</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(localFormData.report_details || []).map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth error={!!validationErrors[`report_details_${index}_department`]}>
                        <Select
                          value={detail.department_id || ''}
                          onChange={(e) => handleReportDetailChange(index, 'department_id', e.target.value)}
                          disabled={readOnly}
                        >
                          <MenuItem value="">選択してください</MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {validationErrors[`report_details_${index}_department`] && (
                          <Typography variant="caption" color="error">
                            {validationErrors[`report_details_${index}_department`]}
                          </Typography>
                        )}
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={detail.patient_count || 0}
                        onChange={(e) => handleReportDetailChange(index, 'patient_count', parseInt(e.target.value) || 0)}
                        error={!!validationErrors[`report_details_${index}_patient_count`]}
                        disabled={readOnly}
                      />
                      {validationErrors[`report_details_${index}_patient_count`] && (
                        <Typography variant="caption" color="error">
                          {validationErrors[`report_details_${index}_patient_count`]}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={detail.note || ''}
                        onChange={(e) => handleReportDetailChange(index, 'note', e.target.value)}
                        disabled={readOnly}
                      />
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <IconButton onClick={() => removeReportDetail(index)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(localFormData.report_details || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={readOnly ? 3 : 4} align="center">
                      <Typography color="textSecondary">
                        診療部門データが登録されていません
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Action Buttons */}
        {!readOnly && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={isSavingDraft ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveDraftClick}
                disabled={isSavingDraft || isSubmitting}
                sx={{ minWidth: 120 }}
              >
                {isSavingDraft ? '保存中...' : '下書き保存'}
              </Button>
              <Button
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSubmitClick}
                disabled={isSubmitting || isSavingDraft}
                sx={{ minWidth: 120 }}
              >
                {isSubmitting ? '提出中...' : '提出する'}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Status Display */}
        {readOnly && reportStatus && (
          <Alert 
            severity={
              reportStatus === 'submitted' ? 'info' :
              reportStatus === 'approved' ? 'success' :
              reportStatus === 'rejected' ? 'error' : 'warning'
            }
          >
            <Typography variant="body2">
              このレポートは{reportStatus === 'submitted' ? '提出済み' : 
                reportStatus === 'approved' ? '承認済み' : 
                reportStatus === 'rejected' ? '拒否済み' : '下書き'}です。
              {reportStatus === 'draft' && ' 編集するには下書き保存を解除してください。'}
            </Typography>
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default ReportEntryBig;