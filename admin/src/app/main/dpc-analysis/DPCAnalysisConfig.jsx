import i18next from 'i18next';
import { lazy } from 'react';
import en from '../../shared-components/i18n/en';
import ja from '../../shared-components/i18n/ja';

import {authRoles} from '../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);



const DPCAnalysis = lazy(() => import('./DPCAnalysis'));
/**
 * The Example2 page config.
 */
const DPCAnalysisConfig = {
	settings: {
		layout: {}
	},
	auth    : authRoles.hospitalAssistant_staff,
	routes: [
		{
			path: 'hospital/dpc-analysis',
			element: <DPCAnalysis />
		}
	]
};
export default DPCAnalysisConfig;
