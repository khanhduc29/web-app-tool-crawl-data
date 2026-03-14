import "./VideoCard.css";

type Props = {
  data: TikTokVideo;
};
export type TikTokVideo = {
  video_id: string;
  video_url: string;
  thumbnail: string | null;
  view_count: number | null;
  scan_account: string;
  keyword: string;
};
export default function VideoCard({ data }: Props) {
  const {
    video_url,
    thumbnail,
    view_count,
    keyword,
    scan_account,
  } = data;

  return (
    <div className="video-card">
      {/* ===== Thumbnail ===== */}
      <a href={video_url} target="_blank" rel="noreferrer">
        <div className="video-thumb">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt="thumbnail"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = "none";
                const placeholder = document.createElement("div");
                placeholder.className = "video-thumb-placeholder";
                placeholder.textContent = "No thumbnail";
                img.parentElement?.appendChild(placeholder);
              }}
            />
          ) : (
            <div className="video-thumb-placeholder">
              No thumbnail
            </div>
          )}
        </div>
      </a>

      {/* ===== Info ===== */}
      <div className="video-info">
        <div className="video-tags">
          <span className="tag">#{keyword}</span>
        </div>

        <div className="video-meta">
          <span>👁 {view_count?.toLocaleString() ?? "—"}</span>
          {/* <span className="scan">🤖 {scan_account}</span> */}
        </div>

        <a
          className="video-link"
          href={video_url}
          target="_blank"
          rel="noreferrer"
        >
          Xem trên TikTok →
        </a>
      </div>
    </div>
  );
}