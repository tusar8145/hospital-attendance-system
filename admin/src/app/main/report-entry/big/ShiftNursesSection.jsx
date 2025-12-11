import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Alert
} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const ShiftNursesSection = React.memo(({
  shiftNurses,
  onShiftNursesChange,
  validationErrors = {},
  textFieldHeight = 52,
  fontSize = {
    small: '0.875rem',
    medium: '1rem',
    large: '1.25rem'
  },
  isMobile = false,
  sectionPadding = 3
}) => {

  /** -----------------------------------------
   * Local copy of nurses (prevents re-render)
   * ---------------------------------------- */
  const [localNurses, setLocalNurses] = useState(shiftNurses);

  // sync from parent → internal state
  useEffect(() => {
    setLocalNurses(shiftNurses);
  }, [shiftNurses]);

  /** -----------------------------------------
   * LOCAL state change while typing
   * ---------------------------------------- */
  const handleLocalChange = (shift, id, value) => {
    setLocalNurses(prev => ({
      ...prev,
      [shift]: prev[shift].map(n =>
        n.id === id ? { ...n, name: value } : n
      )
    }));
  };

  /** -----------------------------------------
   * Only send updates to parent onBlur
   * ---------------------------------------- */
  const handleBlurSave = (shift, id, value) => {
    onShiftNursesChange(prev => ({
      ...prev,
      [shift]: prev[shift].map(n =>
        n.id === id ? { ...n, name: value } : n
      )
    }));
  };

  /** Add / Remove nurse */
  const addNurse = shift => {
    const newNurse = { 
      id: Date.now() + Math.floor(Math.random() * 1000), 
      name: "" 
    };

    setLocalNurses(prev => ({
      ...prev,
      [shift]: [...prev[shift], newNurse]
    }));

    // push to parent
    onShiftNursesChange(prev => ({
      ...prev,
      [shift]: [...prev[shift], newNurse]
    }));
  };

  const removeNurse = (shift, id) => {
    setLocalNurses(prev => ({
      ...prev,
      [shift]: prev[shift].filter(n => n.id !== id)
    }));

    onShiftNursesChange(prev => ({
      ...prev,
      [shift]: prev[shift].filter(n => n.id !== id)
    }));
  };

  const shiftTypes = [
    { 
      shift: 'earlyNight', 
      label: '準夜勤', 
      color: '#f39c12',
      icon: '🌙',
      description: '準夜勤の看護師（通常 16:00〜24:00）'
    },
    { 
      shift: 'lateNight', 
      label: '深夜勤', 
      color: '#8e44ad',
      icon: '🌃',
      description: '深夜勤の看護師（通常 0:00〜8:00）'
    }
  ];

  // Count filled nurses for each shift
  const countFilledNurses = (shift) => {
    return localNurses[shift].filter(nurse => nurse.name.trim() !== "").length;
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

        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 1
        }}>
          <Box>
            <Typography 
              sx={{ 
                fontWeight: 700, 
                fontSize: fontSize.large,
                color: "#2c3e50",
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5
              }}
            >
              <Box 
                component="span" 
                sx={{ 
                  width: 4, 
                  height: 20, 
                  backgroundColor: '#f39c12',
                  borderRadius: '2px'
                }} 
              />
              外来看護師
            </Typography>
            <Typography 
              sx={{ 
                fontSize: fontSize.small,
                color: "#666",
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              シフト別の看護師を入力してください
              <Tooltip title="シフト別の看護師配置情報を入力">
                <InfoOutlinedIcon 
                  sx={{ 
                    color: '#7f8c8d', 
                    fontSize: 16,
                    cursor: 'help'
                  }} 
                />
              </Tooltip>
            </Typography>
          </Box>
          
          {/* Stats Summary */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Chip
              label={`準夜勤: ${countFilledNurses('earlyNight')}名`}
              size="small"
              sx={{
                backgroundColor: '#fff8e1',
                color: '#f39c12',
                fontWeight: 600,
                fontSize: fontSize.small
              }}
            />
            <Chip
              label={`深夜勤: ${countFilledNurses('lateNight')}名`}
              size="small"
              sx={{
                backgroundColor: '#f3e5f5',
                color: '#8e44ad',
                fontWeight: 600,
                fontSize: fontSize.small
              }}
            />
          </Box>
        </Box>

        {/* Validation Errors */}
        {(validationErrors.earlyNight || validationErrors.lateNight) && (
          <Alert 
            severity="error" 
            sx={{ 
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
          >
            <Box>
              {validationErrors.earlyNight && (
                <Typography sx={{ fontSize: fontSize.small, fontWeight: 600 }}>
                  • {validationErrors.earlyNight}
                </Typography>
              )}
              {validationErrors.lateNight && (
                <Typography sx={{ fontSize: fontSize.small, fontWeight: 600 }}>
                  • {validationErrors.lateNight}
                </Typography>
              )}
            </Box>
          </Alert>
        )}

        {/* Main Content Grid */}
        <Grid container spacing={isMobile ? 2 : 3}>
          {shiftTypes.map(({ shift, label, color, icon, description }) => {
            const filledCount = countFilledNurses(shift);
            const hasError = validationErrors[shift];
            
            return (
              <Grid item xs={12} sm={6} key={shift}>
                <Box
                  sx={{
                    border: `1px solid ${hasError ? '#ffcdd2' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    p: 2,
                    backgroundColor: hasError ? '#fff8f8' : '#fafafa',
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: hasError ? '#f44336' : color,
                      backgroundColor: hasError ? '#ffebee' : '#f8f9fa'
                    }
                  }}
                >
                  <Stack spacing={2}>
                    {/* Shift Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            backgroundColor: color + '20',
                            border: `1px solid ${color}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: color
                          }}
                        >
                          {icon}
                        </Box>
                        <Box>
                          <Typography 
                            sx={{ 
                              fontSize: fontSize.medium,
                              fontWeight: 700,
                              color: hasError ? '#f44336' : '#2c3e50',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            {label}
                            <Typography 
                              component="span" 
                              sx={{ 
                                color: "#df1c41", 
                                fontSize: fontSize.small, 
                                fontWeight: 600 
                              }}
                            >
                              *
                            </Typography>
                          </Typography>
                          <Typography 
                            sx={{ 
                              fontSize: fontSize.small,
                              color: '#666',
                              mt: 0.25
                            }}
                          >
                            {description}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Shift Counter */}
                      <Chip
                        label={`${filledCount}名`}
                        size="small"
                        sx={{
                          backgroundColor: color + '20',
                          color: color,
                          fontWeight: 700,
                          fontSize: fontSize.small,
                          minWidth: '40px'
                        }}
                      />
                    </Box>

                    {/* Nurse Fields */}
                    <Stack spacing={1.5}>
                      {localNurses[shift].map((nurse, index) => {
                        const isEmpty = !nurse.name.trim();
                        const showRemove = localNurses[shift].length > 1;
                        
                        return (
                          <Box 
                            key={nurse.id} 
                            sx={{ 
                              display: 'flex', 
                              gap: 1, 
                              alignItems: 'center',
                              position: 'relative'
                            }}
                          >
                            {/* Optional: Sequence number */}
                            <Box
                              sx={{
                                position: 'absolute',
                                left: -8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: isEmpty ? '#e0e0e0' : color,
                                color: 'white',
                                fontSize: fontSize.small,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.8
                              }}
                            >
                              {index + 1}
                            </Box>
                            
                            <TextField
                              value={nurse.name}
                              placeholder="看護師名を入力"
                              fullWidth
                              size="small"
                              error={hasError && isEmpty}
                              onChange={(e) =>
                                handleLocalChange(shift, nurse.id, e.target.value)
                              }
                              onBlur={(e) =>
                                handleBlurSave(shift, nurse.id, e.target.value)
                              }
                              sx={{
                                ml: 2, 
                                "& .MuiOutlinedInput-root": {
                                  height: textFieldHeight,
                                  backgroundColor: '#ffffff',
                                  borderRadius: '6px',
                                  '& fieldset': {
                                    borderColor: hasError && isEmpty ? '#f44336' : '#dfe1e7',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: hasError && isEmpty ? '#f44336' : color,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: color,
                                    borderWidth: '2px'
                                  }
                                },
                                "& input": {
                                  fontSize: fontSize.medium,
                                  color: '#2c3e50',
                                  fontWeight: 500,
                                  paddingLeft: '20px' // Space for sequence number
                                },
                              }}
                            />

                            {showRemove && (
                              <Tooltip title="削除">
                                <IconButton
                                  onClick={() => removeNurse(shift, nurse.id)}
                                  size="small"
                                  sx={{
                                    border: '1px solid #ffcdd2',
                                    borderRadius: '6px',
                                    width: textFieldHeight,
                                    height: textFieldHeight,
                                    backgroundColor: '#ffffff',
                                    '&:hover': {
                                      backgroundColor: '#ffebee',
                                      borderColor: '#f44336'
                                    }
                                  }}
                                >
                                  <DeleteOutlineIcon 
                                    sx={{ 
                                      fontSize: 20,
                                      color: '#f44336'
                                    }} 
                                  />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>

                    {/* Add Button */}
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={() => addNurse(shift)}
                      fullWidth
                      sx={{
                        borderStyle: 'dashed',
                        borderColor: color,
                        color: color,
                        backgroundColor: color + '08',
                        borderRadius: '6px',
                        height: textFieldHeight,
                        fontSize: fontSize.medium,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: color,
                          backgroundColor: color + '20',
                          borderStyle: 'solid'
                        }
                      }}
                    >
                      看護師を追加
                    </Button>

                    {/* Help Text */}
                    {filledCount === 0 && (
                      <Typography 
                        sx={{ 
                          fontSize: fontSize.small,
                          color: hasError ? '#f44336' : '#ff9800',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          mt: 1
                        }}
                      >
                        {hasError ? '少なくとも1名の看護師を入力してください' : '看護師名を入力してください'}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Footer Notes */}
        <Box 
          sx={{ 
            mt: 2,
            p: 2,
            backgroundColor: '#f0f7ff',
            borderRadius: '8px',
            border: '1px solid #e3f2fd'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <InfoOutlinedIcon 
              sx={{ 
                color: '#0A6AE3', 
                fontSize: 20,
                mt: 0.25
              }} 
            />
            <Box>
              <Typography 
                sx={{ 
                  fontSize: fontSize.small,
                  fontWeight: 600,
                  color: '#0A6AE3',
                  mb: 0.5
                }}
              >
                入力ガイド
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: fontSize.small,
                  color: '#666',
                  lineHeight: 1.6
                }}
              >
                • 各シフトには少なくとも1名の看護師が必要です<br/>
                • 追加ボタンで複数の看護師を登録できます<br/>
                • 入力後は自動的に保存されます
              </Typography>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
});

export default ShiftNursesSection;