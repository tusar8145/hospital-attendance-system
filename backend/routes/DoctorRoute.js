import express from "express";
import { auth } from "../middleware/Auth.js";
import * as DoctorController from "../controllers/DoctorController.js";

const router = express.Router();

router.post("/doctor/list", auth, DoctorController.doctor_list);
router.post("/doctor/create", auth, DoctorController.doctor_create);
router.post("/doctor/update", auth, DoctorController.doctor_update);
router.post("/doctor/status", auth, DoctorController.doctor_status);
router.post("/doctor/remove", auth, DoctorController.doctor_remove);
router.post("/doctor/assign-departments", auth, DoctorController.doctor_assign_departments);

export { router as DoctorRoute };