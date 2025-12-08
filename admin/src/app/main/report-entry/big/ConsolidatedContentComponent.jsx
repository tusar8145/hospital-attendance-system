import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  useMediaQuery,
  useTheme,
  Grid // Changed from Grid2
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const ConsolidatedContentComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [selectedDoctors1, setSelectedDoctors1] = useState({
    row1: "武田(拓)",
    row2: "",
    row3: "",
  });

  const [selectedDoctors2, setSelectedDoctors2] = useState({
    row1: "",
    row2: "",
    row3: "",
  });

  const [selectedDoctors3, setSelectedDoctors3] = useState({
    row1: "",
    row2: "",
    row3: "",
  });

  const [patientCounts, setPatientCounts] = useState({
    row1: "98",
    row2: "98",
    row3: "98",
  });

  const doctorOptions = ["武田(拓)", "医師A", "医師B", "医師C", "医師D"];
  const consultationTypes = ["午前診", "午後診", "夜診"];

  // Handler functions
  const handleDoctorChange = (column, rowId, value) => {
    const setters = [setSelectedDoctors1, setSelectedDoctors2, setSelectedDoctors3];
    setters[column - 1]?.(prev => ({
      ...prev,
      [rowId]: value,
    }));
  };

  const handlePatientCountChange = (rowId, value) => {
    setPatientCounts(prev => ({
      ...prev,
      [rowId]: value,
    }));
  };

  // Calculate total
  const calculateTotal = () => {
    const values = Object.values(patientCounts);
    return values.reduce((sum, value) => sum + (parseInt(value) || 0), 0);
  };

  const total = calculateTotal();

  // Responsive values
  const cellPadding = isMobile ? '4px' : isTablet ? '8px' : '16px';
  const fontSize = isMobile ? '0.75rem' : isTablet ? '0.8125rem' : '0.875rem';
  const selectHeight = isMobile ? 28 : isTablet ? 32 : 36;

  // Header Cell Component
  const HeaderCell = ({ children, colSpan = 1, rowSpan = 1 }) => (
    <TableCell
      colSpan={colSpan}
      rowSpan={rowSpan}
      sx={{
        backgroundColor: "#F9FAFB",
        border: "1px solid #DFE1E7",
        padding: cellPadding,
        height: isMobile ? 32 : 40,
        textAlign: 'center',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      <Typography
        sx={{
          fontSize: fontSize,
          fontWeight: 600,
          color: "#6B7280",
          lineHeight: 1.2,
        }}
      >
        {children}
      </Typography>
    </TableCell>
  );

  // Data Cell Component
  const DataCell = ({ children, rowSpan = 1 }) => (
    <TableCell
      rowSpan={rowSpan}
      sx={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #DFE1E7",
        padding: cellPadding,
        height: isMobile ? 32 : 40,
        textAlign: 'center',
        verticalAlign: 'middle',
        minWidth: isMobile ? '60px' : isTablet ? '80px' : '100px',
      }}
    >
      <Typography
        sx={{
          fontSize: fontSize,
          fontWeight: 500,
          color: "#111827",
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {children}
      </Typography>
    </TableCell>
  );

  // Doctor Select Cell Component
  const DoctorSelectCell = ({ value, onChange, column, rowId }) => (
    <TableCell
      sx={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #DFE1E7",
        padding: cellPadding,
        height: isMobile ? 32 : 40,
      }}
    >
      <Select
        value={value}
        onChange={(e) => onChange(column, rowId, e.target.value)}
        displayEmpty
        size="small"
        IconComponent={KeyboardArrowDownIcon}
        sx={{
          width: '100%',
          height: selectHeight,
          backgroundColor: value ? "#EFF6FF" : "#F9FAFB",
          borderRadius: "6px",
          border: "1px solid #E5E7EB",
          fontSize: fontSize,
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '& .MuiSelect-select': {
            padding: isMobile ? '4px 8px' : '6px 12px',
            color: value ? "#0A6AE3" : "#9CA3AF",
            fontWeight: 400,
          },
          '& .MuiSelect-icon': {
            color: value ? "#0A6AE3" : "#A4ACB9",
          },
        }}
        renderValue={(selected) => selected || "医師を選択"}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 200,
              fontSize: fontSize,
            },
          },
        }}
      >
        <MenuItem value="">医師を選択</MenuItem>
        {doctorOptions.map((doctor, index) => (
          <MenuItem key={index} value={doctor} sx={{ fontSize: fontSize }}>
            {doctor}
          </MenuItem>
        ))}
      </Select>
    </TableCell>
  );

  // Patient Count Cell Component
  const PatientCountCell = ({ value, onChange, rowId }) => (
    <TableCell
      sx={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #DFE1E7",
        padding: cellPadding,
        height: isMobile ? 32 : 40,
      }}
    >
      <TextField
        value={value}
        onChange={(e) => onChange(rowId, e.target.value)}
        variant="outlined"
        size="small"
        inputProps={{
          style: {
            textAlign: 'center',
            fontSize: fontSize,
            padding: isMobile ? '4px 8px' : '6px 12px',
            height: selectHeight - 8,
          },
        }}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            height: selectHeight,
            backgroundColor: "#F9FAFB",
            borderRadius: "6px",
            '& fieldset': {
              borderColor: "#E5E7EB",
            },
            '&:hover fieldset': {
              borderColor: "#0A6AE3",
            },
          },
        }}
      />
    </TableCell>
  );

  // Responsive wrapper for table
  const TableWrapper = ({ children }) => (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#888',
          borderRadius: '3px',
        },
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid #dfe1e7",
        overflow: "hidden",
        width: "100%",
        p: isMobile ? 1 : isTablet ? 1.5 : 2,
      }}
    >
      <TableWrapper>
        <Table size="small" sx={{ minWidth: isMobile ? '600px' : '800px' }}>
          <TableHead>
            <TableRow>
              <HeaderCell>通番</HeaderCell>
              <HeaderCell>診療区</HeaderCell>
              <HeaderCell>診療区分</HeaderCell>
              <HeaderCell>診療担当医</HeaderCell>
              <HeaderCell>診療担当医</HeaderCell>
              <HeaderCell>診療担当医</HeaderCell>
              <HeaderCell>患者数</HeaderCell>
              <HeaderCell>合計</HeaderCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {[1, 2, 3].map((rowIndex) => (
              <TableRow key={rowIndex}>
                {rowIndex === 1 && (
                  <DataCell rowSpan={3}>01</DataCell>
                )}
                
                {rowIndex === 1 && (
                  <DataCell rowSpan={3}>内科</DataCell>
                )}
                
                <DataCell>{consultationTypes[rowIndex - 1]}</DataCell>
                
                <DoctorSelectCell
                  value={selectedDoctors1[`row${rowIndex}`]}
                  onChange={handleDoctorChange}
                  column={1}
                  rowId={`row${rowIndex}`}
                />
                
                <DoctorSelectCell
                  value={selectedDoctors2[`row${rowIndex}`]}
                  onChange={handleDoctorChange}
                  column={2}
                  rowId={`row${rowIndex}`}
                />
                
                <DoctorSelectCell
                  value={selectedDoctors3[`row${rowIndex}`]}
                  onChange={handleDoctorChange}
                  column={3}
                  rowId={`row${rowIndex}`}
                />
                
                <PatientCountCell
                  value={patientCounts[`row${rowIndex}`]}
                  onChange={handlePatientCountChange}
                  rowId={`row${rowIndex}`}
                />
                
                {rowIndex === 1 && (
                  <TableCell
                    rowSpan={3}
                    sx={{
                      backgroundColor: "#EFF6FF",
                      border: "1px solid #DFE1E7",
                      padding: cellPadding,
                      height: isMobile ? 96 : 120,
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: isMobile ? '1rem' : '1.125rem',
                        color: "#0A6AE3",
                      }}
                    >
                      {total}
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </Box>
  );
};

export default ConsolidatedContentComponent;