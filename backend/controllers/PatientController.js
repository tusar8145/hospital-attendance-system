import { PrismaClient } from '@prisma/client';

import { user_id } from '../middleware/Auth.js';
import { rand } from '../helpers/RandomHash.js';
import { currentTimeValue } from '../helpers/Timer.js';
const prisma = new PrismaClient();
import { created_at, timeBeauty, timeStable } from '../helpers/Timer.js';

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
import moment from 'moment'; 

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


export const dashboard_count = async (req, res, next) => {



  let d1=timeStable(created_at())
  let d2=timeStable(created_at(2))
  let d3=timeStable(created_at(6))

  console.log(d2,'d2')
  console.log(d3,'d3')

  try {
 
    const total_3_hospitalized_count = await prisma.dpc_generate.count({
      where: {
        hospital_id: req.body?.hospital_id,
        discharge_date: null,
        admission_date_gap: d2,
      }
    });



    const total_7_hospitalized_count = await prisma.dpc_generate.count({
      where: {
        hospital_id: req.body?.hospital_id,
        discharge_date: null,
        admission_date_gap: d3,
      }
    });



    const total_hospitalized_count = await prisma.dpc_generate.count({
      where: {
        hospital_id: req.body?.hospital_id,
        OR:[ 
          {AND:[{NOT:{discharge_date: null}, }, {temp_same_date:0 },]},
          {AND:[{discharge_date: null, }, {temp_same_date:1 },]}
        ],
      }
    });


    const total_discharge_count = await prisma.dpc_generate.count({
      where: {
        hospital_id: req.body?.hospital_id,
        discharge_date: {
          not: null,
        },
        temp_same_date:1
      }
    });

    const total_verified_count = await prisma.dpc_generate.count({
      where: {
        hospital_id: req.body?.hospital_id,
        temp_is_changed:1,
      }
    });



    let result_ = {
      total_3_hospitalized_count: total_3_hospitalized_count,
      total_7_hospitalized_count: total_7_hospitalized_count,
      total_hospitalized_count: total_hospitalized_count,
      total_discharge_count: total_discharge_count,
      total_verified_count:total_verified_count
    }



    response.list(result_, res)

  } catch (error) {
    response.error(error, res, next)
  }
};



