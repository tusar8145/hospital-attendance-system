import Button from '@mui/material/Button';
import _ from '@lodash';
import { useEffect, useState } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import axios from 'axios';
import apiConfig from '../../configs/apiConfig';
import Alert from '@mui/material/Alert';
import {createdAt} from '../../helpers/timeHelpers';
import {filterItemsEqual} from '../../helpers/commonHelpers';
import SummaryWidget from '../../shared-components/card/SummaryWidget';
import { motion } from 'framer-motion';
import  User  from '../../auth/user/user';
import { changeFuseTheme } from '@fuse/core/FuseSettings/fuseSettingsSlice';
import { useAppDispatch, useAppSelector } from 'app/store/hooks';
import { selectUserSettings } from 'src/app/auth/user/store/userSlice';

 


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







 
function Dashboard() {

    let user=User()

	/*if(them!='applied') {
			if(user.role != 'admin'){
				localStorage.setItem("theme","applied");
			}
	}*/
	



	
 
	//

 
	

 
	let tableName=''
	let headingTitle='Dashboard'
  
	const { t } = useTranslation('shared-components');
 

	const [loading, setLoading] = useState(false);
 
 
	const [successAlert, setSuccessAlert] = useState(null);
	const [failAlert, setFailAlert] = useState(null);
 
	const { theme, toggleTheme } = useTheme();
	const { hospital, toggleHospital } = useTheme();
	
	useEffect(() => {  toggleTheme(t(headingTitle))  }, [t(headingTitle)]);


	const container = {
		show: {
			transition: {
				staggerChildren: 0.04
			}
		}
	};
	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 }
	};

	const [countHospital, setCountHospital] = useState(0);
	const [countAdmin, setCountAdmin] = useState(0);
	const [countAssistant, setCountAssistant] = useState(0);
	const [countStaff, setCountStaff] = useState(0);

	const [count3rd, setCount3rd] = useState(0);
	const [count7th, setCount7th] = useState(0);
	const [countAll, setCountAll] = useState(0);
	const [countDischarged, setCountDischarged] = useState(0);

	const [countWithC, setCountWithC] = useState(0);
	//setCountVerified

	async function dashboardCount(){
		let data = await axios.post(apiConfig.countAdminGroup, {});
		let getData=data.data.count

		for(let x=0; x<getData.length; x++){
			let this_=getData[x]

			if(this_.role=='admin'){setCountAdmin(this_._count.id)}
			if(this_.role=='hospitalAssistant'){setCountAssistant(this_._count.id)}
			if(this_.role=='staff'){setCountStaff(this_._count.id)}
 	
		}


		 data = await axios.post(apiConfig.countHospital, {});
		 getData=data.data.count._count.id
		 setCountHospital(getData)
		  
	}

	async function dashboardPatientCount(hospital){
		let data = await axios.post(apiConfig.PatientDashboardCount, {hospital_id:hospital.id});
		let getData=data.data.data
 
		setCount3rd(getData.total_3_hospitalized_count)
		setCount7th(getData.total_7_hospitalized_count)
		setCountAll(getData.total_hospitalized_count)
		setCountDischarged(getData.total_discharge_count)
		setCountWithC(getData.total_verified_count)
		
	}
	 
	useEffect(() => {
			if(hospital?.id > 0){
				dashboardPatientCount(hospital)
			}else{
						if(user?.role!='admin'){
							dashboardPatientCount(hospital)
						}else{
							dashboardCount()
						}
			}

	}, [user,hospital]);







	return (
		<Root
			header={
				<div className="p-24 hidden-on-large">
					<h4>{t(headingTitle)} </h4>
				</div>
			}
			content={
				<div className="flex flex-col items-center p-24 sm:p-40 container">

 					
					{successAlert != null && <Alert severity="success">{t(successAlert)}.</Alert>}
					{failAlert != null && <Alert severity="error">{t(failAlert)}..</Alert>}
		
					{hospital?.id>0? 
					
								        <motion.div
											className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-24 w-full min-w-0 py-24"
											variants={container}
											initial="hidden"
											animate="show"
										>
											<motion.div variants={item}>
												<SummaryWidget count={count3rd} view={1} link={'3'} color={''} title={t('3rd Day')} icon={'material-outline:bedtime'}/>
											</motion.div>
				
											<motion.div variants={item}>
												<SummaryWidget count={count7th} view={1} link={'7'}   color={'cadetblue'}   title={t('7th Day')}  icon={'material-outline:bedtime'}/>
											</motion.div>
				
											<motion.div variants={item}>
												<SummaryWidget count={countAll}  view={1} type={'all-active-patient'}  color={'violet'}   title={t('All  Patients')}  icon={'material-outline:bedtime'}/>
											</motion.div>
				
											<motion.div variants={item}>
												<SummaryWidget count={countDischarged}  view={1}  type={'dis-patient'} color={'coral'}  title={t('Discharged Patient')}  icon={'material-outline:bedtime'}/>
											</motion.div>
											 
											<motion.div variants={item}>
												<SummaryWidget count={countWithC}  view={1}    type={'all-changed'}  color={'burlywood'}  title={t('With Change')}  icon={'material-outline:bedtime'}/>
											</motion.div>
										</motion.div>
					:
						<motion.div
							className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-24 w-full min-w-0 py-24"
							variants={container}
							initial="hidden"
							animate="show"
						>
							<motion.div variants={item}>
								<SummaryWidget count={countHospital} admin={1} color={'tomato'}   title={t('Hospitals')} icon={'material-outline:local_hospital'}/>
							</motion.div>

							<motion.div variants={item}>
								<SummaryWidget count={countAdmin}  admin={1}   color={'darkcyan'}   title={t('Admin')}  icon={'heroicons-outline:user-circle'}/>
							</motion.div>

							<motion.div variants={item}>
								<SummaryWidget count={countHospital}   admin={1}  color={'darkgreen'}   title={t('Hospital Assistant')}  icon={'heroicons-outline:user'}/>
							</motion.div>

							<motion.div variants={item}>
								<SummaryWidget count={countStaff}  admin={1}   color={'blueviolet'}  title={t('Hospital Staff')}  icon={'heroicons-outline:user-group'}/>
							</motion.div>
						</motion.div>
					}
				</div>
			}
	/>

	);
}

export default Dashboard;
