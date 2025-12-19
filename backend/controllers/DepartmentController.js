import { PrismaClient } from '@prisma/client';
import { user_id } from '../middleware/Auth.js';
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

export const department_list = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, sortBy = 'id', sortType = 'asc', filter = {} } = req.body;
    
    const { f_columnFilters = {}, globalFilter = '', f_globalFilters = {}, others = {}, hospital_id } = filter;

    // Get user from request (assuming user is attached to req by auth middleware)
    const user = req.user;

    // Build where clause
    let where = {
      ...others
    };

    // If hospital_id is provided in filter, use it
    if (hospital_id) {
      where.medical_center_id = parseInt(hospital_id);
    } 
    // If no hospital_id provided and user is not admin/superAdmin, get medical_center_ids from admin_medical_center
    else if (!hospital_id && user && user.role !== 'admin' && user.role !== 'superAdmin') {
      // Get medical_center_ids from admin_medical_center table for this user
      const adminMedicalCenters = await prisma.admin_medical_center.findMany({
        where: {
          admin_id: user.id
        },
        select: {
          medical_center_id: true
        }
      });

      // Extract medical_center_ids from the result
      const medicalCenterIds = adminMedicalCenters.map(amc => amc.medical_center_id);

      // If user has assigned medical centers, filter by them
      if (medicalCenterIds.length > 0) {
        where.medical_center_id = {
          in: medicalCenterIds
        };
      } else {
        // If user has no assigned medical centers, return empty result
        where.medical_center_id = -1; // This will return no results
      }
    }
    // If user is admin/superAdmin and no hospital_id provided, no additional filtering needed

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
    const totalCount = await prisma.department.count({ where });

    // Get paginated data
    const result = await prisma.department.findMany({
      skip,
      take,
      orderBy: { [sortBy]: sortType },
      where,
      include: {
        medical_center: {
          select: { id: true, name: true, type: true, status: true }
        },
        doctor_links: {
          where: { status: 1 },
          include: {
            doctor: {
              select: { 
                id: true, 
                name: true, 
                medical_center: { 
                  select: { 
                    id: true, 
                    name: true 
                  } 
                } 
              }
            }
          }
        },
        _count: {
          select: {
            doctor_links: { where: { status: 1 } }
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

export const department_create = async (req, res, next) => {
  try {
    const departments = req.body;

    if (Array.isArray(departments)) {
      // Bulk create multiple departments
      const departmentData = departments.map(dept => ({
        name: dept.name,
        floor: dept.floor || null, // Add floor field
        medical_center_id: parseInt(dept.medical_center_id),
        created_by: user_id,
      }));

      const newDepartments = await prisma.department.createMany({
        data: departmentData,
        skipDuplicates: true,
      });

      response.create({
        count: newDepartments.count,
        message: `${newDepartments.count} departments created successfully`
      }, res);

    } else {
      // Single department creation
      const { name, floor, medical_center_id } = departments;

      // Validate medical_center_id is provided
      if (!medical_center_id) {
        return response.error({ message: 'medical_center_id is required' }, res, next);
      }

      const newDepartment = await prisma.department.create({
        data: {
          name,
          floor: floor || null, // Add floor field
          medical_center_id: parseInt(medical_center_id),
          created_by: user_id,
        }
      });

      response.create(newDepartment, res);
    }
  } catch (error) {
    response.error(error, res, next);
  }
};

export const department_update = async (req, res, next) => {
  try {
    const { id, name, floor, medical_center_id } = req.body;

    const updateData = {
      name,
      updated_by: user_id,
      updated_at: new Date()
    };

    // Update floor if provided (including null to clear it)
    if (floor !== undefined) {
      updateData.floor = floor || null;
    }

    // Only update medical_center_id if provided
    if (medical_center_id) {
      updateData.medical_center_id = parseInt(medical_center_id);
    }

    const updatedDepartment = await prisma.department.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    response.update(updatedDepartment, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const department_status = async (req, res, next) => {
  try {
    const { id, status } = req.body;

    const updatedDepartment = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        status: parseInt(status),
        updated_by: user_id,
        updated_at: new Date()
      }
    });

    response.update(updatedDepartment, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const department_remove = async (req, res, next) => {
  try {
    const { id } = req.body;

    // First delete related doctor department links
    await prisma.doctor_department.deleteMany({
      where: {
        department_id: parseInt(id)
      }
    });

    // Then delete the department
    const deletedDepartment = await prisma.department.delete({
      where: { id: parseInt(id) }
    });

    response.remove(deletedDepartment, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

// Additional department operations

export const department_details = async (req, res, next) => {
  try {
    const { id } = req.body;

    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
      include: {
        medical_center: {
          select: { id: true, name: true, type: true, status: true }
        },
        doctor_links: {
          where: { status: 1 },
          include: {
            doctor: {
              select: { 
                id: true, 
                name: true,
                license_no: true,
                status: true,
                medical_center: { 
                  select: { 
                    id: true, 
                    name: true 
                  } 
                } 
              }
            }
          }
        },
        _count: {
          select: {
            doctor_links: { where: { status: 1 } }
          }
        },
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

    if (!department) {
      return response.error({ message: 'Department not found' }, res, next);
    }

    response.success(department, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const department_bulk_status = async (req, res, next) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.error({ message: 'No departments selected' }, res, next);
    }

    const updatedDepartments = await prisma.department.updateMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) }
      },
      data: {
        status: parseInt(status),
        updated_by: user_id,
        updated_at: new Date()
      }
    });

    response.update({
      count: updatedDepartments.count,
      message: `${updatedDepartments.count} departments updated successfully`
    }, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const department_bulk_remove = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.error({ message: 'No departments selected' }, res, next);
    }

    // First delete related doctor department links
    await prisma.doctor_department.deleteMany({
      where: {
        department_id: { in: ids.map(id => parseInt(id)) }
      }
    });

    // Then delete the departments
    const deletedDepartments = await prisma.department.deleteMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) }
      }
    });

    response.remove({
      count: deletedDepartments.count,
      message: `${deletedDepartments.count} departments deleted successfully`
    }, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const department_doctors = async (req, res, next) => {
  try {
    const { department_id, page = 1, perPage = 10, hospital_id } = req.body;

    let where = {
      department_id: parseInt(department_id),
      status: 1
    };

    // Apply hospital_id filter if provided
    if (hospital_id) {
      where.doctor = {
        medical_center_id: parseInt(hospital_id)
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(perPage);
    const take = parseInt(perPage);

    // Get total count
    const totalCount = await prisma.doctor_department.count({ where });

    // Get paginated doctor departments
    const doctorDepartments = await prisma.doctor_department.findMany({
      skip,
      take,
      where,
      include: {
        doctor: {
          include: {
            medical_center: {
              select: { id: true, name: true, type: true }
            },
            dept_links: {
              where: { status: 1 },
              include: {
                department: {
                  select: { id: true, name: true, floor: true } // Add floor to response
                }
              }
            }
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    response.list({
      data: doctorDepartments,
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

export const department_add_doctors = async (req, res, next) => {
  try {
    const { department_id, doctor_ids } = req.body;

    if (!Array.isArray(doctor_ids) || doctor_ids.length === 0) {
      return response.error({ message: 'No doctors selected' }, res, next);
    }

    // Prepare data for bulk create
    const doctorDepartmentData = doctor_ids.map(doctor_id => ({
      doctor_id: parseInt(doctor_id),
      department_id: parseInt(department_id),
      created_by: user_id,
    }));

    // Use createMany with skipDuplicates to avoid duplicate entries
    const newDoctorDepartments = await prisma.doctor_department.createMany({
      data: doctorDepartmentData,
      skipDuplicates: true,
    });

    response.create({
      count: newDoctorDepartments.count,
      message: `${newDoctorDepartments.count} doctors added to department successfully`
    }, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const department_remove_doctor = async (req, res, next) => {
  try {
    const { department_id, doctor_id } = req.body;

    const deletedDoctorDepartment = await prisma.doctor_department.delete({
      where: {
        doctor_id_department_id: {
          doctor_id: parseInt(doctor_id),
          department_id: parseInt(department_id)
        }
      }
    });

    response.remove(deletedDoctorDepartment, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const department_by_hospital = async (req, res, next) => {
  try {
    const { hospital_id, status = 1, include_floor = false } = req.body;

    if (!hospital_id) {
      return response.error({ message: 'hospital_id is required' }, res, next);
    }

    const departments = await prisma.department.findMany({
      where: {
        medical_center_id: parseInt(hospital_id),
        status: parseInt(status)
      },
      select: {
        id: true,
        name: true,
        floor: include_floor, // Include floor only when requested
        status: true,
        _count: {
          select: {
            doctor_links: { where: { status: 1 } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    response.success(departments, res);
  } catch (error) {
    response.error(error, res, next);
  }
};