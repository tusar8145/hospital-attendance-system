import express from "express";
import { auth } from "../middleware/Auth.js";
import * as ReportController from "../controllers/ReportController.js";

const router = express.Router();

router.post("/report/get-by-date", auth, ReportController.getReportByDate);
router.post("/report/get-by-date-table", auth, ReportController.getReportByDateTable);
router.post("/report/submit", auth, ReportController.submitReport);
router.post("/report/departments-with-doctors", auth, ReportController.getDepartmentsWithDoctors);
router.post("/report/status", auth, ReportController.getReportStatus);
router.post("/report/list", auth, ReportController.getReportList);
router.post("/report/export", auth, ReportController.exportReports);
router.post("/report/view", auth, ReportController.getReportView);
router.post("/report/update-status", auth, ReportController.updateReportStatus);
router.post("/report/statistics", auth, ReportController.getReportStatistics);
router.post("/report/get-by-id", auth, ReportController.getReportById);

// New routes for approval and comments
router.post("/report/approve", auth, ReportController.approveReport);
router.post("/report/comment", auth, ReportController.addComment);
router.put("/report/comment/:id", auth, ReportController.editComment);
router.delete("/report/comment/:id", auth, ReportController.deleteComment);
router.post("/report/comments", auth, ReportController.getComments);

router.post("/report/read-only-stats", auth, ReportController.getReadOnlyStats);

export { router as ReportRoute };