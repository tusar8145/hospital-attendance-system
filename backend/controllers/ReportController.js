import { PrismaClient } from '@prisma/client';
import { user_id } from '../middleware/Auth.js';
import * as response from "../helpers/Response.js";
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

// Helper to generate report number
function generateReportNo(medicalCenterId, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `RPT-${medicalCenterId}-${year}${month}${day}`;
}

// Helper function to format date in Japanese format
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

// Get report by date and hospital
export const getReportByDate = async (req, res, next) => {
  try {
    const { date, hospital_id } = req.body;
    
    if (!date || !hospital_id) {
      return response.error("Date and hospital_id are required", res, next);
    }

    const reportDate = new Date(date);
    
    // Get existing report
    const existingReport = await prisma.report.findUnique({
      where: {
        medical_center_id_report_date: {
          medical_center_id: parseInt(hospital_id),
          report_date: reportDate
        }
      },
      include: {
        report_details: {
          include: {
            department: true,
            doctor1: true,
            doctor2: true,
            doctor3: true
          },
          orderBy: [
            { sequence_no: 'asc' },
            { consultation_type: 'asc' }
          ]
        },
        shift_nurses: true,
        duty_staff: true,
        medical_center: true
      }
    });

    // Get related data for the form
    const departments = await prisma.department.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: 1
      }
    });

    const doctors = await prisma.doctor.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: 1
      },
      include: {
        dept_links: {
          where: { status: 1 },
          include: {
            department: true
          }
        }
      }
    });

    response.success({
      report: existingReport,
      departments,
      doctors,
      exists: !!existingReport
    }, res);

  } catch (error) {
    response.error(error, res, next);
  }
};
// Updated getReportByDateTable function
export const getReportByDateTable = async (req, res, next) => {
  try {
    const { date, hospital_id } = req.body;
    
    if (!date || !hospital_id) {
      return response.error("Date and hospital_id are required", res, next);
    }

    const reportDate = new Date(date);
    
    // Get existing report
    const existingReport = await prisma.report.findUnique({
      where: {
        medical_center_id_report_date: {
          medical_center_id: parseInt(hospital_id),
          report_date: reportDate
        }
      },
      include: {
        report_details: {
          include: {
            department: true,
            doctor1: true,
            doctor2: true,
            doctor3: true
          },
          orderBy: [
            { sequence_no: 'asc' },
            { consultation_type: 'asc' }
          ]
        },
        shift_nurses: true,
        duty_staff: true,
        medical_center: true
      }
    });

    // Get related data for the form
    const departments = await prisma.department.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: 1
      }
    });

    const doctors = await prisma.doctor.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: 1
      },
      include: {
        dept_links: {
          where: { status: 1 },
          include: {
            department: true
          }
        }
      }
    });

    // Calculate monthly statistics for emergency transport
    const startOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
    const endOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0);
    
    const monthlyReports = await prisma.report.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        report_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        emergency_transport: true,
        post_transport_admission: true,
        admission_count: true,
        discharge_count: true
      }
    });

    // Calculate monthly totals
    const monthlyStats = monthlyReports.reduce((acc, report) => {
      acc.emergency_transport += report.emergency_transport || 0;
      acc.post_transport_admission += report.post_transport_admission || 0;
      acc.admission_count += report.admission_count || 0;
      acc.discharge_count += report.discharge_count || 0;
      return acc;
    }, { 
      emergency_transport: 0, 
      post_transport_admission: 0,
      admission_count: 0,
      discharge_count: 0 
    });

    // Organize data for frontend tables
    const organizedData = {
      patientCountData: organizePatientCountData(existingReport?.report_details || []),
      diagnosisData: organizeDiagnosisData(existingReport?.report_details || []),
      emergencyData: {
        current: existingReport?.emergency_transport || 0,
        hospitalization: existingReport?.post_transport_admission || 0,
        monthly: monthlyStats.emergency_transport,
        cumulative: monthlyStats.post_transport_admission
      },
      nurseData: organizeNurseData(existingReport?.shift_nurses || []),
      hospitalData: {
        inpatient: {
          admission: existingReport?.admission_count || 0,
          discharge: existingReport?.discharge_count || 0,
          current: (existingReport?.admission_count || 0) - (existingReport?.discharge_count || 0)
        },
        outpatient: {
          morning: existingReport?.external_morning || 0,
          afternoon: existingReport?.external_afternoon || 0,
          night: existingReport?.external_duty || 0,
          total: (existingReport?.external_morning || 0) + 
                 (existingReport?.external_afternoon || 0) + 
                 (existingReport?.external_duty || 0)
        }
      },
      visitCount: existingReport?.visit_count || 0
    };

    response.success({
      report: existingReport,
      departments,
      doctors,
      exists: !!existingReport,
      tableData: organizedData,
      monthlyStats
    }, res);

  } catch (error) {
    response.error(error, res, next);
  }
};

