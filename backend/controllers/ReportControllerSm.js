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

// Get last report's welfare data for calculations
async function getLastReportWelfareData(medicalCenterId, currentDate) {
  try {
    // Calculate date 7 days earlier for last report
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() - 7);
    
    const searchDate = new Date(targetDate);
    searchDate.setUTCHours(0, 0, 0, 0);

    // Find the last submitted/approved report
    const report = await prisma.report.findFirst({
      where: {
        medical_center_id: parseInt(medicalCenterId),
        hospital_type: 'welfare',
        OR: [
          { status: 'submitted' },
          { status: 'approved' }
        ],
        report_date: {
          lt: currentDate // Only reports before current date
        }
      },
      include: {
        welfare_report_data: true
      },
      orderBy: {
        report_date: 'desc'
      }
    });

    return report?.welfare_report_data || null;
  } catch (error) {
    console.error('Error getting last report welfare data:', error);
    return null;
  }
}

// Calculate derived fields based on writable fields and last report data
function calculateDerivedFields(writableData, lastReportData = null, capacity = 0) {
  const result = {};
  
  // Helper function to get value or default
  const getValue = (value) => parseInt(value) || 0;
  
  // Capacity
  const cap = getValue(capacity);
  
  // Section 1: 入所 Calculations
  const s1Admission = getValue(writableData.section1_admission_count);
  const s1Discharge = getValue(writableData.section1_discharge_count);
  const s1OutsideHospital = getValue(writableData.section1_outside_hospital);
  const s1AdmissionTreated = getValue(writableData.section1_admission_treated);
  const s1Hospitalization = getValue(writableData.section1_hospitalization_count);
  const s1DischargeTreated = getValue(writableData.section1_discharge_treated);
  
  // Get previous day's end users from last report
  const lastS1EndUsers = getValue(lastReportData?.section1_end_users) || 
                        (getValue(lastReportData?.section1_admission_count) - getValue(lastReportData?.section1_discharge_count));
  
  // Calculate end users for today
  result.section1_end_users = lastS1EndUsers + s1Admission - s1Discharge;
  
  // Get monthly admission from last report or start fresh
  const lastS1MonthlyAdmission = getValue(lastReportData?.section1_monthly_admission) || 0;
  result.section1_monthly_admission = lastS1MonthlyAdmission + s1Admission;
  
  // Calculate monthly average (simplified: average of daily admissions)
  const daysInMonth = 30; // Assuming 30 days for calculation
  const lastS1MonthlyAvg = getValue(lastReportData?.section1_monthly_avg) || 0;
  result.section1_monthly_avg = Math.round(((lastS1MonthlyAvg * (daysInMonth - 1)) + s1Admission) / daysInMonth);
  
  // Calculate utilization rate
  result.section1_monthly_utilization = cap > 0 ? Math.round((result.section1_end_users / cap) * 100) : 0;
  
  // Section 2: 短期入所 Calculations (similar to section 1)
  const s2Admission = getValue(writableData.section2_admission_count);
  const s2Discharge = getValue(writableData.section2_discharge_count);
  const s2OutsideHospital = getValue(writableData.section2_outside_hospital);
  const s2AdmissionTreated = getValue(writableData.section2_admission_treated);
  const s2Hospitalization = getValue(writableData.section2_hospitalization_count);
  const s2DischargeTreated = getValue(writableData.section2_discharge_treated);
  
  const lastS2EndUsers = getValue(lastReportData?.section2_end_users) || 
                        (getValue(lastReportData?.section2_admission_count) - getValue(lastReportData?.section2_discharge_count));
  
  result.section2_end_users = lastS2EndUsers + s2Admission - s2Discharge;
  
  const lastS2MonthlyAdmission = getValue(lastReportData?.section2_monthly_admission) || 0;
  result.section2_monthly_admission = lastS2MonthlyAdmission + s2Admission;
  
  const lastS2MonthlyAvg = getValue(lastReportData?.section2_monthly_avg) || 0;
  result.section2_monthly_avg = Math.round(((lastS2MonthlyAvg * (daysInMonth - 1)) + s2Admission) / daysInMonth);
  
  result.section2_monthly_utilization = cap > 0 ? Math.round((result.section2_end_users / cap) * 100) : 0;
  
  // Section 3: ケアハウス Calculations
  const s3Admission = getValue(writableData.section3_admission_count);
  const s3Discharge = getValue(writableData.section3_discharge_count);
  const s3OutsideHospital = getValue(writableData.section3_outside_hospital);
  const s3Hospitalization = getValue(writableData.section3_hospitalization_count);
  
  const lastS3EndUsers = getValue(lastReportData?.section3_end_users) || 
                        (getValue(lastReportData?.section3_admission_count) - getValue(lastReportData?.section3_discharge_count));
  
  result.section3_end_users = lastS3EndUsers + s3Admission - s3Discharge;
  
  const lastS3MonthlyAdmission = getValue(lastReportData?.section3_monthly_admission) || 0;
  result.section3_monthly_admission = lastS3MonthlyAdmission + s3Admission;
  
  const lastS3MonthlyAvg = getValue(lastReportData?.section3_monthly_avg) || 0;
  result.section3_monthly_avg = Math.round(((lastS3MonthlyAvg * (daysInMonth - 1)) + s3Admission) / daysInMonth);
  
  result.section3_monthly_utilization = cap > 0 ? Math.round((result.section3_end_users / cap) * 100) : 0;
  
  // Sections 4-7 Calculations
  for (let i = 4; i <= 7; i++) {
    const dailyUsers = getValue(writableData[`section${i}_daily_users`]);
    const lastMonthlyUsers = getValue(lastReportData?.[`section${i}_monthly_users`]) || 0;
    
    // Monthly users cumulative
    result[`section${i}_monthly_users`] = lastMonthlyUsers + dailyUsers;
    
    // Monthly average
    const lastMonthlyAvg = getValue(lastReportData?.[`section${i}_monthly_avg`]) || 0;
    result[`section${i}_monthly_avg`] = Math.round(((lastMonthlyAvg * (daysInMonth - 1)) + dailyUsers) / daysInMonth);
    
    // Utilization rate
    result[`section${i}_monthly_utilization`] = cap > 0 ? Math.round((dailyUsers / cap) * 100) : 0;
  }
  
  // Annual calculations (simplified - would need annual tracking)
  for (let i = 1; i <= 7; i++) {
    const prefix = i <= 3 ? `section${i}` : `section${i}`;
    const currentValue = i <= 3 ? getValue(writableData[`section${i}_admission_count`]) : getValue(writableData[`section${i}_daily_users`]);
    
    // Annual cumulative (simplified - would need proper annual tracking)
    const lastAnnual = getValue(lastReportData?.[`${prefix}_annual_users`]) || 0;
    result[`${prefix}_annual_users`] = lastAnnual + currentValue;
    
    // Annual average (simplified)
    const daysInYear = 365;
    const lastAnnualAvg = getValue(lastReportData?.[`${prefix}_annual_avg`]) || 0;
    result[`${prefix}_annual_avg`] = Math.round(((lastAnnualAvg * (daysInYear - 1)) + currentValue) / daysInYear);
    
    // Annual utilization
    result[`${prefix}_annual_utilization`] = cap > 0 ? Math.round((result[`${prefix}_annual_users`] / (cap * daysInYear)) * 100) : 0;
  }
  
  return result;
}

