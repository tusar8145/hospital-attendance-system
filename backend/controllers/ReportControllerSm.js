import { PrismaClient } from '@prisma/client';
import { user_id } from '../middleware/Auth.js';
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

// Helper to generate report number
function generateReportNo(medicalCenterId, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `RPT-${medicalCenterId}-${year}${month}${day}`;
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

// Define all 21 duty staff positions
const ALL_DUTY_STAFF_POSITIONS = [
  'field_group_1',
  'field_group_2',
  'field_group_3',
  'field_group_4',
  'field_group_5',
  'field_group_6',
  'field_group_7'
];

// Helper function to ensure all 21 duty staff positions exist in data
function ensureAllDutyStaffPositions(dutyStaffData) {
  const result = [];
  
  // Create a map of existing positions for quick lookup
  const existingPositions = {};
  if (dutyStaffData && Array.isArray(dutyStaffData)) {
    dutyStaffData.forEach(staff => {
      if (staff.position) {
        existingPositions[staff.position] = staff;
      }
    });
  }
  
  // Ensure all 21 positions exist
  ALL_DUTY_STAFF_POSITIONS.forEach(position => {
    if (existingPositions[position]) {
      // Use existing data
      result.push({
        position: position,
        staff_name_1: existingPositions[position].staff_name_1 || "",
        staff_name_2: existingPositions[position].staff_name_2 || "",
        staff_name_3: existingPositions[position].staff_name_3 || ""
      });
    } else {
      // Create empty entry for missing position
      result.push({
        position: position,
        staff_name_1: "",
        staff_name_2: "",
        staff_name_3: ""
      });
    }
  });
  
  return result;
}

// Get report by date with table data
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

    // Ensure all 21 duty staff positions exist
    if (existingReport && existingReport.duty_staff) {
      existingReport.duty_staff = ensureAllDutyStaffPositions(existingReport.duty_staff);
    }

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

    // Calculate monthly statistics
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
        discharge_count: true,
        hospital_type: true
      }
    });

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
      visitCount: existingReport?.visit_count || 0,
      hospitalType: existingReport?.hospital_type || null
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

