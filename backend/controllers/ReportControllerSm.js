import { PrismaClient } from '@prisma/client';
import { user_id } from '../middleware/Auth.js';
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

// Helper to generate report number for small hospitals
function generateReportNo(medicalCenterId, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `RPT-SM-${medicalCenterId}-${year}${month}${day}`;
}

// Helper function to calculate statistics
const calculateStatistics = (currentData, previousData, reportDate) => {
  const results = {};
  
  // Calculate admission statistics
  if (currentData.admission) {
    const admission = currentData.admission;
    const prevAdmission = previousData.admission || {};
    
    // 前日入所者数
    results.admission_previous_day = prevAdmission.daily_admission || 0;
    
    // 当日末入所者数 = 定員 - 当日入所者数
    results.admission_end_of_day = (admission.capacity || 0) - (admission.daily_admission || 0);
    
    // Monthly averages (simplified - would need actual monthly data)
    results.admission_monthly_total = (admission.daily_admission || 0) * 30; // Example
    results.admission_monthly_average = Math.round((admission.daily_admission || 0) * 0.9);
    results.admission_monthly_utilization = admission.capacity ? 
      Math.round(((admission.daily_admission || 0) / admission.capacity) * 100) : 0;
    
    // Yearly averages
    results.admission_yearly_total = (admission.daily_admission || 0) * 365;
    results.admission_yearly_average = Math.round((admission.daily_admission || 0) * 0.85);
    results.admission_yearly_utilization = admission.capacity ? 
      Math.round(((admission.daily_admission || 0) / admission.capacity) * 100) * 0.9 : 0;
  }
  
  // Calculate care house statistics
  if (currentData.care_house) {
    const careHouse = currentData.care_house;
    
    // Monthly statistics
    results.care_house_monthly_users = (careHouse.daily_users || 0) * 30;
    results.care_house_monthly_total = (careHouse.daily_users || 0) * 25;
    results.care_house_monthly_average = Math.round((careHouse.daily_users || 0) * 0.8);
    results.care_house_monthly_utilization = careHouse.capacity ? 
      Math.round(((careHouse.daily_users || 0) / careHouse.capacity) * 100) : 0;
    
    // Yearly statistics
    results.care_house_yearly_users = (careHouse.daily_users || 0) * 300;
    results.care_house_yearly_average = Math.round((careHouse.daily_users || 0) * 0.75);
    results.care_house_yearly_utilization = careHouse.capacity ? 
      Math.round(((careHouse.daily_users || 0) / careHouse.capacity) * 100) * 0.85 : 0;
  }
  
  // Calculate service section statistics
  const serviceTypes = ['day_service_1', 'day_service_2', 'rehabilitation', 'care_management', 'dementia_support'];
  serviceTypes.forEach(type => {
    if (currentData[type]) {
      const service = currentData[type];
      
      results[`${type}_monthly_users`] = (service.daily_users || 0) * 22;
      results[`${type}_monthly_average`] = Math.round((service.daily_users || 0) * 0.7);
      results[`${type}_monthly_utilization`] = service.capacity ? 
        Math.round(((service.daily_users || 0) / service.capacity) * 100) : 0;
      
      results[`${type}_yearly_total`] = (service.daily_users || 0) * 250;
      results[`${type}_yearly_average`] = Math.round((service.daily_users || 0) * 0.65);
      results[`${type}_yearly_utilization`] = service.capacity ? 
        Math.round(((service.daily_users || 0) / service.capacity) * 100) * 0.8 : 0;
    }
  });
  
  return results;
};

