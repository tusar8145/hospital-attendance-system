import i18next from 'i18next';
import { lazy } from 'react';
import en from './i18n/en';
import tr from './i18n/tr';
import ar from './i18n/ar';
import ja from './i18n/ja';

i18next.addResourceBundle('en', 'Example2Page', en);
i18next.addResourceBundle('tr', 'example2Page', tr);
i18next.addResourceBundle('ar', 'example2Page', ar);
i18next.addResourceBundle('ja', 'example2Page', ja);
const Example2 = lazy(() => import('./Example2'));
/**
 * The Example2 page config.
 */
const ExampleConfig2 = {
	settings: {
		layout: {}
	},
	auth    : authRoles.admin,
	routes: [
		{
			path: 'injury- ',
			element: <Example2 />
		}
	]
};
export default ExampleConfig2;
