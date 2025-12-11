import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { Box, Stack, Typography, Paper, CircularProgress } from '@mui/material';
import HospitalDataTable from './components/HospitalDataTable';
import SimpleDutyTable from './components/SimpleDutyTable';
import MedicalManagementTable from './components/MedicalManagementTable';
import DetailedDutyTable from './components/DetailedDutyTable';
import VisitTable from './components/VisitTable';
import DiagnosisTable from './components/DiagnosisTable';
import PatientCountTable from './components/PatientCountTable';
import HeaderSection from '../HeaderSection';
import StatusConfirmationSection from '../StatusConfirmationSection';
import ManagementComments from '../ManagementComments';

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

function Report({ reportId, initialData, hospitalType }) {
  const { t } = useTranslation('shared-components');
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(!initialData);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { hospital, toggleHospital } = useTheme();

  // Report data state
  const [reportData, setReportData] = useState(initialData || {
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
    doctors: []
  });

  // Status confirmation data - this could be fetched from API if available
  const [statusData, setStatusData] = useState([
    { 
      id: 1, 
      title: '理事長', 
      checked: true, 
      status: '確認済み', 
      date: '7/15 10:30',
      person: '鈴木一郎',
      avatar: '鈴',
      approver: '鈴木一郎',
      color: 'bg-blue-500'
    },
    { 
      id: 2, 
      title: '専務', 
      checked: true, 
      status: '確認済み', 
      date: '7/15 11:15',
      person: '田中次郎',
      avatar: '田',
      approver: '田中次郎',
      color: 'bg-green-500'
    },
    { 
      id: 3, 
      title: '医師長', 
      checked: true, 
      status: '確認済み', 
      date: '7/15 09:00',
      person: '山田花子',
      avatar: '山',
      approver: '山田花子',
      color: 'bg-purple-500'
    },
    { 
      id: 4, 
      title: '看護部', 
      checked: false, 
      status: '未確認', 
      date: '7/15 14:00',
      person: '佐藤健太',
      avatar: '佐',
      approver: '',
      color: 'bg-orange-500'
    },
    { 
      id: 5, 
      title: '事務部', 
      checked: true, 
      status: '確認済み', 
      date: '7/15 08:45',
      person: '高橋美咲',
      avatar: '高',
      approver: '高橋美咲',
      color: 'bg-pink-500'
    },
    { 
      id: 6, 
      title: '薬剤部', 
      checked: false, 
      status: '未確認', 
      date: '7/15 16:30',
      person: '伊藤誠',
      avatar: '伊',
      approver: '',
      color: 'bg-red-500'
    },
    { 
      id: 7, 
      title: '検査部', 
      checked: true, 
      status: '確認済み', 
      date: '7/15 13:20',
      person: '渡辺さくら',
      avatar: '渡',
      approver: '渡辺さくら',
      color: 'bg-teal-500'
    },
    { 
      id: 8, 
      title: '管理部', 
      checked: true, 
      status: '確認済み', 
      date: '7/15 12:10',
      person: '中村大輔',
      avatar: '中',
      approver: '中村大輔',
      color: 'bg-indigo-500'
    }
  ]);

  // Management comments data - initialize with report's special_notes
  const [managementComments, setManagementComments] = useState([]);

  // Fetch report data if not provided via props
  useEffect(() => {
    if (!initialData && reportId) {
      fetchReportData();
    } else if (initialData) {
      // Initialize management comments with report's special_notes
      if (initialData.report?.special_notes) {
        setManagementComments([
          {
            id: 1,
            text: initialData.report.special_notes,
            time: initialData.report.updated_at 
              ? new Date(initialData.report.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
              : '00:00',
            author: initialData.report.created_by_admin?.name || '作成者',
            date: initialData.report.report_date 
              ? new Date(initialData.report.report_date).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          }
        ]);
      }
    }
  }, [reportId, initialData]);

  const fetchReportData = async () => {
    try {
      setReportLoading(true);
      
      const response = await axios.post(`${apiConfig.baseURL}/report/get-by-id`, {
        report_id: reportId
      });
      
      if (response.data.success) {
        const data = response.data.data;
        setReportData({
          hospitalData: data.tableData?.hospitalData || {
            inpatient: { admission: 0, discharge: 0, current: 0 },
            outpatient: { morning: 0, afternoon: 0, night: 0, total: 0 }
          },
          emergencyData: data.tableData?.emergencyData || {
            current: 0, hospitalization: 0, monthly: 0, cumulative: 0
          },
          nurseData: data.tableData?.nurseData || {
            quasiNight: [], midnight: []
          },
          diagnosisData: data.tableData?.diagnosisData || {},
          patientCountData: data.tableData?.patientCountData || {},
          visitCount: data.tableData?.visitCount || 0,
          monthlyStats: data.monthlyStats || {},
          report: data.report,
          departments: data.departments || [],
          doctors: data.doctors || []
        });

        // Initialize management comments with report's special_notes
        if (data.report?.special_notes) {
          setManagementComments([
            {
              id: 1,
              text: data.report.special_notes,
              time: data.report.updated_at 
                ? new Date(data.report.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                : '00:00',
              author: data.report.created_by_admin?.name || '作成者',
              date: data.report.report_date 
                ? new Date(data.report.report_date).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setFailAlert('レポートデータの取得に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setReportLoading(false);
    }
  };

  // Get report date in Japanese format
  const getReportJapaneseDate = () => {
    if (reportData.report?.report_date) {
      const date = new Date(reportData.report.report_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      const dayOfWeek = days[date.getDay()];
      return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日（${dayOfWeek}）`;
    }
    return '日付不明';
  };

  // Get hospital info from report data
  const getHospitalInfo = () => {
    if (reportData.report?.medical_center) {
      const mc = reportData.report.medical_center;
      return {
        name: mc.name || '医療機関名',
        address: mc.address || '住所情報なし'
      };
    }
    // Fallback to context if available
    if (hospital?.name) {
      return {
        name: hospital.name,
        address: hospital.address || '住所情報なし'
      };
    }
    return {
      name: '医療機関名',
      address: '住所情報なし'
    };
  };

  // Handle checkbox change for status confirmation
  const handleStatusChange = (id) => {
    setStatusData(prev => prev.map(item => 
      item.id === id ? { 
        ...item, 
        checked: !item.checked,
        status: !item.checked ? '確認済み' : '未確認',
        approver: !item.checked ? item.person : ''
      } : item
    ));
  };

  // Handle adding new comment
  const handleAddComment = () => {
    const newComment = {
      id: managementComments.length + 1,
      text: "新しい管理事項が追加されました。",
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      author: reportData.report?.created_by_admin?.name || 'システム管理者',
      date: new Date().toISOString().split('T')[0]
    };
    setManagementComments(prev => [...prev, newComment]);
    
    // Show success alert
    setSuccessAlert('コメントが追加されました');
    setTimeout(() => setSuccessAlert(null), 3000);
  };

  // Handle deleting last comment
  const handleDeleteLastComment = () => {
    if (managementComments.length > 0) {
      setManagementComments(prev => prev.slice(0, -1));
      setSuccessAlert('最後のコメントを削除しました');
      setTimeout(() => setSuccessAlert(null), 3000);
    }
  };

  // Handle editing a comment
  const handleEditComment = (index, comment) => {
    // In a real app, you would open a modal here
    console.log('Editing comment:', index, comment);
    setSuccessAlert(`コメント ${index + 1} を編集します`);
    setTimeout(() => setSuccessAlert(null), 3000);
  };

  // Handle deleting a specific comment
  const handleDeleteComment = (index) => {
    setManagementComments(prev => prev.filter((_, i) => i !== index));
    setSuccessAlert('コメントを削除しました');
    setTimeout(() => setSuccessAlert(null), 3000);
  };

  // Handle approval
  const handleApproval = async () => {
    try {
      setLoading(true);
      // Call API to approve report
      if (reportData.report?.id) {
        const response = await axios.post(`${apiConfig.baseURL}/api/report/update-status`, {
          report_id: reportData.report.id,
          status: 'approved'
        });
        
        if (response.data.success) {
          setSuccessAlert('レポートが承認されました');
          // Refresh report data
          if (!initialData) {
            fetchReportData();
          } else {
            // Update local state if we have initialData
            setReportData(prev => ({
              ...prev,
              report: {
                ...prev.report,
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by_admin: { name: '現在のユーザー' }
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error approving report:', error);
      setFailAlert('承認に失敗しました');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessAlert(null);
        setFailAlert(null);
      }, 3000);
    }
  };

  // Handle save as draft (only for new reports, not viewing existing ones)
  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      // Prepare report data for submission
      const reportDataToSubmit = {
        hospital_id: reportData.report?.medical_center_id || hospital?.id || 10,
        report_date: reportData.report?.report_date || new Date().toISOString().split('T')[0],
        admission_count: reportData.hospitalData.inpatient.admission,
        discharge_count: reportData.hospitalData.inpatient.discharge,
        external_morning: reportData.hospitalData.outpatient.morning,
        external_afternoon: reportData.hospitalData.outpatient.afternoon,
        external_duty: reportData.hospitalData.outpatient.night,
        emergency_transport: reportData.emergencyData.current,
        post_transport_admission: reportData.emergencyData.hospitalization,
        visit_count: reportData.visitCount,
        special_notes: managementComments[0]?.text || '',
        is_draft: true
      };
      
      const response = await axios.post(`${apiConfig.baseURL}/api/report/submit`, reportDataToSubmit);
      
      if (response.data.success) {
        setSuccessAlert('下書きとして保存しました');
        if (!initialData) {
          fetchReportData();
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setFailAlert('保存に失敗しました');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessAlert(null);
        setFailAlert(null);
      }, 3000);
    }
  };

  // Get creator info
  const getCreatorInfo = () => {
    if (reportData.report?.created_by_admin?.name) {
      return reportData.report.created_by_admin.name;
    }
    return '作成者不明';
  };

  // Get approver info
  const getApproverInfo = () => {
    if (reportData.report?.approved_by_admin?.name) {
      return reportData.report.approved_by_admin.name;
    }
    if (reportData.report?.status === 'approved') {
      return '承認済み';
    }
    return '未承認';
  };

  // Get report status
  const getReportStatus = () => {
    if (reportData.report) {
      const statusMap = {
        'draft': '下書き',
        'submitted': '提出済み',
        'approved': '承認済み',
        'rejected': '拒否済み'
      };
      return statusMap[reportData.report.status] || reportData.report.status;
    }
    return '不明';
  };

  // Get hospital type label
  const getHospitalTypeLabel = () => {
    if (reportData.report?.medical_center?.type) {
      const typeMap = {
        'large_hospital': '総合病院',
        'hospital': '病院',
        'welfare': '福祉施設'
      };
      return typeMap[reportData.report.medical_center.type] || '病院';
    }
    // Fallback to hospitalType prop
    if (hospitalType === '1') return '総合病院';
    if (hospitalType === '2') return '病院';
    if (hospitalType === '3') return '福祉施設';
    return '病院';
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

  // Check if report exists
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
      {successAlert != null && (
        <Alert severity="success" className="text-sm mb-4 animate-fade-in">
          {t(successAlert)}.
        </Alert>
      )}
      {failAlert != null && (
        <Alert severity="error" className="text-sm mb-4 animate-fade-in">
          {t(failAlert)}.
        </Alert>
      )}

      {/* Header Section */}
      <HeaderSection
        title={`管理日誌レポート - ${reportDate}`}
        subtitle={`${hospitalInfo.name}　　${hospitalInfo.address}`}
        primaryButtonText={reportData.report?.status === 'approved' ? '承認済み' : '承認する'}
        secondaryButtonText="コメント追加"
        tertiaryButtonText="編集"
        showSecondaryButton={true}
        showTertiaryButton={!initialData} // Show edit only for new reports
        primaryButtonColor={reportData.report?.status === 'approved' ? 'secondary' : 'success'}
        secondaryButtonColor="primary"
        tertiaryButtonColor="info"
        onPrimaryButtonClick={reportData.report?.status === 'approved' ? null : handleApproval}
        onSecondaryButtonClick={handleAddComment}
        onTertiaryButtonClick={handleSaveDraft}
        showDate={true}
        customDate={reportDate}
        variant="gradient"
        loading={loading}
        showReportStatus={true}
        reportStatus={getReportStatus()}
        reportNo={reportData.report?.report_no}
      >
        {/* Additional info */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            🏥 {getHospitalTypeLabel()}レポート
          </Typography>
          <Typography variant="caption" color="text.secondary">
            📅 レポート詳細
          </Typography>
          <Typography variant="caption" color={reportData.report?.status === 'approved' ? 'success.main' : 'warning.main'}>
            {reportData.report?.status === 'approved' ? '✓ 承認済み' : '⚠ 承認待ち'}
          </Typography>
          {reportData.report?.report_no && (
            <Typography variant="caption" color="info.main">
              📋 {reportData.report.report_no}
            </Typography>
          )}
        </Box>
      </HeaderSection>

      {/* Status Confirmation Section */}
      <StatusConfirmationSection
        statusData={statusData}
        onStatusChange={handleStatusChange}
        title="確認状態一覧"
        showSummary={true}
        showDate={true}
        compact={true}
      />

      {/* Data Tables Section */}
      <div className="flex flex-col lg:flex-row gap-0 mt-40">
        {/* Left Area - 40% */}
        <div className="lg:w-4/12">
          <div className="p-0 h-full">
            <div className="flex flex-col h-full gap-4">
              <div className="p-0 bg-transparent flex-1">
                <div className="h-full flex justify-center">
                  <div className="text-center w-full">
                    <HospitalDataTable 
                      data={reportData.tableData?.hospitalData || reportData.hospitalData} 
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
                    <DetailedDutyTable />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 h-1/2">
                <div className="w-2/6 p-0 bg-transparent">
                  <div className="h-full flex justify-left">
                    <div className="text-center w-full">
                      <SimpleDutyTable />
                    </div>
                  </div>
                </div>
                <div className="w-3/6 p-0 bg-transparent">
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
      <div className="flex flex-col lg:flex-row gap-0 mt-40">
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
      <div className="flex flex-col lg:flex-row gap-0 mt-40">
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
      
      {/* Management Comments Section */}
      <div className="mt-40">
        <ManagementComments
          comments={managementComments}
          title="管理事項"
          showSummary={true}
          summaryMessage={managementComments.length > 0 ? managementComments[0].text : "管理事項はありません。"}
          showActionButtons={true}
          onAddComment={handleAddComment}
          onDeleteLastComment={handleDeleteLastComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          allowAddComment={true}
          allowDeleteLastComment={true}
          allowEditComments={true}
          allowDeleteComments={true}
          showCommentCount={true}
          loading={loading}
        />
      </div>

      {/* Footer */}
      <Paper elevation={1} className="p-4 mt-6 bg-gray-50 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
          <div>
            <span className="font-medium">作成者:</span> {getCreatorInfo()}
            <span className="mx-2">|</span>
            <span className="font-medium">承認者:</span> {getApproverInfo()}
            <span className="mx-2">|</span>
            <span className="font-medium">コメント数:</span> {managementComments.length}
            <span className="mx-2">|</span>
            <span className="font-medium">ステータス:</span> {getReportStatus()}
          </div>
          <div className="mt-2 sm:mt-0">
            最終更新: {reportData.report?.updated_at ? 
              new Date(reportData.report.updated_at).toLocaleDateString('ja-JP') + ' ' + 
              new Date(reportData.report.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
              : reportDate + ' 00:00'}
          </div>
        </div>
      </Paper>

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