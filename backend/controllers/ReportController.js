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
    if (detail.doctor1?.name) doctors.push(detail.doctor1.license_no);
    if (detail.doctor2?.name) doctors.push(detail.doctor2.license_no);
    if (detail.doctor3?.name) doctors.push(detail.doctor3.license_no);
    
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
  
  if (!dutyStaffData || !Array.isArray(dutyStaffData) || dutyStaffData.length === 0) {
    // Return default 7 positions if no data
    return Array.from({ length: 7 }, (_, i) => ({
      position: `field_group_${i + 1}`,
      staff_name_1: "",
      staff_name_2: "",
      staff_name_3: ""
    }));
  }
  
  // Sort duty staff by position number
  const sortedDutyStaff = [...dutyStaffData].sort((a, b) => {
    const numA = parseInt(a.position?.replace('field_group_', '') || '0');
    const numB = parseInt(b.position?.replace('field_group_', '') || '0');
    return numA - numB;
  });
  
  // Find the highest position number
  let maxPosition = 0;
  sortedDutyStaff.forEach(staff => {
    if (staff.position) {
      const num = parseInt(staff.position.replace('field_group_', '') || '0');
      if (num > maxPosition) {
        maxPosition = num;
      }
    }
  });
  
  // Ensure we have at least 7 positions as minimum
  const requiredPositions = Math.max(7, maxPosition);
  
  // Create a map of existing positions for quick lookup
  const existingPositions = {};
  sortedDutyStaff.forEach(staff => {
    if (staff.position) {
      existingPositions[staff.position] = staff;
    }
  });
  
  // Ensure all positions from 1 to requiredPositions exist
  for (let i = 1; i <= requiredPositions; i++) {
    const position = `field_group_${i}`;
    
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
  }
  
  return result;
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

