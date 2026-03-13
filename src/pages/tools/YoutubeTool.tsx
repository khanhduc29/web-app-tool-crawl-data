import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./YouTubeTool.css";
import YouTubeResult from "./YoutubeResult";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FaFileCode, FaFileExcel } from "react-icons/fa";

type TabType = "videos" | "channels" | "video_comments";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const tabs: { key: TabType; label: string }[] = [
  { key: "videos", label: "Top Video theo từ khóa" },
  { key: "channels", label: "Kênh theo từ khóa" },
  { key: "video_comments", label: "Quét bình luận video" },
];

export default function YouTubeTool() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = (tab as TabType) || "videos";

  const [keyword, setKeyword] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  //   const [limit, setLimit] = useState(10);
  const [limits, setLimits] = useState({
    videos: 10,
    channels: 10,
    video_comments: 10,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [deepScanSocial, setDeepScanSocial] = useState(false);

  useEffect(() => {
    const fetchLatestSuccessTask = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/youtube/task/latest`, {
          params: {
            scan_type: activeTab,
            status: "success",
          },
        });

        if (res.data.success) {
          const taskData = res.data.data;

          setTask(taskData);
          setResult(taskData?.result || null);

          const input = taskData?.input || {};

          if (taskData.scan_type === "video_comments") {
            if (input.video_url) {
              setVideoUrl(input.video_url);
            }

            if (input.limit_comments) {
              setLimits((prev) => ({
                ...prev,
                video_comments: input.limit_comments,
              }));
            }
          } else {
            if (input.keyword) {
              setKeyword(input.keyword);
            }

            if (input.limit) {
              setLimits((prev) => ({
                ...prev,
                [activeTab]: input.limit,
              }));
            }

            if (input.deep_scan_social !== undefined) {
              setDeepScanSocial(input.deep_scan_social);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchLatestSuccessTask();
  }, [activeTab]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload =
        activeTab === "video_comments"
          ? {
              scan_type: activeTab,
              video_url: videoUrl,
              limit_comments: limits.video_comments,
            }
          : activeTab === "channels"
            ? {
                scan_type: activeTab,
                keyword,
                limit: limits.channels,
                deep_scan_social: deepScanSocial,
              }
            : {
                scan_type: activeTab,
                keyword,
                limit: limits.videos,
              };

      await axios.post(`${API_BASE_URL}/api/youtube/scan`, payload);
      alert("Tạo request thành công!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    if (!result || result.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("YouTube Data");

    const headers = Object.keys(result[0]);
    worksheet.addRow(headers);

    result.forEach((item: any) => {
      worksheet.addRow(headers.map((h) => item[h]));
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `youtube_${activeTab}_${Date.now()}.xlsx`);
  };

  const downloadJSON = () => {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `youtube_${activeTab}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="yt-page">
      <div className="yt-hero">
        <h1>YouTube Crawler</h1>
        <p>Quét dữ liệu YouTube theo từ khóa và phân tích tương tác</p>

        <div className="yt-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={activeTab === t.key ? "active" : ""}
              onClick={() => navigate(`/tools/youtube/${t.key}`)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="yt-content">
        <div className="yt-form-box">
          <h2>
            {activeTab === "videos" && "Quét top video theo từ khóa"}
            {activeTab === "channels" && "Quét kênh theo từ khóa"}
            {activeTab === "video_comments" && "Quét bình luận video"}
          </h2>

          {activeTab !== "video_comments" && (
            <input
              placeholder="Từ khóa (vd: marketing)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          )}
          {activeTab === "channels" && (
            <div className="yt-checkbox">
              <input
                type="checkbox"
                checked={deepScanSocial}
                onChange={(e) => setDeepScanSocial(e.target.checked)}
              />
              <span>
                Quét social của kênh (Facebook, Instagram, Website...)
              </span>
            </div>
          )}

          {activeTab === "video_comments" && (
            <input
              placeholder="Link video YouTube"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          )}

          <input
            type="number"
            value={limits[activeTab]}
            onChange={(e) =>
              setLimits({
                ...limits,
                [activeTab]: Number(e.target.value),
              })
            }
          />

          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang quét..." : "Quét dữ liệu"}
          </button>
        </div>

        <div className="yt-preview">
          {result && result.length > 0 && (
            <div className="yt-download">
              <button onClick={downloadJSON}>
                <FaFileCode /> JSON
              </button>

              <button onClick={downloadExcel}>
                <FaFileExcel /> Excel
              </button>
            </div>
          )}
          {task?.result ? (
            // <YouTubeResult data={task.result} />
            <YouTubeResult data={task?.result} scanType={task?.scan_type} />
          ) : (
            <div className="yt-card">
              <p>Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