export const dpc_create = async (req, res, next) => {
  try {

  
  function calculateAge(birthdate, patient_code) {
      if (!birthdate) {
          throw new Error('Birthdate is required');
      }
  
      const birthDateObj = new Date(birthdate);
      const today = new Date();
      
      // Validate the birthdate
      if (isNaN(birthDateObj.getTime())) {
          throw new Error('Invalid birthdate format. Patient:')+patient_code;
      }
      
      const yearDifference = today.getFullYear() - birthDateObj.getFullYear();
      const monthDifference = today.getMonth() - birthDateObj.getMonth();
      const dayDifference = today.getDate() - birthDateObj.getDate();
  
      // Calculate age in full years and fractional part
      let age = yearDifference;
      if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
          age--;
      }
  
      // Calculate fractional part
      const totalDaysInYear = 365.25; // Average year length accounting for leap years
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysPastLastBirthday = (today.getMonth() - birthDateObj.getMonth()) * daysInMonth + dayDifference;
  
      const fractionOfYear = daysPastLastBirthday / totalDaysInYear;
  
      return age + fractionOfYear;
  }


  function removeDuplicates(arr) {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
  }

  function calculateHospitalizationDays(admissionDate, dischargeDate) {
    const admission = new Date(admissionDate);
    const discharge = new Date(dischargeDate);
    const differenceInTime = discharge.getTime() - admission.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return differenceInDays;
  }

  function code_filter(code_arr,first_items,index_start,index_end){   
    let col_sur_1=[]
    
    for (let i=0; i<code_arr.length; i++){
        let item=code_arr[i]
        let item_10=item.substring(index_start, index_end)

        //console.log('item_10=',item_10, ' first_items=',first_items)
        
        if(item_10.toUpperCase()==first_items.toUpperCase()){
            let sur_1=item.substring(index_end, index_end+1)
            col_sur_1.push(sur_1)
        }
    }
    return col_sur_1
  }

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
  
    return `${year}/${month}/${day}`;
  }


  function excelSL(serial){
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
  
    const fractionalDay = serial - Math.floor(serial) + 0.0000001;
  
    let totalSeconds = Math.floor(86400 * fractionalDay);
  
    let seconds = totalSeconds % 60;
  
    totalSeconds -= seconds;
  
    let hours = Math.floor(totalSeconds / (60 * 60));
    let minutes = Math.floor(totalSeconds / 60) % 60;   

    var year    = dateInfo.getFullYear()  
    var month   = dateInfo.getMonth()+1
    var day     = dateInfo.getDate()

    if(month.toString().length == 1) {
        month = '0'+month;
   }
   if(day.toString().length == 1) {
        day = '0'+day;
   }   

    return  year+'/'+month+'/'+day;
  }


  function dateToExcelSerial(date) {
    // Excel's start date (January 1, 1900)
    const excelStartDate = new Date(Date.UTC(1900, 0, 1));
    
    // Calculate the difference in milliseconds
    const diffInMillis = date - excelStartDate;
    
    // Convert milliseconds to days (1 day = 24 * 60 * 60 * 1000 milliseconds)
    const diffInDays = Math.floor(diffInMillis / (24 * 60 * 60 * 1000));
    
    // Excel serial number starts from 1 for January 1, 1900
    return diffInDays + 2; // Adding 2 because January 1, 1900 is serial number 1, and there is a leap year bug (Feb 29, 1900)
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }


    let req_data_all = req.body
 

    for (let x = 0; x < req_data_all.length; x++) {

      let color_obj=[]
      let hospitalization_days = null
      let gap_treatment = 0
      let remember_k=null
      let remember_recpt=[]
      let remember_k_value=null
      let non_97_k_corres=null

      //incomming
      let first_loop_collect = req_data_all[x].first_loop_collect
      if(!first_loop_collect.patient_code){ response.create([], res) }

      let admissionDate = first_loop_collect?.admission_date;
      let dischargeDate = first_loop_collect?.discharge_date;
      let treatmentDate = first_loop_collect?.treatment_date

      let receipt_obj = req_data_all[x].receipt_obj
      let items_obj = req_data_all[x].items_obj
      let amount_obj = req_data_all[x].amount_obj
      let doctor_obj = req_data_all[x].doctor_obj
      let date_obj = req_data_all[x].date_obj
      let dept_obj = req_data_all[x].dept_obj
      let disease_obj = req_data_all[x].disease_obj
      let treno_obj = req_data_all[x].treno_obj
      let icd_obj = req_data_all[x].icd_obj
      

      let icd = first_loop_collect.icd_code



      //declar
      let dpc_6 = ""
      let and_1 = "X"
      let age_1 = "X"
      let sur_2 = "99"  
      let tre1_1 = ""
      let tre2_1 = ""
      let sec_1 = ""
      let sco_1 = ""


      //surgery special
 

      //Query + hospitalization_days
      if (admissionDate && dischargeDate) {
        hospitalization_days = calculateHospitalizationDays(admissionDate, dischargeDate).toString()
      } else if (admissionDate && treatmentDate) {
        hospitalization_days = calculateHospitalizationDays(admissionDate, treatmentDate).toString()
      }


      //Query 1 icd -> dpc
      let dpc = await prisma.icd_dpc.findMany({
        where: {
          icd: icd ,
        },
      })

      if(dpc?.length>0){
        dpc_6 = dpc[0].dpc
      }else{
          let search = icd
          for (let j = 0; j < icd.length - 1; j++) {
            search = search.slice(0, -1);
            let dpc = await prisma.icd_dpc.findMany({
              where: {
                icd: { contains: search },
              },
            })
            if (dpc.length > 0) {
              dpc_6 = dpc[0].dpc
              j = icd.length - 2
            }
          }        
      }

        let same_code_calculation=0
      //check same patient withing 7 days
      const last_same_patient = await prisma.dpc_generate.findMany({
        where: {
          patient_code: first_loop_collect.patient_code,
          hospital_id:first_loop_collect.hospital_id
          //NOT: { discharge_date: null },
          //NOT: { admission_date: first_loop_collect?.admission_date }
        },
        orderBy: {
          id: 'desc',
        },
        take: 1,
        select: {  
          id: true,          
          admission_date:true,
          discharge_date:true,
        }})

        if(last_same_patient?.length>0){

          // for patient already discharged
          if(last_same_patient[0].discharge_date){
            let diss_new=calculateHospitalizationDays(last_same_patient[0].discharge_date, first_loop_collect?.admission_date)
            if(diss_new<7){same_code_calculation=1}
          }else{
            //continuous patient
            same_code_calculation=1
          }
 
          //console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', last_same_patient, diss_new)
       
        }




      let uid_ = first_loop_collect.patient_code.toString() + '' + first_loop_collect?.admission_date.replaceAll("/", "") + '' + first_loop_collect.hospital_id.toString()
      //let uid_ = dpc_6 +''+ first_loop_collect.patient_code.toString() + '' + first_loop_collect.hospital_id.toString()
      let uid = parseInt(uid_)

      
      //search for old
      let ufind_ = null

      if(same_code_calculation==1){
            ufind_=await prisma.dpc_generate.findUnique({
              where: {
                id: last_same_patient[0].id,
              },
              select: {
                id: true,
                dpc_6: true,
                and_1: true,
                age_1: true,
                sur_2: true,
                tre1_1: true,
                tre2_1: true,
                sec_1: true,
                sco_1: true,

                s_dpc_6: true,
                s_and_1: true,
                s_age_1: true,
                s_sur_2: true,
                s_tre1_1: true,
                s_tre2_1: true,
                s_sec_1: true,
                s_sco_1: true,

                arr_doctor: true,
                arr_receipt: true,
                arr_date: true,
                arr_name: true,
                arr_amount: true,
                arr_dept: true,
                arr_disease: true,
                arr_treno:true,
                arr_icd:true,
                arr_color:true,
                admission_date:true,
                discharge_date:true,
                is_verified:true,
              }
            })
      }

 
        let k_arr_doctor=[]
        let k_arr_receipt=[]
        let k_arr_date=[]
        let k_arr_name=[]
        let k_arr_amount=[]
        let k_arr_dept=[]
        let k_arr_disease=[]
        let k_arr_treno=[]
        let k_arr_icd=[]




      if(ufind_){
        admissionDate=ufind_.admission_date
        dischargeDate = ufind_.discharge_date;

        k_arr_doctor=JSON.parse(ufind_.arr_doctor)
        k_arr_receipt=JSON.parse(ufind_.arr_receipt)
        k_arr_date=JSON.parse(ufind_.arr_date)
        k_arr_name=JSON.parse(ufind_.arr_name)
        k_arr_amount=JSON.parse(ufind_.arr_amount)
        k_arr_dept=JSON.parse(ufind_.arr_dept)
        k_arr_disease=JSON.parse(ufind_.arr_disease)
        k_arr_treno=JSON.parse(ufind_.arr_treno)
        k_arr_icd=JSON.parse(ufind_.arr_icd)
      }


      let j_arr_doctor=k_arr_doctor.concat(doctor_obj); 
      let j_arr_receipt=k_arr_receipt.concat(receipt_obj);  
      let j_arr_date= k_arr_date.concat(date_obj);  
      let j_arr_name= k_arr_name.concat(items_obj);  
      let j_arr_amount= k_arr_amount.concat(amount_obj);  
      let j_arr_dept= k_arr_dept.concat(dept_obj);  
      let j_arr_disease= k_arr_disease.concat(disease_obj);  
      let j_arr_treno= k_arr_treno.concat(treno_obj);  
      let j_arr_icd= k_arr_icd.concat(icd_obj);  
 

        let new_arr_doctor=[]
        let new_arr_receipt=[]
        let new_arr_date=[]
        let new_arr_name=[]
        let new_arr_amount=[]
        let new_arr_dept=[]
        let new_arr_disease=[]
        let new_arr_treno=[]
        let new_arr_icd=[]


        let trackOld = []
        {
          j_arr_date.map((date, index) => {
              let temp = j_arr_doctor[index] + '' + j_arr_receipt[index] + '' + date + '' + j_arr_name[index] + '' + j_arr_amount[index] + '' + j_arr_dept[index] + '' + j_arr_disease[index] + '' + j_arr_treno[index] + '' + j_arr_icd[index]

              if (trackOld.includes(temp)) {
                  // console.log(temp,'temp')

              } else {
                new_arr_doctor.push(j_arr_doctor[index])
                new_arr_receipt.push(j_arr_receipt[index])
                new_arr_date.push(date)
                new_arr_name.push(j_arr_name[index])
                new_arr_amount.push(j_arr_amount[index])
                new_arr_dept.push(j_arr_dept[index])
                new_arr_disease.push(j_arr_disease[index])
                new_arr_treno.push(j_arr_treno[index])
                new_arr_icd.push(j_arr_icd[index])
                trackOld.push(temp)
              }
          }
          )
        }



        receipt_obj = new_arr_receipt
        items_obj = new_arr_name
        amount_obj = new_arr_amount
        doctor_obj = new_arr_doctor
        date_obj = new_arr_date
        dept_obj = new_arr_dept
        disease_obj = new_arr_disease
        treno_obj = new_arr_treno
        icd_obj = new_arr_icd

        

let startDate = new Date(admissionDate); //
let endDate = new Date(excelSL(date_obj[date_obj.length - 1])); //

 console.log('start=',admissionDate, 'end=',excelSL(date_obj[date_obj.length - 1]), 'date obj=',date_obj,' endDateExcel='+endDate, ' '+date_obj[date_obj.length - 1] )
 // Loop from startDate to endDate


for (let date = new Date(addDays(startDate,1)); date <= addDays(endDate,1); date.setDate(date.getDate() + 1)) {
    console.log('org=', date, 'calculated=',excelSL(dateToExcelSerial(date)) )
    if(date_obj.includes(dateToExcelSerial(date))){
       console.log('------------ok1',dateToExcelSerial(date),' dis ', dischargeDate )
    }else{
 
      //const date1 = moment(date);
      //const date2 = moment(dischargeDate);
      //console.log('======================================================',date1,date2)
      // Difference in days
      //const diffDays = date2.diff(date1, 'days');
 
      //console.log(' = date / dis ', new Date(date), new Date(dischargeDate),  dischargeDate, diffDays )
      if (new Date(date) <= new Date(addDays(dischargeDate,1))) {
          console.log('------------ok2',dateToExcelSerial(date),' dis ',  dischargeDate )
      }else{
          console.log('------------no3',dateToExcelSerial(date),)
          gap_treatment++ 
      }
    }
}

console.log('gap_treatment',gap_treatment)


if(dischargeDate){
   let latest_date=date_obj[date_obj?.length-1]

    let date_latest=excelSL(latest_date)

    const x = new Date(date_latest);
    const y = new Date(dischargeDate);

    console.log('vvvvvv',date_latest,dischargeDate)

    if(x>y){
      
    }else{
      gap_treatment=0
    }

  }else{
    gap_treatment=0
  }

 





let admissionDateGap =  formatDate(addDays(admissionDate, gap_treatment));
let temp_same_date =0
if(admissionDateGap==admissionDate){temp_same_date=1}else{
  temp_same_date=0
}
  //console.log(gap_treatment, admissionDateGap,'gap_treatment')
 
 
      let dpc_disease_classi = await prisma.dpc_disease_classi.findMany({
        where: {
          dpc_6: dpc_6,
        },
        select:{
          and_1:true,
          age_1:true,
          sur_2:true,
          tre1_1:true,
          tre2_1:true,
          sec_1:true,
          sco_1:true,
          codes:true
         }
      })

 
      //Query Layer 3
      let temp_tre1_1 = 'X'
      let temp_tre2_1 = 'X'
      let temp_sec_1 = 'X'
      let temp_sco_1 = 'X'
      
      
      ////////////////////////////////////////////////////////////////////////////////////////////////

      //have multi code feature?
      let haveMultiT2  = await prisma.treatment_2.findMany({
        where: {
          AND: [
            { recept_main: {contains:'+'}},
            { dpc_6digit: dpc_6 }
          ]
        },
        select:{
          corres_code:true,
          recept_main:true
        }
      })

      console.log('<<<<<<<<<<>>>>>>>>>>>>>xyz', haveMultiT2)

      
      let resultString = haveMultiT2
      .map(item => `${item.recept_main}=${item.corres_code}`)
      .join(',');

      let resultStringCarry=resultString

      console.log('<<<<<<<<<<>>>>>>>>>>>>>x', resultString)

      let mul_tre_2_collector=[]

      let batch_treatment_2_holder=[]


      let multi_treatment_1_remember_rec=null
      let multi_treatment_1_remember_corres=null
      let multi_treatment_1_remember_clr=null


      let surgery_final_remember_clr=null
      let surgery_final_remember_corres=null
      let surgery_final_k_code_2_remember_recept=null
      let surgery_final_k_code_3_remember_recept=null


      for (let m = 0; m < receipt_obj.length; m++) {
        let item_receipt_obj = receipt_obj[m]
        let clr = 'black'


        if (item_receipt_obj) {

          item_receipt_obj=parseInt(item_receipt_obj)

///////////////////////////////////////// new surgery
            let have_allk=0
              let find_ = await prisma.surgery.findMany({
                where: { 
                  recept_main: item_receipt_obj,
                },
              })

             

              if (find_.length > 0) {

              }else{
                //find on all key
                find_ = await prisma.surgery_k.findMany({
                  where: { 
                    receipt: item_receipt_obj,
                  },

                })

                if (find_.length > 0) {
                  have_allk=1
                }
  

              }





              if (find_.length > 0) {
                    //found t1

                    if(have_allk==0){  //main surgery
                        let have_dpc=0

                        let satisfy=[]
                        let temp_carry=''
                        let collectRowSurgery=[]
                        for(let x=0; x<find_.length; x++){
                          if(dpc_6==find_[x].dpc){
                              sur_2 = find_[x].code.toString()
                              clr = 'Purple? '+sur_2+'  '+find_[x].k_code+ ' [手術]'
                              temp_carry=sur_2+'  '+find_[x].k_code
                              have_dpc=1
                              satisfy=find_[x]
                              collectRowSurgery.push(find_[x])
                          }
                        }


                        //special case
                        let final_surgery=null
                        let final_k_code_2=null
                        let final_k_code_3=null
                        let final_recept_main_2=null
                        let final_recept_main_3=null              	
	
	
	
                        if(collectRowSurgery?.length>1){
                          console.log(collectRowSurgery,'collectRowSurgery')
                          //check which is appropriate
                            for(let z=0; z<collectRowSurgery?.length; z++){
                              let itemx=collectRowSurgery[z]
                               
                              console.log('cccccccccc1111final_surgery',itemx.recept_main_2,itemx.recept_main_3 )

                              let flag_recept_main_2=0
                              let flag_recept_main_3=0
                              if(itemx.recept_main_2){
                                //check must have 
                                  for (let x = 0; x < receipt_obj.length; x++) {
                                    if(receipt_obj[x]==itemx.recept_main_2){
                                      flag_recept_main_2=1
                                    }
                                  }
                              }
                              if(itemx.recept_main_3){
                                //check must have 
                                for (let x = 0; x < receipt_obj.length; x++) {
                                  if(receipt_obj[x]==itemx.recept_main_3){
                                    flag_recept_main_3=1
                                  }
                                }
                              }

                              console.log('cccccccccc1111final_surgeryflag_recept_main_3',flag_recept_main_2,flag_recept_main_3)
                              

                              if(itemx.recept_main_2 && itemx.recept_main_3){
                                if(flag_recept_main_2==1 && flag_recept_main_3==1){
                                  final_surgery=itemx.code
                                }
                              }else if(itemx.recept_main_2){ //here
                                if(flag_recept_main_2==1){
                                  final_surgery=itemx.code
                                  final_k_code_2=itemx.k_code_2
                                  final_recept_main_2=itemx.recept_main_2   
                                }
                              }else if(itemx.recept_main_3){
                                if(flag_recept_main_3==1){
                                  final_surgery=itemx.code
                                  final_k_code_3=itemx.k_code_3
                                  final_recept_main_3=itemx.recept_main_3   
                                }
                              }else{
                                final_surgery=itemx.code
                              }
                            }
                            console.log('cccccccccc1111final_surgeryfinal_surgery',final_surgery)

                        }

                        console.log('cccccccccccccccccccccccccc',final_surgery, final_k_code_2, final_recept_main_2)


                        if(final_surgery!=null){
                          let yy =clr.split(' ')
                          let newclr=''
                          for(let c=0; c<yy?.length; c++){
                                if (c==1){
                                  newclr=newclr+' '+final_surgery
                                }else{
                                  newclr= newclr+' '+yy[c]
                                }
                          }
                          clr = newclr
                          sur_2=final_surgery
                        }


                        if(final_k_code_2){
                          clr=clr.split(' [手術]')[0]+'+'+final_k_code_2+'  [手術]'
                          surgery_final_remember_clr=clr
                          surgery_final_remember_corres=sur_2
                          surgery_final_k_code_2_remember_recept=final_recept_main_2                 
                        }

                        if(final_k_code_3){
                          clr=clr.split(' [手術]')[0]+'+'+final_k_code_2+'+'+final_k_code_3+'  [手術]'
                          surgery_final_remember_clr=clr
                          surgery_final_remember_corres=sur_2
                          surgery_final_k_code_2_remember_recept=final_recept_main_2  
                          surgery_final_k_code_3_remember_recept=final_recept_main_3
                        }


                        //check all satisfy
                        console.log('cccccccccc1111final_surgery',final_surgery) 

                        let satisfy_allow=1
                        let but2=''
                        let but3=''
                        
                        if(satisfy?.k_code_2){
                          //rule k_code_2
                          if(satisfy?.recept_main_2){
                            let temp1=0
                            for (let x = 0; x < receipt_obj.length; x++) {
                              if(receipt_obj[x]==satisfy.recept_main_2){
                                temp1=1
                                but2=' + '+satisfy.k_code_2
                                remember_recpt.push(receipt_obj[x])
                              }
                            }
                            if(temp1==0){satisfy_allow=0} 
                          }

                          //rule k_code_3
                          if(satisfy?.recept_main_3){
                            let temp1=0
                            for (let x = 0; x < receipt_obj.length; x++) {
                              if(receipt_obj[x]==satisfy.recept_main_3){
                                temp1=1
                                but3=' + '+satisfy.k_code_3
                                remember_recpt.push(receipt_obj[x])
                              }
                            }
                            if(temp1==0){satisfy_allow=0}
                          }

                          if(satisfy_allow==1){  clr = 'Purple? '+temp_carry+but2+but3+ ' [手術]'; 
                            remember_k= clr
                            remember_k_value=sur_2
                            console.log('xweeeeee',remember_k)
                          
                          }
                        }

                        
                        
    
                        if (have_dpc == 0) {
                          sur_2 = '97'
                          clr = 'Purple?  97 KKK1 [手術]'
                        }
                        
                        if(surgery_final_k_code_2_remember_recept==item_receipt_obj){
                          sur_2 = surgery_final_remember_corres
                          clr = surgery_final_remember_clr
                        }
                        if(surgery_final_k_code_3_remember_recept==item_receipt_obj){
                          sur_2 = surgery_final_remember_corres
                          clr = surgery_final_remember_clr
                        }

                    //multiple surgery 2









                    }else{
                      //have_allk==1
                              sur_2 = '97'
                              clr = 'Purple? '+sur_2+'  '+find_[0].k_code+ ' [手術]'
                    }

 

                 if (remember_recpt.includes(item_receipt_obj)) {
                      // found element
                      sur_2=remember_k_value
                      clr=remember_k
                  }

                  if(sur_2 != '97'){  non_97_k_corres=sur_2  }

                  
                  //final surgery
                  if(sur_2 == '97'){
                    if(non_97_k_corres){
                      sur_2 = non_97_k_corres
                    }
                  }




                                    //same code reffer as treatment 2 and surgery code----------------------------- 
                                    //also seaarch on treatment 1
                                    find_ = await prisma.treatment_1.findMany({
                                      where: {
                                        AND: [
                                          { recept_main: item_receipt_obj },
                                          { dpc_6digit: dpc_6 }
                                        ]
                                      },
                                    })

                                    if (find_.length > 0) {
                                      if(dpc_disease_classi?.length>0){ 
                                      }
                                      //found t1
                                      temp_tre1_1 = find_[0].corres_code.toString()
                                     // clr = clr+' | '+
                                      let t1_carry=temp_tre1_1+' '+find_[0].k_code	+ ' [処置1]'

                                      let code_arr=dpc_disease_classi[0]?.codes.split(",")
                                      let col_sur_2xx = code_filter(code_arr,dpc_6+and_1+age_1+sur_2,0,10)
                                      col_sur_2xx=removeDuplicates(col_sur_2xx);
                                      let accepted=false
                                      for(let x=0; x<find_?.length; x++){
                                        if(accepted==false){
                                            let this_temp_tre1_1 = find_[x].corres_code.toString()

                                            if(col_sur_2xx.includes(this_temp_tre1_1)){
                                              temp_tre1_1=this_temp_tre1_1
                                              //clr = clr+' | '+
                                              t1_carry=temp_tre1_1+' '+find_[x].k_code	+ ' [処置1]'
                                              //console.log('fund',this_temp_tre1_1)
                                              //accepted=true
                                            }                                        
                                        }
                                      }
                                      clr = clr+' ↪︎ '+t1_carry
                                    }



                    //need validate
              }




////////////////////////////////////////


              else{   //start treatment 1------------------------------------------------
                      find_ = await prisma.treatment_1.findMany({
                      where: {
                        AND: [
                          { recept_main: item_receipt_obj },
                          { dpc_6digit: dpc_6 }
                        ]
                      },
                    })



                    if(multi_treatment_1_remember_rec==item_receipt_obj){
                          temp_tre1_1 = multi_treatment_1_remember_corres
                          clr = multi_treatment_1_remember_clr
                    }

                    if (find_.length > 0) {  //treatment 1 conditions -------------------
                      

                                    if(dpc_disease_classi?.length>0){
                                          
                                    }
                                    //found t1
                                    temp_tre1_1 = find_[0].corres_code.toString()
                                    clr = 'Blue? '+temp_tre1_1+' '+find_[0].k_code	+ ' [処置1]'


                                    let code_arr=dpc_disease_classi[0]?.codes.split(",")
                                   
                                    let col_sur_2xx = code_filter(code_arr,dpc_6+and_1+age_1+sur_2,0,10)        
                                    col_sur_2xx=removeDuplicates(col_sur_2xx);

                                    // console.log(temp_tre1_1,col_sur_2xx,'code_arr')

                                    let accepted = false
                                    for (let x = 0; x < find_?.length; x++) {
                                      if (accepted == false) {
                                        let this_temp_tre1_1 = find_[x].corres_code.toString()

                                        //console.log('<======',col_sur_2xx,this_temp_tre1_1,'========>')

                                        if (col_sur_2xx.includes(this_temp_tre1_1)) {
                                          temp_tre1_1 = this_temp_tre1_1
                                          clr = 'Blue? ' + temp_tre1_1 + ' ' + find_[x].k_code + ' [処置1]'
                                          //console.log('fund',this_temp_tre1_1)
                                          //accepted=true
                                        }
                                      }
                                    }
 
                                    //need validate

                                    //have receipt 2?????????



                                    let recept_main_2=[]
                                    for (let y = 0; y < find_?.length; y++) {
                                          if(find_[y].k_code_2){
                                              recept_main_2.push(find_[y].recept_main_2)
                                          }
                                    }


                                    for (let y = 0; y < find_?.length; y++) {
                                      if (find_[y].k_code_2) {
                                        for (let x = 0; x < receipt_obj.length; x++) {
                                          if (recept_main_2.includes(receipt_obj[x].toString())) {
                                              //multi_treatment_1_remember.push(receipt_obj[x])
                                              temp_tre1_1 = find_[y].corres_code
                                              clr = 'Blue? ' + temp_tre1_1 + ' ' + find_[y].k_code + '+' + find_[y].k_code_2 + ' [処置1]'
                                              multi_treatment_1_remember_rec=parseInt(receipt_obj[x])
                                              multi_treatment_1_remember_clr=clr
                                              multi_treatment_1_remember_corres=temp_tre1_1
                                          }
                                        }
                                      }
                                    }






                              



                                    

                      

                    } else {
 
                      let itmx = items_obj[m]

                      let find_ = null

                      if (itmx) {
                        find_ = await prisma.treatment_2.findMany({
                          where: {
                            AND: [
                              { recept_main: item_receipt_obj.toString() },
                              { dpc_6digit: dpc_6 }
                            ]

                          },
                        })
                      }

                      if (find_?.length > 0) {



                        //new
                        for(let h=0; h<find_?.length; h++){
                          //if(find_[h].corres_code=="" ){
                            let batch=find_[h]?.code

                            if(batch=='0264' && h==0){
                              batch_treatment_2_holder.push(item_receipt_obj)
                            }

                            resultString = resultString.replaceAll(batch,'');
                          //}
                        }

                        //found t2
                        temp_tre2_1 = find_[0].corres_code.toString()
                        clr = 'Brown? '+temp_tre2_1+' '+find_[0].code+ ' [処置2]'
                        mul_tre_2_collector.push(temp_tre2_1)
                      } else {//secondary injury
                       
                                if (item_receipt_obj) {

                                  let itm = item_receipt_obj.toString()

                                  let find_ = await prisma.secondary_injury_new.findMany({
                                    where: {
                                      dpc_6: dpc_6,
                                      codes: { contains: itm },

                                    },
                                  })

                                  if (find_?.length > 0) {

                                    let f_val = ""
                                    try {
                                      let arr_t1 = find_[0].codes.split(itm)
                                      let arr_t2 = arr_t1[0].split('#')
                                      f_val = arr_t2[arr_t2.length - 1].split(',')[0]
                                    } catch (error) {

                                    }

                                    //found t3
                                    clr = 'Green? 1 ' + f_val + '  [副傷病]'
                                    temp_sec_1 = '1'
                                  } else {

                                  }
                                }
                      }
                    }                
              }


        }

        color_obj.push(clr)
      }



       
      //static rule
      if (batch_treatment_2_holder?.length > 0) {
        /*batch_treatment_2_holder = batch_treatment_2_holder.filter(function (item, pos) {
          return batch_treatment_2_holder.indexOf(item) == pos;
        })*/

        if(batch_treatment_2_holder?.length > 1){
          let clrx=   'Brown? 2 0264×'+batch_treatment_2_holder.length+' [処置2]'
          temp_tre2_1='2'
          mul_tre_2_collector.push(temp_tre2_1)
          //modify clr 
                    let tempg = []
                      for (let g = 0; g < color_obj?.length; g++) {
                        let item_now = color_obj[g]
                        const substring = "0264 [処置2]";
                        if (item_now.includes(substring)) {
                           item_now=clrx
                        }
                      tempg.push(item_now)
                      }
                      color_obj = tempg
        }
        console.log(batch_treatment_2_holder, 'batch_treatment_2_holder')
      }



  let this_res_str=null
  let temp_arrr=resultString.split(',')
  let myarrayok=resultStringCarry.split(',')

      if (resultString) {
        for (let x = 0; x < temp_arrr?.length; x++) {
          let temp_arrr_first = temp_arrr[x].split('=')
          this_res_str=myarrayok[x]
          let have_res = 1
          let temp_arrr_second = temp_arrr_first[0].split('+')
          for (let y = 0; y < temp_arrr_second?.length; y++) {
            let itm = temp_arrr_second[y]
            if (itm > 0) { have_res = 0 }
          }
          if (have_res == 1) {
            temp_tre2_1 = temp_arrr_first[1]
            mul_tre_2_collector.push(temp_tre2_1)
                        //resultStringCarry
                        let tempg = []

                        for (let g = 0; g < color_obj?.length; g++) {

                          let item_now = color_obj[g]

                          const substring = "[処置2]";

                          console.log('jhbgdfjgh', resultStringCarry, this_res_str)

                          let resultStringCarryArray = this_res_str.split('=')

                          if (item_now.includes(substring)) {
                            //treatment 2 file
                            if (resultStringCarryArray?.length > 0) {
                              let firstpart = resultStringCarryArray[0]
                              let resultStringCarryfirstpartArray = firstpart.split('+')

                              for (let k = 0; k < resultStringCarryfirstpartArray?.length; k++) {
                                let getfirst = resultStringCarryfirstpartArray[k]

                                console.log('------------------p', getfirst)

                                if (item_now.includes(getfirst + ' [処置2]')) { 

                                  item_now='Brown? '+resultStringCarryArray[1]+' '+resultStringCarryArray[0]+' [処置2]'
                                  
                                }
                                
                              }                            
                            }
                          }


                        tempg.push(item_now)
                        }

                        color_obj = tempg

          }
        }
      }

  
      

      //////////////////////////////////////////////////////////////////////////////

      if(dpc_disease_classi?.length>0){
        let dpc_disease_classi_first=dpc_disease_classi[0]
        if(dpc_disease_classi_first.sur_2.split(",").includes(sur_2)==true){  }else{   sur_2="XX" 
         // console.log(dpc_disease_classi_first.sur_2)
                  if(dpc_disease_classi_first.sur_2.split(",").includes("xx")==true){
                      //console.log('x1=',dpc_disease_classi_first.sur_2)
                    }else{ 
                      //console.log('x2=',dpc_disease_classi_first.sur_2)
                         sur_2="99" 
                    }  
 
         } //

      //check have 99 surgery for that dpc      

        //age hisab

        const age = calculateAge(first_loop_collect?.date_of_birth, first_loop_collect.patient_code);

   

        let Arr_and_1 = dpc_disease_classi_first.and_1.split(",")
        let Arr_age_1 = dpc_disease_classi_first.age_1.split(",")

        if(Arr_and_1?.length==1){ //always x
          //default value X
        }else if(Arr_and_1?.length>1){   
           /*for(let c=0; c<Arr_and_1.length;c++){
             let temp1=Arr_and_1[c]
             if(temp1=='0'){
                //dependency
             }else if(temp1=='1'){
               if (age < 15 ) { and_1 = "1" }
             }else if(temp1=='2'){
               if (age >= 15 && age < 165 ) { and_1 = "2" }
             }
           }*/
          //client req
          and_1='0'

        } 

 
        if(Arr_age_1?.length==1){//always x
         //default value X
        }else if(Arr_age_1?.length>1){  
          
          
          for(let c=0; c<Arr_age_1.length;c++){
              let temp1=Arr_age_1[c]

              if(dpc_6=='010020' || dpc_6=='010040'){
                age_1 = "0"
              }else if(dpc_6=='060160'){

                if(temp1=='1'){  if (age < 15) { age_1 = "1" }    }else if(temp1=='0'){   if (age > 15) { age_1 = "0" }   }
                
              }else if(dpc_6=='180010' || dpc_6=='14031x'){

                if(temp1=='1'){  if (age < 1) { age_1 = "1" }    }else if(temp1=='0'){   if (age > 1) { age_1 = "0" }   }
                
              }else if(dpc_6=='130110'){
              
                if(temp1=='1'){  if (age < 1) { age_1 = "1" }    }else if(temp1=='0'){   if (age > 1) { age_1 = "0" }   }

              }else if(dpc_6=='150070'){
                if(temp1=='1'){  if (age < 2) { age_1 = "1" }    }else if(temp1=='0'){   if (age > 2) { age_1 = "0" }   }
              } else if(dpc_6=='040080'){
 
                if(temp1=='0'){
                    if (age < 1) { age_1 = "0" } 
                }else if(temp1=='1'){
                  if (age >= 1 && age < 15 ) { age_1 = "1" }
                }else if(temp1=='2'){
                  if (age >= 15 && age < 65 ) { age_1 = "2" }
                }else if(temp1=='3'){
                  if (age >= 65 && age < 75 ) { age_1 = "3" }
                }else if(temp1=='4'){
                  if (age >= 75 && age < 150 ) { age_1 = "4" }
                }
              }
          }
        } 

        let code_arr=dpc_disease_classi_first.codes.split(",")
 
        //////////////////////////////////////////////////////////// 

        let col_and_1 = code_filter(code_arr,dpc_6,0,6)
          //validate
            if(col_and_1.includes(and_1)){
              //console.log('found here')
              
            }else{
              if(col_and_1.includes('0')){
                and_1='0'
              }else {
                and_1=col_and_1[0]
              }
            }
    
            let col_age_1 = code_filter(code_arr,dpc_6+''+and_1,0,7)
            //validate
              if(col_age_1.includes(age_1)){
                //console.log('found here')
                
              }else{
                  age_1=col_age_1[0]
              }
              ///////////////////////////////////////////////////////////////////////

        let col_sur_1 = code_filter(code_arr,dpc_6+''+and_1+''+age_1+''+sur_2,0,10)
   
        if(temp_tre1_1=='X'){ //no surgery 1 value
            if(col_sur_1.includes('0')){
              temp_tre1_1='0'
            }else if(col_sur_1.includes('x')){
              temp_tre1_1='X'
            }
        }else{
          //validate
            if(col_sur_1.includes(temp_tre1_1)){
              //console.log('found here')
              
            }else{
              if(col_sur_1.includes('0')){
                temp_tre1_1='0'
              }else if(col_sur_1.includes('x')){
                temp_tre1_1='X'
              }
            }
        }

        /////////////////////////////////////////////////////////////
        let col_sur_2 = code_filter(code_arr,dpc_6+and_1+age_1+sur_2+temp_tre1_1,0,11)
        
        if(temp_tre2_1=='X'){ //no surgery 1 value
            if(col_sur_2.includes('0')){
              temp_tre2_1='0'
            }else if(col_sur_2.includes('x')){
              temp_tre2_1='X'
            }
        }else{
          //validate
          if(col_sur_2.includes(temp_tre2_1)){
              
          }else{
            if(col_sur_2.includes('0')){
              temp_tre2_1='0'
            }else if(col_sur_2.includes('x')){
              temp_tre2_1='X'
            }
          }
        }

        //console.log(temp_tre2_1,'temp_tre2_33333333333333')

 
          let col_temp_sec_1 = code_filter(code_arr,dpc_6+and_1+age_1+sur_2+temp_tre1_1+temp_tre2_1,0,12)

          

          if(temp_sec_1=='1'){

            if(col_temp_sec_1.includes('1')){
              temp_sec_1='1'
            }else if(col_temp_sec_1.includes('x')){
              temp_sec_1='X'
            }else if(col_temp_sec_1.includes('0')){
              temp_sec_1='0'
            }

          }else if(temp_sec_1=='X'){ //no    1 value
            if(col_temp_sec_1.includes('0')){
              temp_sec_1='0'
            }else if(col_temp_sec_1.includes('x')){
              temp_sec_1='X'
            }
          }else{
            temp_sec_1=col_temp_sec_1[0] || '0'
          }
    
          let col_temp_sco_1 = code_filter(code_arr,dpc_6+and_1+age_1+sur_2+temp_tre1_1+temp_tre2_1+temp_sec_1,0,13)
          
          if(temp_sco_1=='X'){ //no    1 value
            if(col_temp_sco_1.includes('0')){
              temp_sco_1='0'
            }else if(col_temp_sco_1.includes('x')){
              temp_sco_1='X'
            }
          }else{
           
              temp_sco_1=col_temp_sco_1[0] || '0'
        
            //validate
  
          }

         
      }

      let selected_tre2=null
      let big_score=0
      let selected_scorer=null
      if(mul_tre_2_collector?.length>0){
        console.log('dpcx',mul_tre_2_collector)
        //find volumn calculation
            for(let v=0; v<mul_tre_2_collector?.length; v++){
              let new_dpc=dpc_6+and_1+age_1+sur_2+temp_tre1_1+mul_tre_2_collector[v]
               
             

              let dpcx = await prisma.days_score.findMany({
                where: {
                  receipt: { contains: new_dpc }
                },
              })


              if(dpcx?.length>0){

                if(big_score<dpcx[0].hos_score_1){
                  big_score=dpcx[0].hos_score_1
                  selected_scorer=mul_tre_2_collector[v]
                }


                    console.log(dpcx[0].hos_days_1,'dpcx')
                    if(dpcx[0].hos_days_1=='出来高算定'){
                      if(selected_tre2==null){
                        selected_tre2=mul_tre_2_collector[v]
                      }
                      if(selected_tre2<mul_tre_2_collector[v]){
                        selected_tre2=mul_tre_2_collector[v]
                      }
                    }
                    
              }

            } 

            if(selected_tre2){}else{
              if(selected_scorer){
                   temp_tre2_1=selected_scorer
              }
            }  
      }




      if(selected_tre2){   
        if(selected_tre2 !=temp_tre2_1){
            temp_tre2_1=selected_tre2
        }
      }


      //new discharge date comming
      if(first_loop_collect?.discharge_date){
          if(first_loop_collect?.discharge_date!=ufind_?.discharge_date){temp_same_date=1} 
      }

      let temp_is_changed=0;

      //nothing change
      if(ufind_?.sur_2==sur_2  && ufind_?.tre1_1==temp_tre1_1  && ufind_?.tre2_1==temp_tre2_1  && ufind_?.sec_1==temp_sec_1  && ufind_?.sco_1==temp_sco_1 ){
       
      }else{
        //changed
        if(ufind_?.is_verified==1){
          temp_is_changed=1
        }
      }

      //same file entry

     

     
      var date1 = endDate
      var date2 = new Date(dischargeDate);
      var diffDays = date2.getDate() - date1.getDate();


      if(ufind_?.is_verified==1 && diffDays ==0 && temp_is_changed==0){
        //temp_is_changed=1
      }


      console.log(diffDays, '==================j============', ufind_?.is_verified, ufind_?.discharge_date, dischargeDate, temp_is_changed)



      console.log('=========iiiiiiiiiiiiii',ufind_?.is_verified, ufind_?.discharge_date,dischargeDate,  temp_is_changed)
      
 

      let data = {
        arr_doctor: JSON.stringify(doctor_obj),
        arr_receipt: JSON.stringify(receipt_obj),
        arr_date: JSON.stringify(date_obj),
        arr_name: JSON.stringify(items_obj),
        arr_amount: JSON.stringify(amount_obj),
        arr_dept: JSON.stringify(dept_obj),
        arr_disease: JSON.stringify(disease_obj),
        arr_color: JSON.stringify(color_obj),
        //new
        arr_treno: JSON.stringify(treno_obj),
        arr_icd: JSON.stringify(icd_obj),


        //system
        "dpc_6": dpc_6,
        "and_1": and_1,
        "age_1": age_1,
        "sur_2": sur_2,
        "tre1_1": temp_tre1_1,
        "tre2_1": temp_tre2_1,
        "sec_1": temp_sec_1,
        "sco_1": temp_sco_1,

        "dpc_code":dpc_6+and_1+age_1+sur_2+temp_tre1_1+temp_tre2_1+temp_sec_1+temp_sco_1, //initial

        //staff
        "s_dpc_6": null,
        "s_and_1": null,
        "s_age_1": null,
        "s_sur_2": null,
        "s_tre1_1": null,
        "s_tre2_1": null,
        "s_sec_1": null,
        "s_sco_1": null,

        "hospitalization_days": hospitalization_days,
        //"is_verified":0,
        "discharge_date": first_loop_collect?.discharge_date?.toString(), //letest 
        "admission_date_gap":admissionDateGap,
        "temp_same_date":temp_same_date,
        "temp_is_changed":temp_is_changed
      }

      console.log(first_loop_collect?.discharge_date,'----------------------------------------')

      let data_create = {

        "hospital_id": first_loop_collect.hospital_id,
        "patient_code": first_loop_collect.patient_code,
        "doctor": first_loop_collect.doctor,
        "ward": first_loop_collect.ward,
        "icd_code": first_loop_collect.icd_code,
        "admission_date": first_loop_collect?.admission_date?.toString(), //first one
        "treatment_date": first_loop_collect?.treatment_date?.toString(),
        "date_of_birth": first_loop_collect?.date_of_birth?.toString(),

        "verified_by": null,
        "verified_at": "",
        "created_by": user_id

      }

      /*---------------------------------------------------------CRUD-----------------------------------------------*/
 

      //update please
      if (ufind_) {
        console.log('====================================================================================vvvvvvvvvvvvvvv')
        const updateUser = await prisma.dpc_generate.update({
          where: {
            id: ufind_.id,
          },
          data: data,
        })
      }

      //create
      else {
        console.log('1====================================================================================vvvvvvvvvvvvvvv',uid)

        let cre_ = await prisma.dpc_generate.create({
          data: {
            ...data,
            ...data_create,
            uid: uid,
          },
        })

        console.log('jjjjjjjjjjjjjjjjjjjjjjjjjjj', cre_)

      }
    }


    response.create([], res)
  } catch (error) {
    response.error(error, res, next)
  }
};






