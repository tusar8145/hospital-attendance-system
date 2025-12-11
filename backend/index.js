import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import cluster from  'cluster';
import os from 'os';
import cors from "cors" 
import { CrudRoute } from "./crud/CrudRoute.js";

import { UserRoute } from "./routes/UserRoute.js";
import { HospitalRoute } from "./routes/HospitalRoute.js";
import { HospitalStaffRoute } from "./routes/HospitalStaffRoute.js";
import { PatientRoute } from "./routes/PatientRoute.js";
import { IssueRoute } from "./routes/issueRoute.js";

import { MedicalCenterRoute  } from "./routes/MedicalCenterRoute.js";
import { DepartmentRoute  } from "./routes/DepartmentRoute.js";
import { DoctorRoute } from "./routes/DoctorRoute.js";
import { ReportRoute } from "./routes/ReportRoute.js";
import authRoutes from './routes/auth.js';

const app = express();
const SYSVERSION = "/api/";

app.use(express.json({limit: '2500mb'}));
 

const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}

app.use(cors(corsOptions))  

app.use(SYSVERSION, UserRoute);
app.use(SYSVERSION, HospitalRoute);
app.use(SYSVERSION, HospitalStaffRoute);
app.use(SYSVERSION, CrudRoute);
app.use(SYSVERSION, PatientRoute);
app.use(SYSVERSION, IssueRoute);
app.use(SYSVERSION, MedicalCenterRoute);
app.use(SYSVERSION, DepartmentRoute);
app.use(SYSVERSION, DoctorRoute);
app.use(SYSVERSION, authRoutes);
app.use(SYSVERSION, ReportRoute);


app.use((req, res, next) => {
  res.status(404).json({
    message: "404 not found",
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port: ${process.env.PORT}`);
});