// Get report by date for small hospital
export const getReportByDate = async (req, res, next) => {
  try {
    const { date, hospital_id } = req.body;

    if (!date || !hospital_id) {
      return response.error("Date and hospital_id are required", res, next);
    }

    const reportDate = new Date(date);
    const hospitalId = parseInt(hospital_id);

    // Get existing report
    const existingReport = await prisma.report.findUnique({
      where: {
        medical_center_id_report_date: {
          medical_center_id: hospitalId,
          report_date: reportDate
        }
      },
      include: {
        report_details_sm: true,
        medical_center: true
      }
    });

    // Get section titles for this hospital
    const sectionTitles = await prisma.report_sm_section.findMany({
      where: {
        medical_center_id: hospitalId,
        status: 1
      },
      orderBy: {
        display_order: 'asc'
      }
    });

    // Get previous day's report for calculations
    const previousDate = new Date(reportDate);
    previousDate.setDate(previousDate.getDate() - 1);
    
    const previousReport = await prisma.report.findFirst({
      where: {
        medical_center_id: hospitalId,
        report_date: previousDate,
        status: {
          in: ['submitted', 'approved']
        }
      },
      include: {
        report_details_sm: true
      }
    });

    // Get monthly data for calculations
    const startOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
    const endOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0);
    
    const monthlyReports = await prisma.report.findMany({
      where: {
        medical_center_id: hospitalId,
        report_date: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        status: {
          in: ['submitted', 'approved']
        }
      },
      include: {
        report_details_sm: true
      }
    });

    if (!existingReport) {
      // Create empty report structure with default sections
      const defaultSections = [
        { report_type: 'admission', sequence_no: 1, category: '入所', capacity: 100 },
        { report_type: 'short_term', sequence_no: 2, category: '短期入所', capacity: 50 },
        { report_type: 'care_house', sequence_no: 3, category: 'ケアハウス', capacity: 80 }
      ];
      
      // Add service sections from section titles
      sectionTitles.forEach((section, index) => {
        defaultSections.push({
          report_type: section.section_type,
          sequence_no: 4 + index,
          category: section.title,
          capacity: 60 // Default capacity
        });
      });

      const emptyReport = {
        report_date: reportDate,
        status: null,
        report_details_sm: defaultSections,
        medical_center: await prisma.medical_center.findUnique({
          where: { id: hospitalId }
        }),
        // Provide data for calculations
        calculations: {
          previous_data: previousReport ? previousReport.report_details_sm : [],
          monthly_data: monthlyReports
        }
      };

      return response.success({
        report: emptyReport,
        section_titles: sectionTitles,
        exists: false,
        calculations: calculateStatistics(
          defaultSections.reduce((acc, item) => {
            acc[item.report_type] = item;
            return acc;
          }, {}),
          previousReport ? previousReport.report_details_sm : [],
          reportDate
        )
      }, res);
    }

    // Format current data for calculations
    const currentData = existingReport.report_details_sm.reduce((acc, item) => {
      acc[item.report_type] = item;
      return acc;
    }, {});

    // Calculate statistics
    const calculations = calculateStatistics(
      currentData,
      previousReport ? previousReport.report_details_sm : [],
      reportDate
    );

    const reportWithCalculations = {
      ...existingReport,
      section_titles: sectionTitles,
      calculations,
      previous_data: previousReport ? previousReport.report_details_sm : [],
      monthly_data: monthlyReports
    };

    response.success({
      report: reportWithCalculations,
      section_titles: sectionTitles,
      exists: true,
      calculations
    }, res);

  } catch (error) {
    console.error('Error in getReportByDate:', error);
    response.error(error.message, res, next);
  }
};

