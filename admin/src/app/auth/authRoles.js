/**
 * The authRoles object defines the authorization roles for the Fuse application.
 */
const authRoles = {
	/**
	 * The admin role grants access to users with the 'admin' role.
	 */
	admin: ['admin'],
	hospitalAssistant:['hospitalAssistant'],
	staff: ['staff'],
	operator: ['operator'],
	hospitalAssistant_staff: ['staff', 'hospitalAssistant'],
	admin_hospitalAssistant: ['admin', 'hospitalAssistant'],
	admin_hospitalAssistant_staff: ['admin', 'hospitalAssistant', 'staff'],
	common: ['admin', 'staff', 'hospitalAssistant', 'operator'],

	/**
	 * The onlyGuest role grants access to unauthenticated users.
	 */
	onlyGuest: []
};
export default authRoles;
