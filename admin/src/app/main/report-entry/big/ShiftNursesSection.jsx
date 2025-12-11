import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Paper
} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ShiftNursesSection = React.memo(({
  shiftNurses,
  onShiftNursesChange,
  validationErrors = {},
  textFieldHeight = 52,
  fontSize = {
    small: '1rem',
    medium: '1.25rem',
    large: '1.5rem'
  },
  isMobile = false,
  sectionPadding = 4
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
    const newNurse = { id: Date.now(), name: "" };

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
    { shift: 'earlyNight', label: '準夜勤', color: '#f39c12' },
    { shift: 'lateNight', label: '深夜勤', color: '#8e44ad' }
  ];


  return (
    <Paper sx={{ p: sectionPadding, borderRadius: 2 }}>
      <Stack spacing={3}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, fontSize: fontSize.large }}>
            外来看護師
          </Typography>
          <Tooltip title="シフト別の看護師配置">
            <InfoOutlinedIcon sx={{ color: '#7f8c8d', fontSize: 20 }} />
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {shiftTypes.map(({ shift, label, color }) => (
            <Grid item xs={12} sm={6} key={shift}>
              <Stack spacing={2}>
                <Typography sx={{ fontSize: fontSize.medium, fontWeight: 600 }}>
                  ● {label}
                </Typography>

                {localNurses[shift].map(nurse => {
                  const hasError = validationErrors[shift] && !nurse.name.trim();

                  return (
                    <Box key={nurse.id} sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        value={nurse.name}
                        placeholder="看護師名を入力"
                        fullWidth
                        size="small"
                        error={hasError}
                        onChange={(e) =>
                          handleLocalChange(shift, nurse.id, e.target.value)
                        }
                        onBlur={(e) =>
                          handleBlurSave(shift, nurse.id, e.target.value)
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: textFieldHeight
                          }
                        }}
                      />

                      {localNurses[shift].length > 1 && (
                        <IconButton
                          onClick={() => removeNurse(shift, nurse.id)}
                          size="small"
                        >
                          ✕
                        </IconButton>
                      )}
                    </Box>
                  );
                })}

                <Button variant="outlined" onClick={() => addNurse(shift)}>
                  ＋ 看護師を追加
                </Button>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
});

export default ShiftNursesSection;
