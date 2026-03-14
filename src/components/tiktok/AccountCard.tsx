import { Users, UserPlus } from "lucide-react";
import { TikTokAccount } from "../../types/tiktok";
import "./result.css";

const FALLBACK_AVATAR =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#25f4ee"/><text x="40" y="48" text-anchor="middle" font-size="28" font-family="Arial" fill="#fff">TT</text></svg>'
  );

type Props = {
  data: TikTokAccount;
};

export default function AccountCard({ data }: Props) {
  return (
    <div className="account-card">
      <img
        src={data.avatar_url || FALLBACK_AVATAR}
        alt={data.username}
        className="avatar"
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.errored) {
            img.dataset.errored = "true";
            img.src = FALLBACK_AVATAR;
          }
        }}
      />

      <div className="account-content">
        <strong>@{data.username}</strong>
        <div className="account-display-name">{data.display_name}</div>

        <p className="account-bio">{data.bio}</p>

        <div className="account-stats">
          <span>
            <Users size={14} /> {data.follower_count?.toLocaleString() ?? "0"}
          </span>
          <span>
            <UserPlus size={14} /> {data.following_count?.toLocaleString() ?? "0"}
          </span>
        </div>

        <a
          href={data.profile_url}
          target="_blank"
          rel="noreferrer"
          className="profile-link"
        >
          Xem profile →
        </a>
      </div>
    </div>
  );
}

