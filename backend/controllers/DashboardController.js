import { PrismaClient } from '@prisma/client';
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

// Helper to format Japanese date
function formatJapaneseDate(date) {
  if (!date) return '--';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

// Helper function to get medical center filter based on user role
async function getMedicalCenterFilter(user) {
  if (!user) {
    return null; // No user, no filtering
  }

  // Admin and superAdmin can see all medical centers
  if (user.role === 'admin' || user.role === 'superAdmin') {
    return null; // No filtering for admins
  }

  // For other roles (hospitalAssistant, staff, operator), get assigned medical centers
  const adminMedicalCenters = await prisma.admin_medical_center.findMany({
    where: {
      admin_id: user.id
    },
    select: {
      medical_center_id: true
    }
  });

  const medicalCenterIds = adminMedicalCenters.map(amc => amc.medical_center_id);

  if (medicalCenterIds.length > 0) {
    return { in: medicalCenterIds };
  } else {
    // If no medical centers assigned, return empty result
    return -1;
  }
}

// Helper function to get medical center IDs for non-admin users
async function getAssignedMedicalCenterIds(user) {
  if (!user || user.role === 'admin' || user.role === 'superAdmin') {
    return null; // Admins can see all
  }

  const adminMedicalCenters = await prisma.admin_medical_center.findMany({
    where: {
      admin_id: user.id
    },
    select: {
      medical_center_id: true
    }
  });

  const medicalCenterIds = adminMedicalCenters.map(amc => amc.medical_center_id);
  return medicalCenterIds.length > 0 ? medicalCenterIds : [];
}

// Get dashboard statistics
// Get dashboard statistics
export const getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user;
    const { month, year, hospital_id } = req.body;
    
    // Default to current month if not specified
    const now = new Date();
    const selectedYear = year || now.getFullYear();
    const selectedMonth = month || now.getMonth() + 1;
    
    // Calculate date range for the selected month
    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth, 0);
    
    // Get assigned medical center IDs for non-admin users
    const assignedMedicalCenterIds = await getAssignedMedicalCenterIds(user);
    
    // Build where conditions for report filtering
    const reportWhere = {};

    /////////////////////////////////////////////////////////
    // Get my pending approval reports count
    const myPendingWhere = {};
    let myreport = 0;
    let myreportError = 0;

    // Apply hospital_id filter if provided
    if (hospital_id) {
      myPendingWhere.medical_center_id = parseInt(hospital_id);
    } else {
      // Otherwise, get medical center filter based on user role
      const medicalCenterFilter = await getMedicalCenterFilter(user);
      if (medicalCenterFilter) {
        if (medicalCenterFilter === -1) {
          myreportError = 1;
        } else {
          myPendingWhere.medical_center_id = medicalCenterFilter;
        }
      }
    }

    // Filter by next_role matching user's role for pending approvals
    if (!myreportError) {
      if (user.role === 'superAdmin') {
        myPendingWhere.next_role = 'admin';
      } else if (user.role === 'staff') {
        myPendingWhere.next_role = { in: ['staff', 'operator'] };
      } else {
        myPendingWhere.next_role = user.role;
      }

      // Only show submitted reports that need approval
      myPendingWhere.status = { in: ['submitted'] };

      // Get count for user's pending approval reports
      myreport = await prisma.report.count({ where: myPendingWhere });
    }
    /////////////////////////////////////////////////////////

    // Apply hospital_id filter to main report statistics if provided
    if (hospital_id) {
      reportWhere.medical_center_id = parseInt(hospital_id);
    } 
    // Otherwise, filter reports by assigned medical centers for non-admin users
    else if (assignedMedicalCenterIds !== null) {
      if (assignedMedicalCenterIds.length === 0) {
        // No medical centers assigned, return empty statistics
        return response.success({
          reportStats: {
            draft: 0,
            submitted: 0,
            approved: 0,
            pending: 0,
            total: 0
          },
          medicalCenterStats: {
            total: 0,
            byType: {
              large_hospital: 0,
              hospital: 0,
              welfare: 0
            },
            list: []
          },
          departmentStats: {
            total: 0,
            byHospital: []
          },
          doctorStats: {
            total: 0,
            byHospital: []
          },
          currentMonth: selectedMonth,
          currentYear: selectedYear,
          userRole: user.role,
          myreport: myreport
        }, res);
      }
      reportWhere.medical_center_id = { in: assignedMedicalCenterIds };
    }

    // Add date filter for the selected month
    reportWhere.report_date = {
      gte: startOfMonth,
      lte: endOfMonth
    };

    // 1. Get report statistics for the selected month
    const reports = await prisma.report.findMany({
      where: reportWhere,
      select: {
        status: true,
        medical_center_id: true
      }
    });

    // Calculate report statistics
    const reportStats = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      pending: 0, // draft + submitted
      total: reports.length
    };

    reports.forEach(report => {
      reportStats[report.status]++;
      if (report.status === 'draft' || report.status === 'submitted') {
        reportStats.pending++;
      }
    });

    // 2. Get medical center statistics
    let medicalCenterWhere = {
      status: 1 // ADDED: Filter by active medical centers
    };
    
    // Apply hospital_id filter if provided
    if (hospital_id) {
      medicalCenterWhere.id = parseInt(hospital_id);
    } 
    // Otherwise, filter by assigned medical centers for non-admin users
    else if (assignedMedicalCenterIds !== null && assignedMedicalCenterIds.length > 0) {
      medicalCenterWhere.id = { in: assignedMedicalCenterIds };
    }

    const medicalCenters = await prisma.medical_center.findMany({
      where: medicalCenterWhere,
      select: {
        id: true,
        name: true,
        type: true,
        logo: true,
        status: true, // ADDED: Include status in selection
        created_at: true,
        _count: {
          select: {
            departments: {
              where: { status: 1 }
            },
            doctors: {
              where: { status: 1 }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const medicalCenterStats = {
      total: medicalCenters.length,
      byType: {
        large_hospital: 0,
        hospital: 0,
        welfare: 0
      },
      list: medicalCenters.map(mc => ({
        id: mc.id,
        name: mc.name,
        type: mc.type,
        status: mc.status, // ADDED: Include status in response
        typeText: mc.type === 'large_hospital' ? '病院：大' : 
                 mc.type === 'hospital' ? '病院' : '福祉',
        logo: mc.logo || 'No logo',
        departmentCount: mc._count.departments,
        doctorCount: mc._count.doctors,
        createdDate: formatJapaneseDate(mc.created_at),
        createdBy: 'CEO' // You might want to fetch actual creator name
      }))
    };

    // Count by type
    medicalCenters.forEach(mc => {
      if (mc.type in medicalCenterStats.byType) {
        medicalCenterStats.byType[mc.type]++;
      }
    });

    // 3. Get department statistics
    let departmentWhere = { status: 1 };
    
    // Apply hospital_id filter if provided
    if (hospital_id) {
      departmentWhere.medical_center_id = parseInt(hospital_id);
    } 
    // Otherwise, filter by assigned medical centers for non-admin users
    else if (assignedMedicalCenterIds !== null && assignedMedicalCenterIds.length > 0) {
      departmentWhere.medical_center_id = { in: assignedMedicalCenterIds };
    }

    const departments = await prisma.department.findMany({
      where: departmentWhere,
      include: {
        medical_center: {
          select: {
            id: true,
            name: true,
            status: true // ADDED: Include medical center status
          }
        },
        _count: {
          select: {
            doctor_links: {
              where: { status: 1 }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const departmentStats = {
      total: departments.length,
      byHospital: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        status: dept.status, // ADDED: Include department status
        hospitalName: dept.medical_center.name,
        hospitalStatus: dept.medical_center.status, // ADDED: Include hospital status
        floor: dept.floor || '-',
        doctorCount: dept._count.doctor_links,
        createdDate: formatJapaneseDate(dept.created_at),
        createdBy: 'CEO' // You might want to fetch actual creator name
      }))
    };

    // 4. Get doctor statistics
    let doctorWhere = { status: 1 };
    
    // Apply hospital_id filter if provided
    if (hospital_id) {
      doctorWhere.medical_center_id = parseInt(hospital_id);
    } 
    // Otherwise, filter by assigned medical centers for non-admin users
    else if (assignedMedicalCenterIds !== null && assignedMedicalCenterIds.length > 0) {
      doctorWhere.medical_center_id = { in: assignedMedicalCenterIds };
    }

    const doctors = await prisma.doctor.findMany({
      where: doctorWhere,
      include: {
        medical_center: {
          select: {
            id: true,
            name: true,
            status: true // ADDED: Include medical center status
          }
        },
        dept_links: {
          where: { status: 1 },
          include: {
            department: {
              select: {
                name: true,
                status: true // ADDED: Include department status
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const doctorStats = {
      total: doctors.length,
      byHospital: doctors.map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status, // ADDED: Include doctor status
        licenseNo: doc.license_no || '',
        hospitalName: doc.medical_center.name,
        hospitalStatus: doc.medical_center.status, // ADDED: Include hospital status
        departments: doc.dept_links
          .filter(link => link.department.status === 1) // ADDED: Filter active departments
          .map(link => link.department.name)
          .join(', '),
        createdDate: formatJapaneseDate(doc.created_at),
        createdBy: 'CEO' // You might want to fetch actual creator name
      }))
    };

    response.success({
      reportStats,
      medicalCenterStats,
      departmentStats,
      doctorStats,
      currentMonth: selectedMonth,
      currentYear: selectedYear,
      userRole: user.role,
      myreport: myreport
    }, res);

  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    response.error(error.message, res, next);
  }
};

// Get recent reports for dashboard - Updated to filter by assigned medical centers
// Get recent reports for dashboard - Updated to filter by assigned medical centers and current month only
export const getRecentReports = async (req, res, next) => {
  try {
    const user = req.user;
    const { limit = 10 } = req.body;
    
    // Get current Japanese time
    const now = new Date();
    const japanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    
    const currentYear = japanTime.getFullYear();
    const currentMonth = japanTime.getMonth(); // 0-based (0=January, 11=December)
    
    // Calculate first and last day of current month in Japan timezone
    const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const lastDayOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
    
    // Get assigned medical center IDs for non-admin users
    const assignedMedicalCenterIds = await getAssignedMedicalCenterIds(user);
    
    // Build where conditions
    const where = {
      // Filter by current month in Japan timezone
      report_date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth
      }
    };
    
    if (assignedMedicalCenterIds !== null) {
      if (assignedMedicalCenterIds.length === 0) {
        // No medical centers assigned, return empty array
        return response.success({
          reports: [],
          total: 0,
          currentMonth: currentMonth + 1, // 1-based month for display
          currentYear: currentYear,
          japanTime: japanTime.toISOString(),
          localTime: now.toISOString()
        }, res);
      }
      where.medical_center_id = { in: assignedMedicalCenterIds };
    }

    // Get recent reports from current month
    const reports = await prisma.report.findMany({
      where,
      include: {
        medical_center: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        created_by_admin: {
          select: {
            name: true
          }
        },
        report_details: {
          select: {
            patient_count: true
          }
        }
      },
      orderBy: [
        {
          report_date: 'desc'
        },
        {
          created_at: 'desc'
        }
      ],
      take: parseInt(limit)
    });

    // Format response
    const formattedReports = reports.map(report => {
      // Calculate patient statistics
      let totalPatients = 0;
      let inpatientTotal = 0;
      let outpatientTotal = 0;

      if (report.report_details && report.report_details.length > 0) {
        totalPatients = report.report_details.reduce((sum, detail) => 
          sum + (detail.patient_count || 0), 0);
        
        const externalTotal = (report.external_morning || 0) + 
                             (report.external_afternoon || 0) + 
                             (report.external_duty || 0);
        
        inpatientTotal = (report.admission_count || 0) - (report.discharge_count || 0);
        if (inpatientTotal < 0) inpatientTotal = 0;
        
        outpatientTotal = externalTotal;
      }

      // Status mapping
      const statusMap = {
        'draft': '草稿',
        'submitted': '提出済み',
        'approved': '確認済み',
        'rejected': '拒否済み'
      };

      // Hospital type mapping
      const typeMap = {
        'large_hospital': '大病院',
        'hospital': '病院',
        'welfare': '福祉施設'
      };

      return {
        id: report.id,
        report_no: report.report_no,
        report_date: report.report_date,
        formatted_date: formatJapaneseDate(report.report_date),
        status: report.status,
        status_text: statusMap[report.status] || report.status,
        admission_count: report.admission_count || 0,
        discharge_count: report.discharge_count || 0,
        inpatient_count: inpatientTotal,
        outpatient_count: outpatientTotal,
        creator_name: report.created_by_admin?.name || '--',
        created_date: report.created_at ? formatJapaneseDate(report.created_at) : '--',
        medical_center_id: report.medical_center?.id,
        medical_center_name: report.medical_center?.name,
        medical_center_type: typeMap[report.medical_center?.type] || report.medical_center?.type,
        submitted_at: report.submitted_at,
        approved_at: report.approved_at,
        special_notes: report.special_notes,
        hospital_type: report.hospital_type || null,
      };
    });

    response.success({
      reports: formattedReports,
      total: formattedReports.length,
      currentMonth: currentMonth + 1, // 1-based month for display
      currentYear: currentYear,
      japanTime: japanTime.toISOString(),
      japaneseDate: formatJapaneseDate(japanTime),
      monthRange: {
        start: formatJapaneseDate(firstDayOfMonth),
        end: formatJapaneseDate(lastDayOfMonth)
      }
    }, res);

  } catch (error) {
    console.error('Error in getRecentReports:', error);
    response.error(error.message, res, next);
  }
};

// Get approval status statistics - Updated to check user access
export const getApprovalStats = async (req, res, next) => {
  try {
    const user = req.user;
    const { report_id } = req.body;
    
    if (!report_id) {
      return response.error("Report ID is required", res, next);
    }

    // Get assigned medical center IDs for non-admin users
    const assignedMedicalCenterIds = await getAssignedMedicalCenterIds(user);
    
    // Get the report with access control
    const report = await prisma.report.findUnique({
      where: {
        id: parseInt(report_id)
      },
      include: {
        medical_center: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        approvals: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            created_at: 'asc'
          }
        },
        created_by_admin: {
          select: {
            name: true
          }
        },
        updated_by_admin: {
          select: {
            name: true
          }
        },
        approved_by_admin: {
          select: {
            name: true
          }
        }
      }
    });

    if (!report) {
      return response.error("Report not found", res, next);
    }

    // Check if user has access to this report's medical center
    if (assignedMedicalCenterIds !== null) {
      if (!assignedMedicalCenterIds.includes(report.medical_center_id)) {
        return response.error("You don't have permission to view this report", res, next);
      }
    }

    // Role hierarchy
    const roleHierarchy = [
      { role: 'superAdmin', label: 'システム管理者' },
      { role: 'admin', label: '専務' },
      { role: 'hospitalAssistant', label: '主任管理者' },
      { role: 'staff', label: 'マネージャー' },
      { role: 'operator', label: 'データ入力者' }
    ];

    // Get all admins who can approve (based on medical center assignment)
    const medicalCenterAdmins = await prisma.admin_medical_center.findMany({
      where: {
        medical_center_id: report.medical_center_id
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Create approval status array
    const approvalStatus = roleHierarchy.map(roleInfo => {
      // Find admin with this role who is assigned to the medical center
      const assignedAdmin = medicalCenterAdmins.find(
        ma => ma.admin.role === roleInfo.role
      );
      
      // Check if this admin has approved
      const approval = report.approvals.find(
        a => a.admin.role === roleInfo.role
      );

      return {
        role: roleInfo.role,
        role_label: roleInfo.label,
        admin_name: assignedAdmin?.admin.name || '未設定',
        status: approval ? 'confirmed' : 'pending',
        approved_at: approval ? formatJapaneseDate(approval.created_at) : null,
        approved_by: approval?.admin.name || null,
        comments: approval?.comments || null
      };
    });

    // Calculate statistics
    const confirmedCount = approvalStatus.filter(s => s.status === 'confirmed').length;
    const pendingCount = approvalStatus.filter(s => s.status === 'pending').length;
    const totalCount = approvalStatus.length;

    response.success({
      report_id: report.id,
      report_no: report.report_no,
      report_date: formatJapaneseDate(report.report_date),
      medical_center_name: report.medical_center.name,
      medical_center_address: report.medical_center.address || '住所情報なし',
      report_status: report.status,
      approval_status: approvalStatus,
      statistics: {
        confirmed: confirmedCount,
        pending: pendingCount,
        total: totalCount
      },
      last_updated: formatJapaneseDate(report.updated_at),
      created_by: report.created_by_admin?.name || '--',
      approved_by: report.approved_by_admin?.name || null,
      updated_by: report.updated_by_admin?.name || null
    }, res);

  } catch (error) {
    console.error('Error in getApprovalStats:', error);
    response.error(error.message, res, next);
  }
};

// Get monthly report summary for charts - Updated to filter by assigned medical centers
export const getMonthlySummary = async (req, res, next) => {
  try {
    const user = req.user;
    const { year } = req.body;
    
    const selectedYear = year || new Date().getFullYear();
    
    // Get assigned medical center IDs for non-admin users
    const assignedMedicalCenterIds = await getAssignedMedicalCenterIds(user);
    
    // Build where conditions
    const where = {};
    
    if (assignedMedicalCenterIds !== null) {
      if (assignedMedicalCenterIds.length === 0) {
        return response.success({
          monthlyData: [],
          yearlyStats: {
            totalReports: 0,
            totalPatients: 0,
            avgPatientsPerReport: 0
          }
        }, res);
      }
      where.medical_center_id = { in: assignedMedicalCenterIds };
    }

    // Add year filter
    where.report_date = {
      gte: new Date(selectedYear, 0, 1), // January 1st
      lte: new Date(selectedYear, 11, 31) // December 31st
    };

    // Get all reports for the year
    const reports = await prisma.report.findMany({
      where,
      include: {
        report_details: {
          select: {
            patient_count: true
          }
        }
      },
      orderBy: {
        report_date: 'asc'
      }
    });

    // Initialize monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: `${i + 1}月`,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      totalReports: 0,
      totalPatients: 0
    }));

    // Fill monthly data
    reports.forEach(report => {
      const month = report.report_date.getMonth(); // 0-11
      
      // Count by status
      monthlyData[month][report.status]++;
      monthlyData[month].totalReports++;
      
      // Count patients
      const patientCount = report.report_details.reduce((sum, detail) => 
        sum + (detail.patient_count || 0), 0);
      monthlyData[month].totalPatients += patientCount;
    });

    // Calculate yearly statistics
    const yearlyStats = {
      totalReports: reports.length,
      totalPatients: monthlyData.reduce((sum, month) => sum + month.totalPatients, 0),
      avgPatientsPerReport: reports.length > 0 ? 
        Math.round(monthlyData.reduce((sum, month) => sum + month.totalPatients, 0) / reports.length) : 0,
      byStatus: {
        draft: reports.filter(r => r.status === 'draft').length,
        submitted: reports.filter(r => r.status === 'submitted').length,
        approved: reports.filter(r => r.status === 'approved').length,
        rejected: reports.filter(r => r.status === 'rejected').length
      }
    };

    response.success({
      monthlyData,
      yearlyStats,
      year: selectedYear
    }, res);

  } catch (error) {
    console.error('Error in getMonthlySummary:', error);
    response.error(error.message, res, next);
  }
};

// Helper function for welcome message
function getWelcomeMessage(role) {
  const messages = {
    'superAdmin': 'システム管理者としてログイン中',
    'admin': '管理者としてログイン中',
    'hospitalAssistant': '病院アシスタントとしてログイン中',
    'staff': 'スタッフとしてログイン中',
    'operator': 'オペレーターとしてログイン中'
  };
  return messages[role] || 'ようこそ';
}


// Get user-specific dashboard (for different roles)
export const getUserDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Role-based dashboard data
    let dashboardData = {
      userRole: user.role,
      userName: user.name,
      welcomeMessage: getWelcomeMessage(user.role)
    };

    // Add role-specific data
    switch (user.role) {
      case 'superAdmin':
      case 'admin':
        // Admins see everything
        dashboardData = {
          ...dashboardData,
          canViewAll: true,
          canManageUsers: true,
          canManageHospitals: true,
          canApproveReports: true,
          quickActions: [
            { label: '新規レポート作成', icon: 'add', link: '/report/create' },
            { label: '医療機関管理', icon: 'hospital', link: '/hospitals' },
            { label: 'ユーザー管理', icon: 'people', link: '/users' },
            { label: 'レポート一覧', icon: 'list', link: '/reports' }
          ]
        };
        break;
        
      case 'hospitalAssistant':
        // Hospital assistants manage specific hospitals
        dashboardData = {
          ...dashboardData,
          canViewAll: false,
          canManageUsers: false,
          canManageHospitals: true,
          canApproveReports: true,
          quickActions: [
            { label: '新規レポート作成', icon: 'add', link: '/report/create' },
            { label: '担当医療機関', icon: 'hospital', link: '/hospitals' },
            { label: '医師管理', icon: 'person', link: '/doctors' },
            { label: '診療科管理', icon: 'medical_services', link: '/departments' }
          ]
        };
        break;
        
      case 'staff':
        // Staff can view and create reports
        dashboardData = {
          ...dashboardData,
          canViewAll: false,
          canManageUsers: false,
          canManageHospitals: false,
          canApproveReports: false,
          quickActions: [
            { label: '新規レポート作成', icon: 'add', link: '/report/create' },
            { label: '下書きレポート', icon: 'draft', link: '/reports?status=draft' },
            { label: '提出済みレポート', icon: 'send', link: '/reports?status=submitted' },
            { label: '統計を見る', icon: 'analytics', link: '/statistics' }
          ]
        };
        break;
        
      case 'operator':
        // Operators only create reports
        dashboardData = {
          ...dashboardData,
          canViewAll: false,
          canManageUsers: false,
          canManageHospitals: false,
          canApproveReports: false,
          quickActions: [
            { label: '新規レポート作成', icon: 'add', link: '/report/create' },
            { label: '下書きレポート', icon: 'draft', link: '/reports?status=draft' },
            { label: '提出済みレポート', icon: 'send', link: '/reports?status=submitted' }
          ]
        };
        break;
    }

    response.success(dashboardData, res);

  } catch (error) {
    console.error('Error in getUserDashboard:', error);
    response.error(error.message, res, next);
  }
};
