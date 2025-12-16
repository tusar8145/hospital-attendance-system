import React from 'react';
import {
  Box,
  Grid,
  Stack,
  TextField,
  Typography,
  Alert,
  Tooltip,
  Paper
} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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
  
  // Field configuration for duty staff section - 21 fields total
  const fieldData = [
    { position: "field_group_1", required: false },
    { position: "field_group_2", required: false },
    { position: "field_group_3", required: false },
    { position: "field_group_4", required: false },
    { position: "field_group_5", required: false },
    { position: "field_group_6", required: false },
    { position: "field_group_7", required: false },
  ];

  const handleCurrentStatusChange = (row, index, value) => {
    const field = fieldData[index];
    const errorKey1 = `dutyStaff_${field.position}_1`;
    const errorKey2 = `dutyStaff_${field.position}_2`;
    const errorKey3 = `dutyStaff_${field.position}_3`;
    
    const newStatus = {
      ...currentStatus,
      [row]: currentStatus[row].map((item, i) => i === index ? value : item)
    };
    
    onCurrentStatusChange(newStatus);
    
    // Clear errors if fixed
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
      return { xs: 12 / 7 }; // 7 per row on desktop (12/7 ≈ 1.71)
    }
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
        {/* Section Header */}
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
          <Tooltip title="部署別の当直スタッフ配置">
            <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 24 }} />
          </Tooltip>
        </Box>

        {validationErrors?.consolidatedData && (
          <Alert severity="error" sx={{ mb: 2, fontSize: largeFontSize.small }}>
            {validationErrors.consolidatedData}
          </Alert>
        )}

        <Box sx={{ 
          overflowX: isMobile ? 'auto' : 'visible',
          pb: 1
        }}>
          <Box sx={{ 
            minWidth: isMobile ? "600px" : "100%",
            width: '100%'
          }}>
            {/* Grid layout for 21 fields */}
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
                    key={index}
                    sx={{
                      // For desktop: 7 equal columns
                      ...(!isMobile && !isTablet && {
                        flex: `0 0 calc(100% / 7 - 16px)`,
                        maxWidth: `calc(100% / 7 - 16px)`,
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
                      minHeight: isMobile ? '220px' : '240px', // Increased min-height
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        borderColor: '#3498db'
                      }
                    }}>
                      <Stack spacing={2.5} sx={{ flexGrow: 1, justifyContent: 'space-between' }}> {/* Increased spacing */}
                        {/* 1人目 - 診療科 */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block', 
                              textAlign: 'left',
                              mb: 1, // Increased margin
                              color: '#7f8c8d',
                              fontWeight: 600,
                              fontSize: largeFontSize.large // Larger label font
                            }}
                          >
                            診療科
                          </Typography>
                          <TextField
                            value={currentStatus.firstRow[index] || ""}
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
                                  fontSize: largeFontSize.large, // Larger input font
                                  fontWeight: 500,
                                  color: "#2c3e50",
                                  textAlign: 'left',
                                  padding: isMobile ? '8px 12px' : '10px 14px' // Increased padding
                                },
                              },
                            }}
                          />
                          {validationErrors?.[errorKey1] && (
                            <Typography sx={{ 
                              color: "#df1c41", 
                              fontSize: largeFontSize.small, // Larger error font
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
                              mb: 1, // Increased margin
                              color: '#7f8c8d',
                              fontWeight: 600,
                              fontSize: largeFontSize.large // Larger label font
                            }}
                          >
                            担当医師
                          </Typography>
                          <TextField
                            value={currentStatus.secondRow[index] || ""}
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
                                  fontSize: largeFontSize.large, // Larger input font
                                  fontWeight: 500,
                                  color: "#2c3e50",
                                  textAlign: 'left',
                                  padding: isMobile ? '8px 12px' : '10px 14px' // Increased padding
                                },
                              },
                            }}
                          />
                          {validationErrors?.[errorKey2] && (
                            <Typography sx={{ 
                              color: "#df1c41", 
                              fontSize: largeFontSize.small, // Larger error font
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
                              mb: 1, // Increased margin
                              color: '#7f8c8d',
                              fontWeight: 600,
                              fontSize: largeFontSize.large // Larger label font
                            }}
                          >
                            担当医師
                          </Typography>
                          <TextField
                            value={currentStatus.thirdRow[index] || ""}
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
                                  fontSize: largeFontSize.large, // Larger input font
                                  fontWeight: 500,
                                  color: "#2c3e50",
                                  textAlign: 'left',
                                  padding: isMobile ? '8px 12px' : '10px 14px' // Increased padding
                                },
                              },
                            }}
                          />
                          {validationErrors?.[errorKey3] && (
                            <Typography sx={{ 
                              color: "#df1c41", 
                              fontSize: largeFontSize.small, // Larger error font
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
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default DutyStaffSection;