export const dpc_update_code = async (req, res, next) => {
  try {


    function code_filter(code_arr,first_items,index_start,index_end){   
      let col_sur_1=[]
      
      for (let i=0; i<code_arr.length; i++){
          let item=code_arr[i]
          let item_10=item.substring(index_start, index_end)

          //console.log('item_10=',item_10, ' first_items=',first_items)
          
          if(item_10.toUpperCase()==first_items.toUpperCase()){
              let sur_1=item.substring(index_end, index_end+1)
              col_sur_1.push(sur_1)
          }
      }
      return col_sur_1
    }

    function code_filter_sur(code_arr,first_items,index_start,index_end){   
      let col_sur_1=[]
      
      for (let i=0; i<code_arr.length; i++){
          let item=code_arr[i]
          let item_10=item.substring(index_start, index_end)

          //console.log('item_10=',item_10, ' first_items=',first_items)
          
          if(item_10.toUpperCase()==first_items.toUpperCase()){
              let sur_1=item.substring(index_end, index_end+2)
              col_sur_1.push(sur_1)
          }
      }
      return col_sur_1
    }

    let up = 0
 



    let surgery = req.body.data
    let hospital_id=req.body.hospital_id


    for (let x = 0; x < surgery.length; x++) {
      let this_ = surgery[x]



      let temp1 = await prisma.surgery.findMany({
        where: {
          k_code: this_.k_code
        },
      })

 
      if (temp1.length > 0) {

        //push on dpc_management
        const find_ = await prisma.dpc_generate.findMany({
          where: {
            patient_code: parseInt(this_.patient_code),
            admission_date:this_.admission_date,
            hospital_id:hospital_id,
          },
          select: {
            id: true,
            patient_code:true,

            dpc_6:true,
            and_1:true,
            age_1:true,
            sur_2:true,
            tre1_1:true,
            tre2_1:true,
            sec_1:true,
            sco_1:true,

            dpc_code:true,


            arr_doctor: true,
            arr_receipt: true,
            arr_date: true,
            arr_name: true,
            arr_amount: true,
            arr_dept: true,
            arr_disease: true,
            arr_color:true,
            //new
            arr_treno: true,
            arr_icd:true,

          }
        })

       

       // console.log(find_[0].patient_code)

        if(find_.length>0){
          let k_arr_doctor=JSON.parse(find_[0].arr_doctor)
          let k_arr_receipt=JSON.parse(find_[0].arr_receipt)
          let k_arr_date=JSON.parse(find_[0].arr_date)
          let k_arr_name=JSON.parse(find_[0].arr_name)
          let k_arr_amount=JSON.parse(find_[0].arr_amount)
          let k_arr_dept=JSON.parse(find_[0].arr_dept)
          let k_arr_disease=JSON.parse(find_[0].arr_disease)
          let k_arr_color=JSON.parse(find_[0].arr_color)
          //new
          let k_arr_treno=JSON.parse(find_[0].arr_treno)
          let k_arr_icd=JSON.parse(find_[0].arr_icd)

          let new_arr_doctor=[]
          let new_arr_receipt=[]
          let new_arr_date=[]
          let new_arr_name=[]
          let new_arr_amount=[]
          let new_arr_dept=[]
          let new_arr_disease=[]
          let new_arr_color=[]

          //new
          let new_arr_treno=[]
          let new_arr_icd=[]

         // console.log(k_arr_doctor)

          if(k_arr_doctor!=null){

            {
              k_arr_date.map((date, index) => {
    
                if ((this_.treatment_date == k_arr_date[index]) && (this_.arr_disease==k_arr_name[index])) {
                  //old data not carry
                //  console.log('existing removed')
    
                }else{
                  new_arr_doctor.push(k_arr_doctor[index])
                  new_arr_receipt.push(k_arr_receipt[index])
                  new_arr_date.push(k_arr_date[index])
                  new_arr_name.push(k_arr_name[index])
                  new_arr_amount.push(k_arr_amount[index])
                  new_arr_dept.push(k_arr_dept[index])
                  new_arr_disease.push(k_arr_disease[index])
                  new_arr_color.push(k_arr_color[index])

                  //new
                  new_arr_treno.push(k_arr_treno[index])
                  new_arr_icd.push(k_arr_icd[index])
                }
    
              })
            }



            new_arr_doctor.push("   ")
            new_arr_receipt.push("   ")
            new_arr_date.push(this_.treatment_date)
            new_arr_name.push(this_.arr_disease)
            new_arr_amount.push(this_.points)
            new_arr_dept.push(" ")
            new_arr_disease.push(" ")
            new_arr_color.push("Purple? "+temp1[0]?.k_code)       
              
            //new
            new_arr_treno.push(" ")
            new_arr_icd.push(" ")

              let update_req_data = {  
                  arr_doctor: JSON.stringify(new_arr_doctor),
                  arr_receipt: JSON.stringify(new_arr_receipt),
                  arr_date: JSON.stringify(new_arr_date),
                  arr_name: JSON.stringify(new_arr_name),
                  arr_amount: JSON.stringify(new_arr_amount),
                  arr_dept: JSON.stringify(new_arr_dept),
                  arr_disease: JSON.stringify(new_arr_disease),
                  arr_color: JSON.stringify(new_arr_color), 
                  //new
                  arr_treno: JSON.stringify(new_arr_treno),
                  arr_icd: JSON.stringify(new_arr_icd), 


              }

              
              
              const updateUser = await prisma.dpc_generate.update({
                where: {
                  id: find_[0].id,
                },
                data: update_req_data,
              })            
          }

          let old_sur= find_[0].sur_2

          let dpc_6=find_[0].dpc_6
          let and_1 =find_[0].and_1
          let age_1 = find_[0].age_1
          let sur_2 = temp1[0].code
          let tre1_1 = find_[0].tre1_1
          let tre2_1 =find_[0].tre2_1
          let sec_1 = find_[0].sec_1
          let sco_1 = find_[0].sco_1

          let dpc_disease_classi = await prisma.dpc_disease_classi.findMany({
            where: {
              dpc_6: dpc_6,
            },
            select:{
              and_1:true,
              age_1:true,
              sur_2:true,
              tre1_1:true,
              tre2_1:true,
              sec_1:true,
              sco_1:true,
              codes:true
             }
          })

          //validate
          if(dpc_disease_classi?.length>0){
            let dpc_disease_classi_first=dpc_disease_classi[0]
            let code_arr=dpc_disease_classi_first.codes.split(",")

             let for_sur = code_filter_sur(code_arr,dpc_6+''+and_1+''+age_1,0,8)
              if(for_sur.includes(sur_2)){
                 
              }else {
                console.log('not included',for_sur,sur_2,old_sur)
                sur_2=old_sur
              }

            
            let col_sur_1 = code_filter(code_arr,dpc_6+''+and_1+''+age_1+''+sur_2,0,10)

                if(tre1_1=='X'){ //no surgery 1 value
                  if(col_sur_1.includes('0')){
                    tre1_1='0'
                  }else if(col_sur_1.includes('x')){
                    tre1_1='X'
                  }
                }else{
                  //validate
                    if(col_sur_1.includes(tre1_1)){
                      
                    }else{
                      if(col_sur_1.includes('0')){
                        tre1_1='0'
                      }else if(col_sur_1.includes('x')){
                        tre1_1='X'
                      }
                    }
                }



                let col_sur_2 = code_filter(code_arr,dpc_6+and_1+age_1+sur_2+tre1_1,0,11)
         
                if(tre2_1=='X'){ //no surgery 1 value
                    if(col_sur_2.includes('0')){
                      tre2_1='0'
                    }else if(col_sur_2.includes('x')){
                      tre2_1='X'
                    }
                }else{
                  //validate
                  if(col_sur_2.includes(tre2_1)){
                      
                  }else{
                    if(col_sur_2.includes('0')){
                      tre2_1='0'
                    }else if(col_sur_2.includes('x')){
                      tre2_1='X'
                    }
                  }
                }
        
         
                  let col_sec_1 = code_filter(code_arr,dpc_6+and_1+age_1+sur_2+tre1_1+tre2_1,0,12)
                  
                  if(sec_1=='X'){ //no    1 value
                    if(col_sec_1.includes('0')){
                      sec_1='0'
                    }else if(col_sec_1.includes('x')){
                      sec_1='X'
                    }
                  }else{
                    sec_1=col_sec_1[0] || '0'
                  }
            
                  let col_sco_1 = code_filter(code_arr,dpc_6+and_1+age_1+sur_2+tre1_1+tre2_1+sec_1,0,13)
                  
                  if(sco_1=='X'){ //no    1 value
                    if(col_sco_1.includes('0')){
                      sco_1='0'
                    }else if(col_sco_1.includes('x')){
                      sco_1='X'
                    }
                  }else{                  
                      sco_1=col_sco_1[0] || '0'
                    //validate
                  }
          }


              let new_dpc_code =find_[0].dpc_code.substring(0,8)+sur_2+tre1_1+tre2_1+sec_1+sco_1

              console.log(find_[0].dpc_code)
              console.log(new_dpc_code)
              console.log('----------------')

                up++
                let temp2 = await prisma.dpc_generate.updateMany({
                  where: {
                    patient_code: this_.patient_code,
                    admission_date:this_.admission_date,
                    hospital_id:hospital_id,
                  },
                  data: {
                    sur_2: sur_2,
                    tre1_1:tre1_1,
                    tre2_1:tre2_1,
                    sec_1:sec_1,
                    sco_1:sco_1,
                  },
                })

        }
 



        //console.log(temp2,'temp2',this_.patient_code)
      }
    }

    //console.log('up',up)
    response.update([], res)
  } catch (error) {
    response.error(error, res, next)
  }
};



