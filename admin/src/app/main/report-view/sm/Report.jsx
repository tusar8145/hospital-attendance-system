import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';
import { useAppSelector } from 'app/store/hooks';
import { selectUser } from 'src/app/auth/user/store/userSlice';
import HeaderSection from '../HeaderSection';
import StatusConfirmationSection from '../StatusConfirmationSection';
import ManagementComments from '../ManagementComments';
import apiConfig from '../../../configs/apiConfig';

// Styled components
const StyledContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  width: '100%',
  padding: theme.spacing(4, 6, 8),
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4),
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(2),
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 0,
  border: '1px solid #e0e0e0',
}));

// Helper function to render circles
const renderCircles = (count) => {
  return '○'.repeat(Math.min(count || 0, 60));
};

// 1. Conference and Special Notes Section
const ConferenceSpecialNotesSection = ({ welfareData }) => {
  const headerData = [
    { label: '会議・行事等', circles: 60 },
    { label: '特記事項', circles: 60 },
  ];

  return (
    <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 0 }}>
      <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
        <TableBody>
          {headerData.map((row, index) => (
            <TableRow key={index}>
              <TableCell
                sx={{
                  border: '1px solid #e0e0e0',
                  width: '150px',
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 0
                }}
              >
                {row.label}
              </TableCell>
              <TableCell sx={{ 
                border: '1px solid #e0e0e0', 
                padding: '8px',
                borderRadius: 0
              }}>
                <Typography variant="body2" sx={{ 
                  letterSpacing: '0.5px',
                  lineHeight: 1.2,
                  minHeight: '40px'
                }}>
                  {index === 0 
                    ? welfareData?.conference_events || renderCircles(row.circles)
                    : welfareData?.special_notes_section || renderCircles(row.circles)
                  }
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// 2. Daily Visitors Section (入所者状況) - Updated to 3 columns
const DailyVisitorsSection = ({ welfareData, capacities }) => {
  const sectionNames = ['入所', '短期入所', '合計'];
  
  // Calculate totals
  const calculateTotal = (field1, field2) => {
    const val1 = welfareData?.[field1] || 0;
    const val2 = welfareData?.[field2] || 0;
    return val1 + val2;
  };

  const section1Capacity = capacities?.section1_capacity || 0;
  const section2Capacity = capacities?.section2_capacity || 0;
  const totalCapacity = section1Capacity + section2Capacity;

  const dailyVisitorRows = [
    { 
      label: '定員', 
      values: [
        `${section1Capacity}`,
        `${section2Capacity}`,
        `${totalCapacity}`
      ],
      bold: false
    },
    { 
      label: '前日 入所者数', 
      values: [
        `${welfareData?.section1_admission_count || 0}`,
        `${welfareData?.section2_admission_count || 0}`,
        `${calculateTotal('section1_admission_count', 'section2_admission_count')}`
      ],
      bold: false
    },
    { 
      label: '当日 入所者数', 
      values: [
        `${welfareData?.section1_admission_treated || 0}`,
        `${welfareData?.section2_admission_treated || 0}`,
        `${calculateTotal('section1_admission_treated', 'section2_admission_treated')}`
      ],
      bold: false
    },
    { 
      label: '当日 退所者数', 
      values: [
        `${welfareData?.section1_discharge_treated || 0}`,
        `${welfareData?.section2_discharge_treated || 0}`,
        `${calculateTotal('section1_discharge_treated', 'section2_discharge_treated')}`
      ],
      bold: false
    },
    { 
      label: '外泊・入院者数（入所扱い）', 
      values: [
        `${welfareData?.section1_outside_hospital || 0}`,
        `${welfareData?.section2_outside_hospital || 0}`,
        `${calculateTotal('section1_outside_hospital', 'section2_outside_hospital')}`
      ],
      bold: false
    },
    { 
      label: '入院者数（退所扱い）', 
      values: [
        `${welfareData?.section1_hospitalization_count || 0}`,
        `${welfareData?.section2_hospitalization_count || 0}`,
        `${calculateTotal('section1_hospitalization_count', 'section2_hospitalization_count')}`
      ],
      bold: false
    },
    { 
      label: '当日末 入所者数', 
      values: [
        `${welfareData?.section1_today_end_users || 0}`,
        `${welfareData?.section2_today_end_users || 0}`,
        `${calculateTotal('section1_today_end_users', 'section2_today_end_users')}`
      ],
      bold: true
    }
  ];

  const monthlyDataRows = [
    { 
      label: '当月 入所者数', 
      values: [
        `${welfareData?.section1_monthly_admission || 0}`,
        `${welfareData?.section2_monthly_admission || 0}`,
        `${calculateTotal('section1_monthly_admission', 'section2_monthly_admission')}`
      ],
      bold: false
    },
    { 
      label: '当月 平均入所者数', 
      values: [
        `${welfareData?.section1_monthly_avg || 0}`,
        `${welfareData?.section2_monthly_avg || 0}`,
        `${calculateTotal('section1_monthly_avg', 'section2_monthly_avg')}`
      ],
      bold: false
    },
    { 
      label: '当月 稼働率', 
      values: [
        `${welfareData?.section1_monthly_utilization || 0}%`,
        `${welfareData?.section2_monthly_utilization || 0}%`,
        `${(((welfareData?.section1_monthly_avg || 0) + (welfareData?.section2_monthly_avg || 0)) / totalCapacity * 100).toFixed(1)}%`
      ],
      bold: false
    }
  ];

  const annualDataRows = [
    { 
      label: '年度 延入所者数', 
      values: [
        `${welfareData?.section1_annual_users || 0}`,
        `${welfareData?.section2_annual_users || 0}`,
        `${calculateTotal('section1_annual_users', 'section2_annual_users')}`
      ],
      bold: false
    },
    { 
      label: '年度 平均入所者数', 
      values: [
        `${welfareData?.section1_annual_avg || 0}`,
        `${welfareData?.section2_annual_avg || 0}`,
        `${calculateTotal('section1_annual_avg', 'section2_annual_avg')}`
      ],
      bold: false
    },
    { 
      label: '年度 稼働率', 
      values: [
        `${welfareData?.section1_annual_utilization || 0}%`,
        `${welfareData?.section2_annual_utilization || 0}%`,
        `${(((welfareData?.section1_annual_avg || 0) + (welfareData?.section2_annual_avg || 0)) / totalCapacity * 100).toFixed(1)}%`
      ],
      bold: false
    }
  ];

  return (
    <>
      {/* Daily Visitors Table */}
      <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 0 }}>
        <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  border: '1px solid #e0e0e0', 
                  fontWeight: 'bold',
                  width: '25%',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 0
                }}
              >
              </TableCell>
              {sectionNames.map((col, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    fontWeight: 'bold',
                    width: '25%',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 0
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dailyVisitorRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={{
                  border: '1px solid #e0e0e0',
                  fontWeight: row.bold ? 'bold' : 'normal',
                  backgroundColor: row.bold ? '#f5f5f5' : 'white',
                  width: '25%',
                  borderRadius: 0
                }}>
                  {row.label}
                </TableCell>
                {row.values.map((value, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      backgroundColor: row.bold ? '#f5f5f5' : 'white',
                      width: '25%',
                      borderRadius: 0
                    }}
                  >
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Monthly Data Table */}
      <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 0 }}>
        <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                  width: '25%',
                  borderRadius: 0
                }}
              >
                当月統計
              </TableCell>
              {sectionNames.map((col, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    width: '25%',
                    borderRadius: 0
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {monthlyDataRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={{ 
                  border: '1px solid #e0e0e0',
                  width: '25%',
                  borderRadius: 0
                }}>
                  {row.label}
                </TableCell>
                {row.values.map((value, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      width: '25%',
                      borderRadius: 0
                    }}
                  >
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Annual Data Table */}
      <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 0 }}>
        <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                  width: '25%',
                  borderRadius: 0
                }}
              >
                年度統計
              </TableCell>
              {sectionNames.map((col, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    width: '25%',
                    borderRadius: 0
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {annualDataRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={{ 
                  border: '1px solid #e0e0e0',
                  width: '25%',
                  borderRadius: 0
                }}>
                  {row.label}
                </TableCell>
                {row.values.map((value, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      width: '25%',
                      borderRadius: 0
                    }}
                  >
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

// 3. Daily Users Section (利用者状況) - 4 columns for sections 4,5,6,7
const DailyUsersSection = ({ welfareData, sectionNames, capacities }) => {
  const sections = ['section4', 'section5', 'section6', 'section7'];
  
  // Get section capacities
  const getCapacity = (section) => {
    switch(section) {
      case 'section4': return capacities?.section4_capacity || 0;
      case 'section5': return capacities?.section5_capacity || 0;
      case 'section6': return capacities?.section6_capacity || 0;
      case 'section7': return capacities?.section7_capacity || 0;
      default: return 0;
    }
  };

  const dailyUserRows = [
    { 
      label: '定員', 
      getValue: (section) => `${getCapacity(section)}`
    },
    { 
      label: '当日 利用者数', 
      getValue: (section) => `${welfareData?.[`${section}_daily_users`] || 0}`,
      bold: true
    },
    { 
      label: '当月 利用者数累計', 
      getValue: (section) => `${welfareData?.[`${section}_monthly_users_cumulative`] || 0}`
    },
    { 
      label: '当月 平均利用者数', 
      getValue: (section) => `${welfareData?.[`${section}_monthly_avg`] || 0}`
    },
    { 
      label: '当月 稼働率', 
      getValue: (section) => `${welfareData?.[`${section}_monthly_utilization`] || 0}%`
    },
  ];

  const yearlyUserRows = [
    { 
      label: '年度 利用者数累計', 
      getValue: (section) => `${welfareData?.[`${section}_annual_users`] || 0}`
    },
    { 
      label: '年度 平均利用者数', 
      getValue: (section) => `${welfareData?.[`${section}_annual_avg`] || 0}`
    },
    { 
      label: '年度 稼働率', 
      getValue: (section) => `${welfareData?.[`${section}_annual_utilization`] || 0}%`
    },
  ];

  return (
    <>
      {/* Daily Users Table */}
      <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 0 }}>
        <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  border: '1px solid #e0e0e0', 
                  fontWeight: 'bold',
                  width: '20%',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 0
                }}
              >
              </TableCell>
              {sections.map((section, index) => (
                <TableCell
                  key={section}
                  align="center"
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    fontWeight: 'bold',
                    width: '20%',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 0
                  }}
                >
                  {sectionNames?.[section] || `セクション${index + 4}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dailyUserRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={{
                  border: '1px solid #e0e0e0',
                  fontWeight: row.bold ? 'bold' : 'normal',
                  backgroundColor: row.bold ? '#f5f5f5' : 'white',
                  width: '20%',
                  borderRadius: 0
                }}>
                  {row.label}
                </TableCell>
                {sections.map((section, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      backgroundColor: row.bold ? '#f5f5f5' : 'white',
                      width: '20%',
                      borderRadius: 0
                    }}
                  >
                    {row.getValue(section)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Yearly Users Table */}
      <TableContainer component={Paper} sx={{ mb: 2, borderRadius: 0 }}>
        <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  border: '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                  width: '20%',
                  borderRadius: 0
                }}
              >
                年度統計
              </TableCell>
              {sections.map((section, index) => (
                <TableCell
                  key={section}
                  align="center"
                  sx={{ 
                    border: '1px solid #e0e0e0',
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    width: '20%',
                    borderRadius: 0
                  }}
                >
                  {sectionNames?.[section] || `セクション${index + 4}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {yearlyUserRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell sx={{ 
                  border: '1px solid #e0e0e0',
                  width: '20%',
                  borderRadius: 0
                }}>
                  {row.label}
                </TableCell>
                {sections.map((section, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      width: '20%',
                      borderRadius: 0
                    }}
                  >
                    {row.getValue(section)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

// 4. Vacant Bed Section
const VacantBedSection = ({ welfareData }) => {
  const vacantBedNotes = welfareData?.vacant_bed_notes || '';
  const responseNotes = welfareData?.response_notes || '';
  
  const bottomSectionData = [
    { reason: vacantBedNotes, response: responseNotes },
  ];

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
      <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{
              border: '1px solid #e0e0e0',
              fontWeight: 'bold',
              width: '50%',
              backgroundColor: '#f5f5f5',
              borderRadius: 0
            }}>
              空床発生事由
            </TableCell>
            <TableCell sx={{
              border: '1px solid #e0e0e0',
              fontWeight: 'bold',
              width: '50%',
              backgroundColor: '#f5f5f5',
              borderRadius: 0
            }}>
              対応
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bottomSectionData.map((row, index) => (
            <TableRow key={index}>
              <TableCell sx={{ 
                border: '1px solid #e0e0e0', 
                padding: '8px',
                width: '50%',
                borderRadius: 0
              }}>
                <Typography variant="body2" sx={{ letterSpacing: '0.5px' }}>
                  {row.reason || renderCircles(40)}
                </Typography>
              </TableCell>
              <TableCell sx={{ 
                border: '1px solid #e0e0e0', 
                padding: '8px',
                width: '50%',
                borderRadius: 0
              }}>
                <Typography variant="body2" sx={{ letterSpacing: '0.5px' }}>
                  {row.response || renderCircles(40)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Main Report Component
function Report({ reportId, initialData, hospitalType, onRefresh }) {
  const { t } = useTranslation('shared-components');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(!initialData);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const user = useAppSelector(selectUser);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
    actionType: '' // 'approval' or 'draft'
  });

  const [reportData, setReportData] = useState(() => {
    if (initialData) {
      return initialData;
    }
    
    return {
      report: null,
      welfare_data: null,
      section_names: {},
      exists: false,
      report_comments: [],
      capacities: {}
    };
  });

  useEffect(() => {
    if (initialData) {
      setReportData(initialData);
      setReportLoading(false);
    } else if (reportId) {
      fetchReportById();
    } else {
      setReportLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReportById = async () => {
    if (!reportId) {
      setReportLoading(false);
      return;
    }
    
    try {
      setReportLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/report-welfare/get-by-id`, {
        report_id: reportId
      });
      
      if (response.data.success) {
        const reportData = response.data.data;
        
        // Process special notes as first comment if it exists
        if (reportData.report?.special_notes) {
          const specialNotesComment = {
            id: -1,
            comment: reportData.report.special_notes,
            created_at: reportData.report.created_at,
            admin: reportData.report.created_by_admin,
            admin_id: reportData.report.created_by,
            can_edit: false,
            is_special_notes: true
          };
          
          if (!reportData.report_comments) {
            reportData.report_comments = [];
          }
          
          const hasSpecialNotes = reportData.report_comments.some(
            comment => comment.is_special_notes === true
          );
          
          if (!hasSpecialNotes) {
            reportData.report_comments.unshift(specialNotesComment);
          }
        }
        
        setReportData(reportData);
      } else {
        console.error('Failed to fetch report by ID');
      }
    } catch (error) {
      console.error('Error fetching report by ID:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    const createDefaultStatusData = () => {
      return [
        { 
          id: 1, 
          title: '理事長', 
          role: 'superAdmin', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-blue-500',
          disabled: true
        },
        { 
          id: 2, 
          title: '専務', 
          role: 'admin', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-green-500',
          disabled: true
        },
        { 
          id: 3, 
          title: '医師長', 
          role: 'hospitalAssistant', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-purple-500',
          disabled: true
        },
        { 
          id: 4, 
          title: '看護部', 
          role: 'staff', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-orange-500',
          disabled: true
        },
        { 
          id: 5, 
          title: '事務部', 
          role: 'operator', 
          checked: false, 
          status: '未確認', 
          date: '',
          person: '',
          avatar: '?',
          approver: '',
          color: 'bg-pink-500',
          disabled: true
        }
      ];
    };

    if (reportData.approvals && reportData.approvals.length > 0) {
      const formattedStatusData = reportData.approvals.map(approval => {
        let title = '';
        switch (approval.admin?.role) {
          case 'superAdmin':
            title = '理事長';
            break;
          case 'admin':
            title = '専務';
            break;
          case 'ヘッドマネージャー':
            title = '部長';
            break;
          case 'staff':
            title = 'マネージャー';
            break;
          case 'operator':
            title = 'オペレーター';
            break;
          default:
            title = approval.admin?.role || 'Unknown';
        }

        const getColorForRole = (role) => {
          switch (role) {
            case 'superAdmin': return 'bg-blue-500';
            case 'admin': return 'bg-green-500';
            case 'hospitalAssistant': return 'bg-purple-500';
            case 'staff': return 'bg-orange-500';
            case 'operator': return 'bg-pink-500';
            default: return 'bg-gray-500';
          }
        };

        const formatDate = (date) => {
          if (!date) return '';
          try {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toLocaleDateString('ja-JP') + ' ' + 
                     dateObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
          } catch (error) {
            console.error('Error formatting date:', error);
          }
          return '';
        };

        return {
          id: approval.id,
          title: title,
          checked: approval.approval_status === 'approved',
          status: approval.approval_status === 'approved' ? '確認済み' : '未確認',
          date: formatDate(approval.created_at),
          person: approval.admin?.name || '',
          avatar: approval.admin?.name ? approval.admin.name.charAt(0) : '?',
          approver: approval.admin?.name || '',
          color: getColorForRole(approval.admin?.role),
          disabled: true,
          bypassed: approval.bypassed_lower_roles,
          role: approval.admin?.role
        };
      });

      const allRoles = ['superAdmin', 'admin', 'hospitalAssistant', 'staff', 'operator'];
      const existingRoles = reportData.approvals.map(a => a.admin?.role).filter(Boolean);
      const missingRoles = allRoles.filter(role => !existingRoles.includes(role));

      const defaultStatusData = [
        { id: 1, title: 'システム管理者', role: 'superAdmin', checked: false, status: '未確認', date: '', color: 'bg-blue-500', disabled: true },
        { id: 2, title: '責任管理者', role: 'admin', checked: false, status: '未確認', date: '', color: 'bg-green-500', disabled: true },
        { id: 3, title: '主任管理者', role: 'hospitalAssistant', checked: false, status: '未確認', date: '', color: 'bg-purple-500', disabled: true },
        { id: 4, title: 'マネージャー', role: 'staff', checked: false, status: '未確認', date: '', color: 'bg-orange-500', disabled: true },
        { id: 5, title: 'データ入力者', role: 'operator', checked: false, status: '未確認', date: '', color: 'bg-pink-500', disabled: true }
      ];

      missingRoles.forEach(role => {
        const defaultRole = defaultStatusData.find(d => d.role === role);
        if (defaultRole && !formattedStatusData.some(s => s.role === role)) {
          formattedStatusData.push({
            ...defaultRole,
            disabled: true
          });
        }
      });

      const roleOrder = ['superAdmin', 'admin', 'hospitalAssistant', 'staff', 'operator'];
      formattedStatusData.sort((a, b) => {
        const aIndex = roleOrder.indexOf(a.role);
        const bIndex = roleOrder.indexOf(b.role);
        return aIndex - bIndex;
      });

      setStatusData(formattedStatusData);
    } else {
      setStatusData(createDefaultStatusData());
    }
  }, [reportData.approvals]);

  const [managementComments, setManagementComments] = useState([]);

  useEffect(() => {
    const reportCommentsData = reportData.report_comments || [];
    const commentsData = reportData.comments || [];
    
    let allComments = [...reportCommentsData, ...commentsData];
    
    const uniqueComments = [];
    const seenIds = new Set();
    
    allComments.forEach(comment => {
      if (!seenIds.has(comment.id)) {
        seenIds.add(comment.id);
        uniqueComments.push(comment);
      }
    });
    
    allComments = uniqueComments;
    
    if (reportData.report?.special_notes) {
      const specialNotesExists = allComments.some(comment => 
        comment.is_special_notes === true || 
        comment.comment === reportData.report.special_notes ||
        comment.text === reportData.report.special_notes
      );
      
      if (!specialNotesExists) {
        const specialNotesComment = {
          id: -1,
          text: reportData.report.special_notes,
          comment: reportData.report.special_notes,
          time: reportData.report.created_at ? 
            new Date(reportData.report.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : 
            '00:00',
          author: reportData.report.created_by_admin?.name || 'システム',
          date: reportData.report.created_at ? 
            new Date(reportData.report.created_at).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          created_at: reportData.report.created_at,
          admin_id: reportData.report.created_by,
          can_edit: false,
          is_special_notes: true
        };
        
        allComments.unshift(specialNotesComment);
      }
    }

    if (allComments.length > 0) {
      const formattedComments = allComments.map((comment) => {
        const formatTime = (date) => {
          if (!date) return '00:00';
          try {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
          } catch (error) {
            console.error('Error formatting time:', error);
          }
          return '00:00';
        };

        const formatDate = (date) => {
          if (!date) return new Date().toISOString().split('T')[0];
          try {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting date:', error);
          }
          return new Date().toISOString().split('T')[0];
        };

        const checkCanEdit = () => {
          if (comment.is_special_notes) return false;
          if (comment.id === -1) return false;
          if (!comment.can_edit) return false;
          if (comment.admin_id !== user?.id) return false;
          if (!comment.created_at) return false;
          
          const createdDate = new Date(comment.created_at);
          const now = new Date();
          const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
          
          return createdDate >= sixHoursAgo;
        };

        const getAuthorName = () => {
          if (comment.is_special_notes && comment.id === -1) {
            return reportData.report?.created_by_admin?.name || 'システム';
          }
          return comment.admin?.name || comment.author || 'Unknown';
        };

        return {
          id: comment.id || Date.now() + Math.random(),
          text: comment.text || comment.comment || '',
          time: formatTime(comment.created_at),
          author: getAuthorName(),
          date: formatDate(comment.created_at),
          created_at: comment.created_at,
          admin_id: comment.admin_id,
          can_edit: checkCanEdit(),
          is_special_notes: comment.is_special_notes || false
        };
      });
      
      setManagementComments(formattedComments);
    } else {
      setManagementComments([]);
    }
  }, [reportData.report_comments, reportData.comments, reportData.report?.special_notes, user]);

  // Handle approval
const handleApproval = async () => {
  try {
    setLoading(true);
    const response = await axios.post(`${apiConfig.baseURL}/report/approve`, {
      report_id: reportId
    });
    
    if (response.data.success) {
      setSuccessAlert('レポートを承認しました');
      setTimeout(() => setSuccessAlert(null), 3000);
      
      if (onRefresh) {
        onRefresh();
      }
    } else {
      setFailAlert(response.data.message || '承認に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    }
  } catch (error) {
    console.error('Error approving report:', error);
    setFailAlert(error.response?.data?.message || '承認に失敗しました');
    setTimeout(() => setFailAlert(null), 3000);
  } finally {
    setLoading(false);
  }
};

const handleMakeDraft = async () => {
  try {
    setLoading(true);
    const response = await axios.post(`${apiConfig.baseURL}/report/draft`, {
      report_id: reportId
    });
    
    if (response.data.success) {
      setSuccessAlert('レポートを下書き保存しました');
      setTimeout(() => setSuccessAlert(null), 3000);
      
      if (onRefresh) {
        onRefresh();
      }
    } else {
      setFailAlert(response.data.message || '下書き保存に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    }
  } catch (error) {
    console.error('Error saving as draft:', error);
    setFailAlert(error.response?.data?.message || '下書き保存に失敗しました');
    setTimeout(() => setFailAlert(null), 3000);
  } finally {
    setLoading(false);
  }
};
  // Handle primary button click with confirmation
  const handlePrimaryButtonClick = () => {
    if (reportData.report?.status === 'approved') return;
    
    setConfirmDialog({
      open: true,
      title: '福祉施設レポートを承認しますか？',
      message: reportData.exists 
        ? '既存のレポートを承認します。この操作は取り消せません。'
        : '新しいレポートを承認します。この操作は取り消せません。',
      action: handleApproval,
      actionType: 'approval'
    });
  };

  // Handle make draft click with confirmation
  const handleMakeDraftClick = () => {
    setConfirmDialog({
      open: true,
      title: '福祉施設レポートを下書き保存しますか？',
      message: reportData.exists 
        ? '既存のレポートを下書きとして保存します。'
        : '新しいレポートを下書きとして保存します。',
      action: handleMakeDraft,
      actionType: 'draft'
    });
  };

  // Handle confirmation dialog close
  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // Handle confirmation dialog action
  const handleConfirmDialogAction = () => {
    if (confirmDialog.action) {
      confirmDialog.action();
    }
    handleConfirmDialogClose();
  };

  // Get report status text
  const getReportStatusText = () => {
    const status = reportData.report?.status;
    switch (status) {
      case 'approved': return '承認済み';
      case 'submitted': return '提出済み';
      case 'draft': return '下書き';
      case 'rejected': return '却下済み';
      default: return '不明';
    }
  };

  // Get report status color
  const getReportStatusColor = () => {
    const status = reportData.report?.status;
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (!reportData.report) return;
    
    const reportDate = new Date(reportData.report.report_date);
    const year = reportDate.getFullYear();
    const month = String(reportDate.getMonth() + 1).padStart(2, '0');
    const day = String(reportDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    const medicalCenterId = reportData.report.medical_center_id;
    
    navigate(`/report-entry?hospitalId=${medicalCenterId}&type=${hospitalType}&date=${formattedDate}&fromView=true&reportId=${reportId}`);
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setFailAlert('コメントを入力してください');
      setTimeout(() => setFailAlert(null), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/report/comment`, {
        report_id: reportId,
        comment: newComment,
        is_internal: false
      });
      
      if (response.data.success) {
        setNewComment('');
        setSuccessAlert('コメントを追加しました');
        setTimeout(() => setSuccessAlert(null), 3000);
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setFailAlert(response.data.message || 'コメントの追加に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setFailAlert(error.response?.data?.message || 'コメントの追加に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit comment
  const handleEditComment = (comment) => {
    if (comment.is_special_notes) return;
    
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  // Handle save edited comment
  const handleSaveEditedComment = async () => {
    if (!editCommentText.trim()) {
      setFailAlert('コメントを入力してください');
      setTimeout(() => setFailAlert(null), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(`${apiConfig.baseURL}/report/comment/${editingCommentId}`, {
        comment: editCommentText
      });
      
      if (response.data.success) {
        setEditingCommentId(null);
        setEditCommentText('');
        setSuccessAlert('コメントを更新しました');
        setTimeout(() => setSuccessAlert(null), 3000);
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setFailAlert(response.data.message || 'コメントの更新に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      setFailAlert(error.response?.data?.message || 'コメントの更新に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    const comment = managementComments.find(c => c.id === commentId);
    if (comment?.is_special_notes || commentId === -1) {
      setFailAlert('特記事項は削除できません');
      setTimeout(() => setFailAlert(null), 3000);
      return;
    }
    
    if (!window.confirm('このコメントを削除してもよろしいですか？')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`${apiConfig.baseURL}/report/comment/${commentId}`);
      
      if (response.data.success) {
        setSuccessAlert('コメントを削除しました');
        setTimeout(() => setSuccessAlert(null), 3000);
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setFailAlert(response.data.message || 'コメントの削除に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setFailAlert(error.response?.data?.message || 'コメントの削除に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Get report Japanese date
  const getReportJapaneseDate = () => {
    if (reportData.report?.report_date) {
      try {
        const date = new Date(reportData.report.report_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = days[date.getDay()];
        return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日（${dayOfWeek}）`;
      } catch (error) {
        console.error('Error formatting report date:', error);
      }
    }
    return '日付不明';
  };

  // Get hospital info
  const getHospitalInfo = () => {
    if (reportData.report?.medical_center) {
      const mc = reportData.report.medical_center;
      return {
        name: mc.name || '医療機関名',
        address: mc.address || '住所情報なし'
      };
    }
    return {
      name: '医療機関名',
      address: '住所情報なし'
    };
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusText = getReportStatusText();
    const colorClass = getReportStatusColor();
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}>
        <span className="mr-2">ステータス:</span>
        <span className="font-bold">{statusText}</span>
      </div>
    );
  };

  const hospitalInfo = getHospitalInfo();
  const reportDate = getReportJapaneseDate();

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
        <Typography className="ml-4">レポートデータを読み込み中...</Typography>
      </div>
    );
  }

  if (!reportData.report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Alert severity="warning" sx={{ mb: 2 }}>
          レポートが見つかりません
        </Alert>
        <Button variant="contained" onClick={() => window.history.back()}>
          戻る
        </Button>
      </div>
    );
  }

  return (
    <StyledContainer>
      {/* Alerts */}
      {successAlert && (
        <Alert severity="success" className="text-sm mb-4 animate-fade-in" onClose={() => setSuccessAlert(null)}>
          {successAlert}
        </Alert>
      )}
      {failAlert && (
        <Alert severity="error" className="text-sm mb-4 animate-fade-in" onClose={() => setFailAlert(null)}>
          {failAlert}
        </Alert>
      )}

      {/* Header Section */}
      <HeaderSection
        title={`福祉施設日報 - ${reportDate}`}
        subtitle={`${hospitalInfo.name}　　${hospitalInfo.address}`}
        primaryButtonText={reportData.report?.status === 'approved' ? '承認済み' : '承認する'}
        secondaryButtonText="編集"
        showSecondaryButton={true}
        primaryButtonColor={reportData.report?.status === 'approved' ? 'secondary' : 'success'}
        secondaryButtonColor="warning"
        onPrimaryButtonClick={handlePrimaryButtonClick}
        onSecondaryButtonClick={handleEdit}
        onMakeDraft={handleMakeDraftClick}
        showDate={true}
        customDate={reportDate}
        variant="gradient"
        loading={loading}
        reportNo={reportData.report?.report_no}
        status={reportData.report?.status}
        userRole={user?.role}
        reportExists={reportData.exists}
      >
        <div className="mt-2">
          <StatusBadge status={reportData.report?.status} />
        </div>
      </HeaderSection>

      {/* Main content with scrolling */}
      <div className="flex-1 overflow-y-auto pr-2">
        {/* Status Confirmation Section */}
        <StatusConfirmationSection
          statusData={statusData}
          onStatusChange={() => {}}
          title="確認状態一覧"
          showSummary={true}
          showDate={true}
          compact={true}
        />

        {/* Conference and Special Notes Section */}
        <div className="mt-8">
          <ConferenceSpecialNotesSection welfareData={reportData.welfare_data} />
        </div>

        {/* Daily Visitors Section */}
        <div className="mt-8">
          <Typography variant="h6" gutterBottom>
            入所者状況
          </Typography>
          <DailyVisitorsSection 
            welfareData={reportData.welfare_data} 
            capacities={reportData.capacities}
          />
        </div>

        {/* Daily Users Section */}
        <div className="mt-8">
          <Typography variant="h6" gutterBottom>
            利用者状況
          </Typography>
          <DailyUsersSection 
            welfareData={reportData.welfare_data}
            sectionNames={reportData.section_names}
            capacities={reportData.capacities}
          />
        </div>

        {/* Vacant Bed Section */}
        <div className="mt-8">
          <Typography variant="h6" gutterBottom>
            空床状況
          </Typography>
          <VacantBedSection welfareData={reportData.welfare_data} />
        </div>
        
        {/* Add Comment Section */}
        <div className="detailed-duty-table w-full mt-8">
          <div className="overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed bg-white border border-gray-300" style={{ borderRadius: 0 }}>
                <thead>
                  <tr>
                    <th className="bg-blue-600 text-white font-bold p-2 text-center border border-gray-300" colSpan="1" style={{ borderRadius: 0 }}>
                      <div className="text-md">コメントを追加</div>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>
        
        <Box sx={{ 
          p: 3, 
          border: '1px solid #e5e7eb', 
          borderRadius: 0,
          borderTop: 'none'
        }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              variant="outlined"
              size="small"
              disabled={loading}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddComment}
              disabled={loading || !newComment.trim()}
              startIcon={<SendIcon />}
              sx={{ minWidth: '100px', height: '40px' }}
            >
              {loading ? '送信中...' : '追加'}
            </Button>
          </Box>
        </Box>
        
        {/* Management Comments Section */}
        <div className="mt-8">
          <ManagementComments
            comments={managementComments}
            title="管理事項"
            showSummary={true}
            summaryMessage={managementComments.length > 0 ? managementComments[0].text : "管理事項はありません。"}
            showActionButtons={false}
            renderComment={(comment, index) => (
              <Box key={comment.id} className="relative group">
                {editingCommentId === comment.id ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={loading}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => setEditingCommentId(null)}
                        disabled={loading}
                      >
                        キャンセル
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveEditedComment}
                        disabled={loading}
                      >
                        保存
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" className="text-gray-700 leading-relaxed">
                      {comment.text}
                      {comment.is_special_notes && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          特記事項
                        </span>
                      )}
                    </Typography>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <Typography variant="caption" className="text-gray-500">
                          報告者: {comment.author} | {comment.date} {comment.time}
                        </Typography>
                        {comment.can_edit && !comment.is_special_notes && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditComment(comment)}
                              className="text-blue-500 hover:bg-blue-50"
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500 hover:bg-red-50"
                              disabled={loading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </div>
                    </div>
                  </Box>
                )}
              </Box>
            )}
          />
        </div>

        {/* Footer */}
        <Box sx={{ 
          p: 3, 
          mt: 6, 
          bgcolor: 'grey.50', 
          border: '1px solid', 
          borderColor: 'grey.200',
          borderRadius: 0
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
            <div>
              <span className="font-medium">作成者:</span> {reportData.report?.created_by_admin?.name || '不明'}
              <span className="mx-2">|</span>
              <span className="font-medium">承認者:</span> {reportData.report?.approved_by_admin?.name || '未承認'}
              <span className="mx-2">|</span>
              <span className="font-medium">コメント数:</span> {managementComments.length}
              <span className="mx-2">|</span>
              <span className="font-medium">ステータス:</span> {getReportStatusText()}
            </div>
            <div className="mt-2 sm:mt-0">
              最終更新: {reportData.report?.updated_at ? 
                new Date(reportData.report.updated_at).toLocaleDateString('ja-JP') + ' ' + 
                new Date(reportData.report.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                : reportDate + ' 00:00'}
            </div>
          </div>
        </Box>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose} color="primary" disabled={loading}>
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmDialogAction} 
            color={confirmDialog.actionType === 'approval' ? 'success' : 'primary'}
            variant="contained"
            disabled={loading}
            autoFocus
          >
            {loading ? '処理中...' : '確認'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex flex-col items-center">
            <CircularProgress />
            <Typography className="mt-4">処理中...</Typography>
          </div>
        </div>
      )}
    </StyledContainer>
  );
}

export default Report;