import { PrismaClient } from '@prisma/client';
import { user_id } from '../middleware/Auth.js';
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

// Helper to generate report number
function generateReportNo(medicalCenterId, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `RPT-WELFARE-${medicalCenterId}-${year}${month}${day}`;
}

// Get all previous reports up to current date
async function getPreviousReports(medicalCenterId, currentDate) {
  try {
    const searchDate = new Date(currentDate);
    searchDate.setUTCHours(0, 0, 0, 0);

    const reports = await prisma.report.findMany({
      where: {
        medical_center_id: parseInt(medicalCenterId),
        hospital_type: 'welfare',
        OR: [
          { status: 'submitted' },
          { status: 'approved' }
        ],
        report_date: {
          lt: searchDate // All reports before current date
        }
      },
      include: {
        welfare_report_data: true
      },
      orderBy: {
        report_date: 'asc'
      }
    });

    return reports;
  } catch (error) {
    console.error('Error getting previous reports:', error);
    return [];
  }
}

// Calculate derived fields based on writable fields and historical data
// Calculate derived fields based on writable fields and historical data
// Calculate derived fields based on writable fields and historical data
async function calculateDerivedFields(writableData, medicalCenterId, currentDate) {
  const result = {};
  
  const getValue = (value) => parseInt(value) || 0;
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Get yesterday's date and report
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  
  const yesterdayReport = await prisma.report.findFirst({
    where: {
      medical_center_id: parseInt(medicalCenterId),
      hospital_type: 'welfare',
      OR: [{ status: 'submitted' }, { status: 'approved' }],
      report_date: yesterday
    },
    include: { welfare_report_data: true }
  });
  
  // Get all previous reports for cumulative calculations
  const allPreviousReports = await prisma.report.findMany({
    where: {
      medical_center_id: parseInt(medicalCenterId),
      hospital_type: 'welfare',
      OR: [{ status: 'submitted' }, { status: 'approved' }],
      report_date: { lt: currentDate }
    },
    include: { welfare_report_data: true },
    orderBy: { report_date: 'asc' }
  });
  
  // Get monthly reports
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const monthlyReports = await prisma.report.findMany({
    where: {
      medical_center_id: parseInt(medicalCenterId),
      hospital_type: 'welfare',
      OR: [{ status: 'submitted' }, { status: 'approved' }],
      report_date: { gte: startOfMonth, lt: currentDate }
    },
    include: { welfare_report_data: true },
    orderBy: { report_date: 'asc' }
  });
  
  // Get annual reports
  const startOfYear = new Date(currentYear, 0, 1);
  const annualReports = await prisma.report.findMany({
    where: {
      medical_center_id: parseInt(medicalCenterId),
      hospital_type: 'welfare',
      OR: [{ status: 'submitted' }, { status: 'approved' }],
      report_date: { gte: startOfYear, lt: currentDate }
    },
    include: { welfare_report_data: true },
    orderBy: { report_date: 'asc' }
  });
  
  // Get capacities
  const capacities = {
    section1: getValue(writableData.section1_capacity),
    section2: getValue(writableData.section2_capacity),
    section3: getValue(writableData.section3_capacity),
    section4: getValue(writableData.section4_capacity),
    section5: getValue(writableData.section5_capacity),
    section6: getValue(writableData.section6_capacity),
    section7: getValue(writableData.section7_capacity)
  };
  
  // For Sections 1-3 (入所, 短期入所, ケアハウス)
  for (let i = 1; i <= 3; i++) {
    const todayAdmission = getValue(writableData[`section${i}_admission_count`]);
    const todayDischarge = getValue(writableData[`section${i}_discharge_count`]);
    
    // 前日入所者数 = yesterday's admission count
    let yesterdayAdmission = 0;
    if (yesterdayReport?.welfare_report_data) {
      yesterdayAdmission = getValue(yesterdayReport.welfare_report_data[`section${i}_admission_count`]);
    }
    result[`section${i}_end_users`] = yesterdayAdmission; // This will be 7 for Dec 17
    
    // Calculate cumulative residents
    let cumulativeResidents = 0;
    allPreviousReports.forEach(report => {
      if (report.welfare_report_data) {
        const data = report.welfare_report_data;
        const admission = getValue(data[`section${i}_admission_count`]);
        const discharge = getValue(data[`section${i}_discharge_count`]);
        cumulativeResidents = cumulativeResidents + admission - discharge;
      }
    });
    
    // 当日末入所者数 = cumulative + today's admission - today's discharge
    result[`section${i}_today_end_users`] = cumulativeResidents + todayAdmission - todayDischarge;
    
    // Monthly admission
    let monthlyAdmission = todayAdmission;
    monthlyReports.forEach(report => {
      if (report.welfare_report_data) {
        monthlyAdmission += getValue(report.welfare_report_data[`section${i}_admission_count`]);
      }
    });
    result[`section${i}_monthly_admission`] = monthlyAdmission;
    
    // Monthly average
    const daysInMonthSoFar = monthlyReports.length + 1;
    result[`section${i}_monthly_avg`] = daysInMonthSoFar > 0 ? 
      Math.round(monthlyAdmission / daysInMonthSoFar) : 0;
    
    // Utilization rate
    const todayEndResidents = result[`section${i}_today_end_users`];
    result[`section${i}_monthly_utilization`] = capacities[`section${i}`] > 0 ? 
      Math.round((todayEndResidents / capacities[`section${i}`]) * 100) : 0;
  }
  
  // For Sections 4-7 (ABCD sections)
  for (let i = 4; i <= 7; i++) {
    const dailyUsers = getValue(writableData[`section${i}_daily_users`]);
    
    // 前日利用者数 = yesterday's daily users
    let yesterdayDailyUsers = 0;
    if (yesterdayReport?.welfare_report_data) {
      yesterdayDailyUsers = getValue(yesterdayReport.welfare_report_data[`section${i}_daily_users`]);
    }
    result[`section${i}_end_users`] = yesterdayDailyUsers; // This will be 7 for Dec 17
    
    // 当日末利用者数 = today's daily users
    result[`section${i}_today_end_users`] = dailyUsers;
    
    // Monthly users
    let monthlyUsers = dailyUsers;
    monthlyReports.forEach(report => {
      if (report.welfare_report_data) {
        monthlyUsers += getValue(report.welfare_report_data[`section${i}_daily_users`]);
      }
    });
    result[`section${i}_monthly_users`] = monthlyUsers;
    result[`section${i}_monthly_users_cumulative`] = monthlyUsers;
    
    // Monthly average
    const daysInMonthSoFar = monthlyReports.length + 1;
    result[`section${i}_monthly_avg`] = daysInMonthSoFar > 0 ? 
      Math.round(monthlyUsers / daysInMonthSoFar) : 0;
    
    // Utilization rate
    result[`section${i}_monthly_utilization`] = capacities[`section${i}`] > 0 ? 
      Math.round((dailyUsers / capacities[`section${i}`]) * 100) : 0;
  }
  
  // Annual calculations
  for (let i = 1; i <= 7; i++) {
    const prefix = `section${i}`;
    
    // Annual total
    let annualTotal = 0;
    if (i <= 3) {
      annualTotal = getValue(writableData[`section${i}_admission_count`]);
      annualReports.forEach(report => {
        if (report.welfare_report_data) {
          annualTotal += getValue(report.welfare_report_data[`section${i}_admission_count`]);
        }
      });
    } else {
      annualTotal = getValue(writableData[`section${i}_daily_users`]);
      annualReports.forEach(report => {
        if (report.welfare_report_data) {
          annualTotal += getValue(report.welfare_report_data[`section${i}_daily_users`]);
        }
      });
    }
    result[`${prefix}_annual_users`] = annualTotal;
    
    // Annual average
    const daysInYearSoFar = annualReports.length + 1;
    result[`${prefix}_annual_avg`] = daysInYearSoFar > 0 ? 
      Math.round(annualTotal / daysInYearSoFar) : 0;
    
    // Annual utilization
    let utilizationValue;
    if (i <= 3) {
      utilizationValue = result[`section${i}_today_end_users`] || 0;
    } else {
      utilizationValue = getValue(writableData[`section${i}_daily_users`]);
    }
    
    const annualCapacity = capacities[`section${i}`];
    result[`${prefix}_annual_utilization`] = annualCapacity > 0 ? 
      Math.round((utilizationValue / annualCapacity) * 100) : 0;
  }
  
  return result;
}