export const dpc_migrate = async (req, res, next) => {



  
  try {/*
 
    
    //console.log(req.body['key'])

    String.prototype.replaceAt = function(index, replacement) {
      return this.substring(0, index) + replacement + this.substring(index + replacement.length);
  }
  


    let mig = await prisma.dpc_generate.findMany({
      select: { 
        "id":true,
        "dpc_6": true,
        "sur_2": true,
        dpc_code: true,
      }
    })

    for(let i=0; i<mig.length;i++){
      let th=mig[i]
      
      let dpc_disease_classi = await prisma.dpc_disease_classi.findMany({
        where: {
          dpc_6: th.dpc_6,
        },
        select:{
          sur_2:true
        }
      })

      if(dpc_disease_classi?.length>0){
        if(dpc_disease_classi[0].sur_2.split(",").includes("99")==true){
          console.log('true')
        }else{
           

          var hello =th.dpc_code;
          let kk=hello.replaceAt(8, "X");
          kk=kk.replaceAt(9, "X");

          console.log({sur_2:"XX",dpc_code:kk})

            const update = await prisma.dpc_generate.update({
              where: { id:th.id },
              data: {sur_2:"XX",dpc_code:kk},
            });
        }
      }
    }*/


 
      let itm = '620009117'
      let dpc = '070085'

      if (itm) {
        let find_ = await prisma.secondary_injury_new.findMany({
          where: {
            dpc_6:dpc,
            codes: { contains: itm },
             
          },
        })
 
      if (find_?.length > 0) {
          //found t3
          clr = 'Green? 1  [副傷病]'
          temp_sec_1 = '1'
        } else {

        } 
      }
 



 
    response.list([], res)
  } catch (error) {
    response.error(error, res, next)
  }
};


