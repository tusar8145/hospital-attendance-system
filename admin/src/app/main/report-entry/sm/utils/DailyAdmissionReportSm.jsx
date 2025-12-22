import { Box, Divider, Stack, Typography, TextField } from "@mui/material";
import React from "react";

const DailyAdmissionReport = () => {
  // Data for DataDisplaySection
  const dataFields = [
    {
      label: "前日入所者数",
      value: "49",
      required: false,
      editable: false,
    },
    {
      label: "当日入所者数",
      value: "43",
      required: true,
      editable: true,
    },
    {
      label: "当日退所者数",
      value: "97",
      required: true,
      editable: true,
    },
    {
      label: "当日末入所者数",
      value: "82",
      required: false,
      editable: false,
    },
  ];

  // Data for SummarySection
  const summaryData = [
    { label: "外泊・入院者数", value: "59" },
    { label: "入所扱", value: "16" },
    { label: "入院者数", value: "70" },
    { label: "退所扱", value: "28" },
  ];

  // Data for StatisticsSection
  const statisticsData = [
    { label: "当月 入所者数", value: "50" },
    { label: "当月 平均入所者数", value: "81" },
    { label: "当月 稼働率", value: "87" },
  ];

  // Data for MetricsSection
  const metricsData = [
    { label: "年度 延入所者数", value: "69" },
    { label: "年度 平均入所者数", value: "15" },
    { label: "年度 稼働率", value: "96" },
  ];

  return (
    <Box
      sx={{
        backgroundColor: "#ffe5e5",
      }}
    >
 

      <Stack spacing={3} sx={{ padding: 4 }}>
        {/* InputFormSection */}
        <Stack spacing={1} sx={{ width: "269px" }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            定員
          </Typography>
          <TextField
            value="112"
            variant="outlined"
            disabled
            fullWidth
            InputProps={{
              sx: {
                backgroundColor: "grey.100",
                borderRadius: "10px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "grey.300",
                },
              },
            }}
            sx={{
              "& .MuiInputBase-input": {
                fontWeight: 500,
                color: "text.primary",
              },
            }}
          />
        </Stack>

        {/* DataDisplaySection */}
        <Stack direction="row" spacing={3.25} alignItems="flex-start">
          {dataFields.map((field, index) => (
            <React.Fragment key={index}>
              <Stack spacing={1.25} sx={{ width: 269 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#36394a",
                      lineHeight: 1.5,
                    }}
                  >
                    {field.label}
                    {field.required && (
                      <Typography
                        component="span"
                        sx={{
                          color: field.label.includes("当日入所者数")
                            ? "#df1c41"
                            : "#ff383c",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          ml: 0.5,
                        }}
                      >
                        *
                      </Typography>
                    )}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    px: 1.5,
                    py: 1,
                    backgroundColor: field.editable ? "#ffffff" : "#f5f5f5",
                    borderRadius: "10px",
                    border: "1px solid",
                    borderColor: "#ffffff",
                  }}
                >
                  <Typography
                    sx={{
                      width: 245,
                      fontSize: "1rem",
                      fontWeight: 500,
                      color: "#1a1a1a",
                      lineHeight: 1.5,
                    }}
                  >
                    {field.value}
                  </Typography>
                </Box>
              </Stack>
              {index < dataFields.length - 1 && (
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

        {/* SummarySection */}
        <Stack direction="row" spacing={3.25} alignItems="flex-start">
          <Stack direction="row" spacing={1.875}>
            {summaryData.slice(0, 2).map((item, index) => (
              <Stack key={index} spacing={1}>
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
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "background.paper",
                    borderRadius: "10px",
                    px: 1.5,
                    py: 1,
                    minWidth: "126.5px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={500}
                    color="text.primary"
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ height: "81px" }} />

          <Stack direction="row" spacing={1.875}>
            {summaryData.slice(2, 4).map((item, index) => (
              <Stack key={index} spacing={1}>
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
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "background.paper",
                    borderRadius: "10px",
                    px: 1.5,
                    py: 1,
                    minWidth: "126.5px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={500}
                    color="text.primary"
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* StatisticsSection */}
        <Stack direction="row" spacing={3.25} alignItems="flex-start">
          {statisticsData.map((stat, index) => (
            <React.Fragment key={index}>
              <Stack spacing={1.25} sx={{ width: 269 }}>
                <Stack spacing={1}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        sx={{
                          flex: 1,
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: "text.secondary",
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        display: "inline-flex",
                        backgroundColor: "grey.100",
                        height: 44,
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        borderRadius: "10px",
                        border: 1,
                        borderColor: "grey.100",
                      }}
                    >
                      <Typography
                        sx={{
                          width: 245,
                          fontWeight: 500,
                          fontSize: "1rem",
                          color: "grey.900",
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Stack>
              {index < statisticsData.length - 1 && (
                <Divider orientation="vertical" flexItem sx={{ height: 81 }} />
              )}
            </React.Fragment>
          ))}
        </Stack>

        {/* MetricsSection */}
        <Stack
          direction="row"
          spacing={3.25}
          alignItems="flex-start"
          sx={{ width: "100%" }}
        >
          {metricsData.map((metric, index) => (
            <React.Fragment key={index}>
              <Stack spacing={1.25} sx={{ width: 269 }}>
                <Stack spacing={1}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        sx={{
                          flex: 1,
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "text.secondary",
                          lineHeight: 1.5,
                        }}
                      >
                        {metric.label}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        display: "inline-flex",
                        backgroundColor: "grey.100",
                        height: 44,
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        borderRadius: "10px",
                        border: 1,
                        borderColor: "grey.100",
                      }}
                    >
                      <Typography
                        sx={{
                          width: 245,
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "text.primary",
                          lineHeight: 1.5,
                        }}
                      >
                        {metric.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Stack>
              {index < metricsData.length - 1 && (
                <Divider orientation="vertical" flexItem sx={{ height: 81 }} />
              )}
            </React.Fragment>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default DailyAdmissionReport;