import { PrismaClient } from '@prisma/client';

import { user_id } from '../middleware/Auth.js';
import { rand } from '../helpers/RandomHash.js';
import { currentTimeValue } from '../helpers/Timer.js';
const prisma = new PrismaClient();
import { created_at,timeBeauty } from '../helpers/Timer.js';

import jwt from "jsonwebtoken";
import md5 from "md5";

import fs from 'node:fs';
import path  from 'path';
import { fileURLToPath } from 'url';
import { IncomingForm } from 'formidable';
import  multer   from 'multer';
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
  
export const illness = async (req, res, next) => {
    try {
        let result=await prisma.injuries.findMany({
            ...response.list_paginate(req)
          })

        response.list(result,res)
    } catch (error) {
        response.error(error,res,next)    
    }
};

/*export const manage_list = async (req, res, next) => {
  try {
    let f_columnFilters = req.body?.filter?.f_columnFilters
    let globalFilter = req.body?.filter?.globalFilter
    let f_globalFilters = req.body?.filter?.f_globalFilters
    let others = req.body?.filter?.others

    // Get medical centers with optional admin association
    let medicalCenters = await prisma.medical_center.findMany({
      ...response.list_paginate(req),
      where: {
        ...f_columnFilters ? { ...f_columnFilters } : {},
        ...globalFilter ? { ...f_globalFilters } : {},
        ...others ? { ...others } : {},
        status: 1
      },
      include: {
        admins: {
          include: {
            admin: {
              include: {
                creator: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        created_admin: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    const result = [];

    for (let medicalCenter of medicalCenters) {
      // Find hospital assistant admin for this medical center
      let hospitalAssistant = medicalCenter.admins.find(amc => 
        amc.admin.role === 'hospitalAssistant'
      )?.admin;

      let logo = medicalCenter.logo || 'default.png';
      
      result.push({
        "id": medicalCenter.id,
        "logo": url.origin + '/api/hospital-manage/image/' + logo,
        "name": medicalCenter.name,
        "address": medicalCenter.address || '',
        "created_by": medicalCenter.created_by,
        "created_at": medicalCenter.created_at ? 
          new Date(medicalCenter.created_at).toISOString().replace('T', ' ').substring(0, 16) : null,
        "updated_at": medicalCenter.updated_at ? 
          new Date(medicalCenter.updated_at).toISOString().replace('T', ' ').substring(0, 16) : null,
        "admin_id": hospitalAssistant ? hospitalAssistant.id : null,
        "admin_name": hospitalAssistant ? hospitalAssistant.name : 'Not Assigned',
        "admin_email": hospitalAssistant ? hospitalAssistant.email : '',
        "admin_password": null,
        "admin_phone": hospitalAssistant ? hospitalAssistant.phone : '',
        "admin_role": hospitalAssistant ? hospitalAssistant.role : '',
        "creator":  '',
        "primary_color": medicalCenter.primary_color || '#009843',
        "sub_color_1": medicalCenter.sub_color_1 || '',
        "sub_color_2": medicalCenter.sub_color_2 || ''
      });
    }

    response.list(result, res);

  } catch (error) {
    response.error(error, res, next);
  }
};*/

