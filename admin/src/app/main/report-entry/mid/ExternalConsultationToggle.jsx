import React, { useState, useEffect, useRef, useMemo } from "react";
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

const ExternalConsultationToggle = ({
  initialValues = {},
  onValuesChange,
  readOnly = false,
  reportStatus = null,
}) => {
  // Toggle states for PET/MR/CT
  const [toggleStates, setToggleStates] = useState({
    PET: false,
    MR: false,
    CT: false,
  });

  // Section values state with defaults
  const [sectionValues, setSectionValues] = useState({
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
  });

  // Use refs to track state
  const isInitializedRef = useRef(false);
  const previousValuesRef = useRef({});
  const skipNextOnChangeRef = useRef(false);

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

  // Calculate totals with useMemo to prevent unnecessary recalculations
  const sectionTotals = useMemo(() => {
    const calculateTotal = (section) => {
      if (!section) return 0;
      return Object.values(section).reduce((total, item) => {
        if (item.enabled) {
          return total + (parseInt(item.value) || 0);
        }
        return total;
      }, 0);
    };

    return {
      PET: calculateTotal(sectionValues.PET),
      MR: calculateTotal(sectionValues.MR),
      CT: calculateTotal(sectionValues.CT),
    };
  }, [sectionValues]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return Object.keys(sectionTotals).reduce((total, key) => {
      if (toggleStates[key]) {
        return total + sectionTotals[key];
      }
      return total;
    }, 0);
  }, [sectionTotals, toggleStates]);

  // Initialize with props - handle only when initialValues actually changes
  useEffect(() => {
    // Skip if already initialized with the same values
    const currentInitialValuesStr = JSON.stringify(initialValues);
    const previousInitialValuesStr = JSON.stringify(previousValuesRef.current.initialValues);
    
    if (currentInitialValuesStr === previousInitialValuesStr) {
      return;
    }
    
    console.log('ExternalConsultationToggle - initialValues changed:', initialValues);
    
    // Store current initial values for comparison
    previousValuesRef.current.initialValues = initialValues;
    
    // Check if initialValues has data
    if (initialValues && Object.keys(initialValues).length > 0) {
      console.log('Processing initialValues');
      
      const newValues = { PET: {}, MR: {}, CT: {} };
      const newToggleStates = { PET: false, MR: false, CT: false };
      
      sections.forEach(section => {
        const sectionData = initialValues[section.id];
        
        if (sectionData && typeof sectionData === 'object' && Object.keys(sectionData).length > 0) {
          console.log(`Processing section ${section.id}:`, sectionData);
          
          let sectionHasData = false;
          
          section.fields.forEach(field => {
            const fieldData = sectionData[field.key];
            
            if (fieldData && (fieldData.value !== undefined || fieldData.enabled !== undefined)) {
              // Use data from server
              const value = fieldData.value !== undefined ? String(fieldData.value) : "0";
              const enabled = fieldData.enabled !== undefined ? Boolean(fieldData.enabled) : true;
              
              newValues[section.id][field.key] = {
                enabled: enabled,
                value: value,
              };
              
              // Check if section should be toggled based on data
              if (value !== "0" && value !== "" && parseInt(value) > 0) {
                sectionHasData = true;
              }
            } else {
              // Field not in server data, use default
              newValues[section.id][field.key] = {
                enabled: true,
                value: "0",
              };
            }
          });
          
          // Enable toggle if section has data
          newToggleStates[section.id] = sectionHasData;
        } else {
          // Section not in server data or empty, use defaults for all fields
          section.fields.forEach(field => {
            newValues[section.id][field.key] = {
              enabled: true,
              value: "0",
            };
          });
          newToggleStates[section.id] = false;
        }
      });
      
      // If no sections have data, enable PET by default
      const anySectionHasData = Object.values(newToggleStates).some(state => state);
      if (!anySectionHasData) {
        console.log('No sections have data, enabling PET by default');
        newToggleStates.PET = true;
      }
      
      // Set skip flag to prevent onChange notification for initialization
      skipNextOnChangeRef.current = true;
      
      setSectionValues(newValues);
      setToggleStates(newToggleStates);
      isInitializedRef.current = true;
      
      console.log('Initialization complete');
    } else {
      console.log('No initialValues or empty, enabling PET by default');
      setToggleStates({
        PET: true,
        MR: false,
        CT: false
      });
      isInitializedRef.current = true;
    }
  }, [initialValues]);

  // Handle main toggle change
  const handleToggleChange = (sectionId) => {
    if (readOnly || reportStatus === 'submitted') return;
    
    const newToggleState = !toggleStates[sectionId];
    setToggleStates((prev) => ({
      ...prev,
      [sectionId]: newToggleState,
    }));
  };

  // Handle field value change
  const handleFieldValueChange = (sectionId, fieldKey, value) => {
    if (readOnly || reportStatus === 'submitted') return;
    
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;
    
    setSectionValues((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldKey]: {
          ...prev[sectionId][fieldKey],
          value: value,
        },
      },
    }));
  };

  // Handle field toggle change
  const handleFieldToggleChange = (sectionId, fieldKey, enabled) => {
    if (readOnly || reportStatus === 'submitted') return;
    
    setSectionValues((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldKey]: {
          ...prev[sectionId][fieldKey],
          enabled: enabled,
        },
      },
    }));

    // If enabling a field, also enable the main section toggle
    if (enabled && !toggleStates[sectionId]) {
      setToggleStates(prev => ({
        ...prev,
        [sectionId]: true,
      }));
    }
  };

  // Notify parent of value changes - but skip during initialization
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    if (skipNextOnChangeRef.current) {
      skipNextOnChangeRef.current = false;
      console.log('Skipping onChange notification (initialization)');
      return;
    }
    
    const currentValues = {
      PET: toggleStates.PET ? sectionValues.PET : null,
      MR: toggleStates.MR ? sectionValues.MR : null,
      CT: toggleStates.CT ? sectionValues.CT : null,
    };

    // Compare with previous values
    const currentValuesStr = JSON.stringify(currentValues);
    const previousValuesStr = JSON.stringify(previousValuesRef.current.currentValues);
    
    if (currentValuesStr !== previousValuesStr) {
      console.log('Values changed, notifying parent:', currentValues);
      previousValuesRef.current.currentValues = currentValues;
      
      if (onValuesChange) {
        onValuesChange(currentValues);
      }
    }
  }, [toggleStates, sectionValues, onValuesChange]);

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
                  onFocus={(e) => e.target.select()}
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
    return (
      <Collapse in={toggleStates[section.id]} key={section.id}>
        <SectionWrapper>
          <SectionHeader color={section.color}>
            <Typography
              sx={{
                color: "white",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {section.label}
            </Typography>
          </SectionHeader>

          {renderGridLayout(section)}
        </SectionWrapper>
      </Collapse>
    );
  };

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
        {sections.map((section) => (
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
        ))}

        <Box sx={{ 
          ml: "auto", 
          display: "flex", 
          alignItems: "center", 
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "flex-end"
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            合計: {grandTotal}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            PET: {sectionTotals.PET} | MR: {sectionTotals.MR} | CT: {sectionTotals.CT}
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