export const dpc_update = async (req, res, next) => {
  try {
 

    let temp1 = await prisma.dpc_generate.findMany({
      where: { id: req.body.id },
      select: { dpc_code:true}
    })

    let str=temp1[0].dpc_code
    let x_dpc_6  =str.substring(0, 6);
    let x_and_1  =str.substring(6, 7);
    let x_age_1  =str.substring(7, 8);
    let x_sur_2  =str.substring(8, 10);
    let x_tre1_1 =str.substring(10, 11);
    let x_tre2_1 =str.substring(11, 12);
    let x_sec_1  =str.substring(12, 13);
    let x_sco_1  =str.substring(13, 14);

    



    let data = null
    if (req.body['key'] == 'dpc_6') { data = { s_dpc_6: req.body.value }; x_dpc_6=req.body.value; }
    if (req.body['key'] == 'and_1') { data = { s_and_1: req.body.value }; x_and_1=req.body.value; }
    if (req.body['key'] == 'age_1') { data = { s_age_1: req.body.value }; x_age_1=req.body.value;  }
    if (req.body['key'] == 'sur_2') { data = { s_sur_2: req.body.value }; x_sur_2=req.body.value;  }
    if (req.body['key'] == 'tre1_1') { data = { s_tre1_1: req.body.value }; x_tre1_1=req.body.value;  }
    if (req.body['key'] == 'tre2_1') { data = { s_tre2_1: req.body.value }; x_tre2_1=req.body.value;  }
    if (req.body['key'] == 'sec_1') { data = { s_sec_1: req.body.value }; x_sec_1=req.body.value;  }
    if (req.body['key'] == 'sco_1') { data = { s_sco_1: req.body.value }; x_sco_1=req.body.value;  }

    const update = await prisma.dpc_generate.update({
      where: { id: req.body.id },
      data: {...data,dpc_code:x_dpc_6+x_and_1+x_age_1+x_sur_2+x_tre1_1+x_tre2_1+x_sec_1+x_sco_1},
    });

    response.update([], res)
  } catch (error) {
    response.error(error, res, next)
  }
};



