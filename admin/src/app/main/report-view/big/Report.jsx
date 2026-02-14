import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { 
  Box, 
  Stack, 
  Typography, 
  Paper, 
  CircularProgress, 
  TextField, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import HospitalDataTable from './components/HospitalDataTable';
import SimpleDutyTable from './components/SimpleDutyTable';
import MedicalManagementTable from './components/MedicalManagementTable';
import DetailedDutyTable from './components/DetailedDutyTable';
import DetailedDutyTable2 from './components/DetailedDutyTable2';

import VisitTable from './components/VisitTable';
import DiagnosisTable from './components/DiagnosisTable';
import PatientCountTable from './components/PatientCountTable';
import HeaderSection from '../HeaderSection';
import StatusConfirmationSection from '../StatusConfirmationSection';
import ManagementComments from '../ManagementComments';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { selectUser } from 'src/app/auth/user/store/userSlice';
import { useAppSelector } from 'app/store/hooks';
import { useNavigate } from 'react-router-dom';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider
  },
  '& .FusePageSimple-content': {},
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {}
}));

function Report({ reportId, initialData, hospitalType, onRefresh }) {
  const { t } = useTranslation('shared-components');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(!initialData);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { hospital, toggleHospital } = useTheme();
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

  // Report data state
  const [reportData, setReportData] = useState(() => {
    // Initialize with initialData if provided
    if (initialData) {
      return initialData;
    }
    
    return {
      hospitalData: {
        inpatient: {
          admission: 0,
          discharge: 0,
          current: 0
        },
        outpatient: {
          morning: 0,
          afternoon: 0,
          night: 0,
          total: 0
        }
      },
      emergencyData: {
        current: 0,
        hospitalization: 0,
        monthly: 0,
        cumulative: 0
      },
      nurseData: {
        quasiNight: [],
        midnight: []
      },
      diagnosisData: {},
      patientCountData: {},
      visitCount: 0,
      monthlyStats: {},
      report: null,
      departments: [],
      doctors: [],
      approvals: [],
      comments: []
    };
  });

  // Only run initial data setup once
  useEffect(() => {
    if (initialData) {
      setReportData(initialData);
      setReportLoading(false);
    } else if (reportId) {
      // If we have reportId but no initialData, fetch it
      fetchReportById();
    } else {
      setReportLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means run once on mount

  // Fetch report by ID (only called if we have reportId but no initialData)
  const fetchReportById = async () => {
    if (!reportId) {
      setReportLoading(false);
      return;
    }
    
    try {
      setReportLoading(true);
      const response = await axios.post(`${apiConfig.baseURL}/report/get-by-id`, {
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

  // Convert approvals to statusData format
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    // Always create default status data
    const createDefaultStatusData = () => {
      return [
        { 
          id: 1, 
          title: 'システム管理者', 
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
          title: '責任管理者', 
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
          title: '主任管理者', 
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
          title: 'マネージャー', 
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
          title: 'データ入力者', 
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
      // Map approvals to status confirmation format
      const formattedStatusData = reportData.approvals.map(approval => {
        // Determine title based on role
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

        // Get color based on role
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

        // Safely format date
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
          disabled: true, // Disable checkboxes in view mode
          bypassed: approval.bypassed_lower_roles,
          role: approval.admin?.role
        };
      });

      // Add missing roles
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

      // Sort by role hierarchy
      const roleOrder = ['superAdmin', 'admin', 'hospitalAssistant', 'staff', 'operator'];
      formattedStatusData.sort((a, b) => {
        const aIndex = roleOrder.indexOf(a.role);
        const bIndex = roleOrder.indexOf(b.role);
        return aIndex - bIndex;
      });

      setStatusData(formattedStatusData);
    } else {
      // If no approvals, show default status data
      setStatusData(createDefaultStatusData());
    }
  }, [reportData.approvals]);

  // Format comments for ManagementComments component
  const [managementComments, setManagementComments] = useState([]);

  useEffect(() => {
    // FIXED: Combine both report_comments and comments arrays
    // Use report_comments from API response if available
    const reportCommentsData = reportData.report_comments || [];
    // Use comments from API response if available
    const commentsData = reportData.comments || [];
    
    // Combine both arrays, starting with report_comments
    let allComments = [...reportCommentsData, ...commentsData];
    
    // Remove duplicates by comment ID
    const uniqueComments = [];
    const seenIds = new Set();
    
    allComments.forEach(comment => {
      if (!seenIds.has(comment.id)) {
        seenIds.add(comment.id);
        uniqueComments.push(comment);
      }
    });
    
    allComments = uniqueComments;
    
    // If report has special_notes and it's not already in comments, add it as first comment
    if (reportData.report?.special_notes) {
      // Check if special notes is already in comments (should be with is_special_notes flag)
      const specialNotesExists = allComments.some(comment => 
        comment.is_special_notes === true || 
        comment.comment === reportData.report.special_notes ||
        comment.text === reportData.report.special_notes
      );
      
      if (!specialNotesExists) {
        const specialNotesComment = {
          id: -1, // Special ID for special notes
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
        
        // Add special notes as first comment
        allComments.unshift(specialNotesComment);
      }
    }

    if (allComments.length > 0) {
      const formattedComments = allComments.map((comment, index) => {
        // Safely format time
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

        // Safely format date
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

        // Check if comment can be edited
        const checkCanEdit = () => {
          if (comment.is_special_notes) return false; // Special notes cannot be edited
          if (comment.id === -1) return false; // Special notes comment cannot be edited
          if (!comment.can_edit) return false;
          if (comment.admin_id !== user?.id) return false;
          if (!comment.created_at) return false;
          
          const createdDate = new Date(comment.created_at);
          const now = new Date();
          const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
          
          return createdDate >= sixHoursAgo;
        };

        // Get author name
        const getAuthorName = () => {
          if (comment.is_special_notes && comment.id === -1) {
            return reportData.report?.created_by_admin?.name || 'システム';
          }
          return comment.admin?.name || comment.author || 'Unknown';
        };

        // Format the comment object
        const formattedComment = {
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
        
        return formattedComment;
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
        
        // Refresh report data
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
      title: '管理日誌レポートを承認しますか？',
      message: reportData.report?.status === 'submitted'
        ? '提出済みのレポートを承認します。この操作は取り消せません。'
        : 'レポートを承認します。この操作は取り消せません。',
      action: handleApproval,
      actionType: 'approval'
    });
  };

  // Handle make draft click with confirmation
  const handleMakeDraftClick = () => {
    setConfirmDialog({
      open: true,
      title: '管理日誌レポートを下書き保存しますか？',
      message: reportData.report?.status === 'submitted'
        ? '提出済みのレポートを下書きとして保存します。'
        : 'レポートを下書きとして保存します。',
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

  // Get report status display text
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

  // Get report status color class for badge
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

  // Handle Edit button click - Navigate to report entry page
  const handleEdit = () => {
    if (!reportData.report) return;
    
    // Get report date and format it for URL
    const reportDate = new Date(reportData.report.report_date);
    const year = reportDate.getFullYear();
    const month = String(reportDate.getMonth() + 1).padStart(2, '0');
    const day = String(reportDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Get medical center ID from report
    const medicalCenterId = reportData.report.medical_center_id;
    
    // Navigate to report entry with parameters
    navigate(`/report-entry?hospitalId=${medicalCenterId}&type=${hospitalType}&date=${formattedDate}&fromView=true&reportId=${reportId}`);
  };

  // Handle adding new comment
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
        
        // Refresh report data
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

  // Handle editing a comment
  const handleEditComment = (comment) => {
    // Don't allow editing special notes
    if (comment.is_special_notes) return;
    
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  // Handle saving edited comment
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
        
        // Refresh report data
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

  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    // Check if this is special notes comment
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
        
        // Refresh report data
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

  // Get report date in Japanese format
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

  // Create status badge component
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
    <div className="flex flex-col flex-1 w-full p-4 sm:p-6 lg:p-8">
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

      {/* Header Section with Status Badge as children */}
      <HeaderSection
        title={`管理日誌レポート - ${reportDate}`}
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
        reportExists={reportData.report !== null}
        approval ={ reportData.approvals?.some(
          (a) => a.admin_id === user?.uid
        ) ?? false}  
      >
        {/* Status Badge displayed inside HeaderSection */}
        <div className="mt-2">
          <StatusBadge status={reportData.report?.status} />
        </div>
      </HeaderSection>

      {/* Status Confirmation Section */}
      <StatusConfirmationSection
        statusData={statusData}
        onStatusChange={() => {}} // Disabled in view mode
        title="確認状態一覧"
        showSummary={true}
        showDate={true}
        compact={true}
      />

      {/* Data Tables Section */}
      <div className="flex flex-col lg:flex-row gap-0 mt-40 pl-1 pr-1">
        {/* Left Area - 40% */}
        <div className="lg:w-6/12">
          <div className="p-0 h-full">
            <div className="flex flex-col h-full gap-4">
              <div className="p-0 bg-transparent flex-1">
                <div className="h-full flex justify-center">
                  <div className="text-center w-full"> 
                    <HospitalDataTable 
                      data={reportData.tableData?.hospitalData || reportData.hospitalData} 
                      total_admitted_patient={reportData.cumulativeStats.total_admitted_patient}
                      outpatient={reportData?.report?.report_details}

                      emergencyData={reportData.tableData?.emergencyData || reportData.emergencyData}
                      nurseData={reportData.tableData?.nurseData || reportData.nurseData}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Area - 20% */}
        <div className="lg:w-2/12">
          <div className="p-0 h-full">
            <div className="h-full flex justify-center">
              <div className="text-center w-full">
                <MedicalManagementTable 
                  emergencyData={reportData.tableData?.emergencyData || reportData.emergencyData}
                  nurseData={reportData.tableData?.nurseData || reportData.nurseData}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="lg:w-1/12"></div>
        
        {/* Right Area - 40% */}
        <div className="lg:w-5/12">
          <div className="p-0 h-full ml-0">
            <div className="flex flex-col h-full gap-4">
              <div className="p-0 bg-transparent h-1/2">
                <div className="h-full flex justify-center">
                  <div className="text-center w-full">
                    <DetailedDutyTable 
                     dutyStaff={reportData?.report?.duty_staff} 
                    /> 
                  </div>
                </div>
              </div>

              <div className="flex gap-4 h-1/2">
                <div className="w-4/6 p-0 bg-transparent">
                  <div className="h-full flex justify-left">
                    <div className="text-center w-full">
                      <DetailedDutyTable2 
                     dutyStaff={reportData?.report?.duty_staff} 
                    /> 
                    </div>
                  </div>
                </div>
                <div className="w-1/6 p-0 bg-transparent">
                </div>
                <div className="w-1/6 p-0 bg-transparent">
                  <div className="h-full flex justify-end">
                    <div className="text-center w-full">
                      <VisitTable 
                        visitCount={reportData.tableData?.visitCount || reportData.visitCount} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosis Table */}
      <div className="flex flex-col lg:flex-row gap-0 mt-40  pl-2 pr-2">
        <div className="lg:w-12/12">
          <div className="p-0 h-full">
            <div className="flex flex-col h-full gap-4">
              <div className="p-0 bg-transparent flex-1">
                <div className="h-full flex justify-center">
                  <div className="text-center w-full">
                    <DiagnosisTable 
                      diagnosisData={reportData.tableData?.diagnosisData || reportData.diagnosisData} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Count Table */}
      <div className="flex flex-col lg:flex-row gap-0 mt-40   pl-2 pr-2">
        <div className="lg:w-12/12">
          <div className="p-0 h-full">
            <div className="flex flex-col h-full gap-4">
              <div className="p-0 bg-transparent flex-1">
                <div className="h-full flex justify-center">
                  <div className="text-center w-full">
                    <PatientCountTable 
                      patientData={reportData.tableData?.patientCountData || reportData.patientCountData} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Comment Section */}
      <Paper elevation={2} className="border border-gray-300 rounded-xl overflow-hidden mt-40">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
          <Typography variant="h6" className="font-bold text-white">
            コメントを追加
          </Typography>
        </div>
        
        <div className="p-4">
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
        </div>
      </Paper>
      
      {/* Management Comments Section */}
      <div className="mt-40">
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
      <Paper elevation={1} className="p-4 mt-6 bg-gray-50 border border-gray-200">
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
      </Paper>

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
    </div>
  );
}

export default Report;