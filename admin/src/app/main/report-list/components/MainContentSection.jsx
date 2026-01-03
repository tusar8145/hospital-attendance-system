import React from 'react';
import CheckCircle from "@mui/icons-material/CheckCircle";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  Chip,
  Link,
  Pagination,
  PaginationItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

export const MainContentSection = ({ 
  reports, 
  pagination, 
  onPageChange,
  onReportAction,
  filters,
  onStatusFilter,
  onExport,
  onClearStatusFilter
}) => {
  const getStatusChip = (status) => {
    switch(status) {
      case 'draft':
        return (
          <Chip
            label="下書き"
            size="small"
            sx={{
              bgcolor: "#FFF3E0",
              color: "#F57C00",
              border: 1,
              borderColor: "#FFE0B2",
              fontWeight: 500,
              fontSize: "0.75rem",
            }}
          />
        );
      case 'submitted':
        return (
          <Chip
            label="提出済み"
            size="small"
            sx={{
              bgcolor: "#E3F2FD",
              color: "#1976D2",
              border: 1,
              borderColor: "#BBDEFB",
              fontWeight: 500,
              fontSize: "0.75rem",
            }}
          />
        );
      case 'approved':
        return (
          <Box sx={{ position: 'relative' }}>
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center"
              sx={{
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Chip
                label="確認済み"
                size="small"
                sx={{
                  bgcolor: "#0bb53014",
                  color: "#0bb530ff",
                  border: 1,
                  borderColor: "#0bb530ff",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  bgcolor: "primary.main",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: 'relative',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    animation: 'ripple 2s infinite',
                    zIndex: -1,
                  },
                  '@keyframes ripple': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                    '100%': {
                      transform: 'scale(1.8)',
                      opacity: 0,
                    },
                  },
                }}
              >
                <CheckCircle
                  sx={{
                    width: "75%",
                    height: "75%",
                    color: "white",
                  }}
                />
              </Box>
            </Stack>
          </Box>
        );
      case 'rejected':
        return (
          <Chip
            label="拒否済み"
            size="small"
            sx={{
              bgcolor: "#FFEBEE",
              color: "#D32F2F",
              border: 1,
              borderColor: "#FFCDD2",
              fontWeight: 500,
              fontSize: "0.75rem",
            }}
          />
        );
      default:
        return (
          <Chip
            label="未提出"
            size="small"
            sx={{
              bgcolor: "#FEF3F2",
              color: "#D92D20",
              border: 1,
              borderColor: "#FEE4E2",
              fontWeight: 500,
              fontSize: "0.75rem",
            }}
          />
        );
    }
  };

  // Map hospital type to Japanese label with color
  const getHospitalTypeLabel = (type) => {
    switch(type) {
      case 'large_hospital':
        return { label: '大病院', color: '#1976d2' };
      case 'hospital':
        return { label: '病院', color: '#2e7d32' };
      case 'welfare':
        return { label: '福祉施設', color: '#ed6c02' };
      default:
        return { label: type, color: '#757575' };
    }
  };

  // Map hospital type to numeric value for URL
  const getHospitalTypeValue = (type) => {
    switch(type) {
      case 'large_hospital': return 1;
      case 'hospital': return 2;
      case 'welfare': return 3;
      default: return 2;
    }
  };

  // Function to get the report URL
  const getReportUrl = (report) => {
    const typeValue = getHospitalTypeValue(report.medical_center_type);
    return `/report-view?id=${report.id}&type=${typeValue}`;
  };

  // Function to handle middle-click or ctrl+click for new tab
  const handleLinkClick = (report, event) => {
    // Allow middle-click, ctrl+click, or cmd+click to open in new tab
    if (event.metaKey || event.ctrlKey || event.button === 1) {
      // These will be handled by the browser's default behavior for anchor tags
      return;
    }
    
    // For normal left-click, prevent default and navigate programmatically
    event.preventDefault();
    onReportAction(report);
  };

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: 3,
        overflow: "hidden",
        border: 1,
        borderColor: "grey.200",
        boxShadow: "0px 2px 4px -1px rgba(13, 13, 18, 0.06)",
      }}
    >
      {/* Header with export button and status filter info */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: 'grey.200',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            レポート一覧 ({filters.year}年{filters.month}月)
          </Typography>
          {filters.status !== 'all' && filters.status !== 'pendingApproval' && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                フィルター:
              </Typography>
              <Chip
                label={(() => {
                  switch(filters.status) {
                    case 'draft': return '下書き';
                    case 'submitted': return '提出済み';
                    case 'approved': return '確認済み';
                    case 'pending': return '未確認 (下書き+提出済み)';
                    default: return 'すべて';
                  }
                })()}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={onClearStatusFilter}
                sx={{ fontWeight: 500 }}
              />
            </Stack>
          )}
        </Box>

        <Tooltip title="Excelでエクスポート">
          <Button
            variant="contained"
            onClick={onExport}
            sx={{
              height: 40,
              px: 1.5,
              py: 1,
              bgcolor: "#F5F5F5",
              color: "primary.main",
              borderRadius: 1,
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              boxShadow: 1,
              minWidth: 100,
              "&:hover": {
                bgcolor: "#EEEEEE",
              },
            }}
            startIcon={<FileDownloadIcon sx={{ width: 16, height: 16 }} />}
          >
            書出
          </Button>
        </Tooltip>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 80,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  通番
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 220,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  医療機関
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 120,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  報告日
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 80,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  入院数
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 80,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  退院数
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 100,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  入院患者数
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 100,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  合計外来
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 120,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  作成情報
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 120,
                  px: 2,
                  py: 1.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  textAlign="center"
                >
                  ステータス
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderRight: 1,
                  borderBottom: 1,
                  borderColor: "grey.200",
                  width: 85,
                  px: 2,
                  py: 1.75,
                }}
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length > 0 ? (
              reports.map((row, index) => {
                const hospitalType = getHospitalTypeLabel(row.medical_center_type);
                const reportUrl = getReportUrl(row);
                const fullUrl = `${window.location.origin}${reportUrl}`;
                
                return (
                  <TableRow key={row.id || index} hover>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      <Typography variant="body2" fontWeight={500} textAlign="center">
                        {pagination.itemsPerPage * (pagination.currentPage - 1) + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          sx={{ 
                            lineHeight: 1.2,
                            wordBreak: 'break-word'
                          }}
                        >
                          {row.medical_center_name || '--'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: hospitalType.color,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            lineHeight: 1.2
                          }}
                        >
                          {hospitalType.label}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {row.formatted_date || '--'}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        textAlign="center"
                      >
                        {row.admission_count || 0}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        textAlign="center"
                      >
                        {row.discharge_count || 0}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        textAlign="center"
                      >
                        {row.inpatient_count || 0}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        textAlign="center"
                      >
                        {row.outpatient_count || 0}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      {row.creator_name ? (
                        <Stack spacing={0}>
                          <Typography variant="body2" fontWeight={500}>
                            {row.creator_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.created_date}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography
                          variant="body2"
                          fontWeight={500}
                        >
                          --
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                      }}
                    >
                      {getStatusChip(row.status)}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: "grey.200",
                        px: 2,
                        py: 1.75,
                        textAlign: "center",
                      }}
                    >
 
  <Link
    component={RouterLink}
    to={reportUrl}
    onClick={(e) => handleLinkClick(row, e)}
    underline="none"  // Removed underline
    sx={{
      color: "#0A6AE3",
      fontWeight: 600,
      fontSize: "0.875rem",
      cursor: "pointer",
      '&:hover': {
        color: "#0847A3",
        textDecoration: 'none', // Ensure no underline on hover too
      },
    }}
  >
    表示
  </Link>
                     </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    レポートが見つかりません
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {reports.length > 0 && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2 }}
        >
          <Typography variant="caption" fontWeight={500} color="text.primary">
            Page {pagination.currentPage} of {pagination.totalPages}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              onClick={() => pagination.currentPage > 1 && onPageChange(pagination.currentPage - 1)}
              sx={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.paper",
                borderRadius: 2,
                border: 1,
                borderColor: "grey.200",
                cursor: pagination.currentPage > 1 ? "pointer" : "not-allowed",
                opacity: pagination.currentPage > 1 ? 1 : 0.5,
              }}
            >
              <ChevronLeft sx={{ width: 20, height: 20 }} />
            </Box>

            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={(e, page) => onPageChange(page)}
              siblingCount={1}
              boundaryCount={1}
              shape="rounded"
              renderItem={(item) => (
                <PaginationItem
                  {...item}
                  sx={{
                    minWidth: 32,
                    height: 32,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    border: 1,
                    borderColor: "grey.200",
                    borderRadius: 0,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    },
                    "&:first-of-type": {
                      borderTopLeftRadius: 8,
                      borderBottomLeftRadius: 8,
                    },
                    "&:last-of-type": {
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8,
                    },
                  }}
                />
              )}
              sx={{
                "& .MuiPagination-ul": {
                  gap: 0,
                  "& li:not(:last-child) button": {
                    borderRight: 0,
                  },
                },
              }}
            />

            <Box
              onClick={() => pagination.currentPage < pagination.totalPages && onPageChange(pagination.currentPage + 1)}
              sx={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.paper",
                borderRadius: 2,
                border: 1,
                borderColor: "grey.200",
                cursor: pagination.currentPage < pagination.totalPages ? "pointer" : "not-allowed",
                opacity: pagination.currentPage < pagination.totalPages ? 1 : 0.5,
              }}
            >
              <ChevronRight sx={{ width: 20, height: 20 }} />
            </Box>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

export default MainContentSection;