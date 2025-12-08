import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';

// Import the common components
import HeaderSection from '../HeaderSection'; // Import HeaderSection
import StatusConfirmationSection from '../StatusConfirmationSection';
import ManagementComments from '../ManagementComments';

const FacilityUsageReport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(null);
  const [failAlert, setFailAlert] = useState(null);

  // Status confirmation data
  const [statusData, setStatusData] = useState([
    { 
      id: 1, 
      title: '理事長', 
      checked: true, 
      status: '確認済み', 
      date: '12/09 10:30',
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
      date: '12/09 11:15',
      person: '田中次郎',
      avatar: '田',
      approver: '田中次郎',
      color: 'bg-green-500'
    }
  ]);

  // Enhanced comments for management items with authors
  const [managementComments, setManagementComments] = useState([
    {
      id: 1,
      text: "本日の施設稼働率は97.5%で、高い利用率を維持しています。新規入所者1名、退所者2名で、純増は-1名です。",
      time: "09:00",
      author: "施設長 山田花子",
      date: "2025-12-09"
    },
    {
      id: 2,
      text: "設備点検を実施し、すべての設備が正常に動作していることを確認しました。来週月曜日に詳細なメンテナンスを予定しています。",
      time: "12:30",
      author: "設備管理部 田中太郎",
      date: "2025-12-09"
    },
    {
      id: 3,
      text: "スタッフの健康管理を徹底し、体調不良者は1名が休暇を取得しました。代わりのスタッフを手配し、業務に支障はありませんでした。",
      time: "15:45",
      author: "人事部 佐藤健太",
      date: "2025-12-09"
    },
    {
      id: 4,
      text: "空床発生の対応として、新規入所者募集を開始しました。退所による空床が主な原因です。",
      time: "18:20",
      author: "管理部 高橋美咲",
      date: "2025-12-09"
    }
  ]);

  // Sample data - in real app, this would come from props or API
  const facilityData = {
    facilityName: "メディカルセンター東京 介護施設",
    date: "2025年12月09日（火）",
    status: {
      president: { checked: true, date: "2025.12.09" },
      managingDirector: { checked: true, date: "2025.12.09" }
    },
    meetingsEvents: "定例職員会議、家族説明会",
    specialNotes: "設備点検実施済み、新規入所者1名",
    
    // Admission data
    admission: {
      capacity: ["120", "80", "200"],
      previousDayResidents: ["115", "75", "190"],
      currentDayAdmissions: ["3", "2", "5"],
      currentDayDischarges: ["2", "1", "3"],
      currentEndResidents: ["116", "76", "192"],
      overnightHospitalization: ["4", "2", "6"],
      hospitalization: ["3", "1", "4"]
    },
    
    // Monthly data
    monthly: {
      monthlyAdmissions: ["25", "18", "43"],
      avgMonthlyResidents: ["118", "77", "195"],
      monthlyUtilizationRate: ["98.3%", "96.3%", "97.5%"]
    },
    
    // Yearly data
    yearly: {
      annualTotalResidents: ["1420", "924", "2344"],
      avgAnnualResidents: ["118", "77", "195"],
      annualUtilizationRate: ["98.3%", "96.3%", "97.5%"]
    },
    
    // Usage data
    usage: {
      capacity: ["40", "30", "20", "90"],
      currentUsers: ["38", "28", "18", "84"],
      monthlyTotal: ["950", "700", "450", "2100"],
      avgMonthlyUsers: ["38", "28", "18", "84"],
      monthlyUtilization: ["95.0%", "93.3%", "90.0%", "93.3%"]
    },
    
    // Yearly usage data
    yearlyUsage: {
      annualTotal: ["11400", "8400", "5400", "25200"],
      avgAnnualUsers: ["38", "28", "18", "84"],
      annualUtilization: ["95.0%", "93.3%", "90.0%", "93.3%"]
    },
    
    // Vacancy reasons
    vacancyReasons: [
      { reason: "退所による空床", response: "新規入所者募集開始" },
      { reason: "一時利用終了", response: "定期利用者への案内" },
      { reason: "施設改修", response: "改修期間中の調整" },
      { reason: "スタッフ研修", response: "研修終了後に再開" },
      { reason: "季節的要因", response: "春期キャンペーン実施" }
    ]
  };

  const getCurrentJapaneseDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const day = days[now.getDay()];
    return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日（${day}）`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
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

  // Handle approval button
  const handleApproval = () => {
    setSuccessAlert('承認が完了しました');
    setTimeout(() => setSuccessAlert(null), 3000);
  };

  // Handle adding new comment
  const handleAddComment = () => {
    const newComment = {
      id: managementComments.length + 1,
      text: "新しい管理事項が追加されました。詳細は追って報告します。",
      time: getCurrentTime(),
      author: "施設管理者",
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
    const updatedComments = [...managementComments];
    updatedComments[index] = {
      ...updatedComments[index],
      text: updatedComments[index].text + " [編集済み]",
      time: getCurrentTime()
    };
    setManagementComments(updatedComments);
    
    setSuccessAlert(`コメント ${index + 1} を更新しました`);
    setTimeout(() => setSuccessAlert(null), 3000);
  };

  // Handle deleting a specific comment
  const handleDeleteComment = (index) => {
    setManagementComments(prev => prev.filter((_, i) => i !== index));
    setSuccessAlert('コメントを削除しました');
    setTimeout(() => setSuccessAlert(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch data logic here
      } catch (error) {
        console.error('Error fetching data:', error);
        setFailAlert('データの取得に失敗しました');
        setTimeout(() => setFailAlert(null), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col flex-1 w-full p-4 sm:p-6 lg:p-8">
      {successAlert && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successAlert}
        </Alert>
      )}
      {failAlert && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {failAlert}
        </Alert>
      )}

      {/* Header Section - Using HeaderSection Component */}
      <HeaderSection
        title="施設利用状況報告書"
        subtitle="メディカルセンター東京 介護施設"
        primaryButtonText="承認する"
        secondaryButtonText="コメント追加"
        showSecondaryButton={true}
        primaryButtonColor="success"
        secondaryButtonColor="primary"
        onPrimaryButtonClick={handleApproval}
        onSecondaryButtonClick={handleAddComment}
        showDate={true}
        customDate={getCurrentJapaneseDate()}
        variant="gradient"
      >
        {/* Additional info can be passed as children */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            📊 稼働率: 97.5%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            👥 現在の入所者: 192名
          </Typography>
          <Typography variant="caption" color="success.main">
            ✓ データ検証済み
          </Typography>
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

 

      {/* Main Content Section */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4,
          bgcolor: "white",
          borderRadius: 2,
        }}
      >
        <Stack spacing={4}>
  

          {/* Admission Table */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: "#2E7D32" }}>
              入所・短期入所状況
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#E8F5E9" }}>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}></TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold", minWidth: 80 }}>入 所</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold", minWidth: 80 }}>短期入所</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold", minWidth: 80 }}>合 計</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(facilityData.admission).map(([key, values], index) => (
                    <TableRow key={key} sx={index % 2 === 0 ? { bgcolor: "#fafafa" } : {}}>
                      <TableCell sx={{ fontWeight: key.includes('currentEnd') ? "bold" : "normal" }}>
                        {key === 'capacity' ? '定員' :
                         key === 'previousDayResidents' ? '前日 入所者数' :
                         key === 'currentDayAdmissions' ? '当日 入所者数' :
                         key === 'currentDayDischarges' ? '当日 退所者数' :
                         key === 'currentEndResidents' ? '当日末 入所者数' :
                         key === 'overnightHospitalization' ? '外泊・入院者数(入所扱い)' :
                         '入院者数 (退所扱い)'}
                      </TableCell>
                      {values.map((value, i) => (
                        <TableCell key={i} align="right" sx={{ fontWeight: key.includes('currentEnd') ? "bold" : "normal" }}>
                          {value}人
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Separator */}
                  <TableRow>
                    <TableCell colSpan={4} sx={{ borderTop: "2px dashed #ddd", height: 10 }}></TableCell>
                  </TableRow>

                  {/* Monthly Data */}
                  {Object.entries(facilityData.monthly).map(([key, values], index) => (
                    <TableRow key={key} sx={index % 2 === 0 ? { bgcolor: "#fafafa" } : {}}>
                      <TableCell>
                        {key === 'monthlyAdmissions' ? '当月 入所者数' :
                         key === 'avgMonthlyResidents' ? '当月 平均入所者数' :
                         '当月 稼働率'}
                      </TableCell>
                      {values.map((value, i) => (
                        <TableCell key={i} align="right">
                          {key.includes('UtilizationRate') ? value : `${value}人`}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Separator */}
                  <TableRow>
                    <TableCell colSpan={4} sx={{ borderTop: "2px dashed #ddd", height: 10 }}></TableCell>
                  </TableRow>

                  {/* Yearly Data */}
                  {Object.entries(facilityData.yearly).map(([key, values], index) => (
                    <TableRow key={key} sx={index % 2 === 0 ? { bgcolor: "#fafafa" } : {}}>
                      <TableCell>
                        {key === 'annualTotalResidents' ? '年度 延入所者数' :
                         key === 'avgAnnualResidents' ? '年度 平均入所者数' :
                         '年度 稼働率'}
                      </TableCell>
                      {values.map((value, i) => (
                        <TableCell key={i} align="right">
                          {key.includes('UtilizationRate') ? value : `${value}人`}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Usage Table */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: "#2E7D32" }}>
              利用状況
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#E8F5E9" }}>
                    <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}></TableCell>
                    {['A棟', 'B棟', 'C棟', '合計'].map((header, index) => (
                      <TableCell key={index} align="center" sx={{ fontWeight: "bold", minWidth: 80 }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(facilityData.usage).map(([key, values], index) => (
                    <TableRow key={key} sx={index % 2 === 0 ? { bgcolor: "#fafafa" } : {}}>
                      <TableCell sx={{ fontWeight: key.includes('currentUsers') ? "bold" : "normal" }}>
                        {key === 'capacity' ? '定員' :
                         key === 'currentUsers' ? '当日 利用者数' :
                         key === 'monthlyTotal' ? '当月 利用者数累計' :
                         key === 'avgMonthlyUsers' ? '当月 平均利用者数' :
                         '当月 稼働率'}
                      </TableCell>
                      {values.map((value, i) => (
                        <TableCell key={i} align="right" sx={{ fontWeight: key.includes('currentUsers') ? "bold" : "normal" }}>
                          {key.includes('Utilization') ? value : `${value}人`}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  
                  {/* Separator */}
                  <TableRow>
                    <TableCell colSpan={5} sx={{ borderTop: "2px dashed #ddd", height: 10 }}></TableCell>
                  </TableRow>

                  {/* Yearly Usage Data */}
                  {Object.entries(facilityData.yearlyUsage).map(([key, values], index) => (
                    <TableRow key={key} sx={index % 2 === 0 ? { bgcolor: "#fafafa" } : {}}>
                      <TableCell>
                        {key === 'annualTotal' ? '年度 利用者数累計' :
                         key === 'avgAnnualUsers' ? '年度 平均利用者数' :
                         '年度 稼働率'}
                      </TableCell>
                      {values.map((value, i) => (
                        <TableCell key={i} align="right">
                          {key.includes('Utilization') ? value : `${value}人`}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Vacancy Reasons Table */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1, color: "#2E7D32" }}>
              空床発生理由と対応
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#E8F5E9" }}>
                    <TableCell sx={{ fontWeight: "bold", width: "50%" }}>空床発生理由</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "50%" }}>対応</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {facilityData.vacancyReasons.map((item, index) => (
                    <TableRow key={index} sx={index % 2 === 0 ? { bgcolor: "#fafafa" } : {}}>
                      <TableCell>
                        <Typography variant="body2">
                          {item.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.response}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Management Items Section */}
          <ManagementComments
            comments={managementComments}
            title="管理事項"
            showSummary={true}
            summaryMessage="本日の管理事項はすべて正常に処理されました。施設の稼働率は97.5%で安定しています。"
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
          />
        </Stack>
      </Paper>

      {/* Footer */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          bgcolor: "grey.50", 
          border: "1px solid #e0e0e0",
          borderRadius: 1
        }}
      >
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", sm: "row" }, 
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "text.secondary"
        }}>
          <Box>
            <span style={{ fontWeight: "medium" }}>作成者:</span> 管理部 田中太郎
            <span style={{ margin: "0 8px" }}>|</span>
            <span style={{ fontWeight: "medium" }}>承認者:</span> 理事長 鈴木一郎
            <span style={{ margin: "0 8px" }}>|</span>
            <span style={{ fontWeight: "medium" }}>コメント数:</span> {managementComments.length}
          </Box>
          <Box sx={{ mt: { xs: 1, sm: 0 } }}>
            最終更新: {getCurrentJapaneseDate()} 19:30
          </Box>
        </Box>
      </Paper>
    </div>
  );
};

export default FacilityUsageReport;