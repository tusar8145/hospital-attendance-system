import express from "express";
import { auth } from "../middleware/Auth.js";
import * as ReportController from "../controllers/ReportController.js";

const router = express.Router();

router.post("/report/get-by-date", auth, ReportController.getReportByDate);
router.post("/report/submit", auth, ReportController.submitReport);
router.post("/report/departments-with-doctors", auth, ReportController.getDepartmentsWithDoctors);
router.post("/report/status", auth, ReportController.getReportStatus);
router.post("/report/list", auth, ReportController.getReportList);

export { router as ReportRoute };