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
  useMediaQuery,
  useTheme,
  IconButton,
  CircularProgress,
  Button,
  Paper,
  Alert,
  Tooltip,
  FormControl,
  Chip,
  Avatar,
  AvatarGroup
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import GroupsIcon from '@mui/icons-material/Groups';
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
  const [doctorCache, setDoctorCache] = useState({});

  // Refs to track initialization state
  const initializedRef = useRef(false);

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
      console.log('Initializing empty rows from floors');
      initializeRowsFromFloors();
    }
  }, [data, departmentOptions]);

  const loadDepartmentsWithDoctors = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report-mid/departments-with-doctors`, { 
        hospital_id: hospitalId
      });

      if (response.data.success && response.data.data) {
        const departmentsData = response.data.data;
        
        // Format department options with floor information
        const formattedDepartments = departmentsData.map(dept => ({
          id: dept.id,
          name: dept.name,
          floor: dept.floor || '未設定',
          doctorCount: dept.doctors?.length || 0
        }));
        
        setDepartmentOptions(formattedDepartments);
        
        // Build doctor options by floor (not by department)
        const doctorsByFloor = {};
        const allDoctorsCache = {};
        
        departmentsData.forEach(dept => {
          const floor = dept.floor || '未設定';
          if (!doctorsByFloor[floor]) {
            doctorsByFloor[floor] = [];
          }
          
          // Add doctors from this department to the floor
          if (dept.doctors) {
            dept.doctors.forEach(doctor => {
              // Check if doctor already exists in this floor to avoid duplicates
              const exists = doctorsByFloor[floor].some(d => d.id === doctor.id);
              if (!exists) {
                doctorsByFloor[floor].push(doctor);
              }
              // Cache doctors by ID for quick lookup
              allDoctorsCache[doctor.id] = doctor;
            });
          }
        });
        
        setDoctorOptions(doctorsByFloor);
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
      console.log('No valid report data, initializing from floors');
      initializeRowsFromFloors();
      return;
    }
    
    console.log('Initializing rows from data:', reportData.length, 'items');
    
    // Group data by sequence_no and floor (instead of department_id)
    const groupedData = {};
    
    reportData.forEach(item => {
      const floor = '未設定'; // Default floor
      const key = `${item.sequence_no}_${floor}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          id: `row-${key}`,
          sequence_no: item.sequence_no,
          floor: floor,
          consultations: {}
        };
      }
      
      groupedData[key].consultations[item.consultation_type] = {
        doctor_id_1: item.doctor_id_1,
        doctor_id_2: item.doctor_id_2,
        doctor_id_3: item.doctor_id_3
      };
    });
    
    const newRows = Object.values(groupedData).map(group => {
      // Ensure all consultation types exist
      const consultationsMap = {};
      consultationTypes.forEach(type => {
        consultationsMap[type.value] = group.consultations[type.value] || {
          doctor_id_1: null,
          doctor_id_2: null,
          doctor_id_3: null
        };
      });
      
      return {
        ...group,
        consultations: consultationTypes.map(type => ({
          type: type.value,
          doctor_id_1: consultationsMap[type.value]?.doctor_id_1 || null,
          doctor_id_2: consultationsMap[type.value]?.doctor_id_2 || null,
          doctor_id_3: consultationsMap[type.value]?.doctor_id_3 || null
        }))
      };
    });
    
    console.log('Created rows from data:', newRows.length, 'rows');
    setRows(newRows);
  };

  const initializeRowsFromFloors = () => {
    // Start with one empty row if no data
    if (Object.keys(doctorOptions).length > 0 && rows.length === 0) {
      console.log('Creating initial empty row');
      const initialRow = {
        id: `new-${Date.now()}`,
        sequence_no: 1,
        floor: '',
        consultations: consultationTypes.map(type => ({
          type: type.value,
          doctor_id_1: null,
          doctor_id_2: null,
          doctor_id_3: null
        }))
      };
      
      setRows([initialRow]);
    }
  };

  const getDoctorsForFloor = (floor) => {
    return doctorOptions[floor] || [];
  };

  const findDoctorById = (doctorId) => {
    return doctorCache[doctorId];
  };

  const getDoctorDisplayName = (doctorId) => {
    const doctor = findDoctorById(doctorId);
    if (!doctor) return '';
    
    return doctor.license_no ? `${doctor.name} (${doctor.license_no})` : doctor.name;
  };

  const getDoctorDepartment = (doctorId) => {
    const doctor = findDoctorById(doctorId);
    if (!doctor) return '';
    
    // Find which department(s) this doctor belongs to
    const departmentsForDoctor = departmentOptions.filter(dept => 
      doctorOptions[dept.floor]?.some(d => d.id === doctorId)
    );
    
    if (departmentsForDoctor.length === 0) return '';
    if (departmentsForDoctor.length === 1) return departmentsForDoctor[0].name;
    
    return `${departmentsForDoctor.length}診療区`;
  };

  // Format floor display
  const formatFloorDisplay = (floor) => {
    if (!floor || floor === '未設定') return '未選択';
    
    // Check if floor contains Japanese "階" character
    if (floor.includes('階')) {
      return floor;
    }
    
    // Check if it's a simple number or number with suffix
    const match = floor.match(/^(\d+)([a-zA-Z]*)$/);
    if (match) {
      const number = match[1];
      const suffix = match[2] || '';
      return `${number}階${suffix}`;
    }
    
    // Return as is with 階 appended
    return `${floor}階`;
  };

  // Handler functions
  const handleDoctorChange = (rowId, consultationIndex, doctorField, doctorId) => {
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const updatedConsultations = [...row.consultations];
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
    notifyParent(newRows);
  };

  const handleAddRow = () => {
    console.log('Current rows before adding:', rows.length);
    const newRowId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRow = {
      id: newRowId,
      sequence_no: rows.length + 1,
      floor: '',
      consultations: consultationTypes.map(type => ({
        type: type.value,
        doctor_id_1: null,
        doctor_id_2: null,
        doctor_id_3: null
      }))
    };
    
    console.log('Adding new row:', newRow);
    const newRows = [...rows, newRow];
    console.log('New rows after adding:', newRows.length);
    setRows(newRows);
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
    notifyParent(newRows);
  };

  const handleFloorChange = (rowId, floor) => {
    console.log('Changing floor for row:', rowId, 'to:', floor);
    
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const updatedRow = {
          ...row,
          floor: floor,
          // Reset doctors when floor changes
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
    const swapIndex = direction === 'up' ? index - 1 : direction === 'down' ? index + 1 : index;
    
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
            floor: row.floor,
            consultation_type: consultation.type,
            doctor_id_1: consultation.doctor_id_1,
            doctor_id_2: consultation.doctor_id_2,
            doctor_id_3: consultation.doctor_id_3
          });
        });
      });
      console.log('Flat data for parent:', flatData.length, 'items');
      onDataChange(flatData);
    }
  };

  // Check if floor is already used in other rows
  const isFloorAlreadyUsed = (floor, currentRowId) => {
    return rows.some(row => 
      row.id !== currentRowId && row.floor === floor
    );
  };

  // Get available floors with doctor counts
  const getAvailableFloors = () => {
    const floors = Object.keys(doctorOptions);
    
    // Sort floors: "未設定" first, then numeric floors, then others
    return floors.sort((a, b) => {
      if (a === '未設定') return -1;
      if (b === '未設定') return 1;
      
      const numA = parseInt(a.match(/^(\d+)/)?.[0] || 9999);
      const numB = parseInt(b.match(/^(\d+)/)?.[0] || 9999);
      
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    }).map(floor => ({
      value: floor,
      label: formatFloorDisplay(floor),
      doctorCount: doctorOptions[floor]?.length || 0,
      departmentCount: departmentOptions.filter(dept => dept.floor === floor).length
    }));
  };

  // Get departments for a specific floor
  const getDepartmentsForFloor = (floor) => {
    return departmentOptions.filter(dept => dept.floor === floor);
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
          階と医師データを読み込み中...
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
          階データを表示するには病院を選択してください
        </Typography>
      </Box>
    );
  }

  const availableFloors = getAvailableFloors();

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
              診療階別集計
            </Typography>
            <Typography sx={{ 
              fontSize: fontSize.medium,
              color: "#666",
              mt: 0.5
            }}>
              階ごとに担当医を選択してください（同じ階の全診療区の医師から選択可）
            </Typography>
          </Box>
          
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
            階追加
          </Button>
        </Box>
        
        {/* Floor Stats */}
        {availableFloors.length > 0 && (
          <Box sx={{ 
            mt: 2,
          }}>
            <Typography sx={{ 
              fontSize: fontSize.medium,
              color: "#666",
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 1
            }}>
              <InfoOutlinedIcon fontSize="small" />
              利用可能な階:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {availableFloors.map(floor => {
                const isSelected = rows.some(row => row.floor === floor.value);
                const departments = getDepartmentsForFloor(floor.value);
                
                return (
                  <Tooltip 
                    key={floor.value} 
                    title={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {floor.label}
                        </Typography>
                        <Typography variant="caption">
                          {floor.doctorCount}名の医師
                        </Typography>
                        <Typography variant="caption" display="block">
                          {departments.length}診療区
                        </Typography>
                        {departments.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                              診療区: {departments.map(d => d.name).join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
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
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: isSelected ? '#d8eafb' : '#f0f0f0'
                        }
                      }}
                      onClick={() => {
                        // Find first row without a floor or create new one
                        const emptyRow = rows.find(row => !row.floor);
                        if (emptyRow) {
                          handleFloorChange(emptyRow.id, floor.value);
                        } else {
                          handleAddRow();
                          setTimeout(() => {
                            const newRows = [...rows];
                            const lastRow = newRows[newRows.length - 1];
                            handleFloorChange(lastRow.id, floor.value);
                          }, 100);
                        }
                      }}
                    >
                      <LocationOnIcon fontSize="small" sx={{ 
                        color: isSelected ? '#0A6AE3' : '#666'
                      }} />
                      <Typography sx={{ 
                        fontSize: fontSize.medium,
                        color: isSelected ? '#0A6AE3' : '#666',
                        fontWeight: isSelected ? 600 : 400
                      }}>
                        {floor.label}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <Chip
                          label={`${floor.doctorCount}医師`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: fontSize.small,
                            backgroundColor: isSelected ? '#0A6AE3' : '#757575',
                            color: 'white'
                          }}
                        />
                        <Chip
                          label={`${departments.length}区`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: fontSize.small,
                            backgroundColor: isSelected ? '#27ae60' : '#4caf50',
                            color: 'white'
                          }}
                        />
                      </Box>
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
        <Table sx={{ minWidth: isMobile ? '900px' : '1000px' }}>
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
                階
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
                  (最大3名まで選択可能)
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
                  const rowError = validationErrors[`floor_${rowIndex}`];
                  const floorDoctors = getDoctorsForFloor(row.floor);
                  const isFloorAlreadyUsedInOtherRows = isFloorAlreadyUsed(row.floor, row.id);
                  
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
                      
                      {/* Floor - spans 3 rows */}
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
                          <FormControl fullWidth size="small" error={!!rowError || isFloorAlreadyUsedInOtherRows}>
                            <Select
                              value={row.floor || ''}
                              onChange={(e) => handleFloorChange(row.id, e.target.value)}
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
                                      <LocationOnIcon sx={{ fontSize: 16, mr: 1 }} />
                                      階を選択
                                    </Box>
                                  );
                                }
                                
                                const selectedFloor = availableFloors.find(f => f.value === selected);
                                const departments = getDepartmentsForFloor(selected);
                                
                                return (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                      <LocationOnIcon sx={{ fontSize: 14, color: isFloorAlreadyUsedInOtherRows ? '#ff9800' : '#0A6AE3' }} />
                                      <Typography sx={{ 
                                        fontWeight: 600,
                                        color: isFloorAlreadyUsedInOtherRows ? '#ff9800' : rowError ? '#df1c41' : '#2c3e50',
                                        fontSize: fontSize.medium,
                                        flex: 1
                                      }}>
                                        {formatFloorDisplay(selected)}
                                        {isFloorAlreadyUsedInOtherRows && ' (重複)'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                      <Chip
                                        label={`${selectedFloor?.doctorCount || 0}医師`}
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: fontSize.small,
                                          backgroundColor: '#0A6AE3',
                                          color: 'white'
                                        }}
                                      />
                                      <Chip
                                        label={`${departments.length}診療区`}
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: fontSize.small,
                                          backgroundColor: '#27ae60',
                                          color: 'white'
                                        }}
                                      />
                                    </Box>
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
                                  階を選択してください
                                </Typography>
                              </MenuItem>
                              {availableFloors.map((floor) => {
                                const isUsed = isFloorAlreadyUsed(floor.value, row.id);
                                const departments = getDepartmentsForFloor(floor.value);
                                
                                return (
                                  <MenuItem 
                                    key={floor.value} 
                                    value={floor.value}
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
                                      flexDirection: 'column',
                                      alignItems: 'flex-start',
                                      width: '100%',
                                      py: 0.5
                                    }}>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%'
                                      }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <LocationOnIcon fontSize="small" sx={{ color: '#0A6AE3' }} />
                                          <Typography sx={{ fontWeight: 500 }}>
                                            {floor.label}
                                            {isUsed && ' (使用中)'}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                          <Chip
                                            label={`${floor.doctorCount}医師`}
                                            size="small"
                                            sx={{
                                              height: 20,
                                              fontSize: fontSize.small,
                                              backgroundColor: '#0A6AE3',
                                              color: 'white'
                                            }}
                                          />
                                          <Chip
                                            label={`${departments.length}区`}
                                            size="small"
                                            sx={{
                                              height: 20,
                                              fontSize: fontSize.small,
                                              backgroundColor: '#27ae60',
                                              color: 'white'
                                            }}
                                          />
                                        </Box>
                                      </Box>
                                      
                                      {departments.length > 0 && (
                                        <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          gap: 0.5,
                                          mt: 0.5,
                                          flexWrap: 'wrap'
                                        }}>
                                          <MedicalServicesIcon fontSize="small" sx={{ color: '#666', fontSize: 14 }} />
                                          <Typography sx={{ 
                                            fontSize: fontSize.small,
                                            color: '#666',
                                            fontStyle: 'italic'
                                          }}>
                                            診療区: {departments.map(d => d.name).join(', ')}
                                          </Typography>
                                        </Box>
                                      )}
                                      
                                      {floor.doctorCount > 0 && (
                                        <Box sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center',
                                          gap: 0.5,
                                          mt: 0.5
                                        }}>
                                          <GroupsIcon fontSize="small" sx={{ color: '#666', fontSize: 14 }} />
                                          <Typography sx={{ 
                                            fontSize: fontSize.small,
                                            color: '#666'
                                          }}>
                                            医師: {floor.doctorCount}名
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                            {(rowError || isFloorAlreadyUsedInOtherRows) && (
                              <Typography sx={{ 
                                color: isFloorAlreadyUsedInOtherRows ? '#ff9800' : '#df1c41', 
                                fontSize: fontSize.medium,
                                mt: 0.5
                              }}>
                                {isFloorAlreadyUsedInOtherRows ? 'この階は既に使用されています' : rowError}
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
                          disabled={!row.floor || floorDoctors.length === 0 || isFloorAlreadyUsedInOtherRows}
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
                              if (!row.floor) {
                                return "階を先に選択";
                              }
                              if (isFloorAlreadyUsedInOtherRows) {
                                return "階が重複";
                              }
                              if (floorDoctors.length === 0) {
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
                          {floorDoctors.map((doctor) => (
                            <MenuItem 
                              key={`${row.id}-${consultation.type}-doctor1-${doctor.id}`}
                              value={doctor.id}
                              sx={{ 
                                fontSize: fontSize.medium,
                                '&.Mui-selected': {
                                  backgroundColor: '#e3f2fd'
                                }
                              }}
                            >
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                width: '100%'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                  <Box sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%',
                                    backgroundColor: '#0A6AE3'
                                  }} />
                                  <Typography sx={{ fontWeight: 500, flex: 1 }}>
                                    {doctor.name}
                                  </Typography>
                                  {doctor.license_no && (
                                    <Typography sx={{ 
                                      fontSize: fontSize.small, 
                                      color: '#666',
                                    }}>
                                      {doctor.license_no}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography sx={{ 
                                  fontSize: fontSize.small,
                                  color: '#666',
                                  fontStyle: 'italic',
                                  ml: 3,
                                  mt: 0.25
                                }}>
                                  {getDoctorDepartment(doctor.id)}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
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
                          disabled={!row.floor || floorDoctors.length === 0 || isFloorAlreadyUsedInOtherRows}
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
                              if (!row.floor) {
                                return "階を先に選択";
                              }
                              if (isFloorAlreadyUsedInOtherRows) {
                                return "階が重複";
                              }
                              if (floorDoctors.length === 0) {
                                return "医師がいません";
                              }
                              return "医師を選択";
                            }
                            return getDoctorDisplayName(selected);
                          }}
                        >
                          <MenuItem value="">医師を選択</MenuItem>
                          {floorDoctors.map((doctor) => (
                            <MenuItem 
                              key={`${row.id}-${consultation.type}-doctor2-${doctor.id}`}
                              value={doctor.id}
                              sx={{ 
                                fontSize: fontSize.medium,
                                '&.Mui-selected': {
                                  backgroundColor: '#e3f2fd'
                                }
                              }}
                            >
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                width: '100%'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                  <Typography sx={{ fontWeight: 500, flex: 1 }}>
                                    {doctor.name}
                                  </Typography>
                                  {doctor.license_no && (
                                    <Typography sx={{ 
                                      fontSize: fontSize.small, 
                                      color: '#666',
                                    }}>
                                      ({doctor.license_no})
                                    </Typography>
                                  )}
                                </Box>
                                <Typography sx={{ 
                                  fontSize: fontSize.small,
                                  color: '#666',
                                  fontStyle: 'italic',
                                  mt: 0.25
                                }}>
                                  {getDoctorDepartment(doctor.id)}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
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
                          disabled={!row.floor || floorDoctors.length === 0 || isFloorAlreadyUsedInOtherRows}
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
                              if (!row.floor) {
                                return "階を先に選択";
                              }
                              if (isFloorAlreadyUsedInOtherRows) {
                                return "階が重複";
                              }
                              if (floorDoctors.length === 0) {
                                return "医師がいません";
                              }
                              return "医師を選択";
                            }
                            return getDoctorDisplayName(selected);
                          }}
                        >
                          <MenuItem value="">医師を選択</MenuItem>
                          {floorDoctors.map((doctor) => (
                            <MenuItem 
                              key={`${row.id}-${consultation.type}-doctor3-${doctor.id}`}
                              value={doctor.id}
                              sx={{ fontSize: fontSize.medium }}
                            >
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                width: '100%'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                  <Typography sx={{ fontWeight: 500, flex: 1 }}>
                                    {doctor.name}
                                  </Typography>
                                  {doctor.license_no && (
                                    <Typography sx={{ 
                                      fontSize: fontSize.small, 
                                      color: '#666',
                                    }}>
                                      ({doctor.license_no})
                                    </Typography>
                                  )}
                                </Box>
                                <Typography sx={{ 
                                  fontSize: fontSize.small,
                                  color: '#666',
                                  fontStyle: 'italic',
                                  mt: 0.25
                                }}>
                                  {getDoctorDepartment(doctor.id)}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      
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
                                <span>
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
                                <span>
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
                              <Tooltip title="この階を削除">
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
                <TableCell colSpan={7} sx={{ 
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
                      階が追加されていません
                    </Typography>
                    <Typography sx={{ 
                      fontSize: fontSize.medium,
                      color: '#95a5a6',
                      maxWidth: '400px',
                      textAlign: 'center'
                    }}>
                      「階追加」ボタンをクリックして、最初の階を追加してください
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
                      階を追加
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            
            {/* Summary Row */}
            {rows.length > 0 && (
              <TableRow>
                <TableCell 
                  colSpan={6} 
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
                    総診療階数
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  border: "1px solid #e0e0e0",
                  padding: cellPadding,
                  backgroundColor: '#f8f9fa'
                }}>
                  <Tooltip title={`${rows.length}階`}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 1
                    }}>
                      <Typography sx={{ 
                        fontSize: fontSize.medium,
                        fontWeight: 600,
                        color: '#2c3e50'
                      }}>
                        {rows.length} 階
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
            <Box>
              <Typography sx={{ 
                fontSize: fontSize.medium,
                color: "#666",
                mb: 0.5
              }}>
                診療階数
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#27ae60"
              }}>
                {rows.length} 階
              </Typography>
            </Box>
            
            <Box>
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
                利用可能な階
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#9b59b6"
              }}>
                {availableFloors.length} 階
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ 
                fontSize: fontSize.medium,
                color: "#666",
                mb: 0.5
              }}>
                総医師数
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#3498db"
              }}>
                {Object.keys(doctorCache).length} 名
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ 
                fontSize: fontSize.medium,
                color: "#666",
                mb: 0.5
              }}>
                総診療区数
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#f39c12"
              }}>
                {departmentOptions.length} 区
              </Typography>
            </Box>
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
            さらに階を追加
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ConsolidatedContentComponent;