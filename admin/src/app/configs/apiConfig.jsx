let base_url= import.meta.env.VITE_BASE_URL
const apiConfig = {
    base_url:base_url,

    login: base_url + 'auth/login',
    forgotPassword: base_url + 'auth/forgot-password',
    verifyOTP: base_url + 'auth/verify-otp',
    resendOTP: base_url + 'auth/resend-otp',
    resetPassword: base_url + 'auth/reset-password',
        
    hospitalList:base_url+'crud/hospitals/list',

 
 

    hospitalManageList:base_url+'hospital-manage/list',
    hospitalManageCreate:base_url+'hospital-manage/create',
    hospitalManageRemove:base_url+'hospital-manage/remove',
    hospitalManageUpdate:base_url+'hospital-manage/update',
    hospitalManageLogo:base_url+'hospital-manage/logo',

    hospitalStaffManageListAssis:base_url+'hospital-staff-assistant-manage/list',

    hospitalStaffManageList:base_url+'hospital-staff-manage/list',
    hospitalStaffManageCreate:base_url+'hospital-staff-manage/create',
    hospitalStaffManageRemove:base_url+'hospital-staff-manage/remove',
    hospitalStaffManageUpdate:base_url+'hospital-staff-manage/update',
    hospitalStaffManageLogo:base_url+'hospital-staff-manage/logo',

 

    IssuePostIssue:base_url+'issue/post_issue',
    IssuePostIssueReply:base_url+'issue/post_issue_reply',
    IssueGetIssueReply:base_url+'issue/get_issue_reply',
    IssueGetIssue:base_url+'issue/get_issue',
    IssueUpdateIssues:base_url+'issue/update_issues',

    updatePassword:base_url+'admin/update_password',

    // Medical Centers
    medicalCenterList: base_url + 'medical-center/list',
    medicalCenterCreate: base_url + 'medical-center/create',
    medicalCenterUpdate: base_url + 'medical-center/update',
    medicalCenterStatus: base_url + 'medical-center/status',
    medicalCenterRemove: base_url + 'medical-center/remove',

    // Departments
    departmentList: base_url + 'department/list',
    departmentCreate: base_url + 'department/create',
    departmentUpdate: base_url + 'department/update',
    departmentStatus: base_url + 'department/status',
    departmentRemove: base_url + 'department/remove',

    // Doctors
    doctorList: base_url + 'doctor/list',
    doctorCreate: base_url + 'doctor/create',
    doctorUpdate: base_url + 'doctor/update',
    doctorStatus: base_url + 'doctor/status',
    doctorRemove: base_url + 'doctor/remove',
    doctorAssignDepartments: base_url + 'doctor/assign-departments',

    hospitalStaffManageAssignMedicalCenters:base_url +  `hospital-staff-manage/assign-medical-centers`,

  reportGetByDate: base_url +'/report/get-by-date',
  reportSubmit:  base_url +'/report/submit',
  reportDepartmentsWithDoctors: base_url +'/report/departments-with-doctors',
  reportStatus: base_url +'/report/status',

  reportList: base_url +'/report/list',
  reportExport: base_url +'/report/export',
  reportView: base_url +'/report/view',
  updateReportStatus: base_url +'/report/update-status',
  reportStatistics: base_url +'/report/statistics',
  
}
export default apiConfig;
