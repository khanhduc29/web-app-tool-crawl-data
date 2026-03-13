const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let backend;

// Debug log file
const LOG_FILE = path.join(require("os").tmpdir(), "crawlertool-debug.log");
function debugLog(...args) {
  const msg = `[${new Date().toISOString()}] ${args.join(" ")}\n`;
  fs.appendFileSync(LOG_FILE, msg);
  console.log(...args);
}

// ============================================================
// Hàm lấy đường dẫn theo chế độ dev / packaged
// ============================================================
function getResourcePath(...parts) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...parts);
  }
  return path.join(__dirname, "..", ...parts);
}

// Đường dẫn portable node.exe (bundled)
function getNodeExe() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "portable", "node", "node.exe");
  }
  // Dev mode: dùng portable nếu có, không thì dùng system node
  const portableNode = path.join(__dirname, "..", "portable", "node", "node.exe");
  const fs = require("fs");
  if (fs.existsSync(portableNode)) {
    return portableNode;
  }
  return "node"; // fallback system node
}

// Đường dẫn portable python.exe (bundled)
function getPythonExe() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "portable", "python", "python.exe");
  }
  const portablePython = path.join(__dirname, "..", "portable", "python", "python.exe");
  const fs = require("fs");
  if (fs.existsSync(portablePython)) {
    return portablePython;
  }
  return "python"; // fallback system python
}

// Đường dẫn playwright browsers
function getPlaywrightBrowsersPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "portable", "playwright-browsers");
  }
  return path.join(__dirname, "..", "portable", "playwright-browsers");
}

// ============================================================
// Khởi động backend
// ============================================================
function startBackend() {
  const nodeExe = getNodeExe();
  const backendPath = getResourcePath(
    "backend",
    "request-task-be",
    "src",
    "app.js"
  );
  const backendCwd = getResourcePath("backend", "request-task-be");

  debugLog("NODE EXE:", nodeExe, "exists:", fs.existsSync(nodeExe));
  debugLog("BACKEND PATH:", backendPath, "exists:", fs.existsSync(backendPath));
  debugLog("BACKEND CWD:", backendCwd, "exists:", fs.existsSync(backendCwd));
  debugLog("NODE_MODULES:", path.join(backendCwd, "node_modules"), "exists:", fs.existsSync(path.join(backendCwd, "node_modules")));
  debugLog("PACKAGE.JSON:", path.join(backendCwd, "package.json"), "exists:", fs.existsSync(path.join(backendCwd, "package.json")));
  debugLog(".ENV:", path.join(backendCwd, ".env"), "exists:", fs.existsSync(path.join(backendCwd, ".env")));

  // Truyền biến môi trường cho backend
  const env = {
    ...process.env,
    ELECTRON_RESOURCES_PATH: app.isPackaged ? process.resourcesPath : "",
    ELECTRON_IS_PACKAGED: app.isPackaged ? "true" : "false",
    PORTABLE_NODE_EXE: getNodeExe(),
    PORTABLE_PYTHON_EXE: getPythonExe(),
    PLAYWRIGHT_BROWSERS_PATH: getPlaywrightBrowsersPath(),
  };

  backend = spawn(nodeExe, [backendPath], {
    cwd: backendCwd,
    env,
  });

  backend.stdout.on("data", (data) => {
    debugLog("BE:", data.toString());
  });

  backend.stderr.on("data", (data) => {
    debugLog("BE ERROR:", data.toString());
  });

  backend.on("error", (err) => {
    debugLog("Backend spawn error:", err.message);
  });

  backend.on("close", (code) => {
    debugLog("Backend exited with code", code);
  });
}

// ============================================================
// Tạo cửa sổ
// ============================================================
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  const htmlPath = path.join(__dirname, "../dist/index.html");
  console.log("UI PATH:", htmlPath);
  win.loadFile(htmlPath);

  // Chỉ mở DevTools khi chạy dev
  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }
}

// ============================================================
// App lifecycle
// ============================================================
app.whenReady().then(() => {
  // Clear old log
  fs.writeFileSync(LOG_FILE, "");
  debugLog("APP START");
  debugLog("Is Packaged:", app.isPackaged);
  debugLog("Resources Path:", process.resourcesPath);
  debugLog("__dirname:", __dirname);

  startBackend();

  setTimeout(() => {
    createWindow();
  }, 3000);
});

app.on("window-all-closed", () => {
  if (backend) {
    backend.kill();
    backend = null;
  }
  app.quit();
});

app.on("before-quit", () => {
  if (backend) {
    backend.kill();
    backend = null;
  }
});