export const manage_list = async (req, res, next) => {
  try {
    let f_columnFilters = req.body?.filter?.f_columnFilters
    let globalFilter = req.body?.filter?.globalFilter
    let f_globalFilters = req.body?.filter?.f_globalFilters
    let others = req.body?.filter?.others

    // Get the logged-in user from the request (assuming it's set by auth middleware)
    const loggedInUser = req.user; // Make sure your auth middleware sets req.user
    const userRole = loggedInUser?.role;
    const userId = loggedInUser?.id;

    // Build the base where clause
    let whereClause = {
      ...f_columnFilters ? { ...f_columnFilters } : {},
      ...globalFilter ? { ...f_globalFilters } : {},
      ...others ? { ...others } : {},
      status: 1
    };

    // If user is not admin/superAdmin, get their assigned medical centers and filter by them
    if (userRole !== 'admin' && userRole !== 'superAdmin') {
      // Get medical_center_ids from admin_medical_center table for this user
      const adminMedicalCenters = await prisma.admin_medical_center.findMany({
        where: {
          admin_id: userId
        },
        select: {
          medical_center_id: true
        }
      });

      // Extract medical_center_ids from the result
      const medicalCenterIds = adminMedicalCenters.map(amc => amc.medical_center_id);

      // If user has assigned medical centers, filter by them
      if (medicalCenterIds.length > 0) {
        whereClause.id = {
          in: medicalCenterIds
        };
      } else {
        // If user has no assigned medical centers, return empty result
        whereClause.id = -1; // This will return no results
      }
    }
    // If user is admin/superAdmin, no additional filtering needed

    // Get medical centers with optional admin association
    let medicalCenters = await prisma.medical_center.findMany({
      ...response.list_paginate(req),
      where: whereClause,
      include: {
        admins: {
          include: {
            admin: {
              include: {
                creator: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        created_admin: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    const result = [];

    for (let medicalCenter of medicalCenters) {
      // Find hospital assistant admin for this medical center
      let hospitalAssistant = medicalCenter.admins.find(amc => 
        amc.admin.role === 'hospitalAssistant'
      )?.admin;

      let logo = medicalCenter.logo || 'default.png';
      
      result.push({
        "id": medicalCenter.id,
        "logo": url.origin + '/api/hospital-manage/image/' + logo,
        "name": medicalCenter.name,
        "address": medicalCenter.address || '',
        "created_by": medicalCenter.created_by,
        "created_at": medicalCenter.created_at ? 
          new Date(medicalCenter.created_at).toISOString().replace('T', ' ').substring(0, 16) : null,
        "updated_at": medicalCenter.updated_at ? 
          new Date(medicalCenter.updated_at).toISOString().replace('T', ' ').substring(0, 16) : null,
        "admin_id": hospitalAssistant ? hospitalAssistant.id : null,
        "admin_name": hospitalAssistant ? hospitalAssistant.name : 'Not Assigned',
        "admin_email": hospitalAssistant ? hospitalAssistant.email : '',
        "admin_password": null,
        "admin_phone": hospitalAssistant ? hospitalAssistant.phone : '',
        "admin_role": hospitalAssistant ? hospitalAssistant.role : '',
        "creator": medicalCenter.created_admin ? medicalCenter.created_admin.name : '',
        "primary_color": medicalCenter.primary_color || '#009843',
        "sub_color_1": medicalCenter.sub_color_1 || '',
        "sub_color_2": medicalCenter.sub_color_2 || ''
      });
    }

    response.list({data: result, }, res);

  } catch (error) {
    response.error(error, res, next);
  }
};

////////////////////////////////////////
export const manage_create = async (req, res, next) => {
  try {
      req.body.name = req.body.name
      req.body.email = req.body.email
      req.body.phone = req.body.phone
      req.body.medical_center_ids = req.body.medical_center_ids // Changed from hospital_id to medical_center_ids
      req.body.role = 'staff'
      req.body.created_by = user_id
      req.body.password = req.body.password
      req.body.return = true
      
      let reg = await registration(req, res, next)
      let clock = created_at()
 
      response.create(reg, res)
  } catch (error) {
      response.error(error, res, next)    
  }
};


export const image =   async (req, res, next) => {
  let image = req.params.image
  res.sendFile(path.join(__dirname.replace("\controllers", "") + "./uploads/"+image));
};


export const manage_logo =   async (req, res, next) => {
 
  const uploadDir = path.join(__dirname.replace("\controllers", "") + '/uploads'); 
 
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, '0777', true);
  const customOptions = { uploadDir: uploadDir, keepExtensions: true, allowEmptyFiles: false, maxFileSize: 5 * 1024 * 1024 * 1024, multiples: true };
  const form = new IncomingForm(customOptions);
 // console.log(form)
  let file_count = req.query.counts

  let id=parseInt(req.query.id)

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
        const newFilepath_1 = `${uploadDir}/${'fff'+trimmedStr_1}`;


        //console.log(trimmedStr,trimmedStr_1, 'yyyyyyyyyyy')
        fs.rename(newFilepath_1, newFilepath, err => err);


        //update hospital db
        const updatedHospital = await prisma.medical_center.update({
          where: { id: id },
          data: { logo: trimmedStr_1 },
        });


      } catch (error) {
        console.log(error, 'error')
      }


      //console.log(file.name,'file-'+x.toString())
    }
    res.status(200).json({});
  });
};

export const manage_update = async (req, res, next) => {
  try {
    let clock = created_at()
 
    let id = req.body.id
    let name = req.body.name
    let email = req.body.email
    let phone = req.body.phone
    let medical_center_ids = req.body.medical_center_ids // New field for multiple medical centers

    let password = null
    if(req.body.password){
      password = req.body.password
    }
 
    // Start transaction to update admin and medical center relations
    const result = await prisma.$transaction(async (prisma) => {
      // Update admin basic info
      const updateAdmin = await prisma.admins.update({
        where: { id: id },
        data: {
          name: name,
          email: email,
          phone: phone,
          ...password ? {password: md5(password)} : {},
        },
      });

      // Update medical center relations if provided
      if (medical_center_ids) {
        // Delete existing relations
        await prisma.admin_medical_center.deleteMany({
          where: { admin_id: id }
        });

        // Create new relations
        if (medical_center_ids.length > 0) {
          await prisma.admin_medical_center.createMany({
            data: medical_center_ids.map(mcId => ({
              admin_id: id,
              medical_center_id: mcId
            }))
          });
        }
      }

      return updateAdmin;
    });
 
    response.update(result, res)
  } catch (error) {
    response.error(error, res, next)    
  }
};


export const manage_remove = async (req, res, next) => {
  try {
    let admin_email=req.body.admin_email

    let ddd = await prisma.dpc_generate.deleteMany({
      where: {
        hospital_id: req.body.id 
      },
    })

     


    //remove admin
    let delete_first = await prisma.hospitals.delete({
      where: {
         id: req.body.id 
      },
    })
    
     

    //if success remove hospital
    let  delete_ =null
    if(delete_first){
           delete_ =  await prisma.admins.delete({
          where: {
             email: admin_email 
          },
        })

        

        if(delete_){response.remove(delete_,res)}else{
            //create again
            const newCreate = await prisma.user.create({
              data: {
              ...delete_first
              },
            });
            response.remove([],res)
        }
    }else{


    } 
      
  } catch (error) {
      response.error(error,res,next)    
  }
};


export const manage_medical_center_logo = async (req, res, next) => {
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
        const newFilepath_1 = `${uploadDir}/${'fff'+trimmedStr_1}`;

        fs.rename(newFilepath_1, newFilepath, err => err);

        // Update medical center with logo
        const updatedMedicalCenter = await prisma.medical_center.update({
          where: { id: id },
          data: { logo: trimmedStr_1 },
        });

      } catch (error) {
        console.log(error, 'error')
      }
    }
    res.status(200).json({});
  });
};