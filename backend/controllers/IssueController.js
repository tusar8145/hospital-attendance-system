import { PrismaClient } from '@prisma/client';

import { user_id } from '../middleware/Auth.js';
import { rand } from '../helpers/RandomHash.js';
import { currentTimeValue } from '../helpers/Timer.js';
const prisma = new PrismaClient();
import { created_at, timeBeauty } from '../helpers/Timer.js';

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
//issue

export const post_issue = async (req, res, next) => {
    try {
        const services_clients_issues = await prisma.services_clients_issues.create({
            data: req.body, 
        })

        console.log(req.body,services_clients_issues)

        let rep={
            issue_id: services_clients_issues.id,
            user_id: user_id,
            issue_user_id: user_id,
            link: req.body.link,
            reply: req.body.issue,
            created: req.body.created
          }

          const services_clients_issues_reply = await prisma.services_clients_issues_reply.create({
            data: rep,
        })
  
        response.create(services_clients_issues, res)
    } catch (error) {
        response.error(error, res, next)
    }
};






//issue reply

export const post_issue_reply = async (req, res, next) => {
    try {


        const services_clients_issues = await prisma.services_clients_issues.findUnique({
            where: {
                id: req.body.issue_id,
            },
        })

        var creator = services_clients_issues.creator
        var user_id = req.body.user_id
        var who

        if (creator == user_id) {
            who = 'adm_new'
        } else {
            who = 'mar_new'
        }

        let hh=timeBeauty(created_at())

        const updateUser = await prisma.services_clients_issues.update({
            where: {
                id: req.body.issue_id,
            },
            data: {
                reply: who,
                status_date:hh,
                reply_by:req.body?.user_id
            },
        })



        const services_clients_issues_reply = await prisma.services_clients_issues_reply.createMany({
            data: req.body,
            skipDuplicates: true,
        })

        console.log(req.body)

        res.json({
            success: true,
            who:who,
            creator:creator,
            user_id:user_id,
             result:services_clients_issues_reply,
          })
          

        response.create(services_clients_issues_reply, res)
    } catch (error) {
        response.error(error, res, next)
    }
}


export const get_issue_reply = async (req, res, next) => {

    try {
        //var user_id=req.body.user_id 

        const wallet_transaction = await prisma.services_clients_issues_reply.updateMany({
            where: {

                NOT: [{ user_id: req.body.this_user },
                ],
                AND: [
                    {
                        issue_id: req.body.issue_id,
                    },
                ],


            },
            data: {
                is_seen: 1,

            },
        })


        const result = await prisma.services_clients_issues_reply.findMany(
            {
                orderBy: {
                    id: 'asc',
                },
                where: {
                    issue_id: req.body.issue_id,
                },
                include: {
                    user_: {
                        select: {
                            name: true,
                            id: true,
                            photo:true,
                        }
                    },
                    issue:true

                }
            }
        )
        res.json({
            success: true,
            result:result,
            message: "Operation Successful2", 
          })
        response.list(result, res)
    } catch (error) {
        response.error(error, res, next)
    }
}



export const get_issue = async (req, res, next) => {

    try {
        //var user_id = req.body.user_id
        const result = await prisma.services_clients_issues.findMany(
            {
                orderBy: {
                    id: 'desc',
                },
                where: {
                    //...(user_id > 0 ? { creator: user_id, } : {}),
                    ...(req.body.is_solved != null ? { is_solved: req.body.is_solved, } : {}),
                    ...(req.body.is_seen != null ? { is_seen: req.body.is_seen, } : {}),
                    access_users:{contains:user_id+','.toString()},
                    is_delete: 0,
                },
                include: {
                    creator_: {
                        select: {
                            name: true,
                            id: true,
                        }
                    },
                    reply_by_: {
                        select: {
                            name: true,
                            id: true,
                        }
                    },

  
                        _count: {
                          select: { issues_reply: true },
                        },
             

                },
            }
        )
        res.json({
            success: true,
            result:result,
            message: "Operation Successful2", 
          })
        response.list(result, res)
    } catch (error) {
        response.error(error, res, next)
    }
}



export const update_issues = async (req, res, next) => {


    try {
        const wallet_transaction = await prisma.services_clients_issues.updateMany({
            where: {
                id: req.body.id,
            },
            data: {
                ...(req.body.is_solved ? { is_solved: req.body.is_solved, } : {}),
                ...(req.body.is_seen ? { is_seen: req.body.is_seen, } : {}),
                ...(req.body.reply_by ? { reply_by: req.body.reply_by, } : {}),
                ...(req.body.replied ? { replied: req.body.replied, } : {}),
                ...(req.body.is_delete ? { is_delete: req.body.is_delete, } : {}),

            },
        })
 
        if(req.body.is_delete==1){
            response.delete(wallet_transaction, res)
        }else{
            response.update(wallet_transaction, res)
        }
        
    } catch (error) {
        response.error(error, res, next)
    }
}
