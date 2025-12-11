import React from 'react';
import { Box, CircularProgress } from "@mui/material";
import { HeaderSection } from "./HeaderSection";
import { MainContentSection } from "./MainContentSection";

const ContentScreen = ({ 
  reports, 
  loading, 
  pagination, 
  filters,
  onPageChange,
  onStatusFilter,
  onReportAction 
}) => {
  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 3,
        overflow: "hidden",
        border: 1,
        borderColor: "grey.200",
      }}
    >
      <HeaderSection 
        filters={filters}
        onStatusFilter={onStatusFilter}
      />
      
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 400 
        }}>
          <CircularProgress />
        </Box>
      ) : (
        <MainContentSection
          reports={reports}
          pagination={pagination}
          onPageChange={onPageChange}
          onReportAction={onReportAction}
        />
      )}
    </Box>
  );
};

export default ContentScreen;