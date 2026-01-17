import React from 'react';
import {
  Box,
  Grid,
  Stack,
  TextField,
  Typography,
  Alert,
  Tooltip,
  Paper,
  Button,
  IconButton
} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const DutyStaffSection = ({
  currentStatus,
  onCurrentStatusChange,
  validationErrors,
  textFieldHeight,
  fontSize,
  isMobile,
  isTablet,
  readOnly = false,
  sectionPadding = 3
}) => {
  
  // Field configuration for duty staff section - dynamic fields
  const [fieldData, setFieldData] = React.useState(() => {
    // Initialize based on currentStatus length
    const fieldCount = currentStatus?.firstRow?.length || 7;
    return Array.from({ length: fieldCount }, (_, i) => ({
      position: `field_group_${i + 1}`,
      required: false
    }));
  });

  // Sync fieldData with currentStatus when it changes
  React.useEffect(() => {
    const currentFieldCount = currentStatus?.firstRow?.length || 0;
    
    if (currentFieldCount > 0 && fieldData.length !== currentFieldCount) {
      // Create fieldData array based on currentStatus length
      const newFieldData = Array.from({ length: currentFieldCount }, (_, i) => ({
        position: `field_group_${i + 1}`,
        required: false
      }));
      
      setFieldData(newFieldData);
    }
  }, [currentStatus?.firstRow?.length]);

  const handleCurrentStatusChange = (row, index, value) => {
    const newStatus = {
      ...currentStatus,
      [row]: currentStatus[row].map((item, i) => i === index ? value : item)
    };
    
    onCurrentStatusChange(newStatus);
    
    // Clear errors if fixed
    const field = fieldData[index];
    if (!field) return;
    
    const errorKey1 = `dutyStaff_${field.position}_1`;
    const errorKey2 = `dutyStaff_${field.position}_2`;
    const errorKey3 = `dutyStaff_${field.position}_3`;
    
    const newErrors = { ...validationErrors };
    if (row === 'firstRow' && validationErrors[errorKey1] && value.trim() !== "") {
      delete newErrors[errorKey1];
    }
    if (row === 'secondRow' && validationErrors[errorKey2] && value.trim() !== "") {
      delete newErrors[errorKey2];
    }
    if (row === 'thirdRow' && validationErrors[errorKey3] && value.trim() !== "") {
      delete newErrors[errorKey3];
    }
    
    // If validationErrors is a function (setState), call it
    if (typeof validationErrors === 'function') {
      validationErrors(newErrors);
    }
  };

  // Add new field group
  const handleAddNewField = () => {
    if (readOnly) return;
    
    // Find the highest existing index
    const existingIndices = fieldData.map(field => {
      const match = field.position.match(/field_group_(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const maxIndex = existingIndices.length > 0 ? Math.max(...existingIndices) : 0;
    const newIndex = maxIndex + 1;
    const newPosition = `field_group_${newIndex}`;
    
    // Add new field to fieldData
    setFieldData([...fieldData, { position: newPosition, required: false }]);
    
    // Add empty entries to currentStatus arrays
    const newStatus = {
      firstRow: [...(currentStatus.firstRow || []), ""],
      secondRow: [...(currentStatus.secondRow || []), ""],
      thirdRow: [...(currentStatus.thirdRow || []), ""]
    };
    
    onCurrentStatusChange(newStatus);
  };

  // Remove field group
  const handleRemoveField = (index) => {
    if (readOnly) return;
    
    // Don't remove if it's the last field
    if (fieldData.length <= 1) {
      // Optional: Show a message or alert that you can't remove the last field
      return;
    }
    
    // Remove field from fieldData
    const removedField = fieldData[index];
    const newFieldData = fieldData.filter((_, i) => i !== index);
    setFieldData(newFieldData);
    
    // Remove corresponding entries from currentStatus
    const newStatus = {
      firstRow: (currentStatus.firstRow || []).filter((_, i) => i !== index),
      secondRow: (currentStatus.secondRow || []).filter((_, i) => i !== index),
      thirdRow: (currentStatus.thirdRow || []).filter((_, i) => i !== index)
    };
    
    onCurrentStatusChange(newStatus);
    
    // Remove validation errors for this field
    const errorKey1 = `dutyStaff_${removedField.position}_1`;
    const errorKey2 = `dutyStaff_${removedField.position}_2`;
    const errorKey3 = `dutyStaff_${removedField.position}_3`;
    
    const newErrors = { ...validationErrors };
    delete newErrors[errorKey1];
    delete newErrors[errorKey2];
    delete newErrors[errorKey3];
    
    if (typeof validationErrors === 'function') {
      validationErrors(newErrors);
    }
  };

  // Larger font sizes
  const largeFontSize = {
    small: '1rem',      // Increased from 0.875rem
    medium: '1.125rem', // Increased from 1rem
    large: '1.5rem',    // Increased from 1.25rem
  };

  const fieldHeight = isMobile ? 40 : 46; // Increased height for larger font

  // Responsive grid configuration
  const getGridConfig = () => {
    if (isMobile) {
      return { xs: 12, sm: 6 }; // 2 per row on mobile
    } else if (isTablet) {
      return { xs: 6, sm: 4, md: 3 }; // 4 per row on tablet
    } else {
      return { xs: 12 / Math.min(fieldData.length, 7) }; // Dynamic columns on desktop
    }
  };

  // Calculate field group label
  const getFieldGroupLabel = (index) => {
    // Extract number from position or use index
    const field = fieldData[index];
    if (field && field.position) {
      const match = field.position.match(/field_group_(\d+)/);
      if (match) {
        return `部署${match[1]}`;
      }
    }
    return `部署${index + 1}`;
  };

  return (
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
        {/* Section Header with Add Button */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Typography sx={{ 
            fontWeight: 700, 
            fontSize: largeFontSize.large,
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
            当直
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="部署別の当直スタッフ配置">
              <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 24 }} />
            </Tooltip>
            {!readOnly && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddNewField}
                sx={{
                  ml: 1,
                  fontSize: '0.875rem',
                  py: 0.5,
                  px: 2,
                  borderRadius: '6px',
                  backgroundColor: '#3498db',
                  '&:hover': {
                    backgroundColor: '#2980b9'
                  }
                }}
              >
                追加
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ 
          overflowX: isMobile ? 'auto' : 'visible',
          pb: 1
        }}>
          <Box sx={{ 
            minWidth: isMobile ? "600px" : "100%",
            width: '100%'
          }}>
            {/* Grid layout for dynamic fields */}
            <Grid container spacing={2}>
              {fieldData.map((field, index) => {
                const errorKey1 = `dutyStaff_${field.position}_1`;
                const errorKey2 = `dutyStaff_${field.position}_2`;
                const errorKey3 = `dutyStaff_${field.position}_3`;
                const gridConfig = getGridConfig();
                
                return (
                  <Grid 
                    item 
                    xs={gridConfig.xs} 
                    sm={gridConfig.sm} 
                    md={gridConfig.md}
                    key={field.position}
                    sx={{
                      // For desktop: dynamic columns
                      ...(!isMobile && !isTablet && {
                        flex: `0 0 calc(100% / ${Math.min(fieldData.length, 7)} - 16px)`,
                        maxWidth: `calc(100% / ${Math.min(fieldData.length, 7)} - 16px)`,
                      })
                    }}
                  >
                    <Box sx={{ 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      p: 2,
                      textAlign: 'left',
                      bgcolor: '#fafafa',
                      height: '100%',
                      minHeight: isMobile ? '220px' : '240px',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        borderColor: '#3498db'
                      }
                    }}>
                      {/* Remove button (only show if not read-only and not the only field) */}
                      {!readOnly && fieldData.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveField(index)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 1,
                            backgroundColor: '#ffebee',
                            color: '#f44336',
                            width: 24,
                            height: 24,
                            '&:hover': {
                              backgroundColor: '#ffcdd2'
                            }
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                      
                      {/* Field group label */}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          textAlign: 'center',
                          mb: 1,
                          color: '#3498db',
                          fontWeight: 700,
                          fontSize: largeFontSize.small,
                          backgroundColor: '#e3f2fd',
                          py: 0.5,
                          borderRadius: '4px'
                        }}
                      >
                        {getFieldGroupLabel(index)}
                      </Typography>
                      
                      <Stack spacing={2.5} sx={{ flexGrow: 1, justifyContent: 'space-between' }}>
                        {/* 1人目 - 診療科 */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block', 
                              textAlign: 'left',
                              mb: 1,
                              color: '#7f8c8d',
                              fontWeight: 600,
                              fontSize: largeFontSize.large
                            }}
                          >
                            診療科
                          </Typography>
                          <TextField
                            value={currentStatus?.firstRow?.[index] || ""}
                            onChange={(e) => handleCurrentStatusChange('firstRow', index, e.target.value)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            disabled={readOnly}
                            error={!!validationErrors?.[errorKey1]}
                            InputProps={{
                              sx: {
                                height: fieldHeight,
                                bgcolor: "#ffffff",
                                borderRadius: "6px",
                                "& fieldset": { 
                                  borderColor: validationErrors?.[errorKey1] ? "#df1c41" : "#dfe1e7" 
                                },
                                "& input": {
                                  fontSize: largeFontSize.large,
                                  fontWeight: 500,
                                  color: "#2c3e50",
                                  textAlign: 'left',
                                  padding: isMobile ? '8px 12px' : '10px 14px'
                                },
                              },
                            }}
                          />
                          {validationErrors?.[errorKey1] && (
                            <Typography sx={{ 
                              color: "#df1c41", 
                              fontSize: largeFontSize.small,
                              mt: 0.75,
                              textAlign: 'left'
                            }}>
                              {validationErrors[errorKey1]}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* 2人目 - 担当医師 */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block', 
                              textAlign: 'left',
                              mb: 1,
                              color: '#7f8c8d',
                              fontWeight: 600,
                              fontSize: largeFontSize.large
                            }}
                          >
                            担当医師
                          </Typography>
                          <TextField
                            value={currentStatus?.secondRow?.[index] || ""}
                            onChange={(e) => handleCurrentStatusChange('secondRow', index, e.target.value)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            disabled={readOnly}
                            error={!!validationErrors?.[errorKey2]}
                            InputProps={{
                              sx: {
                                height: fieldHeight,
                                bgcolor: "#ffffff",
                                borderRadius: "6px",
                                "& fieldset": { 
                                  borderColor: validationErrors?.[errorKey2] ? "#df1c41" : "#dfe1e7" 
                                },
                                "& input": {
                                  fontSize: largeFontSize.large,
                                  fontWeight: 500,
                                  color: "#2c3e50",
                                  textAlign: 'left',
                                  padding: isMobile ? '8px 12px' : '10px 14px'
                                },
                              },
                            }}
                          />
                          {validationErrors?.[errorKey2] && (
                            <Typography sx={{ 
                              color: "#df1c41", 
                              fontSize: largeFontSize.small,
                              mt: 0.75,
                              textAlign: 'left'
                            }}>
                              {validationErrors[errorKey2]}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* 3人目 - 担当医師 */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block', 
                              textAlign: 'left',
                              mb: 1,
                              color: '#7f8c8d',
                              fontWeight: 600,
                              fontSize: largeFontSize.large
                            }}
                          >
                            担当医師
                          </Typography>
                          <TextField
                            value={currentStatus?.thirdRow?.[index] || ""}
                            onChange={(e) => handleCurrentStatusChange('thirdRow', index, e.target.value)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            disabled={readOnly}
                            error={!!validationErrors?.[errorKey3]}
                            InputProps={{
                              sx: {
                                height: fieldHeight,
                                bgcolor: "#ffffff",
                                borderRadius: "6px",
                                "& fieldset": { 
                                  borderColor: validationErrors?.[errorKey3] ? "#df1c41" : "#dfe1e7" 
                                },
                                "& input": {
                                  fontSize: largeFontSize.large,
                                  fontWeight: 500,
                                  color: "#2c3e50",
                                  textAlign: 'left',
                                  padding: isMobile ? '8px 12px' : '10px 14px'
                                },
                              },
                            }}
                          />
                          {validationErrors?.[errorKey3] && (
                            <Typography sx={{ 
                              color: "#df1c41", 
                              fontSize: largeFontSize.small,
                              mt: 0.75,
                              textAlign: 'left'
                            }}>
                              {validationErrors[errorKey3]}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
            
            {/* Add New Button at bottom for mobile */}
            {!readOnly && isMobile && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleAddNewField}
                  sx={{
                    fontSize: '0.875rem',
                    py: 1,
                    px: 3,
                    borderRadius: '6px',
                    backgroundColor: '#3498db',
                    '&:hover': {
                      backgroundColor: '#2980b9'
                    }
                  }}
                >
                  新しい部署を追加
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default DutyStaffSection;