// Get welfare report by date
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
        section7_name: true
      }
    });

    if (!medicalCenter) {
      return response.error("Medical center not found", res, next);
    }

    // Get capacity (could be stored in medical_center or separate table)
    // For now, using a default value
    const capacity = 0;

    // Get last report's data for calculations
    const lastReportData = await getLastReportWelfareData(hospital_id, reportDate);

    if (!existingReport) {
      // Initialize empty welfare data structure
      const initialWelfareData = {
        capacity: capacity,
        
        // New fields
        conference_events: "",
        special_notes_section: "",
        
        // Section 1: 入所
        section1_admission_count: 0,
        section1_discharge_count: 0,
        section1_outside_hospital: 0,
        section1_admission_treated: 0,
        section1_hospitalization_count: 0,
        section1_discharge_treated: 0,
        
        // Section 2: 短期入所
        section2_admission_count: 0,
        section2_discharge_count: 0,
        section2_outside_hospital: 0,
        section2_admission_treated: 0,
        section2_hospitalization_count: 0,
        section2_discharge_treated: 0,
        
        // Section 3: ケアハウス
        section3_admission_count: 0,
        section3_discharge_count: 0,
        section3_outside_hospital: 0,
        section3_hospitalization_count: 0,
        
        // Sections 4-7
        section4_daily_users: 0,
        section5_daily_users: 0,
        section6_daily_users: 0,
        section7_daily_users: 0,
        
        // New fields before 管理事項
        vacant_bed_notes: "",
        response_notes: ""
      };

      // Calculate derived fields
      const calculatedFields = calculateDerivedFields(initialWelfareData, lastReportData, capacity);
      
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
          ...calculatedFields,
          conference_events: "",
          special_notes_section: "",
          vacant_bed_notes: "",
          response_notes: ""
        },
        section_names: sectionNames,
        exists: false,
        hospital_type: 'welfare',
        capacity: capacity
      }, res);
    }

    // For existing reports
    if (existingReport.welfare_report_data) {
      // Calculate derived fields for existing welfare data
      const calculatedFields = calculateDerivedFields(
        existingReport.welfare_report_data, 
        lastReportData, 
        capacity
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
        capacity: capacity
      }, res);
    }

    // If report exists but no welfare data (shouldn't happen for welfare type)
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
            section7_name: true
          }
        },
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

    // Check if this is a welfare report
    if (report.hospital_type !== 'welfare') {
      return response.error("This is not a welfare report", res, next);
    }

    // Get capacity
    const capacity = 0;

    // Get last report's data for calculations
    const lastReportData = await getLastReportWelfareData(report.medical_center_id, report.report_date);

    if (report.welfare_report_data) {
      // Calculate derived fields
      const calculatedFields = calculateDerivedFields(
        report.welfare_report_data, 
        lastReportData, 
        capacity
      );
      
      // Get section names from medical center
      const sectionNames = {
        section4: report.medical_center.section4_name || '〇〇〇〇1',
        section5: report.medical_center.section5_name || '〇〇〇〇2',
        section6: report.medical_center.section6_name || '〇〇〇〇3',
        section7: report.medical_center.section7_name || '〇〇〇〇4'
      };

      return response.success({
        report,
        welfare_data: {
          ...report.welfare_report_data,
          ...calculatedFields
        },
        section_names: sectionNames,
        exists: true,
        hospital_type: 'welfare',
        capacity: capacity
      }, res);
    }

    response.success({
      report,
      exists: true,
      hospital_type: report.medical_center.type
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
        capacity
      } = req.body;

      if (!hospital_id || !report_date) {
        throw new Error("Hospital ID and report date are required");
      }

      const userId = user_id;
      const date = new Date(report_date);

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
          
          // New fields
          conference_events: welfare_data.conference_events || '',
          special_notes_section: welfare_data.special_notes_section || '',
          
          // Section 1: 入所
          section1_admission_count: parseInt(welfare_data.section1_admission_count) || 0,
          section1_discharge_count: parseInt(welfare_data.section1_discharge_count) || 0,
          section1_outside_hospital: parseInt(welfare_data.section1_outside_hospital) || 0,
          section1_admission_treated: parseInt(welfare_data.section1_admission_treated) || 0,
          section1_hospitalization_count: parseInt(welfare_data.section1_hospitalization_count) || 0,
          section1_discharge_treated: parseInt(welfare_data.section1_discharge_treated) || 0,
          
          // Section 2: 短期入所
          section2_admission_count: parseInt(welfare_data.section2_admission_count) || 0,
          section2_discharge_count: parseInt(welfare_data.section2_discharge_count) || 0,
          section2_outside_hospital: parseInt(welfare_data.section2_outside_hospital) || 0,
          section2_admission_treated: parseInt(welfare_data.section2_admission_treated) || 0,
          section2_hospitalization_count: parseInt(welfare_data.section2_hospitalization_count) || 0,
          section2_discharge_treated: parseInt(welfare_data.section2_discharge_treated) || 0,
          
          // Section 3: ケアハウス
          section3_admission_count: parseInt(welfare_data.section3_admission_count) || 0,
          section3_discharge_count: parseInt(welfare_data.section3_discharge_count) || 0,
          section3_outside_hospital: parseInt(welfare_data.section3_outside_hospital) || 0,
          section3_hospitalization_count: parseInt(welfare_data.section3_hospitalization_count) || 0,
          
          // Sections 4-7 (names are stored in medical_center table)
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

      return {
        success: true,
        report: completeReport,
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
      let csv = 'Report No,Date,Status,Conference Events,Special Notes,Section 1 Admissions,Section 1 Discharges,Section 2 Admissions,Section 2 Discharges,Section 3 Admissions,Section 3 Discharges,Section 4 Users,Section 5 Users,Section 6 Users,Section 7 Users,Vacant Bed Notes,Response Notes\n';
      
      reports.forEach(report => {
        const data = report.welfare_report_data || {};
        csv += `"${report.report_no}","${report.report_date.toISOString().split('T')[0]}","${report.status}",`;
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