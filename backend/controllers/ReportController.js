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


// Add to ReportController.js
export const getReportList = async (req, res, next) => {
  try {
    const { 
      hospital_id, 
      page = 1, 
      limit = 10, 
      start_date, 
      end_date,
      status,
      search 
    } = req.body;

    if (!hospital_id) {
      return response.error("hospital_id is required", res, next);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const medicalCenterId = parseInt(hospital_id);

    // Build where conditions
    const where = {
      medical_center_id: medicalCenterId
    };

    // Filter by date range
    if (start_date && end_date) {
      where.report_date = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Search functionality (optional)
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
          select: { name: true }
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
        },
        _count: {
          select: {
            report_details: true
          }
        }
      },
      orderBy: {
        report_date: 'desc'
      },
      skip,
      take: parseInt(limit)
    });

    // Calculate statistics for dashboard
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get statistics for current month
    const monthlyStats = await prisma.report.groupBy({
      by: ['status'],
      where: {
        medical_center_id: medicalCenterId,
        report_date: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      _count: true
    });

    // Transform monthly stats to object
    const stats = {
      submitted: 0,
      draft: 0,
      approved: 0,
      rejected: 0,
      unsubmitted: 0
    };

    monthlyStats.forEach(stat => {
      stats[stat.status] = stat._count;
    });

    // Calculate unsubmitted reports (days without report in current month)
    const allDates = [];
    const currentDate = new Date(currentMonthStart);
    
    while (currentDate <= currentMonthEnd) {
      allDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get dates that have reports
    const reportedDates = await prisma.report.findMany({
      where: {
        medical_center_id: medicalCenterId,
        report_date: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      select: { report_date: true }
    });

    const reportedDateStrings = reportedDates.map(r => r.report_date.toISOString().split('T')[0]);
    const unsubmittedDates = allDates.filter(date => 
      !reportedDateStrings.includes(date.toISOString().split('T')[0])
    );

    stats.unsubmitted = unsubmittedDates.length;

    // Format response
    const formattedReports = reports.map(report => {
      // Calculate patient statistics from report_details
      let totalPatients = 0;
      let inpatientTotal = 0;
      let outpatientTotal = 0;

      if (report.report_details && report.report_details.length > 0) {
        totalPatients = report.report_details.reduce((sum, detail) => 
          sum + (detail.patient_count || 0), 0);
        
        // For demo, we'll calculate some mock values
        // In production, you might want to store these in the report table
        inpatientTotal = Math.floor(totalPatients * 0.6); // 60% inpatients
        outpatientTotal = Math.floor(totalPatients * 0.4); // 40% outpatients
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
        department_count: report._count?.report_details || 0,
        medical_center_name: report.medical_center?.name,
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
      statistics: {
        submitted: stats.submitted,
        draft: stats.draft,
        approved: stats.approved,
        rejected: stats.rejected,
        unsubmitted: stats.unsubmitted,
        total: Object.values(stats).reduce((a, b) => a + b, 0)
      }
    }, res);

  } catch (error) {
    console.error('Error in getReportList:', error);
    response.error(error.message, res, next);
  }
};

// Helper function to format date in Japanese format
function formatJapaneseDate(date) {
  if (!date) return '--';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}