import mongoose from "mongoose";

const GoogleMapTaskSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoogleMapJob",
      required: true,
    },

    keyword: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    region: {
      type: String,
      required: true,
    },

    result_limit: {
      type: Number,
      required: true,
    },

    delay_seconds: {
      type: Number,
      required: true,
    },

    deep_scan: {
      type: Boolean,
      default: false,
    },

    deep_scan_website: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "success", "error"],
      default: "pending",
    },

    result: {
      type: mongoose.Schema.Types.Mixed, // Place[]
      default: null,
    },

    error_message: String,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("GoogleMapTask", GoogleMapTaskSchema);