// Helper function to organize patient count data
function organizePatientCountData(reportDetails) {
  const organized = {};
  
  reportDetails.forEach(detail => {
    const deptName = detail.department?.name || 'Unknown';
    
    if (!organized[deptName]) {
      organized[deptName] = {
        morning: 0,
        afternoon: 0,
        night: 0
      };
    }
    
    switch(detail.consultation_type) {
      case 'morning':
        organized[deptName].morning = detail.patient_count || 0;
        break;
      case 'afternoon':
        organized[deptName].afternoon = detail.patient_count || 0;
        break;
      case 'night':
        organized[deptName].night = detail.patient_count || 0;
        break;
    }
  });
  
  return organized;
}

// Helper function to organize diagnosis data (doctors)
function organizeDiagnosisData(reportDetails) {
  const organized = {};
  
  reportDetails.forEach(detail => {
    const deptName = detail.department?.name || 'Unknown';
    
    if (!organized[deptName]) {
      organized[deptName] = {
        morning: [],
        afternoon: [],
        night: []
      };
    }
    
    const doctors = [];
    if (detail.doctor1?.name) doctors.push(detail.doctor1.name);
    if (detail.doctor2?.name) doctors.push(detail.doctor2.name);
    if (detail.doctor3?.name) doctors.push(detail.doctor3.name);
    
    switch(detail.consultation_type) {
      case 'morning':
        organized[deptName].morning = doctors;
        break;
      case 'afternoon':
        organized[deptName].afternoon = doctors;
        break;
      case 'night':
        organized[deptName].night = doctors;
        break;
    }
  });
  
  return organized;
}

