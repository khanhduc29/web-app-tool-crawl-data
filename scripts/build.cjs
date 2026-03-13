/**
 * Build script cho Electron app
 * - Download portable Node.js (nếu chưa có)
 * - Download portable Python embeddable (nếu chưa có)
 * - Cài pip + requirements cho Python workers
 * - Pre-install backend node_modules
 * - Pre-install Tool-crawl-phone node_modules
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { createWriteStream } = require("fs");

const ROOT = path.join(__dirname, "..");
const PORTABLE_DIR = path.join(ROOT, "portable");
const NODE_DIR = path.join(PORTABLE_DIR, "node");
const PYTHON_DIR = path.join(PORTABLE_DIR, "python");

// Phiên bản cần download
const NODE_VERSION = "v20.18.1";
const PYTHON_VERSION = "3.11.9";

// URL download
const NODE_URL = `https://nodejs.org/dist/${NODE_VERSION}/win-x64/node.exe`;
const PYTHON_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
const GET_PIP_URL = "https://bootstrap.pypa.io/get-pip.py";

// ============================================================
// Tiện ích download
// ============================================================
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`  Downloading: ${url}`);
    const file = createWriteStream(destPath);

    const request = (urlStr) => {
      const mod = urlStr.startsWith("https") ? https : require("http");
      mod.get(urlStr, (response) => {
        // Xử lý redirect
        if (response.statusCode === 301 || response.statusCode === 302) {
          request(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${urlStr}`));
          return;
        }

        const totalBytes = parseInt(response.headers["content-length"], 10);
        let downloadedBytes = 0;

        response.on("data", (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes) {
            const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            process.stdout.write(`\r  Progress: ${pct}%`);
          }
        });

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("");  // newline sau progress bar
          resolve();
        });
      }).on("error", (err) => {
        fs.unlinkSync(destPath);
        reject(err);
      });
    };

    request(url);
  });
}

// ============================================================
// 1. Download portable Node.js
// ============================================================
async function setupPortableNode() {
  const nodeExe = path.join(NODE_DIR, "node.exe");

  if (fs.existsSync(nodeExe)) {
    console.log("[✓] Portable Node.js already exists");
    return;
  }

  console.log("[*] Downloading portable Node.js...");
  fs.mkdirSync(NODE_DIR, { recursive: true });
  await downloadFile(NODE_URL, nodeExe);
  console.log("[✓] Portable Node.js downloaded");
}

// ============================================================
// 2. Download portable Python embeddable + pip
// ============================================================
async function setupPortablePython() {
  const pythonExe = path.join(PYTHON_DIR, "python.exe");

  if (fs.existsSync(pythonExe)) {
    console.log("[✓] Portable Python already exists");
  } else {
    console.log("[*] Downloading portable Python embeddable...");
    fs.mkdirSync(PYTHON_DIR, { recursive: true });

    const zipPath = path.join(PORTABLE_DIR, "python-embed.zip");
    await downloadFile(PYTHON_URL, zipPath);

    // Giải nén bằng PowerShell
    console.log("  Extracting...");
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${PYTHON_DIR}' -Force"`,
      { stdio: "inherit" }
    );
    fs.unlinkSync(zipPath);

    // Sửa file ._pth để cho phép import packages
    const pthFiles = fs.readdirSync(PYTHON_DIR).filter(f => f.endsWith("._pth"));
    for (const pthFile of pthFiles) {
      const pthPath = path.join(PYTHON_DIR, pthFile);
      let content = fs.readFileSync(pthPath, "utf-8");
      // Bỏ comment dòng "import site" để pip hoạt động
      content = content.replace("#import site", "import site");
      // Thêm Lib\site-packages
      if (!content.includes("Lib\\site-packages")) {
        content += "\nLib\\site-packages\n";
      }
      fs.writeFileSync(pthPath, content);
    }

    console.log("[✓] Portable Python extracted");
  }

  // Cài pip nếu chưa có
  const pipExe = path.join(PYTHON_DIR, "Scripts", "pip.exe");
  if (!fs.existsSync(pipExe)) {
    console.log("[*] Installing pip...");
    const getPipPath = path.join(PORTABLE_DIR, "get-pip.py");
    await downloadFile(GET_PIP_URL, getPipPath);
    execSync(`"${pythonExe}" "${getPipPath}"`, {
      cwd: PYTHON_DIR,
      stdio: "inherit",
    });
    fs.unlinkSync(getPipPath);
    console.log("[✓] pip installed");
  } else {
    console.log("[✓] pip already installed");
  }
}

// ============================================================
// 3. Cài Python packages cho workers
// ============================================================
function installPythonRequirements() {
  const pythonExe = path.join(PYTHON_DIR, "python.exe");
  const pipExe = path.join(PYTHON_DIR, "Scripts", "pip.exe");
  const sitePackages = path.join(PYTHON_DIR, "Lib", "site-packages");

  const workers = [
    { name: "Tool-youtube", dir: path.join(ROOT, "workers", "Tool-youtube") },
    { name: "Tool-Instagram", dir: path.join(ROOT, "workers", "Tool-Instagram") },
    { name: "pinterest-crawler", dir: path.join(ROOT, "workers", "pinterest-crawler") },
    { name: "titok_crawler", dir: path.join(ROOT, "workers", "titok_crawler") },
  ];

  for (const worker of workers) {
    const reqFile = path.join(worker.dir, "requirements.txt");
    if (!fs.existsSync(reqFile)) {
      console.log(`[!] No requirements.txt for ${worker.name}, skipping`);
      continue;
    }

    const content = fs.readFileSync(reqFile, "utf-8").trim();
    if (!content) {
      console.log(`[!] Empty requirements.txt for ${worker.name}, skipping`);
      continue;
    }

    console.log(`[*] Installing Python packages for ${worker.name}...`);
    try {
      execSync(
        `"${pipExe}" install -r "${reqFile}" --target "${sitePackages}" --no-warn-script-location`,
        { stdio: "inherit" }
      );
      console.log(`[✓] ${worker.name} packages installed`);
    } catch (err) {
      console.error(`[✗] Failed to install packages for ${worker.name}:`, err.message);
    }
  }

  // Cài Playwright browsers cho titok_crawler
  console.log("[*] Installing Playwright browsers for Python...");
  try {
    execSync(`"${pythonExe}" -m playwright install chromium`, {
      cwd: PYTHON_DIR,
      stdio: "inherit",
      env: {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: path.join(PORTABLE_DIR, "playwright-browsers"),
      },
    });
    console.log("[✓] Playwright browsers installed");
  } catch (err) {
    console.warn("[!] Playwright browser install failed (may not be needed):", err.message);
  }
}

// ============================================================
// 4. Pre-install Node.js dependencies
// ============================================================
function installNodeDependencies() {
  const nodeExe = path.join(NODE_DIR, "node.exe");
  const npmPath = "npm"; // Dùng npm hệ thống lúc build

  // Backend
  const backendDir = path.join(ROOT, "backend", "request-task-be");
  console.log("[*] Installing backend node_modules (production)...");
  execSync(`${npmPath} install --omit=dev`, {
    cwd: backendDir,
    stdio: "inherit",
  });
  console.log("[✓] Backend node_modules installed");

  // Tool-crawl-phone (Node.js worker)
  const phoneDir = path.join(ROOT, "workers", "Tool-crawl-phone");
  console.log("[*] Installing Tool-crawl-phone node_modules (production)...");
  execSync(`${npmPath} install --omit=dev`, {
    cwd: phoneDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: path.join(PORTABLE_DIR, "playwright-browsers"),
    },
  });
  console.log("[✓] Tool-crawl-phone node_modules installed");
}

// ============================================================
// 5. Build frontend
// ============================================================
function buildFrontend() {
  console.log("[*] Building frontend (vite build)...");
  execSync("npx vite build", {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log("[✓] Frontend built");
}

// ============================================================
// 6. Pre-populate winCodeSign cache (avoid symlink error)
// ============================================================
async function prepareWinCodeSignCache() {
  const cacheDir = path.join(
    process.env.LOCALAPPDATA || "",
    "electron-builder",
    "Cache",
    "winCodeSign"
  );
  const expectedDir = path.join(cacheDir, "winCodeSign-2.6.0");

  // Check if already correctly extracted
  if (fs.existsSync(path.join(expectedDir, "windows-10", "signtool.exe"))) {
    console.log("[✓] winCodeSign cache already exists");
    return;
  }

  console.log("[*] Pre-populating winCodeSign cache (bypass symlink issue)...");

  // Clean any corrupted cache
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  fs.mkdirSync(cacheDir, { recursive: true });

  // Download the .7z
  const sevenZUrl = "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z";
  const tempFile = path.join(cacheDir, "winCodeSign-2.6.0.7z");
  await downloadFile(sevenZUrl, tempFile);

  // Extract WITHOUT -snld flag (skips symlinks instead of failing)
  const sevenZipExe = path.join(ROOT, "node_modules", "7zip-bin", "win", "x64", "7za.exe");
  console.log("  Extracting winCodeSign (without symlinks)...");
  try {
    execSync(
      `"${sevenZipExe}" x -bd "${tempFile}" "-o${expectedDir}"`,
      { stdio: "pipe" }
    );
  } catch (err) {
    // 7-Zip may return warnings but still extract the needed files
    // Check if the important files exist
  }

  // Clean up .7z
  try { fs.unlinkSync(tempFile); } catch (e) {}

  // Verify extraction
  if (fs.existsSync(expectedDir)) {
    console.log("[✓] winCodeSign cache pre-populated");
  } else {
    console.warn("[!] winCodeSign cache may be incomplete, build might fail");
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log("=".repeat(60));
  console.log("  CrawlerTool - Build Script");
  console.log("=".repeat(60));
  console.log("");

  // Step 1: Download portable runtimes
  await setupPortableNode();
  await setupPortablePython();

  // Step 2: Install dependencies
  installPythonRequirements();
  installNodeDependencies();

  // Step 3: Build frontend
  buildFrontend();

  // Step 4: Pre-populate winCodeSign cache (bypass symlink error)
  await prepareWinCodeSignCache();

  // Step 5: Run electron-builder (two phases)
  // Phase A: Create unpacked dir (--dir), using electronDist to avoid app.asar lock
  // Phase B: Copy backend node_modules (electron-builder always excludes them)
  // Phase C: Create NSIS installer from the populated unpacked dir (--prepackaged)
  console.log("[*] Packaging with electron-builder...");
  const electronDistPath = path.join(ROOT, "node_modules", "electron", "dist");
  const outputDir = path.join(ROOT, "output");
  const unpackedDir = path.join(outputDir, "win-unpacked");

  // Clean output dir
  if (fs.existsSync(outputDir)) {
    try {
      fs.rmSync(outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
    } catch (e) {
      console.warn("[!] Could not fully clean output dir, trying cmd:", e.message);
      execSync(`cmd /c "rmdir /s /q "${outputDir}""`, { stdio: "pipe" });
    }
  }

  // Phase A: Create unpacked directory only
  console.log("[*] Phase A: Creating unpacked directory...");
  execSync(`npx electron-builder --win --dir --config.directories.output="output" --config.electronDist="${electronDistPath}"`, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: "false",
    },
  });

  // Phase B: Copy backend node_modules (electron-builder excludes them)
  console.log("[*] Phase B: Copying backend node_modules...");
  const outputResourcesDir = path.join(unpackedDir, "resources");
  const backendSrc = path.join(ROOT, "backend", "request-task-be", "node_modules");
  const backendDest = path.join(outputResourcesDir, "backend", "request-task-be", "node_modules");
  if (fs.existsSync(backendSrc)) {
    fs.cpSync(backendSrc, backendDest, { recursive: true });
    console.log("[✓] Backend node_modules copied to unpacked dir");
  } else {
    console.warn("[!] Backend node_modules not found, skipping");
  }

  // Phase C: Create NSIS installer from the populated unpacked dir
  console.log("[*] Phase C: Creating NSIS installer...");
  execSync(`npx electron-builder --win --prepackaged "${unpackedDir}" --config.directories.output="output"`, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: "false",
    },
  });

  console.log("");
  console.log("=".repeat(60));
  console.log("  ✅ Build complete! Output: output/");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
