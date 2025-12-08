import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import { lazy } from 'react';
import { CommonHeader } from '../../shared-components/new/CommonHeader';
import { useMediaQuery, Container } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';

const Report = lazy(() => import('./big/FrameScreen'));
 
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

function ReportEntry() {
	const { t } = useTranslation('shared-components');
	const [loading, setLoading] = useState(false);
	const [successAlert, setSuccessAlert] = useState(null);
	const [failAlert, setFailAlert] = useState(null);
	const { theme, toggleTheme } = useTheme();
	const { hospital, toggleHospital } = useTheme();
	const muiTheme = useMuiTheme();
	const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
	const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));

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

	return (
		<Root
			header={
				<CommonHeader
					title={`レポート - ${getCurrentJapaneseDate()}`}
					onCreate={handleApproval}
					createButtonText="承認する"
					showFilter={false}
				/>
			}
			content={
				<Container 
					maxWidth={false} 
					sx={{ 
						p: isMobile ? 1 : isTablet ? 2 : 3,
						height: '100%',
						overflow: 'auto'
					}}
				>
					<div className="flex flex-col" style={{ height: '100%' }}>
						{successAlert != null && (
							<Alert severity="success" className="text-sm mb-2">
								{t(successAlert)}.
							</Alert>
						)}
						{failAlert != null && (
							<Alert severity="error" className="text-sm mb-2">
								{t(failAlert)}.
							</Alert>
						)}

						<div className="flex-1 overflow-hidden">
							<Report />
						</div>
					</div>
				</Container>
			}
		/>
	);
}

export default ReportEntry;