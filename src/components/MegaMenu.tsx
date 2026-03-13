import { Link } from "react-router-dom";
import "./MegaMenu.css";
import { useState } from "react";

type Props = {
  onClose: () => void;
};

export default function MegaMenu({ onClose }: Props) {
  const [page, setPage] = useState(1);
  return (
    <div
      className="mega-menu"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("a")) {
          onClose();
        }
      }}
    >
      {page === 1 && (
        <>
          <div className="mega-menu-inner">
            {/* GOOGLE */}
            <div className="menu-col">
              <div className="menu-title">Google</div>

              <Link className="menu-item google" to="/tools/google-maps">
                <span className="icon">G</span>
                <span className="label">Google Maps</span>
              </Link>

              {/* <Link className="menu-item google" to="/tools/google-search">
                <span className="icon">G</span>
                <span className="label">Google Search · Quét website</span>
              </Link> */}
            </div>

            {/* INSTAGRAM */}
            <div className="menu-col">
              <div className="menu-title">Instagram </div>

              <Link className="menu-item instagram" to="/tools/instagram">
                <span className="icon">IG</span>
                <span className="label">Quét chi tiết trang</span>
              </Link>
            </div>

            {/* TIKTOK */}
            <div className="menu-col">
              <div className="menu-title">TikTok</div>

              <Link className="menu-item tiktok" to="/tools/tiktok/top_posts">
                <span className="icon">TT</span>
                <span className="label">Quét video TOP theo keyword</span>
              </Link>

              <Link className="menu-item tiktok" to="/tools/tiktok/accounts">
                <span className="icon">TT</span>
                <span className="label">Quét người dùng theo keyword</span>
              </Link>

              <Link className="menu-item tiktok" to="/tools/tiktok/video_comments">
                <span className="icon">TT</span>
                <span className="label">Quét comment video</span>
              </Link>

              <Link className="menu-item tiktok" to="/tools/tiktok/friends">
                <span className="icon">TT</span>
                <span className="label">Quét bạn bè / follower</span>
              </Link>
            </div>

            {/* YOUTUBE */}
            <div className="menu-col">
              <div className="menu-title">YouTube</div>

              <Link className="menu-item youtube" to="/tools/youtube/videos">
                <span className="icon">YT</span>
                <span className="label">Quét video theo keyword</span>
              </Link>

              <Link className="menu-item youtube" to="/tools/youtube/channels">
                <span className="icon">YT</span>
                <span className="label">Quét channel theo keyword</span>
              </Link>

              <Link className="menu-item youtube" to="/tools/youtube/video_comments">
                <span className="icon">YT</span>
                <span className="label">Quét comment video</span>
              </Link>
            </div>

            {/* PINTEREST */}
            <div className="menu-col">
              <div className="menu-title">Pinterest</div>

              <Link className="menu-item pinterest" to="/tools/pinterest">
                <span className="icon">P</span>
                <span className="label">Quét theo keyword</span>
              </Link>

              {/* <Link
                className="menu-item pinterest"
                to="/tools/pinterest/boards"
              >
                <span className="icon">P</span>
                <span className="label">Quét board người dùng</span>
              </Link> */}
            </div>

            {/* TWITTER */}
            <div className="menu-col">
              <div className="menu-title">X (Twitter) (chưa triển khai)</div>

              <Link className="menu-item twitter" to="/tools/x/posts">
                <span className="icon">X</span>
                <span className="label">Quét bài viết theo keyword</span>
              </Link>

              <Link className="menu-item twitter" to="/tools/x/users">
                <span className="icon">X</span>
                <span className="label">Quét người dùng theo keyword</span>
              </Link>

              <Link className="menu-item twitter" to="/tools/x/replies">
                <span className="icon">X</span>
                <span className="label">Quét reply / comment</span>
              </Link>
            </div>
          </div>
          <div className="mega-footer">
            <button onClick={() => setPage(2)}>
              <span>→</span>
            </button>
          </div>
        </>
      )}
      {page === 2 && (
        <>
          <div className="mega-menu-inner">
            <div className="menu-col">
              <div className="menu-title">Facebook (chưa triển khai)</div>

              <Link className="menu-item facebook" to="/tools/facebook/posts">
                <span className="icon">FB</span>
                <span className="label">Quét bài viết theo keyword</span>
              </Link>

              <Link className="menu-item facebook" to="/tools/facebook/groups">
                <span className="icon">FB</span>
                <span className="label">Quét group</span>
              </Link>
            </div>

            <div className="menu-col">
              <div className="menu-title">Threads (chưa triển khai)</div>

              <Link className="menu-item threads" to="/tools/threads/posts">
                <span className="icon">TH</span>
                <span className="label">Quét bài viết Threads</span>
              </Link>
            </div>

            <div className="menu-col">
              <div className="menu-title">LinkedIn (chưa triển khai)</div>

              <Link className="menu-item linkedin" to="/tools/linkedin/users">
                <span className="icon">IN</span>
                <span className="label">Quét người dùng</span>
              </Link>
            </div>
          </div>

          <div className="mega-footer">
            <button onClick={() => setPage(1)}>←</button>
          </div>
        </>
      )}
    </div>
  );
}
