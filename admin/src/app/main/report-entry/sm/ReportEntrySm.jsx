import React from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';

function ReportEntrySm() {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="info">
        <Typography variant="h6">
          福祉施設用レポートフォーム
        </Typography>
        <Typography variant="body2">
          このフォームは現在開発中です。後ほど実装されます。
        </Typography>
      </Alert>
    </Box>
  );
}

export default ReportEntrySm;