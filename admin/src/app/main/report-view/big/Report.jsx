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

function Report() {
  const { t } = useTranslation('shared-components');
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(true);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { hospital, toggleHospital } = useTheme();

  // Report data state
  const [reportData, setReportData] = useState({
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

  // Status confirmation data
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

  // Management comments data
  const [managementComments, setManagementComments] = useState([
    {
      id: 1,
      text: "本日の診療は全診療科において予定通りに進行しました。特に午前診では新型インフルエンザの予防接種希望者が多く、順調に対応できました。",
      time: "09:00",
      author: "医師長 山田花子",
      date: "2025-07-15"
    },
    {
      id: 2,
      text: "医療機器の定期点検を実施し、すべての機器が正常に動作していることを確認しました。MRI装置については来週月曜日に詳細なメンテナンスを予定しています。",
      time: "12:30",
      author: "技術部 田中太郎",
      date: "2025-07-15"
    },
    {
      id: 3,
      text: "スタッフの健康管理を徹底し、体調不良者は2名（午前診1名、夜診1名）が休暇を取得しました。代わりのスタッフを手配し、診療に支障はありませんでした。",
      time: "15:45",
      author: "人事部 佐藤健太",
      date: "2025-07-15"
    },
    {
      id: 4,
      text: "緊急患者の受け入れ体制についてレビューを実施し、改善点を3点特定しました。今週中に関係部署と調整の上、改善案を実施する予定です。",
      time: "18:20",
      author: "管理部 高橋美咲",
      date: "2025-07-15"
    }
  ]);

  // Fetch report data
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setReportLoading(true);
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      const response = await axios.post(`${apiConfig.baseURL}report/get-by-date-table`, {
        date: dateStr,
        hospital_id: 10 // Replace with actual hospital ID from context/store
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
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setFailAlert('レポートデータの取得に失敗しました');
      setTimeout(() => setFailAlert(null), 3000);
    } finally {
      setReportLoading(false);
    }
  };

  // Get current date in Japanese format
  const getCurrentJapaneseDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const day = days[now.getDay()];
    return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日（${day}）`;
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
    return {
      name: 'メディカルセンター東京',
      address: '〒100-0001 東京都千代田区大手町1-1-1'
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
      text: "新しい管理事項が追加されました。詳細は追って報告します。",
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      author: "システム管理者",
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
        const response = await axios.post(`${apiConfig.baseURL}report/update-status`, {
          report_id: reportData.report.id,
          status: 'approved'
        });
        
        if (response.data.success) {
          setSuccessAlert('レポートが承認されました');
          // Refresh report data
          fetchReportData();
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

  // Handle save as draft
  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      // Prepare report data for submission
      const reportDataToSubmit = {
        hospital_id: 10,
        report_date: new Date().toISOString().split('T')[0],
        admission_count: reportData.hospitalData.inpatient.admission,
        discharge_count: reportData.hospitalData.inpatient.discharge,
        external_morning: reportData.hospitalData.outpatient.morning,
        external_afternoon: reportData.hospitalData.outpatient.afternoon,
        external_duty: reportData.hospitalData.outpatient.night,
        emergency_transport: reportData.emergencyData.current,
        post_transport_admission: reportData.emergencyData.hospitalization,
        visit_count: reportData.visitCount,
        is_draft: true
      };
      
      const response = await axios.post(`${apiConfig.baseURL}report/submit`, reportDataToSubmit);
      
      if (response.data.success) {
        setSuccessAlert('下書きとして保存しました');
        fetchReportData();
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
    return '管理部 田中太郎';
  };

  // Get approver info
  const getApproverInfo = () => {
    if (reportData.report?.approved_by_admin?.name) {
      return reportData.report.approved_by_admin.name;
    }
    return '理事長 鈴木一郎';
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
    return '未作成';
  };

  const hospitalInfo = getHospitalInfo();

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
        <Typography className="ml-4">レポートデータを読み込み中...</Typography>
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
        title={`管理日誌レポート - ${getCurrentJapaneseDate()}`}
        subtitle={`${hospitalInfo.name}　　${hospitalInfo.address}`}
        primaryButtonText="承認する"
        secondaryButtonText="下書き保存"
        tertiaryButtonText="コメント追加"
        showSecondaryButton={true}
        showTertiaryButton={true}
        primaryButtonColor="success"
        secondaryButtonColor="primary"
        tertiaryButtonColor="info"
        onPrimaryButtonClick={handleApproval}
        onSecondaryButtonClick={handleSaveDraft}
        onTertiaryButtonClick={handleAddComment}
        showDate={true}
        customDate={getCurrentJapaneseDate()}
        variant="gradient"
        loading={loading}
        showReportStatus={true}
        reportStatus={getReportStatus()}
        reportNo={reportData.report?.report_no}
      >
        {/* Additional info */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            🏥 {reportData.report?.medical_center?.type === 'large_hospital' ? '総合病院' : '病院'}レポート
          </Typography>
          <Typography variant="caption" color="text.secondary">
            📅 月次集計データ
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
                    <HospitalDataTable data={reportData.hospitalData} />
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
                  emergencyData={reportData.emergencyData}
                  nurseData={reportData.nurseData}
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
                      <VisitTable visitCount={reportData.visitCount} />
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
                    <DiagnosisTable diagnosisData={reportData.diagnosisData} />
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
                    <PatientCountTable patientData={reportData.patientCountData} />
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
          summaryMessage={reportData.report?.special_notes || "本日の管理事項はすべて正常に処理されました。特段の問題は発生していません。"}
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
              : getCurrentJapaneseDate() + ' 19:30'}
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