// Helper function to organize nurse data
function organizeNurseData(shiftNurses) {
  const organized = {
    quasiNight: [],  // shift_type: 0
    midnight: []     // shift_type: 1
  };
  
  shiftNurses.forEach(nurse => {
    if (nurse.shift_type === 0) {
      organized.quasiNight.push(nurse.nurse_name);
    } else if (nurse.shift_type === 1) {
      organized.midnight.push(nurse.nurse_name);
    }
  });
  
  return organized;
}
// Submit/Update report
export const submitReport = async (req, res, next) => {
  const transaction = await prisma.$transaction(async (tx) => {
    try {
      const {
        hospital_id,
        report_date,
        admission_count,
        discharge_count,
        external_morning,
        external_afternoon,
        external_duty,
        emergency_transport,
        post_transport_admission,
        visit_count,
        special_notes,
        shift_nurses,
        duty_staff,
        report_details,
        is_draft = false
      } = req.body;

      const userId = user_id;
      const date = new Date(report_date);

      // Check if report already exists
      const existingReport = await tx.report.findUnique({
        where: {
          medical_center_id_report_date: {
            medical_center_id: parseInt(hospital_id),
            report_date: date
          }
        }
      });

      const reportNo = existingReport?.report_no || generateReportNo(hospital_id, date);
      
      // Prepare report data
      const reportData = {
        report_no: reportNo,
        report_date: date,
        medical_center_id: parseInt(hospital_id),
        status: is_draft ? 'draft' : 'submitted',
        special_notes,
        admission_count: parseInt(admission_count) || 0,
        discharge_count: parseInt(discharge_count) || 0,
        external_morning: parseInt(external_morning) || 0,
        external_afternoon: parseInt(external_afternoon) || 0,
        external_duty: parseInt(external_duty) || 0,
        emergency_transport: parseInt(emergency_transport) || 0,
        post_transport_admission: parseInt(post_transport_admission) || 0,
        visit_count: parseInt(visit_count) || 0,
        updated_by: userId,
        updated_at: new Date(),
      };

      if (!existingReport) {
        reportData.created_by = userId;
      }

      if (!is_draft && !existingReport?.submitted_at) {
        reportData.submitted_at = new Date();
      }

      // Upsert report
      const report = existingReport
        ? await tx.report.update({
            where: { id: existingReport.id },
            data: reportData
          })
        : await tx.report.create({
            data: reportData
          });

      // Delete existing details, shift nurses, and duty staff
      await tx.report_detail.deleteMany({
        where: { report_id: report.id }
      });

      await tx.report_shift_nurse.deleteMany({
        where: { report_id: report.id }
      });

      await tx.report_duty_staff.deleteMany({
        where: { report_id: report.id }
      });

      // Create report details
      if (report_details && report_details.length > 0) {
        const detailsData = report_details.map(detail => ({
          report_id: report.id,
          sequence_no: parseInt(detail.sequence_no),
          department_id: parseInt(detail.department_id),
          consultation_type: detail.consultation_type,
          doctor_id_1: detail.doctor_id_1 ? parseInt(detail.doctor_id_1) : null,
          doctor_id_2: detail.doctor_id_2 ? parseInt(detail.doctor_id_2) : null,
          doctor_id_3: detail.doctor_id_3 ? parseInt(detail.doctor_id_3) : null,
          patient_count: parseInt(detail.patient_count) || 0
        }));

        await tx.report_detail.createMany({
          data: detailsData
        });
      }

      // Create shift nurses
      if (shift_nurses && shift_nurses.length > 0) {
        const nursesData = shift_nurses.map(nurse => ({
          report_id: report.id,
          shift_type: parseInt(nurse.shift_type),
          nurse_name: nurse.nurse_name
        }));

        await tx.report_shift_nurse.createMany({
          data: nursesData
        });
      }

      // Create duty staff
      if (duty_staff && duty_staff.length > 0) {
        const staffData = duty_staff.map(staff => ({
          report_id: report.id,
          position: staff.position,
          staff_name_1: staff.staff_name_1,
          staff_name_2: staff.staff_name_2
        }));

        await tx.report_duty_staff.createMany({
          data: staffData
        });
      }

      // Get complete report with relations
      const completeReport = await tx.report.findUnique({
        where: { id: report.id },
        include: {
          report_details: {
            include: {
              department: true,
              doctor1: true,
              doctor2: true,
              doctor3: true
            }
          },
          shift_nurses: true,
          duty_staff: true,
          medical_center: true
        }
      });

      return {
        success: true,
        report: completeReport,
        is_new: !existingReport,
        message: is_draft 
          ? 'Report saved as draft successfully' 
          : 'Report submitted successfully'
      };

    } catch (error) {
      throw error;
    }
  });

  try {
    response.success(transaction, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

// Get departments with doctors
export const getDepartmentsWithDoctors = async (req, res, next) => {
  try {
    const { hospital_id } = req.body;

    const departments = await prisma.department.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: 1
      },
      include: {
        doctor_links: {
          where: { status: 1 },
          include: {
            doctor: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format data for frontend
    const formattedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      doctors: dept.doctor_links.map(link => ({
        id: link.doctor.id,
        name: link.doctor.name,
        license_no: link.doctor.license_no
      }))
    }));

    response.success(formattedDepartments, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

// Get report status
export const getReportStatus = async (req, res, next) => {
  try {
    const { date, hospital_id } = req.body;

    const reportDate = new Date(date);
    
    const report = await prisma.report.findUnique({
      where: {
        medical_center_id_report_date: {
          medical_center_id: parseInt(hospital_id),
          report_date: reportDate
        }
      },
      select: {
        id: true,
        status: true,
        report_no: true,
        submitted_at: true,
        approved_at: true
      }
    });

    response.success({
      exists: !!report,
      status: report?.status || 'not_found',
      report_no: report?.report_no,
      submitted_at: report?.submitted_at,
      approved_at: report?.approved_at
    }, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

// Get report list with statistics
export const getReportList = async (req, res, next) => {
  try {
    const { 
      hospital_id, 
      page = 1, 
      limit = 10, 
      start_date, 
      end_date,
      status,
      search,
      month, // New parameter for month selection
      year // New parameter for year selection
    } = req.body;

    // Get user from request for medical center filtering
    const user = req.user;
    
    // Build where conditions
    const where = {};

    // Handle medical_center_id filtering
    if (hospital_id) {
      // If hospital_id is explicitly provided, use it
      where.medical_center_id = parseInt(hospital_id);
    } else {
      // Determine medical_center_id filtering based on user role
      const medicalCenterFilter = await getMedicalCenterFilter(user);
      if (medicalCenterFilter) {
        if (medicalCenterFilter === -1) {
          // No medical centers assigned, return empty
          return response.success({
            reports: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit)
            },
            statistics: {
              draft: 0,
              submitted: 0,
              approved: 0,
              rejected: 0,
              total: 0
            }
          }, res);
        }
        where.medical_center_id = medicalCenterFilter;
      }
      // If medicalCenterFilter is null (admin), don't filter by medical_center_id
    }

    // Handle month and year filtering
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.report_date = {
        gte: startDate,
        lte: endDate
      };
    } else if (start_date && end_date) {
      // Fallback to date range
      where.report_date = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    } else {
      // Default to current month if no date filter
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      where.report_date = {
        gte: currentMonthStart,
        lte: currentMonthEnd
      };
    }

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'pending') {
        // Pending = draft + submitted (not approved/rejected)
        where.status = { in: ['draft', 'submitted'] };
      } else {
        where.status = status;
      }
    }

    // Search functionality
    if (search) {
      where.OR = [
        { report_no: { contains: search } },
        { special_notes: { contains: search } }
      ];
    }

    // Get total count
    const totalCount = await prisma.report.count({ where });

    // Get reports with pagination
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
          select: { name: true }
        },
        updated_by_admin: {
          select: { name: true }
        },
        report_details: {
          select: { 
            patient_count: true,
            consultation_type: true
          }
        }
      },
      orderBy: {
        report_date: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Calculate statistics for the selected month
    const monthStart = where.report_date?.gte || new Date();
    const monthEnd = where.report_date?.lte || new Date();
    
    const statsWhere = { ...where };
    delete statsWhere.status; // Remove status filter for statistics

    const allReportsInMonth = await prisma.report.findMany({
      where: statsWhere,
      select: {
        status: true
      }
    });

    // Calculate statistics
    const stats = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    allReportsInMonth.forEach(report => {
      stats[report.status]++;
      stats.total++;
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
        
        // Calculate inpatient/outpatient distribution
        const externalTotal = (report.external_morning || 0) + 
                             (report.external_afternoon || 0) + 
                             (report.external_duty || 0);
        
        inpatientTotal = (report.admission_count || 0) - (report.discharge_count || 0);
        if (inpatientTotal < 0) inpatientTotal = 0;
        
        outpatientTotal = externalTotal;
      }

      return {
        id: report.id,
        report_no: report.report_no,
        report_date: report.report_date,
        formatted_date: formatJapaneseDate(report.report_date),
        status: report.status,
        admission_count: report.admission_count || 0,
        discharge_count: report.discharge_count || 0,
        inpatient_count: inpatientTotal,
        outpatient_count: outpatientTotal,
        creator_name: report.created_by_admin?.name || '--',
        created_date: report.created_at ? formatJapaneseDate(report.created_at) : '--',
        medical_center_id: report.medical_center?.id,
        medical_center_name: report.medical_center?.name,
        medical_center_type: report.medical_center?.type,
        submitted_at: report.submitted_at,
        approved_at: report.approved_at,
        special_notes: report.special_notes
      };
    });

    response.success({
      reports: formattedReports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      },
      statistics: stats
    }, res);

  } catch (error) {
    console.error('Error in getReportList:', error);
    response.error(error.message, res, next);
  }
};

