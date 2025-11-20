import i18next from 'i18next';
import { lazy } from 'react';
import en from '../../shared-components/i18n/en';
import ja from '../../shared-components/i18n/ja';

import {authRoles} from '../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);



const Issue = lazy(() => import('./Issue'));
/**
 * The Example2 Issue config.
 */
const IssueConfig = {
	settings: {
		layout: {}
	},
	auth    : authRoles.common,
	routes: [
		{
			path: 'contact-form',
			element: <Issue />
		}
	]
};
export default IssueConfig;
