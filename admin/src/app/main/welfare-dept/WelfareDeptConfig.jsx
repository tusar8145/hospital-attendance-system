import i18next from 'i18next';
import { lazy } from 'react';
import en from './i18n/en';
import ja from './i18n/ja';
import {authRoles} from '../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);
const WelfareDept = lazy(() => import('./WelfareDept'));
/**
 * The WelfareDept page config.
 */
const WelfareDeptConfig = {
	settings: {
		layout: {}
	},
	auth    : authRoles.common,
	routes: [
		{
			path: 'welfare-dept',
			element: <WelfareDept />
		}
	]
};
export default WelfareDeptConfig;