export const dpc_verify = async (req, res, next) => {
  try {
    //console.log(req.body)
    const update = await prisma.dpc_generate.update({
      where: { id: req.body.id }, // specify the unique identifier of the record to update
      data: {
        is_verified: req.body.is_verified, // specify the fields to update
      },
    });

    response.update(update, res)
  } catch (error) {
    response.error(error, res, next)
  }
};


export const dpc_list = async (req, res, next) => {
  try {

    let filter = req.body?.filter
    let is_verified = req.body?.is_verified

    

    var range_start=req.body.filter.range_start
    var range_end=req.body.filter.range_end
    var date_type=req.body.filter.date_type
    var patient_code=req.body.filter.patient_code
    var hospitalization_days=req.body.filter.hospitalized_days
    var dpcPattern=req.body.filter.dpcPattern
    var typeDisPatient=req.body.filter.typeDisPatient
    var id=req.body.filter?.id

    if(hospitalization_days>0){
      hospitalization_days=hospitalization_days-1
    }

    let d1=timeStable(created_at()) || null
    let d2=timeStable(created_at(hospitalization_days)) || null
     
    console.log('xxxdpcPattern',dpcPattern)

    let dpc_6 = null
    let and_1 = null
    let age_1 = null
    let sur_2 = null  
    let tre1_1 = null
    let tre2_1 = null
    let sec_1 = null
    let sco_1 = null


   
    try {
       const myArray = dpcPattern.split("|");
      if(myArray[0]!='XXXXXX'){ dpc_6 = myArray[0].toLowerCase();}else{}
      if(myArray[1]!='X'){ and_1 = myArray[1].toLowerCase();}else{}
      if(myArray[2]!='X'){ age_1 = myArray[2].toLowerCase();}else{}
      if(myArray[3]!='XX'){ sur_2 = myArray[3].toLowerCase();}else{}
      if(myArray[4]!='X'){ tre1_1 = myArray[4].toLowerCase();}else{}
      if(myArray[5]!='X'){ tre2_1 = myArray[5].toLowerCase();}else{}
      if(myArray[6]!='X'){ sec_1 = myArray[6].toLowerCase();}else{}
      if(myArray[7]!='X'){ sco_1 = myArray[7].toLowerCase();}else{}

    } catch (error) {
      
    }


    console.log(dpc_6,sur_2,tre1_1,'jjjjjjjjjjjjj' )


   /* console.log({...dpc_6? { OR:[{dpc_6: dpc_6 },{s_dpc_6: dpc_6}]}   : {},
      ...and_1? {and_1: and_1} : {},
      ...age_1? { OR:[{age_1: age_1 },{s_age_1: age_1}]}   : {},
      ...sur_2? { OR:[{sur_2: sur_2},{s_sur_2: sur_2}] }   : {},
      ...tre1_1?{ tre1_1: tre1_1}   : {},
      ...tre2_1?{ OR:[{tre2_1: tre2_1 },{s_tre2_1: tre2_1 }]}  : {},
      ...sec_1? { OR:[{sec_1: sec_1 },{s_sec_1: sec_1}]}   : {},
      ...sco_1? { OR:[{sco_1: sco_1 },{s_sco_1: sco_1}]}   : {},})*/


    let result_ = await prisma.dpc_generate.findMany({
      ...response.list_paginate(req),
      where: {
        //patient_code:300366,
        /*...dpc_6? { OR:[{dpc_6: dpc_6 },{s_dpc_6: dpc_6}]}   : {},
        ...and_1? { OR:[{and_1: and_1 },{s_and_1: and_1}]}   : {},
        ...age_1? { OR:[{age_1: age_1 },{s_age_1: age_1}]}   : {},
        ...sur_2? { OR:[{sur_2: sur_2},{s_sur_2: sur_2}] }   : {},
        ...tre1_1?{ OR:[{tre1_1: tre1_1 },{s_tre1_1: tre1_1}]}   : {},
        ...tre2_1?{ OR:[{tre2_1: tre2_1 },{s_tre2_1: tre2_1 }]}  : {},
        ...sec_1? { OR:[{sec_1: sec_1 },{s_sec_1: sec_1}]}   : {},
        ...sco_1? { OR:[{sco_1: sco_1 },{s_sco_1: sco_1}]}   : {},*/

        ...dpc_6? {dpc_6: dpc_6 }   : {},
        ...and_1? {and_1: and_1 }   : {},
        ...age_1? {age_1: age_1 }   : {},
        ...sur_2? {sur_2: sur_2}   : {},
        ...tre1_1?{tre1_1: tre1_1 }   : {},
        ...tre2_1?{tre2_1: tre2_1 }  : {},
        ...sec_1? {sec_1: sec_1 }   : {},
        ...sco_1? {sco_1: sco_1 }   : {},

        ...id?{id:id}:{},

        ...date_type=='admission_date'?{ admission_date: { ...(range_end ? { lte: range_end } : {}),  ...(range_start ? { gte: range_start } : {}),},}:{},
        ...date_type=='discharge_date'?{ discharge_date: { ...(range_end ? { lte: range_end } : {}),  ...(range_start ? { gte: range_start } : {}),},}:{},
        ...date_type=='date_of_birth'?{ date_of_birth: { ...(range_end ? { lte: range_end } : {}),  ...(range_start ? { gte: range_start } : {}),},}:{},
        ...patient_code? { patient_code: parseInt(patient_code) } : {},


        ...typeDisPatient == 'all-active-patient' ? {
          OR: [
            { AND: [{ NOT: { discharge_date: null }, }, { temp_same_date: 0 },] },
            { AND: [{ discharge_date: null, }, { temp_same_date: 1 },] }
          ],
        } : {},

        ...typeDisPatient == 'dis-patient' ? {
          discharge_date: {
            not: null,
          },
          temp_same_date: 1
        } : {},


        ...typeDisPatient == 'all-changed' ? {
          temp_is_changed: 1,
        } : {},


           ...hospitalization_days>-1? { 
              admission_date_gap:d2,
              discharge_date: null,
           } : {},



        hospital_id: req.body?.hospital_id,
        ...is_verified == 1 ? { is_verified: 1 } : {},
        ...is_verified == 0 ? { is_verified: 0 } : {},
      },
      select: {
        id: true,
        "hospital_id": true,
        "patient_code": true,
        "doctor": true,
        "receipt_obj": true,
        "items_obj": true,
        "amount_obj": true,
        "ward": true,
        "icd_code": true,
        "admission_date": true,
        "admission_date_gap": true,
        "discharge_date": true,
        "treatment_date": true,
        "date_of_birth": true,

        "dpc_6": true,
        "and_1": true,
        "age_1": true,
        "sur_2": true,
        "tre1_1": true,
        "tre2_1": true,
        "sec_1": true,
        "sco_1": true,

        "s_dpc_6": true,
        "s_and_1": true,
        "s_age_1": true,
        "s_sur_2": true,
        "s_tre1_1": true,
        "s_tre2_1": true,
        "s_sec_1": true,
        "s_sco_1": true,

        "dpc_code":true,


        "hospitalization_days": true,

        "is_verified": true,
        "verified_by": true,
        "verified_at": true,
        "created_by": true,

        arr_doctor: true,
        arr_receipt: true,
        arr_date: true,
        arr_name: true,
        arr_amount: true,
        arr_dept: true,
        arr_disease: true,
        arr_color: true,

        //new
        arr_treno: true,
        arr_icd: true,

        dpc_disease_classi:true,
        dpc_disease_classi2:true,

        temp_is_changed:true

      }
    })

 

    const groupBy = await prisma.dpc_generate.groupBy({
      by: ['is_verified'],
      _count: {
        is_verified: true,
      },
      where: {

        ...dpc_6? { dpc_6: dpc_6 } : {},
        ...and_1? { and_1: and_1 } : {},
        ...age_1? { age_1: age_1 } : {},
        ...sur_2? { sur_2: sur_2 } : {},
        ...tre1_1? { tre1_1: tre1_1 } : {},
        ...tre2_1? { tre2_1: tre2_1 } : {},
        ...sec_1? { sec_1: sec_1 } : {},
        ...sco_1? { sco_1: sco_1 } : {},

        hospital_id: req.body?.hospital_id,
        ...date_type=='admission_date'?{ admission_date: { ...(range_end ? { lte: range_end } : {}),  ...(range_start ? { gte: range_start } : {}),},}:{},
        ...date_type=='discharge_date'?{ discharge_date: { ...(range_end ? { lte: range_end } : {}),  ...(range_start ? { gte: range_start } : {}),},}:{},
        ...date_type=='date_of_birth'?{ date_of_birth: { ...(range_end ? { lte: range_end } : {}),  ...(range_start ? { gte: range_start } : {}),},}:{},
        ...patient_code? { patient_code: parseInt(patient_code) } : {},


        ...typeDisPatient == 'all-active-patient' ? {
          OR: [
            { AND: [{ NOT: { discharge_date: null }, }, { temp_same_date: 0 },] },
            { AND: [{ discharge_date: null, }, { temp_same_date: 1 },] }
          ],
        } : {},

        ...typeDisPatient == 'dis-patient' ? {
          discharge_date: {
            not: null,
          },
          temp_same_date: 1
        } : {},


        ...typeDisPatient == 'all-changed' ? {
          temp_is_changed: 1,
        } : {},



        ...hospitalization_days>-1? { 
          admission_date_gap: d2,
          discharge_date: null,
       } : {},


      }
    })

  
    response.list({ list: result_, count: groupBy }, res)
  } catch (error) {
    response.error(error, res, next)
  }
};





