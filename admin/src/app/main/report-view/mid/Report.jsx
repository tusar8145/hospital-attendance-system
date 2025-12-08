import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { Box, Stack, Typography, Paper } from '@mui/material';

// Import the common components
import HeaderSection from '../HeaderSection'; // Added import
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
	const [successAlert, setSuccessAlert] = useState(null);
	const [failAlert, setFailAlert] = useState(null);
	const { theme, toggleTheme } = useTheme();
	const { hospital, toggleHospital } = useTheme();

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

	// Diagnosis table data with meaningful content
	const [diagnosisTableData, setDiagnosisTableData] = useState([
		['', '総合診療科', '内科', '外科', '小児科', '婦人科', '', '', '', '', '', '', '', '', '', '', '', '合 計'],
		['午前診', '15', '12', '8', '10', '15', '', '', '', '', '', '', '', '', '', '', '', '60'],
		['午後診', '18', '10', '6', '8', '18', '', '', '', '', '', '', '', '', '', '', '', '60'],
		['夜診', '12', '15', '10', '8', '15', '', '', '', '', '', '', '', '', '', '', '', '60']
	]);

	// Patient count table data
	const patientCountData = [
		['午前診', '午後診', '夜診', '合計'],
		['60', '60', '60', '180']
	];

	// Treatment time table data with doctor names
	const treatmentTimeData = [
		['', '診1', '診2', '診3', '診4', '診5', '診6'],
		['午前診', '山田医師', '佐藤医師', '鈴木医師', '高橋医師', '伊藤医師', '渡辺医師'],
		['午後診', '田中医師', '小林医師', '加藤医師', '吉田医師', '山本医師', '中村医師'],
		['夜診', '松本医師', '井上医師', '木村医師', '林医師', '斎藤医師', '清水医師']
	];

	// Enhanced comments for management items with authors
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

	// Get current date in Japanese format: 2025年7月07日
	const getCurrentJapaneseDate = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		const date = now.getDate();
		const days = ['日', '月', '火', '水', '木', '金', '土'];
		const day = days[now.getDay()];
		return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日（${day}）`;
	};

	// Get current time in HH:mm format
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

	// Empty function for approval button
	const handleApproval = () => {
		setSuccessAlert('承認が完了しました');
		setTimeout(() => setSuccessAlert(null), 3000);
		// Add approval logic here
	};

	// Handle cell click for diagnosis table
	const handleDiagnosisCellClick = (rowIndex, colIndex) => {
		console.log(`Clicked diagnosis cell [${rowIndex}][${colIndex}]`);
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				// const response = await axios.get(`${apiConfig.baseUrl}/management-log`);
				// setTableData(response.data);
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setLoading(false);
			}
		};

		// fetchData();
	}, []);

	// Handle adding new comment
	const handleAddComment = () => {
		const newComment = {
			id: managementComments.length + 1,
			text: "新しい管理事項が追加されました。詳細は追って報告します。",
			time: getCurrentTime(),
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
		
		// Example: Update the comment text
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

	// Data for HeaderSection
	const headerData = {
		title: `管理日誌レポート - ${getCurrentJapaneseDate()}`,
		buttonText: "承認する",
	};

	const facilityInfo = {
		date: getCurrentJapaneseDate(),
		facilityName: "メディカルセンター東京　　〒100-0001 東京都千代田区大手町1-1-1",
	};

	// Helper function to determine if cell should have border for diagnosis table
	const shouldHaveRightBorder = (colIndex) => {
		if (colIndex === 0) return true;
		if (colIndex >= 1 && colIndex <= 5) return colIndex !== 5;
		if (colIndex === 6) return true;
		if (colIndex >= 7 && colIndex <= 16) return colIndex !== 16;
		return false;
	};

	// Helper function to get cell content for diagnosis table
	const getCellContent = (rowIndex, colIndex) => {
		const cellValue = diagnosisTableData[rowIndex][colIndex];
		
		if (rowIndex === 0 && colIndex === 0) return '';
		if (rowIndex === 0 && colIndex === 1) return (
			<span className="font-semibold text-blue-600">{cellValue}</span>
		);
		
		if (rowIndex === 0 && colIndex >= 1 && colIndex <= 5) {
			return colIndex === 1 ? (
				<span className="font-semibold text-blue-600">{cellValue}</span>
			) : (
				<span className="text-gray-600">{cellValue}</span>
			);
		}
		
		if (rowIndex >= 1 && colIndex === 0) return (
			<span className="font-medium text-gray-700">{cellValue}</span>
		);
		
		if (rowIndex >= 1 && colIndex >= 1 && colIndex <= 5) {
			return (
				<div className="flex flex-col items-center justify-center min-h-[50px]">
					<span className="text-sm font-semibold text-gray-800">{cellValue}</span>
					<span className="text-xs text-gray-500">（平均3）</span>
				</div>
			);
		}
		
		if (rowIndex >= 1 && colIndex === 17) {
			return (
				<div className="flex flex-col items-center justify-center min-h-[50px]">
					<span className="text-sm font-bold text-gray-900">{cellValue}</span>
					<span className="text-xs text-gray-500">（合計18）</span>
				</div>
			);
		}
		
		return '';
	};

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

			{/* Header Section - Using HeaderSection Component */}
			<HeaderSection
				title={`管理日誌レポート - ${getCurrentJapaneseDate()}`}
				subtitle="メディカルセンター東京　　〒100-0001 東京都千代田区大手町1-1-1"
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
						🏥 総合病院レポート
					</Typography>
					<Typography variant="caption" color="text.secondary">
						📅 月次集計データ
					</Typography>
					<Typography variant="caption" color="success.main">
						✓ データ検証済み
					</Typography>
				</Box>
			</HeaderSection>

			{/* Status Confirmation Section - Using Common Component */}
			<StatusConfirmationSection
				statusData={statusData}
				onStatusChange={handleStatusChange}
				title="確認状態一覧"
				showSummary={true}
				showDate={true}
				compact={true}
			/>

			{/* Tables Section */}
			<Stack spacing={4}>
				{/* Patient Count and Treatment Time Tables */}
				<Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Patient Count Table */}
					<Paper 
						elevation={2} 
						className="border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
					>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr>
										<th 
											className="border border-gray-300 p-3 sm:p-4 text-center font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white"
											colSpan="4"
										>
											患　者　数
										</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										{patientCountData[0].map((header, index) => (
											<td
												key={`header-${index}`}
												className={`
													border border-gray-300 p-3 sm:p-4 text-center
													${index < 3 ? 'border-r border-gray-300' : ''}
													${index === patientCountData[0].length - 1 ? 'bg-blue-50' : ''}
												`}
											>
												<div className="text-sm sm:text-base font-medium text-gray-700">
													{header}
												</div>
											</td>
										))}
									</tr>
									<tr>
										{patientCountData[1].map((value, index) => (
											<td
												key={`value-${index}`}
												className={`
													border border-gray-300 p-3 sm:p-4 text-center
													${index < 3 ? 'border-r border-gray-300' : ''}
													${index === patientCountData[1].length - 1 ? 'bg-blue-50 font-bold text-blue-700' : 'font-semibold text-gray-800'}
												`}
											>
												<div className="text-lg sm:text-xl">
													{value}
												</div>
												{index === patientCountData[1].length - 1 && (
													<div className="text-xs text-gray-500 mt-1">合計患者数</div>
												)}
											</td>
										))}
									</tr>
								</tbody>
							</table>
						</div>
					</Paper>

					{/* Treatment Time Table */}
					<Paper 
						elevation={2} 
						className="border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
					>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<tbody>
									{/* Header row */}
									<tr className="bg-gradient-to-r from-indigo-500 to-purple-600">
										<td 
											className="border border-gray-300 p-2 text-center text-white font-bold"
											rowSpan="4"
											style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
										>
											<div className="transform rotate-180 text-sm sm:text-base">
												診療時間
											</div>
										</td>
										<td className="border border-gray-300 p-3 text-center bg-indigo-50"></td>
										{treatmentTimeData[0].slice(1).map((label, index) => (
											<td
												key={`header-${index}`}
												className={`
													border border-gray-300 p-3 text-center
													${index < 5 ? 'border-r border-gray-300' : ''}
													bg-indigo-50 text-gray-700 font-medium
												`}
											>
												<div className="text-sm sm:text-base">
													{label}
												</div>
											</td>
										))}
									</tr>
									
									{/* Data rows */}
									{treatmentTimeData.slice(1).map((row, rowIndex) => (
										<tr key={`row-${rowIndex + 1}`}>
											<td className="border border-gray-300 p-3 text-center bg-gray-50">
												<div className="text-sm sm:text-base font-medium text-gray-700">
													{row[0]}
												</div>
											</td>
											{row.slice(1).map((cell, colIndex) => (
												<td
													key={`cell-${rowIndex + 1}-${colIndex}`}
													className={`
														border border-gray-300 p-3 text-center
														${colIndex < 5 ? 'border-r border-gray-300' : ''}
														hover:bg-blue-50 transition-colors duration-200
													`}
												>
													<div className="text-sm text-gray-600">
														{cell}
													</div>
													<div className="text-xs text-gray-400 mt-1">
														{rowIndex === 0 ? '主任医師' : 
														 rowIndex === 1 ? '専門医' : 
														 '夜間担当'}
													</div>
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</Paper>
				</Box>

				{/* Diagnosis Table */}
				<Paper 
					elevation={2} 
					className="border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
				>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<tbody>
								{diagnosisTableData.map((row, rowIndex) => (
									<tr 
										key={`row-${rowIndex}`}
										className={`
											${rowIndex === 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : ''}
											${rowIndex > 0 ? 'hover:bg-gray-50 transition-colors duration-200' : ''}
										`}
									>
										{row.map((_, colIndex) => (
											<td
												key={`cell-${rowIndex}-${colIndex}`}
												className={`
													border border-gray-300 p-2 sm:p-3 text-center 
													${rowIndex === 0 ? 'text-white font-bold' : ''}
													${shouldHaveRightBorder(colIndex) ? 'border-r border-gray-300' : ''}
													${rowIndex === 0 && colIndex === 17 ? 'bg-teal-700' : ''}
													${rowIndex > 0 && colIndex === 17 ? 'bg-emerald-50' : ''}
												`}
												onClick={() => handleDiagnosisCellClick(rowIndex, colIndex)}
											>
												<div className="text-xs sm:text-sm">
													{getCellContent(rowIndex, colIndex)}
												</div>
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="p-3 bg-gray-50 border-t border-gray-300">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500">
							<div>※ 数値は各診療科の診察患者数を示します</div>
							<div>最終更新: {getCurrentJapaneseDate()}</div>
						</div>
					</div>
				</Paper>

				{/* Management Items Section - Using Enhanced Component */}
				<ManagementComments
					comments={managementComments}
					title="管理事項"
					showSummary={true}
					summaryMessage="本日の管理事項はすべて正常に処理されました。特段の問題は発生していません。"
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

			{/* Footer */}
			<Paper elevation={1} className="p-4 mt-6 bg-gray-50 border border-gray-200">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
					<div>
						<span className="font-medium">作成者:</span> 管理部 田中太郎
						<span className="mx-2">|</span>
						<span className="font-medium">承認者:</span> 理事長 鈴木一郎
						<span className="mx-2">|</span>
						<span className="font-medium">コメント数:</span> {managementComments.length}
					</div>
					<div className="mt-2 sm:mt-0">
						最終更新: {getCurrentJapaneseDate()} 19:30
					</div>
				</div>
			</Paper>
		</div>
	);
}

export default Report;