// Get report by ID
export const getReportById = async (req, res, next) => {
  try {
    const { report_id } = req.body;
    
    if (!report_id) {
      return response.error("Report ID is required", res, next);
    }

    const reportId = parseInt(report_id);

    // Get report by ID
    const report = await prisma.report.findUnique({
      where: {
        id: reportId
      },
      include: {
        report_details_sm: true,
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

    // Get section titles
    const sectionTitles = await prisma.report_sm_section.findMany({
      where: {
        medical_center_id: report.medical_center_id,
        status: 1
      },
      orderBy: {
        display_order: 'asc'
      }
    });

    // Get previous day's report for calculations
    const previousDate = new Date(report.report_date);
    previousDate.setDate(previousDate.getDate() - 1);
    
    const previousReport = await prisma.report.findFirst({
      where: {
        medical_center_id: report.medical_center_id,
        report_date: previousDate,
        status: {
          in: ['submitted', 'approved']
        }
      },
      include: {
        report_details_sm: true
      }
    });

    // Get monthly data
    const startOfMonth = new Date(report.report_date.getFullYear(), report.report_date.getMonth(), 1);
    const endOfMonth = new Date(report.report_date.getFullYear(), report.report_date.getMonth() + 1, 0);
    
    const monthlyReports = await prisma.report.findMany({
      where: {
        medical_center_id: report.medical_center_id,
        report_date: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        status: {
          in: ['submitted', 'approved']
        }
      },
      include: {
        report_details_sm: true
      }
    });

    // Format current data for calculations
    const currentData = report.report_details_sm.reduce((acc, item) => {
      acc[item.report_type] = item;
      return acc;
    }, {});

    // Calculate statistics
    const calculations = calculateStatistics(
      currentData,
      previousReport ? previousReport.report_details_sm : [],
      report.report_date
    );

    const reportWithCalculations = {
      ...report,
      section_titles: sectionTitles,
      calculations,
      previous_data: previousReport ? previousReport.report_details_sm : [],
      monthly_data: monthlyReports
    };

    response.success({
      report: reportWithCalculations,
      section_titles: sectionTitles,
      exists: true,
      calculations
    }, res);

  } catch (error) {
    console.error('Error in getReportById:', error);
    response.error(error.message, res, next);
  }
};

// Submit small hospital report
export const submitReport = async (req, res, next) => {
  const transaction = await prisma.$transaction(async (tx) => {
    try {
      const {
        hospital_id,
        report_date,
        special_notes,
        report_details_sm,
        meetings_events,
        is_draft = false,
        hospital_type = 'welfare',
      } = req.body;

      const userId = user_id;
      const date = new Date(report_date);
      const hospitalId = parseInt(hospital_id);

      if (!hospitalId) {
        throw new Error("Hospital ID is required");
      }

      if (!report_details_sm || !Array.isArray(report_details_sm)) {
        throw new Error("Report details are required");
      }

      // Validate required fields
      const errors = [];
      
      // Check admission section
      const admissionData = report_details_sm.find(d => d.report_type === 'admission');
      if (!admissionData) {
        errors.push("入所データは必須です");
      } else {
        if (!admissionData.daily_admission && admissionData.daily_admission !== 0) {
          errors.push("入所：当日入所者数は必須です");
        }
        if (!admissionData.daily_discharge && admissionData.daily_discharge !== 0) {
          errors.push("入所：当日退所者数は必須です");
        }
      }

      // Check short-term section
      const shortTermData = report_details_sm.find(d => d.report_type === 'short_term');
      if (!shortTermData) {
        errors.push("短期入所データは必須です");
      } else {
        if (!shortTermData.daily_admission && shortTermData.daily_admission !== 0) {
          errors.push("短期入所：当日入所者数は必須です");
        }
        if (!shortTermData.daily_discharge && shortTermData.daily_discharge !== 0) {
          errors.push("短期入所：当日退所者数は必須です");
        }
      }

      // Check care house section
      const careHouseData = report_details_sm.find(d => d.report_type === 'care_house');
      if (!careHouseData) {
        errors.push("ケアハウスデータは必須です");
      } else if (!careHouseData.daily_users && careHouseData.daily_users !== 0) {
        errors.push("ケアハウス：当日利用者数は必須です");
      }

      // Check service sections
      const serviceTypes = ['day_service_1', 'day_service_2', 'rehabilitation', 'care_management', 'dementia_support'];
      const serviceSections = report_details_sm.filter(d => serviceTypes.includes(d.report_type));
      
      if (serviceSections.length === 0) {
        errors.push("少なくとも1つのサービスデータは必須です");
      } else {
        serviceSections.forEach(section => {
          if (!section.daily_users && section.daily_users !== 0) {
            errors.push(`${section.report_type}：当日利用者数は必須です`);
          }
        });
      }

      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Check if report already exists
      const existingReport = await tx.report.findUnique({
        where: {
          medical_center_id_report_date: {
            medical_center_id: hospitalId,
            report_date: date
          }
        }
      });

      const reportNo = existingReport?.report_no || generateReportNo(hospitalId, date);
      
      // Prepare report data
      const reportData = {
        report_no: reportNo,
        report_date: date,
        medical_center_id: hospitalId,
        status: is_draft ? 'draft' : 'submitted',
        special_notes: special_notes || '',
        hospital_type,
        // Store meetings and events in JSON field
        external_consultation_details: meetings_events ? { meetings_events } : null,
        updated_by: userId,
        updated_at: new Date(),
      };

      if (!existingReport) {
        reportData.created_by = userId;
        reportData.created_at = new Date();
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

      // Handle report_details_sm
      // Delete existing report_details_sm
      await tx.report_detail_sm.deleteMany({
        where: { report_id: report.id }
      });

      // Create new report_details_sm
      const detailsData = report_details_sm.map(detail => ({
        report_id: report.id,
        report_type: detail.report_type,
        sequence_no: detail.sequence_no || 1,
        category: detail.category || null,
        daily_admission: detail.daily_admission || 0,
        daily_discharge: detail.daily_discharge || 0,
        outside_hospital: detail.outside_hospital || 0,
        admission_treated: detail.admission_treated || 0,
        hospitalized: detail.hospitalized || 0,
        discharge_treated: detail.discharge_treated || 0,
        daily_users: detail.daily_users || 0,
        meetings_events: detail.meetings_events || null,
        capacity: detail.capacity || 0
      }));

      await tx.report_detail_sm.createMany({
        data: detailsData
      });

      // Get complete report with details
      const completeReport = await tx.report.findUnique({
        where: { id: report.id },
        include: {
          report_details_sm: {
            orderBy: [
              { report_type: 'asc' },
              { sequence_no: 'asc' }
            ]
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

// Get or create section titles
export const getSectionTitles = async (req, res, next) => {
  try {
    const { hospital_id } = req.body;

    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }

    const hospitalId = parseInt(hospital_id);
    const userId = user_id;

    let sectionTitles = await prisma.report_sm_section.findMany({
      where: {
        medical_center_id: hospitalId,
        status: 1
      },
      orderBy: {
        display_order: 'asc'
      }
    });

    // If no sections exist, create default ones
    if (sectionTitles.length === 0) {
      const defaultSections = [
        { section_type: 'day_service_1', title: '通所介護', display_order: 1 },
        { section_type: 'day_service_2', title: '通所リハビリテーション', display_order: 2 },
        { section_type: 'rehabilitation', title: 'リハビリテーション', display_order: 3 },
        { section_type: 'care_management', title: 'ケアマネジメント', display_order: 4 },
        { section_type: 'dementia_support', title: '認知症支援', display_order: 5 }
      ];

      sectionTitles = await Promise.all(
        defaultSections.map(section => 
          prisma.report_sm_section.create({
            data: {
              medical_center_id: hospitalId,
              section_type: section.section_type,
              title: section.title,
              display_order: section.display_order,
              created_by: userId
            }
          })
        )
      );
    }

    response.success(sectionTitles, res);
  } catch (error) {
    console.error('Error in getSectionTitles:', error);
    response.error(error.message, res, next);
  }
};

// Update section title
export const updateSectionTitle = async (req, res, next) => {
  try {
    const { section_id, title } = req.body;

    if (!section_id || !title) {
      return response.error("Section ID and title are required", res, next);
    }

    const sectionId = parseInt(section_id);
    const userId = user_id;

    const updatedSection = await prisma.report_sm_section.update({
      where: {
        id: sectionId
      },
      data: {
        title: title.trim(),
        updated_by: userId,
        updated_at: new Date()
      }
    });

    response.success(updatedSection, res);
  } catch (error) {
    console.error('Error in updateSectionTitle:', error);
    response.error(error.message, res, next);
  }
};

// Get last report's data for calculations
export const getLastReportSmData = async (req, res, next) => {
  try {
    const { hospital_id } = req.body;
    
    if (!hospital_id) {
      return response.error("Hospital ID is required", res, next);
    }

    const hospitalId = parseInt(hospital_id);

    const report = await prisma.report.findFirst({
      where: {
        medical_center_id: hospitalId,
        status: {
          in: ['submitted', 'approved']
        }
      },
      include: {
        report_details_sm: true
      },
      orderBy: {
        report_date: 'desc'
      }
    });

    if (!report) {
      return response.success([], res);
    }

    response.success(report.report_details_sm, res);

  } catch (error) {
    console.error('Error in getLastReportSmData:', error);
    response.error(error.message, res, next);
  }
};

// Get monthly statistics for a hospital
export const getMonthlyStatistics = async (req, res, next) => {
  try {
    const { hospital_id, year, month } = req.body;
    
    if (!hospital_id || !year || !month) {
      return response.error("Hospital ID, year, and month are required", res, next);
    }

    const hospitalId = parseInt(hospital_id);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const reports = await prisma.report.findMany({
      where: {
        medical_center_id: hospitalId,
        report_date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['submitted', 'approved']
        }
      },
      include: {
        report_details_sm: true
      },
      orderBy: {
        report_date: 'asc'
      }
    });

    // Calculate monthly totals and averages
    const statistics = {
      admission: {
        total: 0,
        average: 0,
        days_with_data: 0
      },
      short_term: {
        total: 0,
        average: 0,
        days_with_data: 0
      },
      care_house: {
        total: 0,
        average: 0,
        days_with_data: 0
      },
      services: {}
    };

    reports.forEach(report => {
      report.report_details_sm.forEach(detail => {
        switch(detail.report_type) {
          case 'admission':
            if (detail.daily_admission > 0) {
              statistics.admission.total += detail.daily_admission;
              statistics.admission.days_with_data++;
            }
            break;
          case 'short_term':
            if (detail.daily_admission > 0) {
              statistics.short_term.total += detail.daily_admission;
              statistics.short_term.days_with_data++;
            }
            break;
          case 'care_house':
            if (detail.daily_users > 0) {
              statistics.care_house.total += detail.daily_users;
              statistics.care_house.days_with_data++;
            }
            break;
          default:
            // Service sections
            if (!statistics.services[detail.report_type]) {
              statistics.services[detail.report_type] = {
                total: 0,
                average: 0,
                days_with_data: 0
              };
            }
            if (detail.daily_users > 0) {
              statistics.services[detail.report_type].total += detail.daily_users;
              statistics.services[detail.report_type].days_with_data++;
            }
        }
      });
    });

    // Calculate averages
    statistics.admission.average = statistics.admission.days_with_data > 0 ? 
      Math.round(statistics.admission.total / statistics.admission.days_with_data) : 0;
    
    statistics.short_term.average = statistics.short_term.days_with_data > 0 ? 
      Math.round(statistics.short_term.total / statistics.short_term.days_with_data) : 0;
    
    statistics.care_house.average = statistics.care_house.days_with_data > 0 ? 
      Math.round(statistics.care_house.total / statistics.care_house.days_with_data) : 0;

    // Calculate service averages
    Object.keys(statistics.services).forEach(key => {
      const service = statistics.services[key];
      service.average = service.days_with_data > 0 ? 
        Math.round(service.total / service.days_with_data) : 0;
    });

    response.success({
      reports: reports.length,
      statistics,
      period: {
        start: startDate,
        end: endDate,
        days: (endDate - startDate) / (1000 * 60 * 60 * 24) + 1
      }
    }, res);

  } catch (error) {
    console.error('Error in getMonthlyStatistics:', error);
    response.error(error.message, res, next);
  }
};

// Get yearly statistics for a hospital
export const getYearlyStatistics = async (req, res, next) => {
  try {
    const { hospital_id, year } = req.body;
    
    if (!hospital_id || !year) {
      return response.error("Hospital ID and year are required", res, next);
    }

    const hospitalId = parseInt(hospital_id);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const reports = await prisma.report.findMany({
      where: {
        medical_center_id: hospitalId,
        report_date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['submitted', 'approved']
        }
      },
      include: {
        report_details_sm: true
      }
    });

    // Calculate yearly totals and averages
    const statistics = {
      admission: {
        total: 0,
        average: 0,
        reports_with_data: 0
      },
      short_term: {
        total: 0,
        average: 0,
        reports_with_data: 0
      },
      care_house: {
        total: 0,
        average: 0,
        reports_with_data: 0
      },
      services: {}
    };

    reports.forEach(report => {
      report.report_details_sm.forEach(detail => {
        switch(detail.report_type) {
          case 'admission':
            if (detail.daily_admission > 0) {
              statistics.admission.total += detail.daily_admission;
              statistics.admission.reports_with_data++;
            }
            break;
          case 'short_term':
            if (detail.daily_admission > 0) {
              statistics.short_term.total += detail.daily_admission;
              statistics.short_term.reports_with_data++;
            }
            break;
          case 'care_house':
            if (detail.daily_users > 0) {
              statistics.care_house.total += detail.daily_users;
              statistics.care_house.reports_with_data++;
            }
            break;
          default:
            // Service sections
            if (!statistics.services[detail.report_type]) {
              statistics.services[detail.report_type] = {
                total: 0,
                average: 0,
                reports_with_data: 0
              };
            }
            if (detail.daily_users > 0) {
              statistics.services[detail.report_type].total += detail.daily_users;
              statistics.services[detail.report_type].reports_with_data++;
            }
        }
      });
    });

    // Calculate averages
    statistics.admission.average = statistics.admission.reports_with_data > 0 ? 
      Math.round(statistics.admission.total / statistics.admission.reports_with_data) : 0;
    
    statistics.short_term.average = statistics.short_term.reports_with_data > 0 ? 
      Math.round(statistics.short_term.total / statistics.short_term.reports_with_data) : 0;
    
    statistics.care_house.average = statistics.care_house.reports_with_data > 0 ? 
      Math.round(statistics.care_house.total / statistics.care_house.reports_with_data) : 0;

    // Calculate service averages
    Object.keys(statistics.services).forEach(key => {
      const service = statistics.services[key];
      service.average = service.reports_with_data > 0 ? 
        Math.round(service.total / service.reports_with_data) : 0;
    });

    response.success({
      reports: reports.length,
      statistics,
      period: {
        start: startDate,
        end: endDate,
        year: year
      }
    }, res);

  } catch (error) {
    console.error('Error in getYearlyStatistics:', error);
    response.error(error.message, res, next);
  }
};

// Get all section types with default titles
export const getSectionTypes = async (req, res, next) => {
  try {
    const sectionTypes = [
      { type: 'admission', default_title: '入所', required: true },
      { type: 'short_term', default_title: '短期入所', required: true },
      { type: 'care_house', default_title: 'ケアハウス', required: true },
      { type: 'day_service_1', default_title: '通所介護', required: false },
      { type: 'day_service_2', default_title: '通所リハビリテーション', required: false },
      { type: 'rehabilitation', default_title: 'リハビリテーション', required: false },
      { type: 'care_management', default_title: 'ケアマネジメント', required: false },
      { type: 'dementia_support', default_title: '認知症支援', required: false }
    ];

    response.success(sectionTypes, res);
  } catch (error) {
    console.error('Error in getSectionTypes:', error);
    response.error(error.message, res, next);
  }
};