// Get medical center capacities from medical_center table
export async function getMedicalCenterCapacities(medicalCenterId) {
  try {
    const medicalCenter = await prisma.medical_center.findUnique({
      where: { id: parseInt(medicalCenterId) },
      select: {
        section1_capacity: true,
        section2_capacity: true,
        section3_capacity: true,
        section4_capacity: true,
        section5_capacity: true,
        section6_capacity: true,
        section7_capacity: true
      }
    });
    
    if (!medicalCenter) {
      return {
        section1_capacity: 0,
        section2_capacity: 0,
        section3_capacity: 0,
        section4_capacity: 0,
        section5_capacity: 0,
        section6_capacity: 0,
        section7_capacity: 0
      };
    }
    
    return {
      section1_capacity: medicalCenter.section1_capacity || 0,
      section2_capacity: medicalCenter.section2_capacity || 0,
      section3_capacity: medicalCenter.section3_capacity || 0,
      section4_capacity: medicalCenter.section4_capacity || 0,
      section5_capacity: medicalCenter.section5_capacity || 0,
      section6_capacity: medicalCenter.section6_capacity || 0,
      section7_capacity: medicalCenter.section7_capacity || 0
    };
  } catch (error) {
    console.error('Error getting medical center capacities:', error);
    return {
      section1_capacity: 0,
      section2_capacity: 0,
      section3_capacity: 0,
      section4_capacity: 0,
      section5_capacity: 0,
      section6_capacity: 0,
      section7_capacity: 0
    };
  }
}

