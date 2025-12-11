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