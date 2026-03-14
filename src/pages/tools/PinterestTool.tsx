import { useEffect, useState } from "react";
import "./PinterestTool.css";
import {
  FaFileExcel,
  FaFileCode,
  FaPlay,
  FaHistory,
} from "react-icons/fa";

interface Pin {
  title: string | null;
  description: string | null;
  creator: string | null;
  creator_link: string | null;
  image: string | null;
  pin_link: string | null;
  external_link: string | null;
}

interface ScanHistory {
  keyword: string;
  date: string;
  total: number;
  result: Pin[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE = `${API_BASE_URL}/api/pinterest`;

export default function PinterestTool() {
  const [keyword, setKeyword] = useState("");
  const [data, setData] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<"idle" | "pending" | "running" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedData = data.slice(startIndex, startIndex + PAGE_SIZE);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  useEffect(() => {
    loadLatestResult();
  }, []);

  const loadLatestResult = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/success?limit=1`);
      const json = await res.json();

      if (json.data?.length > 0) {
        const task = json.data[0];

        if (task.result) {
          setData(task.result);
          setTaskStatus("success");
          setCurrentKeyword(task.input?.keyword || "");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    setPage(1);
  }, [data]);
  const startScan = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setData([]);
    setTaskStatus("pending");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scan_type: "pins",
          keyword,
          limit: 10,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server trả về lỗi (${res.status})`);
      }

      const json = await res.json();

      console.log("Scan created:", json);

      const taskId = json.data.tasks[0]._id;
      setTaskStatus("running");

      pollResult(taskId);
    } catch (err: any) {
      console.error(err);
      setTaskStatus("error");
      setErrorMsg(err?.message || "Không thể tạo scan. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const pollResult = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/tasks/success?limit=50`);
        const json = await res.json();

        const task = json.data.find((t: any) => t._id === taskId);

        if (task && task.result) {
          clearInterval(interval);

          setData(task.result);
          setCurrentKeyword(keyword);
          setTaskStatus("success");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    // Timeout fallback: if no result after 2 min, show error
    setTimeout(() => {
      if (loading) {
        clearInterval(interval);
        setTaskStatus("error");
        setErrorMsg("Task quá thời gian chờ. Vui lòng thử lại.");
        setLoading(false);
      }
    }, 120000);
  };
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "pinterest.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    const escapeCSV = (value: string) => {
      if (!value) return "";
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = [
      [
        "title",
        "description",
        "creator",
        "creator_link",
        "image",
        "pin_link",
        "external_link",
      ],
      ...data.map((p) => [
        escapeCSV(p.title ?? ""),
        escapeCSV(p.description ?? ""),
        escapeCSV(p.creator ?? ""),
        escapeCSV(p.creator_link ?? ""),
        escapeCSV(p.image ?? ""),
        escapeCSV(p.pin_link ?? ""),
        escapeCSV(p.external_link ?? ""),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "pinterest.csv";
    link.click();
  };

  const openHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/success?limit=100`);
      const json = await res.json();

      const tasks = json.data || [];

      const formatted: ScanHistory[] = tasks.map((t: any) => ({
        keyword: t.input?.keyword || "Unknown",
        date: new Date(t.createdAt).toLocaleString(),
        total: t.result ? t.result.length : 0,
        result: t.result || [],
      }));

      setHistory(formatted);

      setHistoryOpen(true);
    } catch (err) {
      console.error("History error:", err);
    }
  };

  const loadHistoryResult = (item: ScanHistory) => {
    setData(item.result);
    setCurrentKeyword(item.keyword);
    setHistoryOpen(false);
  };
  return (
    <div className="tool-page">
      <div className="pinterest-tool">
      <h1>Pinterest Crawler</h1>
      <p className="tool-subtitle">Tìm kiếm và cào dữ liệu từ Pinterest</p>

      <div className="pinterest-search">
        <input
          placeholder="Enter keyword (example: studio design)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button onClick={startScan} disabled={loading}>
          <FaPlay />
          {loading
            ? taskStatus === "pending" ? "⏳ Đang gửi..."
            : taskStatus === "running" ? "🔄 Đang cào..."
            : "Scanning..."
          : "Start Scan"}
        </button>

        <button className="history-btn" onClick={openHistory}>
          <FaHistory />
        </button>
      </div>

      {taskStatus === "error" && (
        <div style={{ margin: "12px 0", padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", fontSize: 14 }}>
          <strong>❌ Lỗi:</strong> {errorMsg}
          <button onClick={() => { setTaskStatus("idle"); setErrorMsg(""); }} style={{ marginLeft: 12, background: "none", border: "none", color: "#fca5a5", cursor: "pointer", textDecoration: "underline" }}>Đóng</button>
        </div>
      )}

      {/* Status badge */}
      {taskStatus !== "idle" && !loading && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, margin: "8px 0 12px",
          background: taskStatus === "success" ? "rgba(34,197,94,0.15)" : taskStatus === "error" ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
          color: taskStatus === "success" ? "#4ade80" : taskStatus === "error" ? "#f87171" : "#fbbf24",
          border: `1px solid ${taskStatus === "success" ? "rgba(34,197,94,0.3)" : taskStatus === "error" ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}`,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
          {taskStatus === "success" && "✅ Hoàn thành"}
          {taskStatus === "error" && "❌ Lỗi"}
        </div>
      )}

      {loading && (
        <div className="loading">
          {taskStatus === "pending" ? "⏳ Đang gửi yêu cầu..." : "🔄 Đang cào Pinterest..."}
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Tự động cập nhật mỗi 3 giây</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="download-bar">
          <div style={{ display: "flex", gap: "3px" }}>
            <button onClick={downloadJSON}>
              <FaFileCode /> JSON
            </button>

            <button onClick={downloadExcel}>
              <FaFileExcel /> Excel
            </button>
          </div>
          <div className="result-info">
            <strong>{currentKeyword}</strong>
            <span>{data.length} pins</span>
          </div>
        </div>
      )}

      <div className="pinterest-grid">
        {paginatedData.map((item, index) => (
          <div className="pin-card" key={index}>
            {item.image && <img src={item.image} alt="" />}

            <div className="pin-content">
              <h3>{item.title || "Untitled Pin"}</h3>

              {item.creator && (
                <p className="creator">
                  by{" "}
                  <a href={item.creator_link || "#"} target="_blank">
                    {item.creator}
                  </a>
                </p>
              )}

              {item.description && item.description.length > 0 && (
                <p className="desc">{item.description.slice(0, 120)}</p>
              )}

              <div className="pin-links">
                {item.pin_link && (
                  <a href={item.pin_link} target="_blank">
                    View Pin
                  </a>
                )}

                {item.external_link && (
                  <a href={item.external_link} target="_blank">
                    Visit Site
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>

          <span>
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
      {/* OVERLAY */}
      {historyOpen && (
        <div
          className="history-overlay"
          onClick={() => setHistoryOpen(false)}
        />
      )}

      {/* HISTORY PANEL */}

      <div className={`history-panel ${historyOpen ? "open" : ""}`}>
        <div className="history-header">
          <h3>Scan History</h3>

          <button className="close-btn" onClick={() => setHistoryOpen(false)}>
            ✕
          </button>
        </div>

        {history.length === 0 && <p className="empty">No scans yet</p>}

        {history.map((item, index) => (
          <div
            key={index}
            className="history-item"
            onClick={() => loadHistoryResult(item)}
          >
            <div>
              <strong>{item.keyword}</strong>
              <p>{item.date}</p>
            </div>

            <span>{item.total} pins</span>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
