import express from "express";
import { auth } from "../middleware/Auth.js";
import * as DepartmentController from "../controllers/DepartmentController.js";

const router = express.Router();

router.post("/department/list", auth, DepartmentController.department_list);
router.post("/department/create", auth, DepartmentController.department_create);
router.post("/department/update", auth, DepartmentController.department_update);
router.post("/department/status", auth, DepartmentController.department_status);
router.post("/department/remove", auth, DepartmentController.department_remove);

export { router as DepartmentRoute };