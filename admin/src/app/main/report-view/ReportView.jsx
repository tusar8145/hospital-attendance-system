import Button from '@mui/material/Button';
import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
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
	const [loading, setLoading] = useState(true);
	const [successAlert, setSuccessAlert] = useState(null);
	const [failAlert, setFailAlert] = useState(null);
	const [reportData, setReportData] = useState(null);
	const { theme, toggleTheme } = useTheme();
	const { hospital, toggleHospital } = useTheme();

	// Get parameters from URL
	const reportId = searchParams.get('id');
	const type = searchParams.get('type'); // 1, 2, or 3

	// Fetch report data by ID
	useEffect(() => {
		if (reportId) {
			fetchReportById();
		}
	}, [reportId]);

	const fetchReportById = async () => {
		try {
			setLoading(true);
			const response = await axios.post(`${apiConfig.baseURL}/report/get-by-id`, {
				report_id: reportId
			});
			
			if (response.data.success) {
				setReportData(response.data.data);
			} else {
				setFailAlert('レポートが見つかりません');
			}
		} catch (error) {
			console.error('Error fetching report:', error);
			setFailAlert('レポートの取得に失敗しました');
		} finally {
			setLoading(false);
		}
	};

	// Get current date in Japanese format: 2025年7月07日
	const getCurrentJapaneseDate = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		const date = now.getDate();
		return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日`;
	};

	// Handle approval button
	const handleApproval = () => {
		console.log('Approval button clicked');
		// Add approval logic here
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
			header={
				<CommonHeader
					title={`レポート詳細 - ${reportData?.report?.report_no || '不明なレポート'}`}
					onBack={handleBack}
					backButtonText="一覧に戻る"
					showCreate={false}
				/>
			}
			content={
				<div className="flex flex-col p-16 sm:p-24 container">
					{successAlert != null && <Alert severity="success" className="text-sm">{t(successAlert)}.</Alert>}
					{failAlert != null && <Alert severity="error" className="text-sm">{t(failAlert)}.</Alert>}
					<div className="flex flex-col lg:flex-row gap-6">
						<Suspense fallback={<CircularProgress />}>
							{type === '1' ? (
								<ReportB 
									reportId={reportId}
									initialData={reportData}
									hospitalType={type}
								/>
							) : type === '2' ? (
								<ReportM 
									reportId={reportId}
									initialData={reportData}
									hospitalType={type}
								/>
							) : type === '3' ? (
								<ReportS 
									reportId={reportId}
									initialData={reportData}
									hospitalType={type}
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