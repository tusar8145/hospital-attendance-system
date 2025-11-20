import i18next from 'i18next';
import { lazy } from 'react';
import en from '../../../shared-components/i18n/en';
import ja from '../../../shared-components/i18n/ja';
 

import {authRoles} from '../../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);
 


const InjuryIllness = lazy(() => import('./InjuryIllness'));
/**
 * The Example2 page config.
 */
const InjuryIllnessConfig = {
	settings: {
		layout: {}
	},
	auth    : authRoles.common,
	routes: [
		{
			path: 'data-registration/injury-illness',
			element: <InjuryIllness />
		}
	]
};
export default InjuryIllnessConfig;
