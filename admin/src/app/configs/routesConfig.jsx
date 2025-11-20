import FuseUtils from '@fuse/utils';
import FuseLoading from '@fuse/core/FuseLoading';
import { Navigate } from 'react-router-dom';
import settingsConfig from 'app/configs/settingsConfig';
import SignInConfig from '../main/sign-in/SignInConfig';
import SignUpConfig from '../main/sign-up/SignUpConfig';
import SignOutConfig from '../main/sign-out/SignOutConfig';
import Error404Page from '../main/404/Error404Page';
import DashboardConfig from '../main/dashboard/DashboardConfig';
import InjuryIllnessConfig from '../main/admin/injury-illness/InjuryIllnessConfig';
import MedicalPracticeConfig from '../main/admin/medical-practice/MedicalPracticeConfig';
import MedicineConfig from '../main/admin/medicine/MedicineConfig';
import MedicinalEfficacyConfig from '../main/admin/medicinal-efficacy/MedicinalEfficacyConfig';

import ICDtoDPCConfig from '../main/admin/layer-1/ICDtoDPCConfig';
import AgeBirthWeightConfig from '../main/admin/layer-1/AgeBirthWeightConfig';
import SurgeryConfig from '../main/admin/layer-2/SurgeryConfig';
import Treatment1Config from '../main/admin/layer-3/Treatment1Config';
import Treatment2Config from '../main/admin/layer-3/Treatment2Config';
import SecondaryInjuryConfig from '../main/admin/layer-3/SecondaryInjuryConfig';

import HospitalConfig from '../main/admin/hospital-management/HospitalConfig';
import StaffConfig from '../main/staff-management/StaffConfig';
import CCPMConfig from '../main/admin/ccpm/CCPMConfig';
import DataUploadConfig from '../main/data-upload/DataUploadConfig';
import DPCAnalysisConfig from '../main/dpc-analysis/DPCAnalysisConfig';
import SearchConfig from '../main/search/SearchConfig';
import PageConfig from '../main/page/PageConfig';
import IssueConfig from '../main/issue/IssueConfig';
import ProfileConfig from '../main/profile/ProfileConfig';
import DPCDiseaseConfig from '../main/admin/dpc-disease-classi/DPCDiseaseConfig';
import DaysScoreConfig from '../main/admin/days-score/DaysScoreConfig';

const routeConfigs = [DashboardConfig, InjuryIllnessConfig,MedicalPracticeConfig, MedicineConfig, MedicinalEfficacyConfig, SignOutConfig, SignInConfig, SignUpConfig, ICDtoDPCConfig, AgeBirthWeightConfig, SurgeryConfig, Treatment1Config, Treatment2Config,SecondaryInjuryConfig, HospitalConfig, StaffConfig, CCPMConfig, DataUploadConfig, DPCAnalysisConfig, SearchConfig, PageConfig , IssueConfig, ProfileConfig, DPCDiseaseConfig, DaysScoreConfig];
/**
 * The routes of the application.
 */
const routes = [
	...FuseUtils.generateRoutesFromConfigs(routeConfigs, settingsConfig.defaultAuth),
	{
		path: '/',
		element: <Navigate to="/dashboard" />,
		auth: settingsConfig.defaultAuth
	},
	{
		path: 'loading',
		element: <FuseLoading />
	},
	{
		path: '404',
		element: <Error404Page />
	},
	{
		path: '*',
		element: <Navigate to="404" />
	}
];
export default routes;
