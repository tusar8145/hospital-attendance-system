import i18next from 'i18next';
import { lazy } from 'react';
import en from './i18n/en';
import ja from './i18n/ja';
import {authRoles} from '../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);
const ReportList = lazy(() => import('./ReportList'));
/**
 * The ReportList page config.
 */
const ReportListConfig = {
	settings: {
		layout: {}
	},
	auth    : authRoles.common,
	routes: [
		{
			path: 'report-list',
			element: <ReportList />
		}
	]
};
export default ReportListConfig;
