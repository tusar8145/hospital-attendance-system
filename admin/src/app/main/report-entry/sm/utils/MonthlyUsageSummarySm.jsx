
import { Box, Divider, Stack, Typography } from "@mui/material";
import React from "react";

const MonthlyUsageSummary = () => {
  const firstRowData = [{ label: "定員", value: "113", bgColor: "grey.200" }];

  const secondRowData = [
    { label: "当日 利用者数", value: "71", bgColor: "white" },
    { label: "当月 利用者数", value: "53", bgColor: "grey.200" },
    { label: "当月 利用者数累計", value: "69", bgColor: "grey.200" },
    { label: "当月 平均利用者数", value: "26", bgColor: "grey.200" },
  ];

  const thirdRowData = [
    { label: "当月 稼働率", value: "30", bgColor: "grey.200" },
    { label: "年度 利用者数", value: "42", bgColor: "grey.200" },
    { label: "年度 平均利用者数", value: "64", bgColor: "grey.200" },
    { label: "年度 稼働率", value: "66", bgColor: "grey.200" },
  ];

  const renderField = (item) => (
    <Stack spacing={1} sx={{ width: 269 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: "grey.600",
        }}
      >
        {item.label}
      </Typography>
      <Box
        sx={{
          height: 44,
          display: "flex",
          alignItems: "center",
          px: 1.5,
          py: 1,
          bgcolor: item.bgColor,
          borderRadius: "10px",
          border: "1px solid",
          borderColor: "white",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            color: "grey.900",
            width: 245,
          }}
        >
          {item.value}
        </Typography>
      </Box>
    </Stack>
  );

  return (
    <Stack spacing={3} sx={{ p: 4, bgcolor: "blue.50" }}>
 

      <Stack direction="row" spacing={3.25}>
        {firstRowData.map((item, index) => (
          <React.Fragment key={index}>{renderField(item)}</React.Fragment>
        ))}
      </Stack>

      <Stack direction="row" spacing={3.25} sx={{ alignItems: "start" }}>
        {secondRowData.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Divider orientation="vertical" flexItem sx={{ height: 81 }} />
            )}
            {renderField(item)}
          </React.Fragment>
        ))}
      </Stack>

      <Stack direction="row" spacing={3.25} sx={{ alignItems: "start" }}>
        {thirdRowData.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Divider orientation="vertical" flexItem sx={{ height: 81 }} />
            )}
            {renderField(item)}
          </React.Fragment>
        ))}
      </Stack>
    </Stack>
  );
};

export default MonthlyUsageSummary;