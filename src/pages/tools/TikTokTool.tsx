import { useEffect, useRef, useState } from "react";
import { ScanType } from "../../types/tiktokResult";
import ResultList from "../../components/tiktok/ResultList";
import { useParams, useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FaFileExcel, FaFileCode } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type TabKey =
  | "top_posts"
  | "videos"
  | "accounts"
  | "friends"
  | "creators"
  | "video_comments";
const TAB_TO_SCAN_TYPE: Record<TabKey, ScanType | null> = {
  top_posts: "top_posts",
  videos: null,
  accounts: "users",
  friends: "relations",
  creators: null,
  video_comments: "video_comments",
};
export default function TikTokTool() {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>((tabParam as TabKey) || "top_posts");
  const [accountKeyword, setAccountKeyword] = useState("");
  const [pageSize, setPageSize] = useState(3);
  const [limitUsers, setLimitUsers] = useState(3);
  const [deepScan, setDeepScan] = useState(true);

  const [sourceUsername, setSourceUsername] = useState("");
  const [relationLimit, setRelationLimit] = useState(3);
  const [relationDeepScan, setRelationDeepScan] = useState(false);
  const [scanType, setScanType] = useState<ScanType | null>(null);
  const [results, setResults] = useState<any[]>([]);

  // ===== COMMENTS SCAN =====
  const [commentKeyword, setCommentKeyword] = useState("");
  const [commentVideoUrl, setCommentVideoUrl] = useState("");
  const [commentLimit, setCommentLimit] = useState(3);

  const [topKeyword, setTopKeyword] = useState("");
  const [topLimit, setTopLimit] = useState(3);

  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<"idle" | "pending" | "running" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount or tab change
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };
  useEffect(() => {
    if (tabParam && tabParam !== tab) {
      setTab(tabParam as TabKey);
    }
  }, [tabParam]);
  useEffect(() => {
    const nextScanType = TAB_TO_SCAN_TYPE[tab];

    // 🔥 reset NGAY
    stopPolling();
    setResults([]);
    setScanType(nextScanType);
    setTaskStatus("idle");
    setErrorMessage("");

    if (nextScanType) {
      fetchLatestTask(nextScanType);
    }

    return () => stopPolling();
  }, [tab]);
  async function submitScan(form: any) {
    if (loading) return;
    try {
      stopPolling();
      setLoading(true);
      setResults([]);
      setTaskStatus("pending");
      setErrorMessage("");

      const res = await fetch(`${API_BASE_URL}/api/tiktok/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Không thể tạo task. Server trả về lỗi.");
      }

      const data = await res.json();
      console.log("✅ SCAN RESPONSE:", data);

      // Start polling for task completion
      const currentScanType = form.scan_type as ScanType;
      startPolling(currentScanType);
    } catch (err: any) {
      console.error("❌ SCAN ERROR:", err);
      setTaskStatus("error");
      setErrorMessage(err?.message || "Lỗi không xác định khi tạo task.");
      setLoading(false);
    }
  }

  function startPolling(pollScanType: ScanType) {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/tiktok/task/latest?scan_type=${pollScanType}`
        );
        if (!res.ok) return;
        const json = await res.json();
        const task = json?.data;
        if (!task) return;

        const status = task.status;

        if (status === "running") {
          setTaskStatus("running");
        } else if (status === "success") {
          stopPolling();
          setTaskStatus("success");
          if (pollScanType === "relations") {
            setResults(task.result?.friends_detail || []);
          } else {
            setResults(task.result || []);
          }
          setLoading(false);
        } else if (status === "error") {
          stopPolling();
          setTaskStatus("error");
          setErrorMessage(task.error_message || "Task bị lỗi. Vui lòng thử lại.");
          setLoading(false);
        }
        // pending → just keep waiting
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  }

  async function fetchLatestTask(scanType?: ScanType | null) {
    if (!scanType) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/api/tiktok/task/latest?scan_type=${scanType}&status=success`,
      );

      if (!res.ok) return;

      const json = await res.json();

      // ❌ nếu scanType đã đổi trong lúc fetch
      setResults((prev) => {
        if (scanType !== TAB_TO_SCAN_TYPE[tab]) {
          return prev;
        }

        if (scanType === "relations") {
          return json?.data?.result?.friends_detail || [];
        }

        return json?.data?.result || [];
      });
    } catch (err) {
      console.error("❌ FETCH LATEST TASK ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  const buildScanTopPostsForm = () => {
    const form = {
      scan_type: "top_posts",
      scan_account: "tool_bot_01",

      keyword: topKeyword,
      limit: topLimit,

      sort_by: "engagement", // hoặc views
      delay_range: [2000, 4000],
      batch_size: 10,
      batch_delay: 8000,
    };

    console.log("📤 SCAN TOP POSTS FORM:", form);

    setScanType("top_posts" as ScanType);
    submitScan(form);
  };

  const buildScanUsersForm = () => {
    const form = {
      scan_type: "users",
      scan_account: "tool_bot_01",
      keyword: accountKeyword,
      limit: limitUsers,
      delay_range: [2500, 5000],
      batch_size: 5,
      batch_delay: 8000,
      deep_scan: deepScan,
      scan_relations: false,
      scan_comments: false,
    };

    console.log("📤 SCAN USERS FORM:", form);

    setScanType("users"); // 👈 QUAN TRỌNG
    submitScan(form);
  };
  const buildScanRelationsForm = () => {
    const form = {
      scan_type: "relations",
      scan_account: "tool_bot_01",
      target_username: sourceUsername,
      friends_limit: relationLimit,
      followers_limit: 1000,
      following_limit: 1000,
      delay_range: [3000, 6000],
      batch_size: 10,
      batch_delay: 12000,
      deep_scan: relationDeepScan,
    };

    console.log("📤 SCAN RELATIONS FORM:", form);

    setScanType("relations"); // 👈
    submitScan(form);
  };

  const buildScanCommentsForm = () => {
    const form = {
      scan_type: "video_comments",
      scan_account: "tool_bot_01",

      keyword: commentKeyword,
      video_url: commentVideoUrl,
      limit_comments: commentLimit,

      delay_range: [2000, 4000],
      batch_size: 20,
      batch_delay: 10000,

      detect_intent: true,
    };

    console.log("📤 SCAN COMMENTS FORM:", form);

    setScanType("video_comments"); // 👈 QUAN TRỌNG
    submitScan(form);
  };

  const downloadJSON = () => {
    if (!results || results.length === 0) return;

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `tiktok_${tab}_${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };
  const downloadExcel = async () => {
    if (!results || results.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("TikTok Data");

    const headers = Object.keys(results[0]);
    worksheet.addRow(headers);

    results.forEach((item: any) => {
      worksheet.addRow(headers.map((h) => item[h]));
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `tiktok_${tab}_${Date.now()}.xlsx`);
  };
  return (
    <div style={page}>
      {/* HEADER */}
      <h1 style={title}>TikTok Crawler</h1>
      <p style={subtitle}>
        Quét dữ liệu TikTok theo từ khóa, tài khoản và khu vực – demo giao diện
        & dữ liệu giả.
      </p>

      {/* TABS */}
      <div style={tabs}>
        <Tab label="Top bài viết" value="top_posts" tab={tab} setTab={setTab} />
        {/* <Tab
          label="Video theo từ khóa"
          value="videos"
          tab={tab}
          setTab={setTab}
        /> */}
        <Tab
          label="Tài khoản theo từ khóa"
          value="accounts"
          tab={tab}
          setTab={setTab}
          onChange={() => {
            setResults([]);
            setScanType(null);
          }}
        />
        <Tab
          label="Bạn bè tài khoản"
          value="friends"
          tab={tab}
          setTab={setTab}
        />
        {/* <Tab
          label="Creator theo khu vực"
          value="creators"
          tab={tab}
          setTab={setTab}
        /> */}
        <Tab
          label="Quét bình luận bài đăng"
          value="video_comments"
          tab={tab}
          setTab={setTab}
        />
      </div>

      {/* CONTENT */}
      <div style={layout}>
        {/* LEFT FORM */}
        <div style={left}>
          {tab === "top_posts" && (
            <>
              <h2>Quét top bài viết theo từ khóa</h2>
              <p>Dựa trên lượt xem và tương tác cao nhất</p>

              <input
                style={inputStyle}
                placeholder="Từ khóa (vd: makeup)"
                value={topKeyword}
                onChange={(e) => setTopKeyword(e.target.value)}
              />

              <input
                style={inputStyle}
                type="number"
                placeholder="Số lượng (vd: 20)"
                value={topLimit}
                onChange={(e) => setTopLimit(Number(e.target.value))}
              />

              <button
                style={{
                  ...btn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onClick={buildScanTopPostsForm}
                disabled={loading}
              >
                {loading ? "Đang quét..." : "Quét dữ liệu"}
              </button>
            </>
          )}

          {/* {tab === "videos" && (
            <>
              <h2>Quét video theo từ khóa</h2>
              <p>Tìm video mới hoặc nhiều lượt xem</p>

              <input style={inputStyle} placeholder="Hashtag hoặc keyword" />
              <select style={inputStyle}>
                <option>Mới nhất</option>
                <option>Nhiều lượt xem</option>
              </select>

              <button style={btn}>Bắt đầu quét</button>
            </>
          )} */}

          {tab === "accounts" && (
            <>
              <h2>Quét tài khoản theo từ khóa</h2>
              <p>Tìm KOL / creator theo ngành</p>

              <input
                style={inputStyle}
                placeholder="Từ khóa (vd: gym, studio)"
                value={accountKeyword}
                onChange={(e) => setAccountKeyword(e.target.value)}
              />

              <input
                style={inputStyle}
                type="number"
                placeholder="Số lượng (vd: 20)"
                value={limitUsers}
                onChange={(e) => setLimitUsers(Number(e.target.value))}
              />

              <label style={{ opacity: 0.85 }}>
                <input
                  type="checkbox"
                  checked={deepScan}
                  onChange={(e) => setDeepScan(e.target.checked)}
                />{" "}
                Quét chi tiết tài khoản
              </label>

              <button
                style={{
                  ...btn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onClick={buildScanUsersForm}
                disabled={loading}
              >
                {loading ? "Đang quét..." : "Quét tài khoản"}
              </button>
            </>
          )}

          {tab === "friends" && (
            <>
              <h2>Quét bạn bè của tài khoản</h2>
              <p>Quét toàn bộ network (following + follower)</p>

              <input
                style={inputStyle}
                placeholder="@username (vd: flowerknowsglobal)"
                value={sourceUsername}
                onChange={(e) => setSourceUsername(e.target.value)}
              />

              <input
                style={inputStyle}
                type="number"
                placeholder="Số lượng (vd: 50)"
                value={relationLimit}
                onChange={(e) => setRelationLimit(Number(e.target.value))}
              />

              <label style={{ opacity: 0.85 }}>
                <input
                  type="checkbox"
                  checked={relationDeepScan}
                  onChange={(e) => setRelationDeepScan(e.target.checked)}
                />{" "}
                Quét chi tiết từng tài khoản
              </label>

              <button
                style={{
                  ...btn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onClick={buildScanRelationsForm}
                disabled={loading}
              >
                {loading ? "Đang quét..." : "Quét bạn bè"}
              </button>
            </>
          )}

          {tab === "creators" && (
            <>
              <h2>Tìm creator theo khu vực</h2>
              <p>Lọc creator theo vị trí & ngành</p>

              <input style={inputStyle} placeholder="Thành phố / Quốc gia" />
              <input style={inputStyle} placeholder="Ngành (beauty, food...)" />

              <button style={btn}>Tìm creator</button>
            </>
          )}
          {tab === "video_comments" && (
            <>
              <h2>Quét bình luận bài đăng</h2>
              <p>Lọc comment theo keyword trong video</p>

              {/* <input
                style={inputStyle}
                placeholder="Keyword (vd: makeup)"
                value={commentKeyword}
                onChange={(e) => setCommentKeyword(e.target.value)}
              /> */}

              <input
                style={inputStyle}
                placeholder="TikTok video URL"
                value={commentVideoUrl}
                onChange={(e) => setCommentVideoUrl(e.target.value)}
              />

              <input
                style={inputStyle}
                type="number"
                placeholder="Số lượng comment (vd: 200)"
                value={commentLimit}
                onChange={(e) => setCommentLimit(Number(e.target.value))}
              />

              <button
                style={{
                  ...btn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onClick={buildScanCommentsForm}
                disabled={loading}
              >
                {loading ? "Đang quét..." : "Quét bình luận"}
              </button>
            </>
          )}
        </div>

        {/* RIGHT RESULT */}
        <div style={right}>
          {/* Error banner */}
          {taskStatus === "error" && (
            <div style={errorBanner}>
              <div style={{ flex: 1 }}>
                <strong>❌ Task thất bại</strong>
                <p style={{ margin: "4px 0 0", opacity: 0.9, fontSize: 14 }}>{errorMessage}</p>
              </div>
              <button
                style={retryBtn}
                onClick={() => {
                  setTaskStatus("idle");
                  setErrorMessage("");
                }}
              >
                Đóng
              </button>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button style={downloadBtn} onClick={downloadJSON}>
                <FaFileCode /> JSON
              </button>

              <button style={downloadBtnExcel} onClick={downloadExcel}>
                <FaFileExcel /> Excel
              </button>
            </div>
          )}

          {loading && <LoadingPanel taskStatus={taskStatus} />}

          {!loading && taskStatus !== "error" && results.length === 0 && (
            <EmptyState scanType={scanType} />
          )}

          {!loading && results.length > 0 && (
            <ResultList
              key={scanType}
              scanType={scanType}
              results={results}
              pageSize={pageSize}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Tab({ label, value, tab, setTab, onChange }: any) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        setTab(value);
        navigate(`/tools/tiktok/${value}`);
        onChange?.();
      }}
      style={{
        ...tabBtn,
        ...(tab === value ? tabActive : {}),
      }}
    >
      {label}
    </button>
  );
}

/* ================= STYLES ================= */

const page = {
  padding: 60,
  minHeight: "100vh",
  background: "linear-gradient(180deg,#0b2cff,#061a6b)",
  color: "#fff",
};

const title = { fontSize: 42, marginBottom: 8 };
const subtitle = { opacity: 0.85, marginBottom: 32 };

const tabs = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap" as const,
  marginBottom: 32,
};

const tabBtn = {
  padding: "10px 18px",
  borderRadius: 999,
  border: "none",
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
  cursor: "pointer",
};

const tabActive = { background: "#FF4331" };

const layout = {
  display: "grid",
  gridTemplateColumns: "1fr 888px",
  gap: 60,
  //   maxWidth: 1200,
};

const left = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 14,
};

const right = {};

const inputStyle = {
  padding: "14px 16px",
  borderRadius: 12,
  border: "none",
  outline: "none",
};

const btn = {
  marginTop: 8,
  background: "#FF4331",
  border: "none",
  color: "#fff",
  padding: "14px 24px",
  borderRadius: 12,
  cursor: "pointer",
};
const loadingWrap = {
  minHeight: 360,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "center",
  color: "#fff",
};

const spinner = {
  width: 42,
  height: 42,
  border: "4px solid rgba(255,255,255,0.25)",
  borderTop: "4px solid #FF4331",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};
const downloadBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: "#6366f1",
  color: "#fff",
};

const downloadBtnExcel = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: "#16a34a",
  color: "#fff",
};

const errorBanner: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  padding: "16px 20px",
  borderRadius: 12,
  background: "rgba(239,68,68,0.2)",
  border: "1px solid rgba(239,68,68,0.5)",
  color: "#fca5a5",
  marginBottom: 16,
};

const retryBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
function LoadingPanel({ taskStatus }: { taskStatus: string }) {
  const statusText: Record<string, string> = {
    pending: "⏳ Đang chờ worker xử lý...",
    running: "🔄 Worker đang cào dữ liệu...",
  };

  return (
    <div style={loadingWrap}>
      <div style={spinner} />
      <p style={{ marginTop: 12, opacity: 0.85, fontSize: 16 }}>
        {statusText[taskStatus] || "Đang tải dữ liệu..."}
      </p>
      {(taskStatus === "pending" || taskStatus === "running") && (
        <p style={{ marginTop: 4, opacity: 0.5, fontSize: 13 }}>
          Tự động cập nhật mỗi 3 giây
        </p>
      )}
    </div>
  );
}
function EmptyState({ scanType }: { scanType: ScanType | null }) {
  return (
    <div style={loadingWrap}>
      <p style={{ opacity: 0.7 }}>
        {scanType
          ? "Chưa có dữ liệu. Hãy bấm quét để bắt đầu."
          : "Chọn một tab để xem kết quả."}
      </p>
    </div>
  );
}
