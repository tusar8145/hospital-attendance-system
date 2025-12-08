import i18next from 'i18next';
import { lazy } from 'react';
import en from './i18n/en';
import ja from './i18n/ja';
import {authRoles} from '../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);
const ReportEntry = lazy(() => import('./ReportEntry'));
/**
 * The ReportEntry page config.
 */
const ReportEntryConfig = {
	settings: {
		layout: {}
	},
	auth    : authRoles.common,
	routes: [
		{
			path: 'report-entry',
			element: <ReportEntry />
		}
	]
};
export default ReportEntryConfig;
