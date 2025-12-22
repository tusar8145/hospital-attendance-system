import express from "express";
import { auth } from "../middleware/Auth.js";

import * as ReportController from "../controllers/ReportController.js";
import * as ReportControllerMid from "../controllers/ReportControllerMid.js";
import * as ReportControllerSm from "../controllers/ReportControllerSm.js";

const router = express.Router();

//unused
router.post("/report/get-by-date", auth, ReportController.getReportByDate);
router.post("/report/status", auth, ReportController.getReportStatus);
router.post("/report/view", auth, ReportController.getReportView);
router.post("/report/update-status", auth, ReportController.updateReportStatus);



//common// New routes for approval and comments
router.post("/report/approve", auth, ReportController.approveReport);
router.post("/report/comment", auth, ReportController.addComment);
router.put("/report/comment/:id", auth, ReportController.editComment);
router.delete("/report/comment/:id", auth, ReportController.deleteComment);
router.post("/report/comments", auth, ReportController.getComments);

//Large
router.post("/report/get-by-id", auth, ReportController.getReportById);
router.post("/report/get-by-date-table", auth, ReportController.getReportByDateTable);
router.post("/report/read-only-stats", auth, ReportController.getReadOnlyStats);
router.post("/report/departments-with-doctors", auth, ReportController.getDepartmentsWithDoctors);
router.post("/report/hospital-departments-doctors", ReportController.getHospitalDepartmentsDoctors);
router.post("/report/submit", auth, ReportController.submitReport);


//Common Report List
router.post("/report/list", auth, ReportController.getReportList);
router.post("/report/statistics", auth, ReportController.getReportStatistics);
router.post("/report/export", auth, ReportController.exportReports);

//common entry
router.post("/report/hospital-type", auth, ReportController.getHospitalTypeByReportId);

//Mid
router.post("/report-mid/hospital-departments-doctors", ReportControllerMid.getHospitalDepartmentsDoctors);
router.post("/report-mid/get-by-id", auth, ReportControllerMid.getReportById);
router.post("/report-mid/get-by-date", auth, ReportControllerMid.getReportByDate);
router.post("/report-mid/departments", auth, ReportControllerMid.getDepartments);
router.post("/report-mid/submit", auth, ReportControllerMid.submitReport);
router.post("/report-mid/departments-with-doctors", auth, ReportControllerMid.getDepartmentsWithDoctors);
router.post('/report-mid/get-last-report-mid-data', auth, ReportControllerMid.getLastReportMidData);

//Sm
router.post("/report-sm/get-by-date", auth, ReportControllerSm.getReportByDate);
router.post("/report-sm/get-by-id", auth, ReportControllerSm.getReportById);
router.post("/report-sm/submit", auth, ReportControllerSm.submitReport);
router.post("/report-sm/section-titles", auth, ReportControllerSm.getSectionTitles);
router.put("/report-sm/section-title", auth, ReportControllerSm.updateSectionTitle);
router.post("/report-sm/last-data", auth, ReportControllerSm.getLastReportSmData);
router.post("/report-sm/monthly-statistics", auth, ReportControllerSm.getMonthlyStatistics);
router.post("/report-sm/yearly-statistics", auth, ReportControllerSm.getYearlyStatistics);
router.get("/report-sm/section-types", auth, ReportControllerSm.getSectionTypes);

export { router as ReportRoute };