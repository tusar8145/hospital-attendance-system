import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Stack,
  Switch,
  TextField,
  Typography,
  Collapse,
  Alert,
  Divider,
  Paper,
  Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledToggleBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4.5),
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  height: 50,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
}));

const SectionWrapper = styled(Box)({
  backgroundColor: "#E3F2FD",
  padding: 32,
  width: "100%",
  borderRadius: 8,
  border: "1px solid #BBDEFB",
  marginBottom: 16,
  overflow: "hidden",
});

const SectionHeader = styled(Box)(({ color = "#0A6AE3" }) => ({
  backgroundColor: color,
  opacity: 0.8,
  padding: 8,
  borderRadius: 4,
  marginBottom: 16,
}));

// Helper function to convert full-width numbers to half-width
const normalizeNumberInput = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[０-９]/g, (char) => 
    String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
  );
};

const ExternalConsultationToggle = ({
  initialValues = {},
  onValuesChange,
  readOnly = false,
  reportStatus = null,
  visibleBoxes = { PET: true, MR: true, CT: true }
}) => {
  // Section configuration
  const sections = [
    {
      id: "PET",
      label: "PET",
      color: "#0A6AE3",
      fields: [
        { key: "PET-CT", label: "PET-CT" },
        { key: "エグゼクティブ", label: "エグゼクティブ" },
        { key: "保険", label: "保険" },
        { key: "〇〇〇〇", label: "〇〇〇〇" },
      ],
      layout: "grid",
    },
    {
      id: "MR",
      label: "MR",
      color: "#1976D2",
      fields: [
        { key: "頭蓋骨盤", label: "頭蓋骨盤" },
        { key: "エコー", label: "エコー" },
        { key: "脳ドック", label: "脳ドック" },
        { key: "保険", label: "保険" },
      ],
      layout: "grid",
    },
    {
      id: "CT",
      label: "CT",
      color: "#0A6AE3",
      fields: [
        { key: "〇〇〇〇", label: "〇〇〇〇" },
        { key: "〇〇〇〇2", label: "〇〇〇〇" },
        { key: "〇〇〇〇3", label: "〇〇〇〇" },
        { key: "〇〇〇〇4", label: "〇〇〇〇" },
      ],
      layout: "grid",
    },
  ];

  // Default values for each section
  const defaultSectionValues = {
    PET: {
      "PET-CT": { enabled: true, value: "0" },
      "エグゼクティブ": { enabled: true, value: "0" },
      "保険": { enabled: true, value: "0" },
      "〇〇〇〇": { enabled: true, value: "0" },
    },
    MR: {
      "頭蓋骨盤": { enabled: true, value: "0" },
      "エコー": { enabled: true, value: "0" },
      "脳ドック": { enabled: true, value: "0" },
      "保険": { enabled: true, value: "0" },
    },
    CT: {
      "〇〇〇〇": { enabled: true, value: "0" },
      "〇〇〇〇2": { enabled: true, value: "0" },
      "〇〇〇〇3": { enabled: true, value: "0" },
      "〇〇〇〇4": { enabled: true, value: "0" },
    },
  };

  // State management
  const [toggleStates, setToggleStates] = useState({ PET: false, MR: false, CT: false });
  const [sectionValues, setSectionValues] = useState(defaultSectionValues);
  const [totals, setTotals] = useState({ PET: 0, MR: 0, CT: 0, grandTotal: 0 });

  const prevInitialValuesRef = useRef(null);

  // Refs to track state
  const isInitializedRef = useRef(false);
  const updateTimeoutRef = useRef(null);
  const skipNotificationRef = useRef(false);

  // Initialize from props - ONLY ONCE
  useEffect(() => {
    if (!initialValues || Object.keys(initialValues).length === 0) return;

    if (
      prevInitialValuesRef.current &&
      JSON.stringify(prevInitialValuesRef.current) === JSON.stringify(initialValues)
    ) {
      return;
    }

    prevInitialValuesRef.current = initialValues;
    skipNotificationRef.current = true;

    let newToggleStates = { PET: false, MR: false, CT: false };
    let newSectionValues = JSON.parse(JSON.stringify(defaultSectionValues));

    if (initialValues.details) {
      ["PET", "MR", "CT"].forEach(sectionId => {
        const sectionData = initialValues.details[sectionId];
        if (!sectionData) return;

        newToggleStates[sectionId] = true;

        Object.keys(sectionData).forEach(fieldKey => {
          if (newSectionValues[sectionId][fieldKey]) {
            newSectionValues[sectionId][fieldKey] = {
              enabled: Boolean(sectionData[fieldKey].enabled),
              // Normalize initial values to handle any full-width numbers
              value: normalizeNumberInput(String(sectionData[fieldKey].value ?? "0")),
            };
          }
        });
      });
    }

    const calculateTotal = (id) =>
      Object.values(newSectionValues[id] || {}).reduce(
        (sum, f) => (f.enabled ? sum + Number(f.value || 0) : sum),
        0
      );

    const newTotals = {
      PET: calculateTotal("PET"),
      MR: calculateTotal("MR"),
      CT: calculateTotal("CT"),
    };
    newTotals.grandTotal = newTotals.PET + newTotals.MR + newTotals.CT;

    setToggleStates(newToggleStates);
    setSectionValues(newSectionValues);
    setTotals(newTotals);

    // ✅ THIS IS THE MISSING LINE
    isInitializedRef.current = true;

    setTimeout(() => {
      skipNotificationRef.current = false;
    }, 100);
  }, [initialValues]);



  // Calculate totals when sectionValues changes
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const calculateSectionTotal = (sectionId) => {
      const sectionData = sectionValues[sectionId];
      if (!sectionData) return 0;
      return Object.values(sectionData).reduce((total, item) => {
        if (item.enabled) {
          return total + (parseInt(item.value) || 0);
        }
        return total;
      }, 0);
    };

    const newTotals = {
      PET: calculateSectionTotal("PET"),
      MR: calculateSectionTotal("MR"),
      CT: calculateSectionTotal("CT")
    };
    newTotals.grandTotal = newTotals.PET + newTotals.MR + newTotals.CT;
    
    setTotals(newTotals);
    
    // Notify parent of changes with debounce
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (skipNotificationRef.current) {
        console.log('Skipping notification during initialization');
        return;
      }
      
      notifyParent(newTotals);
    }, 300);
  }, [sectionValues]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Handle main toggle change
  const handleToggleChange = (sectionId) => {
    if (readOnly || reportStatus === 'submitted') return;

    const newToggleState = !toggleStates[sectionId];
    console.log(`Toggle ${sectionId}: ${toggleStates[sectionId]} -> ${newToggleState}`);

    setToggleStates(prev => ({
      ...prev,
      [sectionId]: newToggleState,
    }));

    // ✅ If toggled OFF → clear that section's values
    if (!newToggleState) {
      setSectionValues(prev => ({
        ...prev,
        [sectionId]: Object.fromEntries(
          Object.keys(prev[sectionId]).map(key => [
            key,
            { ...prev[sectionId][key], value: "0" }
          ])
        ),
      }));
    }
  };

  // Handle field value change
  const handleFieldValueChange = (sectionId, fieldKey, value) => {
    if (readOnly || reportStatus === 'submitted') return;
    
    // Normalize full-width numbers to half-width
    const normalizedValue = normalizeNumberInput(value);
    
    // Allow only numbers after normalization
    if (!/^\d*$/.test(normalizedValue)) return;
    
    setSectionValues(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldKey]: {
          ...prev[sectionId][fieldKey],
          value: normalizedValue,
        },
      },
    }));
  };

  // Handle field blur to ensure normalization
  const handleFieldBlur = (e, sectionId, fieldKey) => {
    if (readOnly || reportStatus === 'submitted') return;
    
    const normalizedValue = normalizeNumberInput(e.target.value);
    const currentValue = sectionValues[sectionId][fieldKey].value;
    
    // Update if value changed after normalization
    if (normalizedValue !== currentValue) {
      if (/^\d*$/.test(normalizedValue)) {
        setSectionValues(prev => ({
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            [fieldKey]: {
              ...prev[sectionId][fieldKey],
              value: normalizedValue,
            },
          },
        }));
      }
    }
  };

  // Handle field toggle change
  const handleFieldToggleChange = (sectionId, fieldKey, enabled) => {
    if (readOnly || reportStatus === 'submitted') return;
    
    setSectionValues(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldKey]: {
          ...prev[sectionId][fieldKey],
          enabled: enabled,
        },
      },
    }));
  };

  // Handle focus event to select all text - This helps with user experience
  const handleFocusSelect = (e) => {
    // Select all text when field is focused for easy editing
    e.target.select();
  };

  // Notify parent of value changes
  const notifyParent = useCallback((currentTotals) => {
    if (!isInitializedRef.current || skipNotificationRef.current) {
      console.log('Skipping parent notification - not initialized or in skip mode');
      return;
    }
    
    // Prepare data to send to parent
    const detailsToSend = {
      PET: toggleStates.PET ? sectionValues.PET : null,
      MR: toggleStates.MR ? sectionValues.MR : null,
      CT: toggleStates.CT ? sectionValues.CT : null,
    };
    
    // Filter out null values for consistency with API
    Object.keys(detailsToSend).forEach(key => {
      if (detailsToSend[key] === null) {
        delete detailsToSend[key];
      }
    });

    const dataToSend = {
      summary: {
        PET: currentTotals.PET.toString(),
        MR: currentTotals.MR.toString(),
        CT: currentTotals.CT.toString()
      },
      details: detailsToSend,
      totals: currentTotals
    };

    console.log('ExternalConsultationToggle - Notifying parent:', dataToSend);
    
    if (onValuesChange) {
      onValuesChange(dataToSend);
    }
  }, [toggleStates, sectionValues, onValuesChange]);

  // Calculate summary values from totals
  const getSummaryValues = () => {
    return {
      PET: totals.PET.toString(),
      MR: totals.MR.toString(),
      CT: totals.CT.toString()
    };
  };

  // Render grid layout
  const renderGridLayout = (section) => {
    const sectionData = sectionValues[section.id];
    
    return (
      <Grid container spacing={3}>
        {section.fields.map((field) => {
          const fieldData = sectionData[field.key] || { enabled: true, value: "0" };
          
          return (
            <Grid item xs={12} sm={6} md={3} key={field.key}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    sx={{
                      flex: 1,
                      fontWeight: 600,
                      fontSize: "12px",
                      color: "#757575",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {field.label}
                  </Typography>
                  <Switch
                    checked={fieldData.enabled}
                    onChange={(e) => handleFieldToggleChange(section.id, field.key, e.target.checked)}
                    size="small"
                    disabled={readOnly || reportStatus === 'submitted'}
                    sx={{
                      width: 44,
                      height: 24,
                      padding: 0,
                      flexShrink: 0,
                      "& .MuiSwitch-switchBase": {
                        padding: 0.25,
                        "&.Mui-checked": {
                          transform: "translateX(20px)",
                          color: "#fff",
                          "& + .MuiSwitch-track": {
                            backgroundColor: section.color,
                            opacity: 1,
                          },
                        },
                      },
                      "& .MuiSwitch-thumb": {
                        width: 20,
                        height: 20,
                        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
                      },
                      "& .MuiSwitch-track": {
                        borderRadius: 12,
                        backgroundColor: section.color,
                        opacity: 1,
                      },
                    }}
                  />
                </Stack> 
                <TextField
                  value={fieldData.value}
                  onChange={(e) => handleFieldValueChange(section.id, field.key, e.target.value)}
                  onBlur={(e) => handleFieldBlur(e, section.id, field.key)}
                  onFocus={handleFocusSelect} 
                  variant="outlined"
                  size="small"
                  fullWidth
                  disabled={readOnly || reportStatus === 'submitted' || !fieldData.enabled}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: fieldData.enabled ? "white" : "#f5f5f5",
                      borderRadius: "10px",
                      height: "44px",
                      "& fieldset": {
                        borderColor: "#E0E0E0",
                      },
                    },
                    "& .MuiInputBase-input": {
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#212121",
                      textAlign: "right",
                    },
                  }}
                  inputProps={{
                    pattern: "[0-9]*",
                    inputMode: "numeric",
                  }}
                />
              </Stack>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // Render a section
  const renderSection = (section) => {
    if (!visibleBoxes[section.id]) return null;
    
    return (
      <Collapse 
        in={toggleStates[section.id]} 
        key={section.id}
        timeout="auto"
        unmountOnExit={false}
      >
        <SectionWrapper>
          <SectionHeader color={section.color}>
            <Typography
              sx={{
                color: "white",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {section.label} - 合計: {totals[section.id]}
            </Typography>
          </SectionHeader>

          {renderGridLayout(section)}
        </SectionWrapper>
      </Collapse>
    );
  };

  const summaryValues = getSummaryValues();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: '#ffffff',
        mb: 3,
        overflow: "hidden",
      }}
    >
      {/* Header Toggle Bar */}
      <StyledToggleBox>
        {sections.map((section) => {
          if (!visibleBoxes[section.id]) return null;
          
          return (
            <Stack
              key={section.id}
              direction="row"
              spacing={1.25}
              alignItems="center"
            >
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.secondary"
                sx={{ whiteSpace: "nowrap" }}
              >
                {section.label}
              </Typography>
              <Switch
                checked={toggleStates[section.id]}
                onChange={() => handleToggleChange(section.id)}
                size="small"
                disabled={readOnly || reportStatus === 'submitted'}
              />
            </Stack>
          );
        })}

        <Box sx={{ 
          ml: "auto", 
          display: "flex", 
          alignItems: "center", 
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "flex-end"
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            総合計: {totals.grandTotal}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            PET: {totals.PET} | MR: {totals.MR} | CT: {totals.CT}
          </Typography>
        </Box>
      </StyledToggleBox>

      {/* Sections */}
      <Stack spacing={2}>
        {sections.map(renderSection)}
      </Stack>

 

      {/* Read-only warning */}
      {(readOnly || reportStatus === 'submitted') && (
        <Alert severity="info" sx={{ mt: 2 }}>
          このセクションは読み取り専用です。編集できません。
        </Alert>
      )}
    </Paper>
  );
};

export default ExternalConsultationToggle;