import { PrismaClient } from '@prisma/client';

import { user_id } from '../middleware/Auth.js';
import { rand } from '../helpers/RandomHash.js';
import { currentTimeValue } from '../helpers/Timer.js';
const prisma = new PrismaClient();
import { created_at } from '../helpers/Timer.js';

import jwt from "jsonwebtoken";
import md5 from "md5";

import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IncomingForm } from 'formidable';
import multer from 'multer';
import * as response from "../helpers/Response.js";
import { registration } from './UserController.js';
import { create } from '../crud/CrudController.js';
import axios from 'axios';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../uploads/') // Uploads will be saved in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname) // File names will be unique
  }
});

const upload = multer({ storage: storage });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const manage_list_assis = async (req, res, next) => {
  try {
    const result = []
    const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);

    let f_columnFilters = req.body?.filter?.f_columnFilters
    let globalFilter = req.body?.filter?.globalFilter
    let f_globalFilters = req.body?.filter?.f_globalFilters
    let others = req.body?.filter?.others

    let result_ = await prisma.admins.findMany({
      ...response.list_paginate(req),
      where: {
        ...others ? { ...others } : {}
      },
      include: {
        medical_centers: {
          include: {
            medical_center: true
          }
        },
        creator: {
          select: {
            name: true
          }
        },
      },
    })

    let result2_ = null

    if (result_.length > 0) {
      result2_ = await prisma.admins.findMany({
        ...response.list_paginate(req),
        where: {
          id: result_[0]?.created_by
        },
        include: {
          creator: {
            select: {
              name: true
            }
          },
        },
      })

      let kkkk = result2_[0]
      let logox = kkkk.photo || 'defaultUser.png'
      result.push({
        "id": kkkk.id,
        "photo": url.origin + '/api/hospital-manage/image/' + logox,
        "name": kkkk.name,
        "email": kkkk.email,
        "address": kkkk.address,
        "created_by": kkkk.created_by,
        "created_at": kkkk.created_at,
        "updated_at": kkkk.updated_at,
        "medical_centers": kkkk.medical_centers?.map(mc => mc.medical_center) || [],
        "password": null,
        "phone": kkkk.phone,
        "role": kkkk.role,
        "creator": kkkk?.creator?.name,
      })
    }

    for (let h = 0; h < result_.length; h++) {
      let this_ = result_[h]
      let logo = this_.photo || 'defaultUser.png'

      result.push({
        "id": this_.id,
        "photo": url.origin + '/api/hospital-manage/image/' + logo,
        "name": this_.name,
        "email": this_.email,
        "address": this_.address,
        "created_by": this_.created_by,
        "created_at": this_.created_at,
        "updated_at": this_.updated_at,
        "medical_centers": this_.medical_centers?.map(mc => mc.medical_center) || [],
        "password": null,
        "phone": this_.phone,
        "role": this_.role,
        "creator": this_?.creator?.name,
      })
    }

    response.list({data:result}, res)
  } catch (error) {
    response.error(error, res, next)
  }
};

