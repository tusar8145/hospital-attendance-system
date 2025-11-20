import express from "express";
import { auth } from "../middleware/Auth.js";
import * as IssueController from "../controllers/IssueController.js";  //*1
const router = express.Router();
 
router.post("/issue/post_issue", auth,  IssueController.post_issue);
router.post("/issue/post_issue_reply", auth,  IssueController.post_issue_reply);
router.post("/issue/get_issue_reply", auth,  IssueController.get_issue_reply);
router.post("/issue/get_issue", auth,  IssueController.get_issue);
router.post("/issue/update_issues", auth,  IssueController.update_issues);
export { router as IssueRoute };  
