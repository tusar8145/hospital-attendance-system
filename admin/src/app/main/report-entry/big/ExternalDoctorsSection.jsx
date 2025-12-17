import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Grid,
  Tooltip,
  CircularProgress,
  Alert
} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';

const ExternalDoctorsSection = React.memo(({
  externalDoctors,
  onExternalDoctorsChange,
  validationErrors = {},
  textFieldHeight = 48,
  fontSize = { small: '0.875rem', medium: '1rem', large: '1.25rem' },
  isMobile = false,
  isTablet = false,
  sectionPadding = 3,
  readOnly = false,
  hospitalId,
  reportDate,
  formDataLoaded = false
}) => {
  // State for monthly cumulative stats (read-only info)
  const [monthlyCumulativeStats, setMonthlyCumulativeStats] = useState({
    morningClinic: 0,
    afternoonClinic: 0,
    onDuty: 0
  });
  
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [hasFetchedStats, setHasFetchedStats] = useState(false);
  
  // Refs to track state and prevent multiple API calls
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const lastFetchParamsRef = useRef({ hospitalId: null, date: null });

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = useCallback((date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch read-only statistics from API
  const fetchReadOnlyStats = useCallback(async (forceFetch = false) => {
    // Skip if no hospital ID
    if (!hospitalId || !reportDate) {
      console.log('Skipping stats fetch - missing hospitalId or reportDate');
      return;
    }

    // Check if we already fetched stats for this hospital/date combination
    const currentParams = { hospitalId, date: formatDateForAPI(reportDate) };
    const lastParams = lastFetchParamsRef.current;
    
    const isSameParams = lastParams.hospitalId === currentParams.hospitalId && 
                       lastParams.date === currentParams.date;
    
    // Don't fetch if we already have data for this combination and not forcing
    if (hasFetchedStats && isSameParams && !forceFetch) {
      console.log('Skipping stats fetch - already fetched for this hospital/date');
      return;
    }

    // Prevent multiple simultaneous fetches
    if (fetchInProgressRef.current) {
      console.log('Stats fetch already in progress');
      return;
    }

    fetchInProgressRef.current = true;
    setStatsLoading(true);
    setStatsError(null);

    try {
      console.log('Fetching stats for:', currentParams);
      const response = await axios.post(`${apiConfig.baseURL}/report/read-only-stats`, {
        date: currentParams.date,
        hospital_id: hospitalId
      });

      if (isMountedRef.current && response.data.success) {
        const { monthlyCumulative } = response.data.data;
        
        console.log('Stats fetched successfully:', monthlyCumulative);
        
        // Update the read-only stats display
        setMonthlyCumulativeStats({
          morningClinic: monthlyCumulative.morningClinic || 0,
          afternoonClinic: monthlyCumulative.afternoonClinic || 0,
          onDuty: monthlyCumulative.onDuty || 0
        });
        
        // Only update the form fields if form data is NOT loaded
        // (meaning we're creating a new report, not editing existing)
        if (!formDataLoaded) {
          console.log('Form data not loaded - updating fields from stats');
          if (onExternalDoctorsChange) {
            onExternalDoctorsChange({
              morning: (monthlyCumulative.morningClinic || 0).toString(),
              afternoon: (monthlyCumulative.afternoonClinic || 0).toString(),
              duty: (monthlyCumulative.onDuty || 0).toString()
            });
          }
        } else {
          console.log('Form data loaded - NOT updating fields from stats');
        }
        
        setHasFetchedStats(true);
        lastFetchParamsRef.current = currentParams;
      } else if (isMountedRef.current) {
        console.log('API response not successful');
        setStatsError('統計データの取得に失敗しました');
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error fetching read-only stats:', error);
        setStatsError('統計データの取得に失敗しました');
        
        // Only reset to 0 if we don't have form data loaded
        if (!formDataLoaded && onExternalDoctorsChange) {
          console.log('No form data loaded - resetting to 0 on error');
          onExternalDoctorsChange({
            morning: "0",
            afternoon: "0",
            duty: "0"
          });
        }
      }
    } finally {
      if (isMountedRef.current) {
        setStatsLoading(false);
        fetchInProgressRef.current = false;
      }
    }
  }, [hospitalId, reportDate, formatDateForAPI, formDataLoaded, onExternalDoctorsChange]);

  // Initial fetch when component mounts
  useEffect(() => {
    isMountedRef.current = true;
    
    // Only fetch if we have the required parameters
    if (hospitalId && reportDate) {
      // Small delay to ensure parent component has finished loading
      const timer = setTimeout(() => {
        fetchReadOnlyStats();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch stats when hospitalId or reportDate changes
  useEffect(() => {
    if (hospitalId && reportDate && isMountedRef.current) {
      console.log('HospitalId or reportDate changed - fetching stats');
      fetchReadOnlyStats(true); // Force fetch for new params
    }
  }, [hospitalId, formatDateForAPI(reportDate)]); // Use formatted date as dependency

  // Reset hasFetchedStats when formDataLoaded changes (when editing existing report)
  useEffect(() => {
    if (formDataLoaded) {
      console.log('Form data loaded - marking stats as fetched to prevent overwrite');
      setHasFetchedStats(true);
    }
  }, [formDataLoaded]);

  // Handle manual refresh if needed
  const handleRefreshStats = () => {
    fetchReadOnlyStats(true);
  };

  // Define the fields for external doctors
  const doctorFields = [
    { 
      field: 'morning', 
      label: '午前診', 
      color: '#3498db', 
      apiField: 'morningClinic',
      tooltip: '午前診の月間累計患者数'
    },
    { 
      field: 'afternoon', 
      label: '午後診', 
      color: '#9b59b6', 
      apiField: 'afternoonClinic',
      tooltip: '午後診の月間累計患者数'
    },
    { 
      field: 'duty', 
      label: '当直', 
      color: '#e74c3c', 
      apiField: 'onDuty',
      tooltip: '当直の月間累計患者数'
    }
  ];

  // Show loading state while initializing
  if (statsLoading && !hasFetchedStats) {
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
          
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        </Stack>
      </Paper>
    );
  }

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

        {/* Stats Error */}
        {statsError && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
            onClose={() => setStatsError(null)}
          >
            <Typography sx={{ fontSize: fontSize.small }}>
              {statsError}
              <Box component="span" 
                onClick={handleRefreshStats}
                sx={{ 
                  color: '#1976d2', 
                  textDecoration: 'underline', 
                  cursor: 'pointer',
                  ml: 1
                }}
              >
                再試行
              </Box>
            </Typography>
          </Alert>
        )}

        <Grid container spacing={isMobile ? 2 : 3}>
          {doctorFields.map((item) => (
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
                  <Typography component="span" sx={{ 
                    color: "#666", 
                    fontSize: fontSize.small, 
                    fontWeight: 400 
                  }}>
                    (月間累積)
                  </Typography>
                </Typography>
                
                <TextField
                  value={monthlyCumulativeStats[item.apiField] || 0}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={12} />
                    <Typography sx={{ 
                      fontSize: fontSize.small, 
                      color: '#666', 
                      fontStyle: 'italic' 
                    }}>
                      データ読み込み中...
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ 
                    fontSize: fontSize.small, 
                    color: '#666', 
                    fontStyle: 'italic' 
                  }}>
                    月間累積: {monthlyCumulativeStats[item.apiField] || 0}件
                  </Typography>
                )}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
});

export default ExternalDoctorsSection;