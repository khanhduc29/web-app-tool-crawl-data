import express from "express";
import { createGoogleMapJobController, getGoogleMapJobs, getGoogleMapTaskDetail, getGoogleMapTasks, getPendingGoogleMapTask, updateGoogleMapTask } from "../controllers/googleMap.controller.js";

const router = express.Router();

router.post("/scan", createGoogleMapJobController);
router.get("/task/pending", getPendingGoogleMapTask);
router.patch("/task/:id", updateGoogleMapTask);
// frontend dashboard
router.get("/crawl-jobs", getGoogleMapJobs);
router.get("/crawl-tasks", getGoogleMapTasks);
router.get("/crawl-tasks/:id", getGoogleMapTaskDetail);

export default router;