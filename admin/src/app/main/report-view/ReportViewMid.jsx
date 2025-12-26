import Button from '@mui/material/Button';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { lazy } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography, Stack } from '@mui/material';
import { CommonHeader } from '../../shared-components/new/CommonHeader';

const ReportB = lazy(() => import('./big/Report'));
const ReportM = lazy(() => import('./mid/Report'));
const ReportS = lazy(() => import('./sm/Report'));

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

function ReportView() {
	const { t } = useTranslation('shared-components');
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [successAlert, setSuccessAlert] = useState(null);
	const [failAlert, setFailAlert] = useState(null);
	const [reportData, setReportData] = useState(null);
	const { theme, toggleTheme } = useTheme();
	const { hospital, toggleHospital } = useTheme();
	const [hospital_type, sethospital_type] = useState(null);

	// Get parameters from URL
	const reportId = searchParams.get('id');
	const type = searchParams.get('type'); // 1, 2, or 3

	// Fetch report data by ID only - memoized to prevent re-creation
	const fetchReportById = useCallback(async () => {
		if (!reportId) {
			setFailAlert('レポートIDが指定されていません');
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const response = await axios.post(`${apiConfig.baseURL}/report-mid/get-by-id`, {
				report_id: reportId
			});
			
			if (response.data.success) {
				const reportData = response.data.data;
				
				// Process special notes as first comment if it exists
				if (reportData.report?.special_notes) {
					const specialNotesComment = {
						id: -1, // Special ID for special notes
						comment: reportData.report.special_notes,
						created_at: reportData.report.created_at,
						admin: reportData.report.created_by_admin,
						admin_id: reportData.report.created_by,
						can_edit: false,
						is_special_notes: true // Flag to identify this is special notes
					};
					
					// Add special notes as first comment
					if (!reportData.report_comments) {
						reportData.report_comments = [];
					}
					
					// Check if special notes already exists in comments
					const hasSpecialNotes = reportData.report_comments.some(
						comment => comment.is_special_notes === true
					);
					
					if (!hasSpecialNotes) {
						reportData.report_comments.unshift(specialNotesComment);
					}
				}
				
				setReportData(reportData);
			} else {
				setFailAlert('レポートが見つかりません');
			}
		} catch (error) {
			console.error('Error fetching report:', error);
			setFailAlert('レポートの取得に失敗しました');
		} finally {
			setLoading(false);
		}
	}, [reportId]); // Only recreate when reportId changes

	// Load data on component mount
	useEffect(() => {
		if (reportId) {
			fetchReportById();
		} else {
			setFailAlert('レポートIDが指定されていません');
			setLoading(false);
		}
	}, [reportId, fetchReportById]);

	// Handle Edit button
	const handleEdit = () => {
		if (!reportData?.report) return;
		
		// Format date for URL
		const reportDate = new Date(reportData.report.report_date);
		const year = reportDate.getFullYear();
		const month = String(reportDate.getMonth() + 1).padStart(2, '0');
		const day = String(reportDate.getDate()).padStart(2, '0');
		const formattedDate = `${year}-${month}-${day}`;
		
		// Navigate to report entry with the report's date and ID
		navigate(`/report-entry?hospitalId=${reportData.report.medical_center_id}&type=${type}&date=${formattedDate}&fromView=true&reportId=${reportId}`);
	};

	// Handle Approve button
	const handleApprove = async () => {
		if (!reportId) return;
		
		try {
			setLoading(true);
			const response = await axios.post(`${apiConfig.baseURL}/report/approve`, {
				report_id: reportId
			});
			
			if (response.data.success) {
				setSuccessAlert('レポートを承認しました');
				// Refresh report data
				fetchReportById();
			} else {
				setFailAlert(response.data.message || '承認に失敗しました');
			}
		} catch (error) {
			console.error('Error approving report:', error);
			setFailAlert(error.response?.data?.message || '承認に失敗しました');
		} finally {
			setLoading(false);
		}
	};

	// Handle back button
	const handleBack = () => {
		window.history.back();
	};

	// Render loading state
	if (loading) {
		return (
			<Box 
				sx={{ 
					display: 'flex', 
					flexDirection: 'column',
					alignItems: 'center', 
					justifyContent: 'center', 
					height: '100vh' 
				}}
			>
				<CircularProgress />
				<Typography sx={{ mt: 2 }}>レポートを読み込み中...</Typography>
			</Box>
		);
	}

	// Render error state
	if (!reportData && !loading) {
		return (
			<Box 
				sx={{ 
					display: 'flex', 
					flexDirection: 'column',
					alignItems: 'center', 
					justifyContent: 'center', 
					height: '100vh',
					gap: 2
				}}
			>
				<Alert severity="error" sx={{ mb: 2 }}>
					レポートが見つかりません
				</Alert>
				<Button variant="contained" onClick={handleBack}>
					戻る
				</Button>
			</Box>
		);
	}

	return (
		<Root
			content={
				<div className="flex flex-col p-16 sm:p-24 container">				
				<CommonHeader
					title={`レポート詳細 - ${reportData?.report?.report_no || '不明なレポート'}`}
					onBack={handleBack}
					backButtonText="一覧に戻る"
					showCreate={false}
					// Add custom actions to header
					customActions={
						<Stack direction="row" spacing={2}>
							{/* Only show Edit button for draft reports */}
							{reportData?.report?.status === 'draft' && (
								<Button
									variant="outlined"
									color="primary"
									onClick={handleEdit}
								>
									編集
								</Button>
							)}
							
							{/* Show Approve button for all users if not already approved */}
							{reportData?.report?.status !== 'approved' && (
								<Button
									variant="contained"
									color="success"
									onClick={handleApprove}
									disabled={loading}
								>
									{loading ? '処理中...' : '承認'}
								</Button>
							)}
						</Stack>
					}
				/>
					{successAlert != null && (
						<Alert severity="success" className="text-sm mb-4" onClose={() => setSuccessAlert(null)}>
							{t(successAlert)}
						</Alert>
					)}
					{failAlert != null && (
						<Alert severity="error" className="text-sm mb-4" onClose={() => setFailAlert(null)}>
							{t(failAlert)}
						</Alert>
					)}

					
					<div className="flex flex-col lg:flex-row gap-6">
						<Suspense fallback={<CircularProgress />}>
							{reportData?.report?.hospital_type === 'large_hospital' ? (
								<ReportB 
									reportId={reportId}
									initialData={reportData}
									hospitalType={type}
									onRefresh={fetchReportById}
								/>
							) : reportData?.report?.hospital_type === 'hospital' ? (
								<ReportM 
									reportId={reportId}
									initialData={reportData}
									hospitalType={type}
									onRefresh={fetchReportById}
								/>
							) : reportData?.report?.hospital_type === 'welfare' ? (
								<ReportS 
									reportId={reportId}
									initialData={reportData}
									hospitalType={type}
									onRefresh={fetchReportById}
								/>
							) : (
								<Alert severity="warning">医療機関タイプが指定されていません</Alert>
							)}
						</Suspense>
					</div>
				</div>
			}
		/>
	);
}

export default ReportView;