// Get welfare report by date
export const getReportByDate = async (req, res, next) => {
  try {
    const { date, hospital_id } = req.body;

    if (!date || !hospital_id) {
      return response.error("Date and hospital_id are required", res, next);
    }

    const reportDate = new Date(date);
    reportDate.setUTCHours(0, 0, 0, 0);

    // Get existing report
    const existingReport = await prisma.report.findUnique({
      where: {
        medical_center_id_report_date: {
          medical_center_id: parseInt(hospital_id),
          report_date: reportDate
        }
      },
      include: {
        welfare_report_data: true,
        medical_center: true
      }
    });

    // Get medical center to check type and section names
    const medicalCenter = await prisma.medical_center.findUnique({
      where: { id: parseInt(hospital_id) },
      select: {
        id: true,
        name: true,
        type: true,
        section4_name: true,
        section5_name: true,
        section6_name: true,
        section7_name: true,
        section1_capacity: true,
        section2_capacity: true,
        section3_capacity: true,
        section4_capacity: true,
        section5_capacity: true,
        section6_capacity: true,
        section7_capacity: true
      }
    });

    if (!medicalCenter) {
      return response.error("Medical center not found", res, next);
    }

    // Get default capacities from medical_center table
    const defaultCapacities = {
      section1_capacity: medicalCenter.section1_capacity || 0,
      section2_capacity: medicalCenter.section2_capacity || 0,
      section3_capacity: medicalCenter.section3_capacity || 0,
      section4_capacity: medicalCenter.section4_capacity || 0,
      section5_capacity: medicalCenter.section5_capacity || 0,
      section6_capacity: medicalCenter.section6_capacity || 0,
      section7_capacity: medicalCenter.section7_capacity || 0
    };

    if (!existingReport) {
      // Initialize empty welfare data structure with default capacities
      const initialWelfareData = {
        // Default capacities from medical_center table
        ...defaultCapacities,
        
        // New fields
        conference_events: "",
        special_notes_section: "",
        
        // Section 1: 入所 - 6 writeable fields
        section1_admission_count: 0,
        section1_discharge_count: 0,
        section1_outside_hospital: 0,
        section1_admission_treated: 0,
        section1_hospitalization_count: 0,
        section1_discharge_treated: 0,
        
        // Section 2: 短期入所 - 4 writeable fields (NOT 6)
        section2_admission_count: 0,
        section2_discharge_count: 0,
        section2_outside_hospital: 0,
        section2_hospitalization_count: 0,
        // Note: section2_admission_treated and section2_discharge_treated are NOT in section 2
        
        // Section 3: ケアハウス - 4 writeable fields
        section3_admission_count: 0,
        section3_discharge_count: 0,
        section3_outside_hospital: 0,
        section3_hospitalization_count: 0,
        
        // Sections 4-7 - 1 writeable field each
        section4_daily_users: 0,
        section5_daily_users: 0,
        section6_daily_users: 0,
        section7_daily_users: 0,
        
        // New fields before 管理事項
        vacant_bed_notes: "",
        response_notes: ""
      };

      // Calculate derived fields
      const calculatedFields = await calculateDerivedFields(
        initialWelfareData, 
        hospital_id, 
        reportDate
      );
      
      // Get section names from medical center
      const sectionNames = {
        section4: medicalCenter.section4_name || '〇〇〇〇1',
        section5: medicalCenter.section5_name || '〇〇〇〇2',
        section6: medicalCenter.section6_name || '〇〇〇〇3',
        section7: medicalCenter.section7_name || '〇〇〇〇4'
      };
      
      return response.success({
        report: null,
        welfare_data: {
          ...initialWelfareData,
          ...calculatedFields
        },
        section_names: sectionNames,
        exists: false,
        hospital_type: 'welfare',
        capacities: defaultCapacities
      }, res);
    }

    // For existing reports
    if (existingReport.welfare_report_data) {
      // Calculate derived fields for existing welfare data
      const calculatedFields = await calculateDerivedFields(
        existingReport.welfare_report_data, 
        hospital_id, 
        reportDate
      );
      
      // Get section names from medical center
      const sectionNames = {
        section4: medicalCenter.section4_name || '〇〇〇〇1',
        section5: medicalCenter.section5_name || '〇〇〇〇2',
        section6: medicalCenter.section6_name || '〇〇〇〇3',
        section7: medicalCenter.section7_name || '〇〇〇〇4'
      };

      return response.success({
        report: existingReport,
        welfare_data: {
          ...existingReport.welfare_report_data,
          ...calculatedFields
        },
        section_names: sectionNames,
        exists: true,
        hospital_type: 'welfare',
        capacities: {
          section1_capacity: existingReport.welfare_report_data.section1_capacity || 0,
          section2_capacity: existingReport.welfare_report_data.section2_capacity || 0,
          section3_capacity: existingReport.welfare_report_data.section3_capacity || 0,
          section4_capacity: existingReport.welfare_report_data.section4_capacity || 0,
          section5_capacity: existingReport.welfare_report_data.section5_capacity || 0,
          section6_capacity: existingReport.welfare_report_data.section6_capacity || 0,
          section7_capacity: existingReport.welfare_report_data.section7_capacity || 0
        }
      }, res);
    }

    // If report exists but no welfare data
    response.success({
      report: existingReport,
      exists: true,
      hospital_type: medicalCenter.type
    }, res);

  } catch (error) {
    console.error('Error in getReportByDate:', error);
    response.error(error.message, res, next);
  }
};

