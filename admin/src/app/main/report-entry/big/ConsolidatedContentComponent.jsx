import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  useMediaQuery,
  useTheme,
  IconButton,
  CircularProgress,
  Button,
  Paper,
  Alert,
  Tooltip,
  FormControl,
  InputAdornment
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';

const ConsolidatedContentComponent = ({
  data = [],
  departments = [],
  doctors = [],
  hospitalId,
  onDataChange,
  validationErrors = {},
  loading: externalLoading = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState({});
  const [departmentStats, setDepartmentStats] = useState({});
  const [doctorCache, setDoctorCache] = useState({});

  // Refs to track initialization state
  const initializedRef = useRef(false);
  const dataInitializedRef = useRef(false);

  // Consultation types
  const consultationTypes = [
    { value: 'morning', label: '午前診', color: '#3498db', short: 'AM' },
    { value: 'afternoon', label: '午後診', color: '#9b59b6', short: 'PM' },
    { value: 'night', label: '夜診', color: '#e74c3c', short: '夜' }
  ];

  // Load departments with doctors from API
  useEffect(() => {
    if (hospitalId && !initializedRef.current) {
      loadDepartmentsWithDoctors();
      initializedRef.current = true;
    }
  }, [hospitalId]);

  // Initialize rows when data or departments change
  useEffect(() => {
    // Only initialize from data once when component mounts
    if (data && data.length > 0) {
      console.log('Initializing rows from data for the first time');
      initializeRowsFromData(data);
    } else if (departmentOptions.length > 0 && rows.length === 0) {
      console.log('Initializing empty rows from departments');
      initializeRowsFromDepartments();
    }
  }, [data, departmentOptions]);

  const loadDepartmentsWithDoctors = async () => {
    setLoading(true);
    try {
      const response = await axios.post(apiConfig.reportDepartmentsWithDoctors, {
        hospital_id: hospitalId
      });

      if (response.data.success && response.data.data) {
        const departmentsData = response.data.data;
        
        // Format department options
        const formattedDepartments = departmentsData.map(dept => ({
          id: dept.id,
          name: dept.name,
          doctorCount: dept.doctors?.length || 0
        }));
        
        setDepartmentOptions(formattedDepartments);
        
        // Build doctor options by department
        const doctorsByDept = {};
        const allDoctorsCache = {};
        
        departmentsData.forEach(dept => {
          doctorsByDept[dept.id] = dept.doctors || [];
          
          // Cache doctors by ID for quick lookup
          if (dept.doctors) {
            dept.doctors.forEach(doctor => {
              allDoctorsCache[doctor.id] = doctor;
            });
          }
        });
        
        setDoctorOptions(doctorsByDept);
        setDoctorCache(allDoctorsCache);
      }
    } catch (error) {
      console.error('Error loading departments with doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeRowsFromData = (reportData) => {
    if (!reportData || !Array.isArray(reportData)) {
      console.log('No valid report data, initializing from departments');
      initializeRowsFromDepartments();
      return;
    }
    
    console.log('Initializing rows from data:', reportData.length, 'items');
    
    // Group data by sequence_no and department_id
    const groupedData = {};
    
    reportData.forEach(item => {
      const key = `${item.sequence_no}_${item.department_id}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          id: `row-${key}`,
          sequence_no: item.sequence_no,
          department_id: item.department_id,
          department_name: item.department_name,
          consultations: {}
        };
      }
      
      groupedData[key].consultations[item.consultation_type] = {
        doctor_id_1: item.doctor_id_1,
        doctor_id_2: item.doctor_id_2,
        doctor_id_3: item.doctor_id_3,
        patient_count: item.patient_count || 0
      };
    });
    
    const newRows = Object.values(groupedData).map(group => {
      // Ensure all consultation types exist
      const consultationsMap = {};
      consultationTypes.forEach(type => {
        consultationsMap[type.value] = group.consultations[type.value] || {
          doctor_id_1: null,
          doctor_id_2: null,
          doctor_id_3: null,
          patient_count: 0
        };
      });
      
      return {
        ...group,
        consultations: consultationTypes.map(type => ({
          type: type.value,
          doctor_id_1: consultationsMap[type.value]?.doctor_id_1 || null,
          doctor_id_2: consultationsMap[type.value]?.doctor_id_2 || null,
          doctor_id_3: consultationsMap[type.value]?.doctor_id_3 || null,
          patient_count: consultationsMap[type.value]?.patient_count || 0
        }))
      };
    });
    
    console.log('Created rows from data:', newRows.length, 'rows');
    setRows(newRows);
    calculateDepartmentStats(newRows);
  };

  const initializeRowsFromDepartments = () => {
    // Start with one empty row if no data
    if (departmentOptions.length > 0 && rows.length === 0) {
      console.log('Creating initial empty row');
      const initialRow = {
        id: `new-${Date.now()}`,
        sequence_no: 1,
        department_id: null,
        department_name: '',
        consultations: consultationTypes.map(type => ({
          type: type.value,
          doctor_id_1: null,
          doctor_id_2: null,
          doctor_id_3: null,
          patient_count: 0
        }))
      };
      
      setRows([initialRow]);
      calculateDepartmentStats([initialRow]);
    }
  };

  const getDoctorsForDepartment = (departmentId) => {
    return doctorOptions[departmentId] || [];
  };

  const findDoctorById = (doctorId) => {
    return doctorCache[doctorId];
  };

  const getDoctorDisplayName = (doctorId) => {
    const doctor = findDoctorById(doctorId);
    if (!doctor) return '';
    
    return doctor.license_no ? `${doctor.license_no} ${doctor.name}` : doctor.name;
  };

  // Helper function to check if a doctor is already selected in the same consultation type
  const isDoctorSelectedInSameConsultation = (row, consultationIndex, doctorId, currentField) => {
    if (!doctorId) return false;
    
    const consultation = row.consultations[consultationIndex];
    
    // Check all three doctor fields in this consultation
    const selectedDoctors = [
      consultation.doctor_id_1,
      consultation.doctor_id_2,
      consultation.doctor_id_3
    ].filter(id => id !== null); // Filter out null values
    
    // If this doctor is already selected in any field (except the current field we're updating)
    // we need to prevent duplicate selection
    if (currentField === 'doctor_id_1') {
      return selectedDoctors.includes(doctorId) && consultation.doctor_id_1 !== doctorId;
    } else if (currentField === 'doctor_id_2') {
      return selectedDoctors.includes(doctorId) && consultation.doctor_id_2 !== doctorId;
    } else if (currentField === 'doctor_id_3') {
      return selectedDoctors.includes(doctorId) && consultation.doctor_id_3 !== doctorId;
    }
    
    return selectedDoctors.includes(doctorId);
  };

  // Handler functions
  const handleDoctorChange = (rowId, consultationIndex, doctorField, doctorId) => {
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const updatedConsultations = [...row.consultations];
        
        // Check if this doctor is already selected in the same consultation
        const isDuplicate = isDoctorSelectedInSameConsultation(row, consultationIndex, doctorId, doctorField);
        
        // If it's a duplicate, don't update and show alert
        if (isDuplicate && doctorId) {
          alert('同じ診療時間帯に同じ医師を重複して選択することはできません。');
          return row;
        }
        
        updatedConsultations[consultationIndex] = {
          ...updatedConsultations[consultationIndex],
          [doctorField]: doctorId
        };
        
        return {
          ...row,
          consultations: updatedConsultations
        };
      }
      return row;
    });
    
    setRows(newRows);
    calculateDepartmentStats(newRows);
    notifyParent(newRows);
  };

  const handlePatientCountChange = (rowId, consultationIndex, value) => {
    const numValue = parseInt(value) || 0;
    
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const updatedConsultations = [...row.consultations];
        updatedConsultations[consultationIndex] = {
          ...updatedConsultations[consultationIndex],
          patient_count: numValue
        };
        
        return {
          ...row,
          consultations: updatedConsultations
        };
      }
      return row;
    });
    
    setRows(newRows);
    calculateDepartmentStats(newRows);
    notifyParent(newRows);
  };

  const handleAddRow = () => {
    console.log('Current rows before adding:', rows.length);
    const newRowId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRow = {
      id: newRowId,
      sequence_no: rows.length + 1,
      department_id: null,
      department_name: '',
      consultations: consultationTypes.map(type => ({
        type: type.value,
        doctor_id_1: null,
        doctor_id_2: null,
        doctor_id_3: null,
        patient_count: 0
      }))
    };
    
    console.log('Adding new row:', newRow);
    const newRows = [...rows, newRow];
    console.log('New rows after adding:', newRows.length);
    setRows(newRows);
    calculateDepartmentStats(newRows);
    notifyParent(newRows);
  };

  const handleRemoveRow = (rowId) => {
    console.log('Removing row:', rowId);
    const newRows = rows.filter(row => row.id !== rowId);
    
    // Update sequence numbers
    newRows.forEach((row, index) => {
      row.sequence_no = index + 1;
    });
    
    console.log('After removal:', newRows.length, 'rows');
    setRows(newRows);
    calculateDepartmentStats(newRows);
    notifyParent(newRows);
  };

  const handleDepartmentChange = (rowId, departmentId) => {
    console.log('Changing department for row:', rowId, 'to:', departmentId);
    const department = departmentOptions.find(dept => dept.id === departmentId);
    
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const updatedRow = {
          ...row,
          department_id: departmentId,
          department_name: department?.name || '',
          // Reset doctors when department changes
          consultations: row.consultations.map(cons => ({
            ...cons,
            doctor_id_1: null,
            doctor_id_2: null,
            doctor_id_3: null
          }))
        };
        console.log('Updated row:', updatedRow);
        return updatedRow;
      }
      return row;
    });
    
    setRows(newRows);
    notifyParent(newRows);
  };

  const handleMoveRow = (rowId, direction) => {
    const index = rows.findIndex(row => row.id === rowId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === rows.length - 1)) {
      return;
    }
    
    const newRows = [...rows];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap rows
    [newRows[index], newRows[swapIndex]] = [newRows[swapIndex], newRows[index]];
    
    // Update sequence numbers
    newRows.forEach((row, idx) => {
      row.sequence_no = idx + 1;
    });
    
    setRows(newRows);
    notifyParent(newRows);
  };

  const notifyParent = (updatedRows) => {
    console.log('Notifying parent with rows:', updatedRows.length, 'rows');
    if (onDataChange) {
      const flatData = [];
      updatedRows.forEach(row => {
        row.consultations.forEach(consultation => {
          flatData.push({
            sequence_no: row.sequence_no,
            department_id: row.department_id,
            consultation_type: consultation.type,
            doctor_id_1: consultation.doctor_id_1,
            doctor_id_2: consultation.doctor_id_2,
            doctor_id_3: consultation.doctor_id_3,
            patient_count: consultation.patient_count
          });
        });
      });
      console.log('Flat data for parent:', flatData.length, 'items');
      onDataChange(flatData);
    }
  };

  const calculateRowTotal = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return 0;
    
    return row.consultations.reduce((sum, consultation) => {
      return sum + (consultation.patient_count || 0);
    }, 0);
  };

  const calculateGrandTotal = () => {
    return rows.reduce((total, row) => {
      return total + calculateRowTotal(row.id);
    }, 0);
  };

  const calculateDepartmentStats = (rowsData) => {
    const stats = {};
    rowsData.forEach(row => {
      stats[row.id] = calculateRowTotal(row.id);
    });
    setDepartmentStats(stats);
  };

  // Check if department is already used in other rows
  const isDepartmentAlreadyUsed = (departmentId, currentRowId) => {
    return rows.some(row => 
      row.id !== currentRowId && row.department_id === departmentId
    );
  };

  // Responsive values
  const cellPadding = isMobile ? '4px 6px' : isTablet ? '8px 10px' : '12px 14px';
  const fontSize = {
    small: isMobile ? '0.75rem' : isTablet ? '0.8125rem' : '0.875rem',
    medium: isMobile ? '0.875rem' : isTablet ? '0.9375rem' : '1rem',
    large: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem',
    xlarge: isMobile ? '1.125rem' : isTablet ? '1.25rem' : '1.5rem',
  };
  const selectHeight = isMobile ? 36 : isTablet ? 40 : 44;

  if (externalLoading || loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        p: 6,
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography sx={{ color: '#666', fontSize: fontSize.medium }}>
          診療区と医師データを読み込み中...
        </Typography>
      </Box>
    );
  }

  if (!hospitalId) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        p: 4,
        gap: 2,
        textAlign: 'center'
      }}>
        <InfoOutlinedIcon sx={{ fontSize: 48, color: '#bdc3c7' }} />
        <Typography sx={{ 
          fontSize: fontSize.xlarge,
          color: '#7f8c8d',
          fontWeight: 600
        }}>
          病院が選択されていません
        </Typography>
        <Typography sx={{ 
          fontSize: fontSize.medium,
          color: '#95a5a6'
        }}>
          診療区データを表示するには病院を選択してください
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #e0e0e0",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Header Section */}
      <Box sx={{ 
        p: isMobile ? 2 : 3,
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
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
                height: 20, 
                backgroundColor: '#3498db',
                borderRadius: '2px'
              }} />
              診療部門別集計
            </Typography>
            <Typography sx={{ 
              fontSize: fontSize.medium,
              color: "#666",
              mt: 0.5
            }}>
              診療区ごとに担当医と患者数を入力してください
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="合計患者数">
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 2,
                py: 1,
                backgroundColor: '#0A6AE3',
                borderRadius: '8px',
                color: 'white'
              }}>
                <Typography sx={{ fontSize: fontSize.medium, fontWeight: 600 }}>
                  総合計:
                </Typography>
                <Typography sx={{ 
                  fontSize: fontSize.large,
                  fontWeight: 700,
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {calculateGrandTotal()}
                </Typography>
              </Box>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              size="small"
              sx={{
                backgroundColor: '#27ae60',
                '&:hover': {
                  backgroundColor: '#219955'
                }
              }}
            >
              診療区追加
            </Button>
          </Box>
        </Box>
        
        {/* Department Stats */}
        {departmentOptions.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mt: 2,
            flexWrap: 'wrap'
          }}>
            <Typography sx={{ 
              fontSize: fontSize.medium,
              color: "#666",
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              <InfoOutlinedIcon fontSize="small" />
              利用可能な診療区:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {departmentOptions.map(dept => {
                const isSelected = rows.some(row => row.department_id === dept.id);
                const doctorCount = doctorOptions[dept.id]?.length || 0;
                
                return (
                  <Tooltip 
                    key={dept.id} 
                    title={`${doctorCount}名の医師が登録されています`}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '12px',
                        backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5',
                        border: `1px solid ${isSelected ? '#0A6AE3' : '#e0e0e0'}`,
                      }}
                    >
                      <Typography sx={{ 
                        fontSize: fontSize.medium,
                        color: isSelected ? '#0A6AE3' : '#666',
                        fontWeight: isSelected ? 600 : 400
                      }}>
                        {dept.name}
                      </Typography>
                      {doctorCount > 0 && (
                        <Box sx={{ 
                          backgroundColor: isSelected ? '#0A6AE3' : '#757575',
                          color: 'white',
                          fontSize: fontSize.small,
                          px: 0.5,
                          py: 0.25,
                          borderRadius: '4px',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {doctorCount}
                        </Box>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      {/* Validation Errors */}
      {validationErrors.consolidatedData && (
        <Alert 
          severity="error" 
          sx={{ 
            mx: isMobile ? 2 : 3,
            mt: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          {validationErrors.consolidatedData}
        </Alert>
      )}

      {/* Main Table */}
      <Box sx={{ 
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#a8a8a8'
          }
        },
      }}>
        <Table sx={{ minWidth: isMobile ? '1000px' : '1200px' }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{  
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #e0e0e0",
                  padding: cellPadding,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: fontSize.medium,
                  color: "#2c3e50",
                  minWidth: '80px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2
                }}
              >
                通番
              </TableCell>

              <TableCell sx={{ 
                backgroundColor: "#F9FAFB",
                border: "1px solid #e0e0e0",
                padding: cellPadding,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: fontSize.medium,
                color: "#2c3e50",
                minWidth: '140px',
                position: 'sticky',
                left: '60px',
                backgroundColor: '#F9FAFB',
                zIndex: 2
              }}>
                診療区
              </TableCell>
              <TableCell sx={{ 
                backgroundColor: "#F9FAFB",
                border: "1px solid #e0e0e0",
                padding: cellPadding,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: fontSize.medium,
                color: "#2c3e50",
                minWidth: '90px'
              }}>
                診療区分
              </TableCell>
              <TableCell colSpan={3} sx={{ 
                backgroundColor: "#F9FAFB",
                border: "1px solid #e0e0e0",
                padding: cellPadding,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: fontSize.medium,
                color: "#2c3e50",
                minWidth: '320px'
              }}>
                診療担当医
                <Typography sx={{ 
                  fontSize: fontSize.small, 
                  color: "#666",
                  fontWeight: 400,
                  mt: 0.5
                }}>
                  (最大3名まで選択可能、同じ医師は同じ時間帯に重複選択できません)
                </Typography>
              </TableCell>
              <TableCell sx={{ 
                backgroundColor: "#F9FAFB",
                border: "1px solid #e0e0e0",
                padding: cellPadding,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: fontSize.medium,
                color: "#2c3e50",
                minWidth: '100px'
              }}>
                患者数
              </TableCell>
              <TableCell sx={{ 
                backgroundColor: "#F9FAFB",
                border: "1px solid #e0e0e0",
                padding: cellPadding,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: fontSize.medium,
                color: "#2c3e50",
                minWidth: '100px'
              }}>
                合計
              </TableCell>
              <TableCell sx={{ 
                backgroundColor: "#F9FAFB",
                border: "1px solid #e0e0e0",
                padding: cellPadding,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: fontSize.medium,
                color: "#2c3e50",
                minWidth: '120px'
              }}>
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {rows.map((row, rowIndex) => (
              <React.Fragment key={`row-fragment-${row.id}`}>
                {row.consultations.map((consultation, consultationIndex) => {
                  const typeConfig = consultationTypes.find(t => t.value === consultation.type);
                  const rowError = validationErrors[`department_${rowIndex}`];
                  const patientError = validationErrors[`patientCount_${rowIndex}_${consultationIndex}`];
                  const departmentDoctors = getDoctorsForDepartment(row.department_id);
                  const isDeptAlreadyUsed = isDepartmentAlreadyUsed(row.department_id, row.id);
                  
                  // Get currently selected doctors in this consultation
                  const selectedDoctorIds = [
                    consultation.doctor_id_1,
                    consultation.doctor_id_2,
                    consultation.doctor_id_3
                  ].filter(id => id !== null);
                  
                  return (
                    <TableRow 
                      key={`${row.id}-${consultation.type}`}
                      sx={{
                        backgroundColor: consultationIndex % 2 === 0 ? '#ffffff' : '#f8f9fa',
                        '&:hover': {
                          backgroundColor: '#f0f7ff'
                        }
                      }}
                    >
                      {/* Sequence Number - spans 3 rows */}
                      {consultationIndex === 0 && (
                        <TableCell 
                          rowSpan={3}
                          sx={{ 
                            border: "1px solid #e0e0e0",
                            padding: cellPadding,
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            fontWeight: 700,
                            fontSize: fontSize.large,
                            color: "#0A6AE3",
                            position: 'sticky',
                            left: 0,
                            backgroundColor: consultationIndex % 2 === 0 ? '#ffffff' : '#f8f9fa',
                            zIndex: 1
                          }}
                        >
                          {row.sequence_no.toString().padStart(2, '0')}
                        </TableCell>
                      )}
                      
                      {/* Department - spans 3 rows */}
                      {consultationIndex === 0 && (
                        <TableCell 
                          rowSpan={3}
                          sx={{ 
                            border: "1px solid #e0e0e0",
                            padding: cellPadding,
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            position: 'sticky',
                            left: '60px',
                            backgroundColor: consultationIndex % 2 === 0 ? '#ffffff' : '#f8f9fa',
                            zIndex: 1
                          }}
                        >
                          <FormControl fullWidth size="small" error={!!rowError || isDeptAlreadyUsed}>
                            <Select
                              value={row.department_id || ''}
                              onChange={(e) => handleDepartmentChange(row.id, e.target.value)}
                              displayEmpty
                              sx={{
                                height: selectHeight,
                                fontSize: fontSize.medium,
                                '& .MuiSelect-select': {
                                  padding: isMobile ? '6px 8px' : '8px 12px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }
                              }}
                              renderValue={(selected) => {
                                if (!selected) {
                                  return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#999' }}>
                                      <PersonSearchIcon sx={{ fontSize: 16, mr: 1 }} />
                                      診療区を選択
                                    </Box>
                                  );
                                }
                                
                                const selectedDept = departmentOptions.find(d => d.id === selected);
                                const doctorCount = departmentDoctors.length;
                                
                                return (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Typography sx={{ 
                                      fontWeight: 600,
                                      color: isDeptAlreadyUsed ? '#ff9800' : rowError ? '#df1c41' : '#2c3e50',
                                      fontSize: fontSize.medium
                                    }}>
                                      {selectedDept?.name || 'Unknown'}
                                      {isDeptAlreadyUsed && ' (重複)'}
                                    </Typography>
                                    <Typography sx={{ 
                                      fontSize: fontSize.small,
                                      color: '#666',
                                      mt: 0.25
                                    }}>
                                      {doctorCount}名の医師
                                    </Typography>
                                  </Box>
                                );
                              }}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    maxHeight: 300,
                                    fontSize: fontSize.medium
                                  }
                                }
                              }}
                            >
                              <MenuItem value="" disabled>
                                <Typography sx={{ color: '#999', fontSize: fontSize.medium }}>
                                  診療区を選択してください
                                </Typography>
                              </MenuItem>
                              {departmentOptions.map((dept) => {
                                const deptDoctorCount = doctorOptions[dept.id]?.length || 0;
                                const isUsed = isDepartmentAlreadyUsed(dept.id, row.id);
                                
                                return (
                                  <MenuItem 
                                    key={dept.id} 
                                    value={dept.id}
                                    disabled={isUsed}
                                    sx={{ 
                                      fontSize: fontSize.medium,
                                      '&.Mui-selected': {
                                        backgroundColor: '#e3f2fd'
                                      },
                                      opacity: isUsed ? 0.6 : 1
                                    }}
                                  >
                                    <Box sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      width: '100%'
                                    }}>
                                      <Typography sx={{ fontWeight: 500 }}>
                                        {dept.name}
                                        {isUsed && ' (使用中)'}
                                      </Typography>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        gap: 1
                                      }}>
                                        {deptDoctorCount > 0 ? (
                                          <Typography sx={{ 
                                            fontSize: fontSize.small,
                                            color: '#666'
                                          }}>
                                            {deptDoctorCount}名
                                          </Typography>
                                        ) : (
                                          <Typography sx={{ 
                                            fontSize: fontSize.small,
                                            color: '#ff9800',
                                            fontStyle: 'italic'
                                          }}>
                                            医師なし
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                            {(rowError || isDeptAlreadyUsed) && (
                              <Typography sx={{ 
                                color: isDeptAlreadyUsed ? '#ff9800' : '#df1c41', 
                                fontSize: fontSize.medium,
                                mt: 0.5
                              }}>
                                {isDeptAlreadyUsed ? '既に登録された診療区は全て選択済みです。こちらを削除して下さい。' : rowError}
                              </Typography>
                            )}
                          </FormControl>
                        </TableCell>
                      )}
                      
                      {/* Consultation Type */}
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0",
                        padding: cellPadding,
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        backgroundColor: `${typeConfig.color}15`
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%',
                            backgroundColor: typeConfig.color
                          }} />
                          <Typography sx={{ 
                            fontWeight: 600,
                            fontSize: fontSize.medium,
                            color: typeConfig.color
                          }}>
                            {typeConfig.label}
                          </Typography>
                          <Typography sx={{ 
                            fontSize: fontSize.small,
                            color: typeConfig.color,
                            opacity: 0.8,
                            ml: 0.5
                          }}>
                            ({typeConfig.short})
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      {/* Doctor 1 */}
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0",
                        padding: cellPadding,
                        textAlign: 'center'
                      }}>
                        <Select
                          value={consultation.doctor_id_1 || ''}
                          onChange={(e) => handleDoctorChange(row.id, consultationIndex, 'doctor_id_1', e.target.value)}
                          displayEmpty
                          size="small"
                          disabled={!row.department_id || departmentDoctors.length === 0 || isDeptAlreadyUsed}
                          IconComponent={KeyboardArrowDownIcon}
                          sx={{
                            width: '100%',
                            height: selectHeight,
                            backgroundColor: consultation.doctor_id_1 ? '#EFF6FF' : '#F9FAFB',
                            fontSize: fontSize.medium,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: consultation.doctor_id_1 ? '#0A6AE3' : '#dfe1e7',
                            },
                            '& .MuiSelect-select': {
                              padding: isMobile ? '6px 8px' : '8px 12px',
                              color: consultation.doctor_id_1 ? "#0A6AE3" : "#9CA3AF",
                              fontWeight: consultation.doctor_id_1 ? 600 : 400,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#0A6AE3',
                            }
                          }}
                          renderValue={(selected) => {
                            if (!selected) {
                              if (!row.department_id) {
                                return "診療区を先に選択";
                              }
                              if (isDeptAlreadyUsed) {
                                return "診療区が重複";
                              }
                              if (departmentDoctors.length === 0) {
                                return "医師がいません";
                              }
                              return "医師を選択";
                            }
                            return getDoctorDisplayName(selected);
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                fontSize: fontSize.medium
                              }
                            }
                          }}
                        >
                          <MenuItem value="">
                            <Typography sx={{ color: '#999', fontSize: fontSize.medium }}>
                              医師を選択
                            </Typography>
                          </MenuItem>
                          {departmentDoctors.map((doctor) => {
                            // Check if this doctor is already selected in this consultation (excluding current field)
                            const isDoctorSelected = selectedDoctorIds.includes(doctor.id) && 
                                                     consultation.doctor_id_1 !== doctor.id;
                            
                            return (
                              <MenuItem 
                                key={`${row.id}-${consultation.type}-doctor1-${doctor.id}`}
                                value={doctor.id}
                                disabled={isDoctorSelected}
                                sx={{ 
                                  fontSize: fontSize.medium,
                                  '&.Mui-selected': {
                                    backgroundColor: '#e3f2fd'
                                  },
                                  opacity: isDoctorSelected ? 0.5 : 1,
                                  backgroundColor: isDoctorSelected ? '#f5f5f5' : 'inherit'
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                  <Box sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%',
                                    backgroundColor: isDoctorSelected ? '#ccc' : '#0A6AE3'
                                  }} />
                                  <Typography sx={{ fontWeight: 500 }}>
                                    {doctor?.license_no}
                                  </Typography>
                                  {doctor.name && (
                                    <Typography sx={{ 
                                      fontSize: fontSize.small, 
                                      color: isDoctorSelected ? '#999' : '#666',
                                      ml: 'auto'
                                    }}>
                                      {doctor.name}
                                      {isDoctorSelected && ' (選択済み)'}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </TableCell>
                      
                      {/* Doctor 2 */}
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0",
                        padding: cellPadding,
                        textAlign: 'center'
                      }}>
                        <Select
                          value={consultation.doctor_id_2 || ''}
                          onChange={(e) => handleDoctorChange(row.id, consultationIndex, 'doctor_id_2', e.target.value)}
                          displayEmpty
                          size="small"
                          disabled={!row.department_id || departmentDoctors.length === 0 || isDeptAlreadyUsed}
                          IconComponent={KeyboardArrowDownIcon}
                          sx={{
                            width: '100%',
                            height: selectHeight,
                            backgroundColor: consultation.doctor_id_2 ? '#EFF6FF' : '#F9FAFB',
                            fontSize: fontSize.medium,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: consultation.doctor_id_2 ? '#0A6AE3' : '#dfe1e7',
                            },
                            '& .MuiSelect-select': {
                              padding: isMobile ? '6px 8px' : '8px 12px',
                              color: consultation.doctor_id_2 ? "#0A6AE3" : "#9CA3AF",
                              fontWeight: consultation.doctor_id_2 ? 600 : 400,
                            },
                          }}
                          renderValue={(selected) => {
                            if (!selected) {
                              if (!row.department_id) {
                                return "診療区を先に選択";
                              }
                              if (isDeptAlreadyUsed) {
                                return "診療区が重複";
                              }
                              if (departmentDoctors.length === 0) {
                                return "医師がいません";
                              }
                              return "医師を選択";
                            }
                            return getDoctorDisplayName(selected);
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                fontSize: fontSize.medium
                              }
                            }
                          }}
                        >
                          <MenuItem value="">
                            <Typography sx={{ color: '#999', fontSize: fontSize.medium }}>
                              医師を選択
                            </Typography>
                          </MenuItem>
                          {departmentDoctors.map((doctor) => {
                            // Check if this doctor is already selected in this consultation (excluding current field)
                            const isDoctorSelected = selectedDoctorIds.includes(doctor.id) && 
                                                     consultation.doctor_id_2 !== doctor.id;
                            
                            return (
                              <MenuItem 
                                key={`${row.id}-${consultation.type}-doctor2-${doctor.id}`}
                                value={doctor.id}
                                disabled={isDoctorSelected}
                                sx={{ 
                                  fontSize: fontSize.medium,
                                  '&.Mui-selected': {
                                    backgroundColor: '#e3f2fd'
                                  },
                                  opacity: isDoctorSelected ? 0.5 : 1,
                                  backgroundColor: isDoctorSelected ? '#f5f5f5' : 'inherit'
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                  <Box sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%',
                                    backgroundColor: isDoctorSelected ? '#ccc' : '#0A6AE3'
                                  }} />
                                  <Typography sx={{ fontWeight: 500 }}>
                                    {doctor?.license_no}
                                  </Typography>
                                  {doctor.name && (
                                    <Typography sx={{ 
                                      fontSize: fontSize.small, 
                                      color: isDoctorSelected ? '#999' : '#666',
                                      ml: 'auto'
                                    }}>
                                      {doctor.name}
                                      {isDoctorSelected && ' (選択済み)'}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </TableCell>
                      
                      {/* Doctor 3 */}
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0",
                        padding: cellPadding,
                        textAlign: 'center'
                      }}>
                        <Select
                          value={consultation.doctor_id_3 || ''}
                          onChange={(e) => handleDoctorChange(row.id, consultationIndex, 'doctor_id_3', e.target.value)}
                          displayEmpty
                          size="small"
                          disabled={!row.department_id || departmentDoctors.length === 0 || isDeptAlreadyUsed}
                          IconComponent={KeyboardArrowDownIcon}
                          sx={{
                            width: '100%',
                            height: selectHeight,
                            backgroundColor: consultation.doctor_id_3 ? '#EFF6FF' : '#F9FAFB',
                            fontSize: fontSize.medium,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: consultation.doctor_id_3 ? '#0A6AE3' : '#dfe1e7',
                            },
                            '& .MuiSelect-select': {
                              padding: isMobile ? '6px 8px' : '8px 12px',
                              color: consultation.doctor_id_3 ? "#0A6AE3" : "#9CA3AF",
                              fontWeight: consultation.doctor_id_3 ? 600 : 400,
                            },
                          }}
                          renderValue={(selected) => {
                            if (!selected) {
                              if (!row.department_id) {
                                return "診療区を先に選択";
                              }
                              if (isDeptAlreadyUsed) {
                                return "診療区が重複";
                              }
                              if (departmentDoctors.length === 0) {
                                return "医師がいません";
                              }
                              return "医師を選択";
                            }
                            return getDoctorDisplayName(selected);
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                fontSize: fontSize.medium
                              }
                            }
                          }}
                        >
                          <MenuItem value="">
                            <Typography sx={{ color: '#999', fontSize: fontSize.medium }}>
                              医師を選択
                            </Typography>
                          </MenuItem>
                          {departmentDoctors.map((doctor) => {
                            // Check if this doctor is already selected in this consultation (excluding current field)
                            const isDoctorSelected = selectedDoctorIds.includes(doctor.id) && 
                                                     consultation.doctor_id_3 !== doctor.id;
                            
                            return (
                              <MenuItem 
                                key={`${row.id}-${consultation.type}-doctor3-${doctor.id}`}
                                value={doctor.id}
                                disabled={isDoctorSelected}
                                sx={{ 
                                  fontSize: fontSize.medium,
                                  '&.Mui-selected': {
                                    backgroundColor: '#e3f2fd'
                                  },
                                  opacity: isDoctorSelected ? 0.5 : 1,
                                  backgroundColor: isDoctorSelected ? '#f5f5f5' : 'inherit'
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                  <Box sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%',
                                    backgroundColor: isDoctorSelected ? '#ccc' : '#0A6AE3'
                                  }} />
                                  <Typography sx={{ fontWeight: 500 }}>
                                    {doctor?.license_no}
                                  </Typography>
                                  {doctor.name && (
                                    <Typography sx={{ 
                                      fontSize: fontSize.small, 
                                      color: isDoctorSelected ? '#999' : '#666',
                                      ml: 'auto'
                                    }}>
                                      {doctor.name}
                                      {isDoctorSelected && ' (選択済み)'}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </TableCell>
                      
                      {/* Patient Count */}
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0",
                        padding: cellPadding,
                        textAlign: 'center'
                      }}>
                        <TextField
                          value={consultation.patient_count || ''}
                          autoComplete="off" // Add this line
                          onChange={(e) => handlePatientCountChange(row.id, consultationIndex, e.target.value)}
                          variant="outlined"
                          size="small"
                          type="number"
                          error={!!patientError}
                          helperText={patientError}
                          disabled={isDeptAlreadyUsed}
                          inputProps={{
                            min: 0,
                            style: {
                              textAlign: 'center',
                              fontSize: fontSize.medium,
                              padding: isMobile ? '6px 8px' : '8px 12px',
                              height: selectHeight - 8,
                              fontWeight: 600,
                              color: consultation.patient_count > 0 ? '#2c3e50' : '#999'
                            },
                          }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography sx={{ 
                                  fontSize: fontSize.medium,
                                  color: '#666'
                                }}>
                                  名
                                </Typography>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              height: selectHeight,
                              backgroundColor: consultation.patient_count > 0 ? '#f0f7ff' : '#ffffff',
                              '& fieldset': {
                                borderColor: patientError ? '#df1c41' : consultation.patient_count > 0 ? '#0A6AE3' : '#dfe1e7',
                              },
                              '&:hover fieldset': {
                                borderColor: patientError ? '#df1c41' : '#0A6AE3',
                              }
                            },
                          }}
                        />
                      </TableCell>
                      
                      {/* Subtotal - spans 3 rows */}
                      {consultationIndex === 0 && (
                        <TableCell 
                          rowSpan={3}
                          sx={{ 
                            backgroundColor: "#EFF6FF",
                            border: "1px solid #e0e0e0",
                            padding: cellPadding,
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            position: 'relative'
                          }}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: fontSize.large,
                                color: "#0A6AE3",
                              }}
                            >
                              {calculateRowTotal(row.id)}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: fontSize.medium,
                                color: "#666",
                                mt: 0.5
                              }}
                            >
                              患者数
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      
                      {/* Actions - spans 3 rows */}
                      {consultationIndex === 0 && (
                        <TableCell 
                          rowSpan={3}
                          sx={{ 
                            border: "1px solid #e0e0e0",
                            padding: cellPadding,
                            textAlign: 'center',
                            verticalAlign: 'middle'
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="上に移動">
                                <span> {/* Added span wrapper for disabled button */}
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveRow(row.id, 'up')}
                                    disabled={rowIndex === 0}
                                    sx={{
                                      border: '1px solid #e0e0e0',
                                      borderRadius: '4px',
                                      width: 32,
                                      height: 32
                                    }}
                                  >
                                    <Typography sx={{ 
                                      color: rowIndex === 0 ? '#ccc' : '#3498db',
                                      fontSize: fontSize.medium,
                                      fontWeight: 600
                                    }}>
                                      ↑
                                    </Typography>
                                  </IconButton>
                                </span>
                              </Tooltip>
                              
                              <Tooltip title="下に移動">
                                <span> {/* Added span wrapper for disabled button */}
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveRow(row.id, 'down')}
                                    disabled={rowIndex === rows.length - 1}
                                    sx={{
                                      border: '1px solid #e0e0e0',
                                      borderRadius: '4px',
                                      width: 32,
                                      height: 32
                                    }}
                                  >
                                    <Typography sx={{ 
                                      color: rowIndex === rows.length - 1 ? '#ccc' : '#3498db',
                                      fontSize: fontSize.medium,
                                      fontWeight: 600
                                    }}>
                                      ↓
                                    </Typography>
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                            
                            {rows.length > 1 && (
                              <Tooltip title="この診療区を削除">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveRow(row.id)}
                                  color="error"
                                  sx={{
                                    border: '1px solid #ffcdd2',
                                    borderRadius: '6px',
                                    width: 36,
                                    height: 36,
                                    '&:hover': {
                                      backgroundColor: '#ffebee'
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
            
            {/* Empty State */}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  border: '1px solid #e0e0e0'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <InfoOutlinedIcon sx={{ 
                      fontSize: 48, 
                      color: '#bdc3c7' 
                    }} />
                    <Typography sx={{ 
                      fontSize: fontSize.large,
                      color: '#7f8c8d',
                      fontWeight: 600
                    }}>
                      診療区が追加されていません
                    </Typography>
                    <Typography sx={{ 
                      fontSize: fontSize.medium,
                      color: '#95a5a6',
                      maxWidth: '400px',
                      textAlign: 'center'
                    }}>
                      「診療区追加」ボタンをクリックして、最初の診療区を追加してください
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddRow}
                      sx={{
                        mt: 2,
                        backgroundColor: '#27ae60',
                        fontSize: fontSize.medium,
                        '&:hover': {
                          backgroundColor: '#219955'
                        }
                      }}
                    >
                      診療区を追加
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            
            {/* Grand Total Row */}
            {rows.length > 0 && (
              <TableRow>
                <TableCell 
                  colSpan={7} 
                  sx={{ 
                    border: "1px solid #e0e0e0",
                    padding: cellPadding,
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: fontSize.large,
                    color: "#2c3e50",
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%',
                      backgroundColor: '#0A6AE3'
                    }} />
                    総合計
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  backgroundColor: "#0A6AE3",
                  border: "1px solid #0A6AE3",
                  padding: cellPadding,
                  textAlign: 'center',
                }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: fontSize.large,
                      color: "#FFFFFF",
                    }}
                  >
                    {calculateGrandTotal()}
                  </Typography>
                </TableCell>
                <TableCell sx={{ 
                  border: "1px solid #e0e0e0",
                  padding: cellPadding,
                  backgroundColor: '#f8f9fa'
                }}>
                  <Tooltip title={`${rows.length}部門`}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 1
                    }}>
                      <Typography sx={{ 
                        fontSize: fontSize.medium,
                        color: '#666'
                      }}>
                        部門数:
                      </Typography>
                      <Typography sx={{ 
                        fontSize: fontSize.medium,
                        fontWeight: 600,
                        color: '#2c3e50'
                      }}>
                        {rows.length}
                      </Typography>
                    </Box>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Footer Stats */}
      {rows.length > 0 && (
        <Box sx={{ 
          p: isMobile ? 2 : 3,
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
           {/* <Box>
              <Typography sx={{ 
                fontSize: fontSize.medium,
                color: "#666",
                mb: 0.5
              }}>
                総患者数
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#0A6AE3"
              }}>
                {calculateGrandTotal()} 名
              </Typography>
            </Box>*/}
            
            <Box>
              <Typography sx={{ 
                fontSize: fontSize.medium,
                color: "#666",
                mb: 0.5
              }}>
                診療部門数
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#27ae60"
              }}>
                {rows.length} 部門
              </Typography>
            </Box>
            
             {/*<Box>
              <Typography sx={{ 
                fontSize: fontSize.medium,
                color: "#666",
                mb: 0.5
              }}>
                総診療時間帯
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#e74c3c"
              }}>
                {rows.length * 3} 時間帯
              </Typography>
            </Box>
            
            <Box>
              <Typography sx={{ 
                fontSize: fontSize.medium,
                color: "#666",
                mb: 0.5
              }}>
                利用可能な診療区
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#9b59b6"
              }}>
                {departmentOptions.length} 部門
              </Typography>
            </Box>*/}
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
            size="small"
            sx={{
              fontSize: fontSize.medium
            }}
          >
            さらに診療区を追加
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ConsolidatedContentComponent;