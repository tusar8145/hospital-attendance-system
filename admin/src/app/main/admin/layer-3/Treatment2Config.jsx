import i18next from 'i18next';
import { lazy } from 'react';
import en from '../../../shared-components/i18n/en';
import ja from '../../../shared-components/i18n/ja';

import {authRoles} from '../../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);



const Treatment2 = lazy(() => import('./Treatment2'));
/**
 * The Example2 page config.
 */
const Treatment2Config = {
	settings: {
		layout: {}
	},
	auth    : authRoles.common,
	routes: [
		{
			path: 'dpc-management/treatement-2',
			element: <Treatment2 />
		}
	]
};
export default Treatment2Config;