// Get welfare report by ID
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
        welfare_report_data: true,
        medical_center: {
          select: {
            id: true,
            name: true,
            type: true,
            section4_name: true,
            section5_name: true,
            section6_name: true,
            section7_name: true,
            section1_capacity: true,
            section2_capacity: true,
            section3_capacity: true,
            section4_capacity: true,
            section5_capacity: true,
            section6_capacity: true,
            section7_capacity: true
          }
        },
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

    if (report.hospital_type !== 'welfare') {
      return response.error("This is not a welfare report", res, next);
    }

    // Calculate derived fields
    const calculatedFields = await calculateDerivedFields(
      report.welfare_report_data || {}, 
      report.medical_center_id, 
      report.report_date
    );
    
    // Get section names from medical center
    const sectionNames = {
      section4: report.medical_center.section4_name || '〇〇〇〇1',
      section5: report.medical_center.section5_name || '〇〇〇〇2',
      section6: report.medical_center.section6_name || '〇〇〇〇3',
      section7: report.medical_center.section7_name || '〇〇〇〇4'
    };

    // Get capacities from welfare report data or default from medical center
    const capacities = report.welfare_report_data ? {
      section1_capacity: report.welfare_report_data.section1_capacity || 0,
      section2_capacity: report.welfare_report_data.section2_capacity || 0,
      section3_capacity: report.welfare_report_data.section3_capacity || 0,
      section4_capacity: report.welfare_report_data.section4_capacity || 0,
      section5_capacity: report.welfare_report_data.section5_capacity || 0,
      section6_capacity: report.welfare_report_data.section6_capacity || 0,
      section7_capacity: report.welfare_report_data.section7_capacity || 0
    } : {
      section1_capacity: report.medical_center.section1_capacity || 0,
      section2_capacity: report.medical_center.section2_capacity || 0,
      section3_capacity: report.medical_center.section3_capacity || 0,
      section4_capacity: report.medical_center.section4_capacity || 0,
      section5_capacity: report.medical_center.section5_capacity || 0,
      section6_capacity: report.medical_center.section6_capacity || 0,
      section7_capacity: report.medical_center.section7_capacity || 0
    };

    return response.success({
      report,
      welfare_data: {
        ...(report.welfare_report_data || {}),
        ...calculatedFields
      },
      section_names: sectionNames,
      exists: true,
      hospital_type: 'welfare',
      capacities,
      approvals: report.approvals, // Added approvals to response
      comments: report.report_comments // Added comments to response
    }, res);

  } catch (error) {
    console.error('Error in getReportById:', error);
    response.error(error.message, res, next);
  }
};

