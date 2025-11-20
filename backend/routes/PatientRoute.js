import express from "express";
import { auth } from "../middleware/Auth.js";
import * as PatientController from "../controllers/PatientController.js";  //*1
const router = express.Router();
 
router.post("/patient/dpc-create", auth,  PatientController.dpc_create);
router.post("/patient/dpc-list", auth,  PatientController.dpc_list);
router.post("/patient/dpc-verify", auth,  PatientController.dpc_verify);
router.post("/patient/dpc-update", auth,  PatientController.dpc_update);
router.post("/patient/dashboard-count", auth,  PatientController.dashboard_count);
router.post("/patient/dpc-update-code", auth,  PatientController.dpc_update_code);
router.post("/patient/dpc_measure", auth,  PatientController.dpc_measure);

router.get("/patient/dpc_migrate",  PatientController.dpc_migrate);

export { router as PatientRoute };  



 