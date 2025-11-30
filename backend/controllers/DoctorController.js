import { PrismaClient } from '@prisma/client';
import { user_id } from '../middleware/Auth.js';
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

// Helper function to determine medical_center filter based on user role
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

export const doctor_list = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, sortBy = 'id', sortType = 'asc', filter = {} } = req.body;
    
    const { f_columnFilters = {}, globalFilter = '', f_globalFilters = {}, others = {}, hospital_id } = filter;

    // Get user from request
    const user = req.user;

    // Build where clause
    let where = {
      ...others
    };

    // Handle medical_center_id filtering based on user role and permissions
    if (hospital_id) {
      // If hospital_id is explicitly provided in filter, use it
      where.medical_center_id = parseInt(hospital_id);
    } else {
      // Determine medical_center_id filtering based on user role
      const medicalCenterFilter = await getMedicalCenterFilter(user);
      if (medicalCenterFilter) {
        where.medical_center_id = medicalCenterFilter;
      }
    }

    // Apply column filters
    if (Object.keys(f_columnFilters).length > 0) {
      where = { ...where, ...f_columnFilters };
    }

    // Apply global search
    if (globalFilter && Object.keys(f_globalFilters).length > 0) {
      where = { ...where, ...f_globalFilters };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(perPage);
    const take = parseInt(perPage);

    // Get total count with filters
    const totalCount = await prisma.doctor.count({ where });

    // Get paginated data
    const result = await prisma.doctor.findMany({
      skip,
      take,
      orderBy: { [sortBy]: sortType },
      where,
      include: {
        medical_center: {
          select: { id: true, name: true, type: true, status:true }
        },
        dept_links: {
          where: { status: 1 },
          include: {
            department: {
              select: { id: true, name: true, status:true }
            }
          }
        },
        _count: {
          select: {
            dept_links: { where: { status: 1 } }
          }
        },
        // Include admin relations
        created_admin: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        updated_admin: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
    });

    response.list({
      data: result,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: totalCount,
        totalPages: Math.ceil(totalCount / perPage)
      }
    }, res);

  } catch (error) {
    response.error(error, res, next);
  }
};

export const doctor_create = async (req, res, next) => {
  try {
    const doctors = req.body;

    if (Array.isArray(doctors)) {
      // Bulk create multiple doctors
      const createdDoctors = [];
      
      for (const doctor of doctors) {
        const { name, license_no, medical_center_id, department_ids } = doctor;

        const newDoctor = await prisma.doctor.create({
          data: {
            name,
            license_no,
            medical_center_id: parseInt(medical_center_id),
            created_by: user_id,
          }
        });

        // Create department links if department_ids provided
        if (department_ids && department_ids.length > 0) {
          const departmentLinks = department_ids.map(deptId => ({
            doctor_id: newDoctor.id,
            department_id: parseInt(deptId),
            created_by: user_id
          }));

          await prisma.doctor_department.createMany({
            data: departmentLinks
          });
        }

        // Get the complete doctor with relationships
        const doctorWithRelations = await prisma.doctor.findUnique({
          where: { id: newDoctor.id },
          include: {
            medical_center: true,
            dept_links: {
              include: {
                department: true
              }
            }
          }
        });

        createdDoctors.push(doctorWithRelations);
      }

      response.create({
        count: createdDoctors.length,
        message: `${createdDoctors.length} doctors created successfully`,
        doctors: createdDoctors
      }, res);

    } else {
      // Single doctor creation
      const { name, license_no, medical_center_id, department_ids } = doctors;

      const newDoctor = await prisma.doctor.create({
        data: {
          name,
          license_no,
          medical_center_id: parseInt(medical_center_id),
          created_by: user_id,
        }
      });

      // Create department links if department_ids provided
      if (department_ids && department_ids.length > 0) {
        const departmentLinks = department_ids.map(deptId => ({
          doctor_id: newDoctor.id,
          department_id: parseInt(deptId),
          created_by: user_id
        }));

        await prisma.doctor_department.createMany({
          data: departmentLinks
        });
      }

      const doctorWithRelations = await prisma.doctor.findUnique({
        where: { id: newDoctor.id },
        include: {
          medical_center: true,
          dept_links: {
            include: {
              department: true
            }
          }
        }
      });

      response.create(doctorWithRelations, res);
    }
  } catch (error) {
    response.error(error, res, next);
  }
};

export const doctor_update = async (req, res, next) => {
  try {
    const { id, name, license_no, medical_center_id } = req.body;

    const updatedDoctor = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: {
        name,
        license_no,
        medical_center_id: parseInt(medical_center_id),
        updated_by: user_id,
        updated_at: new Date()
      }
    });

    response.update(updatedDoctor, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const doctor_status = async (req, res, next) => {
  try {
    const { id, status } = req.body;

    const updatedDoctor = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: {
        status: parseInt(status),
        updated_by: user_id,
        updated_at: new Date()
      }
    });

    response.update(updatedDoctor, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const doctor_remove = async (req, res, next) => {
  try {
    const { id } = req.body;

    // First delete doctor department links
    await prisma.doctor_department.deleteMany({
      where: {
        doctor_id: parseInt(id)
      }
    });

    // Then delete the doctor
    const deletedDoctor = await prisma.doctor.delete({
      where: { id: parseInt(id) }
    });

    response.remove(deletedDoctor, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const doctor_assign_departments = async (req, res, next) => {
  try {
    const { doctor_id, department_ids } = req.body;

    // Remove existing department links
    await prisma.doctor_department.deleteMany({
      where: { 
        doctor_id: parseInt(doctor_id) 
      }
    });

    // Create new department links
    if (department_ids && department_ids.length > 0) {
      const departmentLinks = department_ids.map(deptId => ({
        doctor_id: parseInt(doctor_id),
        department_id: parseInt(deptId),
        created_by: user_id
      }));

      await prisma.doctor_department.createMany({
        data: departmentLinks
      });
    }

    const doctorWithDepartments = await prisma.doctor.findUnique({
      where: { id: parseInt(doctor_id) },
      include: {
        dept_links: {
          include: {
            department: true
          }
        }
      }
    });

    response.update(doctorWithDepartments, res);
  } catch (error) {
    response.error(error, res, next);
  }
};