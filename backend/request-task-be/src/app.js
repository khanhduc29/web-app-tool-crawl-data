
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

import { connectDB } from "./config/db.js";
import tiktokRoute from "./routes/tiktok.route.js";
import googleMapRoute from "./routes/googleMap.route.js";
import youtubeRoute from "./routes/youtube.route.js";
import pinterestRoute from "./routes/pinterest.route.js";
import instagramRoutes from "./routes/instagram.routes.js";
import workerRoute from "./routes/worker.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/tiktok", tiktokRoute);
app.use("/api/google-map", googleMapRoute);
app.use("/api/youtube", youtubeRoute);
app.use("/api/pinterest", pinterestRoute);
app.use("/api/instagram", instagramRoutes);
app.use("/api/workers", workerRoute);

const PORT = process.env.PORT || 3000;

// ============================================================
// Lấy đường dẫn portable executables từ env (do main.cjs truyền vào)
// ============================================================
function getNodeExe() {
  return process.env.PORTABLE_NODE_EXE || "node";
}

function getPythonExe() {
  return process.env.PORTABLE_PYTHON_EXE || "python";
}

function getWorkersRoot() {
  const isPackaged = process.env.ELECTRON_IS_PACKAGED === "true";
  const resourcesPath = process.env.ELECTRON_RESOURCES_PATH;

  if (isPackaged && resourcesPath) {
    return path.join(resourcesPath, "workers");
  }
  return path.join(__dirname, "../../../workers");
}

// ============================================================
// Spawn worker chung
// ============================================================
function spawnWorker(name, command, args, options = {}) {
  console.log(`Starting ${name} worker...`);
  console.log(`  Command: ${command} ${args.join(" ")}`);

  const env = {
    ...process.env,
    ...(options.env || {}),
    PYTHONPATH: options.cwd || "",
  };

  const worker = spawn(command, args, {
    ...options,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  worker.stdout.on("data", (data) => {
    console.log(`${name} WORKER: ${data.toString()}`);
  });

  worker.stderr.on("data", (data) => {
    console.error(`${name} ERROR: ${data.toString()}`);
  });

  worker.on("error", (err) => {
    console.error(`${name} spawn error:`, err.message);
  });

  worker.on("close", (code) => {
    console.log(`${name} worker exited with code ${code}`);
  });

  return worker;
}

// ============================================================
// Khởi động từng worker
// ============================================================
function startYoutubeWorker() {
  const workersRoot = getWorkersRoot();
  const workerPath = path.join(workersRoot, "Tool-youtube", "main.py");
  spawnWorker("YouTube", getPythonExe(), [workerPath], {
    cwd: path.dirname(workerPath),
  });
}

function startPhoneWorker() {
  const workersRoot = getWorkersRoot();
  const workerPath = path.join(workersRoot, "Tool-crawl-phone", "dist", "index.js");
  console.log("PHONE WORKER PATH:", workerPath);
  spawnWorker("Phone", getNodeExe(), [workerPath], {
    cwd: path.dirname(workerPath),
  });
}

function startTikTokWorker() {
  const workersRoot = getWorkersRoot();
  const workerPath = path.join(workersRoot, "titok_crawler", "main.py");
  spawnWorker("TikTok", getPythonExe(), [workerPath], {
    cwd: path.dirname(workerPath),
  });
}

function startPinterestWorker() {
  const workersRoot = getWorkersRoot();
  const workerPath = path.join(workersRoot, "pinterest-crawler", "main.py");
  console.log("PINTEREST WORKER PATH:", workerPath);
  spawnWorker("Pinterest", getPythonExe(), [workerPath], {
    cwd: path.dirname(workerPath),
  });
}

function startInstagramWorker() {
  const workersRoot = getWorkersRoot();
  const workerPath = path.join(workersRoot, "Tool-Instagram", "main.py");
  console.log("INSTAGRAM WORKER PATH:", workerPath);
  spawnWorker("Instagram", getPythonExe(), [workerPath], {
    cwd: path.dirname(workerPath),
  });
}

connectDB().then(() => {

  startYoutubeWorker();
  startPhoneWorker();
  startTikTokWorker();
  startPinterestWorker();
  startInstagramWorker();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

});