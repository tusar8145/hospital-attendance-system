import i18next from 'i18next';
import { lazy } from 'react';
import en from '../../../shared-components/i18n/en';
import ja from '../../../shared-components/i18n/ja';

import {authRoles} from '../../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);



const AgeBirthWeight = lazy(() => import('./AgeBirthWeight'));
/**
 * The Example2 page config.
 */
const AgeBirthWeightConfig = {
	settings: {
		layout: {}
	},
	auth    : authRoles.common,
	routes: [
		{
			path: 'dpc-management/age-birth-weight',
			element: <AgeBirthWeight />
		}
	]
};
export default AgeBirthWeightConfig;
