import i18next from 'i18next';
import en from './navigation-i18n/en';
import ja from './navigation-i18n/ja';
import { authRoles } from '../auth';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('ja', 'navigation', ja);

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig = [
 


	{
		id: '1',
		title: 'Dashboard',
		translate: 'Dashboard',
		type: 'item',
		icon: 'material-outline:widgets',
		auth: authRoles.common,
		url: 'dashboard'
	},
	/*{
		id: '7',
		title: 'Contact form',
		translate: 'ContactForm',
		type: 'item',
		icon: 'heroicons-solid:chat-alt-2',
		auth: authRoles.admin_hospitalAssistant_staff,
		url: 'contact-form'
	},*/
{
	id: '32',
	title: 'Facility List',
	translate: 'FacilityList',
	type: 'item',
	icon: 'local_hospital',
	auth: authRoles.admin,
	url: 'medical-center'
},
{
	id: '33',
	title: 'Department',
	translate: 'Department',
	type: 'item',
	icon: 'work',
	auth: authRoles.admin_hospitalAssistant_staff,
	url: 'department'
},
{
	id: '34',
	title: 'Doctor',
	translate: 'Doctor',
	type: 'item',
	icon: 'person_pin',
	auth: authRoles.admin_hospitalAssistant_staff,
	url: 'doctor'
},
{
	id: '8',
	title: 'User management',
	translate: 'UserManagement',
	type: 'item',
	icon: 'heroicons-solid:user-add',
	auth: authRoles.admin_hospitalAssistant_staff,
	url: 'user-management'
},


];
export default navigationConfig;
