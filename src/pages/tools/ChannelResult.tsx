import "./YouTubeResult.css";

interface ChannelItem {
  name: string;
  channel_id: string;
  channel_url: string;
  custom_url?: string;
  avatar: string;
  subscribers: number;
  total_videos: number;
  total_views: number;
  created_at: string;
  description?: string;
  country?: string;
  keywords?: string;
}

interface Props {
  data: ChannelItem[];
}

export default function ChannelResult({ data }: Props) {
  return (
    <div className="yt-result-wrapper">
      {data.map((channel) => (
        <div key={channel.channel_id} className="yt-result-card">
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

            {channel.description && (
              <p className="yt-desc">
                {channel.description.slice(0, 120)}...
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}