export const image = async (req, res, next) => {
  let image = req.params.image
  res.sendFile(path.join(__dirname.replace("\controllers", "") + "./uploads/" + image));
};


export const manage_logo = async (req, res, next) => {

  const uploadDir = path.join(__dirname.replace("\controllers", "") + '/uploads');

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, '0777', true);
  const customOptions = { uploadDir: uploadDir, keepExtensions: true, allowEmptyFiles: false, maxFileSize: 5 * 1024 * 1024 * 1024, multiples: true };
  const form = new IncomingForm(customOptions);
  // console.log(form)
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
        const newFilepath_1 = `${uploadDir}/${trimmedStr_1}`;


        //console.log(newFilepath_1, newFilepath, 'newFilepath')
        fs.rename(newFilepath_1, newFilepath, err => err);


        //update hospital db
        const updatedHospital = await prisma.hospitals.update({
          where: { id: id },
          data: { logo: trimmedStr },
        });


      } catch (error) {
       // console.log(error, 'error')
      }


      //console.log(file.name,'file-'+x.toString())
    }
    res.status(200).json({});
  });
};

export const manage_update = async (req, res, next) => {
  try {
    let clock = created_at()

    //admin update
    let name = req.body.admin_name
    let email = req.body.admin_email
    let phone = req.body.admin_phone

    let password = null
    if (req.body.admin_password) {
      password = req.body.admin_password
    }

    //hospital update
    let id = req.body.id
    let h_name = req.body.name
    let h_address = req.body.address
    let updated_at = clock
    let updated_by = user_id


    const filterhospitals = await prisma.hospitals.findMany({
      where: {
        id: id,
      },
    });


    const update1 = await prisma.admins.updateMany({
      where: {
        id: filterhospitals[0].admin_id,
      },
      data: {
        name: name,
        email: email,
        phone: phone,
        ...password ? { password: md5(password) } : {},
      },
    });

    const update2 = await prisma.hospitals.updateMany({
      where: {
        id: id,
      },
      data: {
        name: h_name,
        address: h_address,
        updated_at: updated_at,
        updated_by: updated_by,
      },
    });


    response.list([], res)
  } catch (error) {
    response.error(error, res, next)
  }
};


