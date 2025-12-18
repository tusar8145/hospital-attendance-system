import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import { useLocation, useSearchParams } from 'react-router-dom';
import ReportEntryBig from './ReportEntryBig';
//import ReportEntryHospitalMain from './ReportEntryHospitalMain'; // Assuming you have this
//import ReportEntryWelfareMain from './ReportEntryWelfareMain'; // Assuming you have this
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

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

function ReportEntryParent() {
	const { t } = useTranslation('shared-components');
	const [loading, setLoading] = useState(true);
	const [successAlert, setSuccessAlert] = useState(null);
	const [failAlert, setFailAlert] = useState(null);
	const { theme, toggleTheme } = useTheme();
	const { hospital, toggleHospital } = useTheme();
	const [hospital_type, setHospitalType] = useState(null);
	const [searchParams] = useSearchParams();
	const location = useLocation();
	
	// Get report ID from URL if exists
	const reportIdFromUrl = searchParams.get('reportId');

	const getReportType = async (reportId) => {
		try {
			setLoading(true);
			const response = await axios.post(`${apiConfig.baseURL}/report/hospital-type`, {
				report_id: parseInt(reportId)
			});

			if (response.data.success && response.data.data) {
				const { hospital_type: fetchedHospitalType } = response.data.data;
				setHospitalType(fetchedHospitalType);
			} else {
				// Fallback to hospital.type from theme context
				setHospitalType(hospital?.type || null);
			}
		} catch (error) {
			console.error('Error fetching report type:', error);
			// Fallback to hospital.type from theme context
			setHospitalType(hospital?.type || null);
		} finally {
			setLoading(false);
		}
	};

	// Determine hospital type based on URL parameters
	const determineHospitalType = () => {
		// If report ID exists in URL, fetch hospital_type from API
		if (reportIdFromUrl) {
			getReportType(reportIdFromUrl);
		} 

		// Otherwise use hospital.type from theme context
		else {
			setHospitalType(hospital?.type || null);
			setLoading(false);
		}
	};

	useEffect(() => {
		determineHospitalType();
	}, [reportIdFromUrl, hospital]);

	// Function to render appropriate component based on hospital_type
	const renderReportComponent = () => {
		if (loading) {
			return (
				<Box 
					sx={{ 
						display: 'flex', 
						justifyContent: 'center', 
						alignItems: 'center', 
						height: '50vh' 
					}}
				>
					<CircularProgress />
				</Box>
			);
		}

		switch (hospital_type) {
			case 'large_hospital':
				return (
					<ReportEntryBig 
						reportId={reportIdFromUrl}
						hospitalType={hospital_type}
						hospital={hospital}
						onSuccess={(message) => setSuccessAlert(message)}
						onError={(message) => setFailAlert(message)}
					/>
				);
			
			case 'hospital':
				return (
				<>hospital</>
				);
			
			case 'welfare':
				return (
					<>welfare</>
				);
			
			default:
				return (
					<>default</>
				);
		}
	};

	// Show alerts if any
	useEffect(() => {
		if (successAlert) {
			// Show success alert (you can use your alert/snackbar component)
			console.log('Success:', successAlert);
			setTimeout(() => setSuccessAlert(null), 5000);
		}
		
		if (failAlert) {
			// Show error alert (you can use your alert/snackbar component)
			console.error('Error:', failAlert);
			setTimeout(() => setFailAlert(null), 5000);
		}
	}, [successAlert, failAlert]);

	return (
		<Root
			header={<></>}
			content={renderReportComponent()}
		/>
	);
}

export default ReportEntryParent;