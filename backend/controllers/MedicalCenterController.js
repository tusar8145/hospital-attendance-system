import { PrismaClient } from '@prisma/client';
import { user_id } from '../middleware/Auth.js';
import * as response from "../helpers/Response.js";

const prisma = new PrismaClient();

// MedicalCenterController.js - Updated list function
export const medical_center_list = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, sortBy = 'id', sortType = 'asc', filter = {} } = req.body;
    
    const { f_columnFilters = {}, globalFilter = '', f_globalFilters = {}, others = {} } = filter;

    // Get the logged-in user from the request
    const loggedInUser = req.user; // Make sure your auth middleware sets req.user
    const userRole = loggedInUser?.role;
    const userId = loggedInUser?.id;

    if (!loggedInUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found"
      });
    }

    // Build where clause
    let where = {};

    // Apply column filters (f_columnFilters)
    if (Object.keys(f_columnFilters).length > 0) {
      Object.keys(f_columnFilters).forEach(key => {
        if (f_columnFilters[key] !== undefined && f_columnFilters[key] !== null && f_columnFilters[key] !== '') {
          where[key] = f_columnFilters[key];
        }
      });
    }

    // Apply global search (f_globalFilters)
    if (globalFilter && Object.keys(f_globalFilters).length > 0) {
      where = {
        ...where,
        ...f_globalFilters
      };
    }

    // Apply others filter
    if (Object.keys(others).length > 0) {
      where = {
        ...where,
        ...others
      };
    }

    // Add role-based filtering
    if (userRole !== 'admin' && userRole !== 'superAdmin') {
      // For non-admin users, only show medical centers assigned to them
      where = {
        ...where,
        admins: {
          some: {
            admin_id: userId
          }
        }
      };
    }

    console.log('Final where clause:', where);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(perPage);
    const take = parseInt(perPage);

    // Get total count with filters
    const totalCount = await prisma.medical_center.count({ where });

    // Get paginated data
    const result = await prisma.medical_center.findMany({
      skip,
      take,
      orderBy: { [sortBy]: sortType },
      where,
      include: {
        doctors: {
          where: { status: 1 },
          select: { id: true, name: true }
        },
        _count: {
          select: {
            doctors: { where: { status: 1 } }
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
        },
        // Include assigned admins for reference
        admins: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true
              }
            }
          }
        }
      },
    });
    const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);

    response.list({
      data: result,
      baseUrl:url.origin + '/api/hospital-manage/image/',
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

export const medical_center_create = async (req, res, next) => {
  try {
    const medicalCenters = req.body;

    console.log(medicalCenters,'medicalCenters');

    if (Array.isArray(medicalCenters)) {
      // Extract all names for duplicate checking
      const names = medicalCenters.map(mc => mc.name?.trim()).filter(name => name);
      
      // Check for duplicates in the database
      const existingMedicalCenters = await prisma.medical_center.findMany({
        where: {
          name: {
            in: names
          }
        },
        select: {
          name: true
        }
      });

      // Check for duplicates in the request itself
      const nameCount = {};
      const duplicateNamesInRequest = [];
      
      names.forEach(name => {
        nameCount[name] = (nameCount[name] || 0) + 1;
        if (nameCount[name] > 1 && !duplicateNamesInRequest.includes(name)) {
          duplicateNamesInRequest.push(name);
        }
      });

      if (existingMedicalCenters.length > 0) {
        const existingNames = existingMedicalCenters.map(mc => mc.name);
        return res.status(400).json({
          success: false,
          errorType: 'EXISTING_MEDICAL_CENTERS',
          data: { names: existingNames.join(', ') }
        });
      }

      if (duplicateNamesInRequest.length > 0) {
        return res.status(400).json({
          success: false,
          errorType: 'DUPLICATE_NAMES_IN_REQUEST', 
          data: { names: duplicateNamesInRequest.join(', ') }
        });
      }

      // Bulk create multiple medical centers
      const medicalCenterData = medicalCenters.map(mc => ({
        name: mc.name.trim(),
        type: mc.type,
        address: mc.address,
        created_by: user_id,
      }));

      const newMedicalCenters = await prisma.medical_center.createMany({
        data: medicalCenterData,
        skipDuplicates: true,
      });

      response.create({
        count: newMedicalCenters.count,
        message: `${newMedicalCenters.count} medical centers created successfully`
      }, res);

    } else {
      // Single medical center creation
      const { name, type, address } = medicalCenters;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          errorType: 'MEDICAL_CENTER_NAME_REQUIRED'
        });
      }

      // Check if medical center with same name already exists
      const existingMedicalCenter = await prisma.medical_center.findFirst({
        where: {
          name: name.trim()
        }
      });

      if (existingMedicalCenter) {
        return res.status(400).json({
          success: false,
          errorType: 'MEDICAL_CENTER_ALREADY_EXISTS',
          data: { name: name.trim() }
        });
      }

      const newMedicalCenter = await prisma.medical_center.create({
        data: {
          name: name.trim(),
          type,
          address,
          created_by: user_id,
        }
      });

      response.create(newMedicalCenter, res);
    }
  } catch (error) {
    response.error(error, res, next);
  }
};

export const medical_center_update = async (req, res, next) => {
  try {
    const { id, name, type, address } = req.body;

    const updatedMedicalCenter = await prisma.medical_center.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        address,
        updated_by: user_id,
        updated_at: new Date()
      }
    });

    response.update(updatedMedicalCenter, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const medical_center_status = async (req, res, next) => {
  try {
    const { id, status } = req.body;

    const updatedMedicalCenter = await prisma.medical_center.update({
      where: { id: parseInt(id) },
      data: {
        status: parseInt(status),
        updated_by: user_id,
        updated_at: new Date()
      }
    });

    response.update(updatedMedicalCenter, res);
  } catch (error) {
    response.error(error, res, next);
  }
};

export const medical_center_remove = async (req, res, next) => {
  try {
    const { id } = req.body;

    // First delete related doctor department links
    await prisma.doctor_department.deleteMany({
      where: {
        doctor: {
          medical_center_id: parseInt(id)
        }
      }
    });

    // Then delete doctors
    await prisma.doctor.deleteMany({
      where: {
        medical_center_id: parseInt(id)
      }
    });

    // Finally delete the medical center
    const deletedMedicalCenter = await prisma.medical_center.delete({
      where: { id: parseInt(id) }
    });

    response.remove(deletedMedicalCenter, res);
  } catch (error) {
    response.error(error, res, next);
  }
};