// Submit welfare report
export const submitReport = async (req, res, next) => {
  const transaction = await prisma.$transaction(async (tx) => {
    try {
      const {
        hospital_id,
        report_date,
        special_notes = '',
        is_draft = false,
        hospital_type = 'welfare',
        // Welfare-specific data
        welfare_data,
        section_names,
        capacities
      } = req.body;

      if (!hospital_id || !report_date) {
        throw new Error("Hospital ID and report date are required");
      }

      const userId = user_id;
      const date = new Date(report_date);
      date.setUTCHours(0, 0, 0, 0);

      // Verify medical center exists and is welfare type
      const medicalCenter = await tx.medical_center.findUnique({
        where: { id: parseInt(hospital_id) }
      });

      if (!medicalCenter) {
        throw new Error("Medical center not found");
      }

      if (medicalCenter.type !== 'welfare' && hospital_type === 'welfare') {
        throw new Error("Medical center is not a welfare facility");
      }

      // Check if report already exists
      const existingReport = await tx.report.findUnique({
        where: {
          medical_center_id_report_date: {
            medical_center_id: parseInt(hospital_id),
            report_date: date
          }
        },
        include: {
          welfare_report_data: true
        }
      });

      const reportNo = existingReport?.report_no || generateReportNo(hospital_id, date);
      
      // Prepare report data
      const reportData = {
        report_no: reportNo,
        report_date: date,
        medical_center_id: parseInt(hospital_id),
        status: is_draft ? 'draft' : 'submitted',
        special_notes: special_notes,
        hospital_type: hospital_type,
        // Set all standard fields to 0 for welfare
        admission_count: 0,
        discharge_count: 0,
        external_morning: 0,
        external_afternoon: 0,
        external_duty: 0,
        emergency_transport: 0,
        post_transport_admission: 0,
        visit_count: 0,
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

      // Handle welfare data
      if (welfare_data) {
        const welfareData = {
          report_id: report.id,
          medical_center_id: parseInt(hospital_id),
          
          // Capacity fields - store in DB
          section1_capacity: parseInt(welfare_data.section1_capacity) || 0,
          section2_capacity: parseInt(welfare_data.section2_capacity) || 0,
          section3_capacity: parseInt(welfare_data.section3_capacity) || 0,
          section4_capacity: parseInt(welfare_data.section4_capacity) || 0,
          section5_capacity: parseInt(welfare_data.section5_capacity) || 0,
          section6_capacity: parseInt(welfare_data.section6_capacity) || 0,
          section7_capacity: parseInt(welfare_data.section7_capacity) || 0,
          
          // New fields
          conference_events: welfare_data.conference_events || '',
          special_notes_section: welfare_data.special_notes_section || '',
          
          // Section 1: 入所 - 6 writeable fields
          section1_admission_count: parseInt(welfare_data.section1_admission_count) || 0,
          section1_discharge_count: parseInt(welfare_data.section1_discharge_count) || 0,
          section1_outside_hospital: parseInt(welfare_data.section1_outside_hospital) || 0,
          section1_admission_treated: parseInt(welfare_data.section1_admission_treated) || 0,
          section1_hospitalization_count: parseInt(welfare_data.section1_hospitalization_count) || 0,
          section1_discharge_treated: parseInt(welfare_data.section1_discharge_treated) || 0,
          
          // Section 2: 短期入所 - 4 writeable fields (NOT 6)
          section2_admission_count: parseInt(welfare_data.section2_admission_count) || 0,
          section2_discharge_count: parseInt(welfare_data.section2_discharge_count) || 0,
          section2_outside_hospital: parseInt(welfare_data.section2_outside_hospital) || 0,
          section2_hospitalization_count: parseInt(welfare_data.section2_hospitalization_count) || 0,
          // Note: section2_admission_treated and section2_discharge_treated are NOT in section 2
          
          // Section 3: ケアハウス - 4 writeable fields
          section3_admission_count: parseInt(welfare_data.section3_admission_count) || 0,
          section3_discharge_count: parseInt(welfare_data.section3_discharge_count) || 0,
          section3_outside_hospital: parseInt(welfare_data.section3_outside_hospital) || 0,
          section3_hospitalization_count: parseInt(welfare_data.section3_hospitalization_count) || 0,
          
          // Sections 4-7 - 1 writeable field each
          section4_daily_users: parseInt(welfare_data.section4_daily_users) || 0,
          section5_daily_users: parseInt(welfare_data.section5_daily_users) || 0,
          section6_daily_users: parseInt(welfare_data.section6_daily_users) || 0,
          section7_daily_users: parseInt(welfare_data.section7_daily_users) || 0,
          
          // New fields before 管理事項
          vacant_bed_notes: welfare_data.vacant_bed_notes || '',
          response_notes: welfare_data.response_notes || ''
        };

        if (existingReport?.welfare_report_data) {
          await tx.welfare_report_data.update({
            where: { report_id: report.id },
            data: welfareData
          });
        } else {
          await tx.welfare_report_data.create({
            data: welfareData
          });
        }
      }

      // Get complete report with welfare data
      const completeReport = await tx.report.findUnique({
        where: { id: report.id },
        include: {
          welfare_report_data: true,
          medical_center: true
        }
      });

      // Calculate derived fields
      let calculatedFields = {};
      if (completeReport.welfare_report_data) {
        calculatedFields = await calculateDerivedFields(
          completeReport.welfare_report_data,
          hospital_id,
          date
        );
      }

      return {
        success: true,
        report: completeReport,
        welfare_data: {
          ...completeReport.welfare_report_data,
          ...calculatedFields
        },
        is_new: !existingReport,
        message: is_draft 
          ? 'Welfare report saved as draft successfully' 
          : 'Welfare report submitted successfully'
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

// Update capacities in medical_center table
export const updateCapacities = async (req, res, next) => {
  try {
    const { hospital_id, capacities } = req.body;
    const userId = req.user?.id; // adjust if needed

    if (!hospital_id || !capacities || typeof capacities !== 'object') {
      return response.error("Hospital ID and capacities are required", res, next);
    }

    // Build update object dynamically
    const updateData = {
      updated_by: userId,
      updated_at: new Date()
    };

    // Map "1" -> section1_capacity, etc.
    Object.entries(capacities).forEach(([section, value]) => {
      const sectionNumber = parseInt(section, 10);

      if (sectionNumber >= 1 && sectionNumber <= 7) {
        updateData[`section${sectionNumber}_capacity`] = parseInt(value, 10) || 0;
      }
    });

    // If no valid sections provided
    if (Object.keys(updateData).length === 2) {
      return response.error("No valid section capacities provided", res, next);
    }

    await prisma.medical_center.update({
      where: { id: Number(hospital_id) },
      data: updateData
    });

    response.success(
      {
        success: true,
        message: "Capacities updated successfully"
      },
      res
    );
  } catch (error) {
    console.error("Error in updateCapacities:", error);
    response.error(error.message, res, next);
  }
};


// Get capacities for a welfare hospital
export const getCapacities = async (req, res, next) => {
  try {
    const { hospital_id } = req.body;

    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }

    // Get capacities directly from medical_center table
    const medicalCenter = await prisma.medical_center.findUnique({
      where: { id: parseInt(hospital_id) },
      select: {
        section1_capacity: true,
        section2_capacity: true,
        section3_capacity: true,
        section4_capacity: true,
        section5_capacity: true,
        section6_capacity: true,
        section7_capacity: true
      }
    });

    if (!medicalCenter) {
      return response.error("Medical center not found", res, next);
    }

    response.success({
      section1: medicalCenter.section1_capacity || 0,
      section2: medicalCenter.section2_capacity || 0,
      section3: medicalCenter.section3_capacity || 0,
      section4: medicalCenter.section4_capacity || 0,
      section5: medicalCenter.section5_capacity || 0,
      section6: medicalCenter.section6_capacity || 0,
      section7: medicalCenter.section7_capacity || 0
    }, res);
  } catch (error) {
    console.error('Error in getCapacities:', error);
    response.error(error.message, res, next);
  }
};

// Get section names for a welfare hospital
export const getSectionNames = async (req, res, next) => {
  try {
    const { hospital_id } = req.body;

    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }

    // Get section names directly from medical_center table
    const medicalCenter = await prisma.medical_center.findUnique({
      where: { id: parseInt(hospital_id) },
      select: {
        section4_name: true,
        section5_name: true,
        section6_name: true,
        section7_name: true
      }
    });

    if (!medicalCenter) {
      return response.error("Medical center not found", res, next);
    }

    response.success({
      section4: medicalCenter.section4_name || '〇〇〇〇1',
      section5: medicalCenter.section5_name || '〇〇〇〇2',
      section6: medicalCenter.section6_name || '〇〇〇〇3',
      section7: medicalCenter.section7_name || '〇〇〇〇4'
    }, res);
  } catch (error) {
    console.error('Error in getSectionNames:', error);
    response.error(error.message, res, next);
  }
};

// Update section names in medical_center table
export const updateSectionNames = async (req, res, next) => {
  try {
    const { hospital_id, section_names } = req.body;
    const userId = user_id;

    if (!hospital_id || !section_names) {
      return response.error("Hospital ID and section names are required", res, next);
    }

    // Update section names in medical_center table
    await prisma.medical_center.update({
      where: { id: parseInt(hospital_id) },
      data: {
        section4_name: section_names.section4 || '〇〇〇〇1',
        section5_name: section_names.section5 || '〇〇〇〇2',
        section6_name: section_names.section6 || '〇〇〇〇3',
        section7_name: section_names.section7 || '〇〇〇〇4',
        updated_by: userId,
        updated_at: new Date()
      }
    });

    response.success({
      success: true,
      message: 'Section names updated successfully'
    }, res);
  } catch (error) {
    console.error('Error in updateSectionNames:', error);
    response.error(error.message, res, next);
  }
};

// Get departments for welfare (empty for now, could be used for section mapping)
export const getDepartments = async (req, res, next) => {
  try {
    const { hospital_id } = req.body;

    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }

    // For welfare, we might not have departments in the traditional sense
    // Return empty array or specialized sections
    const welfareSections = [
      { id: 1, name: '入所', type: 'long_term' },
      { id: 2, name: '短期入所', type: 'short_term' },
      { id: 3, name: 'ケアハウス', type: 'care_house' }
    ];

    response.success(welfareSections, res);
  } catch (error) {
    console.error('Error in getDepartments:', error);
    response.error(error.message, res, next);
  }
};

// Get last report's welfare data
export const getLastReportWelfareDataApi = async (req, res, next) => {
  try {
    const { hospital_id, report_date } = req.body;
    
    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }
    
    if (!report_date) {
      return response.error("Report date is required", res, next);
    }

    const currentDate = new Date(report_date);
    const lastReportData = await getLastReportWelfareData(hospital_id, currentDate);

    if (!lastReportData) {
      return response.error("No previous welfare report data found", res, next);
    }

    response.success(lastReportData, res);
  } catch (error) {
    console.error('Error in getLastReportWelfareDataApi:', error);
    response.error(error.message, res, next);
  }
};

// Get welfare report statistics
export const getReportStatistics = async (req, res, next) => {
  try {
    const { hospital_id, start_date, end_date } = req.body;

    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    // Get all welfare reports in date range
    const reports = await prisma.report.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        hospital_type: 'welfare',
        report_date: {
          gte: startDate,
          lte: endDate
        },
        OR: [
          { status: 'submitted' },
          { status: 'approved' }
        ]
      },
      include: {
        welfare_report_data: true
      },
      orderBy: {
        report_date: 'asc'
      }
    });

    // Calculate statistics
    const statistics = {
      total_reports: reports.length,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      sections: {
        section1: { total_admissions: 0, total_discharges: 0, avg_admissions: 0 },
        section2: { total_admissions: 0, total_discharges: 0, avg_admissions: 0 },
        section3: { total_admissions: 0, total_discharges: 0, avg_admissions: 0 },
        section4: { total_users: 0, avg_users: 0 },
        section5: { total_users: 0, avg_users: 0 },
        section6: { total_users: 0, avg_users: 0 },
        section7: { total_users: 0, avg_users: 0 }
      }
    };

    reports.forEach(report => {
      if (report.welfare_report_data) {
        const data = report.welfare_report_data;
        
        // Section 1
        statistics.sections.section1.total_admissions += data.section1_admission_count || 0;
        statistics.sections.section1.total_discharges += data.section1_discharge_count || 0;
        
        // Section 2
        statistics.sections.section2.total_admissions += data.section2_admission_count || 0;
        statistics.sections.section2.total_discharges += data.section2_discharge_count || 0;
        
        // Section 3
        statistics.sections.section3.total_admissions += data.section3_admission_count || 0;
        statistics.sections.section3.total_discharges += data.section3_discharge_count || 0;
        
        // Sections 4-7
        statistics.sections.section4.total_users += data.section4_daily_users || 0;
        statistics.sections.section5.total_users += data.section5_daily_users || 0;
        statistics.sections.section6.total_users += data.section6_daily_users || 0;
        statistics.sections.section7.total_users += data.section7_daily_users || 0;
      }
    });

    // Calculate averages
    if (reports.length > 0) {
      statistics.sections.section1.avg_admissions = Math.round(statistics.sections.section1.total_admissions / reports.length);
      statistics.sections.section2.avg_admissions = Math.round(statistics.sections.section2.total_admissions / reports.length);
      statistics.sections.section3.avg_admissions = Math.round(statistics.sections.section3.total_admissions / reports.length);
      
      statistics.sections.section4.avg_users = Math.round(statistics.sections.section4.total_users / reports.length);
      statistics.sections.section5.avg_users = Math.round(statistics.sections.section5.total_users / reports.length);
      statistics.sections.section6.avg_users = Math.round(statistics.sections.section6.total_users / reports.length);
      statistics.sections.section7.avg_users = Math.round(statistics.sections.section7.total_users / reports.length);
    }

    response.success(statistics, res);
  } catch (error) {
    console.error('Error in getReportStatistics:', error);
    response.error(error.message, res, next);
  }
};