// Get report by date with table data
export const getReportByDateTable = async (req, res, next) => {
  try {
    const { date, hospital_id } = req.body;
    
    if (!date || !hospital_id) {
      return response.error("Date and hospital_id are required", res, next);
    }

    const reportDate = new Date(date);
    
    let existingReport = null;
    // Get existing report
    existingReport = await prisma.report.findUnique({
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

    // NEW: Get duty staff from recent reports (up to 5 weeks back)
    let dutyStaffData = existingReport?.duty_staff || [];
    
    if (!dutyStaffData || dutyStaffData.length === 0) {
      // Try to find the most recent report with duty staff from last 5 weeks
      // Create an array of dates to check: 7, 14, 21, 28, 35 days ago
      const weeksToCheck = [7, 14, 21, 28, 35];
      
      for (const days of weeksToCheck) {
        const priorDate = new Date(reportDate);
        priorDate.setDate(priorDate.getDate() - days);
        
        // Create a DateTime object for the start of the prior day
        const searchPriorDate = new Date(priorDate);
        searchPriorDate.setUTCHours(0, 0, 0, 0);
        
        // Find the report from this prior date
        const priorReport = await prisma.report.findFirst({
          where: {
            medical_center_id: parseInt(hospital_id),
            report_date: searchPriorDate,
            status: {
              // notIn: ['draft', 'rejected'] // Uncomment if you have status filtering
            }
          },
          include: {
            duty_staff: true
          }
        });
        
        // If found prior report with duty staff, use it and break the loop
        if (priorReport && priorReport.duty_staff && priorReport.duty_staff.length > 0) {
          dutyStaffData = priorReport.duty_staff;
          
          // Update the existingReport object with the fetched duty staff
          if (existingReport) {
            existingReport.duty_staff = dutyStaffData;
          }
          break; // Stop checking further weeks once we find data
        }
      }
      
      // If still no duty staff found, try to find any report with duty staff in the last 5 weeks
      if ((!dutyStaffData || dutyStaffData.length === 0)) {
        const oldestDate = new Date(reportDate);
        oldestDate.setDate(oldestDate.getDate() - 35); // 5 weeks ago
        oldestDate.setUTCHours(0, 0, 0, 0);
        
        const anyRecentReportWithStaff = await prisma.report.findFirst({
          where: {
            medical_center_id: parseInt(hospital_id),
            report_date: {
              gte: oldestDate,
              lt: reportDate
            },
            status: {
              // notIn: ['draft', 'rejected'] // Uncomment if you have status filtering
            }
          },
          orderBy: {
            report_date: 'desc' // Get the most recent one
          },
          include: {
            duty_staff: true
          }
        });
        
        if (anyRecentReportWithStaff && anyRecentReportWithStaff.duty_staff && anyRecentReportWithStaff.duty_staff.length > 0) {
          dutyStaffData = anyRecentReportWithStaff.duty_staff;
          
          if (existingReport) {
            existingReport.duty_staff = dutyStaffData;
          }
        }
      }
    }
 
    console.log(dutyStaffData,'dutyStaffData')
  
    // Ensure all 21 duty staff positions exist
    if (existingReport==null && dutyStaffData.length > 0) {
        existingReport = {
          duty_staff: dutyStaffData
        }  // ensureAllDutyStaffPositions(dutyStaffData);
    }/* else if (existingReport) {
      // If still no duty staff data, create default empty positions
      existingReport.duty_staff = ensureAllDutyStaffPositions([]);
    }*/

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
        hospital_type: true // Added hospital_type
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
      hospitalType: existingReport?.hospital_type || null // Added hospital_type
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
        hospital_type: true // Added hospital_type
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

    // Calculate cumulative statistics UP TO THE REPORT DATE
    const cumulativeReports = await prisma.report.findMany({
      where: {
        medical_center_id: report.medical_center_id,
        report_date: {
          lte: report.report_date // Only reports up to this date
        }
      },
      select: {
        admission_count: true,
        discharge_count: true
      }
    });

    const cumulativeStats = cumulativeReports.reduce((acc, cumulativeReport) => {
      acc.admission_count += cumulativeReport.admission_count || 0;
      acc.discharge_count += cumulativeReport.discharge_count || 0;
      return acc;
    }, { 
      admission_count: 0,
      discharge_count: 0
    });

    // Calculate total admitted patients UP TO THE REPORT DATE
    const total_admitted_patient = Math.max(0, cumulativeStats.admission_count - cumulativeStats.discharge_count);

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
      hospitalType: report.hospital_type || null,
      total_admitted_patient: total_admitted_patient,
      cumulativeStats: { // Added cumulative statistics up to report date
        admission_count: cumulativeStats.admission_count,
        discharge_count: cumulativeStats.discharge_count,
        total_admitted_patient: total_admitted_patient
      }
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
      monthlyStats: {
        ...monthlyStats,
        total_admitted_patient: Math.max(0, monthlyStats.admission_count - monthlyStats.discharge_count) // Monthly total
      },
      cumulativeStats: organizedData.cumulativeStats, // Include cumulative stats in main response
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
          staff_name_3: staff.staff_name_3 || "" // NEW: third staff name
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
          duty_staff: true, // UPDATED: Now includes staff_name_3
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
        approved_at: true,
        hospital_type: true // Added hospital_type
      }
    });

    response.success({
      exists: !!report,
      status: report?.status || 'not_found',
      report_no: report?.report_no,
      submitted_at: report?.submitted_at,
      approved_at: report?.approved_at,
      hospital_type: report?.hospital_type || null // Added hospital_type
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
      month,
      year
    } = req.body;

    // Get user from request for medical center filtering
    const user = req.user;
    const userId = req.user.id;
    const userRole = req.user.role;

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
    } else {
      // Default to current month
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
        where.status = { in: ['draft', 'submitted'] };
      } else if(status== 'pendingApproval'){

      if (user.role === 'superAdmin' || user.role === 'admin') {
        where.next_role = 'admin';
      } else if (user.role === 'staff' || user.role === 'hospitalAssistant') {
        where.next_role = { in: ['hospitalAssistant', 'staff', 'operator', 'admin'] };
      } else {
        where.next_role = user.role;
      }

        where.status = { in: ['submitted'] }; // can not where.status = 'approved'

        where.approvals = {
          none: {
            admin_id: user.id
          }
        };


      }
      else {
        where.status = status;
      }
    }

    console.log(where,'where')

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

    // Calculate statistics
    const monthStart = where.report_date?.gte || new Date();
    const monthEnd = where.report_date?.lte || new Date();
    
    const statsWhere = { ...where };
    delete statsWhere.status;
    //delete statsWhere.next_role; // Remove next_role from stats calculation

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
        special_notes: report.special_notes,
        hospital_type: report.hospital_type || null,
        next_role: report.next_role || 'operator', // Added next_role to response
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

    // Define columns (added hospital_type column)
    worksheet.columns = [
      { header: '通番', key: 'sequence', width: 10 },
      { header: '医療機関名', key: 'hospital_name', width: 30 },
      { header: '種類', key: 'hospital_type', width: 15 },
      { header: '報告日', key: 'report_date', width: 15 },
      { header: '報告番号', key: 'report_no', width: 20 },
      { header: 'ステータス', key: 'status', width: 15 },
      { header: '病院タイプ', key: 'hospital_type_detail', width: 15 }, // New column for hospital_type
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

      // Hospital type mapping (medical center type)
      const typeMap = {
        'large_hospital': '大病院',
        'hospital': '病院',
        'welfare': '福祉施設'
      };

      // Hospital type detail mapping (report hospital_type)
      const hospitalTypeDetailMap = {
        'large_hospital': '病院：大',
        'hospital': '病院',
        'welfare': '福祉'
      };

      worksheet.addRow({
        sequence: index + 1,
        hospital_name: report.medical_center?.name || '--',
        hospital_type: typeMap[report.medical_center?.type] || '--',
        report_date: formatJapaneseDate(report.report_date),
        report_no: report.report_no,
        status: statusMap[report.status] || report.status,
        hospital_type_detail: hospitalTypeDetailMap[report.hospital_type] || report.hospital_type || '--', // New column
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

    // Ensure all 21 duty staff positions exist
    if (report.duty_staff) {
      report.duty_staff = ensureAllDutyStaffPositions(report.duty_staff);
    }

    response.success({
      report,
      formatted_date: formatJapaneseDate(report.report_date),
      submitted_date: report.submitted_at ? formatJapaneseDate(report.submitted_at) : null,
      approved_date: report.approved_at ? formatJapaneseDate(report.approved_at) : null,
      hospital_type: report.hospital_type || null, // Added hospital_type
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
      report: updatedReport,
      hospital_type: updatedReport.hospital_type // Added hospital_type
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
        status: true,
        hospital_type: true // Added hospital_type
      }
    });

    // Calculate statistics
    const stats = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      total: 0,
      pending: 0, // draft + submitted
      by_hospital_type: {} // Statistics by hospital type
    };

    reports.forEach(report => {
      stats[report.status]++;
      stats.total++;
      if (report.status === 'draft' || report.status === 'submitted') {
        stats.pending++;
      }
      
      // Count by hospital type
      if (report.hospital_type) {
        if (!stats.by_hospital_type[report.hospital_type]) {
          stats.by_hospital_type[report.hospital_type] = {
            count: 0,
            draft: 0,
            submitted: 0,
            approved: 0,
            rejected: 0
          };
        }
        stats.by_hospital_type[report.hospital_type].count++;
        stats.by_hospital_type[report.hospital_type][report.status]++;
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

// Add comment to report
export const addComment = async (req, res, next) => {
  try {
    const { report_id, comment, is_internal = false } = req.body;
    const userId = req.user.id;
    
    if (!report_id || !comment) {
      return response.error("Report ID and comment are required", res, next);
    }

    // Check if report exists
    const reportExists = await prisma.report.findUnique({
      where: { id: parseInt(report_id) }
    });

    if (!reportExists) {
      return response.error("Report not found", res, next);
    }

    // Create comment
    const newComment = await prisma.report_comment.create({
      data: {
        report_id: parseInt(report_id),
        admin_id: userId,
        comment: comment,
        is_internal: is_internal,
        can_edit: true
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

    response.success({
      success: true,
      message: "Comment added successfully",
      comment: newComment
    }, res);

  } catch (error) {
    console.error('Error adding comment:', error);
    response.error(error.message, res, next);
  }
};

// Edit comment
export const editComment = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (!comment) {
      return response.error("Comment is required", res, next);
    }

    // Get existing comment
    const existingComment = await prisma.report_comment.findUnique({
      where: { id: commentId },
      include: {
        admin: true
      }
    });

    if (!existingComment) {
      return response.error("Comment not found", res, next);
    }

    // Check if user owns the comment
    if (existingComment.admin_id !== userId) {
      return response.error("You can only edit your own comments", res, next);
    }

    // Check if comment can still be edited (within 6 hours)
    const createdDate = new Date(existingComment.created_at);
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    
    if (createdDate < sixHoursAgo) {
      return response.error("Comments can only be edited within 6 hours of creation", res, next);
    }

    // Check if can_edit is still true
    if (!existingComment.can_edit) {
      return response.error("This comment can no longer be edited", res, next);
    }

    // Update comment
    const updatedComment = await prisma.report_comment.update({
      where: { id: commentId },
      data: {
        comment: comment,
        edited_at: new Date(),
        updated_at: new Date()
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

    response.success({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment
    }, res);

  } catch (error) {
    console.error('Error editing comment:', error);
    response.error(error.message, res, next);
  }
};

// Delete comment
export const deleteComment = async (req, res, next) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get existing comment
    const existingComment = await prisma.report_comment.findUnique({
      where: { id: commentId },
      include: {
        admin: true
      }
    });

    if (!existingComment) {
      return response.error("Comment not found", res, next);
    }

    // Check if user owns the comment or is admin/superAdmin
    const canDelete = existingComment.admin_id === userId || 
                     userRole === 'admin' || 
                     userRole === 'superAdmin';

    if (!canDelete) {
      return response.error("You don't have permission to delete this comment", res, next);
    }

    // Check if comment can still be deleted (within 6 hours for non-admins)
    if (existingComment.admin_id === userId && 
        userRole !== 'admin' && 
        userRole !== 'superAdmin') {
      
      const createdDate = new Date(existingComment.created_at);
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
      
      if (createdDate < sixHoursAgo) {
        return response.error("Comments can only be deleted within 6 hours of creation", res, next);
      }
    }

    // Delete comment
    await prisma.report_comment.delete({
      where: { id: commentId }
    });

    response.success({
      success: true,
      message: "Comment deleted successfully"
    }, res);

  } catch (error) {
    console.error('Error deleting comment:', error);
    response.error(error.message, res, next);
  }
};

// Get report comments
export const getComments = async (req, res, next) => {
  try {
    const { report_id } = req.body;
    
    if (!report_id) {
      return response.error("Report ID is required", res, next);
    }

    const comments = await prisma.report_comment.findMany({
      where: {
        report_id: parseInt(report_id),
        is_internal: false // Only show non-internal comments
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
    });

    response.success({
      success: true,
      comments: comments
    }, res);

  } catch (error) {
    console.error('Error getting comments:', error);
    response.error(error.message, res, next);
  }
};

// Add this function to handle approval hierarchy check
const checkApprovalHierarchy = async (reportId, currentUserRole, currentUserId, prisma) => {
  // Get all approvals for this report
  const existingApprovals = await prisma.report_approval.findMany({
    where: { report_id: parseInt(reportId) },
    include: {
      admin: {
        select: {
          id: true,
          role: true
        }
      }
    }
  });

  // Role hierarchy with power levels (lower number = higher power)
  const roleHierarchy = {
    'superAdmin': 1,
    'admin': 2,
    'hospitalAssistant': 3,
    'staff': 4,
    'operator': 5
  };

  const userRoleLevel = roleHierarchy[currentUserRole];
  
  // Check if user has already approved this report
  const userApproval = existingApprovals.find(a => a.admin_id === currentUserId);
  if (userApproval) {
    return { canApprove: false, reason: 'You have already approved this report' };
  }

  // Check if any higher role has already approved
  const higherRoleApprovals = existingApprovals.filter(approval => {
    const approvalRoleLevel = roleHierarchy[approval.admin.role];
    return approvalRoleLevel < userRoleLevel;
  });

  // If higher role has approved and bypassed lower roles, lower roles cannot approve
  const bypassingHigherApproval = higherRoleApprovals.find(a => a.bypassed_lower_roles);
  if (bypassingHigherApproval) {
    return { 
      canApprove: false, 
      reason: `${bypassingHigherApproval.admin.role} すでに下位の役割を承認し、回避している` 
    };
  }

  // Check if lower roles need to approve first
  const lowerRoles = Object.entries(roleHierarchy)
    .filter(([role, level]) => level > userRoleLevel)
    .map(([role]) => role);

  const lowerRoleApprovals = existingApprovals.filter(approval => 
    lowerRoles.includes(approval.admin.role)
  );

  // Determine if we're bypassing lower roles
  const bypassedLowerRoles = lowerRoles.length > 0 && lowerRoleApprovals.length === 0;

  return {
    canApprove: true,
    bypassedLowerRoles,
    existingApprovals
  };
};

// Update the approveReport function to include hierarchy check
export const approveReport = async (req, res, next) => {
  try {
    const { report_id, comments, approval_status = 'approved' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    let next_role=null
    if(userRole=='operator'){next_role='staff'}
    else if(userRole=='staff'){next_role='hospitalAssistant'}
    else if(userRole=='hospitalAssistant'){next_role='admin'}
    else {next_role=null}
    
    if (!report_id) {
      return response.error("Report ID is required", res, next);
    }

    // Check approval hierarchy
    const hierarchyCheck = await checkApprovalHierarchy(report_id, userRole, userId, prisma);
    if (!hierarchyCheck.canApprove) {
      return response.error(hierarchyCheck.reason, res, next);
    }

    // Get the report
    const report = await prisma.report.findUnique({
      where: { id: parseInt(report_id) },
      select: {
        id: true,
        status: true,
        hospital_type: true // Added hospital_type
      }
    });

    if (!report) {
      return response.error("Report not found", res, next);
    }

    // Create approval record
    const approval = await prisma.report_approval.create({
      data: {
        report_id: parseInt(report_id),
        admin_id: userId,
        approval_status: approval_status,
        comments: comments,
        previous_status: report.status,
        bypassed_lower_roles: hierarchyCheck.bypassedLowerRoles
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

      await prisma.report.update({
        where: { id: parseInt(report_id) },
        data: {
          next_role: next_role,
          updated_at: new Date(),
          updated_by: userId
        }
      });
     

    // Update report status if superAdmin or admin approves
    let reportUpdated = false;
    if (userRole === 'superAdmin' || userRole === 'admin') {
      await prisma.report.update({
        where: { id: parseInt(report_id) },
        data: {
          status: 'approved',
          approved_at: new Date(),
          approved_by: userId,
          updated_at: new Date(),
          updated_by: userId
        }
      });
      reportUpdated = true;
    }

    response.success({
      success: true,
      message: "Report approved successfully",
      approval: approval,
      report_updated: reportUpdated,
      bypassed_lower_roles: hierarchyCheck.bypassedLowerRoles,
      hospital_type: report.hospital_type // Added hospital_type
    }, res);

  } catch (error) {
    console.error('Error approving report:', error);
    response.error(error.message, res, next);
  }
};
export const draftReport = async (req, res, next) => {
  try {
    const { report_id, comments, approval_status = 'draft' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!report_id) {
      return response.error("Report ID is required", res, next);
    }

 

    // Get the report
    const report = await prisma.report.findUnique({
      where: { id: parseInt(report_id) },
      select: {
        id: true,
        status: true,
        hospital_type: true // Added hospital_type
      }
    });

    if (!report) {
      return response.error("Report not found", res, next);
    }

    // Update report status if superAdmin or admin approves
    let reportUpdated = false;
 
      await prisma.report.update({
        where: { id: parseInt(report_id) },
        data: {
          status: 'draft',
          approved_at: new Date(),
          approved_by: userId,
          updated_at: new Date(),
          updated_by: userId
        }
      });
      reportUpdated = true;
 

    response.success({
      success: true,
      message: "Report draft successfully",
        }, res);

  } catch (error) {
    console.error('Error approving report:', error);
    response.error(error.message, res, next);
  }
};
// Update the getReadOnlyStats function in ReportController.js
export const getReadOnlyStats = async (req, res, next) => {
  try {
    const { date, hospital_id } = req.body;
    
    if (!date || !hospital_id) {
      return response.error("Date and hospital_id are required", res, next);
    }

    const reportDate = new Date(date);
    const hospitalId = parseInt(hospital_id);
    
    // Get the start and end of the month for the given date
    const startOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
    const endOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0);
    
    // Calculate the start and end of the year
    const startOfYear = new Date(reportDate.getFullYear(), 0, 1);
    const endOfYear = new Date(reportDate.getFullYear(), 11, 31);
    
    // Fetch all reports for this hospital for the current month (excluding draft/rejected)
    const monthlyReports = await prisma.report.findMany({
      where: {
        medical_center_id: hospitalId,
        report_date: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        status: {
          notIn: ['draft', 'rejected']
        }
      },
      include: {
        report_details: {
          where: {
            consultation_type: {
              in: ['morning', 'afternoon', 'night']
            }
          },
          select: {
            consultation_type: true,
            patient_count: true
          }
        }
      }
    });
    
    // Fetch all reports for this hospital for the current year (excluding draft/rejected)
    const yearlyReports = await prisma.report.findMany({
      where: {
        medical_center_id: hospitalId,
        report_date: {
          gte: startOfYear,
          lte: endOfYear
        },
        status: {
          notIn: ['draft', 'rejected']
        }
      },
      include: {
        report_details: {
          where: {
            consultation_type: {
              in: ['morning', 'afternoon', 'night']
            }
          },
          select: {
            consultation_type: true,
            patient_count: true
          }
        }
      }
    });
    
    // Helper function to calculate statistics
    const calculateStats = (reports, excludeCurrentDate = false, currentDate = null) => {
      const stats = {
        morningClinic: 0, // 緊急搬入数 (sum of morning patient_count)
        afternoonClinic: 0, // 搬入後入院件数 (sum of afternoon patient_count)
        onDuty: 0, // 訪問診療 (sum of night patient_count)
        totalPatientCount: 0
      };
      
      reports.forEach(report => {
        // If excludeCurrentDate is true, skip the report for the current date
        if (excludeCurrentDate && currentDate && 
            report.report_date.getDate() === currentDate.getDate() &&
            report.report_date.getMonth() === currentDate.getMonth() &&
            report.report_date.getFullYear() === currentDate.getFullYear()) {
          return; // Skip this report (current day)
        }
        
        if (report.report_details && report.report_details.length > 0) {
          report.report_details.forEach(detail => {
            const patientCount = detail.patient_count || 0;
            stats.totalPatientCount += patientCount;
            
            switch(detail.consultation_type) {
              case 'morning':
                stats.morningClinic += patientCount;
                break;
              case 'afternoon':
                stats.afternoonClinic += patientCount;
                break;
              case 'night':
                stats.onDuty += patientCount;
                break;
            }
          });
        }
      });
      
      return stats; 
    };

    /**
 * Calculate monthly cumulative stats up to a specific date
 * @param {Array} reports - Array of report objects from DB
 * @param {Date} targetDate - Date up to which cumulative stats should be calculated
 * @returns {Object} stats - { morningClinic, afternoonClinic, onDuty, totalPatientCount }
 */
const calculateMonthlyCumulative = (reports, targetDate) => {
  const stats = {
    morningClinic: 0,
    afternoonClinic: 0,
    onDuty: 0,
    totalPatientCount: 0
  };

  reports.forEach(report => {
    // Skip reports after the targetDate
    const reportTime = new Date(report.report_date);
    if (reportTime > targetDate) return;

    if (report.report_details && report.report_details.length > 0) {
      report.report_details.forEach(detail => {
        const patientCount = detail.patient_count || 0;
        stats.totalPatientCount += patientCount;

        switch(detail.consultation_type) {
          case 'morning':
            stats.morningClinic += patientCount;
            break;
          case 'afternoon':
            stats.afternoonClinic += patientCount;
            break;
          case 'night':
            stats.onDuty += patientCount;
            break;
        }
      });
    }
  });

  return stats;
};

    
    // Calculate monthly cumulative stats (from start of month up to previous day)
const monthlyCumulativeStats = calculateMonthlyCumulative(monthlyReports, reportDate);
    
    // Calculate full month stats (including current day if it exists)
    const monthlyStats = calculateStats(monthlyReports);
    
    // Calculate yearly stats
    const yearlyStats = calculateStats(yearlyReports);
    
    // Also get the existing report for this specific date (if it exists and is not draft/rejected)
    const existingReport = await prisma.report.findFirst({
      where: {
        medical_center_id: hospitalId,
        report_date: reportDate,
        status: {
          notIn: ['draft', 'rejected']
        }
      },
      include: {
        report_details: {
          where: {
            consultation_type: {
              in: ['morning', 'afternoon', 'night']
            }
          },
          select: {
            consultation_type: true,
            patient_count: true
          }
        }
      }
    });
    
    // Calculate daily stats from the existing report
    let dailyStats = {
      morningClinic: 0,
      afternoonClinic: 0,
      onDuty: 0
    };
    
    if (existingReport && existingReport.report_details.length > 0) {
      existingReport.report_details.forEach(detail => {
        const patientCount = detail.patient_count || 0;
        switch(detail.consultation_type) {
          case 'morning':
            dailyStats.morningClinic = patientCount;
            break;
          case 'afternoon':
            dailyStats.afternoonClinic = patientCount;
            break;
          case 'night':
            dailyStats.onDuty = patientCount;
            break;
        }
      });
    }
    
    response.success({
      success: true,
      data: {
        daily: dailyStats,
        monthlyCumulative: monthlyCumulativeStats, // Cumulative up to previous day
        monthlyTotal: monthlyStats, // Full month including current day
        yearly: yearlyStats,
        hasExistingReport: !!existingReport,
        reportDate: reportDate.toISOString().split('T')[0],
        month: reportDate.getMonth() + 1,
        year: reportDate.getFullYear()
      }
    }, res);

  } catch (error) {
    console.error('Error in getReadOnlyStats:', error);
    response.error(error.message, res, next);
  }
};

// Get hospital_type by report ID
export const getHospitalTypeByReportId = async (req, res, next) => {
  try {
    const { report_id } = req.body;
    
    if (!report_id) {
      return response.error("Report ID is required", res, next);
    }

    // Get report by ID - select only hospital_type and minimal info
    const report = await prisma.report.findUnique({
      where: {
        id: parseInt(report_id)
      },
      select: {
        id: true,
        hospital_type: true,
        report_no: true,
        report_date: true,
        medical_center: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        status: true
      }
    });

    if (!report) {
      return response.error("Report not found", res, next);
    }

    response.success({
      success: true,
      report_id: report.id,
      report_no: report.report_no,
      report_date: report.report_date,
      hospital_type: report.hospital_type,
      medical_center: report.medical_center,
      status: report.status
    }, res);

  } catch (error) {
    console.error('Error in getHospitalTypeByReportId:', error);
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

    let report = null;
    
    // Try to find a report from 7, 14, 21, 28, or 35 days prior
    const daysToCheck = [7, 14, 21, 28, 35];
    
    for (const days of daysToCheck) {
      // Calculate date X days earlier
      const targetDate = new Date(providedDate);
      targetDate.setDate(targetDate.getDate() - days);
      
      // Create a DateTime object for the start of the target day
      const searchDate = new Date(targetDate);
      searchDate.setUTCHours(0, 0, 0, 0); // Set to start of day (00:00:00)
      
      // Find the report for the calculated date
      const foundReport = await prisma.report.findFirst({
        where: {
          medical_center_id: parseInt(hospital_id),
          /*OR: [
            { status: 'submitted' },
            { status: 'approved' }
          ],*/
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
      
      if (foundReport) {
        report = foundReport;
        console.log(`Found report from ${days} days prior (date: ${report.report_date.toISOString().split('T')[0]})`);
        break; // Stop checking once we find a report
      }
    }

    // If no report found for any of the calculated dates, return empty array
    if (!report) {
      return response.success([], res);
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