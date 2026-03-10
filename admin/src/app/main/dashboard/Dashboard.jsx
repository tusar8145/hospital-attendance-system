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
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Home,
  Business,
  People,
  Person,
  MoreVert,
  CheckCircle,
  Pending,
  Drafts,
  Send,
  Download,
  Visibility,
  Edit,
  Search,
  Add,
  List,
  Analytics,
  PersonAdd,
  MedicalServices,
  ReportProblem,
  Done,
  CheckCircleOutline,
  ArrowForward
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector } from 'app/store/hooks';
import { selectUser } from 'src/app/auth/user/store/userSlice';
import { CommonHeader } from '../../shared-components/new/CommonHeader';
import FusePageSimple from '@fuse/core/FusePageSimple';
import apiConfig from '../../configs/apiConfig';
import BusinessIcon from '@mui/icons-material/Business';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

// Styled components with fixed CSS
const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider
  },

  '& .FusePageSimple-content': {

   overflow: 'auto',
   height: '100%',
  },

  '& .FusePageSimple-wrapper': {
  height: '100%',
  }
}));


const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const PendingApprovalCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  position: 'relative',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    '& .arrow-icon': {
      transform: 'translateX(4px)'
    }
  }
}));

const StatCard = ({ title, value, icon, color, trend, trendValue, subtitle }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? '#10B981' : '#EF4444';

  return (
    <StyledCard>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{
            backgroundColor: `${color}15`,
            borderRadius: '12px',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TrendIcon sx={{ fontSize: 16, color: trendColor, mr: 0.5 }} />
            <Typography variant="caption" sx={{ color: trendColor, fontWeight: 500 }}>
              {trendValue}
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

const ReportCard = ({ report, onView, onEdit, userRole }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      draft: { color: 'warning', label: '草稿', icon: <Drafts fontSize="small" /> },
      submitted: { color: 'info', label: '提出済み', icon: <Send fontSize="small" /> },
      approved: { color: 'success', label: '承認済み', icon: <CheckCircle fontSize="small" /> },
      rejected: { color: 'error', label: '拒否済み', icon: <Pending fontSize="small" /> }
    };

    const config = statusConfig[status] || { color: 'default', label: status, icon: null };
    
    return (
      <Chip
        size="small"
        icon={config.icon}
        label={config.label}
        color={config.color}
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getHospitalTypeText = (type) => {
    const typeMap = {
      large_hospital: '大病院',
      hospital: '病院',
      welfare: '福祉施設'
    };
    return typeMap[type] || type;
  };

  const canEdit = userRole === 'superAdmin' || userRole === 'admin' || 
                  (userRole === 'hospitalAssistant' && report.status === 'draft');

  return (
    <StyledCard>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap>
              {report.medical_center_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getStatusChip(report.status)}
              <Chip
                size="small"
                label={getHospitalTypeText(report.medical_center_type || report.hospital_type)}
                variant="outlined"
                sx={{ fontWeight: 400 }}
              />
            </Box>
          </Box>
        </Box>


        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              報告日
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {report.formatted_date}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              作成者
            </Typography>
            <Typography variant="body2" fontWeight={500} noWrap>
              {report.creator_name}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              入院患者数
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {report.inpatient_count}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">
              外来患者数
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {report.outpatient_count}
            </Typography>
          </Grid>
        </Grid>

        {report.special_notes && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
              備考
            </Typography>
            <Typography variant="body2" sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.4
            }}>
              {report.special_notes}
            </Typography>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

const HospitalCard = ({ hospital, onManage, onViewReports }) => {
  return (
    <StyledCard>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            backgroundColor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {hospital.logo && hospital.logo !== 'No logo' ? (
              <img 
                src={`${apiConfig.baseURL}/uploads/${hospital.logo}`} 
                alt={hospital.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }}
              />
            ) : (
              <Business sx={{ color: 'primary.main', fontSize: 24 }} />
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap>
              {hospital.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                size="small"
                label={hospital.typeText}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 400 }}
              />
            </Box>
          </Box>
        </Box>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MedicalServices fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                診療科
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={500}>
              {hospital.departmentCount}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                医師
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={500}>
              {hospital.doctorCount}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </StyledCard>
  );
};

function Dashboard() {
  const { t } = useTranslation('shared-components');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  
  const user = useAppSelector(selectUser);
  const userRole = user?.role || 'operator';
  
  const { hospital } = useAppTheme();

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState({
    reportStats: {
      draft: 0,
      submitted: 0,
      approved: 0,
      pending: 0,
      total: 0
    },
    medicalCenterStats: {
      total: 0,
      byType: {
        large_hospital: 0,
        hospital: 0,
        welfare: 0
      },
      list: []
    },
    departmentStats: {
      total: 0,
      byHospital: []
    },
    doctorStats: {
      total: 0,
      byHospital: []
    },
    recentReports: [],
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
    userRole: userRole,
    myreport: 0 // Added myreport field
  });

  // Filter states
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('reports'); // 'reports', 'hospitals', 'departments', 'doctors'

  // Get welcome message based on role
  const getWelcomeMessage = () => {
    const messages = {
      superAdmin: 'システム管理者ダッシュボードへようこそ',
      admin: '管理者ダッシュボードへようこそ',
      hospitalAssistant: '病院アシスタントダッシュボードへようこそ',
      staff: 'スタッフダッシュボードへようこそ',
      operator: 'データ入力者ダッシュボードへようこそ'
    };
    return messages[userRole] || 'ダッシュボードへようこそ';
  };

  // Get quick actions based on role
  const getQuickActions = () => {
    const actions = {
      superAdmin: [
        { label: '新規レポート作成', icon: <Add />, link: '/report-entry', color: 'primary' },
        { label: 'レポート一覧', icon: <List />, link: '/report-list?status=all', color: 'success' },
        { label: '医療機関管理', icon: <BusinessIcon />, link: '/medical-center', color: 'secondary' },
        { label: '医師管理', icon: <Person />, link: '/doctor', color: 'warning' },
      ],
      admin: [
        { label: '新規レポート作成', icon: <Add />, link: '/report-entry', color: 'primary' },
        { label: 'レポート一覧', icon: <List />, link: '/report-list?status=all', color: 'success' },
        { label: '医療機関管理', icon: <BusinessIcon />, link: '/medical-center', color: 'secondary' },
        { label: '医師管理', icon: <Person />, link: '/doctor', color: 'warning' },
      ],
      hospitalAssistant: [
        { label: '新規レポート作成', icon: <Add />, link: '/report-entry', color: 'primary' },
        { label: 'レポート一覧', icon: <List />, link: '/report-list?status=all', color: 'success' },
        { label: '診療科管理', icon: <MedicalServices />, link: '/department', color: 'info' },
        { label: '医師管理', icon: <Person />, link: '/doctor', color: 'warning' },
      ],
      staff: [
        { label: '新規レポート作成', icon: <Add />, link: '/report-entry', color: 'primary' },
        { label: '下書きレポート', icon: <Drafts />, link: '/report-list?status=draft', color: 'secondary' },
        { label: '提出済みレポート', icon: <CheckCircleOutline />, link: '/report-list?status=submitted', color: 'success' },
        { label: '未確認 レポート', icon: <ReportProblem />, link: '/report-list?status=pending', color: 'warning' },
      ],
      operator: [ 
        { label: '新規レポート作成', icon: <Add />, link: '/report-entry', color: 'primary' },
        { label: '下書きレポート', icon: <Drafts />, link: '/report-list?status=draft', color: 'secondary' },
        { label: '提出済みレポート', icon: <CheckCircleOutline />, link: '/report-list?status=submitted', color: 'success' },
        { label: '未確認 レポート', icon: <ReportProblem />, link: '/report-list?status=pending', color: 'warning' },
      ]
    };
    return actions[userRole] || [];
  };

  // Fetch dashboard statistics
  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/dashboard/stats`, {
        month: monthFilter,
        year: yearFilter,
        hospital_id:hospital?.id || null
      });

      if (response.data.success) {
        setDashboardData(prev => ({
          ...prev,
          reportStats: response.data.data.reportStats,
          medicalCenterStats: response.data.data.medicalCenterStats,
          departmentStats: response.data.data.departmentStats,
          doctorStats: response.data.data.doctorStats,
          currentMonth: response.data.data.currentMonth,
          currentYear: response.data.data.currentYear,
          userRole: response.data.data.userRole,
          myreport: response.data.data.myreport || 0 // Add myreport from response
        }));
      } else {
        setFailAlert('ダッシュボードデータの取得に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setFailAlert('統計データの取得中にエラーが発生しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setStatsLoading(false);
      setLoading(false);
    }
  };

  // Fetch recent reports
  const fetchRecentReports = async () => {
    try {
      setReportsLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/dashboard/recent-reports`, {
        limit: 6
      });

      if (response.data.success) {
        setDashboardData(prev => ({
          ...prev,
          recentReports: response.data.data.reports
        }));
      }
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchRecentReports();
  }, [monthFilter, yearFilter, hospital?.id]);

  // Handle view report
  const handleViewReport = (report) => {
    const reportDate = new Date(report.report_date);
    const year = reportDate.getFullYear();
    const month = String(reportDate.getMonth() + 1).padStart(2, '0');
    const day = String(reportDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    const hospitalId = report.medical_center_id;
    
    // Determine report type based on hospital type
    let reportType = 'report-entry-mid';
    if (report.hospital_type === 'large_hospital') {
      reportType = 'report-entry-large';
    } else if (report.hospital_type === 'welfare') {
      reportType = 'report-welfare';
    } else if (report.medical_center_type === 'large_hospital') {
      reportType = 'report-entry-large';
    } else if (report.medical_center_type === 'welfare') {
      reportType = 'report-welfare';
    }
    
    navigate(`/${reportType}?hospitalId=${hospitalId}&date=${formattedDate}&fromView=true&reportId=${report.id}`);
  };

  // Handle edit report
  const handleEditReport = (report) => {
    if (report.status === 'approved') {
      setFailAlert('承認済みのレポートは編集できません');
      setTimeout(() => setFailAlert(null), 3000);
      return;
    }

    const reportDate = new Date(report.report_date);
    const year = reportDate.getFullYear();
    const month = String(reportDate.getMonth() + 1).padStart(2, '0');
    const day = String(reportDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    const hospitalId = report.medical_center_id;
    
    // Determine report type
    let reportType = 'report-entry-mid';
    if (report.hospital_type === 'large_hospital') {
      reportType = 'report-entry-large';
    } else if (report.hospital_type === 'welfare') {
      reportType = 'report-welfare';
    } else if (report.medical_center_type === 'large_hospital') {
      reportType = 'report-entry-large';
    } else if (report.medical_center_type === 'welfare') {
      reportType = 'report-welfare';
    }
    
    navigate(`/${reportType}?hospitalId=${hospitalId}&date=${formattedDate}&reportId=${report.id}`);
  };

  // Handle view hospital reports
  const handleViewHospitalReports = (hospital) => {
    navigate(`/reports?hospitalId=${hospital.id}`);
  };

  // Handle manage hospital
  const handleManageHospital = (hospital) => {
    navigate(`/medical-center/edit/${hospital.id}`);
  };

  // Handle create new report
  const handleCreateReport = () => {
    navigate('/report-entry');
  };

  // Handle quick action click
  const handleQuickAction = (action) => {
    if (action.link) {
      navigate(action.link);
    }
  };

  // Handle My Pending Approval click
  const handlePendingApprovalClick = () => {
    navigate('/report-list?status=pendingApproval');
  };

  // Get current Japanese date
  const getCurrentJapaneseDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    return `${year}年${month}月${date}日`;
  };

  // Filter reports based on search query
  const filteredReports = Array.isArray(dashboardData.recentReports) 
    ? dashboardData.recentReports.filter(report => 
        (report.medical_center_name && report.medical_center_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (report.report_no && report.report_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (report.special_notes && report.special_notes.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`
  }));

  // Year options (last 3 years and next year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - 2 + i,
    label: `${currentYear - 2 + i}年`
  }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>ダッシュボードを読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Root
      header={<></>}
      content={
        <Box sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
      //    minHeight: '100%',
          width: '100%'
        }}>
          {/* Alerts */}
          {successAlert && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessAlert(null)}>
              {successAlert}
            </Alert>
          )}
          {failAlert && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFailAlert(null)}>
              {failAlert}
            </Alert>
          )}

          {/* My Pending Approval Card - Only shown for specific roles with pending reports */}
     
            <Box sx={{ mb: 4 }}>
              <PendingApprovalCard>
                <CardContent sx={{ p: 3 }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '50%',
                          width: 60,
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircle sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        <Box>
                          <Typography variant="h5" fontWeight={600} gutterBottom>
                            マイ保留承認レポート
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            あなたの承認が必要なレポートがあります
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 2 }}>
                        <Box sx={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          borderRadius: '50%',
                          width: 64,
                          height: 64,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                        }}>
                          <Typography variant="h4" fontWeight={700}>
                            {dashboardData.myreport}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                            件保留中
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          onClick={handlePendingApprovalClick}
                          sx={{
                            backgroundColor: 'white',
                            color: '#667eea',
                            fontWeight: 600,
                            px: 3,
                            py: 1.2,
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                          endIcon={<ArrowForward className="arrow-icon" sx={{ transition: 'transform 0.2s' }} />}
                        >
                          ビュー
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </PendingApprovalCard>
            </Box>
  

          {/* Quick Actions */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              クイックアクション
            </Typography>
            <Grid container spacing={2}>
              {getQuickActions().map((action, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        backgroundColor: `${action.color}.light`
                      }
                    }}
                    onClick={() => handleQuickAction(action)}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Box sx={{
                        color: `${action.color}.main`,
                        mb: 1.5
                      }}>
                        {action.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={500} color="text.primary">
                        {action.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Statistics Cards */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              今月の統計 ({monthFilter}月)
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="今月のレポート草稿"
                  value={dashboardData.reportStats.draft}
                  icon={<Drafts sx={{ color: 'warning.main' }} />}
                  color="warning"
                  trend={dashboardData.reportStats.draft > 0 ? 'up' : 'down'}
                  trendValue={`前月比 ${dashboardData.reportStats.draft > 0 ? '+' : ''}${dashboardData.reportStats.draft}`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="今月提出済レポート"
                  value={dashboardData.reportStats.submitted}
                  icon={<Send sx={{ color: 'info.main' }} />}
                  color="info"
                  trend={dashboardData.reportStats.submitted > 0 ? 'up' : 'down'}
                  trendValue={`前月比 ${dashboardData.reportStats.submitted > 0 ? '+' : ''}${dashboardData.reportStats.submitted}`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="確定レポート"
                  value={dashboardData.reportStats.approved}
                  icon={<CheckCircle sx={{ color: 'success.main' }} />}
                  color="success"
                  trend={dashboardData.reportStats.approved > 0 ? 'up' : 'down'}
                  trendValue={`前月比 ${dashboardData.reportStats.approved > 0 ? '+' : ''}${dashboardData.reportStats.approved}`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="未確認レポート"
                  value={dashboardData.reportStats.pending}
                  icon={<Pending sx={{ color: 'error.main' }} />}
                  color="error"
                  trend={dashboardData.reportStats.pending > 0 ? 'up' : 'down'}
                  trendValue={`前月比 ${dashboardData.reportStats.pending > 0 ? '+' : ''}${dashboardData.reportStats.pending}`}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Filter Section */}
         {/*  <Paper sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                表示フィルター:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>月を選択</InputLabel>
                <Select
                  value={monthFilter}
                  label="月を選択"
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  {monthOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>年を選択</InputLabel>
                <Select
                  value={yearFilter}
                  label="年を選択"
                  onChange={(e) => setYearFilter(e.target.value)}
                >
                  {yearOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Chip
                  label={`全医療機関を表示中 (${dashboardData.medicalCenterStats.total})`}
                  variant="outlined"
                  color="primary"
                />
              </Box>
            </Box>
          </Paper>*/}
<br></br>
          {/* View Mode Tabs */}
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ display: 'inline-flex', p: 0.5, borderRadius: 2 }}>
              {['reports', 'hospitals', 'departments', 'doctors'].map((mode) => (
                <Chip
                  key={mode}
                  label={
                    mode === 'reports' ? 'レポート一覧' :
                    mode === 'hospitals' ? '施設一覧' :
                    mode === 'departments' ? '診療科リスト' :
                    '医師一覧'
                  }
                  onClick={() => setViewMode(mode)}
                  color={viewMode === mode ? 'primary' : 'default'}
                  variant={viewMode === mode ? 'filled' : 'outlined'}
                  sx={{ mx: 0.5, borderRadius: 1 }}
                />
              ))}
            </Paper>
          </Box>

          {/* Content based on view mode */}
          {viewMode === 'reports' && (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                レポート一覧 ({yearFilter}年{monthFilter}月)
              </Typography>
              
              {reportsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredReports.length > 0 ? (
                <Grid container spacing={3}>
                  {filteredReports.map((report) => (
                    <Grid item xs={12} sm={6} md={4} key={report.id}>
                      <ReportCard
                        report={report}
                        onView={handleViewReport}
                        onEdit={handleEditReport}
                        userRole={userRole}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Assessment sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    表示するレポートがありません
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {searchQuery 
                      ? '検索条件に一致するレポートが見つかりませんでした'
                      : '選択された期間にはレポートが作成されていません'
                    }
                  </Typography>
                </Paper>
              )}
            </>
          )}

          {viewMode === 'hospitals' && (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                施設一覧
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  合計: {dashboardData.medicalCenterStats.total} 施設
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    icon={<Home />}
                    label={`大病院: ${dashboardData.medicalCenterStats.byType.large_hospital}`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<Business />}
                    label={`病院: ${dashboardData.medicalCenterStats.byType.hospital}`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<People />}
                    label={`福祉施設: ${dashboardData.medicalCenterStats.byType.welfare}`}
                    variant="outlined"
                  />
                </Box>
              </Box>

              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : dashboardData.medicalCenterStats.list.length > 0 ? (
                <Grid container spacing={3}>
                  {dashboardData.medicalCenterStats.list.map((hospital) => (
                    <Grid item xs={12} sm={6} md={4} key={hospital.id}>
                      <HospitalCard
                        hospital={hospital}
                        onManage={handleManageHospital}
                        onViewReports={handleViewHospitalReports}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Business sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    表示する施設がありません
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    あなたに割り当てられた施設はありません
                  </Typography>
                </Paper>
              )}
            </>
          )}

          {viewMode === 'departments' && (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                診療科リスト
              </Typography>
              
              <Paper sx={{ mb: 3, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    操作
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    合計: {dashboardData.departmentStats.total} 診療科
                  </Typography>
                </Box>
                
                {statsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : dashboardData.departmentStats.byHospital.length > 0 ? (
                  <Grid container spacing={2}>
                    {dashboardData.departmentStats.byHospital.map((dept, index) => (
                      <Grid item xs={12} key={dept.id}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body1" fontWeight={500}>
                                  {index + 1}
                                </Typography>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {dept.name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {dept.hospitalName} • 階: {dept.floor}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                  size="small"
                                  label={`医師 ${dept.doctorCount}名`}
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {dept.createdDate}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary">
                      診療科データがありません
                    </Typography>
                  </Box>
                )}
              </Paper>
            </>
          )}

          {viewMode === 'doctors' && (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                医師一覧
              </Typography>
              
              <Paper sx={{ mb: 3, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    操作
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    合計: {dashboardData.doctorStats.total} 医師
                  </Typography>
                </Box>
                
                {statsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : dashboardData.doctorStats.byHospital.length > 0 ? (
                  <Grid container spacing={2}>
                    {dashboardData.doctorStats.byHospital.map((doctor, index) => (
                      <Grid item xs={12} key={doctor.id}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body1" fontWeight={500}>
                                  {index + 1}
                                </Typography>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {doctor.name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {doctor.hospitalName}
                                    {doctor.licenseNo && ` •  ${doctor.licenseNo}`}
                                    {doctor.departments && ` • 担当診療科: ${doctor.departments}`}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="caption" color="textSecondary">
                                  {doctor.createdDate}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary">
                      医師データがありません
                    </Typography>
                  </Box>
                )}
              </Paper>
            </>
          )}

          {/* Recent Activity Summary */}
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              システム概要
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    レポート作成状況 ({dashboardData.currentYear}年{dashboardData.currentMonth}月)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(dashboardData.reportStats.approved / Math.max(dashboardData.reportStats.total, 1)) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="success"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      確定率: {Math.round((dashboardData.reportStats.approved / Math.max(dashboardData.reportStats.total, 1)) * 100)}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {dashboardData.reportStats.approved} / {dashboardData.reportStats.total}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    医療機関タイプ分布
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, height: 8 }}>
                    <Box
                      sx={{
                        flex: dashboardData.medicalCenterStats.byType.large_hospital,
                        backgroundColor: 'primary.main',
                        borderRadius: 4
                      }}
                    />
                    <Box
                      sx={{
                        flex: dashboardData.medicalCenterStats.byType.hospital,
                        backgroundColor: 'secondary.main',
                        borderRadius: 4
                      }}
                    />
                    <Box
                      sx={{
                        flex: dashboardData.medicalCenterStats.byType.welfare,
                        backgroundColor: 'success.main',
                        borderRadius: 4
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      大病院: {dashboardData.medicalCenterStats.byType.large_hospital}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      病院: {dashboardData.medicalCenterStats.byType.hospital}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      福祉: {dashboardData.medicalCenterStats.byType.welfare}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  pt: 2,
                  borderTop: 1,
                  borderColor: 'divider'
                }}>
                  <Typography variant="caption" color="textSecondary">
                    ログイン中のユーザー: {user?.name || '不明'} ({userRole})
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    最終更新: {getCurrentJapaneseDate()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      }
    />
  );
}

export default Dashboard;