// DoctorConfig.js
import i18next from 'i18next';
import { lazy } from 'react';
import en from './i18n/en';
import ja from './i18n/ja';
import {authRoles} from '../../../auth';

i18next.addResourceBundle('en', 'shared-components', en);
i18next.addResourceBundle('ja', 'shared-components', ja);
const Doctor = lazy(() => import('./Doctor'));

const DoctorConfig = {
  settings: {
    layout: {}
  },
  auth: authRoles.admin_hospitalAssistant_staff,
  routes: [
    {
      path: 'doctor',
      element: <Doctor />
    }
  ]
};
export default DoctorConfig;