// Export welfare reports
export const exportReports = async (req, res, next) => {
  try {
    const { hospital_id, start_date, end_date, format = 'json' } = req.body;

    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    // Get reports with welfare data
    const reports = await prisma.report.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        hospital_type: 'welfare',
        report_date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        welfare_report_data: true,
        medical_center: true
      },
      orderBy: {
        report_date: 'asc'
      }
    });

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Report No,Date,Status,Section 1 Capacity,Section 2 Capacity,Section 3 Capacity,Section 4 Capacity,Section 5 Capacity,Section 6 Capacity,Section 7 Capacity,Conference Events,Special Notes,Section 1 Admissions,Section 1 Discharges,Section 2 Admissions,Section 2 Discharges,Section 3 Admissions,Section 3 Discharges,Section 4 Users,Section 5 Users,Section 6 Users,Section 7 Users,Vacant Bed Notes,Response Notes\n';
      
      reports.forEach(report => {
        const data = report.welfare_report_data || {};
        csv += `"${report.report_no}","${report.report_date.toISOString().split('T')[0]}","${report.status}",`;
        csv += `${data.section1_capacity || 0},`;
        csv += `${data.section2_capacity || 0},`;
        csv += `${data.section3_capacity || 0},`;
        csv += `${data.section4_capacity || 0},`;
        csv += `${data.section5_capacity || 0},`;
        csv += `${data.section6_capacity || 0},`;
        csv += `${data.section7_capacity || 0},`;
        csv += `"${data.conference_events || ''}","${data.special_notes_section || ''}",`;
        csv += `${data.section1_admission_count || 0},${data.section1_discharge_count || 0},`;
        csv += `${data.section2_admission_count || 0},${data.section2_discharge_count || 0},`;
        csv += `${data.section3_admission_count || 0},${data.section3_discharge_count || 0},`;
        csv += `${data.section4_daily_users || 0},${data.section5_daily_users || 0},`;
        csv += `${data.section6_daily_users || 0},${data.section7_daily_users || 0},`;
        csv += `"${data.vacant_bed_notes || ''}","${data.response_notes || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=welfare-reports-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      // Return JSON
      response.success({
        reports: reports.map(report => ({
          report_no: report.report_no,
          report_date: report.report_date,
          status: report.status,
          welfare_data: report.welfare_report_data
        }))
      }, res);
    }
  } catch (error) {
    console.error('Error in exportReports:', error);
    response.error(error.message, res, next);
  }
};