// Get report by ID with approvals and comments
export const getReportById = async (req, res, next) => {
  try {
    const { report_id } = req.body;
    
    if (!report_id) {
      return response.error("Report ID is required", res, next);
    }

    // Get report by ID
    const report = await prisma.report.findUnique({
      where: {
        id: parseInt(report_id)
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
        medical_center: true,
        created_by_admin: {
          select: { name: true }
        },
        updated_by_admin: {
          select: { name: true }
        },
        approved_by_admin: {
          select: { name: true }
        },
        // Include approvals
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
        // Include comments
        report_comments: {
          where: {
            is_internal: false
          },
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
            created_at: 'desc'
          }
        }
      }
    });

    if (!report) {
      return response.error("Report not found", res, next);
    }

    // Ensure all 21 duty staff positions exist
    if (report.duty_staff) {
      report.duty_staff = ensureAllDutyStaffPositions(report.duty_staff);
    }

    // Calculate monthly statistics
    const startOfMonth = new Date(report.report_date.getFullYear(), report.report_date.getMonth(), 1);
    const endOfMonth = new Date(report.report_date.getFullYear(), report.report_date.getMonth() + 1, 0);
    
    const monthlyReports = await prisma.report.findMany({
      where: {
        medical_center_id: report.medical_center_id,
        report_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        emergency_transport: true,
        post_transport_admission: true,
        admission_count: true,
        discharge_count: true,
        hospital_type: true
      }
    });

    const monthlyStats = monthlyReports.reduce((acc, monthlyReport) => {
      acc.emergency_transport += monthlyReport.emergency_transport || 0;
      acc.post_transport_admission += monthlyReport.post_transport_admission || 0;
      acc.admission_count += monthlyReport.admission_count || 0;
      acc.discharge_count += monthlyReport.discharge_count || 0;
      return acc;
    }, { 
      emergency_transport: 0, 
      post_transport_admission: 0,
      admission_count: 0,
      discharge_count: 0 
    });

    // Organize data for frontend tables
    const organizedData = {
      patientCountData: organizePatientCountData(report.report_details || []),
      diagnosisData: organizeDiagnosisData(report.report_details || []),
      emergencyData: {
        current: report.emergency_transport || 0,
        hospitalization: report.post_transport_admission || 0,
        monthly: monthlyStats.emergency_transport,
        cumulative: monthlyStats.post_transport_admission
      },
      nurseData: organizeNurseData(report.shift_nurses || []),
      hospitalData: {
        inpatient: {
          admission: report.admission_count || 0,
          discharge: report.discharge_count || 0,
          current: (report.admission_count || 0) - (report.discharge_count || 0)
        },
        outpatient: {
          morning: report.external_morning || 0,
          afternoon: report.external_afternoon || 0,
          night: report.external_duty || 0,
          total: (report.external_morning || 0) + 
                 (report.external_afternoon || 0) + 
                 (report.external_duty || 0)
        }
      },
      visitCount: report.visit_count || 0,
      hospitalType: report.hospital_type || null
    };

    // Get departments and doctors
    const departments = await prisma.department.findMany({
      where: {
        medical_center_id: report.medical_center_id,
        status: 1
      }
    });

    const doctors = await prisma.doctor.findMany({
      where: {
        medical_center_id: report.medical_center_id,
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
      report,
      departments,
      doctors,
      exists: true,
      tableData: organizedData,
      monthlyStats,
      approvals: report.approvals,
      comments: report.report_comments
    }, res);

  } catch (error) {
    console.error('Error in getReportById:', error);
    response.error(error.message, res, next);
  }
};

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
        is_draft = false,
        hospital_type,
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
        hospital_type: hospital_type,
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

      // Create duty staff - ensure all 21 positions with 3 staff names each
      // If duty_staff is not provided or incomplete, create all 21 positions
      let staffData = [];
      
      if (duty_staff && duty_staff.length > 0) {
        // Use provided data and ensure all positions
        const allStaffData = ensureAllDutyStaffPositions(duty_staff);
        
        staffData = allStaffData.map(staff => ({
          report_id: report.id,
          position: staff.position,
          staff_name_1: staff.staff_name_1 || "",
          staff_name_2: staff.staff_name_2 || "",
          staff_name_3: staff.staff_name_3 || ""
        }));
      } else {
        // Create empty entries for all 21 positions
        staffData = ALL_DUTY_STAFF_POSITIONS.map(position => ({
          report_id: report.id,
          position: position,
          staff_name_1: "",
          staff_name_2: "",
          staff_name_3: ""
        }));
      }

      if (staffData.length > 0) {
        await tx.report_duty_staff.createMany({
          data: staffData
        });
      }

      // Get complete report
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

      // Ensure all 21 duty staff positions exist in the response
      if (completeReport.duty_staff) {
        completeReport.duty_staff = ensureAllDutyStaffPositions(completeReport.duty_staff);
      }

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

// Get last report's diagnosis data
export const getHospitalDepartmentsDoctors = async (req, res, next) => {
  try {
    const { hospital_id, report_date } = req.body;
    
    // Validate required parameters
    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }
    
    if (!report_date) {
      return response.error("Report date is required", res, next);
    }

    // Parse and validate the report_date
    const providedDate = new Date(report_date);
    if (isNaN(providedDate.getTime())) {
      return response.error("Invalid report date format", res, next);
    }

    // Calculate date 7 days earlier
    const targetDate = new Date(providedDate);
    targetDate.setDate(targetDate.getDate() - 7);
    
    // Create a DateTime object for the start of the target day
    const searchDate = new Date(targetDate);
    searchDate.setUTCHours(0, 0, 0, 0);

    // Find the report for the calculated date
    const report = await prisma.report.findFirst({
      where: {
        medical_center_id: parseInt(hospital_id),
        OR: [
          { status: 'submitted' },
          { status: 'approved' }
        ],
        report_date: searchDate
      },
      select: {
        id: true,
        report_date: true
      },
      orderBy: {
        report_date: 'desc'
      }
    });

    // If no report found for the calculated date, return error
    if (!report) {
      const dateString = searchDate.toISOString().split('T')[0];
      return response.error(`No report found for date: ${dateString} (7 days before ${report_date})`, res, next);
    }

    // Get report details
    const reportDetails = await prisma.report_detail.findMany({
      where: {
        report_id: report.id
      },
      include: {
        department: true,
        doctor1: true,
        doctor2: true,
        doctor3: true
      },
      orderBy: [
        { department_id: 'asc' },
        { sequence_no: 'asc' },
        { consultation_type: 'asc' }
      ]
    });

    response.success(reportDetails, res);

  } catch (error) {
    console.error('Error in getHospitalDepartmentsDoctors:', error);
    response.error(error.message, res, next);
  }
};