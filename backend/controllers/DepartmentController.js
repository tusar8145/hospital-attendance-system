import { PrismaClient } from '@prisma/client';
import { user_id } from '../middleware/Auth.js';
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

export const department_list = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, sortBy = 'id', sortType = 'asc', filter = {} } = req.body;
    
    const { f_columnFilters = {}, globalFilter = '', f_globalFilters = {}, others = {} } = filter;

    // Build where clause
    let where = {
      ...others
    };

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
      const { name } = departments;

      const newDepartment = await prisma.department.create({
        data: {
          name,
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
    const { id, name } = req.body;

    const updatedDepartment = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name,
        updated_by: user_id,
        updated_at: new Date()
      }
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