// Export reports to Excel
export const exportReports = async (req, res, next) => {
  try {
    const { 
      hospital_id, 
      start_date, 
      end_date,
      status,
      search,
      month,
      year
    } = req.body;

    // Get user from request for medical center filtering
    const user = req.user;
    
    // Build where conditions (same as getReportList)
    const where = {};

    // Handle medical_center_id filtering
    if (hospital_id) {
      where.medical_center_id = parseInt(hospital_id);
    } else {
      const medicalCenterFilter = await getMedicalCenterFilter(user);
      if (medicalCenterFilter) {
        if (medicalCenterFilter === -1) {
          return response.error("No medical centers assigned", res, next);
        }
        where.medical_center_id = medicalCenterFilter;
      }
    }

    // Handle month and year filtering
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.report_date = {
        gte: startDate,
        lte: endDate
      };
    } else if (start_date && end_date) {
      where.report_date = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    }

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'pending') {
        where.status = { in: ['draft', 'submitted'] };
      } else {
        where.status = status;
      }
    }

    // Search functionality
    if (search) {
      where.OR = [
        { report_no: { contains: search } },
        { special_notes: { contains: search } }
      ];
    }

    // Get all reports for export (no pagination)
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
          select: { name: true }
        },
        report_details: {
          select: { 
            patient_count: true,
            consultation_type: true
          }
        }
      },
      orderBy: {
        report_date: 'desc'
      }
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reports');

    // Define columns
    worksheet.columns = [
      { header: '通番', key: 'sequence', width: 10 },
      { header: '医療機関名', key: 'hospital_name', width: 30 },
      { header: '種類', key: 'hospital_type', width: 15 },
      { header: '報告日', key: 'report_date', width: 15 },
      { header: '報告番号', key: 'report_no', width: 20 },
      { header: 'ステータス', key: 'status', width: 15 },
      { header: '入院数', key: 'admission_count', width: 10 },
      { header: '退院数', key: 'discharge_count', width: 10 },
      { header: '入院患者数', key: 'inpatient_count', width: 10 },
      { header: '合計外来', key: 'outpatient_count', width: 10 },
      { header: '作成者', key: 'creator', width: 20 },
      { header: '作成日', key: 'created_date', width: 15 },
      { header: '備考', key: 'notes', width: 30 }
    ];

    // Add data rows
    reports.forEach((report, index) => {
      // Calculate patient statistics
      let inpatientTotal = 0;
      let outpatientTotal = 0;

      if (report.report_details && report.report_details.length > 0) {
        const externalTotal = (report.external_morning || 0) + 
                             (report.external_afternoon || 0) + 
                             (report.external_duty || 0);
        
        inpatientTotal = (report.admission_count || 0) - (report.discharge_count || 0);
        if (inpatientTotal < 0) inpatientTotal = 0;
        
        outpatientTotal = externalTotal;
      }

      // Status mapping
      const statusMap = {
        'draft': '下書き',
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

      worksheet.addRow({
        sequence: index + 1,
        hospital_name: report.medical_center?.name || '--',
        hospital_type: typeMap[report.medical_center?.type] || '--',
        report_date: formatJapaneseDate(report.report_date),
        report_no: report.report_no,
        status: statusMap[report.status] || report.status,
        admission_count: report.admission_count || 0,
        discharge_count: report.discharge_count || 0,
        inpatient_count: inpatientTotal,
        outpatient_count: outpatientTotal,
        creator: report.created_by_admin?.name || '--',
        created_date: report.created_at ? formatJapaneseDate(report.created_at) : '--',
        notes: report.special_notes || ''
      });
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set filename
    const filename = `reports_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error in exportReports:', error);
    response.error(error.message, res, next);
  }
};

// Get single report for view
export const getReportView = async (req, res, next) => {
  try {
    const { report_id } = req.body;
    
    if (!report_id) {
      return response.error("Report ID is required", res, next);
    }

    const report = await prisma.report.findUnique({
      where: {
        id: parseInt(report_id)
      },
      include: {
        medical_center: {
          select: { 
            id: true,
            name: true,
            type: true,
            address: true
          }
        },
        created_by_admin: {
          select: { name: true, email: true }
        },
        updated_by_admin: {
          select: { name: true, email: true }
        },
        approved_by_admin: {
          select: { name: true, email: true }
        },
        report_details: {
          include: {
            department: {
              select: { name: true }
            },
            doctor1: {
              select: { name: true, license_no: true }
            },
            doctor2: {
              select: { name: true, license_no: true }
            },
            doctor3: {
              select: { name: true, license_no: true }
            }
          },
          orderBy: [
            { sequence_no: 'asc' },
            { consultation_type: 'asc' }
          ]
        },
        shift_nurses: true,
        duty_staff: true,
        report_comments: {
          include: {
            admin: {
              select: { name: true }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    });

    if (!report) {
      return response.error("Report not found", res, next);
    }

    response.success({
      report,
      formatted_date: formatJapaneseDate(report.report_date),
      submitted_date: report.submitted_at ? formatJapaneseDate(report.submitted_at) : null,
      approved_date: report.approved_at ? formatJapaneseDate(report.approved_at) : null
    }, res);

  } catch (error) {
    console.error('Error in getReportView:', error);
    response.error(error.message, res, next);
  }
};

// Update report status (approve/reject)
export const updateReportStatus = async (req, res, next) => {
  try {
    const { report_id, status, rejection_reason } = req.body;
    
    if (!report_id || !status) {
      return response.error("Report ID and status are required", res, next);
    }

    const updateData = {
      status: status,
      updated_by: user_id,
      updated_at: new Date()
    };

    if (status === 'approved') {
      updateData.approved_at = new Date();
      updateData.approved_by = user_id;
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date();
      updateData.rejection_reason = rejection_reason;
    }

    const updatedReport = await prisma.report.update({
      where: {
        id: parseInt(report_id)
      },
      data: updateData,
      include: {
        medical_center: {
          select: { name: true }
        }
      }
    });

    response.success({
      success: true,
      message: `Report ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      report: updatedReport
    }, res);

  } catch (error) {
    console.error('Error in updateReportStatus:', error);
    response.error(error.message, res, next);
  }
};

