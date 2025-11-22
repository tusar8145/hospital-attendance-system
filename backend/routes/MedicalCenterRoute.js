import express from "express";
import { auth } from "../middleware/Auth.js";
import * as MedicalCenterController from "../controllers/MedicalCenterController.js";
import * as HospitalController from "../controllers/HospitalController.js";

const router = express.Router();

router.post("/medical-center/list", auth, MedicalCenterController.medical_center_list);
router.post("/medical-center/create", auth, MedicalCenterController.medical_center_create);
router.post("/medical-center/update", auth, MedicalCenterController.medical_center_update);
router.post("/medical-center/status", auth, MedicalCenterController.medical_center_status);
router.post("/medical-center/remove", auth, MedicalCenterController.medical_center_remove);

// Medical center routes
router.post("/medical-center/logo", HospitalController.manage_medical_center_logo); // New route for medical center logo
router.get("/medical-center/image/:image", HospitalController.image); // For medical center images

export { router as MedicalCenterRoute };