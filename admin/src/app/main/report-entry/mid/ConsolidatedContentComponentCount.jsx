import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Alert,
  Tooltip,
  FormControl,
  Grid
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';

const ConsolidatedContentComponentCount = ({
  data = [],
  departments = [],
  hospitalId,
  onDataChange,
  validationErrors = {},
  readOnly = false,
  loading: externalLoading = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // Refs to track previous values - optimized with deep equality
  const prevHospitalIdRef = useRef(null);
  const prevDataRef = useRef([]);
  const prevDepartmentOptionsRef = useRef([]);
  const isInitializedRef = useRef(false);
  const isUpdatingRef = useRef(false);

  // Consultation types
  const consultationTypes = useMemo(() => [
    { value: 'morning', label: '午前診', color: '#3498db', short: 'AM' },
    { value: 'afternoon', label: '午後診', color: '#9b59b6', short: 'PM' },
    { value: 'night', label: '夜診', color: '#e74c3c', short: '夜' }
  ], []);

  // Stable row ID generation
  const generateRowId = useCallback((sequenceNo, departmentId, index) => {
    return `${sequenceNo}_${departmentId}_${index}`;
  }, []);

  // Create empty row with stable ID
  const createEmptyRow = useCallback((sequenceNo = 1, index = 0) => ({
    id: generateRowId(sequenceNo, null, index),
    sequence_no: sequenceNo,
    department_id: null,
    department_name: '',
    consultations: consultationTypes.map(type => ({
      type: type.value,
      total_patients: 0,
      new_patients: 0
    }))
  }), [consultationTypes, generateRowId]);

  // Transform data prop to rows format - Pure function with stable IDs
  const transformDataToRows = useCallback((reportData, deptOptions) => {
    console.log('transformDataToRows called with:', {
      dataLength: reportData?.length || 0,
      deptOptionsLength: deptOptions?.length || 0
    });

    // If no data, return empty array
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      console.log('No data in transformDataToRows');
      return [];
    }

    // Group data by sequence_no and department_id
    const groupedData = {};
    
    reportData.forEach((item, index) => {
      const key = `${item.sequence_no}_${item.department_id}`;
      if (!groupedData[key]) {
        // Find department name from options
        const department = deptOptions?.find(dept => String(dept.id) === String(item.department_id));
        
        groupedData[key] = {
          id: generateRowId(item.sequence_no, item.department_id, index),
          sequence_no: item.sequence_no,
          department_id: item.department_id,
          department_name: department?.name || '',
          consultations: {}
        };
      }
      
      groupedData[key].consultations[item.consultation_type] = {
        total_patients: item.total_patients || 0,
        new_patients: item.new_patients || 0
      };
    });
    
    // Convert to array and sort by sequence_no
    const sortedGroups = Object.values(groupedData).sort((a, b) => 
      (a.sequence_no || 0) - (b.sequence_no || 0)
    );
    
    // Add missing consultation types and re-index sequence numbers
    const newRows = sortedGroups.map((group, index) => {
      // Ensure all consultation types exist
      const consultationsMap = {};
      consultationTypes.forEach(type => {
        consultationsMap[type.value] = group.consultations[type.value] || {
          total_patients: 0,
          new_patients: 0
        };
      });
      
      return {
        ...group,
        id: group.id, // Keep the stable ID
        sequence_no: index + 1,
        consultations: consultationTypes.map(type => ({
          type: type.value,
          total_patients: consultationsMap[type.value]?.total_patients || 0,
          new_patients: consultationsMap[type.value]?.new_patients || 0
        }))
      };
    });
    
    console.log('Transformed rows:', newRows.length, 'rows');
    return newRows;
  }, [consultationTypes, generateRowId]);

  // Load departments - single responsibility
  const loadDepartments = useCallback(async (forceReload = false) => {
    if (!hospitalId) {
      console.log('No hospital ID, skipping department load');
      setDepartmentOptions([]);
      return;
    }

    console.log('Loading departments for hospital:', hospitalId);
    setLoading(true);
    
    try {
      const response = await axios.post(`${apiConfig.baseURL}/report-mid/departments`, { 
        hospital_id: hospitalId
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        const departmentsData = response.data.data.map(dept => ({
          id: dept.id,
          name: dept.name
        }));
        
        console.log('Departments loaded:', departmentsData.length);
        setDepartmentOptions(departmentsData);
      } else {
        console.log('Failed to load departments');
        setDepartmentOptions([]);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartmentOptions([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  // SINGLE INITIALIZATION EFFECT - THE ONE SOURCE OF TRUTH
  useEffect(() => {
    console.log('=== SINGLE INITIALIZATION EFFECT ===', {
      dataLength: data?.length || 0,
      deptOptionsLength: departmentOptions.length,
      isInitialized: isInitializedRef.current,
      isUpdating: isUpdatingRef.current
    });

    // Skip if we're in the middle of an update
    if (isUpdatingRef.current) {
      console.log('Skipping init - update in progress');
      return;
    }

    // Skip if we don't have both data and departments loaded
    if (!departmentOptions.length) {
      console.log('Skipping init - no department options yet');
      return;
    }

    // Check if data has actually changed (deep comparison)
    const dataChanged = data !== prevDataRef.current && 
      JSON.stringify(data) !== JSON.stringify(prevDataRef.current);
    
    // Check if departments have changed
    const deptsChanged = departmentOptions !== prevDepartmentOptionsRef.current &&
      JSON.stringify(departmentOptions) !== JSON.stringify(prevDepartmentOptionsRef.current);

    // Skip if nothing relevant changed
    if (!dataChanged && !deptsChanged && isInitializedRef.current) {
      console.log('Skipping init - no relevant changes');
      return;
    }

    console.log('Data or departments changed, initializing rows');
    
    let newRows = [];
    
    // If we have data, transform it with the current departments
    if (data && Array.isArray(data) && data.length > 0) {
      newRows = transformDataToRows(data, departmentOptions);
      console.log('Setting rows from transformed data:', newRows.length);
    } else if (!isInitializedRef.current) {
      // Only create empty row on first initialization
      console.log('Creating empty row for first initialization');
      newRows = [createEmptyRow(1, 0)];
    }
    
    // Only update if rows actually changed
    if (JSON.stringify(newRows) !== JSON.stringify(rows)) {
      console.log('Setting new rows:', newRows.length);
      setRows(newRows);
      // DO NOT notifyParent during initialization
    }
    
    // Update refs
    prevDataRef.current = data;
    prevDepartmentOptionsRef.current = departmentOptions;
    isInitializedRef.current = true;
    
  }, [data, departmentOptions, transformDataToRows, createEmptyRow, rows]);

  // HOSPITAL CHANGE EFFECT - ONLY resets state
  useEffect(() => {
    console.log('=== HOSPITAL ID EFFECT ===');
    console.log('Previous hospital:', prevHospitalIdRef.current);
    console.log('Current hospital:', hospitalId);
    
    if (hospitalId !== prevHospitalIdRef.current) {
      console.log('Hospital changed, resetting state');
      
      // Reset all state and refs
      setRows([]);
      setDepartmentOptions([]);
      prevDataRef.current = [];
      prevDepartmentOptionsRef.current = [];
      isInitializedRef.current = false;
      prevHospitalIdRef.current = hospitalId;
      
      // Load departments for new hospital
      if (hospitalId) {
        loadDepartments(true);
      }
    }
  }, [hospitalId, loadDepartments]);

  // Handler functions - ONLY these should notify parent
  const handleTotalPatientsChange = (rowId, consultationIndex, value) => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    const numValue = parseInt(value) || 0;
    
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const updatedConsultations = [...row.consultations];
        updatedConsultations[consultationIndex] = {
          ...updatedConsultations[consultationIndex],
          total_patients: numValue
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
    isUpdatingRef.current = false;
  };

  const handleNewPatientsChange = (rowId, consultationIndex, value) => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    const numValue = parseInt(value) || 0;
    
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const updatedConsultations = [...row.consultations];
        updatedConsultations[consultationIndex] = {
          ...updatedConsultations[consultationIndex],
          new_patients: numValue
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
    isUpdatingRef.current = false;
  };

  const handleAddRow = () => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    console.log('Adding new row');
    const newRow = createEmptyRow(rows.length + 1, rows.length);
    const newRows = [...rows, newRow];
    console.log('New rows after adding:', newRows.length);
    setRows(newRows);
    notifyParent(newRows);
    isUpdatingRef.current = false;
  };

  const handleRemoveRow = (rowId) => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    console.log('Removing row:', rowId);
    const newRows = rows.filter(row => row.id !== rowId);
    
    // Update sequence numbers
    newRows.forEach((row, index) => {
      row.sequence_no = index + 1;
    });
    
    console.log('After removal:', newRows.length, 'rows');
    setRows(newRows);
    notifyParent(newRows);
    isUpdatingRef.current = false;
  };

  const handleDepartmentChange = (rowId, departmentId) => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    console.log('Changing department for row:', rowId, 'to:', departmentId);
    const department = departmentOptions.find(dept => String(dept.id) === String(departmentId));
    
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          department_id: departmentId,
          department_name: department?.name || ''
        };
      }
      return row;
    });
    
    setRows(newRows);
    notifyParent(newRows);
    isUpdatingRef.current = false;
  };

  const handleMoveRow = (rowId, direction) => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    const index = rows.findIndex(row => row.id === rowId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === rows.length - 1)) {
      isUpdatingRef.current = false;
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
    isUpdatingRef.current = false;
  };

  // NOTIFY PARENT - ONLY called from user actions
  const notifyParent = useCallback((updatedRows) => {
    console.log('Notifying parent with rows:', updatedRows.length, 'rows');
    if (onDataChange) {
      const flatData = [];
      updatedRows.forEach(row => {
        if (row.department_id) { // Only include rows with department selected
          row.consultations.forEach(consultation => {
            flatData.push({
              sequence_no: row.sequence_no,
              department_id: row.department_id,
              consultation_type: consultation.type,
              total_patients: consultation.total_patients,
              new_patients: consultation.new_patients
            });
          });
        }
      });
      console.log('Flat data for parent:', flatData.length, 'items');
      onDataChange(flatData);
    }
  }, [onDataChange]);

  const calculateRowTotal = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return 0;
    
    return row.consultations.reduce((sum, consultation) => {
      return sum + (consultation.total_patients || 0);
    }, 0);
  };

  const calculateRowNewTotal = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return 0;
    
    return row.consultations.reduce((sum, consultation) => {
      return sum + (consultation.new_patients || 0);
    }, 0);
  };

  const calculateGrandTotal = () => {
    return rows.reduce((total, row) => {
      return total + calculateRowTotal(row.id);
    }, 0);
  };

  const calculateGrandNewTotal = () => {
    return rows.reduce((total, row) => {
      return total + calculateRowNewTotal(row.id);
    }, 0);
  };

  // Check if department is already used in other rows
  const isDepartmentAlreadyUsed = (departmentId, currentRowId) => {
    if (!departmentId) return false;
    return rows.some(row => 
      row.id !== currentRowId && String(row.department_id) === String(departmentId)
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
          診療区データを読み込み中...
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
              診療部門別集計 (患者数)
              <Typography component="span" sx={{ 
                fontSize: fontSize.small,
                color: '#666',
                ml: 2
              }}>
                データ数: {rows.length}行 ({rows.length * 3}時間帯)
              </Typography>
            </Typography>
            <Typography sx={{ 
              fontSize: fontSize.medium,
              color: "#666",
              mt: 0.5
            }}>
              診療区ごとに患者数を入力してください
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
            
            {!readOnly && (
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
            )}
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
              利用可能な診療区 ({departmentOptions.length}):
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {departmentOptions.slice(0, 10).map(dept => {
                const isSelected = rows.some(row => String(row.department_id) === String(dept.id));
                
                return (
                  <Box
                    key={dept.id}
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
                  </Box>
                );
              })}
              {departmentOptions.length > 10 && (
                <Typography sx={{ fontSize: fontSize.small, color: '#666' }}>
                  ...他{departmentOptions.length - 10}部門
                </Typography>
              )}
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
        <Table sx={{ minWidth: isMobile ? '800px' : '1000px' }}>
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
              <TableCell sx={{ 
                backgroundColor: "#F9FAFB",
                border: "1px solid #e0e0e0",
                padding: cellPadding,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: fontSize.medium,
                color: "#2c3e50",
                minWidth: '200px'
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
              {!readOnly && (
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
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {rows.map((row, rowIndex) => (
              <React.Fragment key={`row-fragment-${row.id}`}>
                {row.consultations.map((consultation, consultationIndex) => {
                  const typeConfig = consultationTypes.find(t => t.value === consultation.type);
                  const rowError = validationErrors[`department_${rowIndex}`];
                  const totalError = validationErrors[`total_patients_${rowIndex}_${consultationIndex}`];
                  const newError = validationErrors[`new_patients_${rowIndex}_${consultationIndex}`];
                  const isDeptAlreadyUsed = isDepartmentAlreadyUsed(row.department_id, row.id);
                  
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
                              disabled={readOnly || isDeptAlreadyUsed}
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
                                
                                const selectedDept = departmentOptions.find(d => String(d.id) === String(selected));
                                
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
                                const isUsed = isDepartmentAlreadyUsed(dept.id, row.id);
                                
                                return (
                                  <MenuItem 
                                    key={dept.id} 
                                    value={dept.id}
                                    disabled={isUsed || readOnly}
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
                                {isDeptAlreadyUsed ? 'この診療区は既に使用されています' : rowError}
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
                      
                      {/* Patient Count - Total and New in same line */}
                      <TableCell sx={{ 
                        border: "1px solid #e0e0e0",
                        padding: cellPadding,
                        textAlign: 'center'
                      }}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Box sx={{ mb: 0.5 }}>
                              <Typography sx={{ 
                                fontSize: fontSize.small,
                                color: '#666',
                                mb: 0.5,
                                textAlign: 'left'
                              }}>
                                合計
                              </Typography>
                              <TextField
                                value={consultation.total_patients || ''}
                                onChange={(e) => handleTotalPatientsChange(row.id, consultationIndex, e.target.value)}
                                variant="outlined"
                                size="small"
                                type="number"
                                error={!!totalError}
                                helperText={totalError}
                                disabled={readOnly || isDeptAlreadyUsed}
                                inputProps={{
                                  min: 0,
                                  style: {
                                    textAlign: 'center',
                                    fontSize: fontSize.medium,
                                    padding: isMobile ? '6px 8px' : '8px 12px',
                                    height: selectHeight - 8,
                                    fontWeight: 600,
                                    color: consultation.total_patients > 0 ? '#2c3e50' : '#999'
                                  },
                                }}
                                sx={{
                                  width: '100%',
                                  '& .MuiOutlinedInput-root': {
                                    height: selectHeight,
                                    backgroundColor: consultation.total_patients > 0 ? '#f0f7ff' : '#ffffff',
                                    '& fieldset': {
                                      borderColor: totalError ? '#df1c41' : consultation.total_patients > 0 ? '#0A6AE3' : '#dfe1e7',
                                    },
                                    '&:hover fieldset': {
                                      borderColor: totalError ? '#df1c41' : '#0A6AE3',
                                    }
                                  },
                                }}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ mb: 0.5 }}>
                              <Typography sx={{ 
                                fontSize: fontSize.small,
                                color: '#666',
                                mb: 0.5,
                                textAlign: 'left'
                              }}>
                                新規
                              </Typography>
                              <TextField
                                value={consultation.new_patients || ''}
                                onChange={(e) => handleNewPatientsChange(row.id, consultationIndex, e.target.value)}
                                variant="outlined"
                                size="small"
                                type="number"
                                error={!!newError}
                                helperText={newError}
                                disabled={readOnly || isDeptAlreadyUsed}
                                inputProps={{
                                  min: 0,
                                  style: {
                                    textAlign: 'center',
                                    fontSize: fontSize.medium,
                                    padding: isMobile ? '6px 8px' : '8px 12px',
                                    height: selectHeight - 8,
                                    fontWeight: 600,
                                    color: consultation.new_patients > 0 ? '#2c3e50' : '#999'
                                  },
                                }}
                                sx={{
                                  width: '100%',
                                  '& .MuiOutlinedInput-root': {
                                    height: selectHeight,
                                    backgroundColor: consultation.new_patients > 0 ? '#f0f7ff' : '#ffffff',
                                    '& fieldset': {
                                      borderColor: newError ? '#df1c41' : consultation.new_patients > 0 ? '#0A6AE3' : '#dfe1e7',
                                    },
                                    '&:hover fieldset': {
                                      borderColor: newError ? '#df1c41' : '#0A6AE3',
                                    }
                                  },
                                }}
                              />
                            </Box>
                          </Grid>
                        </Grid>
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
                                fontSize: fontSize.small,
                                color: "#666",
                                mt: 0.5
                              }}
                            >
                              {calculateRowNewTotal(row.id)} 新規
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      
                      {/* Actions - spans 3 rows */}
                      {consultationIndex === 0 && !readOnly && (
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
                                    disabled={rowIndex === 0 || isDeptAlreadyUsed}
                                    sx={{
                                      border: '1px solid #e0e0e0',
                                      borderRadius: '4px',
                                      width: 32,
                                      height: 32
                                    }}
                                  >
                                    <Typography sx={{ 
                                      color: (rowIndex === 0 || isDeptAlreadyUsed) ? '#ccc' : '#3498db',
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
                                    disabled={rowIndex === rows.length - 1 || isDeptAlreadyUsed}
                                    sx={{
                                      border: '1px solid #e0e0e0',
                                      borderRadius: '4px',
                                      width: 32,
                                      height: 32
                                    }}
                                  >
                                    <Typography sx={{ 
                                      color: (rowIndex === rows.length - 1 || isDeptAlreadyUsed) ? '#ccc' : '#3498db',
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
                                  disabled={isDeptAlreadyUsed}
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
                <TableCell colSpan={readOnly ? 5 : 6} sx={{ 
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
                      {readOnly ? 'このレポートには診療区データがありません' : '「診療区追加」ボタンをクリックして、最初の診療区を追加してください'}
                    </Typography>
                    {!readOnly && (
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
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
            
            {/* Grand Total Row */}
            {rows.length > 0 && (
              <TableRow>
                <TableCell 
                  colSpan={3} 
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
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: fontSize.large,
                        color: "#FFFFFF",
                      }}
                    >
                      {calculateGrandTotal()}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: fontSize.small,
                        color: "#FFFFFF",
                        opacity: 0.9,
                        mt: 0.5
                      }}
                    >
                      {calculateGrandNewTotal()} 新規
                    </Typography>
                  </Box>
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
                {!readOnly && (
                  <TableCell sx={{ 
                    border: "1px solid #e0e0e0",
                    padding: cellPadding,
                    backgroundColor: '#f8f9fa'
                  }}>
                    {/* Empty cell for actions column */}
                  </TableCell>
                )}
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
                新規患者数
              </Typography>
              <Typography sx={{ 
                fontSize: fontSize.large,
                fontWeight: 700,
                color: "#27ae60"
              }}>
                {calculateGrandNewTotal()} 名
              </Typography>
            </Box>
            
            {/* <Box>
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
                color: "#e74c3c"
              }}>
                {rows.length} 部門
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
                color: "#9b59b6"
              }}>
                {rows.length * 3} 時間帯
              </Typography>
            </Box>*/}
          </Box>
          
          {!readOnly && (
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
          )}
        </Box>
      )}
    </Box>
  );
};

export default ConsolidatedContentComponentCount;