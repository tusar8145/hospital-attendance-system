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
        // Include both types of report details
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

    // Get doctors for this hospital
    const doctors = await prisma.doctor.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: 1
      }
    });

    if (!existingReport) {
      const report = await prisma.report.findFirst({
        where: {
          medical_center_id: parseInt(hospital_id),
        },
        select: {
          id: true,
          report_date: true
        },
        orderBy: {
          id: 'desc'
        }
      });

      if (report) {
        // Get report details for report_detail_mid
        const reportDetails = await prisma.report_detail_mid.findMany({
          where: {
            report_id: report.id
          },
          include: {
            department: true
          },
          orderBy: [
            { sequence_no: 'asc' },
            { consultation_type: 'asc' }
          ]
        });

        // Format the response: Set total_patients to 0 and new_patients to 0
        const formattedResponse = reportDetails.map(detail => {
          // Create a new object without patient_count
          const { patient_count, ...rest } = detail;
          return {
            ...rest,
            total_patients: 0,
            new_patients: 0
          };
        });

        return response.success({
          report: { "report_details_mid": formattedResponse },
          departments,
          doctors,
          exists: true
        }, res);
      }
    }

    response.success({
      report: existingReport,
      departments,
      doctors,
      exists: !!existingReport
    }, res);

  } catch (error) {
    console.error('Error in getReportByDate:', error);
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
        // Include both types of report details
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

    // Get doctors for this hospital
    const doctors = await prisma.doctor.findMany({
      where: {
        medical_center_id: report.medical_center_id,
        status: 1
      }
    });

    response.success({
      report,
      departments,
      doctors,
      exists: true
    }, res);

  } catch (error) {
    console.error('Error in getReportById:', error);
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
        report_details,           // For ConsolidatedContentComponent (doctor-based)
        report_details_mid,       // For ConsolidatedContentComponentCount (patient count-based)
        external_consultation_details, // NEW: External consultation details
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

      // NEW: Add external_consultation_details if provided
      if (external_consultation_details) {
        reportData.external_consultation_details = external_consultation_details;
      }

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

      // Handle report_details (doctor-based) - Only if data is provided
      if (report_details && Array.isArray(report_details)) {
        // Delete existing report_details
        await tx.report_detail.deleteMany({
          where: { report_id: report.id }
        });

        // Create new report_details if there's data
        if (report_details.length > 0) {
          const detailsData = report_details.map(detail => ({
            report_id: report.id,
            sequence_no: parseInt(detail.sequence_no) || 1,
            floor: detail.floor,
            consultation_type: detail.consultation_type,
            doctor_id_1: detail.doctor_id_1 ? parseInt(detail.doctor_id_1) : null,
            doctor_id_2: detail.doctor_id_2 ? parseInt(detail.doctor_id_2) : null,
            doctor_id_3: detail.doctor_id_3 ? parseInt(detail.doctor_id_3) : null,
          }));

          await tx.report_detail.createMany({
            data: detailsData
          });
        }
      }

      // Handle report_details_mid (patient count-based) - Only if data is provided
      if (report_details_mid && Array.isArray(report_details_mid)) {
        // Delete existing report_details_mid
        await tx.report_detail_mid.deleteMany({
          where: { report_id: report.id }
        });

        // Create new report_details_mid if there's data
        if (report_details_mid.length > 0) {
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
      }

      // Get complete report with both types of details
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
      console.error('Error in submitReport transaction:', error);
      throw error;
    }
  });

  try {
    response.success(transaction, res);
  } catch (error) {
    console.error('Error in submitReport:', error);
    response.error(error.message, res, next);
  }
};

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

// In your backend controller (report-mid controller)
export const getDepartmentsWithDoctors = async (req, res, next) => {
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
      include: {
        doctor_links: {
          where: { 
            status: 1,
            doctor: { status: 1 } // Only include active doctors
          },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                license_no: true
              }
            }
          }
        }
      },
      orderBy: [
        { floor: 'asc' },
        { name: 'asc' }
      ]
    });

    // Format the response
    const formattedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      floor: dept.floor || '未設定',
      doctors: dept.doctor_links
        .filter(link => link.doctor) // Ensure doctor exists
        .map(link => link.doctor)    // Extract doctor info
    }));

    response.success(formattedDepartments, res);
  } catch (error) {
    console.error('Error in getDepartmentsWithDoctors:', error);
    response.error(error.message, res, next);
  }
};

export const getLastReportMidData = async (req, res, next) => {
  try {
    const { hospital_id, report_date } = req.body;
    
    // Validate required parameters
    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }
 
    // Find the report for the calculated date
    const report = await prisma.report.findFirst({
      where: {
        medical_center_id: parseInt(hospital_id),
      },
      select: {
        id: true,
        report_date: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    console.log('xxxxxx', report)

    // If no report found for the calculated date, return error
    if (!report) {
      const dateString = searchDate.toISOString().split('T')[0];
      return response.error(`No report found for date: ${dateString} (7 days before ${report_date})`, res, next);
    }

    // Get report details for report_detail_mid
    const reportDetails = await prisma.report_detail_mid.findMany({
      where: {
        report_id: report.id
      },
      include: {
        department: true
      },
      orderBy: [
        { sequence_no: 'asc' },
        { consultation_type: 'asc' }
      ]
    });

    // Format the response: Set total_patients to 0 and new_patients to 0
    const formattedResponse = reportDetails.map(detail => {
      // Create a new object without patient_count
      const { patient_count, ...rest } = detail;
      return {
        ...rest,
        total_patients: 0,
        new_patients: 0
      };
    });
console.log(formattedResponse,'formattedResponse')
    response.success(formattedResponse, res);

  } catch (error) {
    console.error('Error in getLastReportMidData:', error);
    response.error(error.message, res, next);
  }
};
