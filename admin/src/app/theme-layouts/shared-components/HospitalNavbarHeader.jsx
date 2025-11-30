import { darken, styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { selectUser } from 'src/app/auth/user/store/userSlice';
import { useAppSelector } from 'app/store/hooks';
import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import '../../../styles/custom-header.css';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useState, useMemo } from 'react';
import { filterItemsEqual } from '../../helpers/commonHelpers';
import User from '../../auth/user/user';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, TextField, InputAdornment, Divider, ListSubheader, IconButton, Chip, Hidden } from "@mui/material";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Root = styled('div')(({ theme }) => ({
	'& .username, & .email': {
		transition: theme.transitions.create('opacity', {
			duration: theme.transitions.duration.shortest,
			easing: theme.transitions.easing.easeInOut
		})
	}
}));

function HospitalNavbarHeader() {
	const { t } = useTranslation('shared-components');
	const { 
		hospital, 
		toggleHospital, 
		refreshHospital, 
		toggleRefreshHospital,
		refreshHospitalList,
		toggleRefreshHospitalList
	} = useTheme();
	const [hos, setHos] = React.useState('*');
	const [anchorEl, setAnchorEl] = React.useState(null);
	const [searchTerm, setSearchTerm] = React.useState('');
	const open = Boolean(anchorEl);
	let this_user = User();
	const queryClient = useQueryClient();

	// Use React Query for hospital list with automatic refetching
	const { data: hospitalsData, refetch: refetchHospitals } = useQuery({
		queryKey: ['hospital-manage-list'],
		queryFn: async () => {
			const response = await axios.post(apiConfig.hospitalManageList, {});
			return response.data;
		},
	});

	// Process hospitals data
	const hospitals = useMemo(() => {
		if (!hospitalsData?.data) return [];
		
		return hospitalsData.data.map(item => {
			let f1 = item.name.substring(0, 22);
			if (item.name.length > 22) {
				f1 = f1 + '..';
			}
			
			return {
				id: item.id,
				logo: item.logo,
				name: item.name,
				sort_name: f1,
				address: item.address,
				full_name: item.name,
				email: item.admin_email,
			};
		});
	}, [hospitalsData]);

	// Memoized filtered hospitals for better performance
	const filteredHospitals = useMemo(() => {
		if (searchTerm.trim() === '') {
			return hospitals;
		}
		return hospitals.filter(hospital =>
			hospital.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			hospital.sort_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(hospital.email && hospital.email.toLowerCase().includes(searchTerm.toLowerCase()))
		);
	}, [searchTerm, hospitals]);

	// Handle refresh from ThemeContext
	useEffect(() => {
		if (refreshHospitalList) {
			queryClient.invalidateQueries(['hospital-manage-list']);
			toggleRefreshHospitalList(false);
		}
	}, [refreshHospitalList, toggleRefreshHospitalList, queryClient]);

	// Handle hospital selection from user profile
	useEffect(() => {
		if (this_user.hospital != null && hospitals.length > 0) {
			selectHospital(this_user.hospital.id);
		}
		if (this_user.hospital == null && hospitals.length > 0) {
			selectHospital(null);
		}
	}, [this_user.hospital, hospitals]);

	const handleMenuOpen = (event) => {
		setAnchorEl(event.currentTarget);
		setSearchTerm('');
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSearchTerm('');
	};

	const handleHospitalSelect = (hospitalId) => {
		if (hospitalId > 0) {
			let filter = filterItemsEqual(hospitals, 'id', hospitalId);
			toggleHospital(filter[0]);
			setHos(hospitalId);
		} else {
			toggleHospital(null);
			setHos('*');
		}
		handleMenuClose();
	};

	const handleSearchChange = (event) => {
		setSearchTerm(event.target.value);
	};

	const clearSearch = () => {
		setSearchTerm('');
	};

	function selectHospital(id) {
		if (id > 0) {
			let filter = filterItemsEqual(hospitals, 'id', id);
			toggleHospital(filter[0]);
			setHos(id);
		} else {
			toggleHospital(null);
			setHos('*');
		}
	}

	const user = useAppSelector(selectUser);

	// Get the display title - selected facility name or "全病院・施設"
	const getDisplayTitle = () => {
		if (hos === '*') {
			return "全病院・施設";
		}
		const selected = hospitals.find(h => h.id === hos);
		return selected ? selected.name : "全病院・施設";
	};

	// Get the button text - always "施設切替"
	const getButtonText = () => {
		return "施設切替";
	};

	// Get truncated title for mobile
	const getTruncatedTitle = () => {
		const title = getDisplayTitle();
		if (title.length > 12) {
			return title.substring(0, 12) + '...';
		}
		return title;
	};

	return (
		<Root className="user relative flex flex-col items-center justify-center p-0">
			{/* Desktop Version */}
			<Hidden lgDown>
				<Box
					sx={{
						display: "flex",
						width: 260,
						height: 45,
						alignItems: "center",
						justifyContent: "space-between",
						px: 2,
						py: 0,
						bgcolor: "primary.main",
						borderRadius: 2,
						border: 1,
						borderColor: "#dfe1e7",
					}}
				>
					{/* Title - Shows selected facility name or "全病院・施設" */}
					<Typography
						sx={{
							fontWeight: 600,
							color: "white",
							fontSize: "14px",
							textAlign: "center",
							whiteSpace: "nowrap",
							maxWidth: 120,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{getDisplayTitle()}
					</Typography>

					{/* Button - Always shows "施設切替" */}
					<Button
						variant="outlined"
						onClick={handleMenuOpen}
						sx={{
							minHeight: 25,
							height: 25,
							padding: "0 6px",
							alignItems: "center",
							bgcolor: "white",
							borderRadius: 1,
							textTransform: "none",
							"&:hover": {
								bgcolor: "grey.50",
								borderColor: "#e0e0e0",
							},
						}}
					>
						<Typography
							sx={{
								fontWeight: 500,
								color: "primary.main",
								fontSize: "13px",
								textAlign: "center",
								whiteSpace: "nowrap",
								lineHeight: 1,
							}}
						>
							{getButtonText()}
						</Typography>
						<ArrowDropDownIcon
							sx={{
								width: 20,
								height: 20,
								color: "primary.main",
							}}
						/>
					</Button>
				</Box>
			</Hidden>

			{/* Mobile Version */}
			<Hidden lgUp>
				<Box
					sx={{
						display: "flex",
						width: 170,
						height: 32,
						alignItems: "center",
						justifyContent: "space-between",
						px: 1.5,
						py: 0,
						bgcolor: "primary.main",
						borderRadius: 1,
						border: 1,
						borderColor: "#dfe1e7",
					}}
				>
					{/* Title - Shows truncated selected facility name or "全病院・施設" */}
					<Typography
						sx={{
							fontWeight: 600,
							color: "white",
							fontSize: "12px",
							textAlign: "center",
							whiteSpace: "nowrap",
							maxWidth: 80,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{getTruncatedTitle()}
					</Typography>

					{/* Button - Always shows "切替" on mobile */}
					<Button
						variant="outlined"
						onClick={handleMenuOpen}
						sx={{
							minHeight: 20,
							height: 20,
							padding: "0 4px",
							alignItems: "center",
							bgcolor: "white",
							borderRadius: 0.5,
							textTransform: "none",
							minWidth: 'auto',
							"&:hover": {
								bgcolor: "grey.50",
								borderColor: "#e0e0e0",
							},
						}}
					>
						<Typography
							sx={{
								fontWeight: 500,
								color: "primary.main",
								fontSize: "11px",
								textAlign: "center",
								whiteSpace: "nowrap",
								lineHeight: 1,
							}}
						>
							切替
						</Typography>
						<ArrowDropDownIcon
							sx={{
								width: 16,
								height: 16,
								color: "primary.main",
							}}
						/>
					</Button>
				</Box>
			</Hidden>

			{/* Custom Dropdown Menu with Search - Same for both desktop and mobile */}
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleMenuClose}
				PaperProps={{
					sx: {
						width: { xs: 280, sm: 320 },
						maxHeight: 400,
						mt: 1,
					}
				}}
			>
				{/* Search Header */}
				<ListSubheader sx={{ p: 2, pb: 1, lineHeight: 1 }}>
					<TextField
						fullWidth
						size="small"
						placeholder={t('Search facilities...')}
						value={searchTerm}
						onChange={handleSearchChange}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" color="action" />
								</InputAdornment>
							),
							endAdornment: searchTerm && (
								<InputAdornment position="end">
									<IconButton size="small" onClick={clearSearch}>
										<ClearIcon fontSize="small" />
									</IconButton>
								</InputAdornment>
							),
						}}
						sx={{
							'& .MuiOutlinedInput-root': {
								backgroundColor: 'background.paper',
							}
						}}
					/>
					{searchTerm && (
						<Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Chip 
								label={`${filteredHospitals.length} facilities found`}
								size="small"
								color="primary"
								variant="outlined"
							/>
							<IconButton size="small" onClick={clearSearch}>
								<ClearIcon fontSize="small" />
							</IconButton>
						</Box>
					)}
				</ListSubheader>

				<Divider />

				{/* ALL Hospital Option */}
				<MenuItem 
					onClick={() => handleHospitalSelect('*')}
					selected={hos === '*'}
					sx={{
						fontWeight: hos === '*' ? 600 : 400,
						backgroundColor: hos === '*' ? 'action.selected' : 'transparent',
					}}
				>
					{t('ALL Hospital')}
				</MenuItem>

				<Divider />

				{/* Facilities List */}
				<Box sx={{ maxHeight: 300, overflow: 'auto' }}>
					{filteredHospitals.length > 0 ? (
						filteredHospitals.map((_item) => (
							<MenuItem 
								key={_item.id} 
								onClick={() => handleHospitalSelect(_item.id)}
								selected={hos === _item.id}
								sx={{
									fontWeight: hos === _item.id ? 600 : 400,
									py: 1.5,
									backgroundColor: hos === _item.id ? 'action.selected' : 'transparent',
								}}
							>
								<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
									<Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
										{_item.name}
									</Typography>
									{_item.address && (
										<Typography 
											variant="caption" 
											sx={{ 
												color: 'text.secondary',
												fontSize: '0.7rem',
												lineHeight: 1.2,
												mt: 0.5
											}}
										>
											{_item.address}
										</Typography>
									)}
								</Box>
							</MenuItem>
						))
					) : (
						<MenuItem disabled sx={{ justifyContent: 'center', py: 3 }}>
							<Typography 
								variant="body2" 
								sx={{ 
									color: 'text.secondary',
									fontStyle: 'italic',
									textAlign: 'center'
								}}
							>
								{t('No facilities match your search')}
							</Typography>
						</MenuItem>
					)}
				</Box>
			</Menu>
		</Root>
	);
}

export default HospitalNavbarHeader;