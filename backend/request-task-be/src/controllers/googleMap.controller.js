import { createGoogleMapJob } from "../services/googleMap.service.js";
import GoogleMapTask from "../models/GoogleMapTask.model.js";
import GoogleMapJobModel from "../models/GoogleMapJob.model.js";
import GoogleMapTaskModel from "../models/GoogleMapTask.model.js";
import { syncRequestStatus } from "../utils/syncRequestStatus.js";

export async function createGoogleMapJobController(req, res) {
  try {
    const job = await createGoogleMapJob(req.body);

    res.json({
      success: true,
      data: job,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getPendingGoogleMapTask(req, res) {
  try {
    const task = await GoogleMapTask.findOneAndUpdate(
      { status: "pending" },            // điều kiện
      { status: "processing" },          // lock task
      {
        sort: { created_at: 1 },         // FIFO
        new: true,
      }
    );

    if (!task) {
      return res.json({
        success: true,
        data: null,
        message: "No pending Google Map task",
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function updateGoogleMapTask(req, res) {
  try {
    const { id } = req.params;
    const { status, result, error_message } = req.body;

    if (!["success", "error"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be success or error",
      });
    }

    const updateData = {
      status,
      updated_at: new Date(),
    };

    if (status === "success") {
      updateData.result = result;
    }

    if (status === "error") {
      updateData.error_message = error_message || "Unknown error";
    }

    const task = await GoogleMapTask.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Google Map task not found",
      });
    }

    // Sync parent job status
    if (task.job_id) {
      await syncRequestStatus(GoogleMapTask, GoogleMapJobModel, "job_id", task.job_id);
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getGoogleMapJobs(req, res) {
  try {
    const jobs = await GoogleMapJobModel.find()
      .sort({ created_at: -1 })
      .limit(100);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getGoogleMapTasks(req, res) {
  try {
    const { jobId } = req.query;

    const tasks = await GoogleMapTaskModel.find({ job_id: jobId })
      .sort({ created_at: 1 });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getGoogleMapTaskDetail(req, res) {
  try {
    const { id } = req.params;

    const task = await GoogleMapTaskModel.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}