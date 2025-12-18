import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import { useLocation, useSearchParams } from 'react-router-dom';
import ReportEntryBig from './ReportEntryBig';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

//import ReportEntryHospitalMain from './ReportEntryHospitalMain'; // Assuming you have this
//import ReportEntryWelfareMain from './ReportEntryWelfareMain'; // Assuming you have this
import { 
  Box, 
  Button, 
  Container, 
  CircularProgress, 
  Typography,
  Paper,

} from '@mui/material';


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
	const [overwrite, setoverwrite] = useState(null);
	
	// Get report ID from URL if exists
	const reportIdFromUrl = searchParams.get('reportId');
	const hospitalId = searchParams.get('hospitalId');
  const handleBack = () => {
    //onBack();
  };

  const handleReloadWithCorrectHospital  = () => {
window.location.reload();
  }

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
		if(hospital && hospitalId){
			if(parseInt(hospital.id) !=parseInt(hospitalId)){
					setoverwrite(true)
			}else{	
					setoverwrite(false)
			}
		}
		determineHospitalType();
	}, [reportIdFromUrl, hospital]);




	// Function to render appropriate component based on hospital_type
	const renderReportComponent = () => {
		if (loading ) {
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

		if (overwrite ) {
			return (
		<Container 
			maxWidth="md" 
			sx={{ 
				display: 'flex', 
				flexDirection: 'column',
				justifyContent: 'center', 
				alignItems: 'center', 
				minHeight: '100vh',
				p: 3
			}}
		>
			<Paper 
				elevation={2}
				sx={{ 
					p: 4, 
					textAlign: 'center',
					borderRadius: 2,
					backgroundColor: '#fff',
					width: '100%',
					maxWidth: 500,
					border: '1px solid #ff9800'
				}}
			>
				<ErrorOutlineIcon 
					sx={{ 
						fontSize: 48, 
						color: '#ff9800',
						mb: 2
					}} 
				/>
				
				<Typography variant="h5" sx={{ fontWeight: 600, color: '#e65100', mb: 2 }}>
					編集モードでは病院を変更できません
				</Typography>
				
				<Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
					現在選択中の病院と編集対象のレポートの病院が異なります。
				</Typography>
				
				<Box sx={{ 
					backgroundColor: '#fff8e1', 
					p: 2, 
					borderRadius: 1,
					mb: 3,
					border: '1px solid #ffe082'
				}}>
					<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#5d4037' }}>
						詳細情報:
					</Typography>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
						<Box>
							<Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
								現在の病院:
							</Typography>
							<Typography variant="body2" sx={{ color: '#d84315', fontWeight: 600 }}>
								{hospital?.name || `ID: ${hospital?.id}`}
							</Typography>
						</Box>
						<Box>
							<Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
								対象病院:
							</Typography>
							<Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600 }}>
								ID: {hospitalId}
							</Typography>
						</Box>
					</Box>
				</Box>
				
				<Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
					データ整合性のため、編集モードでは病院を変更できません。
				</Typography>
				
 
<Button
    fullWidth
    variant="contained"
    onClick={handleReloadWithCorrectHospital}
    sx={{ 
        py: 1.5,
        backgroundColor: '#1976d2', // Primary color
        color: 'white', // White text
        mb: 2,
        '&:hover': {
            backgroundColor: '#1565c0', // Darker primary on hover
        },
        '&:disabled': {
            backgroundColor: 'rgba(0, 0, 0, 0.12)', // Disabled state
            color: 'rgba(0, 0, 0, 0.26)',
        }
    }}
    disabled={!hospitalId}
>
    正しい病院で開き直す
</Button>
			</Paper>
			
			<Typography variant="caption" sx={{ mt: 3, color: '#999' }}>
				問題が解決しない場合は、システム管理者に連絡してください。
			</Typography>
		</Container>
			);
		}

		switch (hospital_type) {
			case 'large_hospital':
				return (<>
					<ReportEntryBig 
						reportId={reportIdFromUrl}
						hospitalType={hospital_type}
						hospital={hospital}
						newHospital={hospital}
						onSuccess={(message) => setSuccessAlert(message)}
						onError={(message) => setFailAlert(message)}
					/>				
				</>
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