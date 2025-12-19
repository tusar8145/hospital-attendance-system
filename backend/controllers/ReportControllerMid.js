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
        report_details_mid: {
          include: {
            department: true
          },
          orderBy: [
            { sequence_no: 'asc' },
            { consultation_type: 'asc' }
          ]
        },
        medical_center: true
      }
    });

    // Get departments
    const departments = await prisma.department.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: 1
      }
    });

    response.success({
      report: existingReport,
      departments,
      exists: !!existingReport
    }, res);

  } catch (error) {
    console.error('Error in getReportByDateMid:', error);
    response.error(error.message, res, next);
  }
};

 
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
        report_details_mid: {
          include: {
            department: true
          },
          orderBy: [
            { sequence_no: 'asc' },
            { consultation_type: 'asc' }
          ]
        },
        medical_center: true,
        created_by_admin: {
          select: { name: true }
        },
        updated_by_admin: {
          select: { name: true }
        }
      }
    });

    if (!report) {
      return response.error("Report not found", res, next);
    }

    // Get departments
    const departments = await prisma.department.findMany({
      where: {
        medical_center_id: report.medical_center_id,
        status: 1
      }
    });

    response.success({
      report,
      departments,
      exists: true
    }, res);

  } catch (error) {
    console.error('Error in getReportByIdMid:', error);
    response.error(error.message, res, next);
  }
};

export const submitReport = async (req, res, next) => {
  const transaction = await prisma.$transaction(async (tx) => {
    try {
      const {
        hospital_id,
        report_date,
        admission_count,
        discharge_count,
        external_duty,
        emergency_transport,
        post_transport_admission,
        visit_count,
        special_notes,
        report_details_mid,  // Changed from report_details to report_details_mid
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
        external_duty: parseInt(external_duty) || 0,
        emergency_transport: parseInt(emergency_transport) || 0,
        post_transport_admission: parseInt(post_transport_admission) || 0,
        visit_count: parseInt(visit_count) || 0,
        hospital_type: hospital_type || 'hospital',
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

      // Delete existing mid details
      await tx.report_detail_mid.deleteMany({
        where: { report_id: report.id }
      });

      // Create report details mid
      if (report_details_mid && report_details_mid.length > 0) {
        const detailsData = report_details_mid.map(detail => ({
          report_id: report.id,
          sequence_no: parseInt(detail.sequence_no) || 1,
          department_id: parseInt(detail.department_id),
          consultation_type: detail.consultation_type,
          total_patients: parseInt(detail.total_patients) || 0,
          new_patients: parseInt(detail.new_patients) || 0
        }));

        await tx.report_detail_mid.createMany({
          data: detailsData
        });
      }

      // Get complete report
      const completeReport = await tx.report.findUnique({
        where: { id: report.id },
        include: {
          report_details_mid: {
            include: {
              department: true
            }
          },
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
    console.error('Error in submitReportMid:', error);
    response.error(error.message, res, next);
  }
};

// Get departments with doctors
// Get departments only (no doctors)
export const getDepartments = async (req, res, next) => {
  try {
    const { hospital_id } = req.body;

    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }

    const departments = await prisma.department.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: 1
      },
      orderBy: {
        name: 'asc'
      }
    });

    response.success(departments, res);
  } catch (error) {
    console.error('Error in getDepartments:', error);
    response.error(error.message, res, next);
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