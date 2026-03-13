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

      const json = await res.json();

      console.log("Scan created:", json);

      const taskId = json.data.tasks[0]._id;

      pollResult(taskId);
    } catch (err) {
      console.error(err);
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
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
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
    <div className="pinterest-tool">
      <h1>Pinterest Crawler</h1>

      <div className="pinterest-search">
        <input
          placeholder="Enter keyword (example: studio design)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button onClick={startScan} disabled={loading}>
          <FaPlay />
          {loading ? "Scanning..." : "Start Scan"}
        </button>

        <button className="history-btn" onClick={openHistory}>
          <FaHistory />
        </button>
      </div>

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

      {loading && <div className="loading">Scanning Pinterest...</div>}

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
  );
}
