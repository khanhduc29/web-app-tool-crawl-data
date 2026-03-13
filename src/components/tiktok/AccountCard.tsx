import { Users, UserPlus } from "lucide-react";
import { TikTokAccount } from "../../types/tiktok";
import "./result.css";
type Props = {
  data: TikTokAccount;
};

export default function AccountCard({ data }: Props) {
  return (
    <div className="account-card">
      <img
        src={data.avatar_url || "/bieu-tuong-tiktok-3.jpg"}
        alt={data.username}
        className="avatar"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "/bieu-tuong-tiktok-3.jpg";
        }}
      />

      <div className="account-content">
        <strong>@{data.username}</strong>
        <div className="account-display-name">{data.display_name}</div>

        <p className="account-bio">{data.bio}</p>

        <div className="account-stats">
          <span>
            <Users size={14} /> {data.follower_count.toLocaleString()}
          </span>
          <span>
            <UserPlus size={14} /> {data.following_count.toLocaleString()}
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
