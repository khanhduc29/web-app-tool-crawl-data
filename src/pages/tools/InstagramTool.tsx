import { useEffect, useRef, useState } from "react";
import "./instagram.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

type Profile = {
  username: string;
  avatar: string;
  name: string;
  posts: number;
  followers: number;
  following: number;
  bio: string;
  website?: string;
  phone?: string;
  email?: string;
  website_data?: any;
};

type Task = {
  _id: string;
  input: { url: string };
  result: Profile;
  status: "pending" | "running" | "success" | "error";
  error?: string;
  createdAt: string;
};

type TaskResponse = {
  success: boolean;
  total: number;
  data: Task[];
};

export default function InstagramTool() {
  const [urls, setUrls] = useState("");
  const [scanWebsite, setScanWebsite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [taskStatus, setTaskStatus] = useState<"idle" | "pending" | "running" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState<Task[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState({ total: 0, done: 0, success: 0, error: 0 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(2);

  const totalPages = Math.ceil(profiles.length / perPage);
  const paginatedProfiles = profiles.slice((page - 1) * perPage, page * perPage);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    fetchLatestRequest();
    fetchHistory();
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHistory && historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHistory]);

  // Fetch latest request and its tasks to restore state on reload
  const fetchLatestRequest = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instagram/tasks?limit=50`);
      const data: TaskResponse = await res.json();
      if (!data.success || !data.data.length) return;

      // Group tasks by request_id and find the latest request
      const tasks = data.data;
      const latestRequestId = tasks[0].input?.url ? (tasks[0] as any).request_id : null;

      // Collect all successful profiles from latest batch
      const successProfiles = tasks
        .filter(t => t.status === "success" && t.result)
        .map(t => t.result);

      if (successProfiles.length > 0) {
        setProfiles(successProfiles);
      }

      // Check if any tasks are still pending/running
      const hasPending = tasks.some(t => t.status === "pending");
      const hasRunning = tasks.some(t => t.status === "running");
      const hasError = tasks.some(t => t.status === "error");
      const allDone = !hasPending && !hasRunning;

      if (!allDone && latestRequestId) {
        setActiveRequestId(latestRequestId);
        setTaskStatus(hasRunning ? "running" : "pending");
        setLoading(true);
        startPolling(latestRequestId);
      } else if (successProfiles.length > 0) {
        setTaskStatus("success");
        const total = tasks.length;
        const s = tasks.filter(t => t.status === "success").length;
        const e = tasks.filter(t => t.status === "error").length;
        setTaskProgress({ total, done: s + e, success: s, error: e });
      } else if (hasError) {
        setTaskStatus("error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instagram/tasks?limit=50`);
      const data = await res.json();
      if (!data.success) return;
      setHistory(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startPolling = (requestId: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/instagram/tasks?request_id=${requestId}`);
        const data: TaskResponse = await res.json();
        if (!data.success) return;

        const tasks = data.data;
        const total = tasks.length;
        const successTasks = tasks.filter(t => t.status === "success");
        const errorTasks = tasks.filter(t => t.status === "error");
        const done = successTasks.length + errorTasks.length;

        setTaskProgress({ total, done, success: successTasks.length, error: errorTasks.length });

        // Collect profiles from completed tasks
        const successProfiles = successTasks
          .filter(t => t.result)
          .map(t => t.result);
        if (successProfiles.length > 0) {
          setProfiles(successProfiles);
        }

        if (done > 0) {
          setTaskStatus("running");
        }

        // All tasks done
        if (done >= total) {
          stopPolling();
          setLoading(false);
          setTaskStatus(errorTasks.length > 0 && successTasks.length === 0 ? "error" : "success");
          fetchHistory();
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
  };

  const handleScan = async () => {
    // Parse URLs from textarea — one per line
    const lines = urls.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    try {
      stopPolling();
      setLoading(true);
      setTaskStatus("pending");
      setErrorMsg("");
      setProfiles([]);
      setTaskProgress({ total: lines.length, done: 0, success: 0, error: 0 });

      const inputs = lines.map(url => ({
        url,
        scan_website: scanWebsite,
      }));

      const res = await fetch(`${API_BASE}/api/instagram/create-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });

      if (!res.ok) throw new Error(`Server trả về lỗi (${res.status})`);

      const json = await res.json();
      const requestId = json.data?._id;

      setActiveRequestId(requestId);
      setTaskStatus("running");
      setUrls("");

      if (requestId) {
        startPolling(requestId);
      }
    } catch (err: any) {
      console.error(err);
      setTaskStatus("error");
      setErrorMsg(err?.message || "Không thể tạo scan.");
      setLoading(false);
    }
  };

  const unique = (arr: (string | null | undefined)[]) => {
    return [...new Set(arr.filter(Boolean))];
  };

  const urlCount = urls.split("\n").map(l => l.trim()).filter(Boolean).length;

  return (
    <>
      <div className="tool-page">
        <h1>Instagram Crawler</h1>
        <p className="tool-subtitle">Quét thông tin profile Instagram — hỗ trợ nhiều tài khoản cùng lúc</p>
      <div className="insta-layout" ref={ref}>
        <div className="insta-left">
          <h2>Cấu hình quét</h2>

          <label className="tool-label">
            Nhập link Instagram (mỗi link 1 dòng)
          </label>
          <textarea
            className="insta-textarea"
            placeholder={"https://instagram.com/username1\nhttps://instagram.com/username2\nhttps://instagram.com/username3"}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={6}
          />
          {urlCount > 0 && (
            <p style={{ fontSize: 12, opacity: 0.5, margin: "0 0 10px" }}>
              📋 {urlCount} link được nhập
            </p>
          )}

          <label className="tool-label">Số profile mỗi trang</label>
          <input
            className="insta-input"
            type="number"
            min={1}
            max={50}
            value={perPage}
            onChange={(e) => { setPerPage(Math.max(1, Number(e.target.value))); setPage(1); }}
            style={{ marginBottom: 12 }}
          />

          <label className="insta-checkbox">
            <input
              type="checkbox"
              checked={scanWebsite}
              onChange={(e) => setScanWebsite(e.target.checked)}
            />
            <span>Scan Website (email, phone, socials)</span>
          </label>

          <button className="scan-btn" onClick={handleScan} disabled={loading || urlCount === 0}>
            {loading
              ? taskStatus === "pending" ? "⏳ Đang gửi yêu cầu..."
              : `🔄 Đang cào (${taskProgress.done}/${taskProgress.total})...`
            : urlCount > 0 ? `Quét ${urlCount} tài khoản` : "Quét"}
          </button>

          <button
            className="history-btn"
            onClick={() => {
              setShowHistory((s) => !s);
              fetchHistory();
            }}
          >
            📜 Lịch sử quét
          </button>

          {loading && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <div className="loader" />
              <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>
                Tự động cập nhật mỗi 3 giây
              </p>
            </div>
          )}

          {taskStatus === "error" && (
            <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 13 }}>
              <strong>❌ Lỗi:</strong> {errorMsg}
              <button onClick={() => { setTaskStatus("idle"); setErrorMsg(""); }} style={{ marginLeft: 12, background: "none", border: "none", color: "#fca5a5", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>Đóng</button>
            </div>
          )}
        </div>

        <div className="insta-right">
          {/* Status badge + progress */}
          {taskStatus !== "idle" && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12,
              background: taskStatus === "success" ? "rgba(34,197,94,0.15)" : taskStatus === "error" ? "rgba(239,68,68,0.15)" : taskStatus === "running" ? "rgba(59,130,246,0.15)" : "rgba(251,191,36,0.15)",
              color: taskStatus === "success" ? "#4ade80" : taskStatus === "error" ? "#f87171" : taskStatus === "running" ? "#60a5fa" : "#fbbf24",
              border: `1px solid ${taskStatus === "success" ? "rgba(34,197,94,0.3)" : taskStatus === "error" ? "rgba(239,68,68,0.3)" : taskStatus === "running" ? "rgba(59,130,246,0.3)" : "rgba(251,191,36,0.3)"}`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", display: "inline-block", animation: taskStatus === "running" || taskStatus === "pending" ? "pulse 1.5s infinite" : "none" }} />
              {taskStatus === "pending" && "⏳ Đang chờ xử lý"}
              {taskStatus === "running" && `🔄 Đang cào (${taskProgress.done}/${taskProgress.total})`}
              {taskStatus === "success" && `✅ Hoàn thành (${taskProgress.success}/${taskProgress.total})`}
              {taskStatus === "error" && "❌ Lỗi"}
            </div>
          )}

          {/* Progress bar */}
          {(taskStatus === "running" || (taskStatus === "success" && taskProgress.total > 1)) && taskProgress.total > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.6, marginBottom: 4 }}>
                <span>Tiến độ</span>
                <span>{Math.round((taskProgress.done / taskProgress.total) * 100)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(taskProgress.done / taskProgress.total) * 100}%`,
                  borderRadius: 3,
                  background: taskProgress.error > 0 ? "linear-gradient(90deg, #4ade80, #fbbf24)" : "linear-gradient(90deg, #4ade80, #22d3ee)",
                  transition: "width 0.5s ease",
                }} />
              </div>
              {taskProgress.error > 0 && (
                <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>
                  ⚠️ {taskProgress.error} lỗi
                </p>
              )}
            </div>
          )}

          {profiles.length === 0 && !loading && taskStatus === "idle" && (
            <div className="tool-empty">
              <div className="icon">📷</div>
              <p>Nhập link Instagram ở bên trái để bắt đầu quét</p>
            </div>
          )}

          {/* Info bar */}
          {profiles.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gridColumn: "1 / -1" }}>
              <span style={{ fontSize: 13, opacity: 0.6 }}>Hiển thị {Math.min(paginatedProfiles.length, profiles.length)} / {profiles.length} kết quả</span>
            </div>
          )}

          {paginatedProfiles.map((item) => {
            const phones = unique([item.phone, ...(item.website_data?.phones || [])]);
            const emails = unique([item.email, ...(item.website_data?.emails || [])]);

            return (
              <div className="profile-card" key={item.username}>
                <div className="profile-header">
                  <img src="/insta.jpg" className="profile-avatar" />
                  <div>
                    <h3 className="profile-name">{item.name}</h3>
                    <p className="profile-username">@{item.username}</p>
                  </div>
                </div>

                <p className="bio">{item.bio}</p>

                <div className="profile-links">
                  {item.website && (
                    <a href={item.website} target="_blank">🌐 Website</a>
                  )}
                  {phones.map((p) => (
                    <div key={p as string}>📞 {p}</div>
                  ))}
                  {emails.map((e) => (
                    <div key={e as string}>📧 {e}</div>
                  ))}
                </div>

                {(item as any).website_data?.socials && (
                  <div className="socialss">
                    {Object.entries((item as any).website_data.socials).map(
                      ([key, values]: any) =>
                        values.map((v: string) => (
                          <a key={v} href={v} target="_blank">{key}</a>
                        )),
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="tool-pagination" style={{ gridColumn: "1 / -1" }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
              <span>Trang {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
            </div>
          )}
        </div>
      </div>

      <div ref={historyRef} className={`insta-history ${showHistory ? "open" : ""}`}>
        <div className="history-header">
          <h3>Lịch sử quét</h3>
          <button onClick={() => setShowHistory(false)}>✕</button>
        </div>

        {history.map((task) => (
          <div
            className="history-item"
            key={task._id}
            onClick={() => {
              if (task.result) {
                setProfiles([task.result]);
                setTaskStatus("success");
              }
              setShowHistory(false);
            }}
          >
            <strong>{task.input?.url}</strong>
            <span className={`status-badge status-${task?.status}`}>
              {task?.status === "success" ? "✅" : task?.status === "error" ? "❌" : "⏳"} {task?.status}
            </span>
            <span>{new Date(task.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
