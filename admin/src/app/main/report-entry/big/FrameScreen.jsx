import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Divider, 
  Stack, 
  TextField, 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  useMediaQuery,
  useTheme,
  Grid
} from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ConsolidatedContentComponent from './ConsolidatedContentComponent';

const FrameScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State for EmergencyStatisticsSection
  const [date, setDate] = useState("2025年10月12日");
  const [admissionCount, setAdmissionCount] = useState("30");
  const [dischargeCount, setDischargeCount] = useState("12");

  // State for ExternalDoctorsSection
  const [externalDoctors, setExternalDoctors] = useState({
    morning: "244",
    afternoon: "277",
    duty: "150"
  });

  // State for ExternalConsultationSection
  const [externalConsultation, setExternalConsultation] = useState({
    emergencyTransport: "20",
    postTransportAdmission: "10",
    visit: "15"
  });

  // State for PatientAdmissionSection
  const [shiftNurses, setShiftNurses] = useState({
    earlyNight: Array(3).fill(""),
    lateNight: Array(3).fill("")
  });

  // State for CurrentStatusSection
  const [currentStatus, setCurrentStatus] = useState({
    firstRow: Array(6).fill(""),
    secondRow: Array(6).fill("")
  });

  const fieldData = [
    { label: "保安", required: true },
    { label: "医事", required: true },
    { label: "医事", required: true },
    { label: "保安", required: true },
    { label: "医事", required: true },
    { label: "内科", required: true },
  ];

  // Handler functions
  const handleDateChange = (e) => setDate(e.target.value);
  const handleAdmissionChange = (e) => setAdmissionCount(e.target.value);
  const handleDischargeChange = (e) => setDischargeCount(e.target.value);

  const handleExternalDoctorChange = (field, value) => {
    setExternalDoctors(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyTransportChange = (e) => {
    setExternalConsultation(prev => ({ ...prev, emergencyTransport: e.target.value }));
  };

  const handlePostTransportAdmissionChange = (e) => {
    setExternalConsultation(prev => ({ ...prev, postTransportAdmission: e.target.value }));
  };

  const handleVisitChange = (e) => {
    setExternalConsultation(prev => ({ ...prev, visit: e.target.value }));
  };

  const handleShiftNurseChange = (shift, index, value) => {
    setShiftNurses(prev => ({
      ...prev,
      [shift]: prev[shift].map((item, i) => i === index ? value : item)
    }));
  };

  const handleAddShiftNurse = (shift) => {
    setShiftNurses(prev => ({
      ...prev,
      [shift]: [...prev[shift], ""]
    }));
  };

  const handleCurrentStatusChange = (row, index, value) => {
    setCurrentStatus(prev => ({
      ...prev,
      [row]: prev[row].map((item, i) => i === index ? value : item)
    }));
  };

  // Responsive values
  const sectionPadding = isMobile ? 2 : isTablet ? 3 : 4;
  const spacing = isMobile ? 2 : isTablet ? 3 : 4;
  const textFieldHeight = isMobile ? 36 : isTablet ? 40 : 44;
  const fontSize = {
    small: isMobile ? '0.75rem' : isTablet ? '0.8125rem' : '0.875rem',
    medium: isMobile ? '0.875rem' : isTablet ? '0.9375rem' : '1rem',
    large: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem',
  };

  // Responsive Section Component
  const ResponsiveSection = ({ children, bgcolor = "#ffffff" }) => (
    <Box sx={{ 
      bgcolor, 
      p: sectionPadding,
      borderRadius: isMobile ? '8px' : '12px',
      mb: isMobile ? 2 : isTablet ? 2.5 : 3,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {children}
    </Box>
  );

  // Responsive Title Component
  const SectionTitle = ({ children, bgcolor = "#d4e8e0" }) => (
    <Box sx={{ 
      bgcolor, 
      opacity: 0.8, 
      p: 1, 
      borderRadius: '4px',
      mb: isMobile ? 2 : isTablet ? 2.5 : 3,
    }}>
      <Typography sx={{ 
        fontWeight: 600, 
        fontSize: fontSize.medium,
        color: "#000000",
      }}>
        {children}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 2 : isTablet ? 2.5 : 3,
      }}
    >
      {/* Emergency Statistics Section */}
      <ResponsiveSection>
        <Stack spacing={isMobile ? 0 : isTablet ? 0 : 0}>
    <Box sx={{ width: { xs: '100%', sm: '50%', md: '30%' } }}>
  <Typography variant="body2" sx={{ 
    fontWeight: 600, 
    color: "#36394a",
    mb: 1,
    fontSize: fontSize.small
  }}>
    日付
    <Typography component="span" sx={{ color: "#df1c41", fontWeight: 600 }}>
      *
    </Typography>
  </Typography>
  <TextField
    value={date}
    onChange={handleDateChange}
    variant="outlined"
    fullWidth
    size={isMobile ? "small" : "medium"}
    InputProps={{
      endAdornment: (
        <CalendarTodayOutlinedIcon sx={{ 
          color: "#36394a", 
          fontSize: isMobile ? 20 : 24 
        }} />
      ),
      sx: {
        borderRadius: "8px",
        bgcolor: "#ffffff",
        height: textFieldHeight,
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#dfe1e7",
        },
        "& input": {
          fontSize: fontSize.small,
        },
      },
    }}
  />
</Box>
<br></br>
          <SectionTitle bgcolor="rgba(200, 230, 220, 0.8)">
            入院
          </SectionTitle>

          <Grid container spacing={isMobile ? 1.5 : isTablet ? 2 : 3}>
            <Grid item xs={12} sm={6} md={5}>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  color: "#36394a",
                  fontSize: fontSize.small,
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
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    sx: {
                      borderRadius: "8px",
                      bgcolor: "#ffffff",
                      height: textFieldHeight,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#dfe1e7",
                      },
                      "& input": {
                        fontSize: fontSize.small,
                      },
                    },
                  }}
                />
              </Stack>
            </Grid>

            {!isMobile && (
              <Grid item xs={false} sm={1} md={1}>
                <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                  <Divider
                    orientation="vertical"
                    sx={{ 
                      bgcolor: "#dfe1e7", 
                      width: "1px",
                      height: '100%',
                    }}
                  />
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={5}>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  color: "#36394a",
                  fontSize: fontSize.small,
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
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    sx: {
                      borderRadius: "8px",
                      bgcolor: "#ffffff",
                      height: textFieldHeight,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#dfe1e7",
                      },
                      "& input": {
                        fontSize: fontSize.small,
                      },
                    },
                  }}
                />
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </ResponsiveSection>

      {/* External Doctors Section */}
      <ResponsiveSection>
        <Stack spacing={isMobile ? 0 : isTablet ? 0 : 0}>
          <SectionTitle bgcolor="#d4e8e0">
            外来
          </SectionTitle>

          <Grid container spacing={isMobile ? 1.5 : isTablet ? 2 : 3}>
            {['morning', 'afternoon', 'duty'].map((field, index) => (
              <React.Fragment key={field}>
                <Grid item xs={6} sm={3}>
                  <Stack spacing={1}>
                    <Typography sx={{ 
                      fontWeight: 600, 
                      fontSize: fontSize.small, 
                      color: "#6b7280" 
                    }}>
                      {field === 'morning' ? '午前診' : field === 'afternoon' ? '午後診' : '当直'}
                    </Typography>
                    <Box sx={{
                      border: "1px solid #dfe1e7",
                      borderRadius: "8px",
                      px: isMobile ? 1 : 1.5,
                      py: 1,
                      height: textFieldHeight,
                      display: "flex",
                      alignItems: "center",
                      bgcolor: "#f3f4f6",
                    }}>
                      <TextField
                        value={externalDoctors[field]}
                        onChange={(e) => handleExternalDoctorChange(field, e.target.value)}
                        variant="standard"
                        fullWidth
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontWeight: 500,
                            fontSize: fontSize.small,
                            color: "#111827",
                            textAlign: "center",
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Grid>
                
                {index < 2 && !isMobile && (
                  <Grid item xs={false} sm={false} md={false}>
                    <Divider 
                      orientation="vertical" 
                      sx={{ 
                        height: "60px", 
                        borderColor: "#dfe1e7",
                        alignSelf: "center",
                      }} 
                    />
                  </Grid>
                )}
              </React.Fragment>
            ))}
          </Grid>
        </Stack>
      </ResponsiveSection>

      {/* External Consultation Section */}
      <ResponsiveSection>
        <Grid container spacing={isMobile ? 1.5 : isTablet ? 2 : 3}>
          <Grid item xs={12} md={7}>
            <SectionTitle bgcolor="#d4f4dd">
              緊急
            </SectionTitle>
            
            <Grid container spacing={isMobile ? 1.5 : isTablet ? 2 : 3}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography sx={{ 
                    fontSize: fontSize.small, 
                    fontWeight: 600, 
                    color: "#36394a", 
                    mb: 1 
                  }}>
                    緊急搬入数
                    <Box component="span" sx={{ color: "#df1c41" }}>*</Box>
                  </Typography>
                  <TextField
                    fullWidth
                    value={externalConsultation.emergencyTransport}
                    onChange={handleEmergencyTransportChange}
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#ffffff",
                        borderRadius: "8px",
                        height: textFieldHeight,
                        "& fieldset": { borderColor: "#dfe1e7" },
                        "& input": {
                          fontSize: fontSize.small,
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography sx={{ 
                    fontSize: fontSize.small, 
                    fontWeight: 600, 
                    color: "#36394a", 
                    mb: 1 
                  }}>
                    搬入後入院件数
                    <Box component="span" sx={{ color: "#df1c41" }}>*</Box>
                  </Typography>
                  <TextField
                    fullWidth
                    value={externalConsultation.postTransportAdmission}
                    onChange={handlePostTransportAdmissionChange}
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#ffffff",
                        borderRadius: "8px",
                        height: textFieldHeight,
                        "& fieldset": { borderColor: "#dfe1e7" },
                        "& input": {
                          fontSize: fontSize.small,
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {!isMobile && (
            <Grid item xs={false} md={1}>
              <Divider 
                orientation="vertical" 
                sx={{ 
                  height: '100%',
                  borderColor: "#dfe1e7",
                }} 
              />
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <SectionTitle bgcolor="#d4f4dd">
              訪問
            </SectionTitle>
            
            <Box>
              <Typography sx={{ 
                fontSize: fontSize.small, 
                fontWeight: 600, 
                color: "#6b6f82", 
                mb: 1 
              }}>
                訪問
              </Typography>
              <TextField
                fullWidth
                value={externalConsultation.visit}
                onChange={handleVisitChange}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#ffffff",
                    borderRadius: "8px",
                    height: textFieldHeight,
                    "& fieldset": { borderColor: "#dfe1e7" },
                    "& input": {
                      fontSize: fontSize.small,
                    },
                  },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </ResponsiveSection>

      {/* Patient Admission Section */}
      <ResponsiveSection>
        <Stack spacing={isMobile ? 0 : isTablet ? 0 : 0}>
          <SectionTitle bgcolor="rgba(200, 230, 201, 0.8)">
            外来看護師
          </SectionTitle>

          <Box sx={{ overflowX: 'auto', pb: 1 }}>
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={isMobile ? 2 : 3} 
              alignItems={isMobile ? "stretch" : "flex-end"}
              sx={{ minWidth: isMobile ? "100%" : "600px" }}
            >
              {['earlyNight', 'lateNight'].map((shift, shiftIndex) => (
                <React.Fragment key={shiftIndex}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ 
                      fontSize: fontSize.small, 
                      fontWeight: 600, 
                      color: "#36394a",
                      mb: 1,
                    }}>
                      {shift === 'earlyNight' ? '準夜' : '深夜'}
                      <Typography component="span" sx={{ color: "#df1c41", fontSize: fontSize.small, fontWeight: 600 }}>
                        *
                      </Typography>
                    </Typography>
                    
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      {shiftNurses[shift].map((nurse, fieldIndex) => (
                        <TextField
                          key={fieldIndex}
                          placeholder="名前"
                          value={nurse}
                          onChange={(e) => handleShiftNurseChange(shift, fieldIndex, e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{
                            flex: 1,
                            minWidth: isMobile ? "120px" : "140px",
                            "& .MuiOutlinedInput-root": {
                              height: textFieldHeight,
                              borderRadius: "8px",
                              bgcolor: "#ffffff",
                              "& fieldset": { borderColor: "#dfe1e7" },
                              "& input": {
                                fontSize: fontSize.small,
                                color: "#9ca3af",
                                fontWeight: 500,
                              },
                            },
                          }}
                        />
                      ))}
                      
                      <Button
                        variant="contained"
                        onClick={() => handleAddShiftNurse(shift)}
                        sx={{
                          minWidth: "auto",
                          width: textFieldHeight,
                          height: textFieldHeight,
                          bgcolor: "#0a6ae3",
                          borderRadius: "8px",
                          "&:hover": { bgcolor: "#0856b8" },
                        }}
                      >
                        <Typography sx={{
                          fontSize: fontSize.medium,
                          fontWeight: 600,
                          color: "#ffffff",
                        }}>
                          ＋
                        </Typography>
                      </Button>
                    </Stack>
                  </Box>
                  
                  {shiftIndex === 0 && !isMobile && (
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ 
                        height: "60px", 
                        borderColor: "#dfe1e7",
                        alignSelf: "center",
                        mx: 1,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </Stack>
          </Box>
        </Stack>
      </ResponsiveSection>

      {/* Current Status Section */}
      <ResponsiveSection>
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
          <Box sx={{ 
            bgcolor: 'rgba(200, 230, 201, 0.3)', 
            p: 1, 
            mb: 2,
            borderRadius: '4px',
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              fontSize: fontSize.medium, 
              color: "#36394a" 
            }}>
              当直
            </Typography>
          </Box>
          
          <Box sx={{ minWidth: isMobile ? "600px" : "800px" }}>
            <Grid container spacing={1}>
              {fieldData.map((field, index) => (
                <Grid item xs={6} sm={4} md={2} key={index}>
                  <Box sx={{ 
                    border: '1px solid #dfe1e7',
                    borderRadius: '8px',
                    p: 1.5,
                    textAlign: 'center',
                    bgcolor: '#ffffff',
                  }}>
                    <Typography sx={{ 
                      fontSize: fontSize.small, 
                      fontWeight: 600, 
                      color: "#36394a",
                      mb: 1,
                    }}>
                      {field.label}
                      {field.required && (
                        <Typography component="span" sx={{ color: "#df1c41", fontSize: fontSize.small, fontWeight: 600 }}>
                          *
                        </Typography>
                      )}
                    </Typography>
                    
                    <TextField
                      placeholder="名前"
                      value={currentStatus.firstRow[index]}
                      onChange={(e) => handleCurrentStatusChange('firstRow', index, e.target.value)}
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{
                        mb: 1,
                        "& .MuiOutlinedInput-root": {
                          height: textFieldHeight,
                          bgcolor: "#ffffff",
                          borderRadius: "8px",
                          "& fieldset": { borderColor: "#dfe1e7" },
                          "& input": {
                            fontSize: fontSize.small,
                            fontWeight: 500,
                            color: "#9ca3af",
                          },
                        },
                      }}
                    />
                    
                    <TextField
                      placeholder="名前"
                      value={currentStatus.secondRow[index]}
                      onChange={(e) => handleCurrentStatusChange('secondRow', index, e.target.value)}
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: textFieldHeight,
                          bgcolor: "#ffffff",
                          borderRadius: "8px",
                          "& fieldset": { borderColor: "#dfe1e7" },
                          "& input": {
                            fontSize: fontSize.small,
                            fontWeight: 500,
                            color: "#9ca3af",
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </ResponsiveSection>

      {/* Consolidated Content Component */}
      <ResponsiveSection>
        <ConsolidatedContentComponent />
      </ResponsiveSection>
    </Box>
  );
};

export default FrameScreen;