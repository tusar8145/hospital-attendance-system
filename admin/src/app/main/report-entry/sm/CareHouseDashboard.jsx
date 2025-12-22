import {
  Box,
  Stack,
  Typography,
  TextField,
  Divider,
} from "@mui/material";
import React from "react";

// Data arrays
const reportFields = [
  {
    label: "前日入所者数",
    value: "68",
    required: false,
    disabled: true,
  },
  {
    label: "当日入所者数",
    value: "70",
    required: true,
    disabled: false,
  },
  {
    label: "当日退所者数",
    value: "45",
    required: true,
    disabled: false,
  },
  {
    label: "当日末入所者数",
    value: "16",
    required: false,
    disabled: true,
  },
];

const summaryData = [
  {
    label: "外泊・入院者数",
    value: "23",
  },
  {
    label: "入院者数",
    value: "25",
  },
];

const statisticsData = [
  { label: "当月 入所者数", value: "94" },
  { label: "当月 平均入所者数", value: "18" },
  { label: "当月 稼働率", value: "48" },
];

const overviewData = [
  { label: "年度 延入所者数", value: "92" },
  { label: "年度 平均入所者数", value: "29" },
  { label: "年度 稼働率", value: "25" },
];

const CareHouseDashboard = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#E8F5E9",
        minHeight: "100vh",
        p: 4,
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Box
          component="header"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            p: 2,
            borderRadius: 1,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            ケアハウス
          </Typography>
        </Box>

        {/* Attendance Section */}
        <Stack spacing={1} sx={{ width: "269px" }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            定員
          </Typography>
          <TextField
            value="178"
            variant="outlined"
            InputProps={{
              readOnly: true,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "grey.100",
                borderRadius: "10px",
                "& fieldset": {
                  borderColor: "grey.300",
                },
              },
              "& .MuiInputBase-input": {
                fontWeight: 500,
                color: "text.primary",
              },
            }}
          />
        </Stack>

        {/* Daily Report Section */}
        <Stack
          direction="row"
          spacing={3.25}
          alignItems="flex-start"
          sx={{ width: "100%" }}
        >
          {reportFields.map((field, index) => (
            <React.Fragment key={index}>
              <Stack spacing={1.25} sx={{ minWidth: 269 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#36394a",
                      fontSize: "0.875rem",
                    }}
                  >
                    {field.label}
                    {field.required && (
                      <Typography
                        component="span"
                        sx={{
                          color:
                            field.label === "当日入所者数"
                              ? "#df1c41"
                              : "#ff383c",
                          ml: 0.5,
                        }}
                      >
                        *
                      </Typography>
                    )}
                  </Typography>
                </Stack>
                <TextField
                  value={field.value}
                  disabled={field.disabled}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      height: 44,
                      borderRadius: "10px",
                      backgroundColor: field.disabled ? "#f5f5f5" : "#ffffff",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ffffff",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ffffff",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ffffff",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "#f5f5f5",
                      },
                      "& input": {
                        padding: "8px 12px",
                        fontWeight: 500,
                        fontSize: "1rem",
                        color: "#1a1a1a",
                      },
                    },
                  }}
                  sx={{
                    width: 269,
                  }}
                />
              </Stack>
              {index < reportFields.length - 1 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 81,
                    borderColor: "#e0e0e0",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Stack>

        {/* Summary Section */}
        <Stack
          direction="row"
          spacing={3.25}
          alignItems="flex-start"
          sx={{ width: "100%" }}
        >
          {summaryData.map((item, index) => (
            <React.Fragment key={index}>
              <Stack spacing={1.25} sx={{ width: 269 }}>
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  {item.label}
                </Typography>
                <Box
                  sx={{
                    backgroundColor: "background.paper",
                    borderRadius: "10px",
                    border: "1px solid",
                    borderColor: "background.paper",
                    px: 1.5,
                    py: 1,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 500,
                      color: "text.primary",
                      width: 245,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Stack>
              {index < summaryData.length - 1 && (
                <Divider orientation="vertical" flexItem sx={{ height: 81 }} />
              )}
            </React.Fragment>
          ))}
        </Stack>

        {/* Statistics Section */}
        <Stack direction="row" spacing={3.25} sx={{ width: "100%" }}>
          {statisticsData.map((stat, index) => (
            <React.Fragment key={index}>
              <Stack spacing={1.25} sx={{ width: 269 }}>
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  {stat.label}
                </Typography>
                <Box
                  sx={{
                    backgroundColor: "grey.100",
                    borderRadius: "10px",
                    border: 1,
                    borderColor: "grey.100",
                    px: 1.5,
                    py: 1,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 500,
                      color: "grey.900",
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              </Stack>
              {index < statisticsData.length - 1 && (
                <Divider orientation="vertical" flexItem />
              )}
            </React.Fragment>
          ))}
        </Stack>

        {/* Overview Section */}
        <Stack direction="row" spacing={3.25} alignItems="stretch">
          {overviewData.map((item, index) => (
            <React.Fragment key={index}>
              <Stack spacing={1.25} sx={{ width: 269 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem" }}
                >
                  {item.label}
                </Typography>
                <Box
                  sx={{
                    backgroundColor: "grey.100",
                    borderRadius: "10px",
                    border: 1,
                    borderColor: "grey.100",
                    px: 1.5,
                    py: 1,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={500}
                    color="text.primary"
                    sx={{ fontSize: "1rem" }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Stack>
              {index < overviewData.length - 1 && (
                <Divider orientation="vertical" flexItem />
              )}
            </React.Fragment>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default CareHouseDashboard;