// Get statistics overview
export const getReportStatistics = async (req, res, next) => {
  try {
    const { 
      hospital_id,
      month,
      year
    } = req.body;

    // Get user from request
    const user = req.user;
    
    // Build where conditions
    const where = {};

    // Handle medical_center_id filtering
    if (hospital_id) {
      where.medical_center_id = parseInt(hospital_id);
    } else {
      const medicalCenterFilter = await getMedicalCenterFilter(user);
      if (medicalCenterFilter) {
        if (medicalCenterFilter === -1) {
          return response.success({
            statistics: {
              draft: 0,
              submitted: 0,
              approved: 0,
              rejected: 0,
              total: 0,
              pending: 0
            }
          }, res);
        }
        where.medical_center_id = medicalCenterFilter;
      }
    }

    // Handle month and year filtering (default to current month)
    const now = new Date();
    const selectedYear = year || now.getFullYear();
    const selectedMonth = month || now.getMonth() + 1;
    
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 0);
    
    where.report_date = {
      gte: monthStart,
      lte: monthEnd
    };

    // Get all reports for the selected month
    const reports = await prisma.report.findMany({
      where,
      select: {
        status: true
      }
    });

    // Calculate statistics
    const stats = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      total: 0,
      pending: 0 // draft + submitted
    };

    reports.forEach(report => {
      stats[report.status]++;
      stats.total++;
      if (report.status === 'draft' || report.status === 'submitted') {
        stats.pending++;
      }
    });

    response.success({
      statistics: stats,
      month: selectedMonth,
      year: selectedYear
    }, res);

  } catch (error) {
    console.error('Error in getReportStatistics:', error);
    response.error(error.message, res, next);
  }
};