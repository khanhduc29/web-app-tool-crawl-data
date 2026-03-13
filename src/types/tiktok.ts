export type TikTokAccount = {
  scan_account: string;
  keyword: string;
  tiktok_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  profile_url: string;
  account_type: string;
  country: string;
  primary_language: string;
  follower_count: number;
  following_count: number;
  external_link: string | null;
  engagement_rate: number | null;
};