export const manage_list = async (req, res, next) => {
  try {
    console.log(req.body)

    let f_columnFilters = req.body?.filter?.f_columnFilters
    let globalFilter = req.body?.filter?.globalFilter
    let f_globalFilters = req.body?.filter?.f_globalFilters
    let others = req.body?.filter?.others
    let hospitalFilter = req.body?.filter?.hospitalFilter

    // Get pagination parameters from request
    const page = parseInt(req.body?.page) || 1;
    const perPage = parseInt(req.body?.perPage) || 10;
    const skip = (page - 1) * perPage;
    
    // Get sorting parameters
    const sortBy = req.body?.sortBy || 'created_at';
    const sortType = req.body?.sortType || 'desc';

    // Get current user role and medical centers
    const currentUserRole = req.user.role;
    let currentUserMedicalCenters = [];

    // If user is hospitalAssistant or staff, get their assigned medical centers
    if (currentUserRole === 'hospitalAssistant' || currentUserRole === 'staff') {
      const userWithMedicalCenters = await prisma.admins.findUnique({
        where: { id: req.user.id },
        include: {
          medical_centers: {
            include: {
              medical_center: {
                select: { id: true }
              }
            }
          }
        }
      });
      
      currentUserMedicalCenters = userWithMedicalCenters?.medical_centers?.map(mc => mc.medical_center.id) || [];
    }

    // Build base where clause
    const baseWhereClause = {
      ...f_columnFilters ? { ...f_columnFilters } : {},
      ...globalFilter ? { ...f_globalFilters } : {},
      ...others ? { ...others } : {}
    };

    // Add role-based security filtering (doesn't override payload filters)
    let finalWhereClause = { ...baseWhereClause };

    // Handle hospitalFilter if provided
    let medicalCenterFilter = {};
    if (hospitalFilter?.hospital_id) {
      medicalCenterFilter = {
        some: {
          medical_center_id: hospitalFilter.hospital_id
        }
      };
    }

    if (currentUserRole === 'hospitalAssistant') {
      // hospitalAssistant can ONLY view staff & operator with at least 1 common medical center
      // Combine payload role filter with security role filter
      const allowedRoles = ['staff', 'operator'];
      
      if (finalWhereClause.role) {
        // If payload has role filter, ensure it's within allowed roles
        if (typeof finalWhereClause.role === 'string') {
          if (!allowedRoles.includes(finalWhereClause.role)) {
            finalWhereClause.id = -1; // Force no results if requested role is not allowed
          }
        } else if (finalWhereClause.role.in) {
          // If payload has role.in filter, filter to only include allowed roles
          finalWhereClause.role.in = finalWhereClause.role.in.filter(role => allowedRoles.includes(role));
          if (finalWhereClause.role.in.length === 0) {
            finalWhereClause.id = -1; // Force no results if no allowed roles remain
          }
        }
      } else {
        // If no role filter in payload, apply security role filter
        finalWhereClause.role = { in: allowedRoles };
      }
      
      // Apply medical center filter - combine hospitalFilter with user's medical centers
      if (hospitalFilter?.hospital_id) {
        // If hospitalFilter is provided, check if user has access to that hospital
        if (currentUserMedicalCenters.length > 0 && currentUserMedicalCenters.includes(hospitalFilter.hospital_id)) {
          finalWhereClause.medical_centers = medicalCenterFilter;
        } else {
          finalWhereClause.id = -1; // User doesn't have access to this hospital
        }
      } else {
        // If no hospitalFilter, use user's assigned medical centers
        if (currentUserMedicalCenters.length > 0) {
          finalWhereClause.medical_centers = {
            some: {
              medical_center_id: {
                in: currentUserMedicalCenters
              }
            }
          };
        } else {
          finalWhereClause.id = -1; // Force no results
        }
      }
    } else if (currentUserRole === 'staff') {
      // staff can ONLY view operators with at least 1 common medical center
      // Combine payload role filter with security role filter
      const allowedRole = 'operator';
      
      if (finalWhereClause.role) {
        // If payload has role filter, ensure it matches the allowed role
        if (typeof finalWhereClause.role === 'string') {
          if (finalWhereClause.role !== allowedRole) {
            finalWhereClause.id = -1; // Force no results if requested role is not allowed
          }
        } else if (finalWhereClause.role.in) {
          // If payload has role.in filter, filter to only include the allowed role
          if (!finalWhereClause.role.in.includes(allowedRole)) {
            finalWhereClause.id = -1; // Force no results if allowed role not in filter
          } else {
            finalWhereClause.role = allowedRole; // Replace with single role
          }
        }
      } else {
        // If no role filter in payload, apply security role filter
        finalWhereClause.role = allowedRole;
      }
      
      // Apply medical center filter - combine hospitalFilter with user's medical centers
      if (hospitalFilter?.hospital_id) {
        // If hospitalFilter is provided, check if user has access to that hospital
        if (currentUserMedicalCenters.length > 0 && currentUserMedicalCenters.includes(hospitalFilter.hospital_id)) {
          finalWhereClause.medical_centers = medicalCenterFilter;
        } else {
          finalWhereClause.id = -1; // User doesn't have access to this hospital
        }
      } else {
        // If no hospitalFilter, use user's assigned medical centers
        if (currentUserMedicalCenters.length > 0) {
          finalWhereClause.medical_centers = {
            some: {
              medical_center_id: {
                in: currentUserMedicalCenters
              }
            }
          };
        } else {
          finalWhereClause.id = -1; // Force no results
        }
      }
    } else if (currentUserRole === 'operator') {
      // operator cannot view anyone
      finalWhereClause.id = -1; // Force no results
    } else if (currentUserRole === 'admin' || currentUserRole === 'superAdmin') {
      // For admin/superAdmin, apply hospitalFilter if provided
      if (hospitalFilter?.hospital_id) {
        finalWhereClause.medical_centers = medicalCenterFilter;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.admins.count({
      where: finalWhereClause
    });

    // Get paginated results
    let result_ = await prisma.admins.findMany({
      where: finalWhereClause,
      include: {
        medical_centers: {
          include: {
            medical_center: {
              select: {
                id: true,
                name: true,
                type: true,
                address: true,
                status: true,
                logo: true,
                primary_color: true,
                sub_color_1: true,
                sub_color_2: true,
                created_at: true,
                updated_at: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            photo: true
          }
        },
      },
      skip: skip,
      take: perPage,
      orderBy: {
        [sortBy]: sortType
      }
    })

    const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    const result = []
    for (let h = 0; h < result_.length; h++) {
      let this_ = result_[h]
      let logo = this_.photo || 'defaultUser.png'
      
      // Format creator information
      const creatorInfo = this_.creator ? {
        id: this_.creator.id,
        name: this_.creator.name,
        email: this_.creator.email,
        role: this_.creator.role,
        photo: this_.creator.photo ? url.origin + '/api/hospital-manage/image/' + this_.creator.photo : null
      } : null;

      // Format assigned medical centers
      const assigned_medicals = this_.medical_centers?.map(mc => ({
        id: mc.medical_center.id,
        name: mc.medical_center.name,
        type: mc.medical_center.type,
        address: mc.medical_center.address,
        status: mc.medical_center.status,
        logo: mc.medical_center.logo ? url.origin + '/api/hospital-manage/image/' + mc.medical_center.logo : null,
        primary_color: mc.medical_center.primary_color,
        sub_color_1: mc.medical_center.sub_color_1,
        sub_color_2: mc.medical_center.sub_color_2,
        created_at: mc.medical_center.created_at,
        updated_at: mc.medical_center.updated_at
      })) || [];

      result.push({
        "id": this_.id,
        "photo": url.origin + '/api/hospital-manage/image/' + logo,
        "name": this_.name,
        "email": this_.email,
        "address": this_.address,
        "created_by": this_.created_by,
        "created_at": this_.created_at,
        "updated_at": this_.updated_at,
        "medical_centers": assigned_medicals,
        "assigned_medicals": assigned_medicals,
        "assigned_medical_centers": assigned_medicals,
        "assigned_medical_centers_count": assigned_medicals.length,
        "password": null,
        "phone": this_.phone,
        "role": this_.role,
        "creator": this_?.creator?.name, // Backward compatibility
        "creator_info": creatorInfo, // Detailed creator information
        "created_by_user": creatorInfo // Alternative key name
      })
    }

    // Return paginated response
    response.list({
      data: result,
      pagination: {
        current_page: page,
        per_page: perPage,
        total: totalCount,
        total_pages: Math.ceil(totalCount / perPage),
        has_next: page < Math.ceil(totalCount / perPage),
        has_prev: page > 1
      }
    }, res)
  } catch (error) {
    response.error(error, res, next)
  }
};

export const manage_create = async (req, res, next) => {
  try {
    req.body.name = req.body.name
    req.body.email = req.body.email
    req.body.phone = req.body.phone
    req.body.medical_center_ids = req.body.medical_center_ids // Array of medical center IDs
    //req.body.role = 'staff'
    req.body.created_by = user_id
    req.body.password = req.body.password
    req.body.return = true

    let reg = await registration(req, res, next)
    let clock = created_at()

    // If registration was successful and we have medical centers to associate
    if (reg && reg.id && req.body.medical_center_ids && req.body.medical_center_ids.length > 0) {
      // Create associations with medical centers
      const medicalCenterAssociations = req.body.medical_center_ids.map(medical_center_id => ({
        admin_id: reg.id,
        medical_center_id: parseInt(medical_center_id)
      }))

      await prisma.admin_medical_center.createMany({
        data: medicalCenterAssociations
      })
    }

    response.create(reg, res)
  } catch (error) {
    response.error(error, res, next)
  }
};

export const image = async (req, res, next) => {
  let image = req.params.image
  res.sendFile(path.join(__dirname.replace("\controllers", "") + "./uploads/" + image));
};

export const manage_issue_file = async (req, res, next) => {
  console.log('333333')
  let img_name = ''
  const uploadDir = path.join(__dirname.replace("\controllers", "") + '/uploads');

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, '0777', true);
  const customOptions = { uploadDir: uploadDir, keepExtensions: true, allowEmptyFiles: false, maxFileSize: 5 * 1024 * 1024 * 1024, multiples: true };
  const form = new IncomingForm(customOptions);
  let file_count = req.query.counts
  let id = parseInt(req.query.id)

  form.parse(req, async (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }
    for (let x = 0; x < file_count; x++) {
      try {
        const file = files['file-' + x.toString()]
        let str = file.toString()
        const myArray = str.split(",");

        const ssmyArray1 = myArray[1].split(":");
        var trimmedStr = ssmyArray1[1].trimStart();
        trimmedStr = trimmedStr.trimEnd();
        const newFilepath = `${uploadDir}/${trimmedStr}`;

        const ssmyArray1_1 = myArray[0].split(":");
        var trimmedStr_1 = ssmyArray1_1[1].trimStart();
        trimmedStr_1 = trimmedStr_1.trimEnd();
        const newFilepath_1 = `${uploadDir}/${'fff' + trimmedStr_1}`;

        fs.rename(newFilepath_1, newFilepath, err => err);
        img_name = trimmedStr_1

      } catch (error) {
        console.log(error, 'error')
      }
    }
    res.status(200).json({ img_name: img_name });
  });
};

export const manage_logo = async (req, res, next) => {
  const uploadDir = path.join(__dirname.replace("\controllers", "") + '/uploads');

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, '0777', true);
  const customOptions = { uploadDir: uploadDir, keepExtensions: true, allowEmptyFiles: false, maxFileSize: 5 * 1024 * 1024 * 1024, multiples: true };
  const form = new IncomingForm(customOptions);
  let file_count = req.query.counts
  let id = parseInt(req.query.id)

  form.parse(req, async (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }
    for (let x = 0; x < file_count; x++) {
      try {
        const file = files['file-' + x.toString()]
        let str = file.toString()
        const myArray = str.split(",");

        const ssmyArray1 = myArray[1].split(":");
        var trimmedStr = ssmyArray1[1].trimStart();
        trimmedStr = trimmedStr.trimEnd();
        const newFilepath = `${uploadDir}/${trimmedStr}`;

        const ssmyArray1_1 = myArray[0].split(":");
        var trimmedStr_1 = ssmyArray1_1[1].trimStart();
        trimmedStr_1 = trimmedStr_1.trimEnd();
        const newFilepath_1 = `${uploadDir}/${'fff' + trimmedStr_1}`;

        fs.rename(newFilepath_1, newFilepath, err => err);

        // Update admin photo
        const updatedAdmin = await prisma.admins.update({
          where: { id: id },
          data: { photo: trimmedStr_1 },
        });

      } catch (error) {
        console.log(error, 'error')
      }
    }
    res.status(200).json({});
  });
};

export const manage_update = async (req, res, next) => {
  try {
    let clock = created_at()

    // Admin update
    let id = req.body.id
    let name = req.body.name
    let email = req.body.email
    let phone = req.body.phone
    let medical_center_ids = req.body.medical_center_ids // Array of medical center IDs

    let password = null
    if (req.body.password) {
      password = req.body.password
    }

    // Update admin basic info
    const update1 = await prisma.admins.updateMany({
      where: {
        id: id,
      },
      data: {
        name: name,
        email: email,
        phone: phone,
        ...password ? { password: md5(password) } : {},
      },
    });

    // Update medical center associations if provided
    if (medical_center_ids) {
      // First, remove existing associations
      await prisma.admin_medical_center.deleteMany({
        where: {
          admin_id: id
        }
      })

      // Then create new associations
      if (medical_center_ids.length > 0) {
        const medicalCenterAssociations = medical_center_ids.map(medical_center_id => ({
          admin_id: id,
          medical_center_id: parseInt(medical_center_id)
        }))

        await prisma.admin_medical_center.createMany({
          data: medicalCenterAssociations
        })
      }
    }

    response.update(update1, res)
  } catch (error) {
    response.error(error, res, next)
  }
};

export const manage_remove = async (req, res, next) => {
  try {
    let email = req.body.email

    // First delete the medical center associations
    await prisma.admin_medical_center.deleteMany({
      where: {
        admin: {
          email: email
        }
      }
    })

    // Then delete the admin
    let delete_ = await prisma.admins.delete({
      where: {
        email: email
      },
    })

    response.remove(delete_, res)
  } catch (error) {
    response.error(error, res, next)
  }
};


export const assign_medical_centers = async (req, res, next) => {
  try {
    const { admin_id, medical_center_ids } = req.body;

    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required"
      });
    }

    // Start transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // First, remove existing medical center associations
      await prisma.admin_medical_center.deleteMany({
        where: {
          admin_id: parseInt(admin_id)
        }
      });

      // Then create new associations if medical_center_ids are provided
      if (medical_center_ids && medical_center_ids.length > 0) {
        const medicalCenterAssociations = medical_center_ids.map(medical_center_id => ({
          admin_id: parseInt(admin_id),
          medical_center_id: parseInt(medical_center_id)
        }));

        await prisma.admin_medical_center.createMany({
          data: medicalCenterAssociations
        });
      }

      return { success: true };
    });

    response.create({ message: "Medical centers assigned successfully" }, res);

  } catch (error) {
    console.error('Error assigning medical centers:', error);
    response.error(error, res, next);
  }
};