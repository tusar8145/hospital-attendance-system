import React from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';

function ReportEntryMid() {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="info">
        <Typography variant="h6">
          中型病院用レポートフォーム
        </Typography>
        <Typography variant="body2">
          このフォームは現在開発中です。後ほど実装されます。
        </Typography>
      </Alert>
    </Box>
  );
}

export default ReportEntryMid;