export const manage_remove = async (req, res, next) => {
  try {
    let admin_email = req.body.admin_email
    //remove admin
    let delete_first = await prisma.hospitals.delete({
      where: {
        id: req.body.id
      },
    })


    //if success remove hospital
    let delete_ = null
    if (delete_first) {
      let delete_ = await prisma.admins.delete({
        where: {
          email: admin_email
        },
      })

      if (delete_) { } else {
        //create again
        const newCreate = await prisma.user.create({
          data: {
            ...delete_first
          },
        });
      }
    } else {


    }

    response.remove(delete_, res)
  } catch (error) {
    response.error(error, res, next)
  }
};



export const dpc_measure = async (req, res, next) => {
  try {

    let dpc_code=req.body.dpc_code
 
    let res1=0
    let res2=0
    let res3=0
    let result1=null

    //get current cccpm
    let temp1 = await prisma.ccpm.findMany({
      where: {
        dpc: dpc_code,
      },
    })

    let ccpm_grop=temp1[0]?.ccpm_group

    console.log('xxxxxx',ccpm_grop)

    if(ccpm_grop){
       //all dpc of this grop
        let temp2 = await prisma.ccpm.findMany({
          where: {
            ccpm_group: ccpm_grop,
          },select:{dpc:true}
        })

        let dpc_array=[]
          for(let i=0; i<temp2?.length;i++){
            dpc_array.push(temp2[i].dpc)
          }   
          
          res1 = await prisma.dpc_generate.aggregate({
          where: {
            dpc_code: {in: dpc_array},
            hospital_id:req.body.hospital_id
          },
          _count: {
            id: true,
          },
        })        
   
    }else{
        res1 = await prisma.dpc_generate.aggregate({
        where: {
          dpc_code: dpc_code,
          hospital_id:req.body.hospital_id
        },
        _count: {
          id: true,
        },
      })


    }

    //if(dpc_code=='130060XX97X41X'){
      //console.log(dpc_array,'dpc_array')
      
      //console.log(temp2,'ccpm_grop')
    //} // console.log(dpc_code,'dpc_code')

    let error=0

    res3 = await prisma.days_score.findMany({
      where: {
        receipt: dpc_code,
      },
    })
 

    if(res3.length==0){error=1}

     //result1=res1?._count?.id

    let result={ res1:res1?._count?.id,  res2:0,  res3:res3[0]?.hos_days_2 || '', error:error , ccpm:ccpm_grop || ""}

   console.log(result)

    response.list(result, res)
  } catch (error) {
    response.error(error, res, next)
  }
};