import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import ManagementLog from './ManagementLog';

import HospitalDataTable from './components/HospitalDataTable';
import SimpleDutyTable from './components/SimpleDutyTable';
import MedicalManagementTable from './components/MedicalManagementTable';
import DetailedDutyTable from './components/DetailedDutyTable';
import VisitTable from './components/VisitTable';
import DiagnosisTable from './components/DiagnosisTable';
import PatientCountTable from './components/PatientCountTable';
import { CommonHeader } from '../../../shared-components/new/CommonHeader';

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

	const [tableData, setTableData] = useState([
		{
			id: 1,
			header: '確認状態',
			content: {
				hasCheckbox: true,
				checked: true,
				lines: ['確認済み', '10月12日 15:30'],
				date: '10月12日 15:30'
			}
		},
		{
			id: 2,
			header: '確認状態',
			content: {
				hasCheckbox: true,
				checked: false,
				lines: ['未確認', '10月13日 09:15'],
				date: '10月13日 09:15'
			}
		},
		...Array.from({ length: 10 }, (_, i) => ({
			id: i + 3,
			header: '',
			content: null
		}))
	]);

	// Get current date in Japanese format: 2025年7月07日
	const getCurrentJapaneseDate = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		const date = now.getDate();
		return `${year}年${month.toString().padStart(2, '0')}月${date.toString().padStart(2, '0')}日`;
	};

	// Empty function for approval button
	const handleApproval = () => {
		console.log('Approval button clicked');
		// Add approval logic here
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

	const updateTableData = (newData) => {
		setTableData(newData);
	};

	return (
				<div className="flex flex-col container">
					{successAlert != null && <Alert severity="success" className="text-sm">{t(successAlert)}.</Alert>}
					{failAlert != null && <Alert severity="error" className="text-sm">{t(failAlert)}.</Alert>}

					<div className="flex flex-col lg:flex-row gap-6">
						<div className="lg:w-2/12">
							<div className="p-3">
								<h3 className="text-3xl font-bold text-gray-800 mb-3">管理日誌</h3>
							</div>
						</div>

						<div className="lg:w-2/12">
							<div className="p-3">
								<ManagementLog
									tableData={[
										{
											id: 1,
											header: '理事長',
											content: null
										},
										{
											id: 2,
											header: '専務',
											content: {
												hasCheckbox: true,
												checked: true,
												lines: ['Verified', '09:30'],
												date: '09:30'
											}
										}
									]}
									title={null}
									fixedCellHeight="54px"
									fixedCellWidth="40px"
								/>
							</div>
						</div>

						<div className="lg:w-1/12">
						</div>

						<div className="lg:w-7/12">
							<div className="p-3">
								<ManagementLog
									tableData={tableData}
									title={null}
									fixedCellHeight="54px"
									fixedCellWidth="72px"
								/>
							</div>
						</div>
					</div>




					<div className="flex flex-col lg:flex-row gap-0 mt-40">
						{/* 左侧区域 - 40% */}
						<div className="lg:w-4/12">
							<div className=" p-0 h-full">
								<div className="flex flex-col h-full gap-4">
									{/* 第一行: 管理日誌标题 */}
									<div className=" p-0  bg-transparent mb-20">
										<h3 className="text-3xl font-bold text-gray-800">令和〇〇年○○月○○日（曜日）</h3>
										<p className="text-xl font-bold text-gray-800">施設名</p>
										<hr />
									</div>

									{/* 第二行: 空区域 */}
									<div className=" p-0  bg-transparent flex-1">
										<div className="h-full flex justify-center">
											<div className="text-center w-full">
												<HospitalDataTable />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* 中间区域 - 20% */}
						<div className="lg:w-2/12">
							<div className="p-0   h-full">
								<div className="h-full flex justify-center">
									<div className="text-center w-full">
										<MedicalManagementTable />
									</div>
								</div>
							</div>
						</div>
						<div className="lg:w-1/12"></div>
						{/* 右侧区域 - 40% */}
						<div className="lg:w-5/12">
							<div className="p-0 h-full ml-0">
								<div className="flex flex-col h-full gap-4">
									{/* 第一行: 单个区域 */}
									<div className="p-0  bg-transparent h-1/2">
										<div className="h-full flex justify-center">
											<div className="text-center w-full">
												<DetailedDutyTable />
											</div>
										</div>
									</div>

									{/* 第二行: 两个50%的并排区域 */}
									<div className="flex gap-4 h-1/2">
										{/* 左侧50% */}
										<div className="w-2/6 p-0  bg-transparent">
											<div className="h-full flex justify-left">
												<div className="text-center w-full">
													<SimpleDutyTable />
												</div>
											</div>
										</div>
										<div className="w-3/6 p-0  bg-transparent">
										</div>
										{/* 右侧50% */}
										<div className="w-1/6 p-0  bg-transparent">
											<div className="h-full flex justify-end">
												<div className="text-center w-full">
													<VisitTable />
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>




					<div className="flex flex-col lg:flex-row gap-0 mt-40">
						{/* 左侧区域 - 40% */}
						<div className="lg:w-12/12">
							<div className=" p-0 h-full">
								<div className="flex flex-col h-full gap-4">
									{/* 第二行: 空区域 */}
									<div className=" p-0  bg-transparent flex-1">
										<div className="h-full flex justify-center">
											<div className="text-center w-full">
												<DiagnosisTable />
											</div>
										</div>
									</div>

								</div>
							</div>
						</div>
					</div>


					<div className="flex flex-col lg:flex-row gap-0 mt-40">
						{/* 左侧区域 - 40% */}
						<div className="lg:w-12/12">
							<div className=" p-0 h-full">
								<div className="flex flex-col h-full gap-4">
									{/* 第二行: 空区域 */}
									<div className=" p-0  bg-transparent flex-1">
										<div className="h-full flex justify-center">
											<div className="text-center w-full">
												<PatientCountTable />
											</div>
										</div>
									</div>

								</div>
							</div>
						</div>
					</div>


				</div>

	);
}

export default Report;