import { useState, useMemo } from "react";
import "./YouTubeResult.css";
import { FaFacebook, FaGlobe, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface Props {
  data: any[];
  scanType: "videos" | "channels" | "video_comments";
}

const PAGE_SIZE = 3;

export default function YouTubeResult({ data, scanType }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return data.slice(start, end);
  }, [data, currentPage]);

  if (!data || data.length === 0) {
    return <div className="yt-empty">Không có dữ liệu</div>;
  }
  const getSocialIcon = (url: string) => {
    if (url.includes("instagram")) return <FaInstagram />;
    if (url.includes("facebook")) return <FaFacebook />;
    if (url.includes("x.com") || url.includes("twitter")) return <FaXTwitter />;
    return <FaGlobe />;
  };

  return (
    <>
      <div className="yt-result-wrapper">
        {scanType === "videos" &&
          paginatedData.map((video) => (
            <div key={video.video_id} className="yt-result-card">
              <img src={video.thumbnail} alt={video.title} />

              <div className="yt-result-content">
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-title"
                >
                  {video.title}
                </a>

                <p className="yt-channel">{video.channel}</p>

                <div className="yt-stats">
                  <span>👁 {video.views?.toLocaleString()}</span>
                  <span>👍 {video.likes?.toLocaleString()}</span>
                  <span>💬 {video.comments?.toLocaleString()}</span>
                </div>

                <div className="yt-meta">
                  <span className={`type ${video.video_type}`}>
                    {video.video_type?.toUpperCase()}
                  </span>
                  <span>⭐ {video.engagement_rate}%</span>
                  <span>⏱ {video.duration_seconds}s</span>
                </div>
              </div>
            </div>
          ))}

        {scanType === "channels" &&
          paginatedData.map((channel) => (
            <div
              key={channel.channel_id}
              className="yt-result-card channel-card"
            >
              <img
                src={channel.avatar}
                alt={channel.name}
                className="yt-avatar"
              />

              <div className="yt-result-content">
                <a
                  href={channel.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-title"
                >
                  {channel.name}
                </a>

                <div className="yt-stats">
                  <span>👥 {channel.subscribers?.toLocaleString()}</span>
                  <span>🎥 {channel.total_videos}</span>
                  <span>👁 {channel.total_views?.toLocaleString()}</span>
                </div>

                <div className="yt-meta">
                  <span>
                    📅 {new Date(channel.created_at).toLocaleDateString()}
                  </span>
                  {channel.country && <span>🌍 {channel.country}</span>}
                </div>
                {channel.social_links?.length > 0 && (
                  <div className="yt-socials">
                    {channel.social_links.map((link: any, i: number) => {
                      const realUrl =
                        new URL(link.url).searchParams.get("q") || link.url;

                      return (
                        <a
                          key={i}
                          href={realUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="yt-social-icon"
                        >
                          {getSocialIcon(realUrl)}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

        {scanType === "video_comments" &&
          paginatedData.map((comment, index) => (
            <div key={index} className="yt-result-card comment-card">
              <div className="yt-comment-header">
                <span className="yt-author">{comment.author}</span>
                <span>{new Date(comment.published_at).toLocaleString()}</span>
              </div>

              <p style={{ whiteSpace: "pre-line" }}>{comment.content}</p>

              <div className="yt-meta">
                <span>👍 {comment.likes}</span>
                <span>🌍 {comment.language}</span>
                <span>🎯 {comment.intent}</span>
              </div>
            </div>
          ))}
      </div>

      {/* PAGINATION */}
      <div className="yt-pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          ◀
        </button>

        <span>
          Page {currentPage} / {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          ▶
        </button>
      </div>
    </>
  );
}
