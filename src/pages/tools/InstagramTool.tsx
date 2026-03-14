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

type TaskResponse = {
  success: boolean;
  data: Task[];
};

type Task = {
  _id: string;
  input: {
    url: string;
  };
  result: Profile;
  status: "pending" | "success" | "error";
  createdAt: string;
};

export default function InstagramTool() {
  const [url, setUrl] = useState("");
  const [scanWebsite, setScanWebsite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [taskStatus, setTaskStatus] = useState<"idle" | "pending" | "running" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [history, setHistory] = useState<Task[]>([]);

  const ref = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetchResults(); // lấy task mới nhất
    fetchHistory(); // lấy 20 task history
  }, []);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showHistory &&
        historyRef.current &&
        !historyRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHistory]);
  const fetchResults = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instagram/tasks?limit=1`);

      const data: TaskResponse = await res.json();

      if (!data.success || !data.data.length) return;

      const task = data.data[0];

      if (task.status === "success" && task.result) {
        setProfiles([task.result]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/instagram/tasks?limit=20`);

      const data = await res.json();

      if (!data.success) return;

      setHistory(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScan = async () => {
    if (!url) return;

    try {
      setLoading(true);
      setTaskStatus("pending");
      setErrorMsg("");
      setProfiles([]);

      const res = await fetch(`${API_BASE}/api/instagram/create-scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: [
            {
              url,
              scan_website: scanWebsite,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`Server trả về lỗi (${res.status})`);
      }

      setUrl("");
      setTaskStatus("running");

      // Poll for result
      const pollInterval = setInterval(async () => {
        try {
          const r = await fetch(`${API_BASE}/api/instagram/tasks?limit=1`);
          const d: TaskResponse = await r.json();
          if (!d.success || !d.data.length) return;
          const task = d.data[0];
          if (task.status === "success" && task.result) {
            clearInterval(pollInterval);
            setProfiles([task.result]);
            setTaskStatus("success");
            setLoading(false);
            fetchHistory();
          } else if (task.status === "error") {
            clearInterval(pollInterval);
            setTaskStatus("error");
            setErrorMsg("Task bị lỗi. Vui lòng thử lại.");
            setLoading(false);
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setTaskStatus("error");
      setErrorMsg(err?.message || "Không thể tạo scan. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const unique = (arr: (string | null | undefined)[]) => {
    return [...new Set(arr.filter(Boolean))];
  };

  return (
    <>
      <div className="insta-layout" ref={ref}>
        <div className="insta-left">
          <h2 className="insta-title">Instagram Crawler</h2>

          <input
            className="insta-input"
            placeholder="https://instagram.com/username"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <label className="insta-checkbox">
            <input
              type="checkbox"
              checked={scanWebsite}
              onChange={(e) => setScanWebsite(e.target.checked)}
            />
            <span>Scan Website</span>
          </label>

          <button className="scan-btn" onClick={handleScan} disabled={loading}>
            {loading
              ? taskStatus === "pending" ? "⏳ Đang gửi yêu cầu..."
              : taskStatus === "running" ? "🔄 Đang cào dữ liệu..."
              : "Scanning..."
            : "Scan"}
          </button>

          <button
            className="history-btn"
            onClick={() => {
              setShowHistory((s) => !s);
              fetchHistory();
            }}
          >
            Scan History
          </button>

          {loading && (
            <div className="loader">
              <p style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
                Tự động cập nhật mỗi 3 giây
              </p>
            </div>
          )}

          {taskStatus === "error" && (
            <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", fontSize: 14 }}>
              <strong>❌ Lỗi:</strong> {errorMsg}
              <button onClick={() => { setTaskStatus("idle"); setErrorMsg(""); }} style={{ marginLeft: 12, background: "none", border: "none", color: "#fca5a5", cursor: "pointer", textDecoration: "underline" }}>Đóng</button>
            </div>
          )}
        </div>

        <div className="insta-right">
          {profiles.length === 0 && !loading && <p>No profiles yet</p>}

          {profiles.map((item) => {
            /* merge phones + emails nhưng không trùng */

            const phones = unique([
              item.phone,
              ...(item.website_data?.phones || []),
            ]);

            const emails = unique([
              item.email,
              ...(item.website_data?.emails || []),
            ]);

            return (
              <div className="profile-card" key={item.username}>
                <div className="profile-header">
                  <img src="/insta.jpg" className="profile-avatar" />

                  <div>
                    <h3 className="profile-name">{item.name}</h3>
                    <p className="profile-username">@{item.username}</p>
                  </div>
                </div>

                {/* <div className="stats">
                  <div>
                    <strong>{item.posts ?? "-"}</strong>
                    <span>Posts</span>
                  </div>

                  <div>
                    <strong>{item.followers ?? "-"}</strong>
                    <span>Followers</span>
                  </div>

                  <div>
                    <strong>{item.following ?? "-"}</strong>
                    <span>Following</span>
                  </div>
                </div> */}

                <p className="bio">{item.bio}</p>

                <div className="profile-links">
                  {item.website && (
                    <a href={item.website} target="_blank">
                      🌐 Website
                    </a>
                  )}

                  {/* {phones.map((p) => (
                    <div key={p}>📞 {p}</div>
                  ))} */}

                  {/* {emails.map((e) => (
                    <div key={e}>📧 {e}</div>
                  ))} */}
                </div>

                {(item as any).website_data?.socials && (
                  <div className="socialss">
                    {Object.entries((item as any).website_data.socials).map(
                      ([key, values]: any) =>
                        values.map((v: string) => (
                          <a key={v} href={v} target="_blank">
                            {key}
                          </a>
                        )),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={historyRef}
        className={`insta-history ${showHistory ? "open" : ""}`}
      >
        <div className="history-header">
          <h3>Scan History</h3>
          <button onClick={() => setShowHistory(false)}>✕</button>
        </div>

        {history.map((task) => (
          <div
            className="history-item"
            key={task._id}
            onClick={() => {
              if (task.result) {
                setProfiles([task.result]);
              }
              setShowHistory(false);
            }}
          >
            <strong>{task.input?.url}</strong>
            <span className={`status-badge ${task?.status}`}>
              {task?.status}
            </span